"""Export the included shoulder-relative marker records to a self-contained glTF 2 GLB.

Python standard library only. Source (x,y,z) in metres becomes glTF (x,z,-y).
The STEP animation retains each stored 10-ms sample. At missing samples the
corresponding marker/guide scales to zero. Guide widths and dot radii only aid
visibility. No cortex location, surface or forecast enters this model.
"""
import json
import math
import struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
raw = (HERE / 'trial.js').read_text()
data = json.loads(raw.removeprefix('window.REACH_TRIAL = ').removesuffix(';\n'))
binary = bytearray()
views, accessors, meshes, nodes, channels, samplers = [], [], [], [], [], []

def accessor(rows, kind, *, bounds=False, vertices=False):
    dims = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[kind]
    assert all(len(row) == dims for row in rows)
    start = len(binary)
    flat = [value for row in rows for value in row]
    binary.extend(struct.pack('<' + str(len(flat)) + 'f', *flat))
    view = {'buffer': 0, 'byteOffset': start, 'byteLength': len(binary)-start}
    if vertices:
        view['target'] = 34962
    views.append(view)
    acc = {'bufferView': len(views)-1,'componentType': 5126,'count': len(rows),'type': kind}
    if bounds:
        acc['min'] = [min(col) for col in zip(*rows)]
        acc['max'] = [max(col) for col in zip(*rows)]
    accessors.append(acc)
    return len(accessors)-1

def normalize(v):
    length = math.hypot(*v)
    return [k/length for k in v]

# Outward-wound triangle patches on a smooth unit sphere.
def ball():
    axes = [(1,0,0),(0,1,0),(-1,0,0),(0,-1,0)]
    patches=[]
    for i in range(4):
        a,b=axes[i],axes[(i+1)%4]
        patches.extend([(a,b,(0,0,1)), (b,a,(0,0,-1))])
    for _ in range(2):
        next_patches=[]
        for a,b,c in patches:
            ab,bc,ca=[normalize([x+y for x,y in zip(l,r)]) for l,r in ((a,b),(b,c),(c,a))]
            next_patches.extend(((a,ab,ca),(ab,b,bc),(ca,bc,c),(ab,bc,ca)))
        patches=next_patches
    normals=[p for tri in patches for p in tri]
    return [[value*.0033 for value in p] for p in normals],normals

def rod():
    positions,normals=[],[]
    for i in range(12):
        a=math.tau*i/12;b=math.tau*(i+1)/12
        for angle,y in ((a,0),(a,1),(b,1),(a,0),(b,1),(b,0)):
            x,z=math.cos(angle),math.sin(angle)
            positions.append([.00085*x,y,.00085*z]);normals.append([x,0,z])
    return positions,normals

materials=[]
for name,c in [('hand',[.37,.81,.27]),('forearm',[.16,.65,.55]),('upper arm',[.32,.56,.86]),('shoulder',[.91,.77,.35]),('guide',[.35,.48,.43])]:
    materials.append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':c+[1],'metallicFactor':0,'roughnessFactor':.7}})
for name,geometry,mat_ids in [('Marker',ball(),range(4)),('Guide',rod(),[4])]:
    pos,nor=geometry
    attrs={'POSITION':accessor(pos,'VEC3',bounds=True,vertices=True),'NORMAL':accessor(nor,'VEC3',vertices=True)}
    for i in mat_ids:
        meshes.append({'name':name+' · '+materials[i]['name'],'primitives':[{'attributes':attrs,'material':i}]})
frames=data['marker_xyz_m']
t=accessor([[i*data['dt_s']] for i in range(len(frames))],'SCALAR',bounds=True)
def key(node,path,values):
    kind='VEC4' if path=='rotation' else 'VEC3'
    samplers.append({'input':t,'output':accessor(values,kind),'interpolation':'STEP'})
    channels.append({'sampler':len(samplers)-1,'target':{'node':node,'path':path}})

def axes(point):
    if not all(isinstance(v,(int,float)) and math.isfinite(v) for v in point):
        return None
    x,y,z=point
    return [x,z,-y]
locs=[[axes(p) for p in row] for row in frames]
visible=[1,1,1]
hidden=[0,0,0]
for i,name in enumerate(data['marker_names']):
    track=[row[i] for row in locs]
    node={'name':name,'mesh':[0,0,0,1,1,1,2,2,1,3][i],'translation':track[0] or hidden}
    nodes.append(node);key(i,'translation',[p or hidden for p in track])
    if any(p is None for p in track):
        node['scale']=visible if track[0] is not None else hidden
        key(i,'scale',[visible if p is not None else hidden for p in track])

guides=[(9,7),(7,6),(6,5),(5,8),(8,3),(8,4),(3,4),(3,1),(4,2),(1,0),(2,0),(1,2)]
for a,b in guides:
    shifts,rotations,scales=[],[],[]
    for row in locs:
        p,q=row[a],row[b]
        delta=[v-u for u,v in zip(p,q)] if p and q else [0,0,0]
        length=math.hypot(*delta)
        shifts.append(p or hidden)
        scales.append([1,length,1] if length else hidden)
        if length:
            x,y,z=[v/length for v in delta]
            rot=normalize([z,0,-x,1+y]) if y>-.999999999 else [1,0,0,0]
        else:rot=[0,0,0,1]
        rotations.append(rot)
    index=len(nodes)
    nodes.append({'name':'Guide '+data['marker_names'][a]+' to '+data['marker_names'][b],'mesh':4,
                  'translation':shifts[0],'scale':scales[0],'rotation':rotations[0]})
    for name,values in [('translation',shifts),('scale',scales),('rotation',rotations)]:
        key(index,name,values)
doc={'asset':{'version':'2.0','generator':'Interoceptomics cortical-reach/export-glb.py',
              'copyright':'Arm trajectories from Chowdhury, Glaser and Miller (2020), Dryad CC0.'},
     'scene':0,'scenes':[{'name':'Cortical Reach, trial '+str(data['trial']),'nodes':list(range(len(nodes)))}],
     'nodes':nodes,'meshes':meshes,'materials':materials,'bufferViews':views,'accessors':accessors,
     'buffers':[{'byteLength':len(binary)}],'animations':[{'name':'Original '+str(data['trial'])+' · 10 ms steps','samplers':samplers,'channels':channels}],
     'extras':{'units':'metres','coordinates':'glTF (x,y,z)=(source x, source z, -source y). Shoulder at origin.',
               'sourceTrial':data['trial'],'startRowMatlab':data['start'],'endRowMatlab':data['end'],
               'positions':'Kinect-derived, filtered and resampled. Guide lines only indicate marker groupings.'}}
js=json.dumps(doc,separators=(',',':'),ensure_ascii=True).encode()
js+=b' '*((-len(js))%4);binary.extend(b'\0'*((-len(binary))%4))
length=12+8+len(js)+8+len(binary)
result=struct.pack('<4sII',b'glTF',2,length)+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(binary),b'BIN\0')+binary
(HERE/'cortical-reach.glb').write_bytes(result)
