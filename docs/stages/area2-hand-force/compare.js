import {readPacket} from '../recording/read-packet.js';

const digest = 'e1569226aeef2cf9d5e9511edc8b81f48a0df313e4dfbaa75174a27faf9554e8';
const group = document.getElementById('group');
const metric = document.getElementById('metric');
const status = document.getElementById('comparison-status');
const rows = [...document.querySelectorAll('[data-arm]')];
const changes = [...document.querySelectorAll('[data-contrast]')];
const mm = new Intl.NumberFormat('en', {minimumFractionDigits: 3, maximumFractionDigits: 3});
const signed = new Intl.NumberFormat('en', {signDisplay: 'exceptZero', minimumFractionDigits: 3, maximumFractionDigits: 3});
const counts = new Intl.NumberFormat('en');

function useChoice(select, value) {
  if ([...select.options].some(option => option.value === value)) select.value = value;
}

async function openComparison() {
  const {groups} = await readPacket('../area2-hand-force/results.json', digest);
  const url = new URL(location.href);
  const other = document.getElementById('other-edition');
  const otherUrl = new URL(other.getAttribute('href'), url);
  useChoice(group, url.searchParams.get('group'));
  useChoice(metric, url.searchParams.get('metric'));

  function show() {
    const selection = groups[group.value];
    const metricIndex = Number(metric.value);
    const values = rows.map(row => selection.arms[row.dataset.arm].mean_mm[metricIndex]);
    const maximum = Math.max(...values);
    const minimum = Math.min(...values);
    rows.forEach((row, index) => {
      const error = values[index];
      row.querySelector('output').textContent = mm.format(error);
      row.querySelector('.bar').style.width = (maximum ? 100 * error / maximum : 0) + '%';
    });
    changes.forEach(row => {
      const result = selection.paired_gains[row.dataset.contrast];
      row.querySelector('output').textContent = signed.format(result.mean_gain_mm[metricIndex]) + ' mm';
      const [low, high] = result.interval95_mm[metricIndex];
      row.querySelector('.range').textContent = signed.format(low) + ' to ' + signed.format(high) + ' mm';
    });
    document.getElementById('comparison-caption').textContent = metric.selectedOptions[0].text + ' in millimetres';
    document.getElementById('coverage').textContent =
      counts.format(selection.rows) + ' forecast times from ' + counts.format(selection.trials) + ' trials.';
    document.getElementById('scale').textContent = 'The bars run from zero to ' + mm.format(maximum) + ' mm.';
    const winners = rows.filter((row, index) => values[index] === minimum).map(row => row.querySelector('th').textContent);
    status.textContent = 'Lowest average error in this selection comes from ' + winners.join(' and ') + '.';
    url.searchParams.set('group', group.value);
    url.searchParams.set('metric', metric.value);
    otherUrl.search = url.search;
    other.href = otherUrl.href;
    history.replaceState(history.state, '', url);
  }

  show();
  group.disabled = metric.disabled = false;
  group.addEventListener('change', show);
  metric.addEventListener('change', show);
}

openComparison().catch(() => {
  status.textContent = 'The measured results could not be verified. Reload the page or open the study report.';
});
