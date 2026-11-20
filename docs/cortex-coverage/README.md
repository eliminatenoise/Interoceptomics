# Where did the electrodes sit?

Five people performed the FingerFlex task with electrodes placed for their own clinical care. Compare the number of retained contacts in each anatomical region. Choose a participant to inspect the dots on that person's original cortical surface. The numbers D01–D05 refer to the development recordings bp, cc, ht, jc and jp in that order. [Open the comparison](https://eliminatenoise.github.io/Interoceptomics/cortex-coverage/)

## Use it offline

Extract the complete [two-reader ZIP](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/recorded-cortex.zip). Open the launcher for your operating system in `docs/cortex-coverage`, or open `index.html` in that folder. Contact counts work straight away. To see a surface offline, extract the matching original file from Stanford’s FingerFlex ZIP, for example `fingerflex/data/cc/cc_fingerflex.mat` for D02. Select the participant and choose **Open local MAT**. With an internet connection, **Load from Stanford** fetches that participant’s file on demand. Switching participants clears the previous brain. [Stanford deposit](https://purl.stanford.edu/zk881ps0522)

Drag to rotate or focus the surface and use the arrow keys. Plus and minus zoom. Home restores the source view. Choose a dot or a numbered contact to read its regional assignment. Colours identify regions. To inspect electrical power during the task for D01, use the companion [recorded cortex reader](../recorded-cortex/index.html).

## Methods and sources

Each MATLAB file supplies the surface in `brain.vert` and `brain.tri`. Contact number *n* is row *n* in `locs`, row *n* in `elec_regions`, and recording column *n* in the deposit’s channel order after the authors' exclusions. The browser verifies the compressed ZIP member and the complete MATLAB file by SHA-256 on download. A local file goes through the same MATLAB checksum. The decoder opens only the three anatomical variables. It retains the original surface and contact positions and subtracts one from MATLAB’s triangle indices for drawing. Fitting each surface to the screen preserves those positions relative to one another. The files supply neither coordinate units nor a transformation to a common atlas.

The source task notes supply the implant side and broad location. The `call_subs_processing.m` codebook names eight anatomical regions, including code 2 (Rolandic, subdivision unspecified). Code 0 has no named assignment. One D05 contact has code 5, also undocumented. The matrix shows these codes separately. Zero in a region's row means no retained contact carried that code. D02’s broad implant description is right frontotemporal. Its detailed contact labels include two occipital contacts and none labelled temporal. Both descriptions are retained as deposited. In `call_subs_figs.m`, each participant has a camera azimuth and elevation. The CTMR function `loc_view.m` supplies the viewing convention. The surface fit and lighting affect display only. [Source archive and associated code](https://purl.stanford.edu/zk881ps0522) · [Source anatomical localisation method](https://doi.org/10.1016/j.jneumeth.2009.10.005)

| Participant | Release code | Implanted side | Retained contacts | Study azimuth / elevation |
| --- | --- | --- | ---: | ---: |
| D01 | bp | Left | 46 | 250° / 15° |
| D02 | cc | Right | 63 | 80° / 40° |
| D03 | ht | Left | 64 | 270° / 0° |
| D04 | jc | Left | 47 | 270° / 15° |
| D05 | jp | Left | 58 | 270° / 30° |

The archive is `fingerflex.zip` from version 11 of Kai Joshua Miller's *A library of human electrocorticographic data and analyses*. Stanford records its SHA-1 as `83acfe25c27da197db0feaf742d9c5f3f9ee99bf`. Each original member name, inclusive byte range, compressed and uncompressed SHA-256, anatomical variable offset, array size and camera is listed in the [reader’s source definitions](../recorded-cortex/src/anatomy.js). The original task README’s SHA-256 is `4426827c5181bd994a30b5230c046fba196e78ac03bad8210946ca05094929f4`. The region codebook’s SHA-256 is `d726eeecbdcf75807b1b898ca32f3972aff5e2f2192b2ae914f2ac2e66e3258d`. The figure script’s SHA-256 is `3de96e445df6cd51f0f6eb6c3887865963f0017b57fe9a00ee92ef1823cbb310`. [Stanford catalogue](https://purl.stanford.edu/zk881ps0522.json) · [Data library paper](https://doi.org/10.1038/s41562-019-0678-3)

Kai J. Miller, Dora Hermes, Christopher J. Honey, Adam O. Hebb, Nick F. Ramsey, Robert T. Knight, Jeffrey G. Ojemann and Eberhard E. Fetz reported the original experiment in 2012. The data and derived counts carry CC BY-SA 4.0. Credit the original authors, identify adaptations and retain the licence. Stanford requires respect for individual privacy and confidentiality, including refraining from identification. The reader distributes aggregate counts and code. Original project code carries CC0. [Original study](https://doi.org/10.1371/journal.pcbi.1002655) · [Dataset licence](https://creativecommons.org/licenses/by-sa/4.0/)

The depositor requires the following paragraph unchanged in the Methods of publications using these data.

Ethics statement: All patients participated in a purely voluntary manner, after providing informed written consent, under experimental protocols approved by the Institutional Review Board of the University of Washington (#12193). All patient data was anonymized according to IRB protocol, in accordance with HIPAA mandate. These data originally appeared in the manuscript “Human Motor Cortical Activity Is Selectively Phase- Entrained on Underlying Rhythms” published in PLoS Computational Biology in 2012 [Reference].
