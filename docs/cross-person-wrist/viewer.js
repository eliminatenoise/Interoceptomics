(() => {
  const $ = id => document.getElementById(id);
  const G = WristGeometry;
  const colours = {R:'#76dced',L:'#ffb182'};
  const names = {R:'Right',L:'Left'};
  const gold = '#e3e4a1', grid = '#49635f', white = '#e2eeeb';
  const read = name => document.querySelector('input[name="'+name+'"]:checked').value;
  const signed = n => n > 0 ? '+'+n : String(n).replace('-','−');
  const sf = n => Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2);
  const context = $('labels').getContext('2d'), plot = $('plot').getContext('2d');
  const renderBody = WristBody.create($('surface'));
  let series, fixed, reasons, queued = false, timer = null;
  function setGeometry() {
    const implant = read('implant');
    series = G.buildSeries(implant,$('mirror').checked,$('gap').value,WristSurface.joints);
    const prior = series.slice(0,15);
    fixed = G.shoulderFrame(prior,implant);
    reasons = Object.fromEntries(G.sides.map(side=>[side,G.roleReason(prior,side,fixed)]));
  }
  function size(c) {
    const {width:w,height:h}=c.canvas.getBoundingClientRect();
    const ratio=Math.min(2,window.devicePixelRatio || 1);
    const width=Math.round(w*ratio),height=Math.round(h*ratio);
    if(c.canvas.width!==width || c.canvas.height!==height) {
      c.canvas.width=width; c.canvas.height=height;
    }
    c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);
    return {w,h,ratio};
  }
  function stroke(c,points,color,width=1,dash=[]) {
    c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);
    c.beginPath();let pen=false;
    for(const p of points) {
      if(!p){pen=false;continue;}
      if(pen)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);
      pen=true;
    }
    c.stroke();c.setLineDash([]);
  }
  function marker(c,p,r,col,kind='circle') {
    if(!p)return;
    c.beginPath();
    if(kind==='square') c.rect(p[0]-r,p[1]-r,2*r,2*r);
    else c.arc(p[0],p[1],r,0,2*Math.PI);
    c.fillStyle=kind==='ring'?'#152f30':col;c.fill();
    c.strokeStyle=kind==='ring'?col:'#122729';c.lineWidth=kind==='ring'?2:1;c.stroke();
  }
  function label(c,text,x,y,col,size=11,align='left'){
    c.font='600 '+size+'px "Segoe UI",Arial,sans-serif';c.textAlign=align;c.textBaseline='middle';
    c.fillStyle=col;c.fillText(text,x,y);
  }
  function callout(c,point,text,dir,col,w,top,h) {
    c.font='600 11px "Segoe UI",Arial,sans-serif';
    const width=c.measureText(text).width;
    let x=dir>0?point[0]+12:point[0]-12-width;
    x=Math.max(5,Math.min(w-width-9,x));
    const y=Math.max(14,Math.min(h-12,point[1]+top));
    stroke(c,[point,[x+width/2,y]],col,1);
    c.fillStyle='#183332';c.fillRect(x-3,y-8,width+6,16);
    label(c,text,x,y,col);
  }
  function anatomy(frame,implant,yaw) {
    const {w,h,ratio}=size(context); if(w<1||h<1)return;
    const model=renderBody(frame,implant,yaw,w,h,ratio);
    const head=model.project([implant==='L'?.76:-.76,7.53,.4]);
    callout(context,head,names[implant]+' implant',head[0]>=w/2?1:-1,gold,w,-19,h);
    marker(context,head,4,gold);
    const locations={};
    for(const side of G.sides){
      const points=G.joints.map(joint=>model.project(model.pose[side+'_'+joint]));
      const hand=points[2];locations[side]=hand;
      stroke(context,points,colours[side],1.45);
      points.forEach((p,i)=>marker(context,p,i===2?5:3,colours[side],['square','circle','ring'][i]));
    }
    const nearOverlap=Math.abs(locations.R[0]-locations.L[0])<90 && Math.abs(locations.R[1]-locations.L[1])<36;
    for(const side of G.sides) {
      const p=locations[side];
      callout(context,p,names[side]+' wrist',p[0]<w/2?-1:1,colours[side],w,nearOverlap&&side==='R'?26:-15,h);
    }
    $('labels').setAttribute('aria-label',names[implant]+' implant, '+names[G.other(implant)].toLowerCase()+' annotated wrist. Both sets of shoulder, elbow and wrist markers shown. Model rotation '+yaw+' degrees.');
  }
  function arrow(c,start,end,col,text) {
    stroke(c,[start,end],col,1.4);
    const a=Math.atan2(end[1]-start[1],end[0]-start[0]);
    for(const delta of [-.55,.55]) stroke(c,[end,[end[0]-6*Math.cos(a+delta),end[1]-6*Math.sin(a+delta)]],col,1.4);
    if(text) label(c,text,end[0]+(end[0]>start[0]?5:-5),end[1]-8,col,10,end[0]>start[0]?'left':'right');
  }
  function diagram(frame,implant,mode,horizon) {
    const {w,h}=size(plot); if(w<1||h<1)return;
    const isBody=mode==='body';
    if(isBody && fixed.reason){
      label(plot,'Shoulder frame unavailable',w/2,h*.45,white,16,'center');
      label(plot,fixed.reason,w/2,h*.55,gold,12,'center');return;
    }
    const bounds=isBody?[-1.75,1.75,-1.5,1.4]:[0,640,0,480];
    const [xmin,xmax,ymin,ymax]=bounds;
    const s=Math.min((w-54)/(xmax-xmin),(h-45)/(ymax-ymin));
    const left=(w-(xmax-xmin)*s)/2,top=(h-(ymax-ymin)*s)/2;
    const xy=([x,y])=>[left+(x-xmin)*s,top+(isBody?ymax-y:y-ymin)*s];
    const project=p=>p ? xy(isBody?G.aligned(p,fixed):p) : null;
    const xs=isBody?[-1.5,-1,-.5,0,.5,1,1.5]:[0,160,320,480,640];
    const ys=isBody?[-1.5,-1,-.5,0,.5,1]:[0,120,240,360,480];
    for(const x of xs){
      const p=xy([x,ymin]); stroke(plot,[p,xy([x,ymax])],grid,.65);
      label(plot,String(x),p[0],top+(ymax-ymin)*s+10,'#bad0ca',9,'center');
    }
    for(const y of ys){
      const p=xy([xmin,y]); stroke(plot,[p,xy([xmax,y])],grid,.65);
      label(plot,String(y),p[0]-5,p[1],'#bad0ca',9,'right');
    }
    if(!fixed.reason){
      const origin=project(fixed.origin);
      // A bracket spans exactly the median earlier width along the fixed lateral axis.
      const end=offset=>G.add(fixed.origin,G.add(G.scale(fixed.lateral,offset*fixed.width),G.scale(fixed.up,-.14*fixed.width)));
      const bracket=[end(-.5),end(.5)];
      stroke(plot,bracket.map(project),gold,1,[2,3]);
      for(const tip of bracket) stroke(plot,[project(G.add(tip,G.scale(fixed.up,.04*fixed.width))),project(G.add(tip,G.scale(fixed.up,-.04*fixed.width)))],gold,1);
      for(const [axis,tag] of [[fixed.lateral,'a'],[fixed.up,'b']]){
        arrow(plot,origin,project(G.add(fixed.origin,G.scale(axis,fixed.width*.75))),gold,tag);
      }
      marker(plot,origin,3.5,gold);
    }
    for(const side of G.sides) {
      const wrist=side+'_Wrist', col=colours[side];
      stroke(plot,series.slice(0,15).map(row=>project(row[wrist])),col,2.8);
      stroke(plot,series.slice(14,15+horizon).map(row=>project(row[wrist])),col,1.8,[3,3]);
      marker(plot,project(series[14+horizon][wrist]),5,col,'ring');
      const current=series[14+frame];
      const points=G.joints.map(joint=>project(current[side+'_'+joint]));
      stroke(plot,points,col,1.5);
      points.forEach((p,i)=>marker(plot,p,i===2?3.5:2.8,col,i===0?'square':'circle'));
      if(points[2]) label(plot,side,points[2][0],points[2][1]+13,col,10,'center');
    }
  }

  function updateTable(implant,mode,horizon) {
    const useBody=mode==='body';
    const unit=useBody?'widths':'px';
    $('coord-label').textContent='Endpoint (x, y) · '+unit;
    $('error-label').textContent='Hold-still error · '+unit;
    $('rows').replaceChildren();
    for(const side of [G.other(implant),implant]) {
      const name=side+'_Wrist', later=series[14+horizon][name], cutoff=series[14][name];
      const tr=document.createElement('tr'), title=document.createElement('th');
      title.scope='row';title.textContent=names[side]+' wrist';
      const role=document.createElement('small');
      role.textContent=side===implant?'Implant side · ipsilateral':'Annotated · contralateral';
      title.append(document.createElement('br'),role);
      const endpoint=document.createElement('td'),error=document.createElement('td');
      const availableFrame=!useBody || !fixed.reason;
      if(!later) endpoint.textContent='Missing at +'+horizon;
      else if(!availableFrame) endpoint.textContent='Frame unavailable';
      else {
        const coords=useBody?G.aligned(later,fixed):later;
        endpoint.textContent=coords.map(x=>useBody?sf(x):x.toFixed(1)).join(', ');
      }
      if(reasons[side]) error.textContent='Withheld · '+reasons[side].toLowerCase();
      else if(!later) error.textContent='Unknown · endpoint missing';
      else {
        const dist=Math.hypot(...G.sub(later,cutoff));
        error.textContent=useBody?sf(dist/fixed.width):dist.toFixed(1);
      }
      tr.append(title,endpoint,error);$('rows').append(tr);
    }
    const complete=G.sides.every(side=>!reasons[side]);
    const incomplete=G.sides.filter(side=>reasons[side]).map(side=>names[side].toLowerCase()+' wrist');
    const eligibility=complete?'Both arm histories qualify.':'Two-arm input withheld. Earlier input unavailable for '+incomplete.join(' and ')+'.';
    $('support').textContent=eligibility+' At 30 Hz, +'+horizon+' frames is '+(horizon/30).toFixed(3)+' s after the cutoff.';
  }
  function render() {
    queued=false;
    const frame=Number($('frame').value), implant=read('implant');
    const mode=read('space'),horizon=Number(read('horizon')),yaw=Number($('yaw').value);
    $('angle').textContent=signed(yaw)+'°';
    $('clock').textContent=signed(frame)+(frame===0?' · cutoff':frame<0?' · earlier':' · later');
    $('plot-title').textContent=mode==='body'?'From the shoulders':'Through the camera';
    const axes='Gold a points toward the annotated shoulder. Gold b points toward image-up.';
    $('frame-caption').textContent= (mode==='body'?'One unit equals the median earlier shoulder width.':'Detector pixels run rightward (x) and downward (y).')+' '+(fixed.reason?'Shared axes unavailable. '+fixed.reason+'.':axes+' Earlier width '+fixed.width.toFixed(1)+' px, origin ('+fixed.origin.map(x=>x.toFixed(1)).join(', ')+') px.');
    anatomy(frame,implant,yaw);diagram(frame,implant,mode,horizon);
    updateTable(implant,mode,horizon);
  }
  function request() {if(!queued){queued=true;requestAnimationFrame(render);}}
  function stop() {clearInterval(timer);timer=null;$('play').textContent='Play';}
  $('play').addEventListener('click',()=>{
    if(timer){stop();return;}
    if(Number($('frame').value)>=15)$('frame').value=-14;
    $('play').textContent='Pause';request();
    timer=setInterval(()=>{
      const next=Number($('frame').value)+1;
      if(next>15){stop();return;}
      $('frame').value=next;request();if(next===15)stop();
    },150);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  $('cut').addEventListener('click',()=>{stop();$('frame').value=0;request();});
  $('front').addEventListener('click',()=>{$('yaw').value=0;request();});
  for(const el of document.querySelectorAll('input[name=implant],#mirror,#gap')) el.addEventListener('change',()=>{setGeometry();request();});
  for(const el of document.querySelectorAll('input[name=space],input[name=horizon],#yaw')) el.addEventListener('input',request);
  $('frame').addEventListener('input',()=>{stop();request();});
  let drag=null;
  $('model').addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw:Number($('yaw').value)};$('model').setPointerCapture(e.pointerId);});
  $('model').addEventListener('pointermove',e=>{if(drag){$('yaw').value=((drag.yaw+(e.clientX-drag.x)*.7+540)%360)-180;request();}});
  for(const type of ['pointerup','pointercancel','lostpointercapture']) $('model').addEventListener(type,()=>{drag=null;});
  new ResizeObserver(request).observe($('model'));
  setGeometry();render();
})();
