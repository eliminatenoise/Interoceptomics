# Chest-vibration forecast, version 2: protocol

Technical edition, protocol version 1, 27 November 2026. The Simple edition is written with the results, from the statements fixed in section 23. [Machine-readable protocol](PROTOCOL.json) · [Allocation script](allocate.py) · [Allocation output](ALLOCATION.json)

`PROTOCOL.json` governs where this text differs from it.

## 1. What this protocol fixes

Version 2 forecasts the chest-vibration sensor voltage 80 ms ahead, in sensor millivolts, from earlier readings of the same person's chest-vibration sensor (SCG), breathing band (RESP) and ECG lead II. It is fitted on ten people of the CEBS database (p004-p013) and tested once on the seven people of that database whom no model has seen (p014-p020).

The new model times each heartbeat from the ECG: it detects R waves causally, finds the P wave that precedes the next R wave, and replays that person's own recent chest-vibration beat shape at the predicted time. A ridge model and a small neural network (MLP) combine this beat template with recent readings. The protocol also fixes simple controls, the version 1 models re-fitted on the same ten people, an ECG-delayed control and a chest-only twin.

Version 1 (`models/chest-vibration`, protocol SHA-256 `6e3be3dd3a3fb19a643865df1953616d88cd927fe192904de1ed2e1a095bf5f5`) fitted ridge models on p004-p008 and tested them on p009-p013 at 90-120 s. Mean person error was 2.838 mV for chest and band, 3.016 mV with ECG and 2.839 mV with ECG delayed 5.012 s; persistence was 4.220 mV. Its ECG timing criterion was not met (2 of 5 people better). Its README left open whether a different model, more people or a different interval would predict better. Version 2 changes all three. The version 1 files stay byte for byte as published.

Everything below is fixed before any evaluation byte is opened. The protocol becomes binding when a separate reviewer admits it and the commit that adds it is visible on GitHub. Any change needs a new protocol version, a new admission and a visible commit before any evaluation byte is opened.

Three questions carry verdicts:

- **P1.** v2 has lower error than version 1 re-fitted on the same ten people (V1R base), by at least 10% on average, and also beats each person's calibration mean (C0).
- **P2.** ECG timing adds information: v2 beats its own chest-only twin and its own ECG-delayed twin.
- **P3.** v2 beats each person's R-only rolling heartbeat template (C3), which has no fitted weights.

## 2. Claim limits

- The volunteers were healthy, lying supine and still, about five minutes after roughly 50 minutes of music, in one laboratory with one acquisition system. A positive result covers that condition only.
- SCG and RESP are sensor output voltages in mV. They are not calibrated acceleration, chest displacement or lung volume.
- ECG lead II is the potential between skin electrodes. It is used only as heartbeat timing and shape.
- Nothing in these recordings measures signals in sensory nerves or anything a person felt. No sensation, interoception, clinical, diagnostic or causal physiological claim follows from any result.
- Seven primary test people. Forecast cutoffs within a person overlap and are serially dependent. They describe that person's error and are never counted as independent replicates.
- The forecast needs about 20 s of the same person's recent chest and ECG readings plus a 20 s calibration interval. It does not forecast a person cold.
- Results are stated as "supported" or "not supported" by the rule in section 20, never "validated" or "proves".

### Terms used

- **Grid index k:** an endpoint on the 250 Hz grid. Index k is native sample 20k, time k/250 s.
- **Cutoff t:** the grid index at which a forecast is issued. Only readings at grid indices up to t may enter any input, detector state, template or calibration used for that forecast.
- **z units:** a reading minus the person's calibration mean, divided by the person's calibration SD (60-80 s).
- **cal SD:** the person's SCG calibration SD in mV. RMSE divided by cal SD is the error in z units.
- **LOPO (leave one person out):** fit on nine fitting people, score the tenth, for each of the ten in turn.
- **Relative reduction:** 100 × (comparator RMSE − model RMSE) / comparator RMSE for one person, in percent. Positive means the model's error is lower.
- **Win:** a person whose relative reduction is strictly positive.
- **R wave, P wave:** the tall spike of each heartbeat in the ECG, and the small wave about 130-160 ms before it.

## 3. What has been opened so far

- **Fitting people.** The p004-p013 waveforms were read in full for exploration and for two independent draft designs. Their version 1 results and their 90-120 s behaviour are known. They are fitting people only. No result on them is ever reported as a new-person result.
- **Primary test people.** No file of subjects 14-20 exists on this machine. A search on 27 November 2026 by exact file name (`[abmp]014`-`020` `.dat`/`.hea`/`.atr`) and by the 12,000,000-byte record size found none, apart from the fitting records and the two byte copies of p002 and p003 described next.
- **Subjects 1-3.** p001.dat is not on disk. The b001, b002 and b003 waveforms and the p001-p003 headers are on disk in a read-only copy kept by the version 1 maintainer. b002.dat and b003.dat are byte-identical to the release's p002.dat and p003.dat. The public sensor viewer shows 60-72 s of b001, b002 and b003, a window chosen before any waveform was opened. These seconds lie inside the calibration interval. No model has been fitted or scored on subjects 1-3. Apart from the viewer excerpts, no waveform value of subjects 1-3 has been read for any analysis. The designers of this study hashed the files and read the headers only.
- **Checks already made.** The SHA-256 of p004-p013 `.dat` and `.hea`, b001-b003 `.dat` and `.hea`, and p001-p003 `.hea` equal the release manifest. The p002 and p003 headers give different gains from the b002 and b003 headers, so the b headers would give wrong voltages for these bytes. No `.atr` annotation file has been read for this study.

## 4. Facts measured before this protocol

These come from the ten fitting people, measured with exploration code. They are not evidence about new people. The R and P detector constants of section 9 were set by inspecting p004, p007 and p008, so these numbers are optimistic. Every development table is recomputed under this protocol's exact rules before the freeze.

- At 80 ms ahead the filtered SCG has little linear memory. Its autocorrelation is −0.33 to +0.06 at 80 ms lag, and 0.05 to 0.30 at the best lag near one heartbeat, because beat-to-beat timing varies. A longer linear history does not help (1.2 s of SCG and RESP: 2.835 mV against 2.826 mV for the version 1 base model).
- A causal R detector found plausible beats in all ten people (54-97 beats per minute, RR intervals 0.53-1.20 s). A beat template aligned to R explained 75-88% of SCG variance in-sample. The largest SCG deflection came 28-84 ms after R.
- The hard part is the first 80 ms after each R wave, which needs the next beat's time at least 80 ms in advance. Predicting the next R from the last four RR intervals misses by 27-87 ms SD. The lead II P wave peaked 128-164 ms before R in all ten people, with P-to-R timing jitter of 2-7 ms SD.

Mean person RMSE under leave-one-person-out, 90 ≤ t < 295 s (51,250 cutoffs per person), in SCG mV with cal SD in brackets:

| Arm | Error |
| --- | ---: |
| Persistence | 4.259 (1.492) |
| Climatology (each person's calibration mean) | 2.852 (0.997) |
| Version 1 base, re-fitted | 2.826 (0.988) |
| Version 1 aligned ECG, re-fitted | 2.961 (1.040) |
| Version 1 delayed ECG, re-fitted | 2.827 (0.988) |
| One-cycle ridge (1.2 s of SCG and RESP) | 2.835 (0.989) |
| Chest-only beat template | 2.541 |
| R-timed continuation without the P wave | 2.320 |
| Template forecast with P wave (T-ECG; K 16, theta 0.8) | 1.423 (0.482) |
| Same template from ECG delayed 5.012 s | 2.934 (1.026) |
| Ridge, version 1 lags plus four template features | 1.426 (0.484) |
| Ridge on a 122-column chest + ECG block, penalty 1 | 1.626 |
| MLP on the same 122-column block, one seed | 1.452 |

On the identical 122-column block the MLP had lower error than the ridge in 10 of 10 people, so ridge against MLP is unsettled and the selection in section 13 compares them on identical blocks.

At 90 ≤ t < 290 s, in cal SD: version 1 base re-fitted 0.9864 (+0.91% against climatology, 7 of 10 better); version 1 aligned 1.0387 (−4.37%, 2 of 10); climatology 0.9956; persistence 1.4896; linear trend 4.01. The R-only rolling personal template (C3) scored 0.790, +20.73% against climatology (SD 9.36%), better for 10 of 10 people; with ECG delayed 5.012 s it scored −0.62% (0 of 10).

After the fact and descriptively, the published version 1 base model was +0.002% better than climatology on its own test people p009-p013 at 90-120 s (2 of 5 better), and version 1 aligned was 8.93% worse. This finding goes in the version 2 Technical edition only, labelled descriptive.

Training data-integrity values within 55-291 s: no missing samples; longest run of identical counts 100 samples (II), 58 (SCG), 1,749 (RESP); largest clipped fraction 0.0127% (RESP, p011).

## 5. Data and rights

- **Source:** Combined measurement of ECG, Breathing and Seismocardiograms (CEBS) database, version 1.0.0, PhysioNet, DOI `10.13026/C2KW23`, contributed by Miguel Ángel García González and Ariadna Argelagós Palou, Universitat Politècnica de Catalunya.
- **Licence:** Open Data Commons Attribution License v1.0 (ODC-By 1.0). Openly licensed, so the owner's pre-approval for openly licensed datasets covers the download.
- **Release manifest:** `https://physionet.org/files/cebsdb/1.0.0/SHA256SUMS.txt`, 13,697 bytes, 185 entries, SHA-256 `75db8c9b809ef307aabeff2c0d1b780e1bb80d4df1044272ba0f980ed06f205e` (the same pin as version 1).
- **Recording:** Biopac MP36. Channel 1 ECG lead I and channel 2 ECG lead II (0.05-150 Hz); channel 3 a thoracic piezoresistive breathing band (0.05-10 Hz); channel 4 one axis of a triaxial accelerometer (LIS344ALH, 0.5-100 Hz). Each channel at 5 kHz, WFDB format 16, little-endian, interleaved I, II, RESP, SCG.
- **Recording sequence in the source:** 20 presumed healthy volunteers, supine, still and awake. Five minutes basal (b001-b020), about 50 minutes of classical music (m001-m020), then five minutes after the music (p001-p020).
- **Release aliasing:** in release 1.0.0, b002.dat-b020.dat are byte-identical to p002.dat-p020.dat. These are the only `.dat` alias groups in the manifest. b001.dat is the only distinct basal waveform (1,360,050 frames, header comment "Baseline for subject 1"), so the b-series adds no basal recording for subjects 2-20.
- **Citations kept in the NOTICE:** García-González MA, Argelagós-Palau A, Fernández-Chimeno M, Ramos-Castro J, *A comparison of heartbeat detectors for the seismocardiogram*, Computing in Cardiology 40, 461-464 (2013); Pollard T and colleagues, *PhysioNet as a global platform for biomedical research*, Nature Health (2026), `10.1038/s44360-026-00096-z`.
- **Our changes, listed in the NOTICE:** filtering, the 250 Hz grid, standardisation, beat detection, beat templates and cutoff windows. The attribution stays with the weights and results derived from the database. Code is CC0 1.0 under the repository licence. No other data source is used.

## 6. Allocation

There is no random draw. Each subject number is one person, with one recording per person.

| Group | Records | Use |
| --- | --- | --- |
| Fit pool | p004-p013 | Every fit and every model choice. Each person weighs 1/10. |
| Primary test | p014-p020 | Downloaded after both commits are visible on GitHub; scored once; verdicts. |
| Secondary new people | p001-p003 | Scored with the primary test, reported separately, no verdict. |
| Basal check | b001 | One person, a different condition, descriptive, no verdict. |

**Hash rule.** Group membership is a fixed function of subject number applied to the release manifest, whose SHA-256 is pinned. Each assigned file's SHA-256 is copied from that manifest, so the exact bytes are fixed before any download. `allocate.py` recomputes the groups, the file pins, the alias groups and ten checks from the manifest alone, and writes `ALLOCATION.json` deterministically:

```sh
python allocate.py SHA256SUMS.txt --output ALLOCATION.json
```

Its `groups_sha256` (the SHA-256 of the groups object serialised with sorted keys and compact separators) is `bc7c7a9dfadd779c80d3e5e2bed210bc6f93cbfad03c45a0518ff791151dfbf3`. The checks confirm that the seven primary-test waveforms are distinct, differ from every other group's waveforms, and have no alias except their own b-series copies; that b001 differs from every p- and m-series waveform; and that b002 and b003 equal p002 and p003.

Primary-test pins (SHA-256 from the manifest):

| File | SHA-256 |
| --- | --- |
| p014.dat | `3f9fafe238b4e034bef7d076d08a6f64653f65cd5039209cd49b2d2d22278d73` |
| p014.hea | `fce9340b7ef16e823e17ee5a2c1a8b9f6db2d375c04a373194a38fee84e4d27f` |
| p015.dat | `4910d0d822ec8b70468a63fe0f604a241a9a11652fb9a1782a6cc3278f5c374c` |
| p015.hea | `cea0f7c88488caae1ca4867860814b7d519605ff1abbcadefb32e11dc0b3e362` |
| p016.dat | `7e6f59c23a3bea11f8ccffb82b7fce18ddf43fc0ed45b3193cc626830b51a670` |
| p016.hea | `e7644c19db375ef92af993cfa9427d2d0871d22e633e179596c369a2cb07aced` |
| p017.dat | `4c392ba0d47cef5d4188eb690c1ff753445737ec4971a14bdbea946fabd749b6` |
| p017.hea | `8d30711fb461eb28f740ac88ed35e0e33a2d37de4a1f9d402829507b162916be` |
| p018.dat | `a23f6d8d61a1abf865752023f7f6eadde2c907250d970b4dbf3d0e38817e213a` |
| p018.hea | `2d17a94a3b5580fdcfa6e2280270c903ae8d17c50ed051f430a65b74f7f641e1` |
| p019.dat | `c0eef36d002fac23b61dbf3247a0a3ed6bfe650216a80b16e95c6e842432113e` |
| p019.hea | `7eaad1ba56b5961c6319ef9edfa49ea30f8580a8ad504d3f7c9104925c52a17f` |
| p020.dat | `d30acff4e8faca7a36622639711f863be7daf22d2cea24c3902b47b0c79110ad` |
| p020.hea | `7700c47a05d0c3fcd995a1cb059f0e8901d6066e34851b12c6e0864473d38232` |

The fit-pool, secondary and basal pins are in `PROTOCOL.json` and `ALLOCATION.json`.

**Never fetched or opened before scoring:** b014-b020 and m014-m020 (`.dat`, `.hea`, `.atr`) and p014-p020 `.atr`, the 49 manifest names listed in `ALLOCATION.json`. The p014-p020 `.atr` files may be fetched after `results.json` is sealed, for a descriptive detector check only. Legacy correction-archive files (a001-a020) are not part of release 1.0.0 and are never used; a014-a020 belong to test people and stay untouched. m-series files and b-series files other than b001 are not used; b002 and b003 serve only as the byte source of p002 and p003.

**Subjects 1-3.** p001.dat and p001.hea are downloaded after the freeze. p002 and p003 are read from b002.dat and b003.dat in the read-only copy, after checking that their SHA-256 equals the manifest's p002.dat and p003.dat, and always with the p002 and p003 headers. None of them is read before the freeze commit is visible on GitHub.

**Inner folds:** leave one person out over the ten fit-pool records (ten folds, listed in `ALLOCATION.json`). Every model choice is made by these folds only.

## 7. Signal path, calibration, cutoffs and target

The signal path is version 1's, unchanged, so the version 1 controls are exact.

- **Millivolts:** (count − header baseline) / header gain, per channel. WFDB value −32768 marks a missing sample. Lead I is unused.
- **Filter:** a causal, unit-sum, 201-tap Hamming-windowed sinc low-pass with a 65 Hz cutoff at 5 kHz. The filtered value at native endpoint i uses samples i − 200 to i.
- **Grid:** endpoints i = 20k for every k ≥ 10, a 250 Hz grid stamped at the newest sample, 20 ms group delay, no delay compensation. Version 2 computes the whole record; each reading equals version 1's at the same endpoint.
- **Missing readings:** a filtered reading is missing if any native sample in its 201-sample support is missing.
- **Calibration:** for every person, including each new person, the mean and population SD of valid filtered ECG II, RESP and SCG readings at 60 ≤ t < 80 s. Each channel needs at least 4,500 valid readings of 5,000 and a positive SD. Forecasts are made in SCG z units and decoded to SCG mV as mean + SD × forecast.
- **Primary cutoffs:** every grid index with 90 ≤ t < 290 s, 50,000 per p-series record. The same window is used for fitting, for every development fold and for scoring.
- **Secondary interval:** 90 ≤ t < 120 s, 7,500 cutoffs, a subset of the primary rows, reported for comparison with version 1.
- **b001:** 90 ≤ t < 270 s, 45,000 cutoffs.
- **Target:** the filtered SCG reading at grid t + 20, 80 ms after the cutoff endpoint. Its native support is t + 40 ms to t + 80 ms. Units: SCG sensor mV, the accelerometer channel's output voltage given by the header gain, not acceleration in m/s².
- **Detector history:** the v2 R detector and the chest detector scan from 10 s; the C3 detector scans from the start of the record. The viewer's 60-72 s excerpts may enter calibration and input history but are never a scored target.
- **Common row mask:** one mask per record, shared by every arm. A cutoff is valid if the target is finite, SCG is finite at lags 0-299, RESP at lags 0-295, and ECG II at lags 0-51 both at t and at t − 1253. Detector, template and C3 outputs never remove a row; when undefined they take fixed fill values.

## 8. Inputs available at the cutoff

Every input of every arm at cutoff t uses only readings at grid indices up to t. Calibration (60-80 s) precedes every cutoff. Delayed-ECG inputs use readings up to t − 1253 (5.012 s earlier). No annotation file enters any input.

## 9. Heartbeat timing

### 9.1 R detector (v2)

Input: standardised ECG II, with missing readings set to 0. For the delayed arms the input is ECG II delayed 1253 grid steps.

1. Slope energy e(k) is the sum of squared first differences over the five readings k − 4 to k (20 ms).
2. The initial energy E0 is the 99.5th percentile of e over 60-80 s of the same input series. The memory holds the last 8 QRS energies, initially eight copies of E0. The threshold is 0.35 × E0.
3. The scan starts at grid 2500 (10 s). At each k, a trigger occurs if e(k) exceeds the threshold and more than 62 grid steps (248 ms) have passed since the last trigger. The R time is the reading in k − 3 to k + 7 that deviates most from the median of the 40 readings k − 50 to k − 11. The beat becomes available at k + 7 (28 ms after the trigger). The largest e in k to k + 7 enters the memory, the threshold becomes 0.35 × the memory's median, and the scan continues at k + 8.
4. Without a trigger, the threshold halves at every multiple of 500 grid steps (2 s) after the last trigger.

A beat may be used at cutoff t only if its availability time is at or before t.

### 9.2 Chest-only detector

Input: standardised SCG with missing readings set to 0. It uses no ECG.

1. Slope energy over ten readings (40 ms). E0 is the 99th percentile over 60-80 s. Memory of 8 energies, threshold 0.4 × E0.
2. The scan starts at 10 s. The refractory period is the larger of 62 grid steps and 0.6 × the median of the last four beat intervals once four exist, otherwise 100 grid steps.
3. A trigger above the threshold after the refractory period places the beat at the largest absolute SCG reading in k − 3 to k + 7, available at k + 7. The memory and threshold update as in 9.1 with factor 0.4. There is no threshold decay.

### 9.3 Beat template module

Constants: forecast horizon 20 grid steps; SCG template offsets −60 to +360 grid steps around each beat (−240 to +1,440 ms); ECG template offsets −100 to +100; P search 300 to 80 ms before R; P half width 12; early window 50; amplitude ratio 0.5-2.0; four RR intervals for the estimate. Tuned: K (earlier beats per template; the SCG template also includes the last beat's readings up to the cutoff) in {8, 16, 32}; theta (P correlation needed) in {0.7, 0.8, 0.9}.

At cutoff t:

1. Take the last available beat j. With no beat, or fewer than K + 5 available beats, every output is undefined.
2. **SCG template:** at each offset, the mean SCG over beats j − K to j, using only readings at or before t.
3. **ECG template:** at each offset, the mean ECG over beats j − K to j − 1, using only readings at or before t.
4. **RR estimate:** the median of the last four beat intervals. **phi:** the target's offset after the last beat, t + 20 − R_j.
5. **Continuation:** the SCG template at phi (undefined beyond +360). **RR-predicted next beat:** the template at phi − RR, rounded.
6. **P template:** the ±12-step ECG-template segment around the largest deflection 300-80 ms before R, relative to the median of the template's first 20 readings, mean removed.
7. **P search:** candidate next-R times run from the last R + max(0.7 RR, RR − 50 steps) to the latest time whose P segment is fully observed. Each candidate's ECG window, mean removed, is correlated with the P template. Candidates with an amplitude ratio outside 0.5-2.0, or with a missing reading, score −1. The best candidate is accepted if its correlation reaches theta.
8. **Template forecast:** if a P wave is accepted, the SCG template at the offset of t + 20 after the P-predicted R; otherwise the continuation. Undefined values become 0, the calibration mean.

The module also returns the P correlation, the acceptance flag, the template values 12 and 24 ms either side of the offset used, the phase since R, the phase to the predicted R and the RR estimate.

### 9.4 C3 detector and template

C3 is the second draft design's R-only template, kept as an independently built control.

- **Polarity:** the sign of the larger excursion of ECG II from its median over 60-80 s.
- **Peaks:** a reading j is a candidate when it is the largest of j − 2 to j + 2, higher than j − 1 and not lower than j + 1; it is confirmed at j + 2. It is accepted if its height above the median of every fifth reading over the previous 2 s exceeds 0.45 × (maximum − median) of that span, and more than 62.5 grid steps have passed since the previous accepted peak.
- **Time since beat:** grid steps since the most recent peak confirmed at or before the current reading.
- **Template:** the running mean of the person's own SCG in 4 ms bins of time since beat (0-2 s), over every reading from 60 s up to the reading before the cutoff. The forecast is the bin at (time since beat at t) + 20 steps if it holds at least three readings, otherwise 0.
- **C3d:** the same detections shifted 1253 grid steps later.

## 10. Feature blocks

| Block | Content | Columns |
| --- | --- | ---: |
| B0 | Version 1 lags: SCG lags 0-50, then RESP lags 0-50 | 102 |
| B1 | One cardiac cycle: SCG lags 0-299 (1.2 s), RESP lags 0-295 in steps of 5 | 360 |
| B2 | Chest-only template (chest detector, P search off): continuation, RR-predicted next-beat value, time since beat (s), RR estimate (s) | 4 |
| B3 | ECG beat phase (v2 R detector, P search on): template forecast, continuation, P-predicted value, RR-predicted value, P flag, P correlation, template values at −24, −12, +12 and +24 ms of the offset used, phase since R (s), phase to the predicted R (s), RR estimate (s) | 13 |
| B3d | B3 from ECG II delayed 1253 grid steps (5.012 s), SCG left current | 13 |

Undefined template values become 0, except the two phases, which become −1. RESP level and its 100 ms change are already B0 columns and are not repeated.

## 11. Arms

All arms are scored on identical rows of every record.

**No fitted weights**

- **C0 climatology:** the person's SCG calibration mean.
- **C1 persistence:** the last filtered SCG reading.
- **C2 linear trend:** a least-squares line through the last 13 SCG readings (48 ms), extended 80 ms.
- **C3 / C3d:** the R-only rolling personal template, aligned and with ECG delayed 5.012 s (section 9.4).
- **C5 chest-only template:** B2's continuation.
- **T-ECG / T-delayed:** the template forecast of section 9.3, aligned and from delayed ECG.
- **T-R:** B3's continuation, the R-timed template without P-wave anticipation. Descriptive. It separates P-wave anticipation from detector differences, because C3 uses its own detector.

**Version 1**

- **V1F:** the published version 1 weights (`weights.json`, SHA-256 `55a78c3d9585b279b4d9be6a6c33ee60d08760f039b265badcc25d54e3366d8a`), base, aligned and delayed, applied unchanged. The published specialist.
- **V1R:** version 1's features, standardisation and ridge with penalty 0.02, re-fitted on p004-p013 over the primary cutoffs: base, aligned, and delayed (ECG delayed in fit and test). V1R base is P1's comparator.

**Learned**

- **C4 one-cycle ridge:** ridge on B1, penalty from {0.001, 0.02, 0.1, 1} by its own LOPO.
- **R-chest / R-ECG / R-delayed:** ridge on B0 + B2, B0 + B2 + B3, and B0 + B2 + B3d.
- **M-chest / M-ECG / M-delayed:** the MLP on the identical blocks, the mean of three seed models.

Within each family the three arms differ only in the ECG block. **v2** is R-ECG or M-ECG, chosen in section 13; its chest twin and delayed twin are the same family's other two arms with the same settings.

**Not applicable.** The NeuroTranslate 0.0 and 0.1 checkpoints accept no ECG, SCG or breathing-band input, so they cannot forecast this target. No pretrained or shared encoder is claimed, so the random-encoder control does not apply, and no random-feature MLP is run.

## 12. Fitting

- **Rows and weights:** each fitting person's valid primary rows (50,000 when complete). Each person weighs 1/P in every fit (P = 9 in a fold, 10 in the final fit).
- **Ridge:** version 1's closed form in float64. Per-person moments are averaged over people. Each feature is scaled by its person-weighted SD (0 becomes 1), the penalty is added to the diagonal of the scaled matrix, and the intercept is unpenalised. The target is SCG in z units at t + 20.
- **MLP:** two hidden layers of 64 units with the tanh form of GELU, then one output. Inputs are standardised by the person-weighted training mean and SD. AdamW (learning rate 1e-3, weight decay 1e-4) with a one-cycle schedule over all updates; batch 1,024; 4 epochs; each epoch's order from a generator seeded with the model seed; the last partial batch dropped. float32 on the CPU with deterministic algorithms, 4 threads, CPUs within 16-31. Rows are ordered by subject and cutoff before shuffling. If people have unequal valid rows, each row weighs 1 / (P × that person's rows).
- **Seeds and ensemble:** 20261127, 20261128 and 20261129; the arm's forecast is the mean of the three models.
- **Export:** weights are exported to NumPy, and scoring uses the NumPy forward pass. The largest torch-to-NumPy difference on all training rows is reported in the freeze file and must not exceed 1e-4 z units.

## 13. Model choice inside the fitting people

Every choice uses LOPO inside p004-p013 only, scored on the held person's 50,000 primary rows. The criterion is the mean over the ten held people of person RMSE in SCG mV.

1. For each (K, theta) in {8, 16, 32} × {0.7, 0.8, 0.9}, compute B2, B3 and B3d for all ten people.
2. Run R-ECG LOPO for each (K, theta, penalty) with penalty in {0.001, 0.02, 0.1}: 27 configurations. Choose the lowest mean. If the default (K 16, theta 0.8, penalty 0.02) is within 1% of the lowest, choose the default.
3. Run M-ECG LOPO at the chosen (K, theta) with the three seeds.
4. Choose the MLP family if M-ECG's mean is below 0.99 × R-ECG's mean; otherwise choose ridge.
5. The chosen family's chest and delayed twins use the same K (theta for the delayed twin, penalty for ridge). T-ECG, T-delayed, T-R and C5 use the same K and theta.
6. Choose C4's penalty by its own LOPO, with 0.02 as the default under the same 1% rule.
7. Build the development table: LOPO for every learned arm at the chosen settings and per-person results for every no-weight arm, and V1F on all ten (in-sample for p004-p008). It is labelled optimistic, because the detector constants were set on p004, p007 and p008 and the 90-120 s results of all ten were already known.
8. Re-fit every learned arm on all ten fitting people.

## 14. Causality test

Each tested cutoff t is checked through the whole pipeline, from native counts, on two perturbed copies of the record: (a) every native sample after sample 20t, in all four channels, replaced by a random integer in −32,767 to 32,767; (b) the record truncated after sample 20t. Every arm's forecast and every feature value at t must equal the unperturbed values exactly.

- **Fitting people:** 200 cutoffs per person for every arm, before the freeze. Cutoffs are drawn without replacement from the primary cutoffs with `numpy.random.default_rng(20261127 + subject number)`; replacement values use `default_rng([20261127, subject number, cutoff])`. Any change is a code error. It is fixed on fitting people, the development tables and selection are rerun, and the fix is recorded in the freeze file.
- **Scored records:** 200 cutoffs on every primary-test, secondary and basal record (b001 uses 101 as its subject number), after the QC report is sealed and before any error is computed. It reads no target. Any change stops scoring; nothing is scored until a reviewed protocol version decides, and this is recorded as a deviation.

## 15. Freeze

`FREEZE.json` in this folder records:

- this protocol's commit and the SHA-256 of `PROTOCOL.json`, `PROTOCOL.md`, `allocate.py` and `ALLOCATION.json`;
- the SHA-256 of every code file used to fit, forecast, test causality and score;
- the chosen K, theta, ridge penalty, C4 penalty and family, with the full LOPO tables and their SHA-256;
- the SHA-256 of every weight file (each ridge arm, each MLP seed model, C4, V1R);
- the torch-to-NumPy difference of each MLP model;
- the fitting-people causality report, which must show zero changes;
- the environment: Python, NumPy and torch versions, CPU model, thread settings and operating system;
- an on-disk search of the home and scratch trees, by name (`[abmp]014`-`020` `.dat`/`.hea`/`.atr` and `p001.dat`) and by the SHA-256 of every 12,000,000-byte file, showing that no primary-test file and no p001.dat exists.

A separate reviewer admits the freeze file. The lead commits it to this folder and pushes it.

## 16. Download

- **Precondition:** the protocol commit and the freeze commit are both visible on GitHub (`github.com/eliminatenoise/Interoceptomics`). Their commit ids are recorded before the first request.
- **Requests:** from `https://physionet.org/files/cebsdb/1.0.0/`, first `SHA256SUMS.txt`, which must equal its pin (otherwise stop and report to the lead, and fetch nothing else); then p014-p020 `.dat` and `.hea` (14 files); then p001.dat and p001.hea. 17 requests, about 96 MB.
- **Pacing:** one connection, sequential, at least 1 s between requests. Stop at any HTTP 429 or other refusal and record it; the lead decides when to resume, honouring any Retry-After header.
- **Integrity:** each file's SHA-256 must equal its pin. A mismatch allows one re-fetch after at least 60 s. If the re-fetch also mismatches, downloading stops and the lead is told. Nobody is substituted. If the pinned bytes cannot be obtained, that person fails QC1.
- **Storage and log:** files go to a private folder outside the repository (`private/cebs-test/`). `private/DOWNLOADS.json` records the URL, HTTP status, UTC time, bytes and SHA-256 of every request. A public copy without local paths goes into `source-verification.json`.
- **Never:** no `.atr`, b-series or m-series file of subjects 14-20, and no other file, is requested before `results.json` is sealed.

## 17. Data-integrity checks

These checks concern data integrity only. They are applied before any forecast is scored and are identical for every arm. No record is ever excluded for detector behaviour, signal shape or any model's error, and an excluded person is never replaced. Every QC value is reported for every scored record.

- **QC1 source:** the `.dat` and `.hea` SHA-256 equal the pins (for p002 and p003, the b002 and b003 bytes equal the p002.dat and p003.dat pins), and the downloaded manifest equals its pin.
- **QC2 header:** six non-empty lines; the record name; 4 signals; 5000 Hz; 1,500,000 frames (b001: 1,360,050); each signal line names the record's `.dat` file with format 16 and block 0; labels I, II, RESP, SCG in that order; positive gains; final comment "#After music listening for subject N" with N the subject number (b001: "#Baseline for subject 1"); `.dat` length 8 × frames; the four full-record modulo-65,536 checksums equal the header.
- **QC3 missing:** version 1's missing-reading rule. Calibration needs at least 4,500 of 5,000 valid readings per used channel and a positive SD. At least 90% of the scoring cutoffs must be valid on the common mask (45,000 of 50,000; b001 40,500 of 45,000).
- **QC4 flat signal:** from 55 s to 291 s (b001: to 271 s), a run of identical counts of at least 2,500 samples (0.5 s) in II or SCG, or at least 25,000 samples (5 s) in RESP, excludes the record.
- **QC5 clipping:** in the same span, more than 1.0% of samples at +32,767 or −32,767 in II, RESP or SCG excludes the record; 0.1% to 1.0% is flagged only.

The QC report is written and its SHA-256 recorded before any forecast file is written. **n** is the number of primary-test people passing QC1-QC5, and **k(n) = ceil(0.8 n)**: 6 of 7, 5 of 6, 4 of 5. If n is below 5, every result is reported and no verdict is given. Where an excluded record is readable, every arm is still scored on it and reported as descriptive.

## 18. Scoring

1. Download (section 16).
2. QC on every scored record; seal the QC report.
3. Causality test on every scored record (section 14), reading no target.
4. Forecasts of every arm at every scoring cutoff of every scored record, written to private forecast files with the row mask.
5. `SCORE-LOCK.json`: the SHA-256 of every forecast file, the QC report, the freeze file and the scoring code, written before any error is computed.
6. A separate process reads the targets and the locked forecasts and computes every metric once, writing `results.json`.
7. Independent review of `results.json` against this protocol.

There is one scoring run, with no re-scoring after any change. If an error is found after scoring, the original results stay published beside any correction, which is labelled post hoc.

## 19. Metrics and uncertainty

- **Per person and arm:** RMSE in SCG mV over the valid scoring rows (primary metric); RMSE / cal SD; MAE in mV; skill against climatology, 1 − RMSE / RMSE of C0.
- **Across people:** mean, median and range, each person counted once.
- **Comparisons:** per-person relative reduction, then mean, median, range, number of wins (ties are not wins) and the mean difference in mV.
- **Uncertainty:** a paired bootstrap over people, 10,000 resamples with replacement, `numpy.random.default_rng(20261127)`, one index matrix per scoring group reused for every comparison in that group. Percentile 95% intervals (2.5th and 97.5th percentiles) for each mean relative reduction, each mean mV difference and each arm's mean RMSE. With seven people the bootstrap is coarse: its lower bound is roughly the mean minus 0.72 SD across people.
- **Serial dependence:** cutoffs overlap and are serially dependent. People are the unit of replication.

## 20. Verdicts

The verdicts use the primary-test people who pass QC (n), with k(n) as in section 17. A comparison "v2 beats X" holds when all three hold: the mean relative reduction against X is above 0; at least k(n) of n people are wins; and the bootstrap 95% lower bound of the mean relative reduction is above 0.

| Verdict | Rule |
| --- | --- |
| P1, v2 beats version 1 | v2 beats V1R base with a mean relative reduction of at least 10%, and against C0 the mean relative reduction is above 0 with at least k(n) wins. |
| P2, ECG timing adds information | v2 beats its chest twin, and v2 beats its delayed twin. |
| P3, v2 beats the R-only template | v2 beats C3. |

Each is reported as "supported" or "not supported" (or "no verdict" if n is below 5), with every number it uses. Everything else is descriptive, with no verdict and no significance or population claim.

## 21. Descriptive results

- Every arm on every scored record: RMSE in mV and cal SD, MAE, skill against C0.
- T-ECG against v2: what learned stacking adds over the template.
- T-ECG against T-R: P-wave anticipation within one detector. T-R against C3: detector and template differences.
- M-ECG against R-ECG, whichever family was chosen.
- V1F base, aligned and delayed on new people.
- V1R aligned against V1R base and V1R delayed: version 1's question asked again on new people.
- T-ECG against T-delayed and C3 against C3d, the non-learned timing checks. The delayed control could partly realign for a very regular heart whose beat period divides 5.012 s, so each delayed template's own error is reported beside it.
- C4, C5, persistence and linear trend.
- Error by target position after the last available R wave, in 40 ms bins from 0 to 1.2 s plus a bin for later or no beat, for v2, T-ECG, C3 and C0.
- Detector diagnostics per record: R beats in 10-290 s, RR median and range, share of cutoffs with an accepted P wave, share with the template defined, and chest-detector beats.
- The 90-120 s table.
- The p001-p003 and b001 tables (section 22).
- After `results.json` is sealed, optionally: v2's R detections against the p014-p020 `.atr` annotations (share of annotated beats with a detection within 50 ms and share of detections matched). This affects no result.

## 22. Secondary groups

- **p001-p003:** same pipeline, frozen final models, primary cutoffs 90 ≤ t < 290 s, same QC. The viewer's 60-72 s of b002 and b003 (the p002 and p003 bytes) lies inside calibration and input history and is never scored. Per-person results and their mean are reported separately from the seven primary people, without a bootstrap. A pooled primary + secondary table, with bootstrap intervals, is secondary. No verdict.
- **b001:** same pipeline and frozen models; calibration 60-80 s; cutoffs 90 ≤ t < 270 s; QC with its own frame count and comment. The viewer's 60-72 s lies inside calibration and input history and is never scored. One person in a different condition, kept apart, no verdict. b002 and b003 are never called basal.

## 23. Simple-edition statements fixed now

Results replace X, Z, N, Y, a and b. The rule chooses the outcome sentence. No other outcome wording is added.

**Always included**

- "Version 2 learned from ten volunteers and was tested once on seven others whose recordings were downloaded only after the plan and the finished models were published."
- "Each forecast uses only readings taken up to the moment of the forecast."
- "The vibration sensor and the breathing band give voltages in millivolts. They do not measure chest movement in physical units, signals in sensory nerves, or anything a person felt. All recordings come from one laboratory, with people lying still after listening to music."
- "We compared it with simple rules: each person's usual reading, the last reading, the recent trend, and each person's own average heartbeat shape timed by the heart's electrical signal."

**By verdict**

- P1 supported: "Its error was lower than that of the first version's model, refitted on the same ten volunteers, for X of N people, by Y% on average (range a% to b%)."
- P1 not supported: "It did not meet the rule for doing better than the first version's model refitted on the same ten volunteers: its error was lower for X of N people, by Y% on average (range a% to b%)."
- P2 supported: "Heartbeat timing from the skin electrodes lowered the error for X of N people compared with the same model without it, and for Z of N compared with timing taken from 5 seconds earlier."
- P2 not supported: "Heartbeat timing from the skin electrodes did not lower the error consistently (X and Z of N people)."
- P3 supported: "It also did better than each person's own average heartbeat shape for X of N people, by Y% on average."
- P3 not supported: "It did not consistently do better than each person's own average heartbeat shape (X of N people, Y% on average)."
- No verdict: "Fewer than five test recordings passed the data checks, so no conclusion is drawn; every result is still listed."
- Exclusion: "Recording ID was not used for the conclusions because REASON."

The after-the-fact finding that version 1 was close to each person's calibration mean appears in the Technical edition only, labelled descriptive.

## 24. What will be published

Everything goes into this folder (`models/chest-vibration-v2`), committed by Interoceptomics contributors on a new branch. The lead pushes. The version 1 folder is not changed. There is no browser page now, because Interoceptomics presentation work is paused.

- **This commit:** `PROTOCOL.md`, `PROTOCOL.json`, `allocate.py`, `ALLOCATION.json`, `.gitattributes`.
- **Freeze commit:** `FREEZE.json`, the fitting, forecasting, causality and scoring code, the weight files and the LOPO tables.
- **Result commit:** `results.json`, `qc-report.json`, `SCORE-LOCK.json`, `source-verification.json`, `NOTICE.md`, the Technical README and the Simple edition, `predict.py`, `invented-examples.json`, `reproduce.py`, `requirements.txt` and `SHA256SUMS`.
- **Predictor:** NumPy only. It takes the person's 20 s calibration readings (or their means, SDs and detector initial energies) and a contiguous filtered 250 Hz history of at least 30 s ending at the cutoff, ordered ECG II, RESP, SCG. It runs the frozen detectors and templates from the start of the supplied history and returns every arm's forecast 80 ms ahead in SCG mV. Forecasts depend on where the history starts until the detector memories and templates have filled (about K + 4 beats); with fewer beats it returns the fill values and says so. The evaluation, with detectors started at 10 s, is the reference.
- **Examples and data:** invented input examples only. No participant waveform, template or forecast array is committed; templates are computed at run time from the user's own data.
- **Editions:** Technical and Simple editions, each with a first draft, a distinct rewrite and a separate reader before publication. The Technical edition holds the protocol, allocation and freeze hashes and commits, the data pins, the QC table, per-person tables for every arm, every comparison with its interval, the verdicts, the labelled development table, the beat-phase and detector results, the 90-120 s, version 1 and secondary tables, the descriptive version 1 climatology finding, deviations (or "none"), and the limits of section 2.

## 25. Steps, compute and ETAs

Compute is CPU only: at most 16 threads in total, pinned to CPUs 16-31; MLP jobs use 4 threads each, at most four at once; RAM under 8 GB; private disk under 300 MB. Budgets: 27 R-ECG configurations, 4 C4 penalties and one MLP configuration with three seeds; 1,756 MLP updates per LOPO fold and 1,952 per final fit; 90 MLP fits in LOPO and 9 final fits.

| Step | Work | ETA |
| --- | --- | --- |
| S1 | Separate reviewer admits this protocol; the lead commits and pushes it | reviewer and lead time |
| S2a | Implement pipeline, detectors, templates, features, fits, causality test and scoring (fitting people only) | about 2 h |
| S2b | Feature grid: 9 (K, theta) settings × 10 people, aligned and delayed | about 5 min |
| S2c | Ridge LOPO: 27 R-ECG configurations, C4, V1R, ridge twins | under 2 min |
| S2d | M-ECG LOPO, 3 seeds × 10 folds, four 4-thread jobs | about 25 min |
| S2e | M-chest and M-delayed LOPO for the development table | about 45 min |
| S2f | Final fits of every learned arm; NumPy export check | about 15 min |
| S2g | Causality test on the ten fitting people | about 20-40 min |
| S2h | `FREEZE.json` with the on-disk search; reviewer admits; lead commits and pushes | about 30 min plus reviewer and lead time |
| S3 | Download 17 files, about 96 MB | about 2 min |
| S4 | QC and seal; causality test on 11 scored records; forecasts; score lock; one scoring run | about 20-40 min |
| S5 | Independent result review; Technical and Simple editions; NOTICE, predictor, examples | about 2 h plus reader time |

Total: about 6 hours of work from admission to a reviewed result, plus reviewer and commit waits.

## 26. Deviations and departures from the reviewed design

Any departure from this protocol after admission is recorded with its reason in `FREEZE.json` (before the download) or in `results.json` (after it), and stated in both editions. A change made after any test byte is read cannot affect a verdict and is reported as post hoc.

This protocol makes the reviewed design exact in these places:

- Each beat contributes to the ECG template only readings at or before the cutoff. The exploration code took every beat's full ±400 ms window, which can read past the cutoff when an RR interval is under 400 ms.
- Missing readings: detectors see 0; templates average valid readings only; a P-search window with a missing reading scores −1; a P search with an undefined template value is skipped.
- B2 has four columns. The exploration code's duplicate continuation column and its RESP level and change columns, which copy B0 columns, are not repeated.
- MLP LOPO runs only at the (K, theta) chosen on R-ECG, to keep the budget; the MLP has no penalty to tune.
- GELU uses its tanh form so that the NumPy predictor implements the same formula; scoring uses the NumPy export.
- C4's penalty grid adds 1, as in the first draft design.
- The tie rule is exact: the default setting is chosen when within 1% of the lowest mean.
- T-R is added as a descriptive arm, because C3 uses its own detector and P3 compares v2 with C3.
- The manifest is downloaded first, as the anchor for the integrity checks.
- The causality test uses both replacement and truncation, and checks every feature as well as every forecast.
- The secondary group of three gets per-person and mean results without a bootstrap; the pooled ten-person table gets one.

## 27. Items for the lead and the owner

- **Lead:** confirm that the owner's 27 November 2026 instruction to continue training the models is the task lease for this training and download; push the protocol commit and, later, the freeze commit before any download, and record both ids.
- **Owner:** nothing blocking. Optional for later: genuine basal recordings of subjects 2-20 exist only in an unreleased legacy correction archive (a002-a020) with unclear licence and provenance. They are not used. a014-a020 belong to test people and stay untouched regardless.
