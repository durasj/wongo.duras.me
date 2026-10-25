# Wongo physical printing

The canonical cube pitch is **20 mm**. Models, web print grids and downloadable cards share `src/data/print.json`. Do not combine them with the former 15 mm boards.

## Bambu P1S

Four editable, single-colour projects are in `public/downloads/bambu/`; open as projects rather than geometry only. Standard 0.4 mm nozzle, 0.10 mm layers including the first layer, 3 walls, 20% gyroid, 8 top and bottom layers with 0.8 mm minimum thickness, no supports/brim/prime tower. The Textured PEI/PLA starting profile uses a 220 °C nozzle, 55 °C bed and 8 mm³/s volumetric limit. It derives from Generic PLA and is not physically calibrated or manufacturer-certified for Flashforge. Confirm the actual nozzle, plate and filament before slicing.

| Plate | Copies | Filament | Estimated time |
| --- | ---: | ---: | ---: |
| Mango Yellow | 9 | 161.4 g | 10 h 10 min |
| Blue (072C) | 11 | 176.8 g | 11 h 02 min |
| Red | 10 | 170.3 g | 10 h 44 min |
| Mint Green | 10 | 168.5 g | 10 h 31 min |
| Total | 40 | 677 g | 42 h 27 min |

Print all four once for 2–4 players or twice for 5–8 players (1,354 g, about 85 hours). These are Bambu Studio 02.08.02.61 estimates from the previously verified layouts/settings, not measured print results. Allow 10–15% extra for tests and failures. One kilogram of each colour is ample. The committed projects are deterministic counterparts using the same shapes, orientation, layout and full settings. Print a small sample before a full set.

## Puzzle cards

`public/downloads/puzzles/wongo-20mm-duplex.pdf` contains 500 vector pages: **250 A4 sheets, 500 double-sided A5 cards, 1,000 puzzles**. The bilingual companion HTML uses the same physical dimensions.

Use A4 **landscape**, **100% / actual size**, no page fitting, no headers/footers or page margins, and duplex **flip on the short edge**. Measure the 40 mm reference. Each sheet has two easy puzzles on its front and matching-number hard puzzles on the back. The reverse slots are deliberately swapped, so E-001 backs onto H-001 after cutting. No solutions appear on the reverses. Check one sheet's scale, orientation and registration before printing all 250.

All boards fit within 5 × 5 cells (100 × 100 mm). A4 splits at 148.5 mm into two portrait A5 cards, each with 10 mm internal left/right margins. Individual puzzle/round printing in the app also places two cards per A4 side; it does not invent matching reverses for selected rounds.

## Regeneration

`npm run generate:print-kit` regenerates meshes, the four 3MF projects, print-kit ZIP, duplex HTML/PDF and layout manifests offline. Official Bambu profile inputs are pinned to v02.08.02.61 in `scripts/bambu-profiles/`, including their AGPL license.

Run `npm test`, `npm run build`, `npm run test:browser`, `npm run test:print`, and `npm run generate:puzzles`. The last independently solves and validates the frozen catalogue. Repeated print generation must leave generated files unchanged. No physical print test is implied by automated verification.
