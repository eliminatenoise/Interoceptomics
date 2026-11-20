"""Export the two fingerprinted beam-balance excerpts. Requires Python 3.11+, NumPy and SciPy."""

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
import struct

import numpy as np
from scipy.io import loadmat

RATE = 256
CHANNELS = [
    f"{side}_leg_emg_{muscle}"
    for side in ("L", "R")
    for muscle in (
        "tibialis_anterior",
        "soleus",
        "medial_gastrocnemius",
        "peroneus_longus",
    )
]
AXES = ["mediolateral", "superiorinferior", "anteriorposterior"]
MARKERS = ["Mocap_sacrum_" + axis for axis in AXES]


def table(path):
    with path.open() as stream:
        return list(csv.DictReader(stream, delimiter="\t"))


def source_files(folder, signatures):
    paths = {}
    for ending, signature in signatures.items():
        matches = list(folder.glob("*_" + ending))
        if len(matches) != 1:
            raise ValueError(f"Expected one {ending} in the supplied session folder.")
        with matches[0].open("rb") as stream:
            if hashlib.file_digest(stream, "sha256").hexdigest() != signature:
                raise ValueError(f"Source fingerprint mismatch for {ending}.")
        paths[ending] = matches[0]
    return paths


def has_flat_run(series, start, stop):
    # Include up to 31 samples on each side so runs touching a boundary are detected.
    left = max(0, start - 31)
    x = series[left : stop + 31]
    equal = np.all(x[1:] == x[:-1], axis=1)
    cuts = np.flatnonzero(~equal) + 1
    for lo, hi in zip(np.r_[0, cuts], np.r_[cuts, len(x)]):
        if hi - lo >= 32 and left + lo < stop and left + hi > start:
            return True
    return False


def read_event(paths, posture):
    m = loadmat(paths["eeg.set"], squeeze_me=True, struct_as_record=False)["EEG"]
    rows = table(paths["channels.tsv"])
    names = [r["name"] for r in rows]
    assert [(c.labels, c.type, c.units) for c in m.chanlocs] == [
        (r["name"], r["type"], r["units"]) for r in rows
    ]
    n, channels = int(m.pnts), int(m.nbchan)
    assert channels == len(rows) and m.srate == RATE and m.trials == 1
    assert np.allclose(m.times, np.arange(n) * 1000 / RATE, atol=1e-8, rtol=0)
    assert paths["eeg.fdt"].stat().st_size == n * channels * 4
    assert json.loads(paths["eeg.json"].read_text())["SamplingFrequency"] == RATE
    indices = [names.index(k) for k in CHANNELS]
    markers = [names.index(k) for k in MARKERS]
    good = set(np.asarray(m.etc.good_chans, dtype=int) - 1)
    assert all(i in good for i in indices + markers)
    assert all(
        (rows[i]["units"], rows[i]["type"]) == ("microV", "EMG") for i in indices
    )
    assert all((rows[i]["units"], rows[i]["type"]) == ("mm", "MISC") for i in markers)
    electrode_rows = {r["name"]: r for r in table(paths["electrodes.tsv"])}
    assert all(
        electrode_rows[k][axis] == "n/a" for k in CHANNELS for axis in ("x", "y", "z")
    )
    # Under the fixed selection, the first eligible event in both files is event one.
    event = table(paths["events.tsv"])[0]
    original = m.event[0]
    expected = "M_on_CCW_" + ("SVZ" if posture == "standing" else "WVZ")
    assert original.type == m.urevent[int(original.urevent) - 1].type == expected
    assert event["value"] == "rotate_ccw" and float(event["duration"]) == 0.5
    fraction, onset = float(event["sample"]), float(event["onset"])
    assert (
        abs(fraction - (original.latency - 1)) <= 0.01
        and abs(fraction - onset * RATE) <= 0.01
    )
    first = math.ceil(fraction)
    assert first == math.ceil(original.latency - 1) == math.ceil(onset * RATE)
    cutoff, start, end = first + 32, first - 127, first + 64
    assert cutoff == 13032 if posture == "standing" else cutoff == 10518
    source = np.memmap(paths["eeg.fdt"], mode="r", dtype="<f4", shape=(n, channels))
    observed = source[start : end + 1, indices].astype(np.float64)
    pos = source[start : end + 1, markers].astype(np.float64)
    electrical = [i for i in good if rows[i]["type"] in ("EEG", "EOG", "EMG")]
    assert np.isfinite(source[start : cutoff + 1, electrical]).all()
    assert np.isfinite(observed).all() and not (observed == 0).all(axis=1).any()
    for col in indices:
        assert not has_flat_run(source[:, col : col + 1], start, end + 1)
    guard_start, guard_stop = start - 8, end + 9
    guarded = source[guard_start:guard_stop, markers].astype(np.float64)
    assert np.isfinite(guarded).all() and not (guarded == 0).all(axis=1).any()
    assert np.linalg.norm(np.diff(guarded, axis=0), axis=1).max() <= 20
    assert not has_flat_run(
        source[:, markers[0] : markers[-1] + 1], guard_start, guard_stop
    )

    def rms(segment):
        return np.sqrt(np.mean(segment**2, axis=0)).tolist()

    return dict(
        start=start,
        end=end,
        first=first,
        cutoff=cutoff,
        onsetSeconds=onset,
        loggedSample=fraction,
        originalLatency=float(original.latency),
        direction="counterclockwise",
        voltage=observed[:160].tolist(),
        previousRMS=rms(observed[128:160]),
        nextRMS=rms(observed[160:]),
        position=pos.tolist(),
    )


def export_glb(event, posture, path):
    """Store original frame order as two meter-scale line strips joined at the cutoff."""
    positions = np.asarray(event["position"])
    displacement = np.asarray((positions - positions[159]) / 1000, dtype="<f4")
    data = bytearray()
    acc, views, meshes, nodes = [], [], [], []
    for i, (name, values, interval) in enumerate(
        [
            ("Through cutoff", displacement[:160], [event["start"], event["cutoff"]]),
            ("Cutoff to 125 ms", displacement[159:], [event["cutoff"], event["end"]]),
        ]
    ):
        views.append(
            dict(buffer=0, byteOffset=len(data), byteLength=values.nbytes, target=34962)
        )
        data.extend(values.tobytes())
        acc.append(
            dict(
                bufferView=i,
                componentType=5126,
                count=len(values),
                type="VEC3",
                min=values.min(axis=0).tolist(),
                max=values.max(axis=0).tolist(),
            )
        )
        meshes.append(
            dict(
                name=name,
                primitives=[dict(attributes={"POSITION": i}, mode=3, material=i)],
            )
        )
        nodes.append(
            dict(name=name, mesh=i, extras={"inclusiveSourceSamples": interval})
        )
    colors = [[0.13, 0.50, 0.64, 1], [0.83, 0.34, 0.09, 1]]
    mats = [
        dict(
            pbrMetallicRoughness=dict(
                baseColorFactor=c, metallicFactor=0, roughnessFactor=1
            )
        )
        for c in colors
    ]
    obj = dict(
        asset={"version": "2.0", "generator": "Interoceptomics"},
        scene=0,
        scenes=[dict(name=posture.title() + " sacrum", nodes=[0, 1])],
        nodes=nodes,
        meshes=meshes,
        materials=mats,
        accessors=acc,
        bufferViews=views,
        buffers=[dict(byteLength=len(data))],
        extras=dict(
            clockHz=RATE,
            originSample=event["cutoff"],
            originSourceMm=positions[159].tolist(),
            axes="glTF XYZ = source ML, SI, AP; anatomical polarity unverified",
            loggedOnsetSeconds=event["onsetSeconds"],
            zeroBasedLoggedSample=event["loggedSample"],
        ),
    )
    meta = json.dumps(obj, separators=(",", ":")).encode()
    meta += b" " * (-len(meta) % 4)
    chunks = (
        struct.pack("<I4s", len(meta), b"JSON")
        + meta
        + struct.pack("<I4s", len(data), b"BIN\0")
        + data
    )
    path.write_bytes(struct.pack("<4sII", b"glTF", 2, 12 + len(chunks)) + chunks)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ("standing", "walking", "output"):
        parser.add_argument(arg, type=Path)
    args = parser.parse_args()
    signatures = json.loads(Path(__file__).with_name("inputs.json").read_text())
    args.output.mkdir(exist_ok=True, parents=True)
    events = {}
    for posture in ("standing", "walking"):
        events[posture] = read_event(
            source_files(getattr(args, posture), signatures[posture]), posture
        )
        export_glb(events[posture], posture, args.output / (posture + ".glb"))
    (args.output / "recordings.js").write_text(
        "const sessions = "
        + json.dumps(events, allow_nan=False, separators=(",", ":"))
        + ";\n"
    )
