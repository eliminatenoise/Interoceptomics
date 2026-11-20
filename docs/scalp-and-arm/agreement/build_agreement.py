"""Count directions of cue-aligned change across seven execution participants, offline."""
import argparse
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from functools import partial
import hashlib
import json
import math
import mmap
import os
from pathlib import Path
from statistics import fmean, median
import sys
from tempfile import NamedTemporaryFile

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "measurements"))
from build_fields import window_median
from ofner_source import CUES, EEG_SITES, HEADER_LABELS, RATES, Run, digests, require

PROTOCOL_SHA = "c6232212c32d987e3ea9e7e6c03fff64a24d6f985cd2bdbc744835f50491354a"


def source_name(person, number):
    require(person in range(1, 8) and number in range(1, 4), "Outside cohort")
    return f"motorexecution_subject{person}_run{number}.gdf"


class ExecutionRun(Run):
    """Use the atlas's original two-grid reader with a cohort file identity."""
    def _check_labels(self, labels):
        require(labels[:61] in (("eeg",) * 61, EEG_SITES), "Unexpected scalp site order")
        require(labels[61:64] in (("eog-r", "eog-m", "eog-l"), ("eog-l", "eog-m", "eog-r")),
                "Unexpected eye channels")
        require(labels[64:] == HEADER_LABELS[64:], "Unexpected mechanical labels")

    def __init__(self, cache, name, identity):
        self.path = cache / name
        with self.path.open("rb") as stream:
            require(digests(stream) == tuple(identity), f"Unexpected file size or digest for {name}")
            self._data = mmap.mmap(stream.fileno(), 0, access=mmap.ACCESS_READ)
        try:
            self._read_layout()
        except Exception:
            self.close()
            raise


def varies(run, channel):
    rate = RATES[channel - 1]
    first = None
    for record in range(run.records):
        for sample in run.window(channel, record * rate, (record + 1) * rate):
            if math.isfinite(sample):
                if first is None:
                    first = sample
                elif sample != first:
                    return True
    return False


def summarize(run, protocol):
    events = Counter(run.events)
    cues = [(tick, code) for tick, code in run.events if code in CUES]
    require(Counter(code for _, code in cues) == {code: 6 for code in CUES}, "Cue census changed")
    require(len(set(tick for tick, _ in cues)) == len(cues), "Coincident cue onsets")
    require(all(events[tick, code] == events[tick + 1536, code + 32768] == 1
                for tick, code in cues), "Cue end mismatch")
    values = defaultdict(list)
    for channels in protocol["channel_groups"].values():
        for channel in channels:
            if not varies(run, channel):
                continue
            for tick, code in cues:
                before, failure = window_median(run, channel, tick, protocol["baseline_ticks"])
                if failure:
                    continue
                for index, offsets in enumerate(protocol["window_ticks"]):
                    after, failure = window_median(run, channel, tick, offsets)
                    if not failure:
                        values[code, index, channel].append(after - before)
    return {cell: median(repeats) for cell, repeats in values.items() if len(repeats) >= 3}


def summarize_person(person, cache, protocol, inventory):
    summaries = []
    for number in protocol["runs"]:
        name = source_name(person, number)
        with ExecutionRun(cache, name, inventory[name]) as run:
            summaries.append(summarize(run, protocol))
    complete = summaries[0].keys() & summaries[1].keys() & summaries[2].keys()
    result = {}
    for key in complete:
        mean = fmean(run[key] for run in summaries)
        result[key] = "higher" if mean > 0 else "lower" if mean < 0 else "unchanged"
    return result


def aggregate(people, protocol):
    windows = [{"id": f"w{i}", "start_s": a / 512, "stop_s": b / 512}
               for i, (a, b) in enumerate(protocol["window_ticks"])]
    counts = defaultdict(Counter)
    for person in people:
        for cell, sign in person.items():
            counts[cell][sign] += 1
    tasks = []
    for code, label in CUES.items():
        rows = []
        for i, window in enumerate(windows):
            row = {"id": window["id"]}
            for group, channels in protocol["channel_groups"].items():
                row[group] = []
                for channel in channels:
                    cell = counts[code, i, channel]
                    valid = sum(cell.values())
                    row[group].append([cell["higher"], cell["lower"], cell["unchanged"], 7 - valid])
            rows.append(row)
        tasks.append({"code": code, "label": label, "windows": rows})
    labels = dict(enumerate(EEG_SITES, 1))
    labels.update({62: "Eye 62", 63: "Eye 63", 64: "Eye 64", 93: "Elbow",
                   94: "Forearm rotation", 68: "Index finger near joint"})
    return {
        "study_doi": "10.1371/journal.pone.0182578", "dataset_doi": "10.5281/zenodo.834976",
        "licence": "CC BY 4.0", "protocol_sha256": PROTOCOL_SHA,
        "people": 7, "runs_per_person": 3, "cues_per_task_per_run": 6,
        "count_order": ["higher", "lower", "unchanged", "unavailable"],
        "baseline_s": [a / 512 for a in protocol["baseline_ticks"]], "windows": windows,
        "channels": {group: [{"index": ch, "label": labels[ch], "rate_hz": RATES[ch - 1]}
                             for ch in channels] for group, channels in protocol["channel_groups"].items()},
        "tasks": tasks,
    }


def atomic_write(path, text):
    with NamedTemporaryFile(dir=path.parent, delete=False, mode="w", encoding="utf-8", newline="\n") as file:
        tmp = Path(file.name)
        try:
            file.write(text)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise
    try:
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cache", type=Path, help="private directory containing the 21 original GDFs")
    parser.add_argument("output_dir", type=Path, help="directory for JSON and its offline reader copy")
    parser.add_argument("--workers", type=int, choices=range(1, 8), default=1,
                        help="people to read concurrently; default 1")
    args = parser.parse_args()
    raw = (HERE / "protocol.json").read_bytes()
    require(hashlib.sha256(raw).hexdigest() == PROTOCOL_SHA, "Protocol hash differs")
    protocol = json.loads(raw)
    inventory = json.loads((HERE / "source-files.json").read_text())
    require(set(inventory) == {source_name(p, r) for p in protocol["people"] for r in protocol["runs"]},
            "Expected 21 motor execution identities")
    worker = partial(summarize_person, cache=args.cache, protocol=protocol, inventory=inventory)
    if args.workers == 1:
        product = aggregate(map(worker, protocol["people"]), protocol)
    else:
        with ProcessPoolExecutor(max_workers=args.workers) as pool:
            product = aggregate(pool.map(worker, protocol["people"]), protocol)
    encoded = json.dumps(product, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    atomic_write(args.output_dir / "counts.json", encoded + "\n")
    atomic_write(args.output_dir / "counts.js", "const AGREEMENT = " + encoded + ";\n")
    print(hashlib.sha256((encoded + "\n").encode()).hexdigest(), "counts.json")


if __name__ == "__main__":
    main()
