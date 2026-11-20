'use strict';
const math3 = {
  dot: (a,b) => a.reduce((sum,x,i) => sum+x*b[i],0),
  sub: (a,b) => a.map((x,i) => x-b[i]),
  mean: pts => [0,1,2].map(i => pts.reduce((sum,p) => sum+p[i],0)/pts.length),
};
function prepareCanvas(canvas) {
  const ctx=canvas.getContext('2d'), w=canvas.clientWidth, h=canvas.clientHeight;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  if (canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)) {
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,w,h};
}
function drawBody(canvas, walk, frame, axisMode, camera, anchorFoot) {
  const {ctx,w,h}=prepareCanvas(canvas);
  if (!w||!h) return;
  const {mean,dot,sub}=math3;
  const cloud=walk[axisMode][frame], pelvis=walk.pelvis[axisMode][frame];
  const a=camera.yaw,e=camera.tilt;
  const horizontal=[Math.cos(a),Math.sin(a),0];
  const vertical=[-Math.sin(a)*Math.sin(e),Math.cos(a)*Math.sin(e),Math.cos(e)];
  const toward=[Math.sin(a)*Math.cos(e),-Math.cos(a)*Math.cos(e),Math.sin(e)];
  const scale=Math.min((h-31)/1.67,w/1.72), center=[pelvis[0],pelvis[1],.79];
  const project=p=>{
    const d=sub(p,center);
    return [w*.5+dot(d,horizontal)*scale,h*.49-dot(d,vertical)*scale,dot(d,toward)];
  };
  const backdrop=ctx.createLinearGradient(0,0,0,h);
  backdrop.addColorStop(0,'#152d36'); backdrop.addColorStop(1,'#203a40');
  ctx.fillStyle=backdrop;ctx.fillRect(0,0,w,h);
  function line(a,b,stroke,width=1) {
    ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.beginPath();
    ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
  }
  const x0=Math.floor(pelvis[0]*4)/4, y0=Math.floor(pelvis[1]*4)/4;
  for (let k=-12;k<=12;k++) {
    const x=x0+k*.25,y=y0+k*.25;
    line(project([x,y0-3,0]),project([x,y0+3,0]),'#365158',.7);
    line(project([x0-3,y,0]),project([x0+3,y,0]),'#365158',.7);
  }
  const heel=RECORDINGS.markers.indexOf('R_FCC');
  const strike=walk.events[anchorFoot].strike-1, end=walk.events[anchorFoot].next-1;
  ctx.beginPath();
  for (let f=strike;f<=end;f++) {
    const q=project(walk[axisMode][f][heel]);
    if (f===strike) ctx.moveTo(q[0],q[1]); else ctx.lineTo(q[0],q[1]);
  }
  ctx.setLineDash([2,4]);ctx.strokeStyle='#dfd09b';ctx.lineWidth=1.25;ctx.stroke();ctx.setLineDash([]);
  const shapes=[];
  for(const seg of RECORDINGS.segments) {
    const p=mean(seg.start.map(k=>cloud[k])),q=mean(seg.end.map(k=>cloud[k]));
    const A=project(p),B=project(q),dx=B[0]-A[0],dy=B[1]-A[1];
    const full=Math.hypot(...sub(p,q)),r=seg.radius*scale;
    const projected=Math.min(1,Math.hypot(dx,dy)/(full*scale));
    const major=Math.hypot(full*scale*.5*projected,r*Math.sqrt(1-projected**2));
    const sx=(A[0]+B[0])/2,sy=(A[1]+B[1])/2;
    shapes.push({z:(A[2]+B[2])/2,draw(){
      ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.atan2(dy,dx));
      const g=ctx.createLinearGradient(0,-r,0,r);
      g.addColorStop(0,'#b4c4bf');g.addColorStop(.30,'#92a9aa');g.addColorStop(1,'#485e69');
      ctx.fillStyle=g;ctx.strokeStyle='#233d46';ctx.lineWidth=.65;
      ctx.beginPath();ctx.ellipse(0,0,Math.max(1,major),Math.max(1,r),0,0,2*Math.PI);ctx.fill();ctx.stroke();ctx.restore();
    }});
  }
  for (const face of RECORDINGS.torsoFaces) {
    const points=face.map(k=>project(cloud[k]));
    const [a,b,c]=face.map(k=>cloud[k]),u=sub(b,a),v=sub(c,a);
    const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const light=Math.abs(dot(normal,[-.3,-.5,.8]))/(Math.hypot(...normal)||1);
    const tint=[74,96,103].map((n,i)=>Math.round(n+light*[51,50,43][i]));
    shapes.push({z:points.reduce((total,q)=>total+q[2],0)/3,draw(){
      ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);ctx.lineTo(points[1][0],points[1][1]);
      ctx.lineTo(points[2][0],points[2][1]);ctx.closePath();ctx.fillStyle='rgb('+tint.join(',')+')';
      ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.55;ctx.stroke();
    }});
  }
  for (const [i,label] of RECORDINGS.markers.entries()) {
    const q=project(cloud[i]),r=Math.max(1.65,Math.min(3.1,.014*scale));
    const color=label.startsWith('L_')?'#70cff3':label.startsWith('R_')?'#ffbb66':'#eeedcf';
    shapes.push({z:q[2]+.008,draw(){
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(q[0],q[1],r,0,2*Math.PI);ctx.fill();
      ctx.strokeStyle='#21343b';ctx.lineWidth=.65;ctx.stroke();
    }});
  }
  shapes.sort((p,q)=>p.z-q.z).forEach(s=>s.draw());
  ctx.font='11px system-ui, sans-serif';ctx.fillStyle='#c6d6d0';
  ctx.fillText(axisMode==='travel'?'Travel axes':'Lab axes',8,16);
  const base=[w-34,h-22];
  for (const [vec,label,col] of [[[1,0,0],axisMode==='travel'?'F':'X','#ffbc76'],
                               [[0,1,0],axisMode==='travel'?'L':'Y','#85d7d9'],
                               [[0,0,1],'Z','#c3cdd4']]) {
    const end=[base[0]+dot(vec,horizontal)*18,base[1]-dot(vec,vertical)*18];
    if(Math.hypot(end[0]-base[0],end[1]-base[1])<2) continue;
    line(base,end,col,1.3);ctx.fillStyle=col;ctx.fillText(label,end[0]+1,end[1]-2);
  }
}
