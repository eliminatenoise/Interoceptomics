/* Skin the CC0 graphical surface. Orbiting the model never rotates the detector. */
const WristBody = (() => {
  const G = WristGeometry;
  function unpack(text, Type) {
    const bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0));
    return new Type(bytes.buffer);
  }
  const xyz = Float32Array.from(unpack(WristSurface.positions,Int16Array), x => x / 1000);
  const skin = unpack(WristSurface.skin,Uint8Array);
  const faces = unpack(WristSurface.indices,Uint16Array);
  const norm = new Float32Array(xyz.length);
  function vec(array,i) {return [array[i*3],array[i*3+1],array[i*3+2]];}
  function cross(a,b) {return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  for (let i=0;i<faces.length;i+=3) {
    const [a,b,c]=faces.subarray(i,i+3);
    const va=vec(xyz,a);
    const n=cross(G.sub(vec(xyz,b),va),G.sub(vec(xyz,c),va));
    for (const index of [a,b,c]) for(let j=0;j<3;j++) norm[3*index+j]+=n[j];
  }
  for(let i=0;i<norm.length;i+=3){
    const size=Math.hypot(norm[i],norm[i+1],norm[i+2]) || 1;
    for(let j=0;j<3;j++) norm[i+j]/=size;
  }

  function matrix(map) {
    const zero=map([0,0,0]);
    return [[1,0,0],[0,1,0],[0,0,1]].flatMap(p=>[...G.sub(map(p),zero),0]).concat(zero,1);
  }

  function camera(yaw, w, h) {
    const a = yaw * Math.PI / 180, b = 0.075;
    const c=Math.cos(a),s=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
    const size=Math.min(w/12.65,h/8.85);
    function view([x,y,z]) {
      const dx=c*x+s*z, dz=-s*x+c*z;
      return [dx, cb*(y-5.00)-sb*dz,sb*(y-5.00)+cb*dz];
    }
    const screen=p=>{const [x,y,z]=view(p);return [w/2+x*size,h/2-y*size,z];};
    const clip=matrix(p=>{const [x,y,z]=view(p);return [x*2*size/w,y*2*size/h,-z/12];});
    return {screen,clip};
  }

  function gpu(canvas) {
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    if(!gl) return null;
    const vertex = `
      attribute vec3 position, normal;
      attribute vec2 weights;
      uniform mat4 upperL, lowerL, upperR, lowerR, view;
      varying vec3 pigment;
      void main(){
        mat4 upper = position.x > 0. ? upperL : upperR;
        mat4 lower = position.x > 0. ? lowerL : lowerR;
        mat4 skinning=mat4(1.)*(1.-weights.x-weights.y)+upper*weights.x+lower*weights.y;
        vec3 n=normalize(mat3(skinning)*normal);
        float light = max(0.,dot(n,normalize(vec3(-.66,.86,1.1))));
        float rim=pow(1.-abs(n.z),2.);
        vec3 base = mix(vec3(.50,.65,.62), vec3(.78,.77,.68), smoothstep(5.55,5.82,position.y));
        base=mix(base,vec3(.60,.72,.69),weights.y*.6);
        pigment=base*(.43+.50*light)+vec3(.04,.07,.065)*rim;
        gl_Position=view*skinning*vec4(position,1.);
      }`;
    const fragment='precision mediump float; varying vec3 pigment; void main(){gl_FragColor=vec4(pigment,1.);}';
    const program=gl.createProgram();
    for(const [type,src] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
      const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);
      if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(program,sh);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    function attribute(name,size,data,type,normalised){
      const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
      const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location,size,type,normalised,0,0);
    }
    attribute('position',3,xyz,gl.FLOAT,false); attribute('normal',3,norm,gl.FLOAT,false);
    attribute('weights',2,skin,gl.UNSIGNED_BYTE,true);
    const idx=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faces,gl.STATIC_DRAW);
    const locations=Object.fromEntries(['upperL','lowerL','upperR','lowerR','view'].map(k=>[k,gl.getUniformLocation(program,k)]));
    gl.enable(gl.DEPTH_TEST);
    return (camera,transforms) => {
      gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(locations.view,false,camera.clip);
      for(const side of G.sides) for(const limb of ['upper','lower']){
        gl.uniformMatrix4fv(locations[limb+side],false,matrix(transforms[side][limb]));
      }
      gl.drawElements(gl.TRIANGLES,faces.length,gl.UNSIGNED_SHORT,0);
    };
  }

  function software(canvas) {
    const ctx=canvas.getContext('2d');
    return (camera, transforms, ratio) => {
      ctx.setTransform(ratio,0,0,ratio,0,0);
      ctx.clearRect(0,0,canvas.width/ratio,canvas.height/ratio);
      const points=[];
      for(let i=0;i<xyz.length/3;i++){
        const p=vec(xyz,i), u=skin[i*2]/255,l=skin[i*2+1]/255;
        const bone=transforms[p[0]>0?'L':'R'];
        const pos=u+l===0?p:G.add(G.scale(p,1-u-l),G.add(G.scale(bone.upper(p),u),G.scale(bone.lower(p),l)));
        points.push(camera.screen(pos));
      }
      const triangles=[];
      for(let i=0;i<faces.length;i+=3){
        const a=points[faces[i]],b=points[faces[i+1]],c=points[faces[i+2]];
        const n=cross(G.sub(b,a),G.sub(c,a));
        if(n[2]>=0)continue;
        triangles.push({a,b,c,z:(a[2]+b[2]+c[2])/3,i});
      }
      triangles.sort((a,b)=>a.z-b.z);
      for(const {a,b,c,i} of triangles){
        const n=vec(norm,faces[i]),light=Math.max(0,-.42*n[0]+.54*n[1]+.71*n[2]);
        const base=xyz[faces[i]*3+1]>5.58?[199,196,174]:[128,166,158];
        ctx.fillStyle='rgb('+base.map(x=>Math.round(x*(.43+.5*light))).join(',')+')';
        ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();ctx.fill();
        ctx.lineWidth=.45;ctx.strokeStyle=ctx.fillStyle;ctx.stroke();
      }
    };
  }

  function create(canvas) {
    const hardware=gpu(canvas);
    const draw=hardware || software(canvas);
    canvas.dataset.renderer=hardware?'WebGL':'Canvas 2D';
    return function(frame,implant,yaw,w,h,ratio) {
      if(canvas.width!==Math.round(w*ratio) || canvas.height!==Math.round(h*ratio)){
        canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
      }
      const model=G.poseAt(frame,implant,WristSurface.joints);
      const view=camera(yaw,w,h);
      draw(view,model.transforms,ratio);
      return {project:view.screen,pose:model.pose};
    };
  }
  return {create};
})();
