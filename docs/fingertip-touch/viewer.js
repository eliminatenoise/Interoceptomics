(() => {
  const byId=id=>document.getElementById(id);
  const frame=byId('frame'),angle=byId('angle'),strain=byId('strain'),play=byId('play');
  // Constructed values. These window numbers and loads do not come from a participant.
  const marks=[7,18,27,36,53,65];
  const windows=Array.from({length:71},(_,i)=>{
    const rise = Math.min(1,i/31);
    return {load:.3+1.5*rise*rise*(3-2*rise),count:Number(marks.includes(i+1))};
  });
  let timer=null;
  function plot(selected){
    const {ctx,w,h}=TouchScene.canvasSize(byId('plot'));
    const x=i=>4+i*(w-8)/70;
    const y=f=>h*.55-(f-.30)*h*.28;
    function line(a,b,color,width=1){
      ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
    }
    line([4,h*.84],[w-4,h*.84],'#c8cabb');
    const at=x(selected);
    line([at,4],[at,h-5],'#637061',1);
    ctx.beginPath();
    windows.forEach((v,i)=>i?ctx.lineTo(x(i),y(v.load)):ctx.moveTo(x(i),y(v.load)));
    ctx.strokeStyle='#0e6556';ctx.lineWidth=2.8;ctx.stroke();
    ctx.fillStyle='#0e6556';ctx.beginPath();ctx.arc(at,y(windows[selected].load),4,0,2*Math.PI);ctx.fill();
    for(const n of marks)line([x(n-1),h*.69],[x(n-1),h*.96],'#aa4b36',n-1===selected?4:2.5);
  }
  function setWindow(){
    const n=Number(frame.value);
    byId('frame-value').value=n+' / 71';
    byId('load').textContent=windows[n-1].load.toFixed(2)+' N';
    byId('spikes').textContent=windows[n-1].count===1?'1 spike':'0 spikes';
    frame.setAttribute('aria-valuetext','Window '+n+' of 71, '+byId('load').textContent+', '+byId('spikes').textContent);
    TouchScene.draw(byId('scene'),Number(angle.value),(n-1)/70);plot(n-1);
  }
  function drawPatch(){
    const {ctx,w,h}=TouchScene.canvasSize(byId('patch'));
    const change=Number(strain.value)/100;
    const m=w/2,base=Math.min(91,w*.23);
    function triangle(factor,original){
      const p=[[m-base*factor,h*.75],[m+base*factor,h*.75],[m+9,h*.17]];
      ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
      ctx.setLineDash(original?[4,4]:[]);ctx.strokeStyle=original?'#647067':'#0d6656';ctx.lineWidth=original?1.5:2.5;
      if(!original){ctx.fillStyle='rgba(46,130,99,.11)';ctx.fill();}ctx.stroke();
      ctx.setLineDash([]);ctx.fillStyle=original?'#69726c':'#1a6656';
      for(const [x,y] of p){ctx.beginPath();ctx.arc(x,y,original?2.5:4,0,2*Math.PI);ctx.fill();}
    }
    triangle(1,true);triangle(1+change,false);
    const v=Number(strain.value);
    byId('strain-value').value=(v<0?'−':v>0?'+':'')+Math.abs(v)+'%';
    strain.setAttribute('aria-valuetext',v===0?'Unchanged width':Math.abs(v)+' percent '+(v<0?'shorter':'longer'));
  }
  function stop(){clearInterval(timer);timer=null;play.textContent='Play';}
  play.addEventListener('click',()=>{
    if(timer){stop();return;}
    if(Number(frame.value)===71){frame.value=1;setWindow();}
    play.textContent='Pause';
    timer=setInterval(()=>{frame.value=Number(frame.value)+1;setWindow();if(Number(frame.value)===71)stop();},130);
  });
  frame.addEventListener('input',()=>{stop();setWindow();});
  byId('next').addEventListener('click',()=>{stop();frame.value=marks.find(n=>n>Number(frame.value))??marks[0];setWindow();});
  angle.addEventListener('input',setWindow);
  byId('side').addEventListener('click',()=>{angle.value=0;setWindow();});
  const scene=byId('scene');let drag;
  scene.addEventListener('pointerdown',e=>{drag={x:e.clientX,angle:Number(angle.value)};scene.setPointerCapture(e.pointerId);});
  scene.addEventListener('pointermove',e=>{
    if(!drag)return;
    const raw=Math.round(drag.angle+(e.clientX-drag.x)*.65);
    angle.value=((raw+180)%360+360)%360-180;setWindow();
  });
  scene.addEventListener('lostpointercapture',()=>{drag=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  strain.addEventListener('input',drawPatch);
  function draw(){setWindow();drawPatch();}
  if('ResizeObserver' in window)new ResizeObserver(draw).observe(document.querySelector('main'));
  window.addEventListener('resize',draw);draw();
})();
