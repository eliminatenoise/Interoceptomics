"""Check the displayed measurements against an extracted copy of the original dataset.

Usage: python check-source.py /path/containing/Output/and/ExcludedTrials.txt
Only the 18 chosen optical files, their target orders and the exclusions are read.
"""
import argparse
import csv
import hashlib
import json
import math
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent


def exclusions(filename):
    rejected = set()
    side = None
    for line in filename.read_text().splitlines():
        if line.startswith('### ') and 'HAND,' in line:
            side = line.split()[1][0] if line.endswith('OPTICAL') else None
        if side and line.startswith('('):
            person, target, repetition = map(int, re.match(r'\((\d+),\s*(\d+),\s*(\d+)\)', line).groups())
            rejected.add((person, side, target, repetition))
    return rejected


def check(raw, trial):
    source = raw / trial['source_member']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == trial['source_sha256'], source.name
    with source.open(newline='') as stream:
        reader = csv.reader(stream)
        assert next(reader) == ['Frame','X','Y','Z','X.1','Y.1','Z.1']
        points = {}
        chosen = None
        for frame, *fields in reader:
            groups = [[float(v) if v else math.nan for v in fields[i:i+3]] for i in (0,3)]
            valid = [all(map(math.isfinite,p)) for p in groups]
            if chosen is None:
                if not any(valid): continue
                chosen = [j for j in range(2) if valid[j]]
                assert [j+1 for j in chosen] == trial['markers']
            number = int(frame)
            points[number] = [sum(groups[j][i] for j in chosen) / len(chosen) for i in range(3)] if all(valid[j] for j in chosen) else None
    start = min(points);origin = points[start]; run = 0;crossing = None
    assert trial['first_frame'] == start and len(trial['frames']) == max(points)-start+1
    for offset,(seconds,*shown) in enumerate(trial['frames']):
        assert abs(seconds-offset/250)<1e-8
        point = points.get(start+offset)
        if point is None:
            assert shown == [None]*3;run = 0;continue
        expected = [v-a for v,a in zip(point,origin)]
        assert all(abs(a-b) <= .000500001 for a,b in zip(expected,shown)), (trial['file'],offset)
        run = run+1 if math.hypot(*expected)>=15 else 0
        if run>=3 and crossing is None: crossing=seconds
    assert crossing == trial['crossing_s']


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('extracted_source',type=Path);args=parser.parse_args()
    raw=args.extracted_source
    data=json.loads((HERE/'records.js').read_text().removeprefix('window.REACH_RECORDS = ').removesuffix(';\n'))
    trials=data['trials']; rejected=exclusions(raw/'ExcludedTrials.txt')
    assert {(t['hand'],t['target']) for t in trials} == {(h,n) for h in 'LR' for n in range(1,10)} and len(trials)==18
    for t in trials:
        h=t['hand'];n=t['target'];tfile=raw/f'Output/measurement/1/{h}/1_{h}_targets.txt'
        labels=list(map(int,tfile.read_text().splitlines()));assert labels.index(n)==t['source_trial']
        assert (1,h,n,0) not in rejected
        check(raw,t)
    print(f"Verified {len(trials)} source hashes, first assignments and exclusions, {sum(len(t['frames']) for t in trials)} samples, missingness, coordinates, and 15 mm anchors.")
