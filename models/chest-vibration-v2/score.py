"""The one scoring run (PROTOCOL.json scoring step 6): a separate process reads the targets and the
locked forecasts and computes every metric once.

  python score.py --lock SCORE-LOCK.json --forecasts FORECASTDIR --qc-report QC.json \
                  --records-map MAP.json --out results.json [--freeze FREEZE.json]

Every hash in SCORE-LOCK.json is checked before any target is read. With --code-check-on-fit-pool the
fitting people stand in for the primary group; that output is a code check on in-sample final models
and never a result.
"""
import argparse
import json
from pathlib import Path

import numpy as np

import arms
import metrics
import signal_path as sp
from common import (H, HERE, PROTOCOL_COMMIT, PROTOCOL_FILES, SECONDARY, load_allocation, pins, sha256_file,
                    write_json)
from lock import CODE

BIN_STEPS = 10           # 40 ms
N_BINS = 30              # 0 to 1.2 s; a last bin holds later positions and rows with no beat
POSITION_ARMS = ("v2", "T-ECG", "C3", "C0")


def verify_lock(lock, forecasts, qc_report, freeze):
    problems = []
    for name, sha in lock["forecast_files"].items():
        if sha256_file(Path(forecasts) / name) != sha:
            problems.append(f"forecast file {name}")
    if sha256_file(qc_report) != lock["qc_report_sha256"]:
        problems.append("QC report")
    if sha256_file(freeze) != lock["freeze_sha256"]:
        problems.append("FREEZE.json")
    for name, sha in lock["scoring_code_sha256"].items():
        if sha256_file(HERE / name) != sha:
            problems.append(f"code {name}")
    if set(lock["scoring_code_sha256"]) != set(CODE):
        problems.append("code list")
    weights = {p.name: sha256_file(p) for p in sorted((HERE / "weights").glob("*.json"))}
    if weights != lock["weights_sha256"]:
        problems.append("weights")
    if problems:
        raise SystemExit("SCORE-LOCK mismatch: " + ", ".join(problems))


def targets(rec, paths, T):
    p = pins()
    if sha256_file(paths["dat"]) != p[f"{rec}.dat"] or sha256_file(paths["hea"]) != p[f"{rec}.hea"]:
        raise ValueError(f"{rec}: source differs from its pin")
    counts, gains, zeros, _ = sp.load_record(paths["dat"], paths["hea"])
    trace = sp.filtered_grid(counts, gains, zeros)
    cal = sp.calibrate(trace)
    return trace[T + H, 2], cal


def arm_scores(f, y, c0_rmse=None, cal_sd=1.0):
    r = metrics.rmse(f, y)
    out = {"rmse_mV": r, "rmse_cal_sd": r / cal_sd, "mae_mV": metrics.mae(f, y)}
    if c0_rmse is not None:
        out["skill_vs_C0"] = 1.0 - r / c0_rmse
    return out


def score_rows(fc, y, rows, cal_sd, arm_list):
    c0 = metrics.rmse(fc["C0"][rows], y[rows])
    return {a: arm_scores(fc[a][rows], y[rows], c0, cal_sd) for a in arm_list}


def by_position(fc, y, rows, pos, names):
    b = np.where((pos >= 0) & (pos < BIN_STEPS * N_BINS), pos // BIN_STEPS, N_BINS)
    out = {}
    for label, arm in names.items():
        cells = []
        for i in range(N_BINS + 1):
            sel = rows & (b == i)
            name = f"{40 * i}-{40 * (i + 1)} ms" if i < N_BINS else "1.2 s or later, or no beat"
            cells.append({"bin": name, "rows": int(sel.sum()),
                          "rmse_mV": metrics.rmse(fc[arm][sel], y[sel]) if sel.any() else None})
        out[label] = {"arm": arm, "bins": cells}
    return out


def comparisons_spec(chosen):
    v2, ct, dt = chosen["v2"], chosen["chest_twin"], chosen["delayed_twin"]
    verdict = {"v2_vs_V1R-base": (v2, "V1R-base"), "v2_vs_C0": (v2, "C0"), "v2_vs_chest_twin": (v2, ct),
               "v2_vs_delayed_twin": (v2, dt), "v2_vs_C3": (v2, "C3")}
    descriptive = {"v2_vs_T-ECG": (v2, "T-ECG"), "T-ECG_vs_T-R": ("T-ECG", "T-R"), "T-R_vs_C3": ("T-R", "C3"),
                   "M-ECG_vs_R-ECG": ("M-ECG", "R-ECG"), "V1R-aligned_vs_V1R-base": ("V1R-aligned", "V1R-base"),
                   "V1R-aligned_vs_V1R-delayed": ("V1R-aligned", "V1R-delayed"),
                   "T-ECG_vs_T-delayed": ("T-ECG", "T-delayed"), "C3_vs_C3d": ("C3", "C3d")}
    for a in arms.ALL_ARMS:
        if a != "C0":
            descriptive[f"{a}_vs_C0"] = (a, "C0")
    return verdict, descriptive


def group_block(people, per, spec, bootstrap):
    n = len(people)
    out = {"people": people, "n": n}
    if n == 0:
        return out
    index = metrics.bootstrap_index(n) if bootstrap else None
    out["arms"] = {}
    for a in arms.ALL_ARMS:
        vals = [per[r][a]["rmse_mV"] for r in people]
        out["arms"][a] = {"rmse_mV": metrics.summary(vals),
                          "rmse_cal_sd": metrics.summary([per[r][a]["rmse_cal_sd"] for r in people]),
                          "mae_mV": metrics.summary([per[r][a]["mae_mV"] for r in people])}
        if bootstrap:
            out["arms"][a]["mean_rmse_mV_ci95"] = metrics.percentile_interval(index, vals)
    out["comparisons"] = {}
    for name, (model, comp) in spec.items():
        out["comparisons"][name] = {"model": model, "comparator": comp, **metrics.compare(
            [per[r][model]["rmse_mV"] for r in people], [per[r][comp]["rmse_mV"] for r in people], people, index)}
    return out


def verdicts(block):
    n = block["n"]
    k = metrics.k_of_n(n)
    if n < 5:
        return {"n": n, "k": k, "P1": "no verdict", "P2": "no verdict", "P3": "no verdict"}
    c = block["comparisons"]
    v1 = metrics.beats(c["v2_vs_V1R-base"], n) and c["v2_vs_V1R-base"]["reduction_percent"]["mean"] >= 10.0
    c0 = c["v2_vs_C0"]["reduction_percent"]["mean"] > 0 and c["v2_vs_C0"]["wins"] >= k
    p1 = bool(v1 and c0)
    p2 = bool(metrics.beats(c["v2_vs_chest_twin"], n) and metrics.beats(c["v2_vs_delayed_twin"], n))
    p3 = bool(metrics.beats(c["v2_vs_C3"], n))
    word = {True: "supported", False: "not supported"}
    return {"n": n, "k": k, "P1": word[p1], "P2": word[p2], "P3": word[p3],
            "parts": {"P1_beats_V1R_base_by_10_percent": bool(v1), "P1_C0_condition": bool(c0),
                      "P2_beats_chest_twin": metrics.beats(c["v2_vs_chest_twin"], n),
                      "P2_beats_delayed_twin": metrics.beats(c["v2_vs_delayed_twin"], n),
                      "P3_beats_C3": p3}}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lock", required=True)
    ap.add_argument("--forecasts", required=True)
    ap.add_argument("--qc-report", required=True)
    ap.add_argument("--records-map", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--freeze", default=str(HERE / "FREEZE.json"))
    ap.add_argument("--code-check-on-fit-pool", action="store_true")
    a = ap.parse_args()
    lock = json.loads(Path(a.lock).read_text())
    verify_lock(lock, a.forecasts, a.qc_report, a.freeze)
    qc = json.loads(Path(a.qc_report).read_text())
    rmap = json.loads(Path(a.records_map).read_text())["records"]
    groups = {g: [m["record"] for m in ms] for g, ms in load_allocation()["groups"].items()}
    if a.code_check_on_fit_pool:
        groups = {"primary_test": groups["fit_pool"], "secondary_new_people": [], "basal_check": []}
    sel = None
    per, per_interval, records = {}, {}, {}
    for rec in rmap:
        fpath = Path(a.forecasts) / f"{rec}.npz"
        if not fpath.exists():
            records[rec] = {"forecast": None, "qc_pass": bool(qc["records"][rec]["pass"])}
            continue
        side = json.loads((Path(a.forecasts) / f"{rec}.json").read_text())
        sel = sel or side["selection"]
        if side["selection"] != sel:
            raise ValueError("forecast files disagree on the frozen selection")
        f = np.load(fpath)
        T, mask = f["cutoffs"], f["mask"].astype(bool)
        fc = {k[3:]: f[k] for k in f.files if k.startswith("mV_")}
        chosen = arms.chosen_arms(sel)
        fc["v2"] = fc[chosen["v2"]]
        y, cal = targets(rec, rmap[rec], T)
        if not np.array_equal(cal["sd"], f["cal_sd"]) or not np.array_equal(cal["mean"], f["cal_mean"]):
            raise ValueError(f"{rec}: calibration differs from the forecast file")
        cal_sd = float(cal["sd"][2])
        interval = mask & (T >= SECONDARY[0]) & (T < SECONDARY[1])
        if not mask.any():
            records[rec] = {"forecast": side["record"], "qc_pass": bool(qc["records"][rec]["pass"]),
                            "valid_rows": 0, "note": "no valid row; not scored"}
            continue
        per[rec] = score_rows(fc, y, mask, cal_sd, arms.ALL_ARMS)
        if interval.any():
            per_interval[rec] = score_rows(fc, y, interval, cal_sd, arms.ALL_ARMS)
        valid = mask
        records[rec] = {
            "qc_pass": bool(qc["records"][rec]["pass"]), "valid_rows": int(mask.sum()),
            "interval_90_120_s_rows": int(interval.sum()), "cal_sd_mV": cal_sd,
            "arms": per[rec], "interval_90_120_s": per_interval.get(rec),
            "error_by_position_after_last_R": by_position(
                fc, y, valid, f["diag_pos_after_last_R"], {lab: (chosen["v2"] if lab == "v2" else lab)
                                                           for lab in POSITION_ARMS}),
            "detectors": {**side["detectors"],
                          "share_accepted_P_wave": float(f["diag_has_p"][valid].mean()),
                          "share_template_defined": float(f["diag_template_defined"][valid].mean())}}
    chosen = arms.chosen_arms(sel)
    verdict_spec, descriptive_spec = comparisons_spec(chosen)
    spec = {**verdict_spec, **descriptive_spec}
    scored = set(per)
    passing = [r for r in groups["primary_test"] if r in scored and records[r]["qc_pass"]]
    excluded = [r for r in groups["primary_test"] if r in scored and not records[r]["qc_pass"]]
    secondary = [r for r in groups["secondary_new_people"] if r in scored and records[r]["qc_pass"]]
    secondary_excl = [r for r in groups["secondary_new_people"] if r in scored and not records[r]["qc_pass"]]
    basal = [r for r in groups["basal_check"] if r in scored]
    primary = group_block(passing, per, spec, bootstrap=True)
    primary["verdicts"] = verdicts(primary)
    out = {
        "label": ("CODE CHECK on the fitting people with in-sample final models: not a result"
                  if a.code_check_on_fit_pool else "Chest-vibration v2, the one scoring run"),
        "protocol_commit": PROTOCOL_COMMIT,
        "protocol_files_sha256": {n: sha256_file(HERE / n) for n in PROTOCOL_FILES},
        "freeze_sha256": lock["freeze_sha256"], "score_lock_sha256": sha256_file(a.lock),
        "qc_report_sha256": lock["qc_report_sha256"], "selection": sel, "chosen": chosen,
        "units": "RMSE and MAE of SCG in sensor mV; rmse_cal_sd = RMSE / SCG calibration SD; skill_vs_C0 = 1 - RMSE / RMSE of C0",
        "records": records,
        "groups": {
            "primary": primary,
            "primary_excluded_descriptive": group_block(excluded, per, spec, bootstrap=False),
            "secondary": group_block(secondary, per, spec, bootstrap=False),
            "secondary_excluded_descriptive": group_block(secondary_excl, per, spec, bootstrap=False),
            "pooled_primary_and_secondary": group_block(passing + secondary, per, spec, bootstrap=True),
            "basal_b001": group_block(basal, per, spec, bootstrap=False),
            "primary_interval_90_120_s": group_block([r for r in passing if r in per_interval], per_interval, spec,
                                                     bootstrap=True),
        },
    }
    write_json(a.out, out)
    print(json.dumps(primary["verdicts"], indent=1))


if __name__ == "__main__":
    main()
