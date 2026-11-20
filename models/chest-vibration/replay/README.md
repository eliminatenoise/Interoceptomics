# What did the chest sensor record next?

The browser estimates the chest accelerometer voltage 80 milliseconds after a chosen cutoff. Compare the estimates with the later sensor reading by selecting **Reveal the later reading**. The page includes the first 250 test cutoffs for each of five people, from 90.000 to 90.996 seconds. All five excerpts use the same interval. [Open the recording viewer](https://eliminatenoise.github.io/Interoceptomics/inside/recording-forecast.html)

The blue forecast adds ECG lead II to the chest and breathing measurements. The earlier-ECG control uses its own fitted model and electrical readings from 5.012 seconds earlier. All forecasts use only observations at or before the cutoff. The displayed future reading uses raw chest samples from 40 to 80 ms after it.

## Inspect the full recording

In the viewer, expand **Open the full 30-second test interval**. Download an original p009 through p013 waveform from the linked version of CEBSDB and choose that .dat file. The browser verifies the file's SHA-256 against the source catalogue. It uses the matching header's gains and baselines, filters the sensor samples and calculates that person's calibration from 60.000 to 79.996 seconds. Every valid 4-ms cutoff from 90.000 to 119.996 seconds can then be inspected. The browser never uploads the file. The default one-second examples work when the HTML is saved offline.

## Reproduce the excerpts and page

From this directory, supply a local cache of CEBSDB 1.0.0 waveforms and headers. The extractor verifies each complete source file and all four channel checksums. Use the parent study's Python requirements. The page builder itself needs only the Python standard library.

```sh
python prepare.py --source PATH_TO_CEBS_FILES --fetch
python build.py
```

Each excerpt carries 52 history rows leading to its first forecast, the following test interval and the 20 grid steps needed for the final target. Its companion electrical history is exactly 1,253 steps earlier on the 250 Hz grid. The page computes the forecasts from the distributed coefficients. Its error table uses only cutoffs in the selected excerpt or full test interval. No additional training is performed.

CEBSDB 1.0.0 was contributed by Miguel Ángel García González and Ariadna Argelagós Palou through PhysioNet. These abbreviated and filtered sensor measurements remain under the Open Data Commons Attribution License 1.0. [Original database](https://doi.org/10.13026/C2KW23) · [Original study, platform and reuse credits](../NOTICE.md)
