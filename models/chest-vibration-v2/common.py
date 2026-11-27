"""Constants shared by every step of the chest-vibration v2 study (PROTOCOL.json governs).

Grid index k is native sample 20k, time k / 250 s. Cutoff t is a grid index.
"""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

RAW_RATE = 5000
STEP = 20
GRID_RATE = 250
H = 20                      # forecast horizon, grid steps (80 ms)
DELAY = 1253                # ECG delay of the delayed controls, grid steps (5.012 s)

CAL = (15000, 20000)        # calibration, 60 <= t < 80 s
PRIMARY = (22500, 72500)    # primary cutoffs, 90 <= t < 290 s
SECONDARY = (22500, 30000)  # 90 <= t < 120 s, a subset of the primary rows
BASAL = (22500, 67500)      # b001, 90 <= t < 270 s
DETECTOR_START = 2500       # R_v2 and chest_v2 scan from 10 s

FIT_POOL = [f"p{i:03d}" for i in range(4, 14)]
PRIMARY_TEST = [f"p{i:03d}" for i in range(14, 21)]
SECONDARY_NEW = ["p001", "p002", "p003"]
BASAL_CHECK = ["b001"]

SEEDS = (20261127, 20261128, 20261129)
BOOTSTRAP_SEED = 20261127
CAUSALITY_SEED = 20261127

K_GRID = (8, 16, 32)
THETA_GRID = (0.7, 0.8, 0.9)
PENALTY_GRID = (0.001, 0.02, 0.1)
C4_PENALTY_GRID = (0.001, 0.02, 0.1, 1.0)
DEFAULT_K, DEFAULT_THETA, DEFAULT_PENALTY = 16, 0.8, 0.02
DEFAULT_C4_PENALTY = 0.02
V1_PENALTY = 0.02
TIE_FACTOR = 1.01           # the default is kept when its mean <= 1.01 x the lowest mean
FAMILY_FACTOR = 0.99        # MLP family when M-ECG mean < 0.99 x R-ECG mean

PROTOCOL_COMMIT = "b0ffe4d90a1ee2c25bc3fe02344da7948bdf2e9f"
PROTOCOL_FILES = ("PROTOCOL.json", "PROTOCOL.md", "allocate.py", "ALLOCATION.json")


def subject_number(record):
    """CEBSDB subject number of a record id (p004 -> 4; b001 uses 101 in the causality draws)."""
    if record == "b001":
        return 101
    return int(record[1:])


def cutoff_range(record):
    lo, hi = BASAL if record.startswith("b") else PRIMARY
    return lo, hi


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def write_json(path, obj):
    Path(path).write_text(json.dumps(obj, indent=1, allow_nan=False) + "\n")


def load_allocation():
    return json.loads((HERE / "ALLOCATION.json").read_text())


def pins():
    """File name -> SHA-256 for every file assigned to a group in ALLOCATION.json."""
    out = {}
    for members in load_allocation()["groups"].values():
        for m in members:
            out[m["dat"]["name"]] = m["dat"]["sha256"]
            out[m["hea"]["name"]] = m["hea"]["sha256"]
    return out
