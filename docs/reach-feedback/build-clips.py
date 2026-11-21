"""Assemble one published clip from its selected data and released forecasts."""

import argparse
import json
from pathlib import Path
import numpy as np

KEYS = ("block", "original", "ordinal", "k")
SHAPES = {
    "pose": (20, 8),
    "cue": (20, 3),
    "spikes": (20, 23),
    "movement": (10, 8),
    "concurrent": (10, 23),
    "delayed": (10, 23),
}


def forecast(file, identity, field, shape):
    if file is None:
        return None
    with np.load(file, allow_pickle=False) as table:
        same = np.logical_and.reduce([table[k] == v for k, v in zip(KEYS, identity)])
        rows = np.flatnonzero(same)
        if not len(rows):
            return None
        if len(rows) != 1:
            raise ValueError("More than one forecast matched this anchor")
        pred = table[field][:, rows[0]]
        if pred.shape != (3, *shape) or list(table["seeds"]) != [17, 41, 73]:
            raise ValueError("Forecast dimensions or seed identities differ")
        if not np.isfinite(pred).all():
            raise ValueError("Non-finite forecast in an admitted row")
        return pred.astype(float).mean(axis=0).tolist()


def clip(example, workspace, motor, cortex, joint):
    packet = json.loads(Path(example).read_bytes())
    identity = packet["block_original_ordinal_k"]
    result = dict(
        zip(KEYS, identity),
        split=packet["split"],
        workspace=workspace,
        eligible=packet["eligible"],
        reasons=packet["reasons"],
    )
    if not result["eligible"]:
        return result
    for key, shape in SHAPES.items():
        arr = np.asarray(packet[key])
        if arr.shape != shape or not np.isfinite(arr).all():
            raise ValueError(f"Invalid {key} in data packet")
        if key in ("spikes", "concurrent", "delayed") and not (
            (arr == arr.astype(int)).all() and (arr >= 0).all()
        ):
            raise ValueError("Spike counts must be nonnegative integers")
    guide = packet["unit_guide"]
    if len(set(map(tuple, guide))) != 23 or any(s <= 0 for _, s in guide):
        raise ValueError("Positive-sort unit identities required")
    result.update({k: packet[k] for k in SHAPES})
    result["unit_guide"] = guide
    result["predMovement"] = forecast(motor, identity, "full", (10, 8))
    result["predCount"] = forecast(cortex, identity, "full", (10, 23))
    result["directCount"] = forecast(cortex, identity, "direct", (10, 23))
    result["jointMovement"] = forecast(joint, identity, "rollout_movement", (10, 8))
    result["jointCount"] = forecast(joint, identity, "rollout_counts", (10, 23))
    result["parallelCount"] = forecast(joint, identity, "parallel_counts", (10, 23))
    if cortex and result["predCount"] is not None:
        with np.load(cortex, allow_pickle=False) as table:
            np.testing.assert_array_equal(table["unit_guide"], guide)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("example", type=Path)
    parser.add_argument("workspace", type=int, choices=(1, 2))
    parser.add_argument("--motor", type=Path)
    parser.add_argument("--cortex", type=Path)
    parser.add_argument("--joint", type=Path)
    args = parser.parse_args()
    print(
        json.dumps(
            clip(args.example, args.workspace, args.motor, args.cortex, args.joint),
            ensure_ascii=True,
            allow_nan=False,
            separators=(",", ":"),
        )
    )
