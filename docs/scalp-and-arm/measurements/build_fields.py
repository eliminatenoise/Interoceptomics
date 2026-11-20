"""Rebuild the Ofner cue-aligned scalp, EOG and movement summaries. Python 3.9+."""
import argparse
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from functools import partial
import hashlib
import json
import math
import os
from pathlib import Path
from statistics import fmean, median
from tempfile import NamedTemporaryFile

from ofner_source import CUES, DOI, EEG_SITES, FILES, RATES, Run, filename, require

PROTOCOL_PATH = Path(__file__).with_name("protocol.json")
PROTOCOL_SHA = "7c72fda1a8a6cca7ccd545ee2f5a063fdc03352ad0b6ff08a3ec6c19ca259225"
REASONS = ("baseline_bounds", "baseline_nonfinite", "post_bounds", "post_nonfinite")


def load_protocol():
    raw = PROTOCOL_PATH.read_bytes()
    require(hashlib.sha256(raw).hexdigest() == PROTOCOL_SHA, "Unexpected protocol edition")
    return json.loads(raw)


def window_median(run, channel, cue, offsets):
    rate = RATES[channel - 1]
    # Both half-open endpoints use integer ceiling, including off-grid movement cues.
    first, stop = (((cue + offset) * rate + 511) // 512 for offset in offsets)
    if not 0 <= first < stop <= run.records * rate:
        return None, "bounds"
    samples = run.window(channel, first, stop)
    if len(samples) != stop - first:
        raise ValueError("Reader returned a different number of samples")
    if not all(map(math.isfinite, samples)):
        return None, "nonfinite"
    return median(samples), None


def summarize_run(number, cache, protocol):
    deltas = defaultdict(list)
    excluded = Counter()
    with Run(cache, number) as run:
        event_counts = Counter(run.events)
        onsets = [(tick, code) for tick, code in run.events if code in CUES]
        expected = {code: protocol["expected_cues_per_code_per_run"] for code in CUES}
        require(Counter(code for _, code in onsets) == expected, "Unexpected cue census")
        require(all(event_counts[(tick, code)] == event_counts[(tick + 1536, code + 0x8000)] == 1
                    for tick, code in onsets), "Unexpected cue boundary")
        for tick, code in onsets:
            for indices in protocol["channels"].values():
                for channel in indices:
                    base, fail = window_median(run, channel, tick, protocol["baseline_ticks"])
                    for index, offsets in enumerate(protocol["window_ticks"]):
                        if fail:
                            excluded["baseline_" + fail] += 1
                            continue
                        post, fail_post = window_median(run, channel, tick, offsets)
                        if fail_post:
                            excluded["post_" + fail_post] += 1
                            continue
                        deltas[(code, index, channel)].append(post - base)
    stats = {key: (len(values), median(values) if len(values) >= 3 else None)
             for key, values in deltas.items()}
    return stats, excluded


def eeg_palette(tasks):
    changes = [value for task in tasks for window in task["windows"]
               for value in window["eeg"] if value is not None]
    require(changes, "No finite EEG values for a color scale")
    ordered = sorted(map(abs, changes))
    lower_index, remainder = divmod(95 * (len(ordered) - 1), 100)
    upper_index = min(lower_index + 1, len(ordered) - 1)
    limit = ordered[lower_index] + (ordered[upper_index] - ordered[lower_index]) * remainder / 100
    return {"percentile": 95, "method": "linear (type 7) on absolute finite EEG changes",
            "limit": limit, "lower": -limit, "upper": limit, "count": len(changes),
            "clipped_low": sum(x < -limit for x in changes),
            "clipped_high": sum(x > limit for x in changes)}


def make_product(protocol, results):
    windows = [{"id": f"w{i}", "start_s": start / 512, "stop_s": stop / 512}
               for i, (start, stop) in enumerate(protocol["window_ticks"])]
    labels = {**dict(enumerate(EEG_SITES, 1)), 62: "EOG 62", 63: "EOG 63", 64: "EOG 64",
              93: "elbow", 94: "forearm rotation", 68: "index near"}
    groups = protocol["channels"]
    channels = {group: [{"index": channel, "label": labels[channel], "unit": "stored units",
                         "rate_hz": RATES[channel - 1]} for channel in indices]
                for group, indices in groups.items()}
    excluded = Counter()
    for _, causes in results:
        excluded.update(causes)
    counts = Counter()
    tasks = []
    for code, label in CUES.items():
        task = {"code": code, "label": label, "trials": 18, "windows": []}
        for index, window in enumerate(windows):
            row = {"id": window["id"], "valid_trials": {}, "valid_runs": {}}
            for group, indices in groups.items():
                row[group] = []
                row["valid_trials"][group] = []
                row["valid_runs"][group] = []
                for channel in indices:
                    observations = [stats.get((code, index, channel), (0, None))
                                    for stats, _ in results]
                    available = [value for _, value in observations if value is not None]
                    repeats = [count for count, _ in observations]
                    counts.update(repeats)
                    row[group].append(fmean(available) if len(available) == 3 else None)
                    row["valid_trials"][group].append(sum(repeats))
                    row["valid_runs"][group].append(len(available))
            task["windows"].append(row)
        tasks.append(task)
    start, stop = (v / 512 for v in protocol["baseline_ticks"])
    excluded_count = sum(excluded.values())
    expected_count = 126 * len(windows) * sum(map(len, groups.values()))
    require(sum(n*k for n, k in counts.items()) + excluded_count == expected_count,
            "Inconsistent trial accounting")
    return {
        "schema_version": 1, "protocol_sha256": PROTOCOL_SHA,
        "source": {
            "authors": ["Patrick Ofner", "Andreas Schwarz", "Joana Pereira", "Gernot R. Müller-Putz"],
            "dataset": "https://doi.org/" + DOI, "paper": "https://doi.org/10.1371/journal.pone.0182578",
            "codebook": "https://zenodo.org/records/834976/files/data%20set%20description.pdf",
            "license": "CC BY 4.0", "license_url": "https://creativecommons.org/licenses/by/4.0/",
            "files_sha256": {filename(number): identity[2] for number, identity in FILES.items()},
        },
        "cohort": {"participant": "S1", "people": 1, "session": "right-arm motor execution",
                   "runs": [1, 2, 3], "cues_per_task_per_run": 6, "trials_per_task": 18, "trials": 126},
        "baseline": {"start_s": start, "stop_s": stop}, "windows": windows,
        "channels": channels, "tasks": tasks, "eeg_scale": eeg_palette(tasks),
        "availability": {
            "unit": "task × window × channel × trial",
            "expected_contrasts": expected_count, "eligible_contrasts": expected_count - excluded_count,
            "excluded_contrasts": {key: excluded[key] for key in REASONS},
            "complete_trials_per_run_cell": {"min": min(counts), "max": max(counts)},
            "run_cells_by_complete_trial_count": {str(n): k for n, k in sorted(counts.items())},
        },
        "interpretation": protocol["interpretation"],
        "method": "Within each trial, subtract the baseline median from the window median. Within each run, take the median by cue. Average the three run medians with equal weight. Samples remain on the native grids.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cache", type=Path, help="private directory with the three original GDF files")
    parser.add_argument("output", type=Path, help="destination JSON file")
    parser.add_argument("--workers", type=int, choices=(1, 2, 3), default=1,
                        help="number of runs to read concurrently")
    args = parser.parse_args()
    protocol = load_protocol()
    study_run = partial(summarize_run, cache=args.cache, protocol=protocol)
    if args.workers == 1:
        results = list(map(study_run, protocol["runs"]))
    else:
        with ProcessPoolExecutor(max_workers=args.workers) as pool:
            results = list(pool.map(study_run, protocol["runs"]))
    product = make_product(protocol, results)
    raw = (json.dumps(product, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n").encode()
    temp = None
    try:
        with NamedTemporaryFile(dir=args.output.parent, delete=False) as output:
            temp = Path(output.name)
            output.write(raw)
        os.replace(temp, args.output)
    finally:
        if temp:
            temp.unlink(missing_ok=True)
    print(f"{hashlib.sha256(raw).hexdigest()}  {args.output}")


if __name__ == "__main__":
    main()
