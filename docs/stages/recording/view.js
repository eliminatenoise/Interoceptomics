// Only an exact, reviewed packet may supply values. The accelerometer and forecast never drive the illustrated avatar.
const packetHash = '48c0ed4e6f6db73a6646680d0682bb635dcff5195578666e3766b1400a6418e2';
const $ = id => document.getElementById(id);
let packet;

export function selectWalkingLimb(limb) {
  $('sensor').value = limb.replace('-', '_');
  if (packet) draw();
}

function draw() {
  const sensor = $('sensor');
  const record = packet.examples[sensor.value];
  const index = Number($('sample').value);
  const time = record.input.timestamps_ms[index];
  const target = record.forecast.target_timestamp_ms;
  const forecast = record.forecast[$('forecast').value];
  const actual = record.measured_target;

  $('sample-ms').textContent = time + ' ms';
  $('sensor-caption').textContent = sensor.selectedOptions[0].textContent + ' · acceleration in the sensor’s original units';
  $('sensor-values').replaceChildren();
  for (const [label, values] of [
    ['Input at ' + time + ' ms', record.input.samples[index]],
    ['Forecast at ' + target + ' ms', forecast],
    ['Measured at ' + target + ' ms', actual],
    ['Size of the miss', actual.map((v, i) => Math.abs(forecast[i] - v))]
  ]) {
    const tr = document.createElement('tr');
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = label;
    tr.append(heading);
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value.toFixed(3);
      tr.append(cell);
    }
    $('sensor-values').append(tr);
  }
}

$('open-recording').addEventListener('click', async () => {
  const button = $('open-recording');
  const panel = $('sample-panel');
  if (!panel.hidden) {
    panel.hidden = true;
    button.textContent = 'Open the walking recording';
    button.setAttribute('aria-expanded', 'false');
    return;
  }
  button.disabled = true;
  try {
    if (!packet) {
      const response = await fetch(new URL('./walking.json', import.meta.url));
      if (!response.ok) throw Error('Unavailable packet');
      const bytes = await response.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hex = Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2,'0')).join('');
      if (hex !== packetHash) throw Error('Unrecognised packet');
      packet = JSON.parse(new TextDecoder().decode(bytes));
    }
    draw();
    panel.hidden = false;
    button.textContent = 'Close the walking recording';
    button.setAttribute('aria-expanded','true');
    $('sample-status').textContent = '';
  } catch {
    packet = undefined;
    panel.hidden = true;
    $('sensor-values').replaceChildren();
    $('sample-status').textContent = 'The recording could not be verified. Open the guide through HTTPS or a local server with its original walking.json file.';
  } finally {
    button.disabled = false;
  }
});
for (const id of ['sensor','forecast','sample']) $(id).addEventListener('input',draw);
