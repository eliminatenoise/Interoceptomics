# The recorded cortex

A person saw the name of one finger and bent and straightened it. The Stanford FingerFlex recording pairs that display with electrical activity at 46 contacts on the brain’s surface. Select a finger and frequency band to compare the cue interval with the following blank interval. Choose a region, then a contact to read its measured change. [Open the viewer](https://eliminatenoise.github.io/Interoceptomics/recorded-cortex/)

Switch **Comparison interval** to **Half-second windows after onset** to scrub through seven overlapping averages. Each compares the same time since a cue with the time since the following blank began. The five glove sensors show the average size of their changes over that window, in counts per 40 ms. Playing the windows shows how a condition average evolves. It does not reproduce an individual trial.

Choose **Load 3D brain from Stanford** to rotate the participant’s own cortical reconstruction and recording contacts. This retrieves one verified member of the original archive, about 59 MB. The browser reads the anatomical variables for the surface, positions and region codes. The surface itself has a neutral colour. Each dot uses the corresponding recording column’s change in electrical power. A positive value means greater power during the cue. Colours stop getting darker beyond ±6 dB. Select a dot or use the contact list to read its value.

Drag to rotate the original view. On a keyboard, focus the canvas and use the arrows to turn, +/− to zoom and Home to return. The original camera faces the left-sided recording grid. **Show contacts through the surface** keeps a dot visible even when the geometry would hide it. The software renderer uses that setting on computers without WebGL 2.

The public viewer and download contain the software and the numerical summaries. For a fully offline session, extract the [viewer ZIP](https://github.com/eliminatenoise/Interoceptomics/raw/main/downloads/recorded-cortex.zip), start the launcher for your computer, and choose **Open a local anatomy file**. It accepts the original MATLAB file or the verified JSON packet made with the anatomy extractor. [Extract the anatomy locally](../../models/recorded-cortex/anatomy/README.md) · [Original Stanford archive](https://purl.stanford.edu/zk881ps0522)

To rebuild the standalone page with Python, keep the repository layout and run `python build.py` from this folder. To prepare one local copy with the anatomical packet included, use `python build.py --local-anatomy PATH_TO_PACKET.json --out PATH_TO_LOCAL_COPY.html`. The latter copy contains participant-specific anatomy and belongs in your local working folder.

The recording and derived summaries carry CC BY-SA 4.0. The original viewer code carries the repository’s CC0 dedication. [Study methods, source notice and ethics statement](../../models/recorded-cortex/METHODS.md)
