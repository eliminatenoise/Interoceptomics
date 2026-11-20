// Orthographic 3D view. All marker positions come from the group trajectory in metres.
function makeStrideBody(canvas, data, onPick) {
  const ctx=canvas.getContext('2d');
  const ids=new Map(data.markers.map(m=>[m.id,m]));
  const rad=Math.PI/180, vadd=(a,b)=>a.map((v,k)=>v+b[k]),sub=(a,b)=>a.map((v,k)=>v-b[k]);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=v=>{const l=Math.hypot(...v);return l?v.map(x=>x/l):[0,0,1];};
  const rgb=c=>'rgb('+c.map(x=>Math.round(x)).join(',')+')';
  const right=[240,159,86],left=[91,185,194],mid=[224,225,207];
  let angle=-53,elevation=10,zoom=1,phase=0,selected='R_FCC',follow=false,guides=true,showTrail=true,drag=null,hit=[],raf=0,emgRegion=null,travel=null;
  const all=data.markers.flatMap(m=>m.mean.filter(p=>p && p.length===3 && p.every(Number.isFinite)));
  if(!all.length)throw Error('No supported marker positions.');
  const mins=[0,1,2].map(k=>all.reduce((m,p)=>Math.min(m,p[k]),Infinity)),maxs=[0,1,2].map(k=>all.reduce((m,p)=>Math.max(m,p[k]),-Infinity));
  const center=mins.map((lo,k)=>(lo+maxs[k])/2);
  const span=Math.max(maxs[2]-mins[2]+.15,maxs[0]-mins[0]+.16,1.65);
  const pos=id=>ids.get(id)?.mean[phase];
  const average=(...labels)=>{
    const pts=labels.map(pos);if(pts.some(p=>!p||!p.every(Number.isFinite)))return null;
    return [0,1,2].map(k=>pts.reduce((s,p)=>s+p[k],0)/pts.length);
  };
  function draw(){
    raf=0;
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const a=angle*rad,e=elevation*rad,view=[Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e)];
    const vx=[-Math.sin(a),Math.cos(a),0],vy=cross(view,vx);
    const c=center.slice(),pelvis=average('R_IAS','L_IAS','R_IPS','L_IPS');
    if(follow&&pelvis){c[0]=pelvis[0];c[1]=pelvis[1];}
    const scale=Math.min((w-40)/(follow?1.5:span),(h-90)/Math.max(maxs[2]-mins[2],1.55))*zoom;
    const project=p=>{const d=sub(p,c);return [w/2+scale*dot(d,vx),h*.49-scale*dot(d,vy),dot(d,view)];};
    const colour=c=>rgb(c);
    ctx.fillStyle='#182b2f';ctx.fillRect(0,0,w,h);
    function line(x,y,col,sw=1){ctx.beginPath();ctx.moveTo(x[0],x[1]);ctx.lineTo(y[0],y[1]);ctx.strokeStyle=col;ctx.lineWidth=sw;ctx.stroke();}
    for(let k=-8;k<=12;k++){const f=k*.25;line(project([f,-1.15,0]),project([f,1.15,0]),'#31484a');}
    for(let k=-4;k<=4;k++){const l=k*.25;line(project([-2,l,0]),project([3,l,0]),k===0?'#4f6764':'#31484a');}
    if(showTrail&&ids.has(selected)){
      ctx.beginPath();let pen=false;for(const q of ids.get(selected).mean){if(!q){pen=false;continue;}const p=project(q);if(pen)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);pen=true;}
      ctx.strokeStyle='#f3cf73';ctx.lineWidth=1.3;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);
    }
    const pieces=[];
    function face(pts,col){if(pts.some(p=>!p))return;const P=pts.map(project);pieces.push({z:P.reduce((s,p)=>s+p[2],0)/P.length,draw(){ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);for(const pt of P.slice(1))ctx.lineTo(pt[0],pt[1]);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.lineWidth=.45;ctx.strokeStyle=col;ctx.stroke();}});}
    function tube(p,q,r1,r2,tint){
      if(!p||!q)return;
      const d=unit(sub(q,p));let dx=cross(d,[0,0,1]);if(Math.hypot(...dx)<.01)dx=cross(d,[1,0,0]);dx=unit(dx);
      const dy=cross(d,dx),rings=[],slices=10,light=unit(vadd(view,[0,0,.7]));
      for(const [at,r] of [[0,r1*.73],[.21,r1],[.78,r2],[1,r2*.76]]){
        const origin=p.map((x,k)=>x+(q[k]-x)*at);rings.push(Array.from({length:slices},(_,i)=>origin.map((v,k)=>v+r*(dx[k]*Math.cos(i*2*Math.PI/slices)+dy[k]*Math.sin(i*2*Math.PI/slices)))));
      }
      for(let i=0;i<slices;i++){
        const k=(i+1)%slices,theta=(i+.5)*2*Math.PI/slices;
        const n=dx.map((v,j)=>v*Math.cos(theta)+dy[j]*Math.sin(theta));
        if(dot(n,view)<-.24)continue;
        const shade=.45+.47*Math.max(0,dot(light,n));
        for(let row=0;row<rings.length-1;row++)face([rings[row][i],rings[row][k],rings[row+1][k],rings[row+1][i]],rgb(tint.map(x=>x*shade)));
      }
    }
    function joint(pt,r,tint){
      if(!pt)return;const P=project(pt),radius=Math.max(1,r*scale);
      pieces.push({z:P[2]+r*.30,draw(){const g=ctx.createRadialGradient(P[0]-radius*.31,P[1]-radius*.35,radius*.07,P[0],P[1],radius);
        g.addColorStop(0,rgb(tint.map(v=>v*.97)));g.addColorStop(.78,rgb(tint.map(v=>v*.74)));g.addColorStop(1,rgb(tint.map(v=>v*.55)));
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(P[0],P[1],radius,0,Math.PI*2);ctx.fill();}});
    }
    const signalTint=(tint,part,side)=>{
      if(side!=='R'||emgRegion?.area!==part)return tint;
      const strength=.28+.72*emgRegion.strength;
      return tint.map((v,k)=>v*(1-strength)+[255,203,89][k]*strength);
    };
    if(guides){
      const shoulder=average('L_SAA','R_SAA'),chest=average('CV7','SJN'),spine=average('TV10','SXS');
      if(shoulder&&pelvis){
        const between=(a,b,t)=>a&&b?a.map((v,k)=>v+(b[k]-v)*t):null;
        const lower=between(pelvis,spine||shoulder,.36),upper=between(chest||shoulder,pelvis,.08);
        const wPel=pos('R_IAS')&&pos('L_IAS')?Math.hypot(...sub(pos('R_IAS'),pos('L_IAS')))/2:.12;
        const wSh=pos('R_SAA')&&pos('L_SAA')?Math.hypot(...sub(pos('R_SAA'),pos('L_SAA')))/2:.16;
        const lAxis=pos('R_SAA')&&pos('L_SAA')?unit(sub(pos('L_SAA'),pos('R_SAA'))):[0,1,0];
        const up=unit(sub(shoulder,pelvis)),front=unit(cross(lAxis,up)),levels=[];
        for(const [o,wide,deep] of [[pelvis,wPel*1.08,.088],[lower,wPel*.88,.085],[between(lower,upper,.64),wSh*.89,.106],[upper,wSh*.94,.091]]){
          if(!o)continue;levels.push(Array.from({length:14},(_,i)=>o.map((v,k)=>v+wide*lAxis[k]*Math.cos(i*Math.PI/7)+deep*front[k]*Math.sin(i*Math.PI/7))));
        }
        for(let i=0;i<14;i++){const j=(i+1)%14,sh=.56+.37*Math.max(0,dot(view,unit(sub(levels[1][i],lower))));for(let k=0;k<levels.length-1;k++)face([levels[k][i],levels[k][j],levels[k+1][j],levels[k+1][i]],rgb([183,199,190].map(v=>sh*v)));}
      }
      for(const [side,tint] of [['R',right],['L',left]]){
        const P=n=>pos(side+'_'+n),A=(a,b)=>average(side+'_'+a,side+'_'+b);
        const knee=A('FLE','FME'),ankle=A('FAL','TAM'),elbow=A('HLE','HME'),wrist=A('RSP','UHE');
        const toe=A('FM1','FM5'),hand=A('HM2','HM5');
        const thigh=signalTint(tint,'thigh',side),shank=signalTint(tint,'shank',side),hip=signalTint(tint,'hip',side);
        const iliac=P('IAS'),troch=P('FTC');tube(iliac,troch,.066,.061,hip);joint(troch,.062,hip);
        tube(troch,knee,.073,.047,thigh);tube(knee,ankle,.051,.027,shank);joint(knee,.045,thigh);joint(ankle,.028,shank);
        tube(P('FCC'),toe,.036,.040,tint);
        joint(P('SAA'),.043,tint);joint(elbow,.030,tint);joint(wrist,.020,tint);tube(P('SAA'),elbow,.042,.032,tint);tube(elbow,wrist,.030,.020,tint);tube(wrist,hand,.018,.022,tint);
      }
    }
    for(const pair of data.links){
      const [a,b]=pair;const v=pos(a),q=pos(b);if(!v||!q)continue;
      const p=project(v),t=project(q),col=a.startsWith('R_')&&b.startsWith('R_')?right:a.startsWith('L_')&&b.startsWith('L_')?left:mid;
      pieces.push({z:(p[2]+t[2])/2+.002,draw(){line(p,t,colour(col),guides?.7:1.7);}});
    }
    hit=[];
    for(const m of data.markers){
      const q=m.mean[phase];if(!q)continue;const p=project(q),chosen=m.id===selected,col=m.id.startsWith('R_')?right:m.id.startsWith('L_')?left:mid;
      hit.push([p,m.id]);pieces.push({z:p[2]+.003,draw(){
        ctx.beginPath();ctx.arc(p[0],p[1],chosen?5.2:guides?2.1:3.25,0,2*Math.PI);ctx.fillStyle=chosen?'#fff2a1':colour(col);ctx.fill();ctx.strokeStyle=chosen?'#f8efbc':'#284446';ctx.lineWidth=chosen?2:.7;ctx.stroke();
      }});
    }
    pieces.sort((x,y)=>x.z-y.z);for(const piece of pieces)piece.draw();
    // The selected point stays labelled when the far side is partly hidden by the segment guide.
    const target=hit.find(([,m])=>m===selected);
    if(target){const p=target[0];ctx.beginPath();ctx.arc(p[0],p[1],7.3,0,2*Math.PI);ctx.strokeStyle='#fff1ad';ctx.lineWidth=1.25;ctx.stroke();}
    if(travel){
      // Paired-start mean can differ from the full-cohort marker under the cursor.
      const p=project(travel.start.map(v=>v/1000));
      const q=project(vadd(travel.start,travel.delta).map(v=>v/1000));
      const dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);
      const green='#8ef6ad';
      ctx.beginPath();ctx.arc(p[0],p[1],4,0,2*Math.PI);
      ctx.strokeStyle=green;ctx.lineWidth=2;ctx.stroke();
      if(length>1){
        const u=dx/length,v=dy/length,head=Math.min(9,length*.45);
        line(p,q,'#10362d',5);line(p,q,green,2.6);
        ctx.beginPath();ctx.moveTo(q[0],q[1]);
        ctx.lineTo(q[0]-head*u+head*.5*v,q[1]-head*v-head*.5*u);
        ctx.lineTo(q[0]-head*u-head*.5*v,q[1]-head*v+head*.5*u);
        ctx.closePath();ctx.fillStyle=green;ctx.fill();
      }
      ctx.beginPath();ctx.arc(q[0],q[1],2.2,0,2*Math.PI);ctx.fillStyle=green;ctx.fill();
    }
    ctx.fillStyle='#bbcfca';ctx.font='12px system-ui,sans-serif';ctx.fillText('Floor grid · 25 cm',12,h-12);
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(draw);}
  function rotation(dx,dy){angle+=dx;elevation=Math.max(-10,Math.min(78,elevation+dy));schedule();}
  function magnify(f){zoom=Math.min(2.4,Math.max(.65,zoom*f));schedule();}
  function reset(){angle=-53;elevation=10;zoom=1;schedule();}
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,range:0,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const x=e.clientX-drag.x,y=e.clientY-drag.y;drag.range+=Math.abs(x)+Math.abs(y);drag.x=e.clientX;drag.y=e.clientY;rotation(-x*.52,y*.44);});
  canvas.addEventListener('pointerup',e=>{if(drag?.id===e.pointerId&&drag.range<4){
    const rect=canvas.getBoundingClientRect();let best=null,min=14;for(const [p,id] of hit){const d=Math.hypot(p[0]-(e.clientX-rect.left),p[1]-(e.clientY-rect.top));if(d<min){min=d;best=id;}}if(best)onPick(best);
  }drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('keydown',e=>{const d={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,8],ArrowDown:[0,-8]}[e.key];if(d){e.preventDefault();rotation(...d);}else if(e.key==='Home'){e.preventDefault();reset();}else if(e.key==='+'||e.key==='='){e.preventDefault();magnify(1.16);}else if(e.key==='-'){e.preventDefault();magnify(1/1.16);}});
  const resize=new ResizeObserver(schedule);resize.observe(canvas);schedule();
  return {rotation,magnify,reset,pose(az,el){angle=az;elevation=el;schedule();},update(i,id,style,lock,trail,region,arrow){phase=i;selected=id;guides=style;follow=lock;showTrail=trail;emgRegion=region;travel=arrow;schedule();}};
}
