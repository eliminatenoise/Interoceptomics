/* This mode marks the inputs to the selected calculation, never a field between sites. */
function scalpEyeReader() {
  const select = (key) => byId('eye-' + key);
  const control = byId('use-eyes');
  const signal = select('signal');
  const eye = select('channel');
  const metric = select('metric');
  const scope = select('scope');
  const chart = select('chart');
  const windows = { precue: 'Before the cue', postcue: 'After the cue' };
  const pairings = { same: 'Same trial', shifted: 'Next trial, same cue' };
  let focusWindow = 'postcue';
  let focusPair = 'same';
  let lastKey;

  function format(value) {
    if (value === null) return 'Unavailable';
    return metric.value === 'mean_r2' ? (100 * value).toFixed(1) + '%' : value.toFixed(3);
  }

  function redraw() {
    const measure = metric.value;
    const isFraction = measure === 'mean_r2';
    const selected = SCALP_EYES.cells.filter((row) =>
      row.signal === signal.value && row.eye === Number(eye.value) && row.scope === scope.value);
    const cell = selected.find((row) => row.window === focusWindow);
    const stat = cell[measure][focusPair];
    const pairing = signal.selectedOptions[0].textContent + ' × eye ' + eye.value;
    select('map-label').textContent = pairing;
    select('result-heading').textContent = pairing + ' around the cue';
    select('reading').textContent = isFraction
      ? 'Each bar gives the average share of scalp variation that a straight line fitted to the eye readings captures within those same 128 samples. Read the bars from 0 to 100%.'
      : 'Each bar gives the typical strength of the linear match, from 0 (no linear match) to 1 (perfect match in either direction). Medians summarize the trials, runs and people.';
    chart.replaceChildren();
    for (const row of selected) {
      const block = document.createElement('div');
      const heading = document.createElement('h3');
      heading.textContent = windows[row.window];
      block.append(heading);
      for (const [pair, label] of Object.entries(pairings)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.window = row.window;
        button.dataset.pair = pair;
        const active = row.window === focusWindow && pair === focusPair;
        button.setAttribute('aria-pressed', String(active));
        const title = document.createElement('span');
        const output = document.createElement('strong');
        const rail = document.createElement('span');
        rail.className = 'eye-rail';
        rail.setAttribute('aria-hidden', 'true');
        const bar = document.createElement('span');
        const val = row[measure][pair].estimate;
        bar.style.width = (100 * (val ?? 0)) + '%';
        title.textContent = label;
        output.textContent = format(val);
        rail.append(bar);
        button.setAttribute('aria-label', windows[row.window] + ', ' + label + ', ' + output.textContent);
        button.append(title, output, rail);
        button.onclick = () => {
          focusWindow = row.window;
          focusPair = pair;
          redraw();
          chart.querySelector('[aria-pressed=true]').focus({preventScroll: true});
        };
        block.append(button);
      }
      chart.append(block);
    }
    const [higher, tied, lower] = cell[measure].same_vs_shifted_people;
    select('detail-title').textContent = windows[focusWindow] + ' · ' + pairings[focusPair] +
      ' · ' + format(stat.estimate);
    const spread = stat.person_q25 === null ? 'No person had enough paired readings.' :
      'The middle half of the person summaries spans ' + format(stat.person_q25) + ' to ' + format(stat.person_q75) + '.';
    select('spread').textContent = spread + ' In ' + higher + ' of ' + cell.participants +
      ' people the same-trial match was stronger (' + tied + ' tied, ' + lower + ' weaker).';
    const [min, max] = cell.pairs_per_person_range;
    const perPerson = !cell.participants ? 'No contributing people.' :
      (min === max ? min : min + '–' + max) + ' pairs per person.';
    select('support').textContent = cell.pairs + ' of ' + cell.evaluated_pairs +
      ' paired trials · ' + cell.runs + ' runs · ' + cell.participants + ' people. ' + perPerson +
      ' A constant trace occurred in ' + cell.excluded_by_cause.constant + ' pairs.';
  }

  for (const input of [signal, eye, metric, scope]) input.onchange = () => showField();

  function update() {
    const enabled = control.checked;
    for (const id of ['eye-controls', 'eye-results', 'eye-head-key']) byId(id).hidden = !enabled;
    for (const id of ['site-label', 'site', 'site-info']) byId(id).hidden = enabled;
    if (!enabled) {
      lastKey = null;
      return;
    }
    const key = [signal.value, eye.value, metric.value, scope.value].join('/');
    if (lastKey === key) return;
    lastKey = key;
    redraw();
    return {members: SCALP_EYES.signals[signal.value].map((col) => col - 1)};
  }

  function pick(siteIndex) {
    const name = ATLAS.sites[siteIndex][0];
    if (SCALP_EYES.signals[name]) {
      signal.value = name;
      showField();
    }
  }

  return {update, pick};
}
