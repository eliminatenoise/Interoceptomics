"use strict";

const $ = (id) => document.getElementById(id);
const captions = {
  wrist: {
    title: "Right wrist",
    task: "LED-cued grasp and lift",
    cue: "The wrist cutoff is 400 ms after the go light.",
    axes: "Polhemus tracker X, Y and Z. Anatomical directions are unverified.",
    muscle: "Five right arm and hand electrodes sampled at 4,000 Hz. The voltage conversion is unknown.",
  },
  sacrum: {
    title: "Sacrum",
    task: "Walking through a visual rotation",
    cue: "The sacrum cutoff is 126.682 ms after the logged counterclockwise rotation.",
    axes: "ML runs side to side, SI runs vertically, AP runs front to back. The positive sides are unverified.",
    muscle: "Eight lower-leg electrodes, four per side. The released series is sampled at 256 Hz.",
  },
};
const keys = Object.keys(captions);
const cameras = Object.fromEntries(keys.map((key) => [key, { yaw: -0.93, pitch: 0.58 }]));
const positions = {};
let playing = false;
let animation;
const signed = (v, n = 2) => (v < 0 ? "−" : v > 0 ? "+" : "") + Math.abs(v).toFixed(n);
const milliseconds = (v) => signed(v, 6).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1") + " ms";
function element(key, name) {
  return $(key + "-" + name);
}

function introduction(key) {
  const d = recordings[key],
    cap = captions[key];
  const section = document.createElement("section");
  section.className = "card";
  section.setAttribute("aria-labelledby", key + "-title");
  const options = d.muscles.map((v, i) => '<option value="' + i + '">' + v + "</option>").join("");
  const views = [
    "Orbit in 3D",
    d.axes[0] + " × " + d.axes[1],
    d.axes[0] + " × " + d.axes[2],
    d.axes[2] + " × " + d.axes[1],
  ];
  const viewOptions = views.map((v, i) => '<option value="' + i + '">' + v + "</option>").join("");
  section.innerHTML = `
  <div class="card-head"><div><h2 id="${key}-title">${cap.title}</h2><p class="sub">${cap.task}</p></div><a href="${key}.glb" download>3D path ↓</a></div>
  <canvas class="plot" id="${key}-plot" tabindex="0" role="img" aria-label="${cap.title} path in three dimensions. Drag or use arrow keys to rotate."></canvas>
  <div class="legend"><span>Before cutoff</span><span class="after">After cutoff</span><span class="current">Selected time</span></div>
  <div class="inside">
  <div class="orient"><span>Drag or use arrow keys to rotate.</span><select aria-label="${cap.title} view" id="${key}-view">${viewOptions}</select></div>
  <div class="readout">${d.axes.map((axis, i) => "<div><small>" + axis + ' · mm</small><b id="' + key + "-axis" + i + '">—</b></div>').join("")}<div><small>Distance from cutoff</small><b id="${key}-dist">—</b></div></div>
  <div class="frame"><p id="${key}-status"></p><p class="phase">${cap.cue}</p></div>
  <details><summary>Stored position frames</summary><p>${cap.axes} The table gives the source coordinates in ${d.sourceUnit}, rounded to four decimals. Displacements above use this recording’s own cutoff as the origin.</p><table class="samples"><thead><tr><th>From cutoff</th>${d.axes.map((a) => "<th>" + a + " (" + d.sourceUnit + ")</th>").join("")}</tr></thead><tbody id="${key}-frames"></tbody></table></details>
  <hr class="divider"><div class="chart-title"><h3>Muscle amplitude</h3><select id="${key}-channel" aria-label="${cap.title} muscle">${options}</select></div>
  <canvas class="signal" id="${key}-signal" role="img" aria-label="Muscle amplitude in 31.25 millisecond windows"></canvas><p class="sig-note" id="${key}-amplitude"></p>
  <details><summary>All ${d.muscles.length} muscle channels</summary><p>${cap.muscle} Root mean square (RMS) gives the size of the electrical signal across a window. Each column covers 125 ms, ending or starting at cutoff.</p>
  <table class="samples"><thead><tr><th>Muscle</th><th>Before (${d.emgUnit})</th><th>After (${d.emgUnit})</th></tr></thead><tbody>${d.muscles.map((m, i) => '<tr><th scope="row">' + m + "</th><td>" + formatRMS(key, d.rms.previous[i]) + "</td><td>" + formatRMS(key, d.rms.following[i]) + "</td></tr>").join("")}</tbody></table></details>
  </div>`;
  $("panels").appendChild(section);
  const origin = d.xyz[-d.first];
  positions[key] = d.xyz.map((row) => row.map((v, j) => (v - origin[j]) * d.factorMm));
}

function formatRMS(key, v) {
  return v.toFixed(key === "wrist" ? 5 : 2);
}
function frameTime(key, i) {
  return ((recordings[key].first + i) * 1000) / recordings[key].hz;
}
function at(key, millis) {
  const d = recordings[key];
  const index = (millis * d.hz) / 1000 - d.first;
  if (index < 0 || index > d.xyz.length - 1) return null;
  const lo = Math.floor(index),
    hi = Math.ceil(index),
    alpha = index - lo;
  const p = positions[key][lo].map((v, j) => v + (positions[key][hi][j] - v) * alpha);
  return { lo, hi, p };
}

function canvasSize(canvas) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    ratio = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function projector(key) {
  const view = element(key, "view").value;
  if (view === "1") return ([x, y, z]) => [x, -y];
  if (view === "2") return ([x, y, z]) => [x, -z];
  if (view === "3") return ([x, y, z]) => [z, -y];
  const { yaw, pitch } = cameras[key];
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  return ([x, y, z]) => [cy * x + sy * z, -cp * y + sp * (-sy * x + cy * z)];
}

function drawPath(key, selection) {
  const d = recordings[key],
    points = positions[key],
    { ctx, w, h } = canvasSize(element(key, "plot"));
  const project = projector(key),
    all = $("extent").value === "all",
    cutoff = -d.first;
  const first = all ? 0 : cutoff;
  // Keep the full upper bracketing knot in native wrist view (the comparison stops at +125 ms).
  const last =
    key === "wrist" && !all && $("grid").value !== "wrist" ? d.xyz.length - 2 : d.xyz.length - 1;
  const visible = points.slice(first, last + 1).map(project);
  if (key === "wrist" && last < d.xyz.length - 1) visible.push(project(at(key, 125).p));
  const xs = visible.map((p) => p[0]),
    ys = visible.map((p) => p[1]);
  const xmin = Math.min(...xs),
    xmax = Math.max(...xs),
    ymin = Math.min(...ys),
    ymax = Math.max(...ys);
  const scale = Math.min((w - 80) / Math.max(1, xmax - xmin), (h - 74) / Math.max(1, ymax - ymin));
  const screen = ([x, y]) => [
    (x - (xmin + xmax) / 2) * scale + w / 2,
    (y - (ymin + ymax) / 2) * scale + h / 2,
  ];
  const drawn = visible.map(screen);
  function line(a, b, col, width = 1) {
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
  }
  function dot(p, r, fill) {
    ctx.beginPath();
    ctx.arc(...p, r, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  for (let i = 1; i < drawn.length; i++)
    line(drawn[i - 1], drawn[i], i + first <= cutoff ? "#8baeb4" : "#ffaf69", 2.8);
  if (!all) {
    const grid = $("grid").value,
      rate = grid === "wrist" ? 500 : 256;
    const n = grid === "wrist" ? 63 : 32;
    for (let j = 1; j <= n; j++) {
      const knot = at(key, (j * 1000) / rate);
      if (knot) dot(screen(project(knot.p)), 1.7, "#ffe1b4");
    }
  }
  const zero = screen(project([0, 0, 0]));
  line([zero[0] - 5, zero[1]], [zero[0] + 5, zero[1]], "#d2e0db");
  line([zero[0], zero[1] - 5], [zero[0], zero[1] + 5], "#d2e0db");
  if (selection) {
    const p = screen(project(selection.p));
    dot(p, 6, "#0a2023");
    dot(p, 4, "#fff8e6");
  }
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "#d8e8e2";
  const limit = Math.min(80, w / 4) / scale;
  const base = 10 ** Math.floor(Math.log10(limit)),
    unit = [5, 2, 1].map((n) => n * base).find((n) => n <= limit);
  const y = h - 16;
  line([14, y], [14 + unit * scale, y], "#a8c4bb", 1.4);
  for (const x of [14, 14 + unit * scale]) line([x, y - 3], [x, y + 3], "#a8c4bb");
  ctx.fillText(unit + " mm", 14, y - 7);
  const axisOrigin = [w - 45, h - 36],
    labels = ["#fbc39e", "#a3ddbe", "#9cc8e1"];
  [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ].forEach((v, i) => {
    const p = project(v),
      span = Math.hypot(...p);
    if (span < 0.001) return;
    const end = [axisOrigin[0] + 17 * p[0], axisOrigin[1] + 17 * p[1]];
    line(axisOrigin, end, labels[i], 1.5);
    ctx.fillStyle = labels[i];
    ctx.fillText(d.axes[i], end[0] + 3 * p[0] - 3, end[1] + 7 * p[1] + 2);
  });
}

function drawMuscle(key, ms) {
  const d = recordings[key],
    i = Number(element(key, "channel").value),
    { ctx, w, h } = canvasSize(element(key, "signal"));
  const values = d.rms.bins.map((row) => row[i]),
    max = Math.max(...values),
    left = 5,
    right = w - 5,
    baseline = h - 20,
    top = 19;
  const span = (right - left) / 24,
    active = Math.ceil((ms + 625) / 31.25) - 1;
  for (let j = 0; j < 24; j++) {
    const bh = ((baseline - top) * values[j]) / (max || 1);
    ctx.fillStyle = j === active ? "#213c3b" : j < 20 ? "#84a5a1" : "#d8874e";
    ctx.fillRect(left + j * span + 1, baseline - bh, Math.max(1, span - 2), bh);
  }
  const zero = left + 20 * span;
  ctx.strokeStyle = "#556d63";
  ctx.beginPath();
  ctx.moveTo(zero, top);
  ctx.lineTo(zero, baseline + 1);
  ctx.stroke();
  ctx.fillStyle = "#3a544d";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(formatRMS(key, max) + " " + d.emgUnit, left, 12);
  ctx.fillText("−625 ms", left, h - 4);
  ctx.fillText("0", zero - 3, h - 4);
  ctx.textAlign = "right";
  ctx.fillText("+125", right, h - 4);
  ctx.textAlign = "left";
  const s = element(key, "amplitude");
  if (active < 0 || active > 23) {
    s.textContent = "Selected time lies outside the 24 muscle windows.";
    return;
  }
  s.textContent =
    formatRMS(key, values[active]) +
    " " +
    d.emgUnit +
    " RMS over (" +
    milliseconds(-625 + active * 31.25) +
    ", " +
    milliseconds(-625 + (active + 1) * 31.25) +
    "].";
}

function panel(key, ms) {
  const d = recordings[key],
    selected = at(key, ms);
  const status = element(key, "status"),
    frames = element(key, "frames");
  for (let i = 0; i < 3; i++)
    element(key, "axis" + i).textContent = selected ? signed(selected.p[i]) : "—";
  element(key, "dist").textContent = selected ? Math.hypot(...selected.p).toFixed(2) + " mm" : "—";
  if (!selected) {
    status.textContent = "Outside this excerpt’s stored position frames.";
    frames.innerHTML = '<tr><td colspan="4">No supported position at this time.</td></tr>';
  } else {
    const { lo, hi } = selected;
    const ids = lo === hi ? [lo] : [lo, hi];
    status.textContent =
      lo === hi
        ? "Stored frame at " + milliseconds(frameTime(key, lo)) + "."
        : "Linear interpolation between " +
          milliseconds(frameTime(key, lo)) +
          " and " +
          milliseconds(frameTime(key, hi)) +
          ".";
    frames.innerHTML = ids
      .map(
        (i) =>
          "<tr><th>" +
          milliseconds(frameTime(key, i)) +
          "</th>" +
          d.xyz[i].map((v) => "<td>" + v.toFixed(4) + "</td>").join("") +
          "</tr>",
      )
      .join("");
  }
  drawPath(key, selected);
  drawMuscle(key, ms);
}

function clockHz() {
  return $("grid").value === "wrist" ? 500 : 256;
}
function now() {
  return (Number($("clock").value) * 1000) / clockHz();
}
function stop() {
  playing = false;
  cancelAnimationFrame(animation);
  $("play").textContent = Number($("clock").value) === Number($("clock").max) ? "Replay" : "Play";
}
function timeline(ms) {
  const g = $("grid").value,
    all = $("extent").value === "all",
    clock = $("clock");
  $("bracket").hidden = g !== "wrist";
  const min = all ? (g === "wrist" ? -313 : g === "sacrum" ? -159 : -160) : 0,
    max = g === "wrist" ? 63 : 32;
  clock.min = min;
  clock.max = max;
  clock.value = Math.max(min, Math.min(max, Math.round((ms * clockHz()) / 1000)));
  $("low").textContent = milliseconds((min * 1000) / clockHz());
  $("high").textContent = milliseconds((max * 1000) / clockHz());
  update();
}
function update() {
  const ms = now(),
    clock = $("clock");
  $("time").textContent = milliseconds(ms);
  clock.setAttribute("aria-valuetext", milliseconds(ms) + " from cutoff");
  $("prev").disabled = clock.value === clock.min;
  $("next").disabled = clock.value === clock.max;
  if (!playing) $("play").textContent = clock.value === clock.max ? "Replay" : "Play";
  for (const key of keys) panel(key, ms);
}
function start() {
  const clock = $("clock");
  if (playing) {
    stop();
    return;
  }
  if (clock.value === clock.max) clock.value = clock.min;
  const t = performance.now(),
    startFrame = Number(clock.value),
    rate = clockHz() / 4000;
  playing = true;
  $("play").textContent = "Pause";
  update();
  function tick(ts) {
    const frame = Math.min(Number(clock.max), startFrame + Math.floor((ts - t) * rate));
    if (frame !== Number(clock.value)) {
      clock.value = frame;
      update();
    }
    if (frame >= Number(clock.max)) stop();
    else if (playing) animation = requestAnimationFrame(tick);
  }
  animation = requestAnimationFrame(tick);
}

for (const key of keys) {
  introduction(key);
  const plot = element(key, "plot"),
    camera = cameras[key];
  let drag = null;
  function turn(dx, dy) {
    camera.yaw += dx;
    camera.pitch = Math.min(1.45, Math.max(-1.45, camera.pitch + dy));
    element(key, "view").value = "0";
    drawPath(key, at(key, now()));
  }
  plot.addEventListener("pointerdown", (e) => {
    drag = [e.clientX, e.clientY];
    plot.setPointerCapture(e.pointerId);
  });
  plot.addEventListener("pointermove", (e) => {
    if (!drag) return;
    turn((e.clientX - drag[0]) * 0.012, (e.clientY - drag[1]) * 0.012);
    drag = [e.clientX, e.clientY];
  });
  plot.addEventListener("lostpointercapture", () => {
    drag = null;
  });
  plot.addEventListener("keydown", (e) => {
    const delta = {
      ArrowLeft: [-0.12, 0],
      ArrowRight: [0.12, 0],
      ArrowUp: [0, -0.12],
      ArrowDown: [0, 0.12],
    }[e.key];
    if (delta) {
      e.preventDefault();
      turn(...delta);
    }
  });
  element(key, "view").addEventListener("change", () => drawPath(key, at(key, now())));
  element(key, "channel").addEventListener("change", () => drawMuscle(key, now()));
}
let previousHz = clockHz();
$("grid").addEventListener("change", () => {
  const ms = (Number($("clock").value) * 1000) / previousHz;
  stop();
  previousHz = clockHz();
  timeline(ms);
});
$("extent").addEventListener("change", () => {
  stop();
  timeline(now());
});
$("clock").addEventListener("input", () => {
  stop();
  update();
});
$("zero").addEventListener("click", () => {
  stop();
  $("clock").value = 0;
  update();
});
$("end").addEventListener("click", () => {
  stop();
  $("clock").value = $("clock").max;
  update();
});
$("prev").addEventListener("click", () => {
  stop();
  $("clock").stepDown();
  update();
});
$("next").addEventListener("click", () => {
  stop();
  $("clock").stepUp();
  update();
});
$("play").addEventListener("click", start);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
if (location.protocol === "file:") $("bundle").hidden = true;
new ResizeObserver(update).observe($("panels"));
timeline(125);
