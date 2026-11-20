'use strict';
const el=id=>document.getElementById(id);
const windows=['baseline','early','late'];
const labels={baseline:'Before pulse',early:'Early',late:'Late'};
const units=new Intl.NumberFormat('en',{maximumFractionDigits:3,minimumFractionDigits:3,useGrouping:true});
const mean=values=>values.reduce((sum,v)=>sum+v,0)/values.length;
const fmt=v=>(Math.abs(v)<0.0005?'0.000':units.format(v)).replace('-', '−');
const ms=v=>String(+(v/10).toFixed(1)).replace('-','−');
const interval=key=>{const [a,b]=VOLTAGES.windows[key];return `${ms(a)} to <${ms(b)}`;};
const ns='http://www.w3.org/2000/svg';
function svg(tag,attrs,content){const node=document.createElementNS(ns,tag);for(const [name,v] of Object.entries(attrs))node.setAttribute(name,v);if(content!==undefined)node.textContent=content;return node;}
function numeric(window,idx){
  const selected=el('person').value, relative=el('scale').value==='change';
  const people=VOLTAGES.participants.filter(p=>selected==='all'||p.participant===selected);
  const native=people.map(p=>p.means[window][idx]);
  const offsets=people.map(p=>relative?mean(p.means.baseline[idx]):0);
  const lines=native.map((row,i)=>row.map(v=>v-offsets[i]));
  return {line:lines[0].map((_,j)=>mean(lines.map(p=>p[j]))), lo:lines[0].map((_,j)=>Math.min(...lines.map(p=>p[j]))), hi:lines[0].map((_,j)=>Math.max(...lines.map(p=>p[j]))),native:mean(native.map(mean)),baseline:mean(people.map(p=>mean(p.means.baseline[idx])))};
}
let active='SC6',data={},bounds=[];
for(const p of VOLTAGES.participants){const o=document.createElement('option');o.value=p.participant;o.textContent=`${p.participant} · 80 stimuli`;el('person').append(o);}
for(const [key,s] of Object.entries(SITE)){const b=document.createElement('button');b.type='button';b.textContent=s.label;b.dataset.site=key;b.onclick=()=>selectSite(key);el('sites').append(b);}
function selectSite(code){
  active=code;const s=SITE[code];el('channel-title').textContent=s.title;el('reference').textContent=s.ref;el('site-title').textContent=s.label==='Heart'?'Cardiac recording':s.label+' recording';el('site-copy').textContent=s.detail;el('site-limit').textContent=s.limit;
  for(const b of el('sites').children)b.setAttribute('aria-pressed',String(b.dataset.site===code));anatomyView.select(code);updateData();
}
function updateData(){
  const ci=VOLTAGES.channels.indexOf(active);data=Object.fromEntries(windows.map(k=>[k,numeric(k,ci)]));
  let low=Math.min(...windows.flatMap(w=>data[w].lo)), high=Math.max(...windows.flatMap(w=>data[w].hi));
  const width=Math.max(0.01,high-low);bounds=[low-width*.07,high+width*.07];
  el('range-note').textContent=(el('person').value==='all'?'Line = mean across four people. Shading spans the lowest to highest person mean. ':'Line = mean across 80 events in this person. ')+`All three panels use the same vertical scale, ${fmt(bounds[0])} to ${fmt(bounds[1])} µV. Gaps between panels have no samples.`;
  el('values').replaceChildren(...windows.map(w=>{const tr=document.createElement('tr');const d=data[w];for(const v of [interval(w),fmt(mean(d.line)),fmt(d.native-d.baseline)]){const td=document.createElement('td');td.textContent=v;tr.append(td);}return tr;}));
  const person=VOLTAGES.participants.find(p=>p.participant===el('person').value);
  el('support').textContent=person?`Training participant ${person.participant} · median run ${String(person.run).padStart(2,'0')} · first 80 stimuli. Baseline on the original reference: ${fmt(data.baseline.native)} µV.`:`Four training participants · 80 stimuli each · 320 events. Mean baseline on the original reference: ${fmt(data.baseline.native)} µV.`;updateSample();
}
function drawPanel(key){
  const d=data[key],count=d.line.length,[a,b]=VOLTAGES.windows[key];const activeWindow=el('window').value===key;
  const button=document.createElement('button');button.className='trace';button.type='button';button.setAttribute('aria-pressed',String(activeWindow));button.setAttribute('aria-label',`${labels[key]}, ${interval(key)} milliseconds, select a sample`);
  const title=document.createElement('strong');title.textContent=labels[key];button.append(title);
  const tracks=getComputedStyle(el('chart')).gridTemplateColumns.split(' ');
  const width=Math.max(65,parseFloat(tracks[windows.indexOf(key)])-4 || 155), height=153,m={l:5,r:5,t:20,b:27};const X=i=>m.l+i*(width-m.l-m.r)/(count-1), Y=v=>m.t+(bounds[1]-v)*(height-m.t-m.b)/(bounds[1]-bounds[0]);
  const image=svg('svg',{viewBox:`0 0 ${width} ${height}`,preserveAspectRatio:'none',role:'img','aria-label':`${interval(key)} milliseconds, ${count} native samples`});
  const line=(x1,y1,x2,y2,attr)=>image.append(svg('line',{x1,y1,x2,y2,...attr}));
  [0,.5,1].forEach(f=>line(m.l,m.t+f*(height-m.t-m.b),width-m.r,m.t+f*(height-m.t-m.b),{stroke:'#d0ddd4'}));
  if(key==='baseline'){for(const [v,y] of [[bounds[1],m.t-4],[bounds[0],height-m.b+11]])image.append(svg('text',{x:m.l,y,'font-size':10},Number(v.toPrecision(3))+' µV'));}
  if(bounds[0]<0&&bounds[1]>0)line(m.l,Y(0),width-m.r,Y(0),{stroke:'#899e94','stroke-dasharray':'3 3'});
  const points=row=>row.map((v,i)=>`${X(i).toFixed(2)},${Y(v).toFixed(2)}`);
  if(el('person').value==='all')image.append(svg('polygon',{points:[...points(d.hi),...points(d.lo).reverse()].join(' '),fill:'#a6c8b8'}));
  image.append(svg('polyline',{points:points(d.line).join(' '),fill:'none',stroke:'#14594c','stroke-width':2,'stroke-linejoin':'round'}));
  if(activeWindow){const i=Number(el('moment').value);line(X(i),m.t,X(i),height-m.b,{stroke:'#5a6559','stroke-dasharray':'2 3'});image.append(svg('circle',{cx:X(i),cy:Y(d.line[i]),r:3.7,fill:'#aa501a',stroke:'white'}));}
  for(const [i,text,anchor] of [[0,ms(a),'start'],[count-1,ms(b-1),'end']])image.append(svg('text',{x:X(i),y:height-5,'text-anchor':anchor,'font-size':11},text+' ms'));
  button.append(image);button.onclick=e=>{el('window').value=key;const rect=image.getBoundingClientRect();const rel=(e.clientX-rect.left)/rect.width;const pos=e.detail===0?Math.floor(count/2):Math.round((rel*width-m.l)/(width-m.l-m.r)*(count-1));el('moment').max=String(count-1);el('moment').value=String(Math.min(count-1,Math.max(0,pos)));updateSample();if(e.detail===0)el('moment').focus();};return button;
}
function updateSample(){const w=el('window').value,range=el('moment');range.max=data[w].line.length-1;const idx=Number(range.value);const value=data[w].line[idx];const time=ms(VOLTAGES.windows[w][0]+idx);
  el('sample').textContent=`${time} ms from the wrist stimulus · ${fmt(value)} µV ${el('scale').value==='change'?'relative to baseline':'on the original reference'}`;range.setAttribute('aria-valuetext',`${time} milliseconds, ${fmt(value)} microvolts`);el('chart').replaceChildren(...windows.map(drawPanel));}
el('scale').onchange=updateData;el('person').onchange=updateData;el('window').onchange=()=>{el('moment').max=data[el('window').value].line.length-1;el('moment').value=Math.floor(data[el('window').value].line.length/2);updateSample();};el('moment').oninput=updateSample;
const requested=new URLSearchParams(location.search).get('site');selectSite(Object.hasOwn(SITE,requested)?requested:'SC6');

let lastChartWidth=0;new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==lastChartWidth){lastChartWidth=width;updateSample();}}).observe(el('chart'));
