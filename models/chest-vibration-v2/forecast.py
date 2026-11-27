"""Forecasts of every arm at every scoring cutoff of each scored record (PROTOCOL.json scoring step 4).

  python forecast.py --records-map MAP.json --qc-report QC.json --out FORECASTDIR

MAP.json: {"records": {"p014": {"dat": PATH, "hea": PATH}, ...}} (p002 and p003 point their "dat" to
b002.dat and b003.dat and their "hea" to p002.hea and p003.hea). The QC report must already be sealed;
its SHA-256 is written into every forecast file. Forecast files hold forecasts in SCG mV, the common
row mask and diagnostics; no target value is written.
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np

import arms
import features as fe
import signal_path as sp
from common import HERE, cutoff_range, pins, sha256_file, write_json

SELECTION = HERE / "development" / "selection.json"


def pipeline(counts, gains, zeros, T, sel, weights):
    """The complete path from native counts to every feature and every arm's forecast at cutoffs T."""
    z, cal, trace = sp.from_counts(counts, gains, zeros)
    feats, no_weight, diag, state = fe.compute(z, np.asarray(T, dtype=np.int64), sel["K"], sel["theta"])
    fz = arms.forecast_all(feats, no_weight, weights)
    return {"z": z, "cal": cal, "feats": feats, "forecast_z": fz, "mask": fe.row_mask(z, np.asarray(T)),
            "diag": diag, "state": state}


def to_mV(fz, cal):
    return {a: cal["mean"][2] + cal["sd"][2] * v for a, v in fz.items()}


def unscorable(q):
    """Why a record cannot be forecast at all, or None. A record that fails another check but is readable,
    is the pinned bytes and has a usable calibration interval is still forecast and scored as descriptive."""
    if not q["QC1"]["pass"]:
        return "QC1: the files are not the pinned bytes"
    if not q["readable"]:
        return "not readable with its header"
    if not q["QC3"].get("calibration_ok", False):
        return "calibration interval fails the 4,500-reading or positive-SD rule"
    return None


def check_pins(rec, dat, hea):
    p = pins()
    got = {"dat": sha256_file(dat), "hea": sha256_file(hea)}
    want = {"dat": p[f"{rec}.dat"], "hea": p[f"{rec}.hea"]}
    if got != want:
        raise ValueError(f"{rec}: SHA-256 differs from the pins: {got} vs {want}")
    return got


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--records-map", required=True)
    ap.add_argument("--qc-report", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--weights", default=str(arms.WEIGHTS_DIR))
    ap.add_argument("--selection", default=str(SELECTION))
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    qc_sha = sha256_file(a.qc_report)
    qc = json.loads(Path(a.qc_report).read_text())
    sel = json.loads(Path(a.selection).read_text())
    weights = arms.load_weights(a.weights)
    rmap = json.loads(Path(a.records_map).read_text())["records"]
    skipped = {}
    for rec, paths in rmap.items():
        t0 = time.time()
        reason = unscorable(qc["records"][rec])
        if reason:
            skipped[rec] = reason
            print(f"{rec}: no forecast ({reason})", flush=True)
            continue
        shas = check_pins(rec, paths["dat"], paths["hea"])
        counts, gains, zeros, header = sp.load_record(paths["dat"], paths["hea"])
        T = np.arange(*cutoff_range(rec))
        res = pipeline(counts, gains, zeros, T, sel, weights)
        mv = to_mV(res["forecast_z"], res["cal"])
        arrays = {"cutoffs": T, "mask": res["mask"], "cal_mean": res["cal"]["mean"], "cal_sd": res["cal"]["sd"],
                  **{f"diag_{k}": v for k, v in res["diag"].items()}, **{f"mV_{k}": v for k, v in mv.items()}}
        np.savez(out / f"{rec}.npz", **arrays)
        write_json(out / f"{rec}.json", {
            "record": rec, "source_sha256": shas, "qc_report_sha256": qc_sha, "selection": sel,
            "cutoffs": [int(T[0]), int(T[-1])], "valid_rows": int(res["mask"].sum()),
            "detectors": fe.detector_summary(res["state"]), "arms": sorted(mv)})
        print(f"{rec}: {int(res['mask'].sum())} valid rows, {time.time() - t0:.1f} s", flush=True)
    write_json(out / "skipped.json", {"qc_report_sha256": qc_sha, "records_without_forecast": skipped})


if __name__ == "__main__":
    main()
