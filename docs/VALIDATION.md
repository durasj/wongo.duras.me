# Puzzle generation and verification

Fongo's challenge library is generated from the numbered Master piece geometry. It contains original puzzles, not transcriptions of the commercial cards.

## Reproduce the library

Run `npm run generate:puzzles`, then `npm test`. The fixed seed, generator version and outcome counts are recorded in `src/data/validation.json`. Repeating the generator produces identical puzzle codes, footprints, piece lists and witnesses. Once codes have been printed, preserve this published JSON: later generator changes must create a new code namespace, not overwrite existing codes.

The initial release contains 48 three-piece challenges (`F3-E-001` to `F3-E-048`) and 48 four-piece challenges (`F3-H-001` to `F3-H-048`). Easy/hard currently describes the number of pieces. Human difficulty calibration has not yet taken place; solver node counts are diagnostic, not a promise about solving time.

## Acceptance gates

1. Select an original connected integer-grid footprint and a distinct set of three/four pieces whose total volume is exactly twice its area.
2. An exact-cover solver enumerates legal physical rotations of those pieces. It searches from an empty target of exactly two layers. The rotation group has determinant +1; mirrored pieces are never allowed.
3. Reject candidates with no solution. Reject search-budget failures too: a timeout is **unknown**, not proof of impossibility.
4. A separate witness checker confirms piece identities and multiplicities, integer coordinates, congruence to a legal rotation, no overlaps, no protrusions and complete coverage.
5. Deduplicate the footprint under the eight square-grid symmetries together with the sorted piece IDs. This deliberately conservative policy can discard reflected-but-different challenges; it does not admit duplicates.
6. Backtest every accepted challenge again from an empty board, and check the new witness.
7. Build a dependency graph between different pieces that occupy the lower and upper cells of each column. Reject cyclic graphs, and store the witness in topological order. This is a conservative proof that pieces can be lowered vertically into the final arrangement without passing through previously placed pieces.

The generated puzzle has **at least one** solution. We do not claim uniqueness or enumerate all solutions. The stored witness is one valid example; any other legal exact fill is also correct.

## Simultaneous play

`selectRound(playerCount, difficulty, seed, inventory?)` assigns distinct puzzle codes for 4–8 players. It counts every requested piece across the entire round against the physical inventory and backtracks when necessary. Four players use the 40-piece pool; five to eight players use the proposed doubled 80-piece pool. A custom inventory is supported for testing. Unsupported player counts, invalid inventories and impossible allocations raise an error instead of silently overbooking pieces.

The initial version checks final assembled geometry and a collision-free vertical assembly order. It does not simulate hands, friction, print tolerances, or structural loading. These loose, separable pieces should still receive a small physical fit check before printing the full set.

## Regression tests

Tests cover all published puzzles, exact coverage, corrupted witnesses, an equal-volume unsolvable target, search-budget handling, all 24 rotations without reflections, deterministic code lookup/round allocation, and inventory limits for every supported player count and difficulty over multiple seeds.
