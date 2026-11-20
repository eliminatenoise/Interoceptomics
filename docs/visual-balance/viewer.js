"use strict";
const $ = (id) => document.getElementById(id);
const sites = recording.sites;
const moves = recording.movement_mm;
const last = moves.length - 1;
const cutoff = recording.cutoff - recording.start;
const onset = recording.logged - recording.start;
const scalp = $("scalp");
let cursor = cutoff;
let playing = false;
let startTime = 0;
let firstFrame = 0;
let hits = [];
const fmt = (n, digits) =>
  Math.abs(n) < 0.5 * 10 ** -digits
    ? (0).toFixed(digits)
    : (n > 0 ? "+" : "−") + Math.abs(n).toFixed(digits);
function option(select, value, label) {
  select.add(new Option(label, value));
}
sites
  .slice(0, 128)
  .forEach((s, i) => option(scalp, i, s.label + (s.good ? "" : " · excluded")));
scalp.value = "9";

function signedColor(v) {
  const edge = v >= 0 ? [247, 121, 95] : [87, 172, 252];
  const w = Math.min(1, Math.abs(v) / recording.limit_uv);
  return (
    "rgb(" +
    [233, 235, 230].map((x, i) => Math.round(x + (edge[i] - x) * w)).join(",") +
    ")"
  );
}
function surface(canvas) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    d = Math.min(devicePixelRatio || 1, 2);
  const dw = Math.round(w * d),
    dh = Math.round(h * d);
  if (canvas.width !== dw || canvas.height !== dh) {
    canvas.width = dw;
    canvas.height = dh;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}
function stroke(ctx, points, color, width = 1, dash = []) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(...points[0].slice(0, 2));
  for (const p of points.slice(1)) ctx.lineTo(...p.slice(0, 2));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.setLineDash([]);
}
function dot(ctx, p, r, fill, border, diamond = false) {
  ctx.beginPath();
  if (diamond) {
    ctx.moveTo(p[0], p[1] - r);
    ctx.lineTo(p[0] + r, p[1]);
    ctx.lineTo(p[0], p[1] + r);
    ctx.lineTo(p[0] - r, p[1]);
    ctx.closePath();
  } else ctx.arc(p[0], p[1], r, 0, 2 * Math.PI);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (border) {
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = border;
    ctx.stroke();
  }
}
function label(ctx, txt, x, y, color = "#c0d1d1", size = 11) {
  ctx.font = size + "px Arial, sans-serif";
  ctx.fillStyle = color;
  ctx.fillText(txt, x, y);
}
const views = {
  cap: { yaw: -2.28, pitch: 0.34 },
  paths: { yaw: -0.55, pitch: 0.32 },
};
function project(point, view) {
  const [x, y, z] = point,
    c = Math.cos(view.yaw),
    s = Math.sin(view.yaw),
    u = Math.cos(view.pitch),
    v = Math.sin(view.pitch);
  return [
    x * c + y * s,
    -(-x * s * v + y * c * v + z * u),
    x * s * u - y * c * u + z * v,
  ];
}
function axes(ctx, view, w, h, labels) {
  const p = [w - 56, h - 43],
    colors = ["#cc9997", "#9fbba2", "#96bacb"];
  for (let i = 0; i < 3; i++) {
    const xyz = [0, 0, 0];
    xyz[i] = 22;
    const q = project(xyz, view),
      end = [p[0] + q[0], p[1] + q[1]];
    if (Math.hypot(q[0], q[1]) < 4) continue;
    stroke(ctx, [p, end], colors[i]);
    label(ctx, labels[i], end[0] + 2, end[1] + 4, colors[i], 10);
  }
}
function drawCap() {
  const { ctx, w, h } = surface($("cap")),
    view = views.cap,
    auxiliary = $("auxSites").checked;
  const z = Math.min(w / 0.235, (h - 34) / (auxiliary ? 0.275 : 0.185));
  const sitePoint = (site) => {
    const q = project(
      [
        site.xyz_m[0] + 0.005,
        site.xyz_m[1],
        site.xyz_m[2] - (auxiliary ? 0.018 : 0.065),
      ],
      view,
    );
    return { p: [w * 0.48 + q[0] * z, h * 0.48 + q[1] * z], depth: q[2] };
  };
  const selected = Number(scalp.value),
    available = cursor <= cutoff;
  hits = sites
    .slice(0, 128)
    .map((site, i) => {
      return { i, site, ...sitePoint(site) };
    })
    .sort((a, b) => a.depth - b.depth);
  for (const s of hits) {
    const r = Math.max(3.2, Math.min(7.8, 4.9 + s.depth * 24)),
      uv = s.site.good && available ? s.site.uv[cursor] : null;
    dot(
      ctx,
      s.p,
      r,
      s.site.good ? (available ? signedColor(uv) : "#688286") : "#102b32",
      s.site.good ? "#2b454a" : "#b4c1bf",
    );
  }
  if (auxiliary) {
    for (let i = 128; i < 133; i++) {
      const { p } = sitePoint(sites[i]),
        eye = i >= 130,
        color = eye ? "#dba1e2" : "#8cd3b4";
      dot(ctx, p, 4.4, color, "#102b32", true);
      if (i === Number($(eye ? "traceSelect1" : "traceSelect2").value))
        label(ctx, eye ? "Eye" : "Neck", p[0] + 8, p[1] + 4, color, 11);
    }
  }
  const hit = hits.find((s) => s.i === selected),
    [x, y] = hit.p;
  const selectedColor = hit.site.good
    ? available
      ? signedColor(hit.site.uv[cursor])
      : "#688286"
    : "#102b32";
  dot(ctx, hit.p, 6, selectedColor, "#102b32");
  dot(ctx, hit.p, 9, null, "#fff5a5");
  const right = x > w * 0.48,
    lx = right ? Math.min(w - 45, x + 43) : Math.max(3, x - 69),
    ly = Math.min(h - 38, Math.max(18, y - 18));
  stroke(
    ctx,
    [
      [x + (right ? 8 : -8), y],
      [right ? lx : lx + 33, ly],
    ],
    "#f7e4a1",
  );
  ctx.fillStyle = "#102b32";
  ctx.fillRect(lx - 2, ly - 10, 36, 16);
  label(ctx, hit.site.label, lx, ly + 2, "#fff6d2", 12);
  axes(ctx, view, w, h, ["X", "Y", "Z"]);
}
function drawPaths() {
  const { ctx, w, h } = surface($("paths")),
    view = views.paths;
  // The drawing's orbit is Z-up. Convert the source ML/SI/AP array to ML/AP/SI for this projection.
  const p3 = (v) => project([v[0], v[2], v[1]], view);
  const all = moves.flatMap((pair) => pair.map(p3));
  const xs = all.map((p) => p[0]),
    ys = all.map((p) => p[1]);
  const lo = [Math.min(...xs), Math.min(...ys)],
    hi = [Math.max(...xs), Math.max(...ys)];
  const z = Math.min(
    (w - 65) / (hi[0] - lo[0] + 25),
    (h - 45) / (hi[1] - lo[1] + 18),
    3.6,
  );
  const origin = [
    w * 0.48 - (z * (hi[0] + lo[0])) / 2,
    h * 0.47 - (z * (hi[1] + lo[1])) / 2,
  ];
  const screen = (v) => {
    const [x, y] = p3(v);
    return [origin[0] + x * z, origin[1] + y * z];
  };
  for (let d = -80; d <= 40; d += 20) {
    stroke(ctx, [screen([d, 0, -60]), screen([d, 0, 40])], "#24464e");
    if (d >= -60)
      stroke(ctx, [screen([-80, 0, d]), screen([40, 0, d])], "#24464e");
  }
  dot(ctx, origin, 7, null, "#d9e2d7");
  for (const [i, color] of [
    [0, "#f3c36a"],
    [1, "#a0d1ef"],
  ]) {
    const history = moves.slice(0, cursor + 1).map((row) => screen(row[i]));
    stroke(ctx, history, color, 2.3, i === 0 ? [5, 3] : []);
    dot(
      ctx,
      history[history.length - 1],
      i === 0 ? 5.8 : 4.1,
      color,
      "#102b32",
      i === 0,
    );
  }
  axes(ctx, view, w, h, ["ML", "AP", "SI"]);
}
const niceName = (s) =>
  s
    .replace(/^L_/, "Left ")
    .replace(/^R_/, "Right ")
    .replace("leg_emg_", "")
    .replace("_emg", "")
    .replace("_eog", "")
    .replaceAll("_", " ");
const traces = [
  { title: "Scalp EEG", select: scalp, color: "#41678b" },
  { title: "Eye electrodes (EOG)", indices: [130, 131, 132], color: "#7b5580" },
  { title: "Neck muscle (EMG)", indices: [128, 129], color: "#28756d" },
  {
    title: "Leg muscle (EMG)",
    indices: Array.from({ length: 8 }, (_, i) => 133 + i),
    color: "#945431",
  },
];
traces.forEach((c, i) => {
  const row = document.createElement("div");
  row.className = "trace";
  const panel = document.createElement("div"),
    head = document.createElement(c.indices ? "label" : "span");
  head.textContent = c.title;
  head.className = "tracelabel";
  panel.append(head);
  if (c.indices) {
    c.select = document.createElement("select");
    c.select.id = "traceSelect" + i;
    head.htmlFor = c.select.id;
    c.indices.forEach((k) => option(c.select, k, niceName(sites[k].label)));
    panel.append(c.select);
  } else {
    c.name = document.createElement("small");
    panel.append(c.name);
  }
  c.canvas = document.createElement("canvas");
  c.canvas.setAttribute("aria-label", c.title + " trace over recorded samples");
  c.readout = document.createElement("output");
  row.append(panel, c.canvas, c.readout);
  $("traces").append(row);
  c.select.addEventListener("change", render);
});
function traceView(c) {
  const s = sites[Number(c.select.value)],
    { ctx, w, h } = surface(c.canvas),
    dx = (i) => 2 + ((w - 4) * i) / last;
  const scale = s.good
    ? Math.max(10, Math.ceil(Math.max(...s.uv.map(Math.abs)) / 10) * 10)
    : 0;
  const value = s.good && cursor <= cutoff ? s.uv[cursor] : null;
  if (c.name) c.name.textContent = "Site " + s.label;
  c.readout.replaceChildren(
    document.createTextNode(
      value !== null
        ? fmt(value, 2) + " µV"
        : s.good
          ? "Excerpt ended"
          : "Excluded",
    ),
  );
  const scaleText = document.createElement("small");
  scaleText.textContent = scale ? "Scale ±" + scale + " µV" : "Author mask";
  c.readout.append(scaleText);
  ctx.fillStyle = "#e9ece5";
  ctx.fillRect(dx(cutoff), 0, w - dx(cutoff), h);
  stroke(
    ctx,
    [
      [0, h * 0.5],
      [w, h * 0.5],
    ],
    "#d1d8cf",
  );
  stroke(
    ctx,
    [
      [dx(onset), 0],
      [dx(onset), h],
    ],
    "#8a7757",
    1.3,
    [3, 3],
  );
  stroke(
    ctx,
    [
      [dx(cutoff), 0],
      [dx(cutoff), h],
    ],
    "#74827a",
  );
  if (s.good)
    stroke(
      ctx,
      s.uv.map((y, i) => [dx(i), h / 2 - (y / scale) * (h / 2 - 3)]),
      c.color,
      1.5,
    );
  stroke(
    ctx,
    [
      [dx(cursor), 0],
      [dx(cursor), h],
    ],
    "#1b353c",
    1.5,
  );
  if (value !== null)
    dot(ctx, [dx(cursor), h / 2 - (value / scale) * (h / 2 - 3)], 3, c.color);
}
function render() {
  const s = sites[Number(scalp.value)],
    ms =
      ((recording.start + cursor - recording.logged) * 1000) / recording.rate;
  $("time").value = cursor;
  $("time").setAttribute(
    "aria-valuetext",
    fmt(ms, 2) + " milliseconds from the visual onset",
  );
  $("clockTime").textContent = fmt(ms, 2) + " ms";
  $("sample").textContent =
    "Stored sample " + (recording.start + cursor) + " · 256 Hz";
  $("previous").disabled = cursor === 0;
  $("next").disabled = cursor === last;
  $("scalpVal").textContent = !s.good
    ? "Excluded by the authors"
    : cursor > cutoff
      ? "Electrical excerpt ended"
      : fmt(s.uv[cursor], 2) + " µV";
  $("coordRead").textContent =
    "Digitized X, Y, Z in mm: " +
    s.xyz_m.map((v) => fmt(v * 1000, 1)).join(", ") +
    ".";
  $("positions").replaceChildren();
  for (const [i, name] of [
    [1, "Head"],
    [0, "Sacrum"],
  ]) {
    const row = $("positions").insertRow(),
      header = document.createElement("th");
    header.scope = "row";
    header.textContent = name;
    row.append(header);
    for (const v of moves[cursor][i]) row.insertCell().textContent = fmt(v, 2);
  }
  drawCap();
  drawPaths();
  for (const c of traces) traceView(c);
}
function stop() {
  playing = false;
  $("play").textContent = "Play at ¼ speed";
}
function move(i) {
  stop();
  cursor = Math.max(0, Math.min(last, i));
  render();
}
$("auxSites").onchange = () => {
  $("auxKey").hidden = !$("auxSites").checked;
  drawCap();
};
$("time").addEventListener("input", (e) => move(Number(e.target.value)));
$("previous").onclick = () => move(cursor - 1);
$("next").onclick = () => move(cursor + 1);
document
  .querySelectorAll("[data-jump]")
  .forEach(
    (b) =>
      (b.onclick = () =>
        move({ onset: Math.ceil(onset), cutoff, end: last }[b.dataset.jump])),
  );
function tick(now) {
  if (!playing) return;
  const i = Math.min(
    last,
    firstFrame + Math.floor(((now - startTime) * recording.rate) / 4000),
  );
  if (i !== cursor) {
    cursor = i;
    render();
  }
  if (i === last) {
    stop();
    return;
  }
  requestAnimationFrame(tick);
}
$("play").onclick = () => {
  if (playing) {
    stop();
    return;
  }
  if (cursor === last) cursor = 0;
  firstFrame = cursor;
  startTime = performance.now();
  playing = true;
  $("play").textContent = "Pause";
  render();
  requestAnimationFrame(tick);
};
const presets = {
  cap: [
    [-2.28, 0.34],
    [0, Math.PI / 2],
    [0, 0],
  ],
  paths: [
    [-0.55, 0.32],
    [0, 0],
    [0, -Math.PI / 2],
    [Math.PI / 2, 0],
  ],
};
for (const [key, select, draw] of [
  ["cap", $("scalpView"), drawCap],
  ["paths", $("motionView"), drawPaths],
]) {
  const canvas = $(key),
    view = views[key];
  option(select, "custom", "Rotated");
  select.options[select.length - 1].disabled = true;
  select.onchange = () => {
    [view.yaw, view.pitch] = presets[key][select.selectedIndex];
    draw();
  };
  const orbit = (x, y) => {
    select.value = "custom";
    view.yaw += x;
    view.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, view.pitch + y));
    draw();
  };
  let drag = null;
  canvas.onkeydown = (e) => {
    const d = {
      ArrowLeft: [-0.12, 0],
      ArrowRight: [0.12, 0],
      ArrowUp: [0, 0.12],
      ArrowDown: [0, -0.12],
    }[e.key];
    if (d) {
      e.preventDefault();
      orbit(...d);
    }
  };
  canvas.onpointerdown = (e) => {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (dx || dy) {
      drag.moved += Math.hypot(dx, dy);
      orbit(-dx * 0.009, dy * 0.009);
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
  };
  canvas.onpointerup = (e) => {
    if (drag?.id !== e.pointerId) return;
    if (key === "cap" && drag.moved < 5) {
      const box = canvas.getBoundingClientRect(),
        x = e.clientX - box.left,
        y = e.clientY - box.top;
      const hit = hits
        .slice()
        .reverse()
        .find((s) => Math.hypot(x - s.p[0], y - s.p[1]) < 10);
      if (hit) {
        scalp.value = hit.i;
        render();
      }
    }
    drag = null;
  };
  canvas.onpointercancel = () => {
    drag = null;
  };
}
if (location.protocol === "file:") {
  $("home").href = "https://eliminatenoise.github.io/Interoceptomics/";
  $("download").hidden = true;
}
new ResizeObserver(render).observe(document.querySelector(".models"));
window.addEventListener("resize", render);
render();
