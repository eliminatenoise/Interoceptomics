"""Build a private, source-matched surface and electrode packet for FingerFlex."""

import argparse
import hashlib
import io
import json
import os
import tempfile
import zlib
from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np
from scipy.io import loadmat

RECORD = "https://purl.stanford.edu/zk881ps0522"
ARCHIVE = "https://stacks.stanford.edu/file/druid:zk881ps0522/fingerflex.zip"
ARCHIVE_SIZE = 580_522_436
ARCHIVE_SHA1 = "83acfe25c27da197db0feaf742d9c5f3f9ee99bf"
MEMBER = "fingerflex/data/bp/bp_fingerflex.mat"
MAT_SIZE = 58_929_343
MAT_HASH = "b8222d13c15c97ec8590ed4b9ea180c639cac0b7c3e04bce178bb349f92be03a"
COMPRESSED_HASH = "b2905446cc76f2e28410160a239ba6a68aabe4151efe62f2f8f0e23bfef2e0b5"
SCHEMA = "fingerflex-native-cortex-v1"
LICENSE = "https://creativecommons.org/licenses/by-sa/4.0/"
PRIVATE = Path(__file__).resolve().parent / "private"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def download():
    """Request just the pinned compressed member from the v11 archive."""
    with urlopen(RECORD + ".json", timeout=30) as response:
        record = json.load(response)
    files = [
        f
        for group in record["structural"]["contains"]
        for f in group["structural"]["contains"]
        if f["filename"] == "fingerflex.zip"
    ]
    if (
        record["version"] != 11
        or record["access"]["license"] != LICENSE + "legalcode"
        or len(files) != 1
        or files[0]["access"]["download"] != "world"
        or files[0]["size"] != ARCHIVE_SIZE
        or {"type": "sha1", "digest": ARCHIVE_SHA1} not in files[0]["hasMessageDigests"]
    ):
        raise ValueError(
            "Stanford's archive version, identity or use terms changed. Review the record."
        )
    start, end = 6413, 58845098
    span = f"{start}-{end}"
    request = Request(
        ARCHIVE + "?range=" + span,
        headers={"Range": "bytes=" + span, "Accept-Encoding": "identity"},
    )
    with urlopen(request, timeout=120) as response:
        if (
            response.status != 206
            or response.headers.get("Content-Range") != f"bytes {span}/{ARCHIVE_SIZE}"
        ):
            raise ValueError(
                "Stanford did not return the exact requested archive byte range."
            )
        compressed = response.read(end - start + 2)
    if len(compressed) != end - start + 1 or digest(compressed) != COMPRESSED_HASH:
        raise ValueError("Compressed source member failed verification.")
    return zlib.decompress(compressed, -15)


def geometry(raw):
    if len(raw) != MAT_SIZE or digest(raw) != MAT_HASH:
        raise ValueError(
            "Expected the unchanged bp_fingerflex.mat from Stanford's version 11 archive."
        )
    data = loadmat(io.BytesIO(raw), variable_names=["brain", "locs", "elec_regions"])
    brain = data["brain"]
    if brain.shape != (1, 1) or brain.dtype.names != ("vert", "tri"):
        raise ValueError("Unexpected source surface fields.")
    vertices, tri = brain[0, 0]["vert"], brain[0, 0]["tri"]
    locs, regions = data["locs"], data["elec_regions"]
    if (
        vertices.shape != (45180, 3)
        or tri.shape != (90368, 3)
        or vertices.dtype != np.float64
        or tri.dtype != np.uint16
        or locs.shape != (46, 3)
        or regions.shape != (46, 1)
        or not np.isfinite(vertices).all()
        or not np.isfinite(locs).all()
        or (tri.min(), tri.max()) != (1, len(vertices))
        or not np.array_equal(regions, regions.astype(np.uint8))
    ):
        raise ValueError(
            "Unexpected geometry shape, coordinates, face indices or region labels."
        )
    return vertices, tri.astype(np.int32) - 1, locs, regions[:, 0]


def packet(raw):
    vertices, faces, locs, regions = geometry(raw)
    contacts = [
        {
            "column0": k,
            "column1": k + 1,
            "region_code": int(regions[k]),
            "xyz": xyz.tolist(),
        }
        for k, xyz in enumerate(locs)
    ]
    return {
        "schema": SCHEMA,
        "source": {
            "record_url": RECORD,
            "archive_version": 11,
            "member": MEMBER,
            "member_sha256": MAT_HASH,
            "license": LICENSE,
            "credit": "Kai Joshua Miller, Stanford Digital Repository. Miller et al. (2012), DOI 10.1371/journal.pcbi.1002655.",
            "changes": "Original vertices and contact coordinates. Triangle indices changed from one-based to zero-based. No time series.",
        },
        "frame": {
            "hemisphere": "left",
            "hemisphere_applies_to": "contact array (left frontoparietal)",
            "axes": ["right", "anterior", "superior"],
            "units": None,
            "axis_basis": "Positive display-axis directions from the depositor's CTMR loc_view.m; the source MAT supplies no affine or unit metadata.",
            "camera_matlab_azimuth_elevation_deg": [250, 15],
        },
        "mesh": {"vertices": vertices.tolist(), "faces": faces.tolist()},
        "contacts": contacts,
    }


def write_private(data, path):
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as tmp:
        name = Path(tmp.name)
        try:
            tmp.write(data)
            tmp.flush()
            os.fsync(tmp.fileno())
            tmp.close()
            os.replace(name, path)
        finally:
            name.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--mat",
        type=Path,
        help="Existing original bp_fingerflex.mat from archive version 11.",
    )
    mode.add_argument(
        "--download",
        action="store_true",
        help="Request and verify the 58.8 MB member from Stanford.",
    )
    args = parser.parse_args()
    data = args.mat.read_bytes() if args.mat else download()
    result = packet(data)
    serialized = (
        json.dumps(result, separators=(",", ":"), allow_nan=False) + "\n"
    ).encode()
    dest = PRIVATE / "bp-native-cortex.json"
    write_private(serialized, dest)
    print(f"Wrote {dest} ({len(serialized):,} bytes, SHA-256 {digest(serialized)}).")


if __name__ == "__main__":
    main()
