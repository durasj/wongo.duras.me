# Wongo pieces: geometry, printing, and provenance

Wongo uses the 16 numbered shapes from the Master-style 3D piece catalogue. The canonical geometry lives in `src/data/pieces.json`; every virtual rendering, puzzle solution, and printable STL must derive from this file.

## Coordinates and handedness

Each coordinate is the origin of one occupied unit cube: `[x,y,z]`, with **z pointing up** in a right-handed system. Cubes occupy `[x,x+1] × [y,y+1] × [z,z+1]`. All coordinates are nonnegative integers. Geometry is independent of physical size.

The primary reference uses `array3d[x][y][z]`, not `[layer][row][column]`. Transposing these axes casually would mirror the chiral pieces. The exporter uses only the **24 proper cube rotations** (determinant +1), then translates to the origin. The STL's print orientation can therefore differ from the catalogue orientation without changing the piece.

Nine shapes are chiral: IDs **1, 2, 3, 5, 6, 10, 11, 13, 14**. Their mirror images must never be treated as legal rotations.

## Sources and independent verification

1. **Official numbered diagrams and quantities:** [Albi Ubongo 3D Master rulebook](https://albi.cz/data/files/products/50224/1662463648-ubongo_3d-master_manual_cz.pdf), physical PDF page 2 (printed page 1). Game concept by Grzegorz Rejchtman / KOSMOS.
2. **Primary cube definitions:** [ps78/Ubongo blockfactory/blockfactory.go](https://github.com/ps78/Ubongo/blob/master/blockfactory/blockfactory.go), Git blob `63c1a892046543f1973b375d3dfba89f90c8114e`. Axis semantics confirmed in `base/array3d/array3d.go`, blob `554c1d7d20f43aed3d136ce00d2c59be7a85ab1a`. This catalogue is adapted from that GPL-3.0 project; retain its attribution and the repository's GPL-3.0 license.
3. **Independent geometry cross-check:** [m-kasahr/ubongo-utils data/3d](https://github.com/m-kasahr/ubongo-utils/tree/master/data/3d), lettered files A–P, same order as IDs 1–16. Each reference shape was normalized and compared with the catalogue under all 24 proper rotations. **All 16 matched without reflection.** Source blob hashes and results are recorded in `docs/piece-verification.json`.

This establishes lattice geometry, not a measurement of commercial manufacturing dimensions. The **20 mm cube side is our chosen size**, not a claim about the retail product. The generated puzzle cards must use the same unit size.

No official puzzle cards or artwork are copied into the generated Wongo puzzle collection.

## Purchased filament palette

Use **Flashforge PLA Matte, 1.75 mm** for all four piece groups. Match the same colours in the virtual game, printed piece icons and solution diagrams. Each piece's `filament` and `hex` fields in the canonical catalogue flow into the download manifest.

| Piece IDs | Filament colour | Screen approximation | Copies: 4 players / 5–8 players |
| --- | --- | --- | --- |
| 01–04 | Mango Yellow | `#f4bf00` | 9 / 18 |
| 05–08 | Blue (072C) | `#171c8f` | 11 / 22 |
| 09–12 | Red | `#d9432f` | 10 / 20 |
| 13–16 | Mint Green | `#93cfc2` | 10 / 20 |

UI accent tokens are installed from this same catalogue in `src/main.tsx`; `src/palette.css` applies them to the sidebar, logo, swatches, avatars, controls and score gems. Neutral cream, ink and grey remain available for surfaces and readable text.

These screen colours are estimates from the purchased-product screenshots, not measured or manufacturer-certified colour values. STL files store geometry only: assign the specified filament in the slicer. The stable filenames retain `yellow`, `blue`, `red`, and `green`. Piece numbers identify shapes even when colours are hard to distinguish.

## Shared inventory for two to eight players

These counts describe a shared pool, not a personal full set. Generated rounds must be checked against the selected pool before play. For 4 players use `quantity4`; for **5–8 players use the 80-piece `quantity8` pool**.

| ID | Colour | Cubes | 2–4-player pool | 5–8-player pool |
|---|---|---:|---:|---:|
| 1 | yellow | 5 | 2 | 4 |
| 2 | yellow | 5 | 2 | 4 |
| 3 | yellow | 4 | 3 | 6 |
| 4 | yellow | 5 | 2 | 4 |
| 5 | blue | 5 | 2 | 4 |
| 6 | blue | 5 | 2 | 4 |
| 7 | blue | 5 | 3 | 6 |
| 8 | blue | 3 | 4 | 8 |
| 9 | red | 5 | 3 | 6 |
| 10 | red | 4 | 3 | 6 |
| 11 | red | 5 | 2 | 4 |
| 12 | red | 4 | 2 | 4 |
| 13 | green | 5 | 2 | 4 |
| 14 | green | 5 | 2 | 4 |
| 15 | green | 4 | 2 | 4 |
| 16 | green | 4 | 4 | 8 |
| **Total** | | | **40** | **80** |

The official manual's itemized labels sum to **40**: yellow 9, blue 11, red 10, green 10. Its prose also says “10 in each colour”; those statements conflict. Wongo follows the **numbered labels**, and doubles them for the custom eight-player pool. Eight-player play is our adaptation, not an official Master mode.

## Printable downloads

`public/downloads/pieces/` contains:

- 16 ASCII STL files, one per distinct shape.
- 16 parametric OpenSCAD files, one per shape.
- `manifest.json` with quantity, dimensions, unit size, print orientation, and mesh validation for every model.
- `all-pieces.zip` with every model and the manifest.
- `README.txt` with print guidance and provenance.

STLs use millimetres and are **outer union surfaces**. Internal faces between adjacent cubes are removed. They are not disconnected overlapping cube shells. Export checks every mesh edge is shared by exactly two oppositely wound triangles and verifies signed volume against the analytical chamfered-voxel volume and cube count. It also verifies no two of the 16 catalogue shapes are equal under rotation.

A support-free orientation is selected automatically: every occupied cube above z=0 has an occupied cube directly below. For these orientations the ideal geometry requires no supports or bridging. Normal bed adhesion and printer calibration still matter.

## Printing

**Recommended starting point:** regular PLA, 0.1 mm layers, 3 walls, 5% gyroid infill; use the filament manufacturer's temperature profile. These are starting settings, not a guarantee across printers. PETG is an alternative for greater impact/heat resistance, with more attention to strings and surface blobs. Material comparison references: [Prusa PLA](https://help.prusa3d.com/article/pla_2062), [Prusa PETG](https://help.prusa3d.com/article/petg_2059).

Print a few representative pieces first. Check first-layer flare, flatness, fit against the 20 mm card grid, and how stacked pieces feel before printing all 80. The default export has a 0.5 mm 45-degree chamfer on every unit voxel. Shared square joining faces are fused; chamfer valleys remain as visible seams. The 20 mm pitch, occupied lattice cells and chirality are unchanged, while the physical solid loses a small amount of edge material. There are no engraved IDs or scale clearance offsets. Physical fit and strength still need a test print.

Never scale individual piece files independently. If choosing another size, regenerate every piece and print cards with the same unit:

```sh
node scripts/export-pieces.mjs
node scripts/export-pieces.mjs --unit=18 --out=/tmp/wongo-18mm
```

The second command writes an alternate set without replacing the canonical 20 mm downloads. Keep generated metadata alongside any alternate set.

## Chamfer geometry and low-infill profile

`src/data/print.json` specifies the 20 mm pitch, 0.5 mm chamfer and 5% gyroid profile. `scripts/lib/chamfered-voxel.mjs` constructs the bevel planes directly. Each voxel is a cube shrunk by the chamfer distance and Minkowski-summed with an octahedron; the mesh exporter removes shared square joining faces. Joins retain a 19 × 19 mm contact square. At multi-voxel intersections the bevels leave intentional narrow channels, not floating shells.

For pitch L and chamfer c, each physical voxel volume is L³ − 6Lc² + 16c³/3. Mesh checks require this volume times the occupied cube count, two-manifold edge incidence and outward winding. The independent STL ray test still recovers exactly the canonical occupied cells and handedness. `--chamfer=0` exports sharp comparison models without changing the catalogue.

The 5% gyroid recommendation keeps 3 walls and 0.8 mm top/bottom. It is an engineering starting point, not a universally proven minimum. Research and slicer comparisons are in `docs/PRINTING.md` and `docs/infill-comparison.json`.

## Fit and central-bed revision (2026-10-31)

Only the inner slot of yellow U/Gate #04 changes: remove 0.15 mm per wall to widen its 20.00 mm opening to 20.30 mm. It provides 0.30 mm total clearance around an existing 20.00 mm tab. Exterior dimensions remain unchanged, and the other fifteen published STL models are byte-for-byte identical, so already printed pieces remain compatible. Do not scale whole pieces. Print one Gate #04 trial to confirm real printer fit.

All four P1S plates use compact packing centered at (128,128), at least 6 mm gaps, and a maximum 200 mm group span. Only positions/orientations change on the blue, red and green plates. All published cards and puzzle codes remain valid. Previous filament/time estimates describe the original geometry/layout and are historical; re-slice these projects for current numbers.
