"""Produce the file-open page without shipping any individual recording."""
import argparse,hashlib,json
from pathlib import Path
HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--data',type=Path,default=HERE.parents[1]/'models/stride-signals/stride-reference.json')
parser.add_argument('--out',type=Path,default=HERE/'index.html')
args=parser.parse_args()
raw=args.data.read_bytes()
expected=(HERE/'src/input.sha256').read_text().strip()
if hashlib.sha256(raw).hexdigest()!=expected:raise ValueError('The stride source does not match its reviewed checksum')
d=json.loads(raw)
if d['axes']!=['forward','left','up'] or d['phase_pct']!=list(range(101)) or len(d['markers'])!=52:raise ValueError('Unexpected stride coordinate system or source format')
src=HERE/'src';out=(src/'page.html').read_text().replace('__CSS__',(src/'style.css').read_text())
out=out.replace('__DATA__',json.dumps(d,separators=(',',':'),allow_nan=False).replace('<','\\u003c')).replace('__SCRIPTS__','\n'.join((src/f).read_text() for f in ('body.js','reader.js')))
args.out.write_text(out)
