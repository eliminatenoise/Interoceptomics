"""Write the extract-and-open edition, with only the listed product files."""
from pathlib import Path
import sys
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
PRODUCT = ('index.html','style.css','reader.js','scene.js','structure.js','measurements.js','frames.csv',
           'pose-39.glb','pose-49.glb','pose-59.glb','plate-axes.png','build_data.py','build_exports.py',
           'package.py','NOTICE.txt','README.txt','sources.json','CC-BY-4.0.txt','CC0-1.0.txt',
           'Open on Windows.cmd','Open on macOS.command','Open on Linux.sh')

if __name__ == '__main__':
    with ZipFile(sys.argv[1], 'w') as archive:
        for name in sorted(PRODUCT):
            info = ZipInfo(name, (1980,1,1,0,0,0))
            info.create_system, info.compress_type = 3, ZIP_DEFLATED
            info.external_attr = (0o100755 if name.endswith(('.sh','.command')) else 0o100644) << 16
            archive.writestr(info, (HERE/name).read_bytes(), compresslevel=9)
