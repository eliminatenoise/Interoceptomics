import { forecastBothFeet, forecastFoot } from "./pressure.mjs";

const get = id => document.getElementById(id);
const foot = get("foot");
const model = get("model");
const time = get("time");
const input = get("reading");
const status = get("status");
const canvas = get("history");
const labels = ["Big toe", "Other toes", "First metatarsal", "Third metatarsal",
  "Fifth metatarsal", "Arch", "Left heel pad", "Right heel pad"];
const groups = [
  ["Toes", [0, 1]], ["Front of the foot", [2, 3, 4]], ["Arch", [5]], ["Heel", [6, 7]],
];
const methods = [
  ["last sample", "Carry the latest reading forward"],
  ["extend recent trend", "Extend the recent trend"],
  ["same-foot regularized linear", "Same-foot linear"],
  ["both-feet regularized linear", "Both-feet linear"],
  ["both-feet recurrent", "Both-feet recurrent"],
  ["same-foot recurrent", "Same-foot recurrent"],
];

function generatedHistory() {
  return Array.from({ length: 13 }, (_, frame) =>
    Array.from({ length: 16 }, (_, channel) => {
      const index = channel % 8;
      const phase = frame / 12 + (channel < 8 ? 0.12 : 0.57);
      const wave = Math.max(0, Math.sin(phase * Math.PI - index * 0.13));
      const pressure = 14 + (146 + 15 * index) * wave ** 2;
      return Math.round(pressure * 100) / 100;
    })
  );
}

function draw(points, future) {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  const start = 74, end = width - 22, top = 14, bottom = height - 31;
  const low = Math.floor(Math.min(0, future, ...points) / 50) * 50;
  const high = Math.ceil(Math.max(50, future, ...points) / 50) * 50;
  if (!Number.isFinite(high - low)) return;
  const x = relativeMs => start + (end - start) * (relativeMs + 200) / 300;
  const y = value => bottom - (bottom - top) * (value - low) / (high - low);
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "#355446";
  for (const value of [low, high]) {
    ctx.strokeStyle = "#bdcfc3";
    ctx.beginPath();
    ctx.moveTo(start, y(value));
    ctx.lineTo(end, y(value));
    ctx.stroke();
    ctx.fillText(`${value} mbar`, start - 7, y(value) + 4);
  }
  ctx.textAlign = "center";
  ctx.fillText("−200 ms", x(-200), height - 10);
  ctx.fillText("Latest", x(0), height - 10);
  ctx.fillText("+100 ms", x(100), height - 10);
  ctx.strokeStyle = "#174f3b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((value, i) => {
    const at = x(i * 1000 / 60 - 200);
    if (i === 0) ctx.moveTo(at, y(value));
    else ctx.lineTo(at, y(value));
  });
  ctx.stroke();
  ctx.fillStyle = "#16488a";
  ctx.beginPath();
  ctx.arc(x(100), y(future), 5, 0, 2 * Math.PI);
  ctx.fill();
}

async function readJSON(name) {
  const reply = await fetch(new URL(name, import.meta.url));
  if (!reply.ok) throw new Error(`Could not load ${name}`);
  return reply.json();
}

function bench(data) {
  const body = get("benchmark").tBodies[0];
  for (const [name, label] of methods) {
    const row = body.insertRow();
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = label;
    row.append(heading);
    row.insertCell().textContent = data.mean_absolute_error_mbar[name][0].toFixed(2);
  }
  const test = data.final_test;
  get("benchmark-scope").textContent = `These errors come from ${test.windows.toLocaleString("en-US")} forecasts in ${test.courses} recordings from ${test.people} people held aside for testing. The recordings were aligned and resampled offline.`;
}

async function mount() {
  const [weights, data] = await Promise.all([readJSON("pressure-model.json"), readJSON("results.json")]);
  bench(data);
  let history = generatedHistory();
  let pad = 6;
  const buttons = [];
  const footOffset = () => foot.value === "left" ? 0 : 8;
  const channel = () => footOffset() + pad;
  const setInput = () => {
    input.value = String(history[Number(time.value)][channel()]);
    input.removeAttribute("aria-invalid");
    status.textContent = "";
  };
  function render() {
    const series = history.map(row => row[channel()]);
    const future = model.value === "both"
      ? forecastBothFeet(history, weights)[channel()]
      : forecastFoot(history.map(row => row.slice(footOffset(), footOffset() + 8)), foot.value, weights)[pad];
    for (const [id, value] of [["latest", series.at(-1)], ["prediction", future]]) {
      const node = get(id);
      if (!Number.isFinite(value)) throw new Error("The example pressure is outside the numeric range");
      node.dataset.value = String(value);
      node.textContent = `${value.toFixed(1)} mbar`;
    }
    get("pad-label").textContent = `${labels[pad]}. The green line shows earlier readings. The blue dot shows the forecast.`;
    for (const [index, button] of buttons) button.setAttribute("aria-pressed", String(index === pad));
    draw(series, future);
  }

  for (const [name, indices] of groups) {
    const group = document.createElement("section");
    group.className = "sensor-group";
    const label = document.createElement("h3");
    label.textContent = name;
    group.append(label);
    for (const index of indices) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = labels[index];
      button.addEventListener("click", () => { pad = index; setInput(); render(); });
      buttons.push([index, button]);
      group.append(button);
    }
    get("pads").append(group);
  }
  for (let index = 0; index < 13; index++) {
    const offset = (index - 12) / 60 * 1000;
    time.add(new Option(index === 12 ? "Latest reading" : `${offset.toFixed(1)} ms`, String(index)));
  }
  time.value = "12";
  time.addEventListener("change", setInput);
  foot.addEventListener("change", () => { setInput(); render(); });
  model.addEventListener("change", () => { setInput(); render(); });
  input.addEventListener("input", () => {
    const value = input.valueAsNumber;
    if (!Number.isFinite(value) || value < 0) {
      input.setAttribute("aria-invalid", "true");
      status.textContent = "Enter a nonnegative pressure in millibar. The previous reading is still in use.";
      return;
    }
    const row = history[Number(time.value)], index = channel();
    const previous = row[index];
    row[index] = value;
    try {
      render();
      status.textContent = "Forecast updated.";
      input.removeAttribute("aria-invalid");
    } catch {
      row[index] = previous;
      render();
      status.textContent = "That pressure is outside the numeric range. The previous reading is still in use.";
      input.setAttribute("aria-invalid", "true");
    }
  });
  get("restore").addEventListener("click", () => {
    history = generatedHistory();
    setInput();
    render();
    status.textContent = "The generated readings have been restored.";
  });
  window.addEventListener("resize", render);
  setInput();
  render();
  status.textContent = "";
}

mount().catch(() => { status.textContent = "The exercise could not load its model files. Open the Stage Guide through its launcher."; });
