'use strict';
const records = window.CONTACT_TRIALS;
const $ = (id) => document.getElementById(id);
const scene = window.CONTACT_SCENE;
let day = records[0],
  frame = 0,
  playing = false,
  lastTick = 0,
  request = 0;
function options(select, pairs) {
  select.replaceChildren(...pairs.map(([value, label]) => new Option(label, value)));
}
function signed(value) {
  return (value > 0 ? '+' : '') + value;
}
function milliseconds(record, time) {
  return (time + record.start - record.events.bump) * 10;
}
const numeric = (x) => (Number.isFinite(x) ? x.toFixed(4) : 'unavailable');
function drawTrace(record, contact, anchor) {
  const canvas = $('trace'),
    w = canvas.clientWidth,
    h = canvas.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const left = 28,
    right = w - 10,
    top = 23,
    bottom = h - 33;
  const start = Math.max(0, Math.min(frame, anchor.k - record.start) - 20);
  const end = Math.min(record.counts_10ms.length, Math.max(frame + 1, anchor.k - record.start + 10) + 10);
  const bins = record.counts_10ms.slice(start, end);
  const maximum = Math.max(1, ...bins.map((v) => v[contact]));
  const x = (t) => left + ((right - left) * (t - start)) / (end - start);
  const y = (v) => bottom - ((bottom - top) * v) / maximum;
  const cut = anchor.k - record.start;
  ctx.fillStyle = '#e5d2e1';
  ctx.fillRect(x(cut), top, x(cut + 10) - x(cut), bottom - top);
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = '#3c5750';
  ctx.textAlign = 'left';
  ctx.fillText('events / 10 ms', 0, 11);
  ctx.textAlign = 'right';
  const tick = Math.max(1, Math.ceil(maximum / 4));
  for (let n = 0; n <= maximum; n += tick) {
    ctx.fillStyle = '#3c5750';
    ctx.fillText(String(n), left - 5, y(n) + 3);
    ctx.strokeStyle = '#bec9be';
    ctx.beginPath();
    ctx.moveTo(left, y(n));
    ctx.lineTo(right, y(n));
    ctx.stroke();
  }
  bins.forEach((row, i) => {
    ctx.fillStyle = '#077366';
    ctx.fillRect(
      x(i + start) + 0.2,
      y(row[contact]),
      Math.max(0.8, (right - left) / (end - start) - 0.55),
      bottom - y(row[contact])
    );
  });
  const cursor = x(frame + 0.5);
  ctx.strokeStyle = '#aa6918';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cursor, top - 3);
  ctx.lineTo(cursor, bottom);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#3c5750';
  const ticks = [start, Math.floor((start + end) / 2), end];
  ticks.forEach((t, i) => {
    ctx.textAlign = ['left', 'center', 'right'][i];
    ctx.fillText(signed(milliseconds(record, t)), x(t), bottom + 12);
  });
  ctx.textAlign = 'center';
  ctx.fillText('Time from push (ms)', (left + right) / 2, bottom + 27);
}
function replaceRows(table, rows) {
  const fragment = document.createDocumentFragment();
  for (const values of rows) {
    const tr = document.createElement('tr');
    values.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) cell.scope = 'row';
      cell.textContent = value;
      tr.append(cell);
    });
    fragment.append(tr);
  }
  table.replaceChildren(fragment);
}
function render() {
  const site = Number($('site').value),
    electrode = Number($('contact').value);
  const anchor = day.anchors[Number($('anchor').value)],
    marker = day.marker_xyz_m[frame][site];
  const t = milliseconds(day, frame);
  const current = day.counts_10ms[frame],
    actual = anchor.recorded[electrode],
    expected = anchor.expected?.[electrode];
  $('electrodeHeading').textContent = 'Sensory cortex · electrode ' + day.contact_id[electrode];
  $('actual').textContent = actual;
  $('predicted').textContent = Number.isFinite(expected) ? expected.toFixed(2) : '—';
  $('forecastDetail').textContent =
    'From ' +
    signed(anchor.offset * 10) +
    ' to ' +
    signed(anchor.offset * 10 + 100) +
    ' ms relative to the push. The first bin begins at MAT row ' +
    anchor.k +
    '.';
  $('binRead').textContent =
    'At the cursor · ' +
    current[electrode] +
    ' ' +
    (current[electrode] === 1 ? 'event' : 'events') +
    ' in this 10-ms bin on electrode ' +
    day.contact_id[electrode] +
    '.';
  $('clock').textContent = (frame * 0.01).toFixed(2) + ' s from trial start · ' + signed(t) + ' ms from push';
  $('frame').value = frame;
  $('frame').setAttribute('aria-valuetext', $('clock').textContent);
  $('markerRead').textContent =
    day.marker_names[site] +
    ' · X ' +
    numeric(marker[0]) +
    ' · Y ' +
    numeric(marker[1]) +
    ' · Z ' +
    numeric(marker[2]) +
    ' m';
  const xy = day.handle_xy_cm[frame];
  const cue = Object.entries(day.events)
    .filter(([, row]) => row <= day.start + frame)
    .map(([name]) => ({ bump: 'push', target: 'target', go: 'go cue' })[name]);
  $('eventRead').textContent =
    'MAT row ' +
    (day.start + frame) +
    ' · Handle XY ' +
    xy.map((v) => (Number.isFinite(v) ? v.toFixed(2) : 'unavailable')).join(', ') +
    ' cm · ' +
    (cue.length ? 'Events through this bin · ' + cue.join(', ') : 'Before the push');
  $('back').disabled = frame === 0;
  $('next').disabled = frame === day.counts_10ms.length - 1;
  const date = day.date === '2017-09-12' ? '12 September 2017 · training' : '13 September 2017 · held out';
  $('case').textContent =
    date +
    ' · Original ' +
    day.trial +
    ' · ' +
    day.contact_id.length +
    ' shared electrodes · Push direction ' +
    day.directions_deg.bump +
    '°';
  const align = $('alignedRead');
  align.hidden = !$('overlay').checked;
  if (!align.hidden) {
    const other = records.find((record) => record.date !== day.date);
    const otherFrame = other ? frame + day.start - day.events.bump + other.events.bump - other.start : -1;
    align.textContent =
      other && otherFrame >= 0 && otherFrame < other.counts_10ms.length
        ? 'Amber trail · ' +
          other.date +
          ' · original ' +
          other.trial +
          ' · aligned MAT row ' +
          (other.start + otherFrame)
        : 'The other recording has no sample at this time from the push.';
  }
  scene.drawArm(day, frame, site);
  drawTrace(day, electrode, anchor);
  if ($('allCounts').closest('details').open)
    replaceRows(
      $('allCounts'),
      day.contact_id.map((id, i) => [id, current[i], anchor.recorded[i], anchor.expected?.[i]?.toFixed(3) ?? '—'])
    );
  if ($('sites').closest('details').open)
    replaceRows(
      $('sites'),
      day.marker_names.map((name, i) => [name, ...day.marker_xyz_m[frame][i].map(numeric)])
    );
}
window.renderContact = render;
function stop() {
  playing = false;
  cancelAnimationFrame(request);
  $('play').textContent = 'Play';
}
function setFrame(n) {
  frame = Math.max(0, Math.min(day.counts_10ms.length - 1, n));
  render();
}
function play(time) {
  if (!playing) return;
  const steps = Math.floor((time - lastTick) / 10);
  if (steps > 0) {
    lastTick += steps * 10;
    setFrame(frame + steps);
  }
  if (frame >= day.counts_10ms.length - 1) stop();
  else request = requestAnimationFrame(play);
}
function changeDay() {
  stop();
  day = records[Number($('day').value)];
  options(
    $('anchor'),
    day.anchors.map((a, i) => [i, a.offset === 0 ? 'At the push' : a.offset * 10 + ' ms after push'])
  );
  $('frame').max = day.counts_10ms.length - 1;
  setFrame(day.anchors[0].k - day.start);
}
options(
  $('day'),
  records.map((r, i) => [i, r.date === '2017-09-12' ? 'Sep 12 · training' : 'Sep 13 · held out'])
);
options(
  $('contact'),
  records[0].contact_id.map((id, i) => [i, 'Electrode ' + id])
);
options(
  $('site'),
  records[0].marker_names.map((name, i) => [i, name])
);
$('site').value = 2;
$('day').addEventListener('change', changeDay);
$('anchor').addEventListener('change', () => {
  stop();
  setFrame(day.anchors[Number($('anchor').value)].k - day.start);
});
for (const id of ['contact', 'site', 'overlay']) $(id).addEventListener('change', render);
for (const id of ['allCounts', 'sites']) $(id).closest('details').addEventListener('toggle', render);
$('frame').addEventListener('input', (e) => {
  stop();
  setFrame(Number(e.target.value));
});
for (const [id, step] of [
  ['back', -1],
  ['next', 1]
])
  $(id).addEventListener('click', () => {
    stop();
    setFrame(frame + step);
  });
for (const id of ['bump', 'target', 'go'])
  $(id).addEventListener('click', () => {
    stop();
    setFrame(day.events[id] - day.start);
  });
$('play').addEventListener('click', () => {
  if (playing) {
    stop();
    return;
  }
  if (frame >= day.counts_10ms.length - 1) setFrame(0);
  playing = true;
  lastTick = performance.now();
  $('play').textContent = 'Pause';
  request = requestAnimationFrame(play);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
});
new ResizeObserver(render).observe($('arm'));
changeDay();
