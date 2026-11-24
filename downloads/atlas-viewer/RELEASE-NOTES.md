# The atlas viewer is easier to use on a phone, from the keyboard and on a slow connection

The Interoceptomics Atlas Viewer, version of 24 November 2026.

[Open it on the website](https://eliminatenoise.github.io/Interoceptomics/atlas/) · [Download it](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/atlas-viewer/Interoceptomics-Atlas-Viewer.zip) (ZIP, 64.3 MB) · [Checksum](Interoceptomics-Atlas-Viewer.zip.sha256) · [How to open the download](../../README.md#use-it-offline-download-it) · [Licences and credits](../../RIGHTS.md)

This version makes the viewer easier to use on a phone, from the keyboard and on a slow connection. The 3D model, its regions and its colours are the same as in the version of 21 November 2026.

- **On a phone.** On a narrow screen the 3D model stays at the top while the panel scrolls under it, so a region you show alone or zoom to stays in sight. The text and the controls are larger. In the three flat cuts, the cuts come before their explanation, and a second **Back to the 3D model** button sits at the bottom.
- **From the keyboard.** The Tab key reaches the model, and a blue ring marks it. Shift and the arrow keys turn the model, the arrow keys move it, + and − zoom.
- **On a slow connection.** While the model loads, a faded picture of the brain and a count of the megabytes show that it is arriving. A download that stops says so and offers a button that reloads the page. If some of the white matter and fluid spaces fail to load, hiding them and showing them again fetches only the ones that failed.
- **Colours.** A sentence under the colour key says what to do if two of the colours look alike to you.
- **One link.** The panel links to a separate viewer on the project's website that follows one wrist reach. That link needs the internet.

Run for this version, on Linux in Chromium 155 with software rendering, from the download's start file and from a copy of the website served on this computer: the first view, a colour overlay, the parietal operculum shown alone, the three flat cuts, the white matter and the fluid spaces in each of the four views, flat cuts through a ventricle and through the white matter, three of the twenty regions that are drawn only when asked shown alone, and the page opened straight from the folder. On the copy of the website, also: the keys on the model and Tab through every control; a phone upright and sideways and a tablet; loads at 9 and at 1.6 Mbit/s, a download that stalls and one that breaks; and Backslash of the Brain on this copy. Phone and tablet screens, touch and slow connections were tried only in Chromium's emulation of them, and the keyboard only with key presses sent by a test program. The viewer has not yet been run on Windows, macOS or a phone.

The download contains 94 files in 64,348,133 bytes (121,381,744 bytes unpacked).

## What the version of 21 November 2026 changed

All of it is in this version too.

Twenty of the atlas's 141 regions had no surface. They were the white matter of the forebrain and five of its named bundles of nerve fibres, nine fluid spaces (the ventricles and canals), the four regions of the smell pathway and the claustrum: 2,255,724 of the atlas's 6,999,201 labelled voxels, a third of the atlas. Each now has a surface, made from the same atlas grid the same way as the thirty single-region surfaces of the main model file: a surface around the region's voxels on the half-millimetre grid, smoothed so that no point moved more than 0.125 mm.

- **Show white matter and fluid spaces**, a new button under **Reset view**, draws fifteen of them in place, in every view. The white matter of the forebrain and the fluid spaces are see-through, so the regions inside and behind them stay in sight. They are a 36 MB download, so they stay off until you ask.
- **Show it alone** works for each of the twenty, as for the other regions with a surface of their own. Its file loads when you pick it.
- Until you ask, the 3D model looks exactly as before, pixel for pixel; the panel has one new button.
- The download is larger, 64.3 MB, because it carries the new surfaces. On the website nothing more is loaded until you ask.

The notes under **Evidence and limits**, shown when you select a region, now say in plain words what the earlier ones said in working shorthand. A cited source is named by its authors and year instead of a code, each structure is explained before its abbreviation is given, and the sentence about how the sources were chosen comes once per region instead of in front of every note. Each note starts on a line of its own and says what it said before. The links below the notes go to the same sources, and each now begins with the source's authors and year instead of the project's code for it. Two of them used to give a title and year only. A small gap now separates one link from the next.

Four regions that were listed with "left atlas surface" after their names now have plain names, like every other region: ventral posterior lateral nucleus (VPL), ventral posterior medial nucleus (VPM), red nucleus and parietal operculum (PaO).

On the website the viewer now opens at [eliminatenoise.github.io/Interoceptomics/atlas](https://eliminatenoise.github.io/Interoceptomics/atlas/). The address it had until now, which ended in /viewer/, forwards there, and a link that opens a saved view keeps its view. [Backslash of the Brain](https://eliminatenoise.github.io/Interoceptomics/atlas/backslash/) sits beside it: a separate anatomy atlas that follows signals from muscles and organs through 3D models and slices of the human brain, spinal cord and organs. Its 3D brain is this viewer's 3D model, shown inside its own pages.
