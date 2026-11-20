"""Create the standalone, deterministic CC0 reader from explicitly listed product files."""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

src = Path(__file__).resolve().parent
repo = src.parents[1]
reader = repo / "docs/muscle-and-motion"
inventory = {
    name: reader / name
    for name in (
        "index.html",
        "style.css",
        "viewer.js",
        "recordings.js",
        "standing.glb",
        "walking.glb",
        "METHODS.md",
        "Open on Windows.cmd",
        "Open on macOS.command",
        "Open on Linux.sh",
    )
}
inventory.update(
    {
        "source/build.py": src / "build.py",
        "source/inputs.json": src / "inputs.json",
        "LICENSE": repo / "LICENSE",
    }
)
out = repo / "downloads/muscle-and-motion.zip"
out.parent.mkdir(exist_ok=True)
with ZipFile(out, "w") as archive:
    for name, source in sorted(inventory.items()):
        entry = ZipInfo("Muscle and motion/" + name, (2026, 11, 21, 0, 0, 0))
        entry.create_system = 3
        mode = 0o100755 if name.endswith((".command", ".sh")) else 0o100644
        entry.external_attr = mode << 16
        archive.writestr(entry, source.read_bytes(), ZIP_DEFLATED, compresslevel=9)
