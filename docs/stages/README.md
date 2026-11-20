# The experiment guide

[Open the guide](https://eliminatenoise.github.io/Interoceptomics/stages/). Choose **Human movement** or **Animal learning**, then pick a stage or task. Move through its steps with the Previous and Next buttons or the left and right arrow keys. The address follows the selected step. Copy it to share a particular experiment.

**Human movement** (Small vision) opens with a [right-wrist pointing trial](https://eliminatenoise.github.io/Interoceptomics/stages/#map-brain2body). Scrub through three seconds of scalp voltage, forearm voltage and two wrist angles. Choose where a forecast starts and see how far each trained model missed the wrist reading a quarter-second later. This public example is separate from the reported evaluation. [Wrist trial, model and licence](recording/WRIST-NOTICE.md)

Below the recording, move the time slider to bend an arm or a leg. The movement in the drawing is programmed. Select **Open the walking recording** to see measurements from a real person. Compare a computer’s prediction with what the sensor recorded 120 milliseconds later. This walk was used to train the computer model. The guide also links to the NeuroSurge game controls, the camera preview and the NeuroTranslate 0.0 studies. [Recording and licence](recording/NOTICE.md)

**Animal learning** (Big vision) covers all 22 numbered steps of the six proposed stages, the five introductory aims, and the modelling and human-measurement questions surrounding them. On a replay step, select a delayed reference and move through the task to see it fall behind. In [Stage 0.2 · Navigation](https://eliminatenoise.github.io/Interoceptomics/stages/#0.2), follow one rat across a W-shaped track in a separate published study. Use five camera readings to predict where the rat will be a quarter-second later. Add the spikes recorded during the same second, then reveal the camera reading. The browser runs two ridge models trained on 24 trips. The three examples are drawn from these training trips. An earlier trip in a different running period has a separate frame-by-frame replay of positions and spikes from two cells. [Forecast sources and method](recording/wtrack/NOTICE.md) The straight-corridor sketch below shows the proposed experiment. [W-track recording and licence](recording/MAZE-NOTICE.md) Each step links to the page in the [technical script](../current/Interoceptomics-Script-Technical.pdf) that describes the proposed experiment and cites its references.

## Run the guide offline

From the root of a copy of this repository, run the following command with Python 3. On Windows, use `py -3` in place of `python3` if that is how Python is installed.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Open [the local guide](http://127.0.0.1:8000/stages/). The schematics, measured wrist, walking and W-track excerpts, saved forecasts and script links use files on this computer. Links to the separate projects and the downloadable public atlas need internet access. Press Ctrl+C in the terminal to stop the guide.

If you already have the separate 3D companion, start it using its own launcher. Under **Open the models**, expand **Use my local 3D companion** and paste the address printed by that launcher. For Stages 3–5, select the indicated step in the companion’s own menu.

## Edition and reuse

The roadmap follows the selected 111-slide presentation script with NeuroReplay at 0.3 and 0.5. The source technical PDF has SHA-256 `ae07b1d7784ad28945b7ece9da528da585037032292f347e7dafec3c01b24e7d`. The programme terms used here follow glossary revision 39, SHA-256 `2dfd29ae05c509025bd5c1a74a940a2a933b78c6c44fe2f94030d6fb69709741`. Interotomics is the accepted short form of Interoceptomics. The project dedicates its own guide text, diagram geometry and viewer code to the public domain under [CC0 1.0](../../LICENSE). The wrist measurements and fitted forecasts retain their [source credits and CC BY 4.0 terms](recording/WRIST-NOTICE.md). The walking measurements retain their [CC BY 4.0 attribution](recording/NOTICE.md). The W-track positions and spikes retain their [CC BY 4.0 attribution](recording/MAZE-NOTICE.md). The separate atlas download carries its own licences and notices. [Atlas credits](../../RIGHTS.md)
