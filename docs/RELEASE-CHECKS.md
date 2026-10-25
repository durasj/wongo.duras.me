# Initial release checks

Checked locally on 25 October 2026 against the production Vite build.

## Geometry and puzzle data

- All 16 source shapes match an independently maintained coordinate catalogue under proper rotations. Chiral shapes remain distinct.
- All 16 actual STL meshes reconstruct the canonical shape; mesh edges, winding, volume and support-free print orientation pass checks.
- All 96 puzzles independently solve from an empty board and pass a separate exact coverage validator.
- Every stored solution has a verified vertical assembly order.
- Corrupted, unsolvable and search-budget fixtures behave as expected.
- Inventory allocation passes for 4–8 players and both difficulty categories over multiple seeds.
- 11 automated tests pass. Generated piece exports and puzzle data are reproducible.

## Browser and print

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
