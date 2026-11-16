# The map and its sources

## Brain R8 package R6

The [experimental Brain R8 download](downloads/brain-r8/Interoceptomics-Brain-R8-Experimental-Preview-R6.zip) is one labelled left-half atlas with browser controls. Keep the sources with the map: the anatomy, source names and browser software each have a traceable route into this edition.

| Edition | Exact identity |
| --- | --- |
| Archive | `Interoceptomics-Brain-R8-Experimental-Preview-R6.zip` |
| Size | 38,628,511 bytes |
| SHA256 | `8dae55e8ee34caaac7d1384549b9e7aa2c09a7752e36323d9ecae21027259fa2` |
| Checksum | [Detached checksum](downloads/brain-r8/Interoceptomics-Brain-R8-Experimental-Preview-R6.zip.sha256) |
| Model and controls | Source-left geometry retained; viewer highlight refresh repaired; 20 omission notes retained |

The archive contains `THIRD-PARTY-NOTICES.html`, full licence copies under `licenses/`, `PACKAGE-MANIFEST.json`, and the official CSV with `source-binding.json` under `sources/allen-version1/`. The archive has 43 regular files. The current package manifest identifies the other 42 files; the archive checksum identifies the whole edition. [Edition notes](downloads/brain-r8/RELEASE-NOTES.md) describe what changed.

### Atlas-derived anatomy and overview

Song-Lin Ding, Joshua J. Royall, Susan M. Sunkin, Benjamin A. C. Facer, Phil Lesnar, Amy Bernard, Lydia Ng and Ed S. Lein (2020), *Allen Human Reference Atlas — 3D, 2020*, version 1.0.0, RRID:SCR_017764. Copyright © 2019 Allen Institute for Brain Science.

The [official atlas README](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/README.pdf) states [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) effective 1 September 2022. This source applies to the atlas-derived model, vertex identities and generated overview. Keep the creators, copyright, source and licence links, disclaimers and previous change notices; identify further changes. No endorsement is implied. The full legal text travels in `licenses/CC-BY-4.0.txt` and its readable HTML page. [Original atlas collection](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/).

The derivative selects native RAS R≤0, extracts surfaces from 0.5 mm annotation voxels, constructs a midline cap and applies bounded display approximation and normal treatment. Structural unions, thirty added source-label masks, teaching colours, cameras and interaction are authored changes. R6 bakes the proper source-to-world frame and corrects normal direction; R8 adds icons with that geometry unchanged. R2 corrected the description of **Restore this view**. R3 changed documentation and source support while preserving its 34 functional base files. R4 corrected the notes for the 20 omitted labels and added their index. R5 clarified which source comparison is historical and which manifest identifies current files. Package R6 repairs stale highlight inputs when a view or model-variant change turns isolation off. Geometry, source labels, identity files, the colour palette, dependencies and launchers retain their R5 bytes. Thirty-nine of the 43 package files remain unchanged from R5. Of the original 34 R3 base files, 32 remain exact; the registry’s 20 omission notes and the viewer code differ.

The overview is the generated medial render of that derivative. No underlying MNI MRI or internal comparison photographs are included. Source identity does not establish complete anatomical accuracy, and the licence supplies no accuracy or fitness warranty.

### The exact labels and hierarchy

The [official version1 CSV](https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/examples/voxel_count/voxel_count.csv) is a listed member of the same atlas collection. R6 retains its complete, unchanged 479,643 bytes, SHA256 `7348be087e6c2b6cb1fde1d604761cdd2d70e0e33ded6e1f322db334959d162f`. It was retrieved on 15 November 2026 Melbourne; the observed Last-Modified header is 19 February 2025. A version1 directory name and that header do not prove frozen-2020 bytes.

The retained R3 source comparison found exact IDs, names, acronyms and full ordered ancestry paths for all 141 R3 registry rows. It also found identical ID sets and exact matches for name, acronym, ancestry path, parent ID, graph order and colour across the retained 3,317-row production API snapshot and CSV. The current registry preserves those fields; only the 20 omission notes changed. The checked by-ID/acronym lookups, descendant groups, authored association selections and interface controls use those fields. No approximate name match or dropped ancestor was accepted. `source-binding.json` records that historical comparison and the checked source-use witnesses; it was not rewritten or rerun for R5 or R6. The CSV’s count and volume columns are included for source completeness; they were not validated and supply no new anatomical measurement claim.

The comparison’s `delivered_registry` hash identifies the R3 registry: 260,028 bytes, SHA256 `ab8cbbf3123e153ef77a419116933c98ed8eff30fbdb45be74b2cb93f68097bd`. Its relative path now reaches a changed file. The current registry is 259,848 bytes, SHA256 `8c2c83b1cba48df2434c5ae149f346254cefbce261d205292a40f987db4278f4`; `PACKAGE-MANIFEST.json` identifies that file and the other current package members. The retained geometry-era R6 model manifest describes its older registry and viewer bytes; it does not identify the current package R6 files.

The collection README explicitly includes ontology/hierarchy examples in its materials. Its CC BY grant therefore supplies a parallel, identified permission basis for these precise matching fields and checked adaptations. That source application was independently accepted; it does not redate the production query. Preserve the direct upstream CC BY offer, attribution and changes. Do not relicense this material as project-owned CC0 or add a noncommercial restriction to it. No blanket licence for the whole API response, every future Improvement, AI use or the complete model is created here.

### The actual November 4 production route

The model used a current Allen Brain Map graph16 response retrieved on 4 November 2026 through the [official query](https://api.brain-map.org/api/v2/data/query.json?criteria=model%3A%3AStructure%2Crma%3A%3Acriteria%2C%5Bgraph_id%24eq16%5D%2Crma%3A%3Aoptions%5Border%24eq%27structures.graph_order%27%5D%5Bnum_rows%24eqall%5D). Its SHA256 remains `70281f17ee7b23bd4076606c25038d31b3f4fca69973356138a05bceb9896341`. The full response is not shipped. Its query, date, hash and model-generation history remain in the manifest and original payload records.

The [Allen general terms](https://alleninstitute.org/legal/terms-of-use/), updated 23 October 2026, separately record research/noncommercial permissions, citation, retained ownership, commercial redistribution limits and nonassertion against Allen’s independently developed improvements. They also restrict posting on sites requiring acknowledgement of ownership of the posted Content. R6 preserves this acquisition record; it does not waive those obligations or establish unrestricted rights for unexamined response fields or unrelated Improvements. Lack of a whole-response grant does not impose an extra NC restriction on the separately identified CC BY-covered metadata above.

### Browser software and original contributions

Three.js revision 186 retains its complete MIT notice at `payload/brain-outward-r6/vendor/three/LICENSE` and `licenses/THREE-MIT.txt`. Copyright © 2010–2026 Three.js authors. [Three.js source](https://github.com/mrdoob/three.js) · [MIT terms](https://opensource.org/license/mit).

The repository’s [CC0 statement](LICENSE) concerns original contributions only to the extent the project holds those rights. It does not dedicate third-party material or erase source conditions. The upstream CC BY offer and MIT notice remain attached to their respective components. This page applies no blanket licence to the archive.

### Read the biological limits with the colours

The model’s 40 meshes cover 121 of 141 occupied labels; 20 labels lack included surfaces. The omitted labels remain in the registry and are listed in the archive’s `payload/brain-outward-r6/omissions.html`. Combined surfaces do not isolate every nucleus. The 0.5 mm source grid, constructed cap of at most 0.25 mm and prior display approximation of at most 0.125 mm describe derivation, not biological accuracy. Fine autonomic nuclei, cortical functional fields and independent basal-forebrain, septal and bed-nucleus shape confirmation remain open.

Local surface-direction countercases, deep-view differences, occlusion and stock-export colour differences remain. There is no right-half option or fit to an individual person. No neural activity, neural writing, learned skill transfer, clinical safety or complete biological function has been demonstrated by the model. Native Windows/macOS execution, every control and angle, and other-machine behaviour remain unverified. The archive README retains the detailed qualifications; original scientific, real-reference SERIES, held-out, rights, privacy, visual, native and export gates remain.

### The highlight repair and its limits

Five constructed exact-handler software checks pass for the R6 viewer; the old viewer failed the two isolation-exit checks. The fixture used one selected and one contrast vertex, with substitutes for the renderer, scene, DOM and camera. Its result concerns stored CPU colour inputs. Full browser controls, GPU rendering, displayed colour and performance remain unverified.

The original isolate → lateral → deep visual check, C01, remains open at its AMD/RADV target: a 1800 × 1200 window and 1470 × 1200 model viewport. Earlier images and pixel checks describe earlier builds. Reference-series, donor/scale/function, held-out, rights/privacy, native visual/export and OS requirements remain; the new documentation’s rendered layout and actual font fallback are unverified. The software result supplies no new anatomical or biological validation.
