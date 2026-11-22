const panel = document.getElementById("ramp-comparison");
const controls = document.getElementById("ramp-data");
const condition = document.getElementById("ramp-condition");
const outcome = document.getElementById("ramp-outcome");
const loading = document.getElementById("ramp-status");
const reading = document.getElementById("ramp-reading");
const coverage = document.getElementById("ramp-coverage");
const room = document.getElementById("ramp-room");
const floor = document.getElementById("ramp-floor");
const counts = new Intl.NumberFormat("en");

let results;
let loadingResults = false;

function showScores() {
    const impulse = outcome.value === "impulse";
    const sample = results.conditions[condition.value][outcome.value];
    const decimals = impulse ? 2 : 1;
    const numbers = new Intl.NumberFormat("en", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    const unit = impulse ? "N·s" : "mm";
    const scale = Math.max(...Object.values(results.conditions).flatMap(walk => {
        const { room, floor } = walk[outcome.value];
        return [room, floor];
    }));
    for (const [element, error] of [[room, sample.room], [floor, sample.floor]]) {
        element.value = numbers.format(error) + " " + unit;
        element.nextElementSibling.firstElementChild.style.width = ((100 * error) / scale) + "%";
    }
    const interval = results.forecast_ms + " milliseconds";
    reading.textContent = impulse
        ? "Add up upward force over " + interval + ". The result is measured in newton-seconds (N·s). This score uses forecasts made while a foot stayed on a plate for the full interval."
        : "Compare the predicted change in a heel’s position with its measured change " + interval + " later. The error is measured in millimetres (mm).";
    coverage.textContent = "Smaller errors are closer to the measurement. Both scores use the same " +
        counts.format(sample.forecasts) + " forecasts from " + sample.people +
        " people. Each person counts equally.";
}

async function loadResults() {
    if (!panel.open || loadingResults || results) return;
    loadingResults = true;
    loading.textContent = "Loading the recorded comparison…";
    try {
        const response = await fetch(new URL("ramp-results.json", import.meta.url));
        if (!response.ok) throw new Error("Ramp results could not be loaded.");
        results = await response.json();
        showScores();
        controls.hidden = false;
        loading.textContent = "";
    } catch {
        results = undefined;
        loading.textContent = "The comparison could not load. Close it and open it again to retry.";
    } finally {
        loadingResults = false;
    }
}

panel.addEventListener("toggle", loadResults);
controls.addEventListener("change", showScores);
loadResults();
