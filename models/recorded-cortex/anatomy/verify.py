"""Compare the finished private packet against the three original anatomy fields."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from extract import MAT_HASH, PRIVATE, geometry
from scipy.spatial import cKDTree


def summary(values):
    return dict(
        zip(
            ("min", "median", "p95", "max"),
            np.quantile(values, [0, 0.5, 0.95, 1]).tolist(),
        )
    )


def matrix_hash(array, dtype):
    return hashlib.sha256(array.astype(dtype).tobytes(order="C")).hexdigest()


def triangle_distances(vertices, faces, contacts):
    """Exact nearest triangle by testing every triangle's face and three segments."""
    a, b, c = np.transpose(vertices[faces], (1, 0, 2))
    ab, ac, bc = b - a, c - a, c - b
    normal = np.cross(ab, ac)
    norm_squared = np.einsum("ij,ij->i", normal, normal)
    if np.any(norm_squared == 0):
        raise ValueError("Zero-area face in original source.")
    edge_norms = [np.einsum("ij,ij->i", edge, edge) for edge in (ab, ac, bc)]
    ab_ac = np.einsum("ij,ij->i", ab, ac)
    distances = []
    for point in contacts:
        ap = point - a
        ab_ap = np.einsum("ij,ij->i", ab, ap)
        ac_ap = np.einsum("ij,ij->i", ac, ap)
        u = (edge_norms[1] * ab_ap - ab_ac * ac_ap) / norm_squared
        v = (edge_norms[0] * ac_ap - ab_ac * ab_ap) / norm_squared
        inside = (u >= 0) & (v >= 0) & (u + v <= 1)
        height = np.einsum("ij,ij->i", ap, normal)
        best = np.min(np.where(inside, height**2 / norm_squared, np.inf))
        for origin, edge, squared in zip((a, a, b), (ab, ac, bc), edge_norms):
            delta = point - origin
            along = np.einsum("ij,ij->i", delta, edge) / squared
            remainder = delta - np.clip(along, 0, 1)[:, None] * edge
            best = min(best, np.einsum("ij,ij->i", remainder, remainder).min())
        distances.append(float(np.sqrt(best)))
    return np.array(distances)


def verify(mat_path, json_path):
    vertices, faces, locs, regions = geometry(mat_path.read_bytes())
    data = json_path.read_bytes()
    packet = json.loads(data)
    contacts = packet["contacts"]
    n = len(locs)
    if (
        packet["source"]["member_sha256"] != MAT_HASH
        or not np.array_equal(vertices, packet["mesh"]["vertices"])
        or not np.array_equal(faces, packet["mesh"]["faces"])
        or not np.array_equal(locs, [row["xyz"] for row in contacts])
        or not np.array_equal(regions, [row["region_code"] for row in contacts])
        or [row["column0"] for row in contacts] != list(range(n))
        or [row["column1"] for row in contacts] != list(range(1, n + 1))
    ):
        raise ValueError(
            "The delivered packet differs from the original geometry or recording order."
        )
    oriented = np.vstack([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]])
    edges, inv, counts = np.unique(
        np.sort(oriented, axis=1), axis=0, return_inverse=True, return_counts=True
    )
    signed_balance = np.bincount(inv, weights=np.sign(oriented[:, 1] - oriented[:, 0]))
    mesh_min, mesh_max = vertices.min(0), vertices.max(0)
    nearest_face = triangle_distances(vertices, faces, locs)
    nearest_vertex = cKDTree(vertices).query(locs, workers=1)[0]
    neighbor = cKDTree(locs).query(locs, k=2, workers=1)[0][:, 1]
    if (
        not np.all(counts == 2)
        or np.any(signed_balance)
        or len(np.unique(np.sort(faces, axis=1), axis=0)) != len(faces)
        or len(np.unique(faces)) != len(vertices)
        or len(np.unique(vertices, axis=0)) != len(vertices)
        or len(np.unique(locs, axis=0)) != n
        or not np.all((mesh_min <= locs) & (locs <= mesh_max))
        or not np.all(locs[:, 0] < 0)
        or np.any(nearest_face > nearest_vertex + 1e-10)
    ):
        raise ValueError("Mesh integrity or source alignment checks failed.")
    return {
        "schema": packet["schema"],
        "packet_sha256": hashlib.sha256(data).hexdigest(),
        "packet_bytes": len(data),
        "mat_sha256": MAT_HASH,
        "vertices": len(vertices),
        "triangles": len(faces),
        "edges": len(edges),
        "every_edge_has_two_oppositely_oriented_incident_triangles": True,
        "exact_vertex_face_and_contact_roundtrip": True,
        "source_degenerate_or_duplicate_triangles": 0,
        "contacts": n,
        "all_contact_positions_on_documented_left_side_and_in_mesh_bounds": True,
        "contacts_by_original_region_code": {
            int(i): int(count)
            for i, count in zip(*np.unique(regions, return_counts=True))
        },
        "native_coordinate_unit_unspecified": {
            "mesh_span_xyz": np.ptp(vertices, axis=0).tolist(),
            "contact_to_original_triangle": summary(nearest_face),
            "contact_to_nearest_original_vertex": summary(nearest_vertex),
            "contact_to_nearest_other_contact": summary(neighbor),
        },
        "matrix_hash_convention": "Unpadded row-major, little-endian; coordinates float64, zero-based indices uint32, region codes uint8.",
        "matrix_sha256": {
            "vertices_f64le": matrix_hash(vertices, "<f8"),
            "faces_zero_u32le": matrix_hash(faces, "<u4"),
            "contacts_xyz_f64le": matrix_hash(locs, "<f8"),
            "region_code_u8": matrix_hash(regions, "u1"),
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mat", type=Path, required=True)
    parser.add_argument(
        "--packet", type=Path, default=PRIVATE / "bp-native-cortex.json"
    )
    args = parser.parse_args()
    print(json.dumps(verify(args.mat, args.packet), indent=2))
