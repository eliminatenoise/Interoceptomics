const indexURL = new URL('./assets/atlas-label-runs.json', import.meta.url);
const binaryURL = new URL('./assets/atlas-label-runs.bin', import.meta.url);
let loading;

export function readLabelRuns(index, buffer) {
  const {shape: [nx, ny, nz], ids, names, qform} = index;
  const data = new DataView(buffer);
  const rowCount = ny * nz;
  const firstRun = rowCount + 1;
  const word = index => data.getUint32(index * 4, true);
  if (word(0) !== 0 || firstRun + word(rowCount) !== data.byteLength / 4) {
    throw Error('Atlas label offsets do not match the index');
  }

  function searchRow(row, x) {
    let low = word(row);
    const stop = word(row + 1);
    let high = stop;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if ((word(firstRun + mid) & 65535) <= x) low = mid + 1;
      else high = mid;
    }
    const code = low < stop ? word(firstRun + low) >>> 16 : ids.length;
    if (ids[code] === undefined) throw Error('Source label missing at voxel');
    return code;
  }

  function copyRow(row, target, from) {
    const stop = word(row + 1);
    let x = 0;
    for (let run = word(row); run < stop; run++) {
      const value = word(firstRun + run);
      const end = value & 65535;
      target.fill(value >>> 16, from + x, from + end);
      x = end;
    }
  }

  // Split each existing x run at the R = 0 plane once. Index coordinates
  // increase towards anatomical right in this registered, axis-aligned qform.
  // The two cutoffs also distinguish a midline between two voxel centres.
  let counts;
  function labelCounts(id) {
    const code = ids.indexOf(id);
    if (code < 0 || id === 0) return null;
    if (!counts) {
      counts = Array.from(ids, () => ({left: 0, midline: 0, right: 0}));
      const zeroIndex = -qform.origin_mm[0] / qform.spacing_mm[0];
      const firstNonLeft = Math.ceil(zeroIndex);
      const firstRight = Math.floor(zeroIndex) + 1;
      for (let row = 0; row < rowCount; row++) {
        let x = 0;
        const stop = word(row + 1);
        for (let run = word(row); run < stop; run++) {
          const value = word(firstRun + run);
          const end = value & 65535;
          const left = Math.max(0, Math.min(firstNonLeft, end) - x);
          const right = Math.max(0, end - Math.max(firstRight, x));
          const bin = counts[value >>> 16];
          bin.left += left;
          bin.right += right;
          bin.midline += end - x - left - right;
          x = end;
        }
      }
    }
    return counts[code];
  }

  return {
    shape: [nx, ny, nz],
    ids,
    labelCounts,
    // Absolute determinant of the verified axis-aligned native qform.
    voxelVolume: Math.abs(qform.spacing_mm[0] * qform.spacing_mm[1] * qform.spacing_mm[2]),
    origin: qform.origin_mm,
    space: [index.annotation_sha256, qform.origin_mm.join(','), qform.spacing_mm[0]].join('/'),
    spacing: qform.spacing_mm,
    label([x, y, z]) {
      if (x < 0 || x >= nx || y < 0 || y >= ny || z < 0 || z >= nz) {
        throw Error('Voxel outside the atlas annotation');
      }
      return ids[searchRow(y + ny * z, x)];
    },
    // From top-left: horizontal source index increases and vertical index
    // decreases. Keep dense memory limited to the caller's single plane.
    plane(axis, index, target) {
      const width = axis === 0 ? ny : nx;
      const height = axis === 2 ? ny : nz;
      if (axis === 0) {
        for (let z = 0; z < nz; z++) {
          const rowStart = ny * z;
          const offset = (height - z - 1) * width;
          for (let y = 0; y < ny; y++) {
            target[offset + y] = searchRow(rowStart + y, index);
          }
        }
      } else {
        for (let v = 0; v < height; v++) {
          const row = axis === 1 ? index + ny * v : v + ny * index;
          copyRow(row, target, (height - v - 1) * width);
        }
      }
    },
    labelName(id) {
      const [acronym, name] = names[id];
      return {name, acronym};
    },
    describe(id) {
      if (id === 0) return 'Unlabelled atlas voxel (0)';
      const name = names[id];
      return name ? name[1] + ' (' + name[0] + ', ' + id + ')' : 'Atlas label ' + id;
    },
  };
}

export function loadAtlasLabels() {
  if (!loading) {
    loading = readAtlasLabels().catch(error => {
      loading = undefined;
      throw error;
    });
  }
  return loading;
}

async function digestHex(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readAtlasLabels() {
  const [metadata, binary] = await Promise.all([fetch(indexURL), fetch(binaryURL)]);
  if (!metadata.ok || !binary.ok) throw Error('Atlas label files unavailable');
  const [metadataBytes, buffer] = await Promise.all([metadata.arrayBuffer(), binary.arrayBuffer()]);
  const [metadataHash, hash] = await Promise.all([digestHex(metadataBytes), digestHex(buffer)]);
  if (metadataHash !== '904bdadfdf5db64803869a9379b5ba8c1cf6e431bd9e72b27066c0968ada4e94') {
    throw Error('Atlas label dictionary or coordinate metadata differs from the registered source');
  }
  const index = JSON.parse(new TextDecoder().decode(metadataBytes));
  if (index.schema !== 1 || index.binary_bytes !== buffer.byteLength ||
      hash !== index.binary_sha256 || index.shape.join(',') !== '394,466,378' ||
      index.annotation_sha256 !== 'be23763c15386f2f211105f1e8144a6887e7615571229090e209b1c78355d378' ||
      index.qform.origin_mm.join(',') !== '-98,-134,-72' ||
      index.qform.code !== 1 || index.qform.qfac !== 1 || index.qform.quaternion.join(',') !== '0,0,0' ||
      index.qform.spacing_mm.join(',') !== '0.5,0.5,0.5') {
    throw Error('Atlas label files do not match their source index');
  }
  return readLabelRuns(index, buffer);
}

export function measureLabelRuns(path, source) {
  const start = path[0].indices;
  const end = path.at(-1).indices;
  const total = Math.hypot(...end.map((value, axis) => (value - start[axis]) * source.spacing[axis]));
  const runs = [];
  const activeRuns = [];
  const labels = [];
  for (const [voxel, cell] of path.entries()) {
    const id = source.label(cell.indices);
    labels.push(id);
    if (!total) continue;
    const previous = runs.at(-1);
    if (previous?.id === id) {
      previous.exit = cell.exit;
    } else {
      runs.push({id, firstVoxel: voxel, entry: cell.entry, exit: cell.exit});
    }
    activeRuns.push(runs.length - 1);
  }
  return {runs, activeRuns, labels, total};
}
