import {bindSavedViewCopy, parseSavedMeasurement, parseSavedView} from './section-coordinates.js';
import {bindAnnotationPlanes, parseAnnotationPoint} from './annotation-planes.js';
import {bindLocationComparison} from './location-comparison.js';

const frame = document.querySelector('#model');
const controls = document.querySelector('#model-controls');
const status = document.querySelector('#controls-status');
const select = document.querySelector('#label');
const search = document.querySelector('#search');
const scope = document.querySelector('#scope');
const viewAction = document.querySelector('#view-action');
const construction = document.querySelector('#construction');
const surfaceLoading = 'Loading the separate atlas surface…';
const evidence = document.querySelector('#evidence');
const view = document.querySelector('#view');
const isolate = document.querySelector('#isolate');
const focus = document.querySelector('#focus');
const role = document.querySelector('#role');
const reset = document.querySelector('#reset');
const diagnostic = document.querySelector('#qc');
const comparisonEntry = document.querySelector('#comparison-entry');
const comparisonToggle = document.querySelector('#comparison-toggle');
const comparisonHint = document.querySelector('#comparison-hint');
const comparisonPanel = document.querySelector('#comparison-panel');
const comparisonReturn = document.querySelector('#comparison-return');
const comparisonChoices = document.querySelector('#comparison-choices');
const comparisonLegend = document.querySelector('#comparison-legend');
const comparisonSelected = document.querySelector('#comparison-selected');
const boundaryToggle = document.querySelector('#boundary-toggle');
const boundaryDetails = document.querySelector('#boundary-details');
const boundaryStatus = document.querySelector('#boundary-status');
const sectionsToggle = document.querySelector('#sections-toggle');
const sectionsPanel = document.querySelector('#source-sections');
const sectionsStatus = document.querySelector('#sections-status');
const paoEntry = document.querySelector('#pao-entry');
const paoToggle = document.querySelector('#pao-toggle');
const paoPanel = document.querySelector('#pao-sections');
const paoLoading = document.querySelector('#pao-loading');
const boundaryKey = document.createElement('span');
boundaryKey.id = 'boundary-key';
boundaryKey.className = 'comparison-region';
boundaryKey.textContent = 'Shared voxel faces';
boundaryKey.hidden = true;
const atlasControls = document.querySelector('#atlas-controls');
const sidebar = document.querySelector('aside');
const narrow = matchMedia('(max-width: 800px)');
const savedViewForm = document.querySelector('#open-saved-view');
const savedViewInput = document.querySelector('#saved-view-fragment');
const savedViewStatus = document.querySelector('#saved-view-status');
const sourceTerritory = () => comparisonItems.get(identifiedTerritory)?.row.acronym.toLowerCase();
const sourceShare = bindSavedViewCopy(document.querySelector('#source-save-view'), sourceTerritory);
const paoShare = bindSavedViewCopy(document.querySelector('#pao-save-view'), () => 'pao');
const distances = bindLocationComparison(document.querySelector('#atlas-distance'),
  reader => reader === 'pao' ? 'pao' : sourceTerritory(), (points, cursor) => send({distancePoints: points, distanceCursor: cursor}));

const familyNames = {
  insula: 'Insula (all five source labels)',
  amygdaloid: 'Amygdaloid group (all ten occupied labels)',
  basal_ganglia_and_STH: 'Basal ganglia / STH + accumbens context',
  hippocampus: 'Hippocampal head, body and tail',
  basal_forebrain_septal_BNST: 'Basal forebrain + septal / BNST context',
};
let registry;
let available;
let failed = false;
let current = '';
let isolated = false;
let selectionInstruction = scope.textContent;
let viewActionRevision = 0;
let canIsolate = false;
let isolationOnlyLabel;
let qc = false;
let comparing = false;
let beforeComparisonScroll;
let boundaryPhase = 'off';
let sectionsRequested = false;
let sectionsRevision = 0;
let sections;
let pendingSections;
let paoSections;
let paoPending;
let paoOpen = false;
let paoRevision = 0;
let identifiedTerritory;
let waitingSavedView;
let annotationReturn;
const annotationToggle = document.querySelector('#annotation-toggle');
const annotationPanel = document.querySelector('#annotation-panel');
const annotation = bindAnnotationPlanes(annotationPanel, {
  mode(active, restoreFocus = true) {
    if (active) send({annotationMode: true, annotationPoint: null});
    document.body.classList.toggle('has-annotation', active);
    annotationToggle.setAttribute('aria-expanded', String(active));
    if (!active) {
      send({annotationMode: false});
      if (restoreFocus) {
        const destination = annotationReturn?.getClientRects().length ? annotationReturn : annotationToggle;
        destination.focus();
      }
      annotationReturn = undefined;
    }
  },
  modelPoint: point => send({annotationMode: true, annotationPoint: point}),
  modelReady: () => !controls.disabled,
});
for (const button of document.querySelectorAll('[data-open-annotation]')) {
  button.onclick = () => {
    annotationReturn = button;
    annotation.show(button === annotationToggle ? {} : {point: distances.selected?.indices});
  };
}

const comparisonItems = new Map();

function invalidateViewAction(keepLoading = false) {
  viewActionRevision++;
  const stillLoading = keepLoading && available?.deferred.get(Number(current)) === 'pending';
  const text = stillLoading ? surfaceLoading : '';
  if (viewAction.textContent !== text) viewAction.textContent = text;
}

function send(command) {
  if (controls.disabled) return;
  if (command.viewAction) {
    invalidateViewAction();
    command = {...command, viewAction: {name: command.viewAction, revision: viewActionRevision}};
  } else if ('compare' in command || 'sourcePlane' in command) {
    invalidateViewAction();
  } else if ('selection' in command || command.view || command.role || 'qc' in command) {
    invalidateViewAction(true);
  }
  frame.contentWindow.postMessage({type: 'brain-command', command}, location.origin);
}

function viewName(value = view.value) {
  return [...view.options].find(option => option.value === value)?.textContent ?? value;
}

function announceViewAction(action, state) {
  const label = viewName(state.view);
  const messages = {
    isolate: state.isolate
      ? `Isolated the selection at the starting angle for ${label}.`
      : 'The selected atlas surface is unavailable.',
    restore: `Restored the ${label} preset at its starting angle and zoom.`,
    focus: `Centred the selection at the starting angle for ${label}.`,
    reset: `Reset the ${label} preset to its starting angle and zoom.`,
  };
  if (messages[action]) viewAction.textContent = messages[action];
}

function name(row) {
  if (row.display_name) return row.display_name;
  return row.name + ([10361, 10338, 10349].includes(row.id) ? ' · labelled residual territory' : '');
}

function options() {
  const term = search.value.toLowerCase();
  const separate = [];
  const shared = [];
  const sourceOnly = [];
  function collect(value, label, searchable, group) {
    if (searchable.toLowerCase().includes(term) || value === current) group.push(new Option(label, value));
  }
  for (const [id, label] of Object.entries(familyNames)) {
    if (registry.labels.some(row => row.state === 'new_per_label_mesh' && row.family === id && available.separate.has(row.id))) {
      collect('group:' + id, label, label, separate);
    }
  }
  for (const row of registry.labels) {
    if (row.state === 'available_omitted') continue;
    const hasSeparate = available.separate.has(row.id) || available.deferred.get(row.id) === 'pending';
    const group = hasSeparate ? separate : available.shared.has(row.id) ? shared : sourceOnly;
    collect(String(row.id), name(row), [name(row), row.name, row.acronym, row.id].join(' '), group);
  }
  select.replaceChildren(new Option('Choose a source territory', ''));
  for (const [label, choices] of [['Separate meshes', separate], ['Surface samples', shared], ['Atlas labels only', sourceOnly]]) {
    if (!choices.length) continue;
    const group = document.createElement('optgroup');
    group.label = label;
    group.append(...choices);
    select.append(group);
  }
  select.value = current;
}

function setIsolation(active) {
  isolated = active;
  document.body.classList.toggle('is-isolated', active || comparing);
  isolate.textContent = isolated ? 'Restore context' : 'Isolate in place';
  isolate.disabled = !canIsolate;
  focus.disabled = !canIsolate || (isolationOnlyLabel && !isolated);
  let instruction = selectionInstruction;
  if (isolated) {
    const label = viewName();
    instruction = `Drag to turn the selection. Focus centres it from the starting angle for ${label}. Restore context returns to that preset at its starting zoom.`;
  } else if (isolationOnlyLabel) {
    if (!canIsolate) {
      const pending = available.deferred.get(isolationOnlyLabel.id) === 'pending';
      instruction = pending
        ? surfaceLoading
        : isolationOnlyLabel.load_on_selection
          ? 'The separate atlas surface couldn’t load. Its samples remain visible where the cortical surface is exposed. Reload the atlas to try again.'
          : 'The left atlas label is available. Its separate surface couldn’t load. The rest of the brain is ready to explore.';
    } else {
      instruction = isolationOnlyLabel.isolation_context + ' Choose Isolate in place to see the left atlas surface, then drag to turn it.';
    }
  }
  if (scope.textContent !== instruction) scope.textContent = instruction;
}

function setupComparison() {
  const {regions, shared_faces, voxel_size_mm, overlay} = registry.vpl_vpm_comparison;
  for (const region of regions) {
    const row = registry.labels.find(label => label.id === region.id);
    const button = document.createElement('button');
    const legend = document.createElement('span');
    button.type = 'button';
    button.setAttribute('aria-label', row.name + ' (' + row.acronym + ')');
    button.setAttribute('aria-pressed', 'false');
    for (const item of [button, legend]) {
      item.className = 'comparison-region';
      item.style.setProperty('--region-color', region.color);
      item.textContent = row.acronym;
    }
    button.onclick = () => inspectComparisonRegion(row.id);
    comparisonChoices.append(button);
    comparisonLegend.append(legend);
    comparisonItems.set(row.id, {row, button, legend});
  }
  const area = shared_faces * voxel_size_mm ** 2;
  document.querySelector('#comparison-evidence').textContent =
    'VPL and VPM share ' + shared_faces + ' voxel faces (' + area + ' mm²) on the ' + voxel_size_mm + ' mm left Allen atlas grid.';
  const [right, anterior, superior] = overlay.faces_by_RAS_normal;
  boundaryDetails.textContent =
    'Faces by perpendicular axis. Right–left ' + right + ' · front–back ' + anterior + ' · up–down ' + superior +
    '. Individual anatomy and neural connections require separate evidence.';
  boundaryKey.style.setProperty('--region-color', overlay.color);
  comparisonLegend.append(boundaryKey);
}

function showBoundaryStatus(phase) {
  boundaryPhase = phase;
  const active = phase === 'on';
  boundaryToggle.setAttribute('aria-pressed', String(active));
  boundaryToggle.setAttribute('aria-disabled', String(phase === 'loading' || phase === 'unavailable'));
  boundaryDetails.hidden = boundaryKey.hidden = !active;
  const message = phase === 'loading'
    ? 'Loading shared voxel faces…'
    : phase === 'unavailable' ? 'Shared voxel faces couldn’t load. Reload the atlas to try again.' : '';
  if (boundaryStatus.textContent !== message) boundaryStatus.textContent = message;
}

function collapseSections(clearFrame = true) {
  sectionsRevision++;
  sectionsRequested = false;
  sectionsPanel.hidden = true;
  sections?.close();
  sectionsToggle.setAttribute('aria-expanded', 'false');
  sectionsToggle.removeAttribute('aria-disabled');
  sectionsToggle.textContent = 'Show atlas sections';
  sectionsStatus.textContent = '';
  document.body.classList.remove('has-source-section');
  if (clearFrame) send({sourcePlane: null});
}

function showSectionDistance(reader, section) {
  if (section) distances.show(section);
  else distances.close(reader);
  const slot = document.getElementById(reader + '-distance-slot');
  slot.previousElementSibling.disabled = !section?.selected;
}

function loadSourceSections() {
  pendingSections ??= import('./source-sections.js').then(({makeSourceSections}) =>
      makeSourceSections(registry.vpl_vpm_comparison, {
        orientation: document.querySelector('#source-orientation'),
        level: document.querySelector('#source-level'),
        canvas: document.querySelector('#source-section-image'),
        status: document.querySelector('#source-section-reading'),
        directionsLabel: document.querySelector('#source-section-directions'),
        marker: document.querySelector('#source-section-marker'),
        voxel: document.querySelector('#source-section-voxel'),
        coordinateForm: document.querySelector('#source-coordinate'),
        showSavedPoint: point => sourceShare.showPoint(point),
        showDistance: view => showSectionDistance('source', view),
      }, (axis, index) => send({sourcePlane: {axis, index}}))
    ).then(loaded => sections = loaded);
  return pendingSections;
}

async function toggleSections() {
  if (sectionsRequested) {
    collapseSections();
    return;
  }
  const mine = ++sectionsRevision;
  sectionsRequested = true;
  if (!sections) {
    sectionsStatus.textContent = 'Loading atlas sections…';
    try {
      await loadSourceSections();
    } catch (error) {
      if (mine !== sectionsRevision) return;
      console.warn('Atlas sections unavailable:', error);
      collapseSections();
      sectionsToggle.setAttribute('aria-disabled', 'true');
      sectionsStatus.textContent = 'Atlas sections couldn’t load. Reload the atlas to try again.';
      return;
    }
  }
  if (mine !== sectionsRevision || !comparing) return;
  showSourceSections();
  sectionsToggle.scrollIntoView({block: 'start'});
}

function showSourceSections(saved) {
  sectionsRevision++;
  sectionsRequested = true;
  sectionsPanel.hidden = false;
  document.body.classList.add('has-source-section');
  sectionsToggle.setAttribute('aria-expanded', 'true');
  sectionsToggle.textContent = 'Hide atlas sections';
  sectionsStatus.textContent = '';
  sections.open(saved);
}

function closePaoSections() {
  if (!paoOpen) return;
  paoRevision++;
  paoOpen = false;
  paoSections?.close();
  paoToggle.textContent = 'Show parietal operculum sections';
  paoToggle.setAttribute('aria-expanded', 'false');
  paoLoading.textContent = '';
  paoPanel.hidden = true;
  document.body.classList.remove('has-pao-section');
}

function loadPaoSections() {
  if (paoSections) return Promise.resolve(paoSections);
  paoPending ??= import('./parietal-sections.js').then(({makeParietalSections}) => {
      const ids = {
        orientation: 'pao-orientation', level: 'pao-level', extent: 'pao-extent',
        highlight: 'pao-highlight', key: 'pao-key', canvas: 'pao-section-image', reading: 'pao-reading',
        bounds: 'pao-bounds', voxel: 'pao-voxel', status: 'pao-status', frame: 'pao-frame',
        coordinateForm: 'pao-coordinate',
      };
      const elements = Object.fromEntries(Object.entries(ids).map(([name, id]) => [name, document.getElementById(id)]));
      elements.showSavedPoint = point => paoShare.showPoint(point);
      elements.showDistance = view => showSectionDistance('pao', view);
      return makeParietalSections(registry.parietal_operculum_sections, elements, paoPlane => {
        if (paoPlane?.frame) invalidateViewAction(true);
        send({paoPlane});
      });
    }).then(loaded => paoSections = loaded).finally(() => { paoPending = undefined; });
  return paoPending;
}

async function togglePaoSections() {
  if (paoOpen) {
    closePaoSections();
    return;
  }
  const mine = ++paoRevision;
  paoOpen = true;
  paoToggle.textContent = 'Hide parietal operculum sections';
  if (!paoSections) {
    paoLoading.textContent = 'Loading parietal operculum sections…';
    try {
      await loadPaoSections();
    } catch (error) {
      if (mine !== paoRevision) return;
      console.warn('Parietal operculum sections unavailable:', error);
      closePaoSections();
      paoLoading.textContent = 'The sections couldn’t load. Choose Show parietal operculum sections to try again.';
      return;
    }
  }
  if (mine !== paoRevision) return;
  showPaoSections();
  paoToggle.scrollIntoView({block: 'start'});
}

function showPaoSections(saved) {
  paoRevision++;
  paoOpen = true;
  paoToggle.textContent = 'Hide parietal operculum sections';
  paoLoading.textContent = '';
  paoToggle.setAttribute('aria-expanded', 'true');
  paoPanel.hidden = false;
  document.body.classList.add('has-pao-section');
  paoSections.open(saved);
}

function inspectComparisonRegion(id) {
  const item = comparisonItems.get(id);
  if (!item) return;
  identifiedTerritory = id;
  for (const [regionId, {button, legend}] of comparisonItems) {
    button.setAttribute('aria-pressed', String(regionId === id));
    legend.classList.toggle('is-active', regionId === id);
  }
  comparisonSelected.textContent = item.row.name + ' · atlas label ' + item.row.id;
  sourceShare.refresh();
  distances.refreshCopy();
}

function syncComparisonOffer() {
  const visible = comparisonItems.has(Number(current));
  const ready = visible && [...comparisonItems.keys()].every(id => available.separate.has(id));
  comparisonEntry.hidden = !visible;
  comparisonToggle.disabled = !ready;
  comparisonHint.hidden = !visible || ready;
  if (visible && !ready) comparisonToggle.setAttribute('aria-describedby', comparisonHint.id);
  else comparisonToggle.removeAttribute('aria-describedby');
}

function setComparison(active, moveFocus = true) {
  if (active === comparing || (active && comparisonToggle.disabled)) return;
  if (active) beforeComparisonScroll = { windowY: window.scrollY, sidebarY: sidebar.scrollTop, narrow: narrow.matches };
  if (!active) collapseSections(false);
  comparing = active;
  showBoundaryStatus('off');
  comparisonToggle.setAttribute('aria-expanded', String(active));
  comparisonPanel.hidden = comparisonLegend.hidden = !active;
  atlasControls.hidden = active;
  document.body.classList.toggle('is-comparing', active);
  setIsolation(isolated);
  if (active) {
    inspectComparisonRegion(Number(current));
    if (moveFocus) {
      comparisonReturn.focus({preventScroll: true});
      sidebar.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  } else {
    const sameLayout = narrow.matches === beforeComparisonScroll.narrow;
    if (moveFocus) comparisonToggle.focus({preventScroll: sameLayout});
    if (moveFocus && sameLayout) {
      sidebar.scrollTop = beforeComparisonScroll.sidebarY;
      window.scrollTo(0, beforeComparisonScroll.windowY);
    }
    beforeComparisonScroll = undefined;
  }
  send({compare: active});
}

function selection(value, moveFocus = true) {
  if (controls.disabled) return;
  setComparison(false, moveFocus);
  const wasIsolated = isolated;
  const spec = registry.parietal_operculum_sections;
  const showSections = spec && Number(value) === spec.target_id;
  if (!showSections) {
    closePaoSections();
    paoLoading.textContent = '';
  }
  paoEntry.hidden = !showSections;
  current = String(value);
  const family = current.startsWith('group:') ? current.slice(6) : '';
  const rows = family
    ? registry.labels.filter(row => row.state === 'new_per_label_mesh' && row.family === family)
    : registry.labels.filter(row => row.id === Number(current));
  const row = rows[0];
  const meshes = rows.filter(item => available.separate.has(item.id)).length;
  const shared = row && available.shared.has(row.id);
  canIsolate = meshes > 0;
  isolationOnlyLabel = !family && row?.isolation_only ? row : undefined;

  document.querySelector('#name').textContent = family ? familyNames[family] : row ? name(row) : 'Select a territory';
  const association = !isolationOnlyLabel && (meshes || shared) ? 'Selected overlay' : 'Teaching associations';
  document.querySelector('#tags').textContent = rows.length
    ? association + ' · ' + ([...new Set(rows.flatMap(item => item.display_tags))].join(' / ') || 'neutral context') + ' · nonexclusive'
    : '';
  let instruction = 'Drag to rotate and scroll to zoom. The overview and anatomical axes stay available during isolation.';
  if (family) {
    instruction = meshes + ' separate meshes for ' + rows.length + ' source labels. A parent label covers only its own territory.';
  } else if (meshes) {
    instruction = 'Isolate in place hides the surrounding tissue. Focus centres and zooms to the selection from the view’s starting angle.';
  } else if (shared) {
    instruction = 'Dark grey marks the samples assigned to this label where they’re exposed. Focus and isolation require a separate mesh.';
  } else if (row) {
    instruction = 'The source atlas names this territory. This model has no labelled surface samples for it.';
  }
  selectionInstruction = instruction;
  evidence.textContent = row ? row.overlay_reason + ' ' + row.limits.join(' ') : '';
  const links = document.querySelector('#links');
  links.replaceChildren();
  for (const id of new Set(rows.flatMap(item => item.evidence_source_ids))) {
    const source = Array.isArray(registry.sources) ? registry.sources.find(item => item.id === id) : registry.sources?.[id];
    if (!source) continue;
    const link = document.createElement('a');
    link.textContent = id + ' ' + (source.short_citation || source.citation || source.title || 'Primary source');
    link.href = source.url || source.source_url || source.link;
    link.target = '_blank';
    link.rel = 'noreferrer';
    links.append(link, document.createElement('br'));
  }
  setIsolation(false);
  syncComparisonOffer();

  const command = {selection: current};
  if (wasIsolated || !isolationOnlyLabel) command.isolate = false;
  if (meshes && !isolationOnlyLabel) {
    command.view = row.family === 'insula' ? 'InsulaDissection' : 'Deep';
  } else if (shared && row.existing_group === 'cerebral_surface_parcels' && ['InsulaDissection', 'Deep'].includes(view.value)) {
    command.view = 'Lateral';
  }
  if (command.view) view.value = command.view;
  send(command);
  options();
}

function savedViewError(message, measurement = false) {
  waitingSavedView = undefined;
  const notice = (measurement ? 'Couldn’t open measurement. ' : 'Couldn’t open saved view. ') + message;
  savedViewStatus.textContent = notice;
  annotation.reportSavedViewError(notice);
}

async function prepareSection(saved, space) {
  const pao = saved.territory === 'pao';
  const id = pao ? registry.parietal_operculum_sections?.target_id :
    [...comparisonItems].find(([, item]) => item.row.acronym.toLowerCase() === saved.territory)?.[0];
  if (!id || (!pao && [...comparisonItems.keys()].some(region => !available.separate.has(region)))) {
    return {error: 'This atlas territory is unavailable.'};
  }
  const reader = await (pao ? loadPaoSections() : loadSourceSections());
  if (space && reader.space !== space) return {error: 'The source or grid differs from this atlas.'};
  return {id, pao, ...await reader.prepareSavedView(saved)};
}

async function restoreSavedView(request) {
  const {saved, endpoints, space, fragment, writeHash} = request;
  const report = message => savedViewError(message, !!endpoints);
  if (failed) {
    report('The 3D atlas couldn’t load.');
    return;
  }
  if (controls.disabled) return;
  try {
    const [prepared, ...pair] = await Promise.all(
      [saved, ...(endpoints ?? [])].map(section => prepareSection(section, space)));
    if (waitingSavedView !== request) return;
    if (prepared.error) {
      report(prepared.error);
      return;
    }
    const rejected = pair.findIndex(point => point.error);
    if (rejected !== -1) {
      report('Point ' + ['A', 'B'][rejected] + '. ' + pair[rejected].error);
      return;
    }
    const view = {...saved, ...prepared};
    annotation.close(false);
    selection(prepared.id, false);
    if (prepared.pao) {
      showPaoSections(view);
    } else {
      setComparison(true, false);
      showSourceSections(view);
    }
    if (endpoints) distances.replacePoints(pair.map(({measurementPoint}, i) =>
      ({...measurementPoint, space, section: {...endpoints[i], values: measurementPoint.values}})));
    if (writeHash) history.replaceState(history.state, '', fragment);
    waitingSavedView = undefined;
    savedViewStatus.textContent = endpoints ? 'Opened measurement.' : 'Opened saved view.';
  } catch (error) {
    if (waitingSavedView !== request) return;
    console.warn('Saved atlas section unavailable:', error);
    report('The requested atlas section couldn’t load.');
  }
}

function openSavedView(fragment, writeHash = false) {
  if (fragment.startsWith('#atlas-labels-')) {
    const requested = parseAnnotationPoint(fragment);
    if (!requested) {
      savedViewError('Paste the complete text from Copy saved view.');
      return;
    }
    const request = {annotation: true};
    waitingSavedView = request;
    savedViewStatus.textContent = 'Opening atlas labels…';
    annotation.open(requested, () => waitingSavedView === request).then(opened => {
      if (!opened) return;
      if (writeHash) history.replaceState(history.state, '', fragment);
      waitingSavedView = undefined;
      savedViewStatus.textContent = '';
    }).catch(error => {
      if (waitingSavedView !== request) return;
      savedViewError(error.message);
    });
    return;
  }
  const measurement = fragment.startsWith('#atlas-measure-');
  const saved = measurement ? parseSavedMeasurement(fragment) : {saved: parseSavedView(fragment)};
  if (!saved?.saved) {
    const copy = measurement ? 'Copy measurement' : 'Copy saved view or Copy measurement';
    savedViewError('Paste the fragment from ' + copy + '.', measurement);
    return;
  }
  const request = {...saved, fragment, writeHash};
  waitingSavedView = request;
  savedViewStatus.textContent = measurement ? 'Opening measurement…' : 'Opening saved view…';
  restoreSavedView(request);
}

function cancelSavedView() {
  if (!waitingSavedView) return;
  waitingSavedView = undefined;
  savedViewStatus.textContent = '';
}

function readSavedHash() {
  if (location.hash.startsWith('#atlas-')) openSavedView(location.hash);
  else {
    cancelSavedView();
    savedViewStatus.textContent = '';
  }
}

function syncAvailability() {
  const ready = !failed && Boolean(registry && available);
  if (ready && controls.disabled) {
    if (registry.vpl_vpm_comparison) setupComparison();
    options();
  }
  controls.disabled = !ready;
  const message = failed
    ? '3D controls are unavailable. Reload the viewer to try again.'
    : ready ? '3D controls ready.' : '3D controls unlock when the model is ready.';
  if (status.textContent !== message) status.textContent = message;
  status.classList.toggle('visually-hidden', ready);
  if (waitingSavedView && !waitingSavedView.annotation && (ready || failed)) restoreSavedView(waitingSavedView);
  annotation.syncModel();
}

savedViewForm.onsubmit = event => {
  event.preventDefault();
  openSavedView(savedViewInput.value.trim(), true);
};
for (const event of ['click', 'change', 'input']) {
  sidebar.addEventListener(event, cancelSavedView, true);
}
addEventListener('hashchange', readSavedHash);
search.oninput = () => {
  invalidateViewAction(true);
  options();
};
select.onchange = () => selection(select.value);
view.onchange = () => {
  setComparison(false);
  setIsolation(false);
  send({view: view.value});
};
role.onchange = event => send({role: event.target.value});
isolate.onclick = () => {
  setIsolation(!isolated);
  if (document.activeElement === isolate) isolate.scrollIntoView({block: 'nearest'});
  send({isolate: isolated, focus: isolated, viewAction: isolated ? 'isolate' : 'restore'});
};
focus.onclick = () => send({focus: true, viewAction: 'focus'});
reset.onclick = () => {
  setIsolation(false);
  send({reset: true, isolate: false, viewAction: 'reset'});
};
diagnostic.onclick = event => {
  qc = !qc;
  send({qc});
  event.currentTarget.textContent = qc ? 'Hide the two voxels' : 'Show the two voxels';
};
comparisonToggle.onclick = () => setComparison(true);
comparisonReturn.onclick = () => setComparison(false);
boundaryToggle.onclick = () => {
  if (boundaryPhase === 'on' || boundaryPhase === 'off') send({boundary: boundaryPhase === 'off'});
};
paoToggle.onclick = togglePaoSections;
sectionsToggle.onclick = () => {
  if (comparing && sectionsToggle.getAttribute('aria-disabled') !== 'true') toggleSections();
};
document.querySelector('#comparison-focus').onclick = () => send({focus: true});
for (const button of document.querySelectorAll('[data-comparison-view]')) {
  button.onclick = () => send({comparisonView: button.dataset.comparisonView});
}
addEventListener('keydown', event => {
  if (event.key === 'Escape' || (event.target instanceof HTMLCanvasElement && event.key.startsWith('Arrow'))) {
    cancelSavedView();
  }
  if (event.key === 'Escape' && !annotationPanel.hidden) {
    document.querySelector('#annotation-close').click();
    event.preventDefault();
    return;
  }
  if (comparing && event.key === 'Escape') {
    setComparison(false);
    event.preventDefault();
  }
});

addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
  const message = event.data;
  if (message?.type === 'brain-ready') {
    available = {
      separate: new Set(message.separate), shared: new Set(message.shared),
      deferred: new Map(message.deferred.map(id => [id, 'pending'])),
    };
    syncAvailability();
  } else if (message?.type === 'brain-territory' && available?.deferred.has(message.id)) {
    available.deferred.set(message.id, message.ready ? 'ready' : 'unavailable');
    if (message.ready) available.separate.add(message.id);
    if (current === String(message.id) && !comparing) {
      canIsolate = message.ready;
      setIsolation(isolated);
      viewAction.textContent = message.ready ? 'Separate atlas surface ready. Choose Isolate in place.' : scope.textContent;
      options();
    }
  } else if (message?.type === 'brain-error') {
    failed = true;
    syncAvailability();
  } else if (message?.type === 'brain-annotation-point') {
    annotation.modelReadback(message);
  } else if (message?.type === 'brain-state') {
    if (message.viewAction && message.viewAction.revision !== viewActionRevision) return;
    const description = message.state.isolate ? 'The surrounding tissue is hidden.' : message.construction;
    if (construction.textContent !== description) construction.textContent = description;
    if (message.viewAction && !comparing) announceViewAction(message.viewAction.name, message.state);
  } else if (message?.type === 'brain-comparison-exit') {
    cancelSavedView();
    if (!annotationPanel.hidden) document.querySelector('#annotation-close').click();
    else setComparison(false);
  } else if (message?.type === 'brain-boundary') {
    if (comparing) showBoundaryStatus(message.status);
  } else if (message?.type === 'brain-pick') {
    cancelSavedView();
    if (!annotationPanel.hidden) return;
    if (comparing) {
      inspectComparisonRegion(message.id);
      return;
    }
    if (isolationOnlyLabel && isolated && current === String(message.id)) {
      if (isolationOnlyLabel.load_on_selection) evidence.closest('details').open = true;
      return;
    }
    selection(message.id);
  }
});

frame.addEventListener('load', () => {
  const page = frame.contentDocument;
  if (page?.URL === 'about:blank') return;
  if (!page?.body?.hasAttribute('data-brain-viewer')) {
    failed = true;
    syncAvailability();
  }
});
frame.src = frame.dataset.src;
readSavedHash();

try {
  const response = await fetch('./registry.json');
  if (!response.ok) throw Error('Registry returned HTTP ' + response.status);
  registry = await response.json();
} catch (error) {
  failed = true;
  console.error(error);
}
syncAvailability();
