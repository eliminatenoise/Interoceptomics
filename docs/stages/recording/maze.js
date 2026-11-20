import {readPacket} from './read-packet.js';

const $ = id => document.getElementById(id);
const digest = '65d3223f5e2958064711b36dd98abb0f7bd6ee4c8cc556f212fd5891a514e6b7';
const timeline = {left: 14, right: 286};
let clip, loading = false;

function svg(tag, attrs, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

// The same scale on both axes keeps a centimetre square.
function mapX(cm) {return 34 + 2 * cm;}
function mapY(cm) {return 230 - 2 * cm;}
function timeX(second) {
  return timeline.left + (timeline.right - timeline.left) * (second - clip.start_s) / (clip.stop_s - clip.start_s);
}

function drawTrack() {
  const chart = $('maze-map');
  const ticks = [0, 25, 50, 75, 100];
  for (const cm of ticks) {
    const x = mapX(cm), y = mapY(cm);
    chart.append(svg('line', {x1:x, x2:x, y1:mapY(105), y2:mapY(0), class:'maze-grid'}),
      svg('line', {x1:mapX(0), x2:mapX(105), y1:y, y2:y, class:'maze-grid'}),
      svg('text', {x, y:248, 'text-anchor':'middle'}, cm),
      svg('text', {x:26, y:y+4, 'text-anchor':'end'}, cm));
  }
  chart.append(svg('text', {x:34, y:13}, 'Y (cm)'), svg('text', {x:250, y:264, 'text-anchor':'end'}, 'X (cm)'));
  // Isolated marks preserve both sampling gaps and the measured points themselves.
  const points = clip.positions.map(([, x, y]) => 'M' + mapX(x).toFixed(2) + ',' + mapY(y).toFixed(2) + 'h0').join('');
  chart.append(svg('path', {d:points, class:'maze-points'}),
    svg('circle', {id:'maze-dot', r:5, class:'maze-cursor-dot'}));
}

function drawSpikeRasters() {
  const stack = $('maze-units');
  stack.replaceChildren();
  const views = [];
  for (const unit of clip.units) {
    const group = document.createElement('div');
    const title = document.createElement('h5');
    title.textContent = (unit.region === 'CA1' ? 'Hippocampus · CA1' : 'Prefrontal cortex') + ' · unit ' + unit.unit;
    const chart = svg('svg', {viewBox:'0 0 300 50', 'aria-hidden':'true', class:'maze-raster'});
    chart.append(svg('line', {x1:timeline.left, x2:timeline.right, y1:26, y2:26, class:'maze-grid'}));
    for (const seconds of [0, 10, 20, 30, 40]) {
      const x = timeX(clip.start_s + seconds);
      chart.append(svg('text', {x, y:43, 'text-anchor':'middle'}, seconds + ' s'));
    }
    for (const event of unit.spikes_s) {
      const x = timeX(event);
      chart.append(svg('line', {x1:x, x2:x, y1:7, y2:24, class:'maze-spike'}));
    }
    const cursor = svg('line', {y1:3, y2:28, class:'maze-time-line'});
    chart.append(cursor);
    const readout = document.createElement('output');
    readout.htmlFor = 'maze-frame';
    group.append(title, chart, readout);
    stack.append(group);
    views.push({unit, cursor, readout});
  }
  return views;
}

let views = [];
function drawFrame() {
  if (!clip) return;
  const frame = $('maze-frame');
  const [second, x, y] = clip.positions[Number(frame.value)];
  const elapsed = (second - clip.start_s).toFixed(3) + ' s into the trip';
  $('maze-time').textContent = elapsed;
  frame.setAttribute('aria-valuetext', elapsed);
  $('maze-position').textContent = 'X ' + x.toFixed(2) + ' cm · Y ' + y.toFixed(2) + ' cm';
  $('maze-clock').textContent = 'Session clock ' + second.toFixed(6) + ' s';
  $('maze-dot').setAttribute('cx', mapX(x));
  $('maze-dot').setAttribute('cy', mapY(y));
  for (const {unit, cursor, readout} of views) {
    const count = unit.spikes_s.filter(event => event <= second).length;
    readout.textContent = count + ' of ' + unit.spikes_s.length + ' spikes by this frame';
    cursor.setAttribute('x1', timeX(second));
    cursor.setAttribute('x2', timeX(second));
  }
}

function showFirstCA1Spike() {
  const spike = clip.units.find(unit => unit.region === 'CA1').spikes_s[0];
  let closest = 0;
  for (const [i, row] of clip.positions.entries()) {
    if (Math.abs(row[0] - spike) < Math.abs(clip.positions[closest][0] - spike)) closest = i;
  }
  $('maze-frame').value = closest;
  drawFrame();
  const difference = clip.positions[closest][0] - spike;
  $('maze-gap').textContent = 'The first CA1 spike came at ' + spike.toFixed(6) + ' s on the session clock. ' +
    'The nearest camera reading came ' + (Math.abs(difference) * 1000).toFixed(1) + ' milliseconds ' +
    (difference < 0 ? 'earlier.' : 'later.');
}

async function load() {
  if (loading || clip) return;
  loading = true;
  const status = $('maze-status');
  status.textContent = 'Loading the maze recording…';
  try {
    clip = await readPacket('maze-trial.json', digest);
    $('maze-frame').max = clip.positions.length - 1;
    $('maze-frame').value = 0;
    drawTrack();
    views = drawSpikeRasters();
    drawFrame();
    $('maze-data').hidden = false;
    status.textContent = '';
  } catch {
    clip = undefined;
    $('maze-map').replaceChildren();
    $('maze-data').hidden = true;
    status.textContent = 'The guide could not verify the recording. Open it over HTTPS or on localhost. ';
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = 'Try again'; retry.onclick = load;
    status.append(retry);
  } finally {
    loading = false;
  }
}

$('maze-frame').addEventListener('input', () => {
  $('maze-gap').textContent = '';
  drawFrame();
});
$('maze-jump').addEventListener('click', showFirstCA1Spike);

export function showMazeRecording(visible) {
  $('maze').hidden = !visible;
  if (visible) load();
}
