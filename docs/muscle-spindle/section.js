/* Intersect the authored triangles with a plane perpendicular to the fibres.
   The small threshold joins adjacent triangle edges in model coordinates. */
function transverseSlice(parts,xCut) {
  const slices=[];
  for(const mesh of parts){
    const coordinate=i=>mesh.p.slice(3*i,3*i+3);
    const key=point=>point.slice(1).map(n=>Math.round(n*1e6)).join(',');
    const neighbors=new Map(), positions=new Map();
    for(let i=0;i<mesh.f.length;i+=3) {
      const points=mesh.f.slice(i,i+3).map(coordinate),hits=[];
      for(let k=0;k<3;k++){
        const a=points[k], b=points[(k+1)%3];
        if((a[0]<xCut)===(b[0]<xCut))continue;
        const t=(xCut-a[0])/(b[0]-a[0]);
        hits.push([xCut,a[1]+t*(b[1]-a[1]),a[2]+t*(b[2]-a[2])]);
      }
      if(hits.length!==2)continue;
      const [ka,kb]=hits.map(key);if(ka===kb)continue;
      for(const [from,to,p] of [[ka,kb,hits[0]],[kb,ka,hits[1]]]){
        positions.set(from,p);if(!neighbors.has(from))neighbors.set(from,new Set());neighbors.get(from).add(to);
      }
    }
    const unvisited=new Set(positions.keys());
    while(unvisited.size){
      const first=[...unvisited].find(k=>neighbors.get(k).size===1)||unvisited.values().next().value;
      const line=[];let current=first;
      while(current!==undefined && unvisited.has(current)){
        line.push(positions.get(current));unvisited.delete(current);
        current=[...neighbors.get(current)].find(k=>unvisited.has(k));
      }
      if(line.length<3)continue;
      let p=line.flat(),f=[];
      if(neighbors.get(first).size===1){
        // The open capsule is a thin margin rather than a filled solid.
        for(const [,y,z] of line)p.push(xCut,.38+(y-.38)*.94,.30+(z-.30)*.94);
        for(let j=0;j<line.length-1;j++){const inner=j+line.length;f.push(j,j+1,inner,j+1,inner+1,inner);}
      }else{
        const centre=line.reduce((s,q)=>V.add(s,V.scale(q,1/line.length)),[0,0,0]);
        p.push(...centre);
        for(let j=0;j<line.length;j++)f.push(line.length,j,(j+1)%line.length);
      }
      const n=[],c=[];
      for(let j=0;j<p.length;j+=3){n.push(1,0,0);c.push(...mesh.c.slice(0,3));}
      slices.push({name:mesh.name,group:mesh.group,p,n,c,f});
    }
  }
  return slices;
}
