"""Build the apparatus mesh and one STEP rotation animation per source recording."""
import json
import math
from pathlib import Path
import struct

HERE = Path(__file__).resolve().parent
MATERIALS = [
    ('Graphite cylinder', '#393f41', .85), ('Cut rim', '#50585a', .72),
    ('Sensor case', '#ed602a', .48), ('Case seam', '#b54320', .68),
    ('Marker mounts', '#242a2b', .59), ('Reflective markers', '#9a9d97', .38),
    ('Identification strip', '#e0ded0', .74),
]


def mesh():
    # Model coordinates are millimetres in the right-handed, Y-up display.
    # The rigid mounting and case dimensions are illustrative. Base 50 × 25 mm.
    parts = []
    def surface(name, material, rings):
        faces = []
        vertices = [v for ring in rings for v in ring]
        n = len(rings[0])
        for k in range(len(rings)-1):
            for i in range(n):
                a = k*n+i
                b = k*n+(i+1)%n
                faces.extend([(a,a+n,b), (b,a+n,b+n)])
        parts.append(dict(name=name, material=material, vertices=vertices, faces=faces))

    def disk(name, material, cx, cz, sections, count=48):
        rings = [[[cx+r*math.cos(i*math.tau/count),y,cz+r*math.sin(i*math.tau/count)]
                  for i in range(count)] for y,r in sections]
        surface(name, material, rings)

    def housing(name, material, sections):
        rings = []
        for y, sx, sz, r in sections:
            ring = []
            for quadrant, (cx, cz) in enumerate([(sx-r,sz-r),(-sx+r,sz-r),(-sx+r,-sz+r),(sx-r,-sz+r)]):
                for step in range(7):
                    angle = (quadrant+step/6)*math.pi/2
                    ring.append([cx+r*math.cos(angle),y,cz+r*math.sin(angle)])
            rings.append(ring)
        surface(name,material,rings)

    disk('Printed cylinder',0,0,0,[(-19,0),(-19,23.9),(-18.2,24.8),(-17.7,25),(5.4,25),(6,24.6),(6,0)])
    for i in range(3):
        y = -18+i*.95
        disk('Print lines '+str(i+1),1,0,0,[(y,24.85),(y+.18,25.05),(y+.35,24.93)])
    housing('Orange inertial sensor',2,[(2,18.3,13.5,2.4),(2.6,19.3,14.3,3.1),(11.2,19.3,14.3,3.1),(12.3,18.4,13.5,2.8),(12.3,0,0,0)])
    housing('Case parting line',3,[(6.9,19.32,14.32,3.1),(7.25,19.32,14.32,3.1)])
    housing('Identification strip',6,[(12.35,8,2,1),(12.35,0,0,0)])
    for cx,cz in [(-9,-4),(9,4)]:
        disk('Black marker mount',4,cx,cz,[(12.3,7.1),(12.9,7.3),(14,7.2),(14.5,6.6),(14.5,0)],32)
        rings = [(19.6+7*math.sin(a*math.pi/14-math.pi/2),7*math.cos(a*math.pi/14-math.pi/2)) for a in range(15)]
        disk('Optical marker',5,cx,cz,rings,32)
    return {'materials':MATERIALS, 'parts':parts}


def mul(a,b):
    w,x,y,z = a
    W,X,Y,Z = b
    return (w*W-x*X-y*Y-z*Z,w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W)


def quaternions(rows):
    first = rows[0][7:]
    inv = [first[0], *(-v for v in first[1:])]
    result = []
    for row in rows:
        w,x,y,z = mul(inv,row[7:])
        q = [x,z,-y,w]  # Basis B maps source XYZ to glTF X, Z, -Y; scalar last.
        n = math.sqrt(sum(v*v for v in q))
        q = [v/n for v in q]
        if result and sum(a*b for a,b in zip(q,result[-1])) < 0:
            q = [-v for v in q]
        result.append(q)
    return result


def glb(shape,clip,credit):
    data = bytearray()
    views, access = [], []
    def array(rows, kind, code='f', target=None):
        start=len(data)
        data.extend(b''.join(struct.pack('<'+code*len(row),*row) for row in rows))
        size=len(data)-start
        data.extend(b'\x00'*(-len(data)%4))
        views.append({'buffer':0,'byteOffset':start,'byteLength':size})
        if target: views[-1]['target']=target
        actual=list(struct.iter_unpack('<'+code*len(rows[0]),data[start:start+size]))
        access.append(dict(bufferView=len(views)-1,componentType={'f':5126,'H':5123}[code],count=len(rows),type=kind,
                           min=list(map(min,zip(*actual))),max=list(map(max,zip(*actual)))))
        return len(access)-1

    primitives=[]
    for part in shape['parts']:
        pos=array([[v*.001 for v in p] for p in part['vertices']],'VEC3',target=34962)
        # Winding from lower to upper rings faces outward.
        indices=array([(idx,) for face in part['faces'] for idx in face],'SCALAR','H',34963)
        primitives.append({'attributes':{'POSITION':pos},'indices':indices,'material':part['material']})
    times=array([(r[0],) for r in clip['rows']],'SCALAR')
    rotation=array(quaternions(clip['rows']),'VEC4')
    materials=[]
    for name,color,roughness in MATERIALS:
        def lin(c):
            s=int(c,16)/255
            return s/12.92 if s<=.04045 else ((s+.055)/1.055)**2.4
        rgb=[lin(color[i:i+2]) for i in [1,3,5]]
        materials.append(dict(name=name,doubleSided=True,pbrMetallicRoughness=dict(baseColorFactor=[*rgb,1],metallicFactor=0,roughnessFactor=roughness)))
    gltf={'asset':{'version':'2.0','copyright':credit+' Measured orientation CC BY 4.0.'},
          'extras':{'source':clip['member'],'sha256':clip['member_sha256'],'dataset':'https://doi.org/10.17605/OSF.IO/J3QC8',
                    'license':'https://creativecommons.org/licenses/by/4.0/','pose':'100 Hz sensor orientation relative to first sample. Local reference XYZ mapped to glTF (X,Z,-Y). Fixed origin. Case mounting illustrative.'},
          'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'Carried cylinder','mesh':0}],'meshes':[{'primitives':primitives}],
          'materials':materials,'buffers':[{'byteLength':len(data)}],'bufferViews':views,'accessors':access,
          'animations':[{'name':f"{clip['hand']} hand · target {clip['target']}",'samplers':[{'input':times,'output':rotation,'interpolation':'STEP'}],
                         'channels':[{'sampler':0,'target':{'node':0,'path':'rotation'}}]}]}
    meta=json.dumps(gltf,separators=(',',':'),ensure_ascii=False).encode()
    meta+=b' '*(-len(meta)%4)
    return struct.pack('<4sII',b'glTF',2,28+len(meta)+len(data))+struct.pack('<I4s',len(meta),b'JSON')+meta+struct.pack('<I4s',len(data),b'BIN\0')+data


if __name__=='__main__':
    records=json.loads((HERE/'recordings.js').read_text().removeprefix('window.CYLINDER = ').removesuffix(';\n'))
    shape=mesh()
    (HERE/'apparatus.js').write_text('window.APPARATUS = '+json.dumps(shape,separators=(',',':'))+';\n')
    out=HERE/'models'
    out.mkdir(exist_ok=True)
    for clip in records['clips']:
        (out/f"{clip['hand']}-{clip['target']}.glb").write_bytes(glb(shape,clip,records['attribution']))
