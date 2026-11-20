# A stride in three measurements

Follow one slow stride in a 3D figure drawn from skin markers. Move the cursor from one right footfall to the next to see how electrical activity in eight right-leg muscles and the force under the feet change. The figure averages 89 strides from 30 barefoot adults. A separate foot-specific force trace has enough observations to show only 2–58% of the stride, from three people. [Open the reader](https://eliminatenoise.github.io/Interoceptomics/stride-signals/) · [Measurements and methods](OVERGROUND-STRIDE.md)

## Open offline

Extract the complete ZIP and open the launcher for your operating system at the top of the extracted folder. You can also open `docs/stride-signals/index.html` directly. A current browser is all you need to play the stride, turn the figure and read the measurements. Links to the paper and companion forecast open online. [Download the ZIP](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/stride-signals.zip)

## Rebuild

The archive and repository use the same directories for the reader and its numerical input. From their root, run these commands with Python 3.12 to rebuild the HTML and the ZIP from the included aggregate. The HTML builder checks the input SHA-256. No network access or extra Python packages are required for this step.

```sh
python docs/stride-signals/build.py
python models/stride-signals/package.py
```

To reproduce the aggregate itself, download the original walking ZIP and the article’s supplementary Word file. Follow the Python package versions and command in the measurement methods. The program selects the first 30 source participants and three slow walks per person. It checks the source files before reading the recordings. [Methods and numerical checks](OVERGROUND-STRIDE.md) · [Version 8 data](https://doi.org/10.6084/m9.figshare.7734767.v8) · [Article supplement](https://media.springernature.com/full/springer-static/esm/art%3A10.1038%2Fs41597-019-0124-4/MediaObjects/41597_2019_124_MOESM2_ESM.docx)

## Credit

Céline Schreiber and Florent Moissenet published *A multimodal dataset of human gait at different walking speeds established on injury-free adult participants*, Scientific Data 6, 111 (2019). The stride tables and the measurements embedded in the reader are CC BY 4.0. This project selected trials, aligned their walking directions and stride times, and calculated means and between-person variation. Source processing can turn missing force samples into zero and suppresses loads below 50 N. A small group mean can therefore be less than 50 N. The body surfaces, the marker links and the camera views are illustrations. The project dedicates its own code to CC0. The authors’ original licence accompanies the data. [Study](https://doi.org/10.1038/s41597-019-0124-4) · [Source licence and requested attribution](LICENCE) · [Project licence](../../LICENSE)
