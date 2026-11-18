# Brain R8 · package R14

Experimental preview · 19 November 2026

[ZIP archive](Interoceptomics-Brain-R8-Experimental-Preview-R14.zip) · [SHA256 checksum](Interoceptomics-Brain-R8-Experimental-Preview-R14.zip.sha256) · [Sources and reuse terms](../../RIGHTS.md#brain-r8-package-r14)

The archive is **38,709,900 bytes**, with 48 files and 74,784,210 uncompressed bytes. Its SHA256 is `70cb783da9dd737d19eaa8d5604d127f7b16ee20968a23b66274a939409d78d0`.

## Turn the left VPL

Find **VPL** under **Separate meshes** and choose **Isolate in place**. Drag to turn the ventral posterior lateral nucleus. Choose **Focus** to centre it or **Restore context** to bring the hemisphere back. Select **Red nucleus** to inspect the midbrain surface the same way. The canvas follows your window and keeps your view while you resize it.

The separate surface follows Allen Human Reference Atlas — 3D, 2020 v1.0.0 label 10424 in the original left half. The surrounding thalamus hides it in the ordinary views. The Allen hierarchy lists the rostral (VPLr) and caudal (VPLc) subdivisions under VPL. In version 1 neither has separately labelled voxels. VPM stays under **Atlas labels only**, with its source notes.

## What was checked

In Linux Chromium on AMD/RADV, the normal Linux launcher opened the extracted ZIP. The left VPL stayed isolated while it was turned and the window was resized. A click on the isolated surface reported 10424. The first view and four checked red nucleus frames matched R13 pixel for pixel. A missing VPL file left the red nucleus usable, a missing red nucleus file left VPL usable, and the rest of the atlas stayed available when both files were missing. A damaged VPL file produced the same fallback for that label.

Extract the complete ZIP and open its README. The Windows, macOS and Linux launchers use Python 3.10 or newer and a WebGL browser. Native Windows and macOS launch remain unverified.

The preview accounts for 121 of 141 occupied source labels across 42 meshes and their source records. Thirty-two labels have separate meshes, 83 have samples on combined surfaces and six appear as atlas labels only. A further 20 lack included surfaces. The mesh shows one population-reference atlas boundary. Individual anatomy and neural function require separate evidence. The comparison with other MRI and histology sources is qualitative. Quantitative anatomy, the original C01 visual checks, held-out evidence and full export acceptance remain open.

The root `PACKAGE-MANIFEST.json` lists the current files and has SHA256 `e27bd670917a05020efbf8ea9a2996cd0ee41f7bf0af47e99220075d4caf8876`. The manifest inside the model folder records the earlier geometry edition.
