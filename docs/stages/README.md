# The experiment guide

[Open the guide](https://eliminatenoise.github.io/Interoceptomics/stages/). Choose a vision and then a stage or task. Move through its steps with the Previous and Next buttons or the left and right arrow keys. The address follows the selected step. Copy it to share a particular experiment.

**Small vision** connects the proposed human tasks to the actual NeuroSurge controls, the separate camera preview and NeuroTranslate 0.0 recording studies. Open the walking example to see one sensor’s XYZ history and a saved forecast beside the later reading. Move the input slider to inspect all 16 observations. The example comes from a training participant. The coloured limb in the 3D sketch follows a programmed movement. [Recording and licence](recording/NOTICE.md)

**Big vision** covers all 22 numbered steps of the six proposed stages, the five introductory aims, and the modelling and human-measurement questions surrounding them. On a replay step, select a delayed reference and move through the task to see it fall behind. The schematic has no animal recordings. Each step links to the page in the [technical script](../current/Interoceptomics-Script-Technical.pdf) that describes the proposed experiment and cites its references.

## Run the guide offline

From the root of a copy of this repository, run the following command with Python 3. On Windows, use `py -3` in place of `python3` if that is how Python is installed.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Open [the local guide](http://127.0.0.1:8000/stages/). The schematics, measured walking excerpt, forecasts and script links use files on this computer. Links to the separate projects and the downloadable public atlas need internet access. Press Ctrl+C in the terminal to stop the guide.

If you already have the separate 3D companion, start it using its own launcher. Under **Open the models**, expand **Use my local 3D companion** and paste the address printed by that launcher. For Stages 3–5, select the indicated step in the companion’s own menu.

## Edition and reuse

The roadmap follows the selected 111-slide presentation script with NeuroReplay at 0.3 and 0.5. The source technical PDF has SHA-256 `ae07b1d7784ad28945b7ece9da528da585037032292f347e7dafec3c01b24e7d`. The programme terms used here follow glossary revision 37, SHA-256 `62b4de1f56981469bae39c5ed5eb51540b027ac2f1f780dcf68dc018751d0931`. The project dedicates its own guide text, diagram geometry and viewer code to the public domain under [CC0 1.0](../../LICENSE). The walking measurements retain their [CC BY 4.0 attribution](recording/NOTICE.md). The separate atlas download carries its own licences and notices. [Atlas credits](../../RIGHTS.md)
