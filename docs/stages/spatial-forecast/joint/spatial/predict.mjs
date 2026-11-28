import {forecastPose} from './model.mjs';
import {pairedHistory} from './stereo.mjs';
import {pairedFeedback} from './paired-feedback.mjs';
export function inputOptions(record){
  if(!record||record.unit!=='mm')throw Error('Set unit to mm and supply coordinates in millimetres or a calibrated pair.');
  if(Boolean(record.frames)===Boolean(record.views))throw Error('Choose either spatial frames or two camera views for one input.');
  const reference=record.reference??'lab';
  if(!['lab','hips'].includes(reference))throw Error('Choose lab or hips for the reference.');
  const method=record.method??(record.views&&reference!=='hips'?'image_feedback':'model');
  if(!['model','linear','hold','velocity','image_feedback'].includes(method))throw Error('Choose a supported forecast method.');
  if(method==='image_feedback'&&(!record.views||reference==='hips'))throw Error('Image tracking feedback requires two calibrated views in the lab frame.');
  if(record.use_muscles!==undefined&&typeof record.use_muscles!=='boolean')throw Error('Set use_muscles to true or false.');
  if(record.use_muscles===true&&(record.views||method!=='model'))throw Error('Muscle readings require the trained model and supplied 3D poses.');
  return {reference,method,useMuscles:record.use_muscles===true};
}
export function predictInput(record){
  const {method,reference,useMuscles}=inputOptions(record);
  if(method==='image_feedback')return pairedFeedback(record.views);
  const frames=record.views?pairedHistory(record.views):record.frames;
  return forecastPose(frames,{method,relative:reference==='hips',useMuscles});
}
