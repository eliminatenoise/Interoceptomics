"""Build the neutral reference scene, its public GLB and the viewer's apparatus geometry.

Run with Python 3 from any directory. Coordinates in the browser use the source
atlas's millimetres, Z up. glTF uses metres, Y up; (x,y,z) becomes (x,z,-y).
"""
import base64
import json
import math
from pathlib import Path
import struct

HERE = Path(__file__).resolve().parent
PIVOT_Y = 34.0
LOAD_Y = PIVOT_Y - 100.0
METAL = [.27, .43, .44]
DECK = [.31, .60, .61]
SENSOR = [.82, .68, .30]
STRAP = [.29, .47, .67]
BONE = [.86, .85, .77]
MUSCLE = [1.0, .43, .25]
TENDON = [1.0, .83, .51]


def surface(name, color, faces):
    points, triangles = [], []
    for polygon in faces:
        start = len(points) // 3
        for point in polygon:
            points.extend(point)
        for i in range(1, len(polygon) - 1):
            triangles.extend([start, start + i, start + i + 1])
    return dict(name=name, color=color, p=points, f=triangles)


def box(name, center, size, color):
    x, y, z = center
    a, b, c = (length / 2 for length in size)
    points = [(x+i*a, y+j*b, z+k*c) for k in [-1, 1] for j in [-1, 1] for i in [-1, 1]]
    faces = [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4],
             [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]]
    return surface(name, color, [[points[i] for i in face] for face in faces])


def forefoot_strap():
    faces = []
    def point(i, radius, y):
        t = i * math.pi / 24
        return [-102 + (58 + radius) * math.cos(t), y, 3 + (44 + radius) * math.sin(t)]
    for i in range(24):
        for radius, opposite in [(2, False), (0, True)]:
            quad = [point(i, radius, -78), point(i, radius, -56), point(i+1, radius, -56), point(i+1, radius, -78)]
            faces.append(quad[::-1] if opposite else quad)
        for y in [-78, -56]:
            quad = [point(i, 0, y), point(i, 2, y), point(i+1, 2, y), point(i+1, 0, y)]
            faces.append(quad if y == -78 else quad[::-1])
    return surface("Forefoot strap (schematic)", STRAP, faces)


def apparatus():
    return [
        box("Fixed neutral pedal", [-96, -25, -.5], [152, 254, 7], DECK),
        box("Base frame", [-96, -25, -59], [164, 268, 8], METAL),
        box("Illustrative pivot support", [-96, PIVOT_Y, -29.5], [110, 18, 51], METAL),
        box("Load cell under pedal", [-96, LOAD_Y, -29.5], [40, 34, 51], SENSOR),
        forefoot_strap(),
    ]


def decode(encoded, fmt):
    return [i[0] for i in struct.iter_unpack("<" + fmt, base64.b64decode(encoded))]


def anatomy():
    src = (HERE / "reference/leg.js").read_text().removeprefix("const LEG = ").removesuffix(";\n")
    meshes = []
    for record in json.loads(src):
        points = [v/10 for v in decode(record["xyz"], "h")]
        faces = decode(record["triangles"], "H")
        groups = [("bone", BONE, faces)]
        if "tendon" in record:
            tags = decode(record["tendon"], "B")
            groups = [(label, color, [v for i, tag in enumerate(tags) if tag == group for v in faces[3*i:3*i+3]])
                      for group, label, color in [(0, "belly", MUSCLE), (1, "tendon", TENDON)]]
        for label, color, indices in groups:
            meshes.append(dict(name=f"{record['name']} ({label})", color=color, p=points, f=indices))
    return meshes


def save_glb(parts, anatomy_count):
    doc = {"asset": {"version": "2.0", "generator": "Interoceptomics",
                     "copyright": "Adapted scene CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. Z-Anatomy - The libre 3D atlas of anatomy - CC BY-SA 4.0, Gauthier Kervyn and Marcin Zielinski, https://github.com/Z-Anatomy/Models-of-human-anatomy. BodyParts3D - The Database Center for Life Science - CC BY-SA 2.1 Japan, https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html. Selected and rounded atlas geometry, recoloured and reoriented into metres. Original schematic platform CC0."},
           "scene": 0, "scenes": [{"nodes": [0, 1]}],
           "nodes": [{"name": "Right reference anatomy", "children": []},
                     {"name": "Illustrative fixed neutral platform", "children": [],
                      "extras": {"platformMomentArmMetres": .1, "pose": "Reference only, no participant registration"}}],
           "meshes": [], "materials": [], "bufferViews": [], "accessors": []}
    buf = bytearray()
    def accessor(seq, fmt, gltype, width, target, bounds=False):
        while len(buf) % 4:
            buf.append(0)
        chunk = struct.pack(f"<{len(seq)}{fmt}", *seq)
        view = len(doc["bufferViews"])
        doc["bufferViews"].append({"buffer": 0, "byteOffset": len(buf), "byteLength": len(chunk), "target": target})
        buf.extend(chunk)
        rec = {"bufferView": view, "componentType": gltype, "type": {1: "SCALAR", 3: "VEC3"}[width], "count": len(seq)//width}
        if bounds:
            rec.update(min=[min(seq[i::width]) for i in range(width)], max=[max(seq[i::width]) for i in range(width)])
        doc["accessors"].append(rec)
        return len(doc["accessors"]) - 1
    materials = {}
    for i, part in enumerate(parts):
        coord, indices = part["p"], part["f"]
        points = [(coord[j]*.001, coord[j+2]*.001, -coord[j+1]*.001) for j in range(0, len(coord), 3)]
        normals = [[0., 0., 0.] for p in points]
        for j in range(0, len(indices), 3):
            tri = indices[j:j+3]
            a, b, c = [points[k] for k in tri]
            u = [b[k]-a[k] for k in range(3)]
            v = [c[k]-a[k] for k in range(3)]
            cross = [u[(k+1)%3]*v[(k+2)%3]-u[(k+2)%3]*v[(k+1)%3] for k in range(3)]
            for k in tri:
                for axis in range(3):
                    normals[k][axis] += cross[axis]
        color = tuple(part["color"])
        if color not in materials:
            materials[color] = len(materials)
            doc["materials"].append({"doubleSided": True, "pbrMetallicRoughness": {
                "baseColorFactor": [*color, 1.], "metallicFactor": 0., "roughnessFactor": .8}})
        pos = accessor([v for p in points for v in p], "f", 5126, 3, 34962, True)
        norm = []
        for n in normals:
            length = math.hypot(*n)
            norm.extend([v/length for v in n] if length else [0.,1.,0.])
        nor = accessor(norm, "f", 5126, 3, 34962)
        idx = accessor(indices, "H", 5123, 1, 34963)
        doc["meshes"].append({"name": part["name"], "primitives": [
            {"attributes": {"POSITION": pos, "NORMAL": nor}, "indices": idx, "material": materials[color]}]})
        doc["nodes"][int(i >= anatomy_count)]["children"].append(len(doc["nodes"]))
        doc["nodes"].append({"name": part["name"], "mesh": i})
    while len(buf) % 4:
        buf.append(0)
    doc["buffers"] = [{"byteLength": len(buf)}]
    js = json.dumps(doc, separators=(",", ":"), ensure_ascii=True).encode()
    js += b" " * (-len(js) % 4)
    glb = struct.pack("<4sII", b"glTF", 2, 28+len(js)+len(buf))
    glb += struct.pack("<I4s", len(js), b"JSON") + js
    glb += struct.pack("<I4s", len(buf), b"BIN\0") + buf
    (HERE/"neutral-pedal.glb").write_bytes(glb)


if __name__ == "__main__":
    platform, leg = apparatus(), anatomy()
    (HERE/"apparatus.js").write_text("const APPARATUS = "+json.dumps(platform, separators=(",", ":"))+";\n")
    save_glb(leg + platform, len(leg))
