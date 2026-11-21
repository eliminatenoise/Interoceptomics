/* One slider step = one 10 ms interval in the released MATLAB grid. */
(() => {
  const $ = (id) => document.getElementById(id);
  const data = window.REACH_FEEDBACK,
    names = {
      train: 'Training',
      validation: 'Validation',
      within: 'Later · same workspace',
      transfer: 'Other workspace',
    };
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const time = (t) => (t > 0 ? '+' + t : String(t).replace('-', '−'));
  const coord = (v, dec) => v.toFixed(dec).replace('-', '−');
  const phases = ['Earlier inputs', 'Movement', 'Later counts'];
  const descriptions = [
    'Everything observed through bin k−1 was available at the prediction cutoff. The dots and counts here belong to those earlier inputs.',
    'The model makes the entire ten-sample movement forecast at k. Recorded paths and simultaneous spikes here are later observations.',
    'The movement comparison ended at +90 ms. The path stays on screen for reference while the later 10 ms spike counts advance.',
  ];

  let c = null,
    original = null,
    step = 29,
    unit = 0,
    timer = null,
    rasterArea = null;
  const isJoint = () => $('model').value === 'joint';
  const clipSelect = $('clip'),
    unitSelect = $('unit');
  for (const item of data.clips) {
    if (item.eligible) {
      item.positions = [...item.pose, ...item.movement.map((d) => add(item.pose[19], d))];
      item.counts = [...item.spikes, ...item.concurrent, ...item.delayed];
    }
    clipSelect.add(new Option(names[item.split] + ' · W' + item.workspace, item.split));
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    $('play').textContent = 'Play slowly';
  }
  function setStep(n) {
    step = Math.min(39, Math.max(0, n));
    $('clock').value = step;
    draw();
  }
  function tableRow(cells, cls = '') {
    const tr = document.createElement('tr');
    tr.className = cls;
    cells.forEach((text, i) => {
      const cell = document.createElement(i === 0 ? 'th' : 'td');
      if (!i) cell.scope = 'row';
      cell.textContent = text;
      tr.append(cell);
    });
    return tr;
  }
  function positions() {
    const tbody = $('positions').tBodies[0];
    tbody.replaceChildren();
    const i = Math.min(step, 29),
      observed = c.positions[i],
      pred = c.motorPositions[step - 20];
    const last = step >= 30 ? ' at +90 ms' : '';
    const sites = [
      ['Hand · m', 0, 3, 4],
      ['Elbow marker · m', 3, 3, 4],
      ['Handle · cm', 6, 2, 3],
    ];
    for (const [name, start, n, dec] of sites) {
      const values = (p) => [
        ...p.slice(start, start + n).map((v) => coord(v, dec)),
        ...(n === 2 ? ['—'] : []),
      ];
      tbody.append(tableRow([name + last, ...values(observed)]));
      if (step >= 20 && step < 30 && pred && $('showPred').checked)
        tbody.append(tableRow([name + ' · forecast', ...values(pred)], 'pred'));
    }
    const comment = c.motorPositions.length
      ? isJoint()
        ? 'The joint recurrent model rolls its own predicted movement forward and estimates later counts from the same earlier history. Pink shows the mean movement forecast across three fitted models.'
        : (c.split === 'train' ? 'This training clip was included in the final motor fit. ' : '') +
          'The pink dashed path is the mean of three motor forecasts from earlier positions, spikes and recorded go cues. Coordinates are relative to the same physical frames as the observations.'
      : 'No fitted motor forecast is included for this example.';
    let residual = '';
    if (step >= 20 && step < 30 && pred && $('showPred').checked) {
      const err = (a, b, m) => Math.hypot(...pred.slice(a, b).map((v, j) => v - observed[a + j])) * m;
      residual =
        'Distance from the measured point in this sample: hand ' +
        err(0, 3, 1000).toFixed(2) +
        ' mm, elbow marker ' +
        err(3, 6, 1000).toFixed(2) +
        ' mm, handle ' +
        err(6, 8, 1).toFixed(3) +
        ' cm. ';
    }
    $('motorNote').textContent = residual + comment;
  }
  function raster() {
    const canvas = $('raster'),
      w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(devicePixelRatio || 1, 2);
    const bw = Math.round(w * scale),
      bh = Math.round(h * scale);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(bw / w, 0, 0, bh / h, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = '11px Arial, sans-serif';
    const left = 39,
      top = 21,
      dx = (w - left - 2) / 40,
      dy = (h - top - 3) / 23;
    rasterArea = { left, top, dx, dy };
    const colors = ['#eaf0e6', '#a3cab0', '#398a7c', '#155c5b'];
    c.counts.forEach((values, t) =>
      values.forEach((value, u) => {
        ctx.fillStyle = colors[Math.min(value, 3)];
        ctx.fillRect(
          left + t * dx + 0.3,
          top + u * dy + 0.3,
          Math.max(1, dx - 0.6),
          Math.max(1, dy - 0.6),
        );
      }),
    );
    c.unit_guide.forEach(([ch, s], i) => {
      if (i % 5 === 0 || i === 22 || i === unit) {
        if (i !== unit && Math.abs(i - unit) === 1) return;
        ctx.fillStyle = i === unit ? '#053c39' : '#496364';
        ctx.fillText(ch + '/' + s, 0, top + (i + 0.8) * dy);
      }
    });
    ctx.fillStyle = '#344f50';
    ctx.fillText('Earlier', left, 13);
    ctx.fillText(w < 410 ? 'Move' : 'Movement', left + 20 * dx + 2, 13);
    ctx.fillText('Later', left + 30 * dx + 2, 13);
    [20, 30].forEach((t) => {
      ctx.fillStyle = '#728c82';
      ctx.fillRect(left + t * dx - 1, top, 2, 23 * dy);
    });
    ctx.strokeStyle = '#193f43';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(left + 0.7, top + unit * dy + 0.6, 40 * dx - 1.4, dy - 1.2);
    ctx.strokeStyle = '#823956';
    ctx.strokeRect(left + step * dx + 0.5, top + 0.4, dx - 1, 23 * dy - 0.8);
  }
  function counts() {
    const [ch, s] = c.unit_guide[unit],
      measured = c.counts[step][unit];
    $('countTitle').textContent = 'Channel ' + ch + ' · sort ' + s;
    $('countNow').textContent =
      measured + (measured === 1 ? ' spike' : ' spikes') + ' in the selected bin';
    const tbody = $('counts').tBodies[0];
    tbody.replaceChildren();
    const total = [0, 0, 0];
    for (let i = 0; i < 10; i++) {
      const a = c.delayed[i][unit],
        b = c.predCount?.[i][unit],
        d = c.directCount?.[i][unit];
      total[0] += a;
      total[1] += b ?? 0;
      total[2] += d ?? 0;
      tbody.append(
        tableRow(
          [
            '+' + (100 + i * 10) + '–' + (110 + i * 10) + ' ms',
            a,
            b?.toFixed(3) ?? '—',
            d?.toFixed(3) ?? '—',
          ],
          step === i + 30 ? 'active' : '',
        ),
      );
    }
    tbody.append(
      tableRow([
        'Total · 100 ms',
        total[0],
        c.predCount ? total[1].toFixed(3) : '—',
        c.directCount ? total[2].toFixed(3) : '—',
      ]),
    );
    if (isJoint()) {
      $('countNote').textContent =
        'Observed minus expected over the later 100 ms: ' +
        (total[0] - total[1]).toFixed(3) +
        ' spikes for the joint rollout, ' +
        (total[0] - total[2]).toFixed(3) +
        ' for parallel heads. The recurrent model receives its own preceding movement estimate and hidden state at the next step. The parallel model makes each step from the same earlier context. Values average three model fits.' +
        (c.split === 'train'
          ? ' This selected training example comes from the initial block, which the joint models excluded from fitting.'
          : '');
      return;
    }
    $('countNote').textContent = c.predCount
      ? 'Observed minus expected over the later 100 ms: ' +
        (total[0] - total[1]).toFixed(3) +
        ' spikes with the movement forecast, ' +
        (total[0] - total[2]).toFixed(3) +
        ' from the past alone. Each model estimates an expected count for this unit and bin. The values shown are means of three fitted models. Both models start with the same earlier measurements; one also receives the motor model’s predicted movement.'
      : c.split === 'train'
        ? 'This first training reach was in the initial motor-training block. The later-count model needs movement forecasts made from earlier training blocks, so this reach has no fitted count estimate.'
        : 'No fitted count estimate is available for this reach.';
  }
  function draw() {
    if (!c?.eligible) return;
    const phase = step < 20 ? 0 : step < 30 ? 1 : 2,
      ms = (step - 20) * 10;
    $('phase').textContent = phases[phase];
    $('time').textContent = time(ms) + ' to ' + time(ms + 10) + ' ms';
    $('row').textContent =
      'MATLAB row ' + (c.k + step - 20).toLocaleString('en') + ' · bin ' + (step + 1) + '/40';
    let detail = descriptions[phase];
    if (step < 20) {
      const [n, elapsed, seen] = c.cue[step];
      detail +=
        ' At this bin’s start the controller had recorded ' +
        n +
        ' earlier go ' +
        (n === 1 ? 'cue' : 'cues') +
        (seen ? ', most recently ' + Math.round(1000 * elapsed) + ' ms earlier.' : '.');
    }
    $('phaseNote').textContent = detail;
    $('clock').setAttribute(
      'aria-valuetext',
      phases[phase] + ', ' + time(ms) + ' to ' + time(ms + 10) + ' milliseconds',
    );
    $('prev').disabled = step === 0;
    $('next').disabled = step === 39;
    document
      .querySelectorAll('.bands button')
      .forEach((b, i) => b.setAttribute('aria-current', String(i === phase)));
    window.drawReach(c, step, $('showPred').checked);
    positions();
    raster();
    counts();
  }
  function chooseClip() {
    stop();
    original = data.clips.find((d) => d.split === clipSelect.value);
    c = { ...original };
    $('identity').textContent =
      'Original ' +
      c.original +
      ' · block ' +
      c.block +
      ' · go ' +
      c.ordinal +
      ' · workspace ' +
      c.workspace +
      ' (' +
      (c.workspace === 1 ? 'near, contralateral' : 'far, ipsilateral') +
      ')';
    $('viewer').hidden = !c.eligible;
    $('unavailable').hidden = c.eligible;
    if (!c.eligible) {
      $('unavailable').textContent =
        'The preselected example failed the source quality check: ' +
        c.reasons.join(', ') +
        '. No replacement was selected.';
      return;
    }
    unitSelect.replaceChildren(
      ...c.unit_guide.map(([ch, s], i) => new Option('Channel ' + ch + ' · sort ' + s, i)),
    );
    unit = Math.min(unit, c.unit_guide.length - 1);
    unitSelect.value = unit;
    $('glMarker').href = 'models/' + c.split + '-markers.glb';
    $('glHandle').href = 'models/' + c.split + '-handle.glb';
    $('model').options[1].disabled = !original.jointMovement;
    if (!original.jointMovement) $('model').value = 'primary';
    setComparison();
  }
  function setComparison() {
    stop();
    c = { ...original };
    if (isJoint()) {
      c.predMovement = c.jointMovement;
      c.predCount = c.jointCount;
      c.directCount = c.parallelCount;
    }
    c.motorPositions = (c.predMovement || []).map((d) => add(c.pose[19], d));
    $('showPred').disabled = !c.motorPositions.length;
    $('modelCaption').textContent = isJoint()
      ? 'One encoder estimates both outcomes. Compare recurrent rollout with parallel count heads.'
      : 'Does a forecast of movement improve the estimate of later spikes?';
    $('fullHeader').textContent = isJoint() ? 'Joint rollout' : 'Past + forecast motion';
    $('otherHeader').textContent = isJoint() ? 'Parallel heads' : 'Past alone';
    setStep(step);
  }
  $('model').addEventListener('change', setComparison);
  clipSelect.addEventListener('change', chooseClip);
  $('clock').addEventListener('input', (e) => {
    stop();
    setStep(+e.target.value);
  });
  for (const b of document.querySelectorAll('.bands button'))
    b.addEventListener('click', () => {
      stop();
      setStep(+b.dataset.step);
    });
  $('next').addEventListener('click', () => {
    stop();
    setStep(step + 1);
  });
  $('prev').addEventListener('click', () => {
    stop();
    setStep(step - 1);
  });
  $('play').addEventListener('click', () => {
    if (timer) {
      stop();
      return;
    }
    if (step === 39) setStep(0);
    $('play').textContent = 'Pause';
    timer = setInterval(() => {
      setStep(step + 1);
      if (step === 39) stop();
    }, 150);
  });
  $('showPred').addEventListener('change', draw);
  unitSelect.addEventListener('change', () => {
    unit = +unitSelect.value;
    draw();
  });
  $('raster').addEventListener('click', (e) => {
    if (!rasterArea) return;
    const { left, top, dx, dy } = rasterArea,
      rect = e.target.getBoundingClientRect();
    const index = Math.floor((e.clientY - rect.top - top) / dy),
      t = Math.floor((e.clientX - rect.left - left) / dx);
    if (index < 0 || index > 22 || t < 0 || t > 39) return;
    stop();
    unit = index;
    unitSelect.value = unit;
    setStep(t);
  });
  $('raster').addEventListener('keydown', (e) => {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!delta) return;
    e.preventDefault();
    stop();
    unit = Math.max(0, Math.min(22, unit + delta[1]));
    unitSelect.value = unit;
    setStep(step + delta[0]);
  });
  new ResizeObserver(() => {
    if (c?.eligible) raster();
  }).observe($('raster'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  if (location.protocol === 'file:') {
    $('offline').textContent = 'Offline instructions';
    $('offline').href = 'READ-ME.txt';
  }
  if (data.clips.length) {
    const held = data.clips.find((d) => d.split === 'transfer' && d.eligible);
    if (held) clipSelect.value = held.split;
    chooseClip();
  }
})();
