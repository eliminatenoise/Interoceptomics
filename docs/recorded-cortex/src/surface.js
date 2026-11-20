// Render the contributor's original surface and contact positions in the same frame.
function cortexSurface(canvas, anatomy, selectSite) {
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false});
  const ctx=gl?null:canvas.getContext('2d');
  if (!gl && !ctx) throw Error('Your browser could not open a 3D or software canvas.');
  const verts=anatomy.verts, tri=anatomy.faces instanceof Uint32Array ? anatomy.faces : Uint32Array.from(anatomy.faces);
  const contactCount=anatomy.regions.length;
  const [initialAz,initialEl]=anatomy.camera || [250,15];
  const winding=anatomy.inward===false ? 1 : -1;
  const normal=new Float32Array(verts.length), limit=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]];
  for(let i=0;i<verts.length;i++) {
    const lim=limit[i%3];lim[0]=Math.min(lim[0],verts[i]);lim[1]=Math.max(lim[1],verts[i]);
  }
  const center=limit.map(([lo,hi])=>(lo+hi)/2);
  const radius=Math.max(...limit.map(([lo,hi])=>(hi-lo)/2));
  const scaled=a=>Float32Array.from(a,(v,i)=>(v-center[i%3])/radius);
  const points=scaled(verts), contacts=scaled(anatomy.pos);
  for(let f=0;f<tri.length;f+=3) {
    const a=tri[f]*3,b=tri[f+1]*3,c=tri[f+2]*3;
    const ax=points[b]-points[a],ay=points[b+1]-points[a+1],az=points[b+2]-points[a+2];
    const bx=points[c]-points[a],by=points[c+1]-points[a+1],bz=points[c+2]-points[a+2];
    // Preserve deposited faces. Orient only the lighting normals for this mesh.
    const nx=winding*(ay*bz-az*by), ny=winding*(az*bx-ax*bz), nz=winding*(ax*by-ay*bx);
    for(const idx of [a,b,c]) {normal[idx]+=nx;normal[idx+1]+=ny;normal[idx+2]+=nz;}
  }
  for(let i=0;i<normal.length;i+=3) {
    const length=Math.hypot(normal[i],normal[i+1],normal[i+2])||1;
    normal[i]/=length;normal[i+1]/=length;normal[i+2]/=length;
  }
  let az=initialAz,el=initialEl,zoom=1,through=true,selected=0,drag=null,frame=0,lastView,disposed=false;
  let colors=new Float32Array(contactCount*3).fill(.5), active=new Float32Array(contactCount).fill(1);
  const rad=Math.PI/180, ids=Array.from({length:contactCount},(_,i)=>i+1);
  function view() {
    const w=canvas.width,h=canvas.height, a=(az-90)*rad,e=el*rad;
    const direction=[Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e)];
    const right=[-Math.sin(a),Math.cos(a),0],up=[-Math.cos(a)*Math.sin(e),-Math.sin(a)*Math.sin(e),Math.cos(e)];
    const sx=.84*zoom*Math.min(1,h/w),sy=.84*zoom*Math.min(1,w/h);
    const mat=new Float32Array([right[0]*sx,up[0]*sy,-direction[0]*.46,right[1]*sx,up[1]*sy,-direction[1]*.46,right[2]*sx,up[2]*sy,-direction[2]*.46]);
    const light=direction.map((v,i)=>v*.82+up[i]*.42-right[i]*.25);
    return {mat,light,w,h};
  }
  let drawGpu,release,readSite;
  if(gl) {
    const vs=`#version 300 es
    in vec3 aPosition;in vec3 aNormal;in vec3 aColor;in float aFlag;in float aId;
    uniform mat3 uView;uniform vec3 uLight;uniform float uMarker;uniform float uPixel;uniform float uSelected;
    out vec3 vColor;flat out float vId;flat out float vSelected;
    void main(){gl_Position=vec4(uView*aPosition,1.);vId=aId;vSelected=float(abs(aId-uSelected)<.1 && uSelected>0.);
      float shade=.42+.55*max(dot(aNormal,uLight),0.);vColor=mix(vec3(.83,.78,.72)*shade,aColor,uMarker);
      gl_PointSize=(aFlag>.5?10.:6.)*uPixel+vSelected*5.*uPixel;}`;
    const fs=`#version 300 es
    precision highp float;in vec3 vColor;flat in float vId;flat in float vSelected;
    uniform float uMarker;uniform float uPicking;out vec4 outColor;
    void main(){float r=0.;if(uMarker>.5){r=length(gl_PointCoord-.5)*2.;if(r>1.) discard;}
      vec3 col=vColor;if(uMarker>.5 && r>.75) col=vSelected>.5?vec3(1.):vec3(.08,.12,.13);
      if(uPicking>.5)col=vec3(uMarker>.5?vId/255.:0.,0.,0.);outColor=vec4(col,1.);}`;
    const program=gl.createProgram(),shaders=[];
    for(const [kind,src] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]) {
      const shader=gl.createShader(kind);gl.shaderSource(shader,src);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program,shader);shaders.push(shader);
    }
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    const attrib=Object.fromEntries(['aPosition','aNormal','aColor','aFlag','aId'].map(n=>[n,gl.getAttribLocation(program,n)]));
    const uni=Object.fromEntries(['uView','uLight','uMarker','uPixel','uSelected','uPicking'].map(n=>[n,gl.getUniformLocation(program,n)]));
    const buffers=[],vaos=[];
    function attribute(name,array,size) {
      const buf=gl.createBuffer();buffers.push(buf);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(attrib[name]);gl.vertexAttribPointer(attrib[name],size,gl.FLOAT,false,0,0);return buf;
    }
    const surface=gl.createVertexArray();vaos.push(surface);gl.bindVertexArray(surface);
    attribute('aPosition',points,3);attribute('aNormal',normal,3);
    const idx=gl.createBuffer();buffers.push(idx);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,tri,gl.STATIC_DRAW);
    const sites=gl.createVertexArray();vaos.push(sites);gl.bindVertexArray(sites);attribute('aPosition',contacts,3);
    const rgb=attribute('aColor',colors,3),flag=attribute('aFlag',active,1);attribute('aId',Float32Array.from(ids),1);
    drawGpu=(v,pick)=>{
      gl.viewport(0,0,v.w,v.h);gl.clearColor(...(pick?[0,0,0,1]:[.10,.15,.16,1]));gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DITHER);gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
      gl.uniformMatrix3fv(uni.uView,false,v.mat);gl.uniform3fv(uni.uLight,v.light);gl.uniform1f(uni.uPixel,canvas.width/canvas.clientWidth);
      gl.uniform1f(uni.uSelected,selected);gl.uniform1f(uni.uPicking,pick?1:0);gl.uniform1f(uni.uMarker,0);
      gl.bindVertexArray(surface);gl.drawElements(gl.TRIANGLES,tri.length,gl.UNSIGNED_INT,0);
      if(through)gl.disable(gl.DEPTH_TEST);
      gl.uniform1f(uni.uMarker,1);gl.bindVertexArray(sites);
      gl.bindBuffer(gl.ARRAY_BUFFER,rgb);gl.bufferSubData(gl.ARRAY_BUFFER,0,colors);
      gl.bindBuffer(gl.ARRAY_BUFFER,flag);gl.bufferSubData(gl.ARRAY_BUFFER,0,active);gl.drawArrays(gl.POINTS,0,contactCount);
      gl.bindVertexArray(null);
    };
    // Single-sample picking keeps an antialiased dot edge from blending into another contact's ID.
    const pickBuffer=gl.createFramebuffer(),pickColor=gl.createTexture(),pickDepth=gl.createRenderbuffer();
    let pickW=0,pickH=0;
    readSite=(v,x,y)=>{
      gl.bindFramebuffer(gl.FRAMEBUFFER,pickBuffer);
      if(pickW!==v.w||pickH!==v.h){
        pickW=v.w;pickH=v.h;
        gl.bindTexture(gl.TEXTURE_2D,pickColor);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,v.w,v.h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,pickColor,0);
        gl.bindRenderbuffer(gl.RENDERBUFFER,pickDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,v.w,v.h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,pickDepth);
      }
      const pixel=new Uint8Array(4);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE){
        drawGpu(v,true);gl.readPixels(Math.floor(x),v.h-1-Math.floor(y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);return pixel[0];
    };
    release=()=>{gl.deleteFramebuffer(pickBuffer);gl.deleteTexture(pickColor);gl.deleteRenderbuffer(pickDepth);buffers.forEach(b=>gl.deleteBuffer(b));vaos.forEach(v=>gl.deleteVertexArray(v));shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);};
  }
  function project(array,v) {
    const m=v.mat,out=new Float32Array(array.length);
    for(let i=0;i<array.length;i+=3) {
      const x=array[i],y=array[i+1],z=array[i+2];
      out[i]=(1+m[0]*x+m[3]*y+m[6]*z)*v.w/2;out[i+1]=(1-m[1]*x-m[4]*y-m[7]*z)*v.h/2;out[i+2]=m[2]*x+m[5]*y+m[8]*z;
    }
    return out;
  }
  let projectedContacts;
  function drawCpu(v) {
    const xy=project(points,v), cp=project(contacts,v),count=tri.length/3;
    const faces=Array.from({length:count},(_,i)=>i);
    const depth=new Float32Array(count);
    for(const f of faces) depth[f]=xy[tri[3*f]*3+2]+xy[tri[3*f+1]*3+2]+xy[tri[3*f+2]*3+2];
    faces.sort((a,b)=>depth[b]-depth[a]);ctx.fillStyle='#192629';ctx.fillRect(0,0,v.w,v.h);
    for(const f of faces) {
      const a=tri[f*3]*3,b=tri[f*3+1]*3,c=tri[f*3+2]*3,s=.42+.55*Math.max(0,normal[a]*v.light[0]+normal[a+1]*v.light[1]+normal[a+2]*v.light[2]);
      ctx.fillStyle='rgb('+[212,199,184].map(n=>Math.round(n*s)).join(',')+')';
      ctx.beginPath();ctx.moveTo(xy[a],xy[a+1]);ctx.lineTo(xy[b],xy[b+1]);ctx.lineTo(xy[c],xy[c+1]);ctx.fill();
    }
    projectedContacts=cp;
    for(let i=0;i<contactCount;i++) {
      const k=i*3;ctx.fillStyle='rgb('+Array.from(colors.subarray(k,k+3),n=>Math.round(n*255)).join(',')+')';
      ctx.strokeStyle=selected===i+1?'white':'#182021';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cp[k],cp[k+1],(selected===i+1?7:active[i]?5:3)*v.w/canvas.clientWidth,0,2*Math.PI);ctx.fill();ctx.stroke();
    }
  }
  function draw() {
    if(disposed)return;
    const ratio=Math.min(gl?2:1,devicePixelRatio||1);
    const w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
    if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;}
    lastView=view();if(gl)drawGpu(lastView,false);else drawCpu(lastView);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
  function rotate(dx,dy){az+=dx;el=Math.max(-85,Math.min(85,el+dy));schedule();}
  function magnify(by){zoom=Math.max(.55,Math.min(2.4,zoom*by));schedule();}
  function reset(){az=initialAz;el=initialEl;zoom=1;schedule();}
  function pick(event) {
    if(!lastView)return;
    const r=canvas.getBoundingClientRect(), x=(event.clientX-r.left)*canvas.width/r.width,y=(event.clientY-r.top)*canvas.height/r.height;
    let id=0;
    if(gl){id=readSite(lastView,x,y);}
    else if(projectedContacts){let best=13;for(let i=0;i<contactCount;i++){const k=i*3,d=Math.hypot(x-projectedContacts[k],y-projectedContacts[k+1]);if(d<best){best=d;id=i+1;}}}
    if(id>0 && id<=contactCount)selectSite(id);
  }
  const ctl=new AbortController(), opt={signal:ctl.signal};
  canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,d:0};canvas.setPointerCapture(e.pointerId);},opt);
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.d+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;rotate(-dx*.6,dy*.6);},opt);
  canvas.addEventListener('pointerup',e=>{if(drag?.id===e.pointerId && drag.d<4)pick(e);drag=null;},opt);
  canvas.addEventListener('pointercancel',()=>{drag=null;},opt);
  canvas.addEventListener('keydown',e=>{const d={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,12],ArrowDown:[0,-12]}[e.key];if(d){e.preventDefault();rotate(...d);}else if(e.key==='Home'){e.preventDefault();reset();}else if(e.key==='+'||e.key==='='){e.preventDefault();magnify(1.15);}else if(e.key==='-'){e.preventDefault();magnify(1/1.15);}},opt);
  const resize=new ResizeObserver(schedule);resize.observe(canvas);schedule();
  return {gpu:!!gl,rotate,magnify,reset,
    update(rgb,flags,id,xray){colors=Float32Array.from(rgb);active=Float32Array.from(flags);selected=id;through=xray;schedule();},
    dispose(){disposed=true;ctl.abort();resize.disconnect();cancelAnimationFrame(frame);if(release)release();}
  };
}
