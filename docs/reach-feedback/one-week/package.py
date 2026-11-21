"""Build the standalone ZIP from named public assets. Takes the output ZIP path."""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
SHARED = HERE.parent
LAUNCH = ('Open on Linux.sh','Open on macOS.command','Open on Windows.cmd')
LOCAL = ('index.html','week.js','week.css','recordings.js','NOTICE.md','READ-ME.txt','export.py','package.py')
COMMON = ('scene.js','style.css','export-models.py','CC0-1.0.txt','CC-BY-4.0.txt',
          'reference/figure-1.webp','reference/figure-2.webp','reference/figure-3.webp')
ENTRY = b"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=one-week/index.html"><title>One week later</title></head><body style="font:1.2rem system-ui,sans-serif"><a href="one-week/index.html">Open One week later</a></body></html>"""


def package(out):
    data = json.loads((HERE/'recordings.js').read_text().removeprefix('window.REACH_WEEK = ').strip().removesuffix(';'))
    models = [f"models/{c['slug']}-{frame}.glb" for c in data['clips'] if 'reason' not in c for frame in ('markers','handle')]
    include = set(LOCAL) | set(models) | set(LAUNCH)
    actual = {p.relative_to(HERE).as_posix() for p in HERE.rglob('*') if p.is_file()}
    if actual != include:
        raise ValueError(f'Unexpected or absent reader assets: {sorted(actual ^ include)}')
    files = {s:(SHARED/s).read_bytes() for s in COMMON}
    files.update({n:(HERE/n).read_bytes() for n in LAUNCH})
    files.update({'one-week/'+n:(HERE/n).read_bytes() for n in sorted(include)})
    files.update({'index.html':ENTRY, 'READ-ME.txt':(HERE/'READ-ME.txt').read_bytes()})
    manifest = ''.join(f'{hashlib.sha256(files[n]).hexdigest()}  {n}\n' for n in sorted(files))
    files['SHA256SUMS'] = manifest.encode()
    out.parent.mkdir(exist_ok=True, parents=True)
    with ZipFile(out,'w') as archive:
        for n,raw in sorted(files.items()):
            member=ZipInfo('One week later/'+n,(2026,11,21,0,0,0))
            member.create_system=3
            member.external_attr=(0o100755 if n.endswith(('.sh','.command')) else 0o100644)<<16
            member.compress_type=ZIP_DEFLATED
            archive.writestr(member,raw,compresslevel=6)
    with ZipFile(out) as archive:
        if archive.testzip() or any(archive.read('One week later/'+n)!=v for n,v in files.items()):
            raise ValueError('ZIP verification failed')
    print(f'{len(files)} verified members, {out.stat().st_size} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output',type=Path)
    package(parser.parse_args().output)
