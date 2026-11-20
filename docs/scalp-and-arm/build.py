"""Rebuild the offline anatomical data from the included standard templates and channel map."""
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


if __name__ == "__main__":
    assemble()
