# Where the finger recordings came from

Each dot marks a contact where an electrode recorded electrical activity. Rotate the brain and the dots turn with it. The brain surface and the contact locations come from the same person in the Seattle FingerFlex study. The grid covered the left frontal and parietal cortex. A dot tells you where the recording came from. To find out how the signal changed when the person moved a finger, you also need the voltage recording and the movement record. [Original experiment, Figure 1](https://doi.org/10.1371/journal.pcbi.1002655.g001) · [Stanford data deposit](https://purl.stanford.edu/zk881ps0522)

## Make the anatomy file on your computer

1. Install Python 3.11 or newer. Open a terminal in the folder containing `extract.py`. On Windows you can use `py` in place of `python` in each command.
2. Install the two scientific Python packages that read the MATLAB file.

   ```sh
   python -m pip install numpy scipy
   ```

3. If you already have the original `bp_fingerflex.mat` from version 11 of the Stanford deposit, supply its path. For example, if you put it beside `extract.py`, run the following command.

   ```sh
   python extract.py --mat bp_fingerflex.mat
   ```

   To get that same file from Stanford instead, run the command below. It requests one 58.8 MB compressed member from the much larger archive, checks the deposit and verifies the member before reading its three anatomical fields. The remaining people stay on Stanford's server. Some networks block partial downloads; in that case use the original MAT option above.

   ```sh
   python extract.py --download
   ```

4. Open `private/bp-native-cortex.json` with the cortex viewer's local file picker. Both commands produce the same 3,284,079-byte file. Its SHA-256 fingerprint is `cc06b1e49ab755aecef3317699e1c457f3d0141e2111816503fbf8b5b9498f57`. Keep participant geometry and locally generated images in the private folder on your computer. The published code and verification figures contain aggregate checks only. [Verification figures](verification.json)

If you have the original MAT, you can check every value again after the JSON is written. This comparison also measures each contact's shortest distance to an original surface triangle. It reads only `brain`, `locs` and `elec_regions`.

```sh
python verify.py --mat bp_fingerflex.mat
```

## What the source preserves

`brain.vert` holds 45,180 points on the rendered brain surface. `brain.tri` connects them into 90,368 triangles. The browser file keeps every point and triangle, their original order, and the full precision of the coordinates. It subtracts one from each MATLAB triangle index because JSON arrays start at zero. There is no smoothing, mesh reduction, centring, rotation, reflection or template registration in the packet. The surface extends to both sides of the brain. The 46 recording contacts all lie on the left. The authors obtained the cortical surface from preoperative MRI and located the grid in relation to it using postoperative CT. [Acquisition and localization methods](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1002655) · [Localization method](https://doi.org/10.1016/j.jneumeth.2009.10.005)

The first row of `locs` gives the three coordinates for the first recording column. The same row of `elec_regions` supplies its anatomical code. The first contact in the JSON therefore has `column0` equal to 0 and `column1` equal to 1. These numbers identify columns within this recording. The label `2` means *Rolandic*, a broad region around the central sulcus. The original analysis script supplies this label, which the shorter task README omits. Four contacts have code `0`, which the supplied sources leave unclassified. [Source members and hashes](sources.json)

| Source code | Anatomical group | Contacts |
| --- | --- | ---: |
| 0 | Unclassified | 4 |
| 1 | Dorsal primary motor cortex | 2 |
| 2 | Rolandic | 1 |
| 3 | Dorsal primary somatosensory cortex | 4 |
| 4 | Ventral sensorimotor cortex | 5 |
| 6 | Frontal, outside the Rolandic region | 24 |
| 7 | Parietal, outside the Rolandic region | 6 |

Every displayed contact retains its original position, including its offset from the reconstructed surface. The source paper discusses physical localisation uncertainty separately. [Archive plotting sources](sources.json) · [Original Methods](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1002655)

## Reading the original images

In Figure 1A, look at the tilted rows of contacts over the side of the rendered brain. In 1B, the operating-room photograph shows the contacts in their transparent carrier. In 1C the authors mark electrode positions over the exposed cortex. The study's image shows the implanted array. The packet contains the contacts retained in the recording after the depositors' channel exclusions. The photographs and the authors' view settings give a visual reference for hemisphere, grid placement and orientation. The exact coordinates and recording-column correspondence come from the MATLAB file. [Original Figure 1A–C](https://doi.org/10.1371/journal.pcbi.1002655.g001) · [Recording and plotting scripts](sources.json)

## Credit, privacy and publication

Kai Joshua Miller deposited *A library of human electrocorticographic data and analyses* at Stanford. The record uses CC BY-SA 4.0 and requires protection of participant privacy and confidentiality, including refraining from identification. Credit the depositor and original authors, name the changes and retain the licence for any adapted data you distribute. The original task README requires the exact ethics paragraph reproduced in `SOURCE-NOTICE.txt` in the Methods of publications involving the data. [Source notice and required paragraph](SOURCE-NOTICE.txt) · [Original data record](https://purl.stanford.edu/zk881ps0522) · [Data library paper](https://doi.org/10.1038/s41562-019-0678-3) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
