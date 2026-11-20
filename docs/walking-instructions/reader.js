'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const {mean,dot,sub}=math3;
  const markerCount=RECORDINGS.markers.length,muscleCount=RECORDINGS.muscles.length;
  const pelvic=['L_IAS','L_IPS','R_IAS','R_IPS'].map(id=>RECORDINGS.markers.indexOf(id));
  const colors=['#17655b','#a5481b'],shortNames=['Usual','Fast'];
  const cameras={angle:[-.39,.18],side:[0,.06],front:[Math.PI/2,.08]};
  let camera={yaw:cameras.angle[0],tilt:cameras.angle[1]},playing=false,tick=0,lastTick=null,drag=null;
  function unpack(value) {
    const b=atob(value),bytes=Uint8Array.from(b,c=>c.charCodeAt(0));
    return new Float32Array(bytes.buffer);
  }
  function prepare(d) {
    const raw=unpack(d.xyzMm),emg=unpack(d.rmsUv),travel=[],lab=[];
    for(let f=0; f<d.frames; f++) {
      const points=[],aligned=[];
      for(let m=0;m<markerCount;m++) {
        const i=3*(f*markerCount+m),p=[raw[i],raw[i+1],raw[i+2]];
        const rel=sub(p,d.origin);
        points.push(p.map(x=>x/1000));aligned.push(d.axes.map(v=>dot(v,rel)/1000));
      }
      lab.push(points);travel.push(aligned);
    }
    const centres=frames=>frames.map(row=>mean(pelvic.map(k=>row[k])));
    return {...d,travel,lab,emg,pelvis:{lab:centres(lab),travel:centres(travel)}};
  }
  const walks=RECORDINGS.walks.map(prepare);
  const alignment=$('alignment'),range=$('position'),muscle=$('muscle');
  for(const [i,name] of RECORDINGS.muscles.entries()){
    muscle.add(new Option(name.slice(2).replaceAll('_',' '),String(i)));
  }
  muscle.value='1';
  const cards=walks.map((walk,i)=>{
    const frag=$('walk-card').content.cloneNode(true),card=frag.firstElementChild;
    card.querySelector('.trial').textContent='Walk '+walk.code;
    card.querySelector('h2').textContent='“'+walk.title+'”';
    card.querySelector('.speed b').textContent=walk.speed.toFixed(2);
    const surface=card.querySelector('.body');
    surface.setAttribute('aria-label',walk.title+' walking markers in 3D');
    surface.addEventListener('pointerdown',event=>{
      drag={x:event.clientX,y:event.clientY,yaw:camera.yaw,tilt:camera.tilt};
      surface.setPointerCapture(event.pointerId);
    });
    surface.addEventListener('pointermove',event=>{
      if (!drag) return;
      camera={yaw:drag.yaw+(event.clientX-drag.x)*.011,tilt:Math.max(-.85,Math.min(1.15,drag.tilt-(event.clientY-drag.y)*.008))};
      if (!$('camera').querySelector('[value="custom"]')) $('camera').add(new Option('Turned by hand','custom'));
      $('camera').value='custom';render();
    });
    surface.addEventListener('lostpointercapture',()=>drag=null);
    $('bodies').append(frag);
    const b=document.createElement('div');
    b.className='bar';b.innerHTML='<span></span><div class="track"><div class="fill"></div></div><b></b>';
    b.firstChild.textContent=shortNames[i];$('distances').append(b);
    const row=document.createElement('tr');
    const title=document.createElement('th');title.scope='row';title.textContent=shortNames[i];row.append(title);
    for(const foot of ['Left','Right']){
      const force=walk.events[foot].force,cell=document.createElement('td');
      cell.textContent=force.meanN===null?force.reason:force.meanN.toFixed(1)+' N · plate '+force.plate;
      row.append(cell);
    }
    $('forces').append(row);return card;
  });
  const foot=()=>alignment.value==='left'?'Left':'Right';
  function frameAt(walk,value) {
    const ev=walk.events[foot()];
    const offset=alignment.value==='phase'?Math.round(value*(ev.next-ev.strike)/100):value;
    return ev.strike-1+offset;
  }
  function configure() {
    const f=foot();
    range.max=alignment.value==='phase'?100:Math.min(...walks.map(w=>w.events[f].next-w.events[f].strike));
    range.value=Math.min(Number(range.max),Number(range.value));
    $('position-label').textContent=alignment.value==='phase'?'Right stride fraction':'Time after '+f.toLowerCase()+' strike';
    $('clock-note').textContent=alignment.value==='phase'
      ?'Each walker advances through the same fraction of a right stride. The nearest recorded frame is shown. The two frames can occur at different elapsed times.'
      :'Both walkers advance by the same number of milliseconds after '+f.toLowerCase()+' strike. The slider ends when the shorter stride ends.';
  }
  function plot() {
    const {ctx,w,h}=prepareCanvas($('plot')),left=47,right=w-13,top=15,bottom=h-27;
    const j=Number(muscle.value),max=Number(range.max);
    const series=walks.map(walk=>Array.from({length:max+1},(_,t)=>walk.emg[frameAt(walk,t)*muscleCount+j]));
    const high=Math.max(1,Math.ceil(Math.max(...series.flat())/10)*10);
    const px=t=>left+(right-left)*t/max,py=v=>bottom-(bottom-top)*v/high;
    ctx.clearRect(0,0,w,h);ctx.font='11px system-ui, sans-serif';
    ctx.fillStyle='#51635e';ctx.textAlign='right';
    for (const v of [0,high/2,high]) {
      ctx.fillText(v.toFixed(0),left-6,py(v)+3);ctx.strokeStyle='#d9dfd5';
      ctx.beginPath();ctx.moveTo(left,py(v));ctx.lineTo(right,py(v));ctx.stroke();
    }
    ctx.textAlign='left';ctx.fillText('µV',4,13);
    for(const [i,ys] of series.entries()){
      ctx.strokeStyle=colors[i];ctx.lineWidth=2;ctx.setLineDash(i?[6,3]:[]);ctx.beginPath();
      ys.forEach((v,t)=>t?ctx.lineTo(px(t),py(v)):ctx.moveTo(px(0),py(v)));ctx.stroke();
    }
    ctx.setLineDash([]);const value=Number(range.value),cx=px(value);
    ctx.strokeStyle='#33473e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(cx,bottom);ctx.stroke();
    series.forEach((ys,i)=>{ctx.fillStyle=colors[i];ctx.beginPath();ctx.arc(cx,py(ys[value]),4,0,Math.PI*2);ctx.fill()});
    const unit=alignment.value==='phase'?'%':' ms';
    ctx.fillStyle='#51635e';ctx.textAlign='left';ctx.fillText('0'+unit,left,h-7);ctx.textAlign='right';
    ctx.fillText((alignment.value==='phase'?max:max*10)+unit,right,h-7);
    $('plot-caption').textContent='Root mean square voltage, in microvolts. Each point uses 15 source samples centred on the displayed optical frame.';
    const values=$('emg-values');values.replaceChildren();
    series.forEach((ys,i)=>{const s=document.createElement('span');s.className='sig'+i;
      s.textContent=(i?'Fast (dashed)':'Usual (solid)')+' · '+ys[value].toFixed(1)+' µV';values.append(s)});
  }
  function render(){
    const value=Number(range.value),axis=$('axes').value,f=foot();
    $('time').textContent=alignment.value==='phase'?value+'%':(10*value)+' ms';
    range.setAttribute('aria-valuetext',$('time').textContent);
    walks.forEach((walk,i)=>{
      const frame=frameAt(walk,value), ev=walk.events[f], card=cards[i];
      const elapsed=(frame-ev.strike+1)*10,percent=100*(frame-ev.strike+1)/(ev.next-ev.strike);
      card.querySelector('.pose').textContent='Frame '+(frame+1)+' · '+(frame/100).toFixed(2)+' s in file';
      card.querySelector('.stride').textContent=elapsed+' ms · '+percent.toFixed(1)+'% of '+f.toLowerCase()+' stride';
      const point=walk[axis][frame][RECORDINGS.markers.indexOf('R_FCC')];
      const labels=axis==='travel'?['F','L','Z']:['X','Y','Z'];
      card.querySelector('.coordinates').textContent='Right heel (m) · '+point.map((v,k)=>labels[k]+' '+v.toFixed(2)).join('  ');
      drawBody(card.querySelector('canvas'),walk,frame,axis,camera,f);
      const advance=walk.pelvis.travel[frame][0]-walk.pelvis.travel[ev.strike-1][0];
      const bar=$('distances').children[i];
      bar.querySelector('.fill').style.width=(100*Math.max(0,advance)/2)+'%';
      bar.querySelector('b').textContent=advance.toFixed(2)+' m';
    });
    plot();
  }
  function stop(){playing=false;cancelAnimationFrame(tick);lastTick=null;$('play').textContent='Play';$('play').setAttribute('aria-pressed','false')}
  function step(now){
    if(lastTick===null) lastTick=now;
    const interval=alignment.value==='phase'?walks[0].strideS*10:10;
    const advances=Math.floor((now-lastTick)/interval);
    if(advances){
      range.value=Math.min(Number(range.max),Number(range.value)+advances);
      lastTick+=advances*interval;render();
      if(range.value===range.max){stop();return}
    }
    tick=requestAnimationFrame(step);
  }
  $('play').addEventListener('click',()=>{
    if(playing){stop();return}
    if(range.value===range.max)range.value=0;
    playing=true;$('play').textContent='Pause';$('play').setAttribute('aria-pressed','true');
    tick=requestAnimationFrame(step);
  });
  range.addEventListener('input',()=>{stop();render()});
  alignment.addEventListener('change',()=>{stop();configure();render()});
  $('axes').addEventListener('change',render);muscle.addEventListener('change',render);
  $('camera').addEventListener('change',()=>{const a=cameras[$('camera').value];if(a)camera={yaw:a[0],tilt:a[1]};render()});
  document.querySelectorAll('[data-foot]').forEach(b=>b.addEventListener('click',()=>{
    stop();alignment.value=b.dataset.foot;configure();range.value=10;render();$('bodies').scrollIntoView({block:'start'});
  }));
  if(location.protocol==='file:') $('bundle').hidden=true;
  new ResizeObserver(render).observe($('bodies'));
  configure();render();
})();
