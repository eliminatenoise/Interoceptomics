'use strict';
(() => {
  const slider = document.getElementById('camera-offset');
  const offsetReadout = document.getElementById('camera-offset-value');
  const result = document.getElementById('camera-clock-result');
  const canvas = document.getElementById('camera-clock');
  const ctx = canvas.getContext('2d');
  const spike = 44;

  function line(x1, y1, x2, y2, color, width) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function draw() {
    const offset = Number(slider.value);
    const selected = 40 + offset;
    const delta = selected - spike;
    offsetReadout.textContent = (offset > 0 ? '+' : '') + offset + ' ms';
    const relation = delta === 0 ? 'at the same time as' :
      Math.abs(delta) + ' ms ' + (delta < 0 ? 'before' : 'after');
    const description = 'The selected example frame is ' + relation + ' the spike.';
    result.textContent = description;
    canvas.setAttribute('aria-label', 'Example time grid, zero to 90 milliseconds. ' + description);
    if (!ctx) return;

    const width = Math.max(canvas.clientWidth, 160);
    const height = 180;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const bitmapWidth = Math.round(width * scale);
    const bitmapHeight = Math.round(height * scale);
    if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
      canvas.width = bitmapWidth;
      canvas.height = bitmapHeight;
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const narrow = width < 420;
    const left = narrow ? 63 : 96;
    const right = width - 13;
    const x = time => left + time * (right - left) / 90;
    ctx.font = (narrow ? '12px' : '15px') + ' system-ui, sans-serif';
    ctx.fillStyle = '#203237';
    ctx.fillText('Force', 8, 40);
    ctx.fillText('Nerve', 8, 82);
    ctx.fillText('Camera', 8, 124);
    for (const y of [35, 77, 119]) line(x(0), y, x(90), y, '#b8c9c6', 1.5);
    for (let t = 0; t <= 90; t++) line(x(t), 29, x(t), 41, t % 10 ? '#dce5e4' : '#4d6867', 1);
    const labelEvery = narrow ? 30 : 10;
    for (let t = 0; t <= 90; t += labelEvery) {
      const label = t === 90 ? '90 ms' : String(t);
      const labelWidth = ctx.measureText(label).width;
      const leftEdge = Math.min(x(t) - labelWidth / 2, width - labelWidth - 5);
      ctx.fillStyle = '#40585a';
      ctx.fillText(label, leftEdge, 164);
    }
    line(x(spike), 59, x(spike), 94, '#904b31', 4);
    for (let t = selected - 80; t <= 90; t += 20) {
      if (t < 0 || t === selected) continue;
      ctx.fillStyle = '#3d7471';
      ctx.fillRect(x(t) - 3, 110, 6, 18);
    }
    ctx.fillStyle = '#133d3d';
    ctx.fillRect(x(selected) - 5, 105, 10, 28);
    line(x(spike), 99, x(spike), 138, '#904b31', 1);
  }
  slider.addEventListener('input', draw);
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(canvas);
  else window.addEventListener('resize', draw);
  draw();
})();
