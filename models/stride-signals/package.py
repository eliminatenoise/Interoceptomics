"""Build a reproducible offline Interoceptomics stride reader from its product files."""
import argparse
import hashlib
from pathlib import Path
from tempfile import NamedTemporaryFile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
PAGE = Path("docs/stride-signals")
MODEL = Path("models/stride-signals")
FILES = (
    Path("LICENSE"), PAGE / "index.html", PAGE / "build.py",
    *(PAGE / "src" / name for name in ("body.js", "input.sha256", "page.html", "reader.js", "style.css")),
    *(MODEL / name for name in ("README.md", "LICENCE", "OVERGROUND-STRIDE.md", "build_stride.py",
                                "stride-reference.json", "package.py")),
)
LAUNCHERS = ("Open on Linux.sh", "Open on macOS.command", "Open on Windows.cmd")
START = """Interoceptomics — A stride in three measurements

Open the launcher for your computer in this folder, or open docs/stride-signals/index.html in your browser.
Everything needed to display and explore the stride is included. Only links to outside references require internet access.

Read models/stride-signals/README.md for reproduction and licensing.
Read models/stride-signals/OVERGROUND-STRIDE.md for the measurement methods.
"""


def write_zip(destination):
    entries = {path.as_posix(): (ROOT / path).read_bytes() for path in FILES}
    for name in LAUNCHERS:
        original = ROOT / PAGE / name
        if not original.is_file():
            original = ROOT / name
        entries[name] = original.read_bytes()
    entries["START.txt"] = START.encode("utf-8")
    manifest = "".join(f"{hashlib.sha256(data).hexdigest()}  {name}\n" for name, data in sorted(entries.items()))
    entries["PACKAGE-SHA256SUMS"] = manifest.encode("utf-8")
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with NamedTemporaryFile(dir=destination.parent, delete=False) as handle:
            temporary = Path(handle.name)
            with zipfile.ZipFile(handle, "w") as archive:
                for name, data in sorted(entries.items()):
                    info = zipfile.ZipInfo(name, date_time=(2020, 4, 15, 0, 0, 0))
                    info.create_system = 3
                    info.external_attr = (0o100755 if name in LAUNCHERS[:2] else 0o100644) << 16
                    archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=6)
        with zipfile.ZipFile(temporary) as archive:
            if archive.testzip() or archive.namelist() != sorted(entries):
                raise ValueError("Package integrity check failed")
        temporary.replace(destination)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()
    print(f"{hashlib.sha256(destination.read_bytes()).hexdigest()}  {destination.name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=ROOT / "downloads/stride-signals.zip")
    write_zip(parser.parse_args().out)
