/* Invented motion and the two-dimensional, prior-only frame. */
const WristGeometry = (() => {
  const sides = ['R', 'L'];
  const joints = ['Shoulder', 'Elbow', 'Wrist'];
  const other = side => side === 'L' ? 'R' : 'L';
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const scale = (v, k) => v.map(x => x * k);
  const dot = (a, b) => a.reduce((n, x, i) => n + x * b[i], 0);
  const valid = v => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite);
  const rotateX = ([x,y,z], a) => [x, y*Math.cos(a)-z*Math.sin(a), y*Math.sin(a)+z*Math.cos(a)];
  const rotateY = ([x,y,z], a) => [x*Math.cos(a)+z*Math.sin(a),y,-x*Math.sin(a)+z*Math.cos(a)];
  const rotateZ = ([x,y,z], a) => [x*Math.cos(a)-y*Math.sin(a), x*Math.sin(a)+y*Math.cos(a), z];

  function poseAt(frame, implant, rest) {
    const pose = {}, transforms = {};
    const t = (frame + 14) / 29;
    const swing = t * t * (3 - 2 * t);
    for (const side of sides) {
      const shoulder = rest[side + '_Shoulder'];
      const elbow = rest[side + '_Elbow'];
      const wrist = rest[side + '_Wrist'];
      const active = side === other(implant);
      const sign = side === 'L' ? 1 : -1;
      const lift = active ? 0.08 + 0.32 * swing : -0.21 + 0.04 * Math.sin(t * 3);
      const pitch = active ? -0.23 - 0.47 * swing : -0.15;
      const flex = active ? -0.20 - 0.75 * swing : -0.12 + 0.07 * t;
      const forward = active ? -sign * (0.08 + 0.48 * swing) : 0;
      const turnUpper = v => rotateY(rotateZ(rotateX(v, pitch), sign * lift), forward);
      const turnLower = v => turnUpper(rotateX(v, flex));
      const upper = p => add(shoulder, turnUpper(sub(p, shoulder)));
      const currentElbow = upper(elbow);
      const lower = p => add(currentElbow, turnLower(sub(p, elbow)));
      transforms[side] = {upper, lower, turnUpper, turnLower};
      pose[side + '_Shoulder'] = shoulder;
      pose[side + '_Elbow'] = currentElbow;
      pose[side + '_Wrist'] = lower(wrist);
    }
    return {pose, transforms};
  }

  function detector(point, frame, mirror) {
    // Orthographic invented detector, 640 × 480. Slow pan, roll and scale drift.
    const t = (frame + 14) / 29;
    const roll = 0.125 + 0.055 * t;
    const px = 42 + 2.8 * t;
    const [x, y] = rotateZ([point[0], point[1]-4, 0], roll);
    const u = 318 + 14 * t + px * x;
    return [mirror ? 640-u : u, 217-6*t-px*y];
  }

  function buildSeries(implant, mirror, gap, rest) {
    return Array.from({length:30}, (_, i) => {
      const frame = i-14;
      const world = poseAt(frame, implant, rest).pose;
      const points = Object.fromEntries(Object.entries(world).map(([k,v]) => [k, detector(v,frame,mirror)]));
      // Each fault hides one detector observation. The graphical person still exists.
      if (frame === -6 && ['R_Elbow','L_Elbow','L_Shoulder'].includes(gap)) points[gap] = null;
      if (frame === 15 && gap === 'L_endpoint') points.L_Wrist = null;
      return points;
    });
  }

  function shoulderFrame(prior, implant) {
    if (prior.length !== 15) return {reason:'Need all 15 earlier frames'};
    const contra = other(implant);
    const vectors = [];
    for (const row of prior) {
      const c = row[contra + '_Shoulder'], i = row[implant + '_Shoulder'];
      if (!valid(c) || !valid(i)) return {reason:'Earlier shoulder missing'};
      vectors.push(sub(c,i));
    }
    const widths = vectors.map(v => Math.hypot(...v)).sort((a,b) => a-b);
    const width = widths[7];
    if (width < 1) return {reason:'Shoulder width below 1 px'};
    const mean = scale(vectors.reduce(add, [0,0]), 1/15);
    const length = Math.hypot(...mean);
    if (length < 0.5 * width) return {reason:'Unstable shoulder direction'};
    const lateral = scale(mean, 1/length);
    let up = [-lateral[1], lateral[0]];
    if (Math.abs(up[1]) < 0.10) return {reason:'Ambiguous image-up direction'};
    if (up[1] > 0) up = scale(up,-1);
    const last = prior[14];
    const origin = scale(add(last.L_Shoulder,last.R_Shoulder),0.5);
    return {width,origin,lateral,up};
  }

  function roleReason(prior, side, frame) {
    if (frame.reason) return frame.reason;
    for (const joint of joints) {
      if (prior.some(row => !valid(row[side+'_'+joint]))) return 'Earlier '+joint.toLowerCase()+' missing';
    }
    return '';
  }
  function aligned(p,f) {
    const delta = sub(p,f.origin);
    return [dot(delta,f.lateral)/f.width,dot(delta,f.up)/f.width];
  }
  function native(p,f) {
    return add(f.origin, scale(add(scale(f.lateral,p[0]),scale(f.up,p[1])),f.width));
  }
  return {sides,joints,other,add,sub,scale,dot,poseAt,detector,buildSeries,shoulderFrame,roleReason,aligned,native};
})();
