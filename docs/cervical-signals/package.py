"""Package the offline reader from its explicit product inventory."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

HERE = Path(__file__).resolve().parent
PRODUCT = (
    'index.html', 'reader.css', 'reader.js', 'anatomy.js', 'waveforms.js',
    'sources.json', 'README.txt', 'NOTICE.txt', 'build_signals.py', 'package.py',
    'Open on Linux.sh', 'Open on macOS.command', 'Open on Windows.cmd',
    'reference/renderer.js', 'reference/primitives.js', 'reference/surfaces.js',
    'reference/build_anatomy.py', 'reference/montage.webp', 'reference/wrist.webp',
    'reference/CC0-1.0.txt', 'reference/CC-BY-4.0.txt', 'reference/FieldTrip-GPL-3.txt',
    'reference/Colin27.txt', 'reference/scalp/standard_1005.elc',
    'reference/scalp/standard_skin_5054-1.bnd', 'reference/scalp/standard_skin_5054-1.bpl',
    'reference/scalp/standard_skin_5054-1.bps', 'reference/scalp/standard_skin_5054.vol',
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
