'use strict';
const byId = id => document.getElementById(id);
const structures = {
  nerve: ['Sensory ending',[-.7,.39,.57],'One sensory axon branches and winds around the middle of the small fibres. Electrical spikes from an axon of this type appear in the recording below.'],
  fibres: ['Intrafusal fibres',[1.19,.46,.32],'These slender muscle fibres run inside the capsule. Their central regions carry the coiled sensory endings.'],
  capsule: ['Capsule',[1.20,.15,.67],'A sleeve of connective tissue surrounds the spindle. Its near side is cut away here to reveal the fibres inside.'],
  muscle: ['Muscle bundles',[2.45,-.42,-.43],'The surrounding force-producing fibres run alongside the spindle. Several bundles are exposed here.'],
  tendon: ['Tendon',[4.42,.06,-.17],'Tendon joins muscle to its attachment. The force sensor measured the load transmitted through the tendon during the stretch.']
};
const meshes = spindleGeometry();
const slice = transverseSlice(meshes,-.083);
const sliceCenters={};
for(const [key,name] of Object.entries({capsule:'Cut capsule margin 1',fibres:'Intrafusal fibre 1',muscle:'Muscle bundle 8',nerve:'Annulospiral terminal 1'})){
  const piece=slice.find(part=>part.name===name);
  if(piece){
    const total=[0,0,0];
    piece.p.forEach((v,i)=>total[i%3]+=v);
    sliceCenters[key]=V.scale(total,3/piece.p.length);
  }
}

let selected = 'nerve', detail = false, section = false;
const options = {center:[0,0,.24],span:[10.7,3.36],yaw:13,tilt:16,roll:-10,drawn(project){
  const [x,y]=project(section?(sliceCenters[selected]||structures[selected][1]):structures[selected][1]);
  byId('pin').dataset.label=structures[selected][0];
  byId('pin').classList.toggle('west',x>byId('anatomy').clientWidth*.60);
  byId('pin').style.left=x+'px';byId('pin').style.top=y+'px';
}};
const view=camera(byId('anatomy'),options);
function viewMode(closeUp) {
  section=false;byId('across').setAttribute('aria-pressed','false');
  detail=closeUp; options.span=detail?[6.55,3.2]:[10.7,3.36];
  options.center[1]=detail?.35:0;options.center[2]=detail?.61:.24;
  view.setParts(detail?meshes.filter(m=>!['muscle','tendon'].includes(m.group)):meshes);
  byId('whole').setAttribute('aria-pressed',String(!detail));
  byId('detail').setAttribute('aria-pressed',String(detail));
  if(detail && ['muscle','tendon'].includes(selected)) selectPart('nerve');
}
function selectPart(key) {
  selected=key;
  if((section && key==='tendon')||(!section && detail && ['muscle','tendon'].includes(key))) viewMode(false);
  for(const b of byId('parts').children) b.setAttribute('aria-pressed',String(b.dataset.part===key));
  byId('description').textContent=structures[key][2]+(section?' This plane cuts the same opened model across its middle.':'');
  view.rotate(0,0);
}
for(const [key,[name]] of Object.entries(structures)) {
  const b=document.createElement('button'); b.textContent=name;b.dataset.part=key;
  b.addEventListener('click',()=>selectPart(key));byId('parts').append(b);
}
byId('whole').onclick=()=>{viewMode(false);view.reset();};
byId('detail').onclick=()=>{viewMode(true);view.reset();};
byId('across').onclick=()=>{
  section=true;detail=false;options.span=[2.5,2.35];options.center[1]=0;options.center[2]=-.04;
  view.setParts(slice);view.setAngle(90,0);
  byId('across').setAttribute('aria-pressed','true');
  for(const id of ['whole','detail'])byId(id).setAttribute('aria-pressed','false');
  selectPart('fibres');
};
byId('reset').onclick=()=>{viewMode(false);view.reset();selectPart('nerve');};
viewMode(false);selectPart('nerve');
function decode(name) {
  const bytes=Uint8Array.from(atob(TRIAL[name]),v=>v.charCodeAt(0));
  const raw=new DataView(bytes.buffer), values=new Float64Array(bytes.length/8);
  for(let i=0;i<values.length;i++) values[i]=raw.getFloat64(i*8,true);
  return values;
}
const time=decode('time'), force=decode('force'), position=decode('position'), spikes=decode('events');
const eTime=decode('electrical_time'),electrical=decode('electrical');
const eMin=Math.min(...electrical),eMax=Math.max(...electrical);
const spikeTicks=spikes.map(t=>Math.round((t-time[0])*TRIAL.electrical_hz));
const bins=Math.floor((time.length-1)/40);
const slider=byId('bin');slider.max=String(bins-1);
const counts=Array(bins).fill(0);
for(const tick of spikeTicks){const j=Math.floor(tick/400);if(j<bins)counts[j]++;}
const colors={force:'#a34734',position:'#096c77',spike:'#745114',cut:'#273a30'};
const fMin=Math.min(...force),fMax=Math.max(...force),pMin=Math.min(...position),pMax=Math.max(...position);
function panel(id) {
  const el=byId(id),bounds=el.getBoundingClientRect(), w=bounds.width,h=bounds.height;
  const scale=Math.min(2,devicePixelRatio||1);
  const width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));
  if(el.width!==width||el.height!==height){el.width=width;el.height=height;}
  const c=el.getContext('2d');
  c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,w,h);
  c.font='12px Arial,sans-serif';c.lineWidth=1.35;
  return {c,w,h};
}
function line(c,x1,y1,x2,y2,color) {
  c.strokeStyle=color;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
}
function sampleLine(c,data,low,high,x,y,height,color) {
  c.strokeStyle=color;c.beginPath();
  for(let i=0;i<data.length;i++){const px=x(i),py=y+height*(1-(data[i]-low)/(high-low));
    if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}
  c.stroke();
}
function overview(j) {
  const {c,w,h}=panel('trace'),left=42,right=w-7,bottom=h-22,span=right-left;
  const x=i=>left+span*i/(time.length-1),cut=x(j*40);
  c.fillStyle='#cfded1';c.fillRect(x((j-5)*40),2,cut-x((j-5)*40),bottom);
  c.fillStyle='#f4ddc7';c.fillRect(cut,2,x((j+1)*40)-cut,bottom);
  const stretch=(bottom-22)*.39;
  const lanes=[[force,fMin,fMax,5,colors.force],[position,pMin,pMax,14+stretch,colors.position]];
  for(const [data,min,max,top,color] of lanes) {
    line(c,left,top+stretch,right,top+stretch,'#b7c3b8');
    c.fillStyle='#3d4e42';c.textAlign='right';c.fillText(max.toFixed(2),left-4,top+10);c.fillText(min.toFixed(2),left-4,top+stretch);
    sampleLine(c,data,min,max,x,top,stretch,color);
  }
  for(const tick of spikeTicks)line(c,x(tick/10),bottom-10,x(tick/10),bottom,colors.spike);
  line(c,cut,1,cut,bottom+3,colors.cut);
  c.fillStyle='#34453a';c.textAlign='left';c.fillText(time[0].toFixed(3)+' s',left,h-4);
  c.textAlign='right';c.fillText(time.at(-1).toFixed(3)+' s',right,h-4);
}
function raster(j) {
  const {c,w,h}=panel('raster'),col=w/6,first=(j-5)*400;
  c.fillStyle='#dde8de';c.fillRect(0,0,col*5,h);
  c.fillStyle='#f1ddc7';c.fillRect(col*5,0,col,h);
  c.fillStyle='#32463a';c.fillText('Past 100 ms',5,15);
  c.textAlign='right';c.fillText('Next 20 ms',w-4,15);
  for(let k=1;k<6;k++)line(c,k*col,22,k*col,h-5,k===5?colors.cut:'#a8bca9');
  for(const tick of spikeTicks){
    if(tick>=first && tick<first+2400){const x=w*(tick-first)/2400;line(c,x,32,x,h-12,colors.spike);}
  }
}
function electricalTrace(j) {
  const {c,w,h}=panel('electrical-trace'),left=45,right=w-7,top=13,bottom=h-23;
  const start=(j-5)*400,len=2400;
  const x=i=>left+(right-left)*i/len;
  c.fillStyle='#dde8de';c.fillRect(left,3,x(2000)-left,bottom);
  c.fillStyle='#f1ddc7';c.fillRect(x(2000),3,right-x(2000),bottom);
  sampleLine(c,electrical.subarray(start,start+len+1),eMin,eMax,x,top,bottom-top,'#565655');
  line(c,x(2000),2,x(2000),bottom+4,colors.cut);
  for(const tick of spikeTicks){
    if(tick>=start && tick<start+len)line(c,x(tick-start),bottom+1,x(tick-start),bottom+8,colors.spike);
  }
  c.fillStyle='#374b3d';c.textAlign='right';c.fillText(eMax.toFixed(2),left-4,top+8);c.fillText(eMin.toFixed(2),left-4,bottom);
  c.textAlign='left';c.fillText(eTime[start].toFixed(3)+' s',left,h-1);
  c.textAlign='right';c.fillText(eTime[start+len].toFixed(3)+' s',right,h-1);
}
function addRow(target,cells) {
  const row=document.createElement('tr');
  cells.forEach((v,i)=>{const e=document.createElement(i?'td':'th');if(!i)e.scope='row';e.textContent=v;row.append(e);});
  target.append(row);
}
function forecasts(j) {
  if(!FORECAST)return;
  byId('population').textContent='These exploratory models trained on two sensory recordings (aff004 and aff017). They withheld every trial from the illustrated axon (aff015). All three recordings share the same filename prefix. The original comparison across three prefixes lacked eligible recordings and could not be evaluated.';
  const row=FORECAST.rows[j-5];if(!row||row.bin!==j||row.observed!==counts[j])throw Error('Forecast record differs from the displayed source interval');
  byId('prediction').hidden=false;
  const out=byId('forecast-rows');out.replaceChildren();
  for(const [title,key] of [['Mechanics + spike history','all'],['Spike history alone','history'],['Mechanics alone','mechanics'],['Earlier mechanics + current spike history','earlier']]){
    addRow(out,[title,row[key]===null?'No earlier comparison':row[key].toFixed(3)]);
  }
  addRow(out,['Repeat the mean of the five past counts',(counts.slice(j-5,j).reduce((sum,n)=>sum+n,0)/5).toFixed(3)]);
  addRow(out,['Repeat the last count',counts[j-1].toFixed(3)]);
  byId('spread').textContent='The displayed Transformer uses the prespecified seed 1641. Across three training seeds its combined forecast ranges from '+row.range[0].toFixed(3)+' to '+row.range[1].toFixed(3)+' spikes. This is training variation. The timing control moves mechanics back 100 ms in this trial and keeps the current spike history. This trial was chosen earlier to check its two clocks. Performance on a new animal remains unknown.';
  if(row.reverse){byId('reverse').hidden=false;const target=byId('reverse-rows');target.replaceChildren();
    for(const [k,label] of ['Measured','Mechanics only','Mechanics + spikes','Continue the last slope','No change'].entries()){
      addRow(target,[label,...['force','position'].map(ch=>row.reverse[ch][k].toFixed(5))]);
    }
  }
}
function update() {
  const j=Number(slider.value),origin=time[j*40],observed=time[j*40-1],end=time[(j+1)*40];
  byId('clock').textContent=origin.toFixed(3)+' s';
  byId('elapsed').textContent=(origin-time[0]).toFixed(3)+' s from trial start';
  byId('force').textContent=force[j*40-1].toFixed(5);byId('position').textContent=position[j*40-1].toFixed(5);
  byId('count').textContent=counts[j];
  byId('interval').textContent='History '+time[(j-5)*40].toFixed(3)+'–'+origin.toFixed(3)+' s. Last mechanical input '+observed.toFixed(4)+' s. The next count covers '+origin.toFixed(3)+'–'+end.toFixed(3)+' s.';
  const summary=byId('bin-counts');summary.replaceChildren();
  for(let k=j-5;k<=j;k++){const s=document.createElement('span');s.textContent=counts[k]+' '+(counts[k]===1?'spike':'spikes');summary.append(s);}
  const now=Array.from(spikes).filter((_,i)=>spikeTicks[i]>=j*400 && spikeTicks[i]<(j+1)*400);
  byId('events').textContent=now.length?'Detected in the next interval at '+now.map(v=>v.toFixed(5)+' s').join(', ')+'.':'No event was detected in the next interval.';
  overview(j);raster(j);if(byId('raw').open)electricalTrace(j);forecasts(j);
}
let timer=null;
function stop() {if(timer)clearInterval(timer);timer=null;byId('play').textContent='Play slowly';byId('play').setAttribute('aria-pressed','false');}
byId('play').onclick=()=>{
  if(timer){stop();return;}
  if(+slider.value===+slider.max)slider.value=slider.min;
  update();byId('play').textContent='Pause';byId('play').setAttribute('aria-pressed','true');
  timer=setInterval(()=>{if(+slider.value>=+slider.max){stop();return;}slider.stepUp();update();},100);
};
slider.addEventListener('input',()=>{stop();update();});
byId('trace').addEventListener('click',event=>{
  const rect=byId('trace').getBoundingClientRect(),f=(event.clientX-rect.left-42)/(rect.width-49);
  slider.value=Math.min(bins-1,Math.max(5,Math.round(f*(time.length-1)/40)));stop();update();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
new ResizeObserver(update).observe(byId('trace'));
byId('raw').addEventListener('toggle',()=>{if(byId('raw').open)electricalTrace(+slider.value);});
function download(name,lines){
  const url=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{type:'text/csv'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
byId('csv-mechanics').onclick=()=>download('aff015-trial1-mechanics.csv',['source_time_s,force_archived_units,apparatus_position_archived_units',...Array.from(time,(t,i)=>[t,force[i],position[i]].join(','))]);
byId('csv-spikes').onclick=()=>download('aff015-trial1-events.csv',['detected_spike_source_time_s',...spikes]);
byId('csv-electrical').onclick=()=>download('aff015-trial1-electrical.csv',['source_time_s,axon_signal_archived_units',...Array.from(eTime,(t,i)=>t+','+electrical[i])]);
if(location.protocol==='file:')byId('zip').hidden=true;
update();
