"""Derive paired cue/blank band-power summaries from the fixed Seattle development prefix.

Usage: python derive.py SOURCE OUTPUT.json [--contact-means CONTACT-MEANS.json] [--contacts PRIVATE.json]
SOURCE may be the pinned local crop or the original unmodified MATLAB member.
The optional tables contain rounded public contact means and richer local summaries.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy.signal import periodogram, windows


MAT_HASH = "b8222d13c15c97ec8590ed4b9ea180c639cac0b7c3e04bce178bb349f92be03a"
NPZ_HASH = "57ea209841127b6cc04f2c03f8f6146f01b3e0235d169365d009cf3f9c643e9c"
PREFIX_ROWS = 362000
RATE = 1000
MICROVOLTS_PER_COUNT = 0.0298
DIGITS = ["all", "thumb", "index", "middle", "ring", "little"]
BANDS = {"beta": (12, 20), "high": (70, 110)}
REGIONS = {
    0: None,
    1: "Dorsal primary motor cortex",
    2: "Rolandic (unspecified subdivision)",
    3: "Dorsal primary somatosensory cortex",
    4: "Ventral sensorimotor cortex",
    6: "Frontal (non-rolandic)",
    7: "Parietal (non-rolandic)",
    8: "Temporal",
    9: "Occipital",
}
TAPER = windows.hann(RATE, sym=False)


def read_source(path):
    with path.open("rb") as source:
        signature = hashlib.file_digest(source, "sha256").hexdigest()
        source.seek(0)
        if signature == NPZ_HASH:
            with np.load(source, allow_pickle=False) as file:
                return file["ecog"], file["cue"], file["region_code"]
        if signature == MAT_HASH:
            from scipy.io import loadmat
            data = loadmat(source, variable_names=["data", "cue", "elec_regions"])
            return (data["data"][:PREFIX_ROWS], data["cue"][:PREFIX_ROWS, 0],
                    data["elec_regions"][:, 0])
    raise ValueError("Expected the source MATLAB member or the pinned development prefix")


def complete_pairs(cue):
    boundaries = np.r_[0, 1 + np.flatnonzero(cue[1:] != cue[:-1])]
    for i in range(1, len(boundaries) - 2):
        start, rest, end = boundaries[i:i + 3]
        digit = int(cue[start])
        if 1 <= digit <= 5 and cue[rest] == 0:
            yield digit, start, rest, end


def band_power(ecog, start, stop):
    if stop - start < RATE:
        raise ValueError("Admitted phase shorter than the specified centered window")
    first = start + (stop - start - RATE) // 2
    voltage = ecog[first:first + RATE].astype(np.float64) * MICROVOLTS_PER_COUNT
    if not np.isfinite(voltage).all() or np.any(np.ptp(voltage, axis=0) == 0):
        raise ValueError("Flat or nonfinite source window")
    voltage -= voltage.mean(axis=1, keepdims=True)
    hz, density = periodogram(voltage, fs=RATE, axis=0, window=TAPER, detrend="constant",
                              return_onesided=True, scaling="density")
    # Hz spacing is exactly one for the fixed one-second transform.
    powers = np.stack([density[(hz >= low) & (hz <= high)].sum(axis=0)
                       for low, high in BANDS.values()], axis=-1)
    if not np.isfinite(powers).all() or np.any(powers <= 0):
        raise ValueError("Invalid band power in an admitted window")
    return powers


def summarize(values, digits):
    result = {}
    for code, name in enumerate(DIGITS):
        selected = values if code == 0 else values[digits == code]
        quantiles = np.quantile(selected, [0.25, 0.75], axis=0, method="linear")
        means = selected.mean(axis=0)
        result[name] = {
            band: {"mean_db": round(float(means[b]), 6),
                   "q25_db": round(float(quantiles[0, b]), 6),
                   "q75_db": round(float(quantiles[1, b]), 6)}
            for b, band in enumerate(BANDS)
        }
    return result


def derive(ecog, cue, codes, with_contacts=False):
    if ecog.shape != (PREFIX_ROWS, 46) or cue.shape != (PREFIX_ROWS,) or codes.shape != (46,):
        raise ValueError("Unexpected input dimensions")
    if not set(np.unique(codes)) <= set(REGIONS) or not set(np.unique(cue)) <= set(range(6)):
        raise ValueError("Unexpected source code")
    trials = list(complete_pairs(cue))
    digits = np.array([p[0] for p in trials])
    if np.bincount(digits, minlength=6).tolist() != [0, 18, 19, 22, 16, 13]:
        raise ValueError("Unexpected trial counts for this fixed source")
    contrasts = np.stack([10 * np.log10(band_power(ecog, start, rest) / band_power(ecog, rest, end))
                          for _, start, rest, end in trials])
    regions = []
    for code, label in REGIONS.items():
        mask = codes == code
        count = int(mask.sum())
        status = "undefined_code" if label is None else ("measured" if count else "no_contacts")
        by_cue = summarize(contrasts[:, mask].mean(axis=1), digits) if status == "measured" else None
        regions.append({"code": code, "label": label or "Unassigned (source code 0)",
                        "n_contacts": count, "status": status, "by_cue": by_cue})
    result = {
        "schema_version": 1, "participant_count": 1, "n_contacts_total": len(codes),
        "n_contacts_assigned": sum(r["n_contacts"] for r in regions if r["status"] == "measured"),
        "trial_counts": {s: len(trials) if i == 0 else int(np.sum(digits == i)) for i, s in enumerate(DIGITS)},
        "bands": [{"id": key, "min_hz": low, "max_hz": high} for key, (low, high) in BANDS.items()],
        "regions": regions,
        "modality": "Subdural electrocorticography (ECoG), left frontoparietal recording",
        "measure": "Within-trial cue / following blank band-power ratio in dB; + = greater cue power",
        "quartiles": "25th and 75th percentiles of paired trial changes. One recording, descriptive spread.",
        "prefix_rows_half_open": [0, PREFIX_ROWS], "recording_hz": RATE, "hemisphere": "left",
        "license": "CC BY-SA 4.0", "source": "https://purl.stanford.edu/zk881ps0522",
        "methods": "METHODS.md", "source_manifest": "source-manifest.json",
    }
    contacts = None
    if with_contacts:
        contacts = {"schema_version": 1, "source_member_sha256": MAT_HASH,
                    "trial_counts": result["trial_counts"], "bands": result["bands"],
                    "contacts": [{"index1": k + 1, "column0": k, "column1": k + 1,
                                  "region_code": int(code), "by_cue": summarize(contrasts[:, k], digits)}
                                 for k, code in enumerate(codes)]}
    return result, contacts


def contact_means(local):
    return {
        "schema_version": 1, "source_member_sha256": MAT_HASH,
        "unit": "dB (mean of paired cue / following blank power ratios in decibels)",
        "trial_counts": local["trial_counts"], "bands": local["bands"],
        "contacts": [
            {"index1": row["index1"], "region_code": row["region_code"],
             "by_cue": {name: {band: round(values["mean_db"], 2) for band, values in bands.items()}
                        for name, bands in row["by_cue"].items()}}
            for row in local["contacts"]
        ],
        "source": "https://purl.stanford.edu/zk881ps0522", "license": "CC BY-SA 4.0",
        "methods": "METHODS.md",
    }


def write(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + "\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("source", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("--contacts", type=Path, help="Optional local per-channel summary")
    ap.add_argument("--contact-means", type=Path, help="Public per-channel mean dB, rounded to 0.01 dB")
    args = ap.parse_args()
    paths = [p.resolve() for p in (args.source, args.output, args.contacts, args.contact_means) if p]
    if len(paths) != len(set(paths)):
        ap.error("Supply distinct source and output paths")
    with_contacts = args.contacts is not None or args.contact_means is not None
    public, local = derive(*read_source(args.source), with_contacts=with_contacts)
    write(args.output, public)
    if args.contacts:
        write(args.contacts, local)
    if args.contact_means:
        write(args.contact_means, contact_means(local))
