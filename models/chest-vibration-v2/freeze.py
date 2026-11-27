"""Write FREEZE.json (PROTOCOL.json freeze) and the published copies of the fitting-people causality
and QC reports. Reads only fitting-people outputs; opens no test file.

  python freeze.py --fit-source FITDIR --causality REPORT.json --causality-literal REPORT8.json \
                   --chest-bound-check CHECK.json --qc QC.json --export EXPORTDIR --codecheck SUMMARY.json \
                   --reproduction REPRO.json --notes NOTES.json \
                   --search-root HOME --search-label home --search-root SCRATCH --search-label scratch

The on-disk search records file names, sizes and SHA-256 values only, never local paths. A file whose
name marks it as a subject 14-20 file or p001.dat is reported by name and not opened.
"""
import argparse
import datetime
import json
import os
import platform
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

import arms
import signal_path as sp
from common import (FIT_POOL, HERE, PROTOCOL_COMMIT, PROTOCOL_FILES, SEEDS, load_allocation, sha256_file,
                    subject_number, write_json)

CODE_ROLES = {
    "common.py": "constants, record lists, hashing",
    "signal_path.py": "native counts to filtered 250 Hz mV, calibration, z units (version 1's path)",
    "detectors.py": "R_v2, chest_v2 and C3 detectors; C3 rolling template",
    "template.py": "beat template module with the P-wave search",
    "features.py": "feature blocks B0-B3d, v1 ECG features, row mask, no-weight arms",
    "models.py": "ridge closed form, MLP training, NumPy forward passes, weight files",
    "arms.py": "every arm's forecast from features and frozen weights",
    "metrics.py": "RMSE, MAE, relative reduction, bootstrap, verdict rule",
    "develop.py": "feature grid, LOPO model choice and development table (fitting people only)",
    "final_fit.py": "final fits on the ten fitting people and the NumPy export check",
    "causality.py": "causality test (replacement and truncation)",
    "qc.py": "data-integrity checks QC1-QC5",
    "forecast.py": "forecast files for scored records",
    "lock.py": "SCORE-LOCK.json",
    "score.py": "the one scoring run: metrics, comparisons, bootstrap, verdicts",
    "freeze.py": "this file",
}
NAME_RE = re.compile(r"^(?:[abmp]0(?:1[4-9]|20)\.(?:dat|hea|atr)|p001\.dat)$")
RECORD_BYTES = 12_000_000


def manifest_names():
    """SHA-256 -> manifest file names, from the pins of every group (ALLOCATION.json) and the aliases."""
    out = {}
    alloc = load_allocation()
    for group, members in alloc["groups"].items():
        for m in members:
            out.setdefault(m["dat"]["sha256"], []).append(f"{m['dat']['name']} ({group})")
    return out


def disk_search(roots, labels):
    by_sha = manifest_names()
    test_dat = {m["dat"]["sha256"] for m in load_allocation()["groups"]["primary_test"]}
    p001 = [m for m in load_allocation()["groups"]["secondary_new_people"] if m["record"] == "p001"][0]["dat"]["sha256"]
    version = subprocess.run(["find", "--version"], capture_output=True, text=True).stdout.splitlines()[0]
    report = {"roots": labels, "tool": version, "name_pattern": NAME_RE.pattern, "size_bytes": RECORD_BYTES,
              "name_matches": [], "size_matches": [], "unreadable_directories": []}
    for root, label in zip(roots, labels):
        cmd = ["find", root, "-type", "f", "(", "-size", f"{RECORD_BYTES}c", "-o", "-regextype", "posix-extended",
               "-regex", r".*/([abmp]0(1[4-9]|20)\.(dat|hea|atr)|p001\.dat)", ")", "-print0"]
        res = subprocess.run(cmd, capture_output=True)
        for line in res.stderr.decode(errors="replace").splitlines():
            m = re.search(r"[\u2018']([^\u2019']*)[\u2019']: Permission denied", line)
            if m:
                report["unreadable_directories"].append({"root": label, "name": Path(m[1]).name})
            elif line.strip():
                report.setdefault("other_messages", []).append({"root": label, "message": line.split(":")[-1].strip()})
        for raw in res.stdout.split(b"\0"):
            if not raw:
                continue
            path = Path(raw.decode(errors="replace"))
            if NAME_RE.match(path.name):
                report["name_matches"].append({"root": label, "name": path.name})
                continue
            if path.stat().st_size == RECORD_BYTES:
                sha = sha256_file(path)
                report["size_matches"].append({"root": label, "name": path.name, "sha256": sha,
                                               "manifest_entries": by_sha.get(sha, [])})
    shas = [m["sha256"] for m in report["size_matches"]]
    report["size_matches"].sort(key=lambda m: (m["root"], m["name"], m["sha256"]))
    report["primary_test_waveform_found"] = any(s in test_dat for s in shas)
    report["p001_waveform_found"] = p001 in shas
    report["no_primary_test_file_and_no_p001"] = (not report["name_matches"] and not report["primary_test_waveform_found"]
                                                  and not report["p001_waveform_found"])
    return report


def literal_header_check(fit_source):
    rows = {}
    for rec in FIT_POOL:
        text = (Path(fit_source) / f"{rec}.hea").read_text(encoding="ascii")
        raw_last = [l for l in text.splitlines() if l.strip()][-1]
        want = f"#After music listening for subject {subject_number(rec)}"
        rows[rec] = {"raw_final_line": raw_last, "literal_equal": raw_last == want, "trimmed_equal": raw_last.strip() == want}
    return {"records": rows, "literal_passes": sum(r["literal_equal"] for r in rows.values()),
            "trimmed_passes": sum(r["trimmed_equal"] for r in rows.values())}


def environment():
    import torch
    cpu = next((l.split(":", 1)[1].strip() for l in open("/proc/cpuinfo") if l.startswith("model name")), None)
    osr = {}
    if Path("/etc/os-release").exists():
        for line in open("/etc/os-release"):
            if "=" in line:
                k, v = line.rstrip().split("=", 1)
                osr[k] = v.strip('"')
    try:
        b = np.show_config(mode="dicts")["Build Dependencies"]["blas"]
        blas = {k: b.get(k) for k in ("name", "version", "openblas configuration")}
    except Exception:
        blas = None
    return {"python": sys.version.split()[0], "numpy": np.__version__, "torch": torch.__version__,
            "numpy_blas": blas, "cpu_model": cpu, "logical_cpus": os.cpu_count(),
            "os": f"{platform.system()}, an {osr.get('ID_LIKE', 'unknown')}-based distribution",
            "kernel": "-".join(platform.release().split("-")[:2]), "machine": platform.machine(),
            "threads": {"cpus_used": "24-31 (taskset), within the protocol's 16-31; at most 8 threads at once",
                        "numpy_steps": "OMP_NUM_THREADS=1, OPENBLAS_NUM_THREADS=1, MKL_NUM_THREADS=1; the feature grid "
                                       "and the causality test used 8 single-threaded worker processes",
                        "mlp": "torch.set_num_threads(4), torch.set_num_interop_threads(1), "
                               "torch.use_deterministic_algorithms(True), float32 on the CPU; two 4-thread jobs at "
                               "once on CPUs 24-27 and 28-31",
                        "gpu": "none (CUDA_VISIBLE_DEVICES and HIP_VISIBLE_DEVICES empty)"}}


def files_sha(folder, pattern):
    return {p.name: sha256_file(p) for p in sorted(Path(folder).glob(pattern))}


def no_local_paths(obj):
    text = json.dumps(obj)
    import getpass
    marks = ["/home/", "/tmp/", os.path.expanduser("~"), getpass.getuser()]
    return not any(m and m in text for m in marks)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fit-source", required=True)
    ap.add_argument("--causality", required=True)
    ap.add_argument("--causality-literal", required=True)
    ap.add_argument("--qc", required=True)
    ap.add_argument("--export", required=True)
    ap.add_argument("--codecheck", required=True)
    ap.add_argument("--reproduction", required=True)
    ap.add_argument("--notes", required=True, help="JSON with deviations, implementation notes and timings")
    ap.add_argument("--chest-bound-check", required=True)
    ap.add_argument("--search-root", action="append", required=True)
    ap.add_argument("--search-label", action="append", required=True)
    a = ap.parse_args()

    protocol = json.loads((HERE / "PROTOCOL.json").read_text())
    proto_sha = {n: sha256_file(HERE / n) for n in PROTOCOL_FILES}
    for name, pin in ((n, protocol["companion_files"][n]["sha256"]) for n in PROTOCOL_FILES if n != "PROTOCOL.json"):
        if proto_sha[name] != pin:
            raise SystemExit(f"{name} differs from the PROTOCOL.json pin")
    selection = json.loads((HERE / "development" / "selection.json").read_text())

    causality = json.loads(Path(a.causality).read_text())
    literal = json.loads(Path(a.causality_literal).read_text())
    if not causality["zero_changes"]:
        raise SystemExit("the fitting-people causality test shows changes: no freeze")
    qc = json.loads(Path(a.qc).read_text())
    for obj in (causality, qc):
        if not no_local_paths(obj):
            raise SystemExit("a report to be published contains a local path")
    dev = HERE / "development"
    write_json(dev / "causality-fit-pool.json", causality)
    write_json(dev / "qc-fit-pool.json", qc)

    export = {}
    for arm in arms.MLP_ARMS:
        for seed in SEEDS:
            e = json.loads((Path(a.export) / f"export-{arm}-{seed}.json").read_text())
            export[f"{arm}-{seed}"] = {"max_abs_torch_minus_numpy_z": e["max_abs_torch_minus_numpy_z"],
                                       "within_1e-4": e["within_limit"], "updates": e["updates"],
                                       "training_rows": e["training_rows"]}
    if not all(v["within_1e-4"] for v in export.values()):
        raise SystemExit("an MLP export exceeds 1e-4 z units: no freeze")

    codecheck = json.loads(Path(a.codecheck).read_text())
    repro = json.loads(Path(a.reproduction).read_text())
    notes = json.loads(Path(a.notes).read_text())
    code = {n: {"sha256": sha256_file(HERE / n), "role": r} for n, r in CODE_ROLES.items()}
    search = disk_search(a.search_root, a.search_label)
    if not search["no_primary_test_file_and_no_p001"]:
        raise SystemExit("a primary-test file or p001.dat was found on disk: no freeze, report to the lead")

    freeze = {
        "schema": "interoceptomics-freeze/1",
        "study": "chest-vibration v2",
        "written_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "status": ("Everything before the test download is done and frozen here. No primary-test file, no p001 file and "
                   "no .atr file has been fetched or opened, and no waveform value of subjects 1-3 or b001 has been decoded "
                   "or analysed (the on-disk search hashes every 12,000,000-byte file, as the protocol requires, which "
                   "includes b002.dat and b003.dat, the p002 and p003 bytes). A separate reviewer "
                   "admits this file; the lead commits it and pushes it; the download waits until the protocol commit and "
                   "the freeze commit are both visible on GitHub."),
        "protocol": {"commit": PROTOCOL_COMMIT, "files_sha256": proto_sha,
                     "companion_pins_match": True},
        "code": code,
        "code_note": ("Every code file used to fit, forecast, test causality and score. The version 1 weights used by V1F "
                      "are ../chest-vibration/weights.json, SHA-256 " + arms.V1_WEIGHTS_SHA256 + ", unchanged."),
        "selection": selection,
        "development_files_sha256": files_sha(dev, "*.json"),
        "development_note": ("lopo-r-ecg-grid.json (27 configurations), lopo-c4.json, selection-ridge.json, selection.json and "
                             "development-table.json are the full LOPO tables and the choice; development-table.json is "
                             "labelled optimistic. causality-fit-pool.json and qc-fit-pool.json are the reports below."),
        "weights_sha256": files_sha(HERE / "weights", "*.json"),
        "v1_weights_sha256": arms.V1_WEIGHTS_SHA256,
        "mlp_export_check": export,
        "causality_fit_pool": {
            "report": "development/causality-fit-pool.json",
            "cutoffs_per_person": 200, "kinds": causality["kinds"],
            "items_per_cutoff": next(iter(causality["records"].values()))["items_per_cutoff"],
            "comparisons": sum(r["comparisons"] for r in causality["records"].values()),
            "cutoffs_with_any_change": causality["total_cutoffs_with_any_change"],
            "zero_changes": causality["zero_changes"]},
        "causality_literal_chest_bound": {
            "purpose": "documents deviation 1: the same test with the chest detector's loop bound as written in PROTOCOL.json",
            "chest_end_margin": literal["chest_end_margin"], "kinds": literal["kinds"],
            "cutoffs_with_any_change": literal["total_cutoffs_with_any_change"],
            "per_record": {r: v["cutoffs_with_any_change"] for r, v in literal["records"].items()},
            "changed_items": {r: v["changed_items"] for r, v in literal["records"].items()},
            "full_record_check": json.loads(Path(a.chest_bound_check).read_text())},
        "qc_on_fitting_records": {
            "report": "development/qc-fit-pool.json",
            "passing": qc["passing"], "all_ten_pass": len(qc["passing"]) == 10,
            "literal_header_comparison": literal_header_check(a.fit_source)},
        "scoring_code_check_on_fitting_people": codecheck,
        "reproduction": repro,
        "environment": environment(),
        "disk_search": search,
        **notes,
    }
    if not no_local_paths(freeze):
        raise SystemExit("FREEZE.json would contain a local path")
    write_json(HERE / "FREEZE.json", freeze)
    print("FREEZE.json written:", sha256_file(HERE / "FREEZE.json"))


if __name__ == "__main__":
    main()
