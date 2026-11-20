# What changes after a movement cue?

The screen tells a seated participant to bend the right elbow. At the scalp electrode Cz, the change from before the cue to 2.50–2.75 seconds after it is −35.53 stored units. For the instruction to extend the elbow, Cz gives almost the same answer, −35.63. The elbow sensor, on its own scale, changes by +27.41 for flexion and −25.22 for extension. Each number summarizes 18 repetitions of one task by one person. A scalp value on its own leaves plenty of room for two quite different movements. [Recording and task](https://doi.org/10.1371/journal.pone.0182578)

These are four snapshots relative to the visual cue. The instruction appeared two seconds after the warning cross and beep. The participant used a supported right arm to bend or extend the elbow, rotate the forearm palm up or down, close or open the hand, or rest. The source is participant S1, execution runs 1–3, with six repetitions of each of the seven cues per run. These runs had already been used in two movement-forecast analyses when the descriptive protocol was set. The snapshots have no held-out test. [Original data and event table](https://doi.org/10.5281/zenodo.834976)

## Read the numbers

1. Set zero to the onset of the **visual cue**. The mechanical movement can begin later. For each trial and channel, take the median reading from 0.50 to 0.25 seconds before zero.
2. Take another median in each quarter-second window, starting at 0.00, 0.75, 1.50 and 2.50 seconds. Subtract the baseline median from each. Use exact half-open intervals. A sample at the ending time belongs outside the window.
3. For each task, channel and window, take the median of the eligible differences in each run, then average the three run medians with equal weights. A baseline or window that crosses the recording edge or contains a nonfinite sample excludes that trial for the affected channel and window. A result requires at least three complete trials in each of three runs. All six contributed in every run here. The 126 cues gave 33,768 eligible trial contrasts and 1,876 aggregate values, of which 1,708 are scalp values.

The first 61 channels measure electrical potential at the named scalp electrodes, with reference at the right mastoid. The study used acquisition filters. This build preserves the stored reference and applies no further filtering or eye-artifact subtraction. Eye and muscle activity can contribute to a scalp reading. Electrical fields spread through the head, so the site with the largest change cannot identify where a neural source lies. Changes during the rest cue remain visible. [Electrodes and acquisition methods](https://zenodo.org/records/834976/files/data%20set%20description.pdf)

Every scalp value shares one color scale. Its limits are −51.89295196533203 and +51.89295196533203 stored units. We took the 95th percentile of all 1,708 absolute scalp changes, linearly interpolating between adjacent sorted values at fractional rank 0.95 × (1,708 − 1), counting from zero. One value falls below the lower limit and 85 exceed the upper limit. The display can use those endpoint colors while the JSON keeps the original numbers. Direction means a rise or fall relative to that channel's baseline. Color measures signed change in scalp potential.

Three channels record eye potentials at 512 samples per second. Read them by channel number. The reference table calls 62 and 64 left and right, while the recording header reverses the labels. Three other channels record movement at 64 samples per second. Channel 93 is the elbow, 94 the forearm rotation sensor and 68 the index-near glove sensor. Each has its own stored scale. The GDF files set the physical and digital ranges equal and leave physical units unspecified. Keep the eye and movement values on their own sensor scales. Calibration to microvolts or degrees and assignment of anatomical directions would require additional evidence. The selected sensors give no force measurement. [Channel table](https://zenodo.org/records/834976/files/data%20set%20description.pdf) · [Source GDF files](https://doi.org/10.5281/zenodo.834976)

## Rebuild the aggregate

Use Python 3.9 or newer. These scripts use its standard library. Keep the original GDF files in a private directory. The optional fetch needs network access and about 271 MB of storage. With a verified cache the build is offline. Run these commands from this directory. Replace the example cache path with your own.

```sh
python ofner_source.py fetch /path/to/private-cache
python build_fields.py /path/to/private-cache rebuilt.json
```

The builder prints the SHA-256 of its product. The original edition of `cue-fields.json` has SHA-256 `ac4a1c76ef9cb83d8798e2314b926f6f8021dd22fc8bae33b8869232a6cc42ee`. The reader checks all three source files against the listed byte lengths, MD5 and SHA-256, and validates the GDF layout and channel scales. The build also checks the frozen protocol hash, cue counts and three-second cue-end markers. Multiple runs can be read concurrently with `--workers 2` or `--workers 3`; the output order stays fixed.

Cue positions in the file are one-based at 512 Hz. Subtract one to obtain the elapsed cue tick. For an interval endpoint at offset `d` ticks and a channel sampled at `r` Hz, the boundary index on that channel is `ceil((cue_tick + d) * r / 512)`. Apply the same rule to both ends. A complete quarter second contains 128 electrical readings or 16 movement readings. Each comes straight from its native recording grid. The gaps between the four windows have no displayed measurements.

`cue-fields.json` lists windows in time order and tasks in source event-code order. For each task and window, `eeg`, `eog` and `mechanics` are arrays ordered by the corresponding `channels` list. Matching `valid_trials` and `valid_runs` entries count eligible repeats and qualifying runs. The `availability` object counts every excluded contrast by reason. The 5,628 run-level cells in the denominator each had six complete repeats. This file supplies groupings by task within one person. Prediction of another trial or person would need a separate evaluation.

## Attribution

Patrick Ofner, Andreas Schwarz, Joana Pereira and Gernot R. Müller-Putz (2017) collected and released *Upper limb movements can be decoded from the time-domain of low-frequency EEG*, dataset version 1. The derived numeric summaries and source channel/event mapping retain Creative Commons Attribution 4.0 International. The changes in this edition are window selection, within-trial baseline subtraction and aggregation across repeated cues and runs. The accompanying Python implementation is supplied under CC0 1.0. [Dataset](https://doi.org/10.5281/zenodo.834976) · [Paper](https://doi.org/10.1371/journal.pone.0182578) · [Data licence](https://creativecommons.org/licenses/by/4.0/) · [Code dedication](https://creativecommons.org/publicdomain/zero/1.0/)
