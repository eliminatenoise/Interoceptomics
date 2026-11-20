"""Extract four forecast paths for the two recordings already selected for the atlas."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np


DEVELOPMENT_HASH = "a11706a31bb049fcd84c81264cfbdc5497205602ceb67c0f7a69fbbf906f7590"
RECORDINGS_HASH = "afcdbf9e3583297215e374ae0c70730500674cb2310a0e7b7716bed8572654e8"
HORIZONS = np.arange(1, 33) / 256
MODELS = ("separate", "matched", "original")
STUDIES = {"wrist": (1, ["X", "Y", "Z"], 500, 10), "sacrum": (0, ["ML", "SI", "AP"], 256, 1)}


def check_hash(path, expected):
    with path.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != expected:
            raise ValueError(f"File does not match the published input: {path.name}")


def unique_row(key, recording, data):
    domain, axes, rate, factor = STUDIES[key]
    if (recording["axes"], recording["hz"], recording["factorMm"]) != (axes, rate, factor):
        raise ValueError("Unexpected recording coordinate frame or unit")
    xyz = np.asarray(recording["xyz"])
    cutoff = -recording["first"]
    knots = (np.arange(len(xyz)) - cutoff) / rate
    mm = (xyz - xyz[cutoff]) * factor
    reference = np.column_stack([np.interp(HORIZONS, knots, axis) for axis in mm.T])
    matches = np.flatnonzero((data["domain"] == domain) &
                             np.all(np.isclose(data["future_path_mm"], reference,
                                               atol=1e-9, rtol=0), axis=(1, 2)))
    if len(matches) != 1:
        raise ValueError("The fixed recording must match exactly one measured path")
    row = matches.item()
    # Cross-check all input positions on the original clock and all named RMS bins.
    past = np.arange(-19, 1) / 32 - data["age_s"][row]
    past_indices = np.rint(past * rate).astype(int) + cutoff
    np.testing.assert_allclose(knots[past_indices], past, atol=1e-9, rtol=0)
    np.testing.assert_allclose(mm[past_indices], data["patch_xyz_mm"][row], atol=1e-9, rtol=0)
    rms = np.asarray(recording["rms"]["bins"][:20])
    mask = data["muscle_mask"][row]
    np.testing.assert_allclose(data["patch_rms"][row][:, mask], rms, atol=1e-8, rtol=1e-10)
    return row


def extract(development, predictions, recording_file):
    check_hash(development, DEVELOPMENT_HASH)
    check_hash(recording_file, RECORDINGS_HASH)
    if predictions.name != "oof-seed-1641.npz":
        raise ValueError("Use the prespecified example fit, seed 1641")
    receipt = json.loads(predictions.with_suffix(".json").read_text(encoding="utf-8"))
    if receipt["seed"] != 1641 or receipt["rows"] != 6943:
        raise ValueError("Expected the fixed development seed and full development cohort")
    check_hash(predictions, receipt["sha256"])
    text = recording_file.read_text(encoding="utf-8").strip()
    recordings = json.loads(text.removeprefix("const recordings = ").removesuffix(";"))
    with np.load(development, allow_pickle=False) as archive:
        data = {key: archive[key] for key in ("domain", "future_path_mm", "patch_xyz_mm", "age_s",
                                               "muscle_mask", "patch_rms", "person")}
    indices = {key: unique_row(key, recordings[key], data) for key in STUDIES}
    output = {key: {} for key in indices}
    with np.load(predictions, allow_pickle=False) as archive:
        n = len(data["domain"])
        np.testing.assert_array_equal(archive["row"], np.arange(n))
        folds = archive["fold"]
        if folds.shape != (n,):
            raise ValueError("Invalid forecast fold array")
        for domain in (0, 1):
            rows = data["domain"] == domain
            _, ranks = np.unique(data["person"][rows], return_inverse=True)
            np.testing.assert_array_equal(folds[rows], ranks % 3)
        for model in MODELS:
            path = archive[model + "_path"]
            if path.shape != (n, 32, 3):
                raise ValueError("Forecasts must contain 32 source-frame 3D positions per event")
            for key, row in indices.items():
                forecast = path[row].astype(float)
                if not np.isfinite(forecast).all():
                    raise ValueError("Missing forecast coordinates")
                output[key][model] = forecast.tolist()
    for key, row in indices.items():
        age = data["age_s"][row]
        history = data["patch_xyz_mm"][row]
        interval = 1 / 32 + age[-2] - age[-1]
        if age[-1] != 0 or interval <= 0:
            raise ValueError("Expected a known cutoff position and two ordered observations")
        velocity = (history[-1] - history[-2]) / interval
        output[key]["velocity"] = (HORIZONS[:, None] * velocity).tolist()
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("development", type=Path)
    parser.add_argument("predictions", type=Path)
    parser.add_argument("recordings", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = extract(args.development, args.predictions, args.recordings)
    encoded = json.dumps(data, separators=(",", ":"), allow_nan=False)
    args.output.write_text("const forecastPaths = " + encoded + ";\n", encoding="utf-8")


if __name__ == "__main__":
    main()
