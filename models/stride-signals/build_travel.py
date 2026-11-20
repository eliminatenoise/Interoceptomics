"""Derive paired 200 ms displacements from original 100 Hz walking records."""
import argparse
from collections import Counter, defaultdict
from hashlib import sha256
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory
from zipfile import ZipFile

import ezc3d
import numpy as np

from build_stride import (
    ARCHIVE_HASH, MARKERS, OmitTrial, file_hash, position_frame, stride_clock,
    training_members,
)

LAG = 20
MIN_WALKERS = 3
TRAIN_HASH = "b25bacdbb2156d5bd933ca771bb0af57c85712f2638fbe69c0de824160738be8"


def frame_clock(seconds):
    frame = np.asarray(seconds) * 100.
    half = np.rint(frame * 2.) / 2.
    return np.where(abs(frame - half) <= 0.0001, half, frame)


def measure(c):
    start, end, _, times = stride_clock(c)
    _, native, axes, _, origin = position_frame(c, times)
    first = max(0, int(np.ceil(frame_clock(start))))
    last = min(len(native) - 1, int(np.floor(frame_clock(end))))
    at = np.clip(np.floor(frame_clock(times) + 0.5).astype(int), first, last)
    inside = at + LAG <= last
    starts = native[at[inside]]
    ends = native[at[inside] + LAG]
    valid = np.isfinite(starts).all(axis=-1) & np.isfinite(ends).all(axis=-1)
    # Seven quantities from the same pair, with magnitude calculated BEFORE averaging.
    delta_mm = (ends - starts) @ axes.T * 1000.
    paired = np.concatenate((
        (starts - origin) @ axes.T * 1000., delta_mm,
        np.linalg.norm(delta_mm, axis=-1, keepdims=True),
    ), axis=-1)
    result = np.full((len(times), len(MARKERS), 7), np.nan)
    result[inside] = np.where(valid[:, :, None], paired, np.nan)
    return result


def select_directory(directory):
    groups = defaultdict(list)
    files = sorted(directory.glob("*.c3d"))
    if len(files) != 90:
        raise ValueError("Expected exactly the 90 selected C2 records in this directory")
    digest = sha256()
    for path in files:
        match = re.fullmatch(r"(\d{7})_C2_(0[123])\.c3d", path.name)
        if not match:
            raise ValueError("Unexpected training filename")
        digest.update(bytes.fromhex(file_hash(path)))
        groups[match[1]].append(path)
    if len(groups) != 30 or any(len(group) != 3 for group in groups.values()) or digest.hexdigest() != TRAIN_HASH:
        raise ValueError("Selected training records differ from the verified source")
    return groups


def build(directory):
    groups = select_directory(directory)
    omissions = Counter()
    by_person = []
    stride_counts = np.zeros((101, len(MARKERS)), dtype=int)
    eligible = 0
    for paths in groups.values():
        rows = []
        for path in paths:
            try:
                rows.append(measure(ezc3d.c3d(str(path), extract_forceplat_data=True)))
            except OmitTrial as reason:
                omissions[str(reason)] += 1
        if rows:
            eligible += len(rows)
            n = np.sum(np.isfinite(np.stack(rows)[:, :, :, 0]), axis=0)
            stride_counts += n
            by_person.append(np.divide(
                np.nansum(rows, axis=0), n[:, :, None],
                out=np.full_like(rows[0], np.nan), where=n[:, :, None] > 0,
            ))
    if not by_person:
        raise ValueError("No eligible walking records")
    n = np.sum(np.isfinite(np.stack(by_person)[:, :, :, 0]), axis=0)
    means = np.divide(np.nansum(by_person, axis=0), n[:, :, None],
                      out=np.full_like(by_person[0], np.nan), where=n[:, :, None] >= MIN_WALKERS)
    markers = []
    for j, marker in enumerate(MARKERS):
        row = {"id": marker, "n_walkers": n[:, j].tolist(), "n_strides": stride_counts[:, j].tolist()}
        for name, columns in (("start_mm", slice(0, 3)), ("delta_mm", slice(3, 6)),
                              ("mean_endpoint_distance_mm", 6)):
            row[name] = [np.round(means[k, j, columns], 3).tolist() if n[k, j] >= MIN_WALKERS else None
                         for k in range(101)]
        markers.append(row)
    return {
        "schema_version": 1, "phase_pct": list(range(101)), "axes": ["forward", "left", "up"],
        "unit": "mm", "point_rate_hz": 100, "lag_frames": LAG, "minimum_walkers": MIN_WALKERS,
        "planned_walkers": len(groups), "eligible_walkers": len(by_person), "planned_strides": 90,
        "eligible_strides": eligible, "omissions": dict(omissions), "markers": markers,
        "source": "https://doi.org/10.6084/m9.figshare.7734767.v8", "license": "CC BY 4.0",
    }


def from_archive(path):
    if file_hash(path) != ARCHIVE_HASH:
        raise ValueError("Original source ZIP fingerprint mismatch")
    with ZipFile(path) as archive, TemporaryDirectory() as temp:
        directory = Path(temp)
        for walks in training_members(archive).values():
            for _, name in walks:
                (directory / Path(name).name).write_bytes(archive.read(name))
        return build(directory)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--archive", type=Path, help="Original version 8 walking ZIP")
    source.add_argument("--train-dir", type=Path, help="Directory with only the 90 verified C2 records")
    parser.add_argument("--out", type=Path, default=Path(__file__).with_name("marker-travel.json"))
    args = parser.parse_args()
    packet = from_archive(args.archive) if args.archive else build(args.train_dir)
    args.out.write_text(json.dumps(packet, separators=(",", ":"), allow_nan=False) + "\n")
