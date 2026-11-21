"""Build the standalone timing reader from its public files."""

from hashlib import sha256
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
FILES = (
    "index.html",
    "reader.css",
    "SOURCE.txt",
    "CC-BY-4.0.txt",
    "CC0-1.0.txt",
    "Open on Linux.sh",
    "Open on Windows.cmd",
    "Open on macOS.command",
)


def build():
    destination = HERE.parents[1] / "downloads" / "visceral-clock.zip"
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, "w") as archive:
        for name in FILES:
            entry = ZipInfo("visceral-clock/" + name, (2026, 11, 21, 0, 0, 0))
            entry.create_system = 3
            mode = 0o100755 if name.endswith((".sh", ".command")) else 0o100644
            entry.external_attr = mode << 16
            entry.compress_type = ZIP_DEFLATED
            archive.writestr(entry, (HERE / name).read_bytes(), compresslevel=9)
    digest = sha256(destination.read_bytes()).hexdigest()
    destination.with_suffix(".zip.sha256").write_text(f"{digest}  {destination.name}\n")
    return destination


if __name__ == "__main__":
    print(build().name)
