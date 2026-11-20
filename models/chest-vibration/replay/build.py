"""Build a standalone recording viewer from the frozen model and five fixed test excerpts."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
STUDY = HERE.parent


def main():
    weights = (STUDY / "weights.json").read_bytes()
    if hashlib.sha256(weights).hexdigest() != "55a78c3d9585b279b4d9be6a6c33ee60d08760f039b265badcc25d54e3366d8a":
        raise ValueError("The viewer is bound to a different set of weights")
    packet = json.loads((HERE / "excerpts.json").read_bytes())
    packet["models"] = json.loads(weights)["models"]
    summary = json.loads((STUDY / "results.json").read_bytes())
    packet["results"] = {r["record"]:r["rmse_mV"] for r in summary["held_out"]}
    page = (HERE / "viewer.html.in").read_text()
    for token, content in {
        "/* DATA */":json.dumps(packet,separators=(",",":"),allow_nan=False).replace("<",r"\u003c"),
        "/* INFERENCE */":(HERE / "recording.js").read_text(),
        "/* VIEW */":(HERE / "viewer.js").read_text(),
    }.items():
        if page.count(token) != 1:
            raise ValueError(f"Expected one occurrence of {token}")
        page = page.replace(token, content)
    (STUDY.parents[1] / "docs/inside/recording-forecast.html").write_text(page)


if __name__ == "__main__":
    main()
