"""Assemble a deterministic standalone archive from the public product inventory."""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parents[2]
reader = root / "docs/visual-balance"
files = {
    name: reader / name
    for name in [
        "index.html",
        "style.css",
        "viewer.js",
        "excerpt.js",
        "scalp-at-cutoff.glb",
        "marker-paths.glb",
        "METHODS.md",
        "Open on Windows.cmd",
        "Open on macOS.command",
        "Open on Linux.sh",
    ]
}
files["source/build.py"] = Path(__file__).with_name("build.py")
files["LICENSE"] = root / "LICENSE"
destination = root / "downloads/visual-balance.zip"
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, "w") as out:
    for name, src in sorted(files.items()):
        entry = ZipInfo("Visual Balance/" + name, (2026, 11, 21, 0, 0, 0))
        entry.create_system = 3
        entry.external_attr = (
            0o100755 if name.endswith((".sh", ".command")) else 0o100644
        ) << 16
        out.writestr(entry, src.read_bytes(), ZIP_DEFLATED, compresslevel=9)
