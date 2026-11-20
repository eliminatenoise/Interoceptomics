"""Verify both published measures against the two original Dryad MAT members.

Install numpy and scipy and run python check-recordings.py PATH_TO_REACHING_EXPERIMENTS.
Only the public original files are read. No network or model training is required.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.io import loadmat

def check(record, folder):
    day = record['date'].replace('-', '')
    member = folder / f'C_{day}_COactpas_TD.mat'
    with member.open('rb') as f:
        digest = hashlib.file_digest(f, 'sha256').hexdigest()
    if digest != record['source_mat_sha256']:
        raise ValueError(f'Unexpected source hash for {member.name}')
    td = loadmat(member, variable_names=['trial_data'], struct_as_record=False, squeeze_me=True)['trial_data']
    (original,) = np.flatnonzero(td.trialID == record['trial'])
    start, end = int(td.idx_startTime[original]), int(td.idx_endTime[original])
    assert (start, end, float(td.bin_size)) == (record['start'], record['end'], record['dt_s'])
    assert [str(name) for name in td.marker_names] == [f'{n}_{axis}' for n in record['marker_names'] for axis in 'xyz']
    rows = slice(start - 1, end)
    np.testing.assert_equal(td.markers[rows].reshape(-1, 10, 3), np.asarray(record['marker_xyz_m'], dtype=float))
    np.testing.assert_equal(td.pos[rows], np.asarray(record['handle_xy_cm'], dtype=float))
    guide = [tuple(pair) for pair in td.S1_unit_guide.tolist()]
    assert len(set(guide)) == len(guide)
    columns = [guide.index((ch, 0)) for ch in record['contact_id']]
    counts = td.S1_spikes[rows, :][:, columns]
    np.testing.assert_equal(counts, record['counts_10ms'])
    for name, field in [('bump', 'idx_bumpTime'), ('target', 'idx_tgtOnTime'), ('go', 'idx_goCueTime')]:
        times = getattr(td, field)
        np.testing.assert_equal(times[(start <= times) & (times <= end)], [record['events'][name]])
    for window in record['anchors']:
        frame = window['k'] - start
        assert window['k'] == record['events']['bump'] + window['offset']
        np.testing.assert_equal(counts[frame:frame + 10].sum(axis=0), window['recorded'])
    return {'date': record['date'], 'trial': record['trial'], 'measured_rows': len(counts),
            'contacts': len(columns), 'forecast_targets_checked': len(columns) * len(record['anchors'])}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('data', type=Path, help='Directory containing the two original MAT files')
    args = parser.parse_args()
    text = Path(__file__).with_name('records.js').read_text()
    prefix = 'window.CONTACT_TRIALS = '
    assert text.startswith(prefix) and text.endswith(';\n')
    for entry in json.loads(text[len(prefix):-2]):
        print(json.dumps(check(entry, args.data)))
