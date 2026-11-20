(() => {
  const $=id=>document.getElementById(id);
  const {regional,sites,timing}=JSON.parse($('data').textContent);
  const named=regional.regions.filter(r=>r.by_cue), areas=new Map(regional.regions.map(r=>[r.code,r]));
  const names={0:'Area unassigned',1:'Upper primary motor cortex',2:'Around the central sulcus',3:'Upper primary sensory cortex',4:'Lower sensorimotor cortex',6:'Frontal cortex, outside the central strip',7:'Parietal cortex, outside the central strip'};
  const markers=sites.contacts;
  if(markers.length!==46||!markers.every((r,i)=>r.index1===i+1))throw Error('The recorded contacts are out of order.');
  const fmt=n=>(n>0?'+':'')+n.toFixed(2).replace('-','−');
  let band=$('band').value,cue=$('cue').value,area=1,id=markers.find(r=>r.region_code===1).index1;
  let viewer=null,job=0,controller=null;
  let timer=0;
  function timeMode(){return $('window-mode').value==='elapsed';}
  function windowRow(){return timing.by_cue[cue].windows[Number($('time-bin').value)];}
  function regionValue(r){return timeMode()?windowRow().region_db[band][timing.regions.findIndex(g=>g.code===r.code)]:r.by_cue[cue][band].mean_db;}
  function contactValue(m){return timeMode()?windowRow().contact_db[band][m.index1-1]:m.by_cue[cue][band];}
  function stop(){if(timer)clearInterval(timer);timer=0;$('play').textContent='Play windows';$('play').setAttribute('aria-pressed','false');}
  function timeControls(){
    const on=timeMode(),i=Number($('time-bin').value);
    $('time-controls').hidden=!on;$('glove-section').hidden=!on;
    const w=timing.windows[i];$('window-text').textContent=w.start_ms+'–'+w.end_ms+' ms';
    $('time-bin').setAttribute('aria-valuetext',$('window-text').textContent);
    $('time-note').textContent=on?'Each point averages the same trials in overlapping half-second windows. Both the contacts and the five glove sensors follow the selected window. Playback advances through averages.':'The regional and contact values below compare the middle second of each finger cue with the middle second of its following blank interval.';
    if(!on)return;
    const glove=windowRow().glove;
    $('glove').replaceChildren(...timing.digits.map((digit,j)=>{
      const tr=document.createElement('tr');tr.dataset.cued=String(cue===digit);
      const label=document.createElement('th');label.scope='row';label.textContent=digit[0].toUpperCase()+digit.slice(1);tr.append(label);
      for(const v of [glove.cue[j],glove.blank[j]]){const td=document.createElement('td');td.textContent=v.toFixed(2);tr.append(td);}
      return tr;
    }));
  }
  const colors={low:[.16,.52,.70],mid:[.95,.90,.79],high:[.77,.29,.12]};
  function color(db) {
    const end=db<0?colors.low:colors.high,f=Math.min(1,Math.abs(db)/6);
    return colors.mid.map((v,k)=>v+f*(end[k]-v));
  }
  function plot() {
    const trialCount=regional.trial_counts[cue];
    $('summary').textContent=trialCount+' paired trials · 1 participant';
    const rows=[];
    for(const r of named) {
      const v=regionValue(r),btn=document.createElement('button');
      btn.className='row';btn.type='button';btn.setAttribute('aria-pressed',String(area===r.code));
      const name=document.createElement('span');name.className='rname';name.textContent=names[r.code]+' ';
      const n=document.createElement('span');n.className='n';n.textContent='· '+r.n_contacts+' contact'+(r.n_contacts===1?'':'s');name.append(n);
      const bar=document.createElement('span');bar.className='bar';bar.setAttribute('aria-hidden','true');
      const fill=document.createElement('span');fill.className='fill';const frac=Math.min(50,Math.abs(v)/12*50);
      fill.style.left=(v<0?50-frac:50)+'%';fill.style.width=frac+'%';fill.style.background=v<0?'var(--lower)':'var(--higher)';bar.append(fill);
      const val=document.createElement('span');val.className='v';val.textContent=fmt(v);
      btn.dataset.code=r.code;btn.setAttribute('aria-label',name.textContent+', mean '+fmt(v)+' dB');
      btn.append(name,bar,val);btn.addEventListener('click',()=>{area=r.code;id=markers.find(s=>s.region_code===area).index1;refresh();$('regions').querySelector('[data-code="'+r.code+'"]').focus({preventScroll:true});});
      rows.push(btn);
    }
    $('regions').replaceChildren(...rows);
    $('coverage').textContent='Six sampled regions. Four additional contacts have no named region. No temporal or occipital contacts were present.';
  }
  function selectContact(k){const m=markers[k-1];if(!m)return;id=k;area=m.region_code;refresh();}
  function refresh() {
    cue=$('cue').value;band=$('band').value;timeControls();plot();$('contact').value=String(id);
    const m=markers[id-1],r=areas.get(m.region_code);
    const hz=band==='high'?'70–110 Hz':'12–20 Hz';
    $('site-title').textContent='Contact '+id+' · '+names[m.region_code];
    $('site-result').textContent=hz+' power at this contact changed by '+fmt(contactValue(m))+' dB across '+regional.trial_counts[cue]+' paired trials.';
    const group=r.by_cue?.[cue][band];
    $('site-detail').textContent=group?r.label+' in the source. Area mean '+fmt(group.mean_db)+' dB. The middle half of trial changes ran from '+fmt(group.q25_db)+' to '+fmt(group.q75_db)+' dB.':'The original source does not name an area for this contact. Its measured change is still available.';
    if(group && timeMode())$('site-detail').textContent=r.label+' in the source. Mean across its '+r.n_contacts+' recording contacts in the selected window was '+fmt(regionValue(r))+' dB.';
    if(viewer)viewer.update(markers.flatMap(r=>color(contactValue(r))),markers.map(r=>r.region_code===area?1:0),id,$('xray').checked);
  }
  for(const m of markers)$('contact').add(new Option('Contact '+m.index1+' · '+names[m.region_code],String(m.index1)));
  $('contact').addEventListener('change',()=>selectContact(Number($('contact').value)));
  for(const e of ['cue','band','xray','window-mode'])$(e).addEventListener('change',()=>{stop();refresh();});
  $('time-bin').addEventListener('input',()=>{stop();refresh();});
  $('play').addEventListener('click',()=>{
    if(timer){stop();return;}
    if(Number($('time-bin').value)>=timing.windows.length-1){$('time-bin').value=0;refresh();}
    $('play').textContent='Pause windows';$('play').setAttribute('aria-pressed','true');
    timer=setInterval(()=>{const n=Number($('time-bin').value)+1;$('time-bin').value=n;refresh();if(n>=timing.windows.length-1)stop();},650);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  function pending(yes){$('load').disabled=yes;$('cancel').hidden=!yes;}
  async function load(file) {
    const ticket=++job;controller?.abort();controller=new AbortController();pending(true);
    $('load-status').textContent=(file||$('bundled-anatomy'))?'Verifying the local anatomy file…':'Retrieving one 59 MB study file from Stanford. It stays in this tab…';
    try{
      let a;
      const bundled=!file && $('bundled-anatomy');
      if(bundled || (file && /\.json$/i.test(file.name))){
        if(file && file.size!==3284079)throw Error('Choose the original MAT or a packet made with the supplied extractor.');
        const bytes=bundled?Uint8Array.from(atob(bundled.textContent),c=>c.charCodeAt(0)):new Uint8Array(await file.arrayBuffer());
        if(await CortexAnatomy.sha(bytes)!=='cc06b1e49ab755aecef3317699e1c457f3d0141e2111816503fbf8b5b9498f57')throw Error('The anatomy packet does not match this recording.');
        const packet=JSON.parse(new TextDecoder().decode(bytes));
        a={verts:Float64Array.from(packet.mesh.vertices.flat()),faces:Uint32Array.from(packet.mesh.faces.flat()),
           pos:Float64Array.from(packet.contacts.flatMap(c=>c.xyz)),regions:packet.contacts.map(c=>c.region_code)};
      }else a=file?await CortexAnatomy.loadFile(file):await CortexAnatomy.loadOfficial(controller.signal);
      if(ticket!==job)return;
      if(a.regions.length!==46||!markers.every((r,i)=>r.region_code===a.regions[i]))throw Error('The source regions do not match the recorded signal table.');
      if(viewer)viewer.dispose();
      $('model').hidden=false;viewer=cortexSurface($('mesh'),a,selectContact);
      $('xray').checked=true;$('xray').disabled=!viewer.gpu;
      $('load-status').textContent='Verified original surface · 45,180 vertices · 46 recording contacts. '+(viewer.gpu?'WebGL 2 rendering.':'Software rendering shows every contact through the surface.');
      refresh();$('mesh').focus({preventScroll:true});
    }catch(err){
      if(ticket===job)$('load-status').textContent=err.name==='AbortError'?'Loading cancelled.':(err.message||'Could not read the source.')+' You can choose a verified local file.';
    }finally{if(ticket===job){pending(false);controller=null;$('file').value='';}}
  }
  $('load').addEventListener('click',()=>load(null));
  $('file').addEventListener('change',()=>{if($('file').files[0])load($('file').files[0]);});
  $('cancel').addEventListener('click',()=>{++job;controller?.abort();controller=null;pending(false);$('load-status').textContent='Loading cancelled.';});
  $('left').onclick=()=>viewer?.rotate(-18,0);$('right').onclick=()=>viewer?.rotate(18,0);
  $('zi').onclick=()=>viewer?.magnify(1.18);$('zo').onclick=()=>viewer?.magnify(1/1.18);$('reset').onclick=()=>viewer?.reset();
  if($('bundled-anatomy')){
    $('load').textContent='Open the bundled 3D brain';$('load-status').textContent='The original anatomy is included in this local copy. It opens without an internet connection.';
  }
  refresh();
})();
