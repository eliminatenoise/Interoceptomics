'use strict';
(() => {
  const get = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  function element(name, attrs, text) {
    const e = document.createElementNS(NS, name);
    for (const [key,value] of Object.entries(attrs)) e.setAttribute(key, value);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  if (location.protocol === 'file:') get('project').href = 'https://eliminatenoise.github.io/Interoceptomics/';
  const records = MEASUREMENTS.map(source => ({
    ...source, length:decodeBytes(source.length,Float64Array), angle:decodeBytes(source.angle,Float64Array)
  }));
  const colours = {length:'#a43b23', angle:'#215e65'};
  const units = {length:'mm', angle:'°'};
  const limits = {};
  for (const key of ['length','angle']) {
    const values = records.flatMap(r => Array.from(r[key]));
    limits[key] = [Math.floor(Math.min(...values)), Math.ceil(Math.max(...values))];
  }
  const graphs = {};
  const people = [...new Set(records.map(r => r.person))];
  for (const who of people) get('person').add(new Option(who, who));
  const totalRows = records.reduce((sum, r) => sum + r.n, 0);
  get('coverage').textContent = 'Two trials from each of four volunteers give '+
    totalRows.toLocaleString('en-US')+' original tracking rows.';
  function setTrials() {
    const selected = get('trial').value;
    const available = records.filter(r => r.person === get('person').value);
    get('trial').replaceChildren(...available.map(r => new Option('Trial ' + r.trial, String(r.trial))));
    if (available.some(r => String(r.trial) === selected)) get('trial').value = selected;
  }
  let record, index = 0, animation = 0;
  const rounded = n => n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  function buildGraph(key) {
    const svg = get(key + '-chart');
    const width = Math.max(200,Math.round(svg.getBoundingClientRect().width)), height = 92;
    const left = 31, right = width - 11, top = 9, bottom = 68;
    const [lo,hi] = get('common').checked ? limits[key] :
      [Math.floor(Math.min(...record[key])),Math.ceil(Math.max(...record[key]))];
    const x = i => left + i / (record.n - 1) * (right - left);
    const y = n => bottom - (n - lo) / (hi - lo || 1) * (bottom - top);
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    for (const value of [hi,lo]) {
      svg.append(element('line',{x1:left,x2:right,y1:y(value),y2:y(value),stroke:'#c9d3cc'}));
      svg.append(element('text',{x:left-5,y:y(value)+4,'text-anchor':'end'},value));
    }
    let path = '';
    const breaks = new Set(record.breaks);
    record[key].forEach((value,i) => {
      path += (i === 0 || breaks.has(i + 1) ? 'M':'L') + x(i).toFixed(2) + ' ' + y(value).toFixed(2);
    });
    svg.append(element('path',{d:path,fill:'none',stroke:colours[key],'stroke-width':1.6,'stroke-linejoin':'round'}));
    svg.append(element('text',{x:left,y:87},'1'));
    svg.append(element('text',{x:(left+right)/2, y:87,'text-anchor':'middle'},'Tracking step'));
    svg.append(element('text',{x:right,y:87,'text-anchor':'end'},record.n));
    const cursor = element('line',{y1:top,y2:bottom,stroke:'#56645e','stroke-dasharray':'3 3'});
    const dot = element('circle',{r:3.7,fill:colours[key],stroke:'white','stroke-width':1});
    svg.append(cursor,dot);
    graphs[key] = {
      select(i) {
        cursor.setAttribute('x1',x(i)); cursor.setAttribute('x2',x(i));
        dot.setAttribute('cx',x(i)); dot.setAttribute('cy',y(record[key][i]));
      },
      pick(clientX) {
        const localX = clientX - svg.getBoundingClientRect().left;
        return Math.round((localX-left)/(right-left)*(record.n-1));
      }
    };
  }
  function updateGeometry() {
    const length = record.length[index], angle = record.angle[index], radians = angle * Math.PI / 180;
    const pxPerMM = Math.min(350/limits.length[1], 63 / Math.max(1,...records.map(r =>
      r.maxVertical)));
    const dx = pxPerMM * length * Math.cos(radians), dy = pxPerMM * length * Math.sin(radians);
    const x = 36 + dx, y = 93 - dy;
    get('segment').setAttribute('d','M36 93 L' + x + ' ' + y);
    get('end-dot').setAttribute('cx',x); get('end-dot').setAttribute('cy',y);
    get('angle-arc').setAttribute('d','M72 93 A36 36 0 0 '+(angle >= 0 ? 0:1)+' '+
      (36+36*Math.cos(radians))+' '+(93-36*Math.sin(radians)));
    get('length-text').setAttribute('x',36 + dx*.56);
    get('length-text').setAttribute('y',Math.min(93,y)-9);
    get('length-text').textContent = rounded(length)+' mm · '+rounded(angle)+'°';
    get('ruler').setAttribute('d','M32 131 v5 h'+(10*pxPerMM)+' v-5');
    get('geometry').setAttribute('aria-label','Straight fascicle diagram at tracking step '+(index+1)+
      ', length '+rounded(length)+' millimetres, pennation '+rounded(angle)+' degrees.');
  }
  for (const r of records) r.maxVertical = Math.max(...r.angle.map((a,i) =>
    Math.abs(Math.sin(a * Math.PI / 180) * r.length[i])));
  function setStep(i) {
    index = Math.max(0, Math.min(record.n-1, i));
    get('step').value = index+1;
    get('step-readout').textContent = (index+1)+' of '+record.n;
    get('step').setAttribute('aria-valuetext','Step '+(index+1)+' of '+record.n);
    for (const key of ['length','angle']) {
      get(key).textContent = rounded(record[key][index]) + (key === 'length' ? ' ' : '') + units[key];
      graphs[key].select(index);
    }
    get('prev').disabled = index === 0;
    get('next').disabled = index === record.n-1;
    updateGeometry();
    const future = index+10;
    let summary;
    if (future >= record.n) summary = 'Fewer than ten tracked steps remain in this trial.';
    else if (record.breaks.some(row => row > index+1 && row <= future+1)) summary = 'A tracking gap interrupts the ten-step comparison.';
    else {
      const change = record.length[future]-record.length[index];
      summary = 'At step '+(future+1)+', the measured length is '+rounded(record.length[future])+
        ' mm ('+(change>0?'+':'')+change.toFixed(3)+' mm over ten steps).';
    }
    get('difference').textContent = summary;
  }
  function stop() {
    cancelAnimationFrame(animation);
    animation=0;
    get('play').textContent='Play steps'; get('play').setAttribute('aria-pressed','false');
  }
  function redraw() {
    buildGraph('length'); buildGraph('angle'); setStep(index);
  }
  function loadTrial() {
    stop();
    record = records.find(r => r.person === get('person').value && r.trial === Number(get('trial').value));
    index = 0;
    const note = record.person === 'A03' ?
      (record.trial === 1 ? ' Two fascicles were tracked. The reader follows the first.' : ' This trial provides one native tracking table.')+
      ' The orientation of the central sheet is unavailable as a separate trace.' : '';
    get('trial-note').textContent = record.n.toLocaleString('en-US')+' native rows in this recording.'+note;
    get('step').max=record.n;
    redraw();
  }
  get('person').addEventListener('change',() => {setTrials();loadTrial();});
  get('trial').addEventListener('change',loadTrial);
  get('common').addEventListener('change',redraw);
  get('step').addEventListener('input',e => {stop();setStep(Number(e.target.value)-1);});
  get('prev').addEventListener('click',() => {stop();setStep(index-1);});
  get('next').addEventListener('click',() => {stop();setStep(index+1);});
  for (const key of ['length','angle']) get(key+'-chart').addEventListener('click',e => {
    stop();setStep(graphs[key].pick(e.clientX));
  });
  get('play').addEventListener('click',() => {
    if (animation) {stop();return;}
    if (index === record.n-1) setStep(0);
    const start = performance.now(), initial = index;
    get('play').textContent='Pause'; get('play').setAttribute('aria-pressed','true');
    function tick(now) {
      const step = Math.min(record.n-1,initial+Math.floor((now-start)*.024));
      if (step !== index) setStep(step);
      if (index === record.n-1) stop();
      else animation = requestAnimationFrame(tick);
    }
    animation = requestAnimationFrame(tick);
  });
  document.addEventListener('visibilitychange',() => {if (document.hidden) stop();});
  get('csv').addEventListener('click',() => {
    const rows = ['tracking_step,fascicle_length_mm,pennation_angle_deg,segment'];
    let segment = 1;
    record.length.forEach((v,i) => {
      if (record.breaks.includes(i+1)) segment++;
      rows.push([i+1, v, record.angle[i], segment].join(','));
    });
    const url=URL.createObjectURL(new Blob([rows.join('\n')+'\n'],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download=record.person+'-trial-'+record.trial+'-tracking.csv';
    link.click(); setTimeout(() => URL.revokeObjectURL(url),1500);
  });
  setTrials();
  loadTrial();
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width !== lastWidth) {lastWidth=entry.contentRect.width;redraw();}
  }).observe(get('length-chart'));
})();
