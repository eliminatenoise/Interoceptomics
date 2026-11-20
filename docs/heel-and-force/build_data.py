"""Extract the three fixed time windows from one public development recording."""
import argparse
import hashlib
import json
from pathlib import Path

import ezc3d
import numpy as np

SOURCE_NAME = '2014001_C2_01.c3d'
SOURCE_HASH = '064e566ac09b0b5ab28695f5d214c89987e01b6169c465d6d9d9d482d8fe6148'
CUTOFFS = [29, 39, 49]


def extract(source):
    if source.name != SOURCE_NAME or hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_HASH:
        raise ValueError('Expected the original 2014001_C2_01.c3d from dataset v8')
    raw = ezc3d.c3d(str(source), extract_forceplat_data=True)
    params, data = raw['parameters'], raw['data']
    labels = params['POINT']['LABELS']['value']
    assert params['POINT']['UNITS']['value'] == ['mm']
    assert params['POINT']['RATE']['value'].item() == 100 and params['ANALOG']['RATE']['value'].item() == 1500
    assert len(labels) == 52 and len(data['platform']) == 2
    first, last = CUTOFFS[0] - 23, CUTOFFS[-1] + 10
    xyz = data['points'][:3, :, first:last + 1].transpose(2, 1, 0)
    residual = data['meta_points']['residuals'][0, :, first:last + 1].T
    positions = [[point.tolist() if ok >= 0 and np.isfinite(point).all() else None
                  for point, ok in zip(frame, validity, strict=True)] for frame, validity in zip(xyz, residual, strict=True)]
    plate = data['platform'][0]
    channel = params['ANALOG']['LABELS']['value'].index('Fz1')
    assert params['FORCE_PLATFORM']['CHANNEL']['value'][2, 0] == channel + 1
    force = plate['force'][2, first * 15:(last + 1) * 15].reshape(-1, 15)
    local = data['analogs'][0, channel, first * 15:(last + 1) * 15].reshape(-1, 15)
    assert np.isfinite(force).all() and np.array_equal(force, -local)
    corners = [p['corners'].T.tolist() for p in data['platform']]
    events = [{'side': side, 'event': event, 'seconds': float(60 * minute + second)}
              for side, event, (minute, second) in zip(params['EVENT']['CONTEXTS']['value'],
                  params['EVENT']['LABELS']['value'], params['EVENT']['TIMES']['value'].T, strict=True)]
    return {'source': SOURCE_NAME, 'sourceSHA256': SOURCE_HASH, 'pointHz': 100, 'forceHz': 1500,
            'firstIndex': first, 'lastIndex': last, 'cutoffs': CUTOFFS, 'historyFrames': 24, 'horizonFrames': 10,
            'markerLabels': labels, 'labXYZmm': positions, 'plateCornersMm': corners, 'upwardPlate1N': force.tolist(),
            'events': events, 'assignment': {'supplementaryTable2': '12', 'rightPlate': 1, 'leftPlate': 2}}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('recording', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    encoded = json.dumps(extract(args.recording), separators=(',', ':'), allow_nan=False)
    args.output.write_text(f'const recording = {encoded};\n', encoding='utf-8')
