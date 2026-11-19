# The map and its sources

## Brain R8 package R33

The [experimental Brain R8 download](downloads/brain-r8/Interoceptomics-Brain-R8-Experimental-Preview-R33.zip) pairs the source-left 3D atlas with native categorical label planes. Keep the sources with the map: the anatomy, source names and browser software each have a traceable route into this edition.

| Edition | Exact identity |
| --- | --- |
| Archive | `Interoceptomics-Brain-R8-Experimental-Preview-R33.zip` |
| Size | 40,595,864 bytes |
| SHA256 | `44047e76e8850cbd67b1119c478cbee14fafddec72c8400ddf512c41858870af` |
| Checksum | [Detached checksum](downloads/brain-r8/Interoceptomics-Brain-R8-Experimental-Preview-R33.zip.sha256) |
| Model and controls | Source-left geometry, inspection by available meshes or surface samples |

The archive contains `THIRD-PARTY-NOTICES.html`, full licence copies under `licenses/`, `PACKAGE-MANIFEST.json`, and the official CSV with `source-binding.json` under `sources/allen-version1/`. The R33 archive contains 76 regular files. The package manifest lists the other 75 files. The archive checksum identifies the whole edition. [Edition notes](downloads/brain-r8/RELEASE-NOTES.md) describe what changed.

### Atlas-derived anatomy and overview

Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein (2020), *Allen Human Reference Atlas — 3D, 2020*, version 1.0.0, RRID:SCR_017764. Copyright © 2019 Allen Institute for Brain Science.

The [official atlas README](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/README.pdf) states [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) effective 1 September 2022. This source applies to the atlas-derived model, the separate red nucleus, VPL, VPM and parietal operculum surfaces, vertex identities and generated overview. Keep the creators, copyright, source and licence links, disclaimers and previous change notices; identify further changes. No endorsement is implied. The full legal text travels in `licenses/CC-BY-4.0.txt` and its readable HTML page. [Original atlas collection](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/).

The derivative selects native RAS R≤0, extracts surfaces from 0.5 mm annotation voxels, constructs a midline cap and applies bounded display approximation and normal treatment. Structural unions, thirty added source-label masks, teaching colours, cameras and interaction are authored changes. Geometry R6 bakes the proper source-to-world frame and corrects normal direction. The original R8 viewer added icons with that geometry unchanged. R2 corrected the description of **Restore this view**. R3 changed documentation and source support while preserving its 34 functional base files. R4 corrected the notes for the 20 omitted labels and added their index. R5 clarified which source comparison is historical and which manifest identifies current files. Package R6 repairs stale highlight inputs when a view or model-variant change turns isolation off. Geometry, source labels, identity files, the colour palette, dependencies and launchers retain their R5 bytes. Thirty-nine of the 43 package files remain unchanged from R5. Of the original 34 R3 base files, 32 remain exact; the registry’s 20 omission notes and the viewer code differ.

Package R7 moves renderer setup into the existing error handler and adds a plain startup failure message with the error identity. Its successful scene/control code is unchanged. Thirty-nine of the 43 files retain their R6 bytes, modes and modification times, including geometry, source labels, identity files, palette, dependencies and launchers. The other changes are the matching release notes, change notice and manifest. Package R8 adds a loading message, recovery steps and a record of the browser checks. Thirty-eight files retain their R7 bytes, modes and modification times, including the geometry, source labels, identity files, palette, dependencies and launchers. Package R9 classifies selector entries using the delivered mesh and label assignments, displays the existing cerebral surface when needed and waits for the viewer before enabling its controls. The model’s coordinates, sources and 20 omission notes retain their R8 bytes.

Package R10 adds one left red nucleus surface. It selects Allen label 12247 in the original left annotation, extracts an unsmoothed 0.5 isosurface on the 0.5 mm source grid and applies the same proper coordinate basis. Display normals and material were added. The exact asset is `payload/brain-outward-r6/assets/red-nucleus-source-left.glb`, SHA256 `3e67055edca4fe9d1c402aa8e1ad1acb8358c62aa7d203715b501e2a1d89248c`. The atlas terms and change notices above travel with it. R11 moved the overview outside the model view during isolation. R12 fits the canvas to the window and adjusts the camera projection during live resizing. The external MRI and histology comparison figures are outside the download.

R14 adds the left ventral posterior lateral nucleus at `payload/brain-outward-r6/assets/vpl-source-left.glb`, SHA256 `38ff571b7849d9d98dd59a6a5ba76a68e2d98c8e542309983d5fe9fdec8f465f`. The unsmoothed 0.5 isosurface follows Allen v1.0.0 direct label 10424 in native RAS R≤0 on the 0.5 mm grid. It uses the same source-to-world basis, with display normals and material. The atlas attribution, CC BY 4.0 and `sources/allen-version1/VPL-NOTICE.txt` travel with it. The comparison figures stay outside the archive. [Original annotation](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/annotation.nii.gz).

R15 adds the left ventral posterior medial nucleus at `payload/brain-outward-r6/assets/vpm-source-left.glb`, SHA256 `dfd1850d5ec93e8dc87dd75744ffc722d717e2205161bd87599dacdc74b12b92`. Its closed surface is an unsmoothed 0.5 isosurface of original left atlas label 10425 on the 0.5 mm grid. Keep the Allen attribution, CC BY 4.0 and `sources/allen-version1/VPM-NOTICE.txt` with it. Comparison figures stay outside the archive. [Original annotation](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/annotation.nii.gz).

R16 puts the same two surfaces in one viewer. Their GLB files, spatial positions and change notices retain the R15 bytes. The viewer applies blue and copper to identify the two labels in comparison mode only. The face count follows the original left atlas annotation and uses the same CC BY 4.0 source.

R17 includes `payload/brain-outward-r6/assets/vpl-vpm-shared-faces.json`. Each entry identifies one face between Allen v1.0.0 labels 10424 and 10425 in the original left annotation, using the perpendicular grid axis and the lower of its two voxel indices along that axis. Its change notice is `sources/allen-version1/VPL-VPM-SHARED-FACES-NOTICE.txt`. Keep the Allen attribution and CC BY 4.0 terms with the face indices. The colours and ghosted surfaces help you see this grid boundary as you turn it.

R18 includes `assets/vpl-vpm-source-grid.json` within the model folder, SHA256 `2281dacde82cb6f55c6bde78646a95d02652ba276c949c4a4f5f0086afe3ae30`. The crop keeps exact source-left VPL and VPM labels from the original 0.5 mm annotation grid. The 3D frame marks the selected section in the atlas. The change notice is `sources/allen-version1/VPL-VPM-SOURCE-GRID-NOTICE.txt`. Keep the Allen attribution and CC BY 4.0 terms with the crop.

R19 adds the unsmoothed left parietal operculum surface at `payload/brain-outward-r6/assets/parietal-operculum-source-left.glb`, SHA256 `367f7990b2a3968b4e89d95a38d0fcf51e15776d77065fd25dfed1a204b391c3`. It follows original label 13230 at the same 0.5 mm source grid with the same coordinate conversion. Keep the Allen attribution, CC BY 4.0 and `sources/allen-version1/PARIETAL-OPERCULUM-NOTICE.txt` with it. Third-party reference figures stay outside the archive.

R20 updates the on-screen camera instructions and completion messages. The source and delivered atlas asset identities are recorded in the package manifest.

R21 adds the original label IDs for the full source planes that intersect PaO. Those planes, their 0.5 mm axes and the 3D frame derive from the same CC BY 4.0 Allen annotation. See `sources/allen-version1/PAO-SECTIONS-NOTICE.txt` in the archive for the changes and source identity. R24 carries a selected voxel across the supplied PaO section planes. The reference photographs stay with their publishers.

R30 losslessly packs the original Allen version-1 `annotation.nii.gz` for the ruler. Its SHA256 is `be23763c15386f2f211105f1e8144a6887e7615571229090e209b1c78355d378`. The packing keeps all original IDs in native x-fast order and preserves the qform. The ruler calculates where the line crosses voxel faces and combines adjacent pieces with the same ID. The original collection's CC BY 4.0 terms apply to this derivative. Names and acronyms come from the included official metadata table. The source credit, file link, change description and licence accompany the ZIP at `sources/allen-version1/RULER-ANNOTATION-NOTICE.txt`.

R33 derives a navigation index from the Allen annotation. Each occupied ID and side has one voxel closest to the mean position of its assigned voxel centres. Equal distances are resolved in native flat-index order. The finder uses the original name and ID. The source credits and CC BY 4.0 terms apply.

R32 highlights the original ID under the crosshair. The table derives counts from the complete annotation and classifies voxel centres by signed RAS coordinate. The absolute qform voxel volume sets the conversion to mm³. The original annotation and its CC BY 4.0 terms accompany this adaptation.

R31 shows sagittal, coronal and axial label planes from the same lossless packed annotation. Label IDs are unchanged. The viewer colours the categories and displays them in native RAS using the original NIfTI qform. These cuts carry neither the MRI intensities nor tissue imagery. The annotation terms and author credits above apply to those planes. See `sources/allen-version1/RULER-ANNOTATION-NOTICE.txt` in the archive.

R29 steps through the cells crossed by the atlas ruler and reads their labels from the supplied sections. Annotation, derived grids, geometry, launchers and licences retain their R28 bytes.

R28 saves two voxel locations and the open section in text. The annotation, derived grids, geometry, launchers and licences retain their R27 bytes.

R27 compares two voxel centres in the same Allen atlas. The annotation, derived grids, source geometry and licences retain their R26 bytes. The marks and line are viewer graphics in the atlas coordinate space.

R26 records the territory, plane, window and RAS voxel in a local saved-view fragment. The annotation, derived grids and rendered geometry retain their R25 bytes.

R25 adds exact RAS coordinate entry to both section readers. Allen annotation, derived grids and rendered geometry retain their R24 bytes.

R23 carries the selected VPL/VPM voxel across section planes. R22 added the label and coordinate readout. The original Allen attribution, CC BY 4.0 licence and crop notice continue to apply.

The overview is the generated medial render of that derivative. No underlying MNI MRI or internal comparison photographs are included. Source identity does not establish complete anatomical accuracy, and the licence supplies no accuracy or fitness warranty.

### The exact labels and hierarchy

The [official version1 CSV](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/examples/voxel_count/voxel_count.csv) is a listed member of the same atlas collection. R10 retains its complete, unchanged 479,643 bytes, SHA256 `7348be087e6c2b6cb1fde1d604761cdd2d70e0e33ded6e1f322db334959d162f`. It was retrieved on 15 November 2026 Melbourne; the observed Last-Modified header is 19 February 2025. A version1 directory name and that header do not prove frozen-2020 bytes.

The retained R3 source comparison found exact IDs, names, acronyms and full ordered ancestry paths for all 141 R3 registry rows. It also found identical ID sets and exact matches for name, acronym, ancestry path, parent ID, graph order and colour across the retained 3,317-row production API snapshot and CSV. The current registry preserves those fields. R10 adds display and availability fields to one label, on top of the 20 revised omission notes. R13 corrected the availability descriptions for VPL, VPM and their combined thalamic surface. R14 adds the separate VPL surface entry. R15 added the separate VPM surface entry and its anatomical citations. R16 records how both territories appear in the comparison and the shared-face count in the source annotation. R17 adds the native coordinates of those faces. R18 adds the cropped source grid. R19 records the separate PaO surface and its citations. The checked by-ID/acronym lookups, descendant groups, authored association selections and interface controls use those fields. No approximate name match or dropped ancestor was accepted. `source-binding.json` records that historical comparison and the checked source-use witnesses; it was last run for R3. The CSV’s count and volume columns are included for source completeness; they were not validated and supply no new anatomical measurement claim.

The comparison’s `delivered_registry` hash identifies the R3 registry: 260,028 bytes, SHA256 `ab8cbbf3123e153ef77a419116933c98ed8eff30fbdb45be74b2cb93f68097bd`. Its relative path now reaches a changed file. The current registry is 269,503 bytes, SHA256 `9d27a9eb3d4c6b938bd95e323af845baf04bddb16ed5e94b7fc5081dca8bc0ea`; `PACKAGE-MANIFEST.json` identifies that file and the other current package members. The retained geometry-era R6 model manifest describes its older registry and viewer bytes; the package manifest identifies the current R24 files.

The collection README explicitly includes ontology/hierarchy examples in its materials. Its CC BY grant therefore supplies a parallel, identified permission basis for these precise matching fields and checked adaptations. That source application was independently accepted; it does not redate the production query. Preserve the direct upstream CC BY offer, attribution and changes. Do not relicense this material as project-owned CC0 or add a noncommercial restriction to it. No blanket licence for the whole API response, every future Improvement, AI use or the complete model is created here.

### The actual November 4 production route

The model used a current Allen Brain Map graph16 response retrieved on 4 November 2026 through the [official query](https://api.brain-map.org/api/v2/data/query.json?criteria=model%3A%3AStructure%2Crma%3A%3Acriteria%2C%5Bgraph_id%24eq16%5D%2Crma%3A%3Aoptions%5Border%24eq%27structures.graph_order%27%5D%5Bnum_rows%24eqall%5D). Its SHA256 remains `70281f17ee7b23bd4076606c25038d31b3f4fca69973356138a05bceb9896341`. The full response is not shipped. Its query, date, hash and model-generation history remain in the manifest and original payload records.

The [Allen general terms](https://alleninstitute.org/legal/terms-of-use/), updated 23 October 2026, separately record research/noncommercial permissions, citation, retained ownership, commercial redistribution limits and nonassertion against Allen’s independently developed improvements. They also restrict posting on sites requiring acknowledgement of ownership of the posted Content. R10 preserves this acquisition record and those obligations. Unexamined response fields and unrelated Improvements remain outside the scoped rights conclusions. Lack of a whole-response grant does not impose an extra NC restriction on the separately identified CC BY-covered metadata above.

### Browser software and original contributions

Three.js revision 186 retains its complete MIT notice at `payload/brain-outward-r6/vendor/three/LICENSE` and `licenses/THREE-MIT.txt`. Copyright © 2010–2026 Three.js authors. [Three.js source](https://github.com/mrdoob/three.js) · [MIT terms](https://opensource.org/license/mit).

The repository’s [CC0 statement](LICENSE) concerns original contributions only to the extent the project holds those rights. It does not dedicate third-party material or erase source conditions. The upstream CC BY offer and MIT notice remain attached to their respective components. This page applies no blanket licence to the archive.

### Read the biological limits with the colours

The preview accounts for 121 of 141 occupied source labels across 43 meshes and their source records. Thirty-three labels have separate meshes, 83 have samples on combined surfaces and five appear as atlas labels only. A further 20 lack included surfaces. Isolation uncovers the left red nucleus, VPL or VPM. Each surface follows one atlas label. Comparisons with other MRI and histology sources are qualitative. The omitted labels remain in the registry and are listed in the archive’s `payload/brain-outward-r6/omissions.html`. Combined surfaces do not isolate every nucleus. The 0.5 mm source grid, constructed cap of at most 0.25 mm and prior display approximation of at most 0.125 mm describe derivation, not biological accuracy. Fine autonomic nuclei, cortical functional fields and independent basal-forebrain, septal and bed-nucleus shape confirmation remain open.

Local surface-direction countercases, deep-view differences, occlusion and stock-export colour differences remain. There is no right-half option or fit to an individual person. No neural activity, neural writing, learned skill transfer, clinical safety or complete biological function has been demonstrated by the model. Native Windows/macOS execution, every control and angle, and other-machine behaviour remain unverified. The archive README retains the detailed qualifications; original scientific, real-reference SERIES, held-out, rights, privacy, visual, native and export gates remain.

### The highlight repair and its limits

Five constructed exact-handler software checks passed for the earlier R6 viewer; the old viewer failed the two isolation-exit checks. The fixture used one selected and one contrast vertex, with substitutes for the renderer, scene, DOM and camera. Its historical result covers stored CPU colour inputs. The later Linux resize tests include AMD/RADV. Broader browser controls, displayed colour and performance remain open.

The original isolate → lateral → deep visual check, C01, remains open at its AMD/RADV target: an 1800 × 1200 window and a 1470 × 1200 model viewport. The retained SwiftShader/wrong-window run stopped before any control actions. Earlier images and pixel checks describe earlier builds. Reference-series, donor/scale/function, held-out, rights/privacy, native visual/export and OS requirements remain. The software result supplies no new anatomical or biological validation.

### If the 3D view cannot start

R9 kept the controls locked until the model was ready. In Linux Chromium with software rendering, the controls stayed locked when geometry, the registry, the viewer module or the renderer page returned HTTP 404. The packaged Linux launcher opened all 40 meshes, with the same initial canvas as R8. The R9 archive’s `VIEWER-CHECKS.json` records those tests. Other startup causes and later rendering faults remain open.

R12 kept the same R11 framebuffer at five checked startup sizes in Linux Chromium on AMD/RADV and SwiftShader. The canvas follows a live resize while the selected view and camera pose stay in place. During isolation, the overview sits below the model in a narrow window and beside it in a wide window. If the separate asset fails to load, the rest of the model can still open and the red nucleus remains searchable as an atlas label.
