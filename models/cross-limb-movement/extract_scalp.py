"""Export three central scalp sites and held-person forecasts for the two fixed atlas excerpts."""
import argparse
import json
from pathlib import Path

import numpy as np

from extract_forecasts import DEVELOPMENT_HASH, RECORDINGS_HASH, check_hash, unique_row


SCALP_HASH = "71420a52c1e3870a30e35176dde80ba5a082c681ed6e13289ada5e2029aceced"
PREDICTION_HASH = "916121f9e1633d6cc26774c2081cc4ce7835a22ecd86eaeab5a7a0c5a9d692c3"
LABELS = ("C3", "Cz", "C4")
SOURCES = {"wrist": ("way", LABELS), "sacrum": ("balance", ("D19", "A1", "B22"))}
GROUPS = ("person", "domain", "session", "event", "direction", "block", "cutoff", "cutoff_s")
REASONS = {1: "absent", 2: "rejected by the original authors", 4: "nonfinite history", 8: "flat history"}
METHODS = ("central", "reference", "wrong")


def measurements(scalp, key, joint_row):
    source, names = SOURCES[key]
    local, = np.flatnonzero(scalp[source + "_rows"] == joint_row)
    channels = scalp[source + "_names"].tolist()
    means, rms = (scalp[source + "_" + k][local] for k in ("mean", "rms"))
    good, reasons = (scalp[source + "_" + k][local] for k in ("good", "reason"))
    sites = []
    for nominal, native in zip(LABELS, names):
        column = channels.index(native)
        bits = int(reasons[column])
        if bool(good[column]) != (bits == 0) or bits & ~15:
            raise ValueError("Unrecognised source channel mask")
        site = {"nominal": nominal, "native": native, "missing": [v for b, v in REASONS.items() if bits & b]}
        for field, array in (("mean", means), ("rms", rms)):
            values = array[:, column].astype(float)
            if values.shape != (20,) or (not bits and not np.isfinite(values).all()):
                raise ValueError("Invalid scalp window sequence")
            site[field] = None if bits else values.tolist()
        sites.append(site)
    return {"sites": sites, "hz": 500 if key == "wrist" else 256,
            "unit": "source units" if key == "wrist" else "µV",
            "counts": scalp[source + "_bin_samples"].tolist(),
            "firstTick": scalp[source + "_bin_first_offset"].tolist(),
            "lastTick": scalp[source + "_bin_last_offset"].tolist()}


def extract(joint_path, scalp_path, recording_file, prediction_file):
    check_hash(joint_path, DEVELOPMENT_HASH)
    check_hash(scalp_path, SCALP_HASH)
    check_hash(recording_file, RECORDINGS_HASH)
    prefix = "const recordings = "
    text = recording_file.read_text().strip()
    if not text.startswith(prefix) or not text.endswith(";"):
        raise ValueError("Unexpected fixed recording format")
    recordings = json.loads(text[len(prefix):-1])
    receipt = json.loads(prediction_file.with_suffix(".json").read_bytes())
    if prediction_file.name != "oof-seed-1641.npz" or receipt["seed"] != 1641:
        raise ValueError("Expected the prespecified held-person example seed")
    if receipt["sha256"] != PREDICTION_HASH or receipt["rows"] != 6943:
        raise ValueError("Expected the verified scalp study development predictions")
    check_hash(prediction_file, PREDICTION_HASH)
    result = {}
    with np.load(joint_path) as joint, np.load(scalp_path) as scalp, np.load(prediction_file) as pred:
        for field in GROUPS:
            np.testing.assert_array_equal(joint[field], scalp[field])
        count = len(joint["domain"])
        np.testing.assert_array_equal(pred["row"], np.arange(count))
        for domain in (0, 1):
            within = joint["domain"] == domain
            _, ranks = np.unique(joint["person"][within], return_inverse=True)
            np.testing.assert_array_equal(pred["fold"][within], ranks % 3)
        for key in SOURCES:
            row = unique_row(key, recordings[key], joint)
            if pred["fold"][row] != 0:
                raise ValueError("The selected recording belongs to a different fold")
            record = measurements(scalp, key, row)
            outputs = {}
            for model in METHODS:
                branch = "wrong_trial" if model == "wrong" else model
                supported = bool(pred[branch + "_support"][row])
                if model != "wrong" and not supported:
                    raise ValueError("The fixed central/reference pair must be complete")
                if not supported:
                    if not np.isnan(pred[branch + "_path"][row]).all() or not np.isnan(pred[branch + "_rms"][row]).all():
                        raise ValueError("An unsupported forecast contains estimates")
                    outputs[model] = None
                    continue
                path = pred[branch + "_path"][row]
                muscle = pred[branch + "_rms"][row][joint["muscle_mask"][row]]
                if path.shape != (32, 3) or len(muscle) != len(recordings[key]["muscles"]):
                    raise ValueError("Unexpected held-row output shape")
                if not np.isfinite(path).all() or not np.isfinite(muscle).all() or np.any(muscle < 0):
                    raise ValueError("Invalid forecast value")
                outputs[model] = {"path": path.tolist(), "muscleRMS": muscle.tolist()}
            result[key] = {**record, "forecasts": outputs}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("joint", "scalp", "recordings", "predictions", "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    result = extract(args.joint, args.scalp, args.recordings, args.predictions)
    args.output.write_text("const scalpExcerpts = " + json.dumps(result, separators=(",", ":"), allow_nan=False) + ";\n")


if __name__ == "__main__":
    main()
