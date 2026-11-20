"""Create a portable ZIP with stable bytes and executable launcher modes."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

HERE = Path(__file__).resolve().parent
PRODUCT = ('index.html', 'reader.css', 'reader.js', 'scene.js', 'recordings.js',
           'C4.glb', 'C5.glb', 'README.txt', 'NOTICE.txt', 'sources.json',
           'DATA-LICENCE.txt', 'CODE-LICENCE.txt', 'build.py', 'glb.py', 'package.py',
           'Open on Windows.cmd', 'Open on macOS.command', 'Open on Linux.sh')


def package(output):
    with ZipFile(output, 'w') as archive:
        for name in sorted(PRODUCT):
            info = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = (0o100755 if name.endswith(('.command', '.sh')) else 0o100644) << 16
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, (HERE/name).read_bytes(), compresslevel=9)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    package(parser.parse_args().output)
