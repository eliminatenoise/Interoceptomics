"""Pack only the declared public reader files and verify every byte before replacement."""
import argparse
from hashlib import sha256
from pathlib import Path
import tempfile
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/scalp-and-arm"
INVENTORY = (
    "index.html", "style.css", "atlas-data.js", "geometry.js", "reader.js",
    "renderer.js", "build.py", "README.txt", "NOTICE.txt",
    "Open on Linux.sh", "Open on Windows.cmd", "Open on macOS.command",
    "references/channel-map.csv", "references/ofner-setup.webp", "references/ofner-trial.webp",
    "references/ofner-codebook.pdf", "references/standard_1005.elc",
    "references/standard_skin_5054.vol", "references/standard_skin_5054-1.bnd",
    "references/standard_skin_5054-1.bpl", "references/standard_skin_5054-1.bps",
    "cue-fields.js", "measurements.js", "measurements/cue-fields.json",
    "measurements/README.md", "measurements/build_fields.py", "measurements/ofner_source.py",
    "measurements/protocol.json", "measurements/LICENSE-CODE", "measurements/SHA256SUMS",
    "licenses/CC0-1.0.txt", "licenses/CC-BY-4.0.txt", "licenses/Colin27.txt",
    "licenses/FieldTrip-GPL-3.txt",
)


def pack(destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    entries = {name: (SOURCE / name).read_bytes() for name in INVENTORY}
    sums = [f"{sha256(data).hexdigest()}  {name}\n" for name, data in sorted(entries.items())]
    entries["SHA256SUMS"] = "".join(sums).encode()
    with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as f:
        temp = Path(f.name)
    try:
        with ZipFile(temp, "w") as archive:
            for name, payload in sorted(entries.items()):
                info = ZipInfo(name, (2026, 11, 21, 0, 0, 0))
                info.create_system = 3
                executable = name.endswith((".sh", ".command"))
                info.external_attr = (0o100755 if executable else 0o100644) << 16
                archive.writestr(info, payload, compress_type=ZIP_DEFLATED, compresslevel=6)
        with ZipFile(temp) as reopened:
            assert set(reopened.namelist()) == set(entries) and reopened.testzip() is None
            assert all(reopened.read(name) == payload for name, payload in entries.items())
        temp.replace(destination)
    finally:
        temp.unlink(missing_ok=True)
    print(sha256(destination.read_bytes()).hexdigest(), destination)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--out", type=Path, default=ROOT / "downloads/scalp-and-arm.zip")
    pack(p.parse_args().out)
