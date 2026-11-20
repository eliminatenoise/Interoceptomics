# How closely do scalp and eye signals follow one another?

Keep one quarter-second of scalp readings. Compare them with eye-electrode readings taken at the same instant. Then substitute the eye readings from another repetition of the same instruction. The first comparison preserves everything the two electrodes picked up together. The second preserves the cue and its timing while breaking the original trial pairing.

Across seven people, the average of the two central scalp electrodes (C3 and C4) shared 17.9% of its within-window variation with eye channel 63 just after the cue. Using the next repetition gave 7.7%. Before the cue the figures were 18.6% and 7.7%. All seven people showed a stronger same-trial match in both windows. A match was already present when participants were waiting for the cue.

These percentages come from separate straight-line fits of scalp voltage on eye voltage within each 128-sample window. Both signals may respond to the cue, eye or muscle activity, movement or the reference behind the ear. Their relation alone cannot identify the source within the brain or assign a percentage to eye movement. The calculation uses both recordings from each window and has no out-of-sample forecasting claim.

## What each control changes

The six scalp sites form three pairs across the head. FC3/FC4 sit in front of C3/C4, and CP3/CP4 sit behind them. Choose one site, average the simultaneous readings of either side within a pair, or subtract C4 from C3. The dots mark which electrodes enter the calculation. A value for two electrodes belongs to the combination. Channel 63 is the middle eye channel. The outer channels exchange left/right header labels in three of the 21 runs, so 62 and 64 retain their acquisition numbers.

The original experiment recorded scalp and eye voltages at 512 Hz. The seven training participants (S1–S7) each completed three execution runs, each with six repetitions of seven visual instructions. All 882 task cues contribute. Within each person and run, pair the scalp trace with either the same trial’s eye trace or the next repetition of that same cue. The sixth repetition pairs with the first. Use the 128 samples immediately before the cue (ticks −128 through −1) or the 128 immediately after it (+1 through +128). Both windows exclude the cue tick. No spatial interpolation, filtering, rereferencing or measurement of movement enters these comparisons. [Study](https://doi.org/10.1371/journal.pone.0182578) · [Original recordings and codebook](https://doi.org/10.5281/zenodo.834976)

**Mean shared variation (r²).** In one trial, compute the zero-lag Pearson correlation between scalp and eye voltage over the 128 paired samples and square it. This gives the fraction of within-window scalp variance captured by an ordinary straight-line fit to the eye samples with an intercept. A rising or falling relation can give the same fraction. Average the fractions over eligible trials in each run, average three run results in each person, then give each person equal weight. The displayed percentage multiplies this mean by 100.

**Median correlation magnitude (|r|).** Take the magnitude of the correlation in each trial. Take the median within each run, then the median across three runs in each person, and finally the median across people. This gives a dimensionless number from 0 to 1. For C3/C4 and the middle eye channel after the cue, the values are 0.327 on the same trial and 0.195 on the next. Squaring one of these group medians would give a different statistic from the mean of squared trial correlations.

**People and usable pairs.** The 25th and 75th percentiles of the seven unlabelled person summaries show their spread. A mean can lie outside this middle half. A count reports how many people had a stronger, equal or weaker same-trial summary. Each person needs observations in all three runs. The people, runs, matched trial count and range of usable pairs per person accompany each result. Repeated measurements from seven training participants cannot establish the prevalence of a pattern in other people.

**Variable signals.** A constant trace has no defined correlation. The primary comparison requires three finite and varying traces (one scalp, two eye). No pair failed that rule in these recordings. The optional retrospective screen also checks both trials across all nine original channels. Each input from tick −128 through +128 must be finite, and pre-cue standard deviation must exceed 10⁻⁸ in the stored units and lie within 0.1–5 times its positive run/channel median, inclusive. Eighteen of 882 trials fell outside this screen. Requiring both members to pass leaves 846 pairs over 21 runs and seven people, with 112–126 per person. The screen uses all trials in a run and is descriptive.

## Reproduce the numbers

Use Python 3.12 or later. Download just the 21 original motor-execution GDF files named in the [file inventory](../agreement/source-files.json) to a local directory. From the extracted atlas or the repository’s `docs/scalp-and-arm` directory, run

```sh
python3 -B eyes/build.py /path/to/recordings --out rebuilt
```

The builder validates the identities and native layout of the named files, all cue occurrences and their markers, then writes the [cohort JSON](cohort.json) and its offline JavaScript copy. It uses the sibling agreement and measurements readers supplied in this package. Only the cohort summaries are written. The JSON contains all 120 combinations of 10 scalp signals, three eye columns, two windows and two quality rules. Each cell supplies both statistics for both pairings, the participants’ quartiles, counts of higher/tied/lower participant contrasts, complete-pair support and exclusions. Exclusion causes may overlap. No raw windows or participant profiles are distributed. [Prespecified method](protocol.json)

Patrick Ofner, Andreas Schwarz, Joana Pereira and Gernot R. Müller-Putz published the source recordings. This atlas adds the windowed scalp–eye comparisons and cohort summaries. Data and derived summaries carry CC BY 4.0. The original builder and reader code carry CC0. [Sources and licences](../NOTICE.txt)
