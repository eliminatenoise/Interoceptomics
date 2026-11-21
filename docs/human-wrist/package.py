"""Build the standalone wrist atlas from its explicit software-only inventory."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
FILES = (
    "index.html", "viewer.css", "viewer.js", "practice.js", "load.js", "prepare.py",
    "range_reader.py", "requirements.txt", "array-digests.json", "READ-ME.txt",
    "LICENSE.txt", "Open on Linux.sh", "Open on macOS.command", "Open on Windows.cmd",
)


def build():
    destination = HERE.parent.parent / "downloads/human-wrist.zip"
    with ZipFile(destination, "w") as archive:
        for name in FILES:
            member = ZipInfo("human-wrist/" + name, (2026, 11, 21, 0, 0, 0))
            member.create_system = 3
            member.external_attr = (0o100755 if name.endswith((".sh", ".command")) else 0o100644) << 16
            member.compress_type = ZIP_DEFLATED
            archive.writestr(member, (HERE / name).read_bytes(), compresslevel=9)
    return destination


if __name__ == "__main__":
    print(build().name)
