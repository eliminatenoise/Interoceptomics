'use strict';
(() => {
  const el = id => document.getElementById(id);
  const {firstIndex,markerLabels,labXYZmm,upwardPlate1N}=recording;
  const heel=markerLabels.indexOf('R_FCC');
  const average=a=>a.reduce((sum,v)=>sum+v,0)/a.length;
  const forces=upwardPlate1N.map(average);
  const mm=(i,axis)=>labXYZmm[i-firstIndex][heel][axis];
  const time=i=>(i/recording.pointHz).toFixed(2);
  const signed=v=>(v<0?'−':'+')+Math.abs(v).toFixed(3);
  const drawScene=makeScene(el('scene'),el('view'),el('reset'));
  let cutoff=29, index=39, playing=0;
  const start=()=>cutoff-23, target=()=>cutoff+10;
  function stop(){clearInterval(playing);playing=0;el('play').textContent='Play slowly';}
  function svgNode(svg,name,props,text){
    const node=document.createElementNS('http://www.w3.org/2000/svg',name);
    for(const [key,val] of Object.entries(props))node.setAttribute(key,val);
    if(text!==undefined)node.textContent=text;
    svg.append(node);return node;
  }
  function plot(svg,lo,hi,yMin,yMax,yTicks,xTicks,series,unit,shade){
    svg.replaceChildren();
    const left=48,right=437,top=20,bottom=142;
    const x=i=>left+(right-left)*(i-lo)/(hi-lo), y=v=>bottom-(bottom-top)*(v-yMin)/(yMax-yMin);
    const line=(x1,y1,x2,y2,stroke,dash)=>svgNode(svg,'line',{x1,y1,x2,y2,stroke,'stroke-dasharray':dash||'none'});
    function label(tx,ty,value,align='middle',colour='#364d49'){
      svgNode(svg,'text',{x:tx,y:ty,'font-size':12,'font-family':'system-ui,sans-serif','text-anchor':align,fill:colour},value);
    }
    if(shade)svgNode(svg,'rect',{x:x(cutoff),y:top,width:x(hi)-x(cutoff),height:bottom-top,fill:'#e1e9dc'});
    for(const v of yTicks){line(left,y(v),right,y(v),v===0?'#82968e':'#d2dbd1');label(left-7,y(v)+4,String(v),'end');}
    label(left-7,top-8,unit,'end');
    for(const [i,text] of xTicks){line(x(i),bottom,x(i),bottom+4,'#82968e');label(x(i),bottom+19,text,i===lo?'start':i===hi?'end':'middle');}
    if(shade){line(x(cutoff),top,x(cutoff),bottom,'#537766','4 4');label(x(cutoff)-4,top-6,'Cutoff','end');}
    for(const s of series){
      const pts=[];for(let i=lo;i<=hi;i++)pts.push(`${x(i)},${y(s.value(i))}`);
      svgNode(svg,'polyline',{points:pts.join(' '),fill:'none',stroke:s.color,'stroke-width':2.8,'stroke-dasharray':s.dash||'none','stroke-linecap':'round','stroke-linejoin':'round'});
    }
    if(index>=lo&&index<=hi){
      line(x(index),top,x(index),bottom,'#43574e','3 3');
      for(const s of series)svgNode(svg,'circle',{cx:x(index),cy:y(s.value(index)),r:3.5,fill:s.color,stroke:'#fff','stroke-width':1});
    }
  }
  function update() {
    const f=forces[index-firstIndex], end=target();
    const phase=index<cutoff?'Recorded history':index===cutoff?'History cutoff':index===end?'Observed target':'After the cutoff';
    el('frame').value=index;el('frame').setAttribute('aria-valuetext',`${time(index)} seconds, ${phase}, index ${index}`);
    el('clock').textContent=time(index)+' s';el('phase').textContent=phase;el('force').textContent=f.toFixed(1);
    for(let axis=0;axis<3;axis++)el('coord'+axis).textContent=mm(index,axis).toFixed(2)+' mm';
    el('frameNote').textContent=`Index ${index} · Physical C3D frame ${index+1}`;
    el('summary').textContent=`History ${time(start())}–${time(cutoff)} s · Observed target ${time(end)} s · Slow playback shows 10 recorded frames per second.`;
    const v=[0,1,2].map(k=>mm(end,k)-mm(cutoff,k));
    el('outcome').textContent=`From ${time(cutoff)} to ${time(end)} s, the right heel moved ${signed(v[0])} mm along X, ${signed(v[1])} mm across Y and ${signed(v[2])} mm vertically. The plate recorded ${forces[end-firstIndex].toFixed(1)} N upward at the target. The heel’s straight-line displacement was ${Math.hypot(...v).toFixed(3)} mm.`;
    const raw=upwardPlate1N[index-firstIndex], j=15*index;
    el('analog').textContent=`At ${time(index)} s, plate samples ${j}–${j+14} (zero-based) span ${((j-7)/1500).toFixed(5)}–${((j+7)/1500).toFixed(5)} s, centred on sample ${j+7}. The 15 values range from ${Math.min(...raw).toFixed(3)} to ${Math.max(...raw).toFixed(3)} N. Their mean is ${f.toFixed(4)} N.`;
    el('model').href=`pose-${end}.glb`;
    drawScene(index,cutoff);
    plot(el('forceChart'),start(),end,0,700,[0,200,400,600],[[start(),time(start())+' s'],[cutoff,time(cutoff)+' s'],[end,time(end)+' s']],
      [{color:'#156452',value:i=>forces[i-firstIndex]}],'N',true);
    const strokes=[['#265f90',''],['#aa4d17','7 4'],['#126b51','1 5']];
    plot(el('heelChart'),cutoff,end,-1,2,[-1,0,1,2],[[cutoff,'0 ms'],[cutoff+5,'50 ms'],[end,'100 ms']],
      strokes.map(([color,dash],axis)=>({color,dash,value:i=>mm(i,axis)-mm(cutoff,axis)})),'mm',false);
    el('forceChart').setAttribute('aria-label',`Platform 1 upward force from ${time(start())} to ${time(end)} seconds. Cursor ${time(index)} seconds, ${f.toFixed(1)} newtons. The table has every value.`);
    el('heelChart').setAttribute('aria-label',`Right heel displacement after ${time(cutoff)} seconds. Target X ${signed(v[0])}, Y ${signed(v[1])}, Z ${signed(v[2])} millimetres.`);
    for(const row of el('rows').rows)row.classList.toggle('current',Number(row.dataset.index)===index);
  }
  function selectWindow(){
    stop();cutoff=Number(el('window').value);index=target();
    el('frame').min=start();el('frame').max=target();el('rows').replaceChildren();
    for(let i=start();i<=target();i++){
      const row=document.createElement('tr');row.dataset.index=i;
      for(const field of [i,time(i),...[0,1,2].map(a=>mm(i,a).toFixed(3)),forces[i-firstIndex].toFixed(4)]){
        const cell=document.createElement('td');cell.textContent=field;row.append(cell);
      }
      el('rows').append(row);
    }
    update();
  }
  el('window').addEventListener('change',selectWindow);
  el('frame').addEventListener('input',()=>{stop();index=Number(el('frame').value);update();});
  el('cut').addEventListener('click',()=>{stop();index=cutoff;update();});
  el('target').addEventListener('click',()=>{stop();index=target();update();});
  el('play').addEventListener('click',()=>{
    if(playing){stop();return;}
    if(index===target())index=start();update();el('play').textContent='Stop';
    playing=setInterval(()=>{index++;update();if(index>=target())stop();},100);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});selectWindow();
})();
