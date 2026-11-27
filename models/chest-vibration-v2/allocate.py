"""Recompute the chest-vibration v2 allocation from the CEBSDB 1.0.0 release manifest alone.

The manifest is https://physionet.org/files/cebsdb/1.0.0/SHA256SUMS.txt (185 lines).
This script reads no waveform, header or annotation file. It checks the manifest's
SHA-256, assigns every record by subject number with the fixed rule below, copies each
assigned file's SHA-256 from the manifest, lists every waveform alias group, runs the
allocation checks and writes a deterministic JSON file.

    python allocate.py SHA256SUMS.txt --output ALLOCATION.json

Python 3.10 or later, standard library only.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

MANIFEST_URL = "https://physionet.org/files/cebsdb/1.0.0/SHA256SUMS.txt"
MANIFEST_SHA256 = "75db8c9b809ef307aabeff2c0d1b780e1bb80d4df1044272ba0f980ed06f205e"
DATASET = "PhysioNet CEBSDB 1.0.0, DOI 10.13026/C2KW23, Open Data Commons Attribution License v1.0"

RULE = (
    "No random draw. Each CEBSDB subject number is one person. Fit pool: the post-music p-series "
    "record of every subject numbered 4 to 13. Primary test: the post-music p-series record of every "
    "subject numbered 14 to 20. Secondary new-person group, reported separately: the post-music "
    "p-series record of subjects 1 to 3. Basal check, one person, descriptive: b001 only, the one "
    "b-series waveform that is not a byte copy of a p-series waveform. One recording per person. "
    "Every file named in the manifest for subjects 14 to 20 other than the 14 primary-test .dat and "
    ".hea files is never fetched or opened before scoring; their .atr files may be fetched after "
    "scoring for a descriptive detector check only."
)

GROUPS = {
    "fit_pool": [f"p{n:03d}" for n in range(4, 14)],
    "primary_test": [f"p{n:03d}" for n in range(14, 21)],
    "secondary_new_people": [f"p{n:03d}" for n in range(1, 4)],
    "basal_check": ["b001"],
}
PHASE = {"p": "after music listening", "b": "baseline before music", "m": "during music"}
NAME = re.compile(r"^([abmp])([0-9]{3})\.(dat|hea|atr)$")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_manifest(path):
    body = Path(path).read_bytes()
    if digest(body) != MANIFEST_SHA256:
        raise SystemExit(f"Manifest SHA-256 differs from the pinned release index: {digest(body)}")
    pins = {}
    for line in body.decode("ascii").splitlines():
        sha, name = line.split()
        if name in pins or not re.fullmatch(r"[0-9a-f]{64}", sha):
            raise SystemExit(f"Malformed or repeated manifest line: {line!r}")
        pins[name] = sha
    return body, pins


def record_entry(pins, record, byte_source=None):
    dat, hea = record + ".dat", record + ".hea"
    if dat not in pins or hea not in pins:
        raise SystemExit(f"{record} is not complete in the manifest")
    entry = {
        "record": record,
        "subject": int(record[1:]),
        "phase": PHASE[record[0]],
        "dat": {"name": dat, "sha256": pins[dat]},
        "hea": {"name": hea, "sha256": pins[hea]},
    }
    if byte_source:
        entry["waveform_byte_source"] = {
            "name": byte_source,
            "sha256": pins[byte_source],
            "note": "Byte-identical copy of " + dat + " in the same release. Read it only with " + hea + ".",
        }
    return entry


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("manifest", type=Path, help="Local copy of the 1.0.0 SHA256SUMS.txt")
    parser.add_argument("--output", type=Path, default=Path("ALLOCATION.json"))
    args = parser.parse_args()
    body, pins = read_manifest(args.manifest)

    alias = {}
    for name, sha in pins.items():
        if name.endswith(".dat"):
            alias.setdefault(sha, []).append(name)
    alias_groups = sorted(sorted(names) for names in alias.values() if len(names) > 1)

    groups = {}
    for group, records in GROUPS.items():
        rows = []
        for record in records:
            source = None
            if group == "secondary_new_people" and record != "p001":
                source = "b" + record[1:] + ".dat"
            rows.append(record_entry(pins, record, source))
        groups[group] = rows

    def dats(group):
        return [row["dat"]["sha256"] for row in groups[group]]

    test = dats("primary_test")
    others = dats("fit_pool") + dats("secondary_new_people") + dats("basal_check")
    checks = {
        "manifest_sha256_matches_pin": True,
        "manifest_has_185_entries": len(pins) == 185,
        "fit_pool_waveforms_distinct": len(set(dats("fit_pool"))) == 10,
        "primary_test_waveforms_distinct": len(set(test)) == 7,
        "primary_test_waveforms_differ_from_every_other_group": not set(test) & set(others),
        "primary_test_aliases_are_only_their_own_b_copies": all(
            sorted(alias[row["dat"]["sha256"]]) == sorted([row["dat"]["name"], "b" + row["record"][1:] + ".dat"])
            for row in groups["primary_test"]
        ),
        "b001_differs_from_every_p_and_m_waveform": all(
            pins["b001.dat"] != sha for name, sha in pins.items() if name.endswith(".dat") and name[0] in "pm"
        ),
        "b002_b003_equal_p002_p003": pins["b002.dat"] == pins["p002.dat"] and pins["b003.dat"] == pins["p003.dat"],
        "secondary_waveforms_differ_from_fit_pool": not set(dats("secondary_new_people")) & set(dats("fit_pool")),
        "only_dat_alias_groups_are_bNNN_pNNN_for_2_to_20": alias_groups
        == [[f"b{n:03d}.dat", f"p{n:03d}.dat"] for n in range(2, 21)],
    }
    if not all(checks.values()):
        raise SystemExit("Allocation check failed: " + ", ".join(k for k, v in checks.items() if not v))

    primary_files = {row[ext]["name"] for row in groups["primary_test"] for ext in ("dat", "hea")}
    never_touch = sorted(
        name for name in pins
        if NAME.match(name) and 14 <= int(NAME.match(name)[2]) <= 20 and name not in primary_files
    )
    inner_folds = [
        {"fold": i + 1, "held_out": held, "fitted_on": [r for r in GROUPS["fit_pool"] if r != held]}
        for i, held in enumerate(GROUPS["fit_pool"])
    ]
    canonical = json.dumps(groups, sort_keys=True, separators=(",", ":")).encode("ascii")
    out = {
        "schema": "interoceptomics-allocation/1",
        "study": "chest-vibration v2",
        "dataset": DATASET,
        "manifest": {"url": MANIFEST_URL, "sha256": MANIFEST_SHA256, "bytes": len(body), "entries": len(pins)},
        "rule": RULE,
        "groups": groups,
        "groups_sha256": digest(canonical),
        "groups_sha256_rule": "SHA-256 of the 'groups' object serialised as JSON with sorted keys, ',' and ':' separators and ASCII escapes.",
        "inner_folds": inner_folds,
        "dat_alias_groups": alias_groups,
        "never_fetch_or_open_before_scoring": never_touch,
        "never_used_outside_manifest": "Legacy correction-archive files (a001-a020 and their proposed v1.1 index) are not part of release 1.0.0 and are not used.",
        "checks": checks,
    }
    args.output.write_text(json.dumps(out, indent=2) + "\n")
    print(args.output, out["groups_sha256"])


if __name__ == "__main__":
    main()
