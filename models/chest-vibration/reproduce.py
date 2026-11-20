"""Verify the CEBSDB release, fit three ridge models and score held-out volunteers."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

from predict import HORIZON_STEPS, apply, features

HERE = Path(__file__).resolve().parent
PROTOCOL_SHA = "6e3be3dd3a3fb19a643865df1953616d88cd927fe192904de1ed2e1a095bf5f5"
SOURCE_URL = "https://physionet.org/files/cebsdb/1.0.0/"
RAW_RATE = 5000
STEP = 20
GRID_RATE = RAW_RATE // STEP
FIRST_GRID = 60 * GRID_RATE
CUTS = np.arange(90 * GRID_RATE, 120 * GRID_RATE) - FIRST_GRID
DELAY = 1253
ALPHA = 0.02
ARMS = ("base", "aligned", "delayed")
SCORES = (*ARMS, "aligned_with_delayed_input", "persistence")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_checked(folder, name, pin, fetch):
    path = folder / name
    if path.is_file():
        data = path.read_bytes()
    elif fetch:
        with urlopen(SOURCE_URL + name, timeout=60) as response:
            data = response.read()
    else:
        raise FileNotFoundError(f"{path} missing. Use --fetch to retrieve the source.")
    if digest(data) != pin:
        raise ValueError(f"Wrong SHA-256 for {name}")
    if not path.exists():
        path.write_bytes(data)
    return data


def archive_index(folder, protocol, fetch):
    body = read_checked(folder, "SHA256SUMS.txt", protocol["source_manifest_sha256"], fetch)
    pins = {name: sha for sha, name in (r.split() for r in body.decode().splitlines())}
    ids = protocol["train"] + protocol["held_out"]
    hashes = [pins[f"{r}.dat"] for r in ids + ["b001", "b002", "b003"]]
    if len(hashes) != len(set(hashes)):
        raise ValueError("Waveform bytes repeat across selected or previously inspected people")
    return pins


def parse_header(body, record):
    lines = [line.strip() for line in body.decode("ascii").splitlines() if line.strip()]
    name, channels, rate, length = lines[0].split()
    if (name, channels, rate) != (record, "4", "5000") or len(lines) != 6:
        raise ValueError(f"Unsupported record format in {record}")
    if lines[-1] != f"#After music listening for subject {int(record[1:])}":
        raise ValueError(f"Wrong study phase or participant in {record}")
    gains, zeros, checks = [], [], []
    for line, channel in zip(lines[1:5], ("I", "II", "RESP", "SCG"), strict=True):
        filename, fmt, scale, adc_resolution, adc_zero, initial, checksum, block, label = line.split()
        gain = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)\((-?[0-9]+)\)/mV", scale)
        if (filename, fmt, block, label) != (record + ".dat", "16", "0", channel) or not gain:
            raise ValueError(f"Invalid {channel} channel in {record}")
        gains.append(float(gain[1]))
        zeros.append(int(gain[2]))
        checks.append(int(checksum))
    if min(gains) <= 0:
        raise ValueError(f"Invalid calibration gain in {record}")
    return int(length), np.asarray(gains), np.asarray(zeros), checks


def kernel():
    n = np.arange(201) - 100
    sinc = (2 * 65 / RAW_RATE) * np.sinc((2 * 65 / RAW_RATE) * n)
    taps = np.hamming(len(n)) * sinc
    return taps / taps.sum()


def filtered_millivolts(raw, gains, zeros):
    # Restrict convolution to data supporting the admitted endpoints. No padding.
    first = FIRST_GRID * STEP - 200
    last = (FIRST_GRID + CUTS[-1] + HORIZON_STEPS) * STEP
    if len(raw) <= last:
        raise ValueError("Record ends before the fixed target")
    result = []
    taps = kernel()
    for index in (1, 2, 3):
        counts = raw[first:last + 1, index]
        readings = (counts.astype(np.float64) - zeros[index]) / gains[index]
        windows = sliding_window_view(readings, 201)[::STEP]
        values = np.einsum("ij,j->i", windows, taps[::-1], optimize=False)
        missing = np.flatnonzero(counts == -32768)
        # Every filter window containing a missing ADC value becomes missing.
        for j in missing:
            start = max(0, (int(j) - 200 + STEP - 1) // STEP)
            values[start:int(j) // STEP + 1] = np.nan
        result.append(values)
    return np.column_stack(result)


def load_record(folder, pins, record, fetch):
    header, waveform = (read_checked(folder, record + ext, pins[record + ext], fetch)
                        for ext in (".hea", ".dat"))
    frames, gains, zeros, expected = parse_header(header, record)
    if len(waveform) != 8 * frames:
        raise ValueError(f"Wrong full-record length for {record}")
    raw = np.frombuffer(waveform, dtype="<i2").reshape(frames, 4)
    native = (raw.sum(axis=0, dtype=np.int64) + 32768) % 65536 - 32768
    if native.tolist() != expected:
        raise ValueError(f"Native checksum mismatch for {record}: {native} versus {expected}")
    manifest = {
        "record": record, "source_dat_sha256": pins[record + ".dat"],
        "source_hea_sha256": pins[record + ".hea"], "frames": frames,
        "full_record_checksums_I_II_RESP_SCG": expected,
        "release_waveform_aliases": sorted(n for n, h in pins.items() if n.endswith(".dat") and h == pins[record + ".dat"]),
    }
    trace = filtered_millivolts(raw, gains, zeros)
    calibration = trace[:20 * GRID_RATE]
    counts = np.isfinite(calibration).sum(axis=0)
    if np.any(counts < 4500):
        raise ValueError(f"Too few valid calibration readings in {record}")
    mean = np.nanmean(calibration, axis=0)
    sd = np.nanstd(calibration, axis=0)
    if not np.all(np.isfinite(sd) & (sd > 0)):
        raise ValueError(f"Unusable calibration spread in {record}")
    z = (trace - mean) / sd
    base, aligned = features(z, CUTS)
    _, delayed = features(z, CUTS, DELAY)
    y = z[CUTS + HORIZON_STEPS, 2]
    valid = np.isfinite(aligned).all(axis=1) & np.isfinite(delayed).all(axis=1) & np.isfinite(y)
    if valid.sum() < 6750:
        raise ValueError(f"Too few paired rows in {record}")
    manifest.update(valid_rows=int(valid.sum()), calibration_valid_counts=counts.tolist())
    matrices = {"base": base[valid], "aligned": aligned[valid], "delayed": delayed[valid]}
    return matrices, y[valid], float(sd[2]), manifest


def person_moments(x, y):
    n = len(y)
    return x.mean(0), y.mean(), (x.T @ x) / n, (x.T @ y) / n


def fit(moments):
    xbar, ybar, xx, xy = [np.mean(values, axis=0) for values in zip(*moments, strict=True)]
    cov = xx - np.outer(xbar, xbar)
    xy = xy - xbar * ybar
    variance = np.maximum(np.diag(cov), 0.)
    sd = np.sqrt(variance)
    sd[sd == 0] = 1.
    normalized = cov / np.outer(sd, sd)
    normalized.flat[::len(sd) + 1] += ALPHA
    coefficient = np.linalg.solve(normalized, xy / sd) / sd
    return {"coefficient": coefficient.tolist(), "intercept": float(ybar - xbar @ coefficient)}


def score(matrices, y, scg_sd, models):
    predictions = {arm: apply(models[arm], matrices[arm]) for arm in ARMS}
    predictions["aligned_with_delayed_input"] = apply(models["aligned"], matrices["delayed"])
    predictions["persistence"] = matrices["base"][:, 0]
    errors = {arm: float(np.sqrt(np.mean((pred - y)**2))) for arm, pred in predictions.items()}
    return {"rmse_mV": {a: n * scg_sd for a, n in errors.items()}, "rmse_calibration_sd": errors}


def results(rows):
    comparisons = {}
    for baseline in ("base", "delayed", "persistence"):
        delta = {}
        for row in rows:
            rmse = row["rmse_mV"]
            if rmse[baseline] == 0:
                raise ValueError("Relative error undefined for zero baseline error")
            delta[row["record"]] = 100 * (rmse[baseline] - rmse["aligned"]) / rmse[baseline]
        values = list(delta.values())
        comparisons[baseline] = {"per_person_percent": delta, "mean": np.mean(values).item(),
                                "median": np.median(values).item(), "range": [min(values), max(values)],
                                "wins": sum(v > 0 for v in values)}
    macro = {units: {a: np.mean([r[units][a] for r in rows]).item() for a in SCORES}
             for units in ("rmse_mV", "rmse_calibration_sd")}
    return {"held_out": rows, "mean_person_rmse": macro, "aligned_against": comparisons,
            "meets_timing_criterion": all(comparisons[k]["mean"] > 0 and comparisons[k]["wins"] >= 4
                                          for k in ("base", "delayed"))}


def write_json(path, obj):
    path.write_text(json.dumps(obj, indent=2, allow_nan=False) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="Full-record cache outside release folder")
    parser.add_argument("--output", type=Path, required=True, help="Destination for rebuilt JSON files")
    parser.add_argument("--fetch", action="store_true", help="Download missing 1.0.0 files from PhysioNet")
    args = parser.parse_args()
    protocol_bytes = (HERE / "protocol.json").read_bytes()
    if digest(protocol_bytes) != PROTOCOL_SHA:
        raise ValueError("Protocol hash changed")
    protocol = json.loads(protocol_bytes)
    args.source.mkdir(exist_ok=True, parents=True)
    pins = archive_index(args.source, protocol, args.fetch)
    manifests = []
    moments = {a: [] for a in ARMS}
    for record in protocol["train"]:
        matrices, y, sd, log = load_record(args.source, pins, record, args.fetch)
        for arm in ARMS:
            moments[arm].append(person_moments(matrices[arm], y))
        manifests.append(log)
    models = {a: fit(moments[a]) for a in ARMS}
    rows = []
    for record in protocol["held_out"]:
        matrices, y, sd, log = load_record(args.source, pins, record, args.fetch)
        rows.append({"record": record, "valid_rows": len(y), **score(matrices, y, sd, models)})
        manifests.append(log)
    summary = results(rows)
    args.output.mkdir(exist_ok=True, parents=True)
    write_json(args.output / "weights.json", {"protocol_sha256": PROTOCOL_SHA, "models": models})
    write_json(args.output / "results.json", {"protocol_sha256": PROTOCOL_SHA, **summary})
    write_json(args.output / "source-verification.json", {"protocol_sha256": PROTOCOL_SHA, "records": manifests})
    print(json.dumps(summary["aligned_against"], indent=2))


if __name__ == "__main__":
    main()
