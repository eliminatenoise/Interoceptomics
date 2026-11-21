/* Draw the cropped MakeHuman surface and a transparent plate in one camera frame. */
const TouchScene = (() => {
  const dot = (a,b) => a.reduce((v,x,i) => v+x*b[i],0);
  const minus = (a,b) => a.map((x,i) => x-b[i]);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normal = v => v.map(n => n/(Math.hypot(...v)||1));
  const normals = Finger.points.map(() => [0,0,0]);
  Finger.faces.slice(0,Finger.capStart).forEach(([a,b,c]) => {
    const n = cross(minus(Finger.points[b],Finger.points[a]),minus(Finger.points[c],Finger.points[a]));
    for(const i of [a,b,c]) for(let j=0;j<3;j++) normals[i][j]+=n[j];
  });
  const light=normal([-.35,.85,.75]);
  const lights=normals.map(n=>.67+.38*Math.max(-.4,dot(normal(n),light)));
  const smooth=fingerRenderer(Finger,normals.map(normal));
  const pigment=(rgb,t)=>'rgb('+rgb.map(x=>Math.min(255,Math.round(x*t))).join(',')+')';

  function canvasSize(canvas) {
    const w=canvas.clientWidth,h=canvas.clientHeight,scale=Math.min(window.devicePixelRatio||1,2);
    const px=Math.round(w*scale),py=Math.round(h*scale);
    if(canvas.width!==px||canvas.height!==py){canvas.width=px;canvas.height=py;}
    const ctx=canvas.getContext('2d');ctx.setTransform(scale,0,0,scale,0,0);
    ctx.clearRect(0,0,w,h);
    return {ctx,w,h};
  }

  function draw(canvas, degrees,progress){
    const {ctx,w,h}=canvasSize(canvas);
    if(!w||!h)return;
    const yaw=degrees*Math.PI/180, c=Math.cos(yaw), s=Math.sin(yaw);
    const tilt=.34,ct=Math.cos(tilt),st=Math.sin(tilt);
    const scale=Math.min(w/7.5,h/4.45);
    const project=([x,y,z])=>{
      x+=.75;y-=1.15;
      const x2=c*x+s*z,z2=-s*x+c*z;
      return [w/2+x2*scale,h/2-(ct*y-st*z2)*scale,st*y+ct*z2];
    };
    const items=[];
    function polygon(points,fill,stroke,width=.6){
      const depth=points.reduce((sum,p)=>sum+p[2],0)/points.length;
      items.push({depth,paint(){
        ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
        ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
      }});
    }
    const pts=smooth?null:Finger.points.map(project);
    // Painter's algorithm also works in browsers without WebGL.
    if(!smooth) Finger.faces.forEach((face,i)=>{
      const coords=face.map(k=>pts[k]), [a,b,d]=coords;
      if((b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0])>=0)return;

      const base=i>=Finger.capStart?[147,121,106]:[220,162,129];
      // Interpolate vertex lighting across each face for a smooth organic surface.
      const l=face.map(k=>lights[k]);
      const denominator=(b[0]-a[0])*(d[1]-a[1])-(d[0]-a[0])*(b[1]-a[1]);
      const gx=((l[1]-l[0])*(d[1]-a[1])-(l[2]-l[0])*(b[1]-a[1]))/denominator;
      const gy=((b[0]-a[0])*(l[2]-l[0])-(d[0]-a[0])*(l[1]-l[0]))/denominator;
      const normSq=gx*gx+gy*gy;
      const min=Math.min(...l),max=Math.max(...l);
      let fill=pigment(base,l[0]);
      if(i<Finger.capStart && max-min>.002 && normSq>1e-10) {
        const at=v=>[a[0]+gx*(v-l[0])/normSq,a[1]+gy*(v-l[0])/normSq];
        fill=ctx.createLinearGradient(...at(min),...at(max));
        fill.addColorStop(0,pigment(base,min));fill.addColorStop(1,pigment(base,max));
      }
      polygon(coords,fill,fill,1.1);
    });
    const offset=(progress-.5)*.75;
    const left=-2+offset,right=2.2+offset,front=1.72,back=-1.72;
    const glass=(p,fill,edge)=>polygon(p.map(project),fill,edge,1.1);
    glass([[left,-.15,front],[right,-.15,front],[right,0,front],[left,0,front]],'rgba(117,184,172,.40)','#a1d1c6');
    glass([[right,-.15,front],[right,-.15,back],[right,0,back],[right,0,front]],'rgba(101,156,146,.34)','#85b7ae');
    glass([[left,-.15,back],[left,-.15,front],[left,0,front],[left,0,back]],'rgba(101,156,146,.30)','#85b7ae');
    glass([[left,0,back],[right,0,back],[right,0,front],[left,0,front]],'rgba(153,211,199,.16)','rgba(172,223,210,.70)');
    // A soft illustrative contact shadow sits on the plate below the pad.
    const contact=project([-.17,.013,-.03]),rim=project([.57,.013,-.03]);
    const shadowRadius=Math.max(4,Math.hypot(rim[0]-contact[0],rim[1]-contact[1]));
    const shadow=ctx.createRadialGradient(contact[0],contact[1],0,contact[0],contact[1],shadowRadius);
    shadow.addColorStop(0,'rgba(13,32,27,.46)');shadow.addColorStop(1,'rgba(13,32,27,0)');
    const footprint=Array.from({length:28},(_,i)=>{const a=i*2*Math.PI/28;return project([-.17+.9*Math.cos(a),.014,-.03+.51*Math.sin(a)]);});
    polygon(footprint,shadow,null);
    // Move the arrow with the plate, along its actual axis in the illustration.
    const arrow=[[.00,0,1.19],[.86,0,1.19],[.86,0,1.34],[1.28,0,1.12],[.86,0,.90],[.86,0,1.05],[0,0,1.05]];
    glass(arrow.map(([x,y,z])=>[x+offset,y+.02,z]),'#aad8c8','#aad8c8');
    items.sort((a,b)=>a.depth-b.depth).forEach(item=>item.paint());
    if(smooth)smooth(ctx,w,h,scale,c,s,ct,st);
    canvas.dataset.renderer=smooth?'WebGL':'Canvas 2D';
    ctx.fillStyle='rgba(29,49,43,.88)';ctx.fillRect(8,6,145,22);
    ctx.fillStyle='#e7eee6';ctx.font='500 12px system-ui,sans-serif';ctx.fillText('Right index finger · detail',14,21);
    ctx.fillStyle='#b4d9ca';ctx.fillText('Arrow · glass travel',14,h-13);
  }
  return {draw,canvasSize};
})();
