"""Build display-locked summaries from one pinned Seattle FingerFlex member or crop."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy.io import loadmat
from scipy.signal import periodogram, windows


MAT_SHA = "b8222d13c15c97ec8590ed4b9ea180c639cac0b7c3e04bce178bb349f92be03a"
NPZ_SHA = "57ea209841127b6cc04f2c03f8f6146f01b3e0235d169365d009cf3f9c643e9c"
PLAN_SHA = "f46145c1c1f7af09f14ee4dad11cd4b72dee7f790bf40f4bbf730b44183ec6af"
ROWS = 362_000
RATE = 1000
WIDTH = 500
OFFSETS = range(0, 1201, 200)
STEP = 40
DIGITS = ["thumb", "index", "middle", "ring", "little"]
BANDS = {"beta": (12, 20), "high": (70, 110)}
REGIONS = {
    0: "Unassigned (source code 0)",
    1: "Dorsal primary motor cortex",
    2: "Rolandic (unspecified subdivision)",
    3: "Dorsal primary somatosensory cortex",
    4: "Ventral sensorimotor cortex",
    6: "Frontal (non-rolandic)",
    7: "Parietal (non-rolandic)",
    8: "Temporal",
    9: "Occipital",
}
HANN = windows.hann(WIDTH, sym=False)


def load(path):
    with path.open("rb") as source:
        sha = hashlib.file_digest(source, "sha256").hexdigest()
        source.seek(0)
        if sha == NPZ_SHA:
            with np.load(source, allow_pickle=False) as z:
                return z["ecog"], z["flex"], z["cue"], z["region_code"]
        if sha == MAT_SHA:
            z = loadmat(source, variable_names=["data", "flex", "cue", "elec_regions"])
            return z["data"][:ROWS], z["flex"][:ROWS], z["cue"][:ROWS, 0], z["elec_regions"][:, 0]
    raise ValueError("The source file does not match the pinned recording or development crop.")


def paired_runs(cue):
    boundaries = 1 + np.flatnonzero(cue[1:] != cue[:-1])
    return [(int(cue[a]), int(a), int(b), int(c))
            for a, b, c in zip(boundaries, boundaries[1:], boundaries[2:])
            if 1 <= cue[a] <= 5 and cue[b] == 0]


def powers(raw):
    voltage = raw.astype(np.float64) * 0.0298
    if len(raw) != WIDTH or not np.isfinite(voltage).all() or np.any(np.ptp(voltage, axis=0) == 0):
        raise ValueError("Selected window lacks complete, nonflat, finite cortical data.")
    voltage -= voltage.mean(axis=1, keepdims=True)
    hz, density = periodogram(voltage, fs=RATE, axis=0, window=HANN, detrend="constant",
                              return_onesided=True, scaling="density")
    bins = [density[(hz >= lo) & (hz <= hi)].sum(axis=0) * (RATE / WIDTH)
            for lo, hi in BANDS.values()]
    band_power = np.stack(bins)
    if not np.isfinite(band_power).all() or np.any(band_power <= 0):
        raise ValueError("Selected window has invalid cortical band power.")
    return band_power


def glove_change(flex, start):
    first_tick = ((start + STEP - 1) // STEP) * STEP
    ticks = flex[first_tick:start + WIDTH:STEP].astype(np.float64)
    if len(ticks) not in (12, 13) or not np.isfinite(ticks).all():
        raise ValueError("Incomplete or nonfinite set of nominal glove samples.")
    return np.abs(np.diff(ticks, axis=0)).mean(axis=0), len(ticks) - 1


def rounded(values, places):
    return [round(float(value), places) for value in values]


def derive(ecog, flex, cue, codes):
    if (ecog.shape, flex.shape, cue.shape, codes.shape) != ((ROWS, 46), (ROWS, 5), (ROWS,), (46,)):
        raise ValueError("Unexpected source dimensions.")
    if not set(np.unique(cue)) <= set(range(6)) or not set(np.unique(codes)) <= set(REGIONS):
        raise ValueError("Unknown source condition or anatomical code.")
    blocks = flex.reshape(-1, STEP, 5)
    if not np.all(blocks == blocks[:, :1, :]):
        raise ValueError("Glove changes fall outside the recorded 40-row grid.")
    complete = paired_runs(cue)
    needed = OFFSETS[-1] + WIDTH
    trials = [trial for trial in complete if min(trial[2] - trial[1], trial[3] - trial[2]) >= needed]
    digits = np.array([trial[0] for trial in trials])
    if len(complete) != 88 or np.bincount(digits, minlength=6).tolist() != [0, 18, 19, 22, 16, 13]:
        raise ValueError("Source support differs from the frozen cohort.")
    regions = []
    for code, label in REGIONS.items():
        count = int(np.sum(codes == code))
        status = "undefined_code" if code == 0 else ("measured" if count else "no_contacts")
        regions.append(dict(code=code, label=label, n_contacts=count, status=status))

    conditions = {"all": np.ones(len(trials), dtype=bool)}
    conditions.update({name: digits == d for d, name in enumerate(DIGITS, 1)})
    by_cue = {k: {"n_pairs": int(mask.sum()), "windows": []} for k, mask in conditions.items()}
    for offset in OFFSETS:
        ratios, movement, step_counts = [], [], []
        for _, a, b, _ in trials:
            cue_start, blank_start = a + offset, b + offset
            cue_power = powers(ecog[cue_start:cue_start + WIDTH])
            blank_power = powers(ecog[blank_start:blank_start + WIDTH])
            ratios.append(10 * np.log10(cue_power / blank_power))
            cg, cn = glove_change(flex, cue_start)
            bg, bn = glove_change(flex, blank_start)
            movement.append((cg, bg))
            step_counts.append((cn, bn))
        ratios = np.stack(ratios)
        movement = np.stack(movement)
        step_counts = np.array(step_counts)
        for condition, select in conditions.items():
            contact_means = ratios[select].mean(axis=0)
            glove_means = movement[select].mean(axis=0)
            region_means = {}
            for k, band in enumerate(BANDS):
                region_means[band] = [
                    round(float(contact_means[k, codes == row["code"]].mean()), 2)
                    if row["status"] == "measured" else None for row in regions
                ]
            included_steps = step_counts[select].sum(axis=0)
            by_cue[condition]["windows"].append({
                "contact_db": {band: rounded(contact_means[k], 2) for k, band in enumerate(BANDS)},
                "region_db": region_means,
                "glove": {"cue": rounded(glove_means[0], 3), "blank": rounded(glove_means[1], 3)},
                "glove_steps": {"cue": int(included_steps[0]), "blank": int(included_steps[1])},
            })
    return {
        "schema_version": 1, "participant_count": 1, "source": "https://purl.stanford.edu/zk881ps0522",
        "source_member_sha256": MAT_SHA, "analysis_plan_sha256": PLAN_SHA,
        "license": "CC BY-SA 4.0", "source_prefix_seconds": ROWS // RATE,
        "complete_pairs": len(complete), "included_pairs": len(trials),
        "excluded_complete_pairs": len(complete) - len(trials),
        "units": {"contact_db": "dB, mean paired cue / following blank band power",
                  "region_db": "dB, equal-weight mean across sampled contacts and observed trials",
                  "glove": "mean absolute change in sensor counts per nominal 40 ms step",
                  "glove_steps": "number of within-window adjacent glove sample pairs per digit"},
        "windows": [{"start_ms": offset, "end_ms": offset + WIDTH} for offset in OFFSETS],
        "digits": DIGITS, "bands": [dict(id=k, min_hz=v[0], max_hz=v[1]) for k, v in BANDS.items()],
        "contacts": [dict(index1=k, region_code=int(code)) for k, code in enumerate(codes, 1)],
        "regions": regions, "by_cue": by_cue,
        "clock": {"ecog_hz": RATE, "nominal_glove_hz": 25,
                  "reported_glove_amplifier_lag_ms": 37, "reported_lag_sem_ms": 3,
                  "clock_correction_applied": False},
        "summary": "Display-locked within-record means. Adjacent windows share 300 ms. "
                   "The participant chose when to move. The blank screen can include movement.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = derive(*load(args.source))
    args.output.write_text(json.dumps(data, ensure_ascii=False, allow_nan=False, indent=2) + "\n")
