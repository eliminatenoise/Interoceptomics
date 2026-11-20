# When the word disappears, the hand can keep moving

The participant saw the name of a finger and moved it at their own pace. Two seconds later the screen went blank. Across 88 trials, the index-finger glove sensor changed by an average of 2.309 counts per step in the first half-second of the cue and 36.759 counts per step in the first half-second of the following blank. Both values include all five cue types. A blank screen is a good marker of the instruction ending. It makes a poor assumption about when a hand comes to rest. [Original experiment and acquisition](https://doi.org/10.1371/journal.pcbi.1002655) · [Windowed results](time-course.json)

## Read a window

Choose a digit to group trials by the word on the screen. The five glove values still refer to the five *measured* fingers, in thumb, index, middle, ring and little order. Choose **all** to give each of the 88 trials one vote. The digit groups have 18, 19, 22, 16 and 13 trials respectively. The same trials contribute to every window. All values describe one person in the first 362 seconds of one recording. [Source and file identities](source-manifest.json)

The first window covers 0 to 500 ms after the recorded cue transition. Its paired blank window covers 0 to 500 ms after the *following blank transition*. Advance one window and each start moves forward by 200 ms. Neighbours share 300 of their 500 ms. Each display summarises repeated trials. A moving sequence of those summaries cannot recover the path of a single hand, the onset of a movement or the delay between two brain events. [Fixed analysis plan](analysis-plan.json)

## Electrical measurements

Electrodes at 46 sites on the left cortical surface measured electrical potential at 1,000 samples per second. For each window we convert amplifier counts to microvolts using 0.0298 µV per count and remove the instantaneous mean across all 46 contacts. We remove the time mean separately for each contact, apply a periodic Hann taper over 500 samples and calculate a one-sided periodogram. Bin centres are 2 Hz apart. Summing density times 2 Hz from 12 through 20 Hz or 70 through 110 Hz, inclusive, gives band power in µV². The higher range measures power in that fixed band. The original authors separated a broadband component by a different method. [Task dictionary and contributor scripts](https://purl.stanford.edu/zk881ps0522) · [Original spectral analysis](https://doi.org/10.1371/journal.pcbi.1002655)

For each trial, window and contact we divide cue power by the paired blank power, then take ten times the base-10 logarithm. A value of +3 dB means roughly twice as much power in that cue window. Averaging the decibel values within a condition gives each trial equal weight. For a regional value we also average across the unrounded contact means in that area. At the two dorsal primary motor contacts, pooled 12–20 Hz power was 6.82 dB higher during the 0–500 ms cue window than during its paired blank window. For 1,200–1,700 ms the same comparison was −7.19 dB. Each number compares two measured windows. The power contrast alone cannot identify the cause of either change. [Results by contact and region](time-course.json)

The source links recording column 1 to anatomical row 1, and so on through column 46. Of these contacts, 42 have an anatomical label. The contributor's processing script identifies code 2 as rolandic, around the central sulcus. Four unassigned contacts retain their individual measurements and contribute to the common reference. They have no regional estimate. The temporal and occipital regions have no contacts here. Even a named region is sampled only at the contact sites. The public table rounds power contrasts to 0.01 dB. [Original scripts and source identities](source-manifest.json)

## What the glove measures

The glove records one uncalibrated flexion reading per digit at a nominal 25 Hz. The release repeats each reading over 40 rows of the 1 kHz grid. We use the first row of every 40-row block, including new readings that happen to equal their predecessors. Every included half-second window contains 13 nominal observations and 12 successive 40 ms changes. Both endpoints of each change lie within the window. For each finger we average the absolute size of the 12 changes, then average across the trials. This reports movement in **glove sensor counts per nominal 40 ms step**. Flexion and extension both contribute to this measure. The public values have three decimal places. The source provides no calibration to joint angles or fingertip distance. [Source task dictionary](https://purl.stanford.edu/zk881ps0522) · [Acquisition description](https://www.bbci.de/competition/iv/desc_4.pdf)

The two devices share a nominal row index in the release. Miller and colleagues reported a 37 ms lag between glove and amplifier measurements, with a 3 ms standard error for that estimate. We kept the deposited row alignment. The study estimate gives neither per-trial timing nor a bound on an individual reading. Clock uncertainty, self-paced movement and the width and overlap of the windows limit interpretation of timing. The table does not estimate neural response latency, sensory feedback timing, a population effect or causation. [Original finger movement timing measurements](https://doi.org/10.1371/journal.pcbi.1002655)

## Reproduce the table

Use Python 3.11 or later, NumPy and SciPy. Extract the original `fingerflex/data/bp/bp_fingerflex.mat` from the FingerFlex archive identified in the manifest. The scripts check its SHA-256, read the required variables and analyse only rows 0 through 361999. The full compressed variables may need to be decompressed to read this prefix. Neither script fits a model. [Source manifest](source-manifest.json) · [Stanford deposit](https://purl.stanford.edu/zk881ps0522)

```sh
python derive.py bp_fingerflex.mat result.json
python verify.py bp_fingerflex.mat result.json
```

The inclusion rule requires the transition into the cue, the transition into the following blank and the transition ending that blank to be visible. All 88 complete pairs had 2,000 samples in each phase, and all 88 passed the requirement for complete support through 1,700 ms. Partial endpoint runs did not enter. Every selected electrical window had finite values and variation at all 46 contacts. Voltage and glove samples, trial-level results, individual event times and anatomy are absent from the table.

The JSON lists the seven `windows` in elapsed milliseconds, with the upper boundary excluded. Each `by_cue` entry contains the condition's pair count and seven windows in that same order. Within a window, `contact_db` follows the one-based column order in `contacts`, and `region_db` follows the code order in `regions`. Both fields have separate `beta` and `high` arrays. A missing regional measurement is `null`. The two `glove` arrays give movement during the cue and the paired blank separately. Each `glove_steps` count gives the number of successive within-window measurements contributing per digit in that phase, summed across the selected trials.

The independent check evaluates Fourier components directly at the selected frequencies in amplifier counts. The scale factors cancel when calculating each contact's cue-to-blank ratio. It also recounts consecutive glove samples from their global 25 Hz positions. It checks 3,864 contact values, 504 regional values, 420 glove values, 252 missing regional cells and 84 glove-step counts. All values agree within the rounding shown. This checks the numerical reconstruction within one recording. [Calculation](derive.py) · [Independent calculation](verify.py) · [File checksums](SHA256SUMS)

## Methods ethics statement

Ethics statement: All patients participated in a purely voluntary manner, after providing informed written consent, under experimental protocols approved by the Institutional Review Board of the University of Washington (#12193). All patient data was anonymized according to IRB protocol, in accordance with HIPAA mandate. These data originally appeared in the manuscript “Human Motor Cortical Activity Is Selectively Phase- Entrained on Underlying Rhythms” published in PLoS Computational Biology in 2012 [Reference].

[Reference] Miller KJ, Hermes D, Honey CJ, Hebb AO, Ramsey NF, Knight RT, Ojemann JG and Fetz EE (2012). Human Motor Cortical Activity Is Selectively Phase-Entrained on Underlying Rhythms. *PLoS Computational Biology* 8(9), e1002655. [Original publication](https://doi.org/10.1371/journal.pcbi.1002655)

## Credit and reuse

Kai Joshua Miller deposited *A library of human electrocorticographic data and analyses* in the Stanford Digital Repository. These tables adapt the FingerFlex data by restricting the recording interval, selecting paired windows and averaging cortical band-power ratios and glove movements by condition. The adapted data carry CC BY-SA 4.0. Credit the source, identify changes and preserve that licence for adaptations. Respect participants' privacy and confidentiality. The depositor requires the complete ethics paragraph above, unchanged, in the Methods of publications using these data. The project's own scripts carry its CC0 dedication. [Stanford record and rights](https://purl.stanford.edu/zk881ps0522.json) · [Library publication](https://doi.org/10.1038/s41562-019-0678-3) · [Data licence](licenses/CC-BY-SA-4.0.txt) · [Code dedication](licenses/CC0-1.0.txt)
