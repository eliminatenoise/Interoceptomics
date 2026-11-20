import {axes, bindFragmentCopy, formatMm, savedMeasurement, voxelLabel} from './section-coordinates.js';
import {bindRulerWalk} from './ruler-walk.js';

const roles = ['A', 'B'];
export const pointColours = ['#075d60', '#642984'];

export function atlasSpace(annotation, origin, spacing) {
  return [annotation, origin.join(','), spacing].join('/');
}

export function bindLocationComparison(panel, territory, sendToModel) {
  const buttons = [...panel.querySelectorAll('[data-compare-point]')];
  const readings = [...panel.querySelectorAll('[data-atlas-point]')];
  const clear = panel.querySelector('[data-clear-comparison]');
  const measurements = panel.querySelector('[data-distance-measurements]');
  const displacement = panel.querySelector('[data-distance-delta]');
  const length = panel.querySelector('[data-distance-length]');
  const visibility = panel.querySelector('[data-distance-visibility]');
  const points = [undefined, undefined];
  let view;
  let previousModel = '[[],null]';
  let previousOverlay;
  let overlay;
  const observer = new ResizeObserver(drawOverlay);
  const walk = bindRulerWalk(panel.querySelector('#ruler-walk'), () => view, renderModel);
  const refreshCopy = bindFragmentCopy(panel.querySelector('#distance-save'), () => {
    if (!view || !points.every(point => point?.space === view.space)) return;
    return savedMeasurement(view.space, currentSection(), points.map(point => point.section));
  }, 'Measurement copied.');

  function currentSection() {
    return {...view.section, territory: territory(view.reader)};
  }

  function drawOverlay() {
    if (!overlay) return;
    const projected = points.map(point => point?.space === view.space ? view.project(point.indices) : undefined);
    overlay.hidden = !projected.some(Boolean);
    if (overlay.hidden) return;
    const {width, height} = view.canvas.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const painting = JSON.stringify([projected, points.map(point => point?.labelled), width, height, ratio]);
    if (painting === previousOverlay) return;
    previousOverlay = painting;
    overlay.width = Math.ceil(width * ratio);
    overlay.height = Math.ceil(height * ratio);
    const context = overlay.getContext('2d');
    context.setTransform(overlay.width / width, 0, 0, overlay.height / height, 0, 0);
    const positions = projected.map(unit => unit && [width * unit[0], height * unit[1]]);
    if (positions.every(Boolean)) {
      context.beginPath();
      context.moveTo(...positions[0]);
      context.lineTo(...positions[1]);
      context.strokeStyle = '#fff';
      context.lineWidth = 4;
      context.stroke();
      context.strokeStyle = '#18232c';
      context.lineWidth = 2;
      context.stroke();
    }
    for (const [i, position] of positions.entries()) {
      if (!position) continue;
      const [x, y] = position;
      const colour = pointColours[i];
      context.beginPath();
      context.arc(x, y, i === 0 ? 6 : 3.5, 0, 2 * Math.PI);
      context.lineWidth = 2;
      context.strokeStyle = '#fff';
      context.stroke();
      if (points[i].labelled) {
        context.fillStyle = colour;
        context.fill();
      }
      context.lineWidth = 1;
      context.strokeStyle = colour;
      context.stroke();
      context.font = 'bold 12px Arial, Helvetica, sans-serif';
      context.textAlign = x > width - 17 ? 'right' : 'left';
      const textX = x > width - 17 ? x - 8 : x + 8;
      const textY = Math.max(12, Math.min(height - 3, y + (i === 0 ? -7 : 14)));
      context.lineWidth = 3;
      context.strokeStyle = '#fff';
      context.strokeText(roles[i], textX, textY);
      context.fillStyle = colour;
      context.fillText(roles[i], textX, textY);
    }
  }

  function renderModel() {
    const model = view ? points.map(point => point?.space === view.space && view.inVolume(point)
      ? {values: point.values, labelled: point.labelled} : null) : [];
    const cursor = walk.cursor();
    const centre = cursor && view.inVolume(cursor) ? cursor.values : null;
    const key = JSON.stringify([model.some(Boolean) ? model : [], centre]);
    if (key !== previousModel) {
      previousModel = key;
      return sendToModel(model, centre);
    }
  }

  function render() {
    buttons.forEach(button => { button.disabled = !view?.selected; });
    for (const [i, point] of points.entries()) {
      const text = point ? voxelLabel((axis, value) => value, point.values) + ' · ' + point.label : 'Choose a voxel';
      if (readings[i].textContent !== text) readings[i].textContent = text;
    }
    const [a, b] = points;
    const complete = !!a && !!b && a.space === b.space;
    measurements.hidden = !complete;
    if (complete) {
      const delta = b.values.map((value, i) => value - a.values[i]);
      const differences = delta.map((value, i) =>
        'Δ' + axes[i] + ' ' + (value > 0 ? '+' : '') + formatMm(value)
      ).join(' · ') + ' mm';
      const distance = Math.hypot(...delta).toFixed(3) + ' mm';
      if (displacement.textContent !== differences) displacement.textContent = differences;
      if (length.textContent !== distance) length.textContent = distance;
    }
    const missing = view ? points.flatMap((point, i) =>
      point && (point.space !== view.space || !view.inVolume(point)) ? [roles[i]] : []
    ) : [];
    const note = a && b && !complete ? 'Choose both voxels in the same atlas space.' :
      missing.length ? missing.join(' and ') + (missing.length === 1 ? ' is' : ' are') + ' outside this 3D atlas window.' : '';
    if (visibility.textContent !== note) visibility.textContent = note;
    walk.show(complete && a.space === view?.space ? points : undefined);
    refreshCopy();
    drawOverlay();
    renderModel();
  }

  for (const [i, button] of buttons.entries()) {
    button.onclick = () => {
      if (!view?.selected) return;
      points[i] = {...view.selected, space: view.space, section: currentSection()};
      render();
    };
  }
  clear.onclick = () => {
    points.fill(undefined);
    render();
  };

  return {
    refreshCopy,
    get selected() { return view?.selected; },
    replacePoints([a, b]) {
      points[0] = a;
      points[1] = b;
      render();
    },
    show(next) {
      if (view?.reader !== next.reader) {
        observer.disconnect();
        overlay?.remove();
        previousOverlay = undefined;
        overlay = document.createElement('canvas');
        overlay.className = 'atlas-distance-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.hidden = true;
        next.canvas.parentElement.append(overlay);
        observer.observe(next.canvas);
        document.getElementById(next.reader + '-distance-slot').append(panel);
        panel.hidden = false;
      }
      view = next;
      render();
    },
    close(reader) {
      if (view?.reader !== reader) return;
      observer.disconnect();
      overlay.remove();
      overlay = view = undefined;
      panel.hidden = true;
      render();
    },
  };
}
