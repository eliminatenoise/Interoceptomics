Heel and force · Interoceptomics experimental atlas

Open the walk
Extract the entire ZIP to one folder and open index.html. You can also choose “Open on Windows.cmd”, “Open on macOS.command” or “Open on Linux.sh”. On macOS and Linux, sh followed by the quoted launcher filename also works. The replay, figure, data and target poses work offline. External research links need a connection.

Choose an interval. It opens at the observed target. “Go to cutoff” moves back 100 ms. Play slowly starts a replay with 100 ms of actual walking stretched across one second of screen time. The time slider takes one camera-frame step from the keyboard. Drag the 3D view, or focus it and use the arrow keys. Home or Reset view restores its camera. Lower legs and Right foot show the heel and forefoot markers in more detail. The overhead view shows the plate footprints. Whole body shows all 52 markers, including the trunk and both arms. Links join measured skin markers. Their centres and the recorded plate corners establish physical scale. Symbol sizes aid visibility. There is no fitted body surface.

Which foot, which plate?
The barefoot trial used the C2 slow-speed condition in Luxembourg. Supplementary Table 2 lists code 12 for 2014001_C2_01. The right foot contacts plate 1 and the left contacts plate 2 in this walk. The right foot strikes at 0.05 s and lifts off at 1.32 s. For all three target frames the heel and forefoot lie over plate 1. The left foot contacts plate 2 later in the trial (annotated strike at 0.96 s); the second plate's outline shows its location. Only the upward load under the right foot is graphed. It is a net external force measured in newtons. Its distribution across the foot and across individual muscles is unavailable.

A camera frame and its force samples
The camera sampled 100 times per second. The floor plates sampled 1,500 times per second. The archive groups 15 force readings with each camera frame. The mean around camera index i uses zero-based force indices 15i through 15i+14. Their times run from i/100 − 7/1500 through i/100 + 7/1500 seconds on the cropped recording clock. The source stores local +Z pointing down. Its scaled local Fz1 matches the negative of the calibrated laboratory upward force at each reading. The cutoff’s plotted force is a centred descriptive measurement and includes seven analog readings after the cutoff centre. The chart replays measurements. It supplies no predictor inputs or real-time predictions.

Each example starts with the past 24 camera frames up to its cutoff, then shows the 10 stored frames that follow. The paired outcome combines the displacement of the right posterior heel marker (R_FCC) from cutoff to target and the mean force at the target. The marker over the second metatarsal head (R_FM2) tracks the ball of the foot. All three windows revisit one stance in one development recording. The sign and magnitude of each measured displacement belong to its laboratory axis. The study filled marker gaps and applied two-way filtering. The original gap mask and heel-specific uncertainty are unavailable. Decimal places preserve values in the archive. The study gives no sub-millimetre guarantee. Its protocol reports calibration residuals under 2 mm across sessions. A processed zero on a force channel may reflect missing data or source thresholding.

Open a target pose in a 3D editor
pose-39.glb, pose-49.glb and pose-59.glb contain the three measured target poses at 0.39, 0.49 and 0.59 s. A GLB stores a 3D scene in one file. Here it contains all 52 marker centres, connecting guides and both plate surfaces. Scene metadata includes index, time via the scene name, and mean plate 1 upward load. Marker centres transform from laboratory millimetres [X, Y, Z] to glTF metres [X, Z, −Y]/1000. All three axes share the same physical scale; the 5 mm display radius is illustrative. No force arrow is assigned to a single contact point.

Reproduce this edition
Obtain 2014001_C2_01.c3d from the walking-trial archive in dataset v8. sources.json records its SHA-256 and the dataset, methods, force assignment, scale and licences. Use Python 3.10 or later, ezc3d and NumPy (versions in sources.json). In a copy of this folder run
  python build_data.py /path/to/2014001_C2_01.c3d measurements.js
  python build_exports.py
  python package.py heel-and-force.zip
The extractor verifies the original recording fingerprint and reads only that file. Frame positions, plate corners, sample groups and the original event labels remain inspectable in measurements.js. frames.csv has one row per camera frame across the union of the three intervals, without repeating the overlapping samples. Original source recordings and subject metadata are not bundled. See NOTICE.txt for authors and licences.
