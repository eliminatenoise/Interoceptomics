# Interoceptomics Atlas Viewer: the viewer's own files

This folder is the viewer itself: one web page, its code, and the anatomy it draws. Version of 20 November 2026.

To open it, use a start file in the folder above this one. [The guide](../README.html) says how, and lists every control.

## Serving it yourself

The viewer is plain files. Any web server that serves this folder will do, and the start files do nothing more than that. For example, in this folder:

    python3 -m http.server 8765 --bind 127.0.0.1

Then open `http://127.0.0.1:8765/index.html`.

Opening `index.html` straight from the disk does not work: the browser refuses to load the page's code that way, and the panel stays at “3D controls unlock when the model is ready.”

Serve it from your own computer (`127.0.0.1` or `localhost`) or from an `https` site. The viewer verifies its data files with the browser's built-in checksum function, and browsers offer that function only on such addresses.

## What is here

| File | What it is |
| --- | --- |
| `index.html` | The page you open: the control panel beside the 3D model. |
| `render.html`, `viewer.js` | The 3D model: loading, drawing, the camera. |
| `ui.js` | The control panel. |
| `annotation-planes.js`, `annotation-planes.css`, `region-finder.js`, `atlas-label-runs.js` | The three flat cuts through the whole atlas grid, the finder, and the reader of the packed grid. |
| `source-sections.js`, `parietal-sections.js`, `section-coordinates.js` | The two section readers: VPL with VPM, and the parietal operculum. |
| `location-comparison.js`, `ruler-walk.js`, `shared-faces.js` | The two-point ruler, the walk along it, and the faces VPL and VPM share. |
| `registry.json` | The list of the atlas's 141 regions: names, numbers, colours, notes, cited sources. |
| `variants.json`, `camera-r4-bounds.json`, `source-provenance.json` | Settings and records of how the main model file was made. |
| `assets/` | The anatomy: surfaces (`.glb`), the region number of each surface point (`identity/*.u32`), the whole atlas grid repacked (`atlas-label-runs.*`), the section data, the overview picture. |
| `vendor/three/` | Three.js, the 3D drawing library, with its licence. |
| `source.html` | Where the anatomy comes from and how to read its coordinates. |
| `omissions.html` | The 20 regions that have no surface. |

## Whose work this is

The anatomy in `assets/` and the names and numbers in `registry.json` are adapted from the *Allen Human Reference Atlas — 3D, 2020*, version 1.0.0, by Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein, © 2019 Allen Institute for Brain Science, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Three.js is © 2010–2026 Three.js authors, under the MIT licence.

If you copy this folder anywhere, take [Licences and credits](../THIRD-PARTY-NOTICES.html) and the `licenses` and `sources` folders with it: the credit, the list of changes made to the atlas and the licence texts have to travel with the files.
