import * as THREE from 'three';

export async function loadSharedFaces(source, modelBasis) {
  const response = await fetch('./' + source.overlay.file, {signal: AbortSignal.timeout(10000)});
  if (!response.ok) throw Error('Shared faces returned HTTP ' + response.status);
  const data = await response.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  const sha256 = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  if (sha256 !== source.overlay.sha256) throw Error('Shared faces checksum mismatch');

  const grid = JSON.parse(new TextDecoder().decode(data));
  if (grid.schema !== 1 || grid.annotation_sha256 !== source.source_annotation_sha256 ||
      grid.labels.join() !== source.regions.map(region => region.id).join() ||
      grid.faces.length !== source.shared_faces ||
      grid.spacing_mm.some(step => step !== source.voxel_size_mm)) {
    throw Error('Shared faces grid does not match the comparison');
  }

  // The record identifies the voxel on the lower side of a shared face along its given axis.
  // The face is halfway to the next centre, with half a voxel on either transverse side.
  const worldFromRAS = new THREE.Matrix3().set(...modelBasis.flat());
  // Similar shades make the three facets of the grid legible during rotation.
  const shades = [source.overlay.color, '#c77708', '#efab2b'].map(color => new THREE.Color(color).toArray());
  const positions = [];
  const colors = [];
  const indices = [];
  for (const [axis, ...voxel] of grid.faces) {
    const u = (axis + 1) % 3;
    const v = (axis + 2) % 3;
    const centre = voxel.map((index, i) => grid.ras_origin_mm[i] + grid.spacing_mm[i] * index);
    centre[axis] += grid.spacing_mm[axis] / 2;
    const offset = positions.length / 3;
    for (const [du, dv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const ras = centre.slice();
      ras[u] += du * grid.spacing_mm[u] / 2;
      ras[v] += dv * grid.spacing_mm[v] / 2;
      positions.push(...new THREE.Vector3(...ras).applyMatrix3(worldFromRAS).toArray());
      colors.push(...shades[axis]);
    }
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    toneMapped: false,
    // Draw after the translucent shells. They leave the depth buffer clear,
    // so the grid occludes its own farther facets while remaining visible through the pair.
    transparent: true,
    forceSinglePass: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'VPL_VPM_shared_voxel_faces';
  mesh.renderOrder = 1;
  mesh.visible = false;
  return mesh;
}
