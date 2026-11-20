// Original, unitless geometry. The drawn paths are specified here, never inferred from a recording.
const mint = '#73e9bd', amber = '#ffc878', blue = '#8bc4ff', paper = '#e0eee5';
const models = {
  body: ['Articulated movement', [[mint,'Selected limb'],[paper,'Linked segments']]],
  juggle: ['Hand-to-hand timing', [[mint,'Selected limb'],[amber,'Programmed object']]],
  box: ['Response to a cue', [[mint,'Selected limb'],[amber,'Screen cue']]],
  target: ['Two-hand timing', [[mint,'Selected limb'],[amber,'Virtual target']]],
  straight: ['Straight corridor', [[mint,'Route position'],[blue,'Entrance'],[amber,'Exit']]],
  winding: ['Winding corridor', [[mint,'Route position'],[blue,'Entrance'],[amber,'Exit']]],
  guide: ['Follow a timed reference', [[mint,'Task position'],[amber,'Guide position']]],
  compare: ['Two comparison groups', [[blue,'Reference group'],[mint,'Comparison group']]],
  mechanics: ['A constrained hinge', [[paper,'Linked segments'],[mint,'Endpoint'],[amber,'Available arc']]],
  loop: ['The sensorimotor loop', [[mint,'Motor path'],[amber,'Sensory return']]]
};
const straightPath = [[-3,0],[3,0]];
const windingPath = [[-3,-1.5],[-1.5,-1.5],[-1.5,1.5],[.2,1.5],[.2,-1.5],[1.7,-1.5],[1.7,.8],[3,.8]];
const limbNames = {'left-arm':'Left arm','right-arm':'Right arm','left-leg':'Left leg','right-leg':'Right leg'};
function atDistance(path,t) {
  const lengths=path.slice(1).map(([x,z],i)=>Math.hypot(x-path[i][0],z-path[i][1]));
  let distance=t*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){
    if(distance<=lengths[i] || i===lengths.length-1){
      const f=distance/lengths[i], a=path[i], b=path[i+1];
      return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
    }
    distance-=lengths[i];
  }
}
export function sceneInfo(scene) {
  const k=scene.replace('-replay','');
  const [title,keys]=models[k];
  return {title, keys:scene.endsWith('-replay')?[...keys,[paper,'Replay position']]:keys};
}
export function showScene(canvas, step, limb, t, angle, mode) {
  const {width,height}=canvas.getBoundingClientRect();
  if(!width || !height) return '';
  const dpr=Math.min(devicePixelRatio || 1,2);
  const w=Math.round(width*dpr),h=Math.round(height*dpr);
  if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;}
  const ctx=canvas.getContext('2d');
  if(!ctx) return 'The interactive canvas is unavailable. Use the step description and evidence below.';
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const base=step.scene.replace('-replay',''), human=['body','juggle','box','target'].includes(base);
  const az=(angle+(human?-13:-22))*Math.PI/180, el=human?.14:.44;
  const scale=Math.min(width/(human?7.8:9.4),height/(human?3.95:4.6));
  const lift=human?1.65:.58;
  function project([x,y,z]){
    const u=x*Math.cos(az)-z*Math.sin(az), v=x*Math.sin(az)+z*Math.cos(az);
    return [width*.5+u*scale,height*.5-((y-lift)*Math.cos(el)-v*Math.sin(el))*scale];
  }
  function stroke(points,color,weight=1,dash=[]){
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.setLineDash(dash);
    points.map(project).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);
  }
  function face(points,color){
    ctx.beginPath();ctx.fillStyle=color;
    points.map(project).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
  }
  function orb(p,rad,color){
    const [x,y]=project(p),r=Math.max(2,rad*scale);
    const g=ctx.createRadialGradient(x-r*.32,y-r*.4,r*.05,x,y,r);
    g.addColorStop(0,'#f1fff2');g.addColorStop(.38,color);g.addColorStop(1,color+'96');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();
  }
  function label(p,text,color=paper){
    const [x,y]=project(p);ctx.fillStyle=color;ctx.font='600 '+(width<480?10:12)+'px system-ui, sans-serif';ctx.textAlign='center';ctx.fillText(text,x,y);
  }
  function circle(x,y,z,r,color){
    stroke(Array.from({length:41},(_,i)=>[x+r*Math.cos(i*Math.PI/20),y,z+r*Math.sin(i*Math.PI/20)]),color,2);
  }
  for(let i=-4;i<=4;i+=.5)stroke([[i,0,-2.1],[i,0,2.1]],'#739a8c2c');
  for(let i=-2;i<=2;i+=.5)stroke([[-4,0,i],[4,0,i]],'#739a8c2c');
  ctx.lineCap='round';ctx.lineJoin='round';
  const ref=Math.max(0,mode==='delayed'?t-.2:t), pct=Math.round(t*100);
  if(base==='straight'||base==='winding'){
    const path=base==='straight'?straightPath:windingPath, halfWidth=.35, walls=[];
    const offsets=path.slice(1).map(([x,z],i)=>{
      const dx=x-path[i][0],dz=z-path[i][1],len=Math.hypot(dx,dz);
      return [-dz/len*halfWidth,dx/len*halfWidth];
    });
    for(const side of [-1,1]){
      const wall=path.map(([x,z],i)=>{
        const a=offsets[Math.max(0,i-1)], b=offsets[Math.min(i,offsets.length-1)];
        const f=(a[0]===b[0]&&a[1]===b[1])?.5:1;
        return [x+side*(a[0]+b[0])*f,z+side*(a[1]+b[1])*f];
      });
      for(let i=1;i<wall.length;i++){
        const [x,z]=wall[i-1],[u,v]=wall[i];
        walls.push([[x,0,z],[u,0,v],[u,.25,v],[x,.25,z]]);
      }
    }
    for(const pts of walls){face(pts,'#abd9cc30');stroke(pts.slice(2),'#a8e4d4aa',1.7);}
    stroke(path.map(([x,z])=>[x,.02,z]),'#91b5adad',1.4,[3,5]);
    for(const [p,color] of [[path[0],blue],[path.at(-1),amber]])circle(p[0],.015,p[1],.23,color);
    const [x,z]=atDistance(path,t);orb([x,.17,z],.17,mint);
    if(step.scene.endsWith('-replay')&&mode!=='off'){
      const [rx,rz]=atDistance(path,ref);circle(rx,.11,rz,.25,paper);
    }
    return 'Prescribed route '+pct+'% complete.'+(step.scene.endsWith('-replay')?' Replay '+(mode==='off'?'off.':Math.round(ref*100)+'% through the same route.'):'')+' No animal position has been recorded.';
  }
  if(human){
    const flex=Math.sin(t*Math.PI), shoulderY=2.45;
    const neck=[0,2.67,0], pelvis=[0,1.53,0];
    face([[-.4,shoulderY,0],[.4,shoulderY,0],[.24,1.55,0],[-.24,1.55,0]],'#87b6aa55');
    stroke([pelvis,neck],paper,3);orb([0,2.97,0],.22,paper);
    const ends={};
    for(const [side,s] of [['left',1],['right',-1]]){
      for(const part of ['arm','leg']){
        const key=side+'-'+part,on=key===limb,arm=part==='arm';
        const symmetric=arm&&['juggle','target'].includes(base);
        const f=on?flex:symmetric?.48*(1+Math.sin(t*2*Math.PI+s)):0;
        const joint=arm?[s*.42,shoulderY,0]:[s*.22,1.55,0];
        const mid=arm?[s*(.59+.29*f),1.91+.2*f,.50*f]:[s*(.24+.13*f),.83+.16*f,.54*f];
        const end=arm?[s*(.65+.44*f),1.37+.78*f,.80*f]:[s*(.25+.19*f),.13+.36*f,.72*f+.1];
        const color=on?mint:'#a8c3b9';
        stroke([[0,joint[1],0],joint,mid,end],color,Math.max(4,scale*.09));
        for(const p of [joint,mid,end])orb(p,p===end?.105:.095,color);
        ends[key]=end;
      }
    }
    if(base==='juggle'){
      const x=(t-.5)*2.2;orb([x,2.15+1.08*Math.sin(Math.PI*t),.55],.13,amber);
    }
    if(base==='box'||base==='target'){
      const x=base==='box'?1.55:-1.48,color=amber;
      const pts=Array.from({length:49},(_,i)=>[x+.3*Math.cos(i*Math.PI/24),2.04+.3*Math.sin(i*Math.PI/24),.75]);
      stroke(pts,color,2);
      if(base==='target')stroke([ends[limb],[x,2.04,.75]],'#ffc87899',1,[3,5]);
    }
    return limbNames[limb]+' selected. The programmed pose is at '+pct+'% of the task. The sketch runs without a camera, trained model or participant recording.';
  }
  if(base==='loop'){
    const nodes=[[-2.8,.75,0],[-1.4,.75,0],[0,.75,0],[1.4,.75,0],[2.8,.75,0]];
    const names=['Brain','Spine','Peripheral','Muscle','Motion'];
    stroke(nodes,mint,3);
    const back=[[2.8,.75,0],[2.8,.25,1.4],[-2.8,.25,1.4],nodes[0]];
    stroke(back,amber,2,[5,4]);label([0,.1,1.5],'Sensory feedback',amber);
    nodes.forEach((p,i)=>{orb(p,.13,paper);label([p[0],p[1]+.35,p[2]],names[i]);});
    const locations=[...nodes,...back.slice(1)], dist=t*(locations.length-1);
    const n=Math.min(locations.length-2,Math.floor(dist));
    const point=locations[n].map((v,i)=>v+(locations[n+1][i]-v)*(dist-n));
    orb(point,.20,n<4?mint:amber);
    return 'The marker follows the '+(n<4?'motor path':'sensory return')+'. Its timing is invented. Each link would require its own observation.';
  }
  if(base==='compare'){
    const sample=Math.min(3,Math.floor(t*4));
    for(const [i,x0,color] of [[0,-1.65,blue],[1,1.65,mint]]){
      circle(x0,0,0,.94,color+'99');
      for(let n=0;n<4;n++){
        const x=x0+.4*(n%2?1:-1), z=n<2?-.32:.32;
        const p=[x,.36,z];stroke([[x,0,z],p],color,2);orb(p,n===sample?.22:.125,color);
      }
      label([x0,1.1,0],i?'Comparison':'Reference');
    }
    return 'Comparison item '+(sample+1)+' of four highlighted in each group. These are placeholders for paired observations. No biological effect size is assigned.';
  }
  if(base==='mechanics'){
    const theta=.18+1.55*t, pivot=[0,.45,0], end=[2.1*Math.cos(theta),.45+2.1*Math.sin(theta),0];
    stroke(Array.from({length:33},(_,i)=>{const a=.18+1.55*i/32;return [2.1*Math.cos(a),.45+2.1*Math.sin(a),0];}),amber,2,[4,5]);
    stroke([[-2,.45,0],pivot,end],paper,8);orb(pivot,.18,blue);orb(end,.18,mint);
    return 'Geometric hinge angle '+Math.round(theta*180/Math.PI)+'°. The arc shows the allowed positions in this drawing. It contains no measured torque, force or muscle activation.';
  }
  function trace(u,z){return [(u-.5)*5.7,.7+.4*Math.sin(2*Math.PI*u),z];}
  for(const [z,c,name] of [[-.7,mint,'Task'],[.9,amber,'Guide']]){
    const off=z>0&&mode==='off';stroke(Array.from({length:41},(_,i)=>trace(i/40,z)),off?'#718680':c,2,off?[3,6]:[]);
    if(!off)orb(trace(z>0?ref:t,z),.17,c);
    label([-2.4,1.22,z],name,c);
  }
  return 'Task marker '+pct+'%. Guide '+(mode==='off'?'off':Math.round(ref*100)+'%')+'. The two prescribed timelines illustrate a comparison. Neither is a recording or a learning result.';
}
