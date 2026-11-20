Inside a lifting foot · Interoceptomics

Open the reader
Extract the whole ZIP into a directory of your choice. Open index.html in a modern browser, or use the launcher for Windows, macOS or Linux in that directory. The anatomy, eight recordings, measurements and controls run without a server, installation or internet connection. The study references and project home open online.

Find the tibialis anterior
Drag the reference leg to rotate it. Keyboard users can focus the view with Tab, rotate it with the arrow keys and press Home to restore the opening angle. The three named camera views and Show bones control also work from the keyboard. Colour identifies the atlas muscle belly, tendon and bones. The bar in the scene spans 50 mm at its current orthographic magnification.

Read a recording
Choose a volunteer and trial. Click a curve or move the tracking-step slider. Arrow keys on the slider advance a single step. Play steps moves the cursor through 24 rows each second of screen time. It stops at the last row. Each vertical axis initially fits the active trial. Select the common-scales checkbox to compare the heights of curves across trials. Save selected trial as CSV exports the full-precision length and angle values at their native rows. The displays round numbers to two decimal places.

What you can compare
Task 3 of AnkleImage measured seated voluntary ankle dorsiflexion. The surface model is a reference right leg in a fixed pose. A tracking step denotes a saved row of image-derived estimates. Trial files differ in the number of native rows and their tracker time labels. A fixed number of steps can cover a different acquisition interval in different recordings. The study does not supply a verified physical timestamp joining each displayed point to an EMG or ankle-angle sample. UltraTrack estimates fascicle length and angle from the same images. The analysis uses the published millimetre and degree scales. Independent pixel calibration, per-row uncertainty and individual surface registration remain unavailable.

The straight segment uses the selected recorded length L and pennation angle a. Its offsets from a flat reference sheet are L cos(a) along the sheet and L sin(a) perpendicular to the sheet. Both drawing axes have the same millimetre scale, indicated by the bar. The drawing simulates one planar representation. Real tissue also has curvature, thickness and depth. The ten-step comparison subtracts the two released lengths in mm; gaps and the end of a trial interrupt it.

Reproduce the measurements
sources.json lists each original public MAT member, SHA-256, source fields, row count, native-angle checks and the hashes of the numerical arrays. The builder reads only the identified length, angle and first tracking table, after checking the entire original file digest. It never estimates a missing trial.
1. Obtain the listed Task 3 members from the source URLs and keep their original filenames in a directory.
2. With Python, NumPy and SciPy installed, run:
   python build_data.py DIRECTORY_WITH_MAT_FILES rebuilt.js
3. Compare rebuilt.js byte for byte with measurements.js. The format retains each source binary64 value. No interpolation adds measurements. A01 and A04 use two tables with signed differences or sums of their orientation columns. A02 has two longer native tables per trial and uses a sum. A03 uses the first numbered fascicle. Its dense PA curve reproduces the numbered angle by linear interpolation, and the orientation of its reference sheet remains unavailable separately. Use the row number to index the series. Breaks lists one-based rows that begin a new contiguous segment.

Reproduce the reference model
sources.json identifies the Z-Anatomy ZIP and Blender file by hash. The model keeps 29 source mesh objects, including the separately annotated surfaces of the muscle belly and tendon within one object. The builder evaluates the source scene in Blender, retains the full indexed triangles, changes position units to tenths of a millimetre and rounds. Each source vertex coordinate can differ by at most 0.05 mm per axis from that representation, apart from floating-point arithmetic. Reference anatomy has its own licence in NOTICE.txt.
Use Blender 4.5.9 on the cited Z-Anatomy/Startup.blend with automatic scripts disabled:
   blender -t 2 --disable-autoexec --background Startup.blend --python-exit-code 1 --python reference/build_leg.py -- rebuilt-leg.js
Compare the result with reference/leg.js. For a copy of this offline package run:
   python package.py muscle-tracking.zip
