import {voxelLabel} from './section-coordinates.js';
import {loadAtlasLabels, measureLabelRuns} from './atlas-label-runs.js';

export function crossedVoxels(start, end) {
  const point = [...start];
  const steps = end.map((value, axis) => value - start[axis]);
  const direction = steps.map(Math.sign);
  const denominators = steps.map(step => 2 * Math.abs(step));
  const numerators = [1, 1, 1];
  const path = [];
  let entry = 0;
  while (true) {
    const remaining = steps.flatMap((_, axis) => point[axis] === end[axis] ? [] : [axis]);
    if (!remaining.length) {
      path.push({indices: point, fraction: path.length ? 1 : 0, entry, exit: path.length ? 1 : 0});
      return path;
    }
    // Half-integer faces give odd integer numerators. Compare the times exactly
    // so a shared edge or corner advances all tied axes without adding side cells.
    const compare = (a, b) => numerators[a] * denominators[b] - numerators[b] * denominators[a];
    const next = remaining.reduce((a, b) => compare(a, b) <= 0 ? a : b);
    const exit = numerators[next] / denominators[next];
    path.push({indices: [...point], fraction: path.length ? (entry + exit) / 2 : 0, entry, exit});
    for (const axis of remaining.filter(axis => compare(axis, next) === 0)) {
      point[axis] += direction[axis];
      numerators[axis] += 2;
    }
    entry = exit;
  }
}

export function bindRulerWalk(details, getView, renderModel) {
  const slider = details.querySelector('input');
  const reading = details.querySelector('[role="status"]');
  const buttons = [...details.querySelectorAll('[data-ruler-step]')];
  let endpoints = [];
  let path;
  let length;
  let selected;
  let request = 0;
  let animation;
  let pending;
  const segments = bindSegments(details, voxel => {
    slider.value = voxel + 1;
    queue();
  });

  function cursor() {
    const point = getView()?.selected;
    if (point && selected?.every((value, axis) => value === point.indices[axis])) return point;
  }

  function updatePosition() {
    const position = Number(slider.value);
    segments.select(position - 1);
    const text = 'Voxel ' + position + ' of ' + path.length;
    slider.setAttribute('aria-valuetext', text);
    for (const button of buttons) {
      const next = position + Number(button.dataset.rulerStep);
      button.setAttribute('aria-disabled', String(next < 1 || next > path.length));
    }
    return text;
  }

  async function move(attempt) {
    const {mine, view} = attempt;
    const current = () => mine === request && details.open && getView() === view;
    if (!path || !view || !current()) return;
    const position = updatePosition();
    const {indices, fraction} = path[Number(slider.value) - 1];
    const distance = 'Line sample ' + (fraction * length).toFixed(3) + ' mm from A.';
    const prefix = position + '. ' + distance + ' ';
    reading.textContent = prefix + 'Opening the cut…';
    try {
      const reason = await view.follow(indices, () => {
        if (!current()) return false;
        attempt.committing = true;
        return true;
      });
      if (mine !== request || !details.open || getView()?.reader !== view.reader) return;
      if (reason) {
        if (current()) {
          reading.textContent = prefix + reason + ' The last cut stays open.';
          segments.markers('No ruler marker in the cut or the 3D view.');
        }
        return;
      }
      selected = indices;
      const accepted = cursor();
      if (!accepted) {
        selected = undefined;
        reading.textContent = 'The cut moved. Choose Show this voxel to return to the line.';
        segments.markers('The ruler marker is cleared.');
        return;
      }
      reading.textContent = prefix + 'Voxel centre ' + voxelLabel((axis, value) => value, accepted.values) +
        ' · ' + accepted.label;
      segments.markers(getView().inVolume(accepted)
        ? 'The cut and the 3D view mark this voxel centre.'
        : 'The cut marks this voxel centre. It lies outside the 3D view.');
      renderModel();
    } catch (error) {
      if (!current()) return;
      reading.textContent = prefix + 'This cut couldn’t load. The last cut stays open.';
      segments.markers('No ruler marker in the cut or the 3D view.');
      console.warn('Ruler section unavailable:', error);
    } finally {
      if (pending === attempt) pending = undefined;
    }
  }

  function queue() {
    if (!path || !details.open) return;
    updatePosition();
    segments.markers('');
    selected = undefined;
    renderModel();
    const attempt = {mine: ++request, view: getView(), committing: false};
    pending = attempt;
    cancelAnimationFrame(animation);
    animation = requestAnimationFrame(() => move(attempt));
  }

  slider.oninput = queue;
  details.querySelector('[data-ruler-show]').onclick = queue;
  for (const button of buttons) {
    button.onclick = () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      slider.value = Number(slider.value) + Number(button.dataset.rulerStep);
      queue();
    };
  }
  details.ontoggle = () => {
    if (details.open) {
      segments.open();
      queue();
    } else {
      request++;
      pending = undefined;
      selected = undefined;
      renderModel();
    }
  };

  return {
    cursor,
    show(pair) {
      if (pair?.[0] !== endpoints[0] || pair?.[1] !== endpoints[1]) {
        request++;
        pending = undefined;
        selected = undefined;
        endpoints = pair ? [...pair] : [];
        if (pair) {
          const [a, b] = pair;
          path = crossedVoxels(a.indices, b.indices);
          length = Math.hypot(...b.values.map((value, axis) => value - a.values[axis]));
          slider.max = path.length;
          slider.value = 1;
          segments.reset(path, a.space);
          if (details.open) {
            segments.open();
            queue();
          }
        } else {
          path = undefined;
          segments.reset();
          details.open = false;
          reading.textContent = '';
        }
      }
      details.hidden = !path;
      const interrupted = pending && !pending.committing && pending.view !== getView();
      if (interrupted) {
        request++;
        pending = undefined;
      }
      if (interrupted || (selected && !cursor())) {
        selected = undefined;
        reading.textContent = 'The cut moved. Choose Show this voxel to return to the line.';
        segments.markers('The ruler marker is cleared.');
      }
    },
  };
}

function bindSegments(details, jump) {
  const status = details.querySelector('#ruler-segment-status');
  const nativeLabel = details.querySelector('#ruler-native-label');
  const markerStatus = details.querySelector('#ruler-marker-status');
  const list = details.querySelector('#ruler-segment-list');
  const timeline = details.querySelector('#ruler-segment-timeline');
  const retry = details.querySelector('#ruler-segment-retry');
  let path;
  let space;
  let started;
  let source;
  let measurement;
  let selected = 0;
  let active;
  let buttons = [];

  function select(voxel) {
    selected = voxel;
    if (!measurement) return;
    const id = measurement.labels[voxel];
    const next = 'Whole atlas grid · ' + source.describe(id);
    if (nativeLabel.textContent !== next) nativeLabel.textContent = next;
    const run = measurement.activeRuns[voxel];
    if (run === active) return;
    buttons[active]?.removeAttribute('aria-current');
    buttons[run]?.setAttribute('aria-current', 'step');
    timeline.children[active]?.classList.remove('active');
    timeline.children[run]?.classList.add('active');
    active = run;
  }

  function showRuns() {
    const {runs, total} = measurement;
    if (!total) {
      status.textContent = 'A and B coincide. The ruler has zero length.';
      return;
    }
    status.textContent = runs.length + (runs.length === 1 ? ' stretch' : ' stretches') +
      ' along ' + total.toFixed(3) + ' mm.';
    const bands = [];
    const entries = [];
    for (const [i, run] of runs.entries()) {
      const band = document.createElement('span');
      band.style.flexGrow = run.exit - run.entry;
      bands.push(band);
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.rulerSegment = i;
      button.textContent = source.describe(run.id);
      const range = document.createElement('span');
      range.className = 'ruler-segment-range';
      const mm = fraction => (fraction * total).toFixed(3);
      range.textContent = mm(run.entry) + '–' + mm(run.exit) + ' mm from A · ' +
        mm(run.exit - run.entry) + ' mm long';
      button.append(' ', range);
      button.onclick = () => jump(run.firstVoxel);
      const entry = document.createElement('li');
      entry.append(button);
      entries.push(entry);
      buttons.push(button);
    }
    list.replaceChildren(...entries);
    timeline.replaceChildren(...bands);
    timeline.hidden = false;
  }

  async function open() {
    if (!path || started) return;
    const current = path;
    started = true;
    retry.hidden = true;
    status.textContent = 'Reading the whole atlas grid…';
    try {
      const loaded = await loadAtlasLabels();
      if (path !== current) return;
      if (space !== loaded.space) throw Error('Ruler and annotation use different atlas grids');
      source = loaded;
      measurement = measureLabelRuns(path, source);
      showRuns();
      select(selected);
    } catch (error) {
      if (path !== current) return;
      status.textContent = 'The atlas grid couldn’t load. You can still step through the cuts.';
      retry.hidden = false;
      console.warn('Atlas segment lengths unavailable:', error);
    }
  }

  retry.onclick = () => {
    started = false;
    open();
  };

  return {
    open,
    select,
    markers(text) { markerStatus.textContent = text; },
    reset(next, atlasSpace) {
      path = next;
      space = atlasSpace;
      started = false;
      measurement = source = active = undefined;
      selected = 0;
      buttons = [];
      list.replaceChildren();
      timeline.replaceChildren();
      timeline.hidden = retry.hidden = true;
      nativeLabel.textContent = markerStatus.textContent = status.textContent = '';
    },
  };
}
