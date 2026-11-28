const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
function group(values, fn) {
  const groups = new Map();
  for (const row of values) {
    const id = fn(row);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  return [...groups.values()];
}

export function compare(study, participant, gesture, speed, finger) {
  const rows = study.conditions.filter(row =>
    (!participant || row.participant === participant) && (!gesture || row.gesture === gesture) &&
    (!speed || row.speed === speed));
  if (!rows.length) return null;
  const people = group(rows, r => r.participant);
  const values = {};
  for (const {key} of study.methods) {
    const rowValue = r => finger === "" ? mean(r.errors_deg[key]) : r.errors_deg[key][Number(finger)];
    values[key] = mean(people.map(person =>
      mean(group(person, r => r.gesture).map(movement => mean(movement.map(rowValue))))));
  }
  return {values, people: people.length, recordings: rows.length,
    forecasts: rows.reduce((sum, r) => sum + r.scored, 0)};
}

async function openReader() {
  const response = await fetch("results.json");
  if (!response.ok) throw new Error("The grouped results could not be loaded.");
  const study = await response.json();
  const get = id => document.getElementById(id);
  document.querySelector("[data-stage-back]").addEventListener("click", event => {
    if (window.parent === window) return;
    try {
      const parentDoc = window.parent.document;
      const frame = window.frameElement;
      const holder = parentDoc.getElementById("companion-frame");
      const button = parentDoc.querySelector('#companions button[aria-controls="companion-frame"]');
      if (frame && holder?.contains(frame) && button?.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        button.click();
      }
    } catch {
      // The ordinary link also works when the outer page has another origin.
    }
  });
  for (const [key, name] of Object.entries(study.gestures)) get("gesture").add(new Option(name, key));
  study.fingers.forEach((name, i) => get("finger").add(new Option(name, String(i))));

  function show() {
    const out = compare(study, get("person").value, get("gesture").value, get("speed").value, get("finger").value);
    if (!out) throw new Error("This selection has no scored recording.");
    const noun = (n, one, many) => n === 1 ? one : many;
    get("scope").textContent = `${out.people} ${noun(out.people,"participant","participants")} · ${out.recordings} ${noun(out.recordings,"recording","recordings")} · ${out.forecasts.toLocaleString("en-US")} scored forecast times.`;
    const largest = Math.max(...Object.values(out.values), 1e-9);
    const body = get("bars");
    body.replaceChildren();
    for (const method of study.methods) {
      const tr = document.createElement("tr");
      tr.dataset.method = method.key;
      const label = document.createElement("th");
      label.scope = "row";
      label.textContent = method.label;
      const cell = document.createElement("td");
      cell.className = "metric";
      cell.dataset.value = String(out.values[method.key]);
      cell.style.setProperty("--bar", 100 * out.values[method.key] / largest + "%");
      cell.textContent = out.values[method.key].toFixed(2) + "°";
      tr.append(label, cell);
      body.append(tr);
    }
  }
  get("gesture").addEventListener("change", () => {
    const current = get("gesture").value;
    const select = get("speed");
    select.replaceChildren(new Option("All recorded speeds", ""));
    const available = new Set(study.conditions.filter(r => r.gesture === current).map(r => r.speed));
    for (const value of ["Slow","Medium","Fast"]) {
      if (available.has(value)) select.add(new Option(value, value));
    }
    select.disabled = !current;
    show();
  });
  for (const id of ["person","speed","finger"]) get(id).addEventListener("change", show);
  show();
}

if (typeof document !== "undefined" && document.getElementById("bars")) {
  openReader().catch(() => {
    document.getElementById("scope").textContent = "The result file could not be opened. Use the stage guide launcher, then open this comparison again.";
  });
}
