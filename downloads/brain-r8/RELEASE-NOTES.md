# Brain R8 · package R12

Experimental preview · 19 November 2026

[ZIP archive](Interoceptomics-Brain-R8-Experimental-Preview-R12.zip) · [SHA256 checksum](Interoceptomics-Brain-R8-Experimental-Preview-R12.zip.sha256) · [Sources and reuse terms](../../RIGHTS.md#brain-r8-package-r12)

The archive is **38,665,401 bytes**, with 46 files and 74,624,036 uncompressed bytes. Its SHA256 is `dbccae1e20fe10f0a6b4040e87b0555839e276eecfd8558fc57e052412ef9d53`.

## Turn the left red nucleus

Choose **Red nucleus · left atlas surface**, then **Isolate in place**. Drag to turn the nucleus and narrow the window. The canvas follows the window while the turn, pan and zoom stay in place. The medial overview moves below the canvas in a narrow window and beside it in a wide one. Choose **Restore context** to bring back the surrounding brain.

At five checked startup sizes, the first view, isolation and restored view matched R11 pixel for pixel, separately on AMD/RADV and SwiftShader in Linux Chromium. Live tests changed width, orientation and emulated display density in the same tab. They kept the nucleus and Insula group selected, checked keyboard focus and restore, and picked a rendered source label at the new dimensions. Blocking the optional nucleus file left the atlas label and the rest of the model usable. `VIEWER-CHECKS.json` in the archive records these checks.

## Open the preview

Extract the whole ZIP and open its README. The Windows, macOS and Linux launchers need Python 3.10 or newer and a browser with WebGL. The Linux launcher served the tested model on loopback. Native Windows and macOS launch remain unverified.

## What the atlas shows

R10 added the unsmoothed left red nucleus from Allen Human Reference Atlas — 3D, 2020 v1.0.0, label 12247 on a 0.5 mm grid. The separate MRI and histology comparison is qualitative. Quantitative anatomy, held-out evidence and measured neural function require separate tests. The original C01 visual domain, broader appearance and export acceptance remain open.

The geometry, coordinates, source identities, licences, overview image and launchers are among 40 exact R11 files. The root `PACKAGE-MANIFEST.json` lists the current files and has SHA256 `f757bb173ecf7f970dd0b714cddee7ea1647a4a4e1098e7627dbf4d6d80bda6c`. The manifest inside the model folder records the earlier geometry edition.
