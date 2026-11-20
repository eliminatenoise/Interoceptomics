# Grasping and balancing

A person reaches with the right hand for an object. In another laboratory, another person walks heel to toe on a moving beam while a headset rotates their view. Each study gives us the position of a point on the body and electrical activity from muscles in the same recording. How far does that point travel from its starting position in an eighth of a second?

Open `index.html` for the interactive reader. To use a launcher, extract the entire ZIP, then open **Open on Windows.cmd** or **Open on macOS.command**. On Linux, run `sh "Open on Linux.sh"`. The reader, forecasts and both measured 3D paths work without a network connection. The study links lead to the original websites.

## Pick a time

The comparison clock steps in intervals of 1/256 s (3.90625 ms). **Next 125 ms** starts at each recording’s cutoff. **Whole excerpt** includes the preceding movement and muscle activity. **Wrist frames** steps by 2 ms and **Sacrum frames** by 1/256 s. Wrist frames extend to +126 ms so you can inspect both samples that bracket +125 ms. The observations occurred in separate studies, in different people and under different cues. Each time on the slider is relative to its own study cutoff.

Drag either path or focus it and use the arrow keys to turn it. Choose a pair of axes for an orthographic projection. In the 125 ms view, small dots mark the chosen time steps and a cross marks the cutoff. The larger dot marks the selected time. Each panel fits its measured path and all its forecasts to the available space. Switching forecasts keeps that view and its scale bar fixed. The bar measures projected distance. The three coordinate readouts give signed displacement from the cutoff in millimetres. “Distance from cutoff” is the straight-line length of that 3D vector. It can be much shorter than the distance travelled along a curved path.

Each **Stored position frames** table shows the original position samples in source units. The on-screen table rounds coordinates to four decimals. Between samples the reader interpolates each coordinate linearly. At an unsupported time the readout is empty. **Muscle amplitude** shows 24 successive 31.25 ms windows from −625 to +125 ms with a separate scale for each selected muscle. A bin includes its right endpoint and excludes its left. At −625 ms the first bin has yet to finish. Each table compares the 125 ms ending at cutoff and the following 125 ms. Root mean square (RMS) is the square root of the mean squared signed potential. It measures the size of the electrical signal recorded at the skin. Electrode gain, placement, reference, filtering and tissue affect that measurement.

## Where does the forecast miss?

Choose a forecast above the recordings. The solid line traces the measured position. The dashed turquoise line follows the selected forecast. At the time on the slider, the pale dot marks the measurement and the open diamond marks the forecast. The paths can appear to meet in one view and separate when you turn them. The distance readout uses all three coordinates, so it stays the same when you rotate the view. Open **Compare coordinates at this time** to read each signed measured and forecast displacement along the recording axes.

The model gets 625 ms of earlier muscle activity and marker positions, plus the study and task context. At cutoff it predicts 32 positions spaced 3.90625 ms apart. Each model was fitted without any recordings from the person shown in its panel. Three training runs used different starting seeds. Both recordings were already in the atlas before fitting and the displayed seed, 1641, was fixed in advance.

- **Two maps, one per study.** The same movement model reads both studies, then uses one set of final weights for the wrist and another for the sacrum.
- **Two maps, blended over time.** Both studies use both maps. As the forecast advances, it shifts linearly from the first map at the first time point to the second at the last. Each of these two-map models has 3,975 adjustable weights in total. Their training fits the rest of the model as well as the final maps.
- **One shared map.** The earlier architecture uses one final map throughout both studies. This fit has 3,924 adjustable weights.
- **Continue the last velocity.** This straight line extends the direction and speed between the last two marker positions given to the models. The actual spacing is 32 ms for the wrist and 31.25 ms for the sacrum. Both positions were available by cutoff.

The small graph joins the 32 distances between the measured and predicted positions, in millimetres. The mean gives those 32 distances equal weight. Zero is the known starting position and contributes no term to the mean. On the wrist’s native clock the selected time can fall between two forecast points. There the reader joins adjacent predicted positions with a straight line and compares that position to the wrist measurement. The dot can then sit above or below the line joining the scored distances. The forecast ends at +125 ms. The wrist measurement at +126 ms remains available for inspecting its endpoint bracket.

Each distance describes this one movement. For a comparison across participants, muscle channels, recordings and seeds, use the [NeuroTranslation decoder study](https://eliminatenoise.github.io/NeuroTranslation/papers/cross-limb-movement/decoder-study/).

## Wrist

Luciw, Jarocka and Edin asked participants to reach for, grasp, lift, hold and replace an object. The study recorded a go light. These instructions give the task context. The recordings have no trial-specific spoken instruction. Only the preselected first numbered lift from one development recording appears here.

The LED came on **400 ms before cutoff**. A Polhemus FASTRAK sensor at the wrist (P4) supplied the X, Y and Z positions. The stored position interval is 2 ms (500 Hz). Repeated values occur, so successive rows need not represent independent tracker updates. The matrix lacks a units field. The authors differentiate the wrist coordinates with a timebase in seconds, then use a threshold of 5 cm/s. Figure 2 also reports wrist speed in cm/s. This establishes centimetres for P4 coordinates, so multiplying a difference by 10 gives millimetres. X, Y and Z retain the tracker order. The data available here do not establish their alignment to the walking study’s frame. [Apparatus and tracker placement, Figure 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC4365902/#f1) · [Measurements and Figure 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC4365902/#f2) · [Event code and speed threshold](https://github.com/luciw/way-eeg-gal-utilities/blob/c81320ab5da20de83b09ec62167200abdcf8c88c/Utilities/WEEG_FindEvents.m#L440-L450)

The window includes 377 original triples from −626 to +126 ms, including the samples that bracket both display boundaries. At +125 ms the two samples at +124 and +126 ms each have weight ½. The resulting offline wrist displacement is (+12.80, −23.12, +17.00) mm, rounded to two decimals. Every strictly positive comparison-clock position through +125 ms falls between stored wrist frames. A future bracket can be used to reconstruct an offline position. It would be unavailable to a live system at +125 ms.

The five arm and hand channels were acquired at 4,000 Hz. Each 31.25 ms summary uses 125 signed samples and each 125 ms summary uses 500. The display keeps amplitude in the released units. The conversion to volts or microvolts has not been established. No strength, contraction force or recorded nerve activity can be recovered from RMS alone. [Original acquisition and data](https://doi.org/10.1038/sdata.2014.47) · [Versioned data collection](https://doi.org/10.6084/m9.figshare.c.988376.v2)

## Sacrum

Peterson and Ferris measured a reflective marker over the sacrum, the bone at the base of the spine. The walker moved heel to toe along a beam on a treadmill at 0.22 m/s. In this excerpt a headset rotated the view 20° counterclockwise for 0.5 s. This is a logged visual perturbation. The record does not establish when it first reached the eye. The first rotation in the preselected walking recording supplied this example.

Cutoff is 32 stored samples after the first sample on or after the logged onset, **126.682 ms after that fractional onset**. The 100 Hz optical recording was interpolated to the authors’ stored 256 Hz clock. The 192 released triples used here extend from −621.09375 to +125 ms. The first comparison instant at −625 ms has no position in this excerpt. All 32 post-cutoff comparison positions coincide with stored frames. At +125 ms the sacrum displacement is (−3.11, +4.92, +0.58) mm in mediolateral, superior–inferior and anterior–posterior order. These names indicate the directions of the axes. The anatomical sign of each positive direction remains unverified. [Experimental setup and rotations](https://doi.org/10.1523/ENEURO.0207-18.2018) · [Recording and time alignment](https://doi.org/10.1016/j.dib.2021.107635)

The lower legs each carried electrodes over tibialis anterior, soleus, medial gastrocnemius and peroneus longus. The original muscle acquisition ran at 1,000 Hz. The authors filtered and synchronized the signals, storing them on the 256 Hz clock in microvolts. Each 31.25 ms summary uses eight released rows per channel and each 125 ms summary uses 32. The first muscle bin uses the eight stored samples after −625 ms through −593.75 ms. The signed voltages themselves are omitted from this compact reader. Numerical amplitude comparisons between the arm and leg would require an established conversion and comparable acquisition. [Versioned data](https://doi.org/10.18112/openneuro.ds003739.v1.0.3) · [Dataset credits and CC0 dedication](https://github.com/OpenNeuroDatasets/ds003739/blob/f15449b6aecb83044b49a1798955e8a212a68fc1/dataset_description.json)

## 3D files and reproduction

Each GLB is a single line strip joining every stored position in chronological order. Vertex zero is the earliest frame. The vertex labelled `cutoffVertex` in the file metadata sits at the origin, and the stored coordinates are translated to metres for glTF. Keep the components in their original order. A generic 3D viewer may call its second axis “up” even where the anatomical orientation is unknown. The GLBs describe one sensor path apiece. No body surface or missing joint has been reconstructed.

To regenerate the excerpts, use Python 3.11 or later with NumPy and SciPy. From the WAY-EEG-GAL data collection extract the windowed MATLAB series whose SHA-256 is `d4f321b39028e16518e063ce6222bb281947b1127e5a42499420ccd812615ab5`. Supply that file, the directory containing the selected OpenNeuro rotatewalk FDT and its channel/event TSVs, and an output directory to the included source. The script checks all input fingerprints and renders only the first lift and first rotation.

```sh
python source/build.py wrist.mat walking-eeg/ output/
```

To regenerate the four forecast overlays, use the development cache and held-participant predictions from the decoder study above. Keep the matching prediction receipt (`oof-seed-1641.json`) beside its NPZ file. Both examples use fold 0 of the three participant-held folds. The extractor checks the fixed cache and atlas measurements by SHA-256, locates both recordings by matching their 32 measured XYZ triples and checks all 20 past marker positions and muscle windows. It verifies the row and held-person fold assignments before exporting just the selected paths. The package script builds the standalone reader from an Interoceptomics checkout with the regenerated files in `docs/cross-limb-movement/`.

```sh
python source/extract_forecasts.py development.npz oof-seed-1641.npz recordings.js forecasts.js
python source/package_atlas.py /path/to/Interoceptomics cross-limb-movement.zip
```

The study recordings are dedicated to the public domain under CC0. Please credit Matthew D. Luciw, Ewa Jarocka and Benoni B. Edin for WAY-EEG-GAL and Steven M. Peterson and Daniel P. Ferris for the perturbed beam-walking dataset. The two GLBs, display and code carry the repository’s CC0 dedication. The source papers and figures are linked at their original publications. [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
