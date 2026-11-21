/* Offscreen WebGL smooth-shading path; all resources stay local. */
function fingerRenderer(surface,normals){
  const buffer=document.createElement('canvas');
  const gl=buffer.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
  if(!gl)return null;
  const vs=`
    attribute vec3 vertex,normal;
    uniform vec4 camera; uniform vec2 extent;
    varying vec3 pos,nrm;
    void main(){
      vec3 p=vertex+vec3(.75,-1.15,0.);
      vec2 xz=mat2(camera.x,-camera.y,camera.y,camera.x)*p.xz;
      vec2 yz=mat2(camera.z,camera.w,-camera.w,camera.z)*vec2(p.y,xz.y);
      gl_Position=vec4(xz.x*extent.x,yz.x*extent.y,-yz.y/15.,1.);
      pos=vertex;nrm=normal;
    }`;
  const fs=`
    precision mediump float;
    varying vec3 pos,nrm;
    void main(){
      vec3 n=length(nrm)>.01?normalize(nrm):vec3(-.90631,.42262,0.);
      float longitudinal=.90631*pos.x-.42262*pos.y;
      float height=.42262*pos.x+.90631*pos.y;
      float dorsal=dot(n,vec3(.42262,.90631,0.));
      vec2 nailCoord=vec2((longitudinal+.83)/.98,(pos.z+.06)/.54);
      float edge=dot(pow(abs(nailCoord),vec2(3.)),vec2(1.));
      float nail=(1.-smoothstep(.86,1.05,edge))*smoothstep(.25,.48,dorsal)*smoothstep(.28,.48,height);
      float ridge=abs(longitudinal+2.92+.10*pos.z*pos.z);
      float knuckle=(.07*exp(-ridge*ridge*340.)+.035*exp(-pow(abs((ridge-.11)*19.),2.)))*max(0.,dorsal);
      float light=max(0.,dot(n,normalize(vec3(-.35,.8,.65))));
      float bounce=max(0.,dot(n,normalize(vec3(.55,.15,-.85))));
      vec3 skin=mix(vec3(.77,.52,.40),vec3(.86,.63,.51),light);
      vec3 pigment=mix(skin*(1.-knuckle),vec3(.91,.76,.71),nail);
      vec3 shade=pigment*(.61+.46*light)+vec3(.045,.067,.05)*bounce;
      float gloss=pow(max(0.,dot(n,normalize(vec3(-.20,.54,.72)))),17.);
      shade+=vec3(.09,.075,.065)*gloss*(.23+1.6*nail);
      gl_FragColor=vec4(shade,1.);
    }`;
  const program=gl.createProgram();
  for(const [kind,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
    const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))return null;
    gl.attachShader(program,shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
  gl.useProgram(program);
  for(const [name,values] of [['vertex',surface.points.flat()],['normal',normals.flat()]]){
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
    const id=gl.getAttribLocation(program,name);gl.vertexAttribPointer(id,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(id);
  }
  const index=surface.faces.flat();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(index),gl.STATIC_DRAW);
  const angles=gl.getUniformLocation(program,'camera'),extent=gl.getUniformLocation(program,'extent');
  gl.clearColor(0,0,0,0);gl.enable(gl.DEPTH_TEST);
  return (ctx,w,h,scale,c,s,ct,st)=>{
    const ratio=Math.min(window.devicePixelRatio||1,2),bw=Math.round(w*ratio),bh=Math.round(h*ratio);
    if(buffer.width!==bw||buffer.height!==bh){buffer.width=bw;buffer.height=bh;}
    gl.viewport(0,0,bw,bh);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform4f(angles,c,s,ct,st);gl.uniform2f(extent,2*scale/w,2*scale/h);
    gl.drawElements(gl.TRIANGLES,index.length,gl.UNSIGNED_SHORT,0);
    ctx.drawImage(buffer,0,0,w,h);
  };
}
