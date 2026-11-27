"""Causality test (PROTOCOL.json causality_test). For each tested cutoff t the whole pipeline is run from
native counts on two perturbed copies of the record: (a) every native sample after sample 20t, in all
four channels, replaced by an integer drawn uniformly from -32767..32767; (b) the record truncated after
sample 20t. Every feature value and every arm's forecast (each MLP seed model included) at t must equal
the values of the unperturbed full-record run exactly. It reads no target and computes no error.

  python causality.py --records-map MAP.json --out REPORT.json [--workers 8]
  python causality.py --records-map MAP.json --out REPORT.json --chest-end-margin 8 --kinds truncate

--chest-end-margin 8 reproduces the loop bound written in PROTOCOL.json for the chest detector; it is
used only to document the recorded deviation, never for a fit or a forecast.
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np

import arms
import features as fe
import forecast
import signal_path as sp
from common import CAUSALITY_SEED, cutoff_range, subject_number, write_json

N_CUTOFFS = 200
MAX_EXAMPLES = 25


def items(res, i):
    out = {f"feature:{b}": res["feats"][b][i] for b in res["feats"]}
    out.update({f"forecast_z:{a}": np.asarray([v[i]]) for a, v in res["forecast_z"].items()})
    mv = forecast.to_mV({a: v[i:i + 1] for a, v in res["forecast_z"].items()}, res["cal"])
    out.update({f"forecast_mV:{a}": v for a, v in mv.items()})
    out["calibration:mean"] = res["cal"]["mean"]
    out["calibration:sd"] = res["cal"]["sd"]
    return out


def run_record(job):
    rec, paths, weights_dir, selection, kinds, end_margin = job
    fe.CHEST_END_MARGIN = end_margin
    t0 = time.time()
    sel = json.loads(Path(selection).read_text())
    weights = arms.load_weights(weights_dir)
    shas = forecast.check_pins(rec, paths["dat"], paths["hea"])
    counts, gains, zeros, _ = sp.load_record(paths["dat"], paths["hea"])
    s = subject_number(rec)
    T_all = np.arange(*cutoff_range(rec))
    try:
        ref = forecast.pipeline(counts, gains, zeros, T_all, sel, weights)
    except ValueError as err:
        return rec, {"record": rec, "subject_number": s, "source_sha256": shas, "not_run": str(err),
                     "cutoffs_with_any_change": {k: 0 for k in kinds}, "comparisons": 0, "seconds": time.time() - t0}
    cut = np.random.default_rng(CAUSALITY_SEED + s).choice(T_all, size=N_CUTOFFS, replace=False)
    changed = {k: {} for k in kinds}
    examples = {k: [] for k in kinds}
    cutoffs_changed = {k: 0 for k in kinds}
    compared = 0
    for t in cut.tolist():
        ref_items = items(ref, t - int(T_all[0]))
        for kind in kinds:
            if kind == "replace":
                c2 = counts.copy()
                tail = c2[20 * t + 1:]
                c2[20 * t + 1:] = np.random.default_rng([CAUSALITY_SEED, s, t]).integers(
                    -32767, 32767, size=tail.shape, endpoint=True, dtype=np.int16)
            else:
                c2 = counts[:20 * t + 1]
            res = forecast.pipeline(c2, gains, zeros, np.array([t]), sel, weights)
            got = items(res, 0)
            any_change = False
            for name, v in ref_items.items():
                compared += 1
                if not np.array_equal(np.asarray(got[name]), np.asarray(v), equal_nan=True):
                    any_change = True
                    changed[kind][name] = changed[kind].get(name, 0) + 1
                    if len(examples[kind]) < MAX_EXAMPLES:
                        examples[kind].append({"cutoff": t, "item": name})
            cutoffs_changed[kind] += int(any_change)
    return rec, {"record": rec, "subject_number": s, "source_sha256": shas, "cutoffs_tested": N_CUTOFFS,
                 "cutoffs": sorted(cut.tolist()), "kinds": list(kinds), "chest_end_margin": end_margin,
                 "items_per_cutoff": len(items(ref, 0)), "comparisons": compared,
                 "cutoffs_with_any_change": cutoffs_changed, "changed_items": changed, "examples": examples,
                 "seconds": time.time() - t0}


def main():
    import multiprocessing as mp
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--records-map", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--weights", default=str(arms.WEIGHTS_DIR))
    ap.add_argument("--selection", default=str(forecast.SELECTION))
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--kinds", nargs="+", default=["replace", "truncate"], choices=["replace", "truncate"])
    ap.add_argument("--chest-end-margin", type=int, default=fe.CHEST_END_MARGIN)
    a = ap.parse_args()
    rmap = json.loads(Path(a.records_map).read_text())["records"]
    jobs = [(rec, p, a.weights, a.selection, tuple(a.kinds), a.chest_end_margin) for rec, p in rmap.items()]
    reports = {}
    with mp.Pool(a.workers) as pool:
        for rec, rep in pool.imap_unordered(run_record, jobs):
            reports[rec] = rep
            print(rec, rep["cutoffs_with_any_change"], f"{rep['seconds']:.0f} s", flush=True)
    total = {k: sum(r["cutoffs_with_any_change"][k] for r in reports.values()) for k in a.kinds}
    write_json(a.out, {"test": "causality_test of PROTOCOL.json", "chest_end_margin": a.chest_end_margin,
                       "kinds": a.kinds, "records": {r: reports[r] for r in sorted(reports)},
                       "total_cutoffs_with_any_change": total,
                       "records_not_run": {r: v["not_run"] for r, v in reports.items() if "not_run" in v},
                       "zero_changes": all(v == 0 for v in total.values())})
    print("total cutoffs with any change:", total)


if __name__ == "__main__":
    main()
