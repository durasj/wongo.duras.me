# Wongo development

Wongo is a family 3D puzzle workshop for 2–8 simultaneous players, inspired by Ubongo 3D Master. It is a static Vite/React/TypeScript application hosted at https://wongo.duras.me on Vercel; it has no accounts, backend, paid services, or networked multiplayer. Manual single-player practice uses legal rotations and two grid layers with a 3D preview.

## Invariants

- `src/data/pieces.json` is the single source of truth for geometry. Coordinates are integer `[x,y,z]`, with z up. Preserve all 16 numbered shapes, including chirality. Only proper rotations are legal; reflections are not.
- The solver, web renderer and STL exports must agree on geometry. Never change one representation without regenerating and validating dependent assets.
- Published puzzles fill every cell of their footprint at z=0 and z=1 exactly once using precisely the listed pieces. Generation alone is not a proof: solve independently from an empty board and independently validate saved placements.
- Puzzle codes are stable identifiers. Never silently assign an existing published code to a different puzzle. Version new catalogues if geometry or codes change.
- Preserve both published-code and physical-shape regression fingerprints. Unknown codes must show an explicit error, never silently substitute a different puzzle.
- Practice must validate actual user placements independently and accept any legal complete fill. Do not reveal or insert witness placements as part of manual solving. Keep controls usable without WebGL.
- Every selectable easy puzzle must use exactly three pieces of three different colour groups. Every selectable hard puzzle must use exactly four pieces, one of each colour. Never repeat a colour within a puzzle. The retired F3 catalogue is archival only; expose only the current W3 catalogue for play and lookup.
- A round is valid only if all player assignments fit the actual inventory. Do not assume each player owns a complete set.
- Difficulty labels initially describe piece count, not a scientifically calibrated human rating. Keep that limitation visible in documentation.
- Do not claim manual drag-and-drop play, networking, physical assembly validation, print testing, or deployment unless implemented and verified.

## Editions and visual identity

- Both Classic and Tačustav ship from main. Use `src/data/editions.json` for names, artwork, rulebook paths and production QR URLs. Do not hardcode the whole app to one edition.
- Preserve explicit `?edition=classic` / `?edition=tacustav-2026` precedence over the `wongo-edition` local-storage preference. Store no expiry. Keep a visible edition switch and storage-disabled support.
- Source accent colours from the canonical piece catalogue. Sidebar swatches, logo, avatars and score gems must match the purchased filament palette. Neutral surfaces and readable text may use cream, ink and grey.
- Tačustav uses the actual user-supplied poster photographs via `src/data/tacustav-photos.json` layout crops. Keep these source crops unchanged. The cover uses an explicitly requested identity-preserving image montage of these people working on giant game blocks (`/art/tacustav-construction.webp`); keep the supplied people recognizable and the game blocks prominent. The dog is **Axel, stavby majster**, and explains the Tačustav rules with accurate, light-hearted callouts.
- Keep generated cover art decorative and outside exact puzzle geometry. QR codes must be generated deterministically, never by an image model. Both languages and editions need their own correctly linked covers.

## Working conventions

- Keep English and Slovak rules consistent with implementation.
- Physical printing uses a 20 mm lattice and 0.5 mm 45-degree chamfers on each voxel, including shallow seam grooves. The solver retains exact integer lattice geometry; physical chamfer volume is intentionally smaller. Exporter, SCAD, plate meshes and volume checks must agree.
- Printable boards use a 20 mm grid at 100% scale. Default physical D6 cards are two-sided A5 cards, printed two per A4 landscape side with short-edge duplex. Include calibration references.
- D6 pack IDs and die-row mappings are permanent. Preserve sets 01–12 byte-for-byte; the expanded deck has 36 packs. Supplemental WD6 codes in `src/data/dice-puzzles.json` are immutable and available for lookup alongside the original W3 catalogue. Group only under proper XY rotations, not reflections. Each four-card block must fit quantity4 for all six common rolls at each common difficulty; the combined eight-card pack must fit quantity8. Preserve the original 1,000 puzzle codes and solutions.
- Default P1S profile: 0.1 mm layers, 3 walls, 0.8 mm top/bottom, 5% gyroid. This is a physically untested starting profile; do not claim a universal minimum infill or measured print durability.
- Keep printable assets and regeneration scripts in this repository. Exclude dependencies and build output.
- Preserve source attribution and GPL compatibility. The piece catalogue is adapted from ps78/Ubongo; see provenance documentation and LICENSE.
- Run `npm test` and `npm run build` before submitting code. Run `npm run test:browser` for UI changes; `WONGO_BASE_URL` runs the same flow against a deployment. Regenerate puzzles and meshes when their inputs change, and inspect browser and printable output for relevant UI changes.
- Configure Vercel with the Vite preset and `dist` output; no environment variables are required for the static application.
