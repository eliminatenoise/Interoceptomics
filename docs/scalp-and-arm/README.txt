SCALP & ARM — OFFLINE READER

Extract the complete ZIP. Open index.html in a browser or use the launcher for
your operating system in the same folder. On Linux, you can run sh "Open on Linux.sh"
in a terminal from the extracted folder. A local HTML file is enough. No installation, account
or server is needed. Outbound citations open only when you follow an external link.

Pick a scalp site to face its template coordinate. Click another visible dot
to inspect it without moving your viewpoint. Drag either 3D view, use its view
buttons or focus it and press the arrow keys. Home restores the opening view.
Choose a right-arm instruction, then move the trial clock and compare how many
EEG and mechanical sample intervals have elapsed. The arrow keys move the
time control in EEG samples. A separate button advances one EEG sample.

Choose “Change in one person” to place recorded scalp changes
from one participant's 18 trials per cue on the standard head. Choose a
quarter-second interval, then select an electrode for its signed change and
actual number of contributing trials. The six eye, glove and exoskeleton
summaries sit below the drawings. Gaps between bins have no measured overlay.
The files give stored units. The physical units, anatomical signs and hardware
timing offset remain unverified.
Choose “Agreement across seven people” to count who rose, fell or stayed level
at each site. Missing observations are counted separately. The colour compares
signs among the people with usable readings. The counts for the eye and arm
sensors appear below the drawings. See agreement/README.md for the calculation.
Choose “Scalp and eye signals” to compare a quarter second of scalp and eye
readings before and after the cue. Pick one of six sites or a pair. Compare the
same trial with the next repetition of that cue. Select a bar to see the spread
across seven people and the number of matched trials. See eyes/README.md.
The time slider also moves the illustrative arm independently of the measurements.
The methods and source code are included in the measurements folder.

For the authors' equipment photo, cue timeline, channel names and rights, open
“How to check the setup” or NOTICE.txt. The CSV records all 96 native header
labels and their independent published descriptions. Individual trial voltages,
individual movement trajectories and individual scalp coordinates are outside
this atlas. The pose is an illustration of the selected movement. The reader
has no participant-specific head model or cortical source solution.

Desktop Chromium and narrow mobile layouts are checked on Linux. The classic
scripts and local assets support file-based use. WebGL uses depth-tested meshes.
A Canvas 2D painter draws the same rotating geometry if WebGL is unavailable.
Native Windows, macOS and mobile launch behavior still requires testing there.

In the repository, build the offline anatomical data with:
    python3 docs/scalp-and-arm/build.py
Build a byte-stable ZIP with:
    python3 models/scalp-and-arm/package.py
Inside an extracted ZIP run “python3 build.py” to regenerate the anatomical data.
SHA256SUMS lists the files in the distribution. The site generator and archive
use only the Python standard library.
