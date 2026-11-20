"""Write a glTF 2.0 marker and segment animation in metres; +Y up, +X travel."""
import json
import struct

import numpy as np


def sphere():
    rings, count = 8, 16
    vertices = [[0, 1, 0]]
    for i in range(1, rings):
        a = i * np.pi / rings
        for j in range(count):
            b = j * 2 * np.pi / count
            vertices.append([np.sin(a)*np.cos(b), np.cos(a), np.sin(a)*np.sin(b)])
    vertices.append([0, -1, 0])
    vertices = np.asarray(vertices)
    triangles = []
    for i in range(rings):
        for j in range(count):
            k = (j + 1) % count
            if i == 0:
                triangles.append([0, 1+j, 1+k])
            elif i == rings-1:
                triangles.append([1+(i-1)*count+j, len(vertices)-1, 1+(i-1)*count+k])
            else:
                p, q = 1+(i-1)*count, 1+i*count
                triangles.extend([[p+j, q+j, q+k], [p+j, q+k, p+k]])
    for triangle in triangles:
        x, y, z = vertices[triangle]
        if np.dot(np.cross(y-x, z-x), x) < 0:
            triangle.reverse()
    return vertices, triangles


def rotation_from_y(direction):
    # Orients local +Y to the segment vector. Pick any horizontal axis for a half turn.
    q = np.column_stack([direction[:, 2], np.zeros(len(direction)), -direction[:, 0],
                         1 + direction[:, 1]])
    norm = np.linalg.norm(q, axis=1)
    q[norm < 1e-12] = [1, 0, 0, 0]
    return q / np.linalg.norm(q, axis=1)[:, None]


def write_model(path, code, travel, markers, segments, faces, sha, events):
    xyz = travel[:, :, [0, 2, 1]].copy()
    xyz[:, :, 2] *= -1
    block = bytearray()
    views, accessors = [], []

    def add(data, kind, field, dimensions, gpu_target=None):
        values = np.ascontiguousarray(data, dtype=kind).reshape(-1, dimensions)
        while len(block) % 4:
            block.append(0)
        view = dict(buffer=0, byteOffset=len(block), byteLength=values.nbytes)
        if gpu_target:
            view['target'] = gpu_target
        views.append(view)
        block.extend(values.tobytes())
        accessors.append(dict(bufferView=len(views)-1, componentType=5126 if kind=='<f4' else 5123,
                              count=len(values), type=field, min=values.min(axis=0).tolist(),
                              max=values.max(axis=0).tolist()))
        return len(accessors)-1

    vertices, triangles = sphere()
    positions = add(vertices, '<f4', 'VEC3', 3, 34962)
    indices = add(triangles, '<u2', 'SCALAR', 1, 34963)
    time = add(np.arange(len(xyz))/100, '<f4', 'SCALAR', 1)
    nodes, samplers, channels = [], [], []
    colours = [[.98,.69,.16,1],[.29,.73,.91,1],[.96,.94,.85,1],[.24,.33,.42,1]]
    materials = [dict(pbrMetallicRoughness=dict(baseColorFactor=c, metallicFactor=0, roughnessFactor=.68)) for c in colours]
    meshes = [dict(primitives=[dict(attributes=dict(POSITION=positions,NORMAL=positions),
                                     indices=indices,material=i)]) for i in range(len(colours))]

    def track(node_index, field, values):
        nodes[node_index][field] = values[0].tolist()
        size = values.shape[1]
        samplers.append(dict(input=time, interpolation='STEP',
                             output=add(values, '<f4', f'VEC{size}', size)))
        channels.append(dict(sampler=len(samplers)-1, target=dict(node=node_index, path=field)))

    for segment in segments:
        a = xyz[:, segment['start']].mean(axis=1)
        b = xyz[:, segment['end']].mean(axis=1)
        diff = b-a
        length = np.linalg.norm(diff, axis=1)
        node = len(nodes)
        nodes.append(dict(name=segment['name']+' (illustrative)', mesh=3))
        track(node, 'translation', (a+b)/2)
        track(node, 'rotation', rotation_from_y(diff/length[:,None]))
        r = np.full(len(length), segment['radius'])
        track(node, 'scale', np.column_stack([r, length/2, r]))
    marker_start = len(nodes)
    for m, label in enumerate(markers):
        node = len(nodes)
        colour = 0 if label.startswith('R_') else 1 if label.startswith('L_') else 2
        nodes.append(dict(name=label, mesh=colour, scale=[.012]*3))
        track(node, 'translation', xyz[:, m])
    # Skin the trunk triangles to the marker nodes. Each vertex follows one
    # measured site; inverse binds remove its marker-sphere scale and rest offset.
    sites = sorted({i for face in faces for i in face})
    joints = np.zeros((len(sites), 4), dtype='<u2')
    joints[:, 0] = np.arange(len(sites))
    weights = np.zeros((len(sites), 4)); weights[:, 0] = 1
    rest = xyz[0, sites]
    inverse = np.tile(np.eye(4), (len(sites), 1, 1))
    inverse[:, :3, :3] /= .012
    inverse[:, :3, 3] = -rest / .012
    inv_acc = add(inverse.transpose(0, 2, 1), '<f4', 'MAT4', 16)
    skeleton = len(nodes)
    nodes.append(dict(name='Recorded markers', children=list(range(marker_start, marker_start+len(markers)))))
    skin = dict(name='Measured trunk sites', skeleton=skeleton, joints=[marker_start+i for i in sites],
                inverseBindMatrices=inv_acc)
    material = len(materials)
    materials.append(dict(doubleSided=True, pbrMetallicRoughness=dict(
        baseColorFactor=[.29,.41,.44,1], metallicFactor=0, roughnessFactor=.82)))
    mesh = len(meshes)
    meshes.append(dict(name='Trunk between skin markers', primitives=[dict(attributes=dict(
        POSITION=add(rest, '<f4', 'VEC3', 3, 34962),
        JOINTS_0=add(joints, '<u2', 'VEC4', 4, 34962),
        WEIGHTS_0=add(weights, '<f4', 'VEC4', 4, 34962)),
        indices=add([[sites.index(i) for i in face] for face in faces], '<u2', 'SCALAR', 1, 34963),
        material=material)]))
    nodes.append(dict(name='Illustrated trunk surface', mesh=mesh, skin=0))
    scene_nodes = list(range(marker_start)) + [skeleton, len(nodes)-1]
    hdr = dict(asset=dict(version='2.0', generator='Interoceptomics',
                          copyright='C. Schreiber and F. Moissenet, 2019, CC BY 4.0 (data)'),
               scene=0, scenes=[dict(name=f'{code} marker walk',nodes=scene_nodes)],
               extras=dict(sourceSHA256=sha, condition=code, source='https://doi.org/10.6084/m9.figshare.7734767.v8',
                           units='metres', axes='X forward, Y up, Z right',
                           reference='Pelvis XY at first right strike; source floor Z=0',
                           physicalFirstFrame=1, framesPerSecond=100, events=events),
               nodes=nodes, skins=[skin], materials=materials, meshes=meshes,
               animations=[dict(name=f'{code} at recorded speed',channels=channels,samplers=samplers)],
               buffers=[dict(byteLength=len(block))], bufferViews=views, accessors=accessors)
    document = json.dumps(hdr,separators=(',',':')).encode()
    document += b' ' * (-len(document)%4)
    block.extend(bytes(-len(block)%4))
    size = 12 + 8 + len(document) + 8 + len(block)
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, size) +
                     struct.pack('<I4s', len(document), b'JSON') + document +
                     struct.pack('<I4s', len(block), b'BIN\0') + block)
