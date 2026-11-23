(() => {
  const groups = JSON.parse(document.getElementById('totals').textContent);
  const select = document.getElementById('windows');
  const rows = [...document.querySelectorAll('tbody tr')];
  const note = document.getElementById('difference');
  const switchEdition = document.getElementById('other-edition');
  const count = n => n.toLocaleString('en-US');
  const scale = Number(document.querySelector('table').dataset.scale);
  const url = new URL(location.href);
  const initial = url.searchParams.get('block');
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
    const next = new URL(switchEdition.href);
    if (group.id === 'all') next.searchParams.delete('block');
    else next.searchParams.set('block', group.id);
    switchEdition.href = next;
  }

  select.addEventListener('change', () => {
    const current = new URL(location.href);
    if (select.value === 'all') current.searchParams.delete('block');
    else current.searchParams.set('block', select.value);
    history.replaceState(null, '', current);
    render();
  });
  render();
})();
