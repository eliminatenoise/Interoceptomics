import {observation,endpoint,observeTarget} from '../landmark.mjs';
import {predictBrowserTask} from '../browser-forecast.mjs';
import {localMotion} from '../forecast-controls.mjs';
import {newCameraHistory,advanceCameraHistory,cameraForecasts,queueCameraForecast} from '../adaptive-motion.mjs';
import {humanCameraForecast,newHumanFeedback,advanceHumanFeedback,blendHumanForecast} from '../human-camera.mjs';
import {camera,triangulate} from './stereo.mjs';
const indices=[11,12,13,14,15,16,23,24,25,26,27,28];
function state(){return {rows:[],visible:false,last:-Infinity,previous:newCameraHistory(),human:newHumanFeedback()};}
function step(points,t,id,states){
  const xy=Array(33).fill(null);
  if(!Array.isArray(points)||![12,33].includes(points.length))throw Error('Supply 12 named sites or all 33 MediaPipe image landmarks.');
  points.forEach((p,i)=>{
    if(p!==null&&(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw Error('Image points must be finite pairs or null.');
    xy[points.length===33?i:indices[i]]=p;
  });
  const frame={t,id,xy};
  return indices.map((joint,k)=>{
    let h=states[k];
    if(h.rows.length&&(t-h.rows.at(-1).t>.240000001||(h.visible&&!xy[joint])))h=states[k]=state();
    h.visible=!!xy[joint];h.rows.push(frame);if(h.rows.length>5)h.rows.shift();
    advanceCameraHistory(h.previous,frame,observeTarget);advanceHumanFeedback(h.human,frame,observeTarget);
    if(!h.visible||t<h.last+.12-1e-9)return null;
    const packet=observation(h.rows,joint);if(!packet)return null;
    const prior=h.rows.slice(0,-1).findLast(r=>r.xy[joint]);
    const velocity=packet.origin.map((v,i)=>v+(v-prior.xy[joint][i])*.12/(t-prior.t));
    const net=predictBrowserTask('landmark_motion',packet.X);
    const base={persistence:packet.origin,velocity,attention:endpoint(packet,net.prediction[0]),...localMotion(h.rows,joint,.12)};
    const {camera_blend}=cameraForecasts(h.previous,base);
    const human=humanCameraForecast(h.rows,joint);const guess=blendHumanForecast(h.human,packet,human,camera_blend);
    queueCameraForecast(h.previous,packet,base);h.last=t;
    return {xy:guess.position,origin:packet.origin,pastComparisons:guess.matured};
  });
}
export function createPairedFeedback(views){
  if(!Array.isArray(views)||views.length!==2||views.some(v=>!Array.isArray(v.frames))||views[0].frames.length<5||views[1].frames.length!==views[0].frames.length)throw Error('Provide the same sequence of at least five frames for both cameras.');
  const [a,b]=views.map(v=>camera(v.calibration)),states=views.map(()=>indices.map(()=>state()));
  const saved=[],spatialHistory=[];let previous=-Infinity;
  function advance(i){
    const l=views[0].frames[i],r=views[1].frames[i];
    if(!Number.isFinite(l.t)||!Number.isFinite(r.t)||Math.abs(l.t-r.t)>1e-6||l.t<=previous)throw Error('Each camera needs matching, increasing times in seconds.');
    if(l.t-previous>.240000001)spatialHistory.length=0;
    const left=step(l.xy,l.t,i+1,states[0]),right=step(r.xy,r.t,i+1,states[1]);
    const xy=(frame,k)=>frame.xy[frame.xy.length===33?indices[k]:k];
    const current=indices.map((_,k)=>triangulate(xy(l,k),xy(r,k),a,b));
    spatialHistory.push(current);if(spatialHistory.length>5)spatialHistory.shift();previous=l.t;
    const enoughSites=current.filter(Boolean).length>=3;
    return {method:'image_feedback',horizon_ms:120,reference:'calibrated room',joints:indices.map((_,k)=>{
      if(!left[k]||!right[k])return {position:null,support:'no shared issue'};
      if(!enoughSites||spatialHistory.length<5||!current[k]||spatialHistory.filter(x=>x[k]).length<3)return {position:null,support:'insufficient paired history'};
      const future=triangulate(left[k].xy,right[k].xy,a,b);
      return {position:future??current[k],support:future?'forecast':'hold',earlierComparisons:[left[k].pastComparisons,right[k].pastComparisons]};
    })};
  }
  return {at(i){
    if(!Number.isInteger(i)||i<0||i>=views[0].frames.length)throw Error('Choose a frame within the input sequence.');
    while(saved.length<=i)saved.push(advance(saved.length));
    return saved[i];
  }};
}
export function pairedFeedback(views){return createPairedFeedback(views).at(views[0].frames.length-1);}
