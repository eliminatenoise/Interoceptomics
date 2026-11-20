"""Build the two HRA surfaces from the Interoceptomics atlas and the bundled standard scalp."""
import argparse
import base64
import hashlib
import json
import struct
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent

def unpack_glb(path):
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != 'dadce56c2c48bbabda915aae8d2a47bbcb0c2ae81dae6675528279590de7705e':
        raise ValueError('Use the documented Interoceptomics HRA subset')
    size = struct.unpack_from('<I',raw,12)[0]
    scene = json.loads(raw[20:20+size]); binary = raw[28+size:]
    def array(i, typ, width):
        a = scene['accessors'][i]; v = scene['bufferViews'][a['bufferView']]
        assert 'byteStride' not in v
        return np.frombuffer(binary, dtype=typ, count=a['count']*width, offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,width)
    groups = {'cord': [], 'heart': []}
    def walk(n, group=None):
        node = scene['nodes'][n]; name = node['name']
        assert not {'translation','rotation','scale','matrix'}.intersection(node)
        if name=='VH_F_heart': group='heart'
        if name.endswith('_segment_of_cervical_spinal_cord'): group='cord'
        if group and 'mesh' in node:
            p, = scene['meshes'][node['mesh']]['primitives']; assert scene['accessors'][p['indices']]['componentType'] == 5123
            pos = array(p['attributes']['POSITION'],'<f4',3)[:,[0,2,1]].astype('float64')*1000
            pos[:,0] *= -1
            faces = array(p['indices'],'<u2',1).reshape(-1,3)
            groups[group].append((name,pos,faces))
        for child in node.get('children',[]): walk(child,group)
    walk(scene['scenes'][0]['nodes'][0]); return groups

def encode(a,t):
    return base64.b64encode(a.astype(t).tobytes()).decode('ascii')

def mesh(name, pos, faces, cell=0):
    if cell:
        # Merge vertices in each millimetre grid cell, retaining face order and discarding collapsed faces.
        _, inverse, counts = np.unique(np.floor(pos/cell).astype('int32'), axis=0, return_inverse=True, return_counts=True)
        pos = np.stack([np.bincount(inverse, weights=p)/counts for p in pos.T],axis=1)
        faces = inverse[faces]; a,b,c = faces.T
        faces = faces[(a!=b)&(b!=c)&(a!=c)]
    assert len(pos) < 65536 and len(faces)
    return {'name':name,'xyz':encode(pos,'<f4'),'faces':encode(faces,'<u2')}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__);parser.add_argument('organs_glb',type=Path);args=parser.parse_args()
    groups=unpack_glb(args.organs_glb); data={}
    for group, surfaces in groups.items():
        mid=(np.vstack([p for _,p,_ in surfaces]).min(0)+np.vstack([p for _,p,_ in surfaces]).max(0))/2
        data[group]=[mesh(n,p-mid,f,0.9 if group=='cord' else 2.6) for n,p,f in surfaces]
    ref=HERE/'scalp'; surfaces=np.fromfile(ref/'standard_skin_5054-1.bps',dtype='<f4').reshape(-1,3)
    triangles=np.fromfile(ref/'standard_skin_5054-1.bpl',dtype='<i4').reshape(-1,3)
    lines=(ref/'standard_1005.elc').read_text().splitlines(); a=lines.index('Positions'); b=lines.index('Labels'); idx=lines[b+1:].index('CP4')
    data['scalp']=[mesh('Colin27 scalp',surfaces,triangles)]; data['CP4']=[float(v) for v in lines[a+1+idx].split()]
    (HERE/'surfaces.js').write_text('const SURFACES = '+json.dumps(data,separators=(',',':'))+';\n')
