"""Forecast filtered chest vibration from an endpoint-stamped history in sensor mV."""
import argparse
import json
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
CHANNELS = ["ECG_II", "RESP", "SCG"]
FEATURE_HISTORY = 51
REQUIRED_HISTORY = FEATURE_HISTORY + 1
HORIZON_STEPS = 20


def features(z, cutoffs, ecg_delay=0):
    """Newest-to-oldest standardized histories. z columns are II, RESP, SCG."""
    cutoffs = np.asarray(cutoffs, dtype=np.int64)
    offsets = cutoffs[:, None] - np.arange(FEATURE_HISTORY)
    electrical = offsets - ecg_delay
    if electrical.min() < 1 or offsets.max() >= len(z) or ecg_delay < 0:
        raise ValueError("History falls outside the supplied series")
    base = np.concatenate((z[offsets, 2], z[offsets, 1]), axis=1)
    levels = z[electrical, 0]
    changes = np.abs(levels - z[electrical - 1, 0])
    return base, np.concatenate((base, levels, changes), axis=1)


def apply(model, matrix):
    """Apply a fitted affine map in standardized participant coordinates."""
    return np.asarray(matrix) @ np.asarray(model["coefficient"]) + model["intercept"]


def forecast(weights, example):
    """Predict at most recent grid endpoint +80 ms, with per-channel calibration."""
    if example.get("channels") != CHANNELS or example.get("rate_hz") != 250:
        raise ValueError("Expected 250-Hz filtered mV rows ordered ECG_II, RESP, SCG")
    history = np.asarray(example["filtered_mV"], dtype=np.float64)
    mean = np.asarray(example["calibration_mean_mV"], dtype=np.float64)
    sd = np.asarray(example["calibration_sd_mV"], dtype=np.float64)
    if history.shape != (REQUIRED_HISTORY, 3) or mean.shape != (3,) or sd.shape != (3,):
        raise ValueError("Supply 52 chronological rows and three channel means and SDs")
    if not all(np.isfinite(a).all() for a in (history, mean, sd)) or np.any(sd <= 0):
        raise ValueError("Inputs must be finite and calibration SDs strictly positive")
    base, aligned = features((history - mean) / sd, [REQUIRED_HISTORY - 1])
    return {
        "aligned_mV": float(apply(weights["aligned"], aligned)[0] * sd[2] + mean[2]),
        "base_mV": float(apply(weights["base"], base)[0] * sd[2] + mean[2]),
        "persistence_mV": float(history[-1, 2]),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, nargs="?", default=HERE / "invented-examples.json")
    parser.add_argument("--weights", type=Path, default=HERE / "weights.json")
    args = parser.parse_args()
    weights = json.loads(args.weights.read_text())["models"]
    payload = json.loads(args.input.read_text())
    for example in payload["examples"]:
        print(json.dumps({"id": example["id"], **forecast(weights, example)}))


if __name__ == "__main__":
    main()
