# Wongo 3D

A family 3D puzzle workshop for **2–8 players**, inspired by Ubongo 3D Master. Solve 1,000 verified challenges, search printed puzzle codes, inspect solutions, prepare inventory-safe rounds, and print the physical game.

Two editions share one production app at **https://wongo.duras.me**:

- **Classic:** https://wongo.duras.me/?edition=classic — neutral tabletop artwork and the purchased filament palette.
- **Tačustav 2026:** https://wongo.duras.me/?edition=tacustav-2026 — a family renovation crew, hard-hat dog, workshop intro, and poster-style interface.

The QR codes on both bilingual rulebook covers open the matching edition. The app remembers the choice in local storage without a timestamp or expiry; the sidebar edition selector changes it. Browser storage can still be cleared by the user or browser. Explicit edition links override a remembered choice. If storage is unavailable, the query parameter still works.

Printable HTML/PDF rulebooks are at `/downloads/rulebook-en.html` and `/downloads/rulebook-sk.html` for Classic, and `/downloads/tacustav/rulebook-en.html` and `/downloads/tacustav/rulebook-sk.html` for Tačustav. Each has an illustrated cover with a QR code plus three rules pages. See `docs/EDITION.md` for artwork and regeneration details.

## Run locally

Requires Node.js 22.12+ or 24+.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

For browser regression checks, install Chromium once, then run against the production build:

```sh
npx playwright install chromium
npm run build
npm run test:browser
```

An existing Chromium executable can be supplied with `WONGO_CHROMIUM_PATH`. Browser checks cover manual solving, undo/reset, no-WebGL fallback, invalid codes, Back/Forward navigation, printing from the browser menu, solution controls, downloads, eight-player assignments, Slovak UI, mobile layout, rulebook pagination, and the physical 20 mm card grid. Fonts are served locally; the app does not require third-party font requests.

To run the same checks against the deployed site:

```sh
WONGO_BASE_URL=https://wongo.duras.me npm run test:browser
```

In a test environment with a TLS-inspecting proxy, the optional `WONGO_IGNORE_HTTPS_ERRORS=1` affects only the test browser. Verify the public certificate separately with a client that trusts that environment's CA; this flag is never used by the deployed application.

## Regenerate assets

```sh
npm run generate:pieces
npm run generate:puzzles
npm run export:rulebooks
```

The piece exporter requires only Node.js; the rulebook exporter uses Python 3's standard library. Regeneration refuses to overwrite published codes with different problems. The active W3 catalogue enforces the distinct-colour rule; retired F3 challenges remain in a verification archive and are never assigned or exposed as playable puzzles. Regression tests also freeze the current code mappings and physical piece geometries. See `docs/VALIDATION.md` and `docs/PIECES.md` for the checks and source provenance.

## Project layout

| Location | Purpose |
| --- | --- |
| `src/data/pieces.json` | Canonical 16 shapes, colours, lattice coordinates and quantities |
| `src/data/puzzles.json` | Original generated puzzle catalogue with stable lookup codes |
| `src/lib/solver.ts` | Proper cube rotations, exact-cover solving and solution validation |
| `src/lib/puzzles.ts` | Lookup and inventory-aware round assignment |
| `src/lib/practice.ts` | Legal manual rotations, placement checks and independent completion detection |
| `scripts/` | Reproducible puzzle and printable mesh generation |
| `public/downloads/` | Printable rulebooks and physical piece exports |
| `docs/` | Rules, provenance, print guidance and validation evidence |

## Play and printing

Choose a puzzle and select **Try this puzzle** to solve it yourself. Select a piece, rotate around X/Y/Z, choose its bounding-box anchor in either layer grid, and place it. The 3D preview shows your assembly and proposed move; numbered grids remain usable without WebGL. Invalid moves are blocked, and undo, remove and reset are available. Any complete legal arrangement passes, even if it differs from the saved example. Practice is a grid editor rather than a gravity simulation; progress resets when the editor is closed or another puzzle is selected.

Reveal the saved solution only when ready. Inspect it from different angles and by layer, including numbered 2D diagrams. The round planner assigns 2–8 puzzles while accounting for the shared inventory (40 pieces for four players; 80 for five to eight). Keep the physical game's timer, gems and finishing order together at the table; there is no synchronized online multiplayer room.

Use the browser's print action for puzzle cards and the download pages for the English and Slovak rulebooks. Print at **100% / actual size**, with browser headers and footers disabled. Check the calibration reference before printing a batch; board cells and printable models must use the same physical unit size.

Every selectable easy puzzle uses exactly three pieces of three different colours. Every selectable hard puzzle uses exactly four pieces, one per colour. The same colour never appears twice in a puzzle. These labels are structural difficulty categories; human difficulty is not yet playtested. Computer validation proves grid coverage, proper orientations, piece usage and inventory availability; each saved witness also has a valid vertical assembly order. It does not certify printer tolerances or ergonomics. Test a small batch before producing the full set.

## Vercel

The production application is hosted at [wongo.duras.me](https://wongo.duras.me). Vercel uses this repository with:

- Framework preset: **Vite**.
- Root directory: repository root.
- Build command: `npm run build`.
- Output directory: `dist`.
- No environment variables or database are needed.
- Production domain: `wongo.duras.me`.

`vercel.json` records the build configuration. Query-string puzzle and tab links work directly on a static deployment.

## Sources and license

Wongo is an independent family adaptation, not an official Ubongo product. Ubongo is the original game by Grzegorz Rejchtman, published by KOSMOS/Albi. The official Master rules provide the reference piece numbering and game mechanics. Piece coordinate data is adapted from [ps78/Ubongo](https://github.com/ps78/Ubongo), under GPL-3.0; attribution and detailed sources are documented in this repository. This project is distributed under **GPL-3.0-or-later**, with the full license in `LICENSE`.

Puzzle challenges are generated for Wongo rather than reproducing the commercial card collection.

## Physical game: A5 D6 cards and chamfered pieces

`/downloads/puzzles/wongo-d6-20mm.pdf` and its bilingual `.html` companion contain **288 double-sided A5 cards in 36 numbered eight-card packs**: 288 printed pages on **144 A4 sheets**. Each side has one footprint and six distinct die-selected piece lists. There are 3,456 assignments drawn from **902 distinct verified puzzles**. The original 1,000-puzzle catalogue remains available in the app and `/downloads/puzzles/wongo-20mm-duplex.pdf`.

Print A4 landscape, actual size, duplex **flip on the short edge**; measure the 40 mm mark before cutting. Use one common difficulty and one shared die roll. For 2–4 players take cards only from one four-card block; for 5–8 use one eight-card pack and 80 pieces. Do not independently mix packs, blocks or difficulty sides. Every common roll and player count is inventory-checked. Printed footprints may be properly rotated relative to the original puzzle code; no code meaning changes.

`/downloads/bambu/wongo-20mm-P1S-print-kit.zip` contains four colour-separated P1S projects. Each voxel has a **0.5 mm 45-degree chamfer**, exposing shallow seam grooves while preserving the 20 mm pitch, occupied cells and chirality. The default is a 0.4 mm nozzle, 0.1 mm layers, 3 walls, 0.8 mm top/bottom and **5% gyroid**. The filament profile is Generic PLA-derived; use a calibrated Flashforge Matte profile if available and print a fit sample first.

Bambu Studio estimates for the chamfered 40-piece set are **493.9 g / 28.80 hours**; print every colour twice for 80 pieces (**987.7 g / 57.59 hours**). These are slicer estimates, not physical measurements. Blue and red pieces have white outlines in icons, 3D previews and printed diagrams.

Run `npm run generate:print-kit` to regenerate meshes, D6 data, plates, print-kit ZIP and both catalogues offline. `npm run generate:dice-cards` independently backtests all D6 assignments. Published D6 mappings are frozen. See `docs/PRINTING.md`, `docs/print-estimates.json` and `docs/infill-comparison.json`.

The expanded deck adds 547 verified `WD6` puzzles; the online library now contains 1,547 puzzles including the unchanged original 1,000 `W3` entries. Sets 01–12 and every existing code retain their meanings. New sets 13–36 add different six-choice card faces, with usage balancing to reduce repeated individual puzzles. The 3,456 printed assignments use 902 unique puzzles: individual puzzles still recur. Keep used packs aside for four nine-round games without reusing a card.

Already printed sets 01–12? Print only `/downloads/puzzles/wongo-d6-expansion-13-36.pdf`: 192 pages on 96 A4 duplex sheets. The full deck uses 144 sheets. Sort by the prominent SADA / SET number, then block and card slot.

## Fit and central-bed revision (2026-10-31)

Only the inner slot of yellow U/Gate #04 changes: remove 0.15 mm per wall to widen its 20.00 mm opening to 20.30 mm. It provides 0.30 mm total clearance around an existing 20.00 mm tab. Exterior dimensions remain unchanged, and the other fifteen published STL models are byte-for-byte identical, so already printed pieces remain compatible. Do not scale whole pieces. Print one Gate #04 trial to confirm real printer fit.

All four P1S plates use compact packing centered at (128,128), at least 6 mm gaps, and a maximum 200 mm group span. Only positions/orientations change on the blue, red and green plates. All published cards and puzzle codes remain valid. Previous filament/time estimates describe the original geometry/layout and are historical; re-slice these projects for current numbers.

## Nested central plates (2026-10-31)

The v3 print kit nests the complete XY voxel projections using all four proper XY rotations, retaining at least 6 mm clearance at every height and the existing print orientation. Yellow occupies 152 × 138 mm, blue 164 × 170 mm, red 158 × 138 mm and green 152 × 158 mm, centered on (128,128). Bounding boxes may overlap; the actual conservative piece projections do not. STL geometry, Gate #04 clearance, quantities and slicing settings remain unchanged. Open the updated projects as projects rather than auto-arranging their objects again. See `docs/nested-plates.png`.
