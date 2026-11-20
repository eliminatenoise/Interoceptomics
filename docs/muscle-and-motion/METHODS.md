# When the view turns

One person stood on a balance beam with the right foot ahead of the left, then walked heel to toe at 0.22 m/s. The headset briefly turned the view through its camera. The sacrum is the bone at the base of the spine. A reflective marker over it gives us one point we can follow while electrodes over eight lower-leg muscles record voltage.

## Open the atlas

Extract the entire ZIP. Open **Open on Windows.cmd** or **Open on macOS.command**. On Linux run `sh "Open on Linux.sh"`. Opening `index.html` also works. The recordings, two GLB files and controls work offline. Paper and dataset links open their original websites.

Both dark panels use the same projection and scale. Drag a path or focus it and use the arrow keys to rotate both. The scale bar measures distance in the plane of the plot. The cross marks the cutoff position and the dot marks the selected sample. Select **Next 125 ms** for a closer look at the later path. Use **Go to an original sample** to enter either session’s stored, zero-based sample number. During playback the recordings run at one quarter of their stored speed. The waveform menu changes the muscle and side together. Its vertical scale stays the same across both postures.

## Which events?

The source is Steven M. Peterson and Daniel P. Ferris’s *Perturbed beam-walking task*, version 1.0.3, archived Git snapshot `f15449b6aecb83044b49a1798955e8a212a68fc1`. A single previously selected participant contributes one standing and one walking session. For each we used the first event with eight valid leg channels and a valid sacrum trajectory. In both files event one passes. The view turned counterclockwise by 20° for half a second. One event per condition cannot establish a typical response. Standing preceded walking for this kind of perturbation. The experiment does not isolate an effect of posture from session order. [Versioned recording](https://doi.org/10.18112/openneuro.ds003739.v1.0.3) · [Peterson & Ferris, 2021](https://doi.org/10.1016/j.dib.2021.107635) · [Peterson & Ferris, 2018](https://doi.org/10.1523/ENEURO.0207-18.2018)

| Original clock or interval | Standing | Walking |
| --- | ---: | ---: |
| Logged cue, seconds from recording start | 50.7774771741 | 40.9592555724 |
| Logged fractional sample, zero-based | 12999.0342 | 10485.5694 |
| First stored sample after cue | 13000 | 10486 |
| First displayed sample | 12873 | 10359 |
| Observation cutoff | 13032 | 10518 |
| Last 32 samples through cutoff | 13001–13032 | 10487–10518 |
| Following 32 samples | 13033–13064 | 10519–10550 |

The one-based EEGLAB event latency minus one agrees with the fractional event sample within 0.01 sample. The two panels align by their first post-cue sample. For any displayed sample, divide its original index by 256 to get its recording time in seconds. Subtract that file’s logged cue time for time since the rotation command. This event log records a software command. It cannot identify the first light at the eye or the onset of a biological reaction.

## Read the measurements

**Lower-back motion.** Reflective markers were recorded at 100 Hz. Synchronization and interpolation by the authors placed them on the stored 256 Hz clock. The atlas retains all 192 stored sacrum triplets in original order. ML, SI and AP mean mediolateral, superior–inferior and anterior–posterior. The positive side of each axis remains anatomically unverified. Absolute positions are in the recorded frame in millimetres. A plotted displacement subtracts that same recording’s cutoff position. The standing head marker was unusable. The reader uses only the sacrum for both tasks. No missing positions have been filled.

**Muscle activity.** Each leg carries a lead over tibialis anterior, soleus, medial gastrocnemius and peroneus longus (also called fibularis longus). The instrument recorded electrical potential at the skin at 1,000 Hz. The authors low-pass filtered these leg voltages before time alignment. The atlas preserves their signs and all 160 stored samples up to and including the cutoff, with no additional filtering or rectification. A sign identifies the voltage polarity in the recording. It gives no anatomical movement direction. Exact XYZ electrode locations are missing from the source and the muscle labels provide only regional context. [Original instrument and processing methods](https://pmc.ncbi.nlm.nih.gov/articles/PMC8711048/) · [Lower-leg anatomy, OpenStax figures 11.32–33](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs)

For each channel, RMS is the square root of the mean of the 32 squared voltage samples in its labelled interval. The unit is still µV and opposite signs cannot cancel. Only the eight amplitudes summarize the later voltage interval in each excerpt. The complete later marker path contains all 32 positions after the cutoff. From cutoff to the last sample the standing marker changed by (−2.933, +2.213, −4.408) mm and the walking marker by (−3.111, +4.919, +0.575) mm in ML, SI, AP order. Voltage and motion share a clock. These data neither identify a causal muscle nor measure force.

## Reference and export checks

The authors’ apparatus figure and experimental methods identify the task and sensor types. The versioned event logs and original EEGLAB markers establish the clocks independently of the display. The channel table and author mask identify all eight usable leg voltages and three usable sacrum axes. The electrode tables record missing XYZ for all eight leg channels. The two sessions’ stored optical and voltage streams provide the numerical reference for their paths and waveforms.

The source check rejects nonfinite electrical history, an all-eight-zero voltage frame, or 32 consecutive identical values on any leg channel touching the displayed interval. For the marker it additionally inspects eight stored samples on both sides and requires finite, nonzero triplets, no step above 20 mm and no 32-sample identical run touching that expanded window. The author mask must include all eleven displayed channels. These checks cannot rule out smooth artifacts, smaller dropouts or uncertainty from resampling.

The two glTF 2.0 downloads use a line strip of 160 vertices through the cutoff and a line strip from that same point through the 32 later positions. Each file uses glTF XYZ = source ML, SI, AP, in metres relative to its own cutoff. The origin sample and original millimetre coordinates are in the file’s extras. The model covers one lower-back marker. Its two colors distinguish adjoining time intervals.

## Reproduce the two excerpts and models

The archive includes `source/build.py` and `source/inputs.json`. The repository keeps both in `models/muscle-and-motion/`. Download the two source sessions from the versioned dataset and put the materialized originals for each in a separate directory. Each contains one matching channels table, coordinates sidecar, EEG sidecar, electrode table, event log and sidecar, EEG SET and binary FDT. The SHA-256 fingerprints in `inputs.json` identify the exact inputs. With Python 3.11 or later, NumPy and SciPy installed, run:

```sh
python source/build.py STANDING_DIRECTORY WALKING_DIRECTORY OUTPUT_DIRECTORY
```

This writes the two GLBs and `recordings.js`. The JavaScript data file retains the values stored in the original float32 voltage and optical streams and the RMS values calculated in float64. The readouts round for display. The original data are dedicated to the public domain by Peterson and Ferris under CC0. The reader code and derived exports carry the repository’s CC0 dedication, included as LICENSE. [Dataset rights and citation request](https://github.com/OpenNeuroDatasets/ds003739/blob/f15449b6aecb83044b49a1798955e8a212a68fc1/dataset_description.json) · [CC0](https://creativecommons.org/publicdomain/zero/1.0/)
