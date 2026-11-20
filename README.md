# Interoceptomics

**The Human Genome Project failed.** Not at sequencing: it delivered the human reference sequence in 2003. It failed at what was promised next, and most rare diseases still have no approved treatment. A list of the parts is not an account of what they do. A wiring diagram of the nervous system has the same limit: it shows what is connected, not what the body feels.

Interoceptomics (Interotomics for short) is a proposed field of science that starts from the other end. *Interoception* is the body sensing its own interior: a heartbeat, a breath. *Connectomics* is the mapping of nerve connections. Put the two together and go function first: measure what the body senses and does, then ask which connections carry it. None of its experiments has been run yet.

What exists so far is still a map, not a measurement: the Allen Institute's human reference atlas as a 3D model you can turn, cut and measure. It shows the 141 named regions the atlas draws on the left half of the brain, on a half-millimetre grid, and colours the ones this project links to moving and feeling the body, to running its organs, or to both.

**[Download the Interoceptomics Atlas Viewer](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip)** (ZIP, 40.5 MB) · [Open it in three steps](#open-it-in-three-steps) · [What it is not](#an-illustration-not-a-measurement) · [Licences and credits](RIGHTS.md)

The argument is made in full in a talk, *I Know Kung Fu*. In *The Matrix*, Neo has kung fu loaded into his brain through a cable; the talk's 111 slides ask what a real version would have to measure, beginning with one movement. The field is named on slides 87 and 88. The talk is paused. Its two scripts are [published](#the-talk-is-paused-its-scripts-are-published).

## Follow the experiments

[Open the interactive experiment guide](https://eliminatenoise.github.io/Interoceptomics/stages/). Choose **Human movement** (Small vision) for the movement tasks in people and their available game, camera and recording evidence. Choose **Animal learning** (Big vision) for the six proposed animal stages. In [Stage 0.2 · Navigation](https://eliminatenoise.github.io/Interoceptomics/stages/#0.2), predict a rat’s next position on a W-shaped track, first from its past positions and then with brain-cell spikes added. Reveal what the camera recorded. An earlier trip from the same published study has a separate frame-by-frame replay. Scrub through an original 3D sketch, turn the view, and open the relevant page of the technical script. A link to a particular step keeps that step selected when someone else opens it.

In Small vision, a participant steers a cursor towards a target with their right wrist. Scrub the scalp and forearm recordings, choose the last instant a model can see, then check its forecast against the two measured wrist angles a quarter-second later. [Wrist recording and model credits](docs/stages/recording/WRIST-NOTICE.md)

Select **Open the walking recording** farther down the guide to try a different measurement. Choose either arm, either leg or the torso and compare a saved forecast with the sensor’s later acceleration. This walking clip was part of model training. Both examples run in the browser. If you have the separate 3D companion, its models also open from the guide. [Walking recording and model credits](docs/stages/recording/NOTICE.md)

## Open it in three steps

You need Python 3.10 or newer and a current browser.

1. [Download the ZIP](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip) and extract all of it into a folder.
2. In that folder, start the viewer with the file for your system:

   | Your computer | Start file |
   | --- | --- |
   | Windows | open `Windows.cmd` |
   | macOS | open `macOS.command` |
   | Linux | run `sh Linux.sh` in a terminal |

3. The start file runs in a terminal window and opens your browser on the viewer, at an address on your own computer. If the browser stays closed, copy the address the terminal shows into it. Keep the terminal open while you explore. To stop, press Ctrl+C in the terminal.

The viewer installs nothing and runs on your own computer. Only the links to cited papers need the internet.

So far it has been run on Linux, in Chromium. The Windows and macOS start files have not yet been tried on those systems. If one fails for you, [say so here](https://github.com/eliminatenoise/Interoceptomics/issues).

## The parts that move you and the parts that run your organs overlap

Run, and your legs, your balance, your breathing and your heart have to change together. The parts of the brain that move the body and the parts that run its organs are not separate machines: they overlap.

The viewer marks that overlap on the atlas: one colour for regions linked to movement and touch (*somatic*), one for regions linked to the automatic running of the organs (*autonomic*), one where the two meet (*integration*). Which region gets which colour is this project's reading of published sources, not a recording: the viewer lists 54, and 49 of them are cited for at least one region.

| You want to | In the viewer |
| --- | --- |
| Look around | Drag to turn, scroll to zoom. Four starting views: **Medial** (the flat inner face where the two halves of the brain meet), **Lateral** (the outside), **Insula exposed** and **Deep structures**. |
| See what goes with what | **Association overlay** shows the somatic, autonomic or integration colours, or all three. |
| Ask why a region is coloured | Select it and open **Evidence and limits**: why it is coloured or left plain, what its outline leaves out, and links to the sources. |
| Find a region | Type a name, an abbreviation or an atlas number into the search box: `insula`, `VPL`, `13230`. |
| Lift a region out | **Isolate in place** hides everything else. It works for the 34 regions drawn with a surface of their own. Of the other 87 in the model, 82 are merged into larger surfaces and 5 are listed by name only; none of those can be lifted out alone. **Restore context** brings the brain back. |
| See the atlas under the surface | **Explore full atlas labels** opens three flat cuts that cross at one point. Step with the arrow keys, one half-millimetre cube (a *voxel*) at a time, or type a position in millimetres. **Find a structure** jumps to any of the 141 regions. |
| Measure | The ruler lives in two closer views: search for `PaO` and choose **Show parietal operculum sections**, or compare VPL with VPM and choose **Show atlas sections**. Mark two points there with **Set A** and **Set B** to read the straight-line distance in millimetres; **Follow the ruler through sections** then lists how much of that line lies in each region. In the flat cuts, **Volume of the selected label** gives a region's volume in cubic millimetres. |
| Come back to the same place | **Copy saved view** gives you a short piece of text. Paste it into **Open saved view** next time. |

A good first five minutes: choose **Insula exposed**, and the outer surface of the brain steps aside to show the insula, cortex that the outer folds normally cover. Search for `PaO`, the fold that covers it from above, and isolate it. Then search for `VPL`, choose **Compare VPL and VPM**, and **Show shared voxel faces**: two clusters of sensory nerve cells (nuclei) deep in the thalamus, and in gold the 481 grid faces (120.25 mm²) where the atlas has them touch.

The download carries its own guide, `README.html`, with every control.

## An illustration, not a measurement

The viewer shows where a published atlas draws each region. It does not show what any region does.

- **One reference brain, left half.** The atlas was drawn on an averaged reference brain (the ICBM 2009b nonlinear symmetric MNI152 average), not on a person. It is nobody's brain. And it labels almost only the left side: all 141 regions have cubes on the left, 22 have some on the midline, 7 have some on the right. The 3D model draws the left. The little there is on the right can be read in the flat cuts.
- **The colours are a reading, not a recording.** A region can belong to more than one group, and a region with no colour is not idle: 61 of the 121 regions in the 3D model carry none.
- **The grid is half a millimetre.** Borders follow the atlas's cubes, so small regions look blocky. The small brainstem and hypothalamic nuclei that regulate the organs are not drawn separately. 20 of the 141 regions (nine ventricles and canals, six white-matter structures, four olfactory structures and the claustrum) have no surface at all, though every one can be read in the flat cuts.
- **Nothing here has been validated**, scientifically or clinically. Distances and volumes describe the atlas's reference brain, not a patient. The download holds anatomy and code, and no recordings.

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

An older slide deck, with the two scripts one revision earlier and a 238 MB set of 3D models of the proposed experiments, is still available as a [pre-release from 4 November 2026](https://github.com/eliminatenoise/Interoceptomics/releases/tag/interoceptomics-r42-draft); the rights to some of its pictures and models have not been established.

## The widest of three projects, and the least built

Interoceptomics belongs to Brain2Body, a programme about connecting brain and body function.

- **[NeuroTranslation](https://github.com/eliminatenoise/NeuroTranslation)** asks how well one recording of the body predicts another: brain or muscle activity against measured movement, tested on open human recordings.
- **[NeuroSurge](https://eliminatenoise.github.io/NeuroSurge/)** is a browser game for learning which motor areas of the brain move which parts of the body. Its activity is simulated.
- **Interoceptomics** is the proposal that body sense and nerve wiring be studied together, and so far one brain atlas you can turn.

---

[Project page](https://eliminatenoise.github.io/Interoceptomics/) · [What changed in the latest viewer](downloads/atlas-viewer/RELEASE-NOTES.md) · [Checksum of the download](downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip.sha256) · [Desktop shortcuts](LAUNCHERS.md) · [Repository facts in machine-readable form](PROJECT-CONTEXT.json)
