import {checkpoint,packed} from './model/human-camera-weights.mjs';

const indices=[11,12,13,14,15,16,23,24,25,26,27,28];
const nearby=[6,7,0,1,2,3,0,1,6,7,8,9];
const visible=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
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

export function humanCameraForecast(rows,detectorPoint) {
  const joint=indices.indexOf(detectorPoint),end=rows.at(-1);
  if(joint<0||rows.length!==5||!visible(end.xy[detectorPoint]))throw new Error('Select a visible shoulder, elbow, wrist, hip, knee or ankle.');
  for(let i=0;i<5;i++)if(!Number.isFinite(rows[i].t)||(i&&rows[i].t<=rows[i-1].t))throw new Error('The five frame times must increase.');
  const pose=indices.map(i=>end.xy[i]),seen=pose.filter(visible),origin=pose[joint];
  const center=[0,1].map(a=>seen.reduce((s,v)=>s+v[a],0)/seen.length);
  const radius=Math.sqrt(seen.reduce((s,v)=>s+(v[0]-center[0])**2+(v[1]-center[1])**2,0)/seen.length);
  if(seen.length<3||radius<1e-6||rows.filter(r=>visible(r.xy[detectorPoint])).length<3)
    return {position:[...origin],radius:1,fallback:true,checkpoint};
  const vectors=[],features=[];
  for(const row of rows){
    const dt=row.t-end.t;
    const diff=indices.map((idx,c)=>visible(pose[c])&&visible(row.xy[idx])?[pose[c][0]-row.xy[idx][0],pose[c][1]-row.xy[idx][1]]:null);
    const common=diff.filter(Boolean);const avg=common.length>=2?[0,1].map(a=>common.reduce((s,v)=>s+v[a],0)/common.length):null;
    const raw=[diff[joint],diff[nearby[joint]],diff[joint^1],avg],mask=raw.map(Boolean);
    const v=raw.map(p=>{
      if(!p)return [0,0];
      const factor=.12/Math.max(-dt,.015)/radius;
      const x=p[0]*factor,y=p[1]*factor,gain=Math.min(1,2.5/Math.max(1e-12,Math.hypot(x,y)));
      return [x*gain,y*gain];
    });
    const f=v.map(p=>Math.hypot(...p));
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)f.push(v[i][0]*v[j][0]+v[i][1]*v[j][1]);
    f.push(...mask.map(Number),dt/.12,...Array.from({length:6},(_,i)=>Number(i===Math.floor(joint/2))));
    features.push(Float32Array.from(f));vectors.push(v);
  }
  let tokens=features.map(f=>affine(f,'input',width));
  tokens=block(block(tokens,'blocks.0'),'blocks.1');
  const coeff=weights.ridge,delta=[0,0];
  for(let t=0;t<5;t++){
    const g=affine(norm(tokens[t],'norm'),'gains',4);
    for(let c=0;c<4;c++){
      const a=coeff[(Math.floor(joint/2)*5+t)*4+c]+.75*Math.tanh(g[c]);
      for(let d=0;d<2;d++)delta[d]+=a*vectors[t][c][d];
    }
  }
  return {position:origin.map((val,i)=>val+delta[i]*radius),radius,fallback:false,checkpoint};
}

export function newHumanFeedback() {return {xx:0,xy:0,last:null,count:0,pending:[]};}
export function advanceHumanFeedback(state,frame,observeTarget) {
  const open=[];
  for(const job of state.pending){
    observeTarget(job,frame);
    if(!job.closed){open.push(job);continue;}
    if(!job.match)continue;
    const decay=state.last===null?0:2**(-(frame.t-state.last)/2);
    state.xx*=decay;state.xy*=decay;
    for(let i=0;i<2;i++){
      const difference=(job.human[i]-job.prior[i])/job.radius;
      state.xx+=difference*difference;state.xy+=difference*(job.match.coordinates[i]-job.prior[i])/job.radius;
    }
    state.count++;state.last=frame.t;
  }
  state.pending=open;
}
export function blendHumanForecast(state,packet,human,prior) {
  const weight=Math.max(0,Math.min(1,(state.xy+.0002)/(state.xx+.0004)));
  state.pending.push({packet,human:human.position,prior,radius:human.radius,closed:false,match:null});
  return {position:prior.map((v,i)=>v+weight*(human.position[i]-v)),weight,matured:state.count};
}
