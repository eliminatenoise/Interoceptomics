const edges=[[0,1],[0,6],[1,7],[6,7],[0,2],[2,4],[1,3],[3,5],[6,8],[8,10],[7,9],[9,11]];
const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
// Project into the drawing only. Camera angle and scale are controlled by the caller.
export function drawPose(canvas,{current=[],forecast=[],later=[],selected=-1,angle=0,tilt=.14,scale=.22,origin=[0,0,0],cameraAxes=false}={}){
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#edf2ef';ctx.fillRect(0,0,w,h);
  const transform=p=>{
    if(!valid(p))return null;
    const q=p.map((v,i)=>v-origin[i]);
    const [x,y,z]=cameraAxes?[q[0],-q[1],q[2]]:[q[0],q[2],q[1]];
    const c=Math.cos(angle),s=Math.sin(angle),depth=x*s+z*c;
    return [w/2+(x*c-z*s)*scale,h/2-(y*Math.cos(tilt)-depth*Math.sin(tilt))*scale,depth];
  };
  const line=(a,b,color,width,dash=[])=>{if(!a||!b)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.setLineDash([]);};
  const points=current.map(transform),prediction=forecast.map(transform),target=later.map(transform);
  for(const [i,j] of edges.slice().sort(([a,b],[c,d])=>((points[d]?.[2]??0)+(points[c]?.[2]??0))-((points[a]?.[2]??0)+(points[b]?.[2]??0)))){
    line(points[i],points[j],'#495b58',3.5);
    line(prediction[i],prediction[j],'#00765f',1.5,[4,4]);
  }
  for(const [i,p] of points.entries())if(p){
    ctx.fillStyle=i===selected?'#152926':'#5a6a66';ctx.beginPath();ctx.arc(p[0],p[1],i===selected?6:3,0,Math.PI*2);ctx.fill();
    if(prediction[i]){line(p,prediction[i],'#168369',1.5);ctx.strokeStyle='#00765f';ctx.lineWidth=i===selected?3:1.5;ctx.beginPath();ctx.arc(prediction[i][0],prediction[i][1],i===selected?8:3.5,0,Math.PI*2);ctx.stroke();}
    if(target[i]){const [x,y]=target[i],a=i===selected?6:3;line([x-a,y-a],[x+a,y+a],'#b45018',2);line([x-a,y+a],[x+a,y-a],'#b45018',2);}
  }
}
