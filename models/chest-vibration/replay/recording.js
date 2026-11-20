// Offline CEBSDB reader. Rows use the endpoint of the causal filter on the archived sensor clock.
const ChestReplay = (() => {
  const gridHz = 250, rawStep = 20, horizon = 20, lags = 51, delay = 1253;
  function features(rows, index, mean, sd, priorEcg) {
    const base = [], ecg = [], changes = [];
    for (const channel of [2, 1]) {
      for (let k = 0; k < lags; k++) base.push((rows[index-k][channel]-mean[channel])/sd[channel]);
    }
    for (let k = 0; k < lags; k++) {
      const n = index-k;
      const now = priorEcg ? priorEcg[n] : rows[n][0];
      const before = priorEcg ? priorEcg[n-1] : rows[n-1][0];
      ecg.push((now-mean[0])/sd[0]);
      changes.push(Math.abs(now-before)/sd[0]);
    }
    return {base, augmented: base.concat(ecg, changes)};
  }
  function linear(model, vector) {
    let value = model.intercept;
    for (let i=0; i<vector.length; i++) value += model.coefficient[i]*vector[i];
    return value;
  }
  function predict(record, at, models) {
    const index = at + lags;
    const actual = features(record.rows, index, record.mean, record.sd);
    const previous = features(record.rows, index, record.mean, record.sd, record.previousEcg);
    const units = value => value*record.sd[2] + record.mean[2];
    return {
      base: units(linear(models.base, actual.base)),
      aligned: units(linear(models.aligned, actual.augmented)),
      delayed: units(linear(models.delayed, previous.augmented)),
      persistence: record.rows[index][2]
    };
  }
  function count(record) { return record.rows.length-lags-horizon; }
  function measured(record, at) { return record.rows[at+lags+horizon][2]; }
  function score(record, models) {
    const sums = {aligned:0, base:0, delayed:0, persistence:0};
    const n = count(record);
    for (let i=0; i<n; i++) {
      const values = predict(record, i, models), target = measured(record, i);
      for (const key of Object.keys(sums)) sums[key] += (values[key]-target)**2;
    }
    for (const key of Object.keys(sums)) sums[key] = Math.sqrt(sums[key]/n);
    return sums;
  }
  function filterKernel() {
    const taps = [];
    const cutoff = 2*65/5000;
    for (let k=0; k<=200; k++) {
      const x = Math.PI*cutoff*(k-100);
      taps.push((.54-.46*Math.cos(2*Math.PI*k/200))*cutoff*(x===0 ? 1 : Math.sin(x)/x));
    }
    const total = taps.reduce((a,b)=>a+b,0);
    return taps.map(v=>v/total);
  }
  function filteredTrace(buffer, record, startGrid, endGrid) {
    const words = new DataView(buffer);
    const taps = filterKernel(), trace = [];
    for (let g=startGrid; g<=endGrid; g++) {
      const row = [0,0,0], final = g*rawStep;
      for (let j=0; j<taps.length; j++) {
        const start = (final-j)*8;
        for (let c=0; c<3; c++) {
          const channel=c+1, raw = words.getInt16(start+channel*2,true);
          if (raw === -32768) throw Error('A required sensor reading is missing.');
          row[c] += taps[j]*(raw-record.baselines[channel])/record.gains[channel];
        }
      }
      trace.push(row);
    }
    return trace;
  }
  async function readFullFile(file, catalogue) {
    const candidates = catalogue.filter(r=>file.size===r.frames*8);
    if (!candidates.length) throw Error('Choose one original p009–p013 .dat file from CEBSDB 1.0.0.');
    const buffer = await file.arrayBuffer();
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256',buffer));
    const hash = Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
    const record = candidates.find(r=>r.waveformSha===hash);
    if (!record) throw Error('The file does not match any of the five verified test waveforms.');
    const first = 60*gridHz, cut = 90*gridHz-first, n = 30*gridHz;
    const trace = filteredTrace(buffer, record, first, first+cut+n-1+horizon);
    const calibration = trace.slice(0,20*gridHz);
    const mean = [0,1,2].map(c=>calibration.reduce((s,row)=>s+row[c],0)/calibration.length);
    const sd = mean.map((avg,c)=>Math.sqrt(calibration.reduce((s,row)=>s+(row[c]-avg)**2,0)/calibration.length));
    if (sd.some(v=>!Number.isFinite(v)||v<=0)) throw Error('Calibration failed.');
    const firstRow=cut-lags, stop=cut+n+horizon;
    return {...record, mean, sd, rows:trace.slice(firstRow,stop),
      previousEcg:trace.slice(firstRow-delay,stop-delay).map(r=>r[0])};
  }
  return {predict, count, measured, score, readFullFile, lags, gridHz, horizon};
})();
