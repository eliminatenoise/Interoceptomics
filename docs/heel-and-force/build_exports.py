"""Build a public frame table and one metre-scaled static glTF at each target."""
import csv
import json
import math
from pathlib import Path
import struct

HERE = Path(__file__).resolve().parent


def read_js(name, var):
    text = (HERE / name).read_text(encoding='utf-8').removeprefix(f'const {var} = ').strip()
    return json.loads(text.removesuffix(';'))


def metre(p):
    return [p[0] / 1000, p[2] / 1000, -p[1] / 1000]


def pose_file(data, links, frame):
    binary = bytearray()
    asset = {'asset': {'version': '2.0', 'generator': 'Heel and force', 'copyright': 'Markers and plate geometry adapted from Moissenet and Schreiber, CC BY 4.0'},
             'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [], 'materials': [],
             'accessors': [], 'bufferViews': [], 'extensionsUsed': ['KHR_materials_unlit']}
    def accessor(points):
        offset = len(binary)
        for p in points:
            binary.extend(struct.pack('<3f', *p))
        i = len(asset['bufferViews'])
        asset['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(binary) - offset, 'target': 34962})
        asset['accessors'].append({'bufferView': i, 'componentType': 5126, 'count': len(points), 'type': 'VEC3',
                                   'min': list(map(min, zip(*points))), 'max': list(map(max, zip(*points)))})
        return i
    def mesh(points, material, mode=4):
        i = len(asset['meshes'])
        asset['meshes'].append({'primitives': [{'attributes': {'POSITION': accessor(points)}, 'mode': mode, 'material': material}]})
        return i
    def node(name, model, **kwargs):
        asset['scenes'][0]['nodes'].append(len(asset['nodes']))
        asset['nodes'].append(dict(name=name, mesh=model, **kwargs))
    for name, colour in [('Right markers',[0.96,.54,.22,1]),('Left markers',[.28,.61,.75,1]),('Trunk',[.66,.78,.75,1]),
                         ('Right heel',[1,.93,.45,1]),('Right second metatarsal',[1,.35,.13,1]),('Right plate',[.12,.35,.25,1]),('Left plate',[.19,.28,.30,1])]:
        asset['materials'].append({'name': name, 'extensions': {'KHR_materials_unlit': {}}, 'doubleSided': True,
                                   'pbrMetallicRoughness': {'baseColorFactor': colour, 'metallicFactor': 0}})
    # Identical 5 mm display glyphs. Only their centre positions describe the recording.
    directions = [[.005,0,0],[0,.005,0],[-.005,0,0],[0,-.005,0],[0,0,.005],[0,0,-.005]]
    sphere = [directions[i] for cap in [4,5] for a in range(4) for i in (cap,a,(a+1)%4)]
    glyphs = [mesh(sphere, k) for k in range(5)]
    points = dict(zip(data['markerLabels'], data['labXYZmm'][frame - data['firstIndex']], strict=True))
    for name, p in points.items():
        if p is None:
            continue
        kind = {'R_FCC': 3, 'R_FM2': 4}.get(name, {'R': 0, 'L': 1}.get(name[0], 2))
        node(name, glyphs[kind], translation=metre(p))
    for k, plate in enumerate(data['plateCornersMm']):
        verts = [metre(plate[i]) for i in (0,1,2,2,3,0)]
        node(f'Plate {k+1} surface', mesh(verts, k+5))
    groups = [(f'{side} marker links', [[side+'_'+v for v in chain] for chain in links['legChains']+links['armChains']], k)
              for k, side in enumerate(('R','L'))] + [('Trunk marker links', links['bodyChains'], 2)]
    for name, paths, colour in groups:
        verts = [metre(points[v]) for path in paths for a,b in zip(path,path[1:])
                 if points[a] is not None and points[b] is not None for v in (a,b)]
        node(name, mesh(verts, colour, mode=1))
    fz = data['upwardPlate1N'][frame-data['firstIndex']]
    asset['scenes'][0].update(name=f'2014001_C2_01 · {frame/100:.2f} s', extras={
        'zeroBasedCameraIndex': frame, 'physicalC3DFrame': frame+1, 'plate1UpwardMeanN': math.fsum(fz)/15,
        'units': 'metres', 'laboratoryToGltf': '[X,Z,-Y]/1000 (laboratory input in mm)',
        'markerRadiusM': .005, 'anatomy': 'Measured skin markers; links and marker sizes are display guides.'})
    asset['buffers'] = [{'byteLength': len(binary)}]
    desc = json.dumps(asset, ensure_ascii=False, separators=(',',':')).encode('utf-8')
    desc += b' ' * (-len(desc)%4)
    return struct.pack('<4sII',b'glTF',2,28+len(desc)+len(binary))+struct.pack('<I4s',len(desc),b'JSON')+desc+struct.pack('<I4s',len(binary),b'BIN\0')+binary


if __name__ == '__main__':
    d = read_js('measurements.js','recording')
    structure = read_js('structure.js','structure')
    heel, fore = map(d['markerLabels'].index, ['R_FCC','R_FM2'])
    with (HERE/'frames.csv').open('w', newline='') as f:
        writer = csv.writer(f,lineterminator='\n')
        writer.writerow(['camera_index','physical_c3d_frame','cropped_time_s','heel_X_mm','heel_Y_mm','heel_Z_mm',
                         'forefoot_X_mm','forefoot_Y_mm','forefoot_Z_mm','plate1_upward_mean_N','first_analog_index','last_analog_index'])
        for j,(points,force) in enumerate(zip(d['labXYZmm'],d['upwardPlate1N'],strict=True),d['firstIndex']):
            writer.writerow([j,j+1,j/100,*points[heel],*points[fore],math.fsum(force)/15,j*15,j*15+14])
    for cutoff in d['cutoffs']:
        target = cutoff + d['horizonFrames']
        (HERE/f'pose-{target}.glb').write_bytes(pose_file(d,structure,target))
