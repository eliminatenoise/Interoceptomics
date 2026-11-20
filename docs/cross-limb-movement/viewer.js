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
const traces = {};
const gaps = {};
const stepMs = 1000 / 256;
const forecastCopy = {
  central: "This model reads 625 ms of wrist or sacrum motion, muscle activity and voltage from three central scalp contacts. The dashed line predicts the next 125 ms of movement.",
  reference: "A second model learned with each available scalp value replaced by its study’s training average. It kept the same motion, muscle recordings and information about which contacts were available.",
  wrong: "The scalp model receives the same motion and muscle inputs but reads scalp voltage from an eligible earlier trial with the same task, person and contact availability.",
  separate: "After reading 625 ms of marker motion and muscle activity, the model uses one learned map for the wrist and another for the sacrum. Each forecast covers the next 125 ms.",
  matched: "Both studies use the same two learned maps. The forecast shifts from the first map to the second as time passes. This model has as many adjustable weights as the model with one map per study.",
  original: "One learned map turns the model’s reading of the movement and muscle history into positions for both studies and all forecast times.",
  velocity: "What if the marker kept moving at its last speed and direction? The straight line extends the velocity between the last two positions given to the models, 32 ms apart for the wrist and 31.25 ms for the sacrum.",
  none: "Follow the recorded positions alone. The scale in each panel stays fixed when you switch forecasts.",
};
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
  <div class="card-head"><div><h2 id="${key}-title">${cap.title}</h2><p class="sub">${cap.task}</p></div><a href="${key}.glb" download>Measured 3D path ↓</a></div>
  <canvas class="plot" id="${key}-plot" tabindex="0" role="img" aria-label="${cap.title} measured path and optional forecast overlay. Drag or use arrow keys to rotate."></canvas>
  <div class="legend"><span>Measured before cutoff</span><span class="after">Measured after</span><span class="current">Selected time</span><span class="forecast-key" id="${key}-forecast-key">Forecast</span></div>
  <div class="inside">
  <div class="orient"><span>Drag or use arrow keys to rotate.</span><select aria-label="${cap.title} view" id="${key}-view">${viewOptions}</select></div>
  <p class="sig-note" id="${key}-no-donor" hidden>No eligible earlier scalp trial for this recording. Only the measured path is shown.</p>
  <section class="error-panel" id="${key}-error-panel" aria-labelledby="${key}-gap-heading">
    <h3 id="${key}-gap-heading">How far apart are the paths?</h3>
    <p>At the selected time <strong id="${key}-gap"></strong><br>Mean across 32 forecast times <strong id="${key}-mean"></strong></p>
    <canvas class="error-curve" id="${key}-error-curve" role="img" aria-label="${cap.title} 3D distance between forecast and measurement across 125 milliseconds"></canvas>
    <details><summary>Compare coordinates at this time</summary>
      <p>Signed displacement from the cutoff in millimetres. Both columns use the recording’s own axes.</p>
      <table class="samples"><thead><tr><th scope="col">Axis</th><th scope="col">Measured (mm)</th><th scope="col">Forecast (mm)</th></tr></thead>
        <tbody>${d.axes.map((axis, i) => `<tr><th scope="row">${axis}</th><td id="${key}-measured-${i}"></td><td id="${key}-predicted-${i}"></td></tr>`).join("")}</tbody>
      </table>
    </details>
  </section>
  <div class="readout" aria-label="Measured displacement">${d.axes.map((axis, i) => "<div><small>" + axis + ' · mm</small><b id="' + key + "-axis" + i + '">—</b></div>').join("")}<div><small>Measured distance from cutoff</small><b id="${key}-dist">—</b></div></div>
  <div class="frame"><p id="${key}-status"></p><p class="phase">${cap.cue}</p></div>
  <details><summary>Stored position frames</summary><p>${cap.axes} The table gives the source coordinates in ${d.sourceUnit}, rounded to four decimals. Displacements above use this recording’s own cutoff as the origin.</p><table class="samples"><thead><tr><th>From cutoff</th>${d.axes.map((a) => "<th>" + a + " (" + d.sourceUnit + ")</th>").join("")}</tr></thead><tbody id="${key}-frames"></tbody></table></details>
  <div id="${key}-scalp-slot"></div>
  <hr class="divider"><div class="chart-title"><h3>Muscle amplitude</h3><select id="${key}-channel" aria-label="${cap.title} muscle">${options}</select></div>
  <canvas class="signal" id="${key}-signal" role="img" aria-label="Muscle amplitude in 31.25 millisecond windows"></canvas><p class="sig-note" id="${key}-amplitude"></p>
  <p id="${key}-muscle-forecast" class="sig-note muscle-forecast" hidden></p>
  <details><summary>All ${d.muscles.length} muscle channels</summary><p>${cap.muscle} Root mean square (RMS) gives the size of the electrical signal across a window. Each column covers 125 ms, ending or starting at cutoff.</p>
  <table class="samples"><thead><tr><th>Muscle</th><th>Before (${d.emgUnit})</th><th>After (${d.emgUnit})</th></tr></thead><tbody>${d.muscles.map((m, i) => '<tr><th scope="row">' + m + "</th><td>" + formatRMS(key, d.rms.previous[i]) + "</td><td>" + formatRMS(key, d.rms.following[i]) + "</td></tr>").join("")}</tbody></table></details>
  </div>`;
  $("panels").appendChild(section);
  element(key, "scalp-slot").appendChild(scalpPanel(key));
  const origin = d.xyz[-d.first];
  positions[key] = d.xyz.map((row) => row.map((v, j) => (v - origin[j]) * d.factorMm));
  traces[key] = {};
  gaps[key] = {};
  const paths = {...forecastPaths[key]};
  for (const [method, output] of Object.entries(scalpExcerpts[key].forecasts)) {
    if (output) paths[method] = output.path;
  }
  for (const [model, path] of Object.entries(paths)) {
    traces[key][model] = [[0, 0, 0], ...path];
    gaps[key][model] = path.map((point, j) => distance(point, at(key, (j + 1) * stepMs).p));
  }
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

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
function pointOnForecast(path, ms) {
  if (!path || ms < 0 || ms > 125) return null;
  const index = ms / stepMs;
  const lo = Math.floor(index), hi = Math.ceil(index);
  return path[lo].map((v, axis) => v + (path[hi][axis] - v) * (index - lo));
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
  // Fit this view to the same set of paths for every overlay choice.
  const bounds = visible.concat(Object.values(traces[key]).flat().map(project));
  const xs = bounds.map((p) => p[0]),
    ys = bounds.map((p) => p[1]);
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
  const forecast = traces[key][$("forecast").value];
  if (forecast) {
    ctx.strokeStyle = "#72e4e1";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    forecast.forEach((point, i) => {
      const [x, y] = screen(project(point));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const zero = screen(project([0, 0, 0]));
  line([zero[0] - 5, zero[1]], [zero[0] + 5, zero[1]], "#d2e0db");
  line([zero[0], zero[1] - 5], [zero[0], zero[1] + 5], "#d2e0db");
  if (selection) {
    const p = screen(project(selection.p));
    dot(p, 6, "#0a2023");
    dot(p, 4, "#fff8e6");
    const estimate = pointOnForecast(forecast, now());
    if (estimate) {
      const [x, y] = screen(project(estimate));
      ctx.strokeStyle = "#72e4e1";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y - 6); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 6, y);
      ctx.closePath();
      ctx.stroke();
    }
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

function drawError(key, ms, selected) {
  const model = $("forecast").value;
  const show = Boolean(traces[key][model]);
  element(key, "no-donor").hidden = model !== "wrong" || show;
  element(key, "forecast-key").hidden = !show;
  element(key, "error-panel").hidden = !show;
  if (!show) return;
  const values = gaps[key][model];
  const estimate = pointOnForecast(traces[key][model], ms);
  const gap = estimate && selected ? distance(estimate, selected.p) : null;
  for (let i = 0; i < 3; i++) {
    element(key, "measured-" + i).textContent = selected ? signed(selected.p[i]) : "Outside excerpt";
    element(key, "predicted-" + i).textContent = estimate ? signed(estimate[i]) : "Outside forecast";
  }
  element(key, "gap").textContent = gap === null ? "Outside forecast" : gap.toFixed(2) + " mm";
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  element(key, "mean").textContent = mean.toFixed(2) + " mm";

  const {ctx, w, h} = canvasSize(element(key, "error-curve"));
  // Native frame differences can briefly exceed the errors at the 32 model knots.
  const ceiling = errorCeiling[key];
  const left = 46, right = w - 8, top = 9, bottom = h - 19;
  const x = (t) => left + (right - left) * t / 125;
  const y = (v) => bottom - (bottom - top) * v / ceiling;
  ctx.strokeStyle = "#a9bdb5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom);
  ctx.stroke();
  ctx.fillStyle = "#365448";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(ceiling + " mm", left - 5, top + 6);
  ctx.fillText("0", left - 5, bottom);
  ctx.fillText("125 ms", right, h - 3);
  ctx.textAlign = "left";
  ctx.fillText("0", left, h - 3);
  ctx.strokeStyle = "#16746c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  values.forEach((v, i) => ctx.lineTo(x((i + 1) * stepMs), y(v)));
  ctx.stroke();
  if (gap !== null) {
    const cursor = x(ms);
    ctx.strokeStyle = "#869a92";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cursor, top); ctx.lineTo(cursor, bottom); ctx.stroke();
    ctx.fillStyle = "#10272d";
    ctx.beginPath(); ctx.arc(cursor, y(gap), 3.5, 0, 2 * Math.PI); ctx.fill();
  }
}
function drawMuscle(key, ms) {
  const d = recordings[key],
    i = Number(element(key, "channel").value),
    { ctx, w, h } = canvasSize(element(key, "signal"));
  showMuscleForecast(key, $("forecast").value, i);
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
  drawError(key, ms, selected);
  drawMuscle(key, ms);
  drawScalp(key, ms);
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

const missingDonors = keys.filter(key => !scalpExcerpts[key].forecasts.wrong);
if (missingDonors.length === keys.length) $("wrong-option").disabled = true;
$("donor-note").textContent = missingDonors.length
  ? "Earlier-trial control unavailable for " + missingDonors.map(k => k === "wrist" ? "the wrist" : "the sacrum").join(" and ") + ". No earlier trial met the matching rules."
  : "";
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
// A shared error axis per recording includes all forecast and native wrist display times.
const errorCeiling = {};
for (const key of keys) {
  const offsets = [...Array.from({ length: 33 }, (_, i) => i * stepMs),
                   ...Array.from({ length: 63 }, (_, i) => i * 2)];
  let max = 0;
  for (const path of Object.values(traces[key])) {
    for (const t of offsets) {
      const estimate = pointOnForecast(path, t);
      max = Math.max(max, distance(estimate, at(key, t).p));
    }
  }
  errorCeiling[key] = Math.max(1, Math.ceil(max));
}
function selectForecast() {
  $("forecast-detail").textContent = forecastCopy[$("forecast").value];
  update();
}
$("forecast").addEventListener("change", selectForecast);
$("forecast-detail").textContent = forecastCopy[$("forecast").value];
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
