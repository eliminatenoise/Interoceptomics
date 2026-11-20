# Interoceptomics

**A map of the wiring is not a map of what the body senses.** Interoceptomics is a proposed field of science: *interoception*, the body sensing its own interior (a heartbeat, a breath, a muscle at work), joined to *connectomics*, the mapping of nerve connections. Function first, and from function, structure: measure what the body senses and does, then ask which connections carry it.

What you can use today is one piece of it: **a 3D atlas of the human brain that you turn, cut and measure.** It shows the left half of the Allen Institute's human reference atlas, 141 named regions on a half-millimetre grid, and colours the regions linked to moving and feeling the body, to running its organs, and to both at once.

**[Download the atlas viewer](downloads/brain-r8/Interoceptomics-Brain-R8-Experimental-Preview-R33.zip)** (ZIP, 40.6 MB) · [Open it in three steps](#open-it-in-three-steps) · [What it is not](#an-illustration-not-a-measurement) · [Licences and credits](RIGHTS.md)

The proposal is argued in a talk, *I Know Kung Fu*: 111 slides on what it would take to read a movement out of one nervous system and teach it to another. The field gets its name near the end. **The talk is paused.** Its two scripts are [published](#the-talk-is-paused-its-scripts-are-published). The experiments in them are proposals; none has been run.

## Open it in three steps

1. [Download the ZIP](downloads/brain-r8/Interoceptomics-Brain-R8-Experimental-Preview-R33.zip) and extract all of it into a folder.
2. In that folder, start the viewer with the file for your system:

   | Your computer | Start file |
   | --- | --- |
   | Windows | open `Windows.cmd` |
   | macOS | open `macOS.command` |
   | Linux | run `sh Linux.sh` in a terminal |

3. Your browser opens the atlas at an address on your own computer. If it stays closed, copy the address the start file prints into the browser. Leave that window open while you explore, and press Ctrl+C in it when you are done.

You need Python 3.10 or newer and a current browser. Nothing is installed. The start file serves the viewer's files on your own computer only; nothing but the links to cited papers needs the internet.

The viewer has been run on Linux, in Chromium. The Windows and macOS start files have not yet been tried on those systems. If one fails for you, [say so here](https://github.com/eliminatenoise/Interoceptomics/issues).

## Turn it, cut it, measure it

Run, and your legs, your balance, your breathing and your heart have to change together. The parts of the brain that move the body and the parts that run its organs are not separate machines: they overlap. The viewer puts that overlap on a real atlas. One colour marks regions linked to movement and touch (*somatic*), one marks regions linked to the automatic running of the organs (*autonomic*), and one marks regions where the two meet (*integration*).

| You want to | In the viewer |
| --- | --- |
| Look around | Drag to turn, scroll to zoom. Four starting views: **Medial** (the flat inner face where the two halves of the brain meet), **Lateral** (the outside), **Insula exposed** and **Deep structures**. |
| See what goes with what | **Association overlay** shows the somatic, autonomic or integration colours, or all three. |
| Find a region | Type a name, an abbreviation or an atlas number into the search box: `insula`, `VPL`, `13230`. |
| Lift a region out | **Isolate in place** hides everything else. 34 regions have a surface of their own. **Restore context** brings the brain back. |
| See the atlas under the surface | **Explore full atlas labels** opens three flat cuts through one *voxel*, a half-millimetre cube of the atlas grid, and steps from voxel to voxel. **Find a structure** jumps to any of the 141 regions. |
| Measure | Mark two points with **Set A** and **Set B** to read the straight-line distance in millimetres and how much of that line lies in each region. **Volume of the selected label** counts a region's volume. |
| Come back to the same place | **Copy saved view** gives you a short piece of text. Paste it into **Open saved view** next time. |

A good first five minutes: choose **Insula exposed**, and the outer surface of the brain steps aside to show the insula, cortex that the outer folds normally cover. Search for `PaO`, the fold that covers it from above, and isolate it. Then search for `VPL`, choose **Compare VPL and VPM**, and **Show shared voxel faces**: two sensory nuclei deep in the thalamus, and in gold the 481 grid faces (120.25 mm²) where the atlas has them touch.

The download carries its own guide, `README.html`, with every control.

## An illustration, not a measurement

The viewer shows where a published atlas draws each region. It does not show what any region does.

- **One reference brain, left half only.** The atlas was drawn on an averaged reference brain (the ICBM 2009b nonlinear symmetric MNI152 average), not on a person. It is nobody's brain, and the right half is not modelled.
- **The colours are teaching associations.** This project chose them from 54 cited sources. They overlap, uncoloured regions take part too, and 61 of the 121 regions in the 3D model carry no colour. No activity was recorded.
- **The grid is half a millimetre.** Borders follow the atlas's cubes, so small regions look blocky. The small brainstem and hypothalamic nuclei that regulate the organs are not drawn separately. 20 of the 141 regions (the ventricles, white-matter tracts, olfactory structures and the claustrum) have no surface at all, though every one can be read in the flat cuts.
- **Nothing here has been validated**, scientifically or clinically. Distances and volumes describe this atlas, not a patient. The download holds no recordings and no trained model.

## The anatomy is the Allen Institute's

The regions, their names and their numbers come from the *Allen Human Reference Atlas — 3D, 2020* (version 1.0.0) by Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein, © 2019 Allen Institute for Brain Science, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This project cut the atlas to its left half, built the surfaces, and added the colours and the controls. The Allen Institute has not endorsed any of it.

The 3D drawing is done by [Three.js](https://github.com/mrdoob/three.js) (MIT licence). Everything this project wrote itself is in the public domain under [CC0 1.0](LICENSE).

[Licences and credits](RIGHTS.md) has the full credit, the list of changes, and what you must keep when you reuse any part.

## The talk is paused; its scripts are published

*I Know Kung Fu* is the long form of the argument. A film character has a skill loaded into his brain through a cable; the talk asks what a real version would have to measure, step by step, starting with whether recorded signals can predict a movement that was measured separately. Slides 87 and 88 of 111 propose Interoceptomics as a field.

- **Technical script**, 114 pages: [PDF](docs/current/Interoceptomics-Script-Technical.pdf) · [DOCX](docs/current/Interoceptomics-Script-Technical.docx). Every step argued in full, with references.
- **Simple script**, 36 pages: [PDF](docs/current/Interoceptomics-Script-Simple.pdf) · [DOCX](docs/current/Interoceptomics-Script-Simple.docx). The essential spoken lines for the same slides.

[About the two scripts](docs/current/README.md). The slides for them are not published: 22 of their 88 pictures have not been cleared for redistribution. An older slide deck, with earlier scripts and a 238 MB set of 3D models of the proposed experiments, is still available as a [pre-release from 4 November 2026](https://github.com/eliminatenoise/Interoceptomics/releases/tag/interoceptomics-r42-draft); the rights to some of its pictures and models have not been established.

## One programme, three projects

Interoceptomics belongs to Brain2Body, a programme about connecting brain and body function (the 2 means *to*).

- **[NeuroTranslation](https://github.com/eliminatenoise/NeuroTranslation)** asks how well one recording of the body predicts another: brain or muscle activity against measured movement, tested on open human recordings.
- **[NeuroSurge](https://eliminatenoise.github.io/NeuroSurge/)** is a browser game for learning which motor areas of the brain move which parts of the body. Its activity is simulated.
- **Interoceptomics** is the widest of the three and the least built: the proposal that body sense and nerve wiring be studied together, and so far one brain atlas you can turn.

---

[Project page](https://eliminatenoise.github.io/Interoceptomics/) · [What changed in the latest viewer](downloads/brain-r8/RELEASE-NOTES.md) · [Checksum of the download](downloads/brain-r8/Interoceptomics-Brain-R8-Experimental-Preview-R33.zip.sha256) · [Desktop shortcuts](LAUNCHERS.md) · [Facts about this repository for scripts](PROJECT-CONTEXT.json)
