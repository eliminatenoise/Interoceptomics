"""Seekable read-only access to ranges from the single pinned AJILE12 NWB."""

import hashlib
import io
import os
import time
from pathlib import Path

import requests

URL = "https://dandiarchive.s3.amazonaws.com/blobs/e54/21f/e5421ff3-05f6-4d5e-a884-6d3e57a11951"
SIZE = 15903762527
ETAG = "93a6289a5836cc078cb91340254d296c-237"


class RangeReader(io.RawIOBase):
    """64 KiB alignment for small HDF5 metadata; larger reads use exact spans."""

    def __init__(self, cache_dir, block=65536, limit=64 * 1024**2):
        super().__init__()
        self.position = 0
        self.block = block
        self.limit = limit
        self.size_seen = 0
        self.cache = Path(cache_dir) / ETAG
        self.cache.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.session = requests.Session()
        self.records = {}
        self.elapsed_network = 0.0
        self.network_bytes = 0

    def fetch(self, lo, hi):
        key = (lo, hi)
        file = self.cache / f"{lo}-{hi}"
        if key not in self.records:
            self.size_seen += hi - lo
            if self.size_seen > self.limit:
                raise ValueError("Unique range budget exceeded")
        if file.exists():
            data = file.read_bytes()
            check = file.with_suffix(".sha256").read_text().strip()
            if hashlib.sha256(data).hexdigest() != check:
                raise ValueError("Cache checksum mismatch")
        else:
            start = time.perf_counter()
            with self.session.get(
                URL,
                headers={
                    "Range": f"bytes={lo}-{hi - 1}",
                    "If-Match": f'"{ETAG}"',
                    "Accept-Encoding": "identity",
                },
                stream=True,
                timeout=(10, 30),
            ) as response:
                if (
                    response.status_code != 206
                    or response.headers.get("Content-Range")
                    != f"bytes {lo}-{hi - 1}/{SIZE}"
                    or response.headers.get("ETag", "").strip('"') != ETAG
                    or int(response.headers.get("Content-Length", -1)) != hi - lo
                ):
                    raise ValueError(f"Unpinned range response for {lo}..{hi}")
                data = response.raw.read(hi - lo + 1)
            if len(data) != hi - lo:
                raise ValueError("Truncated HTTP range")
            self.elapsed_network += time.perf_counter() - start
            self.network_bytes += len(data)
            check = hashlib.sha256(data).hexdigest()
            # Cache never leaves explicitly chosen private scratch.
            tmp = file.with_suffix(f".{os.getpid()}.tmp")
            tmp.write_bytes(data)
            file.with_suffix(".sha256").write_text(check)
            tmp.replace(file)
        if len(data) != hi - lo:
            raise ValueError("Range length mismatch")
        self.records[key] = check
        return data

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=0):
        origins = (0, self.position, SIZE)
        if whence not in (0, 1, 2) or origins[whence] + offset < 0:
            raise ValueError("Invalid seek")
        self.position = origins[whence] + offset
        return self.position

    def readinto(self, buffer):
        start = self.position
        end = min(SIZE, start + len(buffer))
        if start >= end:
            return 0
        if end - start >= self.block:
            data = self.fetch(start, end)
        else:
            lo = start // self.block * self.block
            hi = min(SIZE, ((end - 1) // self.block + 1) * self.block)
            data = self.fetch(lo, hi)[start - lo : end - lo]
        buffer[: len(data)] = data
        self.position += len(data)
        return len(data)

    def close(self):
        self.session.close()
        super().close()
