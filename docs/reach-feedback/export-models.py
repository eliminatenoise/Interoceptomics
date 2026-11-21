"""Build separate animated glTF 2.0 files for the two physical coordinate frames."""

import json
import math
import struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
COLORS = [(0.03, 0.73, 0.57), (0.98, 0.54, 0.17), (0.32, 0.59, 0.94)]


def glyph():
    # An octahedral sphere marks a tracked point; its radius is a display choice.
    top, bottom = (0, 1, 0), (0, -1, 0)
    ring = [(1, 0, 0), (0, 0, -1), (-1, 0, 0), (0, 0, 1)]
    tris = []
    for i, left in enumerate(ring):
        right = ring[(i + 1) % 4]
        tris.extend([(top, left, right), (bottom, right, left)])

    def mid(a, b):
        v = [x + y for x, y in zip(a, b)]
        return tuple(x / math.hypot(*v) for x in v)

    for _ in range(2):
        fine = []
        for a, b, c in tris:
            ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
            fine.extend([(a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)])
        tris = fine
    return [p for tri in tris for p in tri]


def build(data, clip, planar):
    binary = bytearray()
    views, access, meshes, nodes, samples, channels = [], [], [], [], [], []

    def add(rows, kind, vertex=False, bounds=False):
        offset = len(binary)
        for row in rows:
            binary.extend(struct.pack("<" + "f" * len(row), *row))
        view = {"buffer": 0, "byteOffset": offset, "byteLength": len(binary) - offset}
        if vertex:
            view["target"] = 34962
        views.append(view)
        item = {
            "bufferView": len(views) - 1,
            "componentType": 5126,
            "count": len(rows),
            "type": kind,
        }
        if bounds:
            # Bounds must describe stored float32 values.
            def f32(x):
                return struct.unpack("<f", struct.pack("<f", x))[0]

            item["min"] = [f32(min(col)) for col in zip(*rows)]
            item["max"] = [f32(max(col)) for col in zip(*rows)]
        access.append(item)
        return len(access) - 1

    past = clip["pose"]
    poses = past + [[x + y for x, y in zip(past[-1], d)] for d in clip["movement"]]
    norm = glyph()
    attr = {
        "POSITION": add([[v * 0.003 for v in p] for p in norm], "VEC3", True, True),
        "NORMAL": add(norm, "VEC3", True),
    }
    time = add([[i * 0.01] for i in range(len(poses))], "SCALAR", bounds=True)
    names = (
        ["Handle encoder"]
        if planar
        else ["Marker_1 — hand", "Pronation_Pt1 — proximal ulna"]
    )
    used = [COLORS[2]] if planar else COLORS[:2]
    mats = [
        {
            "name": n,
            "pbrMetallicRoughness": {
                "baseColorFactor": [*c, 1],
                "metallicFactor": 0,
                "roughnessFactor": 0.75,
            },
        }
        for n, c in zip(names, used)
    ]
    for i, name in enumerate(names):
        if planar:
            points = [[p[6] / 100, 0, -p[7] / 100] for p in poses]
        else:
            o = i * 3
            points = [[p[o], p[o + 2], -p[o + 1]] for p in poses]
        meshes.append(
            {
                "name": name + " glyph",
                "primitives": [{"attributes": attr, "material": i}],
            }
        )
        nodes.append({"name": name, "mesh": len(meshes) - 1, "translation": points[0]})
        samples.append(
            {"input": time, "output": add(points, "VEC3"), "interpolation": "STEP"}
        )
        channels.append(
            {
                "sampler": len(samples) - 1,
                "target": {"node": len(nodes) - 1, "path": "translation"},
            }
        )
        path_attr = {"POSITION": add(points, "VEC3", True, True)}
        meshes.append(
            {
                "name": name + " measured path",
                "primitives": [{"mode": 3, "attributes": path_attr, "material": i}],
            }
        )
        nodes.append(
            {"name": name + " path (entire 30 samples)", "mesh": len(meshes) - 1}
        )
    definition = (
        "Encoder XY cm to glTF metres: (X/100, 0, -Y/100)."
        if planar
        else "Shoulder-relative XYZ m to glTF metres: (X,Z,-Y)."
    )
    doc = {
        "asset": {
            "version": "2.0",
            "generator": "Interoceptomics reach-feedback",
            "copyright": "Chowdhury, Glaser and Miller, Dryad CC0.",
        },
        "scene": 0,
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": mats,
        "buffers": [{"byteLength": len(binary)}],
        "bufferViews": views,
        "accessors": access,
        "animations": [
            {
                "name": "10 ms measured positions",
                "samplers": samples,
                "channels": channels,
            }
        ],
        "extras": {
            "frame": definition,
            "source": data["source"],
            "sha256": data["sourceSHA256"],
            "workspace": clip["workspace"],
            "original": clip["original"],
            "firstMATRow": clip["k"] - 20,
            "cutoffMATRow": clip["k"],
            "lastMATRow": clip["k"] + 9,
            "timing": "glTF 0.20 s = prediction cutoff k. Glyphs have illustrative radii.",
        },
    }
    if "recording_block" in data:
        doc["extras"].update(
            recordingBlock=data["recording_block"],
            goOrdinal=data["go_ordinal"],
            updateAvailableMATRow=clip["k"]+10,
            firstLaterCountMATRow=clip["k"]+10,
            lastLaterCountMATRow=clip["k"]+19,
        )
    header = json.dumps(doc, separators=(",", ":")).encode()
    header += b" " * (-len(header) % 4)
    return (
        struct.pack("<4sII", b"glTF", 2, 28 + len(header) + len(binary))
        + struct.pack("<I4s", len(header), b"JSON")
        + header
        + struct.pack("<I4s", len(binary), b"BIN\0")
        + binary
    )


if __name__ == "__main__":
    data = json.loads(
        (HERE / "recordings.js")
        .read_text()
        .removeprefix("window.REACH_FEEDBACK = ")
        .strip()
        .removesuffix(";")
    )
    for c in data["clips"]:
        if c["eligible"]:
            for frame, planar in [("markers", False), ("handle", True)]:
                path = HERE / "models" / f"{c['split']}-{frame}.glb"
                path.parent.mkdir(exist_ok=True)
                path.write_bytes(build(data, c, planar))
