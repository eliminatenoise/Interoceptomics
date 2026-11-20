"""Build the two file-compatible browser packets from the bundled anatomy and study aggregates."""
from pathlib import Path
import base64
import csv
import hashlib
import json
import math
import struct

HERE = Path(__file__).resolve().parent
REF = HERE / "references"


def read_template():
    lines = (REF / "standard_1005.elc").read_text().splitlines()
    positions = [list(map(float, row.split())) for row in lines[lines.index("Positions") + 1:lines.index("Labels")]]
    names = lines[lines.index("Labels") + 1:]
    assert len(names) == len(positions) == len(set(names)) == 346
    return dict(zip(names, positions))


def assemble():
    points = read_template()
    rows = list(csv.DictReader((REF / "channel-map.csv").read_text().splitlines()))
    assert len(rows) == 96 and [int(row["channel"]) for row in rows] == list(range(1, 97))
    assert all(row["native_label"] == "eeg" for row in rows[:61])
    assert [int(r["native_hz"]) for r in rows] == [512] * 64 + [64] * 32
    sites = [[r["table_2_label"], *points[r["table_2_label"]]] for r in rows[:61]]
    assert len({site[0] for site in sites}) == 61

    vertices = (REF / "standard_skin_5054-1.bps").read_bytes()
    polygons = (REF / "standard_skin_5054-1.bpl").read_bytes()
    # The ASA binary files store little-endian float32 xyz and zero-based int32 indices.
    surface = list(struct.iter_unpack("<3f", vertices))
    tri = struct.unpack("<30312i", polygons)
    assert len(surface) == 5054 and min(tri) == 0 and max(tri) == 5053
    assert max(min(math.dist(site[1:], p) for p in surface) for site in sites) < 6
    packet = {
        "sites": sites, "channels": rows, "ground": points["AFz"],
        "xyz": base64.b64encode(vertices).decode("ascii"),
        "faces": base64.b64encode(struct.pack("<30312H", *tri)).decode("ascii")
    }
    target = HERE / "atlas-data.js"
    target.write_text("const ATLAS = " + json.dumps(packet, separators=(",", ":")) + ";\n")
    print(target.name, hashlib.sha256(target.read_bytes()).hexdigest())


def prepare_measurements():
    source = json.loads((HERE / "measurements/cue-fields.json").read_text())
    montage = read_template()
    channels = source["channels"]
    assert [row["index"] for row in channels["eeg"]] == list(range(1, 62))
    with (REF / "channel-map.csv").open() as file:
        codebook_names = [r["table_2_label"] for r in csv.DictReader(file)][:61]
    assert [r["label"] for r in channels["eeg"]] == codebook_names
    assert all(row["label"] in montage for row in channels["eeg"])
    assert [row["index"] for row in channels["eog"]] == [62, 63, 64]
    assert [row["index"] for row in channels["mechanics"]] == [93, 94, 68]
    limits = source["eeg_scale"]
    assert math.isfinite(limits["limit"]) and limits["limit"] > 0
    assert [task["code"] for task in source["tasks"]] == list(range(1536, 1543))
    assert [(w["start_s"], w["stop_s"]) for w in source["windows"]] == [
        (0, 0.25), (0.75, 1), (1.5, 1.75), (2.5, 2.75)
    ]
    for task in source["tasks"]:
        assert task["trials"] == 18
        assert [w["id"] for w in task["windows"]] == [w["id"] for w in source["windows"]]
        for window in task["windows"]:
            for group, channel_list in channels.items():
                values = window[group]
                assert len(values) == len(window["valid_trials"][group]) == len(window["valid_runs"][group]) == len(channel_list)
                assert all(v is None or math.isfinite(v) for v in values)
                assert all(0 <= n <= task["trials"] for n in window["valid_trials"][group])
                assert all(0 <= n <= 3 for n in window["valid_runs"][group])
    target = HERE / "cue-fields.js"
    target.write_text("const CUE_FIELDS = " + json.dumps(source, separators=(",", ":")) + ";\n")
    print(target.name, hashlib.sha256(target.read_bytes()).hexdigest())


if __name__ == "__main__":
    assemble()
    prepare_measurements()
