/* An orthographic 3D renderer. WebGL draws smooth, depth-tested surfaces. The same
   geometry and camera also run through a canvas painter when WebGL is unavailable. */
const vertexShader = `
attribute vec3 pos, norm, color;
uniform vec3 right, up, eye, center;
uniform vec2 scale;
varying vec3 ink;
void main(){
  vec3 d=pos-center;
  gl_Position=vec4(dot(right,d)*scale.x,dot(up,d)*scale.y,-dot(eye,d)/400.,1.);
  vec3 n=normalize(vec3(dot(right,norm),dot(up,norm),dot(eye,norm)));
  float light=.63+.35*max(0.,dot(n,normalize(vec3(-.43,.63,.73))));
  float rim=.08*pow(1.-max(0.,n.z),2.);
  ink=color*light+vec3(rim*.65,rim*.78,rim*.75);
}`;
const fragmentShader = `
precision mediump float;
varying vec3 ink;
void main(){gl_FragColor=vec4(ink,1.);}
`;
function getProgram(gl) {
  const program = gl.createProgram();
  [
    [gl.VERTEX_SHADER, vertexShader],
    [gl.FRAGMENT_SHADER, fragmentShader],
  ].forEach(([type, source]) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
    gl.attachShader(program, s);
    gl.deleteShader(s);
  });
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  return program;
}
function camera(canvas, options) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, preserveDrawingBuffer: false });
  const ctx = gl ? null : canvas.getContext('2d');
  const shader = gl ? getProgram(gl) : null,
    loc = {};
  if (gl) {
    gl.useProgram(shader);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    for (const a of ['pos', 'norm', 'color']) loc[a] = gl.getAttribLocation(shader, a);
    for (const u of ['right', 'up', 'eye', 'center', 'scale'])
      loc[u] = gl.getUniformLocation(shader, u);
  }
  let parts = [],
    axes,
    scale,
    w,
    h,
    frame = 0,
    origin = options.center;
  let yaw = options.yaw,
    tilt = options.tilt;
  const resources = new Map();
  function prepare(mesh) {
    if (!gl) return;
    const handles = {};
    for (const [key, values] of Object.entries({
      pos: mesh.p,
      norm: mesh.n,
      color: mesh.c,
      faces: mesh.f,
    })) {
      const indices = key === 'faces',
        target = indices ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
      const b = gl.createBuffer();
      gl.bindBuffer(target, b);
      gl.bufferData(
        target,
        indices ? new Uint16Array(values) : new Float32Array(values),
        gl.STATIC_DRAW,
      );
      handles[key] = b;
    }
    resources.set(mesh, handles);
  }
  function project(p) {
    const d = V.sub(p, origin);
    return [w / 2 + V.dot(d, axes[0]) * scale, h / 2 - V.dot(d, axes[1]) * scale, V.dot(d, axes[2])];
  }
  function drawCPU() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tasks = [],
      dpr = canvas.width / w;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const mesh of parts) {
      const projected = [];
      for (let k = 0; k < mesh.p.length; k += 3) projected.push(project(mesh.p.slice(k, k + 3)));
      for (let k = 0; k < mesh.f.length; k += 3) {
        const ia = mesh.f[k],
          ib = mesh.f[k + 1],
          ic = mesh.f[k + 2],
          a = projected[ia],
          b = projected[ib],
          c = projected[ic];
        const n = V.unit(
          V.add(
            mesh.n.slice(ia * 3, ia * 3 + 3),
            V.add(mesh.n.slice(ib * 3, ib * 3 + 3), mesh.n.slice(ic * 3, ic * 3 + 3)),
          ),
        );
        if (V.dot(n, axes[2]) < -0.12) continue;
        const light =
          0.63 +
          0.35 *
            Math.max(
              0,
              -0.43 * V.dot(n, axes[0]) + 0.63 * V.dot(n, axes[1]) + 0.73 * V.dot(n, axes[2]),
            );
        const rgb = mesh.c
          .slice(ia * 3, ia * 3 + 3)
          .map((x) => Math.min(255, Math.round(x * light * 255)));
        tasks.push([a, b, c, (a[2] + b[2] + c[2]) / 3, 'rgb(' + rgb.join(',') + ')']);
      }
    }
    tasks.sort((a, b) => a[3] - b[3]);
    ctx.lineWidth = 0.5;
    ctx.lineJoin = 'round';
    for (const [a, b, c, , fill] of tasks) {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle = fill;
      ctx.fill();
      ctx.stroke();
    }
  }
  // Centre the visible mesh in the current view.
  // Keep its usual scale unless the entire projected pose needs more space.
  function fitPose() {
    const [right, up] = axes;
    let left = Infinity,
      rightmost = -Infinity,
      bottom = Infinity,
      top = -Infinity;
    for (const mesh of parts) {
      for (let i = 0; i < mesh.p.length; i += 3) {
        const x = mesh.p[i],
          y = mesh.p[i + 1],
          z = mesh.p[i + 2];
        const r = x * right[0] + y * right[1] + z * right[2],
          u = x * up[0] + y * up[1] + z * up[2];
        left = Math.min(left, r);
        rightmost = Math.max(rightmost, r);
        bottom = Math.min(bottom, u);
        top = Math.max(top, u);
      }
    }
    if (!Number.isFinite(left)) return;
    scale = Math.min(scale, (0.88 * w) / (rightmost - left || 1), (0.88 * h) / (top - bottom || 1));
    const horizontal = (left + rightmost) / 2 - V.dot(options.center, right);
    const vertical = (bottom + top) / 2 - V.dot(options.center, up);
    origin = V.add(options.center, V.add(V.scale(right, horizontal), V.scale(up, vertical)));
  }
  function draw() {
    frame = 0;
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    if (w < 1 || h < 1) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1),
      ww = Math.round(w * dpr),
      hh = Math.round(h * dpr);
    if (canvas.width !== ww || canvas.height !== hh) {
      canvas.width = ww;
      canvas.height = hh;
    }
    const t = yaw * RAD,
      phi = tilt * RAD,
      cs = Math.cos(t),
      sn = Math.sin(t),
      ct = Math.cos(phi),
      st = Math.sin(phi);
    axes = [
      [-cs, sn, 0],
      [-sn * st, -cs * st, ct],
      [sn * ct, cs * ct, st],
    ];
    const roll=(options.roll || 0)*RAD, [r,u]=axes;
    axes[0]=V.add(V.scale(r,Math.cos(roll)),V.scale(u,Math.sin(roll)));
    axes[1]=V.add(V.scale(u,Math.cos(roll)),V.scale(r,-Math.sin(roll)));
    scale = Math.min(w / options.span[0], h / options.span[1]);
    if (options.fitPose) fitPose();
    if (gl) {
      gl.viewport(0, 0, ww, hh);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      for (let i = 0; i < 3; i++) gl.uniform3fv(loc[['right', 'up', 'eye'][i]], axes[i]);
      gl.uniform3fv(loc.center, origin);
      gl.uniform2f(loc.scale, (2 * scale) / w, (2 * scale) / h);
      for (const mesh of parts) {
        const r = resources.get(mesh);
        for (const key of ['pos', 'norm', 'color']) {
          gl.bindBuffer(gl.ARRAY_BUFFER, r[key]);
          gl.vertexAttribPointer(loc[key], 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(loc[key]);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, r.faces);
        gl.drawElements(gl.TRIANGLES, mesh.f.length, gl.UNSIGNED_SHORT, 0);
      }
    } else drawCPU();
    canvas.dataset.renderer = gl ? 'webgl' : 'canvas';
    options.drawn?.(project, axes[2]);
  }
  function queue() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function setParts(next) {
    for (const [mesh, r] of resources)
      if (!next.includes(mesh)) {
        for (const handle of Object.values(r)) gl.deleteBuffer(handle);
        resources.delete(mesh);
      }
    parts = next;
    if (gl) for (const mesh of parts) if (!resources.has(mesh)) prepare(mesh);
    queue();
  }
  function setAngle(a, b) {
    yaw = ((a + 540) % 360) - 180;
    tilt = Math.max(-30, Math.min(89, b));
    queue();
  }
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = [e.clientX, e.clientY, yaw, tilt];
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag) setAngle(drag[2] - (e.clientX - drag[0]) * 0.65, drag[3] + (e.clientY - drag[1]) * 0.5);
  });
  canvas.addEventListener('pointercancel', () => {
    drag = null;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    if (Math.hypot(e.clientX - drag[0], e.clientY - drag[1]) < 5)
      options.pick?.(e.clientX - r.left, e.clientY - r.top);
    drag = null;
  });
  canvas.addEventListener('keydown', (e) => {
    const delta = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowDown: [0, -12], ArrowUp: [0, 12] }[
      e.key
    ];
    if (delta) {
      e.preventDefault();
      setAngle(yaw + delta[0], tilt + delta[1]);
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setAngle(options.yaw, options.tilt);
    }
  });
  new ResizeObserver(queue).observe(canvas);
  return {
    setParts,
    setAngle,
    rotate: (a, b) => setAngle(yaw + a, tilt + b),
    reset: () => setAngle(options.yaw, options.tilt),
  };
}
