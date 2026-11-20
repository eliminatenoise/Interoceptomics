"""Build all 18 self-contained animated glTF binaries from records.js.

All dimensions use metres. Laboratory (x,y,z) maps to glTF (x,z,-y).
The model origin follows the measured marker position. Its rigid upright
housing and two marker glyphs illustrate the physical apparatus in Figure 2.
"""
import json
import math
import struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
COLORS = [(0.07,0.085,0.08), (0.91,0.29,0.08), (0.62,0.65,0.61), (0.07,0.48,0.34)]


def geometry():
    cylinder, lid, markers = [], [], []
    def ring(i,y):
        a = i * math.tau / 48
        return (.025 * math.cos(a),y,.025 * math.sin(a))
    for i in range(48):
        a,b,c,d = ring(i,-.043),ring(i+1,-.043),ring(i+1,-.018),ring(i,-.018)
        cylinder.extend((a,d,b,d,c,b,(0,-.018,0),c,d,(0,-.043,0),a,b))
    top = [(-.016,-.007,-.012),(.016,-.007,-.012),(.016,-.007,.012),(-.016,-.007,.012)]
    bot = [(x,-.018,z) for x,_,z in top]
    def quad(a,b,c,d):
        lid.extend((a,b,c,a,c,d))
    quad(*reversed(top)); quad(*bot)
    for i in range(4):
        j=(i+1)%4; quad(top[i],top[j],bot[j],bot[i])
    for cx,cz in [(-.009,.005),(.009,-.005)]:
        def point(i,j):
            phi=i*math.pi/8; theta=j*math.tau/16
            return (cx+.0062*math.sin(phi)*math.cos(theta),.0062*math.cos(phi),cz+.0062*math.sin(phi)*math.sin(theta))
        for i in range(8):
            for j in range(16):
                a,b,c,d=point(i,j),point(i,j+1),point(i+1,j+1),point(i+1,j)
                if i>0: markers.extend((a,b,d))
                if i<7: markers.extend((b,c,d))
    return [cylinder,lid,markers]


def encode(trial, source):
    binary=bytearray(); views=[]; access=[]
    def attribute(rows, kind, vertex=False):
        values=[v for row in rows for v in row]
        start=len(binary); binary.extend(struct.pack(f'<{len(values)}f',*values))
        view={'buffer':0,'byteOffset':start,'byteLength':len(binary)-start}
        if vertex: view['target']=34962
        views.append(view)
        # Bounds must describe float32 data as actually written.
        cols=list(zip(*struct.iter_unpack('<'+'f'*len(rows[0]),binary[start:])))
        access.append({'bufferView':len(views)-1,'componentType':5126,'count':len(rows),'type':kind,
                       'min':[min(col) for col in cols],'max':[max(col) for col in cols]})
        return len(access)-1
    def primitive(points,material,mode):
        return {'attributes':{'POSITION':attribute(points,'VEC3',True)},'material':material,'mode':mode}
    parts=[primitive(shape,material,4) for material,shape in enumerate(geometry())]
    points=[]; times=[]; visible=[]; segments=[]
    for t,x,y,z in trial['frames']:
        observed=x is not None
        curr=(x/1000,z/1000,-y/1000) if observed else (0,0,0)
        if observed and visible and visible[-1][0]: segments.extend((points[-1],curr))
        times.append((t,));points.append(curr);visible.append((int(observed),)*3)
    meshes=[{'name':'Illustrative transport object','primitives':parts},
            {'name':'Measured optical trajectory','primitives':[primitive(segments,3,1)]}]
    time=attribute(times,'SCALAR')
    samplers=[{'input':time,'output':attribute(points,'VEC3'),'interpolation':'STEP'}]
    channels=[{'sampler':0,'target':{'node':0,'path':'translation'}}]
    if any(not v[0] for v in visible):
        samplers.append({'input':time,'output':attribute(visible,'VEC3'),'interpolation':'STEP'})
        channels.append({'sampler':1,'target':{'node':0,'path':'scale'}})
    notes={'credit':', '.join(source['creators']), 'recording':source['dataset_doi'],
           'licence':source['license_url'],'measurement':'Unrotated Vicon displacement in millimetres transformed to glTF metres (X,Z,-Y); STEP camera samples. The upright cylinder orientation and housing are illustrative.',
           'hand':trial['hand'],'target':trial['target'],'rate_hz':250,'source_sha256':trial['source_sha256']}
    materials=[{'name':name,'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[*c,1], 'metallicFactor':0,'roughnessFactor':.77}}
               for name,c in zip(['Cylinder','Sensor case','Reflective markers','Recorded path'],COLORS)]
    gltf={'asset':{'version':'2.0','generator':'Interoceptomics target reach','copyright':notes['credit']+' (data), CC BY 4.0'},'extras':notes,
          'scene':0,'scenes':[{'nodes':[0,1]}],'nodes':[{'name':'Object marker centre','mesh':0},{'name':'Observed path','mesh':1}],
          'meshes':meshes,'materials':materials,'buffers':[{'byteLength':len(binary)}],'bufferViews':views,'accessors':access,
          'animations':[{'name':f"{trial['hand']} hand, target {trial['target']}",'channels':channels,'samplers':samplers}]}
    head=json.dumps(gltf,separators=(',',':'),allow_nan=False).encode();head+=b' '*(-len(head)%4)
    return struct.pack('<4sII',b'glTF',2,28+len(head)+len(binary))+struct.pack('<I4s',len(head),b'JSON')+head+struct.pack('<I4s',len(binary),b'BIN\0')+binary


if __name__=='__main__':
    data=json.loads((HERE/'records.js').read_text().removeprefix('window.REACH_RECORDS = ').removesuffix(';\n'))
    models=HERE/'models';models.mkdir(exist_ok=True)
    for trial in data['trials']:
        (models/(trial['file']+'.glb')).write_bytes(encode(trial,data['source']))
