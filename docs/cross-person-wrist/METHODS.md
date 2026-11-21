# Which wrist moved?

Extract the whole folder and open the launcher for Windows, macOS or Linux. Opening index.html directly works too. The illustration runs offline in a current browser. The source links, paper and other atlas pages open online.

## Follow a reach

Start with the left implant. Follow the right wrist through the blue track. At frame 0 the two earlier shoulders fix the origin, direction and scale for the rest of the reach. Choose +8 or +15 to mark a later endpoint. The table reports that endpoint and its distance from a wrist held still at the cutoff. The timeline chooses which pose to draw. The horizon chooses which endpoint to compare. Playback advances one invented frame every 150 milliseconds for inspection. The nominal recording rate in the experiment is 30 Hz.

Turn the body to see the reach in depth. The detector stays in its original plane. Mirror the camera. Each wrist keeps its anatomical name and switches sides on the detector. Change the implant side. The constructed movement now occurs at the opposite wrist. Right and left refer to the person in all views. The glowing head marker identifies a side only.

Select shoulder widths. Positive a points toward the annotated shoulder. Positive b is perpendicular to a and points toward image-up. The earlier shoulder width sets the scale in both directions. The visible coordinates have no physical distance calibration. The two arms can overlap in the image at different depths.

## Reproduce the geometry

The functions in geometry.js encode the entire motion. poseAt uses the original graphical shoulder, elbow and wrist centres. Smooth, asymmetric rotations animate two rigid segments per arm. An orthographic detector with a small deterministic roll, scale change and pan generates the six image trajectories. It discards the depth coordinate. These choices illustrate what a camera projection loses. They provide no estimate of any recorded person's posture.

For prior frames −14 through 0 inclusive, let d be the shoulder on the annotated side minus the shoulder on the implant side in detector pixels. Let w be the median of the fifteen lengths of d. Axis a is the mean of d divided by its length. Its unit perpendicular b points toward decreasing detector y. Origin o is the midpoint of the two shoulders at frame 0. For any wrist p, the displayed pair is ((p − o) · a / w, (p − o) · b / w). The inverse is o + w(ua + vb). The two later frames are 8 and 15 frames from the cutoff. Their coordinates never enter the reference frame.

Withhold the frame if any earlier shoulder pair is missing, w is below one pixel, the mean direction length is below w/2, or the absolute vertical component of b is below 0.10. Withhold a role when any of its three earlier landmarks is missing. The two-arm input requires both roles. Each later target is checked separately. An invented future wrist can still be visible when its earlier input is missing. No fitted model or clinical measurement enters the illustration. The paper describes the recording experiment and its limitations.

## Surface and primary references

The MakeHuman Team's hm08 base mesh, rig joints and graphical vertex weights provide the surface shape and permit the elbow to bend continuously. The pinned source assigns left and right from the model's perspective. The cropped torso retains both hands. A neutral surface colour, two segment transforms per arm and an arbitrary hemisphere marker were added for this reader. The artist-built mesh represents a generic adult. No cranial contact location, medical scan or recorded body shape appears here. The viewer can draw the surface with WebGL or a Canvas 2D fallback. [MakeHuman source at the pinned commit](https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data) · [Asset licence and copyright](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md)

Peterson SM, Singh SH, Dichter B, Scheid M, Rao RPN and Brunton BW (2022) describe how a video detector estimated body landmarks and how the authors selected movement events. The number and type of limb landmarks, image units, nominal rate and implant-side examples follow that account. Their original figures include real acquisition geometry and contact coverage that this drawn implant indicator cannot supply. No participant images, traces or coordinates are redistributed. [AJILE12 data descriptor](https://doi.org/10.1038/s41597-022-01280-y) · [Pinned DANDI data edition](https://doi.org/10.48324/dandi.000055/0.220127.0436)

Holzbaur KRS, Murray WM and Delp SL (2005) model upper-extremity segment motion, muscles and moment arms. The linked humerus and forearm in this example keep fixed three-dimensional lengths even as projected lengths change. Many degrees of freedom in their anatomical model, including forearm rotation, have no independent control in this illustration. [Original upper-extremity model](https://nmbl.stanford.edu/publications/pdf/Holzbaur2005.pdf)

Wu G and colleagues (2005) specify joint coordinate systems using anatomical landmarks embedded in moving segments. The single planar axis built here uses only two projected shoulders. It cannot recover three-dimensional joint rotations or replace measurements at those anatomical landmarks. [ISB joint coordinate systems for the shoulder, elbow, wrist and hand](https://pubmed.ncbi.nlm.nih.gov/15844264/)

## Build the same surface

Run python derive_surface.py in this directory to reproduce surface.js. This optional development step retrieves three pinned files and checks their SHA-256 digests. To work offline, pass --source-dir followed by a folder that already contains base.obj, default.mhskel and default_weights.mhw from that revision. No dependency installation is required. To rebuild the offline ZIP from a repository checkout, use python docs/cross-person-wrist/package.py.

Original reader, invented motion and diagrams are dedicated to the public domain under CC0 in LICENSE.txt. The graphical MakeHuman mesh and rig are CC0 under MAKEHUMAN-CC0.txt. The authors and publishers retain rights in the linked papers.
