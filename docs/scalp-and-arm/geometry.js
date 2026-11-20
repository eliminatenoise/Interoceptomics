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
function unpack(base64, T) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new T(bytes.buffer);
}
function scalpBase() {
  const m = newMesh(),
    p = unpack(ATLAS.xyz, Float32Array),
    f = unpack(ATLAS.faces, Uint16Array);
  m.p = Array.from(p);
  m.f = Array.from(f);
  m.n = Array(p.length).fill(0);
  for (let k = 0; k < f.length; k += 3) {
    const ids = [f[k], f[k + 1], f[k + 2]];
    const [a, b, c] = ids.map((i) => Array.from(p.slice(i * 3, i * 3 + 3)));
    const n = V.cross(V.sub(b, a), V.sub(c, a));
    ids.forEach((i) => n.forEach((x, j) => (m.n[i * 3 + j] += x)));
  }
  for (let i = 0; i < p.length; i += 3) {
    const n = V.unit(m.n.slice(i, i + 3));
    m.n.splice(i, 3, ...n);
    m.c.push(...palette.head);
  }
  return m;
}
function siteNormal(p) {
  return V.unit([p[0] / 85 ** 2, (p[1] + 15) / 105 ** 2, (p[2] + 3) / 106 ** 2]);
}
const lowField = color('3269b0'),
  zeroField = color('f3ead3'),
  highField = color('c54a22');
function scalpMarkers(index, field) {
  const m = newMesh();
  [...ATLAS.sites.map((r) => r.slice(1)), ATLAS.ground].forEach((p, i) => {
    const normal = siteNormal(p),
      axes = basis(normal),
      selected = i === index;
    const center = V.add(p, V.scale(normal, 2.4));
    if (field.members) {
      const included = field.members.includes(i);
      if (included) ellipsoid(m, center, axes, [6.4, 6.4, 2.8], palette.dark, 6, 16);
      const position = included ? V.add(center, V.scale(normal, 1.8)) : center;
      const radius = included ? 4.9 : 2.6;
      const shade = included ? palette.selected : i === 61 ? palette.ground : zeroField;
      ellipsoid(m, position, axes, [radius, radius, 2.5], shade, 6, 14);
    } else if (field.mode && i < 61) {
      const value = field.values?.[i];
      let shade = palette.ground;
      if (Number.isFinite(value)) {
        shade = V.mix(
          zeroField,
          value < 0 ? lowField : highField,
          Math.min(1, Math.abs(value) / field.limit),
        );
      }
      if (selected) ellipsoid(m, center, axes, [6.25, 6.25, 2.8], palette.dark, 6, 16);
      ellipsoid(
        m,
        V.add(center, V.scale(normal, selected ? 1.8 : 0)),
        axes,
        [4.5, 4.5, 2.8],
        shade,
        6,
        14,
      );
    } else {
      const ring = selected ? 5.2 : 3.25;
      ellipsoid(
        m,
        center,
        axes,
        [ring, ring, 2.5],
        selected ? palette.selected : i === 61 ? palette.ground : palette.site,
        6,
        12,
      );
      if (selected)
        ellipsoid(m, V.add(center, V.scale(normal, 1.8)), axes, [2, 2, 1.5], palette.dark, 5, 10);
    }
  });
  return m;
}

function buildArm(task, amount) {
  const m = newMesh(),
    p = palette,
    shoulder = [-2, -49, 64],
    upper = V.unit([0.11, 0.29, -0.95]);
  const e = V.add(shoulder, V.scale(upper, 82)),
    transverse = V.unit(V.cross(upper, Y));
  const forward = V.unit(V.cross(transverse, upper));
  const opening = 120 + ({ flex: -50, extend: 34 }[task] || 0) * amount;
  const bend = (180 - opening) * RAD;
  const fore = V.unit(V.add(V.scale(upper, Math.cos(bend)), V.scale(forward, Math.sin(bend))));
  const w = V.add(e, V.scale(fore, 75)),
    outer = V.unit(V.cross(fore, Z));
  const dorsal = V.unit(V.cross(outer, fore));
  const roll = ({ supinate: -82, pronate: 77 }[task] || 0) * amount * RAD;
  // In the mid-position the right thumb points up. Supination turns the palm up.
  const across = V.add(V.scale(dorsal, Math.cos(roll)), V.scale(outer, -Math.sin(roll)));
  const back = V.unit(V.cross(fore, across));
  const knuckles = V.add(w, V.scale(fore, 27));
  // A cropped sleeve and shoulder keep the right limb visible from all sides.
  ellipsoid(m, shoulder, [X, Y, Z], [16, 16, 19], p.sleeve);
  limb(
    m,
    shoulder,
    e,
    [
      [0, 10, 12],
      [0.12, 14, 15],
      [0.33, 13, 14],
      [0.52, 12, 13],
      [0.74, 9, 10],
      [0.93, 8, 8],
      [1, 6, 6],
    ],
    p.skin,
  );
  limb(
    m,
    shoulder,
    e,
    [
      [0, 13, 14],
      [0.12, 15, 16],
      [0.31, 13.8, 14.5],
      [0.34, 13.5, 14.2],
    ],
    p.sleeve,
  );
  ellipsoid(m, e, [X, Y, Z], [8.8, 9.5, 9.4], p.skin);
  limb(
    m,
    e,
    w,
    [
      [0, 7.8, 8.2],
      [0.1, 10, 11],
      [0.25, 10.4, 11.6],
      [0.49, 8.4, 9.4],
      [0.76, 6.7, 7.3],
      [1, 5, 6.4],
    ],
    p.skin,
  );
  // Paired support links sit alongside the arm. The cuffs follow the limb.
  const outside = [14, 0, 0],
    supportEl = V.add(e, outside),
    supportShoulder = V.add(shoulder, [17, 0, 0]);
  const supportW = V.add(V.mix(e, w, 0.81), outside);
  rod(m, supportShoulder, supportEl, 2.3, p.rail);
  rod(m, supportEl, supportW, 2.7, p.rail);
  const cradle = V.add(V.mix(e, w, 0.73), [0, 0, -8]);
  rod(m, supportW, cradle, 2.3, p.metal);
  rod(m, cradle, V.add(cradle, [-8, 0, 0]), 2.1, p.rail);
  ellipsoid(m, supportShoulder, [Y, Z, X], [5, 5, 3], p.dark);
  ellipsoid(m, V.add(supportShoulder, [2.7, 0, 0]), [Y, Z, X], [2.6, 2.6, 1], p.metal);
  for (const [a, b, t, r] of [
    [shoulder, e, 0.58, 12.7],
    [e, w, 0.61, 10.1],
  ]) {
    limb(
      m,
      V.mix(a, b, t - 0.055),
      V.mix(a, b, t + 0.055),
      [
        [0, r, r],
        [0.07, r + 1, r + 1],
        [0.93, r + 1, r + 1],
        [1, r, r],
      ],
      p.dark,
    );
    rod(m, V.mix(a, b, t), V.add(V.mix(a, b, t), outside), 2.7, p.rail);
  }
  ellipsoid(m, supportEl, [Y, Z, X], [8.4, 8.4, 3.5], p.rail);
  ellipsoid(m, V.add(supportEl, [3.2, 0, 0]), [Y, Z, X], [4.5, 4.5, 1.2], p.metal);
  const wristPad = V.add(w, V.scale(fore, 4));
  ellipsoid(m, wristPad, [across, back, fore], [7.6, 5.5, 8.2], p.dark);
  ellipsoid(m, V.mix(w, knuckles, 0.61), [across, back, fore], [11.6, 4.7, 16], p.glove);
  const curl = 0.45 + ({ close: 0.55, open: -0.43 }[task] || 0) * amount;
  const fingers = [
    [7.8, 20],
    [2.6, 22.5],
    [-2.7, 21],
    [-7.6, 16.5],
  ];
  for (const [side, length] of fingers) {
    let joint = V.add(knuckles, V.scale(across, side));
    const track = V.add(joint, V.scale(back, 3.1));
    rod(
      m,
      V.add(V.mix(w, knuckles, 0.47), V.add(V.scale(across, side * 0.7), V.scale(back, 3.8))),
      track,
      0.7,
      p.seam,
    );
    [0.46, 0.31, 0.23].forEach((frac, seg) => {
      const angle = (12 + seg * 33) * curl * 1.85 * RAD;
      const dir = V.add(V.scale(fore, Math.cos(angle)), V.scale(back, -Math.sin(angle)));
      const end = V.add(joint, V.scale(dir, length * frac)),
        r = 2.35 - seg * 0.26;
      rod(m, joint, end, r, p.glove);
      ellipsoid(m, joint, [across, back, fore], [r, r, r], p.glove, 6, 10);
      ellipsoid(m, end, [across, back, fore], [r * 0.87, r * 0.9, r], p.glove, 6, 10);
      joint = end;
    });
  }
  const thumbBase = V.add(V.mix(w, knuckles, 0.48), V.scale(across, 9.1));
  const thumbRoot = V.add(thumbBase, V.add(V.scale(across, 9 - 3 * curl), V.scale(back, -4)));
  const thumbTip = V.add(thumbRoot, V.add(V.scale(fore, 12), V.scale(back, -5 * curl)));
  rod(m, thumbBase, thumbRoot, 3.3, p.glove);
  rod(m, thumbRoot, thumbTip, 2.8, p.glove);
  ellipsoid(m, thumbRoot, [across, back, fore], [3.2, 3.3, 3.4], p.glove, 7, 12);
  ellipsoid(m, thumbTip, [across, back, fore], [2.5, 2.6, 2.7], p.glove, 7, 12);
  return m;
}
