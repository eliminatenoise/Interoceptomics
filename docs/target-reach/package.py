"""Write the standalone, reproducible reader ZIP to the chosen file."""
import argparse
import stat
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
MEMBERS = ['index.html','style.css','reader.js','scene.js','records.js','METHODS.md',
           'CC0-1.0.txt','CC-BY-4.0.txt','Open on Windows.cmd','Open on macOS.command',
           'Open on Linux.sh','export-glb.py','check-source.py','package.py',
           *(f'references/figure-{n}.png' for n in [2,4,6]),
           *(f'models/{h}-{n}.glb' for h in 'lr' for n in range(1,10))]


def write(destination):
    with zipfile.ZipFile(destination,'w') as out:
        for name in sorted(MEMBERS):
            src=HERE/name
            member=zipfile.ZipInfo(f'target-reach/{name}',(2025,8,8,0,0,0))
            member.create_system=3
            mode=0o755 if name.endswith(('.sh','.command')) else 0o644
            member.external_attr=(stat.S_IFREG|mode)<<16
            out.writestr(member,src.read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('output',type=Path)
    write(parser.parse_args().output)
