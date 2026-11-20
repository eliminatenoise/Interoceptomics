"""Build the atlas data from the eight original Experiment 2 MATLAB members (see README.txt)."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy.io import loadmat

DATES = {"S01": "20240523", "S02": "20240611", "S03": "20240507", "S05": "20240507"}
TASKS = {621: "walking", 611: "standing"}


def encode(values):
    return base64.b64encode(np.asarray(values, dtype="<f4").tobytes()).decode("ascii")


def angle(q, starts, gaps=200):
    dot = np.einsum("ij,ij->i", q[starts], q[starts + gaps])
    return np.degrees(2 * np.arccos(np.clip(np.abs(dot), 0, 1)))


def asset(raw, output, expected=None):
    cohort, clips, files = [], {}, []
    for person, date in DATES.items():
        per_person = {task: [] for task in TASKS.values()}
        for trial in [2, 3]:
            member = f"{person}_{date}_trial_{trial:02d}.mat"
            path = raw / member
            if not path.is_file():
                path = raw / person / f"trial-{trial:02d}.mat"
            with path.open("rb") as stream:
                digest = hashlib.file_digest(stream, "sha256").hexdigest()
            if expected and expected.get(member) != digest:
                raise ValueError(f"Source member checksum mismatch for {member}")
            files.append(dict(member=member, sha256=digest))
            d = loadmat(path, simplify_cells=True)["data_estructure"]
            info = d["experiment_data"]
            task = np.asarray(info["task_vector"])
            clock = np.asarray(info["time_vector"], dtype=float)
            if info["sample_frequency"] != 2000 or not np.allclose(np.diff(clock), .0005, atol=1e-10, rtol=0):
                raise ValueError(f"Unexpected time axis in {member}")
            q = np.asarray(d["quaternions"]["data"], dtype=float).T
            norm = np.linalg.norm(q, axis=1, keepdims=True)
            if not np.all(np.isfinite(norm) & (norm > 0)) or q.shape != (len(task), 4):
                raise ValueError(f"Unusable orientation in {member}")
            q = q / norm
            bounds = np.r_[0, np.flatnonzero(np.diff(task) != 0) + 1, len(task)]
            for start, end in zip(bounds, bounds[1:]):
                mode = TASKS.get(int(task[start]))
                if not mode:
                    continue
                starts = np.arange(start, end - 200, 200)
                per_person[mode].extend(angle(q, starts))
                if person == "S01" and trial == 2 and mode not in clips:
                    # Keep the first complete labelled block of each kind, by time order.
                    assert end-start == 10000
                    indices = np.arange(start, end, 20)
                    region_data = {}
                    for region, key in [("upper", "brachial_matrix"), ("lower", "lumbar_matrix")]:
                        matrix = d[key]
                        raw_voltage = matrix["raw_data"][:, start:end]
                        assert raw_voltage.shape == (32, 10000) and np.isfinite(raw_voltage).all()
                        description = matrix["matrix_description"]
                        assert description["ied_mm"] == 10
                        means = raw_voltage.reshape(32, -1, 20).mean(axis=2, dtype=float)
                        region_data[region] = dict(
                            means=encode(means),
                            layout=description["electrode_configuration"].tolist(),
                            noisy=(np.flatnonzero(matrix["noisy_electrodes"]) + 1).tolist(),
                            null=(np.flatnonzero(matrix["null_electrodes"]) + 1).tolist(),
                        )
                    clips[mode] = dict(t0=float(clock[start]), count=len(indices),
                                       q=encode(q[indices]), channels=region_data)
        row = {"person": person}
        for mode, values in per_person.items():
            row[mode] = dict(n=len(values), median=float(np.median(values)))
        cohort.append(row)
    data = dict(clips=clips, cohort=cohort)
    output.write_text("const RECORDING = " + json.dumps(data, separators=(",", ":"), allow_nan=False) + ";\n")
    return files


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    manifest = Path(__file__).with_name("sources.json")
    reference = {f["member"]: f["sha256"] for f in json.loads(manifest.read_text())["trials"]}
    asset(args.directory, args.output, reference)
