"""Check the entire public table from the same admitted source, independently of derive.py."""

import argparse
import hashlib
import itertools
import json
from collections import Counter
from pathlib import Path

import numpy as np


NPZ = "57ea209841127b6cc04f2c03f8f6146f01b3e0235d169365d009cf3f9c643e9c"
MAT = "b8222d13c15c97ec8590ed4b9ea180c639cac0b7c3e04bce178bb349f92be03a"
IDS = ["all", "thumb", "index", "middle", "ring", "little"]
CODES = [0, 1, 2, 3, 4, 6, 7, 8, 9]
OFFSETS = [0, 200, 400, 600, 800, 1000, 1200]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def independent_source(path):
    with path.open("rb") as stream:
        sha = hashlib.file_digest(stream, "sha256").hexdigest()
        stream.seek(0)
        if sha == NPZ:
            with np.load(stream, allow_pickle=False) as z:
                return z["ecog"], z["cue"], z["flex"], z["region_code"]
        require(sha == MAT, "Source identity differs")
        from scipy.io import loadmat
        z = loadmat(stream, variable_names=["data", "cue", "flex", "elec_regions"])
        return z["data"][:362000], z["cue"][:362000].ravel(), z["flex"][:362000], z["elec_regions"].ravel()


def direct_dft():
    # Evaluate only the chosen positive Fourier frequencies. Constant taper normalization,
    # µV/count, one-sided doubling and 2-Hz bin width cancel in every within-site ratio.
    t = np.arange(500) / 1000
    hz = np.r_[12:21:2, 70:111:2]
    taper = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(500) / 500)
    return np.exp(-2j * np.pi * hz[:, None] * t) * taper


def verify(source, table):
    x, cue, glove, code = independent_source(source)
    f = json.loads(table.read_text())
    require(f["digits"] == IDS[1:] and list(f["by_cue"]) == IDS, "Cue keys/order")
    require(f["bands"] == [{"id": "beta", "min_hz": 12, "max_hz": 20},
                            {"id": "high", "min_hz": 70, "max_hz": 110}], "Band encoding")
    require(f["windows"] == [{"start_ms": o, "end_ms": o + 500} for o in OFFSETS], "Offsets")
    require(f["contacts"] == [{"index1": i + 1, "region_code": int(c)} for i, c in enumerate(code)],
            "Contact order")
    region_counts = Counter(map(int, code))
    for c, meta in zip(CODES, f["regions"], strict=True):
        require(meta["code"] == c and meta["n_contacts"] == region_counts[c], "Regional source mapping")
        status = "undefined_code" if c == 0 else ("measured" if region_counts[c] else "no_contacts")
        require(meta["status"] == status, "Regional status")

    # Construct actual display/blank runs from group lengths; exclude both edge runs.
    start = 0
    runs = []
    for digit, chunk in itertools.groupby(cue):
        length = sum(1 for _ in chunk)
        runs.append((int(digit), start, start + length))
        start += length
    pairs = []
    for left, right in itertools.pairwise(runs[1:-1]):
        if left[0] > 0 and right[0] == 0:
            require(left[2] - left[1] == right[2] - right[1] == 2000, "Duration")
            pairs.append((left, right))
    require(f["complete_pairs"] == f["included_pairs"] == len(pairs) == 88, "Fixed cohort")
    require(f["excluded_complete_pairs"] == 0, "Excluded pairs")
    rounded_error = dict(contact_db=0.0, region_db=0.0, glove=0.0)
    numeric_cells = Counter()
    unmeasured = 0
    transform = direct_dft()
    ticks = glove[::40].astype(np.int32)
    require(np.all(glove == np.repeat(ticks, 40, axis=0)), "40-row hold")
    for oi, offset in enumerate(OFFSETS):
        paired_changes, glove_means, glove_counts = [], [], []
        for display, blank in pairs:
            ab = []
            tv = []
            ns = []
            for _, a, stop in (display, blank):
                lo, hi = a + offset, a + offset + 500
                require(hi <= stop, "Boundary crossing")
                raw = x[lo:hi].astype(float)
                raw -= raw.mean(axis=0)
                raw -= raw.mean(axis=1)[:, None]
                energy = np.abs(transform @ raw) ** 2
                ab.append(np.stack((energy[:5].sum(axis=0), energy[5:].sum(axis=0))))
                # Enumerate adjacent global tick pairs and keep both endpoints in [lo,hi).
                eligible = [i for i in range(lo // 40, (hi - 1) // 40)
                            if lo <= 40 * i and 40 * (i + 1) < hi]
                total = sum(np.abs(ticks[i + 1] - ticks[i]) for i in eligible)
                tv.append(total / len(eligible))
                ns.append(len(eligible))
            paired_changes.append(10 * (np.log10(ab[0]) - np.log10(ab[1])))
            glove_means.append(tv)
            glove_counts.append(ns)

        digit_id = np.array([d[0] for d, _ in pairs])
        for digit, cue_id in enumerate(IDS):
            mask = np.ones(len(pairs), bool) if digit == 0 else digit_id == digit
            out = f["by_cue"][cue_id]
            require(len(out["windows"]) == 7 and out["n_pairs"] == int(mask.sum()), "Condition support")
            w = out["windows"][oi]
            vals = np.stack(paired_changes)[mask]
            gm = np.array(glove_means)[mask].mean(axis=0)
            counts = np.array(glove_counts)[mask].sum(axis=0)
            for bi, bv in enumerate(("beta", "high")):
                ref = vals[:, bi].mean(axis=0)
                observed = np.array(w["contact_db"][bv])
                require(observed.shape == (46,), "Contact field shape")
                err = float(np.max(abs(ref - observed)))
                rounded_error["contact_db"] = max(rounded_error["contact_db"], err)
                numeric_cells["contact_db"] += 46
                for c, obs in zip(CODES, w["region_db"][bv], strict=True):
                    if c == 0 or region_counts[c] == 0:
                        require(obs is None, "Unexpected value in missing region")
                        unmeasured += 1
                        continue
                    ref_region = float(vals[:, bi, code == c].mean())
                    rounded_error["region_db"] = max(rounded_error["region_db"], abs(ref_region - obs))
                    numeric_cells["region_db"] += 1
            for p, phase in enumerate(("cue", "blank")):
                require(w["glove_steps"][phase] == int(counts[p]), "Counts of genuine glove steps")
                observed = np.array(w["glove"][phase])
                require(observed.shape == (5,), "Glove field shape")
                err = float(np.max(abs(gm[p] - observed)))
                rounded_error["glove"] = max(rounded_error["glove"], err)
                numeric_cells["glove"] += 5
    for key, err in rounded_error.items():
        require(err <= (0.0005 if key == "glove" else 0.005) + 1e-10, key + " outside rounding")
    return {
        "pairs": len(pairs), "numeric_cells_checked": dict(numeric_cells), "expected_nulls_checked": unmeasured,
        "max_abs_difference_from_unrounded_oracle": rounded_error,
        "result_sha256": hashlib.sha256(table.read_bytes()).hexdigest(),
        "method": "Direct selected-frequency Fourier sums in counts and integer glove changes on both within-window endpoints.",
    }


if __name__ == "__main__":
    arg = argparse.ArgumentParser(description=__doc__)
    arg.add_argument("source", type=Path)
    arg.add_argument("table", type=Path)
    args = arg.parse_args()
    print(json.dumps(verify(args.source, args.table), indent=2))
