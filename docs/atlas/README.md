# Interoceptomics Atlas Viewer: the viewer's own files

This folder is the viewer itself: one web page, its code, and the anatomy it draws. Version of 21 November 2026.

In the download, open it with a start file in the folder above this one. On the website it opens at <https://eliminatenoise.github.io/Interoceptomics/atlas/>, with nothing to install. [The guide](README.html) says how, and lists every control.

## Serving it yourself

The viewer is plain files. Any web server will do, and the start files do nothing more than run one. Serve the folder above this one, so that the viewer's links to its guide and to the licence pages work. For example, in that folder:

    python3 -m http.server 8765 --bind 127.0.0.1

Then open `http://127.0.0.1:8765/viewer/index.html`.

Opening `index.html` straight from the disk does not work: the browser refuses to load the page's code that way, and the page says so.

Serve it from your own computer (`127.0.0.1` or `localhost`) or from an `https` site. The viewer verifies its data files with the browser's built-in checksum function, and browsers offer that function only on such addresses. The project's website serves exactly these files, with the viewer's folder and the folder above it merged into one.

## What is here

| File | What it is |
| --- | --- |
| `index.html` | The page you open: the control panel beside the 3D model. |
| `render.html`, `viewer.js` | The 3D model: loading, drawing, the camera. |
| `ui.js` | The control panel. |
| `annotation-planes.js`, `annotation-planes.css`, `region-finder.js`, `atlas-label-runs.js` | The three flat cuts through the whole atlas grid, the finder, and the reader of the packed grid. |
| `source-sections.js`, `parietal-sections.js`, `section-coordinates.js` | The cuts through VPL and VPM, and through the parietal operculum. |
| `location-comparison.js`, `ruler-walk.js`, `shared-faces.js` | The two-point ruler, the walk along it, and the faces VPL and VPM share. |
| `registry.json` | The list of the atlas's 141 regions: names, numbers, colours, notes, cited sources. |
| `variants.json`, `camera-r4-bounds.json`, `source-provenance.json` | Settings and records of how the main model file was made. |
| `assets/` | The anatomy: surfaces (`.glb`; `surface-N.glb` is the surface of the region with atlas number N), the region number of each surface point (`identity/*.u32`), the whole atlas grid repacked (`atlas-label-runs.*`), the data for those cuts, the overview picture. |
| `vendor/three/` | Three.js, the 3D drawing library, with its licence. |
| `source.html` | Where the anatomy comes from and how to read its coordinates. |
| `omissions.html` | The twenty regions drawn only when you ask, and why. |

## Whose work this is

The anatomy in `assets/` and the names and numbers in `registry.json` are adapted from the *Allen Human Reference Atlas — 3D, 2020*, version 1.0.0, by Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein, © 2019 Allen Institute for Brain Science, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Three.js is © 2010–2026 Three.js authors, under the MIT licence.

If you copy this folder anywhere, take [Licences and credits](THIRD-PARTY-NOTICES.html) and the `licenses` and `sources` folders with it: the credit, the list of changes made to the atlas and the licence texts have to travel with the files.
