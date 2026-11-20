/* Orthographic projection of laboratory coordinates in millimetres. */
class ReachScene {
  constructor(canvas, cameraChanged) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cameraChanged = cameraChanged;
    this.setView("orbit");
    new ResizeObserver(() => this.draw()).observe(canvas);
    let drag;
    canvas.addEventListener("pointerdown", (e) => {
      drag = [e.clientX, e.clientY];
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag || !canvas.hasPointerCapture(e.pointerId)) return;
      this.rotate((e.clientX - drag[0]) * 0.012, (e.clientY - drag[1]) * 0.009);
      drag = [e.clientX, e.clientY];
    });
    canvas.addEventListener("lostpointercapture", () => {
      drag = null;
    });
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.magnify(Math.exp(-Math.sign(e.deltaY) * 0.1));
      },
      { passive: false },
    );
    canvas.addEventListener("keydown", (e) => {
      const steps = {
        ArrowLeft: [-0.12, 0],
        ArrowRight: [0.12, 0],
        ArrowUp: [0, 0.12],
        ArrowDown: [0, -0.12],
      };
      if (steps[e.key]) {
        e.preventDefault();
        this.rotate(...steps[e.key]);
      }
      if (["+", "=", "-"].includes(e.key)) {
        e.preventDefault();
        this.magnify(e.key === "-" ? 0.9 : 1.1);
      }
      if (e.key === "Home") {
        e.preventDefault();
        this.setView("orbit");
      }
    });
  }
  setView(mode) {
    this.yaw = mode === "orbit" ? 0.4 : 0;
    this.pitch = mode === "top" ? Math.PI / 2 : mode === "side" ? 0 : 0.63;
    this.zoom = 1;
    this.cameraChanged(mode);
    this.draw();
  }
  rotate(x, y) {
    this.yaw += x;
    this.pitch = Math.max(-1.45, Math.min(Math.PI / 2, this.pitch + y));
    this.cameraChanged("orbit");
    this.draw();
  }
  magnify(factor) {
    this.zoom = Math.max(0.55, Math.min(2.4, this.zoom * factor));
    this.draw();
  }
  setTrials(trial, other) {
    this.trial = trial;
    this.other = other;
    this.cache = null;
    const path = (t) =>
      t.frames.map((row) => (row[1] === null ? null : row.slice(1)));
    this.primary = path(trial);
    this.secondary = other ? path(other) : null;
    const points = [...trial.frames, ...(other ? other.frames : [])].filter(
      (row) => row[1] !== null,
    );
    const bounds = [1, 2, 3].map((j) => [
      Math.min(0, ...points.map((row) => row[j])),
      Math.max(0, ...points.map((row) => row[j])),
    ]);
    this.centre = bounds.map(([a, b]) => (a + b) / 2);
    this.bounds = bounds;
    this.frame = 0;
    this.draw();
  }
  draw() {
    if (!this.trial) return;
    const canvas = this.canvas,
      ctx = this.ctx,
      w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const co = Math.cos(this.yaw),
      si = Math.sin(this.yaw),
      cp = Math.cos(this.pitch),
      sp = Math.sin(this.pitch);
    const [dx, dy, dz] = this.bounds.map(([a, b]) => b - a);
    const spanX = Math.abs(co) * dx + Math.abs(si) * dy;
    const spanY =
      Math.abs(si * sp) * dx + Math.abs(co * sp) * dy + Math.abs(cp) * dz;
    const scale =
      Math.min((w * 0.83) / (spanX + 66), (h * 0.82) / (spanY + 75), 2.7) *
      this.zoom;
    const project = (p, local = false) => {
      const [x, y, z] = local ? p : p.map((v, i) => v - this.centre[i]);
      const right = x * co + y * si,
        depth = y * co - x * si;
      return [
        w * 0.5 + right * scale,
        h * 0.49 - (z * cp + depth * sp) * scale,
        depth * cp - z * sp,
      ];
    };
    function line(points, color, width = 1, dash = []) {
      ctx.beginPath();
      let started = false;
      for (const p of points) {
        if (!p) {
          started = false;
          continue;
        }
        const q = project(p);
        if (started) ctx.lineTo(q[0], q[1]);
        else ctx.moveTo(q[0], q[1]);
        started = true;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    function circle(p, radius, fill, outline) {
      const [x, y] = project(p);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = outline;
      ctx.stroke();
    }
    const origin = [0, 0, 0],
      primary = this.primary;
    const key = [
      canvas.width,
      canvas.height,
      w,
      h,
      this.yaw,
      this.pitch,
      this.zoom,
    ].join("/");
    if (!this.cache || this.cache.key !== key) {
      const bound = 400;
      for (let v = -bound; v <= bound; v += 50) {
        line(
          [
            [v, -bound, 0],
            [v, bound, 0],
          ],
          "#c7d3c4",
        );
        line(
          [
            [-bound, v, 0],
            [bound, v, 0],
          ],
          "#c7d3c4",
        );
      }

      if (this.other) {
        const second = this.secondary;
        line(second, "#ae5427", 2, [5, 5]);
        circle(second.findLast(Boolean), 4, "#f8e5cb", "#a74716");
      }
      line(primary, "#176756", 2.8);
      const [sx, sy] = project(origin);
      ctx.fillStyle = "#304e46";
      ctx.beginPath();
      ctx.moveTo(sx, sy - 4);
      ctx.lineTo(sx + 4, sy);
      ctx.lineTo(sx, sy + 4);
      ctx.lineTo(sx - 4, sy);
      ctx.fill();
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillText("Start", sx + 7, sy - 7);
      circle(primary.findLast(Boolean), 5, "#eff7e9", "#096452");
      const base = document.createElement("canvas");
      base.width = canvas.width;
      base.height = canvas.height;
      base.getContext("2d").drawImage(canvas, 0, 0);
      this.cache = { key, base };
    } else {
      ctx.drawImage(this.cache.base, 0, 0, w, h);
    }
    const pos = primary[this.frame];
    if (pos) {
      line([[pos[0], pos[1], 0], pos], "#54746a", 1, [3, 4]);
      this.drawObject(pos, project, scale);
    }
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillStyle = "#385452";
    const tip = project([0, 0, 0], true);
    for (const [label, vec, color] of [
      ["X", [1, 0, 0], "#9c4b34"],
      ["Y", [0, 1, 0], "#42674e"],
      ["Z", [0, 0, 1], "#3e6384"],
    ]) {
      const q = project(vec, true);
      const dx = ((q[0] - tip[0]) * 22) / scale,
        dy = ((q[1] - tip[1]) * 22) / scale;
      if (Math.hypot(dx, dy) < 2) continue;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(36, h - 34);
      ctx.lineTo(36 + dx, h - 34 + dy);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(label, 34 + dx * 1.19, h - 32 + dy * 1.19);
    }
    const mm = scale * 50 > w * 0.28 ? 20 : 50,
      bar = mm * scale;
    ctx.strokeStyle = "#39594e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w - 14 - bar, h - 19);
    ctx.lineTo(w - 14, h - 19);
    ctx.moveTo(w - 14 - bar, h - 22);
    ctx.lineTo(w - 14 - bar, h - 16);
    ctx.moveTo(w - 14, h - 22);
    ctx.lineTo(w - 14, h - 16);
    ctx.stroke();
    ctx.fillStyle = "#39594e";
    ctx.textAlign = "right";
    ctx.fillText(`${mm} mm`, w - 14, h - 27);
    ctx.textAlign = "left";
  }
  drawObject(pos, project, scale) {
    const ctx = this.ctx,
      polygons = [];
    function face(corners, color) {
      const p = corners.map((c) => project(c.map((v, i) => v + pos[i])));
      polygons.push({
        p,
        color,
        depth: p.reduce((sum, a) => sum + a[2], 0) / p.length,
      });
    }
    const ring = (a, z, r) => [Math.cos(a) * r, Math.sin(a) * r, z];
    const cap = [];
    for (let i = 0; i < 48; i++) {
      const a = (i * 2 * Math.PI) / 48,
        b = ((i + 1) * 2 * Math.PI) / 48;
      const tone = Math.round(39 + 21 * (1 + Math.sin(a - 0.7)));
      face(
        [
          ring(a, -43, 25),
          ring(b, -43, 25),
          ring(b, -18, 25),
          ring(a, -18, 25),
        ],
        `rgb(${tone},${tone + 4},${tone + 2})`,
      );
      cap.push(ring(a, -18, 25));
    }
    face(cap, "#404641");
    face(
      cap.map((p) => [p[0], p[1], -43]),
      "#282f2d",
    );
    const box = [
      [-16, -12],
      [16, -12],
      [16, 12],
      [-16, 12],
    ];
    for (let i = 0; i < 4; i++) {
      const a = box[i],
        b = box[(i + 1) % 4];
      face(
        [
          [...a, -18],
          [...b, -18],
          [...b, -7],
          [...a, -7],
        ],
        ["#b34b1a", "#dc5921", "#a34019", "#bd4918"][i],
      );
    }
    face(
      box.map((v) => [...v, -7]),
      "#e37237",
    );
    const spheres = [
      [-9, -5, 0],
      [9, 5, 0],
    ].map((c) => project(c.map((v, i) => v + pos[i])));
    for (const p of spheres) polygons.push({ ball: true, p, depth: p[2] });
    for (const item of polygons.sort((a, b) => b.depth - a.depth)) {
      if (item.ball) {
        const [x, y] = item.p,
          r = Math.max(1, 6.2 * scale);
        const g = ctx.createRadialGradient(
          x - r * 0.35,
          y - r * 0.4,
          0,
          x,
          y,
          r,
        );
        g.addColorStop(0, "#f2f0dc");
        g.addColorStop(0.55, "#aaa998");
        g.addColorStop(1, "#555d57");
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      item.p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }
}
