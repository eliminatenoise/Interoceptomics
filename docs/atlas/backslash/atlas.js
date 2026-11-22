import {sources, brain, organs, routes} from './data.js';
const $=id=>document.getElementById(id);
const plates=await (await fetch('plates.json')).json();
const locations=(await (await fetch('../assets/atlas-region-locations.json')).json()).regions;
const cuts=await fetch('sections/index.json').then(r=>r.ok?r.json():null).catch(()=>null);
const stemKeys=['pag','pbn','medulla36','medulla','medulla38'];
const tissueKeys=['spindle','receptors','cord','corticospinal','enteric'];
const first={brain:'medial',stem:'medulla',body:'all',plate:'spindle'};
const prefs={...first};
let current='brain',landmark='medial',routeId='',stepIndex=0,bodyPromise,rotation=false;
const frame=$('brain-frame');
const onlineAtlas='https://eliminatenoise.github.io/Interoceptomics/atlas/backslash/';
let onlineSelection;
if(['127.0.0.1','localhost','[::1]'].includes(location.hostname)){
  onlineSelection=document.createElement('a');
  onlineSelection.textContent='Open this selection online';
  onlineSelection.rel='noreferrer';
  document.querySelector('header nav').append(onlineSelection);
}
function sourceLink(parent,link){
  const anchor=document.createElement('a');anchor.href=link[1];anchor.textContent=link[0];
  parent.replaceChildren(anchor);
}
function brainCmd(cmd){
  frame.contentWindow.postMessage({type:'brain-command',command:cmd},location.origin);
}
function snapBrain(){
  const [,view,selection]=brain[prefs.brain];
  const isolate=prefs.brain==='vpl';
  brainCmd({view,selection,role:'all',reset:true,isolate,focus:isolate});
}
let brainReady=false,cut=false,cutIndex=1;
function readyBrain(){
  $('brain-start').hidden=true;
  if(!brainReady){brainReady=true;snapBrain();}
}
window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
  if(e.data?.type==='brain-ready'||e.data?.type==='brain-state')readyBrain();
  if(e.data?.type==='brain-error'){$('brain-start').hidden=false;$('loading-text').textContent='Reference render · interactive graphics unavailable';}
});
frame.addEventListener('load',()=>{
  if(frame.contentDocument?.body?.dataset.ready==='1'||frame.contentWindow.renderMetrics)readyBrain();
});
function sourceCaption(key){
  if(current==='brain'){
    const [title,,id,caption,source]=brain[key];
    $('view-title').textContent=title;$('view-caption').textContent=caption;
    sourceLink($('view-source'),sources.allen);
    if(id)$('view-source').append(document.createTextNode(' · Allen parcel '+id));
    if(source!=='allen'){const a=document.createElement('a');a.href=sources[source][1];a.textContent='Independent reference';$('view-source').append(' · ',a);}
  }else if(current==='body'){
    $('view-title').textContent=organs[key][0];$('view-caption').textContent=organs[key][1];sourceLink($('view-source'),sources.hra);
  }else{
    const p=plates[key];$('view-title').textContent=p.name;
    $('view-caption').textContent=p.read+(current==='stem'?' These transverse sections are from a different human donor, a 61-year-old woman. The right half includes the midline. The authors cut parallel to the pontomesencephalic junction.':'');
    sourceLink($('view-source'),[p.source,p.url]);
    const a=document.createElement('a');a.textContent=p.rights;a.href=p.license;$('view-source').append(' · ',a);
  }
}
function refreshHash(write=true){
  const q=new URLSearchParams({scene:current,[{brain:'landmark',stem:'plate',body:'organ',plate:'plate'}[current]]:landmark});
  if(cut&&current==='brain')q.set('cut',['caudal','central','rostral'][cutIndex]);
  if(routeId){q.set('route',routeId);q.set('step',stepIndex);}
  const fragment='#'+q;
  if(onlineSelection)onlineSelection.href=onlineAtlas+fragment;
  if(current==='body')$('organ-gallery').querySelector('a').href='organ/index.html'+fragment;
  if(write)history.replaceState(null,'',fragment);
}
function show(scene,key,write=true){
  const entries=scene==='brain'?Object.entries(brain).map(([k,v])=>[k,v[0]]):scene==='body'?Object.entries(organs).map(([k,v])=>[k,v[0]]):(scene==='stem'?stemKeys:tissueKeys).map(k=>[k,plates[k].name]);
  current=scene;landmark=entries.some(([k])=>k===key)?key:first[scene];prefs[scene]=landmark;
  $('landmark').replaceChildren(...entries.map(([k,name])=>new Option(name,k)));$('landmark').value=landmark;
  $('view-label').textContent={brain:'Brain landmark',stem:'Section level',body:'Organ selection',plate:'Tissue reference'}[scene];
  for(const b of document.querySelectorAll('[data-scene]'))b.setAttribute('aria-pressed',String(b.dataset.scene===scene));
  $('organ-gallery').hidden=scene!=='body';
  const isPlate=scene==='stem'||scene==='plate';
  for(const id of ['brain','body','plate']){$(id+'-pane').hidden=id==='plate'?!isPlate:scene!==id;$(id+'-controls').hidden=$(id+'-pane').hidden;}
  $('brain-modes').hidden=scene!=='brain'||!cuts?.landmarks[landmark];
  if(scene!=='brain'||!cuts?.landmarks[landmark])cut=false;
  const showCut=scene==='brain'&&cut;
  $('cut-pane').hidden=!showCut;$('cut-controls').hidden=!showCut;
  $('surface').setAttribute('aria-pressed',String(!showCut));$('section').setAttribute('aria-pressed',String(showCut));
  if(showCut){
    $('brain-pane').hidden=true;$('brain-controls').hidden=true;
    const slice=cuts.landmarks[landmark].slices[cutIndex];
    $('cut-image').src=slice.image;$('cut-image').alt=brain[landmark][0]+', coronal atlas slice '+slice.j+', '+slice.selectedVoxels+' source-left highlighted voxels.';
    $('cut-position').textContent=(slice.direction||slice.position)+' · j '+slice.j+' · A '+slice.apMm+' mm';
    $('cut-back').disabled=cutIndex===0;$('cut-forward').disabled=cutIndex===2;
  }else if(scene==='brain'){
    const still=$('brain-start').querySelector('img');still.src='brain/'+landmark+'.webp';still.alt=brain[landmark][0]+' · rendered atlas reference';
    if(brainReady)snapBrain();
  }else if(scene==='body'){
    if(!bodyPromise){
      $('body-status').textContent='Loading the four organ surfaces…';
      bodyPromise=import('./body.js').then(m=>m.createBody($('organ-canvas'))).catch(()=>{
        $('body-status').textContent='Interactive graphics unavailable. Open the static organ view in the atlas.';return null;
      });
    }
    bodyPromise.then(body=>{if(body&&current==='body'){$('body-status').textContent='';body.select(landmark);}});
  }else{
    const p=plates[landmark];$('plate-image').src=p.file;$('plate-image').alt=p.name+'. '+p.modality;
    $('open-image').href=p.file;$('full-image').href=p.file;
    $('plate-prev').hidden=scene!=='stem';$('plate-next').hidden=scene!=='stem';
    $('plate-prev').disabled=landmark===stemKeys[0];$('plate-next').disabled=landmark===stemKeys.at(-1);
  }
  sourceCaption(landmark);
  const parcel=scene==='brain'?brain[landmark][2]:null,xyz=locations[parcel]?.left;
  $('native-link').hidden=!xyz;
  if(xyz)$('native-point').href='../index.html#atlas-labels-v2/be23763c15386f2f211105f1e8144a6887e7615571229090e209b1c78355d378/-98,-134,-72/0.5/'+xyz.join(',')+'/highlight';
  if(showCut){
    const info=cuts.landmarks[landmark],slice=info.slices[cutIndex];
    $('view-caption').textContent='Coronal section of the Allen atlas annotation. Orange marks '+slice.selectedVoxels+' source-left voxels with label '+info.labelId+' on this slice. Each pixel represents 0.5 mm along each displayed axis. L and R are anatomical left and right in the reference atlas.'+(info.labelId===10467?' Here 10467 is the residual parent label. Its orange voxels cover only part of the hypothalamus; several subregions have separate labels.':'');
  }
  refreshHash(write);
}
$('section').onclick=()=>{cut=true;cutIndex=1;show('brain',landmark);};
$('surface').onclick=()=>{cut=false;show('brain',landmark);};
$('cut-back').onclick=()=>{cutIndex--;show('brain',landmark);};$('cut-forward').onclick=()=>{cutIndex++;show('brain',landmark);};
function routeRender(openPlace=true){
  const route=routes[routeId];$('route').value=routeId;$('route-content').hidden=!route;$('route-intro').hidden=Boolean(route);
  if(!route){refreshHash();return;}
  const step=route.stops[stepIndex];
  $('family').textContent=route.family+' · '+step.kind;$('step-title').textContent=step.name;$('step-copy').textContent=step.text;
  sourceLink($('step-source'),sources[step.source]);$('progress').textContent=(stepIndex+1)+' of '+route.stops.length;
  $('back').disabled=stepIndex===0;$('forward').disabled=stepIndex===route.stops.length-1;
  const steps=$('steps');
  if(steps.dataset.route!==routeId){
    steps.replaceChildren(...route.stops.map((s,i)=>{
      const item=document.createElement('li'),b=document.createElement('button'),kind=document.createElement('span');
      b.textContent=s.name;kind.textContent=s.kind;b.append(kind);
      b.onclick=()=>{stepIndex=i;routeRender();};item.append(b);return item;
    }));
    steps.dataset.route=routeId;
  }
  steps.querySelector('[aria-current="step"]')?.removeAttribute('aria-current');
  steps.children[stepIndex].firstElementChild.setAttribute('aria-current','step');
  if(openPlace){cut=false;cutIndex=1;show(...step.where.split(':'));}
}
$('route').add(new Option('Choose a pathway…',''));
for(const [id,r] of Object.entries(routes))$('route').add(new Option(r.title,id));
$('route').onchange=()=>{routeId=$('route').value;stepIndex=0;routeRender();};
$('back').onclick=()=>{--stepIndex;routeRender();};$('forward').onclick=()=>{++stepIndex;routeRender();};
function leaveRoute(){if(routeId){routeId='';stepIndex=0;routeRender(false);}}
for(const b of document.querySelectorAll('[data-scene]'))b.onclick=()=>{leaveRoute();show(b.dataset.scene,prefs[b.dataset.scene]);};
$('landmark').onchange=()=>{const chosen=$('landmark').value;leaveRoute();show(current,chosen);};
$('reset-brain').onclick=()=>{rotation=false;$('roll').setAttribute('aria-pressed','false');frame.classList.remove('rolled');snapBrain();};
$('roll').onclick=()=>{rotation=!rotation;frame.classList.toggle('rolled',rotation);$('roll').setAttribute('aria-pressed',String(rotation));};
$('left').onclick=async()=>(await bodyPromise)?.orbit(-Math.PI/8);$('right').onclick=async()=>(await bodyPromise)?.orbit(Math.PI/8);
$('reset-body').onclick=async()=>(await bodyPromise)?.reset();
$('plate-prev').onclick=()=>{leaveRoute();show('stem',stemKeys[stemKeys.indexOf(landmark)-1]);};$('plate-next').onclick=()=>{leaveRoute();show('stem',stemKeys[stemKeys.indexOf(landmark)+1]);};
function readFragment(){
  const q=new URLSearchParams(location.hash.slice(1));
  routeId=Object.hasOwn(routes,q.get('route'))?q.get('route'):'';
  stepIndex=routeId?Math.max(0,Math.min(routes[routeId].stops.length-1,parseInt(q.get('step'),10)||0)):0;
  const scene=q.get('scene');
  const cp=['caudal','central','rostral'].indexOf(q.get('cut'));cut=cp>=0;cutIndex=cp>=0?cp:1;
  if(routeId&&!Object.hasOwn(first,scene)){routeRender();return;}
  if(Object.hasOwn(first,scene))show(scene,q.get({brain:'landmark',stem:'plate',body:'organ',plate:'plate'}[scene])||first[scene],false);
  else show('brain','medial',false);
  routeRender(false);
}
readFragment();window.addEventListener('hashchange',readFragment);
