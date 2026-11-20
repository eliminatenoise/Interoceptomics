"""Rebuild measurements.js from the identified AnkleImage MAT files, using Python, NumPy and SciPy.

python build_data.py DIRECTORY_WITH_MAT_FILES OUTPUT_JS
"""
import base64
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from scipy.io import loadmat

def sha(data):
    return hashlib.sha256(data).hexdigest()

def encode(values, digest, n):
    array = np.asarray(values, dtype="<f8").reshape(-1)
    raw = array.tobytes()
    if array.size != n or not np.all(np.isfinite(array)) or sha(raw) != digest:
        raise ValueError("Source values differ from the identified tracking series.")
    return base64.b64encode(raw).decode("ascii")

def build(directory, destination):
    manifest = json.loads(Path(__file__).with_name("sources.json").read_text())
    out = []
    for r in manifest["records"]:
        path = directory / Path(r["member"]).name
        if not path.is_file():
            path = directory / r["member"]
        if sha(path.read_bytes()) != r["sha256"]:
            raise ValueError(f"Original member differs: {path.name}")
        names = [r["row_table"], r["length_field"], r["angle_field"]]
        data = loadmat(path, variable_names=names, squeeze_me=True, struct_as_record=False)
        table = data[names[0]].data
        length, angle = data[names[1]], data[names[2]]
        if not np.array_equal(length.reshape(-1),table[:,1]) or not np.all(np.diff(table[:,0]) > 0):
            raise ValueError("Native length or tracking order differs.")
        steps = np.rint(np.diff(table[:,0]) / r["tracker_label_increment"])
        gaps = (np.flatnonzero(steps != 1) + 2).tolist()
        if gaps != r["breaks"]:
            raise ValueError("Native table gaps differ.")
        out.append(dict(person=r["person"], trial=r["trial"], n=r["n"], breaks=gaps,
                        length=encode(length,r["length_sha256"],r["n"]),
                        angle=encode(angle,r["angle_sha256"],r["n"])))
    destination.write_text("const MEASUREMENTS = " + json.dumps(out, separators=(",",":")) + ";\n")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    build(Path(sys.argv[1]), Path(sys.argv[2]))
