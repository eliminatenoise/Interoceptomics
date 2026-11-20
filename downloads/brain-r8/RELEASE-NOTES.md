# Find any region by name and land inside it

The atlas viewer's latest edition, 19 November 2026.

[Download](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/brain-r8/Interoceptomics-Brain-R8-Experimental-Preview-R33.zip) (ZIP, 40.6 MB) · [Checksum](Interoceptomics-Brain-R8-Experimental-Preview-R33.zip.sha256) · [How to open it](../../README.md#open-it-in-three-steps) · [Licences and credits](../../RIGHTS.md)

In **Explore full atlas labels**, choose **Find a structure**. Type a name, an abbreviation or the complete atlas number, choose a side, and press **Show voxel in all three cuts**. The crosshair lands on a voxel of that region (a voxel is one half-millimetre cube of the atlas grid), and gold marks the region's other voxels in each cut.

The landing point is the voxel of the region nearest the average position of all its voxels on that side. That matters for a region that bends around its own middle. The white matter of the forebrain (region 10557) has 2,139 voxels on the midline, and their average position falls inside another region. The finder lands on the nearest voxel that really carries the number 10557, at R 0, A −4.5, S +2 mm.

A side is offered only where the atlas gives that region voxels. All 141 regions have voxels on the left, 22 have some on the midline and 7 have some on the right: 170 places in all. A region and its sub-regions have separate numbers and are found separately.

All 170 places were checked against the atlas's original file, in Chromium on Linux with hardware and with software rendering, by keyboard and by emulated touch. The viewer has not yet been run on Windows, macOS or a phone.

The archive contains 76 files in 40,595,864 bytes (84,176,440 bytes unpacked). SHA256 `44047e76e8850cbd67b1119c478cbee14fafddec72c8400ddf512c41858870af`.
