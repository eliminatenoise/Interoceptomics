/* Geometry in a right/anterior/superior frame. The scalp retains FieldTrip's MNI mm.
   The arm has its own illustration coordinates and shares no spatial calibration. */
const V = {
  add: (a, b) => a.map((x, i) => x + b[i]),
  sub: (a, b) => a.map((x, i) => x - b[i]),
  scale: (a, k) => a.map((x) => x * k),
  dot: (a, b) => a.reduce((s, x, i) => s + x * b[i], 0),
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  unit: (a) => V.scale(a, 1 / (Math.hypot(...a) || 1)),
  mix: (a, b, t) => V.add(V.scale(a, 1 - t), V.scale(b, t)),
};
const X = [1, 0, 0],
  Y = [0, 1, 0],
  Z = [0, 0, 1],
  RAD = Math.PI / 180;
const color = (hex) => hex.match(/../g).map((v) => parseInt(v, 16) / 255);
const palette = {
  skin: color('ba907a'),
  sleeve: color('37495a'),
  rail: color('5b9da4'),
  metal: color('c3d4d2'),
  dark: color('293e45'),
  glove: color('bc8556'),
  seam: color('f0c791'),
  head: color('c8ae9a'),
  site: color('31685f'),
  selected: color('fac279'),
  ground: color('718197'),
};

function newMesh() {
  return { p: [], n: [], c: [], f: [] };
}
function point(mesh, p, n, c) {
  mesh.p.push(...p);
  mesh.n.push(...n);
  mesh.c.push(...c);
}
function triangleGrid(mesh, start, rings, steps) {
  for (let i = 0; i < rings - 1; i++)
    for (let j = 0; j < steps; j++) {
      const a = start + i * steps + j,
        b = start + i * steps + ((j + 1) % steps);
      mesh.f.push(a, b, a + steps, b, b + steps, a + steps);
    }
}
function basis(axis) {
  const a = V.unit(axis),
    b = V.unit(V.cross(a, Math.abs(a[2]) < 0.85 ? Z : Y));
  return [b, V.unit(V.cross(a, b)), a];
}
function ellipsoid(mesh, center, axes, radii, c, rows = 10, steps = 18) {
  const start = mesh.p.length / 3;
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i < steps; i++) {
      const phi = (j * Math.PI) / rows - Math.PI / 2,
        t = (i * Math.PI * 2) / steps;
      const q = [Math.cos(t) * Math.cos(phi), Math.sin(t) * Math.cos(phi), Math.sin(phi)];
      const xyz = center.slice(),
        n = [0, 0, 0];
      for (let k = 0; k < 3; k++)
        for (let s = 0; s < 3; s++) {
          xyz[s] += axes[k][s] * radii[k] * q[k];
          n[s] += (axes[k][s] * q[k]) / radii[k];
        }
      point(mesh, xyz, V.unit(n), c);
    }
  triangleGrid(mesh, start, rows + 1, steps);
}
function limb(mesh, start, end, profiles, c, steps = 18) {
  const delta = V.sub(end, start),
    length = Math.hypot(...delta),
    axes = basis(delta);
  const offset = mesh.p.length / 3;
  profiles.forEach(([t, rx, ry], j) => {
    const before = profiles[Math.max(0, j - 1)],
      after = profiles[Math.min(profiles.length - 1, j + 1)];
    const slope = (after[1] - before[1]) / (length * (after[0] - before[0]) || 1);
    for (let i = 0; i < steps; i++) {
      const a = (i * 2 * Math.PI) / steps,
        cs = Math.cos(a),
        sn = Math.sin(a);
      const radial = V.add(V.scale(axes[0], cs * rx), V.scale(axes[1], sn * ry));
      const n = V.unit(
        V.add(V.add(V.scale(axes[0], cs), V.scale(axes[1], (sn * rx) / ry)), V.scale(axes[2], -slope)),
      );
      point(mesh, V.add(V.mix(start, end, t), radial), n, c);
    }
  });
  triangleGrid(mesh, offset, profiles.length, steps);
}
function rod(m, a, b, r, c) {
  limb(
    m,
    a,
    b,
    [
      [0, 0.02, 0.02],
      [0.035, r, r],
      [0.965, r, r],
      [1, 0.02, 0.02],
    ],
    c,
    10,
  );
}
