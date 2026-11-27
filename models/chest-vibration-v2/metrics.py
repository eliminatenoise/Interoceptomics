"""Error metrics, comparisons, bootstrap and verdict rule (PROTOCOL.json metrics, uncertainty,
success_rules). People are the unit of replication; each person counts once."""
import numpy as np

from common import BOOTSTRAP_SEED

N_BOOT = 10000


def rmse(f, y):
    d = np.asarray(f, dtype=np.float64) - np.asarray(y, dtype=np.float64)
    return float(np.sqrt(np.mean(d * d)))


def mae(f, y):
    return float(np.mean(np.abs(np.asarray(f, dtype=np.float64) - np.asarray(y, dtype=np.float64))))


def relative_reduction(model_rmse, comparator_rmse):
    """100 x (comparator RMSE - model RMSE) / comparator RMSE, in percent; positive = model lower."""
    return 100.0 * (comparator_rmse - model_rmse) / comparator_rmse


def summary(values):
    v = np.asarray(values, dtype=np.float64)
    return {"mean": float(v.mean()), "median": float(np.median(v)), "range": [float(v.min()), float(v.max())],
            "n": int(len(v))}


def k_of_n(n):
    """ceil(0.8 n) in integer arithmetic: 6 of 7, 5 of 6, 4 of 5."""
    return (4 * n + 4) // 5


def bootstrap_index(n, seed=BOOTSTRAP_SEED, draws=N_BOOT):
    """One index matrix per scoring group: 10,000 resamples of the n people with replacement."""
    return np.random.default_rng(seed).integers(0, n, size=(draws, n))


def percentile_interval(index, values):
    v = np.asarray(values, dtype=np.float64)
    means = v[index].mean(axis=1)
    lo, hi = np.percentile(means, [2.5, 97.5])
    return [float(lo), float(hi)]


def compare(model_rmse, comparator_rmse, people, index=None):
    """Per-person relative reduction of model against comparator, its summary, wins (ties are not
    wins), the mean difference in mV (comparator - model) and, with an index matrix, percentile 95%
    intervals of the mean reduction and of the mean difference."""
    red = [relative_reduction(m, c) for m, c in zip(model_rmse, comparator_rmse)]
    diff = [c - m for m, c in zip(model_rmse, comparator_rmse)]
    out = {"per_person_percent": dict(zip(people, red)),
           "per_person_difference_mV": dict(zip(people, diff)),
           "reduction_percent": summary(red), "wins": int(sum(r > 0 for r in red)),
           "mean_difference_mV": float(np.mean(diff))}
    if index is not None:
        out["reduction_percent_ci95"] = percentile_interval(index, red)
        out["difference_mV_ci95"] = percentile_interval(index, diff)
    return out


def beats(comparison, n):
    """'v2 beats X': mean reduction > 0, at least k(n) of n wins, bootstrap 95% lower bound > 0."""
    return bool(comparison["reduction_percent"]["mean"] > 0 and comparison["wins"] >= k_of_n(n)
                and comparison["reduction_percent_ci95"][0] > 0)
