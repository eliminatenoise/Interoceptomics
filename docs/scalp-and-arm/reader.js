const byId = (id) => document.getElementById(id);
const tasks = [
  ['flex', 'Bend the elbow', 'elbow flexion', '93 · elbow'],
  ['extend', 'Straighten the elbow', 'elbow extension', '93 · elbow'],
  ['supinate', 'Turn the palm up', 'forearm supination', '94 · pro/supination'],
  ['pronate', 'Turn the palm down', 'forearm pronation', '94 · pro/supination'],
  ['close', 'Close the hand', 'hand close', '65–79 · named finger and palm channels'],
  ['open', 'Open the hand', 'hand open', '65–79 · named finger and palm channels'],
  ['rest', 'Rest', 'rest', 'the arm and glove still record'],
];
const headCanvas = byId('scalp'),
  armCanvas = byId('arm'),
  tag = byId('tag'),
  site = byId('site');
const task = byId('task'),
  time = byId('time');
let current = 27,
  visibleSites = [];
function describeSite() {
  const [name, x, y, z] = ATLAS.sites[current],
    side = name.endsWith('z') ? 'midline' : x < 0 ? 'left' : 'right';
  byId('site-info').textContent =
    'Channel ' +
    (current + 1) +
    ' · ' +
    side +
    ' scalp. Template x, y, z in mm: ' +
    [x, y, z].map((v) => v.toFixed(1)).join(', ') +
    '.';
}
const scalp = camera(headCanvas, {
  center: [0, -15, 4],
  span: [247, 253],
  yaw: -39,
  tilt: 23,
  drawn: (project, eye) => {
    visibleSites = [];
    ATLAS.sites.forEach(([name, ...p], index) => {
      const n = siteNormal(p),
        cos = V.dot(eye, n);
      if (cos > 0.14) {
        const q = project(V.add(p, V.scale(n, 4)));
        visibleSites.push([q[0], q[1], index]);
        if (index === current) {
          tag.hidden = false;
          tag.textContent = name;
          tag.style.transform =
            'translate(' +
            Math.max(2, Math.min(headCanvas.clientWidth - 40, q[0] + 8)) +
            'px,' +
            Math.max(2, q[1] - 17) +
            'px)';
        }
      } else if (index === current) tag.hidden = true;
    });
  },
  pick: (x, y) => {
    const near = visibleSites
      .map((p) => [Math.hypot(x - p[0], y - p[1]), p[2]])
      .sort((a, b) => a[0] - b[0])[0];
    if (near && near[0] < 13) selectSite(near[1], false);
  },
});
const arm = camera(armCanvas, {
  center: [3, -6, 23],
  span: [205, 177],
  yaw: 64,
  tilt: 17,
  fitPose: true,
});
const headMesh = scalpBase();
const measures = measuredReader(CUE_FIELDS, (sec) => {
  time.value = String(sec);
  showTime();
});
function showField() {
  const field = measures.update(current, 0x600 + task.selectedIndex, Number(time.value));
  if (field) scalp.setParts([headMesh, scalpMarkers(current, field)]);
}
ATLAS.sites.forEach((r, i) => site.add(new Option(r[0] + ' · channel ' + (i + 1), i)));
tasks.forEach((r, i) => task.add(new Option(r[1] + ' · 0x' + (0x600 + i).toString(16), r[0])));
function selectSite(i, center) {
  current = i;
  site.value = String(i);
  describeSite();
  showField();
  if (center) {
    const n = siteNormal(ATLAS.sites[i].slice(1));
    scalp.setAngle(Math.atan2(n[0], n[1]) / RAD, Math.asin(n[2]) / RAD);
  }
}
function showTime() {
  showField();
  const sec = Number(time.value),
    i = task.selectedIndex,
    selection = tasks[i],
    active = sec >= 2 && sec < 5;
  const t = Math.max(0, Math.min(1, (sec - 2) / 0.86));
  // Smooth illustrative motion after the cue. No participant trajectory or observed latency.
  const amount = active ? t * t * (3 - 2 * t) : 0;
  arm.setParts([buildArm(selection[0], amount)]);
  byId('sec').textContent = sec.toFixed(3).replace(/0$/, '') + ' s';
  time.setAttribute('aria-valuetext', sec.toFixed(3) + ' seconds from trial start');
  byId('phase').textContent =
    sec < 2
      ? 'Fixation cross · waiting for the movement cue.'
      : sec === 5
        ? 'End of task · return to the starting pose.'
        : 'Cue on screen · ' + selection[1].toLowerCase() + '.';
  byId('task-info').textContent =
    selection[0] === 'rest'
      ? 'Stay in the starting position. All instruments keep recording.'
      : 'The study calls this ' +
        selection[2] +
        '. Movement channel' +
        (i === 4 || i === 5 ? 's ' : ' ') +
        selection[3] +
        '.';
  byId('eeg-ticks').textContent =
    Math.round(sec * 512).toLocaleString('en-US') + ' EEG sample intervals';
  byId('arm-ticks').textContent =
    Math.floor(sec * 64).toLocaleString('en-US') + ' complete mechanical sample intervals';
  const offset = Math.round(sec * 512) % 8;
  byId('fine-clock').textContent =
    offset === 0
      ? 'Both nominal grids have a sample here.'
      : offset + ' of 8 EEG intervals past the latest mechanical sample.';
}
selectSite(27, false);
showTime();
site.addEventListener('change', () => selectSite(Number(site.value), true));
task.addEventListener('change', showTime);
time.addEventListener('input', showTime);
byId('cue').onclick = () => {
  time.value = '2';
  showTime();
};
byId('fine').onclick = () => {
  time.value = String(Math.min(5, Number(time.value) + 1 / 512));
  showTime();
};
byId('top').onclick = () => scalp.setAngle(180, 89);
byId('front').onclick = () => scalp.setAngle(0, 6);
byId('head-reset').onclick = () => scalp.reset();
byId('arm-side').onclick = () => arm.setAngle(89, 6);
byId('arm-front').onclick = () => arm.setAngle(0, 6);
byId('arm-reset').onclick = () => arm.reset();
