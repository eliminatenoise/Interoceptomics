"""Extract the right tibialis anterior and neighbouring bones in their original atlas positions.

Blender 4.5.9: blender --disable-autoexec --background Startup.blend --python-exit-code 1
--python build_leg.py -- leg.js. See NOTICE.txt for attribution and source details.
"""
import base64
import hashlib
import json
import struct
import sys
from pathlib import Path

import bpy

SOURCE = "9f08a17ea0115fed80b2a73ecdf0a1bc2ab2f6956f37c593ce23d513ea35afcd"
with open(bpy.data.filepath, "rb") as source:
    if hashlib.file_digest(source, "sha256").hexdigest() != SOURCE:
        raise ValueError("This builder requires the cited Z-Anatomy source file.")

def encode(data, kind):
    return base64.b64encode(struct.pack(f"<{len(data)}{kind}", *data)).decode("ascii")

names = ["Tibialis anterior muscle.r", "Tibia.r", "Fibula.r", "Talus.r", "Calcaneus.r",
         "Medial cuneiform bone.r", "Intermediate cuneiform bone.r", "Lateral cuneiform bone.r",
         "Navicular bone.r", "Cuboid bone.r"]
for digit in ["first", "second", "third", "fourth", "fifth"]:
    names.append(f"{digit.capitalize()} metatarsal bone.r")
    for level in ["Proximal", "Middle", "Distal"]:
        if level == "Middle" and digit == "first":
            continue
        names.append(f"{level} phalanx of {digit} finger of foot.r")
graph = bpy.context.evaluated_depsgraph_get()
result = []
for name in names:
    obj = bpy.data.objects[name].evaluated_get(graph)
    mesh = obj.to_mesh(preserve_all_data_layers=True, depsgraph=graph)
    mesh.calc_loop_triangles()
    xyz = [round(float(value) * 10000) for v in mesh.vertices for value in obj.matrix_world @ v.co]
    faces = [v for tri in mesh.loop_triangles for v in tri.vertices]
    if not faces or len(mesh.vertices) >= 65536:
        raise ValueError(name)
    result.append(dict(name=name, xyz=encode(xyz, "h"), triangles=encode(faces, "H")))
    if name == "Tibialis anterior muscle.r":
        # Preserve the atlas annotation on each triangle of this single continuous surface.
        result[-1]["tendon"] = encode([int(mesh.materials[tri.material_index].name == "Tendon")
                                        for tri in mesh.loop_triangles], "B")
    obj.to_mesh_clear()
out = Path(sys.argv[sys.argv.index("--") + 1])
out.write_text("const LEG = " + json.dumps(result, separators=(",", ":")) + ";\n")
