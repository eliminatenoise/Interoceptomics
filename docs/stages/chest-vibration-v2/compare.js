"use strict";

const get = id => document.getElementById(id);
const element = (name, cls, value) => {
  const node = document.createElement(name);
  if (cls) node.className = cls;
  if (value !== undefined) node.textContent = value;
  return node;
};
function format(value, places = 5) {
  return value.toFixed(places).replace("-", "−");
}
function signed(value, places = 5) {
  return (value > 0 ? "+" : "") + format(value, places);
}
function limit(value) {
  if (value === 0) return 1;
  const unit = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / unit * 2) * unit / 2;
}
function makeBar(label, score, max, isComparison) {
  const row = element("div", "bar-row");
  const heading = element("div", "bar-label");
  heading.append(element("span", "", label), element("strong", "", format(score) + " mV"));
  const track = element("div", "track");
  track.setAttribute("aria-hidden", "true");
  const fill = element("span", isComparison ? "fill comp" : "fill");
  fill.style.width = (100 * score / max) + "%";
  track.append(fill);
  row.append(heading, track);
  return row;
}
function render(data) {
  const code = get("method").value;
  const person = get("person").value;
  const fitted = data.methods[data.fitted_method];
  const other = data.methods[code];
  const fittedError = person === "mean" ? fitted.mean_rmse_mV : fitted.rmse_mV[person];
  const otherError = person === "mean" ? other.mean_rmse_mV : other.rmse_mV[person];
  const extent = limit(Math.max(fittedError, otherError));
  const who = person === "mean" ? "Mean across seven people" : "Person " + person.slice(1);
  get("definition").textContent = other.definition;
  get("chart-caption").textContent = who + " · root mean square error";
  get("bars").replaceChildren(makeBar("Version 2 · three signals", fittedError, extent, false),
                              makeBar(other.label, otherError, extent, true));
  get("axis-end").textContent = Number(extent.toPrecision(7)) + " mV";
  const difference = otherError - fittedError;
  const result = difference === 0 ? "The two errors were equal." :
    "Version 2 had " + format(Math.abs(difference)) + " mV " + (difference > 0 ? "less" : "more") + " error.";
  get("readout").textContent = who + ". " + result;
  const differences = data.people.map(id => other.rmse_mV[id] - fitted.rmse_mV[id]);
  const maxDifference = limit(Math.max(...differences.map(Math.abs)));
  const points = [];
  const rows = [];
  for (const [i, id] of data.people.entries()) {
    const d = differences[i];
    const row = element("div", "diff-row" + (id === person ? " selected" : ""));
    const track = element("div", "dtrack");
    track.setAttribute("aria-hidden", "true");
    const dot = element("span", d < 0 ? "dot left" : "dot");
    dot.style.left = (50 + 50 * d / maxDifference) + "%";
    track.append(dot);
    row.append(element("span", "", id), track, element("span", "vnum", signed(d) + " mV"));
    points.push(row);
    const tr = element("tr");
    const th = element("th", "", id);
    th.scope = "row";
    tr.append(th, ...[fitted.rmse_mV[id], other.rmse_mV[id], d].map((value, j) =>
      element("td", "", j === 2 ? signed(value) : format(value))));
    rows.push(tr);
  }
  get("differences").replaceChildren(...points);
  get("rows").replaceChildren(...rows);
  get("diff-caption").textContent = other.label + " error minus version 2 error (mV)";
  get("left-limit").textContent = "−" + Number(maxDifference.toPrecision(7));
  get("right-limit").textContent = "+" + Number(maxDifference.toPrecision(7));
  const wins = differences.filter(value => value > 0).length;
  get("cohort").textContent = "Version 2 had less error than this method for " + wins + " of seven people.";
  const pair = data.comparisons[code];
  if (pair) {
    const mv = pair.difference_mV_ci95;
    const pc = pair.reduction_percent_ci95;
    get("interval").textContent = "The mean reduction in error was " + signed(pair.mean_difference_mV) + " mV (95% interval " +
      signed(mv[0]) + " to " + signed(mv[1]) + " mV). The average of the seven individual percentage reductions was " +
      signed(pair.mean_reduction_percent, 3) + "% (95% interval " + signed(pc[0],3) + "% to " + signed(pc[1],3) +
      "%). " + (mv[0] <= 0 && mv[1] >= 0 ? "The voltage interval includes zero." : "The voltage interval lies above zero.");
  } else if (code === data.reverse_comparison.method) {
    const reverse = data.reverse_comparison;
    const [lower, upper] = reverse.difference_mV_ci95;
    get("interval").textContent = "The mean reduction in error was " + signed(-reverse.mean_difference_mV) +
      " mV (95% interval " + signed(-upper) + " to " + signed(-lower) + " mV). The interval includes zero. " +
      "The study reported this voltage contrast in the opposite direction. The signs here follow the chart.";
  } else {
    get("interval").textContent = "The average error difference was " + signed(other.mean_rmse_mV - fitted.mean_rmse_mV) +
      " mV. The published study gives no paired uncertainty interval for version 2 against this particular comparison in this direction.";
  }
}
async function start() {
  const response = await fetch("results.json");
  if (!response.ok) throw new Error("The results file could not be opened.");
  const data = await response.json();
  const order = ["T-ECG","V1R-base","C3","R-chest","R-delayed","C0","C1","C2",
                 ...Object.keys(data.methods).sort()];
  for (const code of new Set(order)) {
    if (code !== data.fitted_method) get("method").add(new Option(data.methods[code].label + " (" + code + ")", code));
  }
  get("person").add(new Option("Mean across seven people","mean"));
  for (const person of data.people) get("person").add(new Option("Person " + person.slice(1) + " (" + person + ")", person));
  for (const id of ["method","person"]) {
    get(id).disabled = false;
    get(id).addEventListener("change", () => render(data));
  }
  render(data);
}
start().catch(() => { get("readout").textContent = "The comparison data could not be loaded. In the download, open the Stage Guide using its launcher."; });
