(() => {
  const d=JSON.parse(document.getElementById('reference').textContent),$=id=>document.getElementById(id);
  const markers=new Map(d.markers.map(m=>[m.id,m])),emg=new Map(d.emg.map(m=>[m.id,m])),forces=new Map(d.forces.map(f=>[f.id,f]));
  function populate(sel,rows){for(const r of rows)$(sel).add(new Option(r.label,r.id));}
  const movement=JSON.parse($('marker-travel-data').textContent);
  const pairs=new Map(movement.markers.map(m=>[m.id,m]));
  const highlighted=new Map();
  for(const [site,label] of [['RSP','wrist (thumb side)'],['FLE','knee (outside)'],['FAL','ankle (outside)']]){
    for(const [side,name] of [['L','Left'],['R','Right']])highlighted.set(side+'_'+site,name+' '+label);
  }
  for(const [groupName,items] of [
    ['Wrists, knees and ankles',Array.from(highlighted,([id,label])=>({id,label}))],
    ['Other measured landmarks',d.markers.filter(m=>!highlighted.has(m.id))]
  ]){
    const group=document.createElement('optgroup');
    group.label=groupName;
    for(const item of items)group.append(new Option(item.label,item.id));
    $('marker').append(group);
  }
  populate('emg',d.emg);populate('force',d.forces);
  $('marker').value=markers.has('R_FCC')?'R_FCC':d.markers[0].id;$('emg').value=emg.has('R_soleus')?'R_soleus':d.emg[0].id;
  $('count').textContent=d.summary.eligible_strides+' strides · '+d.summary.eligible_people+' walkers';
  $('cohort-scope').textContent='Of '+d.summary.planned_strides+' prespecified walks, '+d.summary.eligible_strides+' supplied a matched right stride from '+d.summary.eligible_people+' people. Mean stride duration was '+d.summary.stride_duration_s.mean.toFixed(2)+' s. The right foot left the ground at '+d.summary.right_foot_off_pct.mean.toFixed(1)+'% of the stride on average. Each displayed value has its own count of contributing people.';
  let t=0,playing=false,t0=0,at0=0,tick=0;
  const body=makeStrideBody($('body'),d,id=>{$('marker').value=id;render();});
  function value(v, unit, count) {
    if (Number.isFinite(v)) return v.toFixed(unit === 'N' ? 1 : 2) + ' ' + unit;
    return count > 0 ? 'Below three-walker minimum' : 'No observation';
  }
  function plot(id,signal,colour){
    const c=$(id),w=Math.max(1,c.clientWidth),h=Math.max(1,c.clientHeight),dpi=Math.min(2,devicePixelRatio||1);
    if(c.width!==Math.round(w*dpi)||c.height!==Math.round(h*dpi)){c.width=Math.round(w*dpi);c.height=Math.round(h*dpi);}
    const g=c.getContext('2d');g.setTransform(dpi,0,0,dpi,0,0);g.clearRect(0,0,w,h);
    const x0=39,x1=w-9,y0=8,y1=h-23,spread=$('spread').checked;
    const raw=signal.mean.flatMap((v,i)=>Number.isFinite(v)?[v, v-(spread&&Number.isFinite(signal.sd[i])?signal.sd[i]:0), v+(spread&&Number.isFinite(signal.sd[i])?signal.sd[i]:0)]:[]);
    const low=Math.min(0,...raw),high=Math.max(1,...raw),p=i=>x0+(x1-x0)*i/100,py=v=>y1-(v-low)/(high-low)*(y1-y0);
    g.font='11px system-ui,sans-serif';g.fillStyle='#536868';g.strokeStyle='#d5dcd7';g.lineWidth=1;
    for(const v of [low,(high+low)/2,high]){const y=py(v);g.beginPath();g.moveTo(x0,y);g.lineTo(x1,y);g.stroke();g.fillText(Math.abs(v)>=10?v.toFixed(0):v.toFixed(1),2,y+4);}
    // Draw each supported interval separately; blank sections do not imply zero.
    let seg=[];
    function finish(){
      if(!seg.length)return;
      if(spread){g.fillStyle=colour+'28';g.beginPath();for(let k=0;k<seg.length;k++){const i=seg[k],y=py(signal.mean[i]+(signal.sd[i]??0));if(k)g.lineTo(p(i),y);else g.moveTo(p(i),y);}
        for(const i of seg.slice().reverse())g.lineTo(p(i),py(signal.mean[i]-(signal.sd[i]??0)));g.closePath();g.fill();}
      g.beginPath();g.strokeStyle=colour;g.lineWidth=2;for(const [j,i] of seg.entries()){if(j)g.lineTo(p(i),py(signal.mean[i]));else g.moveTo(p(i),py(signal.mean[i]));}g.stroke();seg=[];
    }
    for(let i=0;i<=100;i++){if(Number.isFinite(signal.mean[i]))seg.push(i);else finish();}finish();
    g.strokeStyle='#6c7874';g.lineWidth=1;g.setLineDash([3,3]);g.beginPath();g.moveTo(p(t),y0);g.lineTo(p(t),y1);g.stroke();g.setLineDash([]);
    if(Number.isFinite(signal.mean[t])){g.fillStyle=colour;g.beginPath();g.arc(p(t),py(signal.mean[t]),4,0,2*Math.PI);g.fill();}
    g.fillStyle='#536868';g.textAlign='left';g.fillText('0%',x0,y1+17);g.textAlign='center';g.fillText('50%',p(50),y1+17);g.textAlign='right';g.fillText('100%',x1,y1+17);g.textAlign='left';
    c.setAttribute('aria-label',signal.label+', at '+t+' percent of stride: '+value(signal.mean[t],signal.unit,signal.n[t])+' from '+signal.n[t]+' people.');
  }
  function render(){
    const marker=markers.get($('marker').value),m=emg.get($('emg').value),f=forces.get($('force').value);
    $('clock-label').textContent=t+'%';$('phase').value=String(t);$('phase').setAttribute('aria-valuetext',t+' percent of a right stride');
    const area=m.id.includes('gluteus')?'hip': /vastus|rectus|semitendinosus/.test(m.id)?'thigh':'shank';
    const tint=$('guides').checked&&$('tint').checked&&Number.isFinite(m.mean[t]);
    const signal=tint?{area,strength:Math.min(1,m.mean[t]/Math.max(1,...m.mean.filter(Number.isFinite)))}:null;
    $('tint').disabled=!$('guides').checked;
    $('tint-key').textContent=tint?'Gold on the right '+area+' follows this muscle’s mean electrical amplitude relative to its own peak. It locates the muscle approximately.':'';
    const pair=pairs.get(marker.id),start=pair.start_mm[t],delta=pair.delta_mm[t];
    const walkers=pair.n_walkers[t],strides=pair.n_strides[t];
    const arrow=start&&$('travel-arrow').checked?{start,delta}:null;
    body.update(t,marker.id,$('guides').checked,$('follow').checked,$('trail').checked,signal,arrow);
    $('travel-marker').textContent=(highlighted.get(marker.id)||marker.label)+' · '+t+'% of stride';
    $('travel-support').textContent=walkers+' '+(walkers===1?'walker':'walkers')+' · '+strides+' '+(strides===1?'stride':'strides');
    if(delta){
      const signed=v=>(v>0?'+':'')+v.toFixed(1).replace('-','−');
      $('travel-vector').textContent=delta.map((v,i)=>signed(v)+' '+movement.axes[i]).join(' · ')+' (mm)';
      $('travel-distance').textContent=pair.mean_endpoint_distance_mm[t].toFixed(1)+' mm';
    }else{
      $('travel-vector').textContent=walkers?'Below three-walker minimum':'No complete frame pair';
      $('travel-distance').textContent='Unavailable';
    }
    $('point-name').textContent=marker.label;const pos=marker.mean[t];
    $('point-values').textContent=pos?pos[0].toFixed(2)+' m forward · '+pos[1].toFixed(2)+' m left · '+pos[2].toFixed(2)+' m up':'No observed position at this phase.';
    $('point-support').textContent='Marker '+marker.id+' · '+marker.n[t]+' contributing walkers.';
    for(const [name,s] of [['emg',m],['force',f]]){$(name+'-number').textContent=value(s.mean[t],s.unit,s.n[t]);$(name+'-n').textContent=s.n[t]+' '+(s.n[t]===1?'walker':'walkers');}
    $('force-info').textContent=f.id.startsWith('right_contact_')?'These stricter traces use only source-confirmed right contacts with supporting marker and timing evidence. The graph shows a mean only where at least three walkers contributed. Up to '+d.summary.people_with_right_contact_up+' walkers contributed.':'This trace belongs to the named piece of floor. Its reading can include either foot; it is not an estimate of force from a specific muscle.';
    plot('emg-plot',m,'#227b79');plot('force-plot',f,'#ae5621');
    if($('table').parentElement.parentElement.open)$('table').replaceChildren(...[...d.emg,...d.forces].map(s=>{
      const tr=document.createElement('tr'),name=document.createElement('th');name.scope='row';name.textContent=s.label;tr.append(name);
      for(const v of [value(s.mean[t],s.unit,s.n[t]),value(s.sd[t],s.unit,s.n[t]),String(s.n[t])]){const td=document.createElement('td');td.textContent=v;tr.append(td);}
      return tr;
    }));
  }
  function stop(){playing=false;cancelAnimationFrame(tick);tick=0;$('play').textContent='Play stride';$('play').setAttribute('aria-pressed','false');}
  function animate(now){
    if(!playing)return;const next=Math.min(100,at0+Math.floor((now-t0)/(d.summary.stride_duration_s.mean*10)));
    if(next!==t){t=next;render();}if(t===100){stop();return;}tick=requestAnimationFrame(animate);
  }
  $('play').onclick=()=>{if(playing){stop();return;}if(t===100){t=0;render();}playing=true;t0=performance.now();at0=t;$('play').textContent='Pause stride';$('play').setAttribute('aria-pressed','true');tick=requestAnimationFrame(animate);};
  $('phase').addEventListener('input',()=>{stop();t=Number($('phase').value);render();});
  for(const id of ['marker','emg','force','spread','follow','trail','guides','tint','travel-arrow'])$(id).addEventListener('change',render);
  $('side').onclick=()=>body.pose(-90,3);$('front').onclick=()=>body.pose(0,4);$('reset').onclick=body.reset;
  $('table').closest('details').addEventListener('toggle',render);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
  new ResizeObserver(render).observe($('emg-plot').parentElement);
  render();
})();
