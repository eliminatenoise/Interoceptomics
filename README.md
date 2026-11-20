# Interoceptomics

**The Human Genome Project failed.** Not at sequencing: it delivered the human reference sequence in 2003. It failed at what was promised next, and most rare diseases still have no approved treatment. A list of the parts is not an account of what they do. A wiring diagram of the nervous system has the same limit: it shows what is connected, not what the body feels.

Interoceptomics is a proposed field of science that starts from the other end. *Interoception* is the body sensing its own interior: a heartbeat, a breath. *Connectomics* is the mapping of nerve connections. Put the two together and go function first: measure what the body senses and does, then ask which connections carry it. None of its experiments has been run yet.

## Open these first

The anatomy atlas, experiment guide and recorded cortex all run in your browser.

1. **[Backslash of the Brain](https://eliminatenoise.github.io/Interoceptomics/atlas/backslash/)** follows signals from muscles and organs through 3D models and slices of the human brain, spinal cord and organs (an anatomy atlas). [More below](#backslash-of-the-brain).
2. **[The experiment guide](https://eliminatenoise.github.io/Interoceptomics/stages/)** walks through the proposed experiments one step at a time, each beside a 3D sketch you can turn, with recorded examples from open datasets: a wrist movement, a walk, a rat on a W-shaped track. [More below](#follow-the-experiments).
3. **[The Interoceptomics Atlas Viewer](https://eliminatenoise.github.io/Interoceptomics/viewer/)** is a 3D model of the left half of a human brain, built from a published map of the brain's regions: the Allen Institute's human reference atlas. [More below](#the-atlas-viewer-a-brain-map-you-can-turn-cut-and-measure).
4. **[The two scripts](#the-talk-is-paused-its-scripts-are-published)** of the talk that proposes the field, as PDF and Word (DOCX) files.

The argument is made in full in a talk, *I Know Kung Fu*. In *The Matrix*, Neo has kung fu loaded into his brain through a cable; the talk's 111 slides ask what a real version would have to measure, beginning with one movement. The field is named on slides 87 and 88. The talk is paused. Its two scripts are [published](#the-talk-is-paused-its-scripts-are-published).

**[When the view turns](https://eliminatenoise.github.io/Interoceptomics/muscle-and-motion/).** Follow the same person’s lower-back marker through a visual rotation while standing and walking. Compare eight lower-leg voltage recordings before the cutoff with their amplitude over the next 125 ms. [Download the offline atlas and both measured paths](downloads/muscle-and-motion.zip).

**[When the room tilts](https://eliminatenoise.github.io/Interoceptomics/visual-balance/).** A walker sees the room turn. Read the scalp, eye and muscle voltages and follow the head and sacrum through the same recorded moment. [Download the offline reader and both measured models](downloads/visual-balance.zip).

**[One walker, two instructions](https://eliminatenoise.github.io/Interoceptomics/walking-instructions/).** Compare the same person walking “as usual” and “fast but not running”. Match elapsed time or stride fraction, turn both figures and compare the pelvis and right-leg muscle recordings. [Download the offline reader and both animated models](downloads/walking-instructions.zip).

**[Heel and force](https://eliminatenoise.github.io/Interoceptomics/heel-and-force/).** Follow the measured skin markers over two floor plates during a barefoot walk. At three points in one stance, compare how far the right heel moved in 100 milliseconds with the upward force recorded under that foot. [Offline atlas](downloads/heel-and-force.zip) · [Target pose at 0.39 s](docs/heel-and-force/pose-39.glb)

**[When the pedal holds still](https://eliminatenoise.github.io/Interoceptomics/pedal-load/).** Follow the muscle and pedal load recordings as two people attempt to lift a secured foot. Read the change over the next 100 samples and inspect the reference setup in 3D. [Offline atlas](downloads/pedal-load.zip) · [Standalone model](docs/pedal-load/neutral-pedal.glb)

**[Inside a lifting foot](https://eliminatenoise.github.io/Interoceptomics/muscle-tracking/).** Turn the reference shin to find the tibialis anterior. Follow a bundle of muscle fibres through recorded ultrasound estimates of its length and angle. [Download the offline reader](downloads/muscle-tracking.zip).

**[How far does the back sensor turn?](https://eliminatenoise.github.io/Interoceptomics/back-rotation/)** Replay measured rotation and skin voltages during walking and standing. Turn the reference vertebrae beneath the neck and lower-back patches and compare the readings from four people. [Download the offline reader](downloads/back-rotation.zip).

**[One wrist stimulus, five recordings](https://eliminatenoise.github.io/Interoceptomics/cervical-signals/).** Read the voltage at the axilla, neck, scalp, thumb muscle and chest before and after a left wrist stimulus. Compare four people, inspect the study montage and turn the reference anatomy. [Download the offline reader](downloads/cervical-signals.zip).

**[Follow one stride in 3D](https://eliminatenoise.github.io/Interoceptomics/stride-signals/).** Rotate the figure from one right footfall to the next and compare skin-marker movement with eight right-leg muscle recordings and the loads on two floor plates. Select a marker to see where it moved over the next 200 ms. The figure averages 89 slow barefoot strides from 30 people. [Offline reader](downloads/stride-signals.zip) · [Measurements and methods](models/stride-signals/OVERGROUND-STRIDE.md)

**[Compare electrode coverage in five people](https://eliminatenoise.github.io/Interoceptomics/cortex-coverage/).** Choose an anatomical region, then load a participant’s own surface to inspect the recording contacts. [Both readers offline](downloads/recorded-cortex.zip)

**[Explore the recorded cortex](https://eliminatenoise.github.io/Interoceptomics/recorded-cortex/).** See how electrical power changed at 46 recording sites when a person was cued to move a finger. The 3D viewer joins the contacts to the original participant’s own brain surface. [Offline reader](downloads/recorded-cortex.zip)

## Scalp and arm

Rotate the scalp to find any of 61 electrode sites from the Ofner upper-limb study. Choose a right-arm cue to see how the scalp, eye electrodes and movement sensors changed in one person across 18 repeats. Switch to seven people to count whose readings rose, fell or stayed level in each of four windows after the cue. Compare six scalp electrodes with the eye channels just before and after the cue, then swap in the eye trace from the next repetition. The head uses standard coordinates. The arm pose illustrates the instruction. The authors’ published equipment photograph, cue diagram and channel table are included offline. [Open the companion](https://eliminatenoise.github.io/Interoceptomics/scalp-and-arm/) · [Download the ZIP](downloads/scalp-and-arm.zip)

## Backslash of the Brain

Trace muscle sensation, organ sensation, skeletal movement and autonomic control across the human nervous system. The atlas opens on the medial surface of the left brain. Choose a circuit to see its receptors, relays and targets, or inspect coronal slices, labelled brainstem sections and four organ surfaces in three dimensions.

[Open the interactive atlas](https://eliminatenoise.github.io/Interoceptomics/atlas/backslash/) · [Read the illustrated PDF](docs/atlas/backslash/atlas.pdf) · [Download the standalone model and PDF](downloads/backslash/Backslash-Atlas.zip)

To open the download, extract the entire ZIP and run **Windows.cmd**, **macOS.command** or **Linux.sh** with Python 3.10 or newer installed. The model runs on your own computer. Each anatomical source retains its own frame, species or donor information and reuse terms. The guide shows structural anatomy and explanatory routes. [Sources and licences](https://eliminatenoise.github.io/Interoceptomics/atlas/backslash/sources.html)


## Follow the experiments

[Open the interactive experiment guide](https://eliminatenoise.github.io/Interoceptomics/stages/). Choose **Human movement** (Small vision) for the movement tasks in people and their available game, camera and recording evidence. Choose **Animal learning** (Big vision) for the six proposed animal stages. In [Stage 0.2 · Navigation](https://eliminatenoise.github.io/Interoceptomics/stages/#0.2), predict a rat’s next position on a W-shaped track, first from its past positions and then with the electrical pulses of its brain cells (spikes) added. Reveal what the camera recorded. An earlier trip from the same published study has a separate frame-by-frame replay. Scrub through an original 3D sketch, turn the view, and open the relevant page of the technical script. A link to a particular step keeps that step selected when someone else opens it.

In Small vision, a participant steers a cursor towards a target with their right wrist. Scrub the recordings of electrical activity at the scalp and in the forearm muscles, choose the last instant a model can see, then check its forecast against the two measured wrist angles a quarter-second later. [Wrist recording and model credits](docs/stages/recording/WRIST-NOTICE.md)

Select **Open the walking recording** farther down the guide to try a different measurement. Choose either arm, either leg or the torso and compare a saved forecast with the sensor’s later acceleration. This walking clip was part of model training. Both examples run in the browser. If you downloaded the separate set of 3D models of the proposed experiments from the [4 November prerelease](RIGHTS.md#the-withdrawn-4-november-prerelease), since withdrawn, they also open from the guide. [Walking recording and model credits](docs/stages/recording/NOTICE.md)

Three short human recordings let you follow a heartbeat alongside chest vibration and breathing. Pick a time to see what each sensor measured. Only the first recording has heartbeat marks that match its waveform. [Open the heart and breathing recordings](https://eliminatenoise.github.io/Interoceptomics/inside/)

## The atlas viewer: a brain map you can turn, cut and measure

A brain atlas is a published map that divides the brain into named regions. The viewer turns the Allen Institute's human reference atlas into a 3D model of the left half of the brain: all 141 regions the atlas draws there are in the model, twenty of them shown only when you ask, and all 141 can also be read in flat cuts through its grid of half-millimetre cubes. It colours the regions this project links to moving and feeling the body, to running its organs, or to both. It is still a map, not a measurement.

**[Open the Interoceptomics Atlas Viewer](https://eliminatenoise.github.io/Interoceptomics/viewer/)** · [Download it for offline use](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip) (ZIP, 64.3 MB) · [What it is not](#an-illustration-not-a-measurement) · [Licences and credits](RIGHTS.md)

It opens in any current browser that can show 3D graphics (WebGL). The model is a 66 MB file, so the first view takes a moment. The viewer's own guide, linked from its panel, explains every control.

### Use it offline: download it

You need Python 3.10 or newer and a current browser.

1. [Download the ZIP](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip) and extract all of it into a folder.
2. In that folder, start the viewer with the file for your system:

   | Your computer | Start file |
   | --- | --- |
   | Windows | open `Windows.cmd` |
   | macOS | open `macOS.command` |
   | Linux | run `sh Linux.sh` in a terminal |

3. The start file runs in a terminal window and opens your browser on the viewer, at an address on your own computer. If the browser stays closed, copy the address the terminal shows into it. Keep the terminal open while you explore. To stop, press Ctrl+C in the terminal.

The download installs nothing and runs on your own computer. Only the links to cited papers need the internet. It holds the same viewer as the website, file for file, plus the start files.

So far the viewer has been run on Linux, in Chromium. The Windows and macOS start files have not yet been tried on those systems, and the viewer has not been tried on a phone. If something fails for you, [say so here](https://github.com/eliminatenoise/Interoceptomics/issues).

## The parts that move you and the parts that run your organs overlap

Run, and your legs, your balance, your breathing and your heart have to change together. The parts of the brain that move the body and the parts that run its organs are not separate machines: they overlap.

The viewer marks that overlap on the atlas: one colour for regions linked to movement and touch (*somatic*), one for regions linked to the automatic running of the organs (*autonomic*), one where the two meet (*integration*). Which region gets which colour is this project's reading of published sources, not a recording: the viewer lists 54, and 49 of them are cited for at least one region.

| You want to | In the viewer |
| --- | --- |
| Look around | Drag to turn, scroll to zoom. **Starting view** offers four: **Inner face (medial)**, where the two halves of the brain meet; **Outer face (lateral)**; **Insula exposed**, which shows the insula, a stretch of the brain's outer layer (the cortex) folded deep inside the side of the brain; and **Deep regions**. |
| See what goes with what | **Colour groups** shows the somatic, autonomic or integration colours, or all three. |
| Ask why a region is coloured | Select it and open **Evidence and limits**: why it is coloured or left plain, what its outline leaves out, and links to the sources. |
| Find a region | Type a name, an abbreviation or an atlas number into **Find a region**: `insula`, `VPL`, `13230`. |
| Lift a region out | **Show it alone** hides everything else. It works for the 54 regions drawn with a surface of their own. Of the other 87 in the model, 82 are merged into larger surfaces and 5 are listed by name only; none of those can be lifted out alone. **Show the whole brain** brings the rest back. |
| See the atlas under the surface | **Open three flat cuts** shows three flat slices through the atlas grid that cross at one point. Step with the arrow keys, one half-millimetre cube (a *voxel*) at a time, or type a position in millimetres. **Find a region** there jumps to any of the 141 regions. |
| Measure | The ruler lives in two places: search for `PaO` (the parietal operculum, the fold that covers the insula from above) and choose **Show cuts through the parietal operculum**, or compare VPL with VPM and choose **Show cuts through VPL and VPM**. Mark two points there with **Set A** and **Set B** to read the straight-line distance in millimetres; **Follow the ruler through the cuts** then lists how much of that line lies in each region. In the flat cuts, **Volume of the selected region** gives a region's volume in cubic millimetres. |
| Come back to the same place | **Copy saved view** gives you a short piece of text. Paste it into **Open saved view** next time. |

A good first five minutes: choose **Insula exposed**, and the outer surface of the brain steps aside to show the insula. Search for `PaO` and choose **Show it alone**: the fold over the insula, on its own. Then search for `VPL`, choose **Compare VPL and VPM**, and **Show the faces they share**: two clusters of sensory nerve cells (nuclei) in the thalamus, deep in the middle of the brain, and in gold the 481 grid faces (120.25 mm²) where the atlas has them touch.

The viewer's guide has every control: [on the website](https://eliminatenoise.github.io/Interoceptomics/viewer/README.html), or `README.html` in the download.

## An illustration, not a measurement

The viewer shows where a published atlas draws each region. It does not show what any region does.

- **One reference brain, left half.** The atlas was drawn on an averaged reference brain (the ICBM 2009b nonlinear symmetric MNI152 average), not on a person. It is nobody's brain. And it labels almost only the left side: all 141 regions have cubes on the left, 22 have some on the midline, 7 have some on the right. The 3D model draws the left. The little there is on the right can be read in the flat cuts.
- **The colours are a reading, not a recording.** A region can belong to more than one group, and a region with no colour is not idle: 81 of the 141 regions in the 3D model carry none.
- **The grid is half a millimetre.** Borders follow the atlas's cubes, so small regions look blocky. The small brainstem and hypothalamic nuclei that regulate the organs are not drawn separately. Most surfaces were smoothed a little: no point moved more than 0.125 mm.
- **A third of the atlas is drawn only when you ask.** The white matter of the forebrain (the bundles of nerve fibres that join regions) and five of its named bundles, nine fluid spaces (the ventricles and canals), the four regions of the smell pathway and the claustrum (a thin sheet of grey matter between the insula and the putamen) hold 2,255,724 of the atlas's 6,999,201 labelled voxels. **Show white matter and fluid spaces** draws fifteen of them in place, the white matter of the forebrain and the fluid spaces see-through; each of the twenty can be shown alone.
- **Nothing here has been validated**, scientifically or clinically. Distances and volumes describe the atlas's reference brain, not a patient. The viewer holds anatomy and code, and no recordings.

## The anatomy is the Allen Institute's

The regions, their names and their numbers come from the *Allen Human Reference Atlas — 3D, 2020* (version 1.0.0) by Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein, © 2019 Allen Institute for Brain Science, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This project kept the labelled left half, built the surfaces, and added the colours and the controls. The Allen Institute has not endorsed any of it.

The 3D drawing is done by [Three.js](https://github.com/mrdoob/three.js) (MIT licence). Everything this project wrote itself is dedicated to the public domain under [CC0 1.0](LICENSE), to the extent the project holds the rights.

[Licences and credits](RIGHTS.md) has the full credit, the list of changes, and what you must keep when you reuse any part.

## The talk is paused; its scripts are published

*I Know Kung Fu* takes its title from *The Matrix* and begins much smaller than the film: can recorded signals predict a movement that was measured separately? From there it works out, stage by stage, what loading a skill into a nervous system would have to show. Slides 87 and 88 of 111 propose Interoceptomics as a field.

- **Technical script**, 114 pages: [PDF](docs/current/Interoceptomics-Script-Technical.pdf) · [DOCX](docs/current/Interoceptomics-Script-Technical.docx). Every step argued in full, with references.
- **Simple script**, 36 pages: [PDF](docs/current/Interoceptomics-Script-Simple.pdf) · [DOCX](docs/current/Interoceptomics-Script-Simple.docx). The essential spoken lines for the same slides.

[About the two scripts](docs/current/README.md): the talk mapped part by part.

The slides are not published: 22 of their 88 pictures are known not to be cleared for redistribution, and the rights to the other 66 have not been confirmed.

## Three projects, one question

Interoceptomics is one of three projects that ask the same question: what passes between the brain and the body? The brain sends orders out to the muscles, and the body reports back what it is doing and feeling. Each project comes at that traffic from a different side.

- **[NeuroTranslation](https://github.com/eliminatenoise/NeuroTranslation)** predicts one recording of the body from another, most of them of a movement: brain, nerve, muscle, force or motion, recorded by scientists who share their data openly. Every prediction is checked against what was actually recorded, and so far a signal's own recent past, above all a hand's own recent movement, has been the forecast to beat. [Open its pages in your browser](https://eliminatenoise.github.io/NeuroTranslation/START.html)
- **[NeuroSurge](https://github.com/eliminatenoise/NeuroSurge)** is a game for learning which part of the brain moves which part of the body. You look out from inside a body without skin. Turn your view to a coloured area of the brain in front of you, and the body part it controls moves; click a muscle and its area lights up. What the game's brain does is made up by the game's rules, not read from anyone's brain. [Play NeuroSurge in your browser](https://eliminatenoise.github.io/NeuroSurge/)
- **Interoceptomics**, this project, is a proposed field of science that would measure what the body senses of its own interior, a heartbeat or a breath, and then ask which nerve connections carry it. None of its experiments has been run yet. [The experiment guide](https://eliminatenoise.github.io/Interoceptomics/stages/) walks through the proposed experiments one step at a time, each beside a 3D sketch you can turn. [The atlas viewer](https://eliminatenoise.github.io/Interoceptomics/viewer/) is a 3D model of the left half of a human brain that you can turn, cut and measure. It is built from the Allen Institute's published map of the brain's regions: a map, not a measurement.

They are joined by a plan and a guide.

- The game is meant to become the place where NeuroTranslation's model is used. The plan: type or say an action, or move in front of your camera, and the body on screen does it, driven by NeuroTranslate 0.0, the one model NeuroTranslation is building to learn from many kinds of body signal at once. None of this is in the published game. A first draft is [a proposed change to the game](https://github.com/eliminatenoise/NeuroSurge/pull/2), not yet merged: commands you type or speak choose from a set of the game's own movements, an arm or knee on screen follows yours as your camera sees it, and a map inside the game opens the recordings NeuroTranslation studies and its fitted models.
- The experiment guide lays out the proposed experiments step by step, in two halves. Human movement (the "Small vision") holds the movement tasks in people, where NeuroTranslation and the game meet; Animal learning (the "Big vision") is Interoceptomics' road map: six proposed stages of experiments in animals, in 22 numbered steps. Several of NeuroTranslation's examples already sit inside the guide, among them two forecasts a quarter of a second ahead: the two angles of a person's right wrist as they steer a cursor to a target, from three of its models, and where a rat on a W-shaped track will be.

---

[Project page](https://eliminatenoise.github.io/Interoceptomics/) · [Atlas viewer](https://eliminatenoise.github.io/Interoceptomics/viewer/) · [What changed in the latest viewer](downloads/atlas-viewer/RELEASE-NOTES.md) · [Checksum of the download](downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip.sha256) · [Desktop shortcuts](LAUNCHERS.md) · [Repository facts in machine-readable form](PROJECT-CONTEXT.json)
