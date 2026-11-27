"""Feature blocks, row mask and no-weight arms at a set of cutoffs (PROTOCOL.json feature_blocks,
inputs.valid_row_mask, models_and_controls.no_fitted_weights). All values in z units of the person's
calibration; arms are decoded to SCG mV elsewhere."""
import numpy as np

import detectors as det
import template
from common import DELAY, H

B2_COLUMNS = ["cont", "next_rr", "phi_s", "rr_s"]
B3_COLUMNS = ["pred", "cont", "next_p", "next_rr", "has_p", "pcorr", "nb-6", "nb-3", "nb+3", "nb+6",
              "phi_s", "phi_next_s", "rr_s"]
NO_WEIGHT_ARMS = ["C0", "C1", "C2", "C3", "C3d", "C5", "T-ECG", "T-delayed", "T-R"]
CHEST_END_MARGIN = 7   # 7 in every fit and forecast; causality.py sets 8 only to document the deviation


def _fill(v, f):
    return np.where(np.isfinite(v), v, f)


def zero_missing(v):
    return np.where(np.isfinite(v), v, 0.0)


def record_state(z):
    """Detector outputs for a record. z: (n, 3) standardised II, RESP, SCG (NaN = missing)."""
    z_ii, z_scg = z[:, 0], z[:, 2]
    zd = det.delayed_ecg(z_ii)
    R, A = det.r_v2(zero_missing(z_ii))
    Rd, Ad = det.r_v2(zero_missing(zd))
    Rc, Ac = det.chest_v2(zero_missing(z_scg), end_margin=CHEST_END_MARGIN)
    last = det.c3_last_peak(z_ii)
    return {"z": z, "z_ii_delayed": zd, "R": R, "A": A, "Rd": Rd, "Ad": Ad, "Rc": Rc, "Ac": Ac,
            "tsb": det.tsb_from_last(last), "tsb_d": det.tsb_from_last(last, DELAY)}


def lags(v, T, offs):
    return v[T[:, None] - np.asarray(offs, dtype=np.int64)[None, :]]


def block_b0(z, T):
    return np.hstack([lags(z[:, 2], T, range(51)), lags(z[:, 1], T, range(51))])


def block_b1(z, T):
    return np.hstack([lags(z[:, 2], T, range(300)), lags(z[:, 1], T, range(0, 300, 5))])


def block_v1_ecg(z, T, delay=0):
    lv = lags(z[:, 0], T - delay, range(51))
    ch = np.abs(lv - lags(z[:, 0], T - delay, range(1, 52)))
    return np.hstack([lv, ch])


def block_b2(state, T, K):
    o = template.run(state["Rc"], state["Ac"], state["z"][:, 2], None, T, K, use_p=False)
    return np.column_stack([_fill(o["cont"], 0.0), _fill(o["next_rr"], 0.0),
                            _fill(o["phi"] / 250, -1.0), _fill(o["rr"] / 250, 0.0)])


def _b3_columns(o, theta):
    r = o[theta]
    return np.column_stack([
        _fill(r["pred"], 0.0), _fill(o["cont"], 0.0), _fill(r["next_p"], 0.0), _fill(o["next_rr"], 0.0),
        _fill(r["has_p"], 0.0), _fill(o["pcorr"], 0.0),
        _fill(r["nb-6"], 0.0), _fill(r["nb-3"], 0.0), _fill(r["nb+3"], 0.0), _fill(r["nb+6"], 0.0),
        _fill(o["phi"] / 250, -1.0), _fill(r["phi_next"] / 250, -1.0), _fill(o["rr"] / 250, 0.0)])


def blocks_b3(state, T, K, thetas, delayed=False):
    """{theta: B3 (or B3d) array (m, 13)} for every theta, from one evaluation of the module."""
    if delayed:
        o = template.run(state["Rd"], state["Ad"], state["z"][:, 2], state["z_ii_delayed"], T, K,
                         thetas, use_p=True)
    else:
        o = template.run(state["R"], state["A"], state["z"][:, 2], state["z"][:, 0], T, K,
                         thetas, use_p=True)
    return {th: _b3_columns(o, th) for th in thetas}, o


def row_mask(z, T):
    """Common valid-row mask: target z_SCG(t + 20) finite, z_SCG(t - l) for l = 0..299, z_RESP(t - l)
    for l = 0..295, z_II(t - l) and z_II(t - 1253 - l) for l = 0..51."""
    n = len(z)
    ok = (T + H) < n
    tgt = np.full(len(T), np.nan)
    tgt[ok] = z[T[ok] + H, 2]
    m = np.isfinite(tgt)
    m &= np.isfinite(lags(z[:, 2], T, range(300))).all(axis=1)
    m &= np.isfinite(lags(z[:, 1], T, range(296))).all(axis=1)
    m &= np.isfinite(lags(z[:, 0], T, range(52))).all(axis=1)
    m &= np.isfinite(lags(z[:, 0], T - DELAY, range(52))).all(axis=1)
    return m


def linear_trend(z_scg, T):
    """C2: least-squares line through z_SCG(t-12..t) at positions -12..0, evaluated at +20."""
    ys = [z_scg[T + p] for p in range(-12, 1)]
    ybar = ys[0].copy()
    for y in ys[1:]:
        ybar += y
    ybar /= 13.0
    num = (-12 + 6) * ys[0]
    for i, p in enumerate(range(-11, 1), start=1):
        num = num + (p + 6) * ys[i]
    slope = num / 182.0
    return ybar + slope * (H + 6)


def compute(z, T, K, theta, state=None):
    """Every feature block and no-weight arm at cutoffs T for the chosen (K, theta).

    Returns (features dict, no-weight arms dict, diagnostics dict)."""
    T = np.asarray(T, dtype=np.int64)
    if state is None:
        state = record_state(z)
    b3, o3 = blocks_b3(state, T, K, (theta,))
    b3d, _ = blocks_b3(state, T, K, (theta,), delayed=True)
    feats = {"B0": block_b0(z, T), "B1": block_b1(z, T), "B2": block_b2(state, T, K),
             "B3": b3[theta], "B3d": b3d[theta],
             "V1E": block_v1_ecg(z, T), "V1Ed": block_v1_ecg(z, T, DELAY)}
    arms = {"C0": np.zeros(len(T)), "C1": z[T, 2].copy(), "C2": linear_trend(z[:, 2], T),
            "C3": det.c3_forecast(state["tsb"], z[:, 2], T),
            "C3d": det.c3_forecast(state["tsb_d"], z[:, 2], T),
            "C5": feats["B2"][:, 0].copy(), "T-ECG": feats["B3"][:, 0].copy(),
            "T-delayed": feats["B3d"][:, 0].copy(), "T-R": feats["B3"][:, 1].copy()}
    jl = np.searchsorted(state["A"], T, side="right") - 1
    pos = np.where(jl >= 0, T + H - state["R"][np.clip(jl, 0, None)], -1)
    diag = {"pos_after_last_R": pos.astype(np.int64), "template_defined": o3["defined"].astype(np.int8),
            "has_p": o3[theta]["has_p"].astype(np.int8)}
    return feats, arms, diag, state


def column_names(blocks):
    names = {
        "B0": [f"scg_lag{l}" for l in range(51)] + [f"resp_lag{l}" for l in range(51)],
        "B1": [f"scg_lag{l}" for l in range(300)] + [f"resp_lag{l}" for l in range(0, 300, 5)],
        "V1E": [f"ii_lag{l}" for l in range(51)] + [f"ii_abs_change_lag{l}" for l in range(51)],
        "V1Ed": [f"ii_delayed_lag{l}" for l in range(51)] + [f"ii_delayed_abs_change_lag{l}" for l in range(51)],
        "B2": [f"chest_{c}" for c in B2_COLUMNS],
        "B3": [f"ecg_{c}" for c in B3_COLUMNS],
        "B3d": [f"ecg_delayed_{c}" for c in B3_COLUMNS],
    }
    return [n for b in blocks for n in names[b]]


def detector_summary(state, lo=2500, hi=72500):
    """R_v2 beats in 10-290 s, their RR median and range (s), chest_v2 beats in 10-290 s."""
    R = state["R"]
    r = R[(R >= lo) & (R < hi)]
    rr = np.diff(r) / 250.0
    rc = state["Rc"][(state["Rc"] >= lo) & (state["Rc"] < hi)]
    return {"R_v2_beats": int(len(r)),
            "RR_median_s": float(np.median(rr)) if len(rr) else None,
            "RR_range_s": [float(rr.min()), float(rr.max())] if len(rr) else None,
            "chest_v2_beats": int(len(rc))}
