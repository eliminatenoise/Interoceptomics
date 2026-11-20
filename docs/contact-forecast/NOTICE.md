# One push, two recording days

Chowdhury RH, Glaser JI and Miller LE (2020). *Area 2 of primary somatosensory cortex encodes kinematics of the whole arm*. eLife 9:e48198. The team deposited the task events, movement and counts used here under CC0 1.0. [Article](https://doi.org/10.7554/eLife.48198) · [Dryad data](https://doi.org/10.5061/dryad.nk98sf7q7) · [Dataset licence](CC0-1.0.txt)

## Recordings and coordinates

The two members of `s1-kinematics.zip`, under `reaching_experiments/`, are authenticated by the following SHA-256 values.

| Member | SHA-256 |
|---|---|
| C_20170912_COactpas_TD.mat | a391516945a67aff89039f33c0829a1c5423d859ce79baaaca962985916996af |
| C_20170913_COactpas_TD.mat | 4b81469ed6ef2460d5f07aaf26fe0580d213fd86e0f6a08b0e280292fbef2fe7 |

For each date the reader includes the earliest numerically eligible original with a rewarded pre-target bump from its respective training or test set. The previously inspected original 1 from September 13 was excluded from the test. The retained records give each original’s inclusive start and end rows, event rows and the first row of each forecast in one-based MATLAB indexing. One row spans 10 ms on the stored grid. [Forecast reader and study methods](https://eliminatenoise.github.io/NeuroTranslation/contact-forecast/)

With Python 3.11 or later, NumPy and SciPy, run `python check-recordings.py PATH_TO_REACHING_EXPERIMENTS` to check the members against all published arm positions, handle positions, count bins, event rows and 100-ms targets. The forecast reader links the separately distributed fitted models.

The ten XYZ triples come directly from the deposited `markers` field. The tracking pipeline aligned, filtered and resampled the camera estimates. Source axis names X, Y and Z and distances in metres refer to the shoulder-centred frame. Marker_3 belongs to the hand. Pronation_Pt1 is on the proximal ulna and serves as an elbow proxy. Shoulder_JC supplies the origin. Robot handle `pos` in centimetres has its own encoder axes and origin. The surface, marker sizes, connecting rods and axes drawn on screen illustrate the positions. The radius of each limb segment is an illustrative choice. The second-day trail, when enabled, aligns samples by time relative to the push and by their respective shoulder origins. Calibration differences can contribute to the apparent distance between dates. [Author arm model](https://github.com/limblab/monkeyArmModel/blob/d7667011273e3ded63f14ff465123816628acb41/monkeyArm_current.osim) · [Kinect pipeline](https://github.com/limblab/ClassyDataAnalysis/blob/3d23730956b05aa19594cbfc6dcb2b4ab8833f34/%40commonDataStructure/loadRawMarkerData.m) · [Shoulder transform](https://github.com/limblab/KinectTracking/blob/f656ab81dd0ea2072c642f02afbe8f8fc472c3db/functions/transformForOpenSim.m) · [Stored coordinate conversion](https://github.com/raeedcho/loadTDfromCDS/blob/079e6a9ff70ef5498894d32753a13d58997b5702/processCDS.m)

Each original has one standalone glTF 2 binary. Marker node translations are in metres. The glTF Y-up frame applies (X, Z, −Y) to each source point. STEP interpolation holds each sample until the next 10-ms observation. At a missing sample the site and affected connecting guides disappear. Dot radii and guide widths aid visibility. The physiological data stay in the reader. To regenerate both files, run `python export-glb.py 2017-09-12` and `python export-glb.py 2017-09-13` in the extracted folder.

## Recorded and predicted events

The 26 electrodes appear by the number in each date’s own `S1_unit_guide`. The sort-zero column was looked up separately on each date. The recorded 100-ms target is the sum of `S1_spikes` from rows k through k+9 inclusive on that contact. A bin can contain more than one event. The preceding 20 completed bins supply features to the fitted full Transformer. Numerical forecasts are expected counts, so fractional values are meaningful. All examples show seed 17. September 12 is a training example. September 13 is an independently held recording. The group outcome uses all three seeds separately and the matched whole-original comparison specified in the study. The slider moves the measured cursor. The forecast selector fixes the window so the cursor can move across its ten bins. Electrode number identifies the source recording channel. The dataset does not authenticate the physical coordinates of each displayed contact or identify a single neuron across the two recording days. The archived mechanical data underwent offline filtering. [Authors’ spike-loading code](https://github.com/raeedcho/loadTDfromCDS/blob/079e6a9ff70ef5498894d32753a13d58997b5702/processCDSspikes.m) · [Forecast implementation and results](https://eliminatenoise.github.io/NeuroTranslation/contact-forecast/)

## Figures and reuse

Figures 1, 2 and 8 are by Chowdhury, Glaser and Miller (2020), eLife 9:e48198, under CC BY 4.0. The complete figures were resized to fit 850 × 850 pixels and converted to WebP. Figure 2 shows the task and tracked sites. Figure 8 gives the context for imposed and voluntary motion. Figure 1 shows cortical array locations and receptive fields from the authors’ mapping sessions. Each figure describes its own experiment and sample. [Published figures](https://elifesciences.org/articles/48198/figures) · [Figure licence](CC-BY-4.0.txt)

Original viewer code, geometry helpers and explanatory text use the Interoceptomics repository’s CC0 licence. Article illustrations retain their separate attribution and licence. [Interoceptomics source](https://github.com/eliminatenoise/Interoceptomics/tree/main/docs/contact-forecast)
