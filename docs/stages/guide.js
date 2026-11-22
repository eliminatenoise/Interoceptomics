import {bindCompanions} from './companions.js';
import {allSteps,groups,visions,technicalPage} from './roadmap.js';
import {sceneInfo,showScene} from './scene.js';
import {selectWalkingLimb} from './recording/view.js';
import {mountWTrack} from './recording/wtrack/view.js';
import {showMazeRecording} from './recording/maze.js';
import {showWristRecording} from './recording/wrist.js';

const $=id=>document.getElementById(id);
const external={
  game:'https://eliminatenoise.github.io/NeuroSurge/',
  model:'https://eliminatenoise.github.io/NeuroTranslation/',
  camera:'https://github.com/eliminatenoise/NeuroSurge/pull/2',
  arm:'https://github.com/eliminatenoise/NeuroTranslation/tree/main/benchmarks/daily-sports-arm',
  atlas:'https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip',
  atlasGuide:'https://github.com/eliminatenoise/Interoceptomics#open-it-in-three-steps'
};
const limbs={
  'left-arm':['Left arm','1'],'left-leg':['Left leg','2'],'right-leg':['Right leg','3'],'right-arm':['Right arm','4']
};
const showCompanions=bindCompanions($('companions'), $('walk-reader'));
const canvas=document.querySelector('.scene canvas');
let current,localOrigin,wtrackMounted = false;
const last={small:'map-brain2body',big:'0.1'};
function link(text,href){
  const a=document.createElement('a');a.textContent=text;a.href=href;return a;
}
function resource(text,href){$('resources').append(link(text,href));}
function renderScene(){
  const t=Number($('moment').value),angle=Number($('angle').value);
  $('moment-out').textContent=t+'%';$('angle-out').textContent=angle+'°';
  const state=showScene(canvas,current,$('limb').value,t/100,angle,$('mode').value);
  $('scene-caption').textContent=state;
}
function row(name,description,source){
  const div=document.createElement('div'), dt=document.createElement('dt'),dd=document.createElement('dd');
  dt.textContent=name;dd.textContent=description;
  if(source)dd.append(' ',link(source[0],source[1]));
  div.append(dt,dd);$('coverage-data').append(div);
}
function updateCoverage(){
  if(current.group.vision!=='small')return;
  const id=$('limb').value,[name,key]=limbs[id],rightArm=id==='right-arm';
  $('coverage-title').textContent=name+' · movement coverage';
  $('coverage-data').replaceChildren();
  row('Game control','Press '+key+' in NeuroSurge to select the '+name.toLowerCase()+'. W/A/S/D move the virtual limb.', ['Play NeuroSurge',external.game]);
  const movement=id.endsWith('arm')?'bend or straighten the elbow':'bend or straighten the knee';
  row('Words to avatar','In the separate F-key game draft, type a supported action such as “'+(id.startsWith('right')?'Bend my right ':'Bend my left ')+(id.endsWith('arm')?'elbow':'knee')+'”. Its built-in map can '+movement+'. Optional on-device dictation supplies the same text. The five-sensor forecast does not take text as input.',['Inspect the movement draft',external.camera]);
  const cameraAction=rightArm?'uses the image to estimate shoulder abduction and elbow bend':id==='left-arm'?'uses the imaged wrist and upper arm to steer the virtual reaching hand and estimate elbow bend':'estimates the selected knee’s bend from the imaged hip, knee and ankle';
  row('Camera preview','In the separate game draft, pressing C opens the camera controls. With permission, the '+name.toLowerCase()+' mode '+cameraAction+'. These are image-plane estimates. The published draft was tested with simulated camera input.',['Inspect the camera draft',external.camera]);
  row('Earlier held-out study',rightArm?'A walking study predicted three future accelerometer axes from a right-arm sensor, 120 milliseconds ahead. Two people were held out. Mean absolute error in the stored sensor units was 0.855 for the Transformer, 0.781 for ridge and 1.182 for repeating the last reading. Ridge won.':'The earlier held-out assessment used a right-arm sensor. The five-placement walking example above includes this limb in its training data.',['Read the right-arm study',external.arm]);
  row('Missing observations','The game pose and camera landmarks do not measure brain activity, spinal signals, muscle electrical activity, force or sensory feedback. Named tasks still need their own synchronized observations.');
}
function renderLocal(){
  const g=current.group, id=current.id, model=current.companion;
  let path='START-HERE.html',help='The local home page lists the four companion viewers.';
  if(g.vision==='small'&&model){
    path='Noninvasive-Experiments/tools/interactive.html?view='+model;
    help='Opens the corresponding interactive human task illustration. Its view is simulated.';
  }else if(model){
    path='Invasive-Experiments/tools/viewer.html?view='+model;
    help='Opens the selected Stage 0–2 illustration in the local 3D viewer.';
  }else if(/^[345]\./.test(id)){
    path='Brain-Agent-Experiments/index.html';
    help='In the local viewer, choose '+id+' '+current.title+'. It opens its first view by default.';
  }else if(g.vision==='small'){
    path='Noninvasive-Experiments/index.html';
    help='The local human-task viewer contains the four proposed human experiments.';
  }
  $('local-link').hidden=!localOrigin;
  if(localOrigin)$('local-link').href=new URL(path,localOrigin+'/').href;
  else $('local-link').removeAttribute('href');
  $('local-help').textContent=help;
}
function render(directionFocus=false){
  let id=location.hash.slice(1);
  current=allSteps.find(s=>s.id===id) ||allSteps[0];
  if(current.id!==id)history.replaceState(null,'','#'+current.id);
  const g=current.group,vision=g.vision,small=vision==='small';
  last[vision]=current.id;
  for(const k of Object.keys(visions)){
    $(k+'-link').href='#'+last[k];
    $(k+'-link').setAttribute('aria-current',String(k===vision));
  }
  const select=$('group-select');
  select.replaceChildren();
  for(const section of groups.filter(item=>item.vision===vision)){
    select.add(new Option(section.title,section.steps[0].id,false,section===g));
  }
  $('step-list').replaceChildren();
  for(const s of g.steps){
    const a=link((/^\d/.test(s.id)?s.id+' · ':'')+s.title,'#'+s.id);
    if(s.id===current.id)a.setAttribute('aria-current','step');
    $('step-list').append(a);
  }
  const ix=allSteps.indexOf(current),same=allSteps.filter(s=>s.group.vision===vision),sidx=same.indexOf(current)+1;
  $('previous').disabled=ix===0;$('next').disabled=ix===allSteps.length-1;
  $('ordinal').textContent=visions[vision].name+' · '+sidx+' of '+same.length;
  $('progress').style.width=(sidx/same.length*100)+'%';
  $('title').textContent=(/^\d/.test(current.id)?current.id+' · ':'')+current.title;
  $('group-name').textContent=g.title;$('question').textContent=current.question;$('evidence').textContent=current.evidence;
  if(current.id==='map-brain2body')
    $('evidence').append(' ',link('See how a shared pulse checks brain and wheel clocks in a mouse recording',
      'https://eliminatenoise.github.io/NeuroTranslation/joint-alpha/probe-wheel-clock/'));
  $('script-link').href='../current/Interoceptomics-Script-Technical.pdf#page='+technicalPage(current.slide);
  $('script-link').textContent='Technical script · slide '+current.slide+' ↗';
  const showWTrack = current.id === '0.2';
  $('wtrack-forecast').hidden = !showWTrack;
  if (showWTrack && !wtrackMounted) {
    wtrackMounted = true;
    mountWTrack($('wtrack-forecast'));
  }
  showMazeRecording(showWTrack);
  showWristRecording(current.id === 'map-brain2body');
  $('coverage').hidden=!small;$('recording').hidden=!small;
  $('limb-wrap').hidden=!small && current.scene!=='body';
  $('mode-wrap').hidden=!(current.scene.includes('replay')||current.scene==='guide');
  $('moment').value='35';$('mode').value='matched';$('angle').value='0';
  const meta=sceneInfo(current.scene);
  $('scene-title').textContent=meta.title;
  $('legend').replaceChildren();
  for(const [color,title] of meta.keys){
    const span=document.createElement('span'),dot=document.createElement('i');
    dot.style.background=color;span.append(dot,title);$('legend').append(span);
  }
  showCompanions(current.id);
  $('resources').replaceChildren();
  if(small || ['0.1','movement-model','composite','5.3'].includes(current.id))
    resource('Inspect recordings in NeuroTranslate 0.0 ↗',external.model);
  if(['motorsensation','map-brain2body'].includes(current.id))
    resource('Compare recorded heart activity, chest vibration and breathing','../inside/');
  if(['motorsensation','humans'].includes(current.id))
    resource('Download the fingertip atlas (ZIP)',
      'https://raw.githubusercontent.com/eliminatenoise/Interoceptomics/main/downloads/fingertip-touch.zip');
  if(current.id==='handler')
    resource('Search and replay 26 tracked hand joints ↗','https://eliminatenoise.github.io/NeuroTranslation/hand-search/');
  if(['map-body2body','movement-model'].includes(current.id))
    resource('Follow 41 markers in three recorded movements ↗','https://eliminatenoise.github.io/NeuroTranslation/whole-body/');
  if(small){
    resource('Run the five-sensor forecast model ↗','https://github.com/eliminatenoise/NeuroTranslation/tree/main/benchmarks/daily-sports-limbs#open-the-local-demo');
    resource('Open the NeuroSurge game ↗',external.game);
  }
  if(['0.1','0.3','0.4','0.5'].includes(current.id))
    resource('Follow a recorded rat and two brain cells on a W-track', '#0.2');
  if(!small){
    if(['myoception','visceroception','composite','5.3','mechanics'].includes(current.id))
      resource('Download Backslash circuits and PDF (ZIP)',
        'https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/backslash/Backslash-Atlas.zip');
    resource('Download the reference brain atlas (ZIP) ↗',external.atlas);
    resource('Atlas instructions and attribution ↗',external.atlasGuide);
  }
  document.title=$('title').textContent+' · '+visions[vision].name+' · Interoceptomics';
  updateCoverage();renderLocal();renderScene();
  if(directionFocus)$('experiment').focus({preventScroll:true});
}
function move(delta){
  const s=allSteps[allSteps.indexOf(current)+delta];
  if(s)location.hash=s.id;
}
$('next').onclick=()=>move(1);$('previous').onclick=()=>move(-1);
$('group-select').onchange=e=>location.hash=e.target.value;
for(const id of ['angle','moment','mode'])$(id).addEventListener('input',renderScene);
$('limb').onchange=()=>{renderScene();updateCoverage();selectWalkingLimb($('limb').value);};
$('local-form').onsubmit=e=>{
  e.preventDefault();
  try{
    const u=new URL($('address').value.trim());
    if(u.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||u.username||u.password||u.search||u.hash||!['/','/START-HERE.html'].includes(u.pathname))throw Error();
    localOrigin=u.origin;
    $('local-status').textContent='Local address set for this tab. The model opens when you select the link.';
  }catch{
    localOrigin=null;
    $('local-status').textContent='Use the local HTTP address printed by the companion launcher, including its port.';
  }
  renderLocal();
};
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('input,select,textarea,[contenteditable=true]'))return;
  if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}
});
window.addEventListener('hashchange',()=>render(true));
render();
new ResizeObserver(renderScene).observe(canvas);
