# Physical Wongo printing

The cube pitch is **20 mm**. Models use a **0.5 mm 45-degree chamfer on every voxel**. Shared joining faces are fused; shallow valleys make the voxel seams visible. Do not combine these pieces with the former 15 mm cards. The logical lattice, piece IDs, handedness and published puzzle meanings are unchanged.

## Physical A5 D6 cards

Download `/downloads/puzzles/wongo-d6-20mm.pdf` or its bilingual HTML companion. The file has **96 A4 landscape pages on 48 duplex sheets**, producing **96 double-sided A5 cards in 12 packs of eight**. Every card side has one footprint and six distinct die-selected piece lists. The pack contains 1,152 assignments drawn from **327 different independently verified puzzles**. The full original 1,000-puzzle single-card catalogue is retained separately at `/downloads/puzzles/wongo-20mm-duplex.pdf` and in the app.

Print **100% / actual size**, no fitting, no margins or browser headers/footers, and duplex **flip on the short edge**. Measure the 40 mm reference before a batch, check one sheet and cut in the centre. Back slots are reversed so the easy and hard sides share the correct card ID and slot.

Use a single common difficulty and one shared D6 roll. For 2–4 players, select cards only from one four-card block A or B in one pack and use 40 pieces. For 5–8 use one eight-card pack and the 80-piece pool. Never freely mix packs or blocks with 40 pieces, or mix difficulty sides. All six rolls are inventory-checked for every supported player count. The game runs entirely on physical cards; the website is optional for solutions and practice.

## Bambu P1S default

Open the four colour projects in `public/downloads/bambu/` as projects, not geometry only. Use a standard 0.4 mm nozzle, 0.10 mm layers including the first layer, 3 walls, **5% gyroid**, 8 top/bottom layers with 0.8 mm minimum thickness, no supports/brim/prime tower and by-layer printing. Verify your actual plate and filament. The starting Textured PEI/PLA profile uses 220 °C nozzle, 55 °C bed and an 8 mm³/s volumetric limit. It derives from Generic PLA and is not manufacturer-certified or physically calibrated for Flashforge.

| Plate | Pieces | Filament | Estimated time |
| --- | ---: | ---: | ---: |
| Mango Yellow | 9 | 117.8 g | 6 h 53 min |
| Blue (072C) | 11 | 128.9 g | 7 h 30 min |
| Red | 10 | 124.2 g | 7 h 18 min |
| Mint Green | 10 | 123.0 g | 7 h 08 min |
| Total | 40 | 493.9 g | about 28 h 48 min |

Print all four once for 40 pieces, twice for 80 (**987.7 g, about 57 h 36 min**). These are Bambu Studio 02.08.02.61 predictions for the actual chamfered geometry, not measured print results. Allow extra filament for trials and failures; one kilogram per colour is ample. All four plates sliced successfully without user-facing warnings. Print representative pieces first and check fit, roofs, seam joints and handling.

## Minimum infill

No universally proven minimum exists for this exact geometry/material. **5% gyroid is our practical starting floor**, retaining 3 walls and 0.8 mm skins. Try 10% for a firmer feel or if the test print needs it. Three percent, zero infill and Lightning are experimental alternatives; successful slicing does not establish roof quality or impact resistance. See `docs/INFILL-RESEARCH.md`, raw `docs/infill-comparison.json` and final `docs/print-estimates.json`.

## Regeneration

`npm run generate:print-kit` regenerates chamfered STL/SCAD, frozen D6 data, plates, ZIP and both PDF/HTML catalogues offline. `npm run generate:dice-cards` groups footprints using only proper XY rotations, independently solves all alternatives and verifies every die result against each four-player block and eight-player pack. Original puzzle codes and D6 mappings are permanent. Pinned Bambu profile sources and their AGPL license live in `scripts/bambu-profiles/`.

Run `npm test`, `npm run build`, `npm run test:browser`, `npm run test:print` and `npm run generate:puzzles`; repeated generation must leave committed assets unchanged. Physical print testing remains necessary.
