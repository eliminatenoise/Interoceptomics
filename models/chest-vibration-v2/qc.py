"""Data-integrity checks QC1-QC5 (PROTOCOL.json quality_checks). They concern data integrity only,
never detector behaviour, signal shape or any model's error.

  python qc.py --records-map MAP.json --manifest SHA256SUMS.txt --group primary_test --out QC.json

Header lines are compared with surrounding whitespace removed: every CEBSDB 1.0.0 header line ends
with a space (recorded deviation of FREEZE.json; the admission review found that a literal comparison
would exclude every record).
"""
import argparse
import json
from pathlib import Path

import numpy as np

import features as fe
import signal_path as sp
from common import RAW_RATE, cutoff_range, load_allocation, pins, sha256_file, subject_number, write_json
from metrics import k_of_n

MANIFEST_SHA256 = "75db8c9b809ef307aabeff2c0d1b780e1bb80d4df1044272ba0f980ed06f205e"
LABELS = ["I", "II", "RESP", "SCG"]


def expected(rec):
    if rec == "b001":
        return {"frames": 1360050, "comment": "#Baseline for subject 1", "span_end_s": 271, "min_valid": 40500}
    return {"frames": 1500000, "comment": f"#After music listening for subject {subject_number(rec)}",
            "span_end_s": 291, "min_valid": 45000}


def longest_run(x):
    if len(x) == 0:
        return 0
    change = np.flatnonzero(np.diff(x) != 0)
    edges = np.concatenate(([-1], change, [len(x) - 1]))
    return int(np.diff(edges).max())


def qc_record(rec, dat, hea, manifest_ok):
    exp = expected(rec)
    p = pins()
    r = {"record": rec, "QC1": {}, "QC2": {}, "QC3": {}, "QC4": {}, "QC5": {}, "readable": False}
    sha_dat, sha_hea = sha256_file(dat), sha256_file(hea)
    r["QC1"] = {"dat_sha256": sha_dat, "hea_sha256": sha_hea, "dat_pin": p[f"{rec}.dat"], "hea_pin": p[f"{rec}.hea"],
                "manifest_matches_pin": bool(manifest_ok)}
    r["QC1"]["pass"] = bool(sha_dat == p[f"{rec}.dat"] and sha_hea == p[f"{rec}.hea"] and manifest_ok)

    h = sp.parse_header(Path(hea).read_text(encoding="ascii"))
    lines = h["lines"]
    sig = h["signals"]
    c2 = {"non_empty_lines": len(lines), "record_name": h["record"], "n_signals": h["n_signals"],
          "rate_hz": h["rate"], "frames": h["frames"], "final_comment": lines[-1] if lines else None}
    checks = {"six_lines": len(lines) == 6, "record_name": h["record"] == rec, "four_signals": h["n_signals"] == "4",
              "rate_5000": h["rate"] == "5000", "frames": h["frames"] == str(exp["frames"]),
              "final_comment": bool(lines) and lines[-1] == exp["comment"]}
    sig_ok = len(sig) == 4 and all(len(s["fields"]) == 9 for s in sig)
    checks["signal_lines"] = bool(sig_ok and all(s["file"] == f"{rec}.dat" and s["fmt"] == "16" and s["block"] == "0"
                                                 for s in sig))
    checks["labels"] = bool(sig_ok and [s.get("label") for s in sig] == LABELS)
    checks["positive_gains"] = bool(sig_ok and all("gain" in s and s["gain"] > 0 for s in sig))
    size = Path(dat).stat().st_size
    c2["dat_bytes"] = size
    checks["dat_length"] = size == 8 * exp["frames"]
    counts = None
    if checks["dat_length"]:
        counts = sp.read_counts(dat, exp["frames"])
        native = ((counts.sum(axis=0, dtype=np.int64) + 32768) % 65536 - 32768).tolist()
        c2["checksums_computed"] = native
        c2["checksums_header"] = [int(s["checksum"]) for s in sig] if sig_ok else None
        checks["checksums"] = bool(sig_ok and native == c2["checksums_header"])
    else:
        checks["checksums"] = False
    c2["checks"] = checks
    c2["pass"] = bool(all(checks.values()))
    r["QC2"] = c2

    if counts is None or not (sig_ok and checks["positive_gains"]):
        for q in ("QC3", "QC4", "QC5"):
            r[q] = {"pass": False, "reason": "record not readable with its header"}
        r["pass"] = False
        return r
    r["readable"] = True
    gains, zeros = sp.calibration_constants(h)
    trace = sp.filtered_grid(counts, gains, zeros)
    cal = sp.calibrate(trace)
    missing = {LABELS[c]: int((counts[:, c] == sp.MISSING).sum()) for c in (1, 2, 3)}
    T = np.arange(*cutoff_range(rec))
    if cal["ok"]:
        valid = int(fe.row_mask(sp.standardize(trace, cal), T).sum())
    else:
        valid = 0
    r["QC3"] = {"missing_samples": missing, "calibration_valid": dict(zip(LABELS[1:], cal["valid"].tolist())),
                "calibration_sd_mV": dict(zip(LABELS[1:], [float(v) for v in cal["sd"]])),
                "calibration_ok": bool(cal["ok"]), "valid_scoring_cutoffs": valid, "scoring_cutoffs": int(len(T)),
                "required_valid": exp["min_valid"]}
    r["QC3"]["pass"] = bool(cal["ok"] and valid >= exp["min_valid"])

    lo, hi = 55 * RAW_RATE, exp["span_end_s"] * RAW_RATE
    span = counts[lo:hi]
    runs = {LABELS[c]: longest_run(span[:, c]) for c in (1, 2, 3)}
    r["QC4"] = {"span_samples": [lo, hi], "longest_identical_run": runs,
                "limits": {"II": 2500, "SCG": 2500, "RESP": 25000}}
    r["QC4"]["pass"] = bool(runs["II"] < 2500 and runs["SCG"] < 2500 and runs["RESP"] < 25000)

    clip = {LABELS[c]: float(np.mean(np.abs(span[:, c].astype(np.int32)) == 32767)) for c in (1, 2, 3)}
    r["QC5"] = {"clipped_fraction": clip, "exclude_above": 0.01, "flag_from": 0.001,
                "flagged": [k for k, v in clip.items() if 0.001 <= v <= 0.01]}
    r["QC5"]["pass"] = bool(all(v <= 0.01 for v in clip.values()))
    r["pass"] = bool(all(r[q]["pass"] for q in ("QC1", "QC2", "QC3", "QC4", "QC5")))
    return r


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--records-map", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--label", default="")
    a = ap.parse_args()
    manifest_sha = sha256_file(a.manifest)
    rmap = json.loads(Path(a.records_map).read_text())["records"]
    recs = {rec: qc_record(rec, p["dat"], p["hea"], manifest_sha == MANIFEST_SHA256) for rec, p in rmap.items()}
    groups = {g: [m["record"] for m in members] for g, members in load_allocation()["groups"].items()}
    primary = [r for r in groups["primary_test"] if r in recs]
    n = sum(recs[r]["pass"] for r in primary)
    report = {"label": a.label, "manifest_sha256": manifest_sha, "manifest_pin": MANIFEST_SHA256,
              "records": recs, "passing": [r for r in recs if recs[r]["pass"]],
              "primary_test_n_passing": n, "k_of_n": k_of_n(n) if primary else None}
    write_json(a.out, report)
    for rec, r in recs.items():
        print(rec, "pass" if r["pass"] else "FAIL", {q: r[q]["pass"] for q in ("QC1", "QC2", "QC3", "QC4", "QC5")})


if __name__ == "__main__":
    main()
