"""Write a deterministic offline atlas using an explicit product inventory."""
import argparse
from pathlib import Path
import stat
import zipfile

HERE=Path(__file__).resolve().parent
MEMBERS=['index.html','style.css','reader.js','scene.js','recordings.js','apparatus.js','METHODS.md','export-models.py',
         'check-recordings.py','package.py','CC0-1.0.txt','CC-BY-4.0.txt','Open on Linux.sh','Open on Windows.cmd','Open on macOS.command',
         *(f'references/figure-{i}.png' for i in [2,4,6]),*(f'models/{side}-{i}.glb' for side in ['left','right'] for i in range(1,10))]
def pack(path):
    with zipfile.ZipFile(path,'w') as out:
        for name in sorted(MEMBERS):
            entry=zipfile.ZipInfo('cylinder-rotation/'+name,(2025,8,8,0,0,0))
            entry.create_system=3
            entry.external_attr=(stat.S_IFREG|(0o755 if name.endswith(('.sh','.command')) else 0o644))<<16
            out.writestr(entry,(HERE/name).read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('destination',type=Path)
    pack(parser.parse_args().destination)
