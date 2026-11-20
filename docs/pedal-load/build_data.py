"""Reproduce measurements.js from the eight original AnkleImage MAT files.

python build_data.py ORIGINALS measurements.js
Place the original files under ORIGINALS/<member>, as listed in sources.json.
Requires Python 3, NumPy and SciPy. No download or source-file modification.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy.io import loadmat

HERE = Path(__file__).resolve().parent
KEYS = {"time_s": "time", "emg": "emg", "load": "load"}


def encode(records, get_arrays):
    clocks, seen, packed = [], {}, []
    for rec in records:
        arrays = get_arrays(rec)
        obj = {key: rec[key] for key in ["person", "setting", "trial", "url"]}
        obj["clock"] = rec["time_origin"]
        for key, dest in KEYS.items():
            arr = np.ascontiguousarray(arrays[key], dtype="<f8").reshape(-1)
            digest = hashlib.sha256(arr.tobytes()).hexdigest()
            if arr.size != rec["rows"] or not np.isfinite(arr).all() or digest != rec["array_f64le_sha256"][key]:
                raise ValueError(f"{rec['member']}: {key} differs from source fingerprint")
            if key == "time_s":
                if digest not in seen:
                    seen[digest] = len(clocks)
                    clocks.append(base64.b64encode(arr.tobytes()).decode())
                obj["time"] = seen[digest]
            else:
                obj[dest] = base64.b64encode(arr.tobytes()).decode()
        packed.append(obj)
    return "const PEDAL_CLOCKS = "+json.dumps(clocks,separators=(",",":"))+";\nconst PEDAL_RECORDS = "+json.dumps(packed,separators=(",",":"))+";\n"


def original(rec, root):
    path = root / rec["member"]
    if hashlib.sha256(path.read_bytes()).hexdigest() != rec["sha256"]:
        raise ValueError(f"Original checksum mismatch: {rec['member']}")
    fields = rec["source_fields"]
    mat = loadmat(path, variable_names=[name for name in fields.values() if name])
    out = {key: mat[value] for key, value in fields.items() if value}
    if not fields["time_s"]:
        out["time_s"] = np.arange(rec["rows"], dtype=np.float64) / 1000
    return out


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("originals", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    records = json.loads((HERE/"sources.json").read_text())["records"]
    args.output.write_text(encode(records, lambda rec: original(rec, args.originals)))
