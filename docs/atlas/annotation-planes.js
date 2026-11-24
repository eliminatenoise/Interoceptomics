import {axes, arrowSteps, bindCoordinateJump, bindFragmentCopy, coordinateLabel, sectionNames, sectionOrder, voxelLabel} from './section-coordinates.js';
import {bindRegionFinder} from './region-finder.js';
import {loadAtlasLabels} from './atlas-label-runs.js';

// Distinguish common neighbours by hue and lightness. The exact identity is
// always given in text because 141 labels cannot be discriminated by colour.
const colours = [
  [99, 158, 213], [244, 175, 87], [178, 134, 192], [104, 187, 172],
  [237, 132, 135], [222, 204, 117], [72, 116, 155], [159, 187, 104],
  [205, 111, 168], [106, 188, 221], [188, 142, 128], [180, 179, 216],
];
const directions = [
  ['P', 'A', 'S', 'I', 'Back on the left, front on the right, up at the top, down at the bottom.'],
  ['L', 'R', 'S', 'I', 'The body’s left on the left of the screen, its right on the right, up at the top, down at the bottom.'],
  ['L', 'R', 'A', 'P', 'The body’s left on the left of the screen, its right on the right, front at the top, back at the bottom.'],
];
const pointPrefix = '#atlas-labels-v1/';
const highlightPrefix = '#atlas-labels-v2/';
const selectedColour = [255, 202, 62];
const mutedColour = [95, 106, 115];
const number = new Intl.NumberFormat('en', {maximumFractionDigits: 3});
const initialPoint = [159, 224, 152]; // Left VPL/VPM neighbourhood

export function parseAnnotationPoint(fragment) {
  const highlight = fragment.startsWith(highlightPrefix);
  const prefix = highlight ? highlightPrefix : pointPrefix;
  if (!fragment.startsWith(prefix) || fragment.length > 180) return;
  const parts = fragment.slice(prefix.length).split('/');
  if (highlight && parts.pop() !== 'highlight') return;
  if (parts.length !== 4 || !/^[a-f0-9]{64}$/.test(parts[0]) ||
      !/^\d{1,3},\d{1,3},\d{1,3}$/.test(parts[3])) return;
  return {highlight, space: parts.slice(0, 3).join('/'), point: parts[3].split(',').map(Number)};
}

export function annotationPalette(ids) {
  return ids.map(id => id === 0 ? [32, 45, 55] : colours[id % colours.length]);
}

export function bindAnnotationPlanes(panel, {mode, modelPoint, modelReady, modelFailed}) {
  const status = panel.querySelector('#annotation-status');
  const retry = panel.querySelector('#annotation-retry');
  const tools = panel.querySelector('#annotation-tools');
  const sectionTemplate = panel.querySelector('template');
  const form = panel.querySelector('#annotation-coordinate');
  const inputs = axes.map(axis => form.elements.namedItem(axis));
  const reading = panel.querySelector('#annotation-voxel');
  const modelReading = panel.querySelector('#annotation-model');
  const readout = panel.querySelector('#annotation-reading');
  const highlight = panel.querySelector('#region-highlight');
  const key = panel.querySelector('#region-key');
  const volume = panel.querySelector('#region-volume');
  const regionName = panel.querySelector('#region-name');
  const countsTable = panel.querySelector('#region-counts');
  new ResizeObserver(() => {
    panel.style.setProperty('--annotation-readout-height', readout.offsetHeight + 'px');
  }).observe(readout);
  let point = initialPoint;
  let source;
  let opening = 0;
  let animation;
  let pending;
  let panes;
  let palette;
  let formControl;
  let modelRequest;
  let modelResult;
  const refreshCopy = bindFragmentCopy(panel.querySelector('#annotation-save-view'), () =>
    source ? (highlight.checked ? highlightPrefix : pointPrefix) + source.space + '/' +
      point.join(',') + (highlight.checked ? '/highlight' : '') : '', 'Saved view copied.');

  function updateVolume(id) {
    if (!volume.open) return;
    const counts = source.labelCounts(id);
    countsTable.hidden = !counts;
    regionName.textContent = counts ? source.describe(id) : 'This voxel is in no region, so there is nothing to measure.';
    if (!counts) return;
    const {left, midline, right} = counts;
    const values = [left, midline, right, left + midline + right];
    for (const [i, row] of Array.from(countsTable.tBodies[0].rows).entries()) {
      row.cells[1].textContent = number.format(values[i]);
      row.cells[2].textContent = number.format(values[i] * source.voxelVolume);
    }
  }

  volume.addEventListener('toggle', () => {
    if (source && volume.open) updateVolume(source.label(point));
  });
  highlight.addEventListener('change', () => choose(pending ?? point));

  function prepare() {
    const coordinate = (axis, index) => source.origin[axis] + index * source.spacing[axis];
    const {shape, ids} = source;
    palette = annotationPalette(ids);
    panes = sectionOrder.map(axis => {
      const [u, v] = axes.map((_, index) => index).filter(index => index !== axis);
      const fragment = sectionTemplate.content.cloneNode(true);
      const heading = fragment.querySelector('h3');
      const slider = fragment.querySelector('input');
      const sliderLabel = fragment.querySelector('label');
      const canvas = fragment.querySelector('canvas');
      const cross = fragment.querySelector('.annotation-cross');
      const matches = fragment.querySelector('.region-plane-count');
      const edges = [...fragment.querySelectorAll('[data-direction]')];
      const [left, right, top, bottom, description] = directions[axis];
      heading.textContent = sectionNames[axis];
      slider.id = 'annotation-level-' + axis;
      sliderLabel.htmlFor = slider.id;
      slider.max = shape[axis] - 1;
      canvas.dataset.axis = axis;
      canvas.setAttribute('aria-label', sectionNames[axis] + ' cut. ' + description);
      [left, right, top, bottom].forEach((word, i) => { edges[i].textContent = word; });
      const width = canvas.width = shape[u];
      const height = canvas.height = shape[v];
      const context = canvas.getContext('2d');
      const image = context.createImageData(width, height);
      const plane = new Uint16Array(width * height);
      const pane = {axis, u, v, width, height, canvas, context, image, plane, slider, sliderLabel, cross, matches};
      slider.oninput = () => {
        const next = [...(pending ?? point)];
        next[axis] = slider.valueAsNumber;
        choose(next);
      };
      canvas.onclick = event => {
        const box = canvas.getBoundingClientRect();
        const next = [...point];
        next[u] = Math.floor((event.clientX - box.left) * width / box.width);
        next[v] = height - 1 - Math.floor((event.clientY - box.top) * height / box.height);
        choose(next);
      };
      canvas.onkeydown = event => {
        const direction = arrowSteps[event.key];
        if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        const next = [...(pending ?? point)];
        next[u] += direction[0] * (event.shiftKey ? 10 : 1);
        next[v] += direction[1] * (event.shiftKey ? 10 : 1);
        choose(next);
      };
      panel.querySelector('#annotation-grid').append(fragment);
      return pane;
    });
    formControl = bindCoordinateJump(form, {
      coordinate, start: [0, 0, 0], stop: shape, outside: 'Outside the atlas grid.',
      jump: next => { choose(next); },
    });
    bindRegionFinder(panel.querySelector('#region-finder'), source, () => point, next => {
      highlight.checked = true;
      volume.open = true;
      choose(next);
      const canvas = panes[0].canvas;
      canvas.focus({preventScroll: true});
      canvas.closest('section').scrollIntoView({block: 'start'});
    });
    return coordinate;
  }

  let coordinate;
  function choose(next) {
    pending = next.map((value, axis) => Math.max(0, Math.min(source.shape[axis] - 1, value)));
    if (animation) return;
    animation = requestAnimationFrame(() => {
      animation = undefined;
      draw(pending);
      pending = undefined;
    });
  }

  function draw(next) {
    point = next;
    const id = source.label(point);
    const mask = highlight.checked && id > 0 ? source.ids.indexOf(id) : -1;
    key.hidden = !highlight.checked;
    key.textContent = mask >= 0 ? 'Gold marks this region. Grey marks other regions. Dark tiles are in no region.'
      : 'Pick a tile inside a region to highlight that region.';
    for (const pane of panes) {
      const {axis, u, v, width, height, canvas, context, image, plane, slider, sliderLabel, cross} = pane;
      const newLevel = pane.index !== point[axis];
      if (newLevel) source.plane(axis, point[axis], plane);
      if (newLevel || pane.mask !== mask) {
        let matched = 0;
        const {data} = image;
        for (let pixel = 0; pixel < plane.length; pixel++) {
          const code = plane[pixel];
          let colour = palette[code];
          if (mask >= 0) {
            if (code === mask) {
              colour = selectedColour;
              matched++;
            } else if (source.ids[code] !== 0) colour = mutedColour;
          }
          data[pixel * 4] = colour[0];
          data[pixel * 4 + 1] = colour[1];
          data[pixel * 4 + 2] = colour[2];
          data[pixel * 4 + 3] = 255;
        }
        context.putImageData(image, 0, 0);
        pane.mask = mask;
        pane.matches.hidden = mask < 0;
        pane.matches.textContent = mask < 0 ? '' : number.format(matched) +
          (matched === 1 ? ' matching voxel in this cut.' : ' matching voxels in this cut.');
        pane.index = point[axis];
        canvas.dataset.level = pane.index;
      }
      const level = coordinateLabel(coordinate, axis, point[axis]);
      slider.value = point[axis];
      slider.setAttribute('aria-valuetext', level);
      sliderLabel.textContent = sectionNames[axis] + ' cut · ' + level;
      cross.style.left = 100 * (point[u] + 0.5) / width + '%';
      cross.style.top = 100 * (height - point[v] - 0.5) / height + '%';
    }
    point.forEach((index, axis) => {
      inputs[axis].value = coordinate(axis, index);
      inputs[axis].removeAttribute('aria-invalid');
    });
    formControl.clear();
    updateVolume(id);
    const text = voxelLabel(coordinate, point) + ' · ' + source.describe(id);
    if (reading.textContent !== text) reading.textContent = text;
    reading.dataset.indices = point.join(',');
    reading.dataset.label = id;
    refreshCopy();
    syncModel();
  }

  function syncModel() {
    if (panel.hidden) return;
    if (!source || tools.hidden) {
      modelRequest = modelResult = undefined;
      modelPoint(null);
      return;
    }
    let text;
    if (coordinate(0, point[0]) > 0) {
      text = 'This voxel is on the right side. The 3D model covers the left.';
    } else if (source.label(point) === 0) {
      text = 'The atlas puts this voxel in no region. The 3D model has no marker here.';
    } else if (!modelReady()) {
      text = modelFailed?.() ? 'The 3D model couldn’t load. You can still read the three cuts.' : 'The 3D model has not loaded yet. You can already read the three cuts.';
    }
    if (text) {
      modelRequest = modelResult = undefined;
      modelPoint(null);
      modelReading.textContent = text;
      return;
    }
    const ras = point.map((index, axis) => coordinate(axis, index));
    if (modelRequest?.join(',') === ras.join(',')) return;
    modelRequest = ras;
    modelResult = undefined;
    modelReading.textContent = 'Finding this voxel in the 3D model…';
    modelPoint(ras);
  }

  function modelReadback({ras, inView}) {
    if (panel.hidden || !modelRequest || ras?.join(',') !== modelRequest.join(',') || modelResult === inView) return;
    modelResult = inView;
    modelReading.textContent = inView
      ? 'The teal cross marks this voxel in the 3D model. Not every region has a surface there.'
      : 'This voxel lies outside what the 3D view shows now.';
  }

  async function open(request = {}, current = () => true) {
    const attempt = ++opening;
    const loaded = await loadAtlasLabels();
    if (attempt !== opening || !current()) return false;
    if ((request.space && request.space !== loaded.space) ||
        (request.point && !request.point.every((index, axis) => index >= 0 && index < loaded.shape[axis]))) {
      throw Error('The saved view refers to another atlas grid, or to a voxel outside this one.');
    }
    const wasHidden = panel.hidden;
    modelRequest = modelResult = undefined;
    source = loaded;
    coordinate ??= prepare();
    panel.hidden = false;
    tools.hidden = retry.hidden = true;
    mode(true);
    tools.hidden = false;
    status.textContent = '';
    cancelAnimationFrame(animation);
    animation = pending = undefined;
    if (request.space) highlight.checked = request.highlight === true;
    draw(request.point ?? point);
    if (wasHidden) panel.querySelector('#annotation-close').focus();
    return true;
  }

  async function show(request) {
    panel.hidden = false;
    tools.hidden = retry.hidden = true;
    mode(true);
    status.textContent = 'Reading the atlas grid…';
    panel.querySelector('#annotation-close').focus();
    const attempt = opening + 1;
    try {
      await open(request);
    } catch (error) {
      if (attempt !== opening) return;
      status.textContent = 'The atlas grid couldn’t load.';
      retry.hidden = false;
      console.warn('Full annotation planes unavailable:', error);
    }
  }

  function close(restoreFocus = true) {
    if (panel.hidden) return;
    opening++;
    panel.hidden = true;
    cancelAnimationFrame(animation);
    animation = pending = undefined;
    modelRequest = modelResult = undefined;
    mode(false, restoreFocus);
  }
  for (const back of panel.querySelectorAll('.annotation-back')) back.onclick = () => close();

  retry.onclick = () => show();
  return {
    open, show, close, syncModel, modelReadback,
    reportSavedViewError(message) {
      if (!panel.hidden && !tools.hidden) status.textContent = message;
    },
  };
}
