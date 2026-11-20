'use strict';
function makeScene(canvas, view, reset) {
  const ctx = canvas.getContext('2d');
  const names = recording.markerLabels;
  const indices = new Map(names.map((name, i) => [name, i]));
  const hues = structure.colours;
  const presets = {legs:[-.36,.34],foot:[-.42,.58],body:[-.38,.23],top:[0,Math.PI/2]};
  let yaw, pitch, last, pointer, queued = false;
  function setCamera() { [yaw,pitch] = presets[view.value]; schedule(); }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; if (last) paint(...last); });
  }
  function rotate(dx,dy) {
    yaw += dx;
    pitch = Math.max(.03,Math.min(Math.PI / 2,pitch + dy));
    schedule();
  }
  canvas.addEventListener('pointerdown', e => { pointer = {id:e.pointerId,x:e.clientX,y:e.clientY}; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!pointer || pointer.id !== e.pointerId) return;
    rotate((e.clientX-pointer.x)*.011,(e.clientY-pointer.y)*.009);
    pointer.x = e.clientX; pointer.y = e.clientY;
  });
  canvas.addEventListener('lostpointercapture', () => { pointer=null; });
  canvas.addEventListener('keydown', e => {
    const keys={ArrowLeft:[-.13,0],ArrowRight:[.13,0],ArrowDown:[0,-.09],ArrowUp:[0,.09]};
    if (keys[e.key]) { e.preventDefault(); rotate(...keys[e.key]); }
    if (e.key==='Home') {e.preventDefault();setCamera();}
  });
  view.addEventListener('change',setCamera); reset.addEventListener('click',setCamera);
  new ResizeObserver(schedule).observe(canvas); setCamera();
  const chains=[];
  for (const side of ['L','R']) {
    for (const chain of [...structure.legChains,...structure.armChains]) {
      chains.push(chain.map(name => side+'_'+name));
    }
  }
  chains.push(...structure.bodyChains);
  const legs=new Set(structure.legChains.flat()), feet=new Set(structure.footMarkers);
  function visible(name,mode) {
    if (mode==='body') return true;
    const [side,part]=name.split('_');
    if (mode==='foot') return side==='R' && feet.has(part);
    if (mode==='top') return feet.has(part);
    return legs.has(part) && part!=='FTC';
  }
  function paint(index,cutoff) {
    const mode=view.value, first=recording.firstIndex;
    const frame=recording.labXYZmm[index-first];
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if (!w || !h || !ctx) return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
      canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    }
    ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.clearRect(0,0,w,h);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    function orient([x,y,z]) {
      const along=x*sy+y*cy;
      return [x*cy-y*sy,-(along*sp+z*cp),along*cp-z*sp];
    }
    const corners=recording.plateCornersMm;
    const selected=names.map(n=>visible(n,mode));
    // Fit the whole displayed sequence once per camera angle; a moving marker must never resize the ruler.
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    function include(p){const [x,y]=orient(p);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    for (const row of recording.labXYZmm) row.forEach((p,i)=>{if(p&&selected[i])include(p);});
    (mode==='foot'?[corners[0]]:corners).flat().forEach(include);
    const scale=Math.min((w-42)/(maxX-minX||1),(h-58)/(maxY-minY||1));
    function project(p){const [x,y,d]=orient(p);return [w/2+(x-(minX+maxX)/2)*scale,h/2+(y-(minY+maxY)/2)*scale+2,d];}
    function stroke(a,b,color,width,dash=[]){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
    function word(label,x,y,colour='#d8e8db',align='left'){ctx.font='600 11px system-ui,sans-serif';ctx.fillStyle=colour;ctx.textAlign=align;ctx.fillText(label,x,y);ctx.textAlign='left';}
    for (const [k,plate] of corners.entries()) {
      if(mode==='foot'&&k===1) continue;
      const poly=plate.map(project);ctx.beginPath();poly.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=k===0?'#25524b':'#243c40';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=k===0?'#79aa91':'#678185';ctx.stroke();
      const a=Math.min(...plate.map(p=>p[0])),b=Math.max(...plate.map(p=>p[0]));
      for(let x=Math.ceil(a/100)*100;x<b;x+=100) stroke(project([x,0,-2]),project([x,464,-2]),'#ffffff28',.7);
      for(let y=100;y<464;y+=100) stroke(project([a,y,-2]),project([b,y,-2]),'#ffffff28',.7);
      const label=project([b-90,35,-2]);word('P'+(k+1),label[0],label[1],k===0?'#c9e0cb':'#acbbbf','center');
    }
    const shapes=[];
    const enqueueLine=(p,q,color,width,dash=[])=>{const a=project(p),b=project(q);shapes.push({depth:(a[2]+b[2])/2,draw:()=>stroke(a,b,color,width,dash)});};
    for(const chain of chains){for(let j=1;j<chain.length;j++){
      const a=indices.get(chain[j-1]),b=indices.get(chain[j]);
      if(!selected[a]||!selected[b]||!frame[a]||!frame[b])continue;
      const colour=chain[j].startsWith('L_')?'#76a9bb':chain[j].startsWith('R_')?'#e7ad66':'#bed4cb';
      enqueueLine(frame[a],frame[b],colour,mode==='foot'?2.4:1.8);
    }}
    for(const [label,hue] of [['R_FCC',hues.heel],['R_FM2',hues.fore]]){
      const id=indices.get(label);
      for(let k=cutoff-22;k<=index;k++){
        const a=recording.labXYZmm[k-1-first][id],b=recording.labXYZmm[k-first][id];
        if(a && b)enqueueLine(a,b,hue,2.3);
      }
    }
    frame.forEach((p,i)=>{
      if(!p||!selected[i])return;
      const label=names[i],[x,y,depth]=project(p); const heel=label==='R_FCC',fore=label==='R_FM2';
      const radius=mode==='foot'?4.2:mode==='body'?2.4:3.2;
      const hue=heel?hues.heel:fore?hues.fore:hues[label[0]]||hues.mid;
      shapes.push({depth,draw:()=>{
        ctx.fillStyle=hue;ctx.lineWidth=1;ctx.strokeStyle='#173134';ctx.beginPath();
        if(fore)ctx.rect(x-radius,y-radius,2*radius,2*radius);else ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(heel){ctx.beginPath();ctx.arc(x,y,radius+2.8,0,Math.PI*2);ctx.strokeStyle=hue;ctx.stroke();}
      }});
    });
    shapes.sort((a,b)=>b.depth-a.depth);shapes.forEach(s=>s.draw());
    if(mode==='foot'||mode==='legs') {
      for(const [id,label,dx,dy,col] of [['R_FCC','Heel',-13,-15,hues.heel],['R_FM2','Forefoot',13,-13,hues.fore]]){
        const [x,y]=project(frame[indices.get(id)]);const tx=x+dx,ty=y+dy;
        stroke([x,y-3],[tx,ty+3],col,.9);word(label,tx,ty,col,dx<0?'right':'left');
      }
    }
    const axisBase=[34,36];
    for(const [p,label] of [[[1,0,0],'X'],[[0,1,0],'Y'],[[0,0,1],'Z']]){
      const [vx,vy]=orient(p);if(Math.hypot(vx,vy)<.15)continue;
      const end=[axisBase[0]+vx*19,axisBase[1]+vy*19];stroke(axisBase,end,'#a2c5c2',1.2);
      word(label,axisBase[0]+vx*26,axisBase[1]+vy*26+3,'#daebe7','center');
    }
    const unit=mode==='foot'?50:100, sx=16, y=h-12;
    stroke([sx,y],[sx+unit*scale,y],'#dae7dc',2);for(const x of [sx,sx+unit*scale])stroke([x,y-4],[x,y+1],'#dae7dc',1);
    word(unit+' mm',sx+unit*scale+6,y+2);
  }
  return (index,cutoff) => {last=[index,cutoff];schedule();};
}
