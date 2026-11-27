# Chest-vibration forecast, version 2: the plan, explained step by step

Simple edition of protocol version 1, 27 November 2026. The Technical edition is [PROTOCOL.md](PROTOCOL.md); it and the machine-readable [PROTOCOL.json](PROTOCOL.json) govern wherever this text differs.

## What this page is

A protocol is a plan written down and published before a test is run, so that nobody can adjust the test after seeing how it turns out. This page explains the protocol of version 2 of the chest-vibration forecast for readers who have not worked with heart signals or forecasting models. It covers the same plan as the Technical edition, with more explanation. A few formula-level details, such as exact index ranges, are given only in the Technical edition and in PROTOCOL.json, as noted where they occur.

The page reports no result. The test recordings have not been downloaded. When the test has been run, the results will be published in their own Technical and Simple editions. The Simple edition of the results will be built from sentences that this plan already fixes (listed in the section "Sentences fixed now for the Simple edition of the results"); the opening line of the Technical edition refers to that edition when it says that the Simple edition is written with the results. This page is a separate plain-language explanation of the plan itself. It was added after the plan was fixed and changes nothing in it: the plan's files, and the fingerprints recorded in PROTOCOL.json, are unchanged.

The plan was fixed before any byte of test data was opened. It becomes binding when a separate reviewer, someone who did not write it, admits it, and when the commit that adds it is visible on GitHub, the public site that keeps every version of the project's files with its date. Any change to the plan needs a new protocol version, a new admission and a new visible commit, all before any test data are opened.

## The study in brief

1. **What is forecast.** A small sensor on the chest picks up a vibration with every heartbeat. Version 2 forecasts what that sensor will read 80 milliseconds (ms) after the moment of the forecast. The answer is a voltage in millivolts (mV), the sensor's own output, not a measured movement.
2. **What it uses.** Only earlier readings from the same person: the chest-vibration sensor itself, a breathing band around the chest, and the heart's electrical signal picked up by skin electrodes.
3. **Who.** It learns from ten people of a public database (records p004 to p013). It is tested once on seven other people of the same database (p014 to p020), whom no model has seen.
4. **What is new.** Version 2 times each heartbeat from the electrical signal. It spots the small wave that comes shortly before each main heartbeat spike and replays that person's own recent vibration pattern at the predicted time. Two kinds of learned model then combine this replayed pattern with recent readings.
5. **What it is compared with.** Simple rules that need no learning, the first version's models refitted on the same ten people, the first version exactly as published, and two "twins" of version 2: one without the electrical signal and one given the electrical signal from 5.012 seconds earlier.
6. **What gets a verdict.** Three questions, each answered "supported" or "not supported" by a rule fixed in advance.
7. **What is published.** Every predeclared result, wins and losses alike.

## The three recorded signals

The data come from a public database in which volunteers lay still on their backs while four signals were recorded 5,000 times a second.

- **Chest vibration (SCG, for seismocardiogram).** One axis of an accelerometer on the chest. Each heartbeat shakes the chest slightly, and the sensor turns that into a voltage. This is the signal being forecast.
- **Breathing band (RESP).** A band around the chest whose electrical resistance changes as the chest expands and contracts. It also gives a voltage.
- **ECG lead II.** The voltage between two skin electrodes, which follows the heart's electrical activity. A second ECG channel, lead I, is in the files but is not used.

Two features of the ECG matter here. The **R wave** is the tall spike that marks each heartbeat. The **P wave** is a small wave about 130 to 160 ms before it, produced as the heart's upper chambers start each beat. The study uses the ECG only to time heartbeats and to describe their shape.

All three signals are used as voltages. The chest sensor's voltage is not converted into acceleration in metres per second squared, and the breathing band's voltage is not converted into chest movement or lung volume. Such conversions would need a calibration that the database does not provide.

## What version 1 found, and what version 2 changes

Version 1 is in the folder `models/chest-vibration` (protocol fingerprint `6e3be3dd3a3fb19a643865df1953616d88cd927fe192904de1ed2e1a095bf5f5`; a fingerprint is explained under "Words used on this page"). It used a ridge model, a linear formula that gives each recent reading a weight and adds them up, with a penalty that keeps the weights small. It learned from five people (p004 to p008) and was tested on five others (p009 to p013), on the stretch from 90 to 120 seconds into each recording.

Its average error per person was:

- 2.838 mV using the chest sensor and breathing band;
- 3.016 mV with the ECG added;
- 2.839 mV with the ECG taken from 5.012 seconds earlier;
- 4.220 mV for simply repeating the last reading (called persistence).

Version 1 had a rule for whether ECG timing helped. The rule was not met (the ECG lowered the error for 2 of the 5 test people). Its README left open whether a different model, more people or a different interval would predict better. Version 2 changes all three: a new kind of model, ten learning people instead of five, and a 200-second scoring stretch instead of 30 seconds. The version 1 files stay byte for byte as published.

## How version 2 forecasts a heartbeat's vibration

Each heartbeat makes a similar vibration pattern on a person's chest. If you know when the next beat will start, you can replay that person's usual beat pattern from that moment. Version 2 builds on this in three steps.

1. **Find each R wave.** A detector watches the ECG and marks each R wave, using only readings that have already arrived.
2. **Anticipate the next R wave.** In the ten learning people, the chest vibration's largest swing came 28 to 84 ms after the R wave. So the hardest part is the first 80 ms after each R wave: to forecast them, the model must know when the next beat starts at least 80 ms in advance. Guessing that from the last four beat-to-beat intervals misses by 27 to 87 ms (standard deviation), because the heart does not keep perfect time. The P wave helps here. In all ten learning people it peaked 128 to 164 ms before the R wave, and the gap from P to R varied by only 2 to 7 ms (standard deviation). Seeing a P wave therefore says when the next R wave will come, early enough to forecast 80 ms ahead.
3. **Replay the person's own beat pattern.** The model averages the person's chest-vibration pattern over their last few beats, lined up on each beat. This average is called a beat template. The model reads off the template's value at the target moment.

An invented example shows the timing. Suppose a P wave is seen now, and in this person the R wave follows its P wave by about 145 ms. The next R wave is then expected 145 ms from now. The target lies 80 ms from now, which is 65 ms before that R wave. The template says what this person's chest sensor usually reads 65 ms before an R wave, and that value becomes the template forecast.

Two learned models then combine the template forecast with recent readings: a ridge model, and a small neural network called a multilayer perceptron (MLP), which can capture curved rather than only straight-line relationships. Which of the two becomes "version 2" is decided using the learning people only, by a rule given below.

## The three questions that receive a verdict

Each question is a claim that the test will find supported or not supported.

- **P1, improvement on version 1.** Version 2's error is lower than that of version 1 refitted on the same ten people (called V1R base), by at least 10% on average. It must also beat each person's calibration mean (C0), a forecast that always gives the person's usual level.
- **P2, value of ECG timing.** ECG timing adds information: version 2 beats its own twin that has no ECG input, and also its own twin that gets the ECG from 5.012 seconds earlier. The second twin has the same amount of ECG information, but out of step with the present heartbeat.
- **P3, comparison with a simple heartbeat-pattern rule.** Version 2 beats each person's own average heartbeat pattern timed by R waves alone (called C3). C3 has no learned weights.

The exact rule for "beats" is in the section "What counts as success".

## What a result can and cannot show

- **One situation.** The volunteers were presumed healthy, lying on their backs, still and awake, in the five-minute recording made after about 50 minutes of classical music, in one laboratory with one recording system. A positive result covers that situation only.
- **Voltages, not physical quantities.** The chest sensor and breathing band give sensor voltages in mV, not calibrated acceleration, chest movement or lung volume.
- **The ECG is used for timing.** ECG lead II is the potential difference between skin electrodes. It is used only for heartbeat timing and shape.
- **No sensation.** Nothing in these recordings measures signals in sensory nerves or anything a person felt. No claim about sensation, interoception (the sense of the body's internal state), clinical use, diagnosis or physiological cause follows from any result.
- **Seven test people.** The main test has seven people. Within one person, forecasts made 4 ms apart overlap and depend on each other. They describe that person's error and are never counted as independent repeats. People are the unit that counts.
- **Recent readings needed.** A forecast needs about 20 seconds of the same person's recent chest and ECG readings, plus a 20-second calibration stretch from that person. It cannot forecast someone from whom it has no readings.
- **Careful wording.** Results are stated as "supported" or "not supported" by the rule in "What counts as success", never as "validated" or "proves".

## Measured, derived, predicted, invented and simulated values

- **Measured:** the voltages in the database: ECG, breathing band and chest sensor.
- **Derived:** values computed from the measured voltages: filtered readings, rescaled readings, detected beat times, beat templates and model inputs.
- **Predicted:** the forecasts of every forecaster.
- **Invented:** the example inputs to be published with the predictor program, and the random values that replace future samples in the test for peeking at the future. They are not measurements of anyone.
- **Simulated:** none. No physics or body simulation is used. Every input and target comes from the database's recordings, and no other data source is used.

## Words used on this page

- **Reading.** One value on a regular grid of 250 values per second, one every 4 ms, made from the 5,000-per-second recording.
- **Grid step.** The 4 ms between two readings. A forecast 80 ms ahead is 20 grid steps ahead; 5.012 seconds is 1,253 grid steps.
- **Cutoff.** The moment at which a forecast is made. Only readings up to the cutoff may enter anything used for that forecast.
- **Calibration stretch.** Seconds 60 to 80 of each recording. Each person's mean and spread there set the scale for that person.
- **z units.** A reading minus the person's calibration mean, divided by the person's calibration standard deviation (a measure of spread). In z units, 0 is the person's usual level and 1 is one standard deviation above it.
- **cal SD.** The person's chest-sensor calibration standard deviation in mV. Error divided by cal SD gives the error in z units, which makes people with large and small signals comparable.
- **Leave one person out (LOPO).** Fit on nine of the ten learning people, score the tenth, and repeat for each of the ten in turn. It tests settings on people the fit has not seen, without touching the test people.
- **Relative reduction.** For one person, 100 × (comparison's error − model's error) / comparison's error, in percent. A positive value means the model's error is lower.
- **Win.** A person whose relative reduction is above zero. A tie is not a win.
- **Fingerprint (SHA-256).** A 64-character code computed from a file's exact bytes. Any change to the file gives a different code, so a published fingerprint fixes exactly which bytes are meant.
- **Separate reviewer, lead and owner.** The reviewer checks and admits the plan without having written it. The lead is the maintainer who commits files and pushes them to GitHub. The owner is the person who owns the project and directs it.

## The data and who provided it

- **Source.** The Combined measurement of ECG, Breathing and Seismocardiograms (CEBS) database, version 1.0.0, published on PhysioNet, DOI `10.13026/C2KW23`. It was contributed by Miguel Ángel García González and Ariadna Argelagós Palou of the Universitat Politècnica de Catalunya.
- **Licence.** Open Data Commons Attribution License v1.0 (ODC-By 1.0). Anyone may use the data if they credit the source. Because the data are openly licensed, the owner's standing approval for openly licensed datasets covers the download.
- **The volunteers.** 20 presumed healthy volunteers, lying on their backs, still and awake. Each had three recordings in a row: five minutes at rest (files b001 to b020), about 50 minutes while listening to classical music (m001 to m020), and five minutes after the music (p001 to p020).
- **Recording equipment.** A Biopac MP36 recorder. Channel 1 is ECG lead I and channel 2 ECG lead II (0.05 to 150 Hz); channel 3 is a piezoresistive breathing band around the chest (0.05 to 10 Hz); channel 4 is one axis of a three-axis accelerometer (LIS344ALH, 0.5 to 100 Hz). Each channel was sampled 5,000 times a second and stored in the WFDB file format 16: each sample is a 2-byte number, little-endian, with the four channels interleaved in the order I, II, RESP, SCG.
- **Duplicate files in the release.** In version 1.0.0 of the database, the resting files b002 to b020 are byte-for-byte copies of the after-music files p002 to p020. No other waveform files are duplicates. Only b001 is a genuine resting recording (1,360,050 samples per channel, labelled "Baseline for subject 1"). So the rest files add no resting recordings for people 2 to 20.
- **File list.** The database's own list of file fingerprints, `SHA256SUMS.txt` (13,697 bytes, 185 entries), has the fingerprint `75db8c9b809ef307aabeff2c0d1b780e1bb80d4df1044272ba0f980ed06f205e`, the same as in version 1. Every file this study uses is pinned by the fingerprint that list gives it.
- **Citations kept in the NOTICE file.** García-González MA, Argelagós-Palau A, Fernández-Chimeno M, Ramos-Castro J, *A comparison of heartbeat detectors for the seismocardiogram*, Computing in Cardiology 40, 461-464 (2013); Pollard T and colleagues, *PhysioNet as a global platform for biomedical research*, Nature Health (2026), `10.1038/s44360-026-00096-z`.
- **Our changes, listed in the NOTICE file.** Filtering, the 250-per-second grid, rescaling to z units, beat detection, beat templates and the choice of forecast stretches. The credit to the database stays attached to the weights and results derived from it.
- **Code licence.** The code is released under CC0 1.0, the repository's licence, which gives up all rights in it as far as the law allows.
- **No other data.** No other dataset, and no data under share-alike, non-commercial or unclear terms, is used.

## Which people are used for what

There is no random draw. Each subject number is one person, with one recording per person.

| Group | Records | Use |
| --- | --- | --- |
| Learning people (fit pool) | p004-p013 | Every fit and every model choice. Each person counts 1/10. |
| Main test people | p014-p020 | Downloaded only after the plan and the frozen models are visible on GitHub. Scored once. The verdicts come from these seven. |
| Secondary new people | p001-p003 | Scored together with the main test, reported separately, no verdict. |
| Resting check | b001 | One person, in a different condition (rest before the music). Descriptive, no verdict. |

**How the groups are fixed.** Group membership follows from the subject number alone, applied to the database's file list, whose fingerprint is pinned. Each file's fingerprint is copied from that list, so the exact bytes of every file are fixed before any download. The small program `allocate.py` recomputes the groups, the file fingerprints, the duplicate-file groups and ten checks from the file list alone, and writes [ALLOCATION.json](ALLOCATION.json):

```sh
python allocate.py SHA256SUMS.txt --output ALLOCATION.json
```

The fingerprint of the groups it produces (the `groups` object written with sorted keys and compact separators) is `bc7c7a9dfadd779c80d3e5e2bed210bc6f93cbfad03c45a0518ff791151dfbf3`. The checks confirm that the seven main test recordings are all different from each other and from every other group's recordings, with no copies except their own rest-file copies; that b001 differs from every after-music and music recording; and that b002 and b003 equal p002 and p003. The fingerprints of the fourteen main test files are listed at the end of this page; those of the other groups are in `PROTOCOL.json` and `ALLOCATION.json`.

**Files never fetched or opened before scoring.** The rest and music files of people 14 to 20 (b014 to b020 and m014 to m020, each with its `.dat`, `.hea` and `.atr` file) and the `.atr` annotation files of p014 to p020: 49 file names, all listed in `ALLOCATION.json`. An `.atr` file holds the database's beat annotations. The p014 to p020 `.atr` files may be fetched after the results file is sealed, only to check the beat detector descriptively. An older correction archive (files a001 to a020) is not part of release 1.0.0 and is never used; a014 to a020 belong to test people and stay untouched. Music files and rest files other than b001 are not used, except that b002 and b003 serve as the source of the bytes of p002 and p003.

**People 1 to 3.** p001.dat and p001.hea are downloaded after the freeze. p002 and p003 are read from the files b002.dat and b003.dat in an existing read-only copy, after checking that their fingerprints equal those listed for p002.dat and p003.dat, and always together with the p002 and p003 header files. None of them is read before the freeze commit is visible on GitHub.

**Settings tests inside the learning people.** Leave one person out over the ten learning people gives ten rounds, listed in `ALLOCATION.json`. Every model choice is made from these rounds only.

## What has already been looked at

Being open about what has been seen matters, because a test is only fair on data nobody has looked at.

- **Learning people.** The recordings p004 to p013 were read in full, for exploration and for two independent draft designs. Their version 1 results and their behaviour from 90 to 120 seconds are known. They serve as learning people only. No result on them is ever reported as a result on new people.
- **Main test people.** No file of people 14 to 20 exists on the computer used for this study. A search on 27 November 2026 by exact file name (b, m, p and a files numbered 014 to 020, with endings `.dat`, `.hea` and `.atr`) and by file size (12,000,000 bytes, the size of one five-minute recording) found none, apart from the learning recordings and the two copies of p002 and p003 described next.
- **People 1 to 3.** p001.dat is not on disk. The b001, b002 and b003 recordings and the p001 to p003 header files are on disk in a read-only copy kept by the version 1 maintainer. b002.dat and b003.dat are byte-for-byte identical to the release's p002.dat and p003.dat. The project's public sensor viewer shows seconds 60 to 72 of b001, b002 and b003, a stretch chosen before any recording was opened. Those seconds lie inside the calibration stretch. No model has been fitted or scored on people 1 to 3. Apart from the viewer excerpts, no value from their recordings has been read for any analysis. The designers of this study computed the files' fingerprints and read their headers only.
- **Checks already made.** The fingerprints of the p004 to p013 recordings and headers, the b001 to b003 recordings and headers, and the p001 to p003 headers equal the database's file list. The p002 and p003 headers give different gains (the factor that turns stored numbers into mV) from the b002 and b003 headers, so using the b headers would give wrong voltages for these bytes. No `.atr` annotation file has been read for this study.

## What the ten learning people showed before the plan was fixed

These numbers come from the ten learning people, measured with exploration code before the plan was written. They are not evidence about new people. They are also optimistic, because the settings of the R and P wave detectors were chosen by looking at p004, p007 and p008. Every development table is recomputed under this plan's exact rules before the models are frozen.

**The chest signal on its own forgets quickly.** At 80 ms ahead, the filtered chest signal has little straight-line memory. Its autocorrelation (how strongly a reading matches the reading a given time later) is −0.33 to +0.06 at an 80 ms gap, and only 0.05 to 0.30 at the best gap near one heartbeat, because the time between beats varies. A longer history does not help a linear model: 1.2 seconds of chest and breathing readings gave 2.835 mV, against 2.826 mV for the version 1 base model refitted.

**Heartbeats can be found.** A detector that uses only past readings found plausible beats in all ten people: 54 to 97 beats per minute, with 0.53 to 1.20 seconds between beats. A beat template aligned to the R wave explained 75 to 88% of the chest signal's variation in the same data it was built from. The largest chest swing came 28 to 84 ms after the R wave.

**The P wave gives early warning.** Predicting the next R wave from the last four beat intervals misses by 27 to 87 ms (standard deviation). The P wave of lead II peaked 128 to 164 ms before the R wave in all ten people, and the P-to-R gap varied by 2 to 7 ms (standard deviation).

**Average error per person.** Leave one person out, cutoffs from 90 up to 295 seconds (51,250 per person). Error is the root mean squared error (explained under "How error is measured") in chest-sensor mV, with the same error in cal SD in brackets where it was computed:

| Forecaster | Error |
| --- | ---: |
| Persistence (repeat the last reading) | 4.259 (1.492) |
| Calibration mean (each person's usual level) | 2.852 (0.997) |
| Version 1 base, refitted | 2.826 (0.988) |
| Version 1 with aligned ECG, refitted | 2.961 (1.040) |
| Version 1 with delayed ECG, refitted | 2.827 (0.988) |
| One-cycle ridge (1.2 s of chest and breathing readings) | 2.835 (0.989) |
| Chest-only beat template | 2.541 |
| Template timed by R waves, without the P wave | 2.320 |
| Template forecast with the P wave (K 16, theta 0.8; explained below) | 1.423 (0.482) |
| The same template from ECG delayed 5.012 s | 2.934 (1.026) |
| Ridge on the version 1 inputs plus four template inputs | 1.426 (0.484) |
| Ridge on a block of 122 chest and ECG inputs, penalty 1 | 1.626 |
| MLP on the same 122 inputs, one seed | 1.452 |

On the identical 122 inputs, the MLP had lower error than the ridge model for 10 of 10 people. Which of the two is better is therefore open, and the selection step below compares them on identical inputs.

**The same in z units, cutoffs from 90 up to 290 seconds.** Version 1 base refitted: 0.9864 cal SD, 0.91% lower error than the calibration mean, better for 7 of 10 people. Version 1 with aligned ECG: 1.0387, 4.37% higher error than the calibration mean, better for 2 of 10. Calibration mean 0.9956; persistence 1.4896; linear trend 4.01. The R-only rolling personal template (C3) scored 0.790, 20.73% lower error than the calibration mean (standard deviation 9.36%), better for 10 of 10. With ECG delayed 5.012 seconds, C3 had 0.62% higher error than the calibration mean, better for 0 of 10.

**Data quality of the learning recordings,** from 55 to 291 seconds: no missing samples; the longest run of identical stored values was 100 samples in the ECG, 58 in the chest signal and 1,749 in the breathing band; the largest share of clipped samples (values stuck at the recorder's limit) was 0.0127%, in the breathing band of p011.

The Technical edition also records one after-the-fact check of version 1 on version 1's own test people. It is labelled descriptive and, as this plan fixes, appears in the Technical edition only.

## How the raw recordings become readings

The processing is version 1's, unchanged, so that the version 1 comparisons are exact.

1. **Stored numbers to millivolts.** For each channel, (stored number − the header's baseline) / the header's gain. The stored value −32,768 marks a missing sample. Lead I is not used.
2. **Smoothing that looks only backwards.** A low-pass filter removes fast fluctuations above about 65 Hz. It is causal: the filtered value at any moment uses only that moment and the 200 samples before it (201 samples, 40 ms at 5,000 per second). Technically it is a 201-tap Hamming-windowed sinc filter whose weights sum to one.
3. **One reading every 4 ms.** Every 20th filtered sample is kept, giving 250 readings per second, each stamped at the newest sample it uses. Because of the filter, each reading reflects the signal on average about 20 ms earlier; this delay is left in place, not corrected. Version 2 computes the whole recording; each reading equals version 1's at the same moment.
4. **Missing readings.** A reading counts as missing if any of the 201 samples behind it is missing.
5. **Calibration for each person.** For every person, including every new person, the mean and standard deviation of the valid ECG, breathing and chest readings from 60 up to 80 seconds. Each channel needs at least 4,500 valid readings out of 5,000, and a spread above zero. Forecasts are made in chest z units and turned back into mV as mean + standard deviation × forecast.
6. **When forecasts are made.** At every reading from 90 up to 290 seconds: 50,000 cutoffs per after-music recording. The same stretch is used for fitting, for every leave-one-person-out round and for the test.
7. **A short stretch for comparison with version 1.** From 90 up to 120 seconds, 7,500 cutoffs, which are part of the main stretch.
8. **The resting recording b001.** From 90 up to 270 seconds, 45,000 cutoffs. This recording is shorter, about 272 seconds.
9. **The target.** The filtered chest reading 20 grid steps (80 ms) after the cutoff. Because of the filter, it is built from raw samples taken 40 to 80 ms after the cutoff. Its unit is the chest sensor's mV (the accelerometer channel's output voltage set by the header gain), not acceleration in m/s².
10. **Where the detectors start.** The version 2 R detector and the chest-only detector start at 10 seconds; the C3 detector starts at the beginning of the recording. The viewer's excerpts (60 to 72 seconds) may enter calibration and input history but are never a forecast target.
11. **One set of valid cutoffs for everyone.** Each recording has one list of valid cutoffs, shared by every forecaster, so all are scored on exactly the same moments. A cutoff is valid if the target exists, the last 300 chest readings (1.2 s) and the last 296 breathing readings are present, and the last 52 ECG readings are present both at the cutoff and 5.012 seconds earlier (for the delayed comparisons). Detector and template outputs never remove a cutoff; when they are undefined they take fixed fill values.

## Only the past enters a forecast

Every input of every forecaster at a cutoff uses only readings up to that cutoff. The calibration stretch (60 to 80 seconds) lies before every cutoff. Delayed-ECG inputs use ECG readings up to 5.012 seconds (1,253 grid steps) before the cutoff. No annotation file enters any input.

## How heartbeats are found

Three detectors are used. Each looks only at readings that have already arrived, and a beat can be used for a forecast only once the detector has had time to confirm it. Section 9 of the Technical edition gives the exact index ranges.

**The version 2 R detector (from the ECG).** It works on the rescaled ECG, with missing readings set to zero. For the delayed comparisons it is given the ECG from 5.012 seconds earlier.

1. At each reading it computes the **slope energy**: the changes from one reading to the next over the last five readings (20 ms), squared and added up. A heartbeat's spike gives a burst of slope energy.
2. It sets a reference level from the calibration stretch: the 99.5th percentile of slope energy from 60 to 80 seconds, a level that only the steepest 0.5% of moments exceed. It remembers the energies of the last eight beats (at first, eight copies of the reference level). The starting threshold is 0.35 × the reference level.
3. From 10 seconds on, when slope energy rises above the threshold and more than 248 ms (62 grid steps) have passed since the previous trigger, it triggers. The R wave is placed at the reading, from 12 ms before to 28 ms after the trigger, that stands out most from the median of 40 earlier readings (from 200 to 44 ms before the trigger). The beat can be used from 28 ms after the trigger. The largest slope energy from the trigger to 28 ms after it joins the memory, the threshold becomes 0.35 × the median of the remembered energies, and the search continues.
4. If no beat is found, the threshold halves every 2 seconds after the last trigger, so that a quieter signal is still picked up.

**The chest-only detector (no ECG).** It finds beats from the rescaled chest signal itself, with missing readings set to zero. It works like the R detector with these differences: slope energy over ten readings (40 ms); a reference level at the 99th percentile; a threshold of 0.4 × the reference level, later 0.4 × the median of the remembered energies; a waiting time after each beat of 400 ms until four beat intervals exist, then the longer of 248 ms and 0.6 × the median of the last four intervals; the beat is placed at the largest chest reading (up or down) from 12 ms before to 28 ms after the trigger, usable 28 ms after it; and no halving of the threshold.

**The C3 detector.** C3 was built independently in the second draft design and is kept as a separate comparison. It looks for peaks in the ECG directly.

- It first decides whether this person's ECG spikes point up or down: the direction of the larger swing away from the median over 60 to 80 seconds.
- A reading is a candidate peak when it is the largest of the five readings around it, higher than the reading before and not lower than the reading after. It is confirmed two readings (8 ms) later.
- It counts as a beat if its height above the median of every fifth reading over the previous 2 seconds exceeds 0.45 × (maximum − median) of that span, and more than 250 ms (62.5 grid steps) have passed since the previous beat.
- For every reading it records the time since the most recent confirmed beat.
- **C3's forecast.** C3 keeps, for each 4 ms step of time since a beat (0 to 2 seconds), the running average of the person's own chest readings at that time since a beat, over every reading from 60 seconds up to the reading before the cutoff. Its forecast is the average for (time since the last beat now) + 80 ms, if at least three readings went into it; otherwise 0, the calibration mean.
- **C3d** uses the same detections shifted 5.012 seconds later.

## The beat template: replaying a person's own heartbeat pattern

The template module turns the detected beats into a forecast. It has two tuned settings:

- **K**, the number of earlier beats averaged into a template: 8, 16 or 32.
- **theta**, how closely a candidate must match the person's P wave to be accepted, as a correlation, where 1 is a perfect match: 0.7, 0.8 or 0.9.

Its fixed settings: the chest template covers 240 ms before to 1,440 ms after each beat; the ECG template covers 400 ms either side; the P wave is looked for 300 to 80 ms before the R wave, in a window of 48 ms either side of its peak; a candidate's size must be between 0.5 and 2 times the template's; the beat interval is estimated from the last four intervals.

At each cutoff:

1. Take the last beat that is available. With no beat, or with fewer than K + 5 available beats, every output is undefined.
2. **Chest template.** At each time offset around a beat, the average chest reading over the last K + 1 beats, the latest included, using only readings up to the cutoff.
3. **ECG template.** The same for the ECG, over the K beats before the latest one, again using only readings up to the cutoff.
4. **Beat interval and phase.** The beat interval is the median of the last four intervals. The phase is how long after the last R wave the target falls.
5. **Continuation and interval guess.** The continuation is the chest template's value at that phase (undefined beyond 1,440 ms). The interval guess is the template's value at the phase measured from the next R wave expected from the beat interval.
6. **P wave pattern.** From the ECG template, the stretch of 48 ms either side of the largest swing 300 to 80 ms before the R wave, measured from the median of the template's first 20 readings (its early baseline), with its average removed.
7. **P wave search.** Possible times for the next R wave run from the last R wave plus the later of 0.7 beat intervals and one beat interval minus 200 ms, up to the latest time whose P wave stretch has already been seen. For each possible time, the ECG stretch where its P wave would be is compared with the P wave pattern by correlation. A candidate whose size is less than 0.5 or more than 2 times the pattern's, or whose stretch has a missing reading, scores −1. The best candidate is accepted if its correlation reaches theta.
8. **Template forecast.** If a P wave is accepted, the chest template's value at the target's offset after the R wave the P wave predicts. Otherwise the continuation. Undefined values become 0, the calibration mean.

The module also reports the P correlation, whether a P wave was accepted, the template values 12 and 24 ms either side of the offset used, the phase since the last R wave, the phase to the predicted R wave and the beat interval. These become inputs to the learned models.

## What each model receives as input

Inputs are grouped into blocks. A model's input is one or more blocks side by side.

| Block | What it holds | Number of inputs |
| --- | --- | ---: |
| B0 | Version 1's inputs: the last 51 chest readings and the last 51 breathing readings (204 ms each) | 102 |
| B1 | One heartbeat's worth: the last 300 chest readings (1.2 s) and every fifth of the last 296 breathing readings | 360 |
| B2 | Chest-only template (chest-only detector, no P search): continuation, interval guess, time since beat (s), beat interval (s) | 4 |
| B3 | ECG beat timing (version 2 R detector, P search on): template forecast, continuation, P-predicted value, interval guess, P accepted or not, P correlation, template values 24 and 12 ms before and 12 and 24 ms after the offset used, phase since R (s), phase to predicted R (s), beat interval (s) | 13 |
| B3d | B3 computed from the ECG of 5.012 s earlier, with the chest readings left current | 13 |

Undefined template values become 0, except the two phases, which become −1. The breathing level and its change over 100 ms are already in B0 and are not repeated.

## Every forecaster in the comparison

All forecasters are scored on identical cutoffs of every recording.

**Rules with no learned weights**

- **C0, calibration mean:** the person's chest calibration mean, every time.
- **C1, persistence:** the last filtered chest reading.
- **C2, linear trend:** a straight line fitted through the last 13 chest readings (48 ms) and extended 80 ms ahead.
- **C3 and C3d:** the R-only rolling personal template, with the ECG aligned and with the ECG delayed 5.012 seconds.
- **C5, chest-only template:** the continuation from block B2.
- **T-ECG and T-delayed:** the template forecast of the template module, from the aligned ECG and from the ECG delayed 5.012 seconds.
- **T-R:** the continuation from block B3, the R-timed template without P wave anticipation. It is descriptive. It separates the gain from anticipating the P wave from the difference between detectors, because C3 uses its own detector.

**Version 1**

- **V1F:** the published version 1 weights (`weights.json`, fingerprint `55a78c3d9585b279b4d9be6a6c33ee60d08760f039b265badcc25d54e3366d8a`), in its base, aligned-ECG and delayed-ECG forms, applied unchanged. This is the published specialist model for this task.
- **V1R:** version 1's inputs, rescaling and ridge model with penalty 0.02, refitted on p004 to p013 over the main cutoffs, in its base, aligned-ECG and delayed-ECG forms (with the ECG delayed both in fitting and in testing). V1R base is the comparison for P1.

**Learned models**

- **C4, one-cycle ridge:** a ridge model on block B1, with its penalty chosen from 0.001, 0.02, 0.1 and 1 by its own leave-one-person-out rounds.
- **R-chest, R-ECG and R-delayed:** ridge models on B0 + B2, on B0 + B2 + B3, and on B0 + B2 + B3d.
- **M-chest, M-ECG and M-delayed:** the MLP on the same three input sets, each the average of three models trained from different starting seeds.

Within each family, the three models differ only in the ECG block. **Version 2** is R-ECG or M-ECG, chosen as described below. Its chest-only twin and its delayed twin are the other two models of the same family, with the same settings.

**Comparisons that do not apply.** The NeuroTranslate movement model's checkpoints 0.0 and 0.1 accept no ECG, chest-vibration or breathing-band input, so they cannot forecast this target. No pretrained or shared encoder (a learned front end reused across tasks) is claimed, so the usual random-encoder control does not apply, and no random-feature MLP is run.

## How the learned models are fitted

- **Rows and weights.** Each learning person's valid cutoffs (50,000 when complete). Each person counts equally in every fit: 1/9 in a leave-one-person-out round, 1/10 in the final fit.
- **Ridge models.** Version 1's exact formula, computed in 64-bit floating point. Each person's averages are computed first and then averaged over people. Each input is scaled by its standard deviation, computed with each person counting equally; the penalty is then added to keep the weights small; the constant term is not penalised. The target is the chest reading in z units 80 ms ahead.
- **MLP.** Two hidden layers of 64 units each, using the tanh form of the GELU activation, then one output. Each input is rescaled by its mean and standard deviation over the training rows, each person counting equally. Training uses the PyTorch library and the AdamW method with learning rate 0.001 and weight decay 0.0001, on a one-cycle schedule (the learning rate rises and then falls over all updates). Batches of 1,024 rows; 4 passes over the data; each pass in an order shuffled by a generator seeded with the model's seed; the last incomplete batch dropped. Training runs in 32-bit floating point on the computer's main processor, with deterministic algorithms, 4 threads, on processor cores 16 to 31. Rows are sorted by person and cutoff before shuffling. If people have different numbers of valid rows, each row counts 1 / (number of people × that person's rows).
- **Seeds and averaging.** Three seeds: 20261127, 20261128 and 20261129. The forecaster's output is the average of the three models.
- **Export.** The weights are exported to NumPy (a standard numerical library), and scoring uses the NumPy calculation. The largest difference between PyTorch's and NumPy's outputs on all training rows is reported in the freeze file and must not exceed 0.0001 z units.

## How settings are chosen using the learning people only

Every choice uses leave one person out inside p004 to p013, scored on the held-out person's 50,000 main cutoffs. The measure is the average over the ten held-out people of each person's error in chest mV.

1. For each of the nine combinations of K (8, 16, 32) and theta (0.7, 0.8, 0.9), compute blocks B2, B3 and B3d for all ten people.
2. Run R-ECG for each combination of K, theta and ridge penalty (0.001, 0.02 or 0.1): 27 settings. Choose the one with the lowest average error. If the default setting (K 16, theta 0.8, penalty 0.02) is within 1% of the lowest, choose the default instead.
3. Run M-ECG at the chosen K and theta, with the three seeds.
4. Choose the MLP family if M-ECG's average error is below 0.99 × R-ECG's; otherwise choose the ridge family.
5. The chosen family's chest-only and delayed twins use the same settings (K for both; theta for the delayed twin; the penalty for ridge). T-ECG, T-delayed, T-R and C5 use the same K and theta.
6. Choose C4's penalty by its own leave-one-person-out rounds, with 0.02 as the default under the same 1% rule.
7. Build the development table: leave-one-person-out results for every learned model at the chosen settings, per-person results for every rule with no learned weights, and V1F on all ten (for p004 to p008 these are the people V1F was fitted on). The table is labelled optimistic, because the detector settings were chosen on p004, p007 and p008 and the 90-to-120-second results of all ten were already known.
8. Refit every learned model on all ten learning people.

## A test that no forecast uses future readings

Before any error is computed, the whole processing chain, from the raw stored numbers on, is checked for peeking at the future. For a chosen cutoff, two altered copies of the recording are made:

- (a) every raw sample after the cutoff, in all four channels, is replaced by a random whole number from −32,767 to 32,767;
- (b) the recording is cut off right after the cutoff.

Every forecaster's forecast and every input value at that cutoff must equal the unaltered ones exactly. If anything changes, some part of the chain used readings from after the cutoff.

- **Learning people:** 200 cutoffs per person, for every forecaster, before the freeze. The cutoffs are drawn without repeats from the main cutoffs using NumPy's random generator seeded with 20261127 + the subject number; the replacement values use a generator seeded with 20261127, the subject number and the cutoff. Any change is a coding error: it is fixed on the learning people, the development tables and selection are rerun, and the fix is recorded in the freeze file.
- **Scored recordings:** 200 cutoffs on every main test, secondary and resting recording (b001 uses 101 as its subject number), after the data-check report is sealed and before any error is computed. The test reads no target. Any change stops scoring. Nothing is then scored until a reviewed new protocol version decides, and the event is recorded as a deviation.

## Freezing the models before any test file is downloaded

A file named `FREEZE.json` in this folder will record:

- this plan's commit and the fingerprints of `PROTOCOL.json`, `PROTOCOL.md`, `allocate.py` and `ALLOCATION.json`;
- the fingerprint of every code file used to fit, forecast, test for future readings and score;
- the chosen K, theta, ridge penalty, C4 penalty and model family, with the full leave-one-person-out tables and their fingerprints;
- the fingerprint of every weight file (each ridge model, each MLP seed model, C4, V1R);
- the difference between PyTorch's and NumPy's outputs for each MLP model;
- the learning people's future-readings test report, which must show no change at all;
- the computing environment: versions of Python, NumPy and PyTorch, processor model, thread settings and operating system;
- a search of the computer's home and scratch folders, by file name (rest, music, after-music and old correction files numbered 014 to 020, and p001.dat) and by the fingerprint of every file of 12,000,000 bytes, showing that no main test file and no p001.dat exists on the computer.

A separate reviewer admits the freeze file. The lead commits it to this folder and pushes it to GitHub.

## Downloading the test recordings

- **Precondition.** Both the plan commit and the freeze commit are visible on GitHub (`github.com/eliminatenoise/Interoceptomics`). Their commit identifiers are recorded before the first request.
- **What is requested.** From `https://physionet.org/files/cebsdb/1.0.0/`: first the file list `SHA256SUMS.txt`, which must match its fingerprint (otherwise the download stops, the lead is told, and nothing else is fetched); then the recording and header files of p014 to p020 (14 files); then p001.dat and p001.hea. 17 requests, about 96 MB.
- **Pace.** One connection, one file at a time, at least 1 second between requests. At a "too many requests" answer (HTTP 429) or any other refusal, downloading stops and the event is recorded; the lead decides when to resume, respecting any waiting time the server asks for.
- **Checks.** Each file's fingerprint must match its pin. A mismatch allows one new attempt after at least 60 seconds. If that also mismatches, downloading stops and the lead is told. Nobody is replaced by another person. If the pinned bytes cannot be obtained, that person fails the first data check.
- **Storage and record.** Files go to a private folder outside the repository (`private/cebs-test/`). A private log, `private/DOWNLOADS.json`, records the address, server answer, time (UTC), size and fingerprint of every request. A public copy without local folder names goes into `source-verification.json`.
- **Never.** No `.atr`, rest or music file of people 14 to 20, and no other file, is requested before the results file is sealed.

## Data checks before any scoring

The checks concern the integrity of the data only. They run before any forecast is scored and are the same for every forecaster. No recording is ever left out because of how the detectors behaved, what the signals looked like or how large any model's error was, and a person who is left out is never replaced. Every check value is reported for every scored recording.

- **QC1, right files.** The recording and header fingerprints match their pins (for p002 and p003, the bytes of b002 and b003 match the pins of p002.dat and p003.dat), and the downloaded file list matches its pin.
- **QC2, header contents.** Six non-empty lines; the record name; 4 signals; 5,000 samples per second; 1,500,000 samples per channel (b001: 1,360,050); each signal line names the record's `.dat` file with storage format 16 and block 0; labels I, II, RESP and SCG in that order; positive gains; a final comment "#After music listening for subject N" with N the subject number (b001: "#Baseline for subject 1"); a `.dat` file of 8 bytes per sample time; and four whole-recording checksums that match the header.
- **QC3, missing values.** Version 1's rule for missing readings. Calibration needs at least 4,500 of 5,000 valid readings per used channel and a spread above zero. At least 90% of the forecast cutoffs must be valid (45,000 of 50,000; for b001, 40,500 of 45,000).
- **QC4, flat signal.** From 55 to 291 seconds (b001: to 271 seconds), a run of identical stored values of at least 2,500 samples (0.5 s) in the ECG or chest signal, or at least 25,000 samples (5 s) in the breathing band, excludes the recording.
- **QC5, clipping.** In the same span, more than 1.0% of samples at the recorder's limits (+32,767 or −32,767) in the ECG, breathing or chest channel excludes the recording; from 0.1% to 1.0% is flagged only.

The data-check report is written and its fingerprint recorded before any forecast file is written.

**How many people a verdict needs.** n is the number of main test people who pass all five checks. A comparison then needs at least k(n) = ceil(0.8 × n) wins, that is 80% of n rounded up: 6 of 7, 5 of 6, or 4 of 5. If n is below 5, every result is reported and no verdict is given. When an excluded recording can still be read, every forecaster is still scored on it and reported as descriptive.

## Scoring, once, in a fixed order

1. Download (see "Downloading the test recordings").
2. Data checks on every scored recording; seal the report.
3. The future-readings test on every scored recording, reading no target.
4. Forecasts from every forecaster at every cutoff of every scored recording, written to private forecast files together with the list of valid cutoffs.
5. A lock file, `SCORE-LOCK.json`, holding the fingerprints of every forecast file, the data-check report, the freeze file and the scoring code, written before any error is computed.
6. A separate program reads the measured targets and the locked forecasts, computes every measure once, and writes `results.json`.
7. An independent review of `results.json` against this plan.

There is a single scoring run, and nothing is re-scored after any change. If an error is found after scoring, the original results stay published beside any correction, and the correction is labelled post hoc (made after seeing the results).

## How error is measured, and how uncertain the averages are

**For each person and forecaster:**

- **Root mean squared error (RMSE)** in chest mV over the valid cutoffs: square each difference between forecast and measured value, average the squares, then take the square root. Large misses count more than small ones. This is the main measure.
- RMSE divided by the person's cal SD (error in z units).
- **Mean absolute error (MAE)** in mV: the average size of the misses, ignoring their sign.
- **Skill against the calibration mean:** 1 − RMSE / RMSE of C0. Zero means no better than the person's usual level.

An invented example: three forecasts miss by +1, −2 and +2 mV. The squares are 1, 4 and 4; their average is 3; the RMSE is the square root of 3, about 1.73 mV. The MAE is (1 + 2 + 2) / 3, about 1.67 mV.

**Across people:** the mean, median and range of each measure, each person counted once, whether their signal is large or small.

**Comparisons between two forecasters:** for each person, the relative reduction in percent; then its mean, median and range across people, the number of wins (ties are not wins) and the mean difference in mV. An invented example: if a comparison forecaster's error for one person is 2.00 mV and version 2's is 1.50 mV, the relative reduction is 100 × (2.00 − 1.50) / 2.00 = 25%, and that person is a win. Against C0, the relative reduction equals 100 × the skill.

**Uncertainty.** A paired bootstrap over people estimates how much the averages could move with a different set of people. It draws, at random and with repeats allowed, as many people as there are in the group; computes the average for that draw; and does this 10,000 times, with NumPy's random generator seeded with 20261127. "Paired" means that every comparison in a group uses the same draws, so each person's results stay together. The interval reported is the middle 95% of the 10,000 averages (from the 2.5th to the 97.5th percentile). It is given for each mean relative reduction, each mean difference in mV and each forecaster's mean RMSE. With seven people this interval is coarse: its lower end is roughly the mean minus 0.72 × the standard deviation across people. In an invented example, a mean reduction of 10% with a standard deviation of 8% across people would give a lower end of about 10 − 0.72 × 8, roughly 4.2%.

**Overlapping forecasts.** Cutoffs 4 ms apart overlap and depend on each other. People are the unit of replication, not cutoffs.

## What counts as success

The verdicts use the n main test people who pass the data checks, with k(n) as above. "Version 2 beats X" holds when all three of these hold:

1. the mean relative reduction against X is above 0;
2. at least k(n) of the n people are wins (6 of 7 if all seven pass);
3. the lower end of the bootstrap 95% interval of the mean relative reduction is above 0.

| Verdict | Rule |
| --- | --- |
| P1, version 2 beats version 1 | Version 2 beats V1R base with a mean relative reduction of at least 10%, and against C0 the mean relative reduction is above 0 with at least k(n) wins. |
| P2, ECG timing adds information | Version 2 beats its chest-only twin, and version 2 beats its delayed twin. |
| P3, version 2 beats the R-only template | Version 2 beats C3. |

Each verdict is reported as "supported" or "not supported" (or "no verdict" if n is below 5), together with every number it uses. Everything else is descriptive: no verdict, and no claim of statistical significance or about people in general.

## What will be reported whatever the result

Besides the three verdicts, the results will list:

- every forecaster on every scored recording: RMSE in mV and in cal SD, MAE, and skill against C0;
- T-ECG against version 2: what the learned combination adds over the template alone;
- T-ECG against T-R: the gain from anticipating the P wave within one detector; and T-R against C3: the difference between detectors and templates;
- M-ECG against R-ECG, whichever family was chosen;
- V1F in its base, aligned-ECG and delayed-ECG forms on new people;
- V1R with aligned ECG against V1R base and V1R with delayed ECG: version 1's own question asked again on new people;
- T-ECG against T-delayed, and C3 against C3d: the timing checks that involve no learning. A delayed control could partly line up again for a very regular heart whose beat period divides evenly into 5.012 seconds, so each delayed template's own error is reported beside it;
- C4, C5, persistence and linear trend;
- the error by where the target falls after the last available R wave, in 40 ms steps from 0 to 1.2 seconds plus one group for later or no beat, for version 2, T-ECG, C3 and C0;
- detector results for each recording: R beats between 10 and 290 seconds, median and range of the beat intervals, the share of cutoffs with an accepted P wave, the share with the template defined, and the number of chest-detector beats;
- the 90-to-120-second table, for comparison with version 1;
- the tables for p001 to p003 and for b001;
- optionally, after `results.json` is sealed: how version 2's R detections match the database's annotations for p014 to p020 (the share of annotated beats with a detection within 50 ms, and the share of detections matched). This affects no result.

## The three secondary people and the resting recording

- **p001 to p003.** The same processing and the frozen final models, cutoffs from 90 up to 290 seconds, and the same data checks. The viewer's 60-to-72-second excerpt of b002 and b003 (the bytes of p002 and p003) lies inside calibration and input history and is never scored. Results for each person and their mean are reported separately from the seven main test people, without a bootstrap. A combined table of the main and secondary people, with bootstrap intervals, is also reported as secondary. No verdict.
- **b001.** The same processing and frozen models; calibration from 60 to 80 seconds; cutoffs from 90 up to 270 seconds; the data checks with its own sample count and header comment. The viewer's 60-to-72-second excerpt lies inside calibration and input history and is never scored. It is one person in a different condition, kept apart, with no verdict. b002 and b003 are never called resting recordings.

## Sentences fixed now for the Simple edition of the results

The results' Simple edition will use these sentences. The results replace X, Z, N, Y, a and b, and the rule chooses which outcome sentence appears. No other wording about the outcome is added. In the sentences, N is the number of test people the verdict uses, X and Z are numbers of those people, Y is an average reduction in percent, and a and b are the smallest and largest reductions; ID and REASON name an excluded recording and why it was excluded.

**Always included**

- "Version 2 learned from ten volunteers and was tested once on seven others whose recordings were downloaded only after the plan and the finished models were published."
- "Each forecast uses only readings taken up to the moment of the forecast."
- "The vibration sensor and the breathing band give voltages in millivolts. They do not measure chest movement in physical units, signals in sensory nerves, or anything a person felt. All recordings come from one laboratory, with people lying still after listening to music."
- "We compared it with simple rules: each person's usual reading, the last reading, the recent trend, and each person's own average heartbeat shape timed by the heart's electrical signal."

**Sentences chosen by the outcome**

- P1 supported: "Its error was lower than that of the first version's model, refitted on the same ten volunteers, for X of N people, by Y% on average (range a% to b%)."
- P1 not supported: "It did not meet the rule for doing better than the first version's model refitted on the same ten volunteers: its error was lower for X of N people, by Y% on average (range a% to b%)."
- P2 supported: "Heartbeat timing from the skin electrodes lowered the error for X of N people compared with the same model without it, and for Z of N compared with timing taken from 5 seconds earlier."
- P2 not supported: "Heartbeat timing from the skin electrodes did not lower the error consistently (X and Z of N people)."
- P3 supported: "It also did better than each person's own average heartbeat shape for X of N people, by Y% on average."
- P3 not supported: "It did not consistently do better than each person's own average heartbeat shape (X of N people, Y% on average)."
- No verdict: "Fewer than five test recordings passed the data checks, so no conclusion is drawn; every result is still listed."
- Exclusion: "Recording ID was not used for the conclusions because REASON."

The after-the-fact check of version 1 mentioned earlier appears in the Technical edition only, labelled descriptive.

## What will be published, and where

Everything goes into this folder, `models/chest-vibration-v2`, committed by Interoceptomics contributors on a new branch. The lead pushes it to GitHub. The version 1 folder is not changed. There is no browser page for now, because presentation work on Interoceptomics is paused. This Simple edition of the plan was added in its own commit after the plan commit; it changes no file of the plan.

- **The plan commit:** `PROTOCOL.md`, `PROTOCOL.json`, `allocate.py`, `ALLOCATION.json` and `.gitattributes` (which keeps every file's bytes identical on every operating system, so that the fingerprints hold).
- **The freeze commit:** `FREEZE.json`; the code for fitting, forecasting, the future-readings test and scoring; the weight files; and the leave-one-person-out tables.
- **The results commit:** `results.json`, `qc-report.json`, `SCORE-LOCK.json`, `source-verification.json`, `NOTICE.md`, the Technical README and the Simple edition of the results, `predict.py`, `invented-examples.json`, `reproduce.py`, `requirements.txt` and `SHA256SUMS`.
- **The predictor, `predict.py`.** It needs only NumPy. It takes the person's 20-second calibration readings (or their means, standard deviations and the detectors' starting energies) and an unbroken filtered history of readings at 250 per second, at least 30 seconds long and ending at the cutoff, in the order ECG lead II, breathing band, chest sensor. It runs the frozen detectors and templates from the start of the supplied history and returns every forecaster's forecast 80 ms ahead, in chest-sensor mV. Until the detectors' memories and the templates have filled, which takes about K + 4 beats, the forecasts depend on where the supplied history starts. With fewer beats it returns the fill values and says so. The evaluation, with the detectors started at 10 seconds, is the reference.
- **Examples and data.** Only invented input examples are published. No participant's recording, template or forecast values are committed; templates are computed when the program runs, from the user's own data.
- **Editions.** Technical and Simple editions, each with a first draft, a distinct rewrite and a reading by a separate reader before publication. The Technical edition of the results will hold the plan, allocation and freeze fingerprints and commits, the data pins, the data-check table, per-person tables for every forecaster, every comparison with its interval, the verdicts, the development table labelled optimistic, the beat-timing and detector results, the 90-to-120-second, version 1 and secondary tables, the descriptive after-the-fact check of version 1, any deviations (or "none"), and the limits listed in "What a result can and cannot show".

## Steps, computer use and expected times

All computing runs on the computer's main processor, with no graphics processor: at most 16 threads in total, on cores 16 to 31; MLP jobs use 4 threads each, at most four at once; memory under 8 GB; private disk use under 300 MB.

The amount of tuning is fixed in advance: 27 R-ECG settings, 4 C4 penalties, and one MLP setting with three seeds. Each MLP gets 1,756 updates per leave-one-person-out round and 1,952 in the final fit; there are 90 MLP fits in the leave-one-person-out rounds and 9 final fits.

| Step | Work | Expected time |
| --- | --- | --- |
| S1 | A separate reviewer admits this plan; the lead commits and pushes it | reviewer and lead time |
| S2a | Write the processing, detectors, templates, inputs, fits, future-readings test and scoring (learning people only) | about 2 hours |
| S2b | Inputs for the 9 combinations of K and theta × 10 people, aligned and delayed | about 5 minutes |
| S2c | Ridge rounds: 27 R-ECG settings, C4, V1R, ridge twins | under 2 minutes |
| S2d | M-ECG rounds: 3 seeds × 10 rounds, four 4-thread jobs | about 25 minutes |
| S2e | M-chest and M-delayed rounds for the development table | about 45 minutes |
| S2f | Final fits of every learned model; NumPy export check | about 15 minutes |
| S2g | Future-readings test on the ten learning people | about 20-40 minutes |
| S2h | `FREEZE.json` with the search of the computer; the reviewer admits it; the lead commits and pushes it | about 30 minutes plus reviewer and lead time |
| S3 | Download 17 files, about 96 MB | about 2 minutes |
| S4 | Data checks and seal; future-readings test on 11 scored recordings; forecasts; score lock; one scoring run | about 20-40 minutes |
| S5 | Independent review of the results; Technical and Simple editions; NOTICE, predictor, examples | about 2 hours plus reader time |

In total, about 6 hours of work from admission to a reviewed result, plus the waits for reviewers and commits.

## Changes after admission, and points the plan makes exact

Any departure from this plan after admission is recorded with its reason in `FREEZE.json` (before the download) or in `results.json` (after it), and stated in both editions. A change made after any test byte has been read cannot affect a verdict and is reported as post hoc.

The plan also makes the design that was reviewed before it was written exact in these places:

- Each beat contributes to the ECG template only readings up to the cutoff. The exploration code took every beat's full window of 400 ms either side, which can read past the cutoff when beats are less than 400 ms apart.
- Missing readings: the detectors see 0; templates average valid readings only; a P search window with a missing reading scores −1; a P search with an undefined template value is skipped.
- B2 has four inputs. The exploration code's duplicate continuation input and its breathing level and change inputs, which copy B0 inputs, are not repeated.
- The MLP rounds run only at the K and theta chosen with R-ECG, to keep within the budget; the MLP has no penalty to tune.
- The GELU activation uses its tanh form, so that the NumPy predictor computes exactly the same formula; scoring uses the NumPy export.
- C4's penalty choices include 1, as in the first draft design.
- The tie rule is exact: the default setting is chosen when it is within 1% of the lowest average error.
- T-R is added as a descriptive forecaster, because C3 uses its own detector and P3 compares version 2 with C3.
- The file list is downloaded first, as the anchor for the file checks.
- The future-readings test uses both replacement and cutting off, and checks every input as well as every forecast.
- The three secondary people get per-person and mean results without a bootstrap; the combined ten-person table gets one.

## Open items for the lead and the owner

- **Lead:** confirm that the owner's instruction of 27 November 2026 to continue training the models covers this training and download; push the plan commit and, later, the freeze commit before any download, and record both commit identifiers.
- **Owner:** nothing blocking. For later, optionally: genuine resting recordings of people 2 to 20 exist only in an unreleased older correction archive (a002 to a020), whose licence and origin are unclear. They are not used. a014 to a020 belong to test people and stay untouched in any case.

## Fingerprints of the main test files

These SHA-256 fingerprints come from the database's file list. A downloaded file is used only if its fingerprint matches.

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
