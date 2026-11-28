const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const mul=(a,s)=>a.map(v=>v*s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const transpose=m=>m[0].map((_,i)=>m.map(row=>row[i]));
const rowDot=(v,m)=>transpose(m).map(col=>dot(v,col));
const valid=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(Number.isFinite);
const matrix=m=>Array.isArray(m)&&m.length===3&&m.every(row=>valid(row,3));
function inverse(m){
  const a=cross(m[1],m[2]),b=cross(m[2],m[0]),c=cross(m[0],m[1]),det=dot(m[0],a);
  if(Math.abs(det)<1e-12)throw Error('The camera intrinsic matrix is singular.');
  return transpose([a,b,c]).map(row=>mul(row,1/det));
}
export function camera(spec){
  if(!spec||!matrix(spec.intrinsic)||!matrix(spec.rotation)||!valid(spec.translation_mm,3)||!valid(spec.radial,2))throw Error('Supply both complete camera calibrations in millimetres.');
  const {intrinsic:k,rotation:r,radial:[k1,k2],translation_mm:t}=spec,rt=transpose(r),inv=inverse(k);
  const scale=spec.pixel_scale??1,zero=spec.pixel_origin??0;
  if(!Number.isFinite(scale)||scale<=0||!Number.isFinite(zero))throw Error('Invalid camera pixel scale or origin.');
  if(Math.abs(dot(r[0],cross(r[1],r[2]))-1)>1e-6||r.some((a,i)=>r.some((b,j)=>Math.abs(dot(a,b)-Number(i===j))>1e-6)))throw Error('Supply a proper camera rotation.');
  const center=mul(rowDot(t,rt),-1);
  function ray(px){
    if(px===null)return null;
    if(!valid(px,2))throw Error('An image point needs two finite pixel coordinates or null.');
    const h=rowDot([...px.map(x=>x/scale+zero),1],inv),xd=h[0]/h[2],yd=h[1]/h[2];
    const rd=Math.hypot(xd,yd);let radius=rd;
    for(let i=0;i<8;i++){const s=radius*radius,derivative=1+3*k1*s+5*k2*s*s;if(Math.abs(derivative)<1e-12)return null;radius-=(radius*(1+k1*s+k2*s*s)-rd)/derivative;}
    if(!Number.isFinite(radius)||radius<0||Math.abs(radius*(1+k1*radius**2+k2*radius**4)-rd)>=1e-8)return null;
    const gain=rd>1e-14?radius/rd:1;
    const v=rowDot([xd*gain,yd*gain,1],rt);return mul(v,1/Math.hypot(...v));
  }
  function project(p){
    const v=add(rowDot(p,r),t);if(!(v[2]>0))return null;
    const x=v[0]/v[2],y=v[1]/v[2],s=x*x+y*y,f=1+k1*s+k2*s*s;
    const a=rowDot([x*f,y*f,1],k);return a.slice(0,2).map(n=>(n/a[2]-zero)*scale);
  }
  return {center,ray,project};
}
export function triangulate(left,right,a,b){
  const u=a.ray(left),v=b.ray(right);if(!u||!v)return null;
  const w=sub(a.center,b.center),cos=dot(u,v),den=1-cos*cos;
  if(den<Math.sin(2*Math.PI/180)**2)return null;
  const d=dot(u,w),e=dot(v,w),t=(cos*e-d)/den,s=(e-cos*d)/den;
  if(t<=0||s<=0)return null;
  const q=mul(add(add(a.center,mul(u,t)),add(b.center,mul(v,s))),.5);
  const x=a.project(q),y=b.project(q);
  if(!x||!y||!q.every(Number.isFinite)||Math.max(Math.hypot(...sub(x,left)),Math.hypot(...sub(y,right)))>12)return null;
  return q;
}
export function pairedHistory(views){
  if(!Array.isArray(views)||views.length!==2)throw Error('Two calibrated, synchronized camera views are required.');
  const [a,b]=views.map(v=>camera(v.calibration));
  if(views.some(v=>!Array.isArray(v.frames)||v.frames.length!==5))throw Error('Each view requires five frames.');
  return views[0].frames.map((left,i)=>{
    const right=views[1].frames[i];
    if(!Number.isFinite(left.t)||!Number.isFinite(right.t)||Math.abs(left.t-right.t)>1e-6)throw Error('The two camera timestamps must match.');
    const sites=xy=>{
      if(Array.isArray(xy)&&xy.length===12)return xy;
      if(Array.isArray(xy)&&xy.length===33)return [11,12,13,14,15,16,23,24,25,26,27,28].map(j=>xy[j]);
      throw Error('Supply 12 named sites or all 33 MediaPipe image landmarks in each view.');
    };
    const l=sites(left.xy),r=sites(right.xy);
    return {t:left.t,xyz:l.map((p,j)=>triangulate(p,r[j],a,b))};
  });
}
