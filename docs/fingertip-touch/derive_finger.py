"""Crop and orient the right index finger of the pinned CC0 MakeHuman hm08 surface."""
import argparse
from collections import defaultdict
from hashlib import sha256
import json
from math import cos, radians, sin, sqrt
from pathlib import Path
from urllib.request import urlopen

HERE = Path(__file__).resolve().parent
ROOT = 'https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/'
ASSETS = {
    '3dobjs/base.obj': '8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c',
    'rigs/default.mhskel': '99f179bce0aa850b45d4191a1d0d234c5851f881c057439470ded3bddf729a24',
    'rigs/default_weights.mhw': '0f3641d651ae3d00ad6b4ccee43142edb109d3bd909d27d9e4139ef1beed8625',
}


def load(name, folder):
    data = (folder / Path(name).name).read_bytes() if folder else urlopen(ROOT + name, timeout=30).read()
    if sha256(data).hexdigest() != ASSETS[name]:
        raise ValueError('Changed MakeHuman asset: ' + name)
    return data.decode()


def minus(a, b):
    return [x - y for x, y in zip(a, b)]


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    return [x / sqrt(dot(a, a)) for x in a]


def cross(a, b):
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]


def build(folder):
    vertices, body = [], []
    group = ''
    for line in load('3dobjs/base.obj', folder).splitlines():
        if line.startswith('v '):
            vertices.append(list(map(float, line[2:].split())))
        elif line.startswith('g '):
            group = line[2:].strip()
        elif line.startswith('f ') and group == 'body':
            body.append([int(x.split('/')[0])-1 for x in line[2:].split()])

    joints = json.loads(load('rigs/default.mhskel', folder))['joints']
    def joint(label):
        points = [vertices[k] for k in joints[label]]
        return [sum(axis)/len(points) for axis in zip(*points)]

    root = joint('finger2-1.R____head')
    distal = norm(minus(joint('finger2-3.R____tail'), root))
    ulnar = minus(joint('finger3-1.R____head'), root)
    dorsal = norm(cross(ulnar, distal))
    side = norm(cross(distal, dorsal))
    weight = defaultdict(float)
    for bone, entries in json.loads(load('rigs/default_weights.mhw', folder))['weights'].items():
        if bone.startswith('finger2-') and bone.endswith('.R'):
            for i, value in entries:
                weight[i] += value
    # Keep distal body faces, then clip one plane through the proximal segment.
    threshold = .13
    angle = radians(25)
    def local(index):
        vec = minus(vertices[index], root)
        return [dot(vec, axis) for axis in (distal, dorsal, side)]

    faces, points, keys = [], [], {}
    def add(p):
        key = tuple(round(x, 6) for x in p)
        if key not in keys:
            keys[key] = len(points)
            points.append(key)
        return keys[key]

    for face in body:
        if not all(weight[i] > .05 for i in face):
            continue
        polygon = []
        vs = [local(i) for i in face]
        for a,b in zip(vs, vs[1:]+vs[:1]):
            if a[0] >= threshold:
                polygon.append(a)
            if (a[0] >= threshold) != (b[0] >= threshold):
                t = (threshold-a[0]) / (b[0]-a[0])
                polygon.append([x + t*(y-x) for x,y in zip(a,b)])
        if len(polygon) >= 3:
            p = [add(v) for v in polygon]
            faces.extend([[p[0],p[j],p[j+1]] for j in range(1,len(p)-1)])

    # Close the proximal cut with a neutral flat surface.
    from math import atan2
    boundary = [i for i,p in enumerate(points) if abs(p[0]-threshold) < 1e-5]
    mid = [sum(points[i][j] for i in boundary)/len(boundary) for j in range(3)]
    boundary.sort(key=lambda i: atan2(points[i][2]-mid[2],points[i][1]-mid[1]), reverse=True)
    cap = add(mid)
    cap_start = len(faces)
    faces.extend([[cap,boundary[i-1],v] for i,v in enumerate(boundary)])
    # One Loop subdivision step smooths the faceted base surface while maintaining
    # a planar crop. Preserve cap membership so fallback shading can distinguish it.
    neighbors = defaultdict(set)
    opposite = defaultdict(list)
    for a,b,c in faces:
        for i,j,k in ((a,b,c),(b,c,a),(c,a,b)):
            neighbors[i].add(j)
            neighbors[j].add(i)
            opposite[tuple(sorted((i,j)))].append(k)
    updated = []
    boundary_set = set(boundary + [cap])
    for i,p in enumerate(points):
        adj = neighbors[i]
        beta = 3/(8*len(adj)) if len(adj)>3 else 3/16
        updated.append(p if i in boundary_set else [p[k]*(1-len(adj)*beta)
                       +sum(points[j][k] for j in adj)*beta for k in range(3)])
    mids = {}
    for edge, other in opposite.items():
        a,b=edge
        if len(other)==2 and not (a in boundary_set and b in boundary_set):
            point=[(3*(points[a][k]+points[b][k])+sum(points[j][k] for j in other))/8 for k in range(3)]
        else:
            point=[(x+y)/2 for x,y in zip(points[a],points[b])]
        mids[edge] = len(updated)
        updated.append(point)
    refined=[]
    for a,b,c in faces:
        ab,bc,ca = [mids[tuple(sorted(pair))] for pair in ((a,b),(b,c),(c,a))]
        refined.extend(([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]))
    faces, points, cap_start = refined, updated, 4*cap_start
    # Tip points right, pad faces the plate; choose an arbitrary model scale.
    tilted = [[(x*cos(angle)+y*sin(angle))*10, (-x*sin(angle)+y*cos(angle))*10, z*10] for x,y,z in points]
    floor = min(p[1] for p in tilted)
    contact_x = min(tilted,key=lambda p:p[1])[0]
    return {'points': [[round(x-contact_x,4),round(y-floor,4),round(z,4)] for x,y,z in tilted],
            'faces': faces, 'capStart': cap_start}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path)
    args = parser.parse_args()
    result = json.dumps(build(args.source_dir), separators=(',',':'))
    (HERE/'finger.js').write_text('/* MakeHuman hm08 right index finger, CC0. */\nconst Finger = ' + result + ';\n')
