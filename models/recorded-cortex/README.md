# Recorded cortical activity during finger cues

One person supplied 88 pairs of finger-cue and blank intervals. The viewer compares electrical power within each recording contact, then summarizes the change across contacts in a named brain area. The two contacts in the upper primary motor cortex averaged −5.67 dB in the 12–20 Hz band and +2.90 dB in the 70–110 Hz band. These changes describe this recording. They cannot identify a movement’s cause or what the person felt. [Explore the data in 3D](https://eliminatenoise.github.io/Interoceptomics/recorded-cortex/)

The [regional table](regional-activity.json) gives the mean and middle half of trial changes for each area. The [contact table](contact-means.json) gives mean changes at each recording site. The contributor’s documentation identifies 42 of 46 sites by region. Four sites have a recorded signal and no named area. One site is described only as rolandic, around the central sulcus. The anatomy extractor preserves that distinction when it places the sites on the original surface. [Anatomy source and extractor](anatomy/README.md)

The [methods](METHODS.md) explain the windowing, frequency analysis, sources, licence and required ethics statement. To reproduce the tables from the exact source file, install Python 3.11+, NumPy and SciPy. From this folder run the following command in a separate output directory or choose new filenames for the outputs.

```sh
python derive.py bp_fingerflex.mat rebuilt-regions.json --contact-means rebuilt-contacts.json
```

The fingerprint of the original MATLAB member and the analysis files is recorded in the [source manifest](source-manifest.json). Original data and derived research summaries are licensed under [CC BY-SA 4.0](CC-BY-SA-4.0.txt). Original project software is dedicated under [CC0](CC0-1.0.txt).

## How did the hand and cortical signal change over the cue?

Seven half-second windows follow the displayed cue and the transition to the following blank. All seven windows use the same contacts and cue pairs from this one participant. The five glove channels report movement in native sensor counts per 40 ms. The cortical contacts report changes in band power in decibels. These measurements have different clocks and units. [Time-course data](time-course/time-course.json) · [Reproduction code](time-course/derive.py) · [Frozen definition](time-course/analysis-plan.json)
