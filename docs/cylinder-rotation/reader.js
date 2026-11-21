(function () {
  const el = (id) => document.getElementById(id);
  const hand = el("hand"),
    target = el("target"),
    channel = el("channel"),
    clock = el("clock"),
    cutoff = el("cutoff");
  const trace = el("trace"),
    scene = cylinderScene(el("scene"));
  let clip,
    frame = 0,
    raf = 0,
    start = 0,
    anchor = 0,
    peak = 0;
  const colors = ["#b75125", "#137c72", "#735aac"];
  const fixed = (n, dp = 3) =>
    Math.abs(n) < 0.5 * 10 ** -dp
      ? (0).toFixed(dp)
      : n.toFixed(dp).replace("-", "−");
  const sec = (t) => t.toFixed(2) + " s";
  for (let i = 1; i <= 9; i++) target.add(new Option("Target " + i, i));
  target.value = "4";
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    el("play").textContent = "▶ Play";
    el("play").setAttribute("aria-label", "Play the recording");
  }
  function setFrame(i) {
    frame = Math.max(0, Math.min(clip.rows.length - 1, i));
    clock.value = frame;
    const row = clip.rows[frame],
      gyro = channel.value === "gyro",
      v = gyro ? row.slice(4, 7) : row.slice(1, 4);
    scene.draw(row, clip.rows[0].slice(7), channel.value, true);
    const wh = el("readings");
    if (!wh.children.length)
      for (const letter of "XYZ") {
        const label = document.createElement("div");
        const key = document.createElement("span");
        key.className = "a" + letter.toLowerCase();
        key.textContent = letter;
        label.append(key, document.createElement("b"));
        wh.append(label);
      }
    v.forEach((x, i) => (wh.children[i].lastChild.textContent = fixed(x)));
    el("clockRead").textContent = sec(row[0]);
    clock.setAttribute("aria-valuetext", sec(row[0]));
    el("prev").disabled = frame === 0;
    el("next").disabled = frame === clip.rows.length - 1;
    drawTrace();
  }
  function changeChannel() {
    const gyro = channel.value === "gyro";
    el("legendDot").style.background = gyro ? "#ffae74" : "#91e0d8";
    el("legendText").textContent = gyro ? "Angular velocity" : "Acceleration";
    el("traceTitle").textContent = gyro
      ? "Angular velocity (rad/s)"
      : "Acceleration (m/s²)";
    el("vectorHint").textContent = gyro
      ? "The arrow points along the measured axis of rotation. Its length follows the rate."
      : "Acceleration includes gravity. An upright, resting sensor still gives a reading.";
    setFrame(frame);
  }
  function forecast(jump = false) {
    const w = clip.windows[cutoff.selectedIndex],
      t = w.cutoff_ms / 1000;
    el("windowText").textContent =
      "Input " +
      sec(t - 0.2) +
      " – " +
      sec(t - 0.01) +
      ". Outcome " +
      sec(t) +
      " – " +
      sec(t + 0.09) +
      ".";
    el("compare").replaceChildren();
    "XYZ".split("").forEach((axis, i) => {
      const row = document.createElement("tr"),
        h = document.createElement("th");
      h.scope = "row";
      h.textContent = axis;
      h.className = "a" + axis.toLowerCase();
      row.append(h);
      for (const v of [w.measured[i], w.forecast[i]]) {
        const td = document.createElement("td");
        td.textContent = fixed(v);
        row.append(td);
      }
      el("compare").append(row);
    });
    const err = Math.hypot(...w.measured.map((v, i) => v - w.forecast[i]));
    el("miss").textContent = "Three-axis error  " + fixed(err) + " rad/s";
    if (jump) {
      stop();
      setFrame(w.cutoff_ms / 10);
    }
  }
  function changeClip() {
    stop();
    clip = CYLINDER.clips.find(
      (c) => c.hand === hand.value && c.target === +target.value,
    );
    el("clipLabel").textContent =
      hand.selectedOptions[0].text + " · " + target.selectedOptions[0].text;
    el("modelLink").href = "models/" + clip.hand + "-" + clip.target + ".glb";
    el("member").textContent =
      "Original file · " + clip.member.split("/").pop();
    clock.max = clip.rows.length - 1;
    cutoff.replaceChildren();
    clip.windows.forEach((w) =>
      cutoff.add(new Option(sec(w.cutoff_ms / 1000), w.cutoff_ms)),
    );
    peak = clip.rows.reduce(
      (best, r, i, rows) =>
        Math.hypot(...r.slice(4, 7)) > Math.hypot(...rows[best].slice(4, 7))
          ? i
          : best,
      0,
    );
    cutoff.selectedIndex = clip.windows.reduce(
      (a, w, i, arr) =>
        Math.abs(w.cutoff_ms / 10 - peak) <
        Math.abs(arr[a].cutoff_ms / 10 - peak)
          ? i
          : a,
      0,
    );
    forecast();
    frame = peak;
    changeChannel();
  }
  function drawTrace() {
    if (!clip) return;
    const width = trace.clientWidth,
      height = trace.clientHeight,
      r = Math.min(window.devicePixelRatio || 1, 2);
    if (
      trace.width !== Math.round(width * r) ||
      trace.height !== Math.round(height * r)
    ) {
      trace.width = Math.round(width * r);
      trace.height = Math.round(height * r);
    }
    const ctx = trace.getContext("2d");
    ctx.setTransform(r, 0, 0, r, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const left = 41,
      right = width - 12,
      top = 9,
      bottom = height - 24;
    const startCol = channel.value === "gyro" ? 4 : 1;
    let max = 0;
    for (const row of clip.rows) {
      for (let j = 0; j < 3; j++)
        max = Math.max(max, Math.abs(row[startCol + j]));
    }
    const step = max > 10 ? 2 : max > 3 ? 1 : 0.5;
    max = Math.max(step, Math.ceil(max / step) * step);
    const x = (i) => left + ((right - left) * i) / (clip.rows.length - 1),
      y = (v) => (top + bottom) / 2 - (v * (bottom - top)) / (2 * max);
    const end = clip.windows[cutoff.selectedIndex].cutoff_ms / 10;
    const bands = [
      [end - 20, end, "#e9f1ec"],
      [end, end + 10, "#f6e7d2"],
    ];
    for (const [a, b, fill] of bands) {
      ctx.fillStyle = fill;
      ctx.fillRect(x(a), top, x(b) - x(a), bottom - top);
    }
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#586564";
    ctx.textAlign = "right";
    for (const val of [-max, 0, max]) {
      ctx.beginPath();
      ctx.moveTo(left, y(val));
      ctx.lineTo(right, y(val));
      ctx.strokeStyle = val === 0 ? "#aab3b0" : "#dce1dc";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillText(
        fixed(val, Number.isInteger(val) ? 0 : 1),
        left - 8,
        y(val) + 3,
      );
    }
    for (let axis = 0; axis < 3; axis++) {
      ctx.beginPath();
      clip.rows.forEach((row, i) =>
        i
          ? ctx.lineTo(x(i), y(row[startCol + axis]))
          : ctx.moveTo(x(i), y(row[startCol + axis])),
      );
      ctx.strokeStyle = colors[axis];
      ctx.lineWidth = 1.65;
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#586564";
    for (let t = 0; t <= Math.floor(clip.rows.at(-1)[0]); t++) {
      ctx.fillText(t + " s", x(t * 100), height - 5);
    }
    const xpos = x(frame);
    ctx.strokeStyle = "#343d39";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xpos, top);
    ctx.lineTo(xpos, bottom);
    ctx.stroke();
    for (let axis = 0; axis < 3; axis++) {
      ctx.beginPath();
      ctx.arc(xpos, y(clip.rows[frame][startCol + axis]), 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = colors[axis];
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.stroke();
    }
  }
  trace.addEventListener("pointerdown", (e) => {
    const left = e.clientX - trace.getBoundingClientRect().left;
    stop();
    setFrame(
      Math.round(
        ((left - 41) / (trace.clientWidth - 53)) * (clip.rows.length - 1),
      ),
    );
  });
  trace.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      stop();
      setFrame(frame + (e.key === "ArrowRight" ? 1 : -1));
    }
  });
  el("play").onclick = () => {
    if (raf) {
      stop();
      return;
    }
    if (frame === clip.rows.length - 1) setFrame(0);
    anchor = frame;
    start = performance.now();
    el("play").textContent = "Ⅱ Pause";
    el("play").setAttribute("aria-label", "Pause the recording");
    function tick(now) {
      const f = Math.min(
        clip.rows.length - 1,
        anchor + Math.floor((now - start) / 10),
      );
      if (f !== frame) setFrame(f);
      if (frame === clip.rows.length - 1) stop();
      else raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  };
  for (const [id, fn] of [
    ["prev", () => frame - 1],
    ["next", () => frame + 1],
    ["peak", () => peak],
  ]) {
    el(id).onclick = () => {
      stop();
      setFrame(fn());
    };
  }
  clock.oninput = () => {
    stop();
    setFrame(Number(clock.value));
  };
  hand.onchange = target.onchange = changeClip;
  channel.onchange = changeChannel;
  cutoff.onchange = () => forecast(true);
  el("resetView").onclick = scene.reset;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  new ResizeObserver(drawTrace).observe(trace);
  changeClip();
})();
