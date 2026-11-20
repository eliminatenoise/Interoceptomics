/* The surfaces and the illustrations use independent frames. Their colours stay fixed. */
const SITE = {
  SC6: {label:'Neck', title:'Neck surface · SC6', ref:'The active electrode sat over the bony tip of C6 at the back of the neck. Its reference sat over T6, farther down the back.', detail:'SC6 is the centre of the study’s cervical electrode patch. Open the study drawing to see the neighbouring electrodes.', model:'The eight cervical cord segments from the Human Reference Atlas. The neck electrode sat on skin over a vertebra. Its position on the skin cannot be marked on this isolated cord.', limit:'The surface voltage mixes nearby and distant fields. A deflection at 13 ms alone cannot identify the spinal generator discussed in the paper.', group:'cord', yaw:163, tilt:6},
  Biceps: {label:'Axilla', title:'Left axilla · Biceps', ref:'The study recorded over the upper arm near the armpit, with the reference about 3 cm closer to the shoulder.', detail:'The source calls this channel Biceps. The pair was placed here to pick up the median nerve’s electrical response (surface electroneurography).', model:'Schematic left arm. The yellow disk marks the approximate inner upper-arm recording region. The model supplies no participant-specific electrode coordinates.', limit:'The channel name refers to the nearby muscle. Skin electrodes can also pick up muscle and other electrical activity.', group:'upper', yaw:48, tilt:1},
  CP4: {label:'Scalp', title:'Right scalp · CP4', ref:'CP4 sits over the right centroparietal scalp. The reference was the right mastoid, the bony prominence behind the ear.', detail:'The cap places CP4 behind and to the right of the top of the head. The yellow disk marks the standard electrode position.', model:'The CP4 position from FieldTrip’s standard electrode coordinates on its Colin27 scalp. The cap fit of each study participant differs from the template.', limit:'Scalp EEG combines fields from many sources. This channel alone cannot locate the brain tissue that produced a voltage change.', group:'scalp', yaw:128, tilt:38},
  Thumb: {label:'Thumb', title:'Left thumb muscle · Thumb', ref:'One electrode sat on the muscle belly at the base of the thumb. Its reference was closer to the wrist.', detail:'The abductor pollicis brevis lies in the fleshy pad at the thumb’s base. The Thumb channel records muscle electrical activity (surface EMG).', model:'Schematic left palm. Yellow marks the approximate thumb-pad recording region. The study drawing shows the stimulus at the wrist, a separate site.', limit:'The recording contains no thumb position, angle or force. A muscle voltage cannot supply those measurements.', group:'palm', yaw:4, tilt:4},
  ECG: {label:'Heart', title:'Chest surface · ECG', ref:'The active electrode sat along the left lower rib margin. Its reference lay below the right collarbone.', detail:'These two body-surface electrodes record the heart’s electrical activity. Cardiac fields can also reach the neck electrodes.', model:'Heart surfaces from the Human Reference Atlas. Both ECG electrodes were on the outside of the torso. Neither was attached to this heart.', limit:'The traces are aligned to wrist stimuli. These short averages cannot establish a heartbeat interval or remove cardiac contamination.', group:'heart', yaw:-24, tilt:9}
};
function decoded(b64, Type){return new Type(Uint8Array.from(atob(b64), c=>c.charCodeAt(0)).buffer);}
function actualMesh(source, rgb){
  const m=newMesh();m.p=Array.from(decoded(source.xyz,Float32Array));m.f=Array.from(decoded(source.faces,Uint16Array));m.n=new Float32Array(m.p.length);
  for(let i=0;i<m.f.length;i+=3){const [a,b,c]=m.f.slice(i,i+3).map(j=>3*j);const n=V.cross(V.sub(m.p.slice(b,b+3),m.p.slice(a,a+3)),V.sub(m.p.slice(c,c+3),m.p.slice(a,a+3)));for(const j of [a,b,c])for(let k=0;k<3;k++)m.n[j+k]+=n[k];}
  for(let i=0;i<m.p.length;i+=3){m.n.set(V.unit(Array.from(m.n.slice(i,i+3))),i);m.c.push(...rgb);}
  // The shared canvas fallback performs vector additions with regular arrays.
  m.n=Array.from(m.n);return m;
}
function schematicArm(palmOnly){
  const m=newMesh(),skin=color('c69c7e'), gold=color('f9bc44'), upper=[12,0,73], elbow=[2,0,16], wrist=[-9,0,-32];
  if(!palmOnly){
    ellipsoid(m,upper,[X,Y,Z],[13,12,14],skin);limb(m,upper,elbow,[[0,10,11],[.2,12,12],[.43,11,10],[.72,8,9],[1,6,7]],skin,22);
    ellipsoid(m,elbow,[X,Y,Z],[6.3,6,7],skin);limb(m,elbow,wrist,[[0,6,6],[.18,7.5,8.6],[.48,7,8],[.78,5,5.8],[1,4,4.8]],skin,22);
    ellipsoid(m,[21.3,4.9,57],[X,Y,Z],[2.1,2.8,3.2],gold);
  }else {limb(m,[-8,0,-22],wrist,[[0,4.6,5.2],[1,4,4.8]],skin,24);}
  ellipsoid(m,[-9,0,-44],[X,Y,Z],[9.4,4,14],skin,12,22);
  const tips=[[-15.4,-68],[-11.1,-71],[-6.5,-68.5],[-2.4,-63]];
  for(const [x,z] of tips){const top=[x,-.1,-51.4],end=[x+.5,1.3,z];limb(m,top,end,[[0,1.9,2.1],[.30,2,2.1],[.61,1.7,1.8],[.89,1.5,1.6],[1,.7,.7]],skin);}
  limb(m,[-15.4,.9,-40],[-25,1.6,-53.5],[[0,3.5,3.1],[.32,3.1,3],[.66,2.35,2.5],[.91,1.9,2],[1,.7,.7]],skin);
  if(palmOnly){ellipsoid(m,[-14.6,2.6,-43],[X,Y,Z],[3.2,2.1,5.7],skin);ellipsoid(m,[-14.4,4.4,-42.5],[X,Y,Z],[1.7,1.1,2.1],gold);}
  return [m];
}
const cachedModels = new Map();
function parts(group){
  if(cachedModels.has(group)) return cachedModels.get(group);
  let meshes;
  if(group==='upper'||group==='palm') meshes=schematicArm(group==='palm');
  else {
    meshes=SURFACES[group].map((m,i)=>actualMesh(m, group==='cord' ? color(i%2?'d5ad70':'dfbd83') : group==='heart' ? color(['a8544c','be7064','a7655a'][i%3]) : color('bc9f82')));
    if(group==='scalp'){const marker=newMesh();ellipsoid(marker,SURFACES.CP4,[X,Y,Z],[6,6,6],color('ffba33'),10,16);meshes.push(marker);}
  }
  cachedModels.set(group,meshes);return meshes;
}
const anatomyView=(()=>{
  const el=id=>document.getElementById(id);const opts={center:[0,0,0],yaw:163,tilt:6,span:[1,1],fitPose:true};
  const cam=camera(el('anatomy'),opts);let site='SC6', mode='model';
  function draw(){
    const s=SITE[site],model=mode==='model';el('surface').hidden=!model;el('plate').hidden=model;
    el('show-model').setAttribute('aria-pressed',String(model));el('show-figure').setAttribute('aria-pressed',String(!model));
    el('plate').src=site==='Thumb'?'reference/wrist.webp':'reference/montage.webp';el('inset').hidden=site!=='SC6';el('plate').alt=site==='Thumb'?'Published stimulus drawing with the wrist marked in red':'Published whole-body electrode montage and detailed dorsal spinal grid';
    el('anatomy-caption').textContent=model?s.model:site==='Thumb'?'Study figure 1A. Red marks stimulation of the median nerve at the left wrist. The muscle recording comes from the thumb pad.':'Study figure 1C. The drawing shows the spinal electrode grids and other surface recording regions. The labels along the back distinguish C6 and the thoracic reference.';
    if(model){opts.yaw=s.yaw;opts.tilt=s.tilt;cam.setParts(parts(s.group));cam.reset();}
  }
  el('inset').onclick=()=>{mode='figure';draw();};el('show-model').onclick=()=>{mode='model';draw();};el('show-figure').onclick=()=>{mode='figure';draw();};el('left').onclick=()=>cam.rotate(-25,0);el('right').onclick=()=>cam.rotate(25,0);el('reset').onclick=()=>cam.reset();
  return {select(k){site=k;draw();}};
})();
