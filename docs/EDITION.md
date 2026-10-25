# Wongo editions

Both editions ship together on `main` at https://wongo.duras.me. The old edition branch is no longer required to access Tačustav. Configuration lives in `src/data/editions.json`; the web app, QR generator and rulebook generator consume it.

## Links and persistence

| Edition | Entry / cover QR | Rulebooks |
| --- | --- | --- |
| Classic | `https://wongo.duras.me/?edition=classic` | `/downloads/rulebook-{en,sk}.{html,pdf}` |
| Tačustav 2026 | `https://wongo.duras.me/?edition=tacustav-2026` | `/downloads/tacustav/rulebook-{en,sk}.{html,pdf}` |

`wongo-edition` in local storage stores just `classic` or `tacustav-2026`, with no timestamp or expiry. A valid explicit query value overrides storage; otherwise the remembered value is used, with Classic as the default. Unknown values are ignored. The sidebar selector and browser Back/Forward navigation update the selection. Storage-disabled browsers still work through explicit links. This is a cosmetic preference, not authentication; browser data clearing or eviction can remove it.

## Art direction

The user supplied Tačustav posters on 25 October 2026. Tačustav now uses **the actual photographs** from those posters: the man in the blue shirt, the man in the grey cap, the woman in the teal sweater, the woman in the pink shirt, and Axel in his hard hat. `src/data/tacustav-photos.json` records exact source regions; `RealCrew` and the rulebook generator clip the original JPEGs in layout. They do not redraw faces or invent new poses. The same five photographic regions appear in the website intro. At the user’s request, the printed cover now uses a reference-based photographic montage of this crew working on oversized game blocks, with Axel supervising. Rulebook thumbnails use the same cover scene.

**Axel, stavby majster**, is the rules narrator. His real photo and speech bubble introduce the web rules, the quick rules use his voice, and each printed rules page gives him an explanatory callout. Printed callouts retain the existing instruction verbatim and add a short joke. The classic edition retains its neutral artwork and factual rules presentation.

Humour adapts the supplied slogans: “Robíme bordel, aby ste mali poriadok”, “Bordel na počkanie”, “Najlacnejšia pracovná sila? Rodina”, “Neviditeľné riešenia / viditeľný neporiadok”, “Džury aj tam, kde ich nechcete”, “Za omietkami sa skrývajú hriechy”, “Sebechválenie na max” and “Práca nás baví. A vás bude výsledok”. The game-specific twist is “Robíme bordel. Aby to zapadlo!” and Axel’s “Džury nepreberám!”. Both languages get corresponding jokes; geometry, scoring, timer and victory conditions are unchanged.

Classic uses separate neutral artwork: matte voxel pieces and gems on an ivory tabletop. It keeps the standard interface without workshop imagery. Both editions have illustrated A4 rulebook covers in English and Slovak, with precise typeset titles and code-generated QR symbols.

Classic artwork uses the built-in image generator; its prompt is in `docs/artwork/classic-cover-prompt.txt`, and the asset is `public/art/wongo-classic.webp`. The earlier generated Tačustav illustration and prompt are retained as superseded artwork, not displayed in the current edition. Source posters are stored byte-for-byte in `public/art/tacustav/`; the full-image assets preserve original quality while layout shows selected photographic regions. The source JPEGs stay unchanged. The new decorative cover scene is generated from the Classic block artwork and all three source posters, preserving recognizable people, clothing and Axel while showing them working on the blocks. Its prompt is in `docs/artwork/tacustav-construction-prompt.txt`. Typography and QR codes are added precisely in code.

## Palette and functional printing

Flashforge PLA Matte, 1.75 mm: Mango Yellow (IDs 01–04), Blue (072C) (05–08), Red (09–12), Mint Green (13–16). Screen values originate in `src/data/pieces.json` and feed the pieces, sidebar swatches, logo, UI accents and score gems. Cream, ink and grey are neutral surfaces and text colours. Artwork shows approximate material colours.

Preserve the 16 shapes, physical dimensions, inventory counts, puzzle codes and verified solutions. Decorative artwork stays outside actual-size puzzle grids. Piece IDs and 30 mm calibration marks remain legible. Printed puzzle cards use a 20 mm grid at 100% scale.

## Regeneration

- `npm run export:rulebooks` generates all four HTML rulebooks from shared bilingual rules and `scripts/rulebook-style.css`.
- `WONGO_CHROMIUM_PATH=/path/to/chromium npm run export:rulebook-pdfs` builds and exports four PDFs. Omit the environment variable with a normal Playwright Chromium installation. If Ghostscript is installed, the script optimizes cover image encoding while keeping text and QR vectors. PDFs include a cover and three rules pages.
- `python3 scripts/export-qr-codes.py` regenerates the committed SVG codes. Requires `python3 -m pip install qrcode`. Ordinary rulebook regeneration uses the committed SVGs and needs only Python's standard library.
- Font files in `public/fonts/` include their OFL licences. No external font requests are needed.
- `WONGO_RULEBOOK_EDITION=tacustav-2026 npm run export:rulebook-pdfs` regenerates only the two Tačustav PDFs when Classic has not changed.

Tests protect edition precedence, production QR links, storage persistence, switching, storage-disabled operation, desktop/mobile layout, both rulebook covers and all normal gameplay flows. Release validation also decodes QR symbols from each final rendered PDF.

Physical rules now describe D6 A5 cards, a shared die and inventory-safe packs. Both editions/languages use the same mechanical rules. The default downloadable D6 set is 96 double-sided cards on 48 A4 sheets; the 1,000 individual puzzles remain available separately. Blue and red pieces use white geometric outlines; decorative cover artwork does not define print geometry.
## Source-photo integrity

The following SHA-256 values pin the original uploaded JPEG bytes (no cropping or recompression of the source files):

- `crew-poster.jpg`: `e58c5b05471f11b30d2c983f2e509c16ccd0f679ec089bad69a3fd0841ca62a0`
- `dog-poster.jpg`: `e887e33b10c91ea8bae09a3e5d9b320d38461643d3138e55487f65ae1ddf689f`
- `finisher-poster.jpg`: `832a98ffcc2be0e63ef4ac6ee59893af3c86baf1d15ac7810f83062a3946be11`
