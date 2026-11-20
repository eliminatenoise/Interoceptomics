"""Embed the verified excerpts and their calibration table into one offline page."""
import base64
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def build_page():
    metadata = (HERE / "data/manifest.json").read_bytes()
    manifest = json.loads(metadata)
    assets = {}
    for record in manifest["records"]:
        name = record["file"]
        waveform = (HERE / "data" / name).read_bytes()
        if hashlib.sha256(waveform).hexdigest() != record["sha256"]:
            raise ValueError(f"Changed waveform in {name}")
        assets[name] = base64.b64encode(waveform).decode("ascii")

    packet = {"manifestText": metadata.decode("utf-8"), "bytes": assets}
    payload = json.dumps(packet, separators=(",", ":")).replace("<", r"\u003c")
    program = (HERE / "viewer.js").read_text().replace(
        "/* MANIFEST_HASH */", hashlib.sha256(metadata).hexdigest()
    )
    page = (HERE / "page.html.in").read_text()
    page = page.replace("/* STYLES */", (HERE / "style.css").read_text())
    page = page.replace("/* DATA */", payload).replace("/* PROGRAM */", program)
    (HERE / "index.html").write_text(page)


if __name__ == "__main__":
    build_page()
