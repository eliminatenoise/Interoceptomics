"""Reproduce the CC0 upper-body illustration from three pinned MakeHuman assets."""
import argparse
import base64
import hashlib
import json
import struct
import urllib.request
from collections import defaultdict
from pathlib import Path
from statistics import mean

HERE = Path(__file__).resolve().parent
ROOT = "https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/"
SOURCES = {
    "3dobjs/base.obj": "8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c",
    "rigs/default.mhskel": "99f179bce0aa850b45d4191a1d0d234c5851f881c057439470ded3bddf729a24",
    "rigs/default_weights.mhw": "0f3641d651ae3d00ad6b4ccee43142edb109d3bd909d27d9e4139ef1beed8625",
}


def source(name, folder):
    data = (folder / Path(name).name).read_bytes() if folder else urllib.request.urlopen(ROOT + name, timeout=30).read()
    if hashlib.sha256(data).hexdigest() != SOURCES[name]:
        raise ValueError("Reference asset differs from the pinned edition: " + name)
    return data.decode()


def encoded(values, letter):
    return base64.b64encode(struct.pack("<" + str(len(values)) + letter, *values)).decode("ascii")


def build(folder):
    vertices = []
    faces = []
    group = None
    for line in source("3dobjs/base.obj", folder).splitlines():
        if line.startswith("v "):
            vertices.append(tuple(map(float, line[2:].split())))
        elif line.startswith("g "):
            group = line[2:].strip()
        elif line.startswith("f ") and group == "body":
            indices = [int(x.split("/")[0]) - 1 for x in line[2:].split()]
            if max(vertices[i][1] for i in indices) >= 1.40 or all(abs(vertices[i][0]) > 3 and vertices[i][1] > 0 for i in indices):
                for i in range(1, len(indices) - 1):
                    faces.append((indices[0], indices[i], indices[i+1]))

    joints = json.loads(source("rigs/default.mhskel", folder))["joints"]
    landmarks = {}
    for side in ("R", "L"):
        for label, bone in (("Shoulder", "upperarm01"), ("Elbow", "lowerarm01"), ("Wrist", "wrist")):
            indices = joints[bone + "." + side + "____head"]
            landmarks[side + "_" + label] = [round(mean(vertices[i][d] for i in indices), 5) for d in range(3)]

    # Collapse the graphical arm weights into two rigid segments on each side.
    weights = defaultdict(lambda: [0.0, 0.0])
    for bone, pairs in json.loads(source("rigs/default_weights.mhw", folder))["weights"].items():
        if bone.startswith(("upperarm", "lowerarm", "wrist", "finger", "metacarpal")):
            slot = 0 if bone.startswith("upperarm") else 1
            for i, weight in pairs:
                weights[i][slot] += weight
    # Cut the torso against a single waist plane; retain the complete hands.
    edge_vertices = {}
    def crossing(a, b):
        key = tuple(sorted((a, b)))
        if key not in edge_vertices:
            p, q = vertices[a], vertices[b]
            t = (1.40 - p[1]) / (q[1] - p[1])
            vertex = len(vertices)
            vertices.append(tuple(x + t * (y - x) for x, y in zip(p, q)))
            weights[vertex] = [x + t * (y - x) for x, y in zip(weights[a], weights[b])]
            edge_vertices[key] = vertex
        return edge_vertices[key]

    clipped = []
    for face in faces:
        if all(abs(vertices[i][0]) > 3 and vertices[i][1] > 0 for i in face):
            clipped.append(face)
            continue
        polygon = []
        for a, b in zip(face, (*face[1:], face[0])):
            inside = vertices[a][1] >= 1.40
            if inside:
                polygon.append(a)
            if inside != (vertices[b][1] >= 1.40):
                polygon.append(crossing(a, b))
        for i in range(1, len(polygon) - 1):
            clipped.append((polygon[0], polygon[i], polygon[i+1]))
    faces = clipped
    used = sorted({i for face in faces for i in face})
    index = {old: new for new, old in enumerate(used)}
    positions = [round(x * 1000) for i in used for x in vertices[i]]
    skin = []
    for i in used:
        a, b = weights[i]
        denominator = max(1, a + b)
        upper = round(a / denominator * 255)
        skin.extend((upper, min(255 - upper, round(b / denominator * 255))))
    return dict(joints=landmarks, positions=encoded(positions, "h"), skin=encoded(skin, "B"),
                indices=encoded([index[i] for f in faces for i in f], "H"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, help="Existing directory containing the three original files")
    parser.add_argument("--output", type=Path, default=HERE / "surface.js")
    args = parser.parse_args()
    result = json.dumps(build(args.source_dir), separators=(",", ":"))
    args.output.write_text("/* Derived from MakeHuman hm08, CC0. See METHODS.md. */\nconst WristSurface = " + result + ";\n")
