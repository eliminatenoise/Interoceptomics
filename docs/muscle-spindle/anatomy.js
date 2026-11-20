/* Original parametric cutaway. Coordinates are illustrative. The sides of the
   capsule and muscle facing the reader are open to expose the sensory ending. */
const RAD = Math.PI / 180;
const V = {
  add: (a,b) => a.map((v,i) => v + b[i]),
  sub: (a,b) => a.map((v,i) => v - b[i]),
  scale: (a,s) => a.map(v => v*s),
  dot: (a,b) => a.reduce((sum,v,i) => sum + v*b[i],0),
  cross: ([a,b,c],[d,e,f]) => [b*f-c*e,c*d-a*f,a*e-b*d],
  unit: a => V.scale(a,1/(Math.hypot(...a)||1))
};
function spindleGeometry() {
  const parts = [];
  const tau = 2 * Math.PI;
  function surface(name, group, longitudinal, angular, sample, color, closed=true) {
    const p=[], n=[], c=[], f=[];
    const ring = closed ? angular : angular + 1;
    for (let i=0;i<=longitudinal;i++) {
      for (let j=0;j<ring;j++) {
        const t=i/longitudinal, a=j/angular;
        const point=sample(t,a);
        p.push(...point);
        const eps=.0001;
        const axial=V.sub(sample(Math.min(1,t+eps),a), sample(Math.max(0,t-eps),a));
        const radial=V.sub(sample(t,a+eps),sample(t,a-eps));
        n.push(...V.unit(V.cross(radial,axial)));
        c.push(...color(t,a));
        if (i===longitudinal || (!closed && j===angular)) continue;
        const u=i*ring+j, v=i*ring+(j+1)%ring;
        f.push(u,v,u+ring,v,v+ring,u+ring);
      }
    }
    parts.push({name,group,p,n,c,f});
  }
  const tint=(rgb,value) => rgb.map(v=>Math.max(0,Math.min(1,v*value)));
  const fibreTint=(base,phase) => (t,a) => tint(base, .91+.07*Math.cos(tau*(a*8+.18*Math.sin(4*t+phase)))+.04*Math.sin(36*t+phase));
  const shell=(x,r,theta,y,z,aspect=1)=>[x,y+r*Math.cos(theta),z+aspect*r*Math.sin(theta)];
  // Fascicle profiles converge into the connective tissue at each end.
  // Leave the anterior side open; each visible strand stands for a muscle bundle.
  for(let k=0;k<17;k++) {
    const theta=(.22+k/16*1.38)*Math.PI+.65;
    const far=(k%2)*.07;
    surface('Muscle bundle '+(k+1),'muscle',36,12,(t,a)=>{
      const x=-4.04+8.08*t, belly=Math.pow(Math.max(.0002,Math.sin(Math.PI*t)),.65);
      let y=.03+Math.cos(theta)*(.025+.80*belly+far*belly);
      let z=-.20+Math.sin(theta)*(.03+.66*belly+far*belly)+.055*Math.sin(4*t+.5*k)*belly;
      const r=.012+.18*belly;
      if(Math.abs(x)<3.04){
        // Reserve the capsular space before placing the larger surrounding bundles.
        const rb=.025+.55*Math.max(0,Math.cos(Math.PI*x/6))**.72;
        const d=Math.hypot(y-.38,(z-.30)/.78), clearance=rb+1.42*r;
        if(d<clearance){y=.38+(y-.38)*clearance/d;z=.30+(z-.30)*clearance/d;}
      }
      return shell(x,r*(1+.05*Math.cos(tau*3*a+.5*k)),tau*a,y,z,.85);
    },fibreTint([.67+.03*(k%4),.235+.015*(k%5),.21+.012*(k%4)],k));
  }
  for(const sign of [-1,1]) {
    surface(sign<0?'Left tendon':'Right tendon','tendon',24,22,(t,a)=>{
      const x=sign*(3.14+1.88*t), r=.03+.16*t+.22*Math.sin(Math.PI*t)**.85;
      // Maintain the same winding for both ends.
      return shell(x,r*(1+.05*Math.cos(3*tau*a)),sign*tau*a,0,-.19,.56+.19*(1-t));
    },fibreTint([.89,.79,.63],sign));
    surface('Tendon cut face '+sign,'tendon',6,22,(t,a)=>
      shell(sign*(5.015+t*.008),.19*(1-t*.999),sign*tau*a,0,-.19,.56),
      ()=>[.76,.65,.51]);
  }
  const cy=.38, cz=.30;
  const capsuleRadius=t=>.025+.55*Math.pow(Math.sin(Math.PI*t),.72);
  const capsule=(t,a)=>shell(-3.0+6*t,capsuleRadius(t),(.52+1.06*a)*Math.PI,cy,cz,.78);
  surface('Spindle capsule, back cutaway','capsule',48,28,capsule,
    (t,a)=>tint([.62,.75,.70],.92+.05*Math.sin(t*10+a*27)),false);
  function tube(name,group,curve,radius,color,segments=40,sides=9) {
    function vertex(t,a) {
      const dir=V.unit(V.sub(curve(Math.min(1,t+.0002)),curve(Math.max(0,t-.0002))));
      const ref=Math.abs(dir[2])>.9?[0,1,0]:[0,0,1];
      const v=V.unit(V.cross(dir,ref)), w=V.cross(dir,v);
      const r=typeof radius==='function'?radius(t):radius;
      return V.add(curve(t), V.add(V.scale(v,r*Math.cos(tau*a)),V.scale(w,r*Math.sin(tau*a))));
    }
    surface(name,group,segments,sides,vertex,color);
  }
  for(const a of [0,1]) tube('Cut capsule margin '+(a+1),'capsule',t=>capsule(t,a),.035,()=>[.49,.67,.62],45);
  const fibres=[[-.16,.18,.088],[.13,.03,.083],[-.24,-.05,.054],[.02,-.20,.054],[.21,-.15,.049]];
  const yNerve=1.05, zNerve=1.70;
  function nerveColor(t,a) {return tint([.98,.69,.19],.96+.04*Math.cos(a*tau*3));}
  tube('Group Ia sensory axon','nerve',t=>[-1.52+1.30*t,
    yNerve+( .78-yNerve)*t+.15*Math.sin(t*Math.PI),zNerve+(.61-zNerve)*t+.12*Math.sin(t*Math.PI)],t=>.053+.022*(1-t),nerveColor);
  fibres.forEach(([oy,oz,thickness],k)=>{
    const centre=x=>{const spread=.17+.83*Math.exp(-x*x/3.5);return [x,cy+oy*spread,cz+oz*spread];};
    const radius=x=>thickness*(.08+.53*Math.max(0,1-(x/3.09)**4)+.39*Math.exp(-x*x/.65));
    surface('Intrafusal fibre '+(k+1),'fibres',48,14,(t,a)=>{
      const x=-3.09+6.18*t, [,y,z]=centre(x);
      return shell(x,radius(x),tau*a,y,z);
    },fibreTint(k<2?[.88,.51,.38]:[.83,.55,.46],k));
    // A common sensory stem branches before winding around individual fibres.
    const turn=t=>{const x=-.92+1.60*t+.045*k,[,y,z]=centre(x),r=radius(x)+.018;
      return shell(x,r,(.12+k*.19+8*t)*tau,y,z);};
    const anchor=[-.22,.78,.61], end=turn(0);
    tube('Primary ending branch '+(k+1),'nerve',t=>V.add(
      V.add(V.scale(anchor,1-t),V.scale(end,t)),[0,.12*Math.sin(t*Math.PI),.11*Math.sin(t*Math.PI)]),
      .027,nerveColor,20);
    tube('Annulospiral terminal '+(k+1),'nerve',turn,.020,nerveColor,152,7);
  });
  return parts;
}
if (typeof module!=='undefined') module.exports={spindleGeometry};
