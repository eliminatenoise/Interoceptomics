'use strict';
const $=id=>document.getElementById(id);
const packet=JSON.parse($('recorded-channels').textContent);
let manifest;
async function sha256(bytes){
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
const samples=new Map();
const plotSpec=[['Heart electrical activity','#174f7a'],['Chest vibration sensor','#a04a27'],['Breathing band','#196b58']];
let record,raw,token=0,cursor=0,anchor=null,from=0,to=0,frame=0,startIndex=0,startTime=0;
function pause(){cancelAnimationFrame(frame);frame=0;$('play').textContent='Play';}
function sampleTime(i){return (record.firstSample+i)/record.rateHz;}
function timeText(i){return sampleTime(i).toFixed(4)+' s';}
function digital(i,c){return raw.getInt16((i*4+c)*2,true);}
function voltage(i,c){return (digital(i,c)-record.baseline[c])/record.gain[c];}
function channel(i){return i===0?Number($('lead').value):i===1?3:2;}
function extent(){return record.stopSample-record.firstSample;}
function marks(){return record.beatMarks[channel(0)];}
function nearest(arr,point){return arr.reduce((a,b)=>Math.abs(b-point)<Math.abs(a-point)?b:a);}
const plots=plotSpec.map(([name,colour],i)=>{
  const fig=document.createElement('figure'),caption=document.createElement('figcaption'),title=document.createElement('b'),value=document.createElement('output');
  const area=document.createElement('div'),canvas=document.createElement('canvas'),line=document.createElement('i'),pin=document.createElement('i'),scale=document.createElement('div');
  area.className='signal';line.className='cursor';pin.className='anchor';pin.hidden=true;scale.className='extent';
  const first=document.createElement('span'),range=document.createElement('span'),last=document.createElement('span');scale.append(first,range,last);
  title.textContent=name;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',name+' waveform');value.setAttribute('aria-live','off');value.dataset.signal=i;
  caption.append(title,value);area.append(canvas,pin,line);fig.append(caption,area,scale);$('plots').append(fig);
  area.addEventListener('pointerdown',ev=>{if (!raw) return;pause();const box=area.getBoundingClientRect();setCursor(from+Math.round((to-from-1)*Math.max(0,Math.min(1,(ev.clientX-box.left)/box.width))));});
  return {fig,canvas,area,line,pin,value,first,range,last,colour};
});
function selectWindow(center){
  if($('window').value==='full'){from=0;to=extent();return;}
  const length=record.rateHz*.8;from=Math.max(0,Math.min(extent()-length,center-Math.floor(length/2)));to=from+length;
}
let ranges=[];
function getRanges(){
  return record.channels.map((_,c)=>{
    let lo=Infinity,hi=-Infinity;
    for(let i=0;i<extent();i++){const v=voltage(i,c);if(v<lo)lo=v;if(v>hi)hi=v;}
    const extra=(hi-lo)*.04||.001;return [lo-extra,hi+extra];
  });
}
function draw(){
  if(!raw) return;
  for(const [i,p] of plots.entries()){
    const box=p.area.getBoundingClientRect(),w=Math.max(1,Math.round(box.width)),h=Math.max(1,Math.round(box.height)),dpr=Math.min(2,devicePixelRatio||1);
    p.canvas.width=Math.round(w*dpr);p.canvas.height=Math.round(h*dpr);
    const ctx=p.canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
    const ch=channel(i),[lo,hi]=ranges[ch],y=v=>(hi-v)/(hi-lo)*(h-4)+2;
    ctx.fillStyle='#f7f9f6';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d1dad4';ctx.lineWidth=.75;
    for(let t=Math.ceil(sampleTime(from));t<=sampleTime(to-1);t++){const x=(t*record.rateHz-record.firstSample-from)/(to-from-1)*(w-1);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    if(i===0){
      ctx.strokeStyle='#986a24';ctx.setLineDash([2,3]);
      for(const tick of marks()){const k=tick-record.firstSample;if(k<from||k>=to)continue;const x=(k-from)/(to-from-1)*(w-1);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
      ctx.setLineDash([]);
    }
    ctx.strokeStyle=p.colour;ctx.lineWidth=1;
    let previous=null;
    for(let x=0;x<w;x++){
      const a=from+Math.floor(x*(to-from)/w),b=Math.min(to,Math.max(a+1,from+Math.floor((x+1)*(to-from)/w)));
      let low=Infinity,high=-Infinity;
      for(let k=a;k<b;k++){const v=voltage(k,ch);if(v<low)low=v;if(v>high)high=v;}
      ctx.beginPath();ctx.moveTo(x+.5,y(low));ctx.lineTo(x+.5,y(high));ctx.stroke();
      const initial=voltage(a,ch);
      if(previous!==null){ctx.beginPath();ctx.moveTo(x-.5,y(previous));ctx.lineTo(x+.5,y(initial));ctx.stroke();}
      previous=voltage(b-1,ch);
    }
    p.first.textContent=sampleTime(from).toFixed(4)+' s';p.last.textContent=sampleTime(to-1).toFixed(4)+' s';p.range.textContent=lo.toFixed(2)+' to '+hi.toFixed(2)+' mV';
  }
  showReadings();
}
function showReadings(){
  if(!raw)return;
  $('seek').value=String(cursor);$('time').textContent=timeText(cursor);$('seek').setAttribute('aria-valuetext',timeText(cursor)+' from start of recording');
  for(const [i,p] of plots.entries()){
    const c=channel(i);p.value.textContent=voltage(cursor,c).toFixed(4)+' mV';
    p.value.title='Original digital sample '+digital(cursor,c)+', source row '+(record.firstSample+cursor);
    p.line.style.left='min('+100*(cursor-from)/(to-from-1)+'%, calc(100% - 2px))';p.pin.hidden=anchor===null||anchor<from||anchor>=to;
    if(!p.pin.hidden)p.pin.style.left='min('+100*(anchor-from)/(to-from-1)+'%, calc(100% - 1px))';
  }
  const current=record.firstSample+cursor,chosen=marks();$('beat-controls').hidden=!chosen.length;
  if(chosen.length){
    const beat=nearest(chosen,current),other=nearest(record.beatMarks[1-channel(0)],beat);
    const diff=(other-beat)*1000/record.rateHz;
    $('prev').disabled=!chosen.some(t=>t<current);$('next').disabled=!chosen.some(t=>t>current);
    $('beat-note').textContent='Dotted markers show beat labels for lead '+record.channels[channel(0)]+'. Nearest mark: '+(beat/record.rateHz).toFixed(4)+' s. The nearest mark on lead '+record.channels[1-channel(0)]+' is '+Math.abs(diff).toFixed(1)+' ms '+(diff===0?'apart':diff<0?'earlier':'later')+'.';
  }else{
    $('beat-note').textContent='This excerpt has no beat overlay. Its original beat-label file belongs to a different waveform. You can still inspect both electrical leads and the other two sensors at each sample.';
  }
  $('difference').textContent=anchor===null?'Select a starting point to measure elapsed time.':
    ((cursor-anchor)*1000/record.rateHz).toFixed(1)+' ms from '+timeText(anchor)+' (dashed purple line).';
}
function setCursor(n){
  if(!raw)return;
  cursor=Math.min(extent()-1,Math.max(0,n));
  if(cursor<from||cursor>=to){selectWindow(cursor);draw();}else showReadings();
}
function moveBeat(direction){
  if(!raw)return;pause();const abs=record.firstSample+cursor,list=marks();
  const next=direction>0?list.find(n=>n>abs):list.findLast(n=>n<abs);
  if(next!==undefined){cursor=next-record.firstSample;selectWindow(cursor);draw();}
}
async function selectRecord(){
  const mine=++token;pause();raw=null;$('viewer').hidden=true;$('status').textContent='Checking the saved recording…';
  const selected=manifest.records.find(r=>r.record===$('record').value);
  try{
    let bytes=samples.get(selected.record);
    if(!bytes){const encoded=packet.bytes[selected.file];bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
      const hash=await sha256(bytes);
      if(hash!==selected.sha256 || bytes.length!==(selected.stopSample-selected.firstSample)*8)throw Error('Changed waveform');
      samples.set(selected.record,bytes);
    }
    if(mine!==token)return;
    record=selected;raw=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    cursor=marks().length?marks()[0]-record.firstSample:0;anchor=null;
    $('seek').max=String(extent()-1);ranges=getRanges();selectWindow(cursor);
    $('source-info').textContent=record.record===record.calibration ?
      'The waveform, channel calibration and two sets of beat marks all match record b001. Each plotted voltage is the raw integer minus its channel baseline, divided by that channel’s gain.':
      'The archive’s '+record.record+' waveform is byte-identical to '+record.calibration+'. All four channel checksums match the '+record.calibration+' header, which supplies the calibrations here. The '+record.record+' header and beat marks do not form a verified pair with these bytes. The page makes no comparison of recording conditions.';
    $('viewer').hidden=false;$('status').textContent='';draw();
  }catch(e){if(mine===token)$('status').textContent='The saved waveform could not be verified. Download a fresh copy of the viewer to inspect this record.';}
}

$('record').addEventListener('change',selectRecord);
$('lead').addEventListener('change',()=>{if(raw)draw();});
$('window').addEventListener('change',()=>{if(raw){pause();selectWindow(cursor);draw();}});
$('seek').addEventListener('input',()=>{pause();setCursor(Number($('seek').value));});
$('prev').addEventListener('click',()=>moveBeat(-1));$('next').addEventListener('click',()=>moveBeat(1));
$('anchor').addEventListener('click',()=>{anchor=cursor;showReadings();});
$('play').addEventListener('click',()=>{
  if(!raw)return;if(frame){pause();return;}
  if(cursor===extent()-1)setCursor(0);
  startIndex=cursor;startTime=performance.now();$('play').textContent='Pause';
  function tick(now){setCursor(startIndex+Math.floor((now-startTime)*record.rateHz/1000));if(cursor>=extent()-1)pause();else frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
});
new ResizeObserver(()=>{if(raw)draw();}).observe($('plots'));
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
async function openViewer(){
  try{
    if(await sha256(new TextEncoder().encode(packet.manifestText))!=='/* MANIFEST_HASH */')throw Error('Changed calibrations');
    manifest=JSON.parse(packet.manifestText);
    for(const [i,r] of manifest.records.entries())$('record').add(new Option('Record '+(i+1)+' · '+r.record,r.record));
    await selectRecord();
  }catch{
    $('viewer').hidden=true;
    $('status').textContent='The saved calibration table could not be verified. Download a fresh copy of the viewer.';
  }
}
openViewer();
