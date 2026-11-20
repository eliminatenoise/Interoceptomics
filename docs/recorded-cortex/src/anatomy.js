// Decode only the three anatomy variables in the verified Stanford FingerFlex member.
const CortexAnatomy = (() => {
  // Stanford FingerFlex v11. Byte ranges and SHA-256 values pin each original ZIP member.
  const archive = "https://stacks.stanford.edu/file/druid:zk881ps0522/fingerflex.zip";
  const people = {
    bp: {
      id: "D01",
      hemisphere: "left",
      implant: "frontoparietal",
      contacts: 46,
      counts: {"0": 4, "1": 2, "2": 1, "3": 4, "4": 5, "6": 24, "7": 6},
      camera: [250, 15],
      vertices: 45180,
      faces: 90368,
      inward: true,
      fields: {"elec_regions": [57998073, 75], "brain": [58140178, 784739], "locs": [58924925, 1082]},
      member: {"name": "fingerflex/data/bp/bp_fingerflex.mat", "start": 6413, "end": 58845098, "size": 58929343, "compressed_sha256": "b2905446cc76f2e28410160a239ba6a68aabe4151efe62f2f8f0e23bfef2e0b5", "sha256": "b8222d13c15c97ec8590ed4b9ea180c639cac0b7c3e04bce178bb349f92be03a"},
    },
    cc: {
      id: "D02",
      hemisphere: "right",
      implant: "frontotemporal",
      contacts: 63,
      counts: {"0": 14, "1": 5, "2": 1, "3": 3, "4": 7, "6": 8, "7": 23, "9": 2},
      camera: [80, 40],
      vertices: 124835,
      faces: 249665,
      inward: false,
      fields: {"elec_regions": [83850507, 82], "brain": [84024912, 3555898], "locs": [87580818, 707]},
      member: {"name": "fingerflex/data/cc/cc_fingerflex.mat", "start": 58850450, "end": 146307660, "size": 87584870, "compressed_sha256": "711d5e128b8d650b94dc38a25f32118a343527468c27f36bcd92892ce7bf903b", "sha256": "ef6f6e87d6ce9fbb3a1719838ad1fccc51a7b983b8cb61c1e3d0d0acab281248"},
    },
    ht: {
      id: "D03",
      hemisphere: "left",
      implant: "parietal-temporal-occipital",
      contacts: 64,
      counts: {"0": 7, "1": 3, "3": 3, "4": 3, "7": 23, "8": 18, "9": 7},
      camera: [270, 0],
      vertices: 146513,
      faces: 293022,
      inward: false,
      fields: {"elec_regions": [85848581, 76], "brain": [86026513, 3127524], "locs": [89154045, 1244]},
      member: {"name": "fingerflex/data/ht/ht_fingerflex.mat", "start": 146312793, "end": 235328746, "size": 89158640, "compressed_sha256": "c0013a0d2d72db7749cb571307e5674034098614be3f147e9409bef57f0840e0", "sha256": "ab0c08401599a637bf614d9eb8adc0eb7adeb0a0b0125808fd4bd52c73060106"},
    },
    jc: {
      id: "D04",
      hemisphere: "left",
      implant: "frontal",
      contacts: 47,
      counts: {"0": 1, "1": 4, "2": 1, "3": 2, "4": 6, "6": 24, "7": 7, "8": 2},
      camera: [270, 15],
      vertices: 83498,
      faces: 166968,
      inward: true,
      fields: {"elec_regions": [52894406, 71], "brain": [53009100, 1501359], "locs": [54510467, 945]},
      member: {"name": "fingerflex/data/jc/jc_fingerflex.mat", "start": 235334026, "end": 289759475, "size": 54514317, "compressed_sha256": "f02432bb5221bdb0e9482efcc95fe5a5e54f5b16734f4c231ba5c23487e19123", "sha256": "d764fc3ec03f3733eb82d8839ad568b098803c446ae26decd36982f555b7646d"},
    },
    jp: {
      id: "D05",
      hemisphere: "left",
      implant: "frontotemporal",
      contacts: 58,
      counts: {"0": 15, "1": 7, "4": 1, "5": 1, "6": 9, "7": 7, "8": 17, "9": 1},
      camera: [270, 30],
      vertices: 87684,
      faces: 175220,
      inward: true,
      fields: {"elec_regions": [48806673, 81], "brain": [48931289, 1566878], "locs": [50498175, 1365]},
      member: {"name": "fingerflex/data/jp/jp_fingerflex.mat", "start": 289764283, "end": 340271577, "size": 50502113, "compressed_sha256": "711ba2ea96652ecdada1b1bcfed51e0582ad237861713fa1217726a591b4118e", "sha256": "3c077022eee8ce210f72958d6a815a4b340249ec0d90d477e7962f897b39e494"},
    },
  };
  const decoder=new TextDecoder('ascii');
  function need(test,message) { if(!test) throw Error(message); }
  async function sha(bytes) {
    need(globalThis.crypto?.subtle,'Open this viewer over HTTPS or directly as a local file to verify the original.');
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  }
  async function inflate(bytes,format) {
    need(typeof DecompressionStream==='function','This browser cannot unpack the original file. Open the viewer in a browser with support for compressed streams.');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format))).arrayBuffer());
  }
  function tag(dv, offset) {
    const packed=dv.getUint32(offset,true), small=packed>>>16;
    const type=packed&65535, len=small?small:dv.getUint32(offset+4,true);
    const start=offset+(small?4:8), next=small?offset+8:start+Math.ceil(len/8)*8;
    need(start+len<=dv.byteLength,'A MATLAB field is incomplete.');
    return {type,len,start,next};
  }
  function matrix(buf,dv,offset) {
    const wrapper=tag(dv,offset);need(wrapper.type===14,'Expected a MATLAB matrix.');
    const flag=tag(dv,wrapper.start), dims=tag(dv,flag.next), name=tag(dv,dims.next);
    return {n:dv.getInt32(dims.start,true),m:dv.getInt32(dims.start+4,true),name:decoder.decode(buf.subarray(name.start,name.start+name.len)),data:name.next,next:wrapper.next};
  }
  function values(dv,field,count) {
    const readers={1:['getInt8',1],2:['getUint8',1],3:['getInt16',2],4:['getUint16',2],5:['getInt32',4],6:['getUint32',4],7:['getFloat32',4],9:['getFloat64',8]};
    const read=readers[field.type];need(read && count*read[1]===field.len,'Unexpected source matrix format.');
    const a=new Float64Array(count);
    for(let i=0;i<count;i++) a[i]=dv[read[0]](field.start+i*read[1],true);
    return a;
  }
  function interleave(a,n,columns,Type=Float64Array,offset=0) {
    const out=new Type(n*columns);
    for(let i=0;i<n;i++) for(let j=0;j<columns;j++)out[i*columns+j]=a[j*n+i]+offset;
    return out;
  }
  async function variable(bytes,off,len,name) {
    const head=new DataView(bytes.buffer,bytes.byteOffset+off,8);
    need(head.getUint32(0,true)===15 && head.getUint32(4,true)===len,'Unexpected anatomical source offset.');
    const unpacked=await inflate(bytes.subarray(off+8,off+8+len),'deflate');
    const view=new DataView(unpacked.buffer,unpacked.byteOffset,unpacked.byteLength);
    const meta=matrix(unpacked,view,0);need(meta.name===name,'The source anatomical variable does not match.');
    return {unpacked,view,meta};
  }
  async function original(bytes, person = people.bp) {
    const {member, fields, contacts} = person;
    need(bytes.length === member.size && await sha(bytes) === member.sha256,
      'This file does not match ' + member.name.split('/').pop() + '.');
    const {unpacked,view,meta} = await variable(bytes,...fields.brain,'brain');
    const n=tag(view,meta.data), names=tag(view,n.next);
    need(decoder.decode(unpacked.subarray(names.start,names.start+names.len)).replace(/\0/g,'')==='verttri','Unknown surface fields.');
    const ver=matrix(unpacked,view,names.next), tri=matrix(unpacked,view,ver.next);
    need(ver.name === 'vert' || ver.name === '', 'Unknown vertex field.');
    need(ver.n===person.vertices && tri.n===person.faces && ver.m===3 && tri.m===3,'Unexpected native surface shape.');
    const verts=interleave(values(view,tag(view,ver.data),ver.n*3),ver.n,3);
    const faces=interleave(values(view,tag(view,tri.data),tri.n*3),tri.n,3,Uint32Array,-1);
    const l=await variable(bytes,...fields.locs,'locs');
    const g=await variable(bytes,...fields.elec_regions,'elec_regions');
    need(l.meta.n===contacts && l.meta.m===3 && g.meta.n===contacts && g.meta.m===1,'Unexpected electrode count.');
    const pos=interleave(values(l.view,tag(l.view,l.meta.data),contacts*3),contacts,3);
    const regions=Array.from(values(g.view,tag(g.view,g.meta.data),contacts));
    return {verts,faces,pos,regions,camera:person.camera,inward:person.inward};
  }
  async function loadOfficial(signal, person = people.bp) {
    const {start, end, compressed_sha256} = person.member;
    const range = start + '-' + end;
    const response = await fetch(archive+'?range='+range, {
      headers:{Range:'bytes='+range},signal,credentials:'omit',referrerPolicy:'no-referrer'
    });
    if(response.status!==206 || response.headers.get('Content-Range')!=='bytes '+range+'/580522436'){
      await response.body?.cancel();
      throw Error('Stanford did not supply the requested byte range. Open the original study file instead.');
    }
    const compressed=new Uint8Array(await response.arrayBuffer());
    need(compressed.length===end-start+1 && await sha(compressed)===compressed_sha256,'The downloaded archive member did not pass its checksum.');
    signal?.throwIfAborted();
    const bytes=await inflate(compressed,'deflate-raw');
    signal?.throwIfAborted();
    return original(bytes,person);
  }
  async function loadFile(file, person = people.bp) {
    const {name, size} = person.member;
    need(file && file.size===size,'Choose the original '+name.split('/').pop()+' ('+size.toLocaleString('en-US')+' bytes).');
    return original(new Uint8Array(await file.arrayBuffer()),person);
  }
  return {people,archive,loadOfficial,loadFile,original,sha};
})();
