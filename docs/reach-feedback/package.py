"""Package the standalone reader from its explicit product inventory."""

import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

BASE = Path(__file__).resolve().parent
FILES = [
    "index.html",
    "reader.js",
    "scene.js",
    "style.css",
    "recordings.js",
    "build-clips.py",
    "export-models.py",
    "package.py",
    "READ-ME.txt",
    "NOTICE.md",
    "CC0-1.0.txt",
    "CC-BY-4.0.txt",
    "Open on Linux.sh",
    "Open on macOS.command",
    "Open on Windows.cmd",
    "reference/figure-1.webp",
    "reference/figure-2.webp",
    "reference/figure-3.webp",
]


def write_zip(output):
    gallery = json.loads(
        (BASE / "recordings.js")
        .read_text()
        .removeprefix("window.REACH_FEEDBACK = ")
        .strip()
        .removesuffix(";")
    )
    models = [
        f"models/{clip['split']}-{frame}.glb"
        for clip in gallery["clips"]
        if clip["eligible"]
        for frame in ("markers", "handle")
    ]
    paths = sorted(FILES + models)
    names = {p.relative_to(BASE).as_posix() for p in BASE.rglob("*") if p.is_file()}
    if names - {"SHA256SUMS"} != set(paths):
        raise ValueError(
            f"Files differ from inventory: {names.symmetric_difference(set(paths)) - {'SHA256SUMS'}}"
        )
    hashes = {n: hashlib.sha256((BASE / n).read_bytes()).hexdigest() for n in paths}
    (BASE / "SHA256SUMS").write_text("".join(f"{hashes[n]}  {n}\n" for n in paths))
    output.parent.mkdir(exist_ok=True, parents=True)
    with ZipFile(output, "w") as out:
        for n in paths + ["SHA256SUMS"]:
            member = ZipInfo("Reach feedback/" + n, (2026, 11, 21, 0, 0, 0))
            member.create_system = 3
            member.external_attr = (
                0o100755 if n.endswith((".sh", ".command")) else 0o100644
            ) << 16
            member.compress_type = ZIP_DEFLATED
            out.writestr(member, (BASE / n).read_bytes(), compresslevel=6)
    with ZipFile(output) as check:
        if check.testzip() is not None:
            raise ValueError("Damaged ZIP member")
        for n, h in hashes.items():
            if hashlib.sha256(check.read("Reach feedback/" + n)).hexdigest() != h:
                raise ValueError(f"Hash mismatch for {n}")
    print(f"{output.name}: {len(paths) + 1} files, {output.stat().st_size} bytes")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "output", type=Path, nargs="?", default=BASE.parent / "reach-feedback.zip"
    )
    write_zip(parser.parse_args().output)
