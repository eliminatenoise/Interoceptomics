import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from './vendor/three/examples/jsm/controls-OrbitControls.js';
import {pointColours} from './location-comparison.js';
const query=new URLSearchParams(location.search),start=performance.now();
const interactive=query.get('interactive')==='1';

async function fetchModelFile(path,options){
 const response=await fetch(path,options);
 if(!response.ok)throw Error(`${path} returned HTTP ${response.status}`);
 return response;
}

const loading=document.querySelector('#loading')||document.createElement('p');
loading.id='loading';
loading.setAttribute('role','status');
loading.textContent='Loading the 3D model, a 66 MB file…';
document.body.append(loading);
// While the model file arrives: a count that moves (event.loaded counts unpacked bytes, and the file is 66 MB
// unpacked), and a word and a reload button when nothing has arrived for half a minute
let stall,shownMB=-1,stalled=false;
function waitForBytes(){clearTimeout(stall);stall=setTimeout(()=>{stalled=true;loading.removeAttribute('aria-busy');loading.textContent+=' Nothing has arrived for 30 seconds: check the connection, or reload the page.';const again=document.createElement('button');again.type='button';again.id='reload';again.textContent='Reload the page';again.onclick=()=>(parent===window?location:parent.location).reload();loading.append(' ',again);},30000);}
// aria-busy: a screen reader is not read every megabyte, only what follows the count
function progress(event){const mb=Math.floor(event.loaded/1e6);if(mb!==shownMB||stalled){shownMB=mb;stalled=false;loading.setAttribute('aria-busy','true');loading.textContent='Loading the 3D model: '+mb+' of 66 MB…';}waitForBytes();}

let startupStep='graphics';
try{
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setClearColor(0xffffff);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 const canvas=renderer.domElement;
 document.body.append(canvas);
 startupStep='files';
 waitForBytes();
 const [registry,frame,variantSpec,gltf]=await Promise.all([
  fetchModelFile('./registry.json').then(response=>response.json()),
  fetchModelFile('./camera-r4-bounds.json').then(response=>response.json()),
  fetchModelFile('./variants.json').then(response=>response.json()),
  new GLTFLoader().loadAsync('./assets/brain-left.glb',progress),
 ]);
 clearTimeout(stall);loading.removeAttribute('aria-busy');loading.textContent='Colouring the regions…';
 const labels=new Map(registry.labels.map(r=>[r.id,r])),nodeInfo=new Map(registry.nodes.map(r=>[r.node,r]));
 const scene=new THREE.Scene();scene.add(gltf.scene);const frameRoot=gltf.scene.getObjectByName('R5_FRAME'),meshes=[];if(!frameRoot)throw Error('Required source-frame root missing');
 gltf.scene.traverse(o=>{if(o.isMesh){o.userData.info=nodeInfo.get(o.name);o.userData.originalMaterial=o.material;meshes.push(o);}});
 async function loadIsolatedTerritory(info,allowance){
  try{
   const response=await fetchModelFile('./'+info.geometry_file,{signal:AbortSignal.timeout(10000+(allowance||info.bytes||0)/125)});
   const data=await response.arrayBuffer();
   const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
   const sha256=Array.from(digest,byte=>byte.toString(16).padStart(2,'0')).join('');
   if(sha256!==info.geometry_sha256)throw Error('Source mesh checksum mismatch');
   const detail=await new GLTFLoader().parseAsync(data,'./');
   const detailMeshes=[];
   detail.scene.traverse(object=>{if(object.isMesh)detailMeshes.push(object);});
   const [mesh]=detailMeshes;
   if(detailMeshes.length!==1||mesh.name!==info.node||mesh.userData.native_id!==info.native_id
      ||mesh.geometry.attributes.position.count!==info.vertices
      ||mesh.geometry.index?.count!==3*info.triangles)throw Error('Source mesh identity mismatch');
   mesh.userData.info=info;
   mesh.userData.originalMaterial=mesh.material;
   mesh.visible=false;
   return {scene:detail.scene,mesh};
  }catch(error){
   console.warn('Separate atlas surface unavailable:',info.native_id,error);
   return null;
  }
 }
 const surfaceLabelIds=new Set();
 const identityLoads=meshes.map(async o=>{
  const n=o.userData.info;
  if(n.kind!=='existing')return;
  const response=await fetchModelFile('./'+n.vertex_identity_file);
  o.userData.labels=new Uint32Array(await response.arrayBuffer());
  if(o.userData.labels.length!==o.geometry.attributes.position.count)throw Error('Source identity length mismatch');
  for(const id of o.userData.labels)surfaceLabelIds.add(id);
 });
 const deferredTerritories=new Map(registry.nodes.filter(node=>node.load_on_selection).map(node=>[node.native_id,node]));
 const optionalLoads=registry.nodes.filter(node=>node.isolation_only&&!node.load_on_selection).map(node=>loadIsolatedTerritory(node));
 const [details]=await Promise.all([Promise.all(optionalLoads),Promise.all(identityLoads)]);
 for(const detail of details){
  if(!detail)continue;
  frameRoot.add(detail.scene);
  meshes.push(detail.mesh);
 }
 startupStep='scene';
 const bounds=new THREE.Box3(new THREE.Vector3(...frame.bounds.min),new THREE.Vector3(...frame.bounds.max)),size=bounds.getSize(new THREE.Vector3()),overviewTarget=bounds.getCenter(new THREE.Vector3());overviewTarget.x=0;
 const camera=new THREE.OrthographicCamera(-1,1,1,-1,.001,10);camera.up.set(0,1,0);
 let width=0,height=0,pixelRatio=0,halfY;
 function resizeCanvas(){
  const nextWidth=Math.max(1,window.innerWidth),nextHeight=Math.max(1,window.innerHeight);
  // Keep the diagnostic renders at one sample per CSS pixel and bound the interactive buffer.
  const nextRatio=interactive?Math.min(window.devicePixelRatio||1,2):1;
  if(nextWidth===width&&nextHeight===height&&nextRatio===pixelRatio)return false;

  width=nextWidth;
  height=nextHeight;
  pixelRatio=nextRatio;
  renderer.setDrawingBufferSize(width,height,pixelRatio);
  // Three.js truncates backing dimensions but rounds its viewport at fractional DPR.
  renderer.setViewport(0,0,canvas.width/pixelRatio,canvas.height/pixelRatio);

  halfY=Math.max(size.y/2*1.09,size.z/2*(height/width)*1.09);
  const halfX=halfY*width/height;
  camera.left=-halfX;
  camera.right=halfX;
  camera.top=halfY;
  camera.bottom=-halfY;
  camera.updateProjectionMatrix();
  return true;
 }
 resizeCanvas();
 scene.add(new THREE.HemisphereLight(0xffffff,0x9aa4ab,1.75));
 const rigs=[];for(const [colour,power,offset] of [[0xffffff,1.7,[.6,.32,.35]],[0xe7f0ff,.7,[-.6,.07,-.45]],[0xffffff,.45,[.2,-.1,-.25]]]){const l=new THREE.DirectionalLight(colour,power);l.position.copy(overviewTarget).add(new THREE.Vector3(...offset));scene.add(l);rigs.push({light:l,offset});}
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.enablePan=true;controls.target.copy(overviewTarget);controls.enabled=interactive;
 if(interactive){canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','3D model of the left half of the brain. Shift and the arrow keys turn it, the arrow keys move it, plus and minus zoom.');controls.listenToKeyEvents(canvas);canvas.addEventListener('keydown',()=>{controls.keyRotateSpeed=canvas.clientHeight/72;},{capture:true});}

 const state={variant:query.get('variant')||variantSpec.default,view:query.get('view')||'Medial',role:query.get('role')||'all',selection:query.get('select')||'',isolate:query.get('isolate')==='1',qc:query.get('qc')==='all',compare:false,layers:false};
 const comparisonMaterials=new Map();
 const comparison=registry.vpl_vpm_comparison;
 let boundaryMesh;
 let sourcePlane;
 let parietalPlane;
 let distanceOverlay;
 let annotationMode=false;
 let annotationMarker;
 let annotationRAS;
 let annotationReading;
 let pendingBoundary;
 let showBoundaryRequested=false;
 const comparisonMeshes=interactive&&comparison
  ? meshes.filter(mesh=>comparison.regions.some(region=>region.id===mesh.userData.info.native_id))
  : [];
 if(comparison&&comparisonMeshes.length===comparison.regions.length){
  for(const mesh of comparisonMeshes){
   const region=comparison.regions.find(region=>region.id===mesh.userData.info.native_id);
   comparisonMaterials.set(mesh,new THREE.MeshStandardMaterial({color:region.color,roughness:.83,metalness:0}));
  }
 }
 const comparisonViews={front:new THREE.Vector3(0,0,1),above:new THREE.Vector3(0,1,.28).normalize()};
 let beforeComparison;
 const descriptions={Medial:'The inner face of the left half, where the two halves of the brain meet. The surfaces added separately for deep regions and for the parietal operculum are not drawn in this view.',Lateral:'The outer face of the left half. The insula and the deep regions stay hidden under the outer surface.',InsulaDissection:'The whole outer surface is hidden to show the five regions of the insula. That hides far more than the folds that cover the insula in a real brain.',Deep:'The outer surface and the insula are hidden. The deep regions stay where they sit in the head, so one can still hide another.'};
 const offsets={Medial:[1,0,0],Lateral:[-1,0,0],InsulaDissection:[-1,.12,.28],Deep:[-1,.18,.35]};
 const activeVariant=()=>variantSpec.variants.find(v=>v.key===state.variant);
 function offsetInWorld(a){const v=activeVariant();if(!v)throw Error('Variant is not source-qualified');return new THREE.Vector3(a[0]*v.camera_light_X_factor,a[1],a[2]);}
 function updateFrame(){const v=activeVariant();if(!v)throw Error('Variant is not source-qualified');frameRoot.scale.set(v.frame_root_scale_x,1,1);scene.updateMatrixWorld(true);for(const r of rigs)r.light.position.copy(overviewTarget).add(offsetInWorld(r.offset));}
 const palette={};for(const [k,rgb] of Object.entries(registry.palette))palette[k]=new THREE.Color().setRGB(rgb[0]/255,rgb[1]/255,rgb[2]/255).convertSRGBToLinear();
 const selectedIds=()=>state.selection.startsWith('group:')?new Set(registry.labels.filter(r=>r.state==='new_per_label_mesh'&&r.family===state.selection.slice(6)).map(r=>r.id)):new Set(state.selection?[Number(state.selection)]:[]);
 const selectedMeshes=()=>{const ids=selectedIds();return meshes.filter(o=>o.userData.info.kind==='new'&&ids.has(o.userData.info.native_id));};
 function colours(){if(query.get('stock')==='1'||query.get('asset')==='1'){for(const o of meshes){o.material=o.userData.originalMaterial.clone();o.material.side=query.get('double')==='1'?THREE.DoubleSide:THREE.FrontSide;o.material.flatShading=!o.geometry.hasAttribute('normal');}return;}const chosen=selectedIds(),selectionColour=new THREE.Color(0x34464f);for(const o of meshes){const n=o.userData.info,P=o.geometry.attributes.position,values=new Float32Array(P.count*3),ids=o.userData.labels;for(let i=0;i<P.count;i++){const r=labels.get(n.kind==='new'?n.native_id:ids[i]);let shade=state.role==='anatomy'?'neutral':state.role==='all'?r.default_shade:r.display_tags.includes(state.role)?state.role:'neutral';const c=chosen.has(r.id)&&!state.isolate?selectionColour:palette[shade]||palette.neutral;values.set([c.r,c.g,c.b],i*3);}o.geometry.setAttribute('color',new THREE.BufferAttribute(values,3));o.material?.dispose();o.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83,metalness:0,side:query.get('double')==='1'?THREE.DoubleSide:THREE.FrontSide,flatShading:!o.geometry.hasAttribute('normal')});if(n.see_through&&!state.isolate)Object.assign(o.material,{transparent:true,opacity:.3,depthWrite:false});}}
 function visible(){
  const stock=query.get('stock')==='1',chosen=selectedIds();
  for(const o of meshes){
   if(state.compare){
    o.visible=comparisonMaterials.has(o);
    continue;
   }
   const n=o.userData.info;
   let show;
   if(n.isolation_only)show=!stock&&(state.isolate?chosen.has(n.native_id):Boolean(n.layer)&&state.layers);
   else if(stock)show=true;
   else if(state.isolate&&chosen.size)show=n.kind==='new'&&chosen.has(n.native_id);
   else if(n.kind==='existing')show=(state.view==='Medial'||state.view==='Lateral')||n.source_group!=='cerebral_surface_parcels';
   else show=state.view==='InsulaDissection'?n.family==='insula':state.view==='Deep'?n.family!=='insula':false;
   if(!stock&&n.default_qc_exclusion&&!state.qc)show=false;
   o.visible=show;
  }
 }
 function resetCamera(focus=false){
  controls.target.copy(overviewTarget);
  camera.zoom=1;
  const active=focus?selectedMeshes():[];
  if(active.length){
   const box=new THREE.Box3();
   for(const mesh of active)box.expandByObject(mesh);
   controls.target.copy(box.getCenter(new THREE.Vector3()));
   if(active.some(mesh=>mesh.userData.info.load_on_selection)){
    const {radius}=box.getBoundingSphere(new THREE.Sphere());
    camera.zoom=Math.min(halfY,camera.right)/(radius*1.13);
   }else{
    const size=box.getSize(new THREE.Vector3());
    camera.zoom=Math.min(12,Math.max(1,Math.min(halfY,camera.right)*2/(Math.max(size.x,size.y,size.z)*1.35)));
   }
  }
  camera.position.copy(controls.target).add(offsetInWorld(offsets[state.view]));
  camera.lookAt(controls.target);
  camera.updateProjectionMatrix();
  controls.update();
 }
 function frameComparison(direction){
  const bounds=new THREE.Box3();
  for(const mesh of comparisonMeshes)bounds.expandByObject(mesh);
  const {center,radius}=bounds.getBoundingSphere(new THREE.Sphere());
  controls.target.copy(center);
  camera.position.copy(center).add(direction);
  camera.zoom=Math.min(halfY,camera.right)/(radius*1.13);
  camera.updateProjectionMatrix();
  if(!controls.update()){draw();publish();}
 }
 function updateBoundary(active){
  if(boundaryMesh)boundaryMesh.visible=active;
  for(const material of comparisonMaterials.values()){
   if(material.transparent===active)continue;
   material.opacity=active ? .30 : 1;
   material.transparent=active;
   material.depthWrite=!active;
   material.needsUpdate=true;
  }
 }
 async function setBoundary(active){
  showBoundaryRequested=active;
  if(!active){
   updateBoundary(false);
   draw();publish();
   parent.postMessage({type:'brain-boundary',status:'off'},location.origin);
   return;
  }
  if(!boundaryMesh){
   parent.postMessage({type:'brain-boundary',status:'loading'},location.origin);
   pendingBoundary??=import('./shared-faces.js')
    .then(({loadSharedFaces})=>loadSharedFaces(comparison,activeVariant().native_RAS_to_world_m))
    .then(mesh=>{frameRoot.add(mesh);return mesh;})
    .catch(error=>{console.warn('Shared atlas faces unavailable:',error);return null;});
   boundaryMesh=await pendingBoundary;
   if(!showBoundaryRequested||!state.compare)return;
   if(!boundaryMesh){
    showBoundaryRequested=false;
    parent.postMessage({type:'brain-boundary',status:'unavailable'},location.origin);
    return;
   }
  }
  updateBoundary(true);
  draw();publish();
  parent.postMessage({type:'brain-boundary',status:'on'},location.origin);
 }
 function makeSourceFrame(name,color){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));
  const frame=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({color,toneMapped:false}));
  frame.name=name;
  frameRoot.add(frame);
  return frame;
 }
 function rasToFrame(ras){
  return activeVariant().native_RAS_to_world_m.map(coefficients=>coefficients.reduce(
   (sum,coefficient,dimension)=>sum+coefficient*ras[dimension],0));
 }
 function positionSourceFrame(frame,start,shape,origin,spacing,axis,index){
  const [u,v]=[0,1,2].filter(dimension=>dimension!==axis);
  const positions=frame.geometry.attributes.position;
  for(const [row,[upperU,upperV]] of [[0,0],[1,0],[1,1],[0,1]].entries()){
   const corner=start.map((cell,dimension)=>origin[dimension]+spacing*(cell-.5));
   corner[axis]=origin[axis]+index*spacing;
   corner[u]+=upperU*shape[u]*spacing;
   corner[v]+=upperV*shape[v]*spacing;
   positions.setXYZ(row,...rasToFrame(corner));
  }
  positions.needsUpdate=true;
  frame.geometry.computeBoundingSphere();
  frame.visible=true;
 }
 function makeCrosshair(name,colour){
  const materialOptions={depthTest:false,depthWrite:false,toneMapped:false};
  const cursorCanvas=document.createElement('canvas');
  cursorCanvas.width=cursorCanvas.height=32;
  const crosshair=cursorCanvas.getContext('2d');
  crosshair.beginPath();
  for(const [x,y,u,v] of [[4,16,11,16],[21,16,28,16],[16,4,16,11],[16,21,16,28]]){
   crosshair.moveTo(x,y);crosshair.lineTo(u,v);
  }
  crosshair.lineWidth=7;
  crosshair.strokeStyle='#fff';
  crosshair.stroke();
  crosshair.lineWidth=3;
  crosshair.strokeStyle=colour;
  crosshair.stroke();
  const cursorGeometry=new THREE.BufferGeometry();
  cursorGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));
  const cursor=new THREE.Points(cursorGeometry,new THREE.PointsMaterial({...materialOptions,
   map:new THREE.CanvasTexture(cursorCanvas),size:23,sizeAttenuation:false,transparent:true,alphaTest:.35}));
  cursor.name=name;
  cursor.renderOrder=15;
  cursor.visible=false;
  return cursor;
 }
 function makeDistanceOverlay(){
  const marks=new THREE.Group();
  marks.name='Atlas_distance_marks';
  const materialOptions={depthTest:false,depthWrite:false,toneMapped:false};
  const textures=[false,true].map(labelled=>{
   const canvas=document.createElement('canvas');
   canvas.width=canvas.height=32;
   const drawing=canvas.getContext('2d');
   drawing.beginPath();
   drawing.arc(16,16,12,0,2*Math.PI);
   drawing.strokeStyle='#fff';
   drawing.lineWidth=6;
   drawing.stroke();
   drawing.strokeStyle='#181826';
   drawing.lineWidth=2;
   drawing.stroke();
   if(labelled){
    drawing.fillStyle='#fff';
    drawing.fill();
   }
   return new THREE.CanvasTexture(canvas);
  });
  const endpoints=pointColours.map((color,i)=>{
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));
   const material=new THREE.PointsMaterial({...materialOptions,color,map:textures[1],size:i===0?15:9,
    sizeAttenuation:false,transparent:true,alphaTest:.35});
   const marker=new THREE.Points(geometry,material);
   marker.name='Atlas_distance_'+(i===0?'A':'B');
   marker.renderOrder=13+i;
   marker.visible=false;
   marks.add(marker);
   return marker;
  });
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
  const segment=new THREE.Line(geometry,new THREE.LineBasicMaterial({...materialOptions,color:0x18232c}));
  segment.name='Atlas_distance_segment';
  segment.renderOrder=12;
  segment.visible=false;
  marks.add(segment);
  const cursor=makeCrosshair('Atlas_ruler_voxel','#8b480b');
  marks.add(cursor);
  frameRoot.add(marks);
  return {marks,endpoints,segment,textures,cursor};
 }
 function updateDistances(points,centre){
  const activeFrame=state.compare?sourcePlane:parietalPlane;
  if(!activeFrame?.visible||state.variant!=='SourceLeft'||(!centre&&!points.some(Boolean))){
   if(distanceOverlay)distanceOverlay.marks.visible=false;
   return;
  }
  distanceOverlay??=makeDistanceOverlay();
  const {marks,endpoints,segment,textures,cursor}=distanceOverlay;
  const positions=points.map(point=>point&&rasToFrame(point.values));
  for(const [i,marker] of endpoints.entries()){
   marker.visible=Boolean(positions[i]);
   if(!marker.visible)continue;
   marker.position.set(...positions[i]);
   marker.material.map=textures[Number(points[i].labelled)];
  }
  segment.visible=positions.length===2&&positions.every(Boolean)&&positions[0].some((value,dim)=>value!==positions[1][dim]);
  if(segment.visible){
   const attribute=segment.geometry.attributes.position;
   positions.forEach((position,i)=>attribute.setXYZ(i,...position));
   attribute.needsUpdate=true;
   segment.geometry.computeBoundingSphere();
  }
  cursor.visible=Boolean(centre);
  if(centre)cursor.position.set(...rasToFrame(centre));
  marks.visible=true;
 }
 function showAnnotationPoint(ras){
  const {frame,voxel_size_mm:spacing}=registry.parietal_operculum_sections;
  const inside=annotationMode&&state.variant==='SourceLeft'&&Array.isArray(ras)&&ras.length===3&&ras[0]<=0&&ras.every((mm,axis)=>{
   const index=(mm-frame.ras_origin_mm[axis])/spacing;
   return Number.isInteger(index)&&index>=0&&index<frame.atlas_shape[axis];
  });
  if(inside){
   if(!annotationMarker){
    annotationMarker=makeCrosshair('Atlas_annotation_voxel','#007765');
    frameRoot.add(annotationMarker);
   }
   annotationMarker.position.set(...rasToFrame(ras));
  }
  annotationRAS=inside?ras:undefined;
  if(annotationMarker)annotationMarker.visible=inside;
 }
 function readAnnotationPoint(){
  if(!annotationRAS){annotationReading=undefined;return;}
  const projected=annotationMarker.getWorldPosition(new THREE.Vector3()).project(camera);
  const inView=projected.toArray().every(coordinate=>Math.abs(coordinate)<=1);
  const reading=[...annotationRAS,inView].join(',');
  if(reading===annotationReading)return;
  annotationReading=reading;
  parent.postMessage({type:'brain-annotation-point',ras:annotationRAS,inView},location.origin);
 }
 function updateSourcePlane(plane){
  if(plane===null){
   if(sourcePlane)sourcePlane.visible=false;
   return;
  }
  const {axis,index}=plane;
  const {start_index:start,shape,ras_origin_mm:origin,frame_color:color}=comparison.source_grid;
  if(!Number.isInteger(axis)||axis<0||axis>2||!Number.isInteger(index)||
      index<=start[axis]||index>=start[axis]+shape[axis]-1)return;
  sourcePlane??=makeSourceFrame('VPL_VPM_source_section_frame',color);
  positionSourceFrame(sourcePlane,start,shape,origin,comparison.voxel_size_mm,axis,index);
 }
 function updateParietalPlane(plane){
  const spec=registry.parietal_operculum_sections;
  if(!plane||!spec||state.selection!==String(spec.target_id)){
   if(parietalPlane)parietalPlane.visible=false;
   return;
  }
  const {axis,index,full}=plane;
  const {ranges,focus_start_index,focus_stop_index,atlas_shape,ras_origin_mm}=spec.frame;
  if(!Number.isInteger(axis)||axis<0||axis>2||!Number.isInteger(index)||
     index<ranges[axis][0]||index>=ranges[axis][1])return;
  const start=full?[0,0,0]:focus_start_index;
  const shape=full?atlas_shape:focus_stop_index.map((stop,dim)=>stop-start[dim]);
  parietalPlane??=makeSourceFrame('PaO_source_section_frame',0x654495);
  positionSourceFrame(parietalPlane,start,shape,ras_origin_mm,spec.voxel_size_mm,axis,index);
  if(plane.frame){
   const {center,radius}=parietalPlane.geometry.boundingSphere;
   const local=frameRoot.localToWorld(center.clone());
   const directions=[[-1,.37,.45],[.53,.35,-1],[.53,1,.55]];
   const direction=new THREE.Vector3(...directions[axis]).normalize();
   controls.target.copy(local);
   camera.position.copy(local).add(direction);
   camera.zoom=Math.min(halfY,camera.right)/(radius*1.1);
   camera.updateProjectionMatrix();
   controls.update();
  }
 }
 function setComparison(active){
  if(active===state.compare||!comparisonMaterials.size)return;
  state.compare=active;
  if(active){
   updateParietalPlane(null);
   const materials=new Map();
   for(const [mesh,material] of comparisonMaterials){
    materials.set(mesh,mesh.material);
    mesh.material=material;
   }
   beforeComparison={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom,materials};
   visible();
   frameComparison(comparisonViews.above);
   return;
  }
  showBoundaryRequested=false;
  updateBoundary(false);
  updateSourcePlane(null);
  for(const [mesh,material] of beforeComparison.materials)mesh.material=material;
  controls.target.copy(beforeComparison.target);
  camera.position.copy(beforeComparison.position);
  camera.zoom=beforeComparison.zoom;
  beforeComparison=undefined;
  visible();
  camera.updateProjectionMatrix();
  if(!controls.update()){draw();publish();}
 }
 let axes;
 if(interactive){axes=document.createElementNS('http://www.w3.org/2000/svg','svg');axes.id='axes';axes.setAttribute('aria-hidden','true');axes.setAttribute('viewBox','0 0 110 90');document.body.append(axes);}
 function drawAxes(){if(!axes)return;axes.replaceChildren();for(const [name,v] of [['A',new THREE.Vector3(0,0,1)],['S',new THREE.Vector3(0,1,0)],['R',new THREE.Vector3(-1,0,0)]]){v.applyQuaternion(camera.quaternion.clone().invert());const x=55+v.x*30,y=45-v.y*30,line=document.createElementNS(axes.namespaceURI,'line'),text=document.createElementNS(axes.namespaceURI,'text');for(const [k,val] of Object.entries({x1:55,y1:45,x2:x,y2:y,stroke:'#424c52','stroke-width':1.5}))line.setAttribute(k,val);text.setAttribute('x',x+3);text.setAttribute('y',y-3);text.setAttribute('font-size',12);text.setAttribute('font-family','Arial,Helvetica,sans-serif');text.textContent=name==='R'&&Math.abs(v.z)>.95?(v.z>0?'R ⊙':'R ⊗'):name;axes.append(line,text);}}
 function renderInteractive(){
  const hidden=annotationMode?[sourcePlane,parietalPlane,distanceOverlay?.marks].filter(object=>object?.visible):[];
  for(const object of hidden)object.visible=false;
  renderer.render(scene,camera);
  for(const object of hidden)object.visible=true;
  if(annotationMode)readAnnotationPoint();
 }
 function draw(){renderInteractive();drawAxes();}
 controls.addEventListener('change',()=>{draw();publish();});
 function measureVisibility(){const annotationVisible=annotationMarker?.visible;if(annotationVisible)annotationMarker.visible=false;const distanceVisible=distanceOverlay?.marks.visible;if(distanceVisible)distanceOverlay.marks.visible=false;const boundaryVisible=boundaryMesh?.visible;if(boundaryVisible)boundaryMesh.visible=false;const parietalVisible=parietalPlane?.visible;if(parietalVisible)parietalPlane.visible=false;const box=canvas.getBoundingClientRect();const rt=new THREE.WebGLRenderTarget(900,600,{depthBuffer:true});rt.texture.colorSpace=THREE.LinearSRGBColorSpace;const original=meshes.map(o=>o.material);for(let i=0;i<meshes.length;i++){const id=i+1;meshes[i].material=new THREE.MeshBasicMaterial({color:new THREE.Color().setRGB((id&255)/255,(id>>8)/255,0),side:original[i].side,toneMapped:false});}renderer.setRenderTarget(rt);renderer.setClearColor(0);renderer.render(scene,camera);const p=new Uint8Array(900*600*4);renderer.readRenderTargetPixels(rt,0,0,900,600,p);const count={},best={},centres=meshes.map(o=>new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(camera));for(let k=0;k<p.length;k+=4){const id=p[k]+(p[k+1]<<8);if(id){count[id]=(count[id]||0)+1;const x=(k/4)%900,y=Math.floor(k/4/900),c=centres[id-1],d=(x+.5-(c.x+1)*450)**2+(y+.5-(c.y+1)*300)**2;if(!best[id]||d<best[id].d)best[id]={x,y,d};}}const result=meshes.map((o,i)=>({node:o.name,kind:o.userData.info.kind,source_ids:o.userData.info.source_ids,drawn:o.visible,pixel_samples:count[i+1]||0,visible_pixel_pick_witness:best[i+1]?{clientX:box.left+(best[i+1].x+.5)/900*box.width,clientY:box.top+(1-(best[i+1].y+.5)/600)*box.height}:null,attribution:o.userData.info.kind==='new'?'single exact source-label mesh':'compound assembly only; not constituent-nucleus visibility'}));meshes.forEach((o,i)=>{o.material.dispose();o.material=original[i];});renderer.setRenderTarget(null);renderer.setClearColor(0xffffff);rt.dispose();if(boundaryVisible)boundaryMesh.visible=true;if(parietalVisible)parietalPlane.visible=true;if(distanceVisible)distanceOverlay.marks.visible=true;if(annotationVisible)annotationMarker.visible=true;draw();return result;}
 const glAudit=renderer.getContext(),frontFaces=new Map();let currentMesh;
 for(const o of meshes)o.onBeforeRender=()=>{currentMesh=o;};
 const territoryLoads=new Map();
 let layerLoads;
 async function setLayers(active){
  state.layers=active;
  let status=active?'on':'off';
  if(active){
   parent.postMessage({type:'brain-layers',status:'loading'},location.origin);
   const layerNodes=registry.nodes.filter(node=>node.layer).sort((a,b)=>a.bytes-b.bytes);let before=0;
   layerLoads??=Promise.all(layerNodes.map((node,i)=>{const allowance=before+(layerNodes.length-i)*node.bytes;before+=node.bytes;return loadSelectedTerritory(node.native_id,allowance);}));
   const loaded=await layerLoads;
   const failed=loaded.some(detail=>!detail);
   if(failed)layerLoads=undefined;
   if(!state.layers)return;
   if(failed)status='partial';
  }
  colours();visible();draw();publish();
  parent.postMessage({type:'brain-layers',status},location.origin);
 }
 function loadSelectedTerritory(id,allowance){
  if(territoryLoads.has(id))return territoryLoads.get(id);
  const territory=deferredTerritories.get(id);
  if(!territory)return;
  const pending=loadIsolatedTerritory(territory,allowance).then(detail=>{
   if(detail){
    detail.mesh.onBeforeRender=()=>{currentMesh=detail.mesh;};
    frameRoot.add(detail.scene);
    meshes.push(detail.mesh);
   }
   parent.postMessage({type:'brain-territory',id,ready:Boolean(detail)},location.origin);
   if(!detail)territoryLoads.delete(id);
   return detail;
  });
  territoryLoads.set(id,pending);
  return pending;
 }
 const nativeDraw=glAudit.drawElements.bind(glAudit);glAudit.drawElements=function(...args){if(currentMesh)frontFaces.set(currentMesh.name,{node:currentMesh.name,world_determinant:currentMesh.matrixWorld.determinant(),gl_front_face:glAudit.getParameter(glAudit.FRONT_FACE)===glAudit.CW?'CW':'CCW',culling:glAudit.isEnabled(glAudit.CULL_FACE),gl_cull_face_mode:glAudit.getParameter(glAudit.CULL_FACE_MODE)===glAudit.BACK?'BACK':glAudit.getParameter(glAudit.CULL_FACE_MODE)===glAudit.FRONT?'FRONT':'FRONT_AND_BACK',material_side:currentMesh.material.side,metallic:currentMesh.material.metalness,roughness:currentMesh.material.roughness});return nativeDraw(...args);};
 function frameMetrics(){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const world=new THREE.Matrix3().setFromMatrix4(meshes[0].matrixWorld),B=new THREE.Matrix3().set(-1,0,0,0,0,1,0,1,0),sourceWorld=world.clone().multiply(B),sourceCamera=new THREE.Matrix3().setFromMatrix4(camera.matrixWorldInverse).multiply(sourceWorld);return {rootScale:frameRoot.scale.toArray(),rootWorldMatrixColumnMajor:frameRoot.matrixWorld.toArray(),rootWorldDeterminant:frameRoot.matrixWorld.determinant(),sourceRASdirectionsToWorldColumnMajor:sourceWorld.toArray(),sourceRASdirectionsToWorldDeterminant:sourceWorld.determinant(),sourceRASdirectionsToCameraColumnMajor:sourceCamera.toArray(),sourceRASdirectionsToCameraDeterminant:sourceCamera.determinant(),source_A_screen_horizontal:sourceCamera.elements[3],source_S_screen_vertical_up:sourceCamera.elements[7],cameraRotationDeterminant:new THREE.Matrix3().setFromMatrix4(camera.matrixWorld).determinant(),CSS:[renderer.domElement,document.body,document.documentElement].map(e=>({element:e.tagName,transform:getComputedStyle(e).transform,font:getComputedStyle(e).fontFamily})),drawOrientation:[...frontFaces.values()],visibleWorlds:meshes.filter(o=>o.visible).map(o=>({node:o.name,worldMatrixColumnMajor:o.matrixWorld.toArray(),normalMatrixColumnMajor:o.normalMatrix.toArray(),normalAttribute:o.geometry.hasAttribute('normal'),flatFallback:o.material.flatShading})),lights:rigs.map(r=>({position:r.light.position.toArray(),intensity:r.light.intensity,legacy_offset:r.offset})),shadowMapEnabled:renderer.shadowMap.enabled,castsOrReceivesShadows:meshes.some(o=>o.castShadow||o.receiveShadow),scope:'Actual root/node-world matrices and proper camera. Image top-left row convention is not an anatomy mirror.'};}
 function metrics(measure=false){const gl=renderer.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info');const visibility=measure?measureVisibility():null,records=meshes.map(o=>({name:o.name,visible:o.visible,triangles:o.geometry.index.count/3,normal_attribute_present:o.geometry.hasAttribute('normal'),flat_shading:o.material.flatShading}));return {status:'R6_outward_export_candidate_not_independent_acceptance',variant:state.variant,variantLabel:activeVariant().label,view:state.view,role:state.role,selection:state.selection,isolate:state.isolate,qc:state.qc,width,height,source_counts:registry.counts,construction:descriptions[state.view],active_anatomical_half:'original annotated source left',frame:frameMetrics(),fixed_source_principal_framing:state.view==='Medial'&&!state.isolate&&camera.zoom===1&&controls.target.distanceTo(overviewTarget)<1e-12&&camera.position.distanceTo(overviewTarget.clone().add(offsetInWorld([1,0,0])))<1e-12,camera:{worldMatrixColumnMajor:camera.matrixWorld.toArray(),viewMatrixColumnMajor:camera.matrixWorldInverse.toArray(),projectionMatrixColumnMajor:camera.projectionMatrix.toArray(),position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom,frustum:[camera.left,camera.right,camera.top,camera.bottom]},ordinary_asset_material:query.get('stock')==='1'||query.get('asset')==='1',diagnostic_double_sided:query.get('double')==='1',renderInfo:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},renderer:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),elapsedMs:performance.now()-start,records,visibility,assemblies:[],visibility_sampling:measure?{width:900,height:600,scope:'Depth-tested mesh IDs, not anatomical/function validation'}:null};}
 function publish(viewAction){window.renderMetrics=metrics(false);parent.postMessage({type:'brain-state',state:{...state},variantLabel:activeVariant().label,construction:descriptions[state.view],selectionIds:[...selectedIds()],canIsolate:selectedMeshes().length>0,viewAction},location.origin);}
 function apply(command){
  if('layers' in command){setLayers(command.layers);return;}
  if('annotationMode' in command){
   annotationMode=command.annotationMode;
   if(!annotationMode)annotationReading=undefined;
   showAnnotationPoint(command.annotationPoint);
   draw();
   return;
  }
  if('distancePoints' in command){
   updateDistances(command.distancePoints,command.distanceCursor);
   draw();publish();
   return;
  }
  if('compare' in command){
   setComparison(command.compare);
   return;
  }
  if(state.compare){
   if('sourcePlane' in command){
    updateSourcePlane(command.sourcePlane);
    draw();publish();
   }
   else if(typeof command.boundary==='boolean')setBoundary(command.boundary);
   else if(command.comparisonView==='front'||command.comparisonView==='above')frameComparison(comparisonViews[command.comparisonView]);
   else if(command.focus)frameComparison(camera.position.clone().sub(controls.target).normalize());
   return;
  }
  if('paoPlane' in command){
   updateParietalPlane(command.paoPlane);
   draw();publish();
   return;
  }
  if(command.variant){state.variant=command.variant;state.isolate=false;updateFrame();}
  if(command.view){state.view=command.view;state.isolate=false;}
  if(command.role)state.role=command.role;
  if('selection'in command){
   state.selection=String(command.selection);
   loadSelectedTerritory(Number(state.selection));
   if(Number(state.selection)!==registry.parietal_operculum_sections?.target_id)updateParietalPlane(null);
  }
  if('isolate'in command)state.isolate=command.isolate;
  if('qc'in command)state.qc=command.qc;
  if(state.isolate&&!selectedMeshes().length)state.isolate=false;
  visible();
  if(command.variant||command.view||command.role||'selection'in command||'isolate'in command)colours();
  if(command.variant||command.view||command.reset||command.focus||'isolate'in command)resetCamera(command.focus||state.isolate);
  draw();
  publish(command.viewAction);
 }
 window.addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='brain-command')apply(e.data.command);});
 window.addEventListener('keydown',event=>{
  if(interactive&&event.target===canvas&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&['+','=','-'].includes(event.key)){camera.zoom=Math.min(60,Math.max(.2,camera.zoom*(event.key==='-'?1/1.15:1.15)));camera.updateProjectionMatrix();draw();publish();event.preventDefault();return;}
  if(interactive&&state.compare&&event.key==='Escape'){
   parent.postMessage({type:'brain-comparison-exit'},location.origin);
   event.preventDefault();
  }
 });
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 let down;
 canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
 canvas.addEventListener('pointerup',e=>{
  const origin=down;
  down=undefined;
  if(!interactive||!origin||Math.hypot(e.clientX-origin[0],e.clientY-origin[1])>(e.pointerType==='touch'?10:4))return;
  const box=canvas.getBoundingClientRect();
  if(!box.width||!box.height)return;
  pointer.set((e.clientX-box.left)/box.width*2-1,1-(e.clientY-box.top)/box.height*2);
  ray.setFromCamera(pointer,camera);
  const [hit]=ray.intersectObjects(meshes.filter(mesh=>mesh.visible&&!(mesh.userData.info.see_through&&!state.isolate)));
  if(!hit)return;
  const n=hit.object.userData.info;
  if(n.kind==='new')parent.postMessage({type:'brain-pick',id:n.native_id},'*');
 });

 let resizePending=false;
 function queueResize(){
  if(resizePending)return;
  resizePending=true;
  requestAnimationFrame(()=>{
   resizePending=false;
   if(!resizeCanvas())return;
   down=undefined;
   renderInteractive();
   publish();
  });
 }
 let resolution;
 function watchPixelRatio(){
  resolution=matchMedia('(resolution: '+window.devicePixelRatio+'dppx)');
  resolution.addEventListener('change',()=>{
   watchPixelRatio();
   queueResize();
  },{once:true});
 }
 addEventListener('resize',queueResize);
 if(interactive)watchPixelRatio();
 if(state.isolate)await loadSelectedTerritory(Number(state.selection));
 if(state.isolate&&!selectedMeshes().length)state.isolate=false;
 updateFrame();colours();visible();resetCamera(state.isolate);draw();
 window.brain={renderer,scene,camera,controls,registry,state,frameRoot,variantSpec,apply,draw,measureVisibility,metrics,async isolatedVisibility(){const save={...state};const result=[];for(const r of registry.labels.filter(r=>r.state==='new_per_label_mesh')){state.view=r.family==='insula'?'InsulaDissection':'Deep';state.selection=String(r.id);state.isolate=true;visible();resetCamera(true);draw();const counts=measureVisibility();result.push({id:r.id,name:r.name,camera_zoom:camera.zoom,visible_pixels:counts.find(x=>x.kind==='new'&&x.source_ids[0]===r.id)?.pixel_samples||0,all_other_meshes_hidden:true,overview_and_axes:'UI retains corrected source-left medial overview and proper anatomical axes; source positions unchanged'});}Object.assign(state,save);visible();resetCamera(false);draw();publish();return result;}};
 window.renderMetrics=metrics(query.get('measure')==='1');document.body.dataset.ready='true';publish();if(query.get('measure')==='1')window.renderMetrics=metrics(true);
 loading.remove();document.querySelector('#start')?.remove();
 const separateLabelIds=meshes.filter(o=>o.userData.info.kind==='new').map(o=>o.userData.info.native_id);
 parent.postMessage({type:'brain-ready',separate:separateLabelIds,shared:[...surfaceLabelIds],
  deferred:[...deferredTerritories.keys()]},location.origin);
}catch(e){
 const errorName=e?.name||'Error',errorMessage=e?.message||String(e);
 const heading={
  graphics:'The browser couldn’t start 3D graphics.',
  files:'The model files couldn’t load.',
  scene:'The 3D view couldn’t open.',
 }[startupStep];
 const help=startupStep==='graphics'
  ?'Try opening the model in a browser with WebGL enabled.'
  :startupStep==='files'
  ?'The connection may have dropped. Reload the page to start the download again, from the beginning; the three flat cuts work without the 3D model. If you are using the download and it still won’t open, extract a fresh copy of the whole ZIP and open it with its start file.'
  :'Reload the page. If you are using the download and it still won’t open, extract a fresh copy of the whole ZIP and open it with its start file.';
 document.body.innerHTML='<div id="startup-error"><p id="error" role="alert"></p><p></p><p><button type="button" id="reload">Reload the page</button></p><details><summary>Technical details</summary><pre></pre></details></div>';
 document.querySelector('#error').textContent=heading;
 document.querySelector('#startup-error p:nth-child(2)').textContent=help;
 document.querySelector('#startup-error pre').textContent=errorName+': '+errorMessage;
 const reload=document.querySelector('#reload');
 if(startupStep==='graphics')reload.parentElement.remove();else reload.onclick=()=>(parent===window?location:parent.location).reload();
 delete document.body.dataset.ready;
 document.body.dataset.error=e?.stack||errorName+': '+errorMessage;
 parent.postMessage({type:'brain-error'},location.origin);
 throw e;
}
