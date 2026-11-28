import {names,forecastPose,hipCentred,visible,checkHistory} from './model.mjs';
import {drawPose} from './draw.mjs';
import {pairedHistory} from './stereo.mjs';
import {createPairedFeedback} from './paired-feedback.mjs';
import {inputOptions} from './predict.mjs';
const get=id=>document.getElementById(id);
const fetchJSON=async path=>{const r=await fetch(new URL(path,import.meta.url));if(!r.ok)throw Error('Could not open the recording.');return r.json();};
let currentUpload=null,feedback=null,frames=[],later=[],pair=null,angle=-.3,reveal=false,timer=null,version=0,center=[0,0,0],scale=.18,sourceInfo='',hasMuscles=false;
for(const [i,label] of names.entries())get('point').add(new Option(label,String(i)));get('point').value='5';
function stop(){if(timer!==null)clearInterval(timer);timer=null;get('play').textContent='Play recording';}
function resetView(){angle=-.3;}
function arrange(){
  const points=frames[4]?.xyz?.filter(visible)??[];
  if(points.length){
    center=[0,1,2].map(d=>points.reduce((s,p)=>s+p[d],0)/points.length);
    const extent=Math.max(600,...points.map(p=>Math.hypot(...p.map((n,i)=>n-center[i]))));scale=Math.min(.25,180/extent);
  }else{center=[0,0,0];scale=.16;}
}
function calculate(){
  if(frames.length<5)return;
  const f=Number(get('frame').value),j=Number(get('point').value),method=get('method').value,relative=get('space').value==='hips';
  const match=frames.slice(f-4,f+1),raw=match[4],current=(relative?hipCentred(raw):raw).xyz;
  let out;
  if(method==='image_feedback'){
    feedback??=createPairedFeedback(pair);out=feedback.at(f);
  }else out=forecastPose(match,{method,useMuscles:get('muscles').checked&&hasMuscles,relative});
  const prediction=out.joints.map(x=>x.position);
  let truth=later[f];if(truth&&relative)truth=hipCentred({xyz:truth}).xyz;
  get('muscles').disabled=method!=='model';
  get('name').textContent=names[j];get('clock').textContent=raw.t.toFixed(3)+' s';
  get('credit').hidden=!get('credit').hasAttribute('href');
  const chosen=prediction[j],start=current[j],available=visible(chosen)&&visible(start);
  get('delta').textContent=available?Math.hypot(...chosen.map((x,d)=>x-start[d])).toFixed(1)+' mm forecast movement':'Forecast unavailable for this point';
  get('delta').dataset.xyz=JSON.stringify(chosen);
  get('axes').textContent=available?'Predicted position · '+chosen.map(x=>x.toFixed(1)).join(', ')+' mm · '+(relative?'relative to hips':'room axes')+'.':out.joints[j].support+'.';
  get('reveal').disabled=!(available&&visible(truth?.[j]));get('reveal').setAttribute('aria-pressed',String(reveal&&!get('reveal').disabled));
  get('reveal').textContent=reveal?'Hide later measurement':'Reveal later measurement';
  get('measured').textContent=reveal&&available&&visible(truth?.[j])?'Later optical position · '+truth[j].map(n=>n.toFixed(1)).join(', ')+' mm. Forecast error · '+Math.hypot(...chosen.map((v,i)=>v-truth[j][i])).toFixed(1)+' mm.':'';
  drawPose(get('body'),{current,forecast:prediction,later:reveal&&truth?truth:[],selected:j,angle,scale,origin:relative?[0,0,0]:center});
  get('info').textContent=sourceInfo;
}
function safeCalculate(){try{calculate();get('status').textContent='';}catch(e){stop();get('status').textContent=e.message;}}
function ready(options={reference:'lab',method:'model',useMuscles:false},uploaded=false){
  stop();reveal=false;resetView();arrange();get('frame').max=String(frames.length-1);get('frame').value=String(uploaded?frames.length-1:4);
  get('play').disabled=frames.length<=5;get('muscle-choice').hidden=!hasMuscles;get('muscles').checked=options.useMuscles&&hasMuscles;
  const option=get('method').querySelector('[value="image_feedback"]');option.disabled=!pair||options.reference==='hips';get('space').value=options.reference;get('method').value=options.method;
  safeCalculate();
}
async function select(){
  const id=++version;stop();get('status').textContent='Loading recording…';
  const src=await fetchJSON('recordings/'+get('record').value);if(id!==version)return;
  frames=src.times.map((t,i)=>({t,xyz:src.xyz[i],rms_volts:src.rms_volts?.[i]}));later=src.later;pair=null;feedback=null;sourceInfo=src.description;
  hasMuscles=src.muscles;get('credit').href=src.ref;get('credit').textContent=src.source;ready();
}
function importFile(p,fileName){
  const options=inputOptions(p);
  const nextPair=p.views??null;let input;
  if(nextPair){
    if(!Array.isArray(nextPair)||nextPair.length!==2||nextPair.some(v=>!Array.isArray(v.frames))||nextPair[0].frames.length<5||nextPair[1].frames.length!==nextPair[0].frames.length)throw Error('Supply two matching camera histories of five or more frames.');
    // Five-frame slices use the same calibrated and time-checked entry as the CLI.
    const first=pairedHistory(nextPair.map(v=>({...v,frames:v.frames.slice(0,5)})));input=[...first];
    for(let i=5;i<nextPair[0].frames.length;i++)input.push(pairedHistory(nextPair.map(v=>({...v,frames:v.frames.slice(i-4,i+1)})))[4]);
  }else input=p.frames;
  if(!Array.isArray(input)||input.length<5)throw Error('Supply at least five chronological frames.');
  for(let i=4;i<input.length;i++)checkHistory(input.slice(i-4,i+1));
  version++;currentUpload={input:p,name:fileName};frames=input;pair=nextPair;feedback=null;later=[];hasMuscles=frames.some(r=>r.rms_volts?.some(Number.isFinite));
  sourceInfo=fileName+' · '+(pair?'Reconstructed from the two supplied camera calibrations.':'User-supplied 3D coordinates.');
  let opt=get('record').querySelector('[value="custom"]');if(!opt){opt=new Option(fileName,'custom');get('record').add(opt);}opt.textContent=fileName;get('record').value='custom';get('credit').removeAttribute('href');ready(options,true);
}
get('record').onchange=()=>{if(get('record').value==='custom'&&currentUpload){importFile(currentUpload.input,currentUpload.name);return;}select().catch(e=>get('status').textContent=e.message);};
get('frame').oninput=()=>{stop();reveal=false;safeCalculate();};
get('space').onchange=()=>{if(get('space').value==='hips'&&get('method').value==='image_feedback')get('method').value='model';get('method').querySelector('[value="image_feedback"]').disabled=!pair||get('space').value==='hips';safeCalculate();};
get('point').onchange=get('method').onchange=get('muscles').onchange=()=>{reveal=false;safeCalculate();};
get('reveal').onclick=()=>{reveal=!reveal;safeCalculate();};
get('left').onclick=()=>{angle-=Math.PI/8;safeCalculate();};get('right').onclick=()=>{angle+=Math.PI/8;safeCalculate();};get('reset').onclick=()=>{resetView();safeCalculate();};
get('play').onclick=()=>{if(timer!==null){stop();return;}if(+get('frame').value>=+get('frame').max)get('frame').value='4';reveal=false;get('play').textContent='Pause recording';timer=setInterval(()=>{const i=+get('frame').value;if(i>=+get('frame').max){stop();return;}get('frame').value=String(i+1);safeCalculate();},1000/30);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
get('upload').onchange=async e=>{try{const file=e.target.files[0];if(file)importFile(JSON.parse(await file.text()),file.name);}catch(err){get('status').textContent=err.message;}};
get('pair').onclick=async()=>{try{importFile(await fetchJSON('example-pair.json'),'Example camera pair');}catch(e){get('status').textContent=e.message;}};
try{for(const v of await fetchJSON('recordings.json'))get('record').add(new Option(v.label,v.file));await select();}catch(e){get('status').textContent=e.message;}
