/* Project the native XYZ samples through an orthographic camera. */
(() => {
  const $ = (id) => document.getElementById(id);
  const arm = $('scene'),
    plane = $('handle');
  const overlay = document.createElement('canvas');
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });
  arm.after(overlay);
  const ink = '#dbe9e0',
    muted = '#a1b7b4',
    hand = '#55d9b0',
    elbow = '#ffad62',
    blue = '#9bc6ff',
    pink = '#f3a4d0';
  const gridColor = '#2e474b',
    guideColor = '#809a98';
  const presets = { oblique: [-0.68, 0.38], xy: [0, Math.PI / 2], xz: [0, 0], yz: [Math.PI / 2, 0] };
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const mul = (a, k) => a.map((x) => x * k);
  const unit = (a) => mul(a, 1 / (Math.hypot(...a) || 1));
  const cross = ([a, b, c], [d, e, f]) => [b * f - c * e, c * d - a * f, a * e - b * d];
  const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
  function nice(v) {
    const n = 10 ** Math.floor(Math.log10(Math.max(v, 1e-9)));
    return n * (v / n >= 5 ? 5 : v / n >= 2 ? 2 : 1);
  }
  function dimensions(canvas) {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2),
      bw = Math.max(1, Math.round(w * ratio)),
      bh = Math.max(1, Math.round(h * ratio));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    return [w, h];
  }
  function surface(canvas) {
    const [w, h] = dimensions(canvas),
      ctx = canvas.getContext('2d');
    ctx.setTransform(canvas.width / Math.max(1, w), 0, 0, canvas.height / Math.max(1, h), 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = '12px Arial, sans-serif';
    ctx.lineCap = 'round';
    return [ctx, w, h];
  }
  function line(ctx, a, b, col, width = 1, dash = []) {
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function path(ctx, points, col, width, dash = []) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    points.slice(1).forEach((p) => ctx.lineTo(...p));
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function label(ctx, str, x, y, color = ink) {
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }
  function circle(ctx, x, y, r, col) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  }
  const ball = [];
  const vertices = [
    [1, 0, 0],
    [0, 1, 0],
    [-1, 0, 0],
    [0, -1, 0],
  ];
  function split(a, b, c, n) {
    if (!n) {
      ball.push(a, b, c);
      return;
    }
    const ab = unit(add(a, b)),
      bc = unit(add(b, c)),
      ca = unit(add(c, a));
    for (const t of [
      [a, ab, ca],
      [ab, b, bc],
      [ca, bc, c],
      [ab, bc, ca],
    ])
      split(...t, n - 1);
  }
  for (let i = 0; i < 4; i++) {
    const a = vertices[i],
      b = vertices[(i + 1) % 4];
    split(a, b, [0, 0, 1], 2);
    split(b, a, [0, 0, -1], 2);
  }
  const gl = arm.getContext('webgl', {
    antialias: true,
    alpha: true,
    depth: true,
    preserveDrawingBuffer: false,
  });
  let renderSolid = null;
  if (gl) {
    function shader(kind, src) {
      const sh = gl.createShader(kind);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(sh));
      return sh;
    }
    const program = gl.createProgram();
    gl.attachShader(
      program,
      shader(
        gl.VERTEX_SHADER,
        `
      attribute vec3 p; attribute vec3 n; attribute vec3 rgb;
      uniform vec3 cx,cy,cz,center,scale; varying vec3 color;
      void main(){vec3 d=p-center; gl_Position=vec4(dot(d,cx)*scale.x,dot(d,cy)*scale.y,-dot(d,cz)*scale.z,1.);
        float lit=length(n)<.1 ? 1. : .58+.42*max(0.,dot(n,normalize(-cx+cy+cz*1.6)));
        color=rgb*lit;}`,
      ),
    );
    gl.attachShader(
      program,
      shader(
        gl.FRAGMENT_SHADER,
        'precision mediump float; varying vec3 color; void main(){gl_FragColor=vec4(color,1.);}',
      ),
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    const buffer = gl.createBuffer(),
      colors = new Map();
    const attributes = ['p', 'n', 'rgb'].map((s) => gl.getAttribLocation(program, s));
    const uniforms = ['cx', 'cy', 'cz', 'center', 'scale'].map((s) => gl.getUniformLocation(program, s));
    function color(s) {
      if (!colors.has(s))
        colors.set(
          s,
          [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255),
        );
      return colors.get(s);
    }
    renderSolid = (cam, lines, balls) => {
      gl.viewport(0, 0, arm.width, arm.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      attributes.forEach((loc, i) => {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 36, i * 12);
      });
      [cam.x, cam.y, cam.z, cam.center, cam.scale].forEach((v, i) => gl.uniform3fv(uniforms[i], v));
      const data = [];
      function vertex(p, n, c) {
        data.push(...p, ...n, ...color(c));
      }
      lines.forEach(({ a, b, col }) => {
        vertex(a, [0, 0, 0], col);
        vertex(b, [0, 0, 0], col);
      });
      const lineCount = data.length / 9;
      balls.forEach(({ p, r, col }) => ball.forEach((n) => vertex(add(p, mul(n, r)), n, col)));
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.LINES, 0, lineCount);
      gl.drawArrays(gl.TRIANGLES, lineCount, data.length / 9 - lineCount);
    };
  }
  let yaw = presets.oblique[0],
    pitch = presets.oblique[1],
    latest = null;
  function drawArm(c, step, showPred) {
    const f = $('focus').value,
      sites = f === 'both' ? [0, 1] : [f === 'hand' ? 0 : 1];
    const [ctx, w, h] = surface(overlay);
    dimensions(arm);
    if (w < 1 || h < 1) return;
    const x = [Math.cos(yaw), Math.sin(yaw), 0];
    const y = [-Math.sin(yaw) * Math.sin(pitch), Math.cos(yaw) * Math.sin(pitch), Math.cos(pitch)];
    const z = cross(x, y),
      sitesAt = (p, s) => p.slice(3 * s, 3 * s + 3);
    const all = sites.flatMap((s) =>
      [...c.positions, ...(showPred ? c.motorPositions : [])].map((p) => sitesAt(p, s)),
    );
    const low = [0, 1, 2].map((i) => Math.min(...all.map((p) => p[i]))),
      hi = [0, 1, 2].map((i) => Math.max(...all.map((p) => p[i])));
    const center = mul(add(low, hi), 0.5);
    const radius = Math.max(...all.map((p) => Math.hypot(...sub(p, center))), 0.0025);
    const vectors = all.map((p) => sub(p, center));
    const halfX = Math.max(0.18 * radius, ...vectors.map((p) => Math.abs(dot(p, x))));
    const halfY = Math.max(0.18 * radius, ...vectors.map((p) => Math.abs(dot(p, y))));
    const px = Math.min((w - 64) / (2 * halfX), (h - 68) / (2 * halfY), (2.2 * (h - 68)) / (2 * radius)),
      size = 1 / px;
    const cam = { x, y, z, center, scale: [(px * 2) / w, (px * 2) / h, 1 / (radius * 3)] };
    function project(p) {
      const d = sub(p, center);
      return [w / 2 + dot(d, x) * px, h / 2 - dot(d, y) * px];
    }
    const lines = [],
      balls = [];
    function seg(a, b, col, dash = false) {
      if (dash) {
        for (let j = 0; j < 6; j += 2)
          lines.push({ a: add(a, mul(sub(b, a), j / 6)), b: add(a, mul(sub(b, a), (j + 1) / 6)), col });
      } else lines.push({ a, b, col });
    }
    const showN = Math.min(30, step + 1);
    const gridStep = nice(radius * 0.4),
      far = gridStep * 3;
    const cz = low[2] - 0.13 * radius,
      cx = center[0],
      cy = center[1];
    for (let j = -3; j <= 3; j++) {
      seg([cx + j * gridStep, cy - far, cz], [cx + j * gridStep, cy + far, cz], gridColor);
      seg([cx - far, cy + j * gridStep, cz], [cx + far, cy + j * gridStep, cz], gridColor);
    }
    if (sites.length === 2 && step < 30)
      seg(sitesAt(c.positions[step], 0), sitesAt(c.positions[step], 1), guideColor, true);
    for (const site of sites) {
      const col = [hand, elbow][site];
      const hist = c.positions.slice(0, showN).map((p) => sitesAt(p, site));
      hist.slice(1).forEach((p, i) => seg(hist[i], p, col));
      hist.forEach((p, i) => {
        if (i % 3 === 0) balls.push({ p, r: size * 1.65, col });
      });
      if (step < 30) balls.push({ p: hist.at(-1), r: size * 6, col });
      if (showPred && c.motorPositions.length && step >= 20) {
        const pred = [
          sitesAt(c.positions[19], site),
          ...c.motorPositions.slice(0, showN - 20).map((p) => sitesAt(p, site)),
        ];
        pred.slice(1).forEach((p, i) => seg(pred[i], p, pink, true));
        if (step < 30) balls.push({ p: pred.at(-1), r: size * 3.2, col: pink });
      }
    }
    if (renderSolid && !gl.isContextLost()) renderSolid(cam, lines, balls);
    else {
      for (const l of lines) line(ctx, project(l.a), project(l.b), l.col, 1.2);
      balls
        .sort((a, b) => dot(a.p, z) - dot(b.p, z))
        .forEach(({ p, r, col }) => {
          const [a, b] = project(p);
          circle(ctx, a, b, r * px, col);
        });
    }
    const anchor = [35, h - 30];
    [0, 1, 2].forEach((i) => {
      const end = [anchor[0] + 19 * x[i], anchor[1] - 19 * y[i]];
      line(ctx, anchor, end, muted, 1.5);
      if (Math.hypot(x[i], y[i]) > 0.25) label(ctx, 'XYZ'[i], end[0] + 2, end[1] + 2);
    });
    const ruler = nice(54 / px),
      rpx = ruler * px;
    line(ctx, [w - 16 - rpx, h - 19], [w - 16, h - 19], ink, 1.5);
    for (const a of [w - 16 - rpx, w - 16]) line(ctx, [a, h - 22], [a, h - 16], ink, 1);
    ctx.textAlign = 'right';
    label(
      ctx,
      (ruler * 1000).toLocaleString('en', { maximumFractionDigits: 2 }) + ' mm',
      w - 16,
      h - 25,
    );
    ctx.textAlign = 'left';
    if (step >= 30) {
      ctx.textAlign = 'center';
      label(ctx, 'Path ends at +90 ms', w / 2, h - 12);
      ctx.textAlign = 'left';
    }
  }
  function drawHandle(c, step, showPred) {
    const [ctx, w, h] = surface(plane);
    if (!w || !h) return;
    const all = [...c.positions, ...(showPred ? c.motorPositions : [])].map((p) => p.slice(6));
    const lo = [0, 1].map((i) => Math.min(...all.map((p) => p[i]))),
      hi = [0, 1].map((i) => Math.max(...all.map((p) => p[i])));
    const center = mul(add(lo, hi), 0.5),
      range = Math.max(hi[0] - lo[0], hi[1] - lo[1], 0.025);
    const px = Math.min(w - 76, h - 51) / range,
      axis = nice(Math.min(w, h) / 3 / px);
    const ox = w / 2,
      oy = h / 2,
      screen = (p) => [ox + (p[0] - center[0]) * px, oy - (p[1] - center[1]) * px];
    for (
      let a = Math.ceil((center[0] - (w / 2 - 17) / px) / axis) * axis;
      a < center[0] + (w / 2 - 14) / px;
      a += axis
    ) {
      const [xx] = screen([a, 0]);
      line(ctx, [xx, 12], [xx, h - 22], gridColor);
      if (xx > 34 && xx < w - 22) {
        ctx.textAlign = 'center';
        label(ctx, (+a.toFixed(3)).toString(), xx, h - 8, muted);
      }
    }
    for (
      let a = Math.ceil((center[1] - (h / 2 - 17) / px) / axis) * axis;
      a < center[1] + (h / 2 - 14) / px;
      a += axis
    ) {
      const yy = screen([0, a])[1];
      line(ctx, [12, yy], [w - 14, yy], gridColor);
      ctx.textAlign = 'left';
      label(ctx, (+a.toFixed(3)).toString(), 5, yy - 2, muted);
    }
    ctx.textAlign = 'left';
    label(ctx, 'Y', 8, 12, ink);
    label(ctx, 'X', w - 15, h - 8, ink);
    const n = Math.min(step + 1, 30),
      points = c.positions.slice(0, n).map((p) => screen(p.slice(6)));
    path(ctx, points, blue, 2.6);
    circle(ctx, ...points[0], 2.7, blue);
    if (step < 30) circle(ctx, ...points.at(-1), 5.8, blue);
    if (step >= 20 && showPred && c.motorPositions.length) {
      const pred = [c.positions[19], ...c.motorPositions.slice(0, n - 20)].map((p) =>
        screen(p.slice(6)),
      );
      path(ctx, pred, pink, 1.9, [4, 4]);
      if (step < 30) circle(ctx, ...pred.at(-1), 3.3, pink);
    }
  }
  function render(c, step, showPred) {
    latest = [c, step, showPred];
    drawArm(...latest);
    drawHandle(...latest);
  }
  const redraw = () => {
    if (latest) render(...latest);
  };
  $('focus').addEventListener('change', redraw);
  $('view').addEventListener('change', () => {
    [yaw, pitch] = presets[$('view').value];
    redraw();
  });
  function rotate(dx, dy) {
    yaw += dx;
    pitch = clamp(pitch + dy, -Math.PI / 2, Math.PI / 2);
    $('view').value = 'custom';
    redraw();
  }
  let drag = null;
  arm.addEventListener('pointerdown', (e) => {
    drag = [e.clientX, e.clientY];
    arm.setPointerCapture(e.pointerId);
  });
  arm.addEventListener('pointermove', (e) => {
    if (!drag) return;
    rotate((e.clientX - drag[0]) * 0.013, (drag[1] - e.clientY) * 0.013);
    drag = [e.clientX, e.clientY];
  });
  arm.addEventListener('lostpointercapture', () => (drag = null));
  arm.addEventListener('keydown', (e) => {
    const change = {
      ArrowLeft: [-0.12, 0],
      ArrowRight: [0.12, 0],
      ArrowUp: [0, 0.12],
      ArrowDown: [0, -0.12],
    }[e.key];
    if (change) {
      e.preventDefault();
      rotate(...change);
    }
  });
  arm.addEventListener('webglcontextlost', () => {
    renderSolid = null;
    redraw();
  });
  new ResizeObserver(redraw).observe(arm);
  new ResizeObserver(redraw).observe(plane);
  window.drawReach = render;
})();
