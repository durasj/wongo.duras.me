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

## Working conventions

- Keep English and Slovak rules consistent with implementation.
- Printable boards use a 15 mm grid at 100% scale by default. Include a calibration reference and make scaling explicit.
- Keep printable assets and regeneration scripts in this repository. Exclude dependencies and build output.
- Preserve source attribution and GPL compatibility. The piece catalogue is adapted from ps78/Ubongo; see provenance documentation and LICENSE.
- Run `npm test` and `npm run build` before submitting code. Run `npm run test:browser` for UI changes; `WONGO_BASE_URL` runs the same flow against a deployment. Regenerate puzzles and meshes when their inputs change, and inspect browser and printable output for relevant UI changes.
- Configure Vercel with the Vite preset and `dist` output; no environment variables are required for the static application.
