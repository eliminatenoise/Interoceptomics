import {checkpoint,packed,medianVolts,linear} from './weights.mjs';
export {checkpoint};
export const names=['Left shoulder','Right shoulder','Left elbow','Right elbow','Left wrist','Right wrist','Left hip','Right hip','Left knee','Right knee','Left ankle','Right ankle'];
export const muscleNames=['Right tibialis anterior','Right soleus','Right medial gastrocnemius','Right vastus medialis','Right rectus femoris','Right semitendinosus','Right gluteus maximus','Right gluteus medius'];
const nearby=[6,7,0,1,2,3,0,1,6,7,8,9];
const axes=[0,1,2];
export const visible=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const weights=Object.fromEntries(Object.entries(packed).map(([key,text])=>{
  const b=Uint8Array.from(atob(text),c=>c.charCodeAt(0)),data=new DataView(b.buffer);
  const a=new Float32Array(b.length/4);for(let i=0;i<a.length;i++)a[i]=data.getFloat32(4*i,true);
  return [key,a];
}));
const width=32;
function affine(x,name,size) {
  const w=weights[name+'.weight'],out=Float64Array.from(weights[name+'.bias']);
  for(let i=0;i<size;i++)for(let j=0;j<x.length;j++)out[i]+=w[i*x.length+j]*x[j];
  return out;
}
function norm(x,name) {
  const m=x.reduce((a,b)=>a+b,0)/x.length,v=x.reduce((a,b)=>a+(b-m)**2,0)/x.length;
  return Float64Array.from(x,(n,i)=>(n-m)/Math.sqrt(v+1e-5)*weights[name+'.weight'][i]+weights[name+'.bias'][i]);
}
function gelu(x) {
  const a=Math.abs(x)/Math.sqrt(2),t=1/(1+.3275911*a);
  const erfc=(((((1.061405429*t-1.453152027)*t+1.421413741)*t-.284496736)*t+.254829592)*t)*Math.exp(-a*a);
  return .5*x*(x>=0?2-erfc:erfc);
}
function block(tokens,name) {
  const qkv=tokens.map(x=>affine(norm(x,name+'.norm1'),name+'.qkv',width*3));
  const attended=tokens.map((x,t)=>{
    const values=new Float64Array(width);
    for(let h=0;h<4;h++){
      const offset=8*h,logits=new Float64Array(5);
      for(let k=0;k<5;k++)for(let d=0;d<8;d++)logits[k]+=qkv[t][offset+d]*qkv[k][width+offset+d]/Math.sqrt(8);
      const max=Math.max(...logits);let sum=0;
      for(let k=0;k<5;k++){logits[k]=Math.exp(logits[k]-max);sum+=logits[k];}
      for(let k=0;k<5;k++)for(let d=0;d<8;d++)values[offset+d]+=logits[k]/sum*qkv[k][2*width+offset+d];
    }
    const update=affine(values,name+'.mix',width);
    return x.map((val,i)=>val+update[i]);
  });
  return attended.map(x=>{
    const ff=affine(norm(x,name+'.norm2'),name+'.ff1',width*2).map(gelu);
    const update=affine(ff,name+'.ff2',width);return x.map((val,i)=>val+update[i]);
  });
}

export function hipCentred(frame) {
  const [l,r]=frame.xyz.slice(6,8);
  const center=visible(l)&&visible(r)?axes.map(i=>(l[i]+r[i])/2):null;
  return {...frame,xyz:frame.xyz.map(p=>center&&visible(p)?axes.map(i=>p[i]-center[i]):null)};
}
export function checkHistory(frames) {
  if(!Array.isArray(frames)||frames.length!==5)throw new Error('Supply five chronological frames.');
  for(let i=0;i<5;i++){
    const frame=frames[i],dt=i?frame.t-frames[i-1].t:0;
    if(!Number.isFinite(frame.t)||(i&&(dt<=0||dt>.240000001)))throw new Error('Supply increasing times in seconds with at most 240 ms between frames.');
    if(!Array.isArray(frame.xyz)||frame.xyz.length!==12||!frame.xyz.every(p=>p===null||visible(p)))throw new Error('Supply 12 three-dimensional points in millimetres. Use null for each missing point.');
    if(frame.rms_volts!=null&&(!Array.isArray(frame.rms_volts)||frame.rms_volts.length!==8||!frame.rms_volts.every(v=>v===null||(Number.isFinite(v)&&v>=0))))throw new Error('Muscle readings need eight nonnegative RMS voltages or nulls.');
  }
}
function electrical(frame,joint) {
  const values=frame.rms_volts??Array(8).fill(null),valid=values.map(v=>v!==null);
  const magnitude=values.map((v,i)=>valid[i]?Math.min(8,Math.log1p(v/medianVolts[i])):0);
  return [...magnitude,...valid.map(Number),valid.some(Boolean)?(joint%2?1:-1):0];
}
function forecast(frames,joint,method,useMuscles){
  const end=frames[4],pose=end.xyz,seen=pose.filter(visible),origin=pose[joint];
  if(!visible(origin))return {position:null,support:'missing'};
  if(method==='hold')return {position:[...origin],support:'observed'};
  const center=axes.map(d=>seen.reduce((s,p)=>s+p[d],0)/seen.length);
  const radius=Math.sqrt(seen.reduce((s,p)=>s+axes.reduce((n,d)=>n+(p[d]-center[d])**2,0),0)/seen.length);
  if(seen.length<3||radius<1e-6||frames.filter(r=>visible(r.xyz[joint])).length<3)return {position:[...origin],support:'hold'};
  if(method==='velocity'){
    const earlier=frames.slice(0,4).reverse().find(r=>visible(r.xyz[joint]));
    return {position:axes.map(d=>origin[d]+(origin[d]-earlier.xyz[joint][d])*.12/(end.t-earlier.t)),support:'forecast'};
  }
  const vectors=[],features=[];
  for(const row of frames){
    const dt=row.t-end.t;
    const diff=pose.map((p,i)=>visible(p)&&visible(row.xyz[i])?axes.map(d=>p[d]-row.xyz[i][d]):null);
    const both=diff.filter(Boolean);const avg=both.length>=2?axes.map(d=>both.reduce((s,p)=>s+p[d],0)/both.length):null;
    const raw=[diff[joint],diff[nearby[joint]],diff[joint^1],avg],mask=raw.map(Boolean);
    const v=raw.map(p=>{
      if(!p)return [0,0,0];
      const scale=.12/Math.max(-dt,.015)/radius;
      const gain=Math.min(1,2.5/Math.max(1e-12,Math.hypot(...p)*scale));
      return p.map(n=>n*scale*gain);
    });
    const inputs=v.map(p=>Math.hypot(...p));
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)inputs.push(axes.reduce((s,d)=>s+v[i][d]*v[j][d],0));
    inputs.push(...mask.map(Number),dt/.12,...Array.from({length:6},(_,k)=>Number(k===Math.floor(joint/2))));
    vectors.push(v);features.push(Float32Array.from(inputs));
  }
  let gains=null;
  if(method==='model'){
    let tokens=features.map((f,t)=>{
      const x=affine(f,'input',width);
      if(useMuscles){
        const m=electrical(frames[t],joint);const w=weights['muscle_projection.weight'];
        for(let a=0;a<width;a++)for(let b=0;b<17;b++)x[a]+=m[b]*w[a*17+b];
      }
      return x;
    });
    tokens=block(block(tokens,'blocks.0'),'blocks.1');
    gains=tokens.map(token=>affine(norm(token,'norm'),'gains',4));
  }else if(method!=='linear')throw new Error('Choose model, linear, velocity or hold.');
  const coeff=gains?weights.ridge:linear;
  const delta=[0,0,0];
  for(let t=0;t<5;t++)for(let c=0;c<4;c++){
    const a=coeff[(Math.floor(joint/2)*5+t)*4+c]+(gains?.[t] ? .75*Math.tanh(gains[t][c]):0);
    for(let d=0;d<3;d++)delta[d]+=Math.fround(vectors[t][c][d])*a;
  }
  return {position:axes.map(d=>origin[d]+radius*delta[d]),support:'forecast'};
}
export function forecastPose(frames,{method='model',useMuscles=false,relative=false}={}) {
  checkHistory(frames);
  if(!['model','linear','velocity','hold'].includes(method))throw new Error('Unknown method.');
  const history=relative?frames.map(hipCentred):frames;
  return {horizon_ms:120,reference:relative?'hip midpoint':'input axes',checkpoint,
    joints:names.map((_,joint)=>forecast(history,joint,method,useMuscles))};
}
