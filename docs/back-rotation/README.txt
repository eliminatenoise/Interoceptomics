How far does the back sensor turn?
Interoceptomics experimental reader

Extract the complete ZIP into a folder. Open index.html or launch “Open on Windows.cmd”, “Open on macOS.command” or “Open on Linux.sh”. On macOS and Linux the launcher also works from a terminal with sh and the quoted filename. The recording, anatomy and controls run offline. Following a publication, repository or download link uses the internet.

The task buttons show the first walking and first standing blocks from person S01, trial 02. Play or drag the slider. It covers 0 to 4.89 seconds into each five-second block. The sensor plate shows orientation relative to the beginning of that block. For each cursor time, the green number measures the unsigned turn from now to 0.10 seconds later. It uses both measured endpoints. The two displays have different reference times. The research question of how well one can forecast a turn from earlier recordings is separate from this replay.

Choose an upper or lower patch and any of its 32 contacts. The voltage graph covers the full five seconds, with 500 signed means from consecutive 20-sample bins. Both task views use the same axes for a given channel. The original file marks some channels as null or noisy; flags apply to the entire trial. Null or noisy channels are drawn and labelled with their flags. Individual outlier flags do not remove samples. No filter or cardiac-template subtraction was applied in the reader. Both sites share the source time axis and a reference over the right scapula.

What went into the table
Four people from Experiment 2, S01, S02, S03 and S05, each supplied trials 02 and 03. In every contiguous source-labelled walking (code 621) or standing (code 611) block, take pairs of normalized orientations 200 stored samples apart, starting at the first sample. Advance by 200 samples. Both endpoints must be inside the same block. Neighbouring intervals can share one endpoint. The table reports median angular distance across all eligible intervals for each task and person. Exclude preparation and initial calibration periods. There is no model fitting, anatomical joint-angle recovery or independent assessment in these summaries.

Rebuild the numbers
From Zenodo v2, download each of the eight MATLAB files listed in sources.json from its Experiment 2 subject ZIP and put the original named files in one directory. The builder checks the SHA-256 of each extracted member. Python 3.11 or later, NumPy and SciPy are required only for rebuilding:
  python build_data.py /path/to/extracted/members recording.js
The builder checks the native 2,000 Hz clock and uses normalized W, X, Y, Z orientations. The members number their component rows; the component names and 100 Hz internal update rate come from the dataset description. The unsigned angular distance is invariant to a consistent reordering of the four components. Signed display axes depend on the stated convention. There is no calibration mapping these display axes onto individual anatomical axes.

Rebuild the anatomy
Get Z-Anatomy.zip from the Models-of-human-anatomy repository in NOTICE.txt. The exact source archive SHA-256 is e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736. Extract Z-Anatomy/Startup.blend. The script verifies its checksum, uses the atlas's existing geometry modifiers and writes the two local groups in reference/spine.js. This edition used Blender 4.5.9 with automatic script execution disabled:
  blender -b --disable-autoexec -t 1 /path/to/Startup.blend -P reference/build_spine.py -- reference/spine.js
The browser can use WebGL or its 2D canvas fallback to draw the same 3D surfaces. Drag the model, focus the canvas and use arrow keys, or use the rotation buttons. Home resets the camera. Shading and site colours are added for the reader.

To rebuild the ZIP from the files in this directory:
  python package.py back-rotation.zip
