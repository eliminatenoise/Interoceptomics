# One rat on a W-shaped track

Justin Shin and Shantanu Jadhav (2024), *Single Day W-Track Learning*, DANDI Archive, version 0.240511.0307, DOI 10.48324/dandi.000978/0.240511.0307. The authors released these data under Creative Commons Attribution 4.0 International. The same terms apply to this excerpt. Credit the authors, cite the dataset, link the licence, retain these notices and identify further changes. [Dataset](https://doi.org/10.48324/dandi.000978/0.240511.0307) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## What the dots and ticks represent

The original study tracked male Long–Evans rats during a spatial alternation task. The three arms of the W-shaped track led to reward wells. This excerpt shows subject JS14 (one rat), session 01, trial ID 0, the first annotated trip. The trial table labels it outbound, from the centre well to the left well. The recording starts at 1614.8091333333334 seconds on the file’s clock and ends at 1663.7081333333333 seconds. Both endpoints are included. The guide subtracts the start time only for the display of seconds into the trip.

The position file names the centre well as its reference frame. Its first two columns give X and Y in centimetres. The guide preserves the original coordinates, with increasing X to the right and increasing Y upwards. No compass orientation or surveyed track outline is supplied here. The dots are all 1,387 stored positions within this trial. The source describes a nominal 30-frame-per-second camera. Successive timestamps in this excerpt differ by 20.3 to 90.7 milliseconds. No values were filled in, resampled or smoothed for the guide. The dot under the orange ring is a measured-position estimate at one recorded time.

The study identified individual units by sorting recorded electrical spikes. We selected the first listed unit in the prefrontal cortex (unit 0, 38 spikes) and the first listed unit in the hippocampal CA1 region (unit 21, 2 spikes). Selection followed the order of the original units table. Each tick uses the original spike time. The first CA1 event occurred at 1627.2096666666666 seconds. The nearest tracking sample follows 18.4 milliseconds later. The excerpt does not contain continuous voltages, limb poses, measured forces or an intervention. The original study and the proposed Interoceptomics tasks are separate. Coincident movement and firing cannot establish whether a cell caused movement, or whether any guidance or skill transferred.

## Changes and reproducibility

We selected a time interval and two units, copied the original time and coordinate values to JSON, and drew the position cloud and spike rows. Display labels round their values. The file retains the source numbers. No video, article figures or laboratory photographs are redistributed. [Published excerpt](maze-trial.json) · [Rebuild script](rebuild-maze.py)

| Source item | Identifier |
| --- | --- |
| Asset | `sub-JDS-SingleDay-JS14/sub-JDS-SingleDay-JS14_behavior+ecephys.nwb`, DANDI asset `4b7c7959-04b3-4817-8f96-1af6f41888c1` |
| Archive-reported whole-file SHA-256 | `6b8cf8ce3bbe34374e10a8a310592d1ae9762b20554569bc3c45fcfecdcf67b6` |
| Trial boundaries and wells | `/intervals/trials`, row 0, ID 0 |
| Tracking | `/processing/behavior/Position/SpatialSeries/{timestamps,data}`, rows 35254–36640, zero-based and inclusive. Data columns 0 and 1 |
| Spike times | `/units/{id,spike_times_index,spike_times}`. Each unit’s index gives its exclusive stop in the shared event array |
| Recording regions | `/units/electrodes` indexes `/general/extracellular_ephys/electrodes/location`. Unit 0 maps to electrode table row 4 (PFC), unit 21 to row 10 (CA1) |
| JSON excerpt SHA-256 | `65d3223f5e2958064711b36dd98abb0f7bd6ee4c8cc556f212fd5891a514e6b7` |

To check the shipped file, install `h5py` and `fsspec[http]` in a Python environment, then run `python rebuild-maze.py` from this directory with internet access. The script checks the archive’s published asset identity, version membership and licence, reads only the required byte ranges, and compares the rebuilt excerpt byte for byte. It checks the neighbouring timestamps too, so neither end can silently lose a tracking sample. Add `--write` to regenerate the JSON. The whole-file digest above is the archive’s published value. The verification reads the selected ranges from that version and calculates the excerpt’s digest locally. [Archive asset metadata](https://api.dandiarchive.org/api/assets/4b7c7959-04b3-4817-8f96-1af6f41888c1/)
