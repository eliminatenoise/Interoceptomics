/* One unit on this diverging scale is unanimity among the people with data. */
function signBalance([higher, lower, level]) {
  const valid = higher + lower + level;
  return valid ? (higher - lower) / valid : null;
}

function showAgreement(siteIndex, code, windowIndex, interval) {
  const cue = AGREEMENT.tasks.find((task) => task.code === code);
  const window = cue.windows[windowIndex];
  const gap = 'Outside the four measured windows. Choose a window to see the counts.';
  const site = AGREEMENT.channels.eeg[siteIndex];
  let caption = gap;
  if (window) {
    const [higher, lower, level, missing] = window.eeg[siteIndex];
    caption = site.label + ' · ' + higher + ' higher · ' + lower + ' lower · ' + level +
      ' level · ' + missing + ' missing. Usable readings from ' + (AGREEMENT.people - missing) +
      ' of ' + AGREEMENT.people + ' people.';
  }
  byId('agreement-site').textContent = caption;
  byId('agreement-window').textContent = window ? cue.label + ' · ' + interval + '.' : gap;
  for (const [group, target] of [['eog', 'group-eyes'], ['mechanics', 'group-arm']]) {
    const head = byId(target + '-head');
    if (!head.cells.length) {
      for (const label of ['People', ...AGREEMENT.channels[group].map((ch) => ch.label)]) {
        const name = document.createElement('th');
        name.scope = 'col';
        name.textContent = label;
        head.append(name);
      }
    }
    const rows = ['Higher', 'Lower', 'Level', 'Missing', 'Valid / 7'].map((label, bin) => {
      const row = document.createElement('tr');
      const name = document.createElement('th');
      name.scope = 'row';
      name.textContent = label;
      row.append(name);
      for (const [channel] of AGREEMENT.channels[group].entries()) {
        const cell = document.createElement('td');
        if (!window) cell.textContent = '—';
        else if (bin < 4) cell.textContent = window[group][channel][bin];
        else cell.textContent = (AGREEMENT.people - window[group][channel][3]) + ' / ' + AGREEMENT.people;
        row.append(cell);
      }
      return row;
    });
    byId(target).replaceChildren(...rows);
  }
  return {mode: true, values: window ? window.eeg.map(signBalance) : null, limit: 1};
}
