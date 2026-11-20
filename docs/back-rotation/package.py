"""Package the offline reader from its explicit product inventory."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

HERE = Path(__file__).resolve().parent
PRODUCT = (
    'index.html', 'reader.css', 'reader.js', 'recording.js', 'build_data.py', 'sources.json',
    'package.py', 'NOTICE.txt', 'README.txt', 'Open on Linux.sh', 'Open on Windows.cmd',
    'Open on macOS.command', 'reference/renderer.js', 'reference/spine.js', 'reference/build_spine.py',
    'reference/CC0-1.0.txt', 'reference/CC-BY-4.0.txt', 'reference/Z-Anatomy-LICENSE.txt',
)


def package(dest):
    with ZipFile(dest, 'w', compression=ZIP_DEFLATED) as archive:
        for name in sorted(PRODUCT):
            info = ZipInfo(name, (1980,1,1,0,0,0))
            info.create_system = 3
            info.compress_type = ZIP_DEFLATED
            info.external_attr = (0o100755 if name.endswith(('.sh','.command')) else 0o100644) << 16
            archive.writestr(info, (HERE/name).read_bytes(), compresslevel=9)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path, help='Destination ZIP file')
    package(parser.parse_args().output)
