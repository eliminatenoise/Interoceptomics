(() => {
  const groups = JSON.parse(document.getElementById('totals').textContent);
  const select = document.getElementById('windows');
  const parameter = select.dataset.parameter || 'block';
  const rows = [...document.querySelectorAll('tbody tr')];
  const note = document.getElementById('difference');
  const switchEdition = document.getElementById('other-edition');
  const count = n => n.toLocaleString('en-US');
  const scale = Number(document.querySelector('table').dataset.scale);
  const url = new URL(location.href);
  const initial = url.searchParams.get(parameter);
  if (groups.some(x => x.id === initial)) select.value = initial;

  function render() {
    const group = groups.find(x => x.id === select.value);
    rows.forEach((row, i) => {
      row.querySelector('output').textContent = group.errors[i].toFixed(6);
      row.querySelector('.bar').style.width = (100 * group.errors[i] / scale) + '%';
    });
    const outcome = group.change === 0 ? note.dataset.equal :
      (group.change < 0 ? note.dataset.lower : note.dataset.higher) +
      ' ' + Math.abs(group.change).toFixed(6) + ' radians.';
    document.getElementById('coverage').textContent = count(group.n) + ' scored windows';
    note.textContent = outcome;
    for (const tally of document.querySelectorAll('[data-tally]')) {
      tally.textContent = count(group[tally.dataset.tally]);
    }
    for (const comparison of document.querySelectorAll('[data-contrast]')) {
      const value = group.pairs[comparison.dataset.contrast];
      const sign = value < 0 ? '−' : value > 0 ? '+' : '';
      comparison.textContent = sign + Math.abs(value).toFixed(6);
    }
    const next = new URL(switchEdition.href);
    if (group.id === 'all') next.searchParams.delete(parameter);
    else next.searchParams.set(parameter, group.id);
    switchEdition.href = next;
  }

  select.addEventListener('change', () => {
    const current = new URL(location.href);
    if (select.value === 'all') current.searchParams.delete(parameter);
    else current.searchParams.set(parameter, select.value);
    history.replaceState(null, '', current);
    render();
  });
  render();
})();
