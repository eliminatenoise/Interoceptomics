"""Build the offline stride viewer from the reviewed group measurements."""
import argparse
from hashlib import sha256
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "src"
MODEL = HERE.parents[1] / "models/stride-signals"


def checked_json(path, checksum):
    raw = path.read_bytes()
    if sha256(raw).hexdigest() != (SOURCE / checksum).read_text().strip():
        raise ValueError(f"{path.name} differs from its reviewed checksum")
    return json.loads(raw)


def embed(data):
    return json.dumps(data, separators=(",", ":"), allow_nan=False).replace("<", "\\u003c")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=MODEL / "stride-reference.json")
    parser.add_argument("--travel", type=Path, default=MODEL / "marker-travel.json")
    parser.add_argument("--out", type=Path, default=HERE / "index.html")
    args = parser.parse_args()
    ref = checked_json(args.data, "input.sha256")
    travel = checked_json(args.travel, "travel.sha256")
    if ref["axes"] != ["forward", "left", "up"] or ref["phase_pct"] != list(range(101)) or len(ref["markers"]) != 52:
        raise ValueError("Unexpected stride reference layout")
    if (travel["axes"] != ref["axes"] or travel["phase_pct"] != ref["phase_pct"]
            or [m["id"] for m in travel["markers"]] != [m["id"] for m in ref["markers"]]
            or (travel["unit"], travel["lag_frames"], travel["point_rate_hz"]) != ("mm", 20, 100)):
        raise ValueError("Marker pairs do not match the stride reference")
    html = (SOURCE / "page.html").read_text().replace("__CSS__", (SOURCE / "style.css").read_text())
    html = html.replace("__DATA__", embed(ref)).replace("__TRAVEL__", embed(travel))
    scripts = "\n".join((SOURCE / name).read_text() for name in ("body.js", "reader.js"))
    args.out.write_text(html.replace("__SCRIPTS__", scripts))
