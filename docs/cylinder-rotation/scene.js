/* A right-handed orthographic camera. The body and sensor vectors share one rotation. */
(function () {
  const unit = (v) => {
    const n = Math.hypot(...v);
    return v.map((x) => x / (n || 1));
  };
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const basis = ([x, y, z]) => [x, z, -y];
  function multiply([w, x, y, z], [W, X, Y, Z]) {
    return [
      w * W - x * X - y * Y - z * Z,
      w * X + x * W + y * Z - z * Y,
      w * Y - x * Z + y * W + z * X,
      w * Z + x * Y - y * X + z * W,
    ];
  }
  function relative(first, sample) {
    const [w, x, y, z] = first;
    const [a, b, c, d] = unit(multiply([w, -x, -y, -z], sample));
    return [a, b, d, -c];
  }
  function matrix([w, x, y, z]) {
    return [
      [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
      [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
      [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ];
  }
  const times = (m, v) => m.map((r) => dot(r, v));
  const lamp = unit([-0.44, 0.86, 0.57]);
  const parts = APPARATUS.parts.map((part) => {
    const hex = APPARATUS.materials[part.material][1];
    const color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const faces = part.faces
      .map((ids) => {
        const [a, b, c] = ids.map((i) => part.vertices[i]);
        const normal = cross(sub(b, a), sub(c, a));
        return { ids, normal: unit(normal), area: Math.hypot(...normal) };
      })
      .filter((f) => f.area > 1e-8);
    return {
      vertices: part.vertices,
      faces,
      color,
      shine: part.material === 5 ? 32 : 11,
    };
  });

  window.cylinderScene = function (canvas) {
    let yaw = -0.52,
      pitch = 0.4,
      zoom = 1,
      drag = null,
      last = null;
    const ctx = canvas.getContext("2d");
    // Keep a per-pixel depth buffer. The case, marker mounts and cylinder intersect.
    const raster = document.createElement("canvas");
    const surface = raster.getContext("2d");
    let pixels, depth;
    function reset() {
      yaw = -0.52;
      pitch = 0.4;
      zoom = 1;
      refresh();
    }
    function orbit(dx, dy) {
      yaw += dx;
      pitch = Math.max(-1.35, Math.min(1.4, pitch + dy));
      refresh();
    }
    function refresh() {
      if (last) draw(...last);
    }
    canvas.addEventListener("keydown", (e) => {
      const d = {
        ArrowLeft: [-0.12, 0],
        ArrowRight: [0.12, 0],
        ArrowUp: [0, 0.12],
        ArrowDown: [0, -0.12],
      }[e.key];
      if (d) {
        e.preventDefault();
        orbit(...d);
      }
      if (e.key === "Home") {
        e.preventDefault();
        reset();
      }
    });
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      drag = [e.clientX, e.clientY];
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const [x, y] = drag;
      drag = [e.clientX, e.clientY];
      orbit((x - e.clientX) * 0.011, (e.clientY - y) * 0.009);
    });
    canvas.addEventListener("lostpointercapture", () => (drag = null));
    function draw(row, first, channel, axes) {
      last = [row, first, channel, axes];
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.round(width * ratio) ||
        canvas.height !== Math.round(height * ratio)
      ) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const q = relative(first, row.slice(7)),
        rot = matrix(q);
      const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
      const up = [
        -Math.sin(pitch) * Math.sin(yaw),
        Math.cos(pitch),
        -Math.sin(pitch) * Math.cos(yaw),
      ];
      const eye = [
        Math.cos(pitch) * Math.sin(yaw),
        Math.sin(pitch),
        Math.cos(pitch) * Math.cos(yaw),
      ];
      const scale = Math.min(width / 111, height / 90) * zoom,
        ox = width * 0.49,
        oy = height * 0.51;
      const project = (p) => [
        ox + scale * dot(right, p),
        oy - scale * dot(up, p),
        dot(eye, p),
      ];
      function line(a, b, color, lineWidth = 1) {
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      function circle(rad, color) {
        ctx.beginPath();
        for (let i = 0; i <= 96; i++) {
          const t = (i * Math.PI) / 48,
            p = project([rad * Math.cos(t), -31, rad * Math.sin(t)]);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      circle(36, "#394346");
      circle(45, "#2d383b");
      for (let i = -80; i <= 80; i += 10) {
        line(project([i, -31, -66]), project([i, -31, 66]), "#273235");
        line(project([-66, -31, i]), project([66, -31, i]), "#273235");
      }
      const eyeLight = unit(eye.map((v, i) => v + lamp[i]));
      const localEyes = rot[0].map((_, i) =>
        eye.reduce((s, v, j) => s + v * rot[j][i], 0),
      );
      const localLamp = rot[0].map((_, i) =>
        lamp.reduce((s, v, j) => s + v * rot[j][i], 0),
      );
      const localShine = rot[0].map((_, i) =>
        eyeLight.reduce((s, v, j) => s + v * rot[j][i], 0),
      );
      const bounds = parts.map((p) =>
        p.vertices.map((v) => project(times(rot, v))),
      );
      let xmin = width,
        xmax = 0,
        ymin = height,
        ymax = 0;
      for (const pp of bounds)
        for (const p of pp) {
          xmin = Math.min(xmin, p[0]);
          xmax = Math.max(xmax, p[0]);
          ymin = Math.min(ymin, p[1]);
          ymax = Math.max(ymax, p[1]);
        }
      xmin = Math.floor(xmin) - 1;
      ymin = Math.floor(ymin) - 1;
      const rw = Math.ceil(xmax - xmin) + 2,
        rh = Math.ceil(ymax - ymin) + 2;
      const density = Math.min(ratio, 1.5);
      const bw = Math.ceil(rw * density),
        bh = Math.ceil(rh * density);
      if (!pixels || raster.width !== bw || raster.height !== bh) {
        raster.width = bw;
        raster.height = bh;
        pixels = surface.createImageData(bw, bh);
        depth = new Float32Array(bw * bh);
      }
      pixels.data.fill(0);
      depth.fill(-Infinity);
      parts.forEach((part, index) => {
        const points = bounds[index].map(([x, y, z]) => [
          (x - xmin) * density,
          (y - ymin) * density,
          z,
        ]);
        for (const f of part.faces) {
          if (dot(f.normal, localEyes) < 0.00001) continue;
          const [a, b, c] = f.ids.map((i) => points[i]);
          const ex = b[0] - a[0],
            ey = b[1] - a[1],
            fx = c[0] - a[0],
            fy = c[1] - a[1];
          const det = ex * fy - ey * fx;
          if (Math.abs(det) < 1e-7) continue;
          const light = 0.62 + 0.53 * Math.max(0, dot(f.normal, localLamp));
          const highlight =
            Math.pow(Math.max(0, dot(f.normal, localShine)), 18) * part.shine;
          const rgb = part.color.map((v) =>
            Math.round(Math.min(255, v * light + highlight)),
          );
          const x0 = Math.max(0, Math.ceil(Math.min(a[0], b[0], c[0]) - 0.5)),
            x1 = Math.min(bw - 1, Math.floor(Math.max(a[0], b[0], c[0]) - 0.5));
          const y0 = Math.max(0, Math.ceil(Math.min(a[1], b[1], c[1]) - 0.5)),
            y1 = Math.min(bh - 1, Math.floor(Math.max(a[1], b[1], c[1]) - 0.5));
          for (let py = y0; py <= y1; py++) {
            const dy = py + 0.5 - a[1];
            let u = ((x0 + 0.5 - a[0]) * fy - dy * fx) / det;
            let v = (ex * dy - ey * (x0 + 0.5 - a[0])) / det;
            for (let px = x0; px <= x1; px++, u += fy / det, v -= ey / det) {
              if (u < -0.0000001 || v < -0.0000001 || u + v > 1.0000001)
                continue;
              const z = a[2] + u * (b[2] - a[2]) + v * (c[2] - a[2]),
                i = py * bw + px;
              if (z < depth[i]) continue;
              depth[i] = z;
              pixels.data[4 * i] = rgb[0];
              pixels.data[4 * i + 1] = rgb[1];
              pixels.data[4 * i + 2] = rgb[2];
              pixels.data[4 * i + 3] = 255;
            }
          }
        }
      });
      surface.putImageData(pixels, 0, 0);
      ctx.drawImage(raster, xmin, ymin, bw / density, bh / density);
      function arrow(start, end, color, label) {
        const a = project(start),
          b = project(end),
          dx = b[0] - a[0],
          dy = b[1] - a[1],
          n = Math.hypot(dx, dy);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(a[0], a[1], 2.6, 0, Math.PI * 2);
        ctx.fill();
        if (n < 3) return;
        line(a, b, color, 2.3);
        const ux = dx / n,
          uy = dy / n;
        ctx.beginPath();
        ctx.moveTo(b[0], b[1]);
        ctx.lineTo(b[0] - 7 * ux + 3.8 * uy, b[1] - 7 * uy - 3.8 * ux);
        ctx.lineTo(b[0] - 7 * ux - 3.8 * uy, b[1] - 7 * uy + 3.8 * ux);
        ctx.closePath();
        ctx.fill();
        if (label) {
          ctx.font = "bold 12px system-ui";
          ctx.fillText(label, b[0] + 5, b[1] - 4);
        }
      }
      const sensor = times(rot, [0, 12.4, 0]);
      function sensorArrow(values, factor, color) {
        const v = times(rot, basis(values));
        arrow(
          sensor,
          sensor.map((x, i) => x + v[i] * factor),
          color,
          "",
        );
      }
      if (channel === "gyro") sensorArrow(row.slice(4, 7), 8, "#ffae74");
      if (channel === "accel") sensorArrow(row.slice(1, 4), 3.2, "#91e0d8");
      if (axes) {
        // Fixed-size key anchored to a corner; its axes turn with the instrument.
        const ctr = [53, height - 43];
        const dirs = [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ];
        dirs.forEach((d, i) => {
          const p = times(rot, basis(d)),
            b = [ctr[0] + 22 * dot(right, p), ctr[1] - 22 * dot(up, p)];
          const col = ["#ffad78", "#9fcec3", "#c0b2fb"][i];
          line(ctr, b, col, 1.6);
          ctx.fillStyle = col;
          ctx.font = "bold 10px system-ui";
          ctx.fillText(
            "XYZ"[i],
            b[0] + (b[0] >= ctr[0] ? 2 : -8),
            b[1] + (b[1] >= ctr[1] ? 9 : -2),
          );
        });
      }
      return q;
    }
    new ResizeObserver(refresh).observe(canvas);
    return { draw, reset };
  };
  window.cylinderMath = { relative, basis, matrix, times };
})();
