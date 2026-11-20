# One walking recording and its saved forecasts

Billur Barshan and Kerem Altun. *Daily and Sports Activities* (2010), UCI Machine Learning Repository, DOI 10.24432/C5C59F. The source data and the sensor excerpts here retain the [Creative Commons Attribution 4.0 International licence](https://creativecommons.org/licenses/by/4.0/). [Dataset and original archive](https://archive.ics.uci.edu/dataset/256/daily)

The selected clip is the first segment of participant p1 walking in a parking lot, archive member `data/a09/p1/s01.txt`. The guide shows rows 0–15 of that member as 16 observations and row 18 as the later target, using zero-based indices. Relative times come from the nominal 25 Hz sampling rate. The three axes remain in each instrument’s local frame and original stored units. Five placements are shown in the same clip. Choosing a placement selects its own history, forecast and target.

The local file retains the complete [recorded example packet exported by the NeuroTranslate 0.0 five-placement walking study](https://github.com/eliminatenoise/NeuroTranslation/blob/b69df06a43db1ec36d816ac638c78fd3ba55a05e/benchmarks/daily-sports-limbs/recorded-examples.json), including the saved Transformer, ridge and persistence forecasts. The viewer reads those saved numbers and rounds them for display. The fitted checkpoint used the walking clip during training. The target is a separate later observation in that clip. Its presence gives no evidence about performance on an unseen participant.

| File or object | SHA-256 |
| --- | --- |
| Original UCI archive | `f42ad7744ecf14151c9fa3a86dfb5b24de9d7cb7ffe956ef5de242983459c77e` |
| Original walking segment | `0b0047d88cde68ef82ae01c4f684be493cae4ca8ac95f551969a9c975f15858c` |
| Fitted Transformer checkpoint | `f82e67f22bbaf3a56d382bbd88639c6ddc97c742bde3306b5c780b03e898fc12` |
| Included `walking.json` | `48c0ed4e6f6db73a6646680d0682bb635dcff5195578666e3766b1400a6418e2` |

The browser verifies the included file's SHA-256 before showing its values. The guide's original code and schematics use the project's [CC0 dedication](../../../LICENSE). The measured excerpts retain their attribution and licence.
