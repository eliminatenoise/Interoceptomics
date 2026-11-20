(() => {
  'use strict';
  const d = window.REACH_TRIAL,
    f = window.REACH_FORECASTS,
    scene = window.REACH_SCENE;
  const $ = (q) => document.querySelector(q);
  const n = d.end - d.start + 1,
    time = (row) => ((row - d.start) * d.dt_s).toFixed(2);
  const format = (v, digits = 3) => (Number.isFinite(v) ? v.toFixed(digits) : 'missing');
  const coordinate = (p, digits = 2) => p.map((v) => format(v, digits)).join(', ');
  const spectral = ['#edf0e9', '#b5dfab', '#72be8c', '#358770', '#216453'];
  const event = (name) => d.events[name][0];
  const eventName = ['Perturbation', 'Reach'];
  let frame = event('bump') - d.start,
    last = null,
    playback = false,
    token = 0,
    startStamp = 0,
    startFrame = 0;
  const timeline = $('#timeline'),
    anchor = $('#anchor'),
    seed = $('#seed'),
    site = $('#site');
  const seedOptions = f.seeds || [];
  function option(parent, value, text) {
    const el = new Option(text, String(value));
    parent.add(el);
  }
  function set(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }
  option(anchor, -1, 'Choose an event and time');
  for (const a of f.anchors) {
    option(anchor, a.k, eventName[a.epoch] + ' +' + a.offset * 10 + ' ms' + (a.reason ? ' · excluded' : ''));
  }
  for (const [i, s] of seedOptions.entries()) option(seed, i, 'Seed ' + s);
  if (!seedOptions.length) option(seed, 0, 'No fit attached');
  seed.disabled = !seedOptions.length;
  d.marker_names.forEach((name, i) => option(site, i, name + ' · ' + scene.group[i]));
  site.value = '2';
  const markerRows = d.marker_names.map((name, i) => {
    const row = $('#markerRows').insertRow();
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = name;
    row.append(label);
    row.insertCell().textContent = scene.group[i];
    return [row.insertCell(), row.insertCell(), row.insertCell()];
  });
  const tiles = d.unit_guide.map(([ch, sort]) => {
    const el = document.createElement('div');
    el.className = 'tile';
    const key = document.createElement('small'),
      val = document.createElement('b');
    key.textContent = ch + ' / ' + sort;
    el.append(key, val);
    $('#raster').append(el);
    return { el, val, ch, sort };
  });
  timeline.max = String(n - 1);
  $('#trialInfo').textContent = 'Original trial ' + d.trial + ' · ' + n + ' rows';
  $('#eventTimes').textContent =
    'Perturbation ' +
    time(event('bump')) +
    ' s (' +
    d.direction_deg.bump +
    '°). Target displayed ' +
    time(event('target')) +
    ' s (' +
    d.direction_deg.target +
    '°). Go cue ' +
    time(event('go')) +
    ' s. Trial starts at 0.00 s. Each step advances one stored 10-ms row.';
  $('#held').textContent = f.summary || 'No numerical evaluation is attached to this development trial.';
  function box(parent, title, value) {
    const div = document.createElement('div'),
      label = document.createElement('span'),
      num = document.createElement('strong');
    label.textContent = title;
    num.textContent = value;
    div.append(label, num);
    parent.append(div);
  }
  let comparisonKey = '';
  function updateComparison(aa, pred, vec) {
    const key = String(aa?.k) + '-' + seed.value;
    if (key === comparisonKey) return;
    comparisonKey = key;
    const parent = $('#compare');
    parent.replaceChildren();
    if (!aa) {
      parent.textContent =
        'Choose a forecast time to compare the model prediction with the next 100 ms of measured handle travel.';
      return;
    }
    if (aa.reason) {
      parent.textContent = 'Excluded at this time. ' + aa.reason;
      return;
    }
    box(parent, 'Measured ΔX, ΔY (cm)', coordinate(vec, 3));
    box(parent, 'Forecast ΔX, ΔY (cm)', coordinate(pred, 3));
    box(parent, 'Endpoint error (cm)', Math.hypot(vec[0] - pred[0], vec[1] - pred[1]).toFixed(3));
  }
  function render() {
    const k = d.start + frame,
      aa = f.anchors.find((a) => a.k === k);
    const pred = aa?.by_seed?.[Number(seed.value)] || null;
    const supported =
      aa &&
      scene.valid(pred) &&
      frame + 10 < n &&
      scene.valid(d.position_xy_cm[frame]) &&
      scene.valid(d.position_xy_cm[frame + 10]);
    const now = d.position_xy_cm[frame];
    const vec = supported ? d.position_xy_cm[frame + 10].map((v, j) => v - now[j]) : null;
    anchor.value = aa ? String(k) : '-1';
    timeline.value = String(frame);
    timeline.setAttribute('aria-valuetext', time(k) + ' seconds after trial start');
    set($('#clock'), time(k) + ' s');
    set($('#eventTag'), 'Trial ' + d.trial + ' · source row ' + k);
    set(
      $('#eventName'),
      k < event('bump')
        ? 'Before the bump'
        : k === event('bump')
          ? 'Robot perturbation begins'
          : k < event('target') && k < event('go')
            ? 'After the bump · before the cue'
            : k === event('go') && k === event('target')
              ? 'Target appears · go cue'
              : k === event('target')
                ? 'Target appears'
                : k < event('go')
                  ? 'Target displayed · before go'
                  : k === event('go')
                    ? 'Go cue'
                    : 'After the go cue'
    );
    set($('#handleRead'), 'Current X, Y: ' + coordinate(now, 3) + ' cm');
    $('#prev').disabled = frame === 0;
    $('#next').disabled = frame === n - 1;
    scene.drawArm(frame, Number(site.value));
    scene.drawHandle(frame, supported ? aa : null, pred);
    updateComparison(aa, pred, vec);
    if (frame === last) return;
    last = frame;
    for (const [i, p] of d.marker_xyz_m[frame].entries())
      p.forEach((v, j) => set(markerRows[i][j], format(v, 4)));
    let sum = 0;
    d.sorted_counts[frame].forEach((count, i) => {
      sum += count;
      const { el, val, ch, sort } = tiles[i];
      if (val.textContent !== String(count)) {
        set(val, String(count));
        el.style.backgroundColor = spectral[Math.min(count, spectral.length - 1)];
        el.style.color = count >= 3 ? '#fff' : '#142d2d';
        el.setAttribute('aria-label', 'Electrode ' + ch + ', sort ' + sort + ', ' + count + ' spikes');
      }
    });
    set($('#spikeSum'), sum + (sum === 1 ? ' spike' : ' spikes') + ' / 10 ms');
  }
  window.renderReach = render;
  function stop() {
    if (playback) cancelAnimationFrame(token);
    playback = false;
    $('#play').textContent = 'Play';
    $('#play').setAttribute('aria-pressed', 'false');
  }
  function move(i) {
    stop();
    frame = Math.max(0, Math.min(n - 1, Math.round(i)));
    render();
  }
  function loop(now) {
    const next = startFrame + Math.floor(((now - startStamp) * Number($('#speed').value)) / (1000 * d.dt_s));
    if (next >= n) {
      move(n - 1);
      return;
    }
    if (next !== frame) {
      frame = next;
      render();
    }
    token = requestAnimationFrame(loop);
  }
  $('#play').addEventListener('click', () => {
    if (playback) {
      stop();
      return;
    }
    if (frame === n - 1) move(0);
    playback = true;
    startStamp = performance.now();
    startFrame = frame;
    $('#play').textContent = 'Pause';
    $('#play').setAttribute('aria-pressed', 'true');
    token = requestAnimationFrame(loop);
  });
  $('#speed').onchange = () => {
    startStamp = performance.now();
    startFrame = frame;
  };
  $('#bump').onclick = () => move(event('bump') - d.start);
  $('#go').onclick = () => move(event('go') - d.start);
  $('#prev').onclick = () => move(frame - 1);
  $('#next').onclick = () => move(frame + 1);
  timeline.oninput = () => move(Number(timeline.value));
  site.onchange = render;
  seed.onchange = render;
  anchor.onchange = () => {
    if (Number(anchor.value) >= d.start) move(Number(anchor.value) - d.start);
  };
  new ResizeObserver(render).observe($('#recording'));
  window.addEventListener('resize', render);
  render();
})();
