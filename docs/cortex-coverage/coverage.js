// Every contact number is the one-based recording column in this person's original file.
(() => {
  const byId = id => document.getElementById(id);
  const people = CortexAnatomy.people;
  const rows = [...document.querySelectorAll('tbody tr[data-region]')];
  const regions = new Map(rows.map(row => {
    const {region, full, color} = row.dataset;
    const rgb = color.slice(1).match(/../g).map(part => parseInt(part, 16) / 255);
    return [Number(region), {name: row.querySelector('th').innerText.trim(), full, color, rgb}];
  }));
  const buttons = [...document.querySelectorAll('table button')];
  let key = 'bp', region = null, picked = 0, model = null, anatomy = null, job = 0, controller = null;

  function refreshControls() {
    const person = people[key];
    byId('participant').value = key;
    byId('region').value = region === null ? 'all' : String(region);
    byId('area-readout').textContent = region === null
      ? person.contacts + ' contacts in this recording.'
      : (person.counts[region] || 0) + ' of ' + person.contacts + ' contacts · ' + regions.get(region).full + '.';
    for (const button of buttons) {
      const inColumn = button.dataset.person === key;
      const code = button.hasAttribute('data-code') ? Number(button.dataset.code) : null;
      button.setAttribute('aria-pressed', String(inColumn && code === region));
      button.toggleAttribute('data-column', inColumn);
    }
    byId('contact-picker').hidden = !anatomy;
    byId('picked').textContent = '';
    if (!anatomy) return;
    const list = byId('contact');
    const ids = anatomy.regions.flatMap((code,i) => region === null || region === code ? [i+1] : []);
    list.replaceChildren(new Option(ids.length ? 'Choose a contact' : 'No contacts', '0'),
      ...ids.map(id => new Option(String(id), String(id))));
    list.disabled = ids.length === 0;
    list.value = String(picked);
    if (picked) {
      const code = anatomy.regions[picked-1];
      byId('picked').textContent = person.id + ' · recording contact ' + picked + ' · ' +
        regions.get(code).full + ' (code ' + code + ').';
    }
    const flags = anatomy.regions.map(code => Number(region === null || region === code));
    const colors = anatomy.regions.flatMap((code,i) => flags[i] ? regions.get(code).rgb : [.32,.37,.37]);
    model.update(colors, flags, picked, byId('through').checked);
  }

  function pick(id) {
    if (!anatomy || id < 0 || id > anatomy.regions.length) return;
    picked = id;
    if (id && region !== null) region = anatomy.regions[id-1];
    refreshControls();
  }

  function finishRequest() {
    byId('load').disabled = false;
    byId('cancel').hidden = true;
    byId('file').value = '';
    controller = null;
  }

  function invalidateRequest() {
    job++;
    controller?.abort();
    finishRequest();
  }

  function changePerson(nextKey, nextRegion) {
    if (key !== nextKey || !byId('implant').textContent) {
      invalidateRequest();
      model?.dispose();
      model = null;
      anatomy = null;
      byId('model').hidden = true;
      byId('contact').replaceChildren();
      key = nextKey;
      const p = people[key];
      byId('inspect-link').textContent = 'Inspect ' + p.id + '’s surface';
      byId('implant').textContent = p.id + ' · ' + p.hemisphere + ' ' + p.implant + ' implant';
      byId('file-path').textContent = p.member.name;
      byId('load').textContent = 'Load ' + p.id + ' from Stanford';
      byId('status').textContent = 'The 3D view needs the original study file (' +
        Math.ceil((p.member.end-p.member.start+1)/1e6) + ' MB download).';
      byId('person-note').textContent = p.id === 'D02'
        ? 'The study calls this implant right frontotemporal. Its retained contacts include two labelled occipital and none labelled temporal.'
        : p.id === 'D05' ? 'One contact carries code 5. Neither the task notes nor the analysis code gives that code a name.'
        : 'Each coloured segment shows the share of this recording’s contacts in one source region.';
      byId('strip').replaceChildren(...[...regions].filter(([c]) => p.counts[c]).map(([c, info]) => {
        const part = document.createElement('span');
        part.style.flex = p.counts[c] + ' 1 0';
        part.style.backgroundColor = info.color;
        return part;
      }));
    }
    region = nextRegion;
    picked = 0;
    refreshControls();
  }

  async function open(file) {
    invalidateRequest();
    const current = job;
    const person = people[key];
    controller = new AbortController();
    byId('load').disabled = true;
    byId('cancel').hidden = false;
    byId('status').textContent = (file ? 'Verifying local anatomy for ' : 'Retrieving original anatomy for ') + person.id + '…';
    try {
      const loaded = file ? await CortexAnatomy.loadFile(file,person)
        : await CortexAnatomy.loadOfficial(controller.signal,person);
      if (current !== job) return;
      const counts = Array.from({length:10}, () => 0);
      for (const code of loaded.regions) {
        if (!regions.has(code)) throw Error('A contact has an unexpected source code.');
        counts[code]++;
      }
      if (!counts.every((n,code) => n === (person.counts[code] || 0))) {
        throw Error('The contact labels do not match the coverage table.');
      }
      model?.dispose();
      model = null;
      anatomy = null;
      byId('model').hidden = false;
      model = cortexSurface(byId('mesh'), loaded, pick);
      anatomy = loaded;
      byId('through').checked = true;
      byId('through').disabled = !model.gpu;
      byId('status').textContent = person.id + ' · verified original surface · ' +
        person.vertices.toLocaleString('en-US') + ' vertices · ' + person.contacts + ' contacts. ' +
        (model.gpu ? 'WebGL 2.' : 'Software rendering shows contacts through the surface.');
      refreshControls();
    } catch (error) {
      if (current !== job) return;
      byId('status').textContent = error.message || 'Could not open the selected source.';
      if (!model) byId('model').hidden = true;
      refreshControls();
    } finally {
      if (current === job) finishRequest();
    }
  }

  byId('participant').replaceChildren(...Object.entries(people).map(([id,p]) => new Option(p.id+' · '+id,id)));
  byId('region').replaceChildren(new Option('All regions','all'),
    ...[...regions].map(([code,r]) => new Option(r.name,String(code))));
  buttons.forEach(button => {
    button.toggleAttribute('data-zero', button.textContent === '0');
    button.onclick = () => changePerson(button.dataset.person,
      button.hasAttribute('data-code') ? Number(button.dataset.code) : null);
  });
  byId('participant').onchange = e => changePerson(e.target.value,null);
  byId('region').onchange = e => changePerson(key,e.target.value === 'all' ? null : Number(e.target.value));
  byId('contact').onchange = e => pick(Number(e.target.value));
  byId('load').onclick = () => open(null);
  byId('file').onchange = e => { if (e.target.files[0]) open(e.target.files[0]); };
  byId('cancel').onclick = () => { invalidateRequest(); byId('status').textContent = 'Loading cancelled.'; };
  byId('through').onchange = refreshControls;
  byId('left').onclick = () => model?.rotate(-18,0);
  byId('right').onclick = () => model?.rotate(18,0);
  byId('out').onclick = () => model?.magnify(1/1.18);
  byId('in').onclick = () => model?.magnify(1.18);
  byId('reset').onclick = () => model?.reset();
  changePerson(key,null);
})();
