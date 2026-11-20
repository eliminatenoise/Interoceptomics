import {arrowSteps, availableSectionAxis, axes, bindCoordinateJump, coordinateLabel, formatMm, readSavedPoint, sectionNames, sectionOrder, setSectionLevels, voxelInPlane, voxelLabel} from './section-coordinates.js';
import {atlasSpace} from './location-comparison.js';

const directions = ['right', 'anterior', 'superior'];
const views = [
  {horizontal: 1, vertical: 2, initial: 171},
  {horizontal: 0, vertical: 2, initial: 227},
  {horizontal: 0, vertical: 1, initial: 140},
];

async function loadGrid(comparison) {
  const {file, sha256} = comparison.source_grid;
  const response = await fetch('./' + file, {signal: AbortSignal.timeout(10000)});
  if (!response.ok) throw Error('HTTP ' + response.status);
  const data = await response.arrayBuffer();
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  const hex = Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('');
  if (hex !== sha256) throw Error('Source grid checksum mismatch');
  const grid = JSON.parse(new TextDecoder().decode(data));
  if (grid.schema !== 1 || grid.annotation_sha256 !== comparison.source_annotation_sha256 ||
      grid.spacing_mm !== comparison.voxel_size_mm ||
      grid.labels.join(',') !== comparison.regions.map(region => region.id).join(',') ||
      grid.shape.reduce((product, length) => product * length, 1) !== grid.cells.length ||
      /[^012]/.test(grid.cells)) throw Error('Unrecognised source grid');
  return grid;
}

export async function makeSourceSections(comparison, elements, onPlane) {
  const grid = await loadGrid(comparison);
  const {orientation, level, canvas, status, directionsLabel, marker, voxel, coordinateForm, showSavedPoint, showDistance} = elements;
  const {start_index: start, shape, ras_origin_mm: origin, cells, spacing_mm: spacing} = grid;
  const mm = (axis, index) => origin[axis] + index * spacing;
  const lower = start.map((index, axis) => mm(axis, index - .5));
  const upper = start.map((index, axis) => mm(axis, index + shape[axis] - .5));
  const stop = start.map((index, axis) => index + shape[axis]);
  const levels = start.map((index, axis) => ({first: index + 1, stop: stop[axis] - 1}));
  const browsedLevels = views.map(view => view.initial);
  orientation.replaceChildren(...sectionOrder.map(axis => new Option(sectionNames[axis], axis)));
  const colours = {1: comparison.regions[0].color, 2: comparison.regions[1].color};
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('2D drawing unavailable');
  const labels = ['Outside VPL and VPM', 'VPL (' + grid.labels[0] + ')', 'VPM (' + grid.labels[1] + ')'];
  const space = atlasSpace(grid.annotation_sha256, origin, spacing);
  let plot;
  let selectedVoxel;
  const domain = {start, stop, coordinate: mm, outside: 'Outside the VPL/VPM crop.'};
  const coordinateJump = bindCoordinateJump(coordinateForm, {
    ...domain,
    jump(point) {
      const current = Number(orientation.value);
      const axis = availableSectionAxis(point, current, levels);
      if (axis === undefined) return 'This voxel is inside the crop, beyond the listed levels in all three planes.';
      selectedVoxel = point;
      orientation.value = axis;
      setOrientation();
      return axis === current ? '' : 'Opened the ' + sectionNames[axis].toLowerCase() + ' plane at this voxel.';
    },
  });

  function cursorInPlot(voxel = selectedVoxel) {
    const {axis, index, view: {horizontal, vertical}} = plot;
    const point = voxelInPlane(voxel, axis, index, horizontal, vertical);
    if (point && point[0] >= start[horizontal] && point[0] < stop[horizontal] &&
        point[1] >= start[vertical] && point[1] < stop[vertical]) {
      return [point[0] - start[horizontal], point[1] - start[vertical]];
    }
  }

  function hideMarker() {
    marker.hidden = true;
    marker.style.removeProperty('left');
    marker.style.removeProperty('top');
    showSavedPoint();
  }

  function describePoint(indices, code) {
    return {
      indices: [...indices],
      values: indices.map((index, axis) => mm(axis, index)),
      labelled: code !== '0',
      label: code === '0' ? 'Outside VPL and VPM. Native label unavailable in this crop.' : labels[code],
    };
  }

  function showCursor() {
    const {axis, index, cell, centre, width, height} = plot;
    const cursor = cursorInPlot();
    const code = cursor && cell(...cursor);
    const selected = cursor && describePoint(selectedVoxel, code);
    showDistance({
      reader: 'source', canvas, space,
      selected,
      section: {axis, extent: 'crop', values: selected?.values ?? [mm(axis, index)]},
      project(indices) {
        const point = cursorInPlot(indices);
        if (point) {
          const [x, y] = centre(...point);
          return [x / width, y / height];
        }
      },
      inVolume: ({indices}) => indices.every((index, dim) => index >= start[dim] && index < stop[dim]),
      follow(point, commit) {
        const current = Number(orientation.value);
        if (point.some((index, dim) => index < start[dim] || index >= stop[dim])) {
          return 'This voxel lies outside the VPL/VPM crop.';
        }
        const axis = availableSectionAxis(point, current, levels);
        if (axis === undefined) return 'No supplied plane in this crop contains this voxel.';
        if (!commit()) return;
        coordinateJump.clear();
        selectedVoxel = [...point];
        if (axis !== current) {
          orientation.value = axis;
          setOrientation();
        } else if (point[axis] !== index) {
          level.value = point[axis];
          draw();
        } else {
          showCursor();
        }
      },
    });
    if (!selectedVoxel) {
      hideMarker();
      voxel.textContent = '';
      return;
    }
    if (!cursor) {
      hideMarker();
      const coordinate = coordinateLabel(mm, axis, selectedVoxel[axis]);
      voxel.textContent = 'The selected voxel lies at ' + coordinate + ', outside the listed levels.';
      return;
    }
    const [horizontal, vertical] = cursor;
    const [x, y] = centre(horizontal, vertical);
    marker.style.left = 100 * x / width + '%';
    marker.style.top = 100 * y / height + '%';
    marker.hidden = false;
    const reading = voxelLabel(mm, selectedVoxel) + ' · ' + labels[code];
    if (reading !== voxel.textContent) voxel.textContent = reading;
    showSavedPoint({axis, extent: 'crop', values: selected.values});
  }

  function inspect(horizontal, vertical) {
    coordinateJump.clear();
    const {axis, index, view} = plot;
    selectedVoxel = [];
    selectedVoxel[axis] = index;
    selectedVoxel[view.horizontal] = start[view.horizontal] + horizontal;
    selectedVoxel[view.vertical] = start[view.vertical] + vertical;
    showCursor();
  }

  function draw() {
    const axis = Number(orientation.value);
    const index = Number(level.value);
    const view = views[axis];
    const horizontal = view.horizontal;
    const vertical = view.vertical;
    const extent = [shape[horizontal], shape[vertical]];
    const coords = [0, 0, 0];
    coords[axis] = index - start[axis];
    const cell = (h, v) => {
      coords[horizontal] = h;
      coords[vertical] = v;
      return cells[(coords[0] * shape[1] + coords[1]) * shape[2] + coords[2]];
    };
    const width = 284;
    const unit = Math.min(6, 216 / extent[0]);
    const plotWidth = extent[0] * unit;
    const plotHeight = extent[1] * unit;
    const left = 54 + (216 - plotWidth) / 2;
    const top = 17;
    const height = Math.ceil(top + plotHeight + 32);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(dpr * width);
    canvas.height = Math.ceil(dpr * height);
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f3f5f6';
    ctx.fillRect(left, top, plotWidth, plotHeight);
    const x = h => left + h * unit;
    const y = v => top + plotHeight - v * unit;
    const counts = [0, 0, 0];
    const edges = [];
    function trace(other, here, x1, y1, x2, y2) {
      if (Number(here) + Number(other) === 3) edges.push([x1, y1, x2, y2]);
    }
    for (let h = 0; h < extent[0]; h += 1) {
      for (let v = 0; v < extent[1]; v += 1) {
        const here = cell(h, v);
        counts[here] += 1;
        if (here === '0') continue;
        ctx.fillStyle = colours[here];
        ctx.fillRect(x(h), y(v + 1), unit, unit);
        if (here === '2') {
          ctx.fillStyle = '#fff';
          ctx.fillRect(x(h) + unit * .35, y(v + 1) + unit * .35, unit * .3, unit * .3);
        }
        if (h + 1 < extent[0]) trace(cell(h + 1, v), here, x(h + 1), y(v), x(h + 1), y(v + 1));
        if (v + 1 < extent[1]) trace(cell(h, v + 1), here, x(h), y(v + 1), x(h + 1), y(v + 1));
      }
    }
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of edges) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#27323a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = '#6b7980';
    ctx.strokeRect(left, top, plotWidth, plotHeight);
    ctx.fillStyle = '#27323a';
    ctx.font = '12px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatMm(upper[vertical]), left - 5, top + 4);
    ctx.fillText(formatMm(lower[vertical]), left - 5, y(0) + 4);
    ctx.textAlign = 'left';
    ctx.fillText(formatMm(lower[horizontal]), left, y(0) + 16);
    ctx.textAlign = 'right';
    ctx.fillText(formatMm(upper[horizontal]), x(extent[0]), y(0) + 16);
    ctx.textAlign = 'center';
    ctx.fillText(axes[horizontal] + ' (mm)', left + plotWidth / 2, y(0) + 30);
    ctx.save();
    ctx.translate(12, top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(axes[vertical] + ' (mm)', 0, 0);
    ctx.restore();
    directionsLabel.textContent = 'Towards ' + directions[horizontal] + ' → · Towards ' + directions[vertical] + ' ↑';
    status.textContent = sectionNames[axis] + ' · ' + coordinateLabel(mm, axis, index) +
      ' · VPL ' + counts[1] + ' / VPM ' + counts[2] + ' voxels · ' + edges.length + ' shared edges';
    canvas.setAttribute('aria-label', status.textContent + '. ' +
      axes[horizontal] + ' ranges from ' + formatMm(lower[horizontal]) + ' to ' + formatMm(upper[horizontal]) + ' mm. ' +
      axes[vertical] + ' ranges from ' + formatMm(lower[vertical]) + ' to ' + formatMm(upper[vertical]) + ' mm.');
    plot = {axis, index, view, cell, width, height, left, top, unit, extent,
      centre: (h, v) => [x(h + .5), y(v + .5)]};
    onPlane(axis, index);
    showCursor();
  }

  function clearCursor() {
    selectedVoxel = undefined;
    hideMarker();
    voxel.textContent = '';
  }

  function setOrientation(savedLevel) {
    const axis = Number(orientation.value);
    setSectionLevels(level, mm, {axis, ...levels[axis], selected: savedLevel ?? selectedVoxel?.[axis], fallback: browsedLevels[axis]});
    draw();
  }

  orientation.onchange = () => {
    coordinateJump.clear();
    setOrientation();
  };
  level.onchange = () => {
    coordinateJump.clear();
    const axis = Number(orientation.value);
    const index = Number(level.value);
    browsedLevels[axis] = index;
    // Step through levels at the same in-plane location. An off-plane voxel has no marker here.
    if (cursorInPlot()) selectedVoxel[axis] = index;
    else clearCursor();
    draw();
  };
  canvas.onclick = event => {
    if (!plot) return;
    const rect = canvas.getBoundingClientRect();
    const {width, height, left, top, unit, extent} = plot;
    const h = Math.floor(((event.clientX - rect.left) * width / rect.width - left) / unit);
    const row = Math.floor(((event.clientY - rect.top) * height / rect.height - top) / unit);
    if (h >= 0 && h < extent[0] && row >= 0 && row < extent[1]) {
      inspect(h, extent[1] - 1 - row);
    }
  };
  canvas.onkeydown = event => {
    if (!plot || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const delta = arrowSteps[event.key];
    if (!delta) return;
    event.preventDefault();
    const dimensions = plot.extent;
    const point = cursorInPlot() || dimensions.map(length => Math.floor(length / 2));
    inspect(...point.map((offset, i) => Math.max(0, Math.min(dimensions[i] - 1, offset + delta[i]))));
  };
  return {
    space,
    prepareSavedView(saved) {
      const prepared = readSavedPoint(saved, domain, levels);
      if (prepared.point) {
        const [r, a, s] = prepared.point.map((index, axis) => index - start[axis]);
        const code = cells[(r * shape[1] + a) * shape[2] + s];
        prepared.measurementPoint = describePoint(prepared.point, code);
      }
      return prepared;
    },
    open(saved) {
      coordinateJump.reset();
      browsedLevels.splice(0, browsedLevels.length, ...views.map(view => view.initial));
      clearCursor();
      selectedVoxel = saved?.point;
      orientation.value = saved?.axis ?? 1;
      setOrientation(saved?.level);
    },
    close() {
      coordinateJump.reset();
      plot = undefined;
      clearCursor();
      showDistance();
    },
  };
}
