"""Verify CEBSDB originals, keep three preselected 12 s excerpts, and generate the local viewer."""
import argparse
import hashlib
import json
import struct
from pathlib import Path
from urllib.request import urlopen
import wfdb

BASE='https://physionet.org/files/cebsdb/1.0.0/'
FIRST, LAST = 300000, 360000  # [60 s,72 s) at the native 5 kHz.
PAIRS = [('b001','b001'),('b002','p002'),('b003','p003')]
HERE = Path(__file__).resolve().parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def source(folder,name,pin=None):
    path=folder/name
    if not path.exists():
        with urlopen(BASE+name,timeout=45) as stream: body=stream.read()
        if pin is not None and digest(body)!=pin:raise ValueError('Unexpected download for '+name)
        path.write_bytes(body)
    body=path.read_bytes()
    if pin is not None and digest(body)!=pin:raise ValueError('Unexpected source for '+name)
    return body

def build(folder, dest):
    folder.mkdir(parents=True,exist_ok=True); dest.mkdir(parents=True,exist_ok=True)
    sums=source(folder,'SHA256SUMS.txt','75db8c9b809ef307aabeff2c0d1b780e1bb80d4df1044272ba0f980ed06f205e')
    pins=dict((n,h) for h,n in (l.split(maxsplit=1) for l in sums.decode().splitlines() if l.strip()))
    rows=[]
    for record, calibration in PAIRS:
        name=record+'.dat'
        raw=source(folder,name,pins[name])
        if pins[name]!=pins[calibration+'.dat']:raise ValueError('Calibration alias has different waveform bytes')
        for h in {record,calibration}: source(folder,h+'.hea',pins[h+'.hea'])
        hdr=wfdb.rdheader(str(folder/calibration))
        assert hdr.sig_name==['I','II','RESP','SCG'] and hdr.units==['mV']*4 and hdr.fs==5000 and hdr.fmt==['16']*4
        assert hdr.sig_len*8==len(raw)
        sums4=[0]*4
        for words in struct.iter_unpack('<4h',raw):
            for j,value in enumerate(words):sums4[j]+=value
        checks=[(v+32768)%65536-32768 for v in sums4]
        if checks!=hdr.checksum:raise ValueError('Per-channel native checksum disagrees with '+calibration)
        piece=raw[FIRST*8:LAST*8]
        if any(-32768 in row for row in struct.iter_unpack('<4h',piece)):raise ValueError('Missing observations in selected window')
        (dest/(record+'.bin')).write_bytes(piece)
        beats=[[],[]]
        if record=='b001':
            source(folder,'b001.atr',pins['b001.atr'])
            ann=wfdb.rdann(str(folder/record),'atr')
            for n,sym,ch in zip(ann.sample,ann.symbol,ann.chan):
                if FIRST<=n<LAST and sym=='N' and ch in (0,1): beats[int(ch)].append(int(n))
        rows.append({'record':record,'calibration':calibration,'file':record+'.bin','sha256':digest(piece),
                     'sourceSha256':pins[name],'headerSha256':pins[calibration+'.hea'],'channels':hdr.sig_name,
                     'units':hdr.units,'gain':hdr.adc_gain,'baseline':hdr.baseline,'nativeChecksums':checks,
                     'firstSample':FIRST,'stopSample':LAST,'rateHz':hdr.fs,'beatMarks':beats,
                     'annotationSha256':pins['b001.atr'] if record=='b001' else None})
    manifest={'schema':'interotomics-cebs-1','dataset':'CEBSDB 1.0.0','datasetDOI':'10.13026/C2KW23',
              'sourceIndexSha256':digest(sums),'records':rows}
    (dest/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=Path,required=True,help='Cache for the three full public waveform files and their metadata')
    p.add_argument('--out',type=Path,default=HERE/'data')
    args=p.parse_args();build(args.source,args.out)
