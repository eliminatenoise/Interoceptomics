/* All values come from the selected recorded window. The clock controls when they appear. */
(() => {
  const $ = id => document.getElementById(id);
  const study = window.REACH_WEEK;
  const sites = [['Hand · m', 0, 3, 4], ['Proximal ulna · m', 3, 3, 4], ['Handle · cm', 6, 2, 3]];
  const phases = ['Earlier history', 'Observe the reach', 'Count later spikes'];
  const notes = [
    'The base model will see 20 bins of earlier positions and cortical counts. The go word occurs at −50 ms.',
    'The earlier count forecast is fixed. The optical markers and handle show where the arm actually went. The update uses the last position sample, at +90 ms.',
    'The update is fixed before this first later bin. The path ends at +90 ms as the independent count interval advances. The plotted spikes are measurements.'
  ];
  const groups = {primary: 'All exported sorts', zero: 'Sort 0 alone', positive: 'Positive sorts'};
  const add = (a,b) => a.map((v,i) => v+b[i]);
  const signed = n => n > 0 ? '+'+n : String(n).replace('-', '−');
  const total = values => values.reduce((a,b) => a+b,0);
  const timeLabel = t => signed((t-20)*10);
  let clip, step = 29, timer, counts = [], columns = [], plotArea;

  function row(body, cells) {
    const tr = document.createElement('tr');
    cells.forEach((value,i) => {
      const cell = document.createElement(i ? 'td' : 'th');
      if (!i) cell.scope = 'row';
      cell.textContent = value;
      tr.append(cell);
    });
    $(body).append(tr);
  }

  const currentGuide = () => study.blocks[clip.guide].guide;
  const channel = () => Number($('channel').value);
  function selectChannel() {
    columns = currentGuide().flatMap(([ch,sort],col) => ch === channel() ? [{sort,col}] : []);
    counts = clip.counts.map(bin => columns.length ? total(columns.map(({col}) => bin[col])) : null);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    $('play').textContent = 'Play slowly';
  }
  function changeClip() {
    stop();
    clip = study.clips.find(c => c.slug === $('clip').value);
    $('identity').textContent = 'Block '+clip.block+' · original '+clip.original+' · go '+clip.ordinal+' · cutoff row '+clip.k;
    $('missing').hidden = !clip.reason;
    $('viewer').hidden = Boolean(clip.reason);
    if (clip.reason) {
      $('missing').textContent = clip.reason;
      return;
    }
    clip.positions = [...clip.pose, ...clip.movement.map(d => add(clip.pose[19],d))];
    for (const opt of $('motion').options) {
      opt.disabled = ['motor','motorPose'].includes(opt.value) && !clip[opt.value];
    }
    if ($('motion').selectedOptions[0]?.disabled) $('motion').value = 'velocity';
    $('markers').href = 'models/'+clip.slug+'-markers.glb';
    $('encoder').href = 'models/'+clip.slug+'-handle.glb';
    selectChannel();
    render();
  }
  function changeStep(n) {
    step = Math.min(39, Math.max(0,n));
    $('clock').value = String(step);
    render();
  }
  function positions() {
    const mode = $('motion').value, last = clip.pose[19];
    const delta = last.map((v,i) => (v - clip.pose[15][i]) / 4);
    if (mode === 'none') clip.motorPositions = [];
    else if (mode === 'stationary') clip.motorPositions = Array(10).fill(last);
    else if (mode === 'velocity') clip.motorPositions = Array.from({length:10},(_,i)=>add(last,delta.map(v=>v*(i+1))));
    else clip.motorPositions = clip[mode].map(d => add(last,d));
    const captions = {
      none: 'Only the measured positions are shown.',
      stationary: 'The dashed path holds each coordinate at its last sample, −10 ms.',
      velocity: 'The dashed path continues the velocity between −50 and −10 ms. The count update compares this expected endpoint with the measured endpoint.',
      motor: 'The dashed forecast adds a correction from the preceding pose, go cues and contact counts to a frozen pose-and-cue Transformer. It uses only the earlier history.',
      motorPose: 'The dashed forecast uses the same frozen Transformer with a correction from pose and go cues alone. The movement models predict ten displacements from −10 ms.'
    };
    $('motionNote').textContent = captions[mode] + (step>=30 ? ' Positions below are the last measured sample, at +90 ms.' : '');
    $('positions').replaceChildren();
    const obs = clip.positions[Math.min(step,29)];
    const pred = step>=20 && step<30 ? clip.motorPositions[step-20] : null;
    for (const [name,n,length,decimals] of sites) {
      for (const [label,p] of [[name,obs],[name+' · forecast',pred]]) {
        if (p) row('positions',[label,...p.slice(n,n+length).map(v=>v.toFixed(decimals)),...(length===2?['—']:[])]);
      }
    }
    window.drawReach(clip, step, mode !== 'none');
  }

  function trace() {
    const canvas = $('trace'), width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1,2);
    const w = Math.round(width*ratio), h = Math.round(height*ratio);
    if (canvas.width !== w || canvas.height !== h) {canvas.width = w; canvas.height = h;}
    const ctx = canvas.getContext('2d');
    ctx.setTransform(w/width,0,0,h/height,0,0);
    ctx.clearRect(0,0,width,height);
    const left = 28, top = 17, bottom = height-23, dx = (width-left-8)/40;
    plotArea = {left,dx};
    const ceiling = Math.max(1, ...counts.slice(0,step+1).filter(Number.isFinite));
    ctx.font = '11px Arial, sans-serif';
    for (const [from,to,color] of [[0,20,'#e9ede4'],[20,30,'#d7eade'],[30,40,'#e2e2f3']]) {
      ctx.fillStyle = color; ctx.fillRect(left+from*dx,top,(to-from)*dx,bottom-top);
    }
    counts.slice(0,step+1).forEach((n,i)=>{
      if (n===null) return;
      const height = n/ceiling*(bottom-top-6);
      ctx.fillStyle = i<30 ? '#25695a' : '#5a4d8b';
      ctx.fillRect(left+i*dx+1,bottom-height,Math.max(1,dx-2),height);
    });
    ctx.strokeStyle = '#364e53'; ctx.strokeRect(left+step*dx, top, dx, bottom-top);
    ctx.fillStyle = '#3d5554'; ctx.fillText('0',8,bottom); ctx.fillText(String(ceiling),6,top+8);
    for (const [index,label] of [[0,'−200'],[20,'0'],[30,'+100']])
      ctx.fillText(label,left+index*dx,height-5);
    ctx.textAlign='right'; ctx.fillText('ms',width-8,height-5);ctx.textAlign='left';
  }
  function cortical() {
    const ch = channel();
    const has = (guide,sort) => guide.some(([contact,s])=>contact===ch && s===sort);
    const sorts = [...new Set(study.blocks.flatMap(b=>b.guide.filter(([id])=>id===ch).map(([,s])=>s)))].sort((a,b)=>a-b);
    $('sorts').replaceChildren();
    sorts.forEach(s=>{
      const source = columns.find(c=>c.sort===s);
      row('sorts',[s===0?'0 · unsorted':String(s),...study.blocks.map(b=>has(b.guide,s)?'Present':'Absent'),
        source ? String(clip.counts[step][source.col]) : '—']);
    });
    $('coverage').textContent = 'Contact '+ch+' · '+(columns.length?
      columns.length+' exported sort '+(columns.length===1?'label':'labels')+' in this recording. Each bar sums their recorded spikes in one 10 ms bin.':
      'No exported sort labels in this recording. The blank interval has no measured counts.');
    const number = counts[step];
    $('selectedCount').textContent = timeLabel(step)+' to '+timeLabel(step+1)+' ms · '+
      (number===null ? 'Count unavailable.' : number+' recorded '+(number===1?'spike.':'spikes.'));
    trace();
    $('predictions').replaceChildren();
    for (const [pop,label] of Object.entries(groups)) {
      const local = columns.filter(c=>pop==='primary'||(pop==='zero'?c.sort===0:c.sort>0));
      const actual = local.length ? total(clip.counts.slice(30).flatMap(bin=>local.map(c=>bin[c.col]))) : null;
      const forecast = clip.forecasts?.[pop]?.[ch];
      const expected = (i,ready) => !forecast || forecast[i]===null ? '—' : ready ? forecast[i].toFixed(3) : 'Upcoming';
      row('predictions',[label,actual===null?'—':step===39?actual:'Upcoming',expected(0,step>=20),expected(1,step>=30)]);
    }
    const recent = clip.recentSpikes[ch];
    $('recent').textContent = !recent ? 'This contact lacks shared positive-sort coverage.' : step<30 ?
      'The two expected counts appear at +100 ms, after the ten most recent spike bins have elapsed.' :
      'Expected spikes over the later 100 ms: '+recent[0].toFixed(3)+' with recent spikes and earlier positions, '+recent[1].toFixed(3)+' with recent spikes and updated positions.';
    $('predictionNote').textContent = 'Recorded totals appear at +200 ms. Expected counts can be fractional. A dash marks missing coverage or an unavailable forecast. '+
      'The study compared all exported sorts on 37 contacts present with sort 0 throughout, and positive sorts on 17 shared contacts. '+
      (clip.day==='train'?'This example belongs to the training set.':'This first original has no earlier matching original for the wrong-movement control.');
  }
  function render() {
    if (!clip || clip.reason) return;
    const phase = step<20 ? 0 : step<30 ? 1 : 2;
    $('phase').textContent = phases[phase];
    $('time').textContent = timeLabel(step)+' to '+timeLabel(step+1)+' ms';
    $('row').textContent = 'Native row '+(clip.k+step-20)+' · bin '+(step+1)+' of 40';
    $('phaseNote').textContent = notes[phase];
    document.querySelectorAll('[data-step]').forEach((button,i)=>button.setAttribute('aria-current',i===phase?'step':'false'));
    $('prev').disabled=step===0; $('next').disabled=step===39;
    positions(); cortical();
  }
  for (const c of study.clips) $('clip').add(new Option((c.day==='train'?'7 Sep · training':'14 Sep · held')+' · B'+c.block+' · '+(c.workspace===1?'near':'far'),c.slug));
  const contacts = [...new Set(study.blocks.flatMap(b=>b.guide.map(([ch])=>ch)))].sort((a,b)=>a-b);
  for (const id of contacts) $('channel').add(new Option('Contact '+id,String(id)));
  $('channel').value='4';
  $('clip').value=(study.clips.find(c=>c.day==='held')||study.clips[0]).slug;
  $('clip').addEventListener('change',changeClip);
  $('motion').addEventListener('change',render);
  $('channel').addEventListener('change',()=>{selectChannel();cortical();});
  $('clock').addEventListener('input',e=>changeStep(Number(e.target.value)));
  $('prev').onclick=()=>changeStep(step-1);
  $('next').onclick=()=>changeStep(step+1);
  document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>changeStep(Number(b.dataset.step)));
  $('play').onclick=()=>{
    if (timer) {stop();return;}
    if (step===39) changeStep(0);
    $('play').textContent='Pause';
    timer=setInterval(()=>{changeStep(step+1);if(step===39)stop();},150);
  };
  $('trace').addEventListener('click',e=>{if(plotArea)changeStep(Math.floor((e.clientX-e.target.getBoundingClientRect().left-plotArea.left)/plotArea.dx));});
  new ResizeObserver(()=>{if(clip&&!clip.reason)trace();}).observe($('trace'));
  if (study.cohort) {
    $('outcome').hidden=false; $('cohort').textContent=study.cohort;
    const motor=study.motorPass ? 'The motor comparison passed its prespecified test.' : 'Adding earlier contact counts to the movement model failed its joint hand-and-elbow test across both workspaces.';
    const pos=study.positivePass ? 'With recent spikes available, the extra position information passed the separate positive-sort test.' : 'When a separate count model already had the recent spikes, adding movement also fell short of its cross-workspace test.';
    $('otherOutcomes').textContent=motor+' '+pos;
  }
  changeClip();
})();
