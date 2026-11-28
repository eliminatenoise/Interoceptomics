# Use the experiment guide

[Open the guide in your browser](https://eliminatenoise.github.io/Interoceptomics/stages/). Choose **Human movement** to start with the wrist recording or **Animal learning** to explore six proposed stages. The animal section also includes a previous study of a rat on a W-shaped track. The planned experiments have yet to run.

Use the **Stage or task** menu to change experiments. The Previous and Next buttons or the left and right arrow keys move through the steps. **Copy link to this view** shares the step, the selected model and your diagram settings. In the right-wrist trial it also shares the trace position and forecast settings. The link opens the public guide and leaves any companion closed. Use the displayed address if clipboard copying is unavailable.

## Check a wrist forecast against a recording

1. [Open the right-wrist trial](https://eliminatenoise.github.io/Interoceptomics/stages/#map-brain2body). Move **Time from the visual cue** to read three seconds of scalp voltage, forearm voltage and wrist movement.
2. Under **Last input, after the cue**, select where the model's input ended. Under **Measurements the model used**, choose which set of readings its forecast came from.
3. Compare the saved forecast with the two angles the wrist sensors measured a quarter of a second later. Select **Show this outcome on the traces** to move the slider to that reading.

This public trial was left out of the reported evaluation. [Wrist trial, model and licence](recording/WRIST-NOTICE.md)

## Compare a forecast with a recorded walk

Select **Open the walking recording** to compare a saved forecast with the sensor reading taken 120 milliseconds after the last input. The walking clip was part of model training. Back in the guide, **Task time** bends the arm or leg in the separate programmed diagram. The guide also links to NeuroSurge's game controls, the camera preview and the NeuroTranslate 0.0 studies. [Recording and licence](recording/NOTICE.md)

Open **Compare forecasts on level ground and ramps** for a separate walking study. Pick a walking condition and choose heel movement or upward force. The two scores show how far each forecast was from the measurement using room directions or directions lined up with the measured floor. Both use the same model and recordings. [Ramp recordings and licence](https://doi.org/10.6084/m9.figshare.29300888.v1)

## Follow the other movement examples

Under **Human movement**, choose **NeuroHandler** in the stage menu. Select **Replay the wrist and pelvis recordings**, then **Cutoff** and **Last frame**. A wrist moves after a light cues a grasp. In the other study, a marker on the back of the pelvis moves as a walker’s view turns. Each panel fits its own path to the screen. Read the displacement in millimetres to compare distance from the cutoff. Each study has its own clock, coordinates and muscle recordings. [Open Manual dexterity](https://eliminatenoise.github.io/Interoceptomics/stages/#handler)

To work back from a prediction, choose **Check the wrist and pelvis forecasts** under **Explore this step**, then **Open here**. The reader opens at the measured errors. The interactive forecasts above them use invented starting signals. Follow **Explore the measurement atlas** inside the reader to inspect two real excerpts from model development. The errors come from a separate assessment. **Close model** returns you to the same guide step. [Open Large Movement Models](https://eliminatenoise.github.io/Interoceptomics/stages/#movement-model)

In the human [Physics Engine step](https://eliminatenoise.github.io/Interoceptomics/stages/#mechanics), choose **Compare shin activity and pedal load**. Turn the fixed-pedal setup and read the two signals from a seated ankle trial. [Open the pedal atlas directly](https://eliminatenoise.github.io/Interoceptomics/pedal-load/).

**Animal learning** (Big vision) covers all 22 numbered steps of the six proposed stages, the five introductory aims, and the modelling and human-measurement questions surrounding them. On a replay step, select a delayed reference and move through the task to see it fall behind. In [Stage 0.2 · Navigation](https://eliminatenoise.github.io/Interoceptomics/stages/#0.2), follow one rat across a W-shaped track in a separate published study. Use five camera readings to predict where the rat will be a quarter-second later. Add the spikes recorded during the same second, then reveal the camera reading. The browser runs two ridge models trained on 24 trips. The three examples are drawn from these training trips. An earlier trip in a different running period has a separate frame-by-frame replay of positions and spikes from two cells. [Forecast sources and method](recording/wtrack/NOTICE.md) The straight-corridor sketch below shows the proposed experiment. [W-track recording and licence](recording/MAZE-NOTICE.md) Each step links to the page in the [technical script](../current/Interoceptomics-Script-Technical.pdf) that describes the proposed experiment and cites its references.

## Run the guide offline

From the root of a copy of this repository, run the following command with Python 3. On Windows, use `py -3` in place of `python3` if that is how Python is installed.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Open [the local guide](http://127.0.0.1:8000/stages/). The guide loads JavaScript modules through this local server. Its schematics, recording excerpts and links to files in the repository work without internet access, including **Replay the wrist and pelvis recordings**. **Check the wrist and pelvis forecasts** opens the separate NeuroTranslation website and needs an internet connection. Its **Download offline reader** link gives you a standalone copy. Press Ctrl+C in the terminal to stop the guide.

If you already have the separate 3D companion, start it using its own launcher. Under **Open the models**, expand **Use my local 3D companion** and paste the address printed by that launcher. For Stages 3–5, select the indicated step in the companion’s own menu.

## Open the model for a step

Under **From nervous system to movement**, open **Neural Composite**. Choose **Follow the exercise and pressure loop** to trace the anatomy. Then choose **Follow one stride from muscles to the floor**. At any percentage of the slow stride, read a marker position, voltage from a skin electrode on the right leg and the load on a floor plate. The instruments recorded the same walks. The muscle curves average 30 walkers. The two plate curves average 29 and 28 walkers, respectively. The walking study recorded no brain or spinal cord activity. **Compare firing and movement on a recorded trip** opens a separate rat study with its own clock.

**Myoception** includes sensing how far a muscle stretches and how hard it pulls. Choose **Trace a signal from a muscle** to follow the pathway in the atlas, or explore the stretch reflex. Then choose **Count the spikes from a muscle spindle**. As an apparatus stretched a rat’s calf, an electrode sampled one sensory nerve fibre 20,000 times a second. The apparatus recorded tendon force and its own position 2,000 times a second. Move the slider to count the spikes in the next 20 milliseconds.

At **Visceroception**, follow a sensory route from an artery or the bladder. Choose **Read the heartbeat and breathing traces** to compare the heart’s electrical activity, chest vibration and breathing at the same instant. You can also check the chest sensor’s next reading or place a marked nerve event between two readings of pressure in a mouse colon. Choose **Open here** to use the atlas or recording inside the guide. **Open in a separate tab** gives it the full browser window. Changing steps closes the embedded model.

Choose **Animal learning**, then **Back to human function** under **Stage or task**. From **Myoception** or **Visceroception**, choose **Follow the exercise and pressure loop**, then **Open here**. Use **Next** to trace the anatomy from working muscle through the spinal cord and brainstem to the heart and blood vessels. Signals from stretch receptors in the arteries return to the brainstem. **Follow one stride from muscles to the floor** in **Myoception** shows marker movement, voltage from skin electrodes on the right leg and floor load during walking. **Read the heartbeat and breathing traces** in **Visceroception** shows the heart’s electrical activity, chest vibration and breathing in a separate recording at rest.

In **Myoception**, choose **Compare muscle and knee rhythms**. Select a walker to see how often the leg muscles and knees repeated their patterns, then compare the muscle rate from another person. Each instrument supplied its own 40-second window. The recording gives no account of what the walker felt. In **Physics Engine** (slide 53) and **Large Movement Models**, **Compare knee-angle forecasts** starts with an invented step. The same reader shows the errors across 12 held-out walkers and can open an original angle file. Both walking studies used the same treadmill speed, 0.5 m/s. The full readers need an internet connection. [Walking dataset](https://doi.org/10.13026/r0ea-7161) · [Studies and clock limits](https://eliminatenoise.github.io/NeuroTranslation/papers/walking-rhythm/)

In **Navigation (0.2)**, the W-track example in the guide shows one rat. The additional trip viewer compares movement and earlier firing in three other test animals. **Large Movement Models** includes a measured stride forecast and a separate sequence generated from the word *walk* or *run*. These examples come from different studies. Their results do not establish skill transfer or the proposed experimental feedback loop.

## Edition and reuse

Rebuild the downloadable guide from the root of an Interoceptomics checkout with `python3 models/stage-guide/package.py --fetch-companions`. The builder downloads the pinned finger forecast ZIP from its NeuroTranslation source commit and verifies the SHA-256 listed in `models/stage-guide/sources.json`. If you already have those exact ZIP bytes, run `python3 models/stage-guide/package.py --local-archive finger-angle-forecast /path/to/finger-angle-forecast-offline.zip`. After extraction, the included forecaster runs without internet access.

The roadmap follows the selected 111-slide presentation script with NeuroReplay at 0.3 and 0.5. The source technical PDF has SHA-256 `ae07b1d7784ad28945b7ece9da528da585037032292f347e7dafec3c01b24e7d`. The programme terms used here follow glossary revision 39, SHA-256 `2dfd29ae05c509025bd5c1a74a940a2a933b78c6c44fe2f94030d6fb69709741`. Interotomics is the accepted short form of Interoceptomics. The project dedicates its own guide text, diagram geometry and viewer code to the public domain under [CC0 1.0](../../LICENSE). The wrist measurements and fitted forecasts retain their [source credits and CC BY 4.0 terms](recording/WRIST-NOTICE.md). The walking measurements retain their [CC BY 4.0 attribution](recording/NOTICE.md). The W-track positions and spikes retain their [CC BY 4.0 attribution](recording/MAZE-NOTICE.md). The separate atlas download carries its own licences and notices. [Atlas credits](../../RIGHTS.md)
