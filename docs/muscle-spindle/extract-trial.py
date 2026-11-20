"""Export aff015 trial 1 from the Blum et al. Dryad recording. Requires NumPy and SciPy."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy.io import loadmat

SOURCE_HASH = "b3312ecf0a5840d96336a309a26afaaa4d1396107dc20035d58f2a65d3b56a23"


def pack(values):
    return base64.b64encode(np.asarray(values, dtype="<f8").tobytes()).decode()


def export(member, dest):
    with member.open("rb") as stream:
        assert hashlib.file_digest(stream, "sha256").hexdigest() == SOURCE_HASH
        stream.seek(0)
        source = loadmat(stream, variable_names=["info", "proc_data"], squeeze_me=True,
                         struct_as_record=False)
    assert str(source["info"].affname) == "aff015"
    assert str(source["info"].trial_type[0]) == "trad_series"
    trial = source["proc_data"][0]
    t, e, times = trial.time, trial.time_PotMem, trial.spiketimes
    assert len(t) == len(trial.Force) == len(trial.Length) == 6427
    assert len(e) == len(trial.PotMem) == 64261 and len(times) == 225
    assert np.allclose(t, e[::10], atol=1e-11, rtol=0)
    assert np.allclose(np.diff(e), 1/20000, atol=1e-11, rtol=0)
    assert np.array_equal(e[np.rint((times-e[0])*20000).astype(int)], times)
    for signal in (trial.Force, trial.Length, trial.PotMem):
        assert np.isfinite(signal).all()
    data = {"member_sha256": SOURCE_HASH, "afferent": "aff015", "trial": 1,
            "encoding": "base64 IEEE 754 binary64 little endian",
            "mechanics_hz": 2000, "electrical_hz": 20000,
            "time": pack(t), "force": pack(trial.Force), "position": pack(trial.Length),
            "events": pack(times), "electrical_time": pack(e), "electrical": pack(trial.PotMem)}
    dest.write_text("const TRIAL = "+json.dumps(data, separators=(",",":"))+";\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("member", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("trial.js"))
    args = parser.parse_args()
    export(args.member, args.output)
