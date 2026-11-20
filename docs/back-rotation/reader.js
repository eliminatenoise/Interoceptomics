'use strict';
const $ = (id) => document.getElementById(id);
const RAD = Math.PI / 180;
const V = {
  add: (a, b) => a.map((x, i) => x + b[i]),
  sub: (a, b) => a.map((x, i) => x - b[i]),
  scale: (a, s) => a.map((x) => x * s),
  dot: (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0),
  cross: ([a, b, c], [d, e, f]) => [
    b * f - c * e,
    c * d - a * f,
    a * e - b * d,
  ],
  unit: (a) => V.scale(a, 1 / (Math.hypot(...a) || 1)),
};
function decode(value, Type) {
  return new Type(Uint8Array.from(atob(value), (x) => x.charCodeAt(0)).buffer);
}
function quaternionProduct(a, b) {
  const u = a.slice(1),
    v = b.slice(1);
  return [
    a[0] * b[0] - V.dot(u, v),
    ...V.add(V.cross(u, v), V.add(V.scale(u, b[0]), V.scale(v, a[0]))),
  ];
}
const conjugate = ([w, x, y, z]) => [w, -x, -y, -z];
const rotatePoint = (q, p) =>
  quaternionProduct(quaternionProduct(q, [0, ...p]), conjugate(q)).slice(1);
function turn(a, b) {
  return (2 * Math.acos(Math.min(1, Math.abs(V.dot(a, b))))) / RAD;
}
const clips = {};
for (const [mode, source] of Object.entries(RECORDING.clips)) {
  const buffer = decode(source.q, Float32Array);
  const q = Array.from({ length: source.count }, (_, i) =>
    V.unit(Array.from(buffer.subarray(i * 4, i * 4 + 4))),
  );
  const sites = {};
  for (const [name, data] of Object.entries(source.channels))
    sites[name] = { ...data, means: decode(data.means, Float32Array) };
  clips[mode] = {
    ...source,
    q,
    sites,
    angles: q.slice(0, -10).map((p, i) => turn(p, q[i + 10])),
  };
}
const angleMax = Math.ceil(
  Math.max(...Object.values(clips).flatMap((c) => c.angles)),
);
let mode = 'walking',
  region = 'upper',
  contact = 2,
  point = 100,
  animation = null;
const clip = () => clips[mode];
const samples = (c) =>
  c.sites[region].means.subarray((contact - 1) * c.count, contact * c.count);
const colours = {
  light: '#bdebd5',
  dark: '#1d7158',
  line: '#5f7d80',
  grid: '#b9cac3',
};
const coordinate = (value, min, max, size) =>
  (size * (value - min)) / (max - min);
const tidy = (n) => Number(n.toFixed(2)).toString();
const svgNS = 'http://www.w3.org/2000/svg';
function svgEl(name, attributes) {
  const el = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attributes))
    el.setAttribute(key, value);
  return el;
}
function chart(id, values, low, high, dark) {
  const svg = $(id),
    [w, h] = [svg.viewBox.baseVal.width, svg.viewBox.baseVal.height];
  const left = 47,
    right = w - 12,
    top = 11,
    bottom = h - 25;
  const x = (i) => left + coordinate(i, 0, values.length - 1, right - left);
  const y = (n) => bottom - coordinate(n, low, high, bottom - top);
  const tone = dark ? colours.light : colours.dark,
    ink = dark ? '#deece9' : '#344e4e';
  svg.replaceChildren();
  function label(text, px, py, anchor) {
    const node = svgEl('text', {
      x: px,
      y: py,
      'text-anchor': anchor,
      fill: ink,
      class: 'charttext',
    });
    node.textContent = text;
    svg.append(node);
  }
  for (const level of [
    ...new Set([low, high, ...(low < 0 && high > 0 ? [0] : [])]),
  ]) {
    svg.append(
      svgEl('line', {
        x1: left,
        x2: right,
        y1: y(level),
        y2: y(level),
        stroke: dark ? colours.line : colours.grid,
        'stroke-width': 0.8,
      }),
    );
    label(tidy(level), left - 5, y(level) + 4, 'end');
  }
  label('0 s', left, h - 6, 'start');
  label(((values.length - 1) / 100).toFixed(2) + ' s', right, h - 6, 'end');
  const line = Array.from(
    values,
    (n, i) => (i ? 'L' : 'M') + x(i).toFixed(2) + ',' + y(n).toFixed(2),
  ).join(' ');
  svg.append(
    svgEl('path', {
      d: line,
      stroke: tone,
      fill: 'none',
      'stroke-width': 1.75,
      'stroke-linejoin': 'round',
    }),
  );
  const marker = svgEl('line', {
    y1: top,
    y2: bottom,
    stroke: ink,
    'stroke-width': 1,
    'stroke-dasharray': '3 3',
  });
  const dot = svgEl('circle', {
    r: 3.3,
    fill: tone,
    stroke: dark ? '#13353a' : 'white',
    'stroke-width': 1,
  });
  svg.append(marker, dot);
  return (i) => {
    marker.setAttribute('x1', x(i));
    marker.setAttribute('x2', x(i));
    dot.setAttribute('cx', x(i));
    dot.setAttribute('cy', y(values[i]));
  };
}
let markAngle, markVoltage;
function drawPlots() {
  markAngle = chart('motion', clip().angles, 0, angleMax, true);
  const both = Object.values(clips).map(samples);
  const min =
    Math.floor(Math.min(...both.map((v) => Math.min(...v))) / 10) * 10;
  const max = Math.ceil(Math.max(...both.map((v) => Math.max(...v))) / 10) * 10;
  markVoltage = chart(
    'signal',
    samples(clip()),
    min,
    Math.max(max, min + 10),
    false,
  );
}
// A three-dimensional instrument symbol. The orthographic camera and starting
// pose are arbitrary. The only changing transform is the recorded relative rotation.
const corners = [
  [-1, -0.6, -0.12],
  [1, -0.6, -0.12],
  [1, 0.6, -0.12],
  [-1, 0.6, -0.12],
  [-1, -0.6, 0.12],
  [1, -0.6, 0.12],
  [1, 0.6, 0.12],
  [-1, 0.6, 0.12],
];
const faces = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7],
];
const faceColour = [
  '#76a099',
  '#dfede0',
  '#78ad9d',
  '#539186',
  '#8fb9a8',
  '#a8c4ae',
];
function projectSensor(p) {
  const [x, y, z] = p;
  return [
    150 + 66 * (0.86 * x + 0.5 * y),
    82 + 66 * (0.26 * x - 0.45 * y - 0.86 * z),
    -0.43 * x + 0.745 * y - 0.514 * z,
  ];
}
function paintDevice() {
  const q = quaternionProduct(conjugate(clip().q[0]), clip().q[point]);
  const svg = $('device');
  svg.replaceChildren();
  const project = (p) => projectSensor(rotatePoint(q, p));
  const nodes = corners.map(project);
  const points = (a) =>
    a
      .map((p) =>
        p
          .slice(0, 2)
          .map((n) => n.toFixed(2))
          .join(','),
      )
      .join(' ');
  for (const i of faces
    .map((_, i) => i)
    .sort((a, b) => {
      const avg = (f) => faces[f].reduce((sum, k) => sum + nodes[k][2], 0);
      return avg(b) - avg(a);
    })) {
    svg.append(
      svgEl('polygon', {
        points: points(faces[i].map((k) => nodes[k])),
        fill: faceColour[i],
        stroke: '#254b4f',
        'stroke-width': 1.3,
      }),
    );
  }
  const stamp = [
    [-0.74, -0.38, 0.13],
    [0.45, -0.38, 0.13],
    [0.7, 0, 0.13],
    [0.45, 0.38, 0.13],
    [-0.74, 0.38, 0.13],
  ].map(project);
  svg.append(
    svgEl('polygon', {
      points: points(stamp),
      fill: '#327769',
      stroke: '#d5ebd8',
      'stroke-width': 1.2,
    }),
  );
  const rails = corners.slice(4).map(projectSensor);
  svg.append(
    svgEl('polygon', {
      points: points(rails),
      fill: 'none',
      stroke: '#ffe2a2',
      'stroke-width': 2,
      'stroke-dasharray': '5 4',
    }),
  );
}
function displayPoint() {
  const c = clip(),
    t = c.t0 + point / 100;
  $('cursor').value = point;
  $('cursor').setAttribute(
    'aria-valuetext',
    (point / 100).toFixed(2) + ' seconds into ' + mode,
  );
  $('cursor-label').textContent = (point / 100).toFixed(2) + ' s in block';
  $('degrees').textContent = c.angles[point].toFixed(3) + '°';
  $('times').textContent =
    'Trial clock ' +
    t.toFixed(4) +
    ' to ' +
    (t + 0.1).toFixed(4) +
    ' s · angle in degrees';
  $('volts').textContent = samples(c)[point].toFixed(1) + ' µV';
  $('volt-note').textContent =
    'Mean from ' +
    t.toFixed(4) +
    ' to ' +
    (t + 0.01).toFixed(4) +
    ' s (end excluded). The graph shows five seconds at this contact.';
  markAngle(point);
  markVoltage(point);
  paintDevice();
}
function stop() {
  if (animation !== null) cancelAnimationFrame(animation);
  animation = null;
  $('play').textContent = 'Play';
}
function play() {
  if (animation !== null) {
    stop();
    return;
  }
  if (point === clip().angles.length - 1) point = 0;
  const start = performance.now() - 10 * point;
  $('play').textContent = 'Pause';
  function tick(now) {
    const next = Math.min(
      clip().angles.length - 1,
      Math.floor((now - start) / 10),
    );
    if (next !== point) {
      point = next;
      displayPoint();
    }
    if (next === clip().angles.length - 1) {
      stop();
      return;
    }
    animation = requestAnimationFrame(tick);
  }
  animation = requestAnimationFrame(tick);
}
const anatomyCache = new Map();
function anatomyParts(site) {
  if (anatomyCache.has(site)) return anatomyCache.get(site);
  const bone = site === 'upper' ? 'Vertebra C4' : 'Vertebra L2';
  const disc =
    site === 'upper'
      ? 'Intervertebral disc C4-C5'
      : 'Intervertebral disc L1-L2';
  const parts = SPINE[site].map((source) => {
    const p = Array.from(decode(source.xyz, Int16Array), (n) => n / 20);
    const f = Array.from(decode(source.faces, Uint16Array)),
      n = Array(p.length).fill(0);
    for (let i = 0; i < f.length; i += 3) {
      const a = 3 * f[i],
        b = 3 * f[i + 1],
        c = 3 * f[i + 2];
      const normal = V.cross(
        V.sub(p.slice(b, b + 3), p.slice(a, a + 3)),
        V.sub(p.slice(c, c + 3), p.slice(a, a + 3)),
      );
      for (const v of [a, b, c])
        for (let k = 0; k < 3; k++) n[v + k] += normal[k];
    }
    const rgb =
      source.name === disc
        ? [0.84, 0.49, 0.16]
        : source.name === bone
          ? [0.25, 0.64, 0.55]
          : source.name.startsWith('Vertebra')
            ? [0.88, 0.84, 0.72]
            : [0.64, 0.7, 0.65];
    const colours = [];
    for (let i = 0; i < p.length; i += 3) {
      const smooth = V.unit(n.slice(i, i + 3));
      for (let k = 0; k < 3; k++) n[i + k] = smooth[k];
      colours.push(...rgb);
    }
    return { p, f, n, c: colours };
  });
  anatomyCache.set(site, parts);
  return parts;
}
const cam = camera($('bones'), {
  center: [0, 0, 0],
  yaw: 140,
  tilt: 10,
  span: [1, 1],
  fitPose: true,
});
function updateContact() {
  const site = clip().sites[region];
  $('volt-label').textContent =
    (region === 'upper' ? 'Upper' : 'Lower') + ' back · Contact ' + contact;
  const flags = [
    ...(site.null.includes(contact) ? ['null'] : []),
    ...(site.noisy.includes(contact) ? ['noisy'] : []),
  ];
  $('quality').textContent = flags.length
    ? 'The authors flagged this contact as ' +
      flags.join(' and ') +
      ' in this trial.'
    : 'The authors gave this contact no null or noisy channel flag. Individual samples may still contain artefacts.';
  for (const btn of $('layout').children)
    btn.setAttribute('aria-pressed', String(Number(btn.value) === contact));
  drawPlots();
  displayPoint();
}
function changeRegion(site) {
  region = site;
  for (const s of ['upper', 'lower'])
    $(s).setAttribute('aria-pressed', String(s === site));
  $('landmark').textContent =
    site === 'upper'
      ? 'Green marks C4. The second contact aligned with the disc just below it (amber).'
      : 'Green marks L2. The second contact aligned with the disc just above it (amber).';
  const layout = $('layout');
  layout.replaceChildren();
  for (const row of clip().sites[site].layout)
    for (const id of row) {
      const btn = document.createElement('button');
      btn.textContent = id;
      btn.value = id;
      btn.setAttribute('aria-label', 'Contact ' + id);
      btn.onclick = () => {
        contact = id;
        updateContact();
      };
      layout.append(btn);
    }
  cam.setParts(anatomyParts(site));
  cam.reset();
  updateContact();
}
function changeMode(next) {
  stop();
  mode = next;
  for (const s of ['walking', 'standing'])
    $(s).setAttribute('aria-pressed', String(s === mode));
  updateContact();
}
for (const s of ['walking', 'standing']) $(s).onclick = () => changeMode(s);
for (const s of ['upper', 'lower']) $(s).onclick = () => changeRegion(s);
$('left').onclick = () => cam.rotate(-24, 0);
$('right').onclick = () => cam.rotate(24, 0);
$('back-view').onclick = () => cam.setAngle(0, 0);
$('reset').onclick = () => cam.reset();
$('cursor').oninput = (e) => {
  stop();
  point = Number(e.target.value);
  displayPoint();
};
$('play').onclick = play;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
});
const nf = new Intl.NumberFormat('en-US');
for (const row of RECORDING.cohort) {
  const tr = document.createElement('tr');
  for (const [i, value] of [
    row.person,
    row.walking.median.toFixed(3) + '°',
    row.standing.median.toFixed(3) + '°',
    nf.format(row.walking.n) + ' / ' + nf.format(row.standing.n),
  ].entries()) {
    const cell = document.createElement(i === 0 ? 'th' : 'td');
    if (i === 0) cell.scope = 'row';
    cell.textContent = value;
    tr.append(cell);
  }
  $('people').append(tr);
}
const total = RECORDING.cohort.reduce(
  (n, p) => n + p.walking.n + p.standing.n,
  0,
);
$('cohort-note').textContent =
  nf.format(total) +
  ' intervals · 8 trials · 4 people. Repeated readings from one person belong to that same person.';
changeRegion(region);
