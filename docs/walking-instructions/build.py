"""Rebuild the paired reader data and its two animated GLBs from the v8 source ZIP."""
import argparse
import base64
import hashlib
import json
import tempfile
from pathlib import Path
from zipfile import ZipFile

import ezc3d
import numpy as np

from glb import write_model

HERE = Path(__file__).resolve().parent
META = json.loads((HERE / 'sources.json').read_text())
MARKERS = META['markers']
PELVIS = 'L_IAS R_IAS L_IPS R_IPS'


def groups():
    """Endpoints are arithmetic means of the named markers; widths are illustrative."""
    pairs = [
        ('Chest', 'CV7 SJN L_SAA R_SAA', 'TV10 SXS', 0.112),
        ('Waist', 'TV10 SXS', PELVIS, 0.090),
        ('Pelvis', 'L_IAS L_IPS L_FTC', 'R_IAS R_IPS R_FTC', 0.078),
        ('Shoulders', 'L_SAA L_SAE', 'R_SAA R_SAE', 0.051),
    ]
    limb = [('Upper arm', 'SAA SAE', 'HLE HME', .039),
            ('Forearm', 'HLE HME', 'UHE RSP', .030),
            ('Hand', 'UHE RSP', 'HM2 HM5', .024),
            ('Thigh', 'FTC', 'FLE FME', .067),
            ('Shin', 'FLE FME', 'FAL TAM', .043),
            ('Foot', 'FCC', 'FM1 FM2 FM5', .031)]
    for side in ['L', 'R']:
        def sided(names):
            return ' '.join(f'{side}_{n}' for n in names.split())
        for name, start, end, width in limb:
            pairs.append((f'{side} {name}', sided(start), sided(end), width))
    return [dict(name=name, start=[MARKERS.index(k) for k in start.split()],
                 end=[MARKERS.index(k) for k in end.split()], radius=radius)
            for name, start, end, radius in pairs]


def torso_faces():
    """An illustrative trunk surface whose vertices sit on measured markers."""
    faces = [('L_IAS', 'SXS', 'R_IAS'), ('L_IPS', 'TV10', 'R_IPS'),
             ('L_IAS', 'R_IAS', 'R_IPS'), ('L_IAS', 'R_IPS', 'L_IPS')]
    for side in ('L', 'R'):
        shoulder, blade, hip, back = [f'{side}_{k}' for k in ('SAA','SIA','IAS','IPS')]
        faces += [('SJN', shoulder, 'SXS'), ('SXS', shoulder, hip),
                  ('CV7', shoulder, blade), ('CV7', blade, 'TV10'),
                  ('TV10', blade, back), (shoulder, blade, hip), (blade, hip, back),
                  ('CV7', shoulder, 'SJN')]
    return [[MARKERS.index(v) for v in face] for face in faces]


def contact_frames(p, side):
    times = p['TIMES']['value'].T
    labels = p['LABELS']['value']
    contexts = p['CONTEXTS']['value']
    events = [(name, round((60 * minute + second) * 100)) for (minute, second), name, foot
              in zip(times, labels, contexts, strict=True) if foot == side]
    strike, = [t for n, t in events if n == 'Foot Strike1']
    end, = [t for n, t in events if n == 'Foot Strike2']
    off, = [t for n, t in events if n == 'Foot Off' and strike < t < end]
    return strike, off, end


def force_snapshot(c3d, side, frames, xyz, assignment):
    strike, off, _ = frames
    check = strike + 10
    result = dict(frame=check + 1, plate=assignment or None, meanN=None)
    if not assignment:
        return result | {'reason': 'No reliable plate assignment'}
    platform = c3d['data']['platform'][assignment - 1]
    low = platform['corners'][:2].min(axis=1)
    high = platform['corners'][:2].max(axis=1)
    foot_markers = [MARKERS.index(f'{side[0]}_{k}') for k in ['FCC', 'FM2']]
    foot = xyz[np.ix_([strike, check], foot_markers, [0, 1])]
    if not ((foot >= low) & (foot <= high)).all():
        return result | {'reason': 'Heel outside the assigned plate'}
    if not strike <= check - 7 / 15 < check + 7 / 15 < off:
        raise ValueError('Force window outside stance')
    block = platform['force'][2, 15 * check:15 * (check + 1)]
    return result | {'meanN': float(block.mean()), 'reason': None}


def encoded(values):
    return base64.b64encode(np.ascontiguousarray(values, dtype='<f4').tobytes()).decode()


def build_trial(path, code):
    spec = META['recordings'][code]
    raw = ezc3d.c3d(str(path), extract_forceplat_data=True)
    p, d = raw['parameters'], raw['data']
    labels = p['POINT']['LABELS']['value']
    labels_a = p['ANALOG']['LABELS']['value']
    ix = [labels.index(m) for m in MARKERS]
    ia = [labels_a.index(m) for m in META['muscles']]
    xyz = d['points'][:3, ix, :].transpose(2, 1, 0)
    n = len(xyz)
    assert raw['header']['points']['first_frame'] == 0
    assert p['POINT']['UNITS']['value'] == ['mm'] and p['POINT']['RATE']['value'][0] == 100
    assert p['ANALOG']['RATE']['value'][0] == 1500
    assert all(p['ANALOG']['UNITS']['value'][i] == 'V' for i in ia)
    assert np.isfinite(xyz).all() and (d['meta_points']['residuals'][0, ix] >= 0).all()
    analog = d['analogs'][0, ia].reshape(len(ia), n, 15)
    emg = (np.sqrt(np.mean(analog ** 2, axis=2)) * 1e6).T
    assert np.isfinite(emg).all()
    feet = {side: contact_frames(p['EVENT'], side) for side in ['Right', 'Left']}
    first, _, last = feet['Right']
    pelvis = xyz[:, [MARKERS.index(k) for k in PELVIS.split()]].mean(axis=1)
    delta = pelvis[last, :2] - pelvis[first, :2]
    distance = np.linalg.norm(delta)
    f, s = delta / distance
    origin = np.array([*pelvis[first, :2], 0])
    axes = np.array([[f, s, 0], [-s, f, 0], [0, 0, 1]])
    travel = (xyz - origin) @ axes.T / 1000
    assert (travel[:, MARKERS.index('L_IAS'), 1] > travel[:, MARKERS.index('R_IAS'), 1]).all()
    events = {}
    for j, (side, indices) in enumerate(feet.items()):
        events[side] = dict(zip(['strike', 'off', 'next'], [v + 1 for v in indices], strict=True))
        events[side]['force'] = force_snapshot(raw, side, indices, xyz, int(spec['assignment'][j]))
    write_model(HERE / f'{code}.glb', code, travel, MARKERS, groups(), torso_faces(), spec['sha256'], events)
    return dict(code=code, title=spec['instruction'], frames=n, origin=origin.tolist(),
                axes=axes.tolist(), xyzMm=encoded(xyz), rmsUv=encoded(emg), events=events,
                strideM=float(distance/1000), strideS=(last-first)/100,
                speed=float(distance / (last-first) / 10))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    args = parser.parse_args()
    walks = []
    with ZipFile(args.archive) as archive, tempfile.TemporaryDirectory() as work:
        for code, entry in META['recordings'].items():
            blob = archive.read(entry['member'])
            if hashlib.sha256(blob).hexdigest() != entry['sha256']:
                raise ValueError(f'{code} member checksum mismatch')
            path = Path(work) / (code + '.c3d')
            path.write_bytes(blob)
            walks.append(build_trial(path, code))
    result = dict(markers=MARKERS, muscles=META['muscles'], segments=groups(), torsoFaces=torso_faces(), walks=walks)
    (HERE / 'recordings.js').write_text('const RECORDINGS = ' + json.dumps(result, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    main()
