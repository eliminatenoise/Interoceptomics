# What changes around a heartbeat?

Skin electrodes pick up the heart’s electrical activity. A small accelerometer on the chest picks up vibration, and a band around the chest responds to breathing. Open any of three 12-second recordings and move the cursor. All three traces show the same instant. Choosing a different ECG lead shows the heart’s electrical activity from a second direction. [Open the recordings](https://eliminatenoise.github.io/Interoceptomics/inside/)

To use the viewer offline, save the linked HTML file and open it in a current browser. All the measurements travel with it. If you downloaded this directory from GitHub, open the launcher for your operating system or double-click `index.html`.

## Read a beat

Open recording b001 and choose ECG lead II. The first dotted line lands at **60.4408 seconds**. Choose **Measure from this sample**, switch to lead I and step to its next mark at **60.4536 seconds**. The two marks are 12.8 milliseconds apart. Each is a beat label from the archive for that electrical lead. Their spacing describes the labels. Neither sensor records when the person felt their heartbeat.

The source recorded four channels 5,000 times a second. Each excerpt starts 60 seconds into its file. The last sample is at 71.9998 seconds. At each cursor position, the page converts the stored integer into millivolts using the scale and baseline for its channel. The breathing band and accelerometer report sensor output voltages. Recovering a lung volume, force or acceleration in physical units would require additional calibration.

## Check a forecast against what happened

Pick one of five recordings the model was tested on. Move the cutoff, compare the forecasts, then reveal the vibration measured 80 milliseconds later. The built-in excerpts use the first second of test cutoffs from each recording. Opening an original waveform file lets you try all 7,500 cutoffs for that person and reproduce their full-interval error. [Run the recorded forecast](https://eliminatenoise.github.io/Interoceptomics/inside/recording-forecast.html)

## Can the electrical signal improve a forecast?

We used ten other people from this archive to test a prediction. Five supplied the training recordings. In the other five, adding ECG to chest vibration and breathing increased the average person-relative forecast error by 8.76% at 80 milliseconds. Change an invented ECG pulse in the browser to see how these fitted models respond, then compare the forecasts with what happened in the measured recordings. [Try the forecast](https://eliminatenoise.github.io/Interoceptomics/inside/forecast.html) · [Study and per-person results](../../models/chest-vibration/README.md)

## Which recordings and labels match?

The database describes measurements from 20 people resting supine. We selected the first three b-series filenames and the same time window from each before inspecting these traces. While verifying the files we found two archive mismatches. [Database and methods](https://physionet.org/content/cebsdb/1.0.0/) · [Publisher’s archived correction](https://archive.physionet.org/pn6/cebsdb-tmp/)

| Waveform in the download | Calibration used | ECG beat labels |
| --- | --- | --- |
| b001 | b001.hea | 13 source marks on each lead in this excerpt |
| b002 | p002.hea | Omitted |
| b003 | p003.hea | Omitted |

The b002 and b003 waveform files are byte-for-byte copies of p002 and p003 in the same release. For both, all four full-record channel checksums match the p header. The b header contains different calibration values, and its annotation file belongs to a different waveform in the historical archive. The viewer therefore uses the matching p calibrations and leaves the marks off these two recordings. Study phase cannot be compared from the three filenames. [Release checksums](https://physionet.org/files/cebsdb/1.0.0/SHA256SUMS.txt) · [Excerpt and calibration table](data/manifest.json)

## Reproduce the viewer

Rebuild the page from its three included waveform excerpts and calibration table with Python 3.

```sh
python build_page.py
```

To reproduce the excerpts themselves, install the dependency in an isolated Python environment, then run these commands from this directory. The extractor downloads the versioned archive files into a local cache, checks the original file hashes and four channel checksums, then copies the selected rows. It keeps the original 16-bit counts.

```sh
python -m pip install -r requirements.txt
python build_recordings.py --source .source
python build_page.py
```

## Source and reuse

The recordings come from the **Combined measurement of ECG, Breathing and Seismocardiograms (CEBS) database, version 1.0.0**, contributed by Miguel Ángel García González and Ariadna Argelagós Palou of the Universitat Politècnica de Catalunya through PhysioNet. The database and the excerpts here are available under the **Open Data Commons Attribution License v1.0**. Retain attribution and the licence notice when sharing them. This edition selects short excerpts, applies the matching per-channel calibrations, and omits the two unpaired sets of beat marks. The project’s own viewer code uses the repository’s CC0 dedication. [CEBS data](https://doi.org/10.13026/C2KW23) · [Data licence](https://physionet.org/content/cebsdb/view-license/1.0.0/) · [Code dedication](../../LICENSE)

García-González MA, Argelagós-Palau A, Fernández-Chimeno M and Ramos-Castro J. *A comparison of heartbeat detectors for the seismocardiogram*. Computing in Cardiology 40, 461–464 (2013). [Study](https://www.cinc.org/archives/2013/pdf/0461.pdf)

Pollard T and colleagues. *PhysioNet as a global platform for biomedical research*. Nature Health (2026). [Platform paper](https://doi.org/10.1038/s44360-026-00096-z)
