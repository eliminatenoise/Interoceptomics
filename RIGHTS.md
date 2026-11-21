# Licences and credits

The project's own work in this repository is dedicated to the public domain. The brain atlas (the Allen Institute's published map of the brain's regions), the 3D drawing library, the fonts embedded in the PDFs and the recordings from people and animals carry their own conditions. No single licence covers everything.

| What | Whose | Terms | To reuse it you must |
| --- | --- | --- | --- |
| Which wrist moved? | Original invented movement and reader by Interoceptomics. Upper-body shape and graphical rig by MakeHuman | Original work and MakeHuman assets dedicated under CC0 | [Methods and credits](docs/cross-person-wrist/METHODS.md) identify the surface crop and arm transforms. The reader contains invented pose coordinates. |
| One wrist reach reader and optional AJILE12 conversion | Original reader and practice scene by Interoceptomics. AJILE12 by Peterson, Singh, Dichter, Scheid, Rao and Brunton | Software and practice scene CC0. [AJILE12 release](https://doi.org/10.48324/dandi.000055/0.220127.0436) CC BY 4.0 | The download contains software and an invented example. When sharing an adaptation of the separately obtained recording, credit its authors, link the licence and describe changes. [Source and scope](docs/human-wrist/READ-ME.txt) |
| Heart electrical activity, chest vibration and breathing excerpts | Miguel Ángel García González and Ariadna Argelagós Palou, Universitat Politècnica de Catalunya, via PhysioNet CEBSDB 1.0.0 | [Open Data Commons Attribution License 1.0](https://physionet.org/content/cebsdb/view-license/1.0.0/) | Preserve the source and licence notices and identify adaptations. [Excerpt details and citations](docs/inside/README.md) |
| The brain anatomy in the atlas viewer: surfaces, region grid, region names and numbers | Allen Institute for Brain Science, adapted by this project | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Give the credit below, link the licence, keep the notices, say what you changed |
| Three.js, the 3D drawing library inside the viewer | Three.js authors | [MIT](https://opensource.org/license/mit) | Keep its copyright and permission notice |
| Fonts embedded in the script PDFs | Liberation Sans: Red Hat and Google. Comic Sans MS: Microsoft | SIL Open Font License 1.1; Microsoft's core fonts end-user licence | Keep the two licence files with the PDFs |
| The right-wrist recording and derived forecast results in the experiment guide | Jorge German Perez Blanco and Javier Mauricio Anteliz Ortiz, *EEG-EMG-WristMotion Dataset*, version 3 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Give credit and link the licence and source. Keep the [trial, model and change notices](docs/stages/recording/WRIST-NOTICE.md) and identify further changes. |
| The slow walking stride, its marker trajectories, electrical amplitudes and floor-plate forces | Céline Schreiber and Florent Moissenet, Rehazenter Adult Walking Dataset, version 8 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Retain the [authors’ original licence and requested citation](models/stride-signals/LICENCE). Interoceptomics selected C2 walking trials, aligned stride time and walking direction, calculated marker displacement between frames 200 ms apart, and averaged within and across people. [Original release](https://doi.org/10.6084/m9.figshare.7734767.v8) · [Study](https://doi.org/10.1038/s41597-019-0124-4) |
| The walking sensor excerpt and saved forecasts in the experiment guide | Billur Barshan and Kerem Altun, *Daily and Sports Activities* | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Give credit and link the licence and source. Keep the [walking excerpt and forecast notices](docs/stages/recording/NOTICE.md) and identify further changes. |
| The W-track position and brain-cell spike excerpt in the experiment guide | Justin Shin and Shantanu Jadhav, *Single Day W-Track Learning* (2024) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Credit the authors, link the licence and [dataset](https://doi.org/10.48324/dandi.000978/0.240511.0307), keep the [earlier trip notice](docs/stages/recording/MAZE-NOTICE.md) and the [forecast excerpt and weights notice](docs/stages/recording/wtrack/NOTICE.md), and identify further changes. |
| Everything this project made itself: the viewer's code, the colour choices, these pages, the scripts' prose, the desktop shortcuts | This project | [CC0 1.0](LICENSE), to the extent the project holds the rights | Nothing |

Each third-party item retains the terms listed in its row. Where the project's work is fused with the atlas, as in every surface file, the atlas's terms still apply to the result.

## The Allen atlas: the credit to give

> Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein (2020), *Allen Human Reference Atlas — 3D, 2020*, version 1.0.0, RRID:SCR_017764. Copyright © 2019 Allen Institute for Brain Science. Licensed under CC BY 4.0. Adapted by the Interoceptomics project.

The atlas's [official README](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/README.pdf) states CC BY 4.0, effective 1 September 2022. The files are in the [original atlas collection](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/).

When you copy or adapt any atlas-derived file from the viewer:

1. Keep the creators' names, the copyright line, and the links to the source and to the licence.
2. Keep the disclaimers and the change notices that travel with the files. In the download they are `THIRD-PARTY-NOTICES.html`, the `licenses/` folder and the notices in `sources/allen-version1/`. On the website the same files sit beside the viewer, in `docs/atlas/`.
3. Say what you changed in turn.
4. Do not suggest that the creators or the Allen Institute endorse you or your use. They have not endorsed this project.

Do not relabel this material as CC0, and do not add a non-commercial restriction to it. The licence gives no warranty that the anatomy is accurate or fit for any purpose.

## What this project changed in the atlas

The atlas is a grid of half-millimetre cubes, each carrying the number of a region. From that grid this project made the following. All of it is atlas-derived, and the credit above applies to all of it.

| Change | What was done |
| --- | --- |
| The left half | The atlas labels almost only its left side. The 3D model keeps the cubes at R ≤ 0 in the atlas's own right-anterior-superior coordinates: the left side and the midline. |
| Surfaces | Surfaces were drawn around the regions on the 0.5 mm grid. The cut face at the midline was closed with a constructed cap of at most 0.25 mm. An earlier display approximation moved surfaces by at most 0.125 mm. Surface directions (normals) were set, and a plain single-sided material was applied. |
| Grouping | Some regions were merged into combined surfaces, and thirty were given surfaces of their own in the main model file. With the four separate surfaces and the twenty more surfaces below, that makes the 54 regions the viewer can lift out. |
| Coordinates | Positions were converted from the atlas's millimetres to the viewer's metres: (R, A, S) becomes (−R, S, A) ÷ 1000. |
| Four separate surfaces | Unsmoothed, each following one region on the same grid in the same coordinates, with display normals and a material added: the red nucleus (region 12247), the ventral posterior lateral nucleus, VPL (10424), the ventral posterior medial nucleus, VPM (10425), and the parietal operculum (13230). |
| Twenty more surfaces | Made on 21 November 2026 by the Interoceptomics contributors, one file for each of the twenty regions that had no surface until then: the white matter of the forebrain and five named fibre bundles, nine fluid spaces, the four regions of the smell pathway and the claustrum. Each follows one region on the same grid, in the same coordinates, and was made the same way as the thirty single-region surfaces of the main model file: the left half with the same midline cap, a surface drawn around the region's voxels, smoothed so that no point moved by more than 0.125 mm, with normals and a plain material added. The viewer shows them only when you ask. |
| Where VPL and VPM touch | A list of the 481 grid faces between regions 10424 and 10425. |
| Two crops of the grid | One keeps only VPL and VPM. One keeps every full plane that contains the parietal operculum. |
| The whole grid, repacked without loss | For the flat cuts, the ruler and the volume counts. Every original region number is kept, in the original order, and the atlas's own coordinate frame is recorded with it. The source file is `annotation.nii.gz` from the collection. |
| A lookup of starting points | For each region and side, the one cube of that region closest to the average position of its cubes. Ties go to the lowest index in the original order. |
| Additions that are not anatomy | The somatic, autonomic and integration colours, the cameras and lights, the controls, and a generated overview picture. |

Two things are deliberately absent. The MRI brain template that the atlas was drawn on, the ICBM 2009b nonlinear symmetric MNI152 average, is not in the download. The atlas's README sends you to [the McConnell Brain Imaging Centre](http://www.bic.mni.mcgill.ca/ServicesAtlases/ICBM152NLin2009) for the template and its terms of use, and gives its copyright as © 1993–2004 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University. Nothing here is a licence for it. The photographs and figures from the papers the viewer cites are not in the download either; those stay with their publishers.

| Part | File in the download, under `viewer/` | Its notice in the download |
| --- | --- | --- |
| Left half of the brain, 40 surfaces | `assets/brain-left.glb` | `THIRD-PARTY-NOTICES.html` |
| Which region each surface point belongs to | `assets/identity/*.u32` | `THIRD-PARTY-NOTICES.html` |
| Overview picture | `assets/overview.png` | `THIRD-PARTY-NOTICES.html` |
| Red nucleus | `assets/red-nucleus-source-left.glb` | `THIRD-PARTY-NOTICES.html` |
| Twenty more regions, one surface each | `assets/surface-N.glb`, where N is the region's atlas number | `THIRD-PARTY-NOTICES.html` |
| VPL | `assets/vpl-source-left.glb` | `sources/allen-version1/VPL-NOTICE.txt` |
| VPM | `assets/vpm-source-left.glb` | `sources/allen-version1/VPM-NOTICE.txt` |
| Parietal operculum | `assets/parietal-operculum-source-left.glb` | `sources/allen-version1/PARIETAL-OPERCULUM-NOTICE.txt` |
| Faces shared by VPL and VPM | `assets/vpl-vpm-shared-faces.json` | `sources/allen-version1/VPL-VPM-SHARED-FACES-NOTICE.txt` |
| Grid crop with VPL and VPM | `assets/vpl-vpm-source-grid.json` | `sources/allen-version1/VPL-VPM-SOURCE-GRID-NOTICE.txt` |
| Planes containing the parietal operculum | `assets/parietal-operculum-*.bin`, `assets/parietal-operculum-sections.json` | `sources/allen-version1/PAO-SECTIONS-NOTICE.txt` |
| Whole grid, repacked | `assets/atlas-label-runs.bin`, `assets/atlas-label-runs.json` | `sources/allen-version1/RULER-ANNOTATION-NOTICE.txt` |
| Starting point for each region and side | `assets/atlas-region-locations.json` | `sources/allen-version1/RULER-ANNOTATION-NOTICE.txt` |
| Region names, abbreviations and hierarchy | `registry.json` | `THIRD-PARTY-NOTICES.html` |

The full text of CC BY 4.0 is in the download at `licenses/CC-BY-4.0.txt`.

## The region names are the Allen Institute's too

So are the regions' abbreviations, their numbers and their parent-and-child order. All are covered by the same CC BY 4.0 credit, on this basis: the atlas collection publishes its own table of them, [`voxel_count.csv`](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/examples/voxel_count/voxel_count.csv), and the collection's README counts such tables among its materials. The download includes that table unchanged at `sources/allen-version1/voxel_count.csv`.

What was checked, and what was not:

- For all 141 regions, the number, name, abbreviation and full ancestry in the viewer match the table exactly. No near-match was accepted. This was first checked on an early edition of the viewer and was checked again for the current version, on 21 November 2026.
- For all 141 regions, the table's count of cubes equals a recount of the atlas grid in the download. The table's other count and volume columns, which add in each region's sub-regions, were not checked.
- The API response described below and the table carried the same set of region numbers and agreed exactly on name, abbreviation, ancestry, parent, order and colour. That comparison was made once, on an early edition, and cannot be repeated from the download, because the response is not in it. Its record is in the download at `sources/allen-version1/source-binding.json`; it keeps the name and the folder the viewer had then.
- The table was downloaded on 15 November 2026. The server reports it as last modified on 19 February 2025, so it cannot be shown to be byte-for-byte the 2020 original.

### The names first came through the Allen web API, whose terms are narrower

The viewer's names and hierarchy were first fetched from the Allen Brain Map web API on 4 November 2026: structure graph 16, 3,317 rows, through [this query](https://api.brain-map.org/api/v2/data/query.json?criteria=model%3A%3AStructure%2Crma%3A%3Acriteria%2C%5Bgraph_id%24eq16%5D%2Crma%3A%3Aoptions%5Border%24eq%27structures.graph_order%27%5D%5Bnum_rows%24eqall%5D). It is the 2026 state of that graph, not a frozen copy from 2020. The response itself is not in the download.

The API falls under the Allen Institute's general [Terms of Use](https://alleninstitute.org/legal/terms-of-use/) (as updated 23 October 2026), which are narrower than CC BY. They record:

- permission for research and non-commercial use, with citation;
- ownership staying with the Institute;
- limits on commercial redistribution;
- the Institute's Freedom to Innovate conditions, which include not asserting rights against improvements the Institute develops independently, and a restriction on posting to sites that require acknowledgement of ownership of the posted content.

What that means for you:

- The names, abbreviations, numbers and ancestry of the 141 regions match the published table, so the CC BY 4.0 credit above covers them.
- The rest of the API response was not examined and is not in the download. This page gives no permission for it, and no blanket permission for AI use, for future improvements (the Terms' own word is "Improvements"), or for the model as a whole.
- That the whole response carries no licence here does not narrow CC BY 4.0 for the matching fields or for the atlas-derived files, nor the MIT licence of Three.js.
- If you fetch from the API yourself, the Terms of Use apply to what you fetch, as they do to this project's own fetch.

## Three.js

Three.js revision 186. Copyright © 2010–2026 Three.js authors. [MIT licence](https://opensource.org/license/mit). The complete notice is in the download at `viewer/vendor/three/LICENSE` and again at `licenses/THREE-MIT.txt`. Keep it with any copy. [Three.js source](https://github.com/mrdoob/three.js).

## The scripts

The prose of the two scripts is the project's own and is dedicated to the public domain under [CC0 1.0](docs/current/LICENSE-CC0-1.0.txt), to the extent the project holds the rights.

The works the scripts cite, the passages they quote, and the film, character and brand names they mention belong to their owners. Mentioning them implies no endorsement, and CC0 does not apply to them.

The PDFs embed subsets of two typefaces: Liberation Sans (SIL Open Font License 1.1) and Comic Sans MS Bold (Microsoft's core fonts end-user licence). Both licence texts sit beside the PDFs: [Liberation](docs/current/FONT-LICENSE-Liberation.txt), [Microsoft core fonts](docs/current/FONT-LICENSE-Microsoft-CoreFonts.txt). No font file is distributed on its own, and the DOCX files embed no fonts. The [notice](docs/current/NOTICE.txt) that travels with the scripts says the same.

## The withdrawn 4 November prerelease

The withdrawn prerelease contained an older deck, earlier scripts and 3D models of the proposed experiments. Its slides and models include material made by others, among it images of Neo and Professor X and separately licensed software and model files. Reuse rights for some of that material remain unresolved. The project's CC0 dedication applies only to material for which the project holds the rights. If you downloaded that edition, keep its `NOTICE.txt` and `ASSET-PROVENANCE.json` with your copy.

## The atlas viewer download

| | |
| --- | --- |
| File | [`Interoceptomics-Atlas-Viewer.zip`](downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip), which unpacks to a folder `Interoceptomics-Atlas-Viewer` |
| Version | 21 November 2026. The file name never carries the version: each new one replaces the last at the same address |
| Size | 64,344,808 bytes (121,371,527 bytes unpacked) |
| Contents | 94 files. `MANIFEST.json` lists the other 93 with their sizes and checksums |
| SHA256 | `a2ff84b54e3511042998d3134e8a34305f643e56701690f145254d7699e05c9c` ([checksum file](downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip.sha256)) |

The website serves the same files, without the four start files, at [eliminatenoise.github.io/Interoceptomics/atlas](https://eliminatenoise.github.io/Interoceptomics/atlas/): the folder `docs/atlas/` of this repository, built from the download's own files. The credit and the conditions on this page apply to that copy exactly as they do to the download. The folder `docs/atlas/backslash/` beside the viewer's files is not part of the copy: it is Backslash of the Brain, a separate anatomy atlas that shows the viewer's 3D model inside its own pages. Its sources, and the terms for reusing its own files, are on [its sources page](https://eliminatenoise.github.io/Interoceptomics/atlas/backslash/sources.html).

Identities of the upstream files, for anyone who wants to start from the same sources:

| Upstream file | SHA256 |
| --- | --- |
| [`annotation.nii.gz`](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/annotation.nii.gz), the region grid | `be23763c15386f2f211105f1e8144a6887e7615571229090e209b1c78355d378` |
| `voxel_count.csv`, the table of names (479,643 bytes) | `7348be087e6c2b6cb1fde1d604761cdd2d70e0e33ded6e1f322db334959d162f` |
| The API response of 4 November 2026 (not distributed) | `70281f17ee7b23bd4076606c25038d31b3f4fca69973356138a05bceb9896341` |

## What a licence does not tell you

A licence says who may copy. It says nothing about whether the anatomy is right, and this project does not claim that it is.

The atlas grid carries 141 regions. The viewer's 3D model holds all 141 in 64 surfaces (40 in the main model file, 24 in files of their own): 54 regions have a surface of their own, 82 more are parts of larger combined surfaces, and 5 are listed by name only. The parietal operculum is counted among the 54 and also appears on a combined surface. Twenty of the 54 (the white matter and the fluid spaces, the smell pathway and the claustrum) are drawn only when the viewer is asked for them; the download lists them in `viewer/omissions.html`. All 141 can be read in the flat cuts.

The half-millimetre grid, the midline cap and the smoothing describe how the surfaces were made, not how accurate they are. There is no right half and no fit to any person. The model shows anatomy and nothing else: it demonstrates nothing about what a region does, and nothing clinical. [What the viewer is not](README.md#an-illustration-not-a-measurement).

## The recorded cortex

The Stanford FingerFlex data from Kai Joshua Miller and colleagues and the derived cue/blank comparisons carry CC BY-SA 4.0. The public software reads the original anatomy on demand. No participant surface or raw signal records are part of the public package. Original project code carries the repository’s CC0 dedication. [Original source](https://purl.stanford.edu/zk881ps0522) · [Analysis changes, full credit and required ethics statement](models/recorded-cortex/METHODS.md)

The five-person cortical coverage reader counts the anatomical codes in the Stanford FingerFlex deposit. The counts and adaptations of the study data retain CC BY-SA 4.0. [Attribution, Methods and required ethics statement](docs/cortex-coverage/README.md)

## Scalp and arm

Ofner et al.’s codebook, figure copies, dataset-derived channel descriptions, repeated-trial summaries and seven-person agreement counts and scalp–eye cohort summaries carry CC BY 4.0. FieldTrip’s standard 10–5 electrode coordinates and triangulated scalp retain the GNU GPL v3. The Colin27 attribution and original template files accompany both the site and the ZIP. The project's own viewer, limb illustration and prose carry CC0. [Sources, modifications and full licences](docs/scalp-and-arm/NOTICE.txt)

## Cervical surface recordings

The voltage averages come from Nierula and colleagues’ OpenNeuro ds004388 v1.0.0 (CC0). The study drawings and Human Reference Atlas surfaces carry CC BY 4.0. The FieldTrip scalp and standard electrode coordinates retain GPL v3 and the Colin27 notice. The reader includes these notices and describes the crops, surface simplification and schematic electrode positions. [Sources and licenses](docs/cervical-signals/NOTICE.txt).

## Back sensor and skin recordings

Gracia Laso and colleagues’ Experiment 2 measurements and their adaptations retain CC BY 4.0. The reference vertebrae and discs derive from Z-Anatomy and BodyParts3D under CC BY-SA. [Complete attributions, changes and licences](docs/back-rotation/NOTICE.txt)

## Inside a lifting foot

Zhang and colleagues’ AnkleImage tracking estimates retain CC BY 4.0. The right leg meshes derive from Z-Anatomy and BodyParts3D and retain CC BY-SA 4.0. The offline reader links the original publication figures. [Attribution and changes](docs/muscle-tracking/NOTICE.txt)

## Seated ankle and fixed pedal

Zhang, Hakam, Akinniyi, Iyer, Bao and Sharma’s numerical AnkleImage Task 1 recordings are licensed under CC BY 4.0. Z-Anatomy and BodyParts3D reference surfaces and the combined standalone scene carry CC BY-SA 4.0. The separate original schematic platform and reader code carry CC0. Full attributions, changes, upstream source links and licences appear in the [pedal atlas notice](docs/pedal-load/NOTICE.txt). The atlas links to the separately licensed article for its apparatus description.

## Heel and force

The walking trial comes from Moissenet and Schreiber (dataset v8). The plate diagram comes from Supplementary Figure 1 of Schreiber and Moissenet (2019). The recordings, derived positions and loads, and attributed figure use CC BY 4.0. [Sources, transformations and licences](docs/heel-and-force/NOTICE.txt) · [Recording and reference hashes](docs/heel-and-force/sources.json)

## One walker, two instructions

The skin-marker trajectories, muscle recordings, foot events and floor-plate readings derive from the Rehazenter Adult Walking Dataset v8 by Schreiber and Moissenet, under CC BY 4.0. The reader and animated models use attribution and adapted coordinate and time displays. [Original data](https://doi.org/10.6084/m9.figshare.7734767.v8) · [Changes and credits](docs/walking-instructions/NOTICE.txt) · [Original licence](docs/walking-instructions/DATA-LICENCE.txt)

## Visual rotation during walking

Steven M. Peterson and Daniel P. Ferris released the Perturbed beam-walking task under CC0. The visual balance reader includes one short event excerpt, digitized electrode positions and two derived models from version 1.0.3. The apparatus and experiment papers are linked. [Dataset](https://doi.org/10.18112/openneuro.ds003739.v1.0.3) · [Data paper](https://doi.org/10.1016/j.dib.2021.107635) · [Reference checks and derivation](docs/visual-balance/METHODS.md)

## Muscle and motion during visual rotation

Steven M. Peterson and Daniel P. Ferris recorded the two short excerpts in the muscle-and-motion atlas. Their *Perturbed beam-walking task*, OpenNeuro ds003739 v1.0.3, carries a CC0 dedication. The excerpts, two derived sacrum-path GLBs, offline ZIP and reader credit the original work. [Recording](https://doi.org/10.18112/openneuro.ds003739.v1.0.3) · [Data paper](https://doi.org/10.1016/j.dib.2021.107635) · [Experiment](https://doi.org/10.1523/ENEURO.0207-18.2018) · [Rights and citation request](https://github.com/OpenNeuroDatasets/ds003739/blob/f15449b6aecb83044b49a1798955e8a212a68fc1/dataset_description.json)

## Grasping and balancing

Matthew D. Luciw, Ewa Jarocka and Benoni B. Edin recorded WAY-EEG-GAL. Its Figshare participant deposits list CC0 1.0. The authors’ data descriptor specifies CC BY 4.0 for the data and scripts. The atlas converts one wrist trajectory to millimetres and summarizes the signals from five arm muscles and three central scalp contacts. [WAY-EEG-GAL deposits](https://doi.org/10.6084/m9.figshare.c.988376.v2) · [Data descriptor and usage notes](https://doi.org/10.1038/sdata.2014.47) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Steven M. Peterson and Daniel P. Ferris released the beam-walking data under CC0. Their recording supplies the second excerpt’s sacrum trajectory and signals from eight leg muscles and three scalp contacts. The cap drawing uses the manufacturer's published socket-to-site correspondences. [OpenNeuro release 1.0.3](https://doi.org/10.18112/openneuro.ds003739.v1.0.3) · [Data and processing](https://doi.org/10.1016/j.dib.2021.107635) · [BioSemi cap coordinates](https://www.biosemi.com/download/Cap_coords_all.xls)

Interoceptomics dedicates its original reader, code, schematic cap, forecast overlays and 3D trajectory files to the public domain under CC0 to the extent of its rights. The source papers and apparatus figures are linked at their publishers. [Measurements, attributions and changes](docs/cross-limb-movement/METHODS.md) · [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## One push, two recording days

The [contact forecast atlas](docs/contact-forecast/NOTICE.md) uses the 12 and 13 September 2017 recordings of macaque C from Chowdhury, Glaser and Miller (2020) under CC0. Resized copies of their eLife Figures 1, 2 and 8 retain CC BY 4.0 attribution. The standalone 3D models animate the deposited shoulder-relative camera markers in metres.

## Carry the cylinder

The Ruhr Hand Motion Catalog by Tim Sziburis, Susanne Blex, Tobias Glasmachers and Ioannis Iossifidis supplies 18 selected optical-marker trajectories and original Figures 2, 4 and 6. The numerical data, figures and measured content of the derived 3D exports retain CC BY 4.0 attribution. The reader centres each optical position on its recording start and derives the display clock from frame number. [Dataset](https://doi.org/10.17605/OSF.IO/J3QC8) · [Article](https://doi.org/10.1038/s41597-025-05576-7) · [Changes and licences](docs/target-reach/METHODS.md)

## Cylinder rotation

Sziburis, Blex, Glasmachers and Iossifidis supply the 18 inertial recordings and Figures 2, 4 and 6. Measurements, their derived animation channels and the figures retain CC BY 4.0. The atlas centres orientation on each first pose and derives ten-sample means from the device axes. Original viewer code, text and illustrative geometry carry CC0 to the extent of programme rights. [Methods, source and licences](docs/cylinder-rotation/METHODS.md)

## After the reach

Raeed Chowdhury, Joshua Glaser and Lee Miller released the processed macaque recordings under CC0. Figures 1–3 of their study, resized and converted to WebP for the reader, retain CC BY 4.0. Interoceptomics supplies the replay and animated paths, and NeuroTranslation supplies the forecasts. [Recording, figure credits and methods](docs/reach-feedback/NOTICE.md).

The [fingertip touch reader](https://eliminatenoise.github.io/Interoceptomics/fingertip-touch/methods.html) uses the MakeHuman Team’s CC0 generic right index finger, an original constructed sequence and a count derived from Delhaye and colleagues’ CC BY 4.0 archive. Original figures and participant recordings remain at their sources.

The separate macaque replay groups one 100 ms segment of a Bensmaia Lab nerve recording into five 20 ms counts. Credit Weber and colleagues for the original recordings and Delhaye and colleagues for the *Feeling Fooled* dataset. The five derived counts retain the source dataset’s CC BY 4.0 licence. The model forecast was calculated separately. [Original dataset](https://gin.g-node.org/JohnDowney/Feeling_Fooled) · [Source paper](https://doi.org/10.1371/journal.pbio.3000431) · [Data licence](https://creativecommons.org/licenses/by/4.0/)

## Between two pressure readings

Brierley and Brizuela deposited the pressure and pelvic nerve recording from mouse R481 in SPARC dataset 659, version 1. The reader converts two nerve-mark times and four pressure-sample times to seconds and shows the intervals between them. It converts the four stored pressure counts to mmHg using the scale and offset in the recording. The counts, times and converted readings retain CC BY 4.0. Interoceptomics dedicates its original reader text, diagram, code and launchers to the public domain under CC0 to the extent of its rights. [Dataset](https://doi.org/10.26275/UZOC-EOK4) · [File coordinates and credits](docs/visceral-clock/SOURCE.txt) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
