"use strict";

const $ = (id) => document.getElementById(id);
const postures = ["standing", "walking"];
const muscles = [
  "Tibialis anterior",
  "Soleus",
  "Medial gastrocnemius",
  "Peroneus longus",
];
const regions = [
  "front of the shin",
  "deep calf, beneath the gastrocnemius",
  "inner portion of the upper calf",
  "outer lower leg",
];
const labels = ["Left", "Right"].flatMap((side) =>
  muscles.map((name) => side + " " + name.toLowerCase()),
);
const startToCutoff = 159,
  firstAfterCue = 127,
  last = 191,
  rate = 256;
let frame = startToCutoff,
  channel = 0,
  yaw = -0.68,
  pitch = 0.32,
  playID = 0;
const names = { standing: "Standing", walking: "Walking" };
const colors = {
  past: "#63bddd",
  future: "#ffa168",
  text: "#c1dce5",
};
const paths = Object.fromEntries(
  postures.map((key) => {
    const s = sessions[key],
      origin = s.position[startToCutoff];
    return [key, s.position.map((point) => point.map((v, i) => v - origin[i]))];
  }),
);

function signed(value, digits = 2) {
  if (Math.abs(value) < 0.5 * 10 ** -digits) return (0).toFixed(digits);
  return (value < 0 ? "−" : "+") + Math.abs(value).toFixed(digits);
}

function updateLimits() {
  const s = sessions[$("source").value];
  $("absolute").min = s.start;
  $("absolute").max = s.end;
  $("absolute").value = s.start + frame;
}

for (const key of postures) {
  $("paths").insertAdjacentHTML(
    "beforeend",
    '<article class="path"><header><h3>' +
      names[key] +
      "</h3><span data-sample></span></header>" +
      '<canvas id="path-' +
      key +
      '" tabindex="0" role="img" aria-label="' +
      names[key] +
      ' sacrum path, rotate with arrow keys"></canvas>' +
      '<div class="stats"><strong data-displacement></strong><span data-source></span><span class="time" data-time></span></div></article>',
  );
  $("traces").insertAdjacentHTML(
    "beforeend",
    '<article class="trace"><header><h3>' +
      names[key] +
      '</h3><output id="value-' +
      key +
      '"></output></header>' +
      '<canvas id="trace-' +
      key +
      '" role="img" aria-label="' +
      names[key] +
      ' voltage history. Exact selected sample above."></canvas></article>',
  );
}
labels.forEach((label, i) => $("channel").add(new Option(label, String(i))));
labels.forEach((label, i) => {
  const row = document.createElement("tr");
  row.innerHTML =
    "<th scope='row'>" +
    label +
    "</th>" +
    postures
      .map(
        (k) =>
          "<td>" +
          sessions[k].previousRMS[i].toFixed(2) +
          "</td><td>" +
          sessions[k].nextRMS[i].toFixed(2) +
          "</td>",
      )
      .join("");
  $("rms").append(row);
});

function surface(canvas) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(w * ratio) ||
    canvas.height !== Math.round(h * ratio)
  ) {
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.font = "12px Arial, sans-serif";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.textAlign = "left";
  return { ctx, w, h };
}
function line(ctx, points, color, width = 1) {
  if (!points.length) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
  ctx.stroke();
}
function dot(ctx, x, y, r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function project([x, y, z]) {
  const style = $("view").value;
  if (style === "mlsi") return [x, -y];
  if (style === "mlap") return [x, -z];
  if (style === "apsi") return [z, -y];
  const horizontal = x * Math.cos(yaw) + z * Math.sin(yaw);
  const depth = -x * Math.sin(yaw) + z * Math.cos(yaw);
  return [horizontal, -y * Math.cos(pitch) + depth * Math.sin(pitch)];
}
function paintPaths() {
  const afterOnly = $("extent").value === "after",
    first = afterOnly ? startToCutoff : 0;
  const x = [],
    y = [];
  const projected = {};
  for (const key of postures) {
    projected[key] = paths[key].map(project);
    for (const [u, v] of projected[key].slice(first)) {
      x.push(u);
      y.push(v);
    }
  }
  const [xmin, xmax, ymin, ymax] = [
    Math.min(...x),
    Math.max(...x),
    Math.min(...y),
    Math.max(...y),
  ];
  const canvases = postures.map((key) => $("path-" + key));
  const commonWidth = Math.min(...canvases.map((el) => el.clientWidth));
  const commonHeight = Math.min(...canvases.map((el) => el.clientHeight));
  const scale = Math.min(
    (commonWidth - 88) / Math.max(1, xmax - xmin),
    (commonHeight - 50) / Math.max(1, ymax - ymin),
  );
  for (const key of postures) {
    const { ctx, w, h } = surface($("path-" + key));
    const ox = w / 2 - ((xmin + xmax) / 2) * scale,
      oy = (h - 18) / 2 - ((ymin + ymax) / 2) * scale;
    const pts = projected[key].map(([a, b]) => [
      ox + a * scale,
      oy + b * scale,
    ]);
    if (!afterOnly)
      line(ctx, pts.slice(0, startToCutoff + 1), colors.past, 2.3);
    line(ctx, pts.slice(startToCutoff), colors.future, 2.8);
    // A cross marks the shared time origin even when the sample cursor is elsewhere.
    const [cx, cy] = pts[startToCutoff];
    line(
      ctx,
      [
        [cx - 5, cy],
        [cx + 5, cy],
      ],
      "white",
      1.3,
    );
    line(
      ctx,
      [
        [cx, cy - 5],
        [cx, cy + 5],
      ],
      "white",
      1.3,
    );
    const [px, py] = pts[frame];
    dot(ctx, px, py, 4.8, "#faf8ef", "#102733");
    // The same millimetre scale is used in both panels, including the 125 ms detail view.
    const nice =
      [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100]
        .filter((value) => value * scale <= 60)
        .pop() || 0.1;
    const bottom = h - 11;
    line(
      ctx,
      [
        [15, bottom - 4],
        [15, bottom],
        [15 + nice * scale, bottom],
        [15 + nice * scale, bottom - 4],
      ],
      colors.text,
      1.4,
    );
    ctx.fillStyle = colors.text;
    ctx.fillText(nice + " mm", 15, bottom - 7);
    const axes = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      tags = ["ML", "SI", "AP"];
    ctx.font = "10px Arial, sans-serif";
    axes.forEach((axis, i) => {
      const [dx, dy] = project(axis);
      if (Math.hypot(dx, dy) < 0.15) return;
      const ax = w - 48,
        ay = h - 35,
        ex = ax + dx * 20,
        ey = ay + dy * 20;
      line(
        ctx,
        [
          [ax, ay],
          [ex, ey],
        ],
        "#7294a1",
      );
      ctx.fillText(tags[i], ex + (dx > 0 ? 2 : -15), ey + (dy > 0.3 ? 9 : -3));
    });
  }
}

function drawVoltage(key, limit) {
  const { ctx, w, h } = surface($("trace-" + key)),
    s = sessions[key];
  const left = 38,
    right = w - 12,
    top = 18,
    bottom = h - 25,
    middle = (bottom + top) / 2;
  const sx = (f) => left + (f * (right - left)) / last,
    sy = (v) => middle - (v * (middle - top)) / limit;
  ctx.fillStyle = "#f6e9dc";
  ctx.fillRect(
    sx(startToCutoff + 0.5),
    top,
    right - sx(startToCutoff + 0.5),
    bottom - top,
  );
  for (const v of [limit, 0, -limit]) {
    line(
      ctx,
      [
        [left, sy(v)],
        [right, sy(v)],
      ],
      "#d2d9d8",
    );
    ctx.textAlign = "right";
    ctx.fillStyle = "#4d6168";
    ctx.fillText(String(v), left - 5, sy(v) + 4);
  }
  ctx.textAlign = "left";
  const cue = s.loggedSample - s.start;
  ctx.setLineDash([3, 3]);
  line(
    ctx,
    [
      [sx(cue), top],
      [sx(cue), bottom],
    ],
    "#79959d",
  );
  ctx.setLineDash([]);
  ctx.fillStyle = "#435d67";
  ctx.fillText("cue", sx(cue) - 8, top - 4);
  line(
    ctx,
    [
      [sx(startToCutoff), top],
      [sx(startToCutoff), bottom],
    ],
    "#88694f",
  );
  ctx.fillText("cutoff", Math.min(right - 30, sx(startToCutoff) - 10), top - 4);
  line(
    ctx,
    s.voltage.map((row, i) => [sx(i), sy(row[channel])]),
    "#157795",
    1.65,
  );
  const current = sx(frame);
  line(
    ctx,
    [
      [current, top],
      [current, bottom],
    ],
    "#172c32",
    1,
  );
  if (frame <= startToCutoff)
    dot(ctx, current, sy(s.voltage[frame][channel]), 3.4, "#172c32", "#fff");
  ctx.fillStyle = "#435d67";
  ctx.fillText("−621 ms", left, bottom + 16);
  ctx.textAlign = "right";
  ctx.fillText("+125 ms", right, bottom + 16);
  $("value-" + key).textContent =
    frame <= startToCutoff
      ? signed(s.voltage[frame][channel]) + " µV"
      : "After cutoff · RMS in table";
}
function refresh() {
  $("clock").value = frame;
  const ms = ((frame - startToCutoff) * 1000) / rate;
  $("rel").textContent = signed(ms, 3) + " ms";
  $("phase").textContent =
    frame < firstAfterCue
      ? "Before visual cue"
      : frame === startToCutoff
        ? "Observation cutoff"
        : frame < startToCutoff
          ? "After cue · observed history"
          : "Measured follow-up";
  $("clock").setAttribute(
    "aria-valuetext",
    $("phase").textContent +
      ", " +
      $("rel").textContent +
      " relative to cutoff",
  );
  $("prev").disabled = frame === 0;
  $("next").disabled = frame === last;
  for (const key of postures) {
    const s = sessions[key],
      el = $("path-" + key).parentElement,
      sample = s.start + frame,
      t = sample / rate;
    el.querySelector("[data-sample]").textContent = "Sample " + sample;
    el.querySelector("[data-displacement]").textContent =
      "From cutoff (mm)   " +
      paths[key][frame].map((v) => signed(v)).join("  /  ");
    el.querySelector("[data-source]").textContent =
      "Source ML / SI / AP (mm)   " +
      s.position[frame].map((v) => signed(v)).join("  /  ");
    el.querySelector("[data-time]").textContent =
      t.toFixed(6) +
      " s in recording · " +
      signed((t - s.onsetSeconds) * 1000, 3) +
      " ms from logged cue";
  }
  updateLimits();
  const limit = Math.max(
    5,
    Math.ceil(
      Math.max(
        ...postures.flatMap((key) =>
          sessions[key].voltage.map((v) => Math.abs(v[channel])),
        ),
      ) / 5,
    ) * 5,
  );
  paintPaths();
  for (const key of postures) drawVoltage(key, limit);
  $("localization").textContent =
    labels[channel] +
    " · " +
    regions[channel % 4] +
    ". Both traces use the same ±" +
    limit +
    " µV scale.";
  Array.from($("rms").rows).forEach((row, i) =>
    row.classList.toggle("sel", i === channel),
  );
}
function stop() {
  cancelAnimationFrame(playID);
  playID = 0;
  $("play").textContent = "Play at ¼ speed";
}
function selectFrame(target) {
  frame = Math.max(0, Math.min(last, target));
  if (frame < startToCutoff) $("extent").value = "all";
  refresh();
}
function jump(target) {
  stop();
  selectFrame(target);
}
$("clock").oninput = () => jump(+$("clock").value);
$("prev").onclick = () => jump(frame - 1);
$("next").onclick = () => jump(frame + 1);
$("cue").onclick = () => jump(firstAfterCue);
$("cutoff").onclick = () => jump(startToCutoff);
$("end").onclick = () => jump(last);
$("extent").onchange = () =>
  jump($("extent").value === "after" ? Math.max(startToCutoff, frame) : frame);
$("play").onclick = () => {
  if (playID) {
    stop();
    return;
  }
  if (frame === last)
    selectFrame($("extent").value === "after" ? startToCutoff : 0);
  const start = performance.now(),
    began = frame;
  $("play").textContent = "Pause";
  function tick(now) {
    const target = Math.min(
      last,
      began + Math.floor(((now - start) * rate) / 4000),
    );
    if (frame !== target) selectFrame(target);
    if (target === last) stop();
    else playID = requestAnimationFrame(tick);
  }
  playID = requestAnimationFrame(tick);
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
$("channel").onchange = () => {
  channel = +$("channel").value;
  refresh();
};
$("source").onchange = updateLimits;
$("goForm").onsubmit = (e) => {
  e.preventDefault();
  jump(Number($("absolute").value) - sessions[$("source").value].start);
};
$("view").onchange = () => {
  if ($("view").value === "orbit") {
    yaw = -0.68;
    pitch = 0.32;
  }
  paintPaths();
};
function rotate(dx, dy) {
  const preset = $("view").value;
  if (preset !== "orbit") {
    [yaw, pitch] = {
      mlsi: [0, 0],
      mlap: [0, -Math.PI / 2],
      apsi: [Math.PI / 2, 0],
    }[preset];
    $("view").value = "orbit";
  }
  yaw += dx;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch + dy));
  paintPaths();
}
for (const key of postures) {
  const c = $("path-" + key);
  let drag = null;
  c.onpointerdown = (e) => {
    if (!e.isPrimary) return;
    drag = [e.clientX, e.clientY];
    c.setPointerCapture(e.pointerId);
  };
  c.onpointermove = (e) => {
    if (!drag || !e.isPrimary) return;
    rotate((e.clientX - drag[0]) * 0.008, (e.clientY - drag[1]) * 0.008);
    drag = [e.clientX, e.clientY];
  };
  c.onlostpointercapture = () => {
    drag = null;
  };
  c.onkeydown = (e) => {
    const d = {
      ArrowLeft: [-0.12, 0],
      ArrowRight: [0.12, 0],
      ArrowUp: [0, -0.12],
      ArrowDown: [0, 0.12],
    }[e.key];
    if (d) {
      e.preventDefault();
      rotate(...d);
    }
  };
}
if (location.protocol === "file:") $("bundle").hidden = true;
new ResizeObserver(refresh).observe($("paths"));
refresh();
