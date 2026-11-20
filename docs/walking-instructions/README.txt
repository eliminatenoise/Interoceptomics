One walker, two instructions
Interoceptomics • experimental recording atlas

Extract every file from the ZIP. Open index.html in a current browser, or use the launcher named for Windows, macOS or Linux. If the desktop does not mark a shell launcher executable, open index.html directly. The reader needs JavaScript. All rendering and playback work offline. External study and licence links require an internet connection.

The initial view is 500 ms after the right foot first struck the ground. Turn either figure to turn both. Choose equal stride fraction to compare the same part of each right stride. Watch the optical frame number, elapsed time and right-heel coordinates below each figure. Left-foot and right-foot sample buttons take you to the two force checks.

C4.glb and C5.glb contain all 161 and 125 optical frames of the two cropped recordings, including the intervals outside the selected strides. Open either in an animation-capable glTF 2.0 viewer. Enable its animation to walk through the recording at 100 Hz. The figures start at the first frame in each source file. The named skin markers retain their measured relative positions. Rounded links show the approximate span and width of body segments. Body shape, joint centres and head movement were not measured in these trajectories.

To regenerate both GLBs and recordings.js, obtain the original version-8 archive from https://doi.org/10.6084/m9.figshare.7734767.v8. Run Python with NumPy and ezc3d installed. The checked versions were NumPy 2.5.5 and ezc3d 1.7.2.

    python build.py /path/to/original-data.zip
    python package.py walking-instructions.zip

sources.json identifies the original members and their hashes, the published marker and muscle labels and the plate assignments from supplementary table 2. The builder reads only those two members. Every file needed for the reader, models, source and licences is named in package.py. The ZIP itself is not among its inputs.

Data and derived measurements are licensed CC BY 4.0. See DATA-LICENCE.txt for the original citation and terms, NOTICE.txt for changes, and CODE-LICENCE.txt for this reader’s code.
