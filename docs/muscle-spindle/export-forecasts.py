"""Build the aff015 trial 1 replay from the study's held predictions and source windows.

Supply the count-model OOF archive for the stated population, and matching windows.
Optionally supply mechanical-change forecasts from the same population and row order.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np


def sha(path):
    with path.open('rb') as file:
        return hashlib.file_digest(file,'sha256').hexdigest()


def export(args):
    with np.load(args.oof, allow_pickle=False) as src: oof = dict(src)
    with np.load(args.windows, allow_pickle=False) as src:
        windows = {k:src[k] for k in ('afferent','trial','prefix','bin_index','cutoff_s','y_delta','y_count')}
    for name in ('afferent','prefix','trial','bin_index','y_count'):
        assert np.array_equal(oof[name],windows[name]), name
    modes=list(oof['modes']);seeds=list(oof['seeds'])
    assert seeds==[1641,2718,3917]
    selection=np.where((oof['afferent']=='aff015')&(oof['trial']==1))[0]
    assert sorted(np.unique(oof['afferent']))==['aff004','aff015','aff017']
    assert np.all(oof['prefix']==0)
    assert np.array_equal(oof['bin_index'][selection],np.arange(5,160))
    np.testing.assert_allclose(windows['cutoff_s'][selection],8.46+.020*np.arange(5,160),rtol=0,atol=1e-10)
    secondary=None
    if args.mechanics:
        with np.load(args.mechanics,allow_pickle=False) as src:
            secondary={k:src[k] for k in ('valid','mechanics','combined','velocity','zero')}
        assert len(secondary['valid'])==len(windows['bin_index'])
    rows=[]
    for i in selection:
        j=int(oof['bin_index'][i]); rates=oof['rate'][i]
        row={'bin':j,'observed':int(oof['y_count'][i])}
        for key in ('all','history','mechanics'):
            row[key]=float(rates[modes.index(key),0])
        mixed=rates[modes.index('all')]
        row['range']=[float(mixed.min()),float(mixed.max())]
        paired=bool(oof['available_wrong'][i])
        if paired:
            donor=oof['earlier_row'][i]
            assert oof['afferent'][donor]=='aff015' and oof['trial'][donor]==1
            assert oof['bin_index'][donor]==j-5
        row['earlier']=float(oof['wrong_mechanics'][i,0]) if paired else None
        if secondary is not None and secondary['valid'][i]:
            row['reverse']={k:[float(windows['y_delta'][i,n]),float(secondary['mechanics'][i,n]),float(secondary['combined'][i,n]),float(secondary['velocity'][i,n]),float(secondary['zero'][i,n])] for n,k in enumerate(('force','position'))}
        rows.append(row)
    provenance={'oof_sha256':sha(args.oof),'windows_sha256':sha(args.windows)}
    if args.mechanics:provenance['mechanics_sha256']=sha(args.mechanics)
    data={'population':args.population,'seed':1641,'source':provenance,'rows':rows}
    args.output.write_text('const FORECAST = '+json.dumps(data,allow_nan=False,separators=(',',':'))+';\n')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('population',choices=('strict-afferent',))
    parser.add_argument('oof',type=Path)
    parser.add_argument('windows',type=Path)
    parser.add_argument('--mechanics',type=Path)
    parser.add_argument('--output',type=Path,default=Path(__file__).with_name('predictions.js'))
    export(parser.parse_args())
