"""Create the cross-limb reader's two excerpts and the native-trajectory GLBs."""
import argparse
import csv
import hashlib
import json
import math
import struct
from pathlib import Path

import numpy as np
from scipy.io import loadmat


WAY_MEMBER = "d4f321b39028e16518e063ce6222bb281947b1127e5a42499420ccd812615ab5"
BALANCE = {
    "eeg.fdt": "d7c32f511fe5a83f312c7a34ac1a5c4915953d26ab50cb4b10c6adfefa7bf4d8",
    "channels.tsv": "450a4ad8cbc013b0955936db0d111eee8ef52d51ca8c24dcce9a04ca112f8155",
    "events.tsv": "8edda35e4bfe9bb34447c6c7660760eac556e02ea8ef3260aa74e510d8ac6887",
}
ARM_NAMES = ["Anterior deltoid", "Brachioradialis", "Flexor digitorum",
             "Common extensor digitorum", "First dorsal interosseous"]
SOURCE_ARM_NAMES = ["Anterior Deltoid", "Brachoradial", "Flexor Digitorum",
                    "Common Extensor Digitorum", "First Dorsal Interosseus"]
LEG_NAMES = ["tibialis anterior", "soleus", "medial gastrocnemius", "peroneus longus"]


def checked_file(path, digest):
    with path.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != digest:
            raise ValueError(f"Unexpected file fingerprint for {path.name}")
    return path


def summarize(voltage, size):
    """24 successive 31.25 ms bins, then the two 125 ms windows around cutoff."""
    assert voltage.shape[0] == 24 * size and np.isfinite(voltage).all()
    def rms(array):
        return np.sqrt(np.mean(array ** 2, axis=0)).tolist()
    return dict(bins=[rms(voltage[i:i+size]) for i in range(0, len(voltage), size)],
                previous=rms(voltage[16*size:20*size]), following=rms(voltage[20*size:]))


def arm(path):
    study = loadmat(checked_file(path, WAY_MEMBER), variable_names=["ws"], simplify_cells=True)["ws"]
    t = study["win"][0]
    names = list(study["names"]["kin"])
    cols = [names.index(f"P{k}4 - position {k} sensor 4") for k in "xyz"]
    assert cols == [21, 25, 29] and list(study["names"]["emg"]) == SOURCE_ARM_NAMES
    cutoff = t["LEDon"] + 0.4
    pose_t = np.array(t["eeg_t"])
    emg_t = np.array(t["emg_t"])
    k = np.argmin(abs(pose_t - cutoff))
    e = np.argmin(abs(emg_t - cutoff))
    knots = np.arange(-313, 64)
    electrodes = np.arange(-2499, 501)
    assert np.max(abs(pose_t[k + knots] - cutoff - knots / 500)) < 1e-9
    assert np.max(abs(emg_t[e + electrodes] - cutoff - electrodes / 4000)) < 1e-9
    xyz = np.array(t["kin"][k + knots][:, cols], dtype=float)
    volts = np.array(t["emg"][e + electrodes], dtype=float)
    assert np.isfinite(xyz).all() and not np.any(np.all(xyz == 0, axis=1))
    return dict(first=-313, hz=500, cueMs=-400, factorMm=10, sourceUnit="cm",
                axes=["X", "Y", "Z"], muscles=ARM_NAMES, emgUnit="source units",
                xyz=xyz.tolist(), rms=summarize(volts, 125))


def leg(directory):
    files = {}
    for suffix, digest in BALANCE.items():
        match, = directory.glob("*_task-rotatewalk_" + suffix)
        files[suffix] = checked_file(match, digest)
    with files["channels.tsv"].open() as stream:
        channels = list(csv.DictReader(stream, delimiter="\t"))
    with files["events.tsv"].open() as stream:
        first = next(csv.DictReader(stream, delimiter="\t"))
    assert first["value"] == "rotate_ccw" and float(first["duration"]) == 0.5
    sample = float(first["sample"])
    cutoff = math.ceil(sample) + 32
    assert abs(float(first["onset"]) * 256 - sample) < 0.01
    names = [item["name"] for item in channels]
    axes = ["mediolateral", "superiorinferior", "anteriorposterior"]
    pose_cols = [names.index("Mocap_sacrum_" + axis) for axis in axes]
    muscles = [names.index(side + "_leg_emg_" + m.replace(" ", "_"))
               for side in ["L", "R"] for m in LEG_NAMES]
    assert all(channels[i]["units"] == "microV" for i in muscles)
    assert all(channels[i]["units"] == "mm" for i in pose_cols)
    with files["eeg.fdt"].open("rb") as stream:
        stream.seek((cutoff - 159) * len(channels) * 4)
        rows = np.fromfile(stream, dtype="<f4", count=192*len(channels)).reshape(192, -1)
    xyz = rows[:, pose_cols].astype(float)
    assert np.isfinite(xyz).all() and not np.any(np.all(xyz == 0, axis=1))
    return dict(first=-159, hz=256, cueMs=1000*(sample - cutoff)/256, factorMm=1, sourceUnit="mm",
                axes=["ML", "SI", "AP"], muscles=[side+" "+m for side in ["Left", "Right"] for m in LEG_NAMES],
                emgUnit="µV", xyz=xyz.tolist(), rms=summarize(rows[:, muscles].astype(float), 8))


def glb(key, observation):
    points = np.array(observation["xyz"])
    cutoff = -observation["first"]
    metres = (points - points[cutoff]) * (observation["factorMm"] / 1000)
    positions = metres.astype("<f4")
    payload = positions.tobytes()
    count = len(points)
    meta = {
        "asset": {"version": "2.0", "generator": "Interoceptomics"},
        "scene": 0, "scenes": [{"nodes": [0]}],
        "nodes": [{"name": key+" trajectory in its recording frame", "mesh": 0}],
        "meshes": [{"primitives": [{"mode": 3, "attributes": {"POSITION": 0}}]}],
        "accessors": [{"bufferView": 0, "componentType": 5126, "type": "VEC3", "count": count,
                       "min": positions.min(axis=0).tolist(), "max": positions.max(axis=0).tolist()}],
        "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": len(payload), "target": 34962}],
        "buffers": [{"byteLength": len(payload)}],
        "extras": {"frame": observation["axes"], "lengthUnit": "m", "sampleRateHz": observation["hz"],
                   "firstSampleRelativeToCutoff": observation["first"], "cutoffVertex": cutoff,
                   "nativeUnit": observation["sourceUnit"], "originInNativeUnits": points[cutoff].tolist(),
                   "axisOrder": "Source component order preserved. No anatomical registration."},
    }
    header = json.dumps(meta, separators=(",", ":"), allow_nan=False).encode()
    header += b" " * (-len(header) % 4)
    return (struct.pack("<4sII", b"glTF", 2, 28+len(header)+len(payload)) +
            struct.pack("<I4s", len(header), b"JSON") + header +
            struct.pack("<I4s", len(payload), b"BIN\0") + payload)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("wrist_mat", type=Path)
    parser.add_argument("walking_directory", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = {"wrist": arm(args.wrist_mat), "sacrum": leg(args.walking_directory)}
    args.output.mkdir(parents=True, exist_ok=True)
    js = "const recordings = " + json.dumps(data, separators=(",", ":"), allow_nan=False) + ";\n"
    (args.output/"recordings.js").write_text(js, encoding="utf-8")
    for key, sample in data.items():
        (args.output/(key+".glb")).write_bytes(glb(key, sample))


if __name__ == "__main__":
    main()
