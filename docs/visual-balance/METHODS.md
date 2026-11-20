# When the room tilts

A person walked along a treadmill-mounted beam at 0.22 m/s. The researchers turned the view inside the headset. The first counterclockwise event supplies this excerpt. A point on the cap is a recorded electrode position. Its color is the measured potential at that sample. The head and sacrum paths come from the two reflective markers. Neither measurement identifies a circuit that caused a step.

## Open it

Extract the whole ZIP. Double-click Open on Windows.cmd, open Open on macOS.command or run `sh "Open on Linux.sh"`. Opening index.html directly also works. The reader, measurements and two glTF models use local files. The links to the source papers and dataset use the internet.

Drag a view or focus it with Tab and press the arrow keys. The view menus give repeatable projections. Use the clock slider or the one-sample controls to inspect the traces. A scalp site can be selected with the menu or by clicking its dot. The clock starts at the observation cutoff. Use “Measured endpoint” to read the subsequent change.

## Source and rights

Steven M. Peterson and Daniel P. Ferris recorded the signals at the University of Michigan. The source is the OpenNeuro *Perturbed beam-walking task*, version 1.0.3, Git snapshot `f15449b6aecb83044b49a1798955e8a212a68fc1`, CC0. The included material is a deidentified excerpt of one walking event. The source acquisition and processing are described in their data paper and original experiment. Ownership and the data dedication are documented in the archive. The reader and models follow the repository’s CC0 dedication. [Recording](https://doi.org/10.18112/openneuro.ds003739.v1.0.3) · [Data publication](https://doi.org/10.1016/j.dib.2021.107635) · [Experiment](https://doi.org/10.1523/ENEURO.0207-18.2018) · [CC0](https://creativecommons.org/publicdomain/zero/1.0/)

## Four reference checks

| Material | Comparison and scope |
| --- | --- |
| Original apparatus | Figure 1 of the data paper documents sensor placement and the walking task. The paper describes camera acquisition at 100 Hz, eye/scalp/neck electrodes at 512 Hz and lower-leg muscle recordings at 1,000 Hz. The apparatus image belongs to its original publication. |
| Measured positions | The EEG.chanlocs XYZ entries for all 128 scalp sites and five eye/neck sites agree with the corresponding XYZ in the electrode table within 0.005 m on every axis. The authors used an ELPOS digitizer. The coordinate sidecar names the CTF system with description EEGLAB and reports mm. The data paper's explicit statement that the table is in metres resolves the scale used here. The more precise SET coordinates retain the differences rounded away by the TSV. The near-coincident points remain in their measured locations. The glyph radius of 2.3 mm in the cap model only makes sites visible. |
| Recorded time and voltage | The BIDS log gives counterclockwise onset at zero-based fractional sample 10485.5694. One-based EEGLAB latency minus one agrees within 0.01 sample. The viewer shows samples 10359 through 10518 of scalp, eye, neck and leg recordings at 256 Hz, rounded to 0.0001 µV. The sample immediately after onset is 10486. The cutoff at 10518 is 126.682 ms after the fractional onset. The original common median reference, 1 Hz high-pass and Cleanline apply to scalp, eye and neck channels. No additional filter, averaging or between-electrode interpolation is used. |
| Marker path and timing | Both named optical triplets were checked from sample 10351 to 10558 inclusive. Neither triplet vanishes, neither contains a nonfinite value and the largest single-sample step is 1.411 mm, within the 20 mm quality threshold. The stored streams are synchronized and resampled. Each displacement is the stored position minus that same marker’s position at sample 10518. The view includes samples 10359 through 10550 inclusive. Values are rounded to 0.00001 mm. The head’s later change is (−3.899, +23.686, +12.899) mm and the sacrum’s (−3.111, +4.919, +0.575) mm in ML, SI, AP order. |

The 15 scalp channels excluded by the authors are A9, A16, A22, A23, A24, A25, A26, A27, A29, B26, B27, C8, C11, D1 and D24. Their positions remain visible as rings. The excerpt omits their voltages. The usable eye and muscle channels retain their original sign and units. The signed color scale is fixed for the whole event. Readings outside ±40 µV take the endpoint color and keep their value in the readout. All values displayed after the cutoff are measured motion. The recordings do not establish real-time acquisition latency, cortical causation or activity of a specific neural network.

## Reproduce the exports

The script `models/visual-balance/build.py` in the repository (also `source/build.py` in the ZIP) identifies the exact seven original source files by SHA-256. Download the first walking rotation session from the cited archive version that matches those hashes. Put the seven files together in one folder. With Python 3.11+ and NumPy/SciPy installed, run `python build.py PATH_TO_FILES OUTPUT_DIRECTORY`. The script refuses mismatched data. It reads the SET channel mask, the fractional event log, the electrode geometry and the little-endian float samples. It creates excerpt.js and two glTF 2.0 binary files.

The cap file places each site at [X, Z, −Y] metres using the recorded EEGLAB XYZ coordinates. Colors encode the cutoff potential on the reader’s scale, converted from sRGB to glTF linear material color. Material appearance depends on the viewer’s lighting. Each node retains the site label, source coordinates, author status and measured potential when usable. The marker file stores two line strips, with the coordinates [ML, SI, AP] converted from millimetres to metres. The two paths share a drawn origin by construction. Their relative offset on the body cannot be read from this view. The recording supplies no anatomy mesh, positive anatomical polarity for these motion channels, or co-registration between the head and cap frames.

The page opens without a server or predictive model. This one event can illustrate timing and displacement. It cannot establish a typical reaction to visual rotation or forecast performance on a new walker.
