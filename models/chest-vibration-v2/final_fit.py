"""Final fits of every learned arm on all ten fitting people (PROTOCOL.json model_selection step 8)
and the NumPy export check of every MLP model.

  python final_fit.py ridge --cache CACHEDIR --selection development/selection.json --out weights
  python final_fit.py mlp   --cache CACHEDIR --selection development/selection.json --out weights \
                            --arm M-ECG --seed 20261127 --report PRIVDIR
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np

import arms
import models
from common import FIT_POOL, V1_PENALTY, write_json
from develop import People
from features import column_names

MAX_EXPORT_DIFF = 1e-4


def penalty_for(arm, sel):
    if arm.startswith("V1R"):
        return V1_PENALTY
    if arm == "C4":
        return sel["c4_penalty"]
    return sel["ridge_penalty"]


def meta(arm, blocks, sel, people):
    return {"arm": arm, "blocks": blocks, "columns": column_names(blocks),
            "K": sel["K"], "theta": sel["theta"], "fitted_on": FIT_POOL,
            "rows_per_person": {r: int(people.d[r]["mask"].sum()) for r in FIT_POOL},
            "target": "z_SCG(t + 20): filtered SCG at t + 80 ms in z units of the person's 60-80 s calibration"}


def cmd_ridge(a, sel, people):
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for arm, blocks in arms.RIDGE_ARMS.items():
        pen = penalty_for(arm, sel)
        mom = [models.person_moments(people.X(r, blocks, sel["K"], sel["theta"]), people.y(r)) for r in FIT_POOL]
        model = models.ridge_from_moments(mom, pen)
        write_json(out / f"{arm}.json", models.ridge_to_json(model, **meta(arm, blocks, sel, people), penalty=pen,
                                                              kind="ridge, version 1's closed form"))
        print(f"{arm}: penalty {pen}, {len(model['coefficient'])} coefficients", flush=True)


def cmd_mlp(a, sel, people):
    import torch
    torch.set_num_threads(4)
    torch.set_num_interop_threads(1)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    blocks = arms.MLP_ARMS[a.arm]
    Xs = [people.X(r, blocks, sel["K"], sel["theta"]) for r in FIT_POOL]
    ys = [people.y(r) for r in FIT_POOL]
    t0 = time.time()
    model, torch_out = models.train_mlp(Xs, ys, a.seed)
    seconds = time.time() - t0
    path = out / f"{a.arm}-{a.seed}.json"
    write_json(path, models.mlp_to_json(model, **meta(a.arm, blocks, sel, people),
                                        kind="MLP d-64-64-1, GELU (tanh form), float32"))
    reloaded = models.load_weight_file(path)
    np_out = models.mlp_forward(reloaded, np.vstack(Xs))
    diff = float(np.max(np.abs(np_out.astype(np.float64) - torch_out.astype(np.float64))))
    rep = {"arm": a.arm, "seed": a.seed, "updates": model["updates"], "training_rows": model["rows"],
           "max_abs_torch_minus_numpy_z": diff, "limit": MAX_EXPORT_DIFF, "within_limit": diff <= MAX_EXPORT_DIFF,
           "seconds": seconds, "torch_threads": torch.get_num_threads(),
           "torch_interop_threads": torch.get_num_interop_threads()}
    Path(a.report).mkdir(parents=True, exist_ok=True)
    write_json(Path(a.report) / f"export-{a.arm}-{a.seed}.json", rep)
    print(json.dumps(rep), flush=True)
    if diff > MAX_EXPORT_DIFF:
        raise SystemExit("torch-to-NumPy difference above 1e-4 z units: the freeze stops")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["ridge", "mlp"])
    ap.add_argument("--cache", required=True)
    ap.add_argument("--selection", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--arm")
    ap.add_argument("--seed", type=int)
    ap.add_argument("--report")
    a = ap.parse_args()
    sel = json.loads(Path(a.selection).read_text())
    people = People(a.cache)
    {"ridge": cmd_ridge, "mlp": cmd_mlp}[a.command](a, sel, people)


if __name__ == "__main__":
    main()
