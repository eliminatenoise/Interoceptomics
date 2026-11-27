# Chest-vibration forecast, version 2: results

Technical edition of the results of protocol version 1. [Simple edition](README-SIMPLE.md) · [Protocol](PROTOCOL.md) · [Protocol, Simple edition](PROTOCOL-SIMPLE.md) · [PROTOCOL.json](PROTOCOL.json) · [results.json](results.json) · [Data credit and licence](NOTICE.md)

Version 2 forecasts the output voltage of a chest-vibration sensor (seismocardiogram, SCG) 80 ms ahead, in sensor millivolts, from earlier readings of the same person's SCG, breathing band (RESP) and ECG lead II. It was fitted on ten people of the CEBS database (p004-p013) and scored once on seven people whom no model had seen (p014-p020). Their files were downloaded only after the protocol and the frozen models were public on GitHub. By the rules fixed in the protocol, all three verdicts are supported (n = 7 people passing the data checks, k = 6 wins needed).

- Mean person RMSE was **1.156 mV** for version 2 (0.494 in units of each person's calibration SD). Version 1 re-fitted on the same ten people (V1R base) scored 2.375 mV, each person's calibration mean (C0) 2.376 mV, and the R-only rolling heartbeat template (C3) 1.980 mV.
- Version 2's error was lower than V1R base's for 7 of 7 people, by 50.8% on average (95% bootstrap interval 47.3 to 54.7%; range 45.6 to 57.2%). Against C3 it was lower for 7 of 7, by 40.3% (34.0 to 46.2%).
- Most of the gain comes from the ECG-timed beat template with P-wave anticipation, which has no fitted weights. That template alone (T-ECG) scored 1.157 mV, and the ridge model on top lowered person RMSE by a further 0.08% on average (−0.18 to 0.28%). Within one detector, P-wave anticipation lowered the error by 41.8% against the same template timed by R waves only (T-R, 2.032 mV).
- Scope: presumed healthy volunteers lying supine and still, in the five-minute recording made after about 50 minutes of classical music (scored from 90 to 290 s into it), in one laboratory with one acquisition system. SCG and RESP are sensor voltages, not acceleration, chest displacement or lung volume. Nothing here measures signals in sensory nerves (afferent signalling) or anything a person felt. The R and P detector constants were set by inspecting three fitting people (p004, p007, p008). Every input and target is measured; nothing is simulated.

## Contents

1. [Terms](#1-terms)
2. [The model and the controls](#2-the-model-and-the-controls)
3. [Order of events and the hash chain](#3-order-of-events-and-the-hash-chain)
4. [Verdicts](#4-verdicts)
5. [Results per person](#5-results-per-person)
6. [Every arm on the seven primary people](#6-every-arm-on-the-seven-primary-people)
7. [Every predeclared comparison](#7-every-predeclared-comparison)
8. [Descriptive results](#8-descriptive-results)
9. [The 90-120 s interval](#9-the-90-120-s-interval)
10. [Secondary people p001-p003, the pooled ten and b001](#10-secondary-people-p001-p003-the-pooled-ten-and-b001)
11. [Development results inside the fitting people (optimistic)](#11-development-results-inside-the-fitting-people-optimistic)
12. [After-the-fact check of version 1 (descriptive)](#12-after-the-fact-check-of-version-1-descriptive)
13. [Data, download and integrity checks](#13-data-download-and-integrity-checks)
14. [Deviations and departures](#14-deviations-and-departures)
15. [Limits](#15-limits)
16. [Measured, derived, predicted and simulated values](#16-measured-derived-predicted-and-simulated-values)
17. [How to rerun](#17-how-to-rerun)
18. [Files](#18-files)
19. [Appendix: every arm on every scored record, and every 40 ms bin](#19-appendix-every-arm-on-every-scored-record-and-every-40-ms-bin)

## 1. Terms

- **Cutoff t:** the 250 Hz grid index at which a forecast is issued. Only readings up to t enter any input, detector, template or calibration used for that forecast. The target is the filtered SCG reading at t + 20 (80 ms later; its native support is 40-80 ms after the cutoff).
- **cal SD:** the person's SCG standard deviation over the calibration interval, 60-80 s, in mV. RMSE / cal SD is the error in z units and makes people with large and small signals comparable.
- **RMSE, MAE:** root mean squared error and mean absolute error over a person's valid cutoffs, in SCG mV. RMSE is the primary metric.
- **Relative reduction:** for one person, 100 × (comparator RMSE − model RMSE) / comparator RMSE. Positive means the model's error is lower. A **win** is a person with a strictly positive reduction.
- **Skill:** for one record, 1 − arm RMSE / C0 RMSE. 100 × skill is the arm's relative reduction against C0.
- **Bootstrap interval:** a paired bootstrap over people, 10,000 resamples, `numpy.random.default_rng(20261127)`, one index matrix per scoring group; percentile 95% interval. With seven people it is coarse.
- **R wave, P wave:** the tall spike of each heartbeat in the ECG, and the small wave about 130-160 ms before it.
- **Arm:** one forecaster in the comparison. The arms are listed in section 2.
- **QC1-QC5:** the five predeclared data-integrity checks on each scored record: file hashes, header, valid readings, runs of identical values and clipping. Their thresholds are in section 13.

Cutoffs within a person overlap and are serially dependent. People are the unit of replication; every mean below weights each person once. In the tables, −0.0% marks a value below zero that rounds to 0.0%.

## 2. The model and the controls

**Version 2 is R-ECG**: a ridge regression on 119 inputs, made of version 1's lags (block B0: SCG lags 0-50 and RESP lags 0-50, 102 columns), a chest-only beat-template block (B2, 4 columns) and an ECG beat-phase block (B3, 13 columns). B3 comes from a causal R-wave detector on ECG lead II, a beat template of the person's own recent SCG (the mean over the last 33 beats, K = 32) and a P-wave search that predicts the next R wave when the P-wave correlation reaches theta = 0.9. The ridge penalty is 0.001. The target is SCG in the person's z units, decoded to mV with the person's calibration mean and SD. The full definitions are in [PROTOCOL.md](PROTOCOL.md) sections 7-12.

**How it was chosen.** Every choice used leave-one-person-out folds inside p004-p013 only:

- Of the 27 R-ECG settings (K 8, 16, 32 × theta 0.7, 0.8, 0.9 × penalty 0.001, 0.02, 0.1), K 32, theta 0.9, penalty 0.001 had the lowest mean person RMSE, 1.3886 mV. The default (K 16, theta 0.8, penalty 0.02) scored 1.4189 mV, 2.18% higher, outside the 1% rule, so the lowest setting was chosen.
- The multilayer perceptron (MLP, a small neural network; see the table below) family (M-ECG, mean of three seeds) scored 1.4051 mV. The rule chose the MLP only below 0.99 × 1.3886 = 1.3748 mV, so the ridge family was chosen.
- The chest twin (R-chest, B0 + B2) and the delayed twin (R-delayed, B0 + B2 + B3 from ECG delayed 5.012 s) use the same K and penalty, and the delayed twin the same theta. T-ECG, T-delayed, T-R and C5 use K 32 and theta 0.9.
- C4's penalty stayed at the default 0.02 (2.8357 mV, within 1% of the lowest, penalty 1 at 2.8313 mV). V1R keeps version 1's penalty 0.02.

**The arms** (all scored on identical cutoffs of every record):

| Arm | What it is |
| --- | --- |
| C0 | The person's SCG calibration mean (climatology). |
| C1 | Persistence: the last filtered SCG reading. |
| C2 | Linear trend: least-squares line through the last 13 SCG readings (48 ms), extended 80 ms. |
| C3, C3d | R-only rolling personal template from an independently built detector, with aligned ECG and with ECG delayed 5.012 s. No fitted weights. |
| C5 | Chest-only template (B2's continuation). No fitted weights. |
| T-ECG, T-delayed | The template forecast with P-wave anticipation, from aligned and from delayed ECG. No fitted weights. |
| T-R | B3's continuation: the R-timed template without P-wave anticipation, from version 2's own detector. Descriptive. |
| V1F base, aligned, delayed | Version 1's published weights (`weights.json`, SHA-256 `55a78c3d…3366d8a`), applied unchanged. |
| V1R base, aligned, delayed | Version 1's features and ridge (penalty 0.02) re-fitted on p004-p013 over the same cutoffs. V1R base is P1's comparator. |
| C4 | Ridge on one cardiac cycle (SCG lags 0-299, RESP lags 0-295 in steps of 5). |
| R-chest, R-ECG, R-delayed | Ridge on B0 + B2, B0 + B2 + B3, B0 + B2 + B3d. **R-ECG is version 2.** |
| M-chest, M-ECG, M-delayed | Multilayer perceptron (MLP: two hidden layers of 64 units with the GELU activation, the Gaussian error linear unit) on the same blocks, mean of seeds 20261127-20261129. |

The NeuroTranslate 0.0 and 0.1 checkpoints accept no ECG, SCG or breathing-band input, so they are not an arm. No shared encoder is claimed, so the random-encoder control does not apply.

## 3. Order of events and the hash chain

All times are UTC on 27 November 2026.

| Step | Time | Record |
| --- | --- | --- |
| Protocol commit `b0ffe4d`, admitted by a separate reviewer, pushed to main with three later commits (`c64e6e7`, `0c93c5a`, `2b0c9a1`) that add and then edit only `PROTOCOL-SIMPLE.md` | pushed 10:54:02 | `PROTOCOL.json` `4889fa5e…`, `PROTOCOL.md` `daaaa923…`, `ALLOCATION.json` `2654580c…` |
| Freeze commit `1dd00a4`, admitted by a separate reviewer | pushed 12:23:21 | `FREEZE.json` `13ff5a16…6eb7b48` |
| Precondition: GitHub main equals `1dd00a4`, and `b0ffe4d` is its ancestor | 12:27:56 | `source-verification.json` |
| Download of the manifest and the 16 `.dat`/`.hea` files of p014-p020 and p001 | 12:27:56-12:30:51 | `source-verification.json` |
| QC1-QC5 with the frozen `qc.py`; report sealed before any forecast | 12:31:15 | `qc-report.json` `21231aaf…` |
| Causality test on the 11 scored records, reading no target | 12:31:34-12:37:29 | `causality-scored.json` `01a7943f…` |
| Forecasts of every arm (kept private) | 12:37:45-12:38:19 | hashed in `SCORE-LOCK.json` |
| `SCORE-LOCK.json` written; committed in `78e18dc` | 12:38:34; 12:38:44 | `SCORE-LOCK.json` `72a039ba…` |
| The one scoring run, frozen `score.py`, separate process | 12:38:54 | `results.json` `b4e2774c…` |
| Results committed in `c6b600c` | 12:40:01 | `RUN-RECORD.json` |
| p014-p020 `.atr` fetched for the descriptive detector check; committed in `7a54129` | 12:40:18-12:40:50 | `detector-check-atr.json` |

The reviewer admitted the freeze in an earlier commit with the same content. That commit was rebased onto `2b0c9a1` before it was pushed, which changed its id to `1dd00a4` and left every file, and the `FREEZE.json` hash, unchanged. The push times are those of GitHub's activity record.

`results.json` records the protocol commit, the four protocol-file hashes, and the hashes of `FREEZE.json`, `SCORE-LOCK.json` and `qc-report.json`. `SCORE-LOCK.json` holds the SHA-256 of the 23 forecast files (a JSON and an NPZ file per record, plus a list of skipped records, which is empty), the QC report, `FREEZE.json`, the 12 scoring-code files and the 16 weight files. `score.py` checked every hash in the lock before it read any target. All 44 frozen files (43 hashed in `FREEZE.json`, plus `FREEZE.json`) matched before the download and again after scoring.

**Independent result review (protocol step 7).** A separate reviewer reran the frozen `qc.py`, `forecast.py` and `score.py` and obtained a byte-identical QC report, the 23 locked forecast files byte for byte, and a byte-identical `results.json`. It also wrote its own QC and scoring code from the protocol text without importing any frozen module: QC values and row masks were identical, 7,947 values of `results.json` agreed within 1e-12, and its own C0, C1, C2, V1R and V1F forecasts agreed with the locked ones within 4.3e-14 mV. Its own truncation check at 242 cutoffs chosen independently of `causality.py` (22 per record, including detector-availability and P-acceptance edges) found no change. It found no blocker and no major problem. Its minor points concern departures 3 to 5 (section 14) and three descriptive facts, all reported here: T-ECG scored about the same as v2 (section 8.1), R-delayed scored the same as R-chest, and the chest-only detector over-counts beats in some records (both in section 8.3).

## 4. Verdicts

All 7 primary people passed QC1-QC5, so n = 7 and k(7) = ceil(0.8 × 7) = 6. "v2 beats X" holds when the mean relative reduction against X is above 0, at least 6 of the 7 people are wins, and the lower bound of its bootstrap 95% interval is above 0.

| Verdict | Comparison | Mean reduction [95% interval] | Wins | Rule | Outcome |
| --- | --- | ---: | ---: | --- | --- |
| P1 | v2 vs V1R base (P1) | 50.8% [47.3, 54.7] | 7 of 7 | mean ≥ 10%, ≥ 6 wins, lower bound > 0 | supported |
| P1 | v2 vs C0 (P1) | 50.8% [47.3, 55.0] | 7 of 7 | mean > 0, ≥ 6 wins | supported |
| P2 | v2 vs chest twin R-chest (P2) | 46.9% [42.5, 51.4] | 7 of 7 | mean > 0, ≥ 6 wins, lower bound > 0 | supported |
| P2 | v2 vs delayed twin R-delayed (P2) | 46.9% [42.5, 51.4] | 7 of 7 | mean > 0, ≥ 6 wins, lower bound > 0 | supported |
| P3 | v2 vs C3 (P3) | 40.3% [34.0, 46.2] | 7 of 7 | mean > 0, ≥ 6 wins, lower bound > 0 | supported |

- **P1, v2 beats version 1: supported.** v2 beats V1R base with a mean reduction of at least 10%, and against C0 the mean reduction is above 0 with at least 6 wins. The C0 condition has no interval condition; its interval is shown for completeness.
- **P2, ECG timing adds information: supported.** v2 beats its chest twin and its delayed twin. The two comparisons are almost the same test, because the delayed twin scored like the chest twin (section 8.3).
- **P3, v2 beats the R-only template: supported.**

The verdicts are statements about these seven people under the predeclared rule. They carry no significance claim and no claim about people in general.

## 5. Results per person

RMSE in SCG mV over the 50,000 valid cutoffs of each person (90 ≤ t < 290 s). The last column is v2's relative reduction against V1R base.

| Person | cal SD (mV) | v2 RMSE (mV) | v2 RMSE (cal SD) | V1R base | C0 | C3 | R-chest | R-delayed | v2 vs V1R base |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| p014 | 2.107 | 1.087 | 0.516 | 2.110 | 2.071 | 1.794 | 1.870 | 1.870 | 48.5% |
| p015 | 2.856 | 1.204 | 0.421 | 2.748 | 2.759 | 2.437 | 2.663 | 2.662 | 56.2% |
| p016 | 2.900 | 1.254 | 0.432 | 2.931 | 2.890 | 2.548 | 2.762 | 2.762 | 57.2% |
| p017 | 2.644 | 1.445 | 0.546 | 2.685 | 2.644 | 2.204 | 2.350 | 2.349 | 46.2% |
| p018 | 1.931 | 1.041 | 0.539 | 1.926 | 1.974 | 1.664 | 1.877 | 1.878 | 46.0% |
| p019 | 2.377 | 1.013 | 0.426 | 2.294 | 2.362 | 1.793 | 2.067 | 2.067 | 55.8% |
| p020 | 1.822 | 1.052 | 0.577 | 1.932 | 1.929 | 1.417 | 1.848 | 1.848 | 45.6% |
| Mean of 7 | – | 1.156 | 0.494 | 2.375 | 2.376 | 1.980 | 2.205 | 2.205 | 50.8% |

Per-person relative reductions of v2 in the five verdict comparisons:

| Person | vs V1R base | vs C0 | vs R-chest | vs R-delayed | vs C3 |
| --- | ---: | ---: | ---: | ---: | ---: |
| p014 | 48.5% | 47.5% | 41.9% | 41.9% | 39.4% |
| p015 | 56.2% | 56.4% | 54.8% | 54.8% | 50.6% |
| p016 | 57.2% | 56.6% | 54.6% | 54.6% | 50.8% |
| p017 | 46.2% | 45.4% | 38.5% | 38.5% | 34.5% |
| p018 | 46.0% | 47.3% | 44.6% | 44.6% | 37.5% |
| p019 | 55.8% | 57.1% | 51.0% | 51.0% | 43.5% |
| p020 | 45.6% | 45.5% | 43.1% | 43.1% | 25.8% |

## 6. Every arm on the seven primary people

Mean, median and range over the seven people; the interval is the bootstrap 95% interval of the mean RMSE. "Mean reduction vs C0" is the mean per-person relative reduction against the calibration mean (equal to 100 × the mean skill against C0).

| Arm | Mean RMSE (mV) | 95% interval | Median | Range | Mean RMSE (cal SD) | Mean MAE (mV) | Mean reduction vs C0 | Wins vs C0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0 calibration mean | 2.376 | [2.106, 2.647] | 2.362 | 1.929–2.890 | 1.003 | 1.568 | 0.0% | – |
| C1 persistence | 3.478 | [3.071, 3.852] | 3.656 | 2.649–4.098 | 1.473 | 2.460 | −46.8% | 0 of 7 |
| C2 linear trend | 9.488 | [8.312, 10.886] | 8.595 | 7.917–12.910 | 4.011 | 6.392 | −299.6% | 0 of 7 |
| C3 R-only rolling template | 1.980 | [1.703, 2.267] | 1.794 | 1.417–2.548 | 0.830 | 1.090 | 17.1% | 7 of 7 |
| C3d, C3 with ECG delayed 5.012 s | 2.395 | [2.123, 2.670] | 2.382 | 1.949–2.918 | 1.011 | 1.593 | −0.8% | 0 of 7 |
| C5 chest-only template | 2.212 | [1.967, 2.485] | 2.087 | 1.848–2.763 | 0.934 | 1.336 | 6.9% | 7 of 7 |
| T-ECG template forecast with P wave | 1.157 | [1.064, 1.270] | 1.090 | 1.016–1.442 | 0.495 | 0.789 | 50.8% | 7 of 7 |
| T-delayed, T-ECG from ECG delayed 5.012 s | 2.413 | [2.139, 2.689] | 2.397 | 1.961–2.933 | 1.019 | 1.612 | −1.6% | 0 of 7 |
| T-R R-timed template, no P wave | 2.032 | [1.748, 2.340] | 1.802 | 1.534–2.631 | 0.853 | 1.143 | 14.9% | 7 of 7 |
| V1F base (published v1) | 2.388 | [2.107, 2.682] | 2.277 | 1.911–2.984 | 1.007 | 1.581 | −0.4% | 2 of 7 |
| V1F aligned ECG (published v1) | 2.479 | [2.149, 2.791] | 2.430 | 1.749–3.022 | 1.042 | 1.660 | −4.1% | 1 of 7 |
| V1F delayed ECG (published v1) | 2.389 | [2.108, 2.684] | 2.279 | 1.912–2.984 | 1.007 | 1.585 | −0.5% | 2 of 7 |
| V1R base (v1 re-fitted) | 2.375 | [2.098, 2.661] | 2.294 | 1.926–2.931 | 1.002 | 1.572 | 0.1% | 3 of 7 |
| V1R aligned ECG (v1 re-fitted) | 2.443 | [2.145, 2.738] | 2.466 | 1.872–2.938 | 1.029 | 1.634 | −2.7% | 1 of 7 |
| V1R delayed ECG (v1 re-fitted) | 2.376 | [2.098, 2.662] | 2.295 | 1.926–2.932 | 1.002 | 1.572 | 0.1% | 3 of 7 |
| C4 one-cycle ridge | 2.340 | [2.081, 2.620] | 2.259 | 1.910–2.909 | 0.988 | 1.540 | 1.5% | 5 of 7 |
| R-chest (chest twin) | 2.205 | [1.957, 2.480] | 2.067 | 1.848–2.762 | 0.931 | 1.336 | 7.2% | 7 of 7 |
| **R-ECG = v2** | 1.156 | [1.061, 1.271] | 1.087 | 1.013–1.445 | 0.494 | 0.790 | 50.8% | 7 of 7 |
| R-delayed (delayed twin) | 2.205 | [1.957, 2.480] | 2.067 | 1.848–2.762 | 0.931 | 1.336 | 7.2% | 7 of 7 |
| M-chest (MLP) | 2.256 | [2.021, 2.509] | 2.111 | 1.867–2.731 | 0.956 | 1.441 | 4.8% | 6 of 7 |
| M-ECG (MLP) | 1.174 | [1.076, 1.301] | 1.078 | 1.035–1.499 | 0.501 | 0.814 | 50.1% | 7 of 7 |
| M-delayed (MLP) | 2.263 | [2.023, 2.514] | 2.168 | 1.868–2.740 | 0.958 | 1.446 | 4.5% | 6 of 7 |

## 7. Every predeclared comparison

Primary group, n = 7. Mean, median and range of the per-person relative reduction, wins, and the mean difference in RMSE (comparator minus model, mV), each with its bootstrap 95% interval.

| Comparison (model vs comparator) | Mean reduction | 95% interval | Median | Range | Wins | Mean difference (mV) | 95% interval (mV) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v2 vs V1R base (P1) | 50.8% | [47.3, 54.7] | 48.5% | 45.6 to 57.2% | 7 of 7 | 1.219 | [1.011, 1.439] |
| v2 vs C0 (P1) | 50.8% | [47.3, 55.0] | 47.5% | 45.4 to 57.1% | 7 of 7 | 1.219 | [1.016, 1.430] |
| v2 vs chest twin R-chest (P2) | 46.9% | [42.5, 51.4] | 44.6% | 38.5 to 54.8% | 7 of 7 | 1.049 | [0.848, 1.278] |
| v2 vs delayed twin R-delayed (P2) | 46.9% | [42.5, 51.4] | 44.6% | 38.5 to 54.8% | 7 of 7 | 1.049 | [0.849, 1.278] |
| v2 vs C3 (P3) | 40.3% | [34.0, 46.2] | 39.4% | 25.8 to 50.8% | 7 of 7 | 0.823 | [0.604, 1.052] |
| v2 vs T-ECG (learned stacking) | 0.1% | [−0.2, 0.3] | 0.3% | −0.6 to 0.4% | 5 of 7 | 0.001 | [−0.002, 0.003] |
| T-ECG vs T-R (P-wave anticipation) | 41.8% | [36.1, 47.8] | 39.6% | 31.2 to 53.4% | 7 of 7 | 0.875 | [0.649, 1.119] |
| T-R vs C3 (detector and template) | −2.7% | [−5.2, −0.3] | −3.2% | −8.2 to 2.3% | 1 of 7 | −0.053 | [−0.096, −0.008] |
| M-ECG vs R-ECG (MLP vs ridge) | −1.5% | [−3.3, 0.4] | −1.1% | −5.1 to 2.0% | 2 of 7 | −0.018 | [−0.038, 0.003] |
| V1R aligned vs V1R base | −2.8% | [−5.0, −0.3] | −3.5% | −7.5 to 3.1% | 1 of 7 | −0.068 | [−0.118, −0.013] |
| V1R aligned vs V1R delayed | −2.8% | [−5.0, −0.3] | −3.5% | −7.5 to 3.1% | 1 of 7 | −0.068 | [−0.117, −0.013] |
| T-ECG vs T-delayed | 51.5% | [48.0, 55.8] | 48.1% | 46.2 to 57.6% | 7 of 7 | 1.256 | [1.046, 1.472] |
| C3 vs C3d | 17.8% | [14.0, 22.1] | 16.3% | 12.5 to 27.3% | 7 of 7 | 0.416 | [0.341, 0.496] |

## 8. Descriptive results

Everything in this section is descriptive: no verdict, no significance claim.

### 8.1 Where the gain comes from

- **Learned stacking adds almost nothing.** v2 against T-ECG: +0.08% on average (−0.18 to 0.28%), 5 of 7 wins, mean difference 0.001 mV. The template forecast with P-wave anticipation, which has no fitted weights, carries the result.
- **P-wave anticipation, within one detector.** T-ECG against T-R: 41.8% (36.1 to 47.8%), 7 of 7.
- **Detector and template differences.** T-R (version 2's detector and template, no P wave) against C3 (the independently built R-only template): −2.7% (−5.2 to −0.3%), 1 of 7. Without the P wave, version 2's R-timed template was slightly worse than C3.
- **MLP against ridge.** M-ECG against R-ECG: −1.5% (−3.3 to 0.4%), 2 of 7. This agrees with the family choice made inside the fitting people.

### 8.2 Error by target position after the last available R wave

The protocol bins every scored cutoff by the target's position after the last R wave available at the cutoff, in 40 ms bins from 0 to 1.2 s plus a bin for later or no beat; `results.json` holds every bin for every record. For this table the 40 ms bins were grouped into three ranges: within each person the RMSE over a range is computed exactly from the bins' row counts and RMSEs, and the table gives the mean over the seven people, in mV. Every 40 ms bin is in the appendix (section 19).

| Arm | 80–400 ms after R | 400–800 ms after R | 800–1,200 ms after R |
| --- | ---: | ---: | ---: |
| v2 (R-ECG) | 1.009 | 0.948 | 1.664 |
| T-ECG | 1.009 | 0.949 | 1.663 |
| C3 | 1.007 | 1.162 | 3.897 |
| C0 | 2.009 | 1.512 | 4.020 |
| Rows per person | 15,740–19,945 | 21,075–25,778 | 4,241–13,185 |

No target fell less than 80 ms after the last available R wave. Only p018 had targets 1.2 s or more after it (36 cutoffs, not in this table; their RMSEs are in the appendix). In the first 400 ms after an R wave, v2, T-ECG and C3 have the same error, about 1.01 mV: all three replay an R-aligned beat template. From 800 ms on, where the next beat begins, C3's error rises to 3.90 mV and v2's to 1.66 mV. This is the part of the cycle where the P wave gives the timing of the next beat.

### 8.3 The delayed-ECG controls and the twins

- **Non-learned timing checks.** T-ECG against T-delayed: 51.5% (48.0 to 55.8%), 7 of 7. C3 against C3d: 17.8% (14.0 to 22.1%), 7 of 7.
- **The delayed templates themselves** were slightly worse than the calibration mean: T-delayed −1.55% against C0, C3d −0.82%, each 0 of 7 wins. The protocol noted that a delayed template could partly realign for a very regular heart whose beat period divides 5.012 s; on these seven people it did not.
- **R-delayed scored the same as R-chest.** Both scored 2.2052 mV to four decimals (R-delayed 2.20521 mV, R-chest 2.20515 mV), and each person's two RMSEs differ by less than 0.001 mV. With ECG delayed by 5.012 s, the delayed twin's errors were almost those of the chest-only twin. P2's two comparisons therefore give almost the same numbers (46.9% each) and are close to a single test.
- **The chest-only detector over-counts in some records.** In p018 and p020 (and p001, p003 and b001) it found 1.76-2.66 beats per R-wave beat (section 8.6). The chest twin's template block B2 is built from these detections.

### 8.4 Version 1 on new people

- **Published version 1 (V1F) against C0:** base −0.38% (2 of 7 wins), aligned ECG −4.09% (1 of 7), delayed ECG −0.45% (2 of 7).
- **Re-fitted version 1 (V1R) against C0:** base +0.10% (3 of 7), aligned −2.69% (1 of 7), delayed +0.08% (3 of 7).
- **Version 1's own question asked again:** V1R aligned against V1R base −2.8% (−5.0 to −0.3%), 1 of 7; against V1R delayed −2.8% (−5.0 to −0.3%), 1 of 7. As in version 1, adding aligned ECG lags to the linear model made the forecast slightly worse.

### 8.5 Other controls

- C4 (ridge on 1.2 s of SCG and RESP): 2.340 mV, +1.50% against C0, 5 of 7 wins.
- C5 (chest-only template): 2.212 mV, +6.89%, 7 of 7.
- R-chest: 2.205 mV, +7.20%, 7 of 7. M-chest: 2.256 mV, +4.82%, 6 of 7.
- C1 persistence: 3.478 mV, −46.8%, 0 of 7. C2 linear trend: 9.488 mV, −299.6%, 0 of 7.

### 8.6 Detector diagnostics

Per scored record: version 2's R detector (R_v2) beats in 10-290 s, the median and range of RR intervals, chest-detector beats and their ratio to R beats, the share of cutoffs with an accepted P wave, and the share with the template defined.

| Record | R beats 10–290 s | RR median (s) | RR range (s) | Chest-detector beats | Chest / R | Cutoffs with accepted P | Template defined |
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

A P wave was accepted at 12.5-19.9% of cutoffs: the P search can only succeed in the stretch before the next R wave, after its P wave has been observed. The template was defined at every cutoff.

### 8.7 R detections against the database's annotations

This check was allowed by the protocol only after `results.json` was sealed; it affects no result. The p014-p020 `.atr` files were requested after the results commit (first request 12:40:18, results commit 12:40:01), each equal to its pin in the release manifest. Each file marks every beat twice, once in channel 0 (lead I) and once in channel 1 (lead II); version 2's detector runs on lead II, so the table uses channel 1. Window 10 ≤ time < 290 s; detection time is the grid endpoint, with no delay compensation.

| Person | Annotated beats (lead II) | R_v2 detections | Annotated beats detected within 50 ms | Detections matched within 50 ms | Median offset (ms) | Median offset, 20 ms delay removed (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| p014 | 321 | 321 | 100.00% | 100.00% | 20.4 | 0.4 |
| p015 | 308 | 308 | 100.00% | 100.00% | 21.4 | 1.4 |
| p016 | 329 | 329 | 100.00% | 100.00% | 20.0 | 0.0 |
| p017 | 342 | 342 | 100.00% | 100.00% | 20.2 | 0.2 |
| p018 | 375 | 375 | 100.00% | 100.00% | 20.2 | 0.2 |
| p019 | 295 | 296 | 100.00% | 99.66% | 20.4 | 0.4 |
| p020 | 315 | 314 | 99.68% | 100.00% | 20.0 | 0.0 |
| Mean over people |  |  | 99.95% | 99.95% | 20.4 | 0.4 |

One annotated beat in p020 had no detection within 50 ms, and one detection in p019 had no annotated beat within 50 ms. The mean over people of each person's median offset, +20.4 ms, is close to the filter's 20 ms group delay on the 250 Hz grid; with 20 ms removed it is +0.4 ms. Against channel 0 (lead I) the shares are the same and the median offset is +22.1 ms. A first private run pooled both channels, which counts each beat twice; it was replaced by this per-channel version before anything was committed. The annotation reader is a small standard-library reader, checked against the `wfdb` package (4.3.1) on the WFDB sample files 100s, 100a, snip and 100x. The script of this check is not in this folder.

## 9. The 90-120 s interval

The protocol reports 90 ≤ t < 120 s (7,500 cutoffs per person, a subset of the primary cutoffs) for comparison with version 1's interval. Primary group, n = 7.

| Arm | Mean RMSE (mV) | 95% interval | Median | Range | Mean RMSE (cal SD) | Mean MAE (mV) | Mean reduction vs C0 | Wins vs C0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0 calibration mean | 2.374 | [2.086, 2.685] | 2.320 | 1.908–3.055 | 1.000 | 1.567 | 0.0% | – |
| C1 persistence | 3.488 | [3.071, 3.893] | 3.598 | 2.658–4.112 | 1.474 | 2.459 | −47.5% | 0 of 7 |
| C2 linear trend | 9.473 | [8.250, 11.038] | 8.436 | 7.958–13.525 | 4.000 | 6.377 | −299.1% | 0 of 7 |
| C3 R-only rolling template | 1.974 | [1.667, 2.300] | 1.785 | 1.355–2.672 | 0.826 | 1.094 | 17.4% | 7 of 7 |
| C3d, C3 with ECG delayed 5.012 s | 2.417 | [2.119, 2.736] | 2.375 | 1.937–3.116 | 1.018 | 1.618 | −1.8% | 0 of 7 |
| C5 chest-only template | 2.223 | [1.958, 2.524] | 2.129 | 1.814–2.877 | 0.937 | 1.342 | 6.4% | 7 of 7 |
| T-ECG template forecast with P wave | 1.173 | [1.038, 1.308] | 1.105 | 0.943–1.417 | 0.498 | 0.804 | 50.2% | 7 of 7 |
| T-delayed, T-ECG from ECG delayed 5.012 s | 2.419 | [2.128, 2.734] | 2.376 | 1.942–3.104 | 1.019 | 1.618 | −1.9% | 0 of 7 |
| T-R R-timed template, no P wave | 2.047 | [1.735, 2.385] | 1.831 | 1.470–2.749 | 0.857 | 1.154 | 14.3% | 7 of 7 |
| V1F base (published v1) | 2.376 | [2.072, 2.704] | 2.218 | 1.866–3.129 | 1.000 | 1.569 | 0.1% | 2 of 7 |
| V1F aligned ECG (published v1) | 2.468 | [2.107, 2.814] | 2.420 | 1.703–3.205 | 1.035 | 1.648 | −3.6% | 1 of 7 |
| V1F delayed ECG (published v1) | 2.377 | [2.074, 2.706] | 2.220 | 1.867–3.130 | 1.001 | 1.573 | −0.0% | 2 of 7 |
| V1R base (v1 re-fitted) | 2.365 | [2.076, 2.683] | 2.240 | 1.886–3.079 | 0.996 | 1.560 | 0.5% | 4 of 7 |
| V1R aligned ECG (v1 re-fitted) | 2.432 | [2.118, 2.752] | 2.406 | 1.839–3.096 | 1.023 | 1.619 | −2.3% | 1 of 7 |
| V1R delayed ECG (v1 re-fitted) | 2.366 | [2.076, 2.684] | 2.241 | 1.886–3.080 | 0.996 | 1.562 | 0.4% | 4 of 7 |
| C4 one-cycle ridge | 2.334 | [2.051, 2.646] | 2.238 | 1.872–3.049 | 0.983 | 1.531 | 1.7% | 6 of 7 |
| R-chest (chest twin) | 2.213 | [1.943, 2.517] | 2.094 | 1.813–2.876 | 0.932 | 1.340 | 6.8% | 7 of 7 |
| **R-ECG = v2** | 1.172 | [1.038, 1.307] | 1.101 | 0.943–1.420 | 0.498 | 0.805 | 50.3% | 7 of 7 |
| R-delayed (delayed twin) | 2.213 | [1.943, 2.517] | 2.095 | 1.813–2.876 | 0.932 | 1.340 | 6.8% | 7 of 7 |
| M-chest (MLP) | 2.253 | [2.003, 2.525] | 2.104 | 1.872–2.776 | 0.952 | 1.432 | 4.8% | 6 of 7 |
| M-ECG (MLP) | 1.190 | [1.046, 1.337] | 1.128 | 0.933–1.488 | 0.504 | 0.827 | 49.6% | 7 of 7 |
| M-delayed (MLP) | 2.262 | [2.005, 2.539] | 2.171 | 1.863–2.784 | 0.955 | 1.439 | 4.5% | 6 of 7 |

| Comparison (model vs comparator) | Mean reduction | 95% interval | Median | Range | Wins | Mean difference (mV) | 95% interval (mV) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v2 vs V1R base (P1) | 50.1% | [46.2, 53.7] | 49.5% | 41.6 to 57.9% | 7 of 7 | 1.193 | [0.990, 1.406] |
| v2 vs C0 (P1) | 50.3% | [46.6, 54.2] | 49.7% | 43.0 to 59.3% | 7 of 7 | 1.202 | [1.002, 1.411] |
| v2 vs chest twin R-chest (P2) | 46.6% | [42.2, 50.9] | 47.1% | 38.3 to 55.0% | 7 of 7 | 1.041 | [0.848, 1.251] |
| v2 vs delayed twin R-delayed (P2) | 46.6% | [42.2, 50.9] | 47.1% | 38.3 to 55.0% | 7 of 7 | 1.041 | [0.848, 1.251] |
| v2 vs C3 (P3) | 39.6% | [34.5, 44.5] | 39.2% | 29.2 to 47.3% | 7 of 7 | 0.802 | [0.601, 1.017] |
| v2 vs T-ECG (learned stacking) | 0.1% | [−0.2, 0.3] | 0.2% | −0.4 to 0.4% | 4 of 7 | 0.001 | [−0.002, 0.003] |
| T-ECG vs T-R (P-wave anticipation) | 41.7% | [37.0, 46.8] | 39.0% | 34.6 to 50.4% | 7 of 7 | 0.874 | [0.661, 1.109] |
| T-R vs C3 (detector and template) | −3.8% | [−6.1, −1.7] | −3.2% | −8.5 to 0.1% | 1 of 7 | −0.073 | [−0.117, −0.033] |
| M-ECG vs R-ECG (MLP vs ridge) | −1.4% | [−3.4, 0.8] | −2.2% | −4.7 to 2.7% | 2 of 7 | −0.017 | [−0.040, 0.006] |
| V1R aligned vs V1R base | −2.8% | [−4.9, −0.4] | −3.7% | −7.4 to 3.2% | 1 of 7 | −0.067 | [−0.114, −0.014] |
| V1R aligned vs V1R delayed | −2.8% | [−4.9, −0.4] | −3.7% | −7.4 to 3.2% | 1 of 7 | −0.066 | [−0.113, −0.014] |
| T-ECG vs T-delayed | 51.1% | [47.4, 55.1] | 50.5% | 43.9 to 60.3% | 7 of 7 | 1.246 | [1.038, 1.461] |
| C3 vs C3d | 18.8% | [14.7, 23.7] | 15.6% | 13.3 to 30.1% | 7 of 7 | 0.443 | [0.359, 0.530] |

On this interval v2 scored 1.172 mV against 2.365 mV for V1R base and 2.376 mV for V1F base, a reduction of 50.1% (46.2 to 53.7%) against V1R base for 7 of 7 people. Version 1's published test numbers (p009-p013, 90-120 s: 2.838 mV for the base model) concern five other people and are not directly comparable in mV.

## 10. Secondary people p001-p003, the pooled ten and b001

None of these carries a verdict.

**p001-p003** (same pipeline, frozen models, cutoffs 90 ≤ t < 290 s; reported without a bootstrap) and **b001**, the only distinct basal recording in the release (one person, rest before the music, cutoffs 90 ≤ t < 270 s, 45,000 per record):

| Record | cal SD (mV) | v2 RMSE (mV) | v2 RMSE (cal SD) | V1R base | C0 | C3 | R-chest | R-delayed | v2 vs V1R base | v2 vs C3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| p001 | 1.435 | 0.683 | 0.476 | 1.425 | 1.406 | 1.052 | 1.406 | 1.406 | 52.1% | 35.1% |
| p002 | 2.193 | 0.857 | 0.391 | 2.190 | 2.157 | 1.105 | 2.050 | 2.050 | 60.8% | 22.4% |
| p003 | 1.580 | 1.031 | 0.653 | 1.738 | 1.608 | 1.238 | 1.597 | 1.597 | 40.7% | 16.7% |
| b001 | 1.830 | 0.774 | 0.423 | 1.894 | 1.906 | 1.367 | 1.847 | 1.847 | 59.1% | 43.4% |

Every arm, p001-p003, mean over the three:

| Arm | Mean RMSE (mV) | Median | Range | Mean RMSE (cal SD) | Mean MAE (mV) | Mean reduction vs C0 | Wins vs C0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0 calibration mean | 1.724 | 1.608 | 1.406–2.157 | 0.994 | 1.250 | 0.0% | – |
| C1 persistence | 2.648 | 2.376 | 2.027–3.540 | 1.510 | 1.954 | −52.0% | 0 of 3 |
| C2 linear trend | 7.685 | 6.697 | 6.362–9.997 | 4.410 | 5.528 | −344.1% | 0 of 3 |
| C3 R-only rolling template | 1.132 | 1.105 | 1.052–1.238 | 0.674 | 0.813 | 32.3% | 3 of 3 |
| C3d, C3 with ECG delayed 5.012 s | 1.732 | 1.615 | 1.411–2.169 | 0.998 | 1.260 | −0.5% | 0 of 3 |
| C5 chest-only template | 1.692 | 1.616 | 1.410–2.049 | 0.980 | 1.205 | 1.4% | 1 of 3 |
| T-ECG template forecast with P wave | 0.866 | 0.860 | 0.689–1.049 | 0.512 | 0.673 | 48.6% | 3 of 3 |
| T-delayed, T-ECG from ECG delayed 5.012 s | 1.750 | 1.634 | 1.426–2.189 | 1.009 | 1.277 | −1.5% | 0 of 3 |
| T-R R-timed template, no P wave | 1.112 | 1.078 | 1.016–1.241 | 0.662 | 0.809 | 33.5% | 3 of 3 |
| V1F base (published v1) | 1.773 | 1.738 | 1.427–2.155 | 1.026 | 1.301 | −3.2% | 1 of 3 |
| V1F aligned ECG (published v1) | 1.708 | 1.782 | 1.358–1.984 | 0.993 | 1.283 | 0.2% | 2 of 3 |
| V1F delayed ECG (published v1) | 1.774 | 1.739 | 1.429–2.154 | 1.026 | 1.303 | −3.2% | 1 of 3 |
| V1R base (v1 re-fitted) | 1.784 | 1.738 | 1.425–2.190 | 1.031 | 1.309 | −3.7% | 0 of 3 |
| V1R aligned ECG (v1 re-fitted) | 1.746 | 1.767 | 1.295–2.175 | 1.004 | 1.292 | −1.0% | 1 of 3 |
| V1R delayed ECG (v1 re-fitted) | 1.785 | 1.739 | 1.426–2.192 | 1.031 | 1.310 | −3.7% | 0 of 3 |
| C4 one-cycle ridge | 1.744 | 1.649 | 1.396–2.186 | 1.004 | 1.280 | −1.1% | 1 of 3 |
| R-chest (chest twin) | 1.684 | 1.597 | 1.406–2.050 | 0.975 | 1.202 | 1.9% | 3 of 3 |
| **R-ECG = v2** | 0.857 | 0.857 | 0.683–1.031 | 0.507 | 0.666 | 49.2% | 3 of 3 |
| R-delayed (delayed twin) | 1.684 | 1.597 | 1.406–2.050 | 0.975 | 1.202 | 1.9% | 2 of 3 |
| M-chest (MLP) | 1.844 | 1.678 | 1.546–2.309 | 1.064 | 1.306 | −7.1% | 0 of 3 |
| M-ECG (MLP) | 0.863 | 0.895 | 0.705–0.990 | 0.509 | 0.669 | 48.9% | 3 of 3 |
| M-delayed (MLP) | 1.853 | 1.686 | 1.547–2.327 | 1.069 | 1.321 | −7.6% | 0 of 3 |

| Comparison (model vs comparator) | Mean reduction | Median | Range | Wins | Mean difference (mV) |
| --- | ---: | ---: | ---: | ---: | ---: |
| v2 vs V1R base (P1) | 51.2% | 52.1% | 40.7 to 60.8% | 3 of 3 | 0.927 |
| v2 vs C0 (P1) | 49.2% | 51.4% | 35.9 to 60.3% | 3 of 3 | 0.866 |
| v2 vs chest twin R-chest (P2) | 48.3% | 51.4% | 35.4 to 58.2% | 3 of 3 | 0.827 |
| v2 vs delayed twin R-delayed (P2) | 48.3% | 51.4% | 35.4 to 58.2% | 3 of 3 | 0.827 |
| v2 vs C3 (P3) | 24.7% | 22.4% | 16.7 to 35.1% | 3 of 3 | 0.275 |
| v2 vs T-ECG (learned stacking) | 0.9% | 0.9% | 0.3 to 1.7% | 3 of 3 | 0.009 |
| T-ECG vs T-R (P-wave anticipation) | 22.6% | 20.2% | 15.5 to 32.2% | 3 of 3 | 0.246 |
| T-R vs C3 (detector and template) | 1.9% | 2.5% | −0.2 to 3.4% | 2 of 3 | 0.020 |
| M-ECG vs R-ECG (MLP vs ridge) | −1.2% | −3.2% | −4.4 to 4.0% | 1 of 3 | −0.006 |
| V1R aligned vs V1R base | 2.7% | 0.7% | −1.7 to 9.1% | 2 of 3 | 0.038 |
| V1R aligned vs V1R delayed | 2.8% | 0.8% | −1.7 to 9.2% | 2 of 3 | 0.039 |
| T-ECG vs T-delayed | 49.4% | 51.7% | 35.8 to 60.7% | 3 of 3 | 0.884 |
| C3 vs C3d | 32.6% | 25.5% | 23.3 to 49.0% | 3 of 3 | 0.600 |

Against V1R base, v2's error was lower for 3 of 3 secondary people, by 51.2% on average; against C3, by 24.7% (range 16.7 to 35.1%; no bootstrap interval for this group). C3 did comparatively well on p002 (1.105 mV, 0.504 cal SD).

**Pooled primary and secondary people** (n = 10, bootstrap intervals; secondary):

| Arm | Mean RMSE (mV) | 95% interval | Median | Range | Mean RMSE (cal SD) | Mean MAE (mV) | Mean reduction vs C0 | Wins vs C0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0 calibration mean | 2.180 | [1.896, 2.469] | 2.114 | 1.406–2.890 | 1.000 | 1.473 | 0.0% | – |
| C1 persistence | 3.229 | [2.796, 3.650] | 3.317 | 2.027–4.098 | 1.484 | 2.308 | −48.3% | 0 of 10 |
| C2 linear trend | 8.947 | [7.824, 10.210] | 8.381 | 6.362–12.910 | 4.131 | 6.133 | −312.9% | 0 of 10 |
| C3 R-only rolling template | 1.725 | [1.414, 2.047] | 1.729 | 1.052–2.548 | 0.783 | 1.007 | 21.7% | 10 of 10 |
| C3d, C3 with ECG delayed 5.012 s | 2.196 | [1.908, 2.489] | 2.125 | 1.411–2.918 | 1.007 | 1.493 | −0.7% | 0 of 10 |
| C5 chest-only template | 2.056 | [1.812, 2.319] | 1.972 | 1.410–2.763 | 0.948 | 1.297 | 5.2% | 8 of 10 |
| T-ECG template forecast with P wave | 1.070 | [0.948, 1.191] | 1.052 | 0.689–1.442 | 0.500 | 0.754 | 50.1% | 10 of 10 |
| T-delayed, T-ECG from ECG delayed 5.012 s | 2.214 | [1.925, 2.507] | 2.145 | 1.426–2.933 | 1.016 | 1.511 | −1.5% | 0 of 10 |
| T-R R-timed template, no P wave | 1.756 | [1.426, 2.098] | 1.740 | 1.016–2.631 | 0.795 | 1.043 | 20.5% | 10 of 10 |
| V1F base (published v1) | 2.203 | [1.924, 2.496] | 2.153 | 1.427–2.984 | 1.012 | 1.497 | −1.2% | 3 of 10 |
| V1F aligned ECG (published v1) | 2.248 | [1.917, 2.576] | 2.209 | 1.358–3.022 | 1.028 | 1.547 | −2.8% | 3 of 10 |
| V1F delayed ECG (published v1) | 2.205 | [1.925, 2.497] | 2.154 | 1.429–2.984 | 1.013 | 1.500 | −1.3% | 3 of 10 |
| V1R base (v1 re-fitted) | 2.198 | [1.923, 2.482] | 2.150 | 1.425–2.931 | 1.010 | 1.493 | −1.0% | 3 of 10 |
| V1R aligned ECG (v1 re-fitted) | 2.234 | [1.921, 2.545] | 2.170 | 1.295–2.938 | 1.022 | 1.531 | −2.2% | 2 of 10 |
| V1R delayed ECG (v1 re-fitted) | 2.199 | [1.923, 2.483] | 2.152 | 1.426–2.932 | 1.011 | 1.494 | −1.1% | 3 of 10 |
| C4 one-cycle ridge | 2.161 | [1.889, 2.442] | 2.149 | 1.396–2.909 | 0.993 | 1.462 | 0.7% | 6 of 10 |
| R-chest (chest twin) | 2.049 | [1.804, 2.314] | 1.964 | 1.406–2.762 | 0.944 | 1.296 | 5.6% | 10 of 10 |
| **R-ECG = v2** | 1.067 | [0.943, 1.190] | 1.046 | 0.683–1.445 | 0.498 | 0.753 | 50.3% | 10 of 10 |
| R-delayed (delayed twin) | 2.049 | [1.804, 2.314] | 1.964 | 1.406–2.762 | 0.944 | 1.296 | 5.6% | 9 of 10 |
| M-chest (MLP) | 2.132 | [1.900, 2.376] | 2.059 | 1.546–2.731 | 0.988 | 1.400 | 1.2% | 6 of 10 |
| M-ECG (MLP) | 1.081 | [0.956, 1.212] | 1.065 | 0.705–1.499 | 0.503 | 0.771 | 49.8% | 10 of 10 |
| M-delayed (MLP) | 2.140 | [1.906, 2.384] | 2.083 | 1.547–2.740 | 0.991 | 1.409 | 0.9% | 6 of 10 |

| Comparison (model vs comparator) | Mean reduction | 95% interval | Median | Range | Wins | Mean difference (mV) | 95% interval (mV) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v2 vs V1R base (P1) | 50.9% | [47.2, 54.7] | 50.3% | 40.7 to 60.8% | 10 of 10 | 1.131 | [0.940, 1.333] |
| v2 vs C0 (P1) | 50.3% | [45.8, 54.5] | 49.5% | 35.9 to 60.3% | 10 of 10 | 1.113 | [0.907, 1.322] |
| v2 vs chest twin R-chest (P2) | 47.3% | [42.8, 51.8] | 47.8% | 35.4 to 58.2% | 10 of 10 | 0.982 | [0.806, 1.177] |
| v2 vs delayed twin R-delayed (P2) | 47.3% | [42.8, 51.8] | 47.8% | 35.4 to 58.2% | 10 of 10 | 0.982 | [0.807, 1.177] |
| v2 vs C3 (P3) | 35.6% | [28.8, 42.1] | 36.3% | 16.7 to 50.8% | 10 of 10 | 0.659 | [0.443, 0.891] |
| v2 vs T-ECG (learned stacking) | 0.3% | [0.0, 0.7] | 0.3% | −0.6 to 1.7% | 8 of 10 | 0.003 | [−0.000, 0.007] |
| T-ECG vs T-R (P-wave anticipation) | 36.1% | [28.8, 43.0] | 36.3% | 15.5 to 53.4% | 10 of 10 | 0.686 | [0.448, 0.945] |
| T-R vs C3 (detector and template) | −1.3% | [−3.6, 0.8] | −0.3% | −8.2 to 3.4% | 3 of 10 | −0.031 | [−0.070, 0.006] |
| M-ECG vs R-ECG (MLP vs ridge) | −1.4% | [−3.2, 0.4] | −2.2% | −5.1 to 4.0% | 3 of 10 | −0.014 | [−0.033, 0.005] |
| V1R aligned vs V1R base | −1.2% | [−3.7, 1.9] | −2.2% | −7.5 to 9.1% | 3 of 10 | −0.036 | [−0.087, 0.019] |
| V1R aligned vs V1R delayed | −1.1% | [−3.6, 1.9] | −2.1% | −7.5 to 9.2% | 3 of 10 | −0.036 | [−0.087, 0.020] |
| T-ECG vs T-delayed | 50.9% | [46.3, 55.1] | 49.9% | 35.8 to 60.7% | 10 of 10 | 1.144 | [0.930, 1.360] |
| C3 vs C3d | 22.2% | [16.7, 29.4] | 20.3% | 12.5 to 49.0% | 10 of 10 | 0.471 | [0.363, 0.625] |

**b001**, every arm:

| Arm | RMSE (mV) | RMSE (cal SD) | MAE (mV) | Reduction vs C0 |
| --- | ---: | ---: | ---: | ---: |
| C0 calibration mean | 1.906 | 1.041 | 1.430 | 0.0% |
| C1 persistence | 2.810 | 1.535 | 2.147 | −47.5% |
| C2 linear trend | 8.670 | 4.737 | 6.567 | −354.9% |
| C3 R-only rolling template | 1.367 | 0.747 | 0.839 | 28.3% |
| C3d, C3 with ECG delayed 5.012 s | 1.923 | 1.051 | 1.444 | −0.9% |
| C5 chest-only template | 1.869 | 1.021 | 1.411 | 1.9% |
| T-ECG template forecast with P wave | 0.784 | 0.428 | 0.565 | 58.9% |
| T-delayed, T-ECG from ECG delayed 5.012 s | 1.935 | 1.057 | 1.462 | −1.5% |
| T-R R-timed template, no P wave | 1.290 | 0.705 | 0.823 | 32.3% |
| V1F base (published v1) | 1.884 | 1.029 | 1.417 | 1.2% |
| V1F aligned ECG (published v1) | 1.738 | 0.950 | 1.300 | 8.8% |
| V1F delayed ECG (published v1) | 1.886 | 1.031 | 1.421 | 1.0% |
| V1R base (v1 re-fitted) | 1.894 | 1.035 | 1.432 | 0.6% |
| V1R aligned ECG (v1 re-fitted) | 1.727 | 0.944 | 1.312 | 9.4% |
| V1R delayed ECG (v1 re-fitted) | 1.896 | 1.036 | 1.436 | 0.5% |
| C4 one-cycle ridge | 1.821 | 0.995 | 1.382 | 4.4% |
| R-chest (chest twin) | 1.847 | 1.009 | 1.400 | 3.1% |
| **R-ECG = v2** | 0.774 | 0.423 | 0.563 | 59.4% |
| R-delayed (delayed twin) | 1.847 | 1.009 | 1.399 | 3.1% |
| M-chest (MLP) | 2.034 | 1.111 | 1.515 | −6.7% |
| M-ECG (MLP) | 0.796 | 0.435 | 0.585 | 58.2% |
| M-delayed (MLP) | 2.053 | 1.122 | 1.566 | −7.7% |

| Comparison | Reduction | Difference (mV) |
| --- | ---: | ---: |
| v2 vs V1R base (P1) | 59.1% | 1.120 |
| v2 vs C0 (P1) | 59.4% | 1.131 |
| v2 vs chest twin R-chest (P2) | 58.1% | 1.072 |
| v2 vs delayed twin R-delayed (P2) | 58.1% | 1.073 |
| v2 vs C3 (P3) | 43.4% | 0.593 |
| v2 vs T-ECG (learned stacking) | 1.2% | 0.010 |
| T-ECG vs T-R (P-wave anticipation) | 39.2% | 0.506 |
| T-R vs C3 (detector and template) | 5.7% | 0.077 |
| M-ECG vs R-ECG (MLP vs ridge) | −2.8% | −0.021 |
| V1R aligned vs V1R base | 8.8% | 0.167 |
| V1R aligned vs V1R delayed | 8.9% | 0.169 |
| T-ECG vs T-delayed | 59.5% | 1.151 |
| C3 vs C3d | 28.9% | 0.556 |

## 11. Development results inside the fitting people (optimistic)

Leave-one-person-out results for every learned arm, per-person results for every arm without fitted weights, and V1F on all ten (in-sample for p004-p008, the people version 1 was fitted on), over 90 ≤ t < 290 s. These are **optimistic**: the R and P detector constants were set by inspecting p004, p007 and p008, and the 90-120 s behaviour of all ten fitting people was known before the protocol was written. They are never new-person results. Source: `development/development-table.json`.

| Arm | Mean RMSE (mV) | Mean RMSE (cal SD) | Mean reduction vs C0 | Wins vs C0 |
| --- | ---: | ---: | ---: | ---: |
| C0 calibration mean | 2.849 | 0.996 | 0.0% | – |
| C1 persistence | 4.252 | 1.490 | −49.6% | 0 of 10 |
| C2 linear trend | 11.356 | 4.010 | −303.5% | 0 of 10 |
| C3 R-only rolling template | 2.265 | 0.790 | 20.7% | 10 of 10 |
| C3d, C3 with ECG delayed 5.012 s | 2.866 | 1.002 | −0.6% | 0 of 10 |
| C5 chest-only template | 2.513 | 0.881 | 11.5% | 10 of 10 |
| T-ECG template forecast with P wave | 1.389 | 0.477 | 52.2% | 10 of 10 |
| T-delayed, T-ECG from ECG delayed 5.012 s | 2.891 | 1.010 | −1.5% | 0 of 10 |
| T-R R-timed template, no P wave | 2.301 | 0.797 | 20.1% | 10 of 10 |
| V1F base (published v1) | 2.809 | 0.981 | 1.5% | 6 of 10 |
| V1F aligned ECG (published v1) | 2.779 | 0.988 | 0.8% | 6 of 10 |
| V1F delayed ECG (published v1) | 2.811 | 0.982 | 1.4% | 6 of 10 |
| V1R base (v1 re-fitted) | 2.824 | 0.986 | 0.9% | 7 of 10 |
| V1R aligned ECG (v1 re-fitted) | 2.958 | 1.039 | −4.4% | 2 of 10 |
| V1R delayed ECG (v1 re-fitted) | 2.824 | 0.987 | 0.9% | 7 of 10 |
| C4 one-cycle ridge | 2.836 | 0.989 | 0.7% | 6 of 10 |
| R-chest (chest twin) | 2.520 | 0.883 | 11.3% | 10 of 10 |
| **R-ECG = v2** | 1.389 | 0.477 | 52.1% | 10 of 10 |
| R-delayed (delayed twin) | 2.519 | 0.883 | 11.3% | 10 of 10 |
| M-chest (MLP) | 2.684 | 0.940 | 5.6% | 8 of 10 |
| M-ECG (MLP) | 1.405 | 0.484 | 51.5% | 10 of 10 |
| M-delayed (MLP) | 2.734 | 0.952 | 4.4% | 7 of 10 |

R-ECG leave-one-person-out mean person RMSE (mV) for each of the 27 settings (`development/lopo-r-ecg-grid.json`):

| K | theta | penalty 0.001 | penalty 0.02 | penalty 0.1 |
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

Development against test, for comparison only: v2 scored 0.477 cal SD in development and 0.494 cal SD on the seven test people; its mean reduction against C0 was 52.1% (10 of 10) in development and 50.8% (7 of 7) on test. C3 against C0 was 20.7% in development and 17.1% on test.

## 12. After-the-fact check of version 1 (descriptive)

Before this protocol was written, version 1's published models were scored descriptively against each person's calibration mean on version 1's own test people (p009-p013, 90-120 s). The base model was +0.002% better than the calibration mean (2 of 5 people better) and the aligned-ECG model was 8.93% worse. This finding is descriptive and was made after version 1's results were known. On the seven new people of this study, published version 1 base was −0.38% against C0 (section 8.4).

## 13. Data, download and integrity checks

### Data and rights

The data are the **Combined measurement of ECG, Breathing and Seismocardiograms (CEBS) database, version 1.0.0** (PhysioNet, DOI [10.13026/C2KW23](https://doi.org/10.13026/C2KW23)), contributed by Miguel Ángel García González and Ariadna Argelagós Palou, Universitat Politècnica de Catalunya, under the **Open Data Commons Attribution License v1.0 (ODC-By 1.0)**. Recording: Biopac MP36; ECG leads I and II (0.05-150 Hz), a thoracic piezoresistive breathing band (0.05-10 Hz) and one axis of a LIS344ALH accelerometer (0.5-100 Hz), 5 kHz per channel, WFDB format 16. Twenty presumed healthy volunteers, supine, still and awake: five minutes basal (b), about 50 minutes of classical music (m), five minutes after the music (p). In release 1.0.0, b002.dat-b020.dat are byte copies of p002.dat-p020.dat; b001 is the only distinct basal recording. The credit, citations and our changes are in [NOTICE.md](NOTICE.md). The code is CC0 1.0 under the repository licence; results and weights derived from the database keep its attribution.

| Group | Records | Use |
| --- | --- | --- |
| Fit pool | p004-p013 | Every fit and every model choice |
| Primary test | p014-p020 | Downloaded after the freeze; scored once; verdicts |
| Secondary new people | p001-p003 | Scored with the primary test; no verdict |
| Basal check | b001 | One person, different condition; no verdict |

### What was opened, and when

- p014-p020 and p001 were first downloaded at 12:27:56, after the freeze commit was GitHub main. The freeze's on-disk search had found no file of subjects 14-20 and no p001.dat.
- p002 and p003 were read from b002.dat and b003.dat (byte-identical to the release's p002.dat and p003.dat) with the p002 and p003 headers, and b001 from its own files, all in a read-only copy kept by the version 1 maintainer. Their SHA-256 values equal the manifest pins (QC1). Before this study, that maintainer's source check had decoded b001-b003 in full to compute the header checksums and channel statistics for 60-72 s, as integrity checks, and the public sensor viewer shows 60-72 s of b001-b003, inside the calibration interval. No model had been fitted or scored on subjects 1-3, and no other waveform value of theirs had been read for any analysis.
- The same read-only copy holds five annotation files of subjects 1-3 (b001.atr, b002.atr, b003.atr, p002.atr, p003.atr). This study did not open them, and no annotation enters any input.
- The p014-p020 `.atr` files were requested only after the results commit (section 8.7). No b- or m-series file of subjects 14-20 was requested.

### Download

From `https://physionet.org/files/cebsdb/1.0.0/`: first `SHA256SUMS.txt` (13,697 bytes, equal to its pin `75db8c9b…`), then p014-p020 and p001 `.dat` and `.hea`, one connection, sequential, 1.5 s between requests. physionet.org answered each data-file request with HTTP 302 to PhysioNet's open-data bucket (`physionet-open.s3.amazonaws.com/cebsdb/1.0.0/`). The first script stopped at the first 302 (p014.dat) without following it; the download was resumed with https redirects followed, so p014.dat was requested twice. In all there were 34 HTTP exchanges: 18 requests to physionet.org and 16 redirected requests, statuses 200 and 302 only. Every file's SHA-256 equals its pin. The public log of every exchange (URL, status, UTC time, bytes, SHA-256) is in `source-verification.json`.

### Data checks (QC1-QC5)

The protocol's rules (`PROTOCOL.json`, `quality_checks`):

- **QC1 source:** the SHA-256 of each `.dat` and `.hea` equals its pin, and the downloaded manifest equals its pin.
- **QC2 header:** six header lines with the expected record name, 4 signals at 5,000 Hz, the expected frame count, format 16, labels I, II, RESP, SCG, positive gains and the expected final comment; the `.dat` length matches; the four whole-record modulo-65536 checksums equal the header values.
- **QC3 valid readings:** at least 4,500 of 5,000 valid calibration readings per used channel with SD > 0, and at least 90% of the scoring cutoffs valid (45,000 of 50,000; b001 40,500 of 45,000).
- **QC4 identical runs:** a run of identical stored values of at least 2,500 samples (0.5 s) in II or SCG, or at least 25,000 samples (5 s) in RESP, between 55 and 291 s (b001: 55 to 271 s), excludes the record.
- **QC5 clipping:** more than 1.0% of samples at ±32767 in II, RESP or SCG over the same span excludes the record; 0.1% to 1.0% is flagged only.

QC ran once with the frozen `qc.py` before any forecast file was written. All 11 records pass; no record was flagged (the largest clipped share was 0.0118%, RESP of b001). The longest identical runs are far below the limits.

| Record | QC1 source | QC2 header | QC3 valid cutoffs | QC4 longest identical run, II / RESP / SCG (samples) | QC5 clipped %, II / RESP / SCG | SCG cal SD (mV) | All |
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

The review of the freeze had noted that the frozen `qc.py` stops with an error, instead of recording a QC1 failure, when a file is missing or its header is not a WFDB header. That case did not arise: every pinned file was obtained and parsed.

### Causality test on the scored records

After the QC report was sealed and before any forecast was written, each scored record was tested at 200 cutoffs drawn by the protocol's seeds (`default_rng(20261127 + subject number)`, b001 as 101). At each cutoff the whole pipeline was run from native counts on two perturbed copies: every native sample after sample 20t replaced by random integers, and the record truncated after sample 20t. Every feature block and every arm's forecast, including each MLP seed model, in z units and in mV (71 items per cutoff), had to equal the unperturbed values exactly. 11 records × 200 cutoffs × 2 perturbations × 71 items = 312,400 comparisons; zero changed. The test read no target.

## 14. Deviations and departures

Before the download (recorded in `FREEZE.json`, admitted with the freeze):

1. **Chest-detector loop bound.** The chest-only detector scans while k < n − 7, where `PROTOCOL.json` writes k < n − 8. With n − 8, a chest beat triggered 7 grid steps before a cutoff, and available at the cutoff, is missed in a record truncated at the cutoff, so the truncation test reports changes that are not leaks. The two bounds differ only for a trigger at grid 74,992 of a full record, after every primary cutoff; on all ten fitting records they give identical B2 at every primary cutoff, so no development value, choice or weight depends on it.
2. **QC2 header comparison.** Header lines are compared with surrounding whitespace removed, because every CEBSDB 1.0.0 header line ends with a space. A literal comparison would have excluded every record.

After the freeze (recorded in `RUN-RECORD.json` and `source-verification.json`, and stated here):

3. **Download requests.** The protocol describes 17 requests to physionet.org; there were 34 HTTP exchanges, because of the redirects and the resumed first file (section 13). The stop rule covers HTTP 429 and refusals; a 302 is neither. No file other than the 17 protocol files was requested, and every byte equals its pin.
4. **Where post-download departures are recorded.** Protocol section 26 says a departure after the download is recorded in `results.json`. `results.json` is the unchanged output of the frozen `score.py` and has no deviations field; editing it would break the lock and hash chain. Departure 3 is therefore recorded in `RUN-RECORD.json` (committed with `results.json`) and `source-verification.json` (committed with the lock).
5. **Private disk budget.** The private working folder holds about 380 MB (decimal megabytes, 10⁶ bytes), above the protocol's 300 MB budget (section 25). It is mainly copies of the fitting records (120 MB), the test downloads (96 MB) and the locked forecast arrays (146 MB); the rest is 18 MB of development outputs and smaller logs. This affects no file or result.

None of these changed a forecast, a score or a verdict. The QC1 rule for a missing or unreadable file was not needed.

## 15. Limits

- **Condition.** Presumed healthy volunteers lying supine and still, in the five-minute recording made after about 50 minutes of classical music, in one laboratory with one acquisition system (Biopac MP36). The results cover that condition only. b001 is one person at rest before the music.
- **Units.** SCG and RESP are sensor output voltages in mV. They are not calibrated acceleration, chest displacement or lung volume.
- **ECG.** Lead II is the potential between skin electrodes, used only as heartbeat timing and shape.
- **No sensation.** Nothing in these recordings measures signals in sensory nerves or anything a person felt. No sensation, interoception, clinical, diagnostic or causal physiological claim follows.
- **People.** Seven primary test people, three secondary people and one basal recording, all from one database. Cutoffs within a person overlap and are never counted as independent replicates. The bootstrap with seven people is coarse.
- **Detector constants.** The R and P detector constants were set by inspecting p004, p007 and p008, which makes the development numbers optimistic. The test people played no part in them.
- **Not a cold forecast.** With the chosen K = 32, every template output, and so every B3 input of v2, stays undefined until 37 R waves have been detected (the frozen `template.py` requires j ≥ K + 4, 0-based). At the seven primary test people's median RR intervals (0.73-0.95 s) that is about 27-35 s (about 36 s for p002) of the same person's recent ECG and SCG readings, plus a 20 s calibration interval. With less history the template inputs take their fill values, and the results above do not apply. The protocol's limit of "about 20 s" was written before K was chosen and fits the default K = 16 (21 beats); its predictor section asks for at least 30 s of history.
- **Wording.** Results are "supported" or "not supported" by the predeclared rule. They do not establish general validity.

## 16. Measured, derived, predicted and simulated values

- **Measured:** the ECG, RESP and SCG voltages of the CEBS recordings.
- **Derived:** filtered 250 Hz readings, calibration means and SDs, z units, detected beat times, beat templates, feature blocks, and every QC value. The database's beat annotations, used only in section 8.7, were derived from the recordings by the database's contributors.
- **Predicted:** the forecasts of every arm, and every error computed from them against the measured targets.
- **Simulated:** none. No physics or body simulation and no other data source is used.

## 17. How to rerun

The run used Python 3.14.8 and NumPy 2.5.3 on Linux, one NumPy thread per process (8 single-threaded worker processes for the causality test), on CPU only. Refitting the MLP arms also needs PyTorch (2.14.0 was used, float32 on the CPU, deterministic algorithms). Run every command from this folder; the scripts import each other. Keep the data and outputs outside the repository. Other library versions can change the last digits of floating-point results.

**1. Check the frozen files.** This compares the 43 hashes in `FREEZE.json` with the files in this folder.

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

**2. Download the scored records** (about 131 MB) and check every file against the release manifest. p002.dat and p003.dat from PhysioNet are the same bytes as the b002.dat and b003.dat used in the run.

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

**3. Run QC, the causality test, the forecasts, the lock and the scoring.** The records map lists each record's `.dat` and `.hea`; keep the order and the QC label below to reproduce `qc-report.json` byte for byte.

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

What to expect: `qc-report.json` with SHA-256 `21231aaf…`; forecast files whose hashes equal those in this folder's `SCORE-LOCK.json`; a new `SCORE-LOCK.json` that differs only in its `written_utc` time; and a `results.json` that differs from this folder's only in `score_lock_sha256`. On the original machine (Ryzen AI MAX+ 395, 8 threads) QC took seconds, the causality test about 6 minutes and the forecasts about 35 s.

**4. Refit the models (optional).** This needs p004-p013 `.dat` and `.hea` from the same release in a folder `$FIT` (check them as in step 2 with the pattern `' p0(0[4-9]|1[0-3])\.(dat|hea)$'`) and PyTorch for the MLP arms. It reruns the model choice and the final fits; `FREEZE.json` (key `reproduction`) records an independent rerun of this sequence that reproduced every development table and weight file byte for byte.

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

## 18. Files

| File | Content |
| --- | --- |
| [PROTOCOL.md](PROTOCOL.md), [PROTOCOL-SIMPLE.md](PROTOCOL-SIMPLE.md), [PROTOCOL.json](PROTOCOL.json) | The protocol, fixed before any test byte was opened (`PROTOCOL.json` governs) |
| [allocate.py](allocate.py), [ALLOCATION.json](ALLOCATION.json) | Group membership and file pins from the release manifest |
| [FREEZE.json](FREEZE.json) | Code, weight and development-table hashes, the model choice, the fitting-people causality report, the environment and the on-disk search |
| `*.py` | The frozen pipeline: signal path, detectors, template module, features, models, arms, metrics, model choice, final fits, causality test, QC, forecasts, lock, scoring |
| [development/](development) | Leave-one-person-out tables and the model choice (optimistic) |
| [weights/](weights) | Every fitted arm: 7 ridge files and 9 MLP seed models |
| [qc-report.json](qc-report.json), [causality-scored.json](causality-scored.json), [source-verification.json](source-verification.json), [SCORE-LOCK.json](SCORE-LOCK.json) | Committed before scoring |
| [results.json](results.json), [RUN-RECORD.json](RUN-RECORD.json) | The one scoring run and the record of the test stage |
| [detector-check-atr.json](detector-check-atr.json) | The descriptive detector check, made after the results |
| [NOTICE.md](NOTICE.md) | Data credit, licence, citations and our changes |

No participant waveform, template or forecast array is committed. The NumPy predictor, invented input examples, one-command reproducer, requirements file and checksum index that protocol section 24 lists for the result stage are not in this folder yet.

The version 1 folder, [`models/chest-vibration`](../chest-vibration), is unchanged; V1F uses its `weights.json` read-only.

## 19. Appendix: every arm on every scored record, and every 40 ms bin

p014-p020 are the primary people, p001-p003 the secondary people and b001 the basal check. Values come from `results.json` (`records.*.arms`).

**RMSE (SCG mV)**

| Arm | p014 | p015 | p016 | p017 | p018 | p019 | p020 | p001 | p002 | p003 | b001 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0 calibration mean | 2.071 | 2.759 | 2.890 | 2.644 | 1.974 | 2.362 | 1.929 | 1.406 | 2.157 | 1.608 | 1.906 |
| C1 persistence | 2.649 | 4.098 | 3.821 | 4.072 | 3.094 | 3.656 | 2.954 | 2.027 | 3.540 | 2.376 | 2.810 |
| C2 linear trend | 7.917 | 11.177 | 12.910 | 9.532 | 8.595 | 8.114 | 8.168 | 6.362 | 9.997 | 6.697 | 8.670 |
| C3 R-only rolling template | 1.794 | 2.437 | 2.548 | 2.204 | 1.664 | 1.793 | 1.417 | 1.052 | 1.105 | 1.238 | 1.367 |
| C3d, C3 with ECG delayed 5.012 s | 2.081 | 2.783 | 2.918 | 2.666 | 1.988 | 2.382 | 1.949 | 1.411 | 2.169 | 1.615 | 1.923 |
| C5 chest-only template | 1.876 | 2.656 | 2.763 | 2.359 | 1.894 | 2.087 | 1.848 | 1.410 | 2.049 | 1.616 | 1.869 |
| T-ECG template forecast with P wave | 1.090 | 1.197 | 1.256 | 1.442 | 1.043 | 1.016 | 1.056 | 0.689 | 0.860 | 1.049 | 0.784 |
| T-delayed, T-ECG from ECG delayed 5.012 s | 2.101 | 2.810 | 2.933 | 2.682 | 2.004 | 2.397 | 1.961 | 1.426 | 2.189 | 1.634 | 1.935 |
| T-R R-timed template, no P wave | 1.752 | 2.570 | 2.631 | 2.209 | 1.729 | 1.802 | 1.534 | 1.016 | 1.078 | 1.241 | 1.290 |
| V1F base (published v1) | 2.152 | 2.769 | 2.984 | 2.680 | 1.911 | 2.277 | 1.942 | 1.427 | 2.155 | 1.738 | 1.884 |
| V1F aligned ECG (published v1) | 2.395 | 2.916 | 3.022 | 2.821 | 2.023 | 2.430 | 1.749 | 1.358 | 1.984 | 1.782 | 1.738 |
| V1F delayed ECG (published v1) | 2.154 | 2.771 | 2.984 | 2.683 | 1.912 | 2.279 | 1.942 | 1.429 | 2.154 | 1.739 | 1.886 |
| V1R base (v1 re-fitted) | 2.110 | 2.748 | 2.931 | 2.685 | 1.926 | 2.294 | 1.932 | 1.425 | 2.190 | 1.738 | 1.894 |
| V1R aligned ECG (v1 re-fitted) | 2.166 | 2.869 | 2.938 | 2.779 | 2.014 | 2.466 | 1.872 | 1.295 | 2.175 | 1.767 | 1.727 |
| V1R delayed ECG (v1 re-fitted) | 2.112 | 2.748 | 2.932 | 2.687 | 1.926 | 2.295 | 1.932 | 1.426 | 2.192 | 1.739 | 1.896 |
| C4 one-cycle ridge | 2.111 | 2.728 | 2.909 | 2.547 | 1.917 | 2.259 | 1.910 | 1.396 | 2.186 | 1.649 | 1.821 |
| R-chest (chest twin) | 1.870 | 2.663 | 2.762 | 2.350 | 1.877 | 2.067 | 1.848 | 1.406 | 2.050 | 1.597 | 1.847 |
| **R-ECG = v2** | 1.087 | 1.204 | 1.254 | 1.445 | 1.041 | 1.013 | 1.052 | 0.683 | 0.857 | 1.031 | 0.774 |
| R-delayed (delayed twin) | 1.870 | 2.662 | 2.762 | 2.349 | 1.878 | 2.067 | 1.848 | 1.406 | 2.050 | 1.597 | 1.847 |
| M-chest (MLP) | 1.867 | 2.731 | 2.626 | 2.527 | 1.922 | 2.111 | 2.008 | 1.546 | 2.309 | 1.678 | 2.034 |
| M-ECG (MLP) | 1.066 | 1.217 | 1.261 | 1.499 | 1.078 | 1.064 | 1.035 | 0.705 | 0.895 | 0.990 | 0.796 |
| M-delayed (MLP) | 1.868 | 2.740 | 2.637 | 2.515 | 1.915 | 2.168 | 1.998 | 1.547 | 2.327 | 1.686 | 2.053 |

**RMSE in cal SD (z units)**

| Arm | p014 | p015 | p016 | p017 | p018 | p019 | p020 | p001 | p002 | p003 | b001 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0 calibration mean | 0.983 | 0.966 | 0.997 | 1.000 | 1.023 | 0.994 | 1.059 | 0.980 | 0.984 | 1.018 | 1.041 |
| C1 persistence | 1.257 | 1.435 | 1.317 | 1.540 | 1.603 | 1.538 | 1.621 | 1.413 | 1.615 | 1.504 | 1.535 |
| C2 linear trend | 3.758 | 3.913 | 4.452 | 3.606 | 4.452 | 3.414 | 4.483 | 4.433 | 4.559 | 4.238 | 4.737 |
| C3 R-only rolling template | 0.851 | 0.853 | 0.879 | 0.834 | 0.862 | 0.755 | 0.778 | 0.733 | 0.504 | 0.784 | 0.747 |
| C3d, C3 with ECG delayed 5.012 s | 0.988 | 0.975 | 1.006 | 1.009 | 1.030 | 1.002 | 1.070 | 0.983 | 0.989 | 1.022 | 1.051 |
| C5 chest-only template | 0.891 | 0.930 | 0.953 | 0.892 | 0.981 | 0.878 | 1.014 | 0.983 | 0.935 | 1.023 | 1.021 |
| T-ECG template forecast with P wave | 0.517 | 0.419 | 0.433 | 0.545 | 0.540 | 0.427 | 0.579 | 0.480 | 0.392 | 0.664 | 0.428 |
| T-delayed, T-ECG from ECG delayed 5.012 s | 0.997 | 0.984 | 1.011 | 1.014 | 1.038 | 1.009 | 1.076 | 0.994 | 0.998 | 1.034 | 1.057 |
| T-R R-timed template, no P wave | 0.831 | 0.900 | 0.907 | 0.836 | 0.895 | 0.758 | 0.842 | 0.708 | 0.492 | 0.785 | 0.705 |
| V1F base (published v1) | 1.021 | 0.969 | 1.029 | 1.014 | 0.990 | 0.958 | 1.066 | 0.994 | 0.983 | 1.100 | 1.029 |
| V1F aligned ECG (published v1) | 1.137 | 1.021 | 1.042 | 1.067 | 1.048 | 1.022 | 0.960 | 0.946 | 0.905 | 1.128 | 0.950 |
| V1F delayed ECG (published v1) | 1.022 | 0.970 | 1.029 | 1.015 | 0.990 | 0.959 | 1.066 | 0.996 | 0.983 | 1.101 | 1.031 |
| V1R base (v1 re-fitted) | 1.002 | 0.962 | 1.011 | 1.016 | 0.998 | 0.965 | 1.060 | 0.993 | 0.999 | 1.100 | 1.035 |
| V1R aligned ECG (v1 re-fitted) | 1.028 | 1.005 | 1.013 | 1.051 | 1.043 | 1.038 | 1.027 | 0.903 | 0.992 | 1.119 | 0.944 |
| V1R delayed ECG (v1 re-fitted) | 1.002 | 0.962 | 1.011 | 1.016 | 0.998 | 0.966 | 1.060 | 0.994 | 1.000 | 1.100 | 1.036 |
| C4 one-cycle ridge | 1.002 | 0.955 | 1.003 | 0.964 | 0.993 | 0.950 | 1.048 | 0.973 | 0.997 | 1.043 | 0.995 |
| R-chest (chest twin) | 0.888 | 0.932 | 0.952 | 0.889 | 0.972 | 0.870 | 1.014 | 0.979 | 0.935 | 1.011 | 1.009 |
| **R-ECG = v2** | 0.516 | 0.421 | 0.432 | 0.546 | 0.539 | 0.426 | 0.577 | 0.476 | 0.391 | 0.653 | 0.423 |
| R-delayed (delayed twin) | 0.888 | 0.932 | 0.952 | 0.889 | 0.973 | 0.870 | 1.014 | 0.980 | 0.935 | 1.011 | 1.009 |
| M-chest (MLP) | 0.886 | 0.956 | 0.905 | 0.956 | 0.995 | 0.888 | 1.102 | 1.077 | 1.053 | 1.062 | 1.111 |
| M-ECG (MLP) | 0.506 | 0.426 | 0.435 | 0.567 | 0.558 | 0.448 | 0.568 | 0.491 | 0.408 | 0.627 | 0.435 |
| M-delayed (MLP) | 0.887 | 0.959 | 0.909 | 0.951 | 0.992 | 0.912 | 1.097 | 1.078 | 1.061 | 1.067 | 1.122 |

**MAE (SCG mV)**

| Arm | p014 | p015 | p016 | p017 | p018 | p019 | p020 | p001 | p002 | p003 | b001 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0 calibration mean | 1.308 | 1.571 | 1.752 | 1.952 | 1.417 | 1.612 | 1.365 | 1.061 | 1.444 | 1.244 | 1.430 |
| C1 persistence | 1.846 | 2.596 | 2.642 | 2.968 | 2.366 | 2.684 | 2.118 | 1.603 | 2.389 | 1.870 | 2.147 |
| C2 linear trend | 5.421 | 6.687 | 8.017 | 6.753 | 6.060 | 5.935 | 5.874 | 4.834 | 6.607 | 5.143 | 6.567 |
| C3 R-only rolling template | 0.888 | 1.180 | 1.209 | 1.429 | 1.019 | 1.008 | 0.898 | 0.695 | 0.790 | 0.955 | 0.839 |
| C3d, C3 with ECG delayed 5.012 s | 1.330 | 1.613 | 1.791 | 1.966 | 1.430 | 1.637 | 1.385 | 1.068 | 1.458 | 1.254 | 1.444 |
| C5 chest-only template | 1.060 | 1.364 | 1.472 | 1.590 | 1.292 | 1.285 | 1.289 | 1.068 | 1.288 | 1.257 | 1.411 |
| T-ECG template forecast with P wave | 0.695 | 0.721 | 0.805 | 1.085 | 0.760 | 0.726 | 0.732 | 0.515 | 0.652 | 0.854 | 0.565 |
| T-delayed, T-ECG from ECG delayed 5.012 s | 1.356 | 1.644 | 1.813 | 1.969 | 1.445 | 1.656 | 1.399 | 1.082 | 1.481 | 1.269 | 1.462 |
| T-R R-timed template, no P wave | 0.935 | 1.264 | 1.283 | 1.469 | 1.075 | 1.025 | 0.952 | 0.687 | 0.777 | 0.963 | 0.823 |
| V1F base (published v1) | 1.396 | 1.597 | 1.784 | 1.988 | 1.339 | 1.543 | 1.422 | 1.064 | 1.471 | 1.369 | 1.417 |
| V1F aligned ECG (published v1) | 1.573 | 1.764 | 1.797 | 2.064 | 1.449 | 1.665 | 1.305 | 1.021 | 1.402 | 1.426 | 1.300 |
| V1F delayed ECG (published v1) | 1.399 | 1.605 | 1.787 | 1.991 | 1.340 | 1.546 | 1.423 | 1.066 | 1.472 | 1.371 | 1.421 |
| V1R base (v1 re-fitted) | 1.354 | 1.575 | 1.748 | 1.995 | 1.362 | 1.569 | 1.400 | 1.070 | 1.489 | 1.368 | 1.432 |
| V1R aligned ECG (v1 re-fitted) | 1.422 | 1.728 | 1.734 | 2.050 | 1.453 | 1.692 | 1.358 | 0.979 | 1.502 | 1.395 | 1.312 |
| V1R delayed ECG (v1 re-fitted) | 1.355 | 1.574 | 1.749 | 1.998 | 1.362 | 1.569 | 1.400 | 1.071 | 1.491 | 1.369 | 1.436 |
| C4 one-cycle ridge | 1.366 | 1.565 | 1.741 | 1.853 | 1.365 | 1.516 | 1.377 | 1.056 | 1.488 | 1.297 | 1.382 |
| R-chest (chest twin) | 1.062 | 1.375 | 1.467 | 1.585 | 1.290 | 1.273 | 1.299 | 1.069 | 1.296 | 1.242 | 1.400 |
| **R-ECG = v2** | 0.694 | 0.727 | 0.807 | 1.083 | 0.757 | 0.728 | 0.730 | 0.512 | 0.649 | 0.838 | 0.563 |
| R-delayed (delayed twin) | 1.062 | 1.375 | 1.467 | 1.586 | 1.290 | 1.274 | 1.297 | 1.068 | 1.296 | 1.242 | 1.399 |
| M-chest (MLP) | 1.124 | 1.557 | 1.480 | 1.786 | 1.349 | 1.378 | 1.412 | 1.144 | 1.486 | 1.288 | 1.515 |
| M-ECG (MLP) | 0.696 | 0.757 | 0.827 | 1.136 | 0.781 | 0.778 | 0.723 | 0.533 | 0.673 | 0.801 | 0.585 |
| M-delayed (MLP) | 1.137 | 1.553 | 1.490 | 1.771 | 1.347 | 1.426 | 1.398 | 1.163 | 1.497 | 1.304 | 1.566 |

**Relative reduction against C0 (100 × skill)**

| Arm | p014 | p015 | p016 | p017 | p018 | p019 | p020 | p001 | p002 | p003 | b001 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| C0 calibration mean | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| C1 persistence | −27.9% | −48.5% | −32.2% | −54.0% | −56.7% | −54.8% | −53.1% | −44.2% | −64.1% | −47.8% | −47.5% |
| C2 linear trend | −282.3% | −305.1% | −346.7% | −260.4% | −335.3% | −243.6% | −323.4% | −352.6% | −363.4% | −316.5% | −354.9% |
| C3 R-only rolling template | 13.4% | 11.7% | 11.8% | 16.7% | 15.7% | 24.1% | 26.5% | 25.2% | 48.8% | 23.0% | 28.3% |
| C3d, C3 with ECG delayed 5.012 s | −0.5% | −0.9% | −1.0% | −0.8% | −0.7% | −0.9% | −1.0% | −0.4% | −0.6% | −0.4% | −0.9% |
| C5 chest-only template | 9.4% | 3.7% | 4.4% | 10.8% | 4.1% | 11.6% | 4.2% | −0.3% | 5.0% | −0.5% | 1.9% |
| T-ECG template forecast with P wave | 47.4% | 56.6% | 56.6% | 45.5% | 47.1% | 57.0% | 45.3% | 51.0% | 60.1% | 34.8% | 58.9% |
| T-delayed, T-ECG from ECG delayed 5.012 s | −1.5% | −1.9% | −1.5% | −1.4% | −1.5% | −1.5% | −1.6% | −1.5% | −1.5% | −1.6% | −1.5% |
| T-R R-timed template, no P wave | 15.4% | 6.9% | 9.0% | 16.5% | 12.4% | 23.7% | 20.5% | 27.7% | 50.0% | 22.8% | 32.3% |
| V1F base (published v1) | −3.9% | −0.4% | −3.2% | −1.3% | 3.2% | 3.6% | −0.7% | −1.5% | 0.1% | −8.1% | 1.2% |
| V1F aligned ECG (published v1) | −15.7% | −5.7% | −4.5% | −6.7% | −2.5% | −2.9% | 9.3% | 3.4% | 8.0% | −10.8% | 8.8% |
| V1F delayed ECG (published v1) | −4.0% | −0.4% | −3.2% | −1.5% | 3.1% | 3.5% | −0.6% | −1.6% | 0.1% | −8.2% | 1.0% |
| V1R base (v1 re-fitted) | −1.9% | 0.4% | −1.4% | −1.5% | 2.4% | 2.8% | −0.1% | −1.4% | −1.5% | −8.1% | 0.6% |
| V1R aligned ECG (v1 re-fitted) | −4.6% | −4.0% | −1.6% | −5.1% | −2.0% | −4.4% | 3.0% | 7.9% | −0.8% | −9.9% | 9.4% |
| V1R delayed ECG (v1 re-fitted) | −2.0% | 0.4% | −1.4% | −1.6% | 2.5% | 2.8% | −0.1% | −1.4% | −1.6% | −8.1% | 0.5% |
| C4 one-cycle ridge | −1.9% | 1.1% | −0.7% | 3.7% | 2.9% | 4.4% | 1.0% | 0.7% | −1.3% | −2.5% | 4.4% |
| R-chest (chest twin) | 9.7% | 3.5% | 4.4% | 11.1% | 4.9% | 12.5% | 4.2% | 0.0% | 5.0% | 0.7% | 3.1% |
| **R-ECG = v2** | 47.5% | 56.4% | 56.6% | 45.4% | 47.3% | 57.1% | 45.5% | 51.4% | 60.3% | 35.9% | 59.4% |
| R-delayed (delayed twin) | 9.7% | 3.5% | 4.4% | 11.2% | 4.9% | 12.5% | 4.2% | −0.0% | 5.0% | 0.7% | 3.1% |
| M-chest (MLP) | 9.9% | 1.0% | 9.1% | 4.5% | 2.7% | 10.6% | −4.1% | −10.0% | −7.0% | −4.3% | −6.7% |
| M-ECG (MLP) | 48.5% | 55.9% | 56.4% | 43.3% | 45.4% | 54.9% | 46.3% | 49.9% | 58.5% | 38.4% | 58.2% |
| M-delayed (MLP) | 9.8% | 0.7% | 8.7% | 4.9% | 3.0% | 8.2% | −3.6% | −10.0% | −7.9% | −4.8% | −7.7% |

**Error by target position after the last available R wave, every 40 ms bin** (`results.json`, `records.*.error_by_position_after_last_R`, primary people). A bin is the target's position, t + 20 minus the last R_v2 beat available at t. For each bin, the RMSE of each arm is the mean over the people who have cutoffs in that bin, in mV; "People" counts them and "Cutoffs" is their total number of cutoffs in the bin. Bins with few cutoffs are noisy.

| Target position after the last R | v2 (R-ECG) | T-ECG | C3 | C0 | People | Cutoffs |
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
