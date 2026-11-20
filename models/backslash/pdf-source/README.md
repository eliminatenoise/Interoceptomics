# Backslash of the Brain

This directory builds the illustrated neuroanatomy atlas. Its figure sources, credits, licence links and image checksums are recorded in [plates.json](plates.json). Select a figure in the PDF to visit its original publication or full-size image. Captures of the companion link to the in-PDF controls and portable fragments for each anatomical view. Extract Backslash-Atlas.zip and run Linux.sh, macOS.command or Windows.cmd with Python 3.10+. The launcher prints the loopback address.

## Build

Use Python 3.10 or newer, ReportLab 4, Pillow and Liberation Sans. Supply the directory containing `LiberationSans-Regular.ttf` and `LiberationSans-Bold.ttf`.

```sh
python -m pip install reportlab Pillow
python -B build.py --font-dir /usr/share/fonts/liberation backslash-neuroanatomy-atlas.pdf
```

The build uses the local assets supplied here. The independent axial, coronal, sagittal, donor and teaching figures retain their original orientations, labels and scale bars. PDF compression and resizing for the page are the only changes to those plates.

## Figure use

- The authors and figure numbers are listed in the PDF and in the plate registry. Where an article states Creative Commons Attribution without a version in its notice, the registry links that notice.
- OpenStax College, Rice University, supplies the three 2013 teaching figures under CC BY 3.0. Iacono and colleagues dedicated the MIDA paper to the public domain under CC0; their thalamic boundaries derive from the digitized Morel atlas.
- Model images were captured from the offline Backslash companion. Brain surfaces and source sections come from Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein (© 2019 Allen Institute for Brain Science), [Allen Human Reference Atlas – 3D, 2020, version 1.0.0](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/). The separate brainstem sections come from [Coulombe and colleagues](https://doi.org/10.3389/fnana.2021.627656). The four organ groups come from [Browne and Schlehlein, 3D Reference Organ Set for Female v1.10](https://doi.org/10.48539/HBM637.DWBM.744). These anatomical sources are CC BY 4.0. Model outputs retain the source geometry or annotation and apply selected visibility, camera and identification colours.
- The blood-pressure feedback diagram was drawn for this atlas. The prior StatPearls baroreflex image uses CC BY-NC-ND. Its source is linked on the pressure-feedback page. Hardy and Korstanje credit BioRender for their illustrations; their paper is linked. Hazart and colleagues’ gut illustration adapts an earlier figure. This edition uses Overton and colleagues’ human pelvic dissection and Sun and colleagues’ microscopy of mouse, macaque and human colon.
