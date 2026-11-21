"""Rebuild each animated glTF from the selected measurements. Run from any directory."""
import json
import runpy
from pathlib import Path

HERE = Path(__file__).resolve().parent
builder = runpy.run_path(str(HERE.parent / 'export-models.py'))['build']


def study():
    return json.loads((HERE/'recordings.js').read_text().removeprefix('window.REACH_WEEK = ').strip().removesuffix(';'))


def export():
    data = study()
    for c in data['clips']:
        if 'reason' in c:
            continue
        block = data['blocks'][c['guide']]
        ref = dict(source=block['source'], sourceSHA256=block['sha256'],
                   recording_block=c['block'], go_ordinal=c['ordinal'])
        for frame, planar in [('markers',False), ('handle',True)]:
            path = HERE/'models'/(c['slug']+'-'+frame+'.glb')
            path.parent.mkdir(exist_ok=True)
            path.write_bytes(builder(ref,c,planar))


if __name__ == '__main__':
    export()
