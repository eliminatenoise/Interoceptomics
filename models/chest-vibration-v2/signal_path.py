"""Native counts -> filtered 250 Hz millivolts -> calibration -> z units (PROTOCOL.json inputs.signal_path).

The path is version 1's, unchanged: (count - baseline) / gain per channel, a causal unit-sum 201-tap
Hamming-windowed sinc low-pass (65 Hz at 5000 Hz), endpoints i = 20k for k >= 10, no delay
compensation. A filtered reading is missing if any native sample in its 201-sample support is the
WFDB missing value -32768. Only ECG lead II, RESP and SCG are used; lead I is unused.
"""
import re

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

from common import CAL, STEP

CHANNELS = ("I", "II", "RESP", "SCG")
USED = (1, 2, 3)            # columns of the returned traces: II, RESP, SCG
MISSING = -32768
GAIN_FIELD = re.compile(r"([0-9]+(?:\.[0-9]+)?)\((-?[0-9]+)\)/mV")


def parse_header(text):
    """Parse a CEBSDB WFDB header. Lines are compared with surrounding whitespace removed: the release
    headers end each line with a space (recorded deviation of FREEZE.json, QC2)."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    first = lines[0].split()
    out = {"lines": lines, "record": first[0], "n_signals": first[1], "rate": first[2],
           "frames": first[3] if len(first) > 3 else None, "signals": [],
           "comments": [line for line in lines if line.startswith("#")]}
    for line in lines[1:]:
        if line.startswith("#"):
            continue
        f = line.split()
        sig = {"fields": f}
        if len(f) == 9:
            sig.update(file=f[0], fmt=f[1], gain_field=f[2], checksum=f[6], block=f[7], label=f[8])
            m = GAIN_FIELD.fullmatch(f[2])
            if m:
                sig.update(gain=float(m[1]), baseline=int(m[2]))
        out["signals"].append(sig)
    return out


def calibration_constants(header):
    """Gains and baselines of the four channels, in file order I, II, RESP, SCG."""
    gains = np.array([s["gain"] for s in header["signals"][:4]], dtype=np.float64)
    zeros = np.array([s["baseline"] for s in header["signals"][:4]], dtype=np.float64)
    return gains, zeros


def read_counts(dat_path, frames=None):
    data = np.fromfile(dat_path, dtype="<i2")
    if frames is not None and data.size != 4 * frames:
        raise ValueError(f"{dat_path}: {data.size} samples, expected {4 * frames}")
    return data.reshape(-1, 4)


def kernel():
    n = np.arange(201) - 100
    sinc = (2 * 65 / 5000) * np.sinc((2 * 65 / 5000) * n)
    taps = np.hamming(len(n)) * sinc
    return taps / taps.sum()


def filtered_grid(counts, gains, zeros):
    """Filtered mV on the 250 Hz grid for II, RESP and SCG: array (n, 3), n = (frames - 1) // 20 + 1,
    row k = endpoint 20k; rows k < 10 and missing readings are NaN. Each reading equals version 1's at
    the same endpoint (the same windows and the same einsum)."""
    frames = counts.shape[0]
    n = (frames - 1) // STEP + 1
    taps = kernel()[::-1]
    out = np.full((n, 3), np.nan)
    for col, ch in enumerate(USED):
        c = counts[:, ch]
        mv = (c.astype(np.float64) - zeros[ch]) / gains[ch]
        windows = sliding_window_view(mv, 201)[::STEP]   # window j: samples 20j .. 20j + 200, endpoint 20(j + 10)
        values = np.einsum("ij,j->i", windows, taps, optimize=False)
        miss = (c == MISSING)
        if miss.any():
            cm = np.concatenate(([0], np.cumsum(miss, dtype=np.int64)))
            ends = STEP * (np.arange(len(values)) + 10)
            bad = (cm[ends + 1] - cm[ends - 200]) > 0
            values = np.where(bad, np.nan, values)
        out[10:10 + len(values), col] = values
    return out


def calibrate(trace):
    """Mean and population SD of the valid readings at 60 <= t < 80 s, per channel (II, RESP, SCG)."""
    seg = trace[CAL[0]:CAL[1]]
    valid = np.isfinite(seg).sum(axis=0)
    mean = np.nanmean(seg, axis=0)
    sd = np.nanstd(seg, axis=0)
    ok = bool(np.all(valid >= 4500) and np.all(np.isfinite(sd) & (sd > 0)))
    return {"mean": mean, "sd": sd, "valid": valid, "ok": ok}


def standardize(trace, cal):
    return (trace - cal["mean"]) / cal["sd"]


def from_counts(counts, gains, zeros):
    """Full path from native counts: (z traces (n, 3) II/RESP/SCG, calibration, filtered mV traces)."""
    trace = filtered_grid(counts, gains, zeros)
    cal = calibrate(trace)
    if not cal["ok"]:
        raise ValueError("calibration interval fails the 4,500-reading or positive-SD rule")
    return standardize(trace, cal), cal, trace


def load_record(dat_path, hea_path):
    """Read a record from its .dat and .hea (no hash or QC check here; qc.py does that)."""
    header = parse_header(open(hea_path, encoding="ascii").read())
    gains, zeros = calibration_constants(header)
    counts = read_counts(dat_path, int(header["frames"]))
    return counts, gains, zeros, header
