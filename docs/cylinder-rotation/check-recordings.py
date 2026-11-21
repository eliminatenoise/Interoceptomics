"""Verify the displayed samples and measured future means against an extracted study."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('output',type=Path,help='The extracted study directory named Output')
args=parser.parse_args()
gallery=json.loads((HERE/'recordings.js').read_text().removeprefix('window.CYLINDER = ').removesuffix(';\n'))
count=0
for clip in gallery['clips']:
    path=args.output/Path(clip['member']).relative_to('Output')
    if hashlib.sha256(path.read_bytes()).hexdigest()!=clip['member_sha256']:
        raise ValueError(f'Original source differs for {path.name}')
    with path.open(newline='') as f:
        reader=csv.reader(f,delimiter=';')
        labels=next(reader)
        assert labels[13:17]==['quaternion_w','quaternion_x','quaternion_y','quaternion_z']
        data=[[float(row[i]) for i in [0,1,2,3,7,8,9,13,14,15,16]] for row in reader]
    start=data[0][0]
    for r in data:r[0]-=start
    if data!=clip['rows']:raise ValueError(f'Displayed values differ for {path.name}')
    for w in clip['windows']:
        i=w['cutoff_ms']//10
        for j in range(3):
            expected=math.fsum(r[4+j] for r in data[i:i+10])/10
            assert math.isclose(expected,w['measured'][j],rel_tol=1e-12,abs_tol=1e-12)
    count+=len(data)
print(f'All {count} displayed samples and measured future means match the originals.')
