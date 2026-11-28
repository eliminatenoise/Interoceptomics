import {forecastPose,hipCentred,names,visible} from './model.mjs';
import {drawPose} from './draw.mjs';
const detector=[11,12,13,14,15,16,23,24,25,26,27,28];
const fmt=v=>Math.hypot(...v).toFixed(0);
export function bindSpatial(details){
  const canvas=details.querySelector('canvas'),value=details.querySelector('[data-spatial-value]'),score=details.querySelector('[data-spatial-score]');
  let rows=[],pending=null,angle=0,shown=null,last=-Infinity;
  const paint=()=>drawPose(canvas,shown?{...shown,angle,scale:.13,cameraAxes:true}:undefined);
  function clear(){
    rows=[];pending=null;shown=null;last=-Infinity;
    delete details.dataset.spatialCheckpoint;
    value.textContent='Waiting for five camera frames with visible hips and a selected point.';score.textContent='';paint();
  }
  const method=details.querySelector('[data-spatial-method]');method.onchange=clear;
  details.querySelector('[data-turn-left]').onclick=()=>{angle-=Math.PI/8;paint();};
  details.querySelector('[data-turn-right]').onclick=()=>{angle+=Math.PI/8;paint();};
  function add(frame,index){
    if(!details.open)return;
    const j=detector.indexOf(index),source=frame.xyz;
    if(!Array.isArray(source)||source.length!==12){clear();return;}
    if(rows.length&&(frame.t<=rows.at(-1).t||frame.t-rows.at(-1).t>.240000001))clear();
    const r=hipCentred({t:frame.t,xyz:source});
    const prev=rows.at(-1);rows.push(r);if(rows.length>5)rows.shift();
    if(pending&&r.t+1e-10>=pending.due){
      if(prev&&prev.t<pending.due+1e-10&&r.t>prev.t&&visible(prev.xyz[pending.j])&&visible(r.xyz[pending.j])){
        const k=pending.j,f=Math.max(0,Math.min(1,(pending.due-prev.t)/(r.t-prev.t)));
        const measured=prev.xyz[k].map((v,i)=>v+(r.xyz[k][i]-v)*f);
        score.textContent='Later tracker comparison · '+fmt(measured.map((v,i)=>v-pending.forecast[i]))+' mm apart.';
      }else score.textContent='The later tracker estimate was unavailable.';
      pending=null;
    }
    if(rows.length<5||j<0||!visible(r.xyz[j])){
      value.textContent='Waiting for the selected point and both hips to be visible.';shown={current:r.xyz,selected:j};paint();return;
    }
    if(r.t+1e-10<last+.12)return;
    const out=forecastPose(rows,{method:method.value});last=r.t;
    const chosen=out.joints[j];
    if(!chosen.position||chosen.support==='hold'){
      value.textContent='More visible history is needed for this body point.';shown={current:r.xyz,selected:j};paint();return;
    }
    const delta=chosen.position.map((v,i)=>v-r.xyz[j][i]);
    value.textContent=method.value==='hold'?names[j]+' · keeps the last hip-relative position for 120 ms.':names[j]+' · '+fmt(delta)+' mm forecast movement relative to the hips over 120 ms.';
    details.dataset.spatialMethod=method.value;
    if(method.value==='model')details.dataset.spatialCheckpoint=out.checkpoint;else delete details.dataset.spatialCheckpoint;
    pending={j,due:r.t+.12,forecast:chosen.position};
    shown={current:r.xyz,forecast:out.joints.map(v=>v.position),selected:j};paint();
  }
  clear();return {add,clear};
}
