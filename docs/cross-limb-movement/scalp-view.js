"use strict";

const scalpMeasures = {mean: "Signed mean", rms: "Root mean square"};
const scalpControls = {};
const scalpTickFormat = new Intl.NumberFormat("en", {maximumSignificantDigits: 3});

function scalpPanel(key) {
  const data = scalpExcerpts[key];
  const title = captions[key].title;
  const panel = document.createElement("section");
  panel.className = "scalp-panel";
  panel.setAttribute("aria-labelledby", key + "-scalp-title");
  const clockNote = key === "wrist"
    ? "The cap recorded at 500 Hz. Trimming both window edges allows for the reported 2 ms synchronization uncertainty. The released voltage scale is unverified."
    : "The cap recorded at 512 Hz. The released signal uses a 256 Hz clock and a common-median reference. Here µV means microvolts.";
  const source = key === "wrist" ? "WAY grasp and lift" : "BioSemi 128 · beam walking";
  panel.innerHTML = `
    <h3 id="${key}-scalp-title">What did the scalp electrodes pick up?</h3>
    <p>Choose a contact to follow its voltage through the 625 ms before cutoff. Eye movements, muscles and motion can also reach these electrodes.</p>
    <div class="scalp-layout">
      <div class="scalp-map" role="group" aria-label="${title} scalp contacts, viewed from above">
        <div class="cap-outline" aria-hidden="true"><i></i></div>
        <span class="head-front" aria-hidden="true">Front</span>
        <span class="side-left" aria-hidden="true">L</span><span class="side-right" aria-hidden="true">R</span>
        <div class="contacts"></div>
      </div>
      <div class="cap-controls">
        <strong class="cap-source">${source}</strong>
        <label>Voltage summary<select id="${key}-stat"><option value="mean">Signed mean</option><option value="rms">Root mean square (RMS)</option></select></label>
        <label>Window ending at<select id="${key}-window"><option value="" disabled>Choose a time</option></select></label>
      </div>
    </div>
    <p class="cap-caption">${data.sites.filter(s => !s.missing.length).length} of 3 contacts available. ${key === "sacrum" ? "D19 (C3), A1 (Cz), B22 (C4). " : ""}Schematic cap viewed from above. Left and right belong to the wearer. Each circle marks one scalp contact.</p>
    <canvas class="scalp-chart" role="img" id="${key}-scalp-chart"></canvas>
    <p class="scalp-reading" id="${key}-scalp-reading"></p>
    <details><summary>Read the 20 measured windows</summary>
      <p>${clockNote} Signed mean keeps the voltage polarity. RMS gives its size in the same units.</p>
      <table class="samples"><caption id="${key}-scalp-caption"></caption><thead><tr>
        <th scope="col">End (ms)</th><th scope="col">Samples</th><th scope="col">Mean</th><th scope="col">RMS</th>
      </tr></thead><tbody id="${key}-scalp-bins"></tbody></table>
    </details>`;
  const controls = {panel, index: 0, buttons: [], tableSite: -1};
  scalpControls[key] = controls;
  const lookup = (id) => panel.querySelector("#" + key + "-" + id);
  const windowSelect = lookup("window");
  for (let bin = 0; bin < 20; bin++) {
    windowSelect.add(new Option(milliseconds((bin - 19) * 31.25), String(bin)));
  }
  // Every window has an exact right edge on the shared 256 Hz comparison clock.
  windowSelect.addEventListener("change", () => {
    const bin = Number(windowSelect.value);
    stop();
    $("extent").value = "all";
    $("grid").value = "comparison";
    previousHz = clockHz();
    timeline((bin - 19) * 31.25);
  });
  lookup("stat").addEventListener("change", () => drawScalp(key, now()));
  const sides = ["left", "midline", "right"];
  data.sites.forEach((site, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", siteName(site) + ", " + sides[i] + " central scalp");
    button.innerHTML = `<strong>${site.native}</strong><small></small>`;
    button.addEventListener("click", () => { controls.index = i; drawScalp(key, now()); });
    panel.querySelector(".contacts").appendChild(button);
    controls.buttons.push(button);
  });
  return panel;
}

function siteName(site) {
  return site.native === site.nominal ? site.native : site.native + " (" + site.nominal + ")";
}

function scalpTable(key, site) {
  const d = scalpExcerpts[key];
  element(key, "scalp-caption").textContent = siteName(site) + " · " + d.unit + " · 31.25 ms per window";
  element(key, "scalp-bins").replaceChildren(...d.counts.map((n, i) => {
    const tr = document.createElement("tr");
    const mean = site.mean ? signed(site.mean[i]) : "Missing";
    const rms = site.rms ? site.rms[i].toFixed(2) : "Missing";
    tr.innerHTML = `<th scope="row">${signed((i - 19) * 31.25, 2)}</th><td>${site.mean ? n : 0}</td><td>${mean}</td><td>${rms}</td>`;
    return tr;
  }));
}

function drawScalp(key, ms) {
  const data = scalpExcerpts[key], controls = scalpControls[key];
  const kind = element(key, "stat").value, site = data.sites[controls.index];
  const measure = scalpMeasures[kind], unit = data.unit;
  const active = Math.ceil((ms + 625) / 31.25) - 1;
  const inHistory = active >= 0 && active < 20;
  element(key, "window").value = inHistory ? String(active) : "";
  controls.buttons.forEach((button, i) => {
    const contact = data.sites[i], value = inHistory && contact[kind] ? contact[kind][active] : null;
    button.setAttribute("aria-pressed", String(i === controls.index));
    button.querySelector("small").textContent = value === null ? (contact.missing.length ? "missing" : "—") : (kind === "mean" ? signed(value, 1) : value.toFixed(1));
  });
  if (controls.tableSite !== controls.index) {
    scalpTable(key, site);
    controls.tableSite = controls.index;
  }
  const value = site[kind], text = element(key, "scalp-reading");
  if (!value) {
    text.textContent = siteName(site) + " is missing · " + site.missing.join(", ") + ".";
  } else if (!inHistory) {
    text.textContent = ms > 0
      ? "The scalp input ends at cutoff. Choose a window to move both clocks back to its reading."
      : "The first scalp window begins just after −625 ms. Choose a window to see its reading.";
  } else {
    const from = milliseconds(data.firstTick[active] * 1000 / data.hz);
    const to = milliseconds(data.lastTick[active] * 1000 / data.hz);
    const display = kind === "mean" ? signed(value[active]) : value[active].toFixed(2);
    text.textContent = siteName(site) + " · " + measure + " " + display + " " + unit + ". "
      + data.counts[active] + " samples from " + from + " to " + to + " in the window ending "
      + milliseconds((active - 19) * 31.25) + ".";
  }

  const canvas = element(key, "scalp-chart");
  canvas.setAttribute("aria-label", siteName(site) + " · " + measure + " across 20 input windows, " + unit + ". Values in the table below.");
  const {ctx, w, h} = canvasSize(canvas);
  const all = data.sites.flatMap(s => s[kind] || []);
  const low = Math.min(0, ...all), high = Math.max(0, ...all);
  const bottom = h - 20, top = 23, left = 48, right = w - 6;
  const y = v => bottom - (bottom - top) * (v - low) / (high - low || 1);
  const width = (right - left) / 20;
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "#405751";
  ctx.textAlign = "left";
  ctx.fillText(siteName(site) + " · " + measure + " · " + unit, 4, 12);
  ctx.fillText("−625 ms", left, h - 4);
  ctx.textAlign = "right";
  ctx.fillText("Cutoff · 0 ms", right, h - 4);
  const tickLabel = scalpTickFormat.format;
  ctx.fillText(tickLabel(high), left - 5, top + 4);
  if (high > low) ctx.fillText(tickLabel(low), left - 5, bottom + 3);
  if (low < 0 && high > 0 && y(0) > top + 11 && y(0) < bottom - 11) ctx.fillText("0", left - 5, y(0) + 3);
  ctx.textAlign = "left";
  ctx.strokeStyle = "#abbab4";
  ctx.beginPath(); ctx.moveTo(left, y(0)); ctx.lineTo(right, y(0)); ctx.stroke();
  if (value) value.forEach((v, i) => {
    ctx.fillStyle = i === active ? "#182f34" : v < 0 ? "#a04c32" : "#397574";
    ctx.fillRect(left + i * width + 1, Math.min(y(v), y(0)), Math.max(1, width - 2), Math.max(1, Math.abs(y(v) - y(0))));
  });
}

function showMuscleForecast(key, method, muscle) {
  const d = recordings[key];
  const result = scalpExcerpts[key].forecasts[method];
  const box = element(key, "muscle-forecast");
  box.hidden = !result;
  if (result) {
    const measured = formatRMS(key, d.rms.following[muscle]);
    const forecast = formatRMS(key, result.muscleRMS[muscle]);
    box.textContent = d.muscles[muscle] + " · Next 125 ms as one RMS amplitude. Measured "
      + measured + " " + d.emgUnit + " · forecast " + forecast + " " + d.emgUnit + ".";
  }
}
