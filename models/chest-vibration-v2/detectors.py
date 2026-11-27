"""Causal heartbeat detectors on the 250 Hz grid (PROTOCOL.json detectors).

Every sum is written as a fixed sequence of elementwise additions, so each value depends only on the
readings it covers and not on the length of the record or on where the computation starts.
"""
import numpy as np

from common import CAL, DETECTOR_START, DELAY


def _window_sum(v, width):
    """out[k] = v[k - width + 1] + ... + v[k] for k >= width - 1 (added oldest first); NaN before."""
    n = len(v)
    out = np.full(n, np.nan)
    if n < width:
        return out
    acc = v[0:n - width + 1].copy()
    for off in range(1, width):
        acc += v[off:n - width + 1 + off]
    out[width - 1:] = acc
    return out


def r_energy(x):
    """R_v2 slope energy: d(k) = x(k) - x(k-1); e(k) = sum of d(i)^2, i = k-4..k; undefined for k < 5."""
    d = np.zeros(len(x))
    d[1:] = x[1:] - x[:-1]
    e = _window_sum(d * d, 5)
    e[:5] = np.nan
    return e


def r_v2(x, start=DETECTOR_START):
    """R detector v2 on standardised ECG II with missing readings set to 0 (detectors.R_v2).

    Returns (R times, availability times) as int64 arrays. A beat may be used at cutoff t only if its
    availability A <= t; every quantity behind it lies at grid <= A."""
    x = np.asarray(x, dtype=np.float64)
    n = len(x)
    e = r_energy(x)
    e0 = float(np.percentile(e[CAL[0]:CAL[1]], 99.5))
    mem = [e0] * 8
    thr = 0.35 * e0
    last = -10 ** 9
    el = e.tolist()
    R, A = [], []
    k = start
    while k < n - 7:
        ek = el[k]
        if ek == ek and ek > thr and k - last > 62:
            lo, hi = k - 3, k + 7
            base = np.median(x[k - 50:k - 10])            # x(k-50) .. x(k-11), 40 readings
            seg = np.abs(x[lo:hi + 1] - base)
            R.append(lo + int(np.argmax(seg)))
            A.append(hi)
            mem = mem[1:] + [float(np.max(e[k:hi + 1]))]
            thr = 0.35 * float(np.median(mem))
            last = k
            k = hi + 1
            continue
        if k - last > 500 and (k - last) % 500 == 0:
            thr *= 0.5
        k += 1
    return np.array(R, dtype=np.int64), np.array(A, dtype=np.int64)


def chest_energy(s):
    """chest_v2 slope energy: d(0) = s(0), d(k) = s(k) - s(k-1); e(k) = sum of d(i)^2, i = k-9..k for
    k >= 10, and 0 for k < 10."""
    d = np.empty(len(s))
    d[0] = s[0]
    d[1:] = s[1:] - s[:-1]
    e = _window_sum(d * d, 10)
    e[:10] = 0.0
    return e


def chest_v2(s, start=DETECTOR_START, end_margin=7):
    """Chest-only detector on standardised SCG with missing readings set to 0 (detectors.chest_v2).

    end_margin = 7 scans while k < n - 7, the same bound as R_v2, so that a beat whose availability
    k + 7 is the last reading of a truncated record is found. PROTOCOL.json writes 'k < n - 8'; the
    admission review found that this bound misses a beat available exactly at the cutoff in the
    truncation test. Recorded as a deviation in FREEZE.json. It changes no output at any primary
    cutoff of a full record, because the bounds differ only for a trigger at k = n - 8."""
    s = np.asarray(s, dtype=np.float64)
    n = len(s)
    e = chest_energy(s)
    e0 = float(np.percentile(e[CAL[0]:CAL[1]], 99.0))
    mem = [e0] * 8
    thr = 0.4 * e0
    last = -10 ** 9
    rrs = []
    el = e.tolist()
    R, A = [], []
    k = start
    while k < n - end_margin:
        refractory = max(62, int(np.floor(0.6 * np.median(rrs[-4:])))) if len(rrs) >= 4 else 100
        if el[k] > thr and k - last > refractory:
            lo, hi = k - 3, k + 7
            beat = lo + int(np.argmax(np.abs(s[lo:hi + 1])))
            if R:
                rrs.append(beat - R[-1])
            R.append(beat)
            A.append(hi)
            mem = mem[1:] + [float(np.max(e[k:hi + 1]))]
            thr = 0.4 * float(np.median(mem))
            last = k
            k = hi + 1
            continue
        k += 1
    return np.array(R, dtype=np.int64), np.array(A, dtype=np.int64)


def c3_polarity(z_ii):
    c = z_ii[CAL[0]:CAL[1]]
    med = np.nanmedian(c)
    return 1.0 if (np.nanmax(c) - med) >= (med - np.nanmin(c)) else -1.0


def c3_last_peak(z_ii):
    """C3 detector (detectors.C3_detector): last[k] = the most recent peak accepted at a confirmation
    time <= k, or -1. Reference and median over the previous 2 s ignore missing readings, as in the
    second draft design that built this control."""
    e = c3_polarity(z_ii) * np.asarray(z_ii, dtype=np.float64)
    n = len(e)
    last = np.full(n, -1, dtype=np.int64)
    if n < 505:
        return last
    j = np.arange(500, n - 2)
    fin = np.isfinite(e)
    ok = fin[j - 2] & fin[j - 1] & fin[j] & fin[j + 1] & fin[j + 2]
    ej = e[j]
    with np.errstate(invalid="ignore"):
        cand = ok & (ej >= e[j - 2]) & (ej >= e[j - 1]) & (ej >= e[j + 1]) & (ej >= e[j + 2]) \
            & (ej > e[j - 1]) & (ej >= e[j + 1])
    prev = -10 ** 9
    accepted = []
    for jj in j[cand].tolist():
        k = jj + 2
        ref = np.nanmax(e[k - 500:k + 1])
        med = np.nanmedian(e[k - 500:k + 1:5])
        if e[jj] - med > 0.45 * (ref - med) and jj - prev > 62.5:
            prev = jj
            accepted.append(jj)
    for jj in accepted:
        last[jj + 2:] = jj
    return last


def tsb_from_last(last, delay=0):
    """Time since beat: tsb(k) = (k - delay) - last(k - delay), or -1 when undefined."""
    n = len(last)
    k = np.arange(n)
    src = k - delay
    out = np.full(n, -1, dtype=np.int64)
    ok = src >= 0
    lk = np.full(n, -1, dtype=np.int64)
    lk[ok] = last[src[ok]]
    good = ok & (lk >= 0)
    out[good] = src[good] - lk[good]
    return out


def c3_forecast(tsb, z_scg, cutoffs, start=CAL[0]):
    """C3 rolling personal template (models_and_controls C3): the running mean of z_SCG(k) in bins of
    tsb(k) (0..499), over every k with start <= k < t, tsb(k) defined and < 500 and z_SCG(k) valid;
    the forecast is the mean of bin tsb(t) + 20 if it holds >= 3 readings, else 0."""
    cutoffs = np.asarray(cutoffs, dtype=np.int64)
    out = np.zeros(len(cutoffs))
    if len(cutoffs) == 0:
        return out
    order = np.argsort(cutoffs, kind="stable")
    sums = [0.0] * 500
    counts = [0] * 500
    tl = tsb.tolist()
    zl = z_scg.tolist()
    targets = cutoffs[order].tolist()
    pos = 0
    k = start
    last_cut = targets[-1]
    while k <= last_cut:
        while pos < len(targets) and targets[pos] == k:
            b = tl[k] + 20 if tl[k] >= 0 else -1
            if 0 <= b < 500 and counts[b] >= 3:
                out[order[pos]] = sums[b] / counts[b]
            pos += 1
        b = tl[k]
        if 0 <= b < 500:
            v = zl[k]
            if v == v:
                sums[b] += v
                counts[b] += 1
        k += 1
    return out


def delayed_ecg(z_ii):
    """z_II delayed by 1253 grid steps: zd(k) = z_II(k - 1253), NaN where k - 1253 has no valid reading."""
    out = np.full(len(z_ii), np.nan)
    out[DELAY:] = z_ii[:len(z_ii) - DELAY]
    return out
