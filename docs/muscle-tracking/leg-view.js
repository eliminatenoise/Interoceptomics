'use strict';
const RAD = Math.PI / 180;
const V = {
  add: (a, b) => a.map((v, i) => v + b[i]),
  sub: (a, b) => a.map((v, i) => v - b[i]),
  scale: (a, s) => a.map(v => v * s),
  dot: (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0),
  cross: ([a,b,c], [d,e,f]) => [b*f-c*e, c*d-a*f, a*e-b*d],
  unit: a => V.scale(a, 1 / (Math.hypot(...a) || 1))
};
function decodeBytes(text, Type) {
  const bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0));
  return new Type(bytes.buffer);
}
function atlasParts(source) {
  const p = Array.from(decodeBytes(source.xyz, Int16Array), v => v / 10);
  const indices = decodeBytes(source.triangles, Uint16Array);
  const tendon = source.tendon && decodeBytes(source.tendon, Uint8Array);
  const normals = Array(p.length).fill(0);
  const groups = tendon ? [[], []] : [[]];
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = Array.from(indices.subarray(i, i + 3));
    groups[tendon ? tendon[i / 3] : 0].push(...triangle);
    const [a, b, c] = triangle.map(j => p.slice(3 * j, 3 * j + 3));
    const n = V.cross(V.sub(b, a), V.sub(c, a));
    for (const j of triangle) for (let k = 0; k < 3; k++) normals[3 * j + k] += n[k];
  }
  for (let i = 0; i < normals.length; i += 3) {
    const n = V.unit(normals.slice(i, i + 3));
    for (let k = 0; k < 3; k++) normals[i + k] = n[k];
  }
  return groups.map((f, group) => {
    const rgb = tendon ? [[1,.43,.25], [1,.83,.51]][group] : [.87,.86,.78];
    return {p, n:normals, c:p.map((_,i) => rgb[i % 3]), f, isMuscle: Boolean(tendon)};
  });
}
(function initAnatomy() {
  const all = LEG.flatMap(atlasParts);
  const views = {oblique:[-145,9], front:[180,0], side:[-90,0]};
  // Select atlas surface vertices at two reference heights for the labelled leader lines.
  const targets = [290, 115].map((z, group) => {
    const part = all.filter(m => m.isMuscle)[group];
    return [...new Set(part.f)].map(i => part.p.slice(i*3,i*3+3)).filter(p => Math.abs(p[2]-z)<14);
  });
  const camera3D = camera(document.getElementById('leg'), {
    center:[-80,0,225], span:[150,460], fitPose:true, yaw:views.oblique[0], tilt:views.oblique[1],
    drawn(project, eye) {
      const overlay = document.getElementById('markers');
      const width = overlay.clientWidth, height = overlay.clientHeight;
      overlay.setAttribute('viewBox', '0 0 '+width+' '+height);
      const near = eye[1] < -.23 || (eye[0] < -.75 && eye[1] < .35) || !document.getElementById('bones').checked;
      ['m-belly','m-tendon'].forEach((id,i) => {
        const group = document.getElementById(id);
        group.style.display = near && targets[i].length ? '' : 'none';
        if (!near || !targets[i].length) return;
        const point = targets[i].reduce((a,b) => V.dot(eye,a) > V.dot(eye,b) ? a : b);
        const [x,y] = project(point);
        const dest = i ? width-10 : 10, direction = i ? 1 : -1;
        const textY = Math.max(15,Math.min(height-5,y+(i ? 14 : -16)));
        const lineEnd = dest - direction * (i ? 45 : 75);
        group.querySelector('path').setAttribute('d','M'+x+' '+y+' L'+(x+direction*13)+' '+(textY-4)+' H'+lineEnd);
        const dot = group.querySelector('circle'), label = group.querySelector('text');
        dot.setAttribute('cx',x);dot.setAttribute('cy',y);
        label.setAttribute('x',dest);label.setAttribute('y',textY);
        label.setAttribute('text-anchor',i ? 'end' : 'start');
      });
      // The orthographic projection gives the same pixels per millimetre in either screen axis.
      const o = project([0,0,0])[0];
      const pixelsPerMM = Math.hypot(...[[1,0,0],[0,1,0],[0,0,1]].map(p => project(p)[0] - o));
      document.getElementById('scale-bar').style.width = (50 * pixelsPerMM) + 'px';
    }
  });
  camera3D.setParts(all);
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => camera3D.setAngle(...views[button.dataset.view]));
  });
  document.getElementById('bones').addEventListener('change', e => {
    camera3D.setParts(e.target.checked ? all : all.filter(m => m.isMuscle));
  });
})();
