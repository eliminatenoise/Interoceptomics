// Run with Node.js in this directory. glTF uses metres; the scale is illustrative.
const fs=require('node:fs'), path=require('node:path');
const {spindleGeometry}=require('./anatomy.js');
const parts=spindleGeometry(), buffers=[], views=[], accessors=[], meshes=[], nodes=[];
let length=0;
function add(values,Type,componentType,type,dimension,bounds=false) {
  const bytes=Buffer.from(new Type(values).buffer);
  const view=views.length;
  views.push({buffer:0,byteOffset:length,byteLength:bytes.length,target:componentType===5123?34963:34962});
  const padding=(4-bytes.length%4)%4;
  buffers.push(bytes, Buffer.alloc(padding));length+=bytes.length+padding;
  const a={bufferView:view,componentType,count:values.length/dimension,type};
  if(bounds) {
    a.min=Array(dimension).fill(Infinity);a.max=Array(dimension).fill(-Infinity);
    values.forEach((v,i)=>{const k=i%dimension;a.min[k]=Math.min(a.min[k],v);a.max[k]=Math.max(a.max[k],v);});
  }
  return accessors.push(a)-1;
}
for(const part of parts) {
  // Renderer is Z-up. glTF is Y-up. Rotate the source axes without reflection.
  function yUp(arr,scale) {const result=[];for(let i=0;i<arr.length;i+=3)result.push(arr[i]*scale,arr[i+2]*scale,-arr[i+1]*scale);return result;}
  const position=add(Float32Array.from(yUp(part.p,.002)),Float32Array,5126,'VEC3',3,true);
  const normal=add(yUp(part.n,1),Float32Array,5126,'VEC3',3);
  const color=add(part.c.map(x=>x**2.2),Float32Array,5126,'VEC3',3);
  const faces=add(part.f,Uint16Array,5123,'SCALAR',1);
  const mesh=meshes.push({name:part.name,primitives:[{attributes:{POSITION:position,NORMAL:normal,COLOR_0:color},indices:faces,material:0}]})-1;
  nodes.push({name:part.name,mesh,extras:{structure:part.group}});
}
const model={asset:{version:'2.0',generator:'Interoceptomics',copyright:'CC0 1.0; original schematic; relative dimensions exaggerated'},scene:0,
 scenes:[{name:'Muscle spindle in a cutaway muscle–tendon unit',nodes:nodes.map((_,i)=>i)}],nodes,meshes,
 materials:[{name:'Tissue',doubleSided:true,pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:.75}}],
 accessors,bufferViews:views,buffers:[{byteLength:length}]};
let json=Buffer.from(JSON.stringify(model));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const header=Buffer.alloc(20), chunk=Buffer.alloc(8);header.write('glTF');header.writeUInt32LE(2,4);
header.writeUInt32LE(28+json.length+length,8);header.writeUInt32LE(json.length,12);header.write('JSON',16);
chunk.writeUInt32LE(length);chunk.write('BIN\0',4);
fs.writeFileSync(path.join(__dirname,'muscle-spindle.glb'),Buffer.concat([header,json,chunk,...buffers]));
