"use strict";
function mountReader(source) {
  const meta = source.metadata;
  const byId = id => document.getElementById(id);
  const svgNS = "http://www.w3.org/2000/svg";
  function svg(tag, attributes, parent, text) {
    const element = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (text !== undefined) element.textContent = text;
    parent.appendChild(element);
    return element;
  }
  function unpack(encoded, width) {
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const view = new DataView(bytes.buffer);
    const result = width === 4 ? new Float32Array(bytes.length / 4) : new Float64Array(bytes.length / 8);
    for (let i = 0; i < result.length; i++) {
      result[i] = width === 4 ? view.getFloat32(i * 4, true) : view.getFloat64(i * 8, true);
    }
    return result;
  }

  const voltages = source.voltage || unpack(source.voltageFloat32LE, 4);
  const pose = source.pose || unpack(source.poseFloat64LE, 8);
  const times = meta.ecog_time_s;
  const frames = meta.pose_time_s;
  const names = meta.joint_names;
  const palette = {right:"#096d63", left:"#a35411", ink:"#2f4942", grid:"#cfdad2", paper:"#f4f7f5"};
  const groupName = source.recorded ? {GRID:"Cortical grid", LAT:"Left anterior temporal strip", LID:"Left insular depth",
    LMT:"Left medial temporal strip", LPT:"Left posterior temporal strip", LTO:"Left temporal occipital strip"} : {GRID:"Practice grid", STRIP:"Practice strip", DEPTH:"Practice depth line"};
  const kind = group => group === "GRID" ? "grid" : (group === "LID" || group === "DEPTH") ? "depth" : "strip";
  const contacts = meta.electrode_id.map((id, i) => ({
    id, column:i, group:meta.group_name[i], good:meta.author_good[i],
    xyz:meta.electrode_xyz_source.slice(i * 3, i * 3 + 3)
  }));
  const midpoint = [0,1,2].map(axis => {
    const values = contacts.map(c => c.xyz[axis]);
    return (Math.min(...values) + Math.max(...values)) / 2;
  });
  const origin = [180,132];
  const plotScale = 124 / Math.max(...contacts.map(c => Math.hypot(...c.xyz.map((v,j) => v - midpoint[j]))));
  const anglePresets = {angled:source.recorded ? [1.25,0.18] : [0.65,0.82], yz:[Math.PI / 2,0], xz:[0,0], xy:[0,Math.PI / 2]};
  let [yaw,pitch] = anglePresets.angled;
  let visible = [], glyphs = [], lastFrame = -2, activeIndex = 250;
  let contact = contacts.find(c => c.good);
  let limit = Number(byId("limit").value);
  let playId = null;
  let traceMarker = null;
  let traceDot = null;
  let traceAt = null;
  let pin = null;
  let tracePin = null;

  const valueAt = (sample, column) => voltages[sample * contacts.length + column];
  const signed = (v, digits=1) => Number.isFinite(v)
    ? (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(digits) : "Missing";
  const coord = v => Number.isFinite(v) ? v.toFixed(2) : "Missing";
  function setText(id, text) { byId(id).textContent = text; }
  function colour(v) {
    if (!Number.isFinite(v)) return "none";
    const blend = Math.min(1, Math.abs(v) / limit);
    const endpoint = v < 0 ? [22,100,154] : [169,49,51];
    const center = [250,248,234];
    return "rgb(" + center.map((c,i) => Math.round(c + (endpoint[i] - c) * blend)).join(",") + ")";
  }
  function projection(v) {
    const u = v[0] * Math.cos(yaw) + v[1] * Math.sin(yaw);
    const cross = -v[0] * Math.sin(yaw) + v[1] * Math.cos(yaw);
    return [u, cross * Math.sin(pitch) + v[2] * Math.cos(pitch),
      -cross * Math.cos(pitch) + v[2] * Math.sin(pitch)];
  }
  function configureContacts() {
    visible = contacts.filter(c => c.good || byId("flagged").checked);
    const select = byId("contact");
    select.replaceChildren(...visible.map(c => new Option(c.group + " · ID " + c.id + (c.good ? "" : " · flagged"), String(c.column))));
    if (!visible.includes(contact)) contact = visible[0];
    select.value = String(contact.column);
    setText("visible-count", visible.length + " of " + contacts.length);
    drawMap();
    drawTrace();
    paint(activeIndex);
  }
  function drawMap() {
    const plot = byId("implant");
    plot.replaceChildren();
    const projected = visible.map(c => {
      const [u,v,depth] = projection(c.xyz.map((val,j) => val - midpoint[j]));
      return {c, x:origin[0]+plotScale*u, y:origin[1]-plotScale*v, depth};
    }).sort((a,b) => a.depth-b.depth);
    const axes = [[1,0,0],[0,1,0],[0,0,1]];
    axes.forEach((axis,j) => {
      const [u,v] = projection(axis);
      const x = 52 + u * 23, y = 229 - v * 23;
      svg("line",{x1:52,y1:229,x2:x,y2:y,stroke:"#648076","stroke-width":1.6},plot);
      if (Math.hypot(u,v) > 0.22) svg("text",{x:x+3,y:y-2,"font-size":12},plot,["x","y","z"][j]);
    });
    svg("text",{x:15,y:259,"font-size":12},plot,source.recorded ? "Source axes" : "Practice axes");
    glyphs = projected.map(({c,x,y}) => {
      const g = svg("g",{"data-id":c.id,transform:"translate("+x+" "+y+")"},plot);
      const title = svg("title",{},g);
      if (c === contact) svg("circle",{r:9,fill:"none",stroke:"#142e28","stroke-width":2},g);
      const size = 4.6, shape = kind(c.group);
      const attrs = {stroke:palette.ink,"stroke-width":1.15};
      let symbol;
      if (shape === "grid") symbol = svg("rect",{...attrs,x:-size,y:-size,width:2*size,height:2*size,rx:1.2},g);
      else if (shape === "depth") symbol = svg("path",{...attrs,d:"M0 -6.2 L6.2 0 0 6.2 -6.2 0 Z"},g);
      else symbol = svg("circle",{...attrs,r:5.2},g);
      if (!c.good) svg("path",{d:"M-3 -3 L3 3 M-3 3 L3 -3",stroke:"#12251e","stroke-width":1.4},g);
      return {c,symbol,title};
    });
    updateGlyphs();
  }
  function updateGlyphs() {
    for (const {c,symbol,title} of glyphs) {
      const v = valueAt(activeIndex,c.column);
      symbol.setAttribute("fill",colour(v));
      title.textContent = c.group + " · ID " + c.id + " · " + signed(v,2) + " µV" + (c.good ? "" : " · flagged");
    }
    setText("neg-limit","−" + limit + " µV");
    setText("pos-limit","+" + limit + " µV");
  }
  function selectContact(column) {
    contact = contacts[column];
    byId("contact").value = String(column);
    drawMap();
    drawTrace();
    paint(activeIndex);
  }
  const map = byId("implant");
  let gesture = null;
  map.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    const group = event.target.closest("g[data-id]");
    gesture = {id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch,picked:group?.dataset.id,moved:false};
    map.setPointerCapture(event.pointerId);
  });
  map.addEventListener("pointermove", event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.moved && Math.hypot(dx,dy) <= 3) return;
    gesture.moved = true;
    yaw = gesture.yaw + dx * 0.012;
    pitch = Math.max(-Math.PI/2,Math.min(Math.PI/2,gesture.pitch + dy * 0.012));
    byId("view").value = "custom";
    drawMap();
  });
  map.addEventListener("pointerup", event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (!gesture.moved && gesture.picked !== undefined) selectContact(contacts.find(c => String(c.id) === gesture.picked).column);
    gesture = null;
  });
  map.addEventListener("pointercancel", () => {gesture = null;});
  const freeView = new Option("Rotated","custom"); freeView.disabled = true; byId("view").add(freeView);
  byId("view").addEventListener("change",() => { [yaw,pitch] = anglePresets[byId("view").value]; drawMap(); });

  // Fit both image axes with the same scale. The crop is derived from the current input.
  const camera = byId("camera");
  function extent(axis) {
    const values = [];
    for (let i=axis; i<pose.length; i+=2) if (Number.isFinite(pose[i])) values.push(pose[i]);
    return values.length ? [Math.min(...values),Math.max(...values)] : [0,1];
  }
  const [xLow,xHigh] = extent(0), [yLow,yHigh] = extent(1);
  const cameraScale = Math.min(356 / Math.max(1,xHigh-xLow), 176 / Math.max(1,yHigh-yLow));
  const cameraX = x => 249 + (x-(xLow+xHigh)/2) * cameraScale;
  const cameraY = y => 118 + (y-(yLow+yHigh)/2) * cameraScale;
  function ticks(low,high,pixels) {
    const inc = 10 ** Math.floor(Math.log10(Math.max(1,high-low)));
    const span = high - low, step = span/inc > 4 ? inc : span/inc > 2 ? inc/2 : inc/4;
    const margin = pixels / cameraScale;
    return Array.from({length: Math.max(0,Math.floor((high+margin)/step)-Math.ceil((low-margin)/step)+1)},
      (_,i) => (Math.ceil((low-margin)/step)+i) * step);
  }
  const poseAt = (frame,joint,axis) => pose[(frame * names.length + joint) * 2 + axis];
  function drawCamera(frame) {
    camera.replaceChildren();
    const add = (tag,attrs,text) => svg(tag,attrs,camera,text);
    for (const x of ticks(xLow,xHigh,12)) {
      add("line",{x1:cameraX(x),x2:cameraX(x),y1:12,y2:224,stroke:palette.grid});
      add("text",{x:cameraX(x),y:245,"text-anchor":"middle","font-size":12},String(x));
    }
    for (const y of ticks(yLow,yHigh,12)) {
      add("line",{y1:cameraY(y),y2:cameraY(y),x1:55,x2:443,stroke:palette.grid});
      add("text",{x:51,y:cameraY(y)+4,"text-anchor":"end","font-size":12},String(y));
    }
    add("text",{x:222,y:264,"text-anchor":"middle","font-size":13},"Image x (px) →");
    add("text",{x:19,y:122,transform:"rotate(-90 19 122)","text-anchor":"middle","font-size":13},"← Image y (px)");
    const table = byId("joints"); table.replaceChildren();
    for (const side of ["R","L"]) {
      const sideName = side === "R" ? "Right" : "Left";
      const ink = side === "R" ? palette.right : palette.left;
      const chain = ["Shoulder","Elbow","Wrist"].map(name => {
        const j = names.indexOf(side + "_" + name);
        const x = frame < 0 ? NaN : poseAt(frame,j,0), y = frame < 0 ? NaN : poseAt(frame,j,1);
        const row = table.insertRow();
        for (const text of [sideName + " " + name.toLowerCase(),coord(x),coord(y)]) row.insertCell().textContent=text;
        return Number.isFinite(x) && Number.isFinite(y) ? [cameraX(x),cameraY(y)] : null;
      });
      chain.forEach((point,j) => {
        if (!point || j === 0 || !chain[j-1]) return;
        add("line",{x1:chain[j-1][0],y1:chain[j-1][1],x2:point[0],y2:point[1],stroke:ink,
          "stroke-width":3.4,"stroke-dasharray":side==="L" ? "7 3" : "none"});
      });
      chain.forEach((p,j) => {
        if (!p) return;
        if (j === 0) add("rect",{x:p[0]-4,y:p[1]-4,width:8,height:8,fill:ink});
        if (j === 1) add("circle",{cx:p[0],cy:p[1],r:4.5,fill:ink});
        if (j === 2) {
          add("circle",{cx:p[0],cy:p[1],r:6,fill:palette.paper,stroke:ink,"stroke-width":2.4});
          add("circle",{cx:p[0],cy:p[1],r:2,fill:ink});
        }
      });
    }
    if (frame < 0) add("text",{x:221,y:115,"text-anchor":"middle","font-size":14},"First frame has not arrived");
  }
  function latestFrame(t) {
    // No future frame, interpolation or inferred synchronization.
    let f = frames.length - 1;
    while (f >= 0 && frames[f] > t) f--;
    return f;
  }
  function drawTrace() {
    const plot = byId("trace");
    plot.replaceChildren();
    const w = Math.max(260,Math.round(plot.clientWidth));
    const h = w < 450 ? 126 : 142;
    plot.setAttribute("viewBox","0 0 " + w + " " + h);
    let peak = 0;
    for (let i=0; i<times.length; i++) {
      const v=valueAt(i,contact.column);
      if (Number.isFinite(v)) peak=Math.max(peak,Math.abs(v));
    }
    const bound = Math.max(10,Math.ceil(peak/10)*10);
    const left=47, right=w-14, top=15, bottom=h-29, mid=(bottom+top)/2;
    const x=i => left + (right-left)*i/(times.length-1);
    const y=v => mid - (mid-top)*v/bound;
    svg("text",{x:9,y:12,"font-size":10},plot,"µV");
    for (const v of [-bound,0,bound]) {
      svg("line",{x1:left,x2:right,y1:y(v),y2:y(v),stroke:v===0 ? "#768c81" : palette.grid},plot);
      svg("text",{x:left-5,y:y(v)+4,"text-anchor":"end","font-size":11},plot,signed(v,0));
    }
    for (const [i,label,anchor] of [[0,"−500 ms","start"],[250,source.recorded ? "Onset" : "Marker","middle"],[499,"+498 ms","end"]]) {
      svg("text",{x:x(i),y:h-9,"text-anchor":anchor,"font-size":11},plot,label);
    }
    svg("line",{x1:x(250),x2:x(250),y1:top,y2:bottom,stroke:"#8b9a90","stroke-dasharray":"3 4"},plot);
    let path="", pen=false;
    for (let i=0;i<times.length;i++) {
      const v = valueAt(i,contact.column);
      if (!Number.isFinite(v)) {pen=false; continue;}
      path += (pen ? "L" : "M") + x(i).toFixed(2) + "," + y(v).toFixed(2);
      pen=true;
    }
    svg("path",{d:path,fill:"none",stroke:"#1d645b","stroke-width":1.4},plot);
    traceMarker=svg("line",{y1:top-3,y2:bottom,stroke:"#714a13","stroke-width":1.6},plot);
    traceDot=svg("circle",{r:3.7,fill:"#714a13",stroke:"white"},plot);
    traceAt={x,y,left,right};
    tracePin=svg("line",{y1:top,y2:bottom,stroke:"#72518e","stroke-dasharray":"4 3","stroke-width":2},plot);
    setText("contact-detail","ID "+contact.id+" · "+groupName[contact.group]+" · "+(source.recorded ? (contact.good ? "Author-rated good" : "Flagged for noise that day") : (contact.good ? "Practice contact" : "Practice noise flag"))+
      " · (x, y, z) = ("+contact.xyz.map(coord).join(", ")+")");
  }
  function paint(index) {
    activeIndex=index;
    const time=times[index], offset=Math.round(1000*(time-source.eventTime));
    byId("time").value=String(index);
    setText("relative-time",signed(offset,0)+" ms");
    byId("time").setAttribute("aria-valuetext",signed(offset,0)+" milliseconds from marker");
    const v=valueAt(index,contact.column);
    setText("voltage",Number.isFinite(v)?signed(v,2)+" µV":"Missing voltage");
    setText("sample-clock","Sample "+(source.rowStart+index)+" · "+time.toFixed(6)+" s");
    const frame=latestFrame(time);
    if (frame!==lastFrame) {drawCamera(frame);lastFrame=frame;}
    setText("camera-clock",frame<0 ? "No preceding frame inside this window." :
      "Frame "+(source.frameStart+frame)+" · "+frames[frame].toFixed(6)+" s · "+((time-frames[frame])*1000).toFixed(1)+" ms before voltage tick");
    if (tracePin) {
      tracePin.setAttribute("visibility",pin === null ? "hidden" : "visible");
      if (pin !== null) {tracePin.setAttribute("x1",traceAt.x(pin)); tracePin.setAttribute("x2",traceAt.x(pin));}
    }
    if (pin !== null) {
      const pinnedVoltage = valueAt(pin, contact.column);
      const oldFrame = latestFrame(times[pin]), wrist = names.indexOf("R_Wrist");
      let travel = "No preceding wrist frame at one cursor.";
      if (oldFrame >= 0 && frame >= 0) {
        const dx = poseAt(frame,wrist,0) - poseAt(oldFrame,wrist,0);
        const dy = poseAt(frame,wrist,1) - poseAt(oldFrame,wrist,1);
        travel = "Right wrist moved " + Math.hypot(dx,dy).toFixed(2) + " px between the two displayed frames.";
      }
      setText("comparison","Pinned " + signed(Math.round((times[pin]-source.eventTime)*1000),0) +
        " ms · " + signed(pinnedVoltage,2) + " µV. Current minus pinned " + signed(v-pinnedVoltage,2) + " µV. " + travel);
    } else setText("comparison","Pin this time, then move the cursor to compare this contact and the right wrist.");
    updateGlyphs();
    if (traceAt) {
      traceMarker.setAttribute("x1",traceAt.x(index));traceMarker.setAttribute("x2",traceAt.x(index));
      traceDot.setAttribute("visibility",Number.isFinite(v)?"visible":"hidden");
      if (Number.isFinite(v)) {traceDot.setAttribute("cx",traceAt.x(index)); traceDot.setAttribute("cy",traceAt.y(v));}
    }
  }
  function stop() {
    if (playId!==null) cancelAnimationFrame(playId);
    playId=null;setText("play","Play");
  }
  function play() {
    if (playId!==null) {stop();return;}
    if (activeIndex===times.length-1) paint(0);
    const start=performance.now(), first=activeIndex, speed=Number(byId("speed").value);
    setText("play","Pause");
    const step=now => {
      const i=Math.min(times.length-1,first+Math.floor((now-start)*speed/2));
      if (i!==activeIndex) paint(i);
      if (i===times.length-1) stop(); else playId=requestAnimationFrame(step);
    };
    playId=requestAnimationFrame(step);
  }
  byId("time").addEventListener("input",event=>{stop();paint(Number(event.target.value));});
  byId("pin").addEventListener("click",()=>{stop(); pin=activeIndex; byId("clear-pin").hidden=false; paint(activeIndex);});
  byId("clear-pin").addEventListener("click",()=>{pin=null; byId("clear-pin").hidden=true; paint(activeIndex);});
  byId("trace").addEventListener("click",event=>{
    if (!traceAt) return;
    const plot=byId("trace");
    const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(plot.getScreenCTM().inverse());
    const fraction=Math.max(0,Math.min(1,(point.x-traceAt.left)/(traceAt.right-traceAt.left)));
    stop();paint(Math.round(fraction*(times.length-1)));
  });
  byId("onset").addEventListener("click",()=>{stop();paint(250);});
  byId("speed").addEventListener("change",()=>{if(playId!==null){stop();play();}});
  byId("play").addEventListener("click",play);
  byId("contact").addEventListener("change",event=>selectContact(Number(event.target.value)));
  byId("flagged").addEventListener("change",configureContacts);
  byId("limit").addEventListener("change",event=>{limit=Number(event.target.value);updateGlyphs();});
  const observer = new ResizeObserver(()=>{drawTrace();paint(activeIndex);});
  setText("flag-count","Include " + contacts.filter(c => !c.good).length + " flagged");
  setText("map-note",source.recorded ? "The team located these contacts on CT and MRI and mapped them into MNI space. The table omits coordinate units, axis convention and template version." : "A bent lattice, a bar and a diagonal form this invented layout. The axes use arbitrary drawing units.");
  setText("camera-note",source.recorded ? "DeepLabCut estimated six points from one camera. Depth, physical distance and confidence per frame are unavailable." : "Two drawn arms follow mathematical curves. Coordinates are pixels on a fictional image plane.");
  setText("signal-label",source.recorded ? "Group-median referenced" : "Generated sine waves");
  setText("signal-note",source.recorded ? "Each reading is a voltage difference from the contact group’s reference. Its sign alone cannot identify the biological source." : "Each contact follows a different phase of two sine waves. The displayed values are fictional microvolts.");
  setText("onset",source.recorded ? "0 · annotated onset" : "0 · practice marker");
  configureContacts();
  observer.observe(byId("trace").parentElement);
  return () => {stop(); observer.disconnect();};
}
