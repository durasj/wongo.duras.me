# Infill research and measured slicer comparison

Research checked 2026-10-25. These are small hand-held game pieces, not load-bearing components. No source establishes a universal minimum infill for this exact Flashforge Matte geometry, and no physical impact, flex or print-quality test has been performed.

## Primary sources

- Prusa, Layers and perimeters: https://help.prusa3d.com/article/layers-and-perimeters_1748 — wall/perimeter count is the main contributor to model strength. Retain three walls rather than removing them solely to save material.
- Prusa, Infill: https://help.prusa3d.com/article/infill_42 — infill also contributes to compression resistance; low density is not identical to a solid part.
- Prusa, Infill patterns: https://help.prusa3d.com/article/infill-patterns_177130 — gyroid provides support in multiple directions; lightning branches mainly to support top surfaces and minimizes interior material.
- OrcaSlicer official documentation: https://github.com/OrcaSlicer/OrcaSlicer/wiki/strength_settings_infill — patterns trade strength, top support, material and time; there is no universally best pattern. Lightning's percentage describes support near roofs rather than the same bulk density as gyroid.

## Decision for Wongo

Use **5% gyroid, 3 walls, 0.8 mm top/bottom, 0.1 mm layers**, with a 0.4 mm nozzle. Five percent is our practical starting floor for this model, not a published guarantee. Print representative pieces first and inspect the top surfaces, squeeze resistance, seam joints and stacking. Use 10% gyroid if those are unsatisfactory or a firmer feel is preferred. Keep all other variables fixed for this comparison.

Three percent and zero infill sliced successfully but remain experimental: slicer acceptance cannot prove that a large internal roof will bridge cleanly or that a piece will survive handling. Lightning has very low material usage, but is primarily a top-support structure, so we did not make it the default for handled game pieces. Lowering infill from 20% to 5% does not cut total filament by 75%; the walls and solid skins remain.

## Full 40-piece set, Bambu Studio 02.08.02.61

P1S, Flashforge-labelled Generic PLA-derived profile, assumed density 1.24 g/cm³, 220 °C nozzle, 55 °C Textured PEI bed, maximum volumetric flow 8 mm³/s. All plates imported and sliced without user-facing warnings; geometry and piece quantities were unchanged between density trials. Values include the slicer's predicted preparation overhead. Actual settings, density and printer calibration can change the results.

| Geometry and infill | Filament | Time |
| --- | ---: | ---: |
| Previous sharp cubes, 20% gyroid | 677.0 g | 42.45 h |
| 0.5 mm chamfer, 20% gyroid | 686.1 g | 45.12 h |
| 0.5 mm chamfer, 10% gyroid | 565.3 g | 32.44 h |
| 0.5 mm chamfer, 5% gyroid | 493.9 g | 28.80 h |

Chamfers remove a little solid volume but can add skin/perimeter toolpaths around the shallow voxel seams; they do not automatically reduce filament or time. The recommended profile saves about **27% material and 32% time** relative to the previous sharp 20% profile. The 80-piece pool is two prints of each colour: **987.7 g, 57.59 h**, excluding failed prints or extra trials.

## Additional pattern trials: yellow plate only

These figures are for the nine-piece Mango Yellow plate, not the whole set. All use the chamfered geometry and the same walls/skins.

| Pattern | Filament | Time | Status |
| --- | ---: | ---: | --- |
| Gyroid 5% | 117.8 g | 6.88 h | Recommended starting point |
| Gyroid 3% | 108.5 g | 6.47 h | Experimental |
| No sparse infill | 98.2 g | 5.87 h | Experimental roof bridging |
| Cross Hatch 5% | 119.4 g | 7.06 h | No improvement over gyroid in this trial |
| Support Cubic 10% | 125.9 g | 7.17 h | Adaptive top support, no improvement here |
| Lightning 15% | 105.0 g | 6.58 h | Primarily top support; not selected for handling |

Raw results are in `docs/infill-comparison.json`; final per-plate defaults are in `docs/print-estimates.json`. No physical print tests, measured strength or guaranteed minimum infill are claimed.
