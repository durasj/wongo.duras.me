# Manual 3D practice engine

The practice engine uses the same numbered piece catalogue and two-layer target as generation, printing and the solver. It does not need the stored solution to judge a placement or recognize success.

## API

- `rotateCubes(cubes, axis)` performs a positive right-handed quarter turn about `x`, `y` or `z`, then translates the bounding corner back to `(0,0,0)`. The three buttons reach every legal physical orientation. No mirroring, scaling or deformation is allowed.
- `canPlace(puzzle, placements, pieceId, orientation, anchor)` returns `{ valid, reason?, cubes }`. `anchor` is the minimum corner of the normalized shape, in integer grid coordinates. The returned `cubes` are absolute grid positions, also when an otherwise well-formed candidate is outside or overlapping so a UI can render a rejected preview. Invalid geometry returns an empty preview.
- `completion(puzzle, placements)` returns a boolean from independent exact coverage verification. Any correct arrangement wins; it need not match the saved solution.

Placement failure reasons are `outside` (outside the footprint or two layers, or fractional anchor), `overlap` (occupied cell), `duplicate` (more copies than the challenge permits), and `shape` (wrong ID, reflected, deformed or invalid geometry). Existing placements are also checked, so corrupted state cannot silently become a valid board.

All functions are pure. To move a piece, remove its previous placement before checking the new one; undo and removal can therefore be simple UI state operations. Partial layouts may include unsupported upper cells. This intentionally behaves as a discrete editor, not a gravity simulation, and permits people to fill the lower layer afterwards. Completion still requires a full legal two-layer assembly.

Tests reconstruct all 96 published puzzles through the manual placement API, cover both anchor layers, all reachable rotations, rejected bounds/overlaps/duplicates/mirrors/deformation, immutable inputs and independent completion checks.
