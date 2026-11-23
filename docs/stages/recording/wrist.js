import {readPacket} from './read-packet.js';

// One public right-wrist trial. Recorded angles and model outputs stay on separate rows.
const $ = id => document.getElementById(id);
const clipHash = '578184a108d7682c37a4f409ce4cd7535b33d203007f39ca0f5d28831ffde41f';
const forecastHash = '2bd309fae885c2a2ff5b3d0d70e18e67354acbe6a28a290b5799e4a80cd4e982';
const channels = [
  {key: 'scalpC3_uV', name: 'Scalp voltage · C3', unit: 'µV', low: -60, high: 60, decimals: 0},
  {key: 'forearmM3LminusM3R_uV', name: 'Forearm voltage · M3L − M3R', unit: 'µV', low: -250, high: 250, decimals: 0},
  {key: 'wristExtension_deg', name: 'Wrist bend', unit: '°', low: -60, high: 10, decimals: 2},
  {key: 'wristRadialDeviation_deg', name: 'Side tilt', unit: '°', low: -60, high: 10, decimals: 2}
];
const traceViews = [];
let clip, windows, pendingView, loading;

function angle(value) {
  return value.toFixed(2).replace('-', '−') + '°';
}

function timeFromCue(row) {
  return (row - clip.cueSourceRow) / clip.sourceSampleRateHz;
}

function makeTrace(channel) {
  const box = document.createElement('div');
  box.className = 'wrist-trace';
  const line = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = channel.name;
  const reading = document.createElement('output');
  reading.setAttribute('for', 'wrist-frame');
  reading.setAttribute('aria-label', channel.name);
  line.append(name, reading);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const scale = document.createElement('small');
  scale.textContent = 'Scale ' + channel.low + ' to ' + channel.high + ' ' + channel.unit;
  box.append(line, canvas, scale);
  $('wrist-traces').append(box);
  const values = clip.series[channel.key];
  return {channel, canvas, reading, values};
}

function paintTrace({canvas, channel, values}, index) {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = window.devicePixelRatio || 1;
  const w = Math.round(width * ratio), h = Math.round(height * ratio);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(w / width, 0, 0, h / height, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const x = i => 2 + i / (values.length - 1) * (width - 4);
  const y = value => 2 + (channel.high - value) / (channel.high - channel.low) * (height - 4);
  ctx.strokeStyle = '#39786a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x(0), y(values[0]));
  for (let i = 1; i < values.length; i++) ctx.lineTo(x(i), y(values[i]));
  ctx.stroke();
  const cue = clip.cueSourceRow - clip.firstSourceRow;
  for (const [row, dash] of [[cue, [3, 2]], [index, []]]) {
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.strokeStyle = dash.length ? '#474c49' : '#9a4c06';
    ctx.moveTo(x(row), 0);
    ctx.lineTo(x(row), height);
    ctx.stroke();
  }
  ctx.fillStyle = '#9a4c06';
  ctx.beginPath();
  ctx.arc(x(index), y(values[index]), 2.5, 0, 2 * Math.PI);
  ctx.fill();
}

function drawFrame() {
  if (!clip || $('wrist').hidden) return;
  const row = Number($('wrist-frame').value);
  const time = timeFromCue(row);
  const label = time === 0 ? 'Visual cue appears' :
    Math.abs(time).toFixed(3) + ' s ' + (time < 0 ? 'before' : 'after') + ' the cue';
  $('wrist-time').textContent = label;
  $('wrist-frame').setAttribute('aria-valuetext', label);
  for (const view of traceViews) {
    const {values, reading, channel} = view;
    const value = values[row - clip.firstSourceRow];
    reading.textContent = channel.unit === '°' ? angle(value) : value.toFixed(channel.decimals).replace('-', '−') + ' µV';
    paintTrace(view, row - clip.firstSourceRow);
  }
}

function currentWindow() {
  return windows[Number($('wrist-cutoff').value)];
}

function drawComparison() {
  const row = currentWindow();
  const prediction = row.predictions[$('wrist-inputs').value].angle_deg;
  const measured = row.measured_deg;
  const cutoff = timeFromCue(row.cutoff_source_row).toFixed(2);
  const target = timeFromCue(row.target_source_row).toFixed(2);
  $('wrist-target').textContent = 'From ' + cutoff + ' s to ' + target + ' s after the cue';
  const body = $('wrist-values');
  body.replaceChildren();
  for (const [label, values] of [
    ['At cutoff', row.anchor_deg],
    ['Predicted later angle', prediction],
    ['Measured later angle', measured],
    ['Measured change', measured.map((value, axis) => value - row.anchor_deg[axis])],
    ['Size of the miss', measured.map((value, axis) => Math.abs(value - prediction[axis]))]
  ]) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = label;
    tr.append(th);
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = angle(value);
      tr.append(cell);
    }
    body.append(tr);
  }
}

function chooseCutoff() {
  $('wrist-frame').value = currentWindow().cutoff_source_row;
  drawFrame();
  drawComparison();
}

function restoreView(view) {
  const sourceRow = view?.get('wrist-cutoff');
  const traceRow = view?.get('wrist-row');
  const inputs = view?.get('wrist-inputs');
  const cutoff = windows.findIndex(row => String(row.cutoff_source_row) === sourceRow);
  const select = $('wrist-inputs'), frame = $('wrist-frame');
  if (cutoff >= 0) {
    $('wrist-cutoff').value = cutoff;
    frame.value = windows[cutoff].cutoff_source_row;
  }
  if ([...select.options].some(option => option.value === inputs)) select.value = inputs;
  if (traceRow && /^\d+$/.test(traceRow) && Number(traceRow) >= clip.firstSourceRow &&
      Number(traceRow) <= clip.lastSourceRow) frame.value = traceRow;
  drawFrame();
  drawComparison();
}

function load() {
  return loading ??= loadRecording();
}

async function loadRecording() {
  $('wrist-status').textContent = 'Loading the wrist recording…';
  try {
    const [recording, forecasts] = await Promise.all([
      readPacket('wrist-pointing.json', clipHash),
      readPacket('wrist-forecasts.json', forecastHash)
    ]);
    clip = recording;
    windows = forecasts.rows;
    const frame = $('wrist-frame');
    frame.min = clip.firstSourceRow;
    frame.max = clip.lastSourceRow;
    for (const channel of channels) traceViews.push(makeTrace(channel));
    const select = $('wrist-cutoff');
    for (const [i, row] of windows.entries()) {
      select.add(new Option(timeFromCue(row.cutoff_source_row).toFixed(2) + ' s', i));
    }
    select.value = '1';
    $('wrist-data').hidden = false;
    $('wrist-status').textContent = '';
    frame.value = currentWindow().cutoff_source_row;
    restoreView(pendingView);
    new ResizeObserver(drawFrame).observe($('wrist-traces'));
    return true;
  } catch {
    $('wrist-status').textContent = 'The guide could not verify the wrist files. Use HTTPS or serve the downloaded guide on localhost.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', load);
    $('wrist-status').append(retry);
    return false;
  } finally {
    loading = null;
  }
}

$('wrist-frame').addEventListener('input', drawFrame);
$('wrist-cutoff').addEventListener('change', chooseCutoff);
$('wrist-inputs').addEventListener('change', drawComparison);
$('wrist-jump').addEventListener('click', () => {
  $('wrist-frame').value = currentWindow().target_source_row;
  drawFrame();
  $('wrist-frame').focus();
});

export function showWristRecording(visible,view) {
  pendingView = visible ? view : null;
  $('wrist').hidden = !visible;
  if (visible) {
    if (clip) restoreView(pendingView);
    else load();
  }
}

export function wristView(keepPending = false) {
  if ($('wrist').hidden) return {};
  if (!clip) {
    const settings = ['wrist-row','wrist-cutoff','wrist-inputs'];
    return keepPending && pendingView
      ? Object.fromEntries(settings.filter(key => pendingView.has(key)).map(key => [key, pendingView.get(key)]))
      : {};
  }
  return {
    'wrist-row': $('wrist-frame').value,
    'wrist-cutoff': currentWindow().cutoff_source_row,
    'wrist-inputs': $('wrist-inputs').value
  };
}

export function waitForWristView() {
  return $('wrist').hidden || clip ? null : load();
}
