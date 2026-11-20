'use strict';
(() => {
  const id = name => document.getElementById(name);
  const sampleRate = 1000, history = 200, horizon = 100;
  const charts = ['emg', 'load'];
  const colors = {emg:'#ae4228', load:'#246b6e'};
  const decode = text => unpack(text, Float64Array);
  const records = PEDAL_RECORDS.map(r => ({
    ...r, time:decode(PEDAL_CLOCKS[r.time]), emg:decode(r.emg), load:decode(r.load)
  }));
  function bounds(array) {
    let lo=Infinity, hi=-Infinity;
    for (const value of array) {lo=Math.min(lo,value); hi=Math.max(hi,value);}
    return [lo,hi];
  }
  const fullScale = Object.fromEntries(charts.map(name=>{
    const list=records.map(r=>bounds(r[name]));
    return [name,[Math.min(...list.map(a=>a[0])),Math.max(...list.map(a=>a[1]))]];
  }));
  let current, playStart, startSample, request=0;
  const cutoff = id('cutoff');
  const f4 = v => v.toFixed(4).replace('-0.0000','0.0000');
  const signed = v => (v>0?'+':'')+f4(v);
  function draw(name,k) {
    const svg=id(name+'-chart'), r=current[name];
    const width=Math.max(235,Math.round(svg.clientWidth)), height=93;
    const left=48,right=width-12,upper=10,lower=68;
    const end=name==='load' && id('reveal').checked ? k+horizon : k;
    const [lo,hi]=id('local-scale').checked ? bounds(r.subarray(k-history,end+1)) : fullScale[name];
    const pad=Math.max((hi-lo)*.08,.001), min=lo-pad, max=hi+pad;
    const x=i=>left+(right-left)*(i-(k-history))/(history+horizon);
    const y=v=>lower-(lower-upper)*(v-min)/(max-min);
    const path=[];
    for(let i=k-history;i<=end;i++) path.push((i===k-history?'M':'L')+x(i).toFixed(2)+' '+y(r[i]).toFixed(2));
    const edge=x(k);
    const marks=[
      '<rect x="'+edge+'" y="'+upper+'" width="'+(right-edge)+'" height="'+(lower-upper)+'" fill="#e5ede7"/>',
      ...[upper,lower].map(t=>'<path d="M'+left+' '+t+' H'+right+'" stroke="#c7d3ca" fill="none"/>'),
      '<path d="M'+edge+' '+(upper-2)+' V'+(lower+3)+'" stroke="#71827b" stroke-dasharray="3 3"/>',
      '<path d="'+path.join(' ')+'" fill="none" stroke="'+colors[name]+'" stroke-width="1.35" stroke-linejoin="round"/>',
      '<circle cx="'+edge+'" cy="'+y(r[k])+'" r="2.7" fill="'+colors[name]+'"/>',
      '<g fill="#465e56" font-size="11.5">',
      '<text x="'+(left-5)+'" y="'+(upper+4)+'" text-anchor="end">'+max.toFixed(2)+'</text>',
      '<text x="'+(left-5)+'" y="'+(lower+1)+'" text-anchor="end">'+min.toFixed(2)+'</text>',
      '<text x="'+left+'" y="87">−200 ms</text><text x="'+edge+'" y="87" text-anchor="middle">t</text>',
      '<text x="'+right+'" y="87" text-anchor="end">+100 ms</text></g>'
    ];
    if(end>k) marks.push('<circle cx="'+x(end)+'" cy="'+y(r[end])+'" r="2.7" fill="'+colors[name]+'"/>');
    svg.setAttribute('viewBox','0 0 '+width+' '+height);
    svg.innerHTML=marks.join('');
  }
  function render() {
    const k=Number(cutoff.value), next=k+horizon, shown=id('reveal').checked;
    const t=current.time[k], later=current.time[next];
    id('time').textContent=t.toFixed(3)+' s · row '+(k+1);
    cutoff.setAttribute('aria-valuetext',t.toFixed(3)+' seconds, row '+(k+1));
    id('emg-value').textContent=f4(current.emg[k])+' units';
    id('load-value').textContent=f4(current.load[k])+' units';
    id('change-detail').textContent=shown ? f4(current.load[next])+' at '+later.toFixed(3)+' s minus '+f4(current.load[k])+' at '+t.toFixed(3)+' s (native units)' : 'Reveal the next 100 samples to compare the two load readings.';
    id('change').textContent=shown ? signed(current.load[next]-current.load[k]) : 'Hidden';
    id('back').disabled=k<=Number(cutoff.min);
    id('forward').disabled=k>=Number(cutoff.max);
    charts.forEach(name=>draw(name,k));
  }
  function stop() {
    cancelAnimationFrame(request);request=0;
    id('play').textContent='Play';id('play').setAttribute('aria-pressed','false');
  }
  function select() {
    stop();
    current=records.find(r=>r.person===id('person').value && r.setting===id('setting').value && r.trial===Number(id('trial').value));
    cutoff.max=String(current.emg.length-1-horizon);
    id('clock-note').textContent=current.clock==='stored_regular_vector' ?
      'This trial includes the exported time vector. The two traces share its rows and agree with the nominal 1 kHz grid.' :
      'This trial has no time vector. The two channels share row order. Elapsed time uses the study’s reported 1 kHz clock, with no independent timing record for these rows.';
    id('original').href=current.url;
    render();
  }
  function step(amount) {
    stop(); cutoff.value=String(Number(cutoff.value)+amount);render();
  }
  function frame(now) {
    const k=Math.min(Number(cutoff.max),startSample+Math.floor((now-playStart)*sampleRate/1000));
    if(Number(cutoff.value)!==k) {cutoff.value=String(k);render();}
    if(k>=Number(cutoff.max)) stop(); else request=requestAnimationFrame(frame);
  }
  function saveRecording() {
    const rows=['participant,setting,trial,source_row_one_based,time_basis,time_s,emg_1_native,loadcell_right_native'];
    for(let i=0;i<current.time.length;i++) {
      rows.push([current.person,current.setting,current.trial,i+1,current.clock,current.time[i],current.emg[i],current.load[i]].join(','));
    }
    const file=new Blob([rows.join('\n')+'\n'],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(file), a=document.createElement('a');
    a.href=url;a.download=[current.person,current.setting,'trial'+current.trial].join('-')+'.csv';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function lever() {
    const force=Number(id('force').value);
    id('force-value').textContent=force+' N';
    id('moment').textContent=force+' N × 0.100 m = '+(force*.1).toFixed(1)+' N·m';
    id('force-line').setAttribute('y1',String(60-force*.52));
    id('force-head').style.visibility=force?'visible':'hidden';
    id('force-line').style.visibility=force?'visible':'hidden';
  }
  ['person','setting','trial'].forEach(name=>id(name).addEventListener('change',select));
  ['reveal','local-scale'].forEach(name=>id(name).addEventListener('change',render));
  cutoff.addEventListener('input',()=>{stop();render();});
  id('back').addEventListener('click',()=>step(-horizon));id('forward').addEventListener('click',()=>step(horizon));
  id('play').addEventListener('click',()=>{
    if(request) {stop();return;}
    if(cutoff.value===cutoff.max) cutoff.value=cutoff.min;
    startSample=Number(cutoff.value);playStart=performance.now();
    id('play').textContent='Pause';id('play').setAttribute('aria-pressed','true');
    request=requestAnimationFrame(frame);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  id('csv').addEventListener('click',saveRecording);
  id('force').addEventListener('input',lever);
  if(location.protocol==='file:') {
    id('project').textContent='Interoceptomics · offline atlas';
    id('project').href='README.txt';
    id('zip').hidden=true;
  }
  select();lever();
  new ResizeObserver(render).observe(id('load-chart'));
})();
