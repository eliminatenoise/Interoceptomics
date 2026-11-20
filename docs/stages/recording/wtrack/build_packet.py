"""Export three chronological training examples and the sealed ridge weights. No fitting."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np


def read_json(path):
    return json.loads(path.read_text())


def require_digest(path, *accepted):
    if hashlib.sha256(path.read_bytes()).hexdigest() not in accepted:
        raise ValueError(f"Unexpected bytes in {path}")


def encode(value):
    return json.dumps(value, allow_nan=False, separators=(",", ":")) + "\n"


def export(source, model):
    fit_dir = model / "fitted"
    # Distributed seal changes only two machine-local library paths to basenames.
    require_digest(fit_dir / "fit-seal.json",
                   "171adb81c9fcb52610b27754f589bd78a108b76bc60dcd0497f13445e6cbace8",
                   "ab69cf7ff0192ee6bb339742df7c142e1716206782c5007f771967f1813cdbce")
    seal = read_json(fit_dir / "fit-seal.json")
    for filename in ("wtrack.py", "predict.py", "protocol.json"):
        require_digest(model / filename, seal["code"][filename])
    require_digest(source / "manifest.json", seal["source_manifest"])
    manifest = read_json(source / "manifest.json")
    regions = source / "evidence" / "units.json"
    require_digest(regions, manifest["unit_metadata_sha256"])
    sys.path.insert(0, str(model.resolve()))
    from wtrack import PROTOCOL, read_partition
    from predict import predict_example

    samples, trips, support = read_partition(source / "pairs", "train")
    for trial_id, record in support.items():
        if record != seal["train"][trial_id]:
            raise ValueError(f"Training support changed for {trial_id}")

    rows = [np.flatnonzero(samples.trial == trip_id)[0] for trip_id in trips if trip_id in samples.trial][:3]
    selected = [int(samples.trial[row]) for row in rows]
    units = read_json(regions)
    if [u["unit_id"] for u in units] != PROTOCOL["source"]["unit_id"]:
        raise ValueError("Unit columns disagree with fit")
    if not all(u["region_agrees"] and u["electrode_region"] in ("PFC", "CA1") for u in units):
        raise ValueError("Ambiguous recording region")

    fits = {}
    for kind in ("motion", "combined"):
        name = "ridge_" + kind
        weights = fit_dir / (name + ".npz")
        require_digest(weights, seal["weights"][name])
        with np.load(weights, allow_pickle=False) as fit:
            fits[kind] = {k: fit[k].tolist() for k in ("centers", "spacing", "avg", "sd", "coef", "yavg")}
            if fit["mode"].item() != kind:
                raise ValueError("Wrong feature set")

    # Use a measured location in each occupied square of the remaining training trips.
    occupied = {}
    for trip_id, trip in trips.items():
        if trip_id not in selected:
            for xy in trip["xy"]:
                if np.isfinite(xy).all():
                    key = tuple(np.floor(xy / 2).astype(int))
                    occupied.setdefault(key, xy.tolist())

    cases, oracle = [], {}
    for row, trip_id in zip(rows, selected, strict=True):
        trip = trips[trip_id]
        indices = np.searchsorted(trip["ts"], samples.prior_s[row])
        if not np.array_equal(trip["frame"][indices], samples.prior_frame[row]):
            raise ValueError("Incorrect source frames")
        case = dict(trip=trip_id, start=trip["start"], cutoff=float(samples.cutoff[row]),
                    frames=samples.prior_frame[row].tolist(), times=samples.prior_s[row].tolist(),
                    xy=trip["xy"][indices].tolist(), counts=samples.spike[row].tolist(),
                    target=dict(frame=int(samples.label_frame[row]), time=float(samples.label_s[row]),
                                xy=samples.y[row].tolist()))
        cases.append(case)
        ref = dict(subject=PROTOCOL["source"]["rat"], session="01", epoch_id=5, trial_id=trip_id,
                   unit_ids=PROTOCOL["source"]["unit_id"], cutoff_s=case["cutoff"],
                   history_frame_s=case["times"], motion=samples.motion[row].tolist(),
                   log_elapsed=samples.clocks[row].tolist(), spike_counts=case["counts"])
        oracle[trip_id] = {kind: predict_example(fit_dir, "ridge_" + kind, ref)["forecast_xy_cm"]
                           for kind in fits}
    return dict(run_start=PROTOCOL["source"]["epoch_start_s"],
                units=[dict(id=u["unit_id"], region=u["electrode_region"]) for u in units],
                fits=fits, track=list(occupied.values()), cases=cases), oracle


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Source directory containing manifest.json, evidence/ and pairs/train/")
    parser.add_argument("model", type=Path, help="Model directory containing protocol.json, wtrack.py and fitted/")
    parser.add_argument("--write", action="store_true", help="Replace the neighbouring packet after verifying its sources")
    parser.add_argument("--oracle", type=Path, help="Save reference outputs for browser comparison")
    args = parser.parse_args()
    packet, oracle = export(args.source, args.model)
    result = encode(packet).encode()
    output = Path(__file__).with_name("packet.json")
    if args.write:
        output.write_bytes(result)
    elif output.read_bytes() != result:
        raise SystemExit("Shipped packet differs from the reconstruction")
    if args.oracle:
        args.oracle.write_text(encode(oracle))
    print(hashlib.sha256(result).hexdigest(), len(result))
