"""SCORE-LOCK.json: the SHA-256 of every forecast file, the QC report, FREEZE.json and the scoring code,
written before any error is computed (PROTOCOL.json scoring step 5).

  python lock.py --forecasts FORECASTDIR --qc-report QC.json --freeze FREEZE.json --out SCORE-LOCK.json
"""
import argparse
import datetime
from pathlib import Path

from common import HERE, sha256_file, write_json

CODE = ["common.py", "signal_path.py", "detectors.py", "template.py", "features.py", "models.py", "arms.py",
        "metrics.py", "qc.py", "forecast.py", "lock.py", "score.py"]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--forecasts", required=True)
    ap.add_argument("--qc-report", required=True)
    ap.add_argument("--freeze", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    files = sorted(p for p in Path(a.forecasts).iterdir() if p.suffix in (".npz", ".json"))
    write_json(a.out, {
        "written_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "forecast_files": {p.name: sha256_file(p) for p in files},
        "qc_report_sha256": sha256_file(a.qc_report),
        "freeze_sha256": sha256_file(a.freeze),
        "scoring_code_sha256": {name: sha256_file(HERE / name) for name in CODE},
        "weights_sha256": {p.name: sha256_file(p) for p in sorted((HERE / "weights").glob("*.json"))},
    })


if __name__ == "__main__":
    main()
