"""Run inside Blender against the original Z-Anatomy Startup.blend. See NOTICE.txt."""
import base64
import hashlib
import json
import struct
import sys
from pathlib import Path

import bpy

ROOT_HASH = "9f08a17ea0115fed80b2a73ecdf0a1bc2ab2f6956f37c593ce23d513ea35afcd"
if hashlib.file_digest(open(bpy.data.filepath, "rb"), "sha256").hexdigest() != ROOT_HASH:
    raise ValueError("Use the cited Z-Anatomy source edition")
destination = Path(sys.argv[sys.argv.index("--") + 1])
groups = {"upper": ["C3", "C4", "C5", "C6"], "lower": ["L1", "L2", "L3", "L4"]}
graph = bpy.context.evaluated_depsgraph_get()
result = {}
for region, bones in groups.items():
    names = ["Vertebra " + bone for bone in bones]
    names += ["Intervertebral disc " + a + "-" + b for a, b in zip(bones, bones[1:])]
    center = bpy.data.objects[names[1]].matrix_world.translation
    parts = []
    for name in names:
        obj = bpy.data.objects[name].evaluated_get(graph)
        mesh = obj.to_mesh(preserve_all_data_layers=True, depsgraph=graph)
        mesh.calc_loop_triangles()
        # Quantize world-space offsets to 0.05 mm. The camera uses Blender's native axes.
        positions = []
        for vertex in mesh.vertices:
            point = obj.matrix_world @ vertex.co - center
            positions.extend(round(x * 20000) for x in point)
        indices = [i for tri in mesh.loop_triangles for i in tri.vertices]
        pack = lambda values, code: base64.b64encode(struct.pack("<" + code * len(values), *values)).decode("ascii")
        parts.append(dict(name=name, xyz=pack(positions, "h"), faces=pack(indices, "H")))
        obj.to_mesh_clear()
    result[region] = parts
destination.write_text("const SPINE = " + json.dumps(result, separators=(",", ":")) + ";\n")
