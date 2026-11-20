'use strict';
const ui = id=>document.getElementById(id);
const packet=JSON.parse(ui('bundle').textContent), models=packet.models;
const keys={base:'Chest and breathing',aligned:'With ECG',delayed:'With earlier ECG',persistence:'Repeat the last reading'};
let record,cutoff=0,revealed=false,loadToken=0;
function row(label,value,id){
  const tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');
  th.scope='row';th.textContent=label;td.textContent=value;td.id=id;tr.append(th,td);return tr;
}
function draw(forecast){
  const canvas=ui('plot'),width=canvas.clientWidth,height=canvas.clientHeight;
  if(!width||!height)return;
  const ratio=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
  const i=cutoff+ChestReplay.lags, history=record.rows.slice(i-50,i+1).map(r=>r[2]);
  const future=revealed?record.rows.slice(i,i+21).map(r=>r[2]):[];
  const limits=[...history,...future,forecast.base,forecast.aligned];
  const lo=Math.min(...limits),hi=Math.max(...limits),pad=(hi-lo)*.1||.001;
  const x=k=>49+(k+50)*(width-68)/70;
  const y=v=>12+(hi+pad-v)*(height-43)/(hi-lo+2*pad);
  ctx.font='12px Arial,sans-serif';ctx.fillStyle='#485950';ctx.textAlign='left';
  ctx.fillText((hi+pad).toFixed(2),1,16);ctx.fillText((lo-pad).toFixed(2),1,height-30);ctx.fillText('mV',3,height/2);
  ctx.strokeStyle='#bbc7bf';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x(0),9);ctx.lineTo(x(0),height-27);ctx.stroke();ctx.setLineDash([]);
  function trace(values,first,color){
    ctx.lineWidth=2.4;ctx.strokeStyle=color;ctx.beginPath();
    values.forEach((v,n)=>{if(n===0)ctx.moveTo(x(first+n),y(v));else ctx.lineTo(x(first+n),y(v));});ctx.stroke();
  }
  trace(history,-50,'#2b5250');if(revealed)trace(future,0,'#6d3b81');
  const end=x(20);ctx.fillStyle='#a34428';ctx.fillRect(end-4,y(forecast.base)-4,8,8);
  ctx.strokeStyle='#146ab1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(end,y(forecast.aligned),6,0,Math.PI*2);ctx.stroke();
  if(revealed){ctx.fillStyle='#6d3b81';ctx.beginPath();ctx.arc(end,y(future.at(-1)),2.8,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#485950';ctx.textAlign='left';ctx.fillText('−200 ms',x(-50),height-5);
  ctx.textAlign='center';ctx.fillText('cutoff',x(0),height-5);ctx.textAlign='right';ctx.fillText('+80 ms',width-1,height-5);
}
function render(){
  const t=packet.cutoffStartSeconds+cutoff/ChestReplay.gridHz;
  ui('clock').textContent=t.toFixed(3)+' s';ui('cut').setAttribute('aria-valuetext',t.toFixed(3)+' seconds');
  ui('target-time').textContent=(t+.08).toFixed(3)+' s';
  const values=ChestReplay.predict(record,cutoff,models);
  const rows=Object.entries(keys).map(([key,label])=>row(label,values[key].toFixed(6),'prediction-'+key));
  rows.push(row('Measured chest vibration',revealed?ChestReplay.measured(record,cutoff).toFixed(6):'Hidden','measurement'));
  const target=ChestReplay.measured(record,cutoff);
  ui('comparison').textContent=revealed?'At this cutoff the forecast with ECG misses by '+Math.abs(values.aligned-target).toFixed(3)+' mV. Chest and breathing alone miss by '+Math.abs(values.base-target).toFixed(3)+' mV.':'';
  ui('values').replaceChildren(...rows);ui('target-key').hidden=!revealed;
  ui('reveal').setAttribute('aria-pressed',String(revealed));ui('reveal').textContent=revealed?'Hide the later reading':'Reveal the later reading';draw(values);
}
function selectRecord(next){
  record=next;cutoff=0;revealed=false;
  ui('experiment').hidden=false;ui('record').value=record.name;ui('cut').value='0';ui('cut').max=String(ChestReplay.count(record)-1);
  const n=ChestReplay.count(record);
  ui('coverage').textContent=n===250?'Built-in excerpt':'Verified original file';
  ui('score-scope').textContent=n.toLocaleString('en-US')+' forecasts from '+record.name+' across '+(n/250)+' second'+(n===250?'':'s')+' of cutoffs.';
  const scores=ChestReplay.score(record,models);
  ui('scores').replaceChildren(...Object.entries(keys).map(([k,label])=>row(label,scores[k].toFixed(6),'score-'+k)));
  ui('source-file').href='https://physionet.org/files/cebsdb/1.0.0/'+record.name+'.dat';
  ui('source-file').textContent='Download '+record.name+'.dat from PhysioNet';
  ui('message').textContent='';render();
}
function builtIn(){loadToken++;ui('local').value='';selectRecord(packet.records.find(r=>r.name===ui('record').value));}
for(const r of packet.records)ui('record').add(new Option(r.name,r.name));
ui('record').onchange=builtIn;ui('short').onclick=builtIn;
ui('cut').oninput=()=>{cutoff=Number(ui('cut').value);render();};
ui('reveal').onclick=()=>{revealed=!revealed;render();};
ui('local').onchange=async()=>{
  const file=ui('local').files[0];if(!file)return;const token=++loadToken;
  ui('experiment').hidden=true;ui('message').textContent='Verifying and filtering the local waveform…';
  try{
    const next=await ChestReplay.readFullFile(file,packet.records);
    if(token===loadToken)selectRecord(next);
  }catch(e){if(token===loadToken){ui('coverage').textContent='';ui('message').textContent=e.message;}}
};
new ResizeObserver(()=>{if(record&&!ui('experiment').hidden)draw(ChestReplay.predict(record,cutoff,models));}).observe(ui('plot'));
builtIn();
