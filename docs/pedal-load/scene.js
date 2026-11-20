'use strict';
const RAD = Math.PI / 180;
const V = {
  add: (a, b) => a.map((v, i) => v+b[i]),
  sub: (a, b) => a.map((v, i) => v-b[i]),
  scale: (a, s) => a.map(v => v*s),
  dot: (a, b) => a.reduce((sum, v, i) => sum+v*b[i], 0),
  cross: ([a,b,c],[d,e,f]) => [b*f-c*e, c*d-a*f, a*e-b*d],
  unit: a => V.scale(a, 1/(Math.hypot(...a)||1))
};
function unpack(text, Type) {
  return new Type(Uint8Array.from(atob(text), c=>c.charCodeAt(0)).buffer);
}
function mesh(p, f, color) {
  const normals = Array(p.length).fill(0);
  for (let i=0; i<f.length; i+=3) {
    const [a,b,c] = f.slice(i,i+3).map(j=>p.slice(3*j,3*j+3));
    const n = V.cross(V.sub(b,a), V.sub(c,a));
    for (const j of f.slice(i,i+3)) for (let k=0; k<3; k++) normals[3*j+k] += n[k];
  }
  for (let i=0; i<normals.length; i+=3) {
    const n=V.unit(normals.slice(i,i+3));
    for (let k=0; k<3; k++) normals[i+k] = n[k];
  }
  return {p,n:normals,c:p.map((_,i)=>color[i%3]),f};
}
function legSurfaces(source) {
  const p=Array.from(unpack(source.xyz,Int16Array),v=>v/10);
  const f=Array.from(unpack(source.triangles,Uint16Array));
  if (!source.tendon) return [mesh(p,f,[.86,.85,.77])];
  const tag=unpack(source.tendon,Uint8Array), groups=[[],[]];
  for (let i=0;i<f.length;i++) groups[tag[Math.floor(i/3)]].push(f[i]);
  return [mesh(p,groups[0],[1,.43,.25]),mesh(p,groups[1],[1,.83,.51])];
}
(function () {
  const leg=LEG.flatMap(legSurfaces), platform=APPARATUS.map(o=>mesh(o.p,o.f,o.color));
  const views={oblique:[-120,9],side:[-90,2],front:[180,4]};
  const canvas=document.getElementById('leg');
  // Rotation owns gestures on the canvas. Keep touch scrolling on the rest of the page.
  canvas.addEventListener('touchstart',event=>event.preventDefault(),{passive:false});
  const cam=camera(canvas, {
    yaw:views.oblique[0],tilt:views.oblique[1],center:[-95,-18,170],span:[240,510],fitPose:true
  });
  cam.setParts([...leg,...platform]);
  document.querySelectorAll('[data-view]').forEach(button=>
    button.addEventListener('click',()=>cam.setAngle(...views[button.dataset.view])));
  document.getElementById('show-leg').addEventListener('change',e=>
    cam.setParts(e.target.checked?[...leg,...platform]:platform));
})();
