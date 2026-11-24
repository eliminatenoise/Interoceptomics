const expected = 'bd3bdde84cc553ddff3b276e04a68da129e1b02f12cbb23febd4e45fad82d20d';
const support = document.querySelector('#support');
const measure = document.querySelector('#metric');
const status = document.querySelector('#comparison-status');
const coverage = document.querySelector('#coverage');
const caption = document.querySelector('#comparison-caption');
const otherEdition = document.querySelector('#other-edition');
const rows = [...document.querySelectorAll('[data-arm]')];
const metricOptions = {
  impulse: {caption:'Mean absolute error in force impulse (N·s)', digits:3},
  event: {caption:'Squared probability error for new loading', digits:6},
};

function applySelection(params, field, fallback) {
  const wanted = params.get(field.id);
  field.value = [...field.options].some(option => option.value === wanted) ? wanted : fallback;
}

function render(scores) {
  const method = measure.value;
  const {caption: heading, digits} = metricOptions[method];
  const selected = rows.map(row => scores[row.dataset.arm][support.value][method]);
  const count = selected[0].rows;
  const maximum = Math.max(...selected.map(result => result.aggregate));
  const minimum = Math.min(...selected.map(result => result.aggregate));
  caption.textContent = heading;
  coverage.textContent = count + ' forecast rows from nine walks by three people.';
  const format = new Intl.NumberFormat('en', {minimumFractionDigits:digits, maximumFractionDigits:digits});
  for (const [i, row] of rows.entries()) {
    const value = selected[i].aggregate;
    row.querySelector('output').textContent = format.format(value);
    row.querySelector('.bar').style.width = (100 * value / maximum) + '%';
    row.classList.toggle('best', value === minimum);
  }
  const best = rows.filter((_, i) => selected[i].aggregate === minimum)
    .map(row => row.querySelector('th').textContent);
  status.textContent = 'Lowest error on this selection · ' + best.join(', ') + '.';
  const query = new URLSearchParams({support:support.value, metric:measure.value});
  history.replaceState(null, '', '?' + query.toString());
  otherEdition.search = query.toString();
}

try {
  const response = await fetch('results.json');
  if (!response.ok) throw new Error('Missing published score file.');
  const bytes = await response.arrayBuffer();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    value => value.toString(16).padStart(2, '0')).join('');
  if (digest !== expected) throw new Error('Score file failed verification.');
  const {results} = JSON.parse(new TextDecoder().decode(bytes));
  const params = new URLSearchParams(location.search);
  applySelection(params, support, 'endpoint_specific');
  applySelection(params, measure, 'impulse');
  render(results);
  for (const select of [support, measure]) {
    select.disabled = false;
    select.addEventListener('change', () => render(results));
  }
} catch {
  status.textContent = 'The saved results could not be verified. Reopen the current Stage Guide or check the original study report.';
}
