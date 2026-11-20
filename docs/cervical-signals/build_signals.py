"""Rebuild the four training-participant means from a local copy of OpenNeuro ds004388 v1.0.0."""
import argparse
import csv
import hashlib
import io
import json
from decimal import Decimal
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
WINDOWS = {'baseline': (-150, -100), 'early': (50, 80), 'late': (120, 140)}
CHANNELS = ['Biceps', 'SC6', 'Thumb', 'CP4', 'ECG']

def sha(data):
    return hashlib.sha256(data).hexdigest()

def means(arrays, record):
    result = {}
    for name, (start, stop) in WINDOWS.items():
        a = arrays[name]
        if a.shape != (80, stop-start, len(CHANNELS)) or not np.isfinite(a).all():
            raise ValueError('Unexpected recording shape or non-finite voltage')
        if sha(a.astype('<f4', copy=False).tobytes()) != record['selected_sha256'][name]:
            raise ValueError('Selected native voltage samples differ from this edition')
        result[name] = a.mean(axis=0, dtype='float64').T.tolist()
    return {'participant': record['participant'], 'run': record['run'], 'events': 80, 'means': result}

def read_run(root, record):
    stem = root / record['stem']
    def sidecar(suffix):
        data = Path(str(stem) + suffix).read_bytes()
        if sha(data) != record['sidecars'][suffix]:
            raise ValueError('Unexpected source file ' + suffix)
        return data.decode('utf-8-sig')
    channels = list(csv.DictReader(io.StringIO(sidecar('channels.tsv')), delimiter='\t'))
    names = [r['name'] for r in channels]
    indices = [names.index(c) for c in CHANNELS]
    if any(channels[i]['units'] != 'microV' for i in indices) or json.loads(sidecar('eeg.json'))['SamplingFrequency'] != 10000:
        raise ValueError('Unit or sample rate mismatch')
    rows = csv.DictReader(io.StringIO(sidecar('events.tsv')), delimiter='\t')
    samples = []
    for row in rows:
        if row['trial_type'] != 'stimulus' or row['value'] != 'Median - Stimulation':
            continue
        index = Decimal(row['sample'])
        if index != int(index) or index != Decimal(row['onset']) * 10000:
            raise ValueError('Inconsistent event sample and onset')
        samples.append(int(index))
        if len(samples) == 80:
            break
    if len(samples) != 80 or len(set(samples)) != 80:
        raise ValueError('Expected 80 distinct recorded events')
    arrays = {}
    path = Path(str(stem)+'eeg.fdt')
    if path.stat().st_size != record['continuous_bytes']:
        raise ValueError('Continuous file length mismatch')
    with path.open('rb') as f:
        for name,(a,b) in WINDOWS.items():
            epochs = []
            for s in samples:
                f.seek((s+a)*len(names)*4)
                raw = f.read((b-a)*len(names)*4)
                epochs.append(np.frombuffer(raw, dtype='<f4').reshape(b-a,len(names))[:,indices])
            arrays[name] = np.stack(epochs)
    return arrays

def write_packet(results, dest):
    packet = {'hz': 10000, 'unit': 'µV', 'channels': CHANNELS, 'windows': WINDOWS, 'participants': results}
    dest.write_text('const VOLTAGES = '+json.dumps(packet, separators=(',',':'), allow_nan=False)+';\n', encoding='utf8')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('bids', type=Path, help='Local BIDS dataset root with the four stated median runs')
    parser.add_argument('--output', type=Path, default=HERE/'waveforms.js')
    args = parser.parse_args()
    records = json.loads((HERE/'sources.json').read_text())['runs']
    write_packet([means(read_run(args.bids, r), r) for r in records], args.output)
