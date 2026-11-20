const locationURL = new URL('./assets/atlas-region-locations.json', import.meta.url);
const locationHash = 'e2400d38ca0db31d6133a6ccc7323708a3fa5513a5c44869ba799cd7487eb97a';
const sides = ['left', 'midline', 'right'];
const sideNames = {left: 'Left', midline: 'Midline', right: 'Right'};

async function readLocations(source) {
  const response = await fetch(locationURL);
  if (!response.ok) throw Error('Missing atlas location index');
  const bytes = await response.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hash = Array.from(digest, n => n.toString(16).padStart(2, '0')).join('');
  if (hash !== locationHash) throw Error('Atlas location index differs from its source');
  const {schema, annotation_sha256, regions} = JSON.parse(new TextDecoder().decode(bytes));
  if (schema !== 1 || annotation_sha256 !== source.space.split('/')[0]) {
    throw Error('Atlas location index belongs to a different source');
  }
  return regions;
}

export function bindRegionFinder(group, source, current, jump) {
  const form = group.querySelector('form');
  const query = form.elements.namedItem('query');
  const matches = form.elements.namedItem('match');
  const side = form.elements.namedItem('side');
  const submit = form.querySelector('button');
  const status = group.querySelector('[role=status]');
  const retry = group.querySelector('[data-retry]');
  const choice = group.querySelector('#region-choice');
  const textMeasure = document.createElement('canvas').getContext('2d');

  function showClippedName() {
    const style = getComputedStyle(matches);
    textMeasure.font = style.font;
    // Leave space for the native menu arrow and horizontal padding.
    const room = matches.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 24;
    choice.hidden = textMeasure.measureText(choice.textContent).width <= room;
  }
  new ResizeObserver(showClippedName).observe(matches);
  let rows;
  let locations;
  let loading = false;

  function selectSides(preferred) {
    const points = locations[matches.value];
    choice.textContent = points ? source.describe(Number(matches.value)) : '';
    showClippedName();
    const available = sides.filter(key => points?.[key]);
    side.replaceChildren(...available.map(key => new Option(sideNames[key], key)));
    if (available.includes(preferred)) side.value = preferred;
    side.disabled = submit.disabled = available.length === 0;
  }

  function filter() {
    const term = query.value.trim().toLowerCase();
    const previousId = matches.value;
    const previousSide = side.value;
    const numeric = /^\d+$/.test(term);
    const words = term.split(/\s+/);
    const found = rows.filter(row => numeric ? String(row.id) === term :
      words.every(word => row.text.includes(word)));
    // Put exact acronyms and exact names first; matching labels keep their native IDs.
    found.sort((a, b) => Number(b.exact.includes(term)) - Number(a.exact.includes(term)));
    matches.replaceChildren(...found.map(row => new Option(row.title, String(row.id))));
    const retained = found.find(row => String(row.id) === previousId);
    if (retained && (!found[0].exact.includes(term) || retained.exact.includes(term))) matches.value = previousId;
    matches.disabled = !found.length;
    selectSides(previousSide);
    status.textContent = found.length ? found.length + (found.length === 1 ? ' matching label.' : ' matching labels.') :
      (term === '0' ? 'ID 0 marks unlabelled voxels.' : 'No directly labelled structure matches this search.');
  }

  async function prepare() {
    if (rows || loading) return;
    loading = true;
    retry.hidden = true;
    status.textContent = 'Reading the atlas locations…';
    try {
      locations = await readLocations(source);
      rows = source.ids.filter(id => id !== 0).map(id => {
        const {name, acronym} = source.labelName(id);
        const title = source.describe(id);
        return {id, title, text: (name + ' ' + acronym).toLowerCase(),
          exact: [name.toLowerCase(), acronym.toLowerCase()]};
      }).sort((a, b) => a.title.localeCompare(b.title, 'en') || a.id - b.id);
      query.disabled = false;
      filter();
      const point = current();
      const id = source.label(point);
      if (id) {
        matches.value = String(id);
        const r = source.origin[0] + source.spacing[0] * point[0];
        selectSides(r < 0 ? 'left' : r > 0 ? 'right' : 'midline');
      }
    } catch {
      status.textContent = 'The structure locations couldn’t load. You can still explore the cuts.';
      retry.hidden = false;
    } finally {
      loading = false;
    }
  }

  group.addEventListener('toggle', () => { if (group.open) prepare(); });
  retry.onclick = prepare;
  query.oninput = filter;
  matches.onchange = () => { selectSides(side.value); };
  form.onsubmit = event => {
    event.preventDefault();
    if (submit.disabled) return;
    const point = locations[matches.value]?.[side.value];
    if (!point || source.label(point) !== Number(matches.value)) {
      status.textContent = 'This location has no matching native ID.';
      return;
    }
    jump([...point]);
  };
  if (group.open) prepare();
}
