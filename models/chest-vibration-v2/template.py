"""Beat template module (PROTOCOL.json template_module), evaluated at a set of cutoffs.

At cutoff t only beats with availability <= t and readings at grid <= t are used. Every mean is a
fixed sequence of elementwise additions over beats in beat order, and every P-search dot product a
fixed sequence over the 25 window offsets, so a value at cutoff t does not depend on which other
cutoffs are evaluated in the same call or on the length of the record.
"""
import math

import numpy as np

from common import H

S_LO, S_HI = -60, 360          # SCG template offsets
P_LO, P_HI = -75, -20          # P search offsets (300 to 80 ms before R)
P_HALF = 12                    # P half width
EARLY = 50                     # early window
AMP_LO, AMP_HI = 0.5, 2.0      # amplitude ratio
N_RR = 4                       # RR intervals in the estimate
E_BASE = (-100, -81)           # template readings that set the P baseline
E_NEEDED = (-100, P_HI + P_HALF)   # every ECG-template offset the P template can use: -100 .. -8
NB_OFFSETS = (-6, -3, 3, 6)


def _seq_sum(cols):
    """Sum of a list of equal-shape arrays, added in list order."""
    acc = cols[0].copy()
    for c in cols[1:]:
        acc += c
    return acc


def _rr_estimates(R):
    rr = np.full(len(R), np.nan)
    for j in range(N_RR, len(R)):
        rr[j] = float(np.median(np.diff(R[j - N_RR:j + 1])))
    return rr


def scg_template_at(z_scg, R, j, T, K, o):
    """S(o) at each row: the mean of z_SCG(R_i + o) over beats i = j-K..j with R_i + o <= t and a
    valid reading; NaN when no term qualifies or o lies outside -60..360."""
    m = len(T)
    if m == 0:
        return np.zeros(0)
    n = len(z_scg)
    inside = (o >= S_LO) & (o <= S_HI)
    terms, uses = [], []
    for i in range(K + 1):
        idx = R[j - K + i] + o
        use = inside & (idx <= T) & (idx >= 0)
        vals = z_scg[np.clip(idx, 0, n - 1)]
        use &= np.isfinite(vals)
        terms.append(np.where(use, vals, 0.0))
        uses.append(use.astype(np.int64))
    s = _seq_sum(terms)
    c = _seq_sum(uses)
    with np.errstate(invalid="ignore", divide="ignore"):
        return np.where(c > 0, s / np.maximum(c, 1), np.nan)


def p_template(z_ecg, R, A, j, K):
    """P template for last beat j, or None when an ECG-template value it needs is undefined.

    E(o) is the mean of z_ECG(R_i + o) over beats i = j-K..j-1 with R_i + o <= t and a valid reading.
    Only offsets -100..-8 can enter the P template, and for them R_i + o <= R_{j-1} - 8 < R_j <= A_j <= t,
    so the 'R_i + o <= t' condition holds at every cutoff whose last beat is j; the code applies it with
    t = A_j, the earliest such cutoff."""
    n = len(z_ecg)
    offs = np.arange(E_NEEDED[0], E_NEEDED[1] + 1)
    terms, uses = [], []
    for i in range(j - K, j):
        idx = R[i] + offs
        use = (idx <= A[j]) & (idx >= 0)
        vals = z_ecg[np.clip(idx, 0, n - 1)]
        use &= np.isfinite(vals)
        terms.append(np.where(use, vals, 0.0))
        uses.append(use.astype(np.int64))
    s = _seq_sum(terms)
    c = _seq_sum(uses)
    with np.errstate(invalid="ignore", divide="ignore"):
        E = np.where(c > 0, s / np.maximum(c, 1), np.nan)

    def at(o):
        return E[o - E_NEEDED[0]]

    base_vals = np.array([at(o) for o in range(E_BASE[0], E_BASE[1] + 1)])
    search = np.array([at(o) for o in range(P_LO, P_HI + 1)])
    if not (np.isfinite(base_vals).all() and np.isfinite(search).all()):
        return None
    base = float(np.median(base_vals))
    dP = P_LO + int(np.argmax(np.abs(search - base)))
    w = np.array([at(dP + u) for u in range(-P_HALF, P_HALF + 1)])
    if not np.isfinite(w).all():
        return None
    mean = float(_seq_sum([w[u:u + 1] for u in range(len(w))])[0]) / len(w)
    p = w - mean
    pn2 = float(_seq_sum([p[u:u + 1] * p[u:u + 1] for u in range(len(p))])[0])
    return dP, p, pn2, math.sqrt(pn2)


def p_correlations(z_ecg, q, dP, p, pn2, pn):
    """cc for candidate next-R times q (array): the correlation of the mean-removed ECG window
    ECG(q + dP + u), u = -12..12, with the P template; -1 for a window with an invalid reading or an
    amplitude ratio outside 0.5..2.0."""
    cols = [z_ecg[q + dP + u] for u in range(-P_HALF, P_HALF + 1)]
    valid = np.ones(len(q), dtype=bool)
    for c in cols:
        valid &= np.isfinite(c)
    mean = _seq_sum(cols) / len(cols)
    w = [c - mean for c in cols]
    dot = _seq_sum([w[u] * p[u] for u in range(len(w))])
    ww = _seq_sum([w[u] * w[u] for u in range(len(w))])
    with np.errstate(invalid="ignore"):
        cc = dot / (np.sqrt(ww) * pn + 1e-12)
        amp = dot / (pn2 + 1e-12)
        cc = np.where((amp >= AMP_LO) & (amp <= AMP_HI), cc, -1.0)
    return np.where(valid, cc, -1.0)


def run(R, A, z_scg, z_ecg, cutoffs, K, thetas=(), use_p=False):
    """Evaluate the template module at every cutoff.

    R, A: beat times and availability times (increasing). z_scg: standardised SCG (NaN = invalid).
    z_ecg: the ECG series of the templates and the P search (z_II, or its delayed form), only used when
    use_p. Returns a dict of float arrays (NaN = undefined) with 'defined', 'phi', 'rr', 'cont',
    'next_rr'; with use_p also 'pcorr' and 'qstar', and for each theta a dict out[theta] with 'has_p',
    'pred', 'next_p', 'phi_next' and 'nb-6', 'nb-3', 'nb+3', 'nb+6'."""
    R = np.asarray(R, dtype=np.int64)
    A = np.asarray(A, dtype=np.int64)
    T = np.asarray(cutoffs, dtype=np.int64)
    m = len(T)
    nan = np.full(m, np.nan)
    out = {"defined": np.zeros(m, dtype=bool), "phi": nan.copy(), "rr": nan.copy(),
           "cont": nan.copy(), "next_rr": nan.copy()}
    jall = np.searchsorted(A, T, side="right") - 1
    rr_beat = _rr_estimates(R)
    dmask = jall >= K + N_RR
    out["defined"] = dmask
    rows = np.flatnonzero(dmask)
    j = jall[rows]
    t = T[rows]
    phi = t + H - R[j]
    rr = rr_beat[j]
    out["phi"][rows] = phi
    out["rr"][rows] = rr
    out["cont"][rows] = scg_template_at(z_scg, R, j, t, K, phi)
    mm = np.rint(phi - rr).astype(np.int64)
    out["next_rr"][rows] = scg_template_at(z_scg, R, j, t, K, mm)
    if not use_p:
        return out

    pcorr = np.full(len(rows), -1.0)
    qstar = np.full(len(rows), -1, dtype=np.int64)
    n = len(z_ecg)
    # rows sharing a last beat j are contiguous in cutoff order only if the cutoffs are sorted; group by j
    order = np.lexsort((t, j))
    js = j[order]
    starts = np.flatnonzero(np.r_[True, js[1:] != js[:-1]])
    ends = np.r_[starts[1:], len(js)]
    for a, b in zip(starts, ends):
        sel = order[a:b]
        jj = int(js[a])
        pt = p_template(z_ecg, R, A, jj, K)
        if pt is None:
            continue                       # P search skipped: no candidate, pcorr = -1
        dP, p, pn2, pn = pt
        rrj = float(rr_beat[jj])
        qmin = math.floor(float(R[jj]) + max(0.7 * rrj, rrj - EARLY))
        qmax_rows = t[sel] - dP - P_HALF
        qmax_all = int(min(qmax_rows.max(), n - 1 - dP - P_HALF))
        if qmax_all < qmin:
            continue
        q = np.arange(qmin, qmax_all + 1, dtype=np.int64)
        cc = p_correlations(z_ecg, q, dP, p, pn2, pn)
        # first index of the running maximum: q* for a prefix of candidates
        best_idx = np.zeros(len(cc), dtype=np.int64)
        best_val = np.empty(len(cc))
        cur_i, cur_v = 0, cc[0]
        ccl = cc.tolist()
        for i, v in enumerate(ccl):
            if i == 0 or v > cur_v:
                cur_i, cur_v = i, v
            best_idx[i] = cur_i
            best_val[i] = cur_v
        last = qmax_rows - qmin
        has = last >= 0
        li = np.clip(last, 0, len(cc) - 1)
        pcorr[sel] = np.where(has, best_val[li], -1.0)
        qstar[sel] = np.where(has, qmin + best_idx[li], -1)
    out["pcorr"] = nan.copy()
    out["pcorr"][rows] = pcorr
    out["qstar"] = np.full(m, -1, dtype=np.int64)
    out["qstar"][rows] = qstar

    found = qstar >= 0
    phi_next_all = np.where(found, t + H - qstar, 0)
    in_range = found & (phi_next_all >= S_LO) & (phi_next_all <= S_HI)
    s_next = scg_template_at(z_scg, R, j, t, K, phi_next_all)
    next_p_all = np.where(in_range, s_next, 0.0)
    nb_phi = {o: scg_template_at(z_scg, R, j, t, K, phi + o) for o in NB_OFFSETS}
    nb_next = {o: scg_template_at(z_scg, R, j, t, K, phi_next_all + o) for o in NB_OFFSETS}
    cont = out["cont"][rows]
    for theta in thetas:
        has_p = found & (pcorr >= theta)
        res = {"has_p": np.zeros(m), "pred": nan.copy(), "next_p": nan.copy(), "phi_next": nan.copy()}
        res["has_p"][rows] = has_p.astype(np.float64)
        res["pred"][rows] = np.where(has_p, next_p_all, cont)
        res["next_p"][rows] = np.where(has_p, next_p_all, np.nan)
        res["phi_next"][rows] = np.where(has_p, phi_next_all, np.nan)
        dstar = np.where(has_p, phi_next_all, phi)
        for o in NB_OFFSETS:
            v = np.where(has_p, nb_next[o], nb_phi[o])
            inside = (dstar + o >= S_LO) & (dstar + o <= S_HI)
            res[f"nb{o:+d}"] = nan.copy()
            res[f"nb{o:+d}"][rows] = np.where(inside, v, np.nan)
        out[theta] = res
    return out
