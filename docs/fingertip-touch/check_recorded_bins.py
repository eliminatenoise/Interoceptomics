"""Reproduce the five 20 ms macaque counts in the fingertip reader.

Use the Bensmaia Lab's Feeling_Fooled Data_Files.zip, commit
f3c13be71c3df2032093ccbe2aa2d9ddd5cbb1f5, from
https://gin.g-node.org/JohnDowney/Feeling_Fooled. Source data are CC BY 4.0.
Requires Python 3, NumPy and SciPy.
"""

import argparse
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

import numpy as np
from scipy.io import loadmat


ZIP_BYTES = 11561503
ZIP_SHA256 = "4fb39f175fd798a23dc976e9f75a62d68282e8e556376f039db71b24d2ba545d"
MEMBER_SHA256 = "85c41eb2040e776bd88e715de186da98841a1ebc851b23f3b390a29212425d59"
EDGES_MS = (100, 120, 140, 160, 180, 200)


def read_counts(path):
    if path.stat().st_size != ZIP_BYTES or sha256(path.read_bytes()).hexdigest() != ZIP_SHA256:
        raise ValueError("Expected the published Feeling_Fooled Data_Files.zip at the specified edition.")
    with ZipFile(path) as archive:
        member = archive.read("periph/pda_neurons.mat")
    if sha256(member).hexdigest() != MEMBER_SHA256:
        raise ValueError("The peripheral recording differs from the specified edition.")
    table = loadmat(BytesIO(member), variable_names=["spikes", "rates"])
    # MATLAB: second speed (80 mm/s), first texture, first fibre, first repeat.
    seconds = table["spikes"].flat[1][0, 0, 0].ravel()
    rate = table["rates"].flat[1][0, 0, 0]
    if rate != len(seconds) or not np.all((seconds >= 0) & (seconds < 1)):
        raise ValueError("The archived response disagrees with its one-second firing rate.")
    raw_ticks = seconds * 100000
    ticks = np.rint(raw_ticks).astype(np.int64)
    if not np.all(np.abs(raw_ticks - ticks) < 1e-5):
        raise ValueError("The event values differ from the archived 10-microsecond grid.")
    counts = np.diff(np.searchsorted(ticks, np.array(EDGES_MS) * 100, side="left"))
    return counts.tolist()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="Path to the original Data_Files.zip")
    args = parser.parse_args()
    try:
        bins = read_counts(args.archive)
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + "\n")
    for start, stop, count in zip(EDGES_MS[:-1], EDGES_MS[1:], bins):
        print(f"{start} to {stop} ms (end excluded)  {count} spike{'s' if count != 1 else ''}")
