# Release checks

## Version 0.3: distinct colours

Every active easy puzzle has exactly three pieces in three different colour groups. Every active hard puzzle has exactly four pieces, one per colour group. No selectable puzzle repeats a colour. The new W3 catalogue contains 48 puzzles of each difficulty, independently solved and checked for exact coverage and vertical assembly order. All 22 tests pass.

The previous F3 collection is preserved byte-for-byte in a verification archive and retired from lookup and round assignment. Its codes are not reused for different puzzles. Runtime guards and generation tests enforce the new rule, including inventory-checked rounds for four through eight players. Piece shapes and print scale are unchanged.

## Version 0.2: production follow-up

On 25 October 2026 the original live deployment passed the browser suite for lookup, solution controls, downloads, eight-player rounds, mobile layout and print scale. The follow-up release adds manual practice and fixes discovered during the production review.

The version 0.2 production build passes 20 automated tests and the expanded browser suite:

- Complete a three-piece and four-piece challenge through the real placement and rotation controls; reject an out-of-bounds move, then undo and reset.
- Repeat complete manual solving with WebGL disabled on a 390px mobile viewport.
- Accept any legal full arrangement, rather than requiring the saved witness.
- Show an explicit unknown-code state with no unrelated board, including after Back/Forward navigation.
- Restore tabs and selected codes through browser history; hide a revealed solution when reselecting a challenge.
- Print through the browser menu before using the in-app print action; preserve the 15 mm grid and 30 mm calibration reference.
- Keep both numbered solution layers usable when a 3D context is unavailable.
- Preserve the meaning of all 96 published codes and every numbered physical shape, and reject incompatible catalogue regeneration before writing files.
- Keep both bilingual rulebooks at three A4 pages, and eight-player round output at eight A4 pages.

The browser suite supports a live deployment with `WONGO_BASE_URL=https://wongo.duras.me npm run test:browser`. GitHub CI now runs browser checks and regeneration checks in addition to unit tests and the production build.

The Vercel runtime-log API returned HTTP 403 during the review; no claim about server-log absence is made. This application is static. Browser exceptions, failed asset requests, deployment state and public asset responses are checked separately. Physical print fit and human difficulty still need playtesting.

## Initial release

Checked locally on 25 October 2026 against the production Vite build.

### Geometry and puzzle data

- All 16 source shapes match an independently maintained coordinate catalogue under proper rotations. Chiral shapes remain distinct.
- All 16 actual STL meshes reconstruct the canonical shape; mesh edges, winding, volume and support-free print orientation pass checks.
- All 96 puzzles independently solve from an empty board and pass a separate exact coverage validator.
- Every stored solution has a verified vertical assembly order.
- Corrupted, unsolvable and search-budget fixtures behave as expected.
- Inventory allocation passes for 4–8 players and both difficulty categories over multiple seeds.
- 11 automated tests pass. Generated piece exports and puzzle data are reproducible.

### Browser and print

- Code search, case-insensitive lookup, persistent query links and page reload work.
- Solution reveal/hide, layer views, piece stepping and exploded view work; actual WebGL canvas renders.
- All 16 shapes appear in the catalogue. STL and ZIP downloads return valid content.
- Eight-player rounds contain distinct codes and can be redealt and printed.
- English/Slovak switching and 390px mobile navigation/layout work without horizontal overflow.
- Both printable rulebooks fit three A4 pages without footer overlap.
- Selected cards and eight-player rounds print without solutions, one card per page.
- SVG cell measurement is 15 mm; calibration mark is 30 mm at 100% print scale.
- Browser run reported no uncaught application errors or failed requests.

The browser smoke script writes screenshots and internal PDF proofs to ignored `test-results/`. Print proofs were rendered to images for visual inspection. No physical pieces have been printed or playtested. Human difficulty remains uncalibrated. Hosting is prepared for Vercel but is not provisioned by these checks.
