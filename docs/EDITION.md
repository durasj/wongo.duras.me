# Wongo editions

Both editions ship together on `main` at https://wongo.duras.me. The old edition branch is no longer required to access Tačustav. Configuration lives in `src/data/editions.json`; the web app, QR generator and rulebook generator consume it.

## Links and persistence

| Edition | Entry / cover QR | Rulebooks |
| --- | --- | --- |
| Classic | `https://wongo.duras.me/?edition=classic` | `/downloads/rulebook-{en,sk}.{html,pdf}` |
| Tačustav 2026 | `https://wongo.duras.me/?edition=tacustav-2026` | `/downloads/tacustav/rulebook-{en,sk}.{html,pdf}` |

`wongo-edition` in local storage stores just `classic` or `tacustav-2026`, with no timestamp or expiry. A valid explicit query value overrides storage; otherwise the remembered value is used, with Classic as the default. Unknown values are ignored. The sidebar selector and browser Back/Forward navigation update the selection. Storage-disabled browsers still work through explicit links. This is a cosmetic preference, not authentication; browser data clearing or eviction can remove it.

## Art direction

The user supplied Tačustav reference posters on 25 October 2026: distressed plaster, black brush-stroke panels, bold condensed lettering, construction tools, a hard-hat Labrador, a surprised wall tile and family renovation jokes. New cover artwork adapts that family crew to a tabletop puzzle building site. A bilingual poster-style introduction leads into the game. Deep ink navigation, paper surfaces, local Oswald type, a construction-site tape strip and workshop-style cards carry the theme through the app. Artwork is decorative; it does not show a verified puzzle solution.

Classic uses separate neutral artwork: matte voxel pieces and gems on an ivory tabletop. It keeps the standard interface without workshop imagery. Both editions have illustrated A4 rulebook covers in English and Slovak, with precise typeset titles and code-generated QR symbols.

Generated artwork uses the built-in image generator. The final prompts are in `docs/artwork/`. Project assets are `public/art/tacustav-workshop.webp` and `public/art/wongo-classic.webp`. The supplied source posters are inspiration; unrelated advertisement text, phone numbers and cultural caricatures are not incorporated. Generated art was encoded as WebP for web delivery; typography and QR codes are added in code.

## Palette and functional printing

Flashforge PLA Matte, 1.75 mm: Mango Yellow (IDs 01–04), Blue (072C) (05–08), Red (09–12), Mint Green (13–16). Screen values originate in `src/data/pieces.json` and feed the pieces, sidebar swatches, logo, UI accents and score gems. Cream, ink and grey are neutral surfaces and text colours. Artwork shows approximate material colours.

Preserve the 16 shapes, physical dimensions, inventory counts, puzzle codes and verified solutions. Decorative artwork stays outside actual-size puzzle grids. Piece IDs and 30 mm calibration marks remain legible. Printed puzzle cards use a 20 mm grid at 100% scale.

## Regeneration

- `npm run export:rulebooks` generates all four HTML rulebooks from shared bilingual rules and `scripts/rulebook-style.css`.
- `WONGO_CHROMIUM_PATH=/path/to/chromium npm run export:rulebook-pdfs` builds and exports four PDFs. Omit the environment variable with a normal Playwright Chromium installation. If Ghostscript is installed, the script optimizes cover image encoding while keeping text and QR vectors. PDFs include a cover and three rules pages.
- `python3 scripts/export-qr-codes.py` regenerates the committed SVG codes. Requires `python3 -m pip install qrcode`. Ordinary rulebook regeneration uses the committed SVGs and needs only Python's standard library.
- Font files in `public/fonts/` include their OFL licences. No external font requests are needed.

Tests protect edition precedence, production QR links, storage persistence, switching, storage-disabled operation, desktop/mobile layout, both rulebook covers and all normal gameplay flows. Release validation also decodes QR symbols from each final rendered PDF.

Physical rules now describe D6 A5 cards, a shared die and inventory-safe packs. Both editions/languages use the same mechanical rules. The default downloadable D6 set is 96 double-sided cards on 48 A4 sheets; the 1,000 individual puzzles remain available separately. Blue and red pieces use white geometric outlines; decorative cover artwork does not define print geometry.
