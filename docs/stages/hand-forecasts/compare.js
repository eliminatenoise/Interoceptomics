import {readPacket} from '../recording/read-packet.js';

const scoreHash = 'a2fc567bc520a900cdfe0905fcc26b5d174e6e42af91141fd274b1a90c918848';
const movement = document.getElementById('movement');
const metric = document.getElementById('metric');
const feedback = document.getElementById('comparison-status');
const rows = [...document.querySelectorAll('[data-method]')];
const format = new Intl.NumberFormat('en', {minimumFractionDigits: 3, maximumFractionDigits: 3});
const counts = new Intl.NumberFormat('en');

function setSelection(select, value) {
  if ([...select.options].some(option => option.value === value)) select.value = value;
}

async function start() {
  const source = await readPacket('../hand-forecasts/results.json', scoreHash);
  const groups = {all: source.comparison, ...source.measured_movement_bands};
  const url = new URL(location.href);
  const other = document.getElementById('other-edition');
  const otherUrl = new URL(other.getAttribute('href'), url);
  setSelection(movement, url.searchParams.get('movement'));
  setSelection(metric, url.searchParams.get('metric'));
  function show() {
    const result = groups[movement.value];
    const values = rows.map(row => ({row, error: result.error_mm[row.dataset.method][Number(metric.value)]}));
    const maximum = Math.max(...values.map(value => value.error));
    const best = values.reduce((left, right) => left.error <= right.error ? left : right);
    for (const {row, error} of values) {
      row.querySelector('output').textContent = format.format(error);
      row.querySelector('.bar').style.width = (maximum ? 100 * error / maximum : 0) + '%';
    }
    document.getElementById('comparison-caption').textContent = metric.selectedOptions[0].text + ' in millimetres';
    document.getElementById('coverage').textContent =
      counts.format(result.rows) + ' forecast times from ' + counts.format(result.trials) + ' trials.';
    document.getElementById('scale').textContent = 'Each bar starts at zero. The scale ends at ' + format.format(maximum) + ' mm.';
    feedback.textContent = 'Closest forecast in this selection is “' + best.row.querySelector('th').textContent + '”.';
    url.searchParams.set('movement', movement.value);
    url.searchParams.set('metric', metric.value);
    otherUrl.search = url.search;
    other.href = otherUrl.href;
    history.replaceState(history.state, '', url);
  }
  movement.disabled = metric.disabled = false;
  movement.addEventListener('change', show);
  metric.addEventListener('change', show);
  show();
}

start().catch(() => {
  feedback.textContent = 'The measured results could not be verified. Reload the page or open the study report.';
});
