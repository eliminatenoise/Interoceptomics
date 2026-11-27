"""Model choice inside the ten fitting people only (PROTOCOL.json model_selection, steps 1-7).

  python develop.py grid  --source FITDIR --cache CACHEDIR [--workers 8]
  python develop.py ridge --cache CACHEDIR --out DEVDIR
  python develop.py mlp   --cache CACHEDIR --out DEVDIR --private PRIVDIR --arm M-ECG --seed 20261127
  python develop.py table --cache CACHEDIR --out DEVDIR --private PRIVDIR

FITDIR holds the pinned p004-p013 .dat/.hea; CACHEDIR is private scratch; DEVDIR receives the LOPO
tables (published); PRIVDIR, outside the repository, receives the MLP held-out predictions.
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np

import arms
import features as fe
import metrics
import models
import signal_path as sp
from common import (C4_PENALTY_GRID, DEFAULT_C4_PENALTY, DEFAULT_K, DEFAULT_PENALTY, DEFAULT_THETA,
                    FAMILY_FACTOR, FIT_POOL, H, K_GRID, PENALTY_GRID, PRIMARY, SEEDS, THETA_GRID,
                    TIE_FACTOR, V1_PENALTY, pins, sha256_file, write_json)

T_PRIMARY = np.arange(*PRIMARY)


def load_fit(source, rec):
    p = pins()
    dat, hea = Path(source) / f"{rec}.dat", Path(source) / f"{rec}.hea"
    if sha256_file(dat) != p[f"{rec}.dat"] or sha256_file(hea) != p[f"{rec}.hea"]:
        raise ValueError(f"{rec}: file differs from its pin")
    counts, gains, zeros, _ = sp.load_record(dat, hea)
    return sp.from_counts(counts, gains, zeros)


def grid_person(job):
    source, cache, rec = job
    t0 = time.time()
    z, cal, trace = load_fit(source, rec)
    T = T_PRIMARY
    st = fe.record_state(z)
    out = {"z": z, "cal_mean": cal["mean"], "cal_sd": cal["sd"], "mask": fe.row_mask(z, T),
           "y": z[T + H, 2], "y_mV": trace[T + H, 2],
           "C1": z[T, 2], "C2": fe.linear_trend(z[:, 2], T)}
    from detectors import c3_forecast
    out["C3"] = c3_forecast(st["tsb"], z[:, 2], T)
    out["C3d"] = c3_forecast(st["tsb_d"], z[:, 2], T)
    for K in K_GRID:
        out[f"B2_K{K}"] = fe.block_b2(st, T, K)
        b3, o3 = fe.blocks_b3(st, T, K, THETA_GRID)
        b3d, _ = fe.blocks_b3(st, T, K, THETA_GRID, delayed=True)
        for th in THETA_GRID:
            out[f"B3_K{K}_t{th}"] = b3[th]
            out[f"B3d_K{K}_t{th}"] = b3d[th]
    np.savez(Path(cache) / f"{rec}.npz", **out)
    return rec, time.time() - t0, int(out["mask"].sum())


def cmd_grid(a):
    import multiprocessing as mp
    Path(a.cache).mkdir(parents=True, exist_ok=True)
    jobs = [(a.source, a.cache, r) for r in FIT_POOL]
    with mp.Pool(a.workers) as pool:
        for rec, sec, valid in pool.imap_unordered(grid_person, jobs):
            print(f"{rec}: {valid} valid rows, {sec:.1f} s", flush=True)


class People:
    """Cached per-person arrays and feature designs at a (K, theta) setting."""

    def __init__(self, cache):
        self.d = {r: dict(np.load(Path(cache) / f"{r}.npz")) for r in FIT_POOL}

    def block(self, rec, name, K, theta):
        p = self.d[rec]
        z = p["z"]
        if name == "B0":
            return fe.block_b0(z, T_PRIMARY)
        if name == "B1":
            return fe.block_b1(z, T_PRIMARY)
        if name == "V1E":
            return fe.block_v1_ecg(z, T_PRIMARY)
        if name == "V1Ed":
            return fe.block_v1_ecg(z, T_PRIMARY, 1253)
        if name == "B2":
            return p[f"B2_K{K}"]
        return p[f"{name}_K{K}_t{theta}"]

    def X(self, rec, blocks, K, theta):
        m = self.d[rec]["mask"]
        return np.hstack([self.block(rec, b, K, theta) for b in blocks])[m]

    def y(self, rec):
        return self.d[rec]["y"][self.d[rec]["mask"]]

    def to_mV(self, rec, zpred):
        p = self.d[rec]
        return p["cal_mean"][2] + p["cal_sd"][2] * zpred

    def y_mV(self, rec):
        return self.d[rec]["y_mV"][self.d[rec]["mask"]]

    def scores(self, rec, zpred):
        f = self.to_mV(rec, zpred)
        r = metrics.rmse(f, self.y_mV(rec))
        return {"rmse_mV": r, "rmse_cal_sd": r / float(self.d[rec]["cal_sd"][2]),
                "mae_mV": metrics.mae(f, self.y_mV(rec))}


def lopo_ridge(people, blocks, K, theta, penalties, keep=False):
    Xs = {r: people.X(r, blocks, K, theta) for r in FIT_POOL}
    mom = {r: models.person_moments(Xs[r], people.y(r)) for r in FIT_POOL}
    res, preds = {}, {}
    for pen in penalties:
        res[pen], preds[pen] = {}, {}
        for held in FIT_POOL:
            model = models.ridge_from_moments([mom[r] for r in FIT_POOL if r != held], pen)
            zp = models.ridge_apply(model, Xs[held])
            res[pen][held] = people.scores(held, zp)
            if keep:
                preds[pen][held] = zp
    return (res, preds) if keep else res


def mean_rmse(per):
    return float(np.mean([per[r]["rmse_mV"] for r in FIT_POOL]))


def cmd_ridge(a):
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    people = People(a.cache)
    for r in FIT_POOL:
        if not people.d[r]["mask"].all():
            print(f"note: {r} has {int(people.d[r]['mask'].sum())} valid rows")
    t0 = time.time()
    grid = {}
    for K in K_GRID:
        for th in THETA_GRID:
            res = lopo_ridge(people, arms.RIDGE_ARMS["R-ECG"], K, th, PENALTY_GRID)
            for pen in PENALTY_GRID:
                grid[f"K={K} theta={th} penalty={pen}"] = {"K": K, "theta": th, "penalty": pen,
                                                           "mean_rmse_mV": mean_rmse(res[pen]),
                                                           "per_person": res[pen]}
            print(f"K={K} theta={th}: " + ", ".join(f"{pen}: {mean_rmse(res[pen]):.4f}" for pen in PENALTY_GRID),
                  f"({time.time() - t0:.0f} s)", flush=True)
    lowest_key = min(grid, key=lambda k: grid[k]["mean_rmse_mV"])
    default_key = f"K={DEFAULT_K} theta={DEFAULT_THETA} penalty={DEFAULT_PENALTY}"
    lowest = grid[lowest_key]["mean_rmse_mV"]
    use_default = grid[default_key]["mean_rmse_mV"] <= TIE_FACTOR * lowest
    chosen = grid[default_key if use_default else lowest_key]
    c4 = lopo_ridge(people, arms.RIDGE_ARMS["C4"], DEFAULT_K, DEFAULT_THETA, C4_PENALTY_GRID)
    c4_means = {pen: mean_rmse(c4[pen]) for pen in C4_PENALTY_GRID}
    c4_low = min(c4_means, key=c4_means.get)
    c4_pen = DEFAULT_C4_PENALTY if c4_means[DEFAULT_C4_PENALTY] <= TIE_FACTOR * c4_means[c4_low] else c4_low
    sel = {"step": "ridge part of model_selection steps 2 and 6",
           "r_ecg_grid_lowest": lowest_key, "r_ecg_grid_lowest_mean_rmse_mV": lowest,
           "r_ecg_default": default_key, "r_ecg_default_mean_rmse_mV": grid[default_key]["mean_rmse_mV"],
           "default_within_1_percent": bool(use_default),
           "K": chosen["K"], "theta": chosen["theta"], "penalty": chosen["penalty"],
           "r_ecg_chosen_mean_rmse_mV": chosen["mean_rmse_mV"],
           "c4_mean_rmse_mV": {str(p): v for p, v in c4_means.items()}, "c4_lowest": c4_low,
           "c4_penalty": c4_pen}
    write_json(out / "lopo-r-ecg-grid.json", {"label": "Leave one person out inside p004-p013; optimistic (see PROTOCOL.json model_selection.optimism_label). RMSE of SCG in mV over each held person's valid primary rows.",
                                               "configurations": grid})
    write_json(out / "lopo-c4.json", {"label": "C4 one-cycle ridge, leave one person out inside p004-p013.",
                                       "penalties": {str(p): {"mean_rmse_mV": c4_means[p], "per_person": c4[p]}
                                                     for p in C4_PENALTY_GRID}})
    write_json(out / "selection-ridge.json", sel)
    print(json.dumps(sel, indent=1))
    print(f"ridge step: {time.time() - t0:.1f} s")


def cmd_mlp(a):
    import torch
    torch.set_num_threads(4)
    torch.set_num_interop_threads(1)
    out = Path(a.private)
    out.mkdir(parents=True, exist_ok=True)
    sel = json.loads((Path(a.out) / "selection-ridge.json").read_text())
    K, th = sel["K"], sel["theta"]
    people = People(a.cache)
    blocks = arms.MLP_ARMS[a.arm]
    Xs = {r: people.X(r, blocks, K, th) for r in FIT_POOL}
    preds, log = {}, {}
    for held in FIT_POOL:
        t0 = time.time()
        fit = [r for r in FIT_POOL if r != held]
        model, _ = models.train_mlp([Xs[r] for r in fit], [people.y(r) for r in fit], a.seed)
        preds[held] = models.mlp_forward(model, Xs[held])
        log[held] = {"seconds": time.time() - t0, "updates": model["updates"]}
        print(f"{a.arm} seed {a.seed} held {held}: {log[held]['seconds']:.0f} s, "
              f"{model['updates']} updates", flush=True)
    np.savez(out / f"lopo-{a.arm}-{a.seed}.npz", **preds)
    write_json(out / f"lopo-{a.arm}-{a.seed}.log.json", {"K": K, "theta": th, "folds": log,
                                                          "torch_threads": torch.get_num_threads()})


def cmd_table(a):
    out = Path(a.out)
    sel = json.loads((out / "selection-ridge.json").read_text())
    K, th, pen, c4_pen = sel["K"], sel["theta"], sel["penalty"], sel["c4_penalty"]
    people = People(a.cache)
    table = {arm: {} for arm in arms.ALL_ARMS}
    for arm, blocks in arms.RIDGE_ARMS.items():
        p = V1_PENALTY if arm.startswith("V1R") else c4_pen if arm == "C4" else pen
        res = lopo_ridge(people, blocks, K, th, [p])[p]
        table[arm] = {"penalty": p, "per_person": res, "mean_rmse_mV": mean_rmse(res)}
    for arm, blocks in arms.MLP_ARMS.items():
        seeds = [np.load(Path(a.private) / f"lopo-{arm}-{s}.npz") for s in SEEDS]
        res = {}
        for r in FIT_POOL:
            res[r] = people.scores(r, models.ensemble([sd[r] for sd in seeds]))
        single = {}
        for s, sd in zip(SEEDS, seeds):
            per = {r: people.scores(r, sd[r].astype(np.float64)) for r in FIT_POOL}
            single[str(s)] = {"per_person_rmse_mV": {r: per[r]["rmse_mV"] for r in FIT_POOL},
                              "mean_rmse_mV": mean_rmse(per)}
        table[arm] = {"seeds": list(SEEDS), "per_person": res, "mean_rmse_mV": mean_rmse(res),
                      "single_seed_models": single}
    v1f = arms.load_v1f()
    for arm, (key, blocks) in arms.V1F_ARMS.items():
        res = {r: people.scores(r, models.ridge_apply(v1f[key], people.X(r, blocks, K, th))) for r in FIT_POOL}
        table[arm] = {"note": "Published version 1 weights; in-sample for p004-p008.", "per_person": res,
                      "mean_rmse_mV": mean_rmse(res)}
    for arm in fe.NO_WEIGHT_ARMS:
        res = {}
        for r in FIT_POOL:
            p, m = people.d[r], people.d[r]["mask"]
            f = {"B2": p[f"B2_K{K}"], "B3": p[f"B3_K{K}_t{th}"], "B3d": p[f"B3d_K{K}_t{th}"]}
            zf = {"C0": np.zeros(len(m)), "C1": p["C1"], "C2": p["C2"], "C3": p["C3"], "C3d": p["C3d"],
                  "C5": f["B2"][:, 0], "T-ECG": f["B3"][:, 0], "T-delayed": f["B3d"][:, 0],
                  "T-R": f["B3"][:, 1]}[arm]
            res[r] = people.scores(r, zf[m])
        table[arm] = {"per_person": res, "mean_rmse_mV": mean_rmse(res)}
    r_ecg, m_ecg = table["R-ECG"]["mean_rmse_mV"], table["M-ECG"]["mean_rmse_mV"]
    family = "mlp" if m_ecg < FAMILY_FACTOR * r_ecg else "ridge"
    selection = {"K": K, "theta": th, "ridge_penalty": pen, "c4_penalty": c4_pen, "family": family,
                 "r_ecg_mean_rmse_mV": r_ecg, "m_ecg_mean_rmse_mV": m_ecg,
                 "rule": "MLP if M-ECG mean < 0.99 x R-ECG mean at the chosen (K, theta); otherwise ridge.",
                 "ridge_step": sel}
    selection.update(arms.chosen_arms(selection))
    for arm in table:
        for r in FIT_POOL:
            table[arm]["per_person"][r]["relative_reduction_vs_C0_percent"] = metrics.relative_reduction(
                table[arm]["per_person"][r]["rmse_mV"], table["C0"]["per_person"][r]["rmse_mV"])
        table[arm]["mean_rmse_cal_sd"] = float(np.mean([table[arm]["per_person"][r]["rmse_cal_sd"] for r in FIT_POOL]))
        table[arm]["wins_vs_C0"] = int(sum(table[arm]["per_person"][r]["relative_reduction_vs_C0_percent"] > 0
                                           for r in FIT_POOL))
    write_json(out / "development-table.json", {
        "label": ("Development table, optimistic: leave one person out inside p004-p013 for every learned arm, "
                  "per person for every no-weight arm, V1F in-sample for p004-p008. The detector constants were "
                  "set by inspecting p004, p007 and p008, and the 90-120 s behaviour of all ten was known. Never "
                  "a new-person result."),
        "rows": "valid primary rows, 90 <= t < 290 s (50,000 per person when complete)",
        "units": "RMSE and MAE of SCG in sensor mV; rmse_cal_sd = RMSE / the person's SCG calibration SD",
        "selection": selection, "arms": table})
    write_json(out / "selection.json", selection)
    print(json.dumps(selection, indent=1))
    for arm in arms.ALL_ARMS:
        print(f"{arm:12s} {table[arm]['mean_rmse_mV']:.4f} mV  {table[arm]['mean_rmse_cal_sd']:.4f} cal SD "
              f" wins vs C0 {table[arm]['wins_vs_C0']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["grid", "ridge", "mlp", "table"])
    ap.add_argument("--source")
    ap.add_argument("--cache", required=True)
    ap.add_argument("--out")
    ap.add_argument("--private")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--arm")
    ap.add_argument("--seed", type=int)
    a = ap.parse_args()
    {"grid": cmd_grid, "ridge": cmd_ridge, "mlp": cmd_mlp, "table": cmd_table}[a.command](a)


if __name__ == "__main__":
    main()
