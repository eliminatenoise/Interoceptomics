"""Prepare the first second of the original test interval from each of the five held-out recordings."""
import argparse
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
STUDY = HERE.parent
sys.path.insert(0, str(STUDY))
import reproduce


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="Local cache of the original CEBSDB files")
    parser.add_argument("--fetch", action="store_true", help="Download missing source originals from PhysioNet")
    args = parser.parse_args()
    args.source.mkdir(parents=True, exist_ok=True)
    protocol = json.loads((STUDY / "protocol.json").read_bytes())
    pins = reproduce.archive_index(args.source, protocol, args.fetch)
    checks = json.loads((STUDY / "source-verification.json").read_bytes())
    specs = {r["record"]: r for r in checks["records"]}
    records = []
    first = int(reproduce.CUTS[0]) - 51
    stop = int(reproduce.CUTS[0]) + 250 + reproduce.HORIZON_STEPS
    for name in protocol["held_out"]:
        def original(ext):
            filename = name + ext
            return reproduce.read_checked(args.source, filename, pins[filename], args.fetch)
        frames, gains, zeros, sums = reproduce.parse_header(original(".hea"), name)
        waveform = original(".dat")
        if len(waveform) != 8 * frames:
            raise ValueError(f"Wrong source length in {name}")
        raw = np.frombuffer(waveform, dtype="<i2").reshape(frames, 4)
        native = (raw.sum(axis=0, dtype=np.int64) + 32768) % 65536 - 32768
        if native.tolist() != sums or sums != specs[name]["full_record_checksums_I_II_RESP_SCG"]:
            raise ValueError(f"Native checksum mismatch in {name}")
        filtered = reproduce.filtered_millivolts(raw, gains, zeros)
        calibration = filtered[:5000]
        if not np.isfinite(calibration).all():
            raise ValueError(f"Expected the previously verified calibration in {name}")
        records.append({
            "name": name, "frames": frames, "waveformSha": pins[name + ".dat"], "headerSha": pins[name + ".hea"],
            "gains": gains.tolist(), "baselines": zeros.tolist(), "checksums": sums,
            "mean": calibration.mean(axis=0).tolist(), "sd": calibration.std(axis=0).tolist(),
            "rows": filtered[first:stop].tolist(),
            "previousEcg": filtered[first-reproduce.DELAY:stop-reproduce.DELAY, 0].tolist(),
        })
    packet = {"version": 1, "rateHz": 250, "cutoffStartSeconds": 90,
              "cutoffsPerExcerpt": 250, "historyRows": 52, "horizonRows": 20,
              "delayedEcgRows": reproduce.DELAY, "records": records}
    (HERE / "excerpts.json").write_text(json.dumps(packet, allow_nan=False, separators=(",", ":"))+"\n")


if __name__ == "__main__":
    main()
