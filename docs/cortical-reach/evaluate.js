/* Recompute the frozen joint model from only the demo trial's past rows. */
(() => {
  const d = window.REACH_TRIAL,
    scores = window.REACH_FORECASTS;
  const ids = d.unit_guide.map(([ch, sort]) => 'ch' + ch + ':sort' + sort);
  const history = (k) => {
    const movement = [],
      neural = [],
      cue = [];
    for (let end = k - 16; end <= k; end += 4) {
      const j = end - d.start,
        a = d.position_xy_cm[j - 4],
        b = d.position_xy_cm[j];
      movement.push([...b, b[0] - a[0], b[1] - a[1]]);
      neural.push(ids.map((_, i) => d.sorted_counts.slice(j - 4, j).reduce((acc, row) => acc + row[i], 0)));
      const flags = [];
      for (const key of ['bump', 'target']) {
        const visible = d.events[key][0] < end;
        const unit = { 0: [1, 0], 90: [0, 1], 180: [-1, 0], 270: [0, -1] }[d.direction_deg[key]];
        flags.push(visible ? 1 : 0, ...(visible ? unit : [0, 0]));
      }
      flags.push(d.events.go[0] < end ? 1 : 0);
      cue.push(flags);
    }
    return { session: 'C_20170912_COactpas', unit_ids: ids, movement, neural, cue };
  };
  for (const anchor of scores.anchors) {
    if (anchor.reason) continue;
    const input = history(anchor.k);
    anchor.by_seed = window.REACH_WEIGHTS.map((w) => window.Area2Forecast.predict(w, input));
  }
})();
