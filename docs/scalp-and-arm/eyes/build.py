"""Reproduce the scalp–eye cohort cells from verified local execution recordings."""
import argparse
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from hashlib import sha256
import json
import math
from pathlib import Path
from statistics import fmean, median
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "agreement"))
from build_agreement import CUES, EEG_SITES, ExecutionRun, atomic_write, require, source_name

PROTOCOL_SHA = "461eb0a4fcb5efbf6b164274bb08f229c6ed21b8dd4b426f2dc5669383d1c5e5"
PEOPLE = range(1, 8)
RUNS = range(1, 4)
EYES = (62, 63, 64)
WINDOWS = ("precue", "postcue")
SCOPES = ("finite_pairs", "baseline_screened_pairs")
METRICS = ("mean_r2", "median_abs_r")


def centered(values):
    if not all(map(math.isfinite, values)):
        return (None, "nonfinite")
    if max(values) == min(values):
        return (None, "constant")
    mean = fmean(values)
    residual = [v - mean for v in values]
    norm = math.sqrt(math.sumprod(residual, residual))
    return ([v / norm for v in residual], None)


def signal_traces(channels, sites):
    for name, members in sites.items():
        first = channels[members[0]]
        if len(members) == 1:
            yield name, first
        elif name == "C3_minus_C4":
            yield name, [a - b for a, b in zip(first, channels[members[1]], strict=True)]
        else:
            yield name, [(a + b) / 2 for a, b in zip(first, channels[members[1]], strict=True)]


def read_trial(run, tick, sites):
    raw = {c: run.window(c, tick - 128, tick + 129)
           for c in (*[v[0] for v in sites.values() if len(v) == 1], *EYES)}
    sds = {}
    for channel, values in raw.items():
        before = values[:128]
        if all(map(math.isfinite, before)):
            avg = fmean(before)
            sds[channel] = math.sqrt(fmean((v - avg)**2 for v in before))
        else:
            sds[channel] = math.nan
    traces = {}
    for window, bounds in zip(WINDOWS, (slice(0, 128), slice(129, 257)), strict=True):
        channels = {ch: vals[bounds] for ch, vals in raw.items()}
        traces[window] = {name: centered(x) for name, x in signal_traces(channels, sites)}
        traces[window].update({eye: centered(channels[eye]) for eye in EYES})
    return traces, sds, all(all(map(math.isfinite, values)) for values in raw.values())


def screen_trials(trials):
    refs = {}
    for channel in trials[0][1]:
        values = [sds[channel] for _, sds, _ in trials if math.isfinite(sds[channel])]
        refs[channel] = median(values) if values else math.nan
    return [complete and all(refs[c] > 0 and sd > 1e-8 and 0.1 * refs[c] <= sd <= 5 * refs[c]
                             for c, sd in sds.items()) for _, sds, complete in trials]


def signed_correlation(a, b):
    return max(-1., min(1., math.sumprod(a, b)))


def compare_run(run, sites):
    events = Counter(run.events)
    onsets = [(t, c) for t, c in run.events if c in CUES]
    require(onsets == sorted(onsets) and len({t for t, _ in onsets}) == 42, "Cue order/count changed")
    require(Counter(c for _, c in onsets) == {c: 6 for c in CUES}, "Cue census changed")
    by_cue = defaultdict(list)
    trials = []
    for i, (tick, code) in enumerate(onsets):
        end = onsets[i+1][0] if i+1 < len(onsets) else run.records*512
        require([t for t,c in run.events if tick < t <= end and c == code+32768] == [tick + 1536],
                "Unexpected cue end")
        require(all(events[tick-1024, c] == 1 for c in (0x300, 0x311, 0x312)), "Missing precursor")
        by_cue[code].append(i)
        trials.append(read_trial(run, tick, sites))
    clean = screen_trials(trials)
    values = defaultdict(lambda: [[], [], Counter()])
    for group in by_cue.values():
        for pos, i in enumerate(group):
            j = group[(pos + 1) % len(group)]
            for window in WINDOWS:
                same, other = trials[i][0][window], trials[j][0][window]
                for signal in sites:
                    for eye in EYES:
                        traces = (same[signal], same[eye], other[eye])
                        causes = {reason for _, reason in traces if reason is not None}
                        if not causes:
                            a, b, d = (arr for arr, _ in traces)
                            pair = signed_correlation(a, b), signed_correlation(a, d)
                        for scope in SCOPES:
                            xs, ys, reasons = values[(window, signal, eye, scope)]
                            reasons.update(causes)
                            if scope == "baseline_screened_pairs" and not (clean[i] and clean[j]):
                                reasons["screen"] += 1
                                continue
                            if not causes:
                                xs.append(pair[0])
                                ys.append(pair[1])
    result = {}
    for key, (same, shifted, reasons) in values.items():
        metrics = {}
        if same:
            metrics["mean_r2"] = [fmean(v*v for v in col) for col in (same, shifted)]
            metrics["median_abs_r"] = [median(map(abs, col)) for col in (same, shifted)]
        result[key] = (len(same), reasons, metrics)
    return result


def read_person(person, cache, sites, inventory):
    out = []
    for r in RUNS:
        name = source_name(person, r)
        with ExecutionRun(cache, name, inventory[name]) as run:
            out.append(compare_run(run, sites))
    return out


def percentile(values, q):
    if not values:
        return None
    v = sorted(values)
    pos = (len(v) - 1) * q
    lo, hi = math.floor(pos), math.ceil(pos)
    return v[lo] + (v[hi] - v[lo]) * (pos - lo)


def collect(people):
    cells = []
    for window, signal, eye, scope in people[0][0]:
        samples = [[r[window, signal, eye, scope] for r in person] for person in people]
        admitted = [rows for rows in samples if all(n > 0 for n, _, _ in rows)]
        pairs = [sum(n for n, _, _ in rows) for rows in admitted]
        excluded = Counter()
        for rows in samples:
            for _, causes, _ in rows:
                excluded.update(causes)
        cell = dict(window=window, signal=signal, eye=eye, scope=scope,
                    participants=len(admitted), runs=len(admitted)*3, pairs=sum(pairs),
                    evaluated_pairs=882, pairs_per_person_range=[min(pairs), max(pairs)] if pairs else [],
                    excluded_by_cause={k: excluded[k] for k in ("constant","nonfinite","screen")})
        for metric in METRICS:
            reduce = fmean if metric == "mean_r2" else median
            person_stats = [[reduce(row[2][metric][i] for row in rows) for i in range(2)]
                            for rows in admitted]
            result = {}
            for i, label in enumerate(("same", "shifted")):
                col = [v[i] for v in person_stats]
                result[label] = {"estimate": reduce(col) if col else None,
                                 "person_q25": percentile(col, .25), "person_q75": percentile(col, .75)}
            result["same_vs_shifted_people"] = [sum(a > b for a,b in person_stats),
                                                sum(a == b for a,b in person_stats),
                                                sum(a < b for a,b in person_stats)]
            cell[metric] = result
        cells.append(cell)
    return cells


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cache", type=Path)
    parser.add_argument("--out", type=Path, default=HERE)
    parser.add_argument("--workers", type=int, choices=(1, 2), default=1)
    args = parser.parse_args()
    protocol = (HERE / "protocol.json").read_bytes()
    require(sha256(protocol).hexdigest() == PROTOCOL_SHA, "Changed protocol")
    spec = json.loads(protocol)
    src = (HERE.parent / "agreement/source-files.json").read_bytes()
    require(sha256(src).hexdigest() in spec["source"], "Changed source identities")
    inventory = json.loads(src)
    require(set(inventory) == {source_name(p,r) for p in PEOPLE for r in RUNS}, "Wrong file roster")
    sites = spec["signals"]
    for name, indices in sites.items():
        if len(indices) == 1:
            require(EEG_SITES[indices[0]-1] == name, "Changed site identity")
    worker = partial(read_person, cache=args.cache, sites=sites, inventory=inventory)
    if args.workers == 1:
        rows = list(map(worker, PEOPLE))
    else:
        with ProcessPoolExecutor(max_workers=args.workers) as pool:
            rows = list(pool.map(worker, PEOPLE))
    payload = dict(protocol_sha256=PROTOCOL_SHA, study_doi="10.1371/journal.pone.0182578",
                   dataset_doi="10.5281/zenodo.834976", licence="CC BY 4.0",
                   signals=sites, cells=collect(rows))
    require(len(payload["cells"]) == 120, "Incomplete comparison grid")
    serialized = json.dumps(payload, allow_nan=False, separators=(",", ":"))
    args.out.mkdir(parents=True, exist_ok=True)
    atomic_write(args.out / "cohort.json", serialized + "\n")
    atomic_write(args.out / "cohort.js", "const SCALP_EYES = " + serialized + ";\n")


if __name__ == "__main__":
    main()
