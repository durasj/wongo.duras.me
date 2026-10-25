# Wongo

A family 3D puzzle workshop for **4–8 players**, inspired by Ubongo 3D Master. Solve original generated challenges virtually, inspect their solutions, search a printed card's code, prepare a round that fits your piece inventory, and print the physical game.

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

An existing Chromium executable can be supplied with `WONGO_CHROMIUM_PATH`. Browser checks cover manual solving, undo/reset, no-WebGL fallback, invalid codes, Back/Forward navigation, printing from the browser menu, solution controls, downloads, eight-player assignments, Slovak UI, mobile layout, rulebook pagination, and the physical 15 mm card grid. Fonts are served locally; the app does not require third-party font requests.

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

Reveal the saved solution only when ready. Inspect it from different angles and by layer, including numbered 2D diagrams. The round planner assigns 4–8 puzzles while accounting for the shared inventory (40 pieces for four players; 80 for five to eight). Keep the physical game's timer, gems and finishing order together at the table; there is no synchronized online multiplayer room.

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
