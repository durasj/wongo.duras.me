# Fongo

A family 3D puzzle workshop for **4–8 players**, inspired by Ubongo 3D Master. Inspect original generated challenges and their solutions, search a printed card's code, prepare a round that fits your piece inventory, and eventually print the physical game.

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

An existing Chromium executable can be supplied with `FONGO_CHROMIUM_PATH`. Browser checks cover puzzle-code lookup and reload, solution controls, downloads, eight-player assignments, Slovak UI, mobile layout, rulebook pagination, and the physical 15 mm card grid. Fonts are served locally; the app does not require third-party font requests.

## Regenerate assets

```sh
npm run generate:pieces
npm run generate:puzzles
npm run export:rulebooks
```

The piece exporter requires only Node.js; the rulebook exporter uses Python3's standard library. Preserve existing puzzle-code mappings once cards have been printed. See `docs/VALIDATION.md` and `docs/PIECES.md` for the checks and source provenance.

## Project layout

| Location | Purpose |
| --- | --- |
| `src/data/pieces.json` | Canonical 16 shapes, colours, lattice coordinates and quantities |
| `src/data/puzzles.json` | Original generated puzzle catalogue with stable lookup codes |
| `src/lib/solver.ts` | Proper cube rotations, exact-cover solving and solution validation |
| `src/lib/puzzles.ts` | Lookup and inventory-aware round assignment |
| `scripts/` | Reproducible puzzle and printable mesh generation |
| `public/downloads/` | Printable rulebooks and physical piece exports |
| `docs/` | Rules, provenance, print guidance and validation evidence |

## Play and printing

Choose a puzzle, examine its required pieces and footprint, and reveal the solution only when ready. Inspect the 3D solution from different angles and by layer. The round planner assigns 4–8 puzzles while accounting for the shared 80-piece inventory. This is a local puzzle viewer and round planner, not a synchronized online multiplayer room or a manual piece-placement simulator.

Use the browser's print action for puzzle cards and the download pages for the English and Slovak rulebooks. Print at **100% / actual size**, with browser headers and footers disabled. Check the calibration reference before printing a batch; board cells and printable models must use the same physical unit size.

The first catalogue uses 3-piece and 4-piece challenges. These labels are structural difficulty categories; human difficulty is not yet playtested. Computer validation proves grid coverage, proper orientations, piece usage and inventory availability. It does not certify printer tolerances, ergonomics or collision-free physical insertion. Test a small batch before producing the full set.

## Vercel

Connect this GitHub repository to your Vercel project:

- Framework preset: **Vite**.
- Root directory: repository root.
- Build command: `npm run build`.
- Output directory: `dist`.
- No environment variables or database are needed.
- Assign `fongo.duras.me` in the project's Domains settings when ready.

`vercel.json` records the build configuration. Query-string puzzle links work directly on a static deployment. Hosting is not automatically configured by this repository.

## Sources and license

Fongo is an independent family adaptation, not an official Ubongo product. Ubongo is the original game by Grzegorz Rejchtman, published by KOSMOS/Albi. The official Master rules provide the reference piece numbering and game mechanics. Piece coordinate data is adapted from [ps78/Ubongo](https://github.com/ps78/Ubongo), under GPL-3.0; attribution and detailed sources are documented in this repository. This project is distributed under **GPL-3.0-or-later**, with the full license in `LICENSE`.

Puzzle challenges are generated for Fongo rather than reproducing the commercial card collection.
