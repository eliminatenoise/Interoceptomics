# Chest-vibration forecast, version 2: the results, explained step by step

Simple edition of the results. The [Technical edition](README.md) gives the same results more briefly. The plan behind them is in [PROTOCOL.md](PROTOCOL.md) (Technical) and [PROTOCOL-SIMPLE.md](PROTOCOL-SIMPLE.md) (explained step by step); the machine-readable plan, [PROTOCOL.json](PROTOCOL.json), governs wherever texts differ. Every number on this page comes from [results.json](results.json) and the other files listed at the end. The data credit is in [NOTICE.md](NOTICE.md).

## What this page reports

A small sensor on the chest picks up a slight vibration with every heartbeat. Version 2 is a forecasting model: it predicts what that sensor will read 80 milliseconds (ms) after the moment of the forecast. It uses only earlier readings from the same person: the chest sensor itself, a breathing band around the chest, and the heart's electrical signal (ECG) picked up by skin electrodes.

The model learned from ten volunteers of a public database. It was then tested once on seven other volunteers of the same database. This page reports that one test: every result the plan fixed in advance, whether it favours version 2 or not.

The outcome is given in the next section, in sentences the plan fixed before the test. The main numbers: on average over the seven test people, version 2's forecast error was 1.156 millivolts (mV), against 2.375 mV for the first version's model refitted on the same ten volunteers and 2.376 mV for simply giving each person's usual reading.

## The results in the sentences the plan fixed in advance

Before any test data were opened, the plan wrote down the sentences this Simple edition would use for the outcome. There was one sentence for "supported" and one for "not supported" for each question, with blanks for the numbers. The rule chose which sentence appears, and the numbers were filled in. The plan allows no other wording about the outcome; the rest of this page explains the numbers and adds no further verdict.

Version 2 learned from ten volunteers and was tested once on seven others whose recordings were downloaded only after the plan and the finished models were published.

Each forecast uses only readings taken up to the moment of the forecast.

The vibration sensor and the breathing band give voltages in millivolts. They do not measure chest movement in physical units, signals in sensory nerves, or anything a person felt. All recordings come from one laboratory, with people lying still after listening to music.

We compared it with simple rules: each person's usual reading, the last reading, the recent trend, and each person's own average heartbeat shape timed by the heart's electrical signal.

Its error was lower than that of the first version's model, refitted on the same ten volunteers, for 7 of 7 people, by 50.8% on average (range 45.6% to 57.2%).

Heartbeat timing from the skin electrodes lowered the error for 7 of 7 people compared with the same model without it, and for 7 of 7 compared with timing taken from 5 seconds earlier.

It also did better than each person's own average heartbeat shape for 7 of 7 people, by 40.3% on average.

## Contents

1. [Words used on this page](#1-words-used-on-this-page)
2. [The three signals](#2-the-three-signals)
3. [How version 2 makes a forecast](#3-how-version-2-makes-a-forecast)
4. [Every forecaster in the comparison](#4-every-forecaster-in-the-comparison)
5. [What happened, in order](#5-what-happened-in-order)
6. [The three questions and how they were answered](#6-the-three-questions-and-how-they-were-answered)
7. [Results for each test person](#7-results-for-each-test-person)
8. [Every forecaster on the seven test people](#8-every-forecaster-on-the-seven-test-people)
9. [Every comparison fixed in advance](#9-every-comparison-fixed-in-advance)
10. [What else the numbers show](#10-what-else-the-numbers-show)
11. [The stretch from 90 to 120 seconds](#11-the-stretch-from-90-to-120-seconds)
12. [People 1 to 3, the ten together, and the resting recording](#12-people-1-to-3-the-ten-together-and-the-resting-recording)
13. [What the learning people showed (optimistic)](#13-what-the-learning-people-showed-optimistic)
14. [The data, who provided it, and what was opened when](#14-the-data-who-provided-it-and-what-was-opened-when)
15. [Data checks and the test for peeking at the future](#15-data-checks-and-the-test-for-peeking-at-the-future)
16. [Changes from the plan](#16-changes-from-the-plan)
17. [What these results cannot show](#17-what-these-results-cannot-show)
18. [Measured, derived, predicted and simulated values](#18-measured-derived-predicted-and-simulated-values)
19. [How to rerun the test](#19-how-to-rerun-the-test)
20. [Files in this folder](#20-files-in-this-folder)
21. [Every forecaster on every recording, and every 40 ms step](#21-every-forecaster-on-every-recording-and-every-40-ms-step)

## 1. Words used on this page

- **Reading.** One value on a regular grid of 250 values per second, one every 4 ms, made from the recording's 5,000 samples per second.
- **Cutoff.** The moment at which a forecast is made. Only readings up to the cutoff may enter anything used for that forecast. Forecasts were made at every reading from 90 up to 290 seconds into each five-minute after-music recording: 50,000 cutoffs per person. The resting recording b001 is shorter; its cutoffs run from 90 up to 270 seconds, 45,000 in all (section 12).
- **Target.** The chest-sensor reading 80 ms after the cutoff, the value being forecast. Because of the smoothing filter (section 2), it is built from raw samples taken 40 to 80 ms after the cutoff.
- **Millivolt (mV).** A thousandth of a volt. All errors on this page are in the chest sensor's own millivolts.
- **Standard deviation (SD).** A measure of spread: roughly the typical distance of values from their average.
- **Calibration stretch and cal SD.** Seconds 60 to 80 of each recording. Each person's average and SD there set the scale for that person. The **cal SD** is the SD of that person's chest-sensor readings there, in mV. An error divided by the cal SD can be compared between people with large and small signals: an error of 1 cal SD is as large as the signal's usual spread, and an error of 0.5 cal SD is half of it.
- **RMSE (root mean squared error).** The main error measure. For every cutoff, take the difference between forecast and measured value and square it; average the squares over the person's cutoffs; take the square root. Large misses count more than small ones.
- **MAE (mean absolute error).** The average size of the misses, ignoring their sign.
- **Relative reduction.** For one person, 100 × (the comparison's error − version 2's error) / the comparison's error, in percent. A positive value means version 2's error was lower. For example, in section 7, p014's error was 1.087 mV for version 2 and 2.110 mV for the first version refitted, so the reduction is 100 × (2.110 − 1.087) / 2.110 = 48.5%.
- **Win.** A person whose relative reduction is above zero. A tie is not a win.
- **Skill.** For one recording, 1 minus a forecaster's error divided by the error of the usual level C0. 100 × skill is that forecaster's relative reduction against C0, in percent.
- **Bootstrap interval.** A way to show how much an average over seven people could move with a different set of people. The computer draws seven people at random from the seven, with repeats allowed, computes the average for that draw, and does this 10,000 times with a fixed starting number (seed 20261127). The interval reported is the middle 95% of those 10,000 averages. "Paired" means each draw keeps every person's results together across all comparisons. With only seven people the interval is rough.
- **R wave and P wave.** The R wave is the tall spike of each heartbeat in the ECG. The P wave is a small wave about 130 to 160 ms before it, produced as the heart's upper chambers start each beat.
- **Recording file, header file and WFDB.** Each recording is stored in WFDB format (the waveform-database format used by PhysioNet) as two files: a recording file (`.dat`) with the stored numbers, and a header file (`.hea`), a short text file that describes the recording: its name, number of signals, samples per second, length, the scale factors (gains) that turn stored numbers into millivolts, and one checksum per signal.
- **Checksum.** A number computed from all the stored values of one signal: their sum, wrapped around within the range of 65,536 values. The header file records it, so recomputing it shows whether the stored values are complete and unchanged.
- **Fingerprint (SHA-256).** A 64-character code computed from a file's exact bytes. Any change to the file gives a different code, so a published fingerprint fixes exactly which bytes are meant. Fingerprints on this page are shortened to their first 8 characters followed by "…"; the full codes are in the files.
- **Commit.** One saved version of the project's files on GitHub, the public site that keeps every version with its date. Each commit has an identifier such as `1dd00a4`.
- **Separate reviewer, lead and owner.** A separate reviewer checks work without having written it. The lead is the maintainer who commits files and puts them on GitHub. The owner directs the project.

People, not cutoffs, are what count. Forecasts made 4 ms apart overlap and depend on each other, so the 50,000 cutoffs of one person describe that person's error and are never treated as 50,000 separate tests. Every average on this page counts each person once.

In the tables, −0.0% marks a value below zero that rounds to 0.0%.

## 2. The three signals

The volunteers lay still on their backs while four signals were recorded 5,000 times a second.

- **Chest vibration (SCG, for seismocardiogram).** One axis of an accelerometer on the chest. Each heartbeat shakes the chest slightly, and the sensor turns that into a voltage. This is the signal being forecast.
- **Breathing band (RESP).** A band around the chest whose electrical resistance changes as the chest expands and contracts. It also gives a voltage.
- **ECG lead II.** The voltage between two skin electrodes, which follows the heart's electrical activity. The study uses it only to time heartbeats and to describe their shape. A second ECG channel, lead I, is in the files but is not used.

All three are used as voltages. The chest sensor's voltage is not converted into acceleration, and the breathing band's voltage is not converted into chest movement or lung volume. Such conversions would need a further calibration that this study does not apply.

Before use, each signal is smoothed by a filter that removes changes faster than about 65 cycles per second. The filter looks only backwards: each filtered value uses that moment and the 200 samples before it. Every 20th filtered sample is kept, which gives the grid of 250 readings per second. Because of the filter, each reading reflects the signal on average about 20 ms earlier; this delay is left in place.

## 3. How version 2 makes a forecast

Each heartbeat makes a similar vibration pattern on a person's chest. If you know when the next beat will start, you can replay that person's usual beat pattern from that moment. Version 2 works in four steps.

1. **Find each R wave.** A detector watches the ECG and marks each R wave, using only readings that have already arrived. A beat can be used 28 ms after the detector triggers on it.
2. **Average the person's own beat pattern.** The model lines up the person's chest readings on their recent beats and averages them. This average is the beat template. Version 2 averages over the last 33 beats (the setting K = 32 counts the earlier beats; the latest beat is added to them).
3. **Watch for the next P wave.** The hardest part of the forecast is the moment the next beat begins, because the heart does not keep perfect time. The P wave warns of the next R wave about 130 to 160 ms ahead. The model compares the newest ECG readings with the person's usual P wave shape. When the match reaches a correlation of 0.9 (the setting theta = 0.9; a correlation of 1 is a perfect match), it expects the next R wave at the usual distance after that P wave. The template's value at the target's position relative to that expected R wave is the **template forecast**. Without an accepted P wave, the model continues the template from the last R wave.
4. **Combine.** A ridge model, a linear formula that gives each input a weight and adds them up, combines the template forecast with 12 other beat-timing values, 4 values from a template timed by the chest signal alone, and the last 51 chest and 51 breathing readings: 119 inputs in all. A small penalty (0.001) keeps the weights small. The forecast is made in the person's own scale (their calibration average and SD) and turned back into mV.

An invented example shows the timing in step 3. Suppose a P wave's peak was seen 48 ms ago (the comparison needs 48 ms of readings after the peak), and in this person the R wave follows the P peak by about 144 ms. The next R wave is then expected about 96 ms from now. The target lies 80 ms from now, which is 16 ms before that R wave, so the template forecast is the template's value 16 ms before an R wave. The numbers in this example are invented to show the method.

**How the settings were chosen.** All choices were made with the ten learning people only, by "leave one person out": fit on nine, score the tenth, and repeat for each of the ten. Of the 27 combinations tried (K 8, 16 or 32; theta 0.7, 0.8 or 0.9; penalty 0.001, 0.02 or 0.1), K 32, theta 0.9 and penalty 0.001 gave the lowest average error, 1.3886 mV. The plan's default (K 16, theta 0.8, penalty 0.02) gave 1.4189 mV, 2.18% higher. The plan kept the default only if it was within 1% of the lowest, so the lowest was chosen. A small neural network (a multilayer perceptron, MLP, which can also represent curved relationships) scored 1.4051 mV with the same inputs. The plan chose the MLP only if it scored below 0.99 × 1.3886 = 1.3748 mV, so the ridge model became version 2. Its official name in the files is **R-ECG**.

## 4. Every forecaster in the comparison

Each forecaster is called an arm in the files. All arms are scored on exactly the same cutoffs of every recording.

| Arm | What it does |
| --- | --- |
| C0 | Always gives the person's usual level: the chest sensor's average over the calibration stretch. |
| C1 | Repeats the last reading (persistence). |
| C2 | Extends the trend of the last 13 readings (48 ms) for 80 ms. |
| C3 | The person's own average heartbeat shape, timed by R waves from a separately built detector, with no P wave. No learned weights. |
| C3d | C3 timed by the ECG from 5.012 seconds earlier, out of step with the present heartbeat. |
| C5 | The heartbeat shape timed by beats found in the chest signal itself, with no ECG. |
| T-ECG | Version 2's template forecast on its own (step 3 above), with no learned weights. |
| T-delayed | T-ECG computed from the ECG of 5.012 seconds earlier. |
| T-R | Version 2's template continued from the last R wave, without the P wave (descriptive). |
| V1F base, with ECG, with delayed ECG | The first version exactly as published (`weights.json`, fingerprint `55a78c3d…`). |
| V1R base, with ECG, with delayed ECG | The first version's inputs and ridge formula (penalty 0.02), refitted on the same ten learning people. V1R base is the comparison for the first question. |
| C4 | A ridge model on 1.2 seconds of chest and breathing readings. |
| R-chest | Version 2's ridge model without any ECG input: its **chest twin**. |
| **R-ECG** | **Version 2.** |
| R-delayed | Version 2's ridge model given the ECG from 5.012 seconds earlier: its **delayed twin**. |
| M-chest, M-ECG, M-delayed | The MLP (two hidden layers of 64 units) on the same three input sets, each the average of three models trained from different starting numbers (seeds 20261127, 20261128 and 20261129). |

The two twins use version 2's settings (K 32 and penalty 0.001; theta 0.9 for the delayed twin). T-ECG, T-delayed, T-R and C5 use K 32 and theta 0.9. C4 kept its default penalty 0.02, which was within 1% of its best (2.8357 against 2.8313 mV for penalty 1). The NeuroTranslate movement model accepts no ECG, chest-vibration or breathing input, so it could not take part. No learned front end shared across tasks is claimed, so the usual control with a randomly initialised front end does not apply. The full definitions of every forecaster are in the plan, sections 7 to 12 of [PROTOCOL.md](PROTOCOL.md), explained step by step in [PROTOCOL-SIMPLE.md](PROTOCOL-SIMPLE.md).

## 5. What happened, in order

All times are UTC (Coordinated Universal Time) on 27 November 2026. The order matters: the plan and the finished models were public before any test file was downloaded, and the forecasts were locked before any error was computed.

| Step | Time | Kept in |
| --- | --- | --- |
| The plan (commit `b0ffe4d`) was admitted by a separate reviewer and published on GitHub together with three later commits (`c64e6e7`, `0c93c5a` and `2b0c9a1`), which add and then edit only the plan's Simple edition. | on GitHub at 10:54:02 | `PROTOCOL.json`, `PROTOCOL.md` |
| The finished models were frozen (commit `1dd00a4`), admitted by a separate reviewer, and published. | on GitHub at 12:23:21 | `FREEZE.json` (`13ff5a16…`) |
| Check that GitHub showed the freeze commit, with the plan commit before it. | 12:27:56 | `source-verification.json` |
| Download of the file list and 16 recording and header files (p014 to p020 and p001). | 12:27:56 to 12:30:51 | `source-verification.json` |
| Data checks, with the report sealed (its fingerprint recorded) before any forecast. | 12:31:15 | `qc-report.json` (`21231aaf…`) |
| Test for peeking at the future, reading no target. | 12:31:34 to 12:37:29 | `causality-scored.json` |
| Forecasts of every arm, kept private. | 12:37:45 to 12:38:19 | fingerprints in `SCORE-LOCK.json` |
| Lock file written and committed (`78e18dc`). | 12:38:34 and 12:38:44 | `SCORE-LOCK.json` (`72a039ba…`) |
| The one scoring run, in a separate program. | 12:38:54 | `results.json` (`b4e2774c…`) |
| Results committed (`c6b600c`). | 12:40:01 | `RUN-RECORD.json` |
| The database's beat marks for p014 to p020 downloaded for a check of the detector, committed in `7a54129`. | 12:40:18 to 12:40:50 | `detector-check-atr.json` |

The reviewer admitted the freeze when it was in an earlier commit. Before publication that commit was placed after the plan's Simple edition, which gave it the new identifier `1dd00a4` without changing any of its files or the fingerprint of `FREEZE.json`. The publication times are those of GitHub's activity record.

**How the files hold each other in place.** `results.json` records the fingerprints of the plan files, of `FREEZE.json`, of the lock file and of the data-check report. The lock file records the fingerprints of the 23 forecast files (two per recording, plus an empty list of recordings without forecasts), the data-check report, `FREEZE.json`, the 12 scoring programs and the 16 weight files. The scoring program checked every fingerprint in the lock file before it read any measured target. The 44 frozen files (43 listed in `FREEZE.json`, plus `FREEZE.json` itself) matched their fingerprints before the download and again after scoring.

**Independent check of the results (step 7 of the plan).** A separate reviewer reran the frozen data checks, forecasts and scoring and got byte-identical files: the same data-check report, the same 23 forecast files and the same `results.json`. The reviewer also wrote separate programs from the plan's text alone, without using any of the frozen programs. With them, the data-check values and the lists of valid cutoffs were identical, all 7,947 numbers compared in `results.json` agreed to within 10⁻¹² (a millionth of a millionth), and the reviewer's own forecasts from the simple rules C0, C1 and C2 and from the first version's models agreed with the locked forecasts to within 4.3 × 10⁻¹⁴ mV. The reviewer's own test for peeking at the future, at 242 cutoffs chosen separately (22 per recording, including the moments when a new beat or a P wave became available), found no change. The reviewer found no serious problem. Its minor points concern changes 3 to 5 in section 16 and three facts, all reported on this page: T-ECG scored about the same as version 2 (section 10.1), the delayed twin scored the same as the chest twin, and the chest-only beat detector counts extra beats in some recordings (both in section 10.3).

## 6. The three questions and how they were answered

The plan fixed three questions in advance. Each question is a claim that the test finds "supported" or "not supported":

- **P1, improvement on the first version.** Version 2's error is lower than that of the first version refitted on the same ten people (V1R base), by at least 10% on average, and version 2 also beats each person's usual level (C0).
- **P2, value of ECG timing.** Version 2 beats both its chest twin (no ECG) and its delayed twin (ECG from 5.012 seconds earlier, which carries as much ECG information but out of step with the present heartbeat).
- **P3, comparison with a simple heartbeat rule.** Version 2 beats each person's own average heartbeat shape timed by R waves (C3).

**The rule.** First the data checks decide how many test people count (n). All seven passed, so n = 7. A comparison then needs at least 80% of n as wins, rounded up: 6 of 7. "Version 2 beats X" holds when all three of these hold:

1. the average relative reduction against X is above 0;
2. at least 6 of the 7 people are wins;
3. the lower end of the bootstrap 95% interval of the average reduction is above 0.

For P1 the reduction against V1R base must also be at least 10% on average. The condition against C0 needs only an average above 0 and 6 wins; its interval is shown, but it is not part of that condition.

| Question | Comparison | Average error reduction [95% interval] | People with lower error | What the rule needs | Outcome |
| --- | --- | ---: | ---: | --- | --- |
| P1 | Version 2 against the first version refitted (P1) | 50.8% [47.3, 54.7] | 7 of 7 | mean ≥ 10%, ≥ 6 wins, lower bound > 0 | supported |
| P1 | Version 2 against the usual level C0 (P1) | 50.8% [47.3, 55.0] | 7 of 7 | mean > 0, ≥ 6 wins | supported |
| P2 | Version 2 against its twin without ECG (P2) | 46.9% [42.5, 51.4] | 7 of 7 | mean > 0, ≥ 6 wins, lower bound > 0 | supported |
| P2 | Version 2 against its twin with ECG from 5.012 s earlier (P2) | 46.9% [42.5, 51.4] | 7 of 7 | mean > 0, ≥ 6 wins, lower bound > 0 | supported |
| P3 | Version 2 against C3, the R-timed heartbeat shape (P3) | 40.3% [34.0, 46.2] | 7 of 7 | mean > 0, ≥ 6 wins, lower bound > 0 | supported |

- **P1: supported.** Against the first version refitted, the average reduction was 50.8%, its interval ran from 47.3% to 54.7%, and all 7 people were wins. Against the usual level C0, the average reduction was 50.8% with 7 wins.
- **P2: supported.** Against both twins the average reduction was 46.9%, with 7 wins each. The two comparisons give almost the same numbers, because the delayed twin scored like the chest twin (section 10.3), so they are close to a single test.
- **P3: supported.** Against C3 the average reduction was 40.3%, its interval ran from 34.0% to 46.2%, and all 7 people were wins.

These answers are about these seven people under the rule fixed in advance. They do not claim statistical significance (a formal test of whether a difference could be due to chance) and they say nothing about people in general.

## 7. Results for each test person

Each person's error over their 50,000 cutoffs, in mV. The second column is the spread of that person's chest signal (cal SD), and the fourth column is version 2's error divided by it. The last column is version 2's relative reduction against the first version refitted.

| Person | Spread of the chest signal, cal SD (mV) | Version 2 error (mV) | Version 2 error in cal SD | First version refitted (mV) | Usual level C0 (mV) | C3 (mV) | Twin without ECG (mV) | Twin with delayed ECG (mV) | Reduction against the first version |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| p014 | 2.107 | 1.087 | 0.516 | 2.110 | 2.071 | 1.794 | 1.870 | 1.870 | 48.5% |
| p015 | 2.856 | 1.204 | 0.421 | 2.748 | 2.759 | 2.437 | 2.663 | 2.662 | 56.2% |
| p016 | 2.900 | 1.254 | 0.432 | 2.931 | 2.890 | 2.548 | 2.762 | 2.762 | 57.2% |
| p017 | 2.644 | 1.445 | 0.546 | 2.685 | 2.644 | 2.204 | 2.350 | 2.349 | 46.2% |
| p018 | 1.931 | 1.041 | 0.539 | 1.926 | 1.974 | 1.664 | 1.877 | 1.878 | 46.0% |
| p019 | 2.377 | 1.013 | 0.426 | 2.294 | 2.362 | 1.793 | 2.067 | 2.067 | 55.8% |
| p020 | 1.822 | 1.052 | 0.577 | 1.932 | 1.929 | 1.417 | 1.848 | 1.848 | 45.6% |
| Mean of 7 | – | 1.156 | 0.494 | 2.375 | 2.376 | 1.980 | 2.205 | 2.205 | 50.8% |

**How to read a row.** For p014, the chest signal's spread was 2.107 mV. Version 2's error was 1.087 mV, which is 0.516 of that spread. The first version refitted had an error of 2.110 mV, so version 2's error was 48.5% lower. The usual level C0 had 2.071 mV, C3 had 1.794 mV, and both twins had 1.870 mV.

Across the seven people, version 2's error was between 0.421 and 0.577 cal SD: roughly half of each person's usual spread. The usual level C0 and the first version refitted were close to 1 cal SD.

Each person's reduction in the five comparisons that decide the verdicts:

| Person | Against the first version refitted | Against the usual level C0 | Against the twin without ECG | Against the twin with delayed ECG | Against C3 |
| --- | ---: | ---: | ---: | ---: | ---: |
| p014 | 48.5% | 47.5% | 41.9% | 41.9% | 39.4% |
| p015 | 56.2% | 56.4% | 54.8% | 54.8% | 50.6% |
| p016 | 57.2% | 56.6% | 54.6% | 54.6% | 50.8% |
| p017 | 46.2% | 45.4% | 38.5% | 38.5% | 34.5% |
| p018 | 46.0% | 47.3% | 44.6% | 44.6% | 37.5% |
| p019 | 55.8% | 57.1% | 51.0% | 51.0% | 43.5% |
| p020 | 45.6% | 45.5% | 43.1% | 43.1% | 25.8% |

## 8. Every forecaster on the seven test people

For each forecaster: the average error over the seven people, the 95% bootstrap interval of that average, the median (the middle person), the smallest and largest person's error, the average error in cal SD, the average size of a miss (MAE), the average reduction against the usual level C0, and how many of the seven people it beat C0 for.

| Forecaster | Average error (mV) | 95% interval | Median | Smallest–largest | Average error in cal SD | Average size of miss, MAE (mV) | Average reduction against C0 | People better than C0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 2.376 | [2.106, 2.647] | 2.362 | 1.929–2.890 | 1.003 | 1.568 | 0.0% | – |
| C1, repeat the last reading (persistence) | 3.478 | [3.071, 3.852] | 3.656 | 2.649–4.098 | 1.473 | 2.460 | −46.8% | 0 of 7 |
| C2, extend the recent trend | 9.488 | [8.312, 10.886] | 8.595 | 7.917–12.910 | 4.011 | 6.392 | −299.6% | 0 of 7 |
| C3, own average heartbeat shape timed by R waves | 1.980 | [1.703, 2.267] | 1.794 | 1.417–2.548 | 0.830 | 1.090 | 17.1% | 7 of 7 |
| C3d, C3 timed by the ECG from 5.012 s earlier | 2.395 | [2.123, 2.670] | 2.382 | 1.949–2.918 | 1.011 | 1.593 | −0.8% | 0 of 7 |
| C5, heartbeat shape timed by the chest sensor | 2.212 | [1.967, 2.485] | 2.087 | 1.848–2.763 | 0.934 | 1.336 | 6.9% | 7 of 7 |
| T-ECG, heartbeat shape timed by R and P waves | 1.157 | [1.064, 1.270] | 1.090 | 1.016–1.442 | 0.495 | 0.789 | 50.8% | 7 of 7 |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 2.413 | [2.139, 2.689] | 2.397 | 1.961–2.933 | 1.019 | 1.612 | −1.6% | 0 of 7 |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 2.032 | [1.748, 2.340] | 1.802 | 1.534–2.631 | 0.853 | 1.143 | 14.9% | 7 of 7 |
| V1F base, first version as published | 2.388 | [2.107, 2.682] | 2.277 | 1.911–2.984 | 1.007 | 1.581 | −0.4% | 2 of 7 |
| V1F with ECG, as published | 2.479 | [2.149, 2.791] | 2.430 | 1.749–3.022 | 1.042 | 1.660 | −4.1% | 1 of 7 |
| V1F with delayed ECG, as published | 2.389 | [2.108, 2.684] | 2.279 | 1.912–2.984 | 1.007 | 1.585 | −0.5% | 2 of 7 |
| V1R base, first version refitted | 2.375 | [2.098, 2.661] | 2.294 | 1.926–2.931 | 1.002 | 1.572 | 0.1% | 3 of 7 |
| V1R with ECG, refitted | 2.443 | [2.145, 2.738] | 2.466 | 1.872–2.938 | 1.029 | 1.634 | −2.7% | 1 of 7 |
| V1R with delayed ECG, refitted | 2.376 | [2.098, 2.662] | 2.295 | 1.926–2.932 | 1.002 | 1.572 | 0.1% | 3 of 7 |
| C4, ridge on 1.2 s of readings | 2.340 | [2.081, 2.620] | 2.259 | 1.910–2.909 | 0.988 | 1.540 | 1.5% | 5 of 7 |
| R-chest, v2 without ECG (chest twin) | 2.205 | [1.957, 2.480] | 2.067 | 1.848–2.762 | 0.931 | 1.336 | 7.2% | 7 of 7 |
| **R-ECG, version 2** | 1.156 | [1.061, 1.271] | 1.087 | 1.013–1.445 | 0.494 | 0.790 | 50.8% | 7 of 7 |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 2.205 | [1.957, 2.480] | 2.067 | 1.848–2.762 | 0.931 | 1.336 | 7.2% | 7 of 7 |
| M-chest, MLP without ECG | 2.256 | [2.021, 2.509] | 2.111 | 1.867–2.731 | 0.956 | 1.441 | 4.8% | 6 of 7 |
| M-ECG, MLP with ECG | 1.174 | [1.076, 1.301] | 1.078 | 1.035–1.499 | 0.501 | 0.814 | 50.1% | 7 of 7 |
| M-delayed, MLP with delayed ECG | 2.263 | [2.023, 2.514] | 2.168 | 1.868–2.740 | 0.958 | 1.446 | 4.5% | 6 of 7 |

The usual level C0 had an average error of 2.376 mV, about 1 cal SD. Repeating the last reading (C1) and extending the recent trend (C2) did worse than C0 for every person. In the learning people, the chest signal had almost no straight-line memory over 80 ms (plan, section 4), which fits this. All arms that use the P-wave timing (T-ECG, version 2 and M-ECG) are near 1.16 to 1.17 mV, about 0.5 cal SD.

## 9. Every comparison fixed in advance

For each pair: the first forecaster's average reduction against the second, its 95% interval, the median and range over people, the number of wins, and the average difference in error in mV (second minus first), with its interval. A negative reduction means the first forecaster had the larger error.

| Comparison (first against second) | Average reduction | 95% interval | Median | Smallest to largest | People with lower error | Average difference (mV) | 95% interval (mV) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Version 2 against the first version refitted (P1) | 50.8% | [47.3, 54.7] | 48.5% | 45.6 to 57.2% | 7 of 7 | 1.219 | [1.011, 1.439] |
| Version 2 against the usual level C0 (P1) | 50.8% | [47.3, 55.0] | 47.5% | 45.4 to 57.1% | 7 of 7 | 1.219 | [1.016, 1.430] |
| Version 2 against its twin without ECG (P2) | 46.9% | [42.5, 51.4] | 44.6% | 38.5 to 54.8% | 7 of 7 | 1.049 | [0.848, 1.278] |
| Version 2 against its twin with ECG from 5.012 s earlier (P2) | 46.9% | [42.5, 51.4] | 44.6% | 38.5 to 54.8% | 7 of 7 | 1.049 | [0.849, 1.278] |
| Version 2 against C3, the R-timed heartbeat shape (P3) | 40.3% | [34.0, 46.2] | 39.4% | 25.8 to 50.8% | 7 of 7 | 0.823 | [0.604, 1.052] |
| Version 2 against T-ECG, the heartbeat shape it builds on | 0.1% | [−0.2, 0.3] | 0.3% | −0.6 to 0.4% | 5 of 7 | 0.001 | [−0.002, 0.003] |
| T-ECG (R and P waves) against T-R (R waves only) | 41.8% | [36.1, 47.8] | 39.6% | 31.2 to 53.4% | 7 of 7 | 0.875 | [0.649, 1.119] |
| T-R against C3 (two R-only versions with different detectors) | −2.7% | [−5.2, −0.3] | −3.2% | −8.2 to 2.3% | 1 of 7 | −0.053 | [−0.096, −0.008] |
| MLP (M-ECG) against ridge (R-ECG) | −1.5% | [−3.3, 0.4] | −1.1% | −5.1 to 2.0% | 2 of 7 | −0.018 | [−0.038, 0.003] |
| First version with ECG against without | −2.8% | [−5.0, −0.3] | −3.5% | −7.5 to 3.1% | 1 of 7 | −0.068 | [−0.118, −0.013] |
| First version with ECG against with delayed ECG | −2.8% | [−5.0, −0.3] | −3.5% | −7.5 to 3.1% | 1 of 7 | −0.068 | [−0.117, −0.013] |
| T-ECG against T-delayed | 51.5% | [48.0, 55.8] | 48.1% | 46.2 to 57.6% | 7 of 7 | 1.256 | [1.046, 1.472] |
| C3 against C3d | 17.8% | [14.0, 22.1] | 16.3% | 12.5 to 27.3% | 7 of 7 | 0.416 | [0.341, 0.496] |

## 10. What else the numbers show

Everything in this section is descriptive. It carries no verdict and no claim of statistical significance.

### 10.1 Where the improvement comes from

- **Learned weights on top of the template forecast.** Version 2 against T-ECG, its own template forecast without learned weights: 0.08% lower error on average, with an interval from −0.18% to 0.28%, and 5 of 7 wins. The average difference was 0.001 mV. So nearly all of version 2's lower error is already in the template forecast timed by R and P waves, which needs no learned weights.
- **With and without the P wave.** T-ECG (R and P waves) against T-R (the same detector and template, R waves only): 41.8% lower error (interval 36.1 to 47.8%), 7 of 7.
- **Two templates timed by R waves only.** T-R against C3, which uses a separately built R detector and template: −2.7% (interval −5.2 to −0.3%), 1 of 7. Without the P wave, version 2's template had slightly higher error than C3.
- **MLP against ridge.** M-ECG against R-ECG: −1.5% (interval −3.3 to 0.4%), 2 of 7. The MLP's error was higher on average, which matches the choice made with the learning people.

### 10.2 Where in the heartbeat the errors are

The plan sorts every cutoff by how long after the last available R wave the target falls, in steps of 40 ms from 0 to 1.2 seconds, plus one group for later or no beat; `results.json` holds every step for every recording. For this page the steps are grouped into three ranges. For each person, the error over a range is computed exactly from the steps' errors and their numbers of cutoffs; the table gives the average over the seven people, in mV. Every 40 ms step is in the last table of section 21.

| Forecaster | Target 80–400 ms after the last R wave | Target 400–800 ms after the last R wave | Target 800–1,200 ms after the last R wave |
| --- | ---: | ---: | ---: |
| Version 2 | 1.009 | 0.948 | 1.664 |
| T-ECG (heartbeat shape timed by R and P waves) | 1.009 | 0.949 | 1.663 |
| C3 (timed by R waves only) | 1.007 | 1.162 | 3.897 |
| C0 (usual level) | 2.009 | 1.512 | 4.020 |
| Forecasts per person in this range | 15,740–19,945 | 21,075–25,778 | 4,241–13,185 |

No target fell less than 80 ms after the last available R wave. Only p018 had targets 1.2 seconds or more after it (36 cutoffs, not in this table; their errors are in section 21). In the first 400 ms after an R wave, version 2, T-ECG and C3 have the same error, about 1.01 mV: all three replay a beat template lined up on the R wave. From 800 ms on, where the next beat begins, C3's error rises to 3.90 mV and version 2's to 1.66 mV. This is the part of the heartbeat where the P wave gives the timing of the next beat.

### 10.3 The checks with ECG from 5.012 seconds earlier, and the twins

- **Templates without learned weights.** T-ECG against T-delayed: 51.5% lower error (interval 48.0 to 55.8%), 7 of 7. C3 against C3d: 17.8% (interval 14.0 to 22.1%), 7 of 7.
- **The delayed templates on their own** did slightly worse than the usual level: T-delayed had 1.55% higher error than C0 on average and C3d 0.82% higher, and neither was better than C0 for any of the 7 people. The plan noted that for a very regular heart whose beat period fits evenly into 5.012 seconds, a delayed template could partly line up again. For these seven people it did not.
- **The delayed twin scored like the chest twin.** Both had an average error of 2.2052 mV to four decimals (2.20521 mV for the delayed twin and 2.20515 mV for the chest twin), and each person's two errors differ by less than 0.001 mV. Given the ECG of 5.012 seconds earlier, the ridge model's errors came out almost the same as without any ECG. That is why the two P2 comparisons give the same 46.9%: they are close to a single test.
- **The chest-only beat detector counts extra beats in some recordings.** In p018 and p020 (and in p001, p003 and b001) it found 1.76 to 2.66 beats for every beat found from the ECG (table in section 10.6). The chest twin's template inputs are built from these detections.

### 10.4 The first version on new people

- **The first version as published (V1F), against the usual level C0, on average:** base 0.38% higher error (2 of 7 people better than C0), with ECG 4.09% higher (1 of 7), with delayed ECG 0.45% higher (2 of 7).
- **The first version refitted (V1R), against C0, on average:** base 0.10% lower (3 of 7), with ECG 2.69% higher (1 of 7), with delayed ECG 0.08% lower (3 of 7).
- **The first version's own question, asked again.** V1R with ECG against V1R base: a reduction of −2.8% (interval −5.0 to −0.3%), that is, 2.8% higher error on average, with 1 of 7 people better. Against V1R with delayed ECG: also −2.8% (interval −5.0 to −0.3%), 1 of 7. As in the first version's own test, adding ECG readings to its linear model made the forecast slightly worse.

### 10.5 Other simple rules

- C4 (ridge on 1.2 seconds of chest and breathing readings): 2.340 mV, 1.50% lower error than C0, better for 5 of 7.
- C5 (heartbeat shape timed by the chest sensor): 2.212 mV, 6.89% lower, 7 of 7.
- The chest twin R-chest: 2.205 mV, 7.20% lower, 7 of 7. The MLP without ECG, M-chest: 2.256 mV, 4.82% lower, 6 of 7.
- C1 (repeat the last reading): 3.478 mV, 46.8% higher, 0 of 7. C2 (extend the trend): 9.488 mV, 299.6% higher, 0 of 7.

### 10.6 How the beat detectors behaved

For every scored recording: heartbeats found from the ECG between 10 and 290 seconds, the median and range of the time between beats, beats found by the chest-only detector and their number per ECG beat, the share of forecasts at which a P wave was accepted, and the share at which the template could be computed.

| Recording | Heartbeats found from the ECG, 10–290 s | Median beat interval (s) | Shortest–longest interval (s) | Beats found by the chest-only detector | Chest-only beats per ECG beat | Forecasts with an accepted P wave | Forecasts with the template defined |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| p014 | 321 | 0.872 | 0.684–0.992 | 320 | 1.00 | 12.5% | 100.0% |
| p015 | 308 | 0.908 | 0.740–1.060 | 309 | 1.00 | 15.9% | 100.0% |
| p016 | 329 | 0.848 | 0.660–1.048 | 329 | 1.00 | 13.9% | 100.0% |
| p017 | 342 | 0.816 | 0.712–0.976 | 342 | 1.00 | 15.4% | 100.0% |
| p018 | 375 | 0.726 | 0.600–1.172 | 660 | 1.76 | 19.9% | 100.0% |
| p019 | 296 | 0.948 | 0.812–1.076 | 296 | 1.00 | 13.3% | 100.0% |
| p020 | 314 | 0.888 | 0.740–1.072 | 646 | 2.06 | 14.3% | 100.0% |
| p001 | 303 | 0.932 | 0.784–0.996 | 696 | 2.30 | 15.8% | 100.0% |
| p002 | 288 | 0.972 | 0.836–1.108 | 289 | 1.00 | 13.5% | 100.0% |
| p003 | 324 | 0.864 | 0.728–0.968 | 861 | 2.66 | 15.2% | 100.0% |
| b001 | 288 | 0.912 | 0.784–0.980 | 722 | 2.51 | 15.5% | 100.0% |

A P wave was accepted at 12.5% to 19.9% of the forecasts. It can only be accepted in the stretch shortly before the next R wave, after that beat's P wave has been seen; for the rest of the heartbeat the template is continued from the last R wave. The template could be computed at every forecast.

### 10.7 The detector compared with the database's own beat marks

The database marks every heartbeat in an annotation file (`.atr`). The plan allowed these files for p014 to p020 to be downloaded only after `results.json` was sealed, for this check alone; it changes no result. They were requested at 12:40:18, after the results commit at 12:40:01, and each matched its fingerprint in the database's file list. Each file marks every beat twice, once for ECG lead I (channel 0) and once for lead II (channel 1). Version 2's detector uses lead II, so the table uses channel 1. Seconds 10 to 290; a detection's time is its reading's time, with the 20 ms filter delay left in.

| Person | Beats marked by the database (lead II) | Beats found by version 2's detector | Marked beats found within 50 ms | Found beats that match a marked beat | Median timing difference (ms) | Median timing difference after removing the 20 ms filter delay (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| p014 | 321 | 321 | 100.00% | 100.00% | 20.4 | 0.4 |
| p015 | 308 | 308 | 100.00% | 100.00% | 21.4 | 1.4 |
| p016 | 329 | 329 | 100.00% | 100.00% | 20.0 | 0.0 |
| p017 | 342 | 342 | 100.00% | 100.00% | 20.2 | 0.2 |
| p018 | 375 | 375 | 100.00% | 100.00% | 20.2 | 0.2 |
| p019 | 295 | 296 | 100.00% | 99.66% | 20.4 | 0.4 |
| p020 | 315 | 314 | 99.68% | 100.00% | 20.0 | 0.0 |
| Mean over people |  |  | 99.95% | 99.95% | 20.4 | 0.4 |

One marked beat in p020 had no detection within 50 ms, and one detection in p019 had no marked beat within 50 ms. The average over the seven people of each person's median timing difference, 20.4 ms, is close to the filter's delay of 20 ms; with that delay removed it is 0.4 ms. Against channel 0 (lead I) the shares are the same and the median difference is 22.1 ms. A first private version of this check counted both channels together, which counts each beat twice; it was replaced by this version, which treats the channels separately, before anything was committed. The program that reads the annotation files is a small one written for this check; on the WFDB sample files 100s, 100a, snip and 100x it gives the same annotations as the `wfdb` package (a widely used program library for WFDB files, version 4.3.1). The program of this check is not in this folder.

## 11. The stretch from 90 to 120 seconds

The first version was tested on the stretch from 90 to 120 seconds. For comparison, the plan also reports that stretch (7,500 cutoffs per person, part of the main 200 seconds) for the seven test people.

| Forecaster | Average error (mV) | 95% interval | Median | Smallest–largest | Average error in cal SD | Average size of miss, MAE (mV) | Average reduction against C0 | People better than C0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 2.374 | [2.086, 2.685] | 2.320 | 1.908–3.055 | 1.000 | 1.567 | 0.0% | – |
| C1, repeat the last reading (persistence) | 3.488 | [3.071, 3.893] | 3.598 | 2.658–4.112 | 1.474 | 2.459 | −47.5% | 0 of 7 |
| C2, extend the recent trend | 9.473 | [8.250, 11.038] | 8.436 | 7.958–13.525 | 4.000 | 6.377 | −299.1% | 0 of 7 |
| C3, own average heartbeat shape timed by R waves | 1.974 | [1.667, 2.300] | 1.785 | 1.355–2.672 | 0.826 | 1.094 | 17.4% | 7 of 7 |
| C3d, C3 timed by the ECG from 5.012 s earlier | 2.417 | [2.119, 2.736] | 2.375 | 1.937–3.116 | 1.018 | 1.618 | −1.8% | 0 of 7 |
| C5, heartbeat shape timed by the chest sensor | 2.223 | [1.958, 2.524] | 2.129 | 1.814–2.877 | 0.937 | 1.342 | 6.4% | 7 of 7 |
| T-ECG, heartbeat shape timed by R and P waves | 1.173 | [1.038, 1.308] | 1.105 | 0.943–1.417 | 0.498 | 0.804 | 50.2% | 7 of 7 |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 2.419 | [2.128, 2.734] | 2.376 | 1.942–3.104 | 1.019 | 1.618 | −1.9% | 0 of 7 |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 2.047 | [1.735, 2.385] | 1.831 | 1.470–2.749 | 0.857 | 1.154 | 14.3% | 7 of 7 |
| V1F base, first version as published | 2.376 | [2.072, 2.704] | 2.218 | 1.866–3.129 | 1.000 | 1.569 | 0.1% | 2 of 7 |
| V1F with ECG, as published | 2.468 | [2.107, 2.814] | 2.420 | 1.703–3.205 | 1.035 | 1.648 | −3.6% | 1 of 7 |
| V1F with delayed ECG, as published | 2.377 | [2.074, 2.706] | 2.220 | 1.867–3.130 | 1.001 | 1.573 | −0.0% | 2 of 7 |
| V1R base, first version refitted | 2.365 | [2.076, 2.683] | 2.240 | 1.886–3.079 | 0.996 | 1.560 | 0.5% | 4 of 7 |
| V1R with ECG, refitted | 2.432 | [2.118, 2.752] | 2.406 | 1.839–3.096 | 1.023 | 1.619 | −2.3% | 1 of 7 |
| V1R with delayed ECG, refitted | 2.366 | [2.076, 2.684] | 2.241 | 1.886–3.080 | 0.996 | 1.562 | 0.4% | 4 of 7 |
| C4, ridge on 1.2 s of readings | 2.334 | [2.051, 2.646] | 2.238 | 1.872–3.049 | 0.983 | 1.531 | 1.7% | 6 of 7 |
| R-chest, v2 without ECG (chest twin) | 2.213 | [1.943, 2.517] | 2.094 | 1.813–2.876 | 0.932 | 1.340 | 6.8% | 7 of 7 |
| **R-ECG, version 2** | 1.172 | [1.038, 1.307] | 1.101 | 0.943–1.420 | 0.498 | 0.805 | 50.3% | 7 of 7 |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 2.213 | [1.943, 2.517] | 2.095 | 1.813–2.876 | 0.932 | 1.340 | 6.8% | 7 of 7 |
| M-chest, MLP without ECG | 2.253 | [2.003, 2.525] | 2.104 | 1.872–2.776 | 0.952 | 1.432 | 4.8% | 6 of 7 |
| M-ECG, MLP with ECG | 1.190 | [1.046, 1.337] | 1.128 | 0.933–1.488 | 0.504 | 0.827 | 49.6% | 7 of 7 |
| M-delayed, MLP with delayed ECG | 2.262 | [2.005, 2.539] | 2.171 | 1.863–2.784 | 0.955 | 1.439 | 4.5% | 6 of 7 |

| Comparison (first against second) | Average reduction | 95% interval | Median | Smallest to largest | People with lower error | Average difference (mV) | 95% interval (mV) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Version 2 against the first version refitted (P1) | 50.1% | [46.2, 53.7] | 49.5% | 41.6 to 57.9% | 7 of 7 | 1.193 | [0.990, 1.406] |
| Version 2 against the usual level C0 (P1) | 50.3% | [46.6, 54.2] | 49.7% | 43.0 to 59.3% | 7 of 7 | 1.202 | [1.002, 1.411] |
| Version 2 against its twin without ECG (P2) | 46.6% | [42.2, 50.9] | 47.1% | 38.3 to 55.0% | 7 of 7 | 1.041 | [0.848, 1.251] |
| Version 2 against its twin with ECG from 5.012 s earlier (P2) | 46.6% | [42.2, 50.9] | 47.1% | 38.3 to 55.0% | 7 of 7 | 1.041 | [0.848, 1.251] |
| Version 2 against C3, the R-timed heartbeat shape (P3) | 39.6% | [34.5, 44.5] | 39.2% | 29.2 to 47.3% | 7 of 7 | 0.802 | [0.601, 1.017] |
| Version 2 against T-ECG, the heartbeat shape it builds on | 0.1% | [−0.2, 0.3] | 0.2% | −0.4 to 0.4% | 4 of 7 | 0.001 | [−0.002, 0.003] |
| T-ECG (R and P waves) against T-R (R waves only) | 41.7% | [37.0, 46.8] | 39.0% | 34.6 to 50.4% | 7 of 7 | 0.874 | [0.661, 1.109] |
| T-R against C3 (two R-only versions with different detectors) | −3.8% | [−6.1, −1.7] | −3.2% | −8.5 to 0.1% | 1 of 7 | −0.073 | [−0.117, −0.033] |
| MLP (M-ECG) against ridge (R-ECG) | −1.4% | [−3.4, 0.8] | −2.2% | −4.7 to 2.7% | 2 of 7 | −0.017 | [−0.040, 0.006] |
| First version with ECG against without | −2.8% | [−4.9, −0.4] | −3.7% | −7.4 to 3.2% | 1 of 7 | −0.067 | [−0.114, −0.014] |
| First version with ECG against with delayed ECG | −2.8% | [−4.9, −0.4] | −3.7% | −7.4 to 3.2% | 1 of 7 | −0.066 | [−0.113, −0.014] |
| T-ECG against T-delayed | 51.1% | [47.4, 55.1] | 50.5% | 43.9 to 60.3% | 7 of 7 | 1.246 | [1.038, 1.461] |
| C3 against C3d | 18.8% | [14.7, 23.7] | 15.6% | 13.3 to 30.1% | 7 of 7 | 0.443 | [0.359, 0.530] |

On this stretch version 2's average error was 1.172 mV, against 2.365 mV for the first version refitted and 2.376 mV for the first version as published. Against the first version refitted, version 2's error was 50.1% lower (interval 46.2 to 53.7%), for 7 of 7 people. The first version's own published test (2.838 mV for its base model) used five other people (p009 to p013), so its millivolt values cannot be compared directly with these.

## 12. People 1 to 3, the ten together, and the resting recording

None of these groups receives a verdict.

**People 1 to 3** (p001 to p003) were scored with the same programs and frozen models, from 90 to 290 seconds, and are reported without an interval. **b001** is the only genuine resting recording in the database: one person, at rest before the music, scored from 90 to 270 seconds (45,000 cutoffs).

| Recording | cal SD (mV) | Version 2 error (mV) | Version 2 error in cal SD | First version refitted (mV) | Usual level C0 (mV) | C3 (mV) | Twin without ECG (mV) | Twin with delayed ECG (mV) | Reduction against the first version | Reduction against C3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| p001 | 1.435 | 0.683 | 0.476 | 1.425 | 1.406 | 1.052 | 1.406 | 1.406 | 52.1% | 35.1% |
| p002 | 2.193 | 0.857 | 0.391 | 2.190 | 2.157 | 1.105 | 2.050 | 2.050 | 60.8% | 22.4% |
| p003 | 1.580 | 1.031 | 0.653 | 1.738 | 1.608 | 1.238 | 1.597 | 1.597 | 40.7% | 16.7% |
| b001 | 1.830 | 0.774 | 0.423 | 1.894 | 1.906 | 1.367 | 1.847 | 1.847 | 59.1% | 43.4% |

Every forecaster, average over p001 to p003:

| Forecaster | Average error (mV) | Median | Smallest–largest | Average error in cal SD | Average size of miss, MAE (mV) | Average reduction against C0 | People better than C0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 1.724 | 1.608 | 1.406–2.157 | 0.994 | 1.250 | 0.0% | – |
| C1, repeat the last reading (persistence) | 2.648 | 2.376 | 2.027–3.540 | 1.510 | 1.954 | −52.0% | 0 of 3 |
| C2, extend the recent trend | 7.685 | 6.697 | 6.362–9.997 | 4.410 | 5.528 | −344.1% | 0 of 3 |
| C3, own average heartbeat shape timed by R waves | 1.132 | 1.105 | 1.052–1.238 | 0.674 | 0.813 | 32.3% | 3 of 3 |
| C3d, C3 timed by the ECG from 5.012 s earlier | 1.732 | 1.615 | 1.411–2.169 | 0.998 | 1.260 | −0.5% | 0 of 3 |
| C5, heartbeat shape timed by the chest sensor | 1.692 | 1.616 | 1.410–2.049 | 0.980 | 1.205 | 1.4% | 1 of 3 |
| T-ECG, heartbeat shape timed by R and P waves | 0.866 | 0.860 | 0.689–1.049 | 0.512 | 0.673 | 48.6% | 3 of 3 |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 1.750 | 1.634 | 1.426–2.189 | 1.009 | 1.277 | −1.5% | 0 of 3 |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 1.112 | 1.078 | 1.016–1.241 | 0.662 | 0.809 | 33.5% | 3 of 3 |
| V1F base, first version as published | 1.773 | 1.738 | 1.427–2.155 | 1.026 | 1.301 | −3.2% | 1 of 3 |
| V1F with ECG, as published | 1.708 | 1.782 | 1.358–1.984 | 0.993 | 1.283 | 0.2% | 2 of 3 |
| V1F with delayed ECG, as published | 1.774 | 1.739 | 1.429–2.154 | 1.026 | 1.303 | −3.2% | 1 of 3 |
| V1R base, first version refitted | 1.784 | 1.738 | 1.425–2.190 | 1.031 | 1.309 | −3.7% | 0 of 3 |
| V1R with ECG, refitted | 1.746 | 1.767 | 1.295–2.175 | 1.004 | 1.292 | −1.0% | 1 of 3 |
| V1R with delayed ECG, refitted | 1.785 | 1.739 | 1.426–2.192 | 1.031 | 1.310 | −3.7% | 0 of 3 |
| C4, ridge on 1.2 s of readings | 1.744 | 1.649 | 1.396–2.186 | 1.004 | 1.280 | −1.1% | 1 of 3 |
| R-chest, v2 without ECG (chest twin) | 1.684 | 1.597 | 1.406–2.050 | 0.975 | 1.202 | 1.9% | 3 of 3 |
| **R-ECG, version 2** | 0.857 | 0.857 | 0.683–1.031 | 0.507 | 0.666 | 49.2% | 3 of 3 |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 1.684 | 1.597 | 1.406–2.050 | 0.975 | 1.202 | 1.9% | 2 of 3 |
| M-chest, MLP without ECG | 1.844 | 1.678 | 1.546–2.309 | 1.064 | 1.306 | −7.1% | 0 of 3 |
| M-ECG, MLP with ECG | 0.863 | 0.895 | 0.705–0.990 | 0.509 | 0.669 | 48.9% | 3 of 3 |
| M-delayed, MLP with delayed ECG | 1.853 | 1.686 | 1.547–2.327 | 1.069 | 1.321 | −7.6% | 0 of 3 |

| Comparison (first against second) | Average reduction | Median | Smallest to largest | People with lower error | Average difference (mV) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Version 2 against the first version refitted (P1) | 51.2% | 52.1% | 40.7 to 60.8% | 3 of 3 | 0.927 |
| Version 2 against the usual level C0 (P1) | 49.2% | 51.4% | 35.9 to 60.3% | 3 of 3 | 0.866 |
| Version 2 against its twin without ECG (P2) | 48.3% | 51.4% | 35.4 to 58.2% | 3 of 3 | 0.827 |
| Version 2 against its twin with ECG from 5.012 s earlier (P2) | 48.3% | 51.4% | 35.4 to 58.2% | 3 of 3 | 0.827 |
| Version 2 against C3, the R-timed heartbeat shape (P3) | 24.7% | 22.4% | 16.7 to 35.1% | 3 of 3 | 0.275 |
| Version 2 against T-ECG, the heartbeat shape it builds on | 0.9% | 0.9% | 0.3 to 1.7% | 3 of 3 | 0.009 |
| T-ECG (R and P waves) against T-R (R waves only) | 22.6% | 20.2% | 15.5 to 32.2% | 3 of 3 | 0.246 |
| T-R against C3 (two R-only versions with different detectors) | 1.9% | 2.5% | −0.2 to 3.4% | 2 of 3 | 0.020 |
| MLP (M-ECG) against ridge (R-ECG) | −1.2% | −3.2% | −4.4 to 4.0% | 1 of 3 | −0.006 |
| First version with ECG against without | 2.7% | 0.7% | −1.7 to 9.1% | 2 of 3 | 0.038 |
| First version with ECG against with delayed ECG | 2.8% | 0.8% | −1.7 to 9.2% | 2 of 3 | 0.039 |
| T-ECG against T-delayed | 49.4% | 51.7% | 35.8 to 60.7% | 3 of 3 | 0.884 |
| C3 against C3d | 32.6% | 25.5% | 23.3 to 49.0% | 3 of 3 | 0.600 |

For people 1 to 3, version 2's error was lower than the first version refitted for all 3, by 51.2% on average, and lower than C3 for all 3, by 24.7% (for the three people separately, from 16.7% to 35.1%; there is no interval for this group). C3 did comparatively well for p002 (1.105 mV, 0.504 cal SD).

**The seven test people and people 1 to 3 together** (ten people, with intervals; a secondary table):

| Forecaster | Average error (mV) | 95% interval | Median | Smallest–largest | Average error in cal SD | Average size of miss, MAE (mV) | Average reduction against C0 | People better than C0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 2.180 | [1.896, 2.469] | 2.114 | 1.406–2.890 | 1.000 | 1.473 | 0.0% | – |
| C1, repeat the last reading (persistence) | 3.229 | [2.796, 3.650] | 3.317 | 2.027–4.098 | 1.484 | 2.308 | −48.3% | 0 of 10 |
| C2, extend the recent trend | 8.947 | [7.824, 10.210] | 8.381 | 6.362–12.910 | 4.131 | 6.133 | −312.9% | 0 of 10 |
| C3, own average heartbeat shape timed by R waves | 1.725 | [1.414, 2.047] | 1.729 | 1.052–2.548 | 0.783 | 1.007 | 21.7% | 10 of 10 |
| C3d, C3 timed by the ECG from 5.012 s earlier | 2.196 | [1.908, 2.489] | 2.125 | 1.411–2.918 | 1.007 | 1.493 | −0.7% | 0 of 10 |
| C5, heartbeat shape timed by the chest sensor | 2.056 | [1.812, 2.319] | 1.972 | 1.410–2.763 | 0.948 | 1.297 | 5.2% | 8 of 10 |
| T-ECG, heartbeat shape timed by R and P waves | 1.070 | [0.948, 1.191] | 1.052 | 0.689–1.442 | 0.500 | 0.754 | 50.1% | 10 of 10 |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 2.214 | [1.925, 2.507] | 2.145 | 1.426–2.933 | 1.016 | 1.511 | −1.5% | 0 of 10 |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 1.756 | [1.426, 2.098] | 1.740 | 1.016–2.631 | 0.795 | 1.043 | 20.5% | 10 of 10 |
| V1F base, first version as published | 2.203 | [1.924, 2.496] | 2.153 | 1.427–2.984 | 1.012 | 1.497 | −1.2% | 3 of 10 |
| V1F with ECG, as published | 2.248 | [1.917, 2.576] | 2.209 | 1.358–3.022 | 1.028 | 1.547 | −2.8% | 3 of 10 |
| V1F with delayed ECG, as published | 2.205 | [1.925, 2.497] | 2.154 | 1.429–2.984 | 1.013 | 1.500 | −1.3% | 3 of 10 |
| V1R base, first version refitted | 2.198 | [1.923, 2.482] | 2.150 | 1.425–2.931 | 1.010 | 1.493 | −1.0% | 3 of 10 |
| V1R with ECG, refitted | 2.234 | [1.921, 2.545] | 2.170 | 1.295–2.938 | 1.022 | 1.531 | −2.2% | 2 of 10 |
| V1R with delayed ECG, refitted | 2.199 | [1.923, 2.483] | 2.152 | 1.426–2.932 | 1.011 | 1.494 | −1.1% | 3 of 10 |
| C4, ridge on 1.2 s of readings | 2.161 | [1.889, 2.442] | 2.149 | 1.396–2.909 | 0.993 | 1.462 | 0.7% | 6 of 10 |
| R-chest, v2 without ECG (chest twin) | 2.049 | [1.804, 2.314] | 1.964 | 1.406–2.762 | 0.944 | 1.296 | 5.6% | 10 of 10 |
| **R-ECG, version 2** | 1.067 | [0.943, 1.190] | 1.046 | 0.683–1.445 | 0.498 | 0.753 | 50.3% | 10 of 10 |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 2.049 | [1.804, 2.314] | 1.964 | 1.406–2.762 | 0.944 | 1.296 | 5.6% | 9 of 10 |
| M-chest, MLP without ECG | 2.132 | [1.900, 2.376] | 2.059 | 1.546–2.731 | 0.988 | 1.400 | 1.2% | 6 of 10 |
| M-ECG, MLP with ECG | 1.081 | [0.956, 1.212] | 1.065 | 0.705–1.499 | 0.503 | 0.771 | 49.8% | 10 of 10 |
| M-delayed, MLP with delayed ECG | 2.140 | [1.906, 2.384] | 2.083 | 1.547–2.740 | 0.991 | 1.409 | 0.9% | 6 of 10 |

| Comparison (first against second) | Average reduction | 95% interval | Median | Smallest to largest | People with lower error | Average difference (mV) | 95% interval (mV) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Version 2 against the first version refitted (P1) | 50.9% | [47.2, 54.7] | 50.3% | 40.7 to 60.8% | 10 of 10 | 1.131 | [0.940, 1.333] |
| Version 2 against the usual level C0 (P1) | 50.3% | [45.8, 54.5] | 49.5% | 35.9 to 60.3% | 10 of 10 | 1.113 | [0.907, 1.322] |
| Version 2 against its twin without ECG (P2) | 47.3% | [42.8, 51.8] | 47.8% | 35.4 to 58.2% | 10 of 10 | 0.982 | [0.806, 1.177] |
| Version 2 against its twin with ECG from 5.012 s earlier (P2) | 47.3% | [42.8, 51.8] | 47.8% | 35.4 to 58.2% | 10 of 10 | 0.982 | [0.807, 1.177] |
| Version 2 against C3, the R-timed heartbeat shape (P3) | 35.6% | [28.8, 42.1] | 36.3% | 16.7 to 50.8% | 10 of 10 | 0.659 | [0.443, 0.891] |
| Version 2 against T-ECG, the heartbeat shape it builds on | 0.3% | [0.0, 0.7] | 0.3% | −0.6 to 1.7% | 8 of 10 | 0.003 | [−0.000, 0.007] |
| T-ECG (R and P waves) against T-R (R waves only) | 36.1% | [28.8, 43.0] | 36.3% | 15.5 to 53.4% | 10 of 10 | 0.686 | [0.448, 0.945] |
| T-R against C3 (two R-only versions with different detectors) | −1.3% | [−3.6, 0.8] | −0.3% | −8.2 to 3.4% | 3 of 10 | −0.031 | [−0.070, 0.006] |
| MLP (M-ECG) against ridge (R-ECG) | −1.4% | [−3.2, 0.4] | −2.2% | −5.1 to 4.0% | 3 of 10 | −0.014 | [−0.033, 0.005] |
| First version with ECG against without | −1.2% | [−3.7, 1.9] | −2.2% | −7.5 to 9.1% | 3 of 10 | −0.036 | [−0.087, 0.019] |
| First version with ECG against with delayed ECG | −1.1% | [−3.6, 1.9] | −2.1% | −7.5 to 9.2% | 3 of 10 | −0.036 | [−0.087, 0.020] |
| T-ECG against T-delayed | 50.9% | [46.3, 55.1] | 49.9% | 35.8 to 60.7% | 10 of 10 | 1.144 | [0.930, 1.360] |
| C3 against C3d | 22.2% | [16.7, 29.4] | 20.3% | 12.5 to 49.0% | 10 of 10 | 0.471 | [0.363, 0.625] |

**The resting recording b001**, every forecaster:

| Forecaster | Error (mV) | Error in cal SD | MAE (mV) | Reduction against C0 |
| --- | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 1.906 | 1.041 | 1.430 | 0.0% |
| C1, repeat the last reading (persistence) | 2.810 | 1.535 | 2.147 | −47.5% |
| C2, extend the recent trend | 8.670 | 4.737 | 6.567 | −354.9% |
| C3, own average heartbeat shape timed by R waves | 1.367 | 0.747 | 0.839 | 28.3% |
| C3d, C3 timed by the ECG from 5.012 s earlier | 1.923 | 1.051 | 1.444 | −0.9% |
| C5, heartbeat shape timed by the chest sensor | 1.869 | 1.021 | 1.411 | 1.9% |
| T-ECG, heartbeat shape timed by R and P waves | 0.784 | 0.428 | 0.565 | 58.9% |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 1.935 | 1.057 | 1.462 | −1.5% |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 1.290 | 0.705 | 0.823 | 32.3% |
| V1F base, first version as published | 1.884 | 1.029 | 1.417 | 1.2% |
| V1F with ECG, as published | 1.738 | 0.950 | 1.300 | 8.8% |
| V1F with delayed ECG, as published | 1.886 | 1.031 | 1.421 | 1.0% |
| V1R base, first version refitted | 1.894 | 1.035 | 1.432 | 0.6% |
| V1R with ECG, refitted | 1.727 | 0.944 | 1.312 | 9.4% |
| V1R with delayed ECG, refitted | 1.896 | 1.036 | 1.436 | 0.5% |
| C4, ridge on 1.2 s of readings | 1.821 | 0.995 | 1.382 | 4.4% |
| R-chest, v2 without ECG (chest twin) | 1.847 | 1.009 | 1.400 | 3.1% |
| **R-ECG, version 2** | 0.774 | 0.423 | 0.563 | 59.4% |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 1.847 | 1.009 | 1.399 | 3.1% |
| M-chest, MLP without ECG | 2.034 | 1.111 | 1.515 | −6.7% |
| M-ECG, MLP with ECG | 0.796 | 0.435 | 0.585 | 58.2% |
| M-delayed, MLP with delayed ECG | 2.053 | 1.122 | 1.566 | −7.7% |

| Comparison | Reduction | Difference (mV) |
| --- | ---: | ---: |
| Version 2 against the first version refitted (P1) | 59.1% | 1.120 |
| Version 2 against the usual level C0 (P1) | 59.4% | 1.131 |
| Version 2 against its twin without ECG (P2) | 58.1% | 1.072 |
| Version 2 against its twin with ECG from 5.012 s earlier (P2) | 58.1% | 1.073 |
| Version 2 against C3, the R-timed heartbeat shape (P3) | 43.4% | 0.593 |
| Version 2 against T-ECG, the heartbeat shape it builds on | 1.2% | 0.010 |
| T-ECG (R and P waves) against T-R (R waves only) | 39.2% | 0.506 |
| T-R against C3 (two R-only versions with different detectors) | 5.7% | 0.077 |
| MLP (M-ECG) against ridge (R-ECG) | −2.8% | −0.021 |
| First version with ECG against without | 8.8% | 0.167 |
| First version with ECG against with delayed ECG | 8.9% | 0.169 |
| T-ECG against T-delayed | 59.5% | 1.151 |
| C3 against C3d | 28.9% | 0.556 |

## 13. What the learning people showed (optimistic)

These numbers come from the ten learning people, by leave one person out for every learned model, per person for the rules without learned weights, and for the first version as published (whose learning people, p004 to p008, are among these ten). They are **optimistic**: the settings of the R and P wave detectors were chosen by looking at p004, p007 and p008, and the behaviour of all ten from 90 to 120 seconds was known before the plan was written. They are never results on new people. Source: `development/development-table.json`.

| Forecaster | Average error (mV) | Average error in cal SD | Average reduction against C0 | People better than C0 |
| --- | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 2.849 | 0.996 | 0.0% | – |
| C1, repeat the last reading (persistence) | 4.252 | 1.490 | −49.6% | 0 of 10 |
| C2, extend the recent trend | 11.356 | 4.010 | −303.5% | 0 of 10 |
| C3, own average heartbeat shape timed by R waves | 2.265 | 0.790 | 20.7% | 10 of 10 |
| C3d, C3 timed by the ECG from 5.012 s earlier | 2.866 | 1.002 | −0.6% | 0 of 10 |
| C5, heartbeat shape timed by the chest sensor | 2.513 | 0.881 | 11.5% | 10 of 10 |
| T-ECG, heartbeat shape timed by R and P waves | 1.389 | 0.477 | 52.2% | 10 of 10 |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 2.891 | 1.010 | −1.5% | 0 of 10 |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 2.301 | 0.797 | 20.1% | 10 of 10 |
| V1F base, first version as published | 2.809 | 0.981 | 1.5% | 6 of 10 |
| V1F with ECG, as published | 2.779 | 0.988 | 0.8% | 6 of 10 |
| V1F with delayed ECG, as published | 2.811 | 0.982 | 1.4% | 6 of 10 |
| V1R base, first version refitted | 2.824 | 0.986 | 0.9% | 7 of 10 |
| V1R with ECG, refitted | 2.958 | 1.039 | −4.4% | 2 of 10 |
| V1R with delayed ECG, refitted | 2.824 | 0.987 | 0.9% | 7 of 10 |
| C4, ridge on 1.2 s of readings | 2.836 | 0.989 | 0.7% | 6 of 10 |
| R-chest, v2 without ECG (chest twin) | 2.520 | 0.883 | 11.3% | 10 of 10 |
| **R-ECG, version 2** | 1.389 | 0.477 | 52.1% | 10 of 10 |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 2.519 | 0.883 | 11.3% | 10 of 10 |
| M-chest, MLP without ECG | 2.684 | 0.940 | 5.6% | 8 of 10 |
| M-ECG, MLP with ECG | 1.405 | 0.484 | 51.5% | 10 of 10 |
| M-delayed, MLP with delayed ECG | 2.734 | 0.952 | 4.4% | 7 of 10 |

Version 2's average error for each of the 27 combinations of settings, by leave one person out, in mV (`development/lopo-r-ecg-grid.json`):

| K (beats averaged) | theta (P match needed) | Penalty 0.001 | Penalty 0.02 | Penalty 0.1 |
| ---: | ---: | ---: | ---: | ---: |
| 8 | 0.7 | 1.4622 | 1.4690 | 1.4916 |
| 8 | 0.8 | 1.4176 | 1.4243 | 1.4468 |
| 8 | 0.9 | 1.4212 | 1.4268 | 1.4469 |
| 16 | 0.7 | 1.4550 | 1.4626 | 1.4820 |
| 16 | 0.8 | 1.4114 | 1.4189 | 1.4382 |
| 16 | 0.9 | 1.4004 | 1.4067 | 1.4239 |
| 32 | 0.7 | 1.4481 | 1.4549 | 1.4700 |
| 32 | 0.8 | 1.4020 | 1.4085 | 1.4231 |
| 32 | 0.9 | 1.3886 | 1.3931 | 1.4056 |

For comparison only: version 2's error was 0.477 cal SD for the learning people and 0.494 cal SD for the seven test people. Its average reduction against the usual level was 52.1% (10 of 10) for the learning people and 50.8% (7 of 7) for the test people. For C3 the same reduction was 20.7% for the learning people and 17.1% for the test people.

The Technical edition also records one after-the-fact check of the first version on the first version's own test people. As the plan fixes, it appears in the Technical edition only, labelled descriptive.

## 14. The data, who provided it, and what was opened when

**Source.** The Combined measurement of ECG, Breathing and Seismocardiograms (CEBS) database, version 1.0.0, published on PhysioNet, DOI [10.13026/C2KW23](https://doi.org/10.13026/C2KW23) (a DOI is a permanent identifier of a published item). It was contributed by Miguel Ángel García González and Ariadna Argelagós Palou of the Universitat Politècnica de Catalunya.

**Licence.** Open Data Commons Attribution License v1.0 (ODC-By 1.0): anyone may use the data if they credit the source. The credit, the two citations and the list of our changes are in [NOTICE.md](NOTICE.md). The code in this folder is released under CC0 1.0, the repository's licence, which gives up all rights in it as far as the law allows. Results and weights derived from the database keep its attribution.

**The recordings.** 20 presumed healthy volunteers, lying on their backs, still and awake. Each had three recordings in a row: five minutes at rest (files b001 to b020), about 50 minutes of classical music (m001 to m020), and five minutes after the music (p001 to p020). The recorder was a Biopac MP36: ECG leads I and II (0.05 to 150 Hz), a piezoresistive breathing band (0.05 to 10 Hz) and one axis of a three-axis accelerometer (LIS344ALH, 0.5 to 100 Hz), each at 5,000 samples per second. In this release the rest files b002 to b020 are byte-for-byte copies of the after-music files p002 to p020, so b001 is the only genuine resting recording.

| Group | Recordings | Use |
| --- | --- | --- |
| Learning people | p004 to p013 | Every fit and every choice of settings |
| Main test people | p014 to p020 | Downloaded after the freeze; scored once; the verdicts |
| Secondary people | p001 to p003 | Scored with the main test; no verdict |
| Resting check | b001 | One person in a different condition; no verdict |

**What was opened, and when.**

- p014 to p020 and p001 were downloaded at 12:27:56 and after, once GitHub showed the freeze commit. The freeze's search of the computer had found no file of people 14 to 20 and no p001.dat on it.
- p002 and p003 were read from the files b002.dat and b003.dat (byte-for-byte the same as p002.dat and p003.dat) with the p002 and p003 header files, and b001 from its own files. These files sit in a read-only copy kept by the first version's maintainer, and their fingerprints match the database's list. Before this study, that maintainer's file check had read b001 to b003 in full to compute the header checksums and channel statistics for seconds 60 to 72, as checks of the files' integrity. The project's public sensor viewer shows seconds 60 to 72 of b001 to b003, inside the calibration stretch. No model had been fitted or scored on people 1 to 3, and no other value of their recordings had been read for any analysis.
- The same read-only copy also holds five annotation files of people 1 to 3 (b001.atr, b002.atr, b003.atr, p002.atr and p003.atr). This study did not open them, and no annotation enters any forecast.
- The annotation files of p014 to p020 were downloaded only after the results were committed (section 10.7). No rest or music file of people 14 to 20 was downloaded.

**The download.** From `https://physionet.org/files/cebsdb/1.0.0/`: first the file list `SHA256SUMS.txt` (13,697 bytes), whose fingerprint `75db8c9b…` matched its pin; then the recording and header files of p014 to p020 and p001. One file at a time, 1.5 seconds apart. For each data file, physionet.org answered with a redirect (HTTP 302), an instruction to fetch the file from PhysioNet's open-data storage (`physionet-open.s3.amazonaws.com`). The first download program stopped at the first redirect (p014.dat) without following it. The download was then resumed with redirects followed, so p014.dat was requested twice. In all there were 34 exchanges with the servers: 18 requests to physionet.org and 16 redirected ones; every answer was either "OK" (HTTP 200) or a redirect. Every file's fingerprint matched its pin. The address, answer, time, size and fingerprint of every exchange are in `source-verification.json`.

## 15. Data checks and the test for peeking at the future

**The data checks (QC1 to QC5)** concern the integrity of the data only. They ran once, with the frozen program `qc.py`, before any forecast was made.

- QC1: the files' fingerprints match their pins.
- QC2: the header file has the expected contents (six lines, the record name, 4 signals at 5,000 samples per second, the expected length, the signal names I, II, RESP and SCG, positive gains and the expected closing comment), the recording file has the expected size, and the four whole-recording checksums match the header.
- QC3: at least 90% of the forecast moments are valid, that is, not lost to missing values (at least 45,000 of 50,000; for b001 40,500 of 45,000), and at least 4,500 of the 5,000 calibration readings of each signal used are valid, with a spread above zero.
- QC4: no long run of identical stored values (at least 2,500 samples, 0.5 s, in the ECG or chest signal; at least 25,000 samples, 5 s, in the breathing band).
- QC5: no more than 1.0% of samples at the recorder's limits (clipping); 0.1% to 1.0% is flagged only.

| Recording | QC1 right files | QC2 header | QC3 valid forecast moments | QC4 longest run of identical values, ECG / breathing / chest (samples) | QC5 clipped samples in %, ECG / breathing / chest | Chest cal SD (mV) | All five |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| p014 | pass | pass | 50,000 / 50,000 | 95 / 346 / 7 | 0.0002 / 0.0017 / 0.0002 | 2.107 | pass |
| p015 | pass | pass | 50,000 / 50,000 | 72 / 828 / 8 | 0.0000 / 0.0000 / 0.0002 | 2.856 | pass |
| p016 | pass | pass | 50,000 / 50,000 | 126 / 1,207 / 7 | 0.0005 / 0.0061 / 0.0002 | 2.900 | pass |
| p017 | pass | pass | 50,000 / 50,000 | 50 / 185 / 7 | 0.0000 / 0.0014 / 0.0003 | 2.644 | pass |
| p018 | pass | pass | 50,000 / 50,000 | 51 / 4,298 / 7 | 0.0002 / 0.0025 / 0.0003 | 1.931 | pass |
| p019 | pass | pass | 50,000 / 50,000 | 71 / 178 / 7 | 0.0003 / 0.0032 / 0.0003 | 2.377 | pass |
| p020 | pass | pass | 50,000 / 50,000 | 102 / 2,910 / 7 | 0.0002 / 0.0089 / 0.0001 | 1.822 | pass |
| p001 | pass | pass | 50,000 / 50,000 | 105 / 378 / 50 | 0.0002 / 0.0107 / 0.0000 | 1.435 | pass |
| p002 | pass | pass | 50,000 / 50,000 | 101 / 805 / 64 | 0.0005 / 0.0081 / 0.0018 | 2.193 | pass |
| p003 | pass | pass | 50,000 / 50,000 | 121 / 2,077 / 7 | 0.0003 / 0.0000 / 0.0000 | 1.580 | pass |
| b001 | pass | pass | 45,000 / 45,000 | 69 / 607 / 47 | 0.0004 / 0.0118 / 0.0000 | 1.830 | pass |

All 11 recordings passed every check, and none was flagged: the largest share of clipped samples was 0.0118%, in the breathing band of b001. So n = 7 test people count for the verdicts, and a comparison needs 6 wins. The review of the frozen programs had noted that `qc.py` stops with an error, instead of recording a QC1 failure, if a file is missing or its header file is not a proper WFDB header. That did not happen: every file was obtained and read.

**The test for peeking at the future.** After the data checks were sealed and before any forecast was written, each scored recording was tested at 200 cutoffs drawn with the plan's fixed seeds (20261127 plus the subject number; b001 counts as 101). For each cutoff, two altered copies of the recording were made: one with every raw sample after the cutoff replaced by random numbers, and one cut off right after the cutoff. The whole chain, from the raw stored numbers on, was run on both. Every input value and every forecast at that cutoff, including each of the three MLP seed models, in the person's scale and in mV (71 values per cutoff), had to equal the unaltered ones exactly. 11 recordings × 200 cutoffs × 2 altered copies × 71 values = 312,400 comparisons; none changed. The test read no target.

## 16. Changes from the plan

Before the download (recorded in `FREEZE.json` and admitted with the freeze):

1. **The chest-only detector's last scanning step.** It scans while k < n − 7, where the plan writes k < n − 8 (k is the reading being scanned and n the length of the recording). With the plan's bound, a chest beat that becomes available exactly at a cutoff is missed in a copy of the recording cut off at that cutoff, so the test for peeking at the future would report a change that is not a leak. The two bounds differ only near the very end of a full recording, after every cutoff; on all ten learning recordings they give identical inputs at every cutoff, so no number or choice depends on it.
2. **Header comparison.** Header lines are compared after removing spaces at their ends, because every header line in this release ends with a space. A literal comparison would have excluded every recording.

After the freeze (recorded in `RUN-RECORD.json` and `source-verification.json`, and stated here):

3. **Download requests.** The plan describes 17 requests to physionet.org. There were 34 exchanges, because of the redirects and the repeated first file (section 14). The plan's stop rule covers "too many requests" (HTTP 429) and refusals; a redirect is neither. No file other than the plan's 17 was requested, and every byte matches its pin.
4. **Where later changes are recorded.** The plan says a change after the download is recorded in `results.json`. `results.json` is the unchanged output of the frozen scoring program and has no field for changes, and editing it would break the chain of fingerprints. Change 3 is therefore recorded in `RUN-RECORD.json` (committed with `results.json`) and in `source-verification.json` (committed with the lock).
5. **Private disk use.** The private working folder holds about 380 MB (megabytes of a million bytes each), above the plan's 300 MB budget. Most of it is copies of the learning recordings (120 MB), the downloaded test files (96 MB) and the locked forecast files (146 MB); the rest is 18 MB of outputs from choosing the settings, and small logs. This affects no file or result.

None of these changed a forecast, a score or a verdict.

## 17. What these results cannot show

- **One situation.** Presumed healthy volunteers, lying on their backs, still and awake, in the five-minute recording made after about 50 minutes of classical music, in one laboratory with one recording system. The results cover that situation only. b001 is one person at rest before the music.
- **Voltages, not physical quantities.** The chest sensor and breathing band give sensor voltages in mV, not acceleration, chest movement or lung volume.
- **The ECG is used for timing.** ECG lead II is the voltage between skin electrodes, used only to time heartbeats and describe their shape.
- **No sensation.** Nothing in these recordings measures signals in sensory nerves or anything a person felt. No claim about sensation, interoception (the sense of the body's internal state), clinical use, diagnosis or physiological cause follows.
- **Few people.** Seven main test people, three secondary people and one resting recording, all from one database. The bootstrap interval with seven people is rough.
- **Detector settings.** The settings of the R and P wave detectors were chosen by looking at three learning people (p004, p007 and p008). This makes the learning-people numbers optimistic. The test people played no part in them.
- **Recent readings needed.** Version 2's beat template can only be computed once the R-wave detector has found at least 37 heartbeats of the person: the 33 beats the template averages (K = 32) plus 4 earlier ones. For the seven main test people, whose median time between beats was 0.73 to 0.95 seconds, that takes about 27 to 35 seconds (about 36 seconds for p002, one of the extra people) of the same person's recent ECG and chest readings. A 20-second calibration stretch from that person is also needed. With fewer beats, every template input takes a fixed fill value, and the results on this page would not apply. The plan's own list of limits said "about 20 seconds"; it was written before K was chosen and fits the plan's default setting K = 16 (21 heartbeats). The plan's description of the predictor program asks for at least 30 seconds. The model cannot forecast someone from whom it has no readings.
- **Careful wording.** Results are stated as "supported" or "not supported" by the rule fixed in advance. They do not show that the model works in general.

## 18. Measured, derived, predicted and simulated values

- **Measured:** the ECG, breathing and chest voltages in the database.
- **Derived:** values computed from the measured voltages: filtered readings, calibration averages and SDs, rescaled readings, detected beat times, beat templates, model inputs and every data-check value. The database's beat marks, used only in section 10.7, were made from the recordings by the database's contributors.
- **Predicted:** the forecasts of every forecaster, and every error computed from them against the measured targets.
- **Simulated:** none. No physics or body simulation and no other data source is used.

## 19. How to rerun the test

The test ran with Python 3.14.8 and NumPy 2.5.3 on Linux, using the computer's main processor only, one NumPy thread per program (the test for peeking at the future used 8 programs in parallel). Refitting the MLP models also needs PyTorch (version 2.14.0 was used, 32-bit numbers on the main processor, with deterministic algorithms). Run every command from this folder, because the programs load each other from it. Keep the downloaded data and the outputs outside the repository. Other library versions can change the last digits of the results.

**Step 1: check the frozen files.** This short program compares the 43 fingerprints listed in `FREEZE.json` with the files in this folder and prints "all match" if they agree.

```sh
python - <<'EOF'
import hashlib, json
f = json.load(open("FREEZE.json"))
files = {**{n: v["sha256"] for n, v in f["code"].items()},
         **{f"weights/{n}": h for n, h in f["weights_sha256"].items()},
         **{f"development/{n}": h for n, h in f["development_files_sha256"].items()},
         **f["protocol"]["files_sha256"]}
bad = [n for n, h in files.items() if hashlib.sha256(open(n, "rb").read()).hexdigest() != h]
print(len(files), "files checked:", "all match" if not bad else bad)
EOF
```

**Step 2: download the scored recordings** (about 131 MB) and check every file against the database's list. The first command chooses a folder for the data; `curl -L` follows PhysioNet's redirects; `sleep 1` waits a second between requests; the last `sha256sum -c` line should print "OK" for all 22 files. p002.dat and p003.dat from PhysioNet are the same bytes as the b002.dat and b003.dat used in the test.

```sh
DATA="$HOME/cebs-v2-test"; mkdir -p "$DATA" && cd "$DATA"
base=https://physionet.org/files/cebsdb/1.0.0
curl -fsSLO "$base/SHA256SUMS.txt"
echo "75db8c9b809ef307aabeff2c0d1b780e1bb80d4df1044272ba0f980ed06f205e  SHA256SUMS.txt" | sha256sum -c
for r in p014 p015 p016 p017 p018 p019 p020 p001 p002 p003 b001; do
  for e in dat hea; do curl -fsSLO "$base/$r.$e"; sleep 1; done
done
grep -E ' (p0(0[1-3]|1[4-9]|20)|b001)\.(dat|hea)$' SHA256SUMS.txt | sha256sum -c
cd -
```

**Step 3: run the data checks, the test for peeking at the future, the forecasts, the lock and the scoring.** The first part writes a small list (the records map) of where each recording's two files are. Keep the order of the recordings and the label given to `qc.py` exactly as shown, so that the data-check report comes out byte for byte the same.

```sh
OUT="$HOME/cebs-v2-rerun"; mkdir -p "$OUT"
export OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 PYTHONDONTWRITEBYTECODE=1
python - "$DATA" "$OUT/map.json" <<'EOF'
import json, sys
recs = ["p014", "p015", "p016", "p017", "p018", "p019", "p020", "p001", "p002", "p003", "b001"]
d = sys.argv[1]
json.dump({"records": {r: {"dat": f"{d}/{r}.dat", "hea": f"{d}/{r}.hea"} for r in recs}}, open(sys.argv[2], "w"), indent=1)
EOF
python qc.py --records-map "$OUT/map.json" --manifest "$DATA/SHA256SUMS.txt" --out "$OUT/qc-report.json" \
  --label "QC1-QC5 run once with the frozen qc.py on every scored record of the chest-vibration v2 test: p014-p020 (primary), p001-p003 (secondary), b001 (basal check)"
python causality.py --records-map "$OUT/map.json" --out "$OUT/causality-scored.json" --workers 8
python forecast.py --records-map "$OUT/map.json" --qc-report "$OUT/qc-report.json" --out "$OUT/forecasts"
python lock.py --forecasts "$OUT/forecasts" --qc-report "$OUT/qc-report.json" --freeze FREEZE.json --out "$OUT/SCORE-LOCK.json"
python score.py --lock "$OUT/SCORE-LOCK.json" --forecasts "$OUT/forecasts" --qc-report "$OUT/qc-report.json" \
  --records-map "$OUT/map.json" --out "$OUT/results.json"
```

**What to expect.** The data-check report should have the fingerprint `21231aaf…`. The forecast files should have the fingerprints listed in this folder's `SCORE-LOCK.json`. The new lock file differs from this folder's only in the time it was written (`written_utc`), and the new `results.json` differs from this folder's only in the lock file's fingerprint (`score_lock_sha256`). On the original computer (an AMD Ryzen AI MAX+ 395, 8 threads), the data checks took a few seconds, the test for peeking at the future about 6 minutes and the forecasts about 35 seconds.

**Step 4 (optional): refit the models.** This needs the learning recordings p004 to p013 (`.dat` and `.hea`) from the same release in a folder named in `$FIT` (check them as in step 2, with the pattern `' p0(0[4-9]|1[0-3])\.(dat|hea)$'`), and PyTorch for the MLP models. It repeats the choice of settings and the final fits. `FREEZE.json` (under `reproduction`) records a separate rerun of this sequence that reproduced every table and weight file byte for byte.

```sh
CACHE="$OUT/cache"; DEV="$OUT/development"; PRIV="$OUT/private"
python develop.py grid  --source "$FIT" --cache "$CACHE" --workers 8
python develop.py ridge --cache "$CACHE" --out "$DEV"
for arm in M-ECG M-chest M-delayed; do for seed in 20261127 20261128 20261129; do
  python develop.py mlp --cache "$CACHE" --out "$DEV" --private "$PRIV" --arm "$arm" --seed "$seed"
done; done
python develop.py table --cache "$CACHE" --out "$DEV" --private "$PRIV"
python final_fit.py ridge --cache "$CACHE" --selection "$DEV/selection.json" --out "$OUT/weights"
for arm in M-ECG M-chest M-delayed; do for seed in 20261127 20261128 20261129; do
  python final_fit.py mlp --cache "$CACHE" --selection "$DEV/selection.json" --out "$OUT/weights" \
    --arm "$arm" --seed "$seed" --report "$PRIV"
done; done
```

In order: `grid` computes the beat-timing inputs for every combination of K and theta; `ridge` runs the 27 ridge settings and C4 and writes the ridge choice; the `mlp` loop runs the MLP rounds for each arm and seed; `table` builds the table of the learning people and the final choice (`selection.json`); the two `final_fit.py` steps fit every model on all ten learning people.

## 20. Files in this folder

| File | What it holds |
| --- | --- |
| [PROTOCOL.md](PROTOCOL.md), [PROTOCOL-SIMPLE.md](PROTOCOL-SIMPLE.md), [PROTOCOL.json](PROTOCOL.json) | The plan, fixed before any test data were opened (`PROTOCOL.json` governs) |
| [allocate.py](allocate.py), [ALLOCATION.json](ALLOCATION.json) | Which recording belongs to which group, and every file's fingerprint, from the database's file list |
| [FREEZE.json](FREEZE.json) | Fingerprints of the code, weights and tables, the choice of settings, the learning people's test for peeking at the future, the computing environment and the search of the computer |
| `*.py` | The frozen programs: signal processing, detectors, template, inputs, models, forecasters, measures, choice of settings, final fits, test for peeking at the future, data checks, forecasts, lock and scoring |
| [development/](development) | The learning people's tables and the choice of settings (optimistic) |
| [weights/](weights) | Every fitted model: 7 ridge models and 9 MLP seed models |
| [qc-report.json](qc-report.json), [causality-scored.json](causality-scored.json), [source-verification.json](source-verification.json), [SCORE-LOCK.json](SCORE-LOCK.json) | Committed before scoring |
| [results.json](results.json), [RUN-RECORD.json](RUN-RECORD.json) | The one scoring run and the record of the test stage |
| [detector-check-atr.json](detector-check-atr.json) | The check of the detector against the database's beat marks, made after the results |
| [NOTICE.md](NOTICE.md) | Data credit, licence, citations and our changes |

No participant's recording, template or forecast values are in this folder. The plan also lists, for this stage, a predictor program, invented example inputs, a one-command rerun script, a requirements file and a list of file fingerprints; they are not in this folder yet.

The first version's folder, [`models/chest-vibration`](../chest-vibration), is unchanged. V1F reads its `weights.json` without changing it.

## 21. Every forecaster on every recording, and every 40 ms step

p014 to p020 are the main test people, p001 to p003 the secondary people, and b001 the resting recording. The values come from `results.json` (`records`, then each recording's `arms`).

**Error, RMSE (mV)**

| Forecaster | p014 | p015 | p016 | p017 | p018 | p019 | p020 | p001 | p002 | p003 | b001 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 2.071 | 2.759 | 2.890 | 2.644 | 1.974 | 2.362 | 1.929 | 1.406 | 2.157 | 1.608 | 1.906 |
| C1, repeat the last reading (persistence) | 2.649 | 4.098 | 3.821 | 4.072 | 3.094 | 3.656 | 2.954 | 2.027 | 3.540 | 2.376 | 2.810 |
| C2, extend the recent trend | 7.917 | 11.177 | 12.910 | 9.532 | 8.595 | 8.114 | 8.168 | 6.362 | 9.997 | 6.697 | 8.670 |
| C3, own average heartbeat shape timed by R waves | 1.794 | 2.437 | 2.548 | 2.204 | 1.664 | 1.793 | 1.417 | 1.052 | 1.105 | 1.238 | 1.367 |
| C3d, C3 timed by the ECG from 5.012 s earlier | 2.081 | 2.783 | 2.918 | 2.666 | 1.988 | 2.382 | 1.949 | 1.411 | 2.169 | 1.615 | 1.923 |
| C5, heartbeat shape timed by the chest sensor | 1.876 | 2.656 | 2.763 | 2.359 | 1.894 | 2.087 | 1.848 | 1.410 | 2.049 | 1.616 | 1.869 |
| T-ECG, heartbeat shape timed by R and P waves | 1.090 | 1.197 | 1.256 | 1.442 | 1.043 | 1.016 | 1.056 | 0.689 | 0.860 | 1.049 | 0.784 |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 2.101 | 2.810 | 2.933 | 2.682 | 2.004 | 2.397 | 1.961 | 1.426 | 2.189 | 1.634 | 1.935 |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 1.752 | 2.570 | 2.631 | 2.209 | 1.729 | 1.802 | 1.534 | 1.016 | 1.078 | 1.241 | 1.290 |
| V1F base, first version as published | 2.152 | 2.769 | 2.984 | 2.680 | 1.911 | 2.277 | 1.942 | 1.427 | 2.155 | 1.738 | 1.884 |
| V1F with ECG, as published | 2.395 | 2.916 | 3.022 | 2.821 | 2.023 | 2.430 | 1.749 | 1.358 | 1.984 | 1.782 | 1.738 |
| V1F with delayed ECG, as published | 2.154 | 2.771 | 2.984 | 2.683 | 1.912 | 2.279 | 1.942 | 1.429 | 2.154 | 1.739 | 1.886 |
| V1R base, first version refitted | 2.110 | 2.748 | 2.931 | 2.685 | 1.926 | 2.294 | 1.932 | 1.425 | 2.190 | 1.738 | 1.894 |
| V1R with ECG, refitted | 2.166 | 2.869 | 2.938 | 2.779 | 2.014 | 2.466 | 1.872 | 1.295 | 2.175 | 1.767 | 1.727 |
| V1R with delayed ECG, refitted | 2.112 | 2.748 | 2.932 | 2.687 | 1.926 | 2.295 | 1.932 | 1.426 | 2.192 | 1.739 | 1.896 |
| C4, ridge on 1.2 s of readings | 2.111 | 2.728 | 2.909 | 2.547 | 1.917 | 2.259 | 1.910 | 1.396 | 2.186 | 1.649 | 1.821 |
| R-chest, v2 without ECG (chest twin) | 1.870 | 2.663 | 2.762 | 2.350 | 1.877 | 2.067 | 1.848 | 1.406 | 2.050 | 1.597 | 1.847 |
| **R-ECG, version 2** | 1.087 | 1.204 | 1.254 | 1.445 | 1.041 | 1.013 | 1.052 | 0.683 | 0.857 | 1.031 | 0.774 |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 1.870 | 2.662 | 2.762 | 2.349 | 1.878 | 2.067 | 1.848 | 1.406 | 2.050 | 1.597 | 1.847 |
| M-chest, MLP without ECG | 1.867 | 2.731 | 2.626 | 2.527 | 1.922 | 2.111 | 2.008 | 1.546 | 2.309 | 1.678 | 2.034 |
| M-ECG, MLP with ECG | 1.066 | 1.217 | 1.261 | 1.499 | 1.078 | 1.064 | 1.035 | 0.705 | 0.895 | 0.990 | 0.796 |
| M-delayed, MLP with delayed ECG | 1.868 | 2.740 | 2.637 | 2.515 | 1.915 | 2.168 | 1.998 | 1.547 | 2.327 | 1.686 | 2.053 |

**Error in cal SD (the person's usual spread)**

| Forecaster | p014 | p015 | p016 | p017 | p018 | p019 | p020 | p001 | p002 | p003 | b001 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 0.983 | 0.966 | 0.997 | 1.000 | 1.023 | 0.994 | 1.059 | 0.980 | 0.984 | 1.018 | 1.041 |
| C1, repeat the last reading (persistence) | 1.257 | 1.435 | 1.317 | 1.540 | 1.603 | 1.538 | 1.621 | 1.413 | 1.615 | 1.504 | 1.535 |
| C2, extend the recent trend | 3.758 | 3.913 | 4.452 | 3.606 | 4.452 | 3.414 | 4.483 | 4.433 | 4.559 | 4.238 | 4.737 |
| C3, own average heartbeat shape timed by R waves | 0.851 | 0.853 | 0.879 | 0.834 | 0.862 | 0.755 | 0.778 | 0.733 | 0.504 | 0.784 | 0.747 |
| C3d, C3 timed by the ECG from 5.012 s earlier | 0.988 | 0.975 | 1.006 | 1.009 | 1.030 | 1.002 | 1.070 | 0.983 | 0.989 | 1.022 | 1.051 |
| C5, heartbeat shape timed by the chest sensor | 0.891 | 0.930 | 0.953 | 0.892 | 0.981 | 0.878 | 1.014 | 0.983 | 0.935 | 1.023 | 1.021 |
| T-ECG, heartbeat shape timed by R and P waves | 0.517 | 0.419 | 0.433 | 0.545 | 0.540 | 0.427 | 0.579 | 0.480 | 0.392 | 0.664 | 0.428 |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 0.997 | 0.984 | 1.011 | 1.014 | 1.038 | 1.009 | 1.076 | 0.994 | 0.998 | 1.034 | 1.057 |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 0.831 | 0.900 | 0.907 | 0.836 | 0.895 | 0.758 | 0.842 | 0.708 | 0.492 | 0.785 | 0.705 |
| V1F base, first version as published | 1.021 | 0.969 | 1.029 | 1.014 | 0.990 | 0.958 | 1.066 | 0.994 | 0.983 | 1.100 | 1.029 |
| V1F with ECG, as published | 1.137 | 1.021 | 1.042 | 1.067 | 1.048 | 1.022 | 0.960 | 0.946 | 0.905 | 1.128 | 0.950 |
| V1F with delayed ECG, as published | 1.022 | 0.970 | 1.029 | 1.015 | 0.990 | 0.959 | 1.066 | 0.996 | 0.983 | 1.101 | 1.031 |
| V1R base, first version refitted | 1.002 | 0.962 | 1.011 | 1.016 | 0.998 | 0.965 | 1.060 | 0.993 | 0.999 | 1.100 | 1.035 |
| V1R with ECG, refitted | 1.028 | 1.005 | 1.013 | 1.051 | 1.043 | 1.038 | 1.027 | 0.903 | 0.992 | 1.119 | 0.944 |
| V1R with delayed ECG, refitted | 1.002 | 0.962 | 1.011 | 1.016 | 0.998 | 0.966 | 1.060 | 0.994 | 1.000 | 1.100 | 1.036 |
| C4, ridge on 1.2 s of readings | 1.002 | 0.955 | 1.003 | 0.964 | 0.993 | 0.950 | 1.048 | 0.973 | 0.997 | 1.043 | 0.995 |
| R-chest, v2 without ECG (chest twin) | 0.888 | 0.932 | 0.952 | 0.889 | 0.972 | 0.870 | 1.014 | 0.979 | 0.935 | 1.011 | 1.009 |
| **R-ECG, version 2** | 0.516 | 0.421 | 0.432 | 0.546 | 0.539 | 0.426 | 0.577 | 0.476 | 0.391 | 0.653 | 0.423 |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 0.888 | 0.932 | 0.952 | 0.889 | 0.973 | 0.870 | 1.014 | 0.980 | 0.935 | 1.011 | 1.009 |
| M-chest, MLP without ECG | 0.886 | 0.956 | 0.905 | 0.956 | 0.995 | 0.888 | 1.102 | 1.077 | 1.053 | 1.062 | 1.111 |
| M-ECG, MLP with ECG | 0.506 | 0.426 | 0.435 | 0.567 | 0.558 | 0.448 | 0.568 | 0.491 | 0.408 | 0.627 | 0.435 |
| M-delayed, MLP with delayed ECG | 0.887 | 0.959 | 0.909 | 0.951 | 0.992 | 0.912 | 1.097 | 1.078 | 1.061 | 1.067 | 1.122 |

**Average size of a miss, MAE (mV)**

| Forecaster | p014 | p015 | p016 | p017 | p018 | p019 | p020 | p001 | p002 | p003 | b001 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 1.308 | 1.571 | 1.752 | 1.952 | 1.417 | 1.612 | 1.365 | 1.061 | 1.444 | 1.244 | 1.430 |
| C1, repeat the last reading (persistence) | 1.846 | 2.596 | 2.642 | 2.968 | 2.366 | 2.684 | 2.118 | 1.603 | 2.389 | 1.870 | 2.147 |
| C2, extend the recent trend | 5.421 | 6.687 | 8.017 | 6.753 | 6.060 | 5.935 | 5.874 | 4.834 | 6.607 | 5.143 | 6.567 |
| C3, own average heartbeat shape timed by R waves | 0.888 | 1.180 | 1.209 | 1.429 | 1.019 | 1.008 | 0.898 | 0.695 | 0.790 | 0.955 | 0.839 |
| C3d, C3 timed by the ECG from 5.012 s earlier | 1.330 | 1.613 | 1.791 | 1.966 | 1.430 | 1.637 | 1.385 | 1.068 | 1.458 | 1.254 | 1.444 |
| C5, heartbeat shape timed by the chest sensor | 1.060 | 1.364 | 1.472 | 1.590 | 1.292 | 1.285 | 1.289 | 1.068 | 1.288 | 1.257 | 1.411 |
| T-ECG, heartbeat shape timed by R and P waves | 0.695 | 0.721 | 0.805 | 1.085 | 0.760 | 0.726 | 0.732 | 0.515 | 0.652 | 0.854 | 0.565 |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | 1.356 | 1.644 | 1.813 | 1.969 | 1.445 | 1.656 | 1.399 | 1.082 | 1.481 | 1.269 | 1.462 |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 0.935 | 1.264 | 1.283 | 1.469 | 1.075 | 1.025 | 0.952 | 0.687 | 0.777 | 0.963 | 0.823 |
| V1F base, first version as published | 1.396 | 1.597 | 1.784 | 1.988 | 1.339 | 1.543 | 1.422 | 1.064 | 1.471 | 1.369 | 1.417 |
| V1F with ECG, as published | 1.573 | 1.764 | 1.797 | 2.064 | 1.449 | 1.665 | 1.305 | 1.021 | 1.402 | 1.426 | 1.300 |
| V1F with delayed ECG, as published | 1.399 | 1.605 | 1.787 | 1.991 | 1.340 | 1.546 | 1.423 | 1.066 | 1.472 | 1.371 | 1.421 |
| V1R base, first version refitted | 1.354 | 1.575 | 1.748 | 1.995 | 1.362 | 1.569 | 1.400 | 1.070 | 1.489 | 1.368 | 1.432 |
| V1R with ECG, refitted | 1.422 | 1.728 | 1.734 | 2.050 | 1.453 | 1.692 | 1.358 | 0.979 | 1.502 | 1.395 | 1.312 |
| V1R with delayed ECG, refitted | 1.355 | 1.574 | 1.749 | 1.998 | 1.362 | 1.569 | 1.400 | 1.071 | 1.491 | 1.369 | 1.436 |
| C4, ridge on 1.2 s of readings | 1.366 | 1.565 | 1.741 | 1.853 | 1.365 | 1.516 | 1.377 | 1.056 | 1.488 | 1.297 | 1.382 |
| R-chest, v2 without ECG (chest twin) | 1.062 | 1.375 | 1.467 | 1.585 | 1.290 | 1.273 | 1.299 | 1.069 | 1.296 | 1.242 | 1.400 |
| **R-ECG, version 2** | 0.694 | 0.727 | 0.807 | 1.083 | 0.757 | 0.728 | 0.730 | 0.512 | 0.649 | 0.838 | 0.563 |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 1.062 | 1.375 | 1.467 | 1.586 | 1.290 | 1.274 | 1.297 | 1.068 | 1.296 | 1.242 | 1.399 |
| M-chest, MLP without ECG | 1.124 | 1.557 | 1.480 | 1.786 | 1.349 | 1.378 | 1.412 | 1.144 | 1.486 | 1.288 | 1.515 |
| M-ECG, MLP with ECG | 0.696 | 0.757 | 0.827 | 1.136 | 0.781 | 0.778 | 0.723 | 0.533 | 0.673 | 0.801 | 0.585 |
| M-delayed, MLP with delayed ECG | 1.137 | 1.553 | 1.490 | 1.771 | 1.347 | 1.426 | 1.398 | 1.163 | 1.497 | 1.304 | 1.566 |

**Reduction against the usual level C0 (100 × skill)**

| Forecaster | p014 | p015 | p016 | p017 | p018 | p019 | p020 | p001 | p002 | p003 | b001 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0, the person's usual level (calibration mean) | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| C1, repeat the last reading (persistence) | −27.9% | −48.5% | −32.2% | −54.0% | −56.7% | −54.8% | −53.1% | −44.2% | −64.1% | −47.8% | −47.5% |
| C2, extend the recent trend | −282.3% | −305.1% | −346.7% | −260.4% | −335.3% | −243.6% | −323.4% | −352.6% | −363.4% | −316.5% | −354.9% |
| C3, own average heartbeat shape timed by R waves | 13.4% | 11.7% | 11.8% | 16.7% | 15.7% | 24.1% | 26.5% | 25.2% | 48.8% | 23.0% | 28.3% |
| C3d, C3 timed by the ECG from 5.012 s earlier | −0.5% | −0.9% | −1.0% | −0.8% | −0.7% | −0.9% | −1.0% | −0.4% | −0.6% | −0.4% | −0.9% |
| C5, heartbeat shape timed by the chest sensor | 9.4% | 3.7% | 4.4% | 10.8% | 4.1% | 11.6% | 4.2% | −0.3% | 5.0% | −0.5% | 1.9% |
| T-ECG, heartbeat shape timed by R and P waves | 47.4% | 56.6% | 56.6% | 45.5% | 47.1% | 57.0% | 45.3% | 51.0% | 60.1% | 34.8% | 58.9% |
| T-delayed, T-ECG from the ECG of 5.012 s earlier | −1.5% | −1.9% | −1.5% | −1.4% | −1.5% | −1.5% | −1.6% | −1.5% | −1.5% | −1.6% | −1.5% |
| T-R, heartbeat shape timed by R waves only (v2's detector) | 15.4% | 6.9% | 9.0% | 16.5% | 12.4% | 23.7% | 20.5% | 27.7% | 50.0% | 22.8% | 32.3% |
| V1F base, first version as published | −3.9% | −0.4% | −3.2% | −1.3% | 3.2% | 3.6% | −0.7% | −1.5% | 0.1% | −8.1% | 1.2% |
| V1F with ECG, as published | −15.7% | −5.7% | −4.5% | −6.7% | −2.5% | −2.9% | 9.3% | 3.4% | 8.0% | −10.8% | 8.8% |
| V1F with delayed ECG, as published | −4.0% | −0.4% | −3.2% | −1.5% | 3.1% | 3.5% | −0.6% | −1.6% | 0.1% | −8.2% | 1.0% |
| V1R base, first version refitted | −1.9% | 0.4% | −1.4% | −1.5% | 2.4% | 2.8% | −0.1% | −1.4% | −1.5% | −8.1% | 0.6% |
| V1R with ECG, refitted | −4.6% | −4.0% | −1.6% | −5.1% | −2.0% | −4.4% | 3.0% | 7.9% | −0.8% | −9.9% | 9.4% |
| V1R with delayed ECG, refitted | −2.0% | 0.4% | −1.4% | −1.6% | 2.5% | 2.8% | −0.1% | −1.4% | −1.6% | −8.1% | 0.5% |
| C4, ridge on 1.2 s of readings | −1.9% | 1.1% | −0.7% | 3.7% | 2.9% | 4.4% | 1.0% | 0.7% | −1.3% | −2.5% | 4.4% |
| R-chest, v2 without ECG (chest twin) | 9.7% | 3.5% | 4.4% | 11.1% | 4.9% | 12.5% | 4.2% | 0.0% | 5.0% | 0.7% | 3.1% |
| **R-ECG, version 2** | 47.5% | 56.4% | 56.6% | 45.4% | 47.3% | 57.1% | 45.5% | 51.4% | 60.3% | 35.9% | 59.4% |
| R-delayed, v2 with ECG from 5.012 s earlier (delayed twin) | 9.7% | 3.5% | 4.4% | 11.2% | 4.9% | 12.5% | 4.2% | −0.0% | 5.0% | 0.7% | 3.1% |
| M-chest, MLP without ECG | 9.9% | 1.0% | 9.1% | 4.5% | 2.7% | 10.6% | −4.1% | −10.0% | −7.0% | −4.3% | −6.7% |
| M-ECG, MLP with ECG | 48.5% | 55.9% | 56.4% | 43.3% | 45.4% | 54.9% | 46.3% | 49.9% | 58.5% | 38.4% | 58.2% |
| M-delayed, MLP with delayed ECG | 9.8% | 0.7% | 8.7% | 4.9% | 3.0% | 8.2% | −3.6% | −10.0% | −7.9% | −4.8% | −7.7% |

**Error by where the target falls after the last available R wave, every 40 ms step** (`results.json`, `records`, then each recording's `error_by_position_after_last_R`; the seven main test people). Each row is one step of the target's position: the time from the last R wave that version 2's detector had found by the cutoff to the target. For each step, a forecaster's error is the average over the people who have forecasts in that step, in mV. "People" counts those people and "Forecasts" is their total number of forecasts in the step. Steps with few forecasts give unsteady values.

| Target position after the last R wave | Version 2 | T-ECG | C3 | C0 (usual level) | People | Forecasts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0–40 ms | – | – | – | – | 0 | 0 |
| 40–80 ms | – | – | – | – | 0 | 0 |
| 80–120 ms | 1.154 | 1.135 | 1.136 | 2.774 | 7 | 8,071 |
| 120–160 ms | 0.873 | 0.854 | 0.860 | 2.690 | 7 | 16,320 |
| 160–200 ms | 0.736 | 0.736 | 0.730 | 1.870 | 7 | 16,320 |
| 200–240 ms | 0.764 | 0.770 | 0.761 | 1.227 | 7 | 16,319 |
| 240–280 ms | 0.698 | 0.701 | 0.693 | 1.071 | 7 | 16,312 |
| 280–320 ms | 0.672 | 0.676 | 0.671 | 1.106 | 7 | 16,308 |
| 320–360 ms | 1.003 | 1.007 | 0.998 | 1.483 | 7 | 16,300 |
| 360–400 ms | 1.604 | 1.607 | 1.615 | 2.772 | 7 | 16,291 |
| 400–440 ms | 1.071 | 1.076 | 1.084 | 1.822 | 7 | 16,290 |
| 440–480 ms | 0.877 | 0.885 | 0.896 | 1.872 | 7 | 16,296 |
| 480–520 ms | 0.941 | 0.948 | 0.950 | 1.412 | 7 | 16,310 |
| 520–560 ms | 0.774 | 0.780 | 0.778 | 1.322 | 7 | 16,328 |
| 560–600 ms | 0.753 | 0.755 | 0.749 | 1.069 | 7 | 16,330 |
| 600–640 ms | 0.807 | 0.808 | 0.795 | 0.899 | 7 | 16,330 |
| 640–680 ms | 0.740 | 0.742 | 0.796 | 0.901 | 7 | 16,339 |
| 680–720 ms | 0.846 | 0.846 | 1.089 | 1.175 | 7 | 16,323 |
| 720–760 ms | 1.077 | 1.073 | 1.485 | 1.553 | 7 | 16,163 |
| 760–800 ms | 1.241 | 1.236 | 1.940 | 1.998 | 7 | 15,684 |
| 800–840 ms | 1.279 | 1.278 | 2.337 | 2.399 | 7 | 14,987 |
| 840–880 ms | 1.442 | 1.445 | 3.140 | 3.184 | 7 | 13,966 |
| 880–920 ms | 1.528 | 1.524 | 3.849 | 3.902 | 7 | 12,357 |
| 920–960 ms | 1.754 | 1.750 | 4.432 | 4.544 | 7 | 9,849 |
| 960–1,000 ms | 1.858 | 1.856 | 4.569 | 4.891 | 7 | 7,125 |
| 1,000–1,040 ms | 2.103 | 2.115 | 4.429 | 4.907 | 7 | 4,143 |
| 1,040–1,080 ms | 1.750 | 1.748 | 3.968 | 5.011 | 7 | 1,907 |
| 1,080–1,120 ms | 2.235 | 2.244 | 4.058 | 4.842 | 6 | 733 |
| 1,120–1,160 ms | 2.294 | 2.310 | 4.022 | 4.552 | 5 | 211 |
| 1,160–1,200 ms | 2.135 | 2.059 | 2.302 | 4.694 | 4 | 52 |
| 1.2 s or later, or no beat | 3.420 | 3.407 | 6.533 | 6.701 | 1 | 36 |
