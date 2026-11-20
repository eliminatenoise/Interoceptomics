/* Orthographic plotting of source XYZ, with a separate encoder plot in cm. */
(() => {
  const records = window.CONTACT_TRIALS;
  const names = records[0].marker_names;
  const valid = (point) => Array.isArray(point) && point.every(Number.isFinite);
  const group = [
    'Hand',
    'Hand',
    'Hand',
    'Radius',
    'Radius',
    'Ulna',
    'Upper arm',
    'Upper arm',
    'Proximal ulna',
    'Shoulder origin'
  ];
  const colors = [
    '#a8ed96',
    '#a8ed96',
    '#a8ed96',
    '#68cfbf',
    '#68cfbf',
    '#68cfbf',
    '#91b9eb',
    '#91b9eb',
    '#68cfbf',
    '#f2df99'
  ];
  const guides = [
    [9, 7],
    [7, 6],
    [6, 5],
    [5, 8],
    [8, 3],
    [8, 4],
    [3, 4],
    [3, 1],
    [4, 2],
    [1, 0],
    [2, 0],
    [1, 2]
  ];
  const all = records.flatMap((record) => record.marker_xyz_m.flat()).filter(valid);
  const bounds = [0, 1, 2].map((k) => {
    let min = Infinity,
      max = -Infinity;
    for (const point of all) {
      min = Math.min(min, point[k]);
      max = Math.max(max, point[k]);
    }
    return [min, max];
  });
  const middle = bounds.map(([lo, hi]) => (lo + hi) / 2);
  const corners = bounds[0].flatMap((x) => bounds[1].flatMap((y) => bounds[2].map((z) => [x, y, z])));
  const arm = document.querySelector('#arm');
  const keySpace = parseFloat(getComputedStyle(arm).getPropertyValue('--key-space')) || 0;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  function surface(canvas) {
    const w = canvas.clientWidth,
      h = canvas.clientHeight,
      ratio = dpr();
    const bw = Math.max(1, Math.round(w * ratio)),
      bh = Math.max(1, Math.round(h * ratio));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(bw / Math.max(1, w), 0, 0, bh / Math.max(1, h), 0, 0);
    ctx.clearRect(0, 0, w, h);
    return [ctx, w, h];
  }
  function line(ctx, a, b, color, width) {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  let yaw = 1.16,
    tilt = 0.24;
  const presets = { oblique: [1.16, 0.24], xy: [0, Math.PI / 2], yz: [Math.PI / 2, 0], xz: [0, 0] };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));
  function overlap(a, b, padding) {
    return (
      a.x < b.right + padding && b.x < a.right + padding && a.y < b.bottom + padding && b.y < a.bottom + padding
    );
  }
  function drawLandmarkLabels(c, dots, sel, width, plotBottom) {
    c.font = '600 11px Arial, sans-serif';
    c.textBaseline = 'middle';
    const labels = [];
    const visibleDots = dots.filter(Boolean);
    const distance = (point, box) =>
      Math.hypot(point[0] - clamp(point[0], box.x, box.right), point[1] - clamp(point[1], box.y, box.bottom));
    function place(point, text, color, preferAbove) {
      if (!point) return;
      const boxWidth = Math.ceil(c.measureText(text).width) + 8;
      const boxHeight = 18;
      const [px, py] = point;
      const above = py - 10 - boxHeight,
        below = py + 10;
      const rows = preferAbove ? [above, below] : [below, above];
      rows.push(py - boxHeight / 2);
      // These two rows always offer a way around the first label at the viewport edges.
      for (const previous of labels) rows.push(previous.y - boxHeight - 4, previous.bottom + 4);
      let best,
        bestScore = Infinity;
      const collisionPenalty = width + plotBottom;
      function tryRow(row) {
        const y = clamp(row, 2, plotBottom - boxHeight);
        for (const left of [px + 10, px - boxWidth - 10, px - boxWidth / 2]) {
          const x = clamp(left, 3, width - boxWidth - 3);
          const box = { x, y, right: x + boxWidth, bottom: y + boxHeight };
          if (labels.some((b) => overlap(box, b, 3))) continue;
          const gap = distance(point, box);
          const covered = visibleDots.filter((p) => distance(p, box) < 8).length;
          // Prefer a short leader with clear space around the measured sites.
          const score = covered * collisionPenalty + gap;
          if (score < bestScore - 0.5) {
            best = box;
            bestScore = score;
          }
        }
      }
      rows.forEach(tryRow);
      if (bestScore >= collisionPenalty) {
        for (const dot of visibleDots) {
          tryRow(dot[1] - boxHeight - 9);
          tryRow(dot[1] + 9);
        }
      }
      labels.push({ ...best, point, text, color });
    }
    place(dots[sel], names[sel], '#d6fba4', false);
    if (sel !== 9) place(dots[9], 'Shoulder', '#e3d6a6', true);
    for (const b of labels) {
      const end = [clamp(b.point[0], b.x, b.right), clamp(b.point[1], b.y, b.bottom)];
      line(c, b.point, end, b.color, 0.9);
    }
    for (const b of labels) {
      c.fillStyle = '#132d2b';
      c.fillRect(b.x, b.y, b.right - b.x, b.bottom - b.y);
      c.fillStyle = b.color;
      c.fillText(b.text, b.x + 4, (b.y + b.bottom) / 2);
    }
  }
  function drawArm(d, frame, sel) {
    const [c, w, h] = surface(arm);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw),
      ct = Math.cos(tilt),
      st = Math.sin(tilt);
    function rotate(p) {
      const x = p[0] - middle[0],
        y = p[1] - middle[1],
        z = p[2] - middle[2];
      const depth = -sy * x + cy * y;
      return [cy * x + sy * y, st * depth + ct * z, ct * depth - st * z];
    }
    const rotated = corners.map(rotate);
    const extent = (k) => Math.max(...rotated.map((p) => Math.abs(p[k]))) * 2 || 0.1;
    // Keep data and landmark captions above the full sweep of the direction key and scale.
    const plotBottom = h - keySpace;
    const scale = Math.min((w - 58) / Math.max(0.105, extent(0)), (plotBottom - 60) / Math.max(0.16, extent(1)));
    function project(p) {
      const [u, v, z] = rotate(p);
      return [w / 2 + u * scale, plotBottom / 2 - v * scale, z];
    }
    // Three source-frame coordinates at equidistant 50-mm intervals.
    const floor = bounds[2][0] - 0.015;
    c.save();
    c.beginPath();
    c.rect(0, 0, w, plotBottom);
    c.clip();
    for (let i = -3; i <= 6; i++) {
      const q = i * 0.05;
      line(c, project([-0.15, q, floor]), project([0.15, q, floor]), '#28433e', 0.7);
      if (i <= 3) line(c, project([q, -0.15, floor]), project([q, 0.3, floor]), '#28433e', 0.7);
    }
    c.restore();

    const points = d.marker_xyz_m[frame];
    // A schematic envelope. Endpoint centres come from the current observed
    // marker cluster; the radii suggest an arm in Figure 2 and are illustrative.
    if (document.querySelector('#outline').checked) {
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => {
        const l = Math.hypot(...a);
        return l ? a.map((v) => v / l) : null;
      };
      function mean(indices) {
        return indices.every((i) => valid(points[i]))
          ? [0, 1, 2].map((k) => indices.reduce((acc, i) => acc + points[i][k], 0) / indices.length)
          : null;
      }
      const shoulder = mean([9]),
        elbow = mean([5, 8]),
        wrist = mean([3, 4]),
        hand = mean([0]),
        faces = [];
      function envelope(a, b, profile, flat = 1) {
        if (!a || !b) return;
        const axis = norm(b.map((v, k) => v - a[k]));
        if (!axis) return;
        const u = norm(cross(axis, Math.abs(axis[2]) < 0.8 ? [0, 0, 1] : [1, 0, 0])),
          v = cross(axis, u);
        const rings = profile.map(([t, r]) =>
          Array.from({ length: 16 }, (_, j) => {
            const angle = (j * Math.PI) / 8;
            return project(
              a.map((x, k) => x + (b[k] - x) * t + r * (u[k] * Math.cos(angle) + v[k] * Math.sin(angle) * flat))
            );
          })
        );
        for (let i = 1; i < rings.length; i++)
          for (let j = 0; j < 16; j++) {
            const q = (j + 1) % 16,
              poly = [rings[i - 1][j], rings[i - 1][q], rings[i][q], rings[i][j]];
            const z = poly.reduce((acc, p) => acc + p[2], 0) / 4;
            const shade = 0.5 + 0.5 * Math.cos(((j + 0.5) * Math.PI) / 8 - 0.85);
            faces.push({
              z,
              poly,
              color:
                'rgb(' +
                Math.round(65 + 45 * shade) +
                ' ' +
                Math.round(82 + 39 * shade) +
                ' ' +
                Math.round(71 + 30 * shade) +
                ')'
            });
          }
      }
      envelope(shoulder, elbow, [
        [-0.04, 0.004],
        [0, 0.014],
        [0.13, 0.02],
        [0.3, 0.021],
        [0.57, 0.018],
        [0.82, 0.013],
        [0.98, 0.011],
        [1.04, 0.007]
      ]);
      envelope(elbow, wrist, [
        [-0.035, 0.008],
        [0.02, 0.014],
        [0.17, 0.017],
        [0.35, 0.016],
        [0.68, 0.011],
        [0.91, 0.009],
        [1, 0.008]
      ]);
      envelope(
        wrist,
        hand,
        [
          [-0.06, 0.006],
          [0.1, 0.01],
          [0.36, 0.014],
          [0.68, 0.013],
          [0.93, 0.009],
          [1.05, 0.003]
        ],
        0.64
      );
      c.lineWidth = 0.65;
      for (const face of faces.sort((a, b) => b.z - a.z)) {
        c.beginPath();
        face.poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.closePath();
        c.fillStyle = face.color;
        c.strokeStyle = face.color;
        c.fill();
        c.stroke();
      }
    }
    if (document.querySelector('#overlay').checked) {
      const other = records.find((record) => record.date !== d.date);
      if (other) {
        const otherFrame = frame + d.start - d.events.bump + other.events.bump - other.start;
        if (otherFrame >= 0 && otherFrame < other.marker_xyz_m.length) {
          c.setLineDash([4, 3]);
          let previous = null;
          for (let t = Math.max(0, otherFrame - 10); t <= otherFrame; t++) {
            const point = other.marker_xyz_m[t][sel];
            if (!valid(point)) {
              previous = null;
              continue;
            }
            const p = project(point);
            if (previous) line(c, previous, p, '#ffc570', 2.2);
            previous = p;
          }
          c.setLineDash([]);
          if (previous) {
            const [x, y] = previous;
            c.strokeStyle = '#ffc570';
            c.lineWidth = 2;
            c.strokeRect(x - 4, y - 4, 8, 8);
          }
        }
      }
    }
    let previous = null;
    for (let t = Math.max(0, frame - 10); t <= frame; t++) {
      const x = d.marker_xyz_m[t][sel];
      if (!valid(x)) {
        previous = null;
        continue;
      }
      const p = project(x);
      if (previous) line(c, previous, p, '#c8ff70', 2.5);
      previous = p;
    }
    const dots = points.map((p) => (valid(p) ? project(p) : null));
    const draws = guides
      .filter(([i, j]) => dots[i] && dots[j])
      .map(([i, j]) => ({
        depth: (dots[i][2] + dots[j][2]) / 2,
        draw() {
          line(c, dots[i], dots[j], '#152c2c', 5);
          line(c, dots[i], dots[j], '#81a7a0', 2.4);
        }
      }));
    dots.forEach((p, i) => {
      if (!p) return;
      draws.push({
        depth: p[2] - 0.00001,
        draw() {
          const r = i === sel ? 6 : 4.2;
          c.beginPath();
          c.arc(p[0], p[1], r + 1, 0, Math.PI * 2);
          c.fillStyle = '#193d37';
          c.fill();
          const g = c.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.08, p[0], p[1], r);
          g.addColorStop(0, '#f4fff2');
          g.addColorStop(0.42, colors[i]);
          g.addColorStop(1, '#6a9290');
          c.beginPath();
          c.arc(p[0], p[1], r, 0, Math.PI * 2);
          c.fillStyle = g;
          c.fill();
        }
      });
    });
    draws.sort((a, b) => b.depth - a.depth).forEach((item) => item.draw());
    drawLandmarkLabels(c, dots, sel, w, plotBottom);
    // A direction key in the same rotation; lengths share the scene scale.
    const base = [36, h - 31];
    const directions = [
      [cy, -(-sy) * st],
      [sy, -cy * st],
      [0, -ct]
    ];
    const axisColors = ['#f4b7a4', '#a1dcbd', '#aacaf7'];
    c.font = 'bold 10px Arial, sans-serif';
    const axisLabels = [];
    directions.forEach(([x, y], i) => {
      const end = [base[0] + x * 18, base[1] + y * 18];
      line(c, base, end, axisColors[i], 1.7);
      const left = end[0] + (x < -0.1 ? -8 : 2);
      const text = 'XYZ'[i],
        right = left + c.measureText(text).width;
      const preferred = end[1] + (y < -0.1 ? -5 : 5);
      // Two projected axes can coincide. Keep both letters visible at their tips.
      const positions = [
        preferred,
        preferred - 12,
        preferred + 12,
        ...axisLabels.flatMap((b) => [b.y - 8, b.bottom + 8])
      ];
      for (const pos of positions) {
        const center = clamp(pos, plotBottom + 6, h - 6);
        const box = { x: left, right, y: center - 5, bottom: center + 5 };
        if (axisLabels.some((b) => overlap(box, b, 1))) continue;
        axisLabels.push({ ...box, color: axisColors[i], text, center });
        break;
      }
    });
    for (const b of axisLabels) {
      c.fillStyle = b.color;
      c.fillText(b.text, b.x, b.center);
    }
    const len = 0.05 * scale;
    line(c, [w - 12 - len, h - 14], [w - 12, h - 14], '#a9c6b7', 1.5);
    c.fillStyle = '#c2d7cc';
    c.font = '11px Arial, sans-serif';
    c.textAlign = 'right';
    c.fillText('0.05 m', w - 12, h - 25);
    c.textAlign = 'left';
  }
  let pointer = null;
  function custom(dx, dy) {
    yaw += dx;
    tilt = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, tilt + dy));
    document.querySelector('#view').value = 'custom';
    window.renderContact();
  }
  arm.addEventListener('pointerdown', (e) => {
    pointer = [e.clientX, e.clientY];
    arm.setPointerCapture(e.pointerId);
  });
  arm.addEventListener('pointermove', (e) => {
    if (!pointer) return;
    custom((e.clientX - pointer[0]) * 0.009, (pointer[1] - e.clientY) * 0.009);
    pointer = [e.clientX, e.clientY];
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    arm.addEventListener(event, () => {
      pointer = null;
    });
  arm.addEventListener('keydown', (e) => {
    const delta = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.12], ArrowDown: [0, -0.12] }[
      e.key
    ];
    if (delta) {
      e.preventDefault();
      custom(...delta);
    }
  });
  document.querySelector('#view').addEventListener('change', (e) => {
    [yaw, tilt] = presets[e.target.value];
    window.renderContact();
  });
  document.querySelector('#outline').addEventListener('change', () => window.renderContact());
  window.CONTACT_SCENE = { drawArm, group, colors, valid };
})();
