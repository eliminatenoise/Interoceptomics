"""Build the standalone ZIP from the public atlas checkout and its explicit file list."""
import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


READER = ("index.html", "style.css", "viewer.js", "recordings.js", "forecasts.js", "scalp.js", "scalp-view.js", "METHODS.md",
          "sacrum.glb", "wrist.glb", "Open on Linux.sh", "Open on Windows.cmd", "Open on macOS.command")
SOURCES = ("build.py", "extract_forecasts.py", "extract_scalp.py", "package_atlas.py")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", type=Path)
    parser.add_argument("output_zip", type=Path)
    args = parser.parse_args()
    view = args.repo / "docs/cross-limb-movement"
    sources = args.repo / "models/cross-limb-movement"
    inventory = {name: view / name for name in READER}
    inventory.update({"source/" + name: sources / name for name in SOURCES})
    inventory["LICENSE"] = args.repo / "LICENSE"
    with ZipFile(args.output_zip, "w") as archive:
        for name, path in sorted(inventory.items()):
            entry = ZipInfo("Grasping and balancing/" + name, date_time=(2026, 11, 20, 0, 0, 0))
            entry.create_system = 3
            mode = 0o100755 if name.endswith((".sh", ".command")) else 0o100644
            entry.external_attr = mode << 16
            archive.writestr(entry, path.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)


if __name__ == "__main__":
    main()
