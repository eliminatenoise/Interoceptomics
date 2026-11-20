(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const trials = window.REACH_RECORDS.trials;
  const handName = (key) => (key === "L" ? "Left" : "Right");
  const label = (t) => `${handName(t.hand)} hand · target ${t.target}`;
  const scene = new ReachScene($("scene"), (mode) =>
    document
      .querySelectorAll("[data-view]")
      .forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === mode)),
  );
  const first =
    trials.find((t) => t.hand === "R" && t.target === 5) || trials[0];
  let trial = first,
    comparison,
    frame = 0,
    request = null,
    anchor = 0,
    origin = 0;
  function stop() {
    if (request !== null) cancelAnimationFrame(request);
    request = null;
    $("play").textContent =
      trial && frame === trial.frames.length - 1 ? "↺ Replay" : "▶ Play";
  }
  function sample(index) {
    frame = Math.max(0, Math.min(index, trial.frames.length - 1));
    const row = trial.frames[frame],
      duration = trial.frames.at(-1)[0];
    $("sample").value = frame;
    $("sample").setAttribute(
      "aria-valuetext",
      `Sample ${frame + 1}, ${row[0].toFixed(3)} seconds`,
    );
    $("clock").textContent = `${row[0].toFixed(3)} / ${duration.toFixed(3)} s`;
    $("timeValue").textContent = `${row[0].toFixed(3)} s`;
    for (let i = 1; i <= 3; i++)
      $(["", "xValue", "yValue", "zValue"][i]).textContent =
        row[i] === null ? "Missing" : `${row[i].toFixed(1)} mm`;
    $("prev").disabled = frame === 0;
    $("next").disabled = frame === trial.frames.length - 1;
    $("readout").textContent =
      `${label(trial)}. Sample ${frame + 1} of ${trial.frames.length}. ${row[1] === null ? "The selected optical marker position is missing here." : "Position at the selected sample."}`;
    scene.frame = frame;
    scene.draw();
    if (request === null)
      $("play").textContent =
        frame === trial.frames.length - 1 ? "↺ Replay" : "▶ Play";
  }
  function changeOverlay() {
    const key = $("compare").value;
    comparison = trials.find((t) => t.file === key);
    $("comparisonKey").hidden = !comparison;
    $("comparisonLabel").textContent = comparison ? label(comparison) : "";
    scene.setTrials(trial, comparison);
    scene.frame = frame;
    scene.draw();
  }
  function choose(t) {
    stop();
    const last = trial,
      previous = comparison;
    trial = t;
    document
      .querySelectorAll("[data-hand]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", b.dataset.hand === t.hand),
      );
    for (const b of $("targets").children) {
      const n = Number(b.dataset.target);
      b.disabled = !trials.some((v) => v.hand === t.hand && v.target === n);
      b.setAttribute("aria-pressed", n === t.target);
    }
    const alternatives = trials.filter((x) => x !== t);
    $("compare").replaceChildren(
      new Option("No overlay", ""),
      ...alternatives.map((x) => new Option(label(x), x.file)),
    );
    let other;
    if (
      !last ||
      (previous &&
        previous.hand !== last.hand &&
        previous.target === last.target)
    )
      other = alternatives.find(
        (x) => x.hand !== t.hand && x.target === t.target,
      );
    else if (previous && previous !== t) other = previous;
    if (other) $("compare").value = other.file;
    $("primaryLabel").textContent = label(t);
    $("model").href = `models/${t.file}.glb`;
    $("model").textContent = `Download animated GLB · ${label(t)}`;
    $("sample").max = t.frames.length - 1;
    frame = t.frames.reduce(
      (i, r, j, rows) =>
        r[3] !== null && (rows[i][3] === null || r[3] > rows[i][3]) ? j : i,
      0,
    );
    changeOverlay();
    sample(frame);
  }
  function tick(now) {
    const t = origin + ((now - anchor) / 1000) * Number($("speed").value);
    let lo = frame,
      hi = trial.frames.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (trial.frames[mid][0] <= t) lo = mid + 1;
      else hi = mid;
    }
    sample(Math.max(0, lo - 1));
    if (frame === trial.frames.length - 1) {
      stop();
      return;
    }
    request = requestAnimationFrame(tick);
  }
  $("play").onclick = () => {
    if (request !== null) {
      stop();
      return;
    }
    if (frame === trial.frames.length - 1) sample(0);
    origin = trial.frames[frame][0];
    anchor = performance.now();
    request = requestAnimationFrame(tick);
    $("play").textContent = "Ⅱ Pause";
  };
  $("restart").onclick = () => {
    stop();
    sample(0);
  };
  $("motion").onclick = () => {
    stop();
    sample(trial.frames.findIndex((r) => r[0] >= trial.crossing_s));
  };
  $("speed").onchange = () => {
    if (request !== null) {
      origin = trial.frames[frame][0];
      anchor = performance.now();
    }
  };
  $("sample").oninput = (e) => {
    stop();
    sample(Number(e.target.value));
  };
  $("prev").onclick = () => {
    stop();
    sample(frame - 1);
  };
  $("next").onclick = () => {
    stop();
    sample(frame + 1);
  };
  $("compare").onchange = changeOverlay;
  $("reset").onclick = () => scene.setView("orbit");
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => (b.onclick = () => scene.setView(b.dataset.view)));
  document.querySelectorAll("[data-hand]").forEach(
    (b) =>
      (b.onclick = () => {
        const t =
          trials.find(
            (x) => x.hand === b.dataset.hand && x.target === trial.target,
          ) || trials.find((x) => x.hand === b.dataset.hand);
        if (t && t !== trial) choose(t);
      }),
  );
  for (let n = 1; n <= 9; n++) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.target = n;
    b.textContent = n;
    const angle = ((9 - n) * Math.PI) / 8;
    b.style.left = `${50 + 42 * Math.cos(angle)}%`;
    b.style.top = `${83 - 68 * Math.sin(angle)}%`;
    b.setAttribute("aria-label", `Target ${n}`);
    b.onclick = () => {
      const t = trials.find((x) => x.hand === trial.hand && x.target === n);
      if (t && t !== trial) choose(t);
    };
    $("targets").append(b);
  }
  if (location.protocol === "file:") $("offlineDownload").hidden = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  trial = null;
  choose(first);
})();
