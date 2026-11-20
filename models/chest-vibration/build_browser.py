"""Build the standalone forecast page from the released examples and fitted weights."""
import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="HTML file to write")
    args = parser.parse_args()
    models = json.loads((HERE / "weights.json").read_text(encoding="utf-8"))["models"]
    examples = json.loads((HERE / "invented-examples.json").read_text(encoding="utf-8"))["examples"]
    payload = {
        "base": models["base"], "aligned": models["aligned"],
        "history": [example["filtered_mV"] for example in examples],
        "mean": examples[0]["calibration_mean_mV"], "scale": examples[0]["calibration_sd_mV"],
    }
    if any(example["calibration_mean_mV"] != payload["mean"] or
           example["calibration_sd_mV"] != payload["scale"] for example in examples):
        raise ValueError("Paired illustrations require identical calibration")
    page = (HERE / "forecast.html.in").read_text(encoding="utf-8")
    data = json.dumps(payload, separators=(",", ":"), allow_nan=False)
    if page.count("__MODEL_DATA__") != 1:
        raise ValueError("Missing model data placeholder")
    args.output.write_bytes(page.replace("__MODEL_DATA__", data).encode("utf-8"))


if __name__ == "__main__":
    main()
