# Did the reading change the same way in everyone?

Choose a movement and a quarter second. Each scalp dot now answers a question about people. How many had a higher reading than before the cue, how many had a lower reading, and how many stayed level? The answer belongs to that electrode and interval. A person whose reading rose slightly counts just as much as someone whose reading rose sharply.

The recordings come from seven participants (S1–S7) in Ofner and colleagues’ right-arm execution experiment. Each completed three runs with six repeats of every instruction per run. This descriptive comparison covers seven instructions, four windows and 67 channels, for 1,876 sets of counts. The 61 scalp measurements are displayed on standard cap coordinates. The three eye and three movement sensors appear in separate tables. Eye channels 62 and 64 have different left/right header labels between recordings. Compare those counts by recorded index only. [Original recordings](https://doi.org/10.5281/zenodo.834976) · [Study](https://doi.org/10.1371/journal.pone.0182578)

## Read one dot

Orange means that more people’s readings rose than fell. Blue means that more fell. The dark ends mean that every person with usable data went the same way. An even balance is cream, including when everyone stayed level. Grey means there was no usable reading. Select a dot for the counts, including anyone left out. With fewer people, a single reading carries more weight in the colour. The colour score equals (higher minus lower) divided by (higher plus lower plus level).

At Cz, near the top of the head, six of seven people had a lower reading for the bend cue and four of seven for the straighten cue, 2.50–2.75 seconds after the cue appeared. In that same window the elbow sensor rose for all seven when the instruction was to bend, and fell for all seven when the instruction was to straighten. All seven people supplied usable data for every cell in this edition. Across the 13,132 person-by-cell comparisons, 126 had exactly zero change.

We compared each person with their own baseline before counting agreement. The contrast uses stored instrument units. Their physical units and anatomical sign have not been established. The resulting count has a straightforward unit, one person. The cap picks up a mixture that can include muscle and eye activity. The map cannot tell where the change originated inside the brain. The seven participants form a fitting group. These counts describe their recordings and do not test prediction or generalization.

## Rebuild the counts

Use Python 3.9 or later and the 21 motor execution GDFs listed in `source-files.json`. Place them in one directory. Its entries list each source file’s size in bytes, publisher MD5 and full-file SHA-256. From this directory, pass the source directory and a destination for the two rebuilt files.

```sh
python3 build_agreement.py /path/to/gdf-files /path/to/rebuilt
```

The script checks every file’s size, hashes, header, paired cue markers and sample rates. It reads the inputs locally and writes only the aggregate JSON and the same counts as a classic JavaScript file, which lets an extracted copy work offline. Keep the adjacent `measurements/` directory when running the builder. It contains the shared GDF reader and native-window calculation. Workers can be set with `--workers 2` if the machine has spare capacity. Each worker processes one participant at a time.

The visual cue is time zero. Subtract one from the GDF event position to obtain the zero-based 512 Hz cue tick. The baseline is −0.50 to −0.25 seconds. The four post-cue windows begin at 0, 0.75, 1.50 and 2.50 seconds and last 0.25 seconds. Include the first boundary and exclude the last. Convert each endpoint to its native channel index by rounding (tick × channel rate / 512) upwards. This yields 128 samples at each scalp or eye electrode, and 16 at each movement sensor.

For each channel and repeat, subtract the baseline median from the window median. Both intervals must be complete and all their samples finite. Take the median over repeats in a run, requiring at least three of the six. A channel that has fewer than two distinct finite readings across the whole run is unusable. A flat window on a channel that does vary remains eligible. Take the arithmetic mean of the three run medians, requiring all three. Count a person once as higher, lower, or level according to the sign of that mean before rounding. A missing run result puts that person in the unavailable count for that cell. The complete prespecified rules are in [protocol.json](protocol.json).

Within each task and window, arrays in `counts.json` follow the corresponding channel list. Each four-integer tuple holds higher, lower, exactly level and unavailable, in that order. The entries sum to seven. The data omit individual signs, run values and trial samples.

## Attribution

Patrick Ofner, Andreas Schwarz, Joana Pereira and Gernot R. Müller-Putz released the source recordings in 2017 under Creative Commons Attribution 4.0 International. These counts and their browser copy retain that licence. The adaptation aggregates trial changes within runs and counts their signs across people. Original builder and interface code are dedicated under CC0 1.0. The anatomy template and original study figures have their own notices. [Dataset](https://doi.org/10.5281/zenodo.834976) · [Data licence](../licenses/CC-BY-4.0.txt) · [Code dedication](../licenses/CC0-1.0.txt) · [Atlas notice](../NOTICE.txt)
