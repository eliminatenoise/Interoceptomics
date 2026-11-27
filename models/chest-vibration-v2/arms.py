"""Every arm's forecast from the feature blocks and the frozen weights (PROTOCOL.json
models_and_controls). Forecasts are in z units of the person's SCG calibration; decode with
mean + SD x forecast to SCG mV."""
import json
from pathlib import Path

import numpy as np

import models
from common import HERE, SEEDS, sha256_file
from features import NO_WEIGHT_ARMS

V1_WEIGHTS = HERE.parent / "chest-vibration" / "weights.json"
V1_WEIGHTS_SHA256 = "55a78c3d9585b279b4d9be6a6c33ee60d08760f039b265badcc25d54e3366d8a"
WEIGHTS_DIR = HERE / "weights"

RIDGE_ARMS = {
    "V1R-base": ["B0"], "V1R-aligned": ["B0", "V1E"], "V1R-delayed": ["B0", "V1Ed"],
    "C4": ["B1"],
    "R-chest": ["B0", "B2"], "R-ECG": ["B0", "B2", "B3"], "R-delayed": ["B0", "B2", "B3d"],
}
MLP_ARMS = {"M-chest": ["B0", "B2"], "M-ECG": ["B0", "B2", "B3"], "M-delayed": ["B0", "B2", "B3d"]}
V1F_ARMS = {"V1F-base": ("base", ["B0"]), "V1F-aligned": ("aligned", ["B0", "V1E"]),
            "V1F-delayed": ("delayed", ["B0", "V1Ed"])}
ALL_ARMS = NO_WEIGHT_ARMS + list(V1F_ARMS) + list(RIDGE_ARMS) + list(MLP_ARMS)


def design(feats, blocks):
    return np.hstack([feats[b] for b in blocks])


def load_v1f():
    if sha256_file(V1_WEIGHTS) != V1_WEIGHTS_SHA256:
        raise ValueError("version 1 weights.json differs from its pin")
    m = json.loads(V1_WEIGHTS.read_text())["models"]
    return {k: {"coefficient": np.asarray(v["coefficient"], dtype=np.float64),
                "intercept": float(v["intercept"])} for k, v in m.items()}


def weight_files(folder=WEIGHTS_DIR):
    files = {arm: Path(folder) / f"{arm}.json" for arm in RIDGE_ARMS}
    for arm in MLP_ARMS:
        for seed in SEEDS:
            files[f"{arm}#{seed}"] = Path(folder) / f"{arm}-{seed}.json"
    return files


def load_weights(folder=WEIGHTS_DIR):
    w = {name: models.load_weight_file(path) for name, path in weight_files(folder).items()}
    w["V1F"] = load_v1f()
    return w


def forecast_all(feats, no_weight, weights):
    """Every arm (and every MLP seed model, named 'arm#seed') in z units, float64."""
    out = {a: np.asarray(no_weight[a], dtype=np.float64) for a in NO_WEIGHT_ARMS}
    for arm, (key, blocks) in V1F_ARMS.items():
        out[arm] = models.ridge_apply(weights["V1F"][key], design(feats, blocks))
    for arm, blocks in RIDGE_ARMS.items():
        out[arm] = models.ridge_apply(weights[arm], design(feats, blocks))
    for arm, blocks in MLP_ARMS.items():
        X = design(feats, blocks)
        seeds = [models.mlp_forward(weights[f"{arm}#{s}"], X) for s in SEEDS]
        for s, o in zip(SEEDS, seeds):
            out[f"{arm}#{s}"] = o.astype(np.float64)
        out[arm] = models.ensemble(seeds)
    return out


def chosen_arms(selection):
    """v2, its chest twin and its delayed twin for the chosen family."""
    fam = "R" if selection["family"] == "ridge" else "M"
    return {"v2": f"{fam}-ECG", "chest_twin": f"{fam}-chest", "delayed_twin": f"{fam}-delayed"}
