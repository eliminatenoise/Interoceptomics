"""Rebuild one excerpt and two glTF models from the archived walking session.

Usage: python build.py PATH_TO_ORIGINAL_FILES [OUTPUT_DIRECTORY]
Requires Python, NumPy and SciPy. Accepts only the seven fingerprinted inputs.
"""

import argparse
import csv
import hashlib
import json
import math
import struct
from pathlib import Path

import numpy as np
from scipy.io import loadmat

INPUTS = {
    "channels.tsv": "450a4ad8cbc013b0955936db0d111eee8ef52d51ca8c24dcce9a04ca112f8155",
    "coordsystem.json": "38cbd743cd80f8243716dcfe326138c49c124855551fbed50f935724a5ee71d3",
    "eeg.fdt": "d7c32f511fe5a83f312c7a34ac1a5c4915953d26ab50cb4b10c6adfefa7bf4d8",
    "eeg.json": "980cac42630d3c6a75b50459ce5f75fa13d3ae4d89ee86a587d62265c1e9fbcd",
    "eeg.set": "d7a1a16a36e76f7e659d7e6ccec7d56835bf6950a884c544b85f4b07c16da7e5",
    "electrodes.tsv": "98aca23af52f5d1547f609e5933369c683f8e3c1850bec5a4ee3e181f2ab4710",
    "events.tsv": "8edda35e4bfe9bb34447c6c7660760eac556e02ea8ef3260aa74e510d8ac6887",
}
RATE = 256
COLOR_LIMIT = 40
BLUE, WHITE, RED, MASKED = (
    (87, 172, 252),
    (233, 235, 230),
    (247, 121, 95),
    (91, 103, 108),
)


def read_table(path):
    with path.open() as stream:
        return list(csv.DictReader(stream, delimiter="\t"))


def excerpt(folder):
    paths = {}
    for ending, expected in INPUTS.items():
        matches = list(folder.glob("*_" + ending))
        if len(matches) != 1:
            raise ValueError(f"Supply one source file for {ending}.")
        with matches[0].open("rb") as stream:
            if hashlib.file_digest(stream, "sha256").hexdigest() != expected:
                raise ValueError(f"Fingerprint mismatch for {ending}.")
        paths[ending] = matches[0]
    channels = read_table(paths["channels.tsv"])
    labels = [r["name"] for r in channels]
    e = loadmat(paths["eeg.set"], squeeze_me=True, struct_as_record=False)["EEG"]
    coord = json.loads(paths["coordsystem.json"].read_text())
    assert (
        coord["EEGCoordinateSystem"],
        coord["EEGCoordinateUnits"],
        coord["EEGCoordinateSystemDescription"],
    ) == ("CTF", "mm", "EEGLAB")
    assert (e.nbchan, e.srate, e.pnts) == (149, RATE, 165382)
    assert e.chaninfo.nosedir == "+X" and [q.labels for q in e.chanlocs] == labels
    assert all(r["units"] == "microV" for r in channels[:141])
    assert all(r["units"] == "mm" for r in channels[141:147])
    source = np.memmap(
        paths["eeg.fdt"], mode="r", dtype="<f4", shape=(int(e.pnts), int(e.nbchan))
    )
    row = next(
        r for r in read_table(paths["events.tsv"]) if r["value"].startswith("rotate_")
    )
    event = float(row["sample"])
    assert (
        row["value"] == "rotate_ccw" and abs(float(row["onset"]) * RATE - event) < 0.001
    )
    assert (
        sum(
            ev.type == "M_on_CCW_WVZ" and abs(ev.latency - 1 - event) < 0.01
            for ev in e.event
        )
        == 1
    )
    first_post = math.ceil(event)
    cutoff = first_post + 32
    start, end = cutoff - 159, cutoff + 32
    axes = ("mediolateral", "superiorinferior", "anteriorposterior")
    motion_names = [
        f"Mocap_{part}_{axis}" for part in ("sacrum", "head") for axis in axes
    ]
    assert labels[141:147] == motion_names
    expanded = source[start - 8 : end + 9, 141:147].astype(float).reshape(-1, 2, 3)
    assert np.isfinite(expanded).all() and not np.any(np.all(expanded == 0, axis=2))
    assert np.max(np.linalg.norm(np.diff(expanded, axis=0), axis=2)) <= 20
    positions = np.array([[q.X, q.Y, q.Z] for q in e.chanlocs[:133]])
    tsv = read_table(paths["electrodes.tsv"])
    assert [r["name"] for r in tsv] == labels
    rounded = np.array([[float(r[k]) for k in ("x", "y", "z")] for r in tsv[:133]])
    assert np.max(np.abs(positions - rounded)) <= 0.0050001
    good = set(np.asarray(e.etc.good_chans, dtype=int) - 1)
    sites = []
    for i in range(141):
        site = {"label": labels[i], "good": i in good}
        if i < 133:
            site["xyz_m"] = positions[i].round(7).tolist()
        if i in good:
            trace = source[start : cutoff + 1, i].astype(float)
            assert np.isfinite(trace).all()
            site["uv"] = trace.round(4).tolist()
        sites.append(site)
    motion = source[start : end + 1, 141:147].astype(float) - source[
        cutoff, 141:147
    ].astype(float)
    return {
        "rate": RATE,
        "start": start,
        "logged": event,
        "cutoff": cutoff,
        "end": end,
        "direction": "counterclockwise",
        "limit_uv": COLOR_LIMIT,
        "sites": sites,
        "movement_mm": motion.round(5).reshape(-1, 2, 3).tolist(),
    }


def color(uv):
    if uv is None:
        return MASKED
    edge = RED if uv >= 0 else BLUE
    fraction = min(1, abs(uv) / COLOR_LIMIT)
    return tuple(math.floor(a + (b - a) * fraction + 0.5) for a, b in zip(WHITE, edge))


class Model:
    """Meter-scale glTF with named meshes; no external buffers or extensions."""

    def __init__(self, title):
        self.binary = bytearray()
        self.doc = {
            "asset": {"version": "2.0", "generator": "Interoceptomics"},
            "scene": 0,
            "scenes": [{"name": title, "nodes": []}],
            "nodes": [],
            "meshes": [],
            "materials": [],
            "bufferViews": [],
            "accessors": [],
        }

    def field(self, data, kind):
        points = np.ascontiguousarray(data, dtype="<f4")
        views, acc = self.doc["bufferViews"], self.doc["accessors"]
        views.append(
            {
                "buffer": 0,
                "byteOffset": len(self.binary),
                "byteLength": points.nbytes,
                "target": 34962,
            }
        )
        self.binary.extend(points.tobytes())
        acc.append(
            {
                "bufferView": len(views) - 1,
                "componentType": 5126,
                "count": len(points),
                "type": kind,
                "min": points.min(axis=0).tolist(),
                "max": points.max(axis=0).tolist(),
            }
        )
        return len(acc) - 1

    def mesh(self, name, pos, rgb, mode=4):
        linear = [
            ((v / 255 + 0.055) / 1.055) ** 2.4 if v / 255 > 0.04045 else v / 255 / 12.92
            for v in rgb
        ]
        mats = self.doc["materials"]
        mats.append(
            {
                "name": name,
                "doubleSided": True,
                "pbrMetallicRoughness": {
                    "baseColorFactor": [*linear, 1],
                    "metallicFactor": 0,
                    "roughnessFactor": 0.92,
                },
            }
        )
        self.doc["meshes"].append(
            {
                "name": name,
                "primitives": [
                    {
                        "attributes": {"POSITION": pos},
                        "mode": mode,
                        "material": len(mats) - 1,
                    }
                ],
            }
        )
        return len(self.doc["meshes"]) - 1

    def node(self, name, mesh, **kwargs):
        self.doc["scenes"][0]["nodes"].append(len(self.doc["nodes"]))
        self.doc["nodes"].append(dict(name=name, mesh=mesh, **kwargs))

    def write(self, path):
        self.doc["buffers"] = [{"byteLength": len(self.binary)}]
        info = json.dumps(self.doc, separators=(",", ":")).encode()
        info += b" " * (-len(info) % 4)
        chunks = (
            struct.pack("<I4s", len(info), b"JSON")
            + info
            + struct.pack("<I4s", len(self.binary), b"BIN\0")
            + self.binary
        )
        path.write_bytes(struct.pack("<4sII", b"glTF", 2, len(chunks) + 12) + chunks)


def sphere():
    points = []

    def at(i, j):
        a, b = np.pi * i / 8, 2 * np.pi * j / 16
        return [np.sin(a) * np.cos(b), np.cos(a), np.sin(a) * np.sin(b)]

    for i in range(8):
        for j in range(16):
            if i > 0:
                points.extend([at(i, j), at(i, j + 1), at(i + 1, j)])
            if i < 7:
                points.extend([at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)])
    return points


def exports(d, dest):
    cap = Model("Recorded scalp potentials at the observation cutoff")
    pos = cap.field(sphere(), "VEC3")
    for site in d["sites"][:128]:
        x, y, z = site["xyz_m"]
        uv = site["uv"][-1] if site["good"] else None
        mesh = cap.mesh(site["label"], pos, color(uv))
        cap.node(
            site["label"],
            mesh,
            translation=[x, z, -y],
            scale=[0.0023] * 3,
            extras={
                "authorGood": site["good"],
                "potentialMicrovolts": uv,
                "sourceXYZmetres": [x, y, z],
            },
        )
    cap.doc["extras"] = {
        "clockHz": RATE,
        "sample": d["cutoff"],
        "sourceToGLTF": "[X,Z,-Y] in metres",
        "colorScaleMicrovolts": [-COLOR_LIMIT, 0, COLOR_LIMIT],
    }
    cap.write(dest / "scalp-at-cutoff.glb")
    motion = Model("Two recorded marker paths relative to their own cutoff")
    unit = motion.field(sphere(), "VEC3")
    for i, (part, rgb) in enumerate(
        [("Sacrum", (243, 195, 106)), ("Head", (160, 209, 239))]
    ):
        path = np.asarray(d["movement_mm"])[:, i, :] / 1000
        line = motion.field(path, "VEC3")
        mesh = motion.mesh(part + " path", line, rgb, mode=3)
        motion.node(
            part + " path",
            mesh,
            extras={"firstSample": d["start"], "lastSample": d["end"]},
        )
        mesh = motion.mesh(part + " endpoint", unit, rgb)
        motion.node(
            part + " endpoint", mesh, translation=path[-1].tolist(), scale=[0.0013] * 3
        )
    motion.doc["extras"] = {
        "clockHz": RATE,
        "originSample": d["cutoff"],
        "coordinates": "Each marker relative to its own cutoff. glTF XYZ = source ML, SI, AP in metres. Marker paths overlap at zero by construction.",
    }
    motion.write(dest / "marker-paths.glb")


if __name__ == "__main__":
    arg = argparse.ArgumentParser(description=__doc__)
    arg.add_argument("source", type=Path)
    arg.add_argument(
        "output",
        type=Path,
        nargs="?",
        default=Path(__file__).resolve().parents[2] / "docs/visual-balance",
    )
    args = arg.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    data = excerpt(args.source)
    (args.output / "excerpt.js").write_text(
        "const recording = "
        + json.dumps(data, allow_nan=False, separators=(",", ":"))
        + ";\n"
    )
    exports(data, args.output)
