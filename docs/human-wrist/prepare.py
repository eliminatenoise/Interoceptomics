"""Extract the fixed first right-wrist example from AJILE12. All output stays local."""
import argparse
import base64
from decimal import Decimal, ROUND_CEILING
import hashlib
import json
import os
from pathlib import Path
import tempfile

import numpy as np

HERE = Path(__file__).resolve().parent
ASSET_ID = "7b9e2ca1-9097-488a-b4e9-ac407fb31457"
SOURCE_HASH = "943f57a0d417445158cee76eb7147cc97d562848aa6993593ee8f3930c55be7e"
NPZ_HASH = "261512396188747a9033ad308537fcfb609a31cef5cc5f333ed066c2230b0bca"
JOINTS = ("L_Wrist", "R_Wrist", "L_Elbow", "R_Elbow", "L_Shoulder", "R_Shoulder")


def file_hash(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def extract(handle):
    import h5py
    with h5py.File(handle, "r") as h:
        e = h["acquisition/ElectricalSeries"]
        region = e["electrodes"]
        table = h[region.attrs["table"]]
        rows = np.array(region[:], dtype="<i8")
        p = h["processing/behavior/Position"]
        # The public recipe fixes the event selector and the window relative to it.
        # All absolute times and indices come from the local recording.
        onset = float(h["processing/behavior/ReachEvents/timestamps"][0])
        half = Decimal("0.5")
        event = Decimal(str(onset))

        def window(series, expected_rate):
            clock = series["starting_time"]
            start = Decimal(str(float(clock[()])))
            rate = Decimal(str(float(clock.attrs["rate"])))
            if start != 0 or rate != expected_rate:
                raise ValueError("Unexpected source clock")
            indices = [int(((edge - start) * rate).to_integral_value(rounding=ROUND_CEILING))
                       for edge in (event - half, event + half)]
            if indices[0] < 0 or indices[1] > series["data"].shape[0]:
                raise ValueError("Incomplete one-second window")
            times = np.arange(*indices, dtype="<f8") / float(rate) + float(start)
            return slice(*indices), times

        e_rows, e_times = window(e, 500)
        if float(e["data"].attrs["conversion"]) != 1e-6:
            raise ValueError("Unexpected electrical unit conversion")
        p_rows, p_times = window(p[JOINTS[0]], 30)
        for joint in JOINTS[1:]:
            other_rows, _ = window(p[joint], 30)
            if other_rows != p_rows:
                raise ValueError("Unmatched camera clocks")
        group = [x.decode("utf8") if isinstance(x, bytes) else str(x)
                 for x in table["group_name"][:][rows]]
        arrays = dict(ecog_uv=e["data"][e_rows, :],
                    pose_xy_px=np.stack([p[j]["data"][p_rows, :] for j in JOINTS], axis=1),
                    joint_names=np.array(JOINTS),
                    ecog_time_s=e_times,
                    pose_time_s=p_times,
                    electrode_id=table["id"][:][rows],
                    ecog_electrode_table_row=rows, group_name=np.array(group),
                    author_good=table["good"][:][rows].astype(bool),
                    electrode_xyz_source=np.column_stack([table[axis][:][rows] for axis in "xyz"]))
        return arrays, onset


def encode(arrays, source_onset=None):
    specs = json.loads((HERE / "array-digests.json").read_bytes())
    if set(arrays) != set(specs):
        raise ValueError("Unexpected array inventory")
    checked = {}
    for name, spec in specs.items():
        arr = np.ascontiguousarray(arrays[name])
        # Normalize byte order explicitly so supported architectures serialize identically.
        shape = json.dumps(list(arr.shape), separators=(",", ":")).encode("ascii")
        if (arr.dtype.newbyteorder("<").str != spec["dtype"]
                or hashlib.sha256(shape).hexdigest() != spec["shape_sha256"]):
            raise ValueError(f"Unexpected format for {name}")
        arr = arr.astype(spec["dtype"], copy=False)
        if hashlib.sha256(arr.tobytes()).hexdigest() != spec["sha256"]:
            raise ValueError(f"Selected source digest differs for {name}")
        checked[name] = arr
    voltage = checked.pop("ecog_uv")
    pose = checked.pop("pose_xy_px")
    # The verified NPZ contains the centered electrical time grid. Check its
    # midpoint against the annotation as well when the original NWB is open.
    grid = checked["ecog_time_s"]
    onset = float(grid[len(grid) // 2])
    if source_onset is not None and onset != source_onset:
        raise ValueError("Event annotation disagrees with the verified centered grid")
    data = {
        "format": "interoceptomics.ajile12.v1", "asset": ASSET_ID, "eventTime": onset,
        "metadata": {k: v.flatten().tolist() for k,v in checked.items()},
        "voltageFloat32LE": base64.b64encode(voltage.tobytes()).decode("ascii"),
        "poseFloat64LE": base64.b64encode(pose.tobytes()).decode("ascii"),
    }
    return (json.dumps(data, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n").encode("ascii")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--fetch", action="store_true", help="Read only selected ranges from the pinned DANDI file")
    src.add_argument("--nwb", type=Path, help="Use the original versioned DANDI file on disk")
    src.add_argument("--npz", type=Path, help="Use an existing verified ten-array first-window NPZ")
    parser.add_argument("--out", required=True, type=Path, help="A new local JSON file")
    args = parser.parse_args()
    if args.out.exists():
        parser.error("Choose a new output filename")
    source_onset = None
    if args.fetch:
        from range_reader import RangeReader
        with tempfile.TemporaryDirectory(prefix="wrist-ranges-") as temp:
            with RangeReader(temp) as reader:
                arrays, source_onset = extract(reader)
    elif args.nwb:
        if file_hash(args.nwb) != SOURCE_HASH:
            parser.error("Original NWB SHA-256 mismatch")
        arrays, source_onset = extract(args.nwb)
    else:
        if file_hash(args.npz) != NPZ_HASH:
            parser.error("Selected NPZ SHA-256 mismatch")
        with np.load(args.npz, allow_pickle=False) as archive:
            arrays = {k: archive[k] for k in archive.files}
    content = encode(arrays, source_onset)
    # Exclusive creation keeps an existing local file intact, including on concurrent invocation.
    descriptor = os.open(args.out, os.O_EXCL | os.O_CREAT | os.O_WRONLY, 0o600)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(content)
    except BaseException:
        args.out.unlink(missing_ok=True)
        raise
    print(f"Local JSON ready ({len(content):,} bytes). SHA-256 {hashlib.sha256(content).hexdigest()}")


if __name__ == "__main__":
    main()
