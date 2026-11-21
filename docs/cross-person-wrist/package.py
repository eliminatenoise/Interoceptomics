"""Build a deterministic standalone atlas using only the listed public products."""
from hashlib import sha256
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
FILES = (
    "index.html", "style.css", "surface.js", "geometry.js", "body.js", "viewer.js",
    "METHODS.md", "LICENSE.txt", "MAKEHUMAN-CC0.txt", "derive_surface.py",
    "Open on Linux.sh", "Open on macOS.command", "Open on Windows.cmd",
)


def build():
    dest = HERE.parents[1] / "downloads/cross-person-wrist.zip"
    with ZipFile(dest, "w") as archive:
        for name in FILES:
            item = ZipInfo("cross-person-wrist/" + name, (2026, 11, 21, 0, 0, 0))
            item.create_system = 3
            item.external_attr = (0o100755 if name.endswith((".sh", ".command")) else 0o100644) << 16
            item.compress_type = ZIP_DEFLATED
            archive.writestr(item, (HERE/name).read_bytes(), compresslevel=9)
    digest = sha256(dest.read_bytes()).hexdigest()
    dest.with_suffix(".zip.sha256").write_text(digest + "  " + dest.name + "\n")
    return dest


if __name__ == "__main__":
    print(build().name)
