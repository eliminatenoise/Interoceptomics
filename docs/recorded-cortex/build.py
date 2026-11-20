"""Build the file-open viewer from source code, approved frequency summaries and the exact ethics statement."""
import argparse
import base64
import hashlib
import html
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--data',type=Path,default=HERE.parents[1]/'models/recorded-cortex')
parser.add_argument('--out',type=Path,default=HERE/'index.html')
parser.add_argument('--local-anatomy',type=Path,help='Embed the exact extracted study packet in a separate, private offline copy')
args=parser.parse_args()
if args.local_anatomy and args.out.resolve()==(HERE/'index.html').resolve():
    parser.error('Choose a separate output path for a local anatomical copy.')
def load(name,checksum):
    b=(args.data/name).read_bytes()
    if hashlib.sha256(b).hexdigest()!=checksum:raise ValueError(f'Unexpected source for {name}')
    return json.loads(b)
regional=load('regional-activity.json','2753aba01381ecdc7617d4fc1654c9b3c2956242ee9c9165f54182a174e4df72')
sites=load('contact-means.json','8e1ad90b1fc3a16318f917e88d7424c9c2f1b0b0d3556892b83b69f4539de93c')
timing=load('time-course/time-course.json','99d254e0a3f93dc18f6161fa5df7d76fae5995cb7593b3c3326c2011a3d29227')
assert [r['region_code'] for r in timing['contacts']]==[r['region_code'] for r in sites['contacts']]
assert [r['code'] for r in timing['regions']]==[r['code'] for r in regional['regions']]
ethics=[s.strip() for s in (args.data/'METHODS.md').read_text().split('\n\n') if s.strip().startswith('Ethics statement:')]
assert len(ethics)==1
src=HERE/'src'
scripts='\n'.join((src/n).read_text() for n in ('anatomy.js','surface.js','view.js'))
data=json.dumps({'regional':regional,'sites':sites,'timing':timing},separators=(',',':'),allow_nan=False).replace('<','\\u003c')
output=(src/'page.html').read_text().replace('__STYLE__',(src/'style.css').read_text()).replace('__ETHICS__',html.escape(ethics[0])).replace('__DATA__',data).replace('__SCRIPT__',scripts)
bundled=''
if args.local_anatomy:
    b=args.local_anatomy.read_bytes()
    if hashlib.sha256(b).hexdigest()!='cc06b1e49ab755aecef3317699e1c457f3d0141e2111816503fbf8b5b9498f57':
        raise ValueError('Unexpected native anatomy packet')
    bundled='<script type="application/octet-stream" id="bundled-anatomy">'+base64.b64encode(b).decode('ascii')+'</script>'
args.out.write_text(output.replace('__BUNDLED__',bundled),encoding='utf-8')
