// Decode only the three anatomy variables in the verified Stanford FingerFlex member.
const CortexAnatomy = (() => {
  const memberHash='b8222d13c15c97ec8590ed4b9ea180c639cac0b7c3e04bce178bb349f92be03a';
  const zipHash='b2905446cc76f2e28410160a239ba6a68aabe4151efe62f2f8f0e23bfef2e0b5';
  const range='6413-58845098';
  const url='https://stacks.stanford.edu/file/druid:zk881ps0522/fingerflex.zip?range='+range;
  const decoder=new TextDecoder('ascii');
  function need(test,message) { if(!test) throw Error(message); }
  async function sha(bytes) {
    need(globalThis.crypto?.subtle,'Open this viewer over HTTPS or directly as a local file to verify the original.');
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  }
  async function inflate(bytes,format) {
    need(typeof DecompressionStream==='function','This browser cannot unpack the original file. Use the local anatomy packet option.');
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
  function interleave(a,n,columns) {
    const out=new Float64Array(n*columns);
    for(let i=0;i<n;i++) for(let j=0;j<columns;j++)out[i*columns+j]=a[j*n+i];
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
  async function original(bytes) {
    need(bytes.length===58929343 && await sha(bytes)===memberHash,'Select the original unedited anatomical study file for this recording.');
    const {unpacked,view,meta}=await variable(bytes,58140178,784739,'brain');
    const n=tag(view,meta.data), fields=tag(view,n.next);
    need(decoder.decode(unpacked.subarray(fields.start,fields.start+fields.len)).replace(/\0/g,'')==='verttri','Unknown surface fields.');
    const ver=matrix(unpacked,view,fields.next), tri=matrix(unpacked,view,ver.next);
    need(ver.n===45180 && tri.n===90368 && ver.m===3 && tri.m===3,'Unexpected native surface shape.');
    const verts=interleave(values(view,tag(view,ver.data),ver.n*3),ver.n,3);
    const faces=interleave(values(view,tag(view,tri.data),tri.n*3),tri.n,3).map(x=>x-1);
    const l=await variable(bytes,58924925,1082,'locs'), g=await variable(bytes,57998073,75,'elec_regions');
    need(l.meta.n===46 && l.meta.m===3 && g.meta.n===46 && g.meta.m===1,'Unexpected electrode count.');
    const pos=interleave(values(l.view,tag(l.view,l.meta.data),138),46,3);
    const regions=Array.from(values(g.view,tag(g.view,g.meta.data),46));
    return {verts,faces,pos,regions};
  }
  async function loadOfficial(signal) {
    const response=await fetch(url,{headers:{Range:'bytes='+range},signal,credentials:'omit',referrerPolicy:'no-referrer'});
    if(response.status!==206 || response.headers.get('Content-Range')!=='bytes '+range+'/580522436'){
      await response.body?.cancel();
      throw Error('The archive did not supply the requested member. Open the original study file instead.');
    }
    const compressed=new Uint8Array(await response.arrayBuffer());
    need(compressed.length===58838686 && await sha(compressed)===zipHash,'The downloaded archive member did not pass its checksum.');
    return original(await inflate(compressed,'deflate-raw'));
  }
  async function loadFile(file) {
    need(file && file.size===58929343,'Choose the original bp_fingerflex.mat (58,929,343 bytes).');
    return original(new Uint8Array(await file.arrayBuffer()));
  }
  return {loadOfficial,loadFile,original,sha};
})();
