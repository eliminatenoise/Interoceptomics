import {organs, tint} from './organ/appearance.js';

const local = path => new URL(path, import.meta.url).href;
const keys = ['all', ...Object.keys(organs)];
const background = 0xf5f4ed;
const forward = [0, 0, 1];

function element(tag, cls, parent, text = '') {
  const node = document.createElement(tag);
  node.className = cls;
  node.textContent = text;
  parent.append(node);
  return node;
}

function shell(host) {
  if (!document.querySelector('link[data-hra-organ-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = local('organ/body.css');
    style.dataset.hraOrganStyle = '';
    document.head.append(style);
  }
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.replaceChildren();
  const root = element('div', 'hra-organ', host);
  const field = element('div', 'hra-field', root);
  const orientation = element('span', 'hra-orientation', field);
  const callouts = element('div', 'hra-callouts', field);
  const scale = element('div', 'hra-scale', field);
  const scaleText = element('span', '', scale);
  const scaleBar = element('i', '', scale);
  const readout = element('span', 'hra-readout', field);
  readout.setAttribute('role', 'status');
  readout.hidden = true;
  const toolbar = element('div', 'hra-tools', root);
  const label = element('label', '', toolbar, 'Show');
  const parts = element('select', '', toolbar);
  parts.id = 'hra-parts-' + crypto.getRandomValues(new Uint32Array(1))[0];
  label.htmlFor = parts.id;
  const note = element('span', 'hra-note', toolbar);
  return {root, field, orientation, callouts, scale, scaleText, scaleBar, readout, toolbar, label, parts, note};
}

function stills(ui, initial = 'all') {
  ui.field.querySelector('canvas')?.remove();
  ui.orientation.hidden = ui.scale.hidden = ui.parts.hidden = ui.label.hidden = ui.readout.hidden = true;
  ui.callouts.replaceChildren();
  ui.toolbar.hidden = false;
  ui.note.textContent = 'Saved model views · rotate to switch between front and back.';
  const img = element('img', '', ui.field);
  ui.field.prepend(img);
  let key = initial, back = false;
  function show() {
    const view = back ? 'back' : 'front';
    const name = organs[key]?.name || 'Cord, heart, colon and bladder';
    const {width, height} = ui.field.getBoundingClientRect();
    const layout = width >= height ? 'wide/' : 'narrow/';
    const url = local('organ/' + layout + key + '-' + view + '.webp');
    if (img.src !== url) img.src = url;
    img.alt = name + ', seen from the ' + view + ' of the female Human Reference Atlas body.';
    ui.orientation.textContent = 'Saved view · ' + (back ? 'Posterior (back)' : 'Anterior (front)');
    ui.root.dataset.organMode = 'stills';
    ui.root.dataset.organKey = key;
  }
  const observer = new ResizeObserver(show);
  observer.observe(ui.field);
  show();
  return {
    select(next) { if (keys.includes(next)) { key = next; back = false; show(); } },
    orbit(delta) { if (delta) { back = !back; show(); } },
    reset() { back = false; show(); }, resize: show
  };
}

export async function createBody(host) {
  const ui = shell(host);
  let engine;
  try {
    engine = await createInteractive(ui);
  } catch (error) {
    console.info('Cord and organ model opened as saved views.', error);
    engine = stills(ui);
  }
  return {
    select(key) { engine.select(key); },
    orbit(delta) { engine.orbit(delta); },
    reset() { engine.reset(); },
    resize() { engine.resize(); }
  };

  async function createInteractive(ui) {
    const [THREE, {GLTFLoader}, {OrbitControls}] = await Promise.all([
      import('three'), import('../vendor/three/examples/jsm/loaders/GLTFLoader.js'),
      import('../vendor/three/examples/jsm/controls-OrbitControls.js')
    ]);
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(background);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;
    const canvas = renderer.domElement;
    const world = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .001, 5);
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minZoom = .55;
    controls.maxZoom = 8;
    controls.minPolarAngle = .07;
    controls.maxPolarAngle = Math.PI - .07;
    let model;
    try {
      const [asset, response] = await Promise.all([
        new GLTFLoader().loadAsync(local('organs.glb')), fetch(local('organ-source.json'))
      ]);
      if (!response.ok) throw new Error('Organ metadata ' + response.status);
      model = {scene: asset.scene, meta: await response.json()};
    } catch (error) {
      controls.dispose(); renderer.dispose(); throw error;
    }
    canvas.setAttribute('aria-label', 'Female Human Reference Atlas organ surfaces. Drag to rotate, scroll to magnify, or tap a surface for its source name.');
    canvas.setAttribute('role', 'img');
    ui.field.prepend(canvas);
    world.add(model.scene, new THREE.HemisphereLight(0xfff7e9, 0xc0aaa0, 1.6));
    const keyLight = new THREE.DirectionalLight(0xffebdb, 2.2);
    const fill = new THREE.DirectionalLight(0xdfebff, 1.1);
    camera.add(keyLight, fill); world.add(camera);
    keyLight.position.set(-2, 3.4, 3);
    fill.position.set(2, .4, -1.5);
    // Both lights stay with the camera. A separate target at its optical centre
    // keeps the modelling light directional even as the camera orbits.
    const lightTarget = new THREE.Object3D();
    camera.add(lightTarget);
    keyLight.target = fill.target = lightTarget;
    const groups = {}, meshes = {}, bounds = new Map(), materials = new Map(), labels = {};
    model.scene.updateMatrixWorld(true);
    for (const [key, name] of Object.entries(model.meta.groupNames)) {
      const group = model.scene.getObjectByName(name);
      if (!group) throw new Error('Missing anatomical group ' + name);
      groups[key] = group;
      meshes[key] = [];
      group.traverse(mesh => {
        if (!mesh.isMesh) return;
        const color = tint(mesh.name, key);
        if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({
          color, roughness: .68, metalness: 0, side: THREE.DoubleSide
        }));
        mesh.material = materials.get(color);
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        bounds.set(mesh, mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
        meshes[key].push(mesh);
      });
      const anchor = meshes[key].find(mesh => organs[key].anchor.test(mesh.name));
      const pos = bounds.get(anchor).getCenter(new THREE.Vector3());
      const line = element('i', 'hra-line', ui.callouts);
      const dot = element('i', 'hra-dot', ui.callouts);
      const tag = element('span', 'hra-label', ui.callouts, organs[key].name);
      line.style.color = dot.style.color = organs[key].color;
      labels[key] = {pos, line, dot, tag, side: organs[key].side};
    }

    let selected = 'all', showMeshes = [], width = 1, height = 1, span = 1, ratio = 1, lost = false;
    const box = new THREE.Box3(), target = new THREE.Vector3(), view = new THREE.Vector3();
    const ndc = new THREE.Vector3(), ray = new THREE.Raycaster();
    let clicks;
    function updateLabels() {
      const markers = [];
      for (const entry of Object.values(labels)) {
        ndc.copy(entry.pos).project(camera);
        markers.push({...entry, x: (ndc.x + 1) * width / 2, y: (1 - ndc.y) * height / 2});
      }
      for (const side of ['left', 'right']) {
        const list = markers.filter(m => m.side === side).sort((a,b) => a.y-b.y);
        let last = 22;
        for (const m of list) {
          const left = side === 'left';
          const tagWidth = m.tag.offsetWidth || 62;
          const edge = left ? Math.max(4 + tagWidth, width / 2 - Math.min(width * .22, 157))
            : Math.min(width - tagWidth - 4, width / 2 + Math.min(width * .22, 157));
          const y = Math.min(Math.max(m.y, last + 18), height - 23);
          const x = Math.min(Math.max(m.x, 0), width);
          m.tag.style.left = (left ? edge - tagWidth : edge) + 'px';
          m.tag.style.top = (y - 10) + 'px';
          m.line.style.left = x + 'px'; m.line.style.top = m.y + 'px';
          m.line.style.width = Math.hypot(edge - x, y - m.y) + 'px';
          m.line.style.transform = 'rotate(' + Math.atan2(y - m.y, edge - x) + 'rad)';
          m.dot.style.left = x + 'px'; m.dot.style.top = m.y + 'px';
          last = y;
        }
      }
    }
    function draw() {
      if (lost) return;
      camera.updateMatrixWorld();
      const direction = view.copy(camera.position).sub(controls.target).normalize();
      const angle = Math.round(Math.atan2(direction.x, direction.z) / (Math.PI / 4));
      const names = ['Anterior (front)', 'Left anterior oblique', 'Left lateral', 'Left posterior oblique',
        'Posterior (back)', 'Right posterior oblique', 'Right lateral', 'Right anterior oblique'];
      const horizontal = names[(angle + 8) % 8];
      ui.orientation.textContent = Math.abs(direction.y) > .8
        ? (direction.y > 0 ? 'Superior (above)' : 'Inferior (below)')
        : horizontal + (Math.abs(direction.y) > .32 ? (direction.y > 0 ? ' · from above' : ' · from below') : '');
      const perPixel = span / camera.zoom / height;
      const rule = [.001,.002,.005,.01,.02,.05,.1,.2,.5].filter(n => n / perPixel <= Math.min(width*.16, 78)).at(-1) || .001;
      ui.scaleText.textContent = rule < .01 ? Math.round(rule*1000) + ' mm' : Math.round(rule*100) + ' cm';
      ui.scaleBar.style.width = rule/perPixel + 'px';
      if (selected === 'all') updateLabels();
      renderer.render(world,camera);
    }
    function resize() {
      if (lost) return;
      const rect = ui.field.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      width = Math.round(rect.width); height = Math.round(rect.height);
      ratio = width / height;
      renderer.setSize(width, height, false);
      const size = box.getSize(new THREE.Vector3());
      // Rotation about the long axis should leave enough space in a portrait panel.
      const across = Math.hypot(size.x, size.z);
      span = Math.max(size.y, across/ratio, .001) * (selected === 'all' ? 1.14 : 1.24);
      camera.top = span/2; camera.bottom = -span/2;
      camera.right = span*ratio/2; camera.left = -camera.right;
      camera.updateProjectionMatrix();
      draw();
    }
    function frame(part = 0) {
      box.makeEmpty(); showMeshes = [];
      const partMatch = organs[selected]?.parts[part-1]?.[1];
      for (const [key, list] of Object.entries(meshes)) {
        groups[key].visible = selected === 'all' || selected === key;
        for (const mesh of list) {
          const matched = !partMatch || partMatch.test(mesh.name);
          // A source mesh can parent another anatomical surface. Layers hide
          // just this mesh, leaving its child transforms and visibility intact.
          mesh.layers.set(matched ? 0 : 1);
          if (groups[key].visible && matched) {
            box.union(bounds.get(mesh)); showMeshes.push(mesh);
          }
        }
      }
      box.getCenter(target);
      const extent = box.getSize(new THREE.Vector3()).length();
      const initial = selected === 'bladder' && part === 2 ? [0, .65, -1] : forward;
      camera.position.copy(target).addScaledVector(new THREE.Vector3(...initial).normalize(), extent*2.25);
      camera.near = extent*.01; camera.far = extent*6;
      camera.zoom = 1; controls.target.copy(target);
      ui.readout.hidden = true;
      ui.callouts.hidden = selected !== 'all'; controls.update(); resize();
    }
    function select(next) {
      if (!keys.includes(next)) return;
      selected = next;
      ui.root.dataset.organKey = next;
      ui.root.dataset.organMode = 'interactive';
      ui.toolbar.hidden = next === 'all';
      ui.parts.replaceChildren(new Option('Whole structure', '0'));
      (organs[next]?.parts || []).forEach(([name], i) => ui.parts.add(new Option(name, String(i+1))));
      ui.note.textContent = 'Tap a surface for its name.';
      frame(0);
    }
    function orbit(delta) {
      if (!Number.isFinite(delta)) return;
      view.copy(camera.position).sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0), delta);
      camera.position.copy(controls.target).add(view); controls.update();
    }
    canvas.addEventListener('pointerdown', e => { clicks = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', e => {
      if (!clicks || Math.hypot(e.clientX-clicks[0],e.clientY-clicks[1]) > 4) return;
      const r = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(2*(e.clientX-r.left)/r.width-1, 1-2*(e.clientY-r.top)/r.height);
      ray.setFromCamera(mouse,camera);
      const mesh = ray.intersectObjects(showMeshes, false)[0]?.object;
      ui.readout.hidden = !mesh;
      if (mesh) ui.readout.textContent = mesh.userData.label || mesh.name.replace(/^VH_F_/, '').replaceAll('_',' ');
    });
    ui.parts.addEventListener('change', () => frame(Number(ui.parts.value)));
    controls.addEventListener('change', draw);
    const observer = new ResizeObserver(resize);
    observer.observe(ui.field);
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault(); lost = true; observer.disconnect(); controls.dispose();
      window.setTimeout(() => { engine = stills(ui, selected); }, 0);
    }, {once:true});
    select('all');
    return {select, orbit, reset() { frame(Number(ui.parts.value)); }, resize};
  }
}
