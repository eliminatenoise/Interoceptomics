/* Keep the four observed windows discrete. In between, only the study setup is visible. */
function measuredReader(source, setTrialTime) {
  const checkbox = byId('use-measured');
  const cohort = byId('use-agreement');
  const selector = byId('measured-window');
  const gaps = 'Outside the four measured windows. Choose a window to see its readings.';
  const signed = (value) => (value === null ? 'Unavailable' : value > 0 ? '+' + value : String(value));
  const rounded = (value) => (value === null ? signed(null) : signed(Number(value.toPrecision(4))));
  const headScale = source.eeg_scale;
  const shortLimit = headScale.limit.toPrecision(4);
  byId('negative-limit').textContent = '−' + shortLimit;
  byId('positive-limit').textContent = '+' + shortLimit;
  byId('scale-explanation').textContent =
    'One colour scale spans all seven cues and four windows. Its limit is the 95th percentile of absolute scalp changes (' +
    shortLimit +
    ' stored units). ' +
    headScale.clipped_low +
    ' values fall below the scale and ' +
    headScale.clipped_high +
    ' above it. Open “Exact stored change” at the selected site for the full number.';
  for (const window of source.windows) {
    selector.add(
      new Option(
        '+' + window.start_s.toFixed(2) + ' to +' + window.stop_s.toFixed(2) + ' s after cue',
        window.id,
      ),
    );
  }

  function moveToWindow(id) {
    const window = source.windows.find((w) => w.id === id);
    if (window) setTrialTime(2 + (window.start_s + window.stop_s) / 2);
  }
  const [flex, extension] = source.tasks.slice(0, 2).map((t) => t.windows[3]);
  const cz = source.channels.eeg.findIndex((ch) => ch.label === 'Cz');
  const elbow = source.channels.mechanics.findIndex((ch) => ch.index === 93);
  byId('example-values').textContent =
    'At 2.50–2.75 s after the cue, bending and straightening produced similar changes at Cz (' +
    flex.eeg[cz].toFixed(2) +
    ' and ' +
    extension.eeg[cz].toFixed(2) +
    '). The elbow sensor changed in opposite directions (' +
    signed(Number(flex.mechanics[elbow].toFixed(2))) +
    ' and ' +
    signed(Number(extension.mechanics[elbow].toFixed(2))) +
    '). Each instrument has its own stored units.';
  function inspectElbow(taskName) {
    task.value = taskName;
    moveToWindow('w3');
    selectSite(cz, true);
  }
  byId('example-bend').onclick = () => inspectElbow('flex');
  byId('example-straight').onclick = () => inspectElbow('extend');
  byId('group-bend').onclick = () => inspectElbow('flex');
  byId('group-straight').onclick = () => inspectElbow('extend');
  function changeMap() {
    if (checkbox.checked || cohort.checked) {
      const sinceCue = Number(time.value) - 2;
      const window = source.windows.find((w) => w.start_s <= sinceCue && sinceCue < w.stop_s);
      if (!window) {
        moveToWindow(source.windows[0].id);
        return;
      }
    }
    showTime();
  }
  for (const radio of document.querySelectorAll('input[name=map]')) radio.onchange = changeMap;
  selector.onchange = () => moveToWindow(selector.value);
  const channelNames = {
    62: 'Eye 62 · table left / header eog-r',
    63: 'Eye 63 · middle / eog-m',
    64: 'Eye 64 · table right / header eog-l',
    93: 'Elbow · exoskeleton 93',
    94: 'Forearm rotation · exoskeleton 94',
    68: 'Index finger near joint · glove 68',
  };
  function sensorRows(group, window, total) {
    const rows = source.channels[group].map((ch, i) => {
      const row = document.createElement('tr'),
        name = document.createElement('th');
      name.scope = 'row';
      name.textContent = channelNames[ch.index];
      row.append(name);
      const value = document.createElement('td'),
        n = document.createElement('td');
      if (window) {
        const shift = window[group][i];
        value.textContent = rounded(shift);
        if (shift !== null) value.title = signed(shift);
        n.textContent =
          window.valid_trials[group][i] +
          ' / ' +
          total +
          ' · ' +
          window.valid_runs[group][i] +
          ' / 3 runs';
      } else {
        value.textContent = '—';
        n.textContent = '—';
      }
      row.append(value, n);
      return row;
    });
    byId(group + '-rows').replaceChildren(...rows);
  }
  let lastKey;
  function update(index, cueCode, seconds) {
    const enabled = checkbox.checked;
    const grouped = cohort.checked;
    byId('window-control').hidden = !enabled && !grouped;
    byId('agreement-panel').hidden = !grouped;
    byId('agreement-key').hidden = !grouped;
    byId('measurements').hidden = !enabled;
    byId('scalp-key').hidden = !enabled;
    byId('measured-site').hidden = !enabled;
    byId('setup-key').hidden = enabled || grouped;
    const taskData = source.tasks.find((t) => t.code === cueCode);
    const relative = seconds - 2;
    const windowIndex = source.windows.findIndex((w) => w.start_s <= relative && relative < w.stop_s);
    const window = enabled && windowIndex >= 0 ? taskData.windows[windowIndex] : null;
    const key = [enabled, grouped, index, cueCode, windowIndex].join(':');
    if (key === lastKey) return null;
    lastKey = key;
    if (grouped) {
      selector.value = windowIndex < 0 ? 'gap' : source.windows[windowIndex].id;
      return showAgreement(index, cueCode, windowIndex, selector.selectedOptions[0].textContent);
    }
    if (enabled) {
      selector.value = window ? window.id : 'gap';
      byId('measured-site').textContent = window
        ? ATLAS.sites[index][0] +
          ' · ' +
          rounded(window.eeg[index]) +
          ' stored units · ' +
          window.valid_trials.eeg[index] +
          ' of ' +
          taskData.trials +
          ' trials · ' +
          window.valid_runs.eeg[index] +
          ' of 3 runs.'
        : gaps;
      byId('full-site').hidden = !window || window.eeg[index] === null;
      byId('full-number').textContent = window ? signed(window.eeg[index]) + ' stored units' : '';
      byId('sensor-window').textContent = window
        ? taskData.label + ' · ' + selector.selectedOptions[0].textContent + '.'
        : gaps;
      sensorRows('eog', window, taskData.trials);
      sensorRows('mechanics', window, taskData.trials);
    }
    return { mode: enabled, values: window?.eeg ?? null, limit: headScale.limit };
  }
  return { update };
}
