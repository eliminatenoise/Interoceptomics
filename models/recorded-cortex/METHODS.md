# Finger cues and electrical activity at the brain surface

A word appeared on a bedside screen. One participant moved the named finger at their own pace until the screen went blank. A grid on the left side of the brain recorded electrical activity throughout. The two contacts over the dorsal primary motor cortex showed a mean 5.67 dB drop in 12–20 Hz power during the cue and a 2.90 dB rise at 70–110 Hz, each relative to the following blank screen. That comparison uses 88 paired trials from the first 362 seconds of one recording. [Original experiment, Fig. 1 and Methods](https://doi.org/10.1371/journal.pcbi.1002655) · [Stanford data and contributor documentation](https://purl.stanford.edu/zk881ps0522)

## Where the contacts were

The clinical grid recorded electrical potential at the cortical surface, a measurement called electrocorticography (ECoG). In the deposited MATLAB file, column *k* of the recordings corresponds to row *k* of both the three-coordinate contact array and the anatomical area labels. The contributor’s plotting script draws those positions on the same participant’s reconstructed surface. The accompanying paper shows this particular grid in Figure 1A–C. Its positions were estimated from CT and the participant’s MRI. The exact participant-to-template transform, named template, exported coordinate axes and origin are unspecified in the task dictionary. An anatomical illustration can identify the general area. Positioning these contacts accurately on a different brain would require a verified registration. [Stanford data and scripts](https://purl.stanford.edu/zk881ps0522) · [Miller et al., Fig. 1 and localisation Methods](https://doi.org/10.1371/journal.pcbi.1002655) · [Hermes et al., localisation method and photographic validation](https://doi.org/10.1016/j.jneumeth.2009.10.005)

| Source code | Cortical area | Contacts | 12–20 Hz mean change (dB) | 70–110 Hz mean change (dB) |
|---|---|---:|---:|---:|
| 1 | Dorsal primary motor | 2 | −5.67 | +2.90 |
| 2 | Rolandic, around the central sulcus (subdivision unspecified) | 1 | −3.63 | +1.94 |
| 3 | Dorsal primary somatosensory | 4 | −4.46 | +2.32 |
| 4 | Ventral sensorimotor (motor and somatosensory combined) | 5 | −1.09 | +0.04 |
| 6 | Frontal, outside the rolandic region | 24 | −0.77 | +0.24 |
| 7 | Parietal, outside the rolandic region | 6 | −1.21 | +0.30 |
| 8 | Temporal | 0 | — | — |
| 9 | Occipital | 0 | — | — |
| 0 | Unassigned in the contributor’s codebooks | 4 | — | — |

The grid supplies 46 recorded contacts, of which 42 have an area name. The task README skips code 2. The accompanying processing script identifies it as *rolandic*. Four contacts carry code 0, which neither dictionary defines. The two areas with zero contacts have no regional measurement. Even the 24 frontal contacts sample only small patches within that broad label. The paper describes 10 mm spacing between neighbouring grid contacts and 2.3 mm exposed contact diameter. [Original acquisition and limits of spatial sampling](https://doi.org/10.1371/journal.pcbi.1002655) · [Original scripts and task README identified in the manifest](source-manifest.json)

## What a change in decibels measures

Each complete display-and-blank pair contributes two equal windows. We take the middle second of each phase on the nominal 1 kHz recording clock. One amplifier count corresponds to 0.0298 microvolts. For each sample we subtract the mean voltage across all 46 retained contacts, including the four with unassigned anatomy. The depositor reports that bad channels were removed before release. Each analysed source window passed finite-value and non-flatness checks at every contact. [Source archive, task README and processing script](https://purl.stanford.edu/zk881ps0522) · [Original common-average reference method](https://doi.org/10.1371/journal.pcbi.1002655)

For each contact and window we subtract its time mean, apply a periodic Hann taper and compute the one-sided power spectrum. We sum the density in µV²/Hz across the 1 Hz bins centred on 12 through 20 Hz, or 70 through 110 Hz, inclusive. This gives band power in µV². The bands avoid the local 60 Hz mains frequency and its 120 Hz harmonic. A positive value means the selected band carried more power during the displayed cue. A 3 dB rise is about twice the power. The higher band is a fixed frequency range. The original paper estimated a separate broadband component using principal components of the spectrum. [Original spectral and broadband methods](https://doi.org/10.1371/journal.pcbi.1002655)

We take 10 × log₁₀(cue power / following blank power) for each contact in each pair, average these decibel values across contacts within each area, then average across trials. This compares each sampled site with itself. Each contact in a region and each trial in the selected condition carry equal weight. The pooled estimate gives each observed trial one vote. The digits have different counts: 18 thumb, 19 index, 22 middle, 16 ring and 13 little-finger trials. The between-trial interval gives the 25th and 75th percentiles of the paired regional values. It describes the middle half of the observed changes in this recording. Inference about people would require independent participants.

“Cue” names the word on the screen. “Blank” names the following screen interval. The participant chose when to make each movement. A movement can lag the word or continue into the blank. The source glove records flexion in sensor counts at a nominal 25 Hz. This summary uses only the displayed cue and ECoG, so neither individual movement onsets nor the timing of reafferent sensation can be inferred here. Both peaks and dips can depend on reference choice, clinical coverage and other sources of variation. A band-power contrast cannot tell which neurons fired or whether the activity caused the movement. [Task and timing measurements](https://doi.org/10.1371/journal.pcbi.1002655)

## Reproduce the values

Use Python 3.11 or later with NumPy and SciPy. Obtain the original development participant member identified in the manifest from the Stanford deposit and run the following command in this directory. Only rows 0 through 361999 enter the calculation. MATLAB loading can decompress the full stored variable. The public result was calculated from a checksum-verified copy restricted to the development prefix. Other participants and the later validation and test intervals contributed no values. [Exact source identities and file hashes](source-manifest.json) · [Fixed analysis specification](analysis-plan.json)

```sh
python derive.py bp_fingerflex.mat regional-activity.json --contact-means contact-means.json
```

The regional table supplies the mean and middle half of trial differences. The contact table retains only the original one-based channel number, the source area code and a mean per cue and band across 13–88 trials, rounded to 0.01 dB. A contact number can be matched to its own source geometry using the member identity. These files contain no raw voltage, finger traces, trial observations, coordinates, cortical shape or participant demographics.

## Methods ethics statement

Ethics statement: All patients participated in a purely voluntary manner, after providing informed written consent, under experimental protocols approved by the Institutional Review Board of the University of Washington (#12193). All patient data was anonymized according to IRB protocol, in accordance with HIPAA mandate. These data originally appeared in the manuscript “Human Motor Cortical Activity Is Selectively Phase- Entrained on Underlying Rhythms” published in PLoS Computational Biology in 2012 [Reference].

[Reference] Miller KJ, Hermes D, Honey CJ, Hebb AO, Ramsey NF, Knight RT, Ojemann JG and Fetz EE (2012). Human Motor Cortical Activity Is Selectively Phase-Entrained on Underlying Rhythms. *PLoS Computational Biology* 8(9), e1002655. [Original article](https://doi.org/10.1371/journal.pcbi.1002655)

## Attribution and reuse

Kai Joshua Miller deposited the recordings and source analyses in the Stanford Digital Repository. The displayed summaries adapt those data by restricting time, applying a common-average reference, computing paired band power and averaging within trials, sites and cue conditions as described above. The adapted data and these accompanying materials are available under CC BY-SA 4.0. Credit the original source, indicate subsequent changes and preserve the share-alike licence on adapted material. Stanford also requires respect for the privacy and confidentiality of the participants. The depositor requires the ethics paragraph above, unchanged, in the Methods of publications that use these data. [Stanford rights record](https://purl.stanford.edu/zk881ps0522.json) · [Library descriptor](https://doi.org/10.1038/s41562-019-0678-3) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
