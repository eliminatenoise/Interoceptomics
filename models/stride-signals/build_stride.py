"""Rebuild the aggregate overground reference from the publication's original files."""

import argparse
from collections import Counter, defaultdict
from hashlib import sha256
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory
import warnings
import xml.etree.ElementTree as ET
from zipfile import ZipFile

import ezc3d
import numpy as np


ARCHIVE_HASH = "e11f0f85424e7630d32dbeb8b37bf78d470dcb34c0f461417671ce7d146eaec5"
SUPPLEMENT_HASH = "37281bfdef06280d63019cb3008ea081f360f40d7a0cceb83293cc9aeae027d8"
PROTOCOL_HASH = "5d636d37bff286db45b377c6b58061f12bb27fd5e4fd7c24f4e337c01ba01c42"
COVERAGE_HASH = "2de8f103c35f2b6c812c7b481a6e00cfde6f8c612c119b75457ca57ac84e81d0"
SITES = {
    "IAS": "Anterior superior iliac spine", "IPS": "Posterior superior iliac spine",
    "FTC": "Greater trochanter", "FLE": "Lateral femoral epicondyle",
    "FME": "Medial femoral epicondyle", "FAX": "Fibular head",
    "TTC": "Tibial tuberosity", "FAL": "Lateral malleolus", "TAM": "Medial malleolus",
    "FCC": "Heel", "FM1": "First metatarsal head", "FM2": "Second metatarsal head",
    "FM5": "Fifth metatarsal head", "SIA": "Scapular marker SIA",
    "SRS": "Scapular spine root", "SAA": "Acromial angle", "SAE": "Acromial edge",
    "HLE": "Lateral humeral epicondyle", "HME": "Medial humeral epicondyle",
    "UOA": "Olecranon", "RSP": "Radial styloid", "UHE": "Ulnar styloid",
    "HM2": "Second metacarpal head", "HM5": "Fifth metacarpal head",
}
MIDLINE = {"CV7": "Seventh cervical vertebra", "TV10": "Tenth thoracic vertebra",
           "SXS": "Sternal marker SXS", "SJN": "Sternal marker SJN"}
MARKERS = [f"{s}_{k}" for s in ("L", "R") for k in SITES] + list(MIDLINE)
MUSCLES = {
    "tibialis_anterior": "Tibialis anterior", "soleus": "Soleus",
    "gastrocnemius_medialis": "Medial gastrocnemius", "vastus_medialis": "Vastus medialis",
    "rectus_femoris": "Rectus femoris", "semitendinosus": "Semitendinosus",
    "gluteus_maximus": "Gluteus maximus", "gluteus_medius": "Gluteus medius",
}
FORCES = {"plate1_up": "Plate 1 · vertical", "plate2_up": "Plate 2 · vertical",
          "right_contact_forward": "Right contact · forward", "right_contact_left": "Right contact · left",
          "right_contact_up": "Right contact · vertical"}
FEET = ("FCC", "FM1", "FM2", "FM5")
PELVIS = [f"{s}_{a}" for s in ("L", "R") for a in ("IAS", "IPS")]
PHASE = np.linspace(0., 1., 101)
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


class OmitTrial(ValueError):
    """A predetermined trial fails the registered eligibility checks."""


def file_hash(path):
    digest = sha256()
    with open(path, "rb") as stream:
        for block in iter(lambda: stream.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def training_members(archive):
    groups = defaultdict(list)
    people = set()
    for name in archive.namelist():
        path = Path(name)
        match = re.fullmatch(r"(\d{7})_C([1-5])_(\d+)\.c3d", path.name, re.I)
        if match and match[1] == path.parent.name:
            people.add(match[1])
            if match[2] == "2":
                groups[match[1]].append((int(match[3]), name))
    if len(people) != 50:
        raise ValueError("Unexpected source inventory")
    selected = {}
    for person in sorted(people)[:30]:
        ordered = sorted(groups[person])
        if len(ordered) < 3 or len(set(n for n, _ in ordered)) != len(ordered):
            raise ValueError("Unexpected repeat inventory")
        selected[person] = ordered[:3]
    return selected


def foot_assignments(supplement, selected):
    with ZipFile(supplement) as document:
        tree = ET.fromstring(document.read("word/document.xml"))
    table = tree.findall(".//w:tbl", NS)[1]
    assignments = {}
    for row in table.findall("w:tr", NS)[3:]:
        cells = row.findall("w:tc", NS)
        person = "".join(cells[0].itertext()).strip()
        if person in selected:
            for repeat, _ in selected[person]:
                pair = "".join(cells[6 + repeat].itertext()).strip()
                if pair != "NA" and not re.fullmatch("[012]{2}", pair):
                    raise ValueError("Unexpected supplementary assignment")
                assignments[person, repeat] = pair
    # A study folder without an exact Supplementary Table 2 row has no verified plate.
    for person, members in selected.items():
        for repeat, _ in members:
            assignments.setdefault((person, repeat), "NA")
    return assignments


def event_clock(c):
    p = c["parameters"]["EVENT"]
    times = np.array([60., 1.]) @ p["TIMES"]["value"]
    events = list(zip(p["CONTEXTS"]["value"], p["LABELS"]["value"], times, strict=True))
    def matches(side, name):
        return [float(t) for s, label, t in events if side == s.strip() and name == label.strip()]
    first, last = matches("Right", "Foot Strike1"), matches("Right", "Foot Strike2")
    if len(first) != 1 or len(last) != 1:
        raise OmitTrial("right_strike_labels")
    start, end = first[0], last[0]
    if not 0.5 <= end - start <= 4.0:
        raise OmitTrial("right_stride_duration")
    off = [t for t in matches("Right", "Foot Off") if start < t < end]
    left = [t for s, k, t in events if s.strip() == "Left" and k.strip() in ("Foot Strike1", "Foot Strike2") and start < t < end]
    if len(off) != 1 or len(left) != 1:
        raise OmitTrial("intervening_foot_events")
    return start, end, off[0]


def lerp(frames, at):
    """Adjacent valid rows only. Snap numerical noise around native integer frames."""
    at = np.atleast_1d(np.asarray(at, float))
    nearest = np.rint(at)
    at = np.where(abs(at - nearest) < 0.0001, nearest, at)
    within = (at >= 0) & (at <= len(frames) - 1)
    left = np.clip(np.floor(at).astype(int), 0, len(frames) - 1)
    right = np.clip(np.ceil(at).astype(int), 0, len(frames) - 1)
    frac = (at - np.floor(at)).reshape((-1,) + (1,) * (frames.ndim - 1))
    out = frames[left] * (1 - frac) + frames[right] * frac
    out[~within] = np.nan
    return out


def position_frame(c, times):
    labels = [s.strip() for s in c["parameters"]["POINT"]["LABELS"]["value"]]
    source = c["data"]["points"][:3].transpose(2, 1, 0).copy()
    if c["parameters"]["POINT"]["UNITS"]["value"] != ["mm"] or len(set(labels)) != len(labels):
        raise OmitTrial("point_metadata")
    invalid = ~np.isfinite(source).all(axis=2) | (source == 0).all(axis=2)
    invalid |= c["data"]["meta_points"]["residuals"][0].T < 0
    source[invalid] = np.nan
    source /= 1000.
    points = np.full((len(source), len(MARKERS), 3), np.nan)
    for i, m in enumerate(MARKERS):
        if m in labels:
            points[:, i] = source[:, labels.index(m)]
    sampled = lerp(points, times * 100)
    pelvis = np.mean(sampled[[0, -1]][:, [MARKERS.index(m) for m in PELVIS]], axis=1)
    motion = pelvis[1, :2] - pelvis[0, :2]
    length = np.linalg.norm(motion)
    if not np.isfinite(length) or length < 0.2:
        raise OmitTrial("pelvic_heading")
    forward = np.array([*motion / length, 0.])
    up = np.array([0., 0., 1.])
    axes = np.array([forward, np.cross(up, forward), up])
    lateral = (sampled[:, MARKERS.index("L_IAS")] - sampled[:, MARKERS.index("R_IAS")]) @ axes[1]
    neck = sampled[:, MARKERS.index("CV7"), 2]
    heels = sampled[:, [MARKERS.index("L_FCC"), MARKERS.index("R_FCC")], 2]
    for differences, minimum in ((lateral, 0.05), (neck - heels[:, 0], 0.65), (neck - heels[:, 1], 0.65)):
        measured = differences[np.isfinite(differences)]
        if not len(measured) or np.median(measured) <= minimum:
            raise OmitTrial("anatomical_axis_check")
    platforms = c["data"]["platform"]
    heights = [np.asarray(p["corners"])[2] / 1000. for p in platforms]
    flat = len(heights) == 2 and all(np.isfinite(z).all() and np.ptp(z) < 0.005 for z in heights)
    flat = flat and abs(np.mean(heights[0]) - np.mean(heights[1])) < 0.01
    floor = float(np.mean(heights)) if flat else 0.
    origin = np.array([pelvis[0, 0], pelvis[0, 1], floor])
    return sampled, points, axes, flat, origin


def positions(c, times):
    sampled, points, axes, flat, origin = position_frame(c, times)
    return (sampled - origin) @ axes.T, points, axes, flat


def samples(values, centers, halfwidth):
    ids = centers[:, None] + np.arange(-halfwidth, halfwidth + 1)[None]
    inside = ((ids >= 0) & (ids < len(values))).all(axis=1)
    out = values[np.clip(ids, 0, len(values) - 1)].copy()
    out[~inside] = np.nan
    return out


def inside_plate(xy, corners):
    """Signed inward distances to every edge of the ordered convex polygon."""
    corners = corners[:2].T / 1000.
    edges = np.roll(corners, -1, axis=0) - corners
    vectors = xy[:, None] - corners[None]
    cross = edges[:, 0] * vectors[:, :, 1] - edges[:, 1] * vectors[:, :, 0]
    winding = np.sign(np.sum(corners[:, 0] * np.roll(corners[:, 1], -1) - corners[:, 1] * np.roll(corners[:, 0], -1)))
    if winding == 0 or np.any(np.linalg.norm(edges, axis=1) == 0):
        return np.zeros(len(xy), bool)
    return ((winding * cross / np.linalg.norm(edges, axis=1)) >= -0.015).all(axis=1)


def right_bouts(vertical, points, corners, first, off):
    changes = np.diff(np.r_[False, vertical > 0, False].astype(int))
    found = []
    for a, b in zip(np.flatnonzero(changes == 1), np.flatnonzero(changes == -1), strict=True):
        if a == 0 or b == len(vertical) or b - a < 300:
            continue
        if abs((a - 7) / 1500 - first) > 0.12 or abs((b - 7) / 1500 - off) > 0.15:
            continue
        mid_frame = ((a + b - 1) / 2 - 7) / 15
        feet = {}
        for side in ("L", "R"):
            ids = [MARKERS.index(f"{side}_{code}") for code in FEET]
            feet[side] = lerp(points[:, ids], [mid_frame])[0, :, :2]
        if not all(np.isfinite(x).all() for x in feet.values()):
            continue
        if inside_plate(feet["R"], corners).all() and not inside_plate(feet["L"].mean(axis=0)[None], corners)[0]:
            found.append((a, b))
    return found


def stride_clock(c):
    rates = (c["header"]["points"]["frame_rate"], c["header"]["analogs"]["frame_rate"])
    analog = c["data"]["analogs"][0]
    nframes = c["data"]["points"].shape[-1]
    if rates != (100., 1500.) or analog.shape[-1] != nframes * 15 or c["header"]["points"]["first_frame"] != 0:
        raise OmitTrial("clock_metadata")
    start, end, off = event_clock(c)
    if start < -0.001 or end > (nframes - 1) / 100 + 0.001:
        raise OmitTrial("stride_outside_record")
    times = np.clip(start + PHASE * (end - start), 0., (nframes - 1) / 100)
    return start, end, off, times


def stride(c, assignment):
    start, end, off, times = stride_clock(c)
    analog = c["data"]["analogs"][0]
    markers, points, axes, flat = positions(c, times)
    centers = np.rint(times * 1500. + 7).astype(int)
    emg = np.full((len(PHASE), len(MUSCLES)), np.nan)
    force = np.full((len(PHASE), len(FORCES)), np.nan)
    p = c["parameters"]["ANALOG"]
    labels = [s.strip() for s in p["LABELS"]["value"]]
    units = [s.strip() for s in p["UNITS"]["value"]]
    def channel(name, unit):
        if labels.count(name) != 1:
            return None
        i = labels.index(name)
        return analog[i] if units[i] == unit else None
    for i, m in enumerate(MUSCLES):
        v = channel(f"R_{m}", "V")
        if v is not None and np.isfinite(v).any() and np.nanmax(v) > np.nanmin(v):
            block = samples(v, centers, 37)
            emg[:, i] = 1e6 * np.sqrt(np.mean(block ** 2, axis=1))
    platforms = c["data"]["platform"]
    types = np.asarray(c["parameters"]["FORCE_PLATFORM"]["TYPE"]["value"]).ravel()
    candidates = []
    for i, hardware in enumerate(platforms):
        plate = str(i + 1)
        if not flat or plate not in assignment or hardware["unit_force"] != "N" or types[i] != 2:
            continue
        reaction = hardware["force"].T
        local_z = channel(f"Fz{plate}", "N")
        if local_z is None or not np.isfinite(reaction).all() or not np.allclose(reaction[:, 2], -local_z, rtol=0., atol=0.1):
            continue
        if np.max(reaction[:, 2]) < 50.:
            continue
        block = samples(reaction, centers, 7).mean(axis=1)
        force[:, i] = block[:, 2]
        if assignment[0] == plate:
            for a, b in right_bouts(reaction[:, 2], points, hardware["corners"], start, off):
                valid = (centers - 7 >= a) & (centers + 7 < b)
                candidates.append((valid, block @ axes.T))
    if len(candidates) == 1:
        valid, aligned = candidates[0]
        force[valid, 2:] = aligned[valid]
    return markers, emg, force, np.array([end - start, (off - start) / (end - start) * 100])


def links():
    centre = [("CV7", "TV10"), ("CV7", "SJN"), ("SJN", "SXS"), ("SXS", "TV10")]
    cross = [("L_IAS", "R_IAS"), ("L_IPS", "R_IPS"), ("L_SAA", "R_SAA")]
    within = [("IAS", "IPS"), ("IAS", "FTC"), ("IPS", "FTC"), ("FTC", "FLE"),
              ("FLE", "FME"), ("FLE", "FAX"), ("FAX", "TTC"), ("TTC", "FAL"),
              ("FAL", "TAM"), ("FAL", "FCC"), ("FCC", "FM1"), ("FCC", "FM5"),
              ("FM1", "FM2"), ("FM2", "FM5"), ("SIA", "SRS"), ("SRS", "SAA"),
              ("SAA", "SAE"), ("SAA", "HLE"), ("HLE", "HME"), ("HLE", "UOA"),
              ("UOA", "UHE"), ("HLE", "RSP"), ("RSP", "UHE"), ("RSP", "HM2"),
              ("UHE", "HM5"), ("HM2", "HM5")]
    pairs = centre + cross
    for s in ("L", "R"):
        pairs += [(f"{s}_{a}", f"{s}_{b}") for a, b in within]
        pairs += [("CV7", f"{s}_SAA"), ("TV10", f"{s}_IPS")]
    return pairs


def stats(people, decimals):
    values = np.asarray(people)
    n = np.isfinite(values).sum(axis=0)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        mean, sd = np.nanmean(values, axis=0), np.nanstd(values, axis=0, ddof=1)
    def numbers(v):
        mask = (n >= 3) & np.isfinite(v)
        return np.where(mask, np.round(v, decimals).astype(object), None).tolist()
    return dict(mean=numbers(mean), sd=numbers(sd), n=n.astype(int).tolist())


def person_mean(trials):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        return tuple(np.nanmean(np.stack(a), axis=0) for a in zip(*trials, strict=True))


def build(archive_path, supplement):
    if file_hash(archive_path) != ARCHIVE_HASH or file_hash(supplement) != SUPPLEMENT_HASH:
        raise ValueError("Source fingerprint mismatch")
    count = Counter()
    people = []
    with ZipFile(archive_path) as archive, TemporaryDirectory() as work:
        selected = training_members(archive)
        assignments = foot_assignments(supplement, selected)
        temporary = Path(work) / "walk.c3d"
        for person, members in selected.items():
            trials = []
            for repeat, member in members:
                count["planned_strides"] += 1
                temporary.write_bytes(archive.read(member))
                c = ezc3d.c3d(str(temporary), extract_forceplat_data=True)
                try:
                    values = stride(c, assignments[person, repeat])
                except OmitTrial as reason:
                    count[str(reason)] += 1
                    continue
                count["eligible_strides"] += 1
                count["strides_with_right_contact"] += int(np.isfinite(values[2][:, -1]).any())
                for i in range(2):
                    count[f"strides_with_plate{i + 1}"] += int(np.isfinite(values[2][:, i]).any())
                trials.append(values)
            if trials:
                people.append(person_mean(trials))
    if len(people) < 3:
        raise ValueError("Insufficient source coverage for an anonymized group mean")
    markers, emg, forces, timing = map(np.array, zip(*people, strict=True))
    counts = dict(count)
    counts.update(planned_people=30, eligible_people=len(people))
    for i, code in enumerate(FORCES):
        counts[f"people_with_{code}"] = int(np.isfinite(forces[:, :, i]).any(axis=1).sum())
    output = dict(schema_version=1, phase_pct=list(range(101)), axes=["forward", "left", "up"],
                  position_unit="m", markers=[], links=links(), emg=[], forces=[],
                  summary={**counts, "stride_duration_s": stats(timing[:, 0], 4),
                           "right_foot_off_pct": stats(timing[:, 1], 3)},
                  source={"authors": "Céline Schreiber and Florent Moissenet",
                          "dataset": "https://doi.org/10.6084/m9.figshare.7734767.v8",
                          "article": "https://doi.org/10.1038/s41597-019-0124-4",
                          "license": "CC BY 4.0", "license_url": "https://creativecommons.org/licenses/by/4.0/",
                          "condition": "C2, barefoot level walking at a metronome-set pace, 0.4–0.8 m/s target",
                          "method": "Methods in OVERGROUND-STRIDE.md", "methods_sha256": PROTOCOL_HASH,
                          "coverage_rule_sha256": COVERAGE_HASH})
    for i, name in enumerate(MARKERS):
        measures = stats(markers[:, :, i], 6)
        counts_3d = np.asarray(measures["n"])
        if not np.all(counts_3d == counts_3d[:, :1]):
            raise ValueError("Position axis support mismatch")
        measures["n"] = counts_3d[:, 0].tolist()
        # The marker GUI represents each missing position as a single null.
        for key in ("mean", "sd"):
            measures[key] = [v if v[0] is not None else None for v in measures[key]]
        s, _, code = name.partition("_")
        side = {"L": "left", "R": "right"}.get(s, "midline")
        label = MIDLINE[name] if side == "midline" else f"{side.capitalize()} {SITES[code].lower()}"
        output["markers"].append(dict(id=name, label=label, side=side, **measures))
    for i, (name, label) in enumerate(MUSCLES.items()):
        output["emg"].append(dict(id=f"R_{name}", label=f"Right {label.lower()}", unit="µV", **stats(emg[:, :, i], 4)))
    for i, (name, label) in enumerate(FORCES.items()):
        output["forces"].append(dict(id=name, label=label, unit="N", **stats(forces[:, :, i], 4)))
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("supplement", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    result = build(args.archive, args.supplement)
    args.output.write_text(json.dumps(result, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n")
    print(json.dumps(result["summary"]))
