When the pedal holds still · Interoceptomics experimental atlas

Open the atlas
Extract the ZIP first. Open index.html, or choose “Open on Windows.cmd”, “Open on macOS.command” or “Open on Linux.sh”. In an extracted copy on macOS or Linux you can also run the appropriate launcher with sh. No installation or server is required. Only the external source links need an internet connection.

Read one trial
Choose participant A01 or A02, a pedal setting and a repetition. Study participants tried to lift the forefoot while a strap held it to a fixed pedal. Task 1 recorded the outputs of a tibialis anterior surface EMG amplifier and a separate load-cell conditioner on a common acquisition board. EMG samples electrical activity from the muscle. The load trace records the output of the channel named loadcell_right. The source filename categories angle0 and angle5 distinguish the neutral setting from the other selected setting. The source listing also has angle_5 files. A physical sign or toe-up direction for the selected angle5 files remains unresolved. The channel name does not locate the measured leg on the person.

Scrub or play the recording. Reading time t is the last sample of a window that spans 200 sample intervals (201 observations including both endpoints). At the reported sampling rate of 1,000 Hz this is 0.200 s. The muscle trace stops at t. The shaded part of the load plot extends 100 samples beyond t. Hide or reveal those later values. The displayed outcome subtracts the load at t from the actual reading 100 source rows later, nominally 0.100 s. The slider accepts single-row steps by keyboard. Plots use the same scale for a given channel across all recordings unless you choose to fit the scale to the window. With window scaling, each visible channel range includes every value displayed in that graph. CSV exports use full-precision acquisition values. Screen readouts have four decimal places.

The four A01 files contain the exported nominal time vector. It matches the study's nominal 1 kHz grid. The four A02 files have equal-length channels but lack a time vector. For those files the displayed time is (one-based source row − 1) / 1000 seconds. Neither time basis provides an independent hardware timestamp for every row. Timing jitter, dropped hardware samples and physiological lag cannot be inferred from this replay. The raw conditioned channels retain their offsets. The viewer does no filtering, normalization or model fitting.

Turn the reference
Drag or focus the canvas and use arrow keys. Home restores the starting view. Use the camera presets or hide the leg to inspect the cell under the pedal. Colours distinguish the muscle belly, tendon, bones, strap, pedal and load cell. This is a fixed neutral illustration for both settings, independent of the recordings. Limb registration, electrode coordinates, soft-tissue deformation and individual anatomy are unavailable.

The methods describe a secured forefoot and a tension/compression load cell below an adjustable pedal on a base frame. The model locates these components schematically. Its support axis and cell centre are 0.100 m apart in the neutral fore-aft direction. Only the platform moment arm is a dimension reported by the study. All other apparatus dimensions and placements are illustrative. Download neutral-pedal.glb to open the scene in a glTF 2 viewer or 3D editor. Its glTF coordinate units are metres. The reference anatomy and the camera views do not establish the orientation or side of a participant's foot.

Try an example force
Choose a perpendicular force from 0 to 100 N. External moment magnitude = force × the 0.100 m platform moment arm. This manual example uses no channel reading. The weights used to calibrate the original platform are described in the paper, but a measured signed voltage-to-force gain for these files is missing. The recorded channel therefore stays in native acquisition units. A joint-level moment would combine contributions from multiple tissues and could not identify an individual muscle's force.

Reproduce the reader
sources.json lists source files, URLs, row counts, native fields, time basis and SHA-256 fingerprints for the originals and numerical arrays. The data hashes cover contiguous little-endian binary64 values in source order. Put the eight original MAT files under their listed Task 1/Sub_Axx paths within a local source directory. With Python, NumPy and SciPy, run
  python build_data.py SOURCE_DIRECTORY rebuilt.js
Compare rebuilt.js against measurements.js. build_data.py reads only these prelisted local files. No raw MAT, article figures or photographs are bundled.

reference/leg.js is the verified Interoceptomics extraction of the Z-Anatomy right lower leg. sources.json identifies the original archive and Blender member. To reproduce the extraction with Blender 4.5.9, run
  blender -t 2 --disable-autoexec --background Startup.blend --python-exit-code 1 --python reference/build_leg.py -- rebuilt-leg.js
Compare rebuilt-leg.js with reference/leg.js. build_scene.py uses that mesh to produce the standalone neutral-pedal.glb and the original apparatus.js used by the reader. Run
  python build_scene.py
Use python package.py pedal-load.zip to reproduce the simple offline package. NOTICE.txt records the authors, licences and modifications.
