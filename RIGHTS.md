# Licences and credits

The project's own work in this repository is dedicated to the public domain. The atlas, drawing library, embedded fonts and recordings from people and animals carry their own conditions. No single licence covers everything.

| What | Whose | Terms | To reuse it you must |
| --- | --- | --- | --- |
| The brain anatomy in the atlas viewer: surfaces, region grid, region names and numbers | Allen Institute for Brain Science, adapted by this project | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Give the credit below, link the licence, keep the notices, say what you changed |
| Three.js, the 3D drawing library inside the viewer | Three.js authors | [MIT](https://opensource.org/license/mit) | Keep its copyright and permission notice |
| Fonts embedded in the script PDFs | Liberation Sans: Red Hat and Google. Comic Sans MS: Microsoft | SIL Open Font License 1.1; Microsoft's core fonts end-user licence | Keep the two licence files with the PDFs |
| The right-wrist recording and derived forecast results in the experiment guide | Jorge German Perez Blanco and Javier Mauricio Anteliz Ortiz, *EEG-EMG-WristMotion Dataset*, version 3 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Give credit and link the licence and source. Keep the [trial, model and change notices](docs/stages/recording/WRIST-NOTICE.md) and identify further changes. |
| The walking sensor excerpt and saved forecasts in the experiment guide | Billur Barshan and Kerem Altun, *Daily and Sports Activities* | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Give credit and link the licence and source. Keep the [walking excerpt and forecast notices](docs/stages/recording/NOTICE.md) and identify further changes. |
| The W-track position and brain-cell spike excerpt in the experiment guide | Justin Shin and Shantanu Jadhav, *Single Day W-Track Learning* (2024) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Credit the authors, link the licence and [dataset](https://doi.org/10.48324/dandi.000978/0.240511.0307), keep the [excerpt notice](docs/stages/recording/MAZE-NOTICE.md) and identify further changes. |
| Everything this project made itself: the viewer's code, the colour choices, these pages, the scripts' prose, the desktop shortcuts | This project | [CC0 1.0](LICENSE), to the extent the project holds the rights | Nothing |

Each third-party item retains the terms listed in its row. Where the project's work is fused with the atlas, as in every surface file, the atlas's terms still apply to the result.

## The Allen atlas: the credit to give

> Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein (2020), *Allen Human Reference Atlas — 3D, 2020*, version 1.0.0, RRID:SCR_017764. Copyright © 2019 Allen Institute for Brain Science. Licensed under CC BY 4.0. Adapted by the Interoceptomics project.

The atlas's [official README](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/README.pdf) states CC BY 4.0, effective 1 September 2022. The files are in the [original atlas collection](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/).

When you copy or adapt any atlas-derived file from the viewer:

1. Keep the creators' names, the copyright line, and the links to the source and to the licence.
2. Keep the disclaimers and the change notices that travel with the files. In the download they are `THIRD-PARTY-NOTICES.html`, the `licenses/` folder and the notices in `sources/allen-version1/`.
3. Say what you changed in turn.
4. Do not suggest that the creators or the Allen Institute endorse you or your use. They have not endorsed this project.

Do not relabel this material as CC0, and do not add a non-commercial restriction to it. The licence gives no warranty that the anatomy is accurate or fit for any purpose.

## What this project changed in the atlas

The atlas is a grid of half-millimetre cubes, each carrying the number of a region. From that grid this project made the following. All of it is atlas-derived, and the credit above applies to all of it.

| Change | What was done |
| --- | --- |
| The left half | The atlas labels almost only its left side. The 3D model keeps the cubes at R ≤ 0 in the atlas's own right-anterior-superior coordinates: the left side and the midline. |
| Surfaces | Surfaces were drawn around the regions on the 0.5 mm grid. The cut face at the midline was closed with a constructed cap of at most 0.25 mm. An earlier display approximation moved surfaces by at most 0.125 mm. Surface directions (normals) were set, and a plain single-sided material was applied. |
| Grouping | Some regions were merged into combined surfaces, and thirty were given surfaces of their own in the main model file. With the four separate surfaces below, that makes the 34 regions the viewer can lift out. |
| Coordinates | Positions were converted from the atlas's millimetres to the viewer's metres: (R, A, S) becomes (−R, S, A) ÷ 1000. |
| Four separate surfaces | Unsmoothed, each following one region on the same grid in the same coordinates, with display normals and a material added: the red nucleus (region 12247), the ventral posterior lateral nucleus, VPL (10424), the ventral posterior medial nucleus, VPM (10425), and the parietal operculum (13230). |
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

- For all 141 regions, the number, name, abbreviation and full ancestry in the viewer match the table exactly. No near-match was accepted. This was first checked on an early edition of the viewer and was checked again for the current version, on 20 November 2026.
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

## The older pre-release

The [pre-release of 4 November 2026](https://github.com/eliminatenoise/Interoceptomics/releases/tag/interoceptomics-r42-draft) holds an older slide deck, the two scripts one revision earlier and a set of 3D models of the proposed experiments. It is a different case from everything above. Its slides and models include material made by others, among it images of Neo and Professor X and separately licensed software and model files. The rights to that material, and how far it may be reused, have not all been established, and the project's CC0 dedication does not cover it. Before reusing anything from that release, read the `NOTICE.txt` and `ASSET-PROVENANCE.json` published with it.

## The atlas viewer download

| | |
| --- | --- |
| File | [`Interoceptomics-Atlas-Viewer.zip`](downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip), which unpacks to a folder `Interoceptomics-Atlas-Viewer` |
| Version | 20 November 2026. The file name never carries the version: each new one replaces the last at the same address |
| Size | 40,479,519 bytes (84,055,924 bytes unpacked) |
| Contents | 74 files. `MANIFEST.json` lists the other 73 with their sizes and checksums |
| SHA256 | `36900fe8df2462f54d6c66f96be577affd3ad794fcd1b1d9e49b7ea142289009` ([checksum file](downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip.sha256)) |

Identities of the upstream files, for anyone who wants to start from the same sources:

| Upstream file | SHA256 |
| --- | --- |
| [`annotation.nii.gz`](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/annotation.nii.gz), the region grid | `be23763c15386f2f211105f1e8144a6887e7615571229090e209b1c78355d378` |
| `voxel_count.csv`, the table of names (479,643 bytes) | `7348be087e6c2b6cb1fde1d604761cdd2d70e0e33ded6e1f322db334959d162f` |
| The API response of 4 November 2026 (not distributed) | `70281f17ee7b23bd4076606c25038d31b3f4fca69973356138a05bceb9896341` |

## What a licence does not tell you

A licence says who may copy. It says nothing about whether the anatomy is right, and this project does not claim that it is.

The atlas grid carries 141 regions. The viewer's 3D model holds 121 of them in 44 surfaces (40 in the main model file, 4 in files of their own): 34 regions have a surface of their own, 82 more are parts of larger combined surfaces, and 5 are listed by name only. The parietal operculum is counted among the 34 and also appears on a combined surface. The other 20 regions have no surface; the download lists them in `viewer/omissions.html`. All 141 can be read in the flat cuts.

The half-millimetre grid, the midline cap and the display approximation describe how the surfaces were made, not how accurate they are. There is no right half and no fit to any person. The model shows anatomy and nothing else: it demonstrates nothing about what a region does, and nothing clinical. [What the viewer is not](README.md#an-illustration-not-a-measurement).
