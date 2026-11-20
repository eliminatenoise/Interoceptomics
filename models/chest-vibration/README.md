# Can skin electrodes help predict the next chest vibration?

Give a model a fifth of a second of chest vibration and breathing-band readings. Ask what the vibration sensor will read 80 milliseconds later. Would adding the heart’s electrical signal help? For two of five new people it did. For the other three it made the forecast worse.

The model learned from five volunteers and was tested on five different people. Adding the electrical signal increased forecast error by **8.76% on average** across those five. Simply repeating the most recent vibration reading was worse than either fitted model for every test participant. The useful comparison was with what the chest sensor and breathing band could already predict.

| Held-out person | Chest + band error (mV) | Add ECG (mV) | Error reduction from adding ECG |
| --- | ---: | ---: | ---: |
| p009 | 2.645 | 3.238 | −22.42% |
| p010 | 1.910 | 2.099 | −9.85% |
| p011 | 2.673 | 2.582 | +3.39% |
| p012 | 4.760 | 4.529 | +4.85% |
| p013 | 2.199 | 2.634 | −19.75% |

Each entry gives the root mean squared error over one 30-second interval. Square the difference between each prediction and the measured sensor voltage, average those squared differences, then take the square root to return to millivolts. Larger misses carry more weight. Negative percentages mean the electrical input increased the error. Each person contributes once to the average, whether their sensor swings by a few millivolts or many. The median change was a 9.85% increase in error. The same five comparisons with an otherwise identical model trained and tested on ECG delayed by 5.012 seconds gave two wins and an average error increase of 8.72%. The experiment required the aligned ECG to beat both comparisons on average and for at least four people against each. It missed that mark. [Full scores and controls](results.json)

## Try the forecast

Open the browser forecast and move the pulse slider. It calculates both fitted models on your device. You can save the page and use it offline. [Try the interactive forecast](https://eliminatenoise.github.io/Interoceptomics/inside/forecast.html)

The example histories are invented. They share the same breathing and chest readings. One has an extra pulse in the electrical signal, 52 milliseconds before the forecast. Run the two examples to see what that pulse changes. The command-line example uses Python 3.12 or later and NumPy. From this directory, run the following in a Python environment, or use the Windows, macOS or Linux launcher once NumPy is installed.

```sh
python -m pip install -r requirements.txt
python predict.py
```

To supply your own series, copy the example JSON and run `python predict.py my-examples.json`. Each example takes 52 consecutive, oldest-first **filtered millivolt readings at 250 Hz**, ordered ECG lead II, breathing-band voltage, then chest-accelerometer voltage. Supply one mean and standard deviation per channel from the earlier calibration interval. The result gives the predicted chest sensor voltage 80 milliseconds after the last reading for both fitted models, beside the last value itself. The examples have no measured future response. [Example inputs and expected outputs](invented-examples.json) · [NumPy predictor](predict.py)

## What was measured

The volunteers lay still on their backs. Skin electrodes picked up electrical activity at the body surface. A chest band responded to breathing, and a chest-mounted accelerometer picked up vibration. Those last two channels carry **sensor output in millivolts**. Interpreting those voltages as lung volume or physical acceleration would need another calibration. These recordings contain no direct measure of what anyone felt or of signals travelling along sensory nerves. Five held-out people from one recording session type give a narrow test. The result leaves open whether a different model, more people or a different interval would predict better. [CEBS database and methods](https://physionet.org/content/cebsdb/1.0.0/)

We used one post-music recording from each of ten participants. The electrical, breathing and vibration channels were sampled 5,000 times a second. A low-pass filter and a slower 250 Hz grid keep each input sample tied to the last instant it could have been known. The target voltage labelled “80 ms ahead” incorporates raw samples from **40 to 80 ms after** the last available input. Filtered readings from seconds 60–80 set each participant’s voltage scale. Forecasts ran every 4 ms from 90 seconds up to, but excluding, 120 seconds. Real past vibration, breathing and ECG were available at each forecast cutoff. Consecutive forecasts overlap heavily. The five held-out people supply five comparisons. The 7,500 overlapping forecast cutoffs in each recording describe that person’s error. [Frozen protocol](protocol.json)

Training used p004–p008. The five held-out people were p009–p013. The predictor fitted separate linear weights for each recent chest and breathing reading and, when included, for recent electrical levels and the magnitude of their changes. A fixed ridge penalty limited the size of the weights. The delayed comparison used the same person’s ECG from 5.012 seconds earlier at both fitting and scoring. Another diagnostic substituted delayed ECG only at scoring. Each of the ten p-series waveforms also appears under a b-series filename in this release. We counted each recording once, used its matching p-series header and verified all four full-record channel checksums. [Verification by recording](source-verification.json) · [Publisher’s archive correction](https://archive.physionet.org/pn6/cebsdb-tmp/) · [Data, rights and citations](NOTICE.md)

## Reproduce the fit

From this directory, the first command below downloads the 20 source files plus the archive checksum index, about 120 MB, into a separate cache. The three generated JSON files contain fitted weights, source verification and complete scores. The second command reuses that cache offline. To rebuild the self-contained browser example locally, run `python build_browser.py forecast.html` and open the resulting file. On the recorded run, Python 3.13.15 and NumPy 2.5.5 used one CPU process and one OpenBLAS thread. Floating-point roundoff can vary across numerical libraries.

```sh
python reproduce.py --source ../cebs-source --output ../rebuilt --fetch
python reproduce.py --source ../cebs-source --output ../rebuilt
```

The protocol was fixed before downloading the ten records. Its SHA-256 is `6e3be3dd3a3fb19a643865df1953616d88cd927fe192904de1ed2e1a095bf5f5`. The reproducer checks the protocol digest, the PhysioNet release index, both files per person, the channel calibration and each complete waveform before fitting or scoring that person. All ten contributed their full calibration and forecast intervals. [Fitting and evaluation code](reproduce.py) · [File checksums](SHA256SUMS)
