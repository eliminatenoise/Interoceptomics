"""Check the published aggregate, including pairs with insufficient observations."""
from hashlib import sha256
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SHA256 = "0a7f75a21fa5cd59ecf8070fabb4b675bf51edf0d10ea44e3277c74db4fe8acd"


def verify():
    raw = (ROOT / "marker-travel.json").read_bytes()
    assert sha256(raw).hexdigest() == SHA256
    data = json.loads(raw)
    ref = json.loads((ROOT / "stride-reference.json").read_bytes())
    assert data["point_rate_hz"] == 100 and data["lag_frames"] == 20 and data["unit"] == "mm"
    assert data["axes"] == ref["axes"] and data["phase_pct"] == ref["phase_pct"] == list(range(101))
    assert data["eligible_walkers"] == ref["summary"]["eligible_people"] == 30
    assert data["eligible_strides"] == ref["summary"]["eligible_strides"] == 89
    assert [m["id"] for m in data["markers"]] == [m["id"] for m in ref["markers"]]
    visible = 0
    for row in data["markers"]:
        for key in ("start_mm", "delta_mm", "mean_endpoint_distance_mm", "n_walkers", "n_strides"):
            assert len(row[key]) == 101
        for phase in data["phase_pct"]:
            n, count = row["n_walkers"][phase], row["n_strides"][phase]
            assert 0 <= n <= 30 and n <= count <= min(3 * n, 89)
            start, delta, distance = (row[key][phase] for key in ("start_mm", "delta_mm", "mean_endpoint_distance_mm"))
            if n < 3:
                assert start is None and delta is None and distance is None
                continue
            visible += 1
            assert len(start) == len(delta) == 3 and all(math.isfinite(v) for v in [*start, *delta, distance])
            # Rounding changes each xyz component and distance by at most half a last digit.
            assert distance >= 0 and math.hypot(*delta) <= distance + .0005 * (1 + math.sqrt(3))
        assert row["n_walkers"][100] == row["n_strides"][100] == 0
    assert visible == 4680
    ankle = next(m for m in data["markers"] if m["id"] == "R_FAL")
    assert (ankle["n_walkers"][50], ankle["n_strides"][50]) == (30, 89)
    assert ankle["delta_mm"][50] == [56.873, -9.72, 65.401]
    assert ankle["mean_endpoint_distance_mm"][50] == 88.155
    print(f"{visible} supported cells and {52 * 101 - visible} withheld cells passed")


if __name__ == "__main__":
    verify()
