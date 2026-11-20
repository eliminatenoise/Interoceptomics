"""Rebuild or verify the W-track excerpt with h5py and fsspec[http].

Only the required ranges of the public NWB file are read. No credentials needed.
"""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

import fsspec
import h5py
import numpy as np

DANDI = "https://api.dandiarchive.org/api"
VERSION = "000978/versions/0.240511.0307"
ASSET = "4b7c7959-04b3-4817-8f96-1af6f41888c1"
SOURCE_SHA = "6b8cf8ce3bbe34374e10a8a310592d1ae9762b20554569bc3c45fcfecdcf67b6"
FIRST_ROW, LAST_ROW = 35254, 36640  # Both inclusive; checked against adjacent timestamps.


def metadata(url):
    with urlopen(url, timeout=30) as stream:
        return json.load(stream)


def extract(nwb):
    trial = nwb["intervals/trials"]
    assert nwb["general/subject/subject_id"][()] == b"JDS-SingleDay-JS14"
    assert nwb["general/session_id"][()] == b"01"
    assert [trial[k][0] for k in ("id", "start_well", "end_well", "trajectory_type")] == [0, 1, 2, 0]
    start, stop = float(trial["start_time"][0]), float(trial["stop_time"][0])
    position = nwb["processing/behavior/Position/SpatialSeries"]
    times = position["timestamps"][FIRST_ROW - 1:LAST_ROW + 2]
    assert times[0] < start <= times[1] and times[-2] <= stop < times[-1]
    assert np.all(np.diff(times) > 0)
    assert position["reference_frame"][()] == b"center well"
    assert position["timestamps"].attrs["unit"] == "seconds"
    assert position["data"].attrs["unit"] == "centimeters; centimeters/second"
    assert position["data"].attrs["conversion"] == 1 and position["data"].attrs["offset"] == 0
    xy = position["data"][FIRST_ROW:LAST_ROW + 1, :2]
    assert np.isfinite(xy).all()
    samples = np.column_stack([times[1:-1], xy]).tolist()

    units = nwb["units"]
    electrodes = nwb["general/extracellular_ephys/electrodes"]
    spike_ends = units["spike_times_index"][:]
    unit_ids = units["id"][:]
    regions = electrodes["location"][:][units["electrodes"][:]]
    neurons = []
    for region in ("PFC", "CA1"):
        # Use the first listed unit in each region. Spike counts do not enter the selection.
        row = int(np.flatnonzero(regions == region.encode())[0])
        lo = int(spike_ends[row - 1]) if row else 0
        spikes = units["spike_times"][lo:int(spike_ends[row])]
        assert np.all(np.diff(spikes) >= 0)
        events = spikes[(spikes >= start) & (spikes <= stop)].tolist()
        neurons.append({"unit": int(unit_ids[row]), "region": region, "spikes_s": events})
    return {
        "asset": ASSET, "subject": "JDS-SingleDay-JS14", "session": "01", "trial": 0,
        "start_s": start, "stop_s": stop, "first_position_row": FIRST_ROW,
        "position_columns": ["session_time_s", "x_cm", "y_cm"],
        "position_frame": "center well", "positions": samples, "units": neurons,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="replace the packet beside this script")
    args = parser.parse_args()
    release = metadata(f"{DANDI}/dandisets/{VERSION}/")
    assert release["license"] == ["spdx:CC-BY-4.0"]
    member = metadata(f"{DANDI}/dandisets/{VERSION}/assets/?path=sub-JDS-SingleDay-JS14")
    assert any(row["asset_id"] == ASSET for row in member["results"])
    asset = metadata(f"{DANDI}/assets/{ASSET}/")
    assert asset["digest"]["dandi:sha2-256"] == SOURCE_SHA
    url = next(url for url in asset["contentUrl"] if url.startswith("https://dandiarchive.s3."))
    etag = asset["digest"]["dandi:dandi-etag"]
    fs = fsspec.filesystem("http", headers={"If-Match": f'"{etag}"'})
    with fs.open(url, "rb", block_size=256 * 1024, cache_type="blockcache", size=asset["contentSize"]) as source:
        with h5py.File(source, "r") as nwb:
            packet = extract(nwb)
        fetched = source.cache.total_requested_bytes
    output = (json.dumps(packet, separators=(",", ":"), allow_nan=False) + "\n").encode()
    path = Path(__file__).with_name("maze-trial.json")
    if args.write:
        path.write_bytes(output)
    elif path.read_bytes() != output:
        raise SystemExit("The published packet differs from the source extraction.")
    print(f"{len(packet['positions'])} frames, {len(packet['units'])} units, {fetched} range bytes, "
          f"packet SHA-256 {hashlib.sha256(output).hexdigest()}")


if __name__ == "__main__":
    main()
