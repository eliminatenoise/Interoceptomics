import {arrowSteps, availableSectionAxis, bindCoordinateJump, coordinateLabel, formatMm, readSavedPoint, sectionNames, sectionOrder, setSectionLevels, voxelInPlane, voxelLabel} from './section-coordinates.js';
import {atlasSpace} from './location-comparison.js';

const directions = ['Right', 'Front', 'Up'];
const neighbourhood = [
  [13230, '#654495'],
  [12177, '#147b72'],
  [12144, '#b6572d'],
  [12132, '#2c6896'],
  [12135, '#8a4963'],
  [12127, '#8a702c'],
];
const colours = new Map(neighbourhood);
const decoder = new TextDecoder();

async function checkedFile({file, sha256, bytes}) {
  const response = await fetch('./' + file, {signal: AbortSignal.timeout(10000)});
  if (!response.ok) throw Error('HTTP ' + response.status);
  const data = await response.arrayBuffer();
  if (data.byteLength !== bytes) throw Error('Section file length mismatch');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  if (Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('') !== sha256) {
    throw Error('Section file checksum mismatch');
  }
  return data;
}

function decodePlane(data, start, end, size, labels) {
  const encoded = new DataView(data, start, end - start);
  const cells = new Uint32Array(size);
  let next = 0;
  for (let i = 0; i < encoded.byteLength; i += 8) {
    const count = encoded.getUint32(i, true);
    const label = encoded.getUint32(i + 4, true);
    if (!count || next + count > size || !Object.hasOwn(labels, label)) throw Error('Invalid voxel run');
    cells.fill(label, next, next + count);
    next += count;
  }
  if (next !== size) throw Error('Incomplete plane');
  return cells;
}

export async function makeParietalSections(spec, elements, onPlane) {
  const index = JSON.parse(decoder.decode(await checkedFile(spec)));
  if (index.schema !== 1 || index.annotation_sha256 !== spec.annotation_sha256 ||
      index.voxel_size_mm !== spec.voxel_size_mm || index.target_id !== spec.target_id ||
      !Array.isArray(index.planes) || index.planes.length !== 3) throw Error('Unrecognised annotation index');
  const {atlas_shape: shape, ras_origin_mm: origin, voxel_size_mm: spacing, labels, target_id: target} = index;
  const {orientation, level, extent, highlight, key, canvas, reading, bounds, voxel, status, frame, coordinateForm, showSavedPoint, showDistance} = elements;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('2D drawing unavailable');
  const files = new Map();
  const rgb = new Map(neighbourhood.map(([id, value]) => [id,
    value.slice(1).match(/../g).map(component => parseInt(component, 16))]));
  const coordinate = (axis, offset) => origin[axis] + spacing * offset;
  const space = atlasSpace(index.annotation_sha256, origin, spacing);
  const levels = index.planes.map(plane => ({first: plane.first_index, stop: plane.stop_index}));
  const browsedLevels = index.planes.map(plane => plane.initial_index);
  let request = 0;
  let active = false;
  let plane;
  let displayedLevel;
  let cells;
  let hStart, hStop, vStart, vStop;
  let selectedVoxel;
  let example;
  let image;
  const domain = {start: [0, 0, 0], stop: shape, coordinate, outside: 'Outside the atlas grid.'};
  function outsideNeighbourhood(point, {horizontal, vertical}) {
    return [horizontal, vertical].some(dim =>
      point[dim] < index.focus_start_index[dim] || point[dim] >= index.focus_stop_index[dim]);
  }
  const coordinateJump = bindCoordinateJump(coordinateForm, {
    ...domain,
    jump(point) {
      const current = Number(orientation.value);
      const axis = availableSectionAxis(point, current, levels);
      if (axis === undefined) return 'This voxel lies outside every cut that contains PaO.';
      const openFull = extent.value === 'near' && outsideNeighbourhood(point, index.planes[axis]);
      if (openFull) extent.value = 'full';
      selectedVoxel = point;
      orientation.value = axis;
      setOrientation();
      const changes = [];
      if (axis !== current) changes.push('Opened the ' + sectionNames[axis].toLowerCase() + ' cut at this voxel.');
      if (openFull) changes.push('This voxel lies outside PaO and its neighbours, so the whole cut is shown.');
      return changes.join(' ');
    },
  });

  function inWindow(point) {
    return point && point[0] >= hStart && point[0] < hStop && point[1] >= vStart && point[1] < vStop;
  }

  function cursorInWindow(voxel = selectedVoxel) {
    const {axis, horizontal, vertical} = plane;
    const point = voxelInPlane(voxel, axis, displayedLevel, horizontal, vertical);
    if (inWindow(point)) return point;
  }

  function pointAt(h, v) {
    const {axis, horizontal, vertical} = plane;
    const point = [];
    point[axis] = displayedLevel;
    point[horizontal] = h;
    point[vertical] = v;
    return point;
  }

  function labelIdAt(h, v) {
    return cells[v * shape[plane.horizontal] + h];
  }

  function describeLabel(labelId) {
    const [acronym, name] = labels[labelId];
    return labelId ? name + ' (' + acronym + ', ' + labelId + ')' : 'In no region (0)';
  }

  function describePoint(indices, id) {
    return {
      indices: [...indices],
      values: indices.map((index, axis) => coordinate(axis, index)),
      labelled: id !== 0,
      label: describeLabel(id),
    };
  }

  function showCursor() {
    ctx.putImageData(image, 0, 0);
    const cursor = cursorInWindow();
    const id = cursor && labelIdAt(...cursor);
    const selected = cursor && describePoint(selectedVoxel, id);
    const full = extent.value === 'full';
    const start = full ? domain.start : index.focus_start_index;
    const stop = full ? shape : index.focus_stop_index;
    showDistance({
      reader: 'pao', canvas, space,
      selected,
      section: {axis: plane.axis, extent: extent.value, values: selected?.values ?? [coordinate(plane.axis, displayedLevel)]},
      project(indices) {
        const point = cursorInWindow(indices);
        if (point) return [(point[0] - hStart + .5) / canvas.width, (vStop - point[1] - .5) / canvas.height];
      },
      inVolume: ({indices, values}) => values[0] <= 0 &&
        indices.every((index, dim) => index >= start[dim] && index < stop[dim]),
      follow,
    });
    let message;
    if (cursor) {
      const [h, v] = cursor;
      const col = h - hStart + .5;
      const row = vStop - v - .5;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeRect(col - 3, row - 3, 6, 6);
      ctx.strokeStyle = '#19232c';
      ctx.lineWidth = 1;
      ctx.strokeRect(col - 3, row - 3, 6, 6);
      message = voxelLabel(coordinate, selectedVoxel) + ' · ' + describeLabel(id);
    } else if (selectedVoxel && selectedVoxel[plane.axis] !== displayedLevel) {
      const at = coordinateLabel(coordinate, plane.axis, selectedVoxel[plane.axis]);
      message = 'The selected voxel lies at ' + at + ', outside the positions listed for this direction of cut.';
    } else if (selectedVoxel) {
      message = 'The selected voxel (' + voxelLabel(coordinate, selectedVoxel) +
        ') lies outside this part of the cut. Under How much of the cut, choose The whole cut to see it.';
    } else {
      message = voxelLabel(coordinate, pointAt(...example)) + ' · ' + describeLabel(labelIdAt(...example));
    }
    if (voxel.textContent !== message) voxel.textContent = message;
    showSavedPoint(cursor && {
      axis: plane.axis, extent: extent.value, values: selected.values,
    });
  }

  function inspect(h, v) {
    coordinateJump.clear();
    selectedVoxel = pointAt(h, v);
    showCursor();
  }

  function draw(moveFrame = true) {
    if (!active || canvas.hidden) return;
    const {axis, horizontal, vertical} = plane;
    const full = extent.value === 'full';
    const start = full ? [0, 0, 0] : index.focus_start_index;
    const stop = full ? shape : index.focus_stop_index;
    hStart = start[horizontal];
    hStop = stop[horizontal];
    vStart = start[vertical];
    vStop = stop[vertical];
    canvas.width = hStop - hStart;
    canvas.height = vStop - vStart;
    image = ctx.createImageData(canvas.width, canvas.height);
    const counts = new Map();
    const selected = Number(highlight.value) || target;
    const accent = [0, 101, 103];
    const tissue = [203, 210, 219];
    const outside = [246, 248, 250];
    let pixel = 0;
    let firstTarget;
    for (let v = vStop - 1; v >= vStart; v--) {
      for (let h = hStart; h < hStop; h++) {
        const id = cells[v * shape[horizontal] + h];
        counts.set(id, (counts.get(id) || 0) + 1);
        if (id === target && !firstTarget) firstTarget = [h, v];
        const [red, green, blue] = id === selected && selected !== target ? accent :
          rgb.get(id) || (id ? tissue : outside);
        image.data[pixel++] = red;
        image.data[pixel++] = green;
        image.data[pixel++] = blue;
        image.data[pixel++] = 255;
      }
    }
    const sorted = [...counts].filter(([id]) => id && id !== target)
      .sort(([a], [b]) => labels[a][1].localeCompare(labels[b][1], 'en'));
    highlight.replaceChildren(new Option('PaO and nearby regions', target),
      ...sorted.map(([id, count]) => new Option(labels[id][1] + ' (' + labels[id][0] + ') · ' + count, id)));
    highlight.value = counts.has(selected) && selected ? selected : target;
    const nearby = neighbourhood.filter(([id]) => counts.has(id));
    key.replaceChildren(...nearby.map(([id, colour]) => {
      const item = document.createElement('li');
      item.style.setProperty('--region-color', id === Number(highlight.value) && id !== target ? '#006567' : colour);
      item.textContent = labels[id][1];
      return item;
    }));
    const chosen = Number(highlight.value);
    if (chosen !== target && !colours.has(chosen)) {
      const item = document.createElement('li');
      item.style.setProperty('--region-color', '#006567');
      item.textContent = labels[chosen][1];
      key.append(item);
    }
    reading.textContent = sectionNames[axis] + ' · ' + coordinateLabel(coordinate, axis, displayedLevel) +
      ' · ' + (counts.get(target) || 0) + ' PaO voxels';
    const displayBounds = (dim, low, high) => formatMm(coordinate(dim, low - .5)) +
      ' to ' + formatMm(coordinate(dim, high - .5)) + ' mm';
    bounds.textContent = directions[horizontal] + ' → ' + displayBounds(horizontal, hStart, hStop) +
      ' · ' + directions[vertical] + ' ↑ ' + displayBounds(vertical, vStart, vStop);
    if (!inWindow(example)) example = firstTarget || [hStart, vStart];
    if (moveFrame) onPlane({axis, index: displayedLevel, full});
    showCursor();
  }

  function setReady(ready) {
    frame.disabled = highlight.disabled = extent.disabled = !ready;
    canvas.tabIndex = ready ? 0 : -1;
    canvas.closest('figure').hidden = canvas.hidden = !ready;
    if (!ready) {
      showSavedPoint();
      showDistance();
      reading.textContent = bounds.textContent = voxel.textContent = '';
      key.replaceChildren();
    }
  }

  function loadPlaneFile(next) {
    if (!files.has(next.axis)) {
      const pending = checkedFile(next).then(data => {
        files.set(next.axis, data);
        return data;
      }, error => {
        files.delete(next.axis);
        throw error;
      });
      files.set(next.axis, pending);
    }
    return files.get(next.axis);
  }

  function readLevel(next, selected, file) {
    const [start, end] = next.byte_offsets.slice(selected - next.first_index, selected - next.first_index + 2);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > file.byteLength ||
        end <= start || (end - start) % 8 !== 0) throw Error('Invalid section offset');
    return decodePlane(file, start, end, shape[next.horizontal] * shape[next.vertical], labels);
  }

  function showLevel(next, selected, nextCells) {
    cells = nextCells;
    if (plane?.axis !== next.axis) example = undefined;
    plane = next;
    displayedLevel = selected;
    status.textContent = '';
    setReady(true);
    draw();
  }

  async function follow(point, commit) {
    const axis = availableSectionAxis(point, plane.axis, levels);
    if (axis === undefined) return 'No cut here contains this voxel.';
    const next = index.planes[axis];
    const selected = point[axis];
    const sameLevel = plane.axis === axis && displayedLevel === selected;
    const sameWindow = extent.value === 'full' || !outsideNeighbourhood(point, next);
    const nextCells = sameLevel ? cells : readLevel(next, selected, await loadPlaneFile(next));
    if (!commit()) return;
    coordinateJump.clear();
    selectedVoxel = [...point];
    if (!sameWindow) extent.value = 'full';
    if (axis !== plane.axis) {
      orientation.value = axis;
      setOrientation({level: selected, cells: nextCells});
    } else if (!sameLevel || !sameWindow) {
      level.value = selected;
      showLevel(next, selected, nextCells);
    } else {
      showCursor();
    }
  }

  async function setLevel() {
    const mine = ++request;
    const next = index.planes[Number(orientation.value)];
    const selected = Number(level.value);
    try {
      let file = loadPlaneFile(next);
      if (!(file instanceof ArrayBuffer)) {
        setReady(false);
        onPlane(null);
        status.textContent = 'Loading ' + next.name + ' cuts…';
        file = await file;
      }
      if (!active || mine !== request) return;
      showLevel(next, selected, readLevel(next, selected, file));
    } catch (error) {
      if (active && mine === request) {
        setReady(false);
        onPlane(null);
        status.textContent = 'This cut couldn’t load. Change its direction, or close and reopen the cuts, to try again.';
        console.warn('Parietal operculum section unavailable:', error);
      }
    }
  }

  function setOrientation(saved) {
    const axis = Number(orientation.value);
    setSectionLevels(level, coordinate, {axis, ...levels[axis],
      selected: saved?.level ?? selectedVoxel?.[axis], fallback: browsedLevels[axis]});
    if (saved?.cells) {
      request++;
      showLevel(index.planes[axis], Number(level.value), saved.cells);
    } else {
      setLevel();
    }
  }

  orientation.replaceChildren(...sectionOrder.map(axis => new Option(sectionNames[axis], axis)));
  orientation.onchange = () => {
    coordinateJump.clear();
    setOrientation();
  };
  level.onchange = () => {
    coordinateJump.clear();
    const axis = Number(orientation.value);
    const next = Number(level.value);
    browsedLevels[axis] = next;
    if (!canvas.hidden && plane.axis === axis && cursorInWindow()) selectedVoxel[axis] = next;
    else selectedVoxel = undefined;
    setLevel();
  };
  extent.onchange = () => {
    coordinateJump.clear();
    draw();
  };
  highlight.onchange = () => draw(false);
  canvas.onclick = event => {
    if (!active || canvas.hidden) return;
    const rect = canvas.getBoundingClientRect();
    const h = hStart + Math.floor((event.clientX - rect.left) / rect.width * canvas.width);
    const v = vStop - 1 - Math.floor((event.clientY - rect.top) / rect.height * canvas.height);
    if (inWindow([h, v])) inspect(h, v);
  };
  canvas.onkeydown = event => {
    if (!active || canvas.hidden || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const delta = arrowSteps[event.key];
    if (!delta) return;
    event.preventDefault();
    const cursor = cursorInWindow() || example;
    inspect(
      Math.max(hStart, Math.min(hStop - 1, cursor[0] + delta[0])),
      Math.max(vStart, Math.min(vStop - 1, cursor[1] + delta[1]))
    );
  };
  frame.onclick = () => onPlane({axis: plane.axis, index: displayedLevel, full: extent.value === 'full', frame: true});
  return {
    space,
    async prepareSavedView(saved) {
      const result = readSavedPoint(saved, domain, levels);
      if (result.error) return result;
      const {point} = result;
      const next = index.planes[saved.axis];
      if (point && saved.extent === 'near' && outsideNeighbourhood(point, next)) {
        return {error: 'The saved voxel lies outside PaO and its neighbours in that direction of cut.'};
      }
      const cells = readLevel(next, result.level ?? point[saved.axis], await loadPlaneFile(next));
      if (point) result.measurementPoint = describePoint(point, cells[point[next.vertical] * shape[next.horizontal] + point[next.horizontal]]);
      return {...result, cells};
    },
    open(saved) {
      coordinateJump.reset();
      active = true;
      orientation.value = saved?.axis ?? 1;
      extent.value = saved?.extent ?? 'near';
      highlight.value = target;
      selectedVoxel = saved?.point;
      example = undefined;
      setOrientation(saved);
    },
    close() {
      coordinateJump.reset();
      active = false;
      request++;
      selectedVoxel = undefined;
      setReady(false);
      status.textContent = '';
      onPlane(null);
    },
  };
}
