"""Create the offline reader from its explicit inventory, including executable launchers."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo
import sys

HERE = Path(__file__).resolve().parent
FILES = [
    "index.html", "style.css", "reader.js", "scene.js", "apparatus.js", "neutral-pedal.glb", "build_scene.py", "measurements.js", "sources.json",
    "NOTICE.txt", "README.txt", "build_data.py", "package.py", "Open on Linux.sh",
    "Open on macOS.command", "Open on Windows.cmd", "reference/leg.js", "reference/renderer.js",
    "reference/build_leg.py", "reference/Z-Anatomy-LICENSE.txt", "reference/CC-BY-4.0.txt",
    "reference/CC0-1.0.txt",
]

if __name__ == "__main__":
    with ZipFile(sys.argv[1], "w") as archive:
        for name in sorted(FILES):
            info = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.compress_type, info.create_system = ZIP_DEFLATED, 3
            info.external_attr = (0o100755 if name.endswith((".sh", ".command")) else 0o100644) << 16
            archive.writestr(info, (HERE / name).read_bytes(), compresslevel=9)
