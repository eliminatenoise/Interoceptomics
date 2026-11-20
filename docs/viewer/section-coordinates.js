export const axes = ['R', 'A', 'S'];
export const sectionNames = ['Sagittal', 'Coronal', 'Axial'];
export const sectionOrder = [1, 0, 2];
export const arrowSteps = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowDown: [0, -1], ArrowUp: [0, 1]};

export function formatMm(value) {
  return String(value).replace('-', '−');
}

export function coordinateLabel(coordinate, axis, index) {
  return axes[axis] + ' ' + formatMm(coordinate(axis, index)) + ' mm';
}

export function voxelLabel(coordinate, point) {
  return point.map((index, axis) => axes[axis] + ' ' + formatMm(coordinate(axis, index))).join(' · ') + ' mm';
}

export function setSectionLevels(select, coordinate, {axis, first, stop, selected, fallback}) {
  const options = [];
  for (let index = first; index < stop; index++) {
    options.push(new Option(coordinateLabel(coordinate, axis, index), index));
  }
  select.replaceChildren(...options);
  select.value = selected >= first && selected < stop ? selected : fallback;
}

export function voxelInPlane(point, axis, index, horizontal, vertical) {
  if (point?.[axis] === index) return [point[horizontal], point[vertical]];
}

export function availableSectionAxis(point, current, levels) {
  return [current, ...sectionOrder].find(axis =>
    point[axis] >= levels[axis].first && point[axis] < levels[axis].stop
  );
}

export function readCoordinates(values, {start, stop, coordinate, outside}) {
  const point = [];
  for (const [axis, typed] of values.entries()) {
    const value = typed.trim().replace(/^−/, '-');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
      return {axis, error: 'Enter ' + axes[axis] + ' as a decimal number in mm.'};
    }
    // Check the typed fraction before binary conversion can round off-grid input.
    if (!/^(?:0*|50*)$/.test(value.split('.')[1] ?? '')) {
      return {axis, error: axes[axis] + ' falls between the 0.5 mm grid centres.'};
    }
    const index = (Number(value) - coordinate(axis, 0)) * 2;
    if (index < start[axis] || index >= stop[axis]) {
      const range = formatMm(coordinate(axis, start[axis])) + ' to ' +
        formatMm(coordinate(axis, stop[axis] - 1)) + ' mm';
      return {axis, error: outside + ' ' + axes[axis] + ' runs from ' + range + '.'};
    }
    point.push(index);
  }
  return {point};
}

export function readSavedPoint({values, axis}, domain, levels) {
  const sectionOnly = values.length === 1;
  const coords = sectionOnly ? domain.start.map((index, dim) =>
    dim === axis ? values[0] : String(domain.coordinate(dim, index))
  ) : values;
  const result = readCoordinates(coords, domain);
  if (result.error) return result;
  const {first, stop} = levels[axis];
  if (result.point[axis] < first || result.point[axis] >= stop) {
    return {error: 'The saved ' + (sectionOnly ? 'cut' : 'voxel') + ' lies outside the positions listed for that direction of cut.'};
  }
  return sectionOnly ? {level: result.point[axis]} : result;
}

export function bindCoordinateJump(form, {jump, ...domain}) {
  const inputs = axes.map(axis => form.elements.namedItem(axis));
  const status = form.querySelector('[role="status"]');
  const report = (message, field) => {
    status.textContent = message;
    field?.setAttribute('aria-invalid', 'true');
  };

  form.onsubmit = event => {
    event.preventDefault();
    for (const field of inputs) field.removeAttribute('aria-invalid');
    const result = readCoordinates(inputs.map(field => field.value), domain);
    if (result.error) {
      report(result.error, inputs[result.axis]);
      return;
    }
    report(jump(result.point));
  };
  form.oninput = event => {
    event.target.removeAttribute('aria-invalid');
    clear();
  };
  function clear() {
    if (status.textContent) status.textContent = '';
  }
  return {
    clear,
    reset() {
      form.reset();
      for (const field of inputs) field.removeAttribute('aria-invalid');
      clear();
    },
  };
}

const savedViewVersion = 'atlas-v1';
const savedMeasurementVersion = 'atlas-measure-v1';
const savedPlanes = sectionNames.map(name => name.toLowerCase());

function readView(territory, plane, extent, coordinates, allowLevel = false) {
  const axis = savedPlanes.indexOf(plane);
  const values = coordinates.split(',');
  const validExtent = territory === 'pao' ? ['near', 'full'].includes(extent) :
    ['vpl', 'vpm'].includes(territory) && extent === 'crop';
  if (!validExtent || axis === -1 || (values.length !== axes.length && !(allowLevel && values.length === 1))) return;
  return {territory, axis, extent, values};
}

function makeView({territory, axis, extent, values}) {
  return [territory, savedPlanes[axis], extent, values.join(',')];
}

export function parseSavedView(fragment) {
  if (fragment.length > 160 || !fragment.startsWith('#' + savedViewVersion + '/')) return;
  const parts = fragment.slice(1).split('/');
  if (parts.length === 5) return readView(...parts.slice(1));
}

export function parseSavedMeasurement(fragment) {
  if (fragment.length > 300 || !fragment.startsWith('#' + savedMeasurementVersion + '/')) return;
  const parts = fragment.slice(1).split('/');
  if (parts.length !== 7) return;
  const [, annotation, origin, spacing, view, start, finish] = parts;
  if (!/^[a-f0-9]{64}$/.test(annotation)) return;
  function readPart(part, allowLevel = false) {
    const fields = part.split(':');
    if (fields.length === 4) return readView(...fields, allowLevel);
  }
  const saved = readPart(view, true);
  const endpoints = [readPart(start), readPart(finish)];
  if (saved && endpoints.every(Boolean)) return {saved, endpoints, space: [annotation, origin, spacing].join('/')};
}

export function savedMeasurement(space, view, endpoints) {
  return '#' + [savedMeasurementVersion, space,
    ...[view, ...endpoints].map(section => makeView(section).join(':'))].join('/');
}

export function bindFragmentCopy(group, fragment, copiedMessage) {
  const button = group.querySelector('button');
  const manual = group.querySelector('[data-manual-copy]');
  const input = group.querySelector('input');
  const status = group.querySelector('[role="status"]');
  let shown;

  function refresh() {
    const current = fragment();
    if (current === shown) return;
    shown = current;
    button.disabled = !current;
    manual.hidden = true;
    status.textContent = '';
  }

  button.onclick = async () => {
    const saved = fragment();
    if (!saved) return;
    try {
      await navigator.clipboard.writeText(saved);
      if (saved !== fragment()) return;
      manual.hidden = true;
      status.textContent = copiedMessage;
    } catch {
      if (saved !== fragment()) return;
      input.value = saved;
      manual.hidden = false;
      status.textContent = 'Copy the selected text.';
      input.focus();
      input.select();
    }
  };
  return refresh;
}

export function bindSavedViewCopy(group, territory) {
  let point;
  const refresh = bindFragmentCopy(group, () => {
    const label = territory();
    if (!point || !label) return;
    return '#' + [savedViewVersion, ...makeView({...point, territory: label})].join('/');
  }, 'Saved view copied.');
  return {
    showPoint(next) {
      point = next;
      refresh();
    },
    refresh,
  };
}
