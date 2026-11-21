"use strict";
function fictionalReach() {
  // A bent lattice, a bar and a diagonal are hand-authored geometry for learning the controls.
  const sites = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      sites.push({group:"GRID", xyz:[col * 10, row * 12, 8 * Math.sin(col / 2)]});
    }
  }
  for (let k = 0; k < 6; k++) sites.push({group:"STRIP", xyz:[12 + k * 8, -9, -12]});
  for (let k = 0; k < 5; k++) sites.push({group:"DEPTH", xyz:[-8, k * 5, -k * 7]});
  const times = Array.from({length:500}, (_, i) => i / 500);
  const frames = Array.from({length:30}, (_, i) => i / 30);
  const names = ["L_Wrist","R_Wrist","L_Elbow","R_Elbow","L_Shoulder","R_Shoulder"];
  const voltage = new Float32Array(times.length * sites.length);
  times.forEach((t,i) => sites.forEach((site,k) => {
    voltage[i * sites.length + k] = 32 * Math.sin(2 * Math.PI * (3 * t + k / 16))
      + 18 * Math.cos(2 * Math.PI * (7 * t - k / 21));
  }));
  const pose = new Float64Array(frames.length * names.length * 2);
  frames.forEach((t, i) => {
    const raised = (1 - Math.cos(t * 2 * Math.PI)) / 2;
    const sway = Math.sin(t * 2 * Math.PI);
    pose.set([135 - 22 * raised, 188 + 9 * sway, 271 + 50 * raised, 177 - 81 * raised,
      145 - 4 * raised, 148 + 3 * sway, 244 + 15 * raised, 143 - 7 * raised,
      166, 100, 216, 101],i * 12);
  });
  return {recorded:false, eventTime:0.5, rowStart:0, frameStart:0, voltage, pose,
    metadata:{ecog_time_s:times, pose_time_s:frames, joint_names:names,
      group_name:sites.map(site => site.group), electrode_id:sites.map((site,i) => i),
      author_good:sites.map((site,i) => i !== 2 && i !== 26),
      electrode_xyz_source:sites.flatMap(site => site.xyz)}};
}
