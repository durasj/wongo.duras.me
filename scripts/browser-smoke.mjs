import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// Run against a production build, so asset paths and static downloads are tested too.
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '5182', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.on('data', data => { if (data.toString().includes('Local:')) resolve(); });
    server.once('exit', code => reject(new Error(`Preview server exited: ${code}`)));
    server.stderr.on('data', data => process.stderr.write(data));
    setTimeout(() => reject(new Error('Preview server did not start')), 15_000).unref();
  });
  await mkdir('test-results', { recursive: true });
  browser = await chromium.launch({
    headless: true,
    ...(process.env.FONGO_CHROMIUM_PATH ? { executablePath: process.env.FONGO_CHROMIUM_PATH,
      args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=angle', '--use-angle=swiftshader'] } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('requestfailed', request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  const origin = 'http://127.0.0.1:5182';
  await page.goto(origin);
  await page.getByRole('heading', { name: 'Good things fit together.' }).waitFor();
  await page.locator('canvas').waitFor();
  await page.getByRole('button', { name: 'Reveal solution', exact: true }).click();
  await page.getByRole('button', { name: 'Top layer', exact: true }).click();
  await page.getByRole('button', { name: 'Bottom layer', exact: true }).click();
  await page.getByRole('button', { name: 'Both layers', exact: true }).click();
  await page.getByRole('slider', { name: 'Pieces shown' }).fill('2');
  await page.getByRole('checkbox', { name: 'Separate pieces' }).check();
  await page.screenshot({ path: 'test-results/solution-desktop.png' });
  await page.getByRole('button', { name: 'Hide solution', exact: true }).click();
  await page.getByRole('textbox', { name: /Find a puzzle/ }).fill('f3-h-048');
  assert.equal(await page.locator('.puzzle-card').count(), 1);
  await page.locator('.puzzle-card').click();
  assert.equal(new URL(page.url()).searchParams.get('p'), 'F3-H-048');
  assert.match(await page.locator('.viewer-heading').innerText(), /F3-H-048/);
  await page.reload();
  await page.getByRole('button', { name: 'Reveal solution', exact: true }).waitFor();
  assert.match(await page.locator('.viewer-heading').innerText(), /F3-H-048/);
  await page.getByRole('textbox', { name: /Find a puzzle/ }).fill('not-a-code');
  await page.getByText('No puzzles found. Try a different code.').waitFor();

  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Print puzzle', exact: true }).click();
  await page.emulateMedia({ media: 'print' });
  await page.locator('.print-card').waitFor({ state: 'visible' });
  const calibration = await page.locator('.calibration span').evaluate(el => el.getBoundingClientRect().width);
  assert.ok(Math.abs(calibration - 30 * 96 / 25.4) < 0.1, '30mm calibration reference has incorrect size');
  const cell = await page.locator('.print-board .footprint rect').first().evaluate(el => el.getBoundingClientRect().width);
  assert.ok(Math.abs(cell - 15 * 96 / 25.4) < 0.1, 'Printed puzzle cell is not 15 mm');
  assert.equal(await page.locator('.print-solution').count(), 0);
  await page.pdf({ path: 'test-results/puzzle-card.pdf', preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: 'The pieces', exact: true }).click();
  assert.equal(await page.locator('.piece-tile').count(), 16);
  const stlLink = page.getByRole('link', { name: 'Download STL', exact: true });
  const stl = await page.request.get(origin + await stlLink.getAttribute('href'));
  assert.equal(stl.status(), 200);
  assert.match(await stl.text(), /^solid fongo-piece-/);
  const zip = await page.request.get(origin + '/downloads/pieces/all-pieces.zip');
  assert.equal(zip.status(), 200);
  assert.equal((await zip.body()).readUInt32LE(0), 0x04034b50);

  await page.getByRole('button', { name: 'Family table', exact: true }).click();
  await page.getByRole('combobox').first().selectOption('8');
  await page.getByRole('combobox').nth(1).selectOption('hard');
  assert.equal(await page.locator('.assignment').count(), 8);
  const codes = await page.locator('.assignment .code-label').allTextContents();
  assert.equal(new Set(codes).size, 8);
  await page.getByRole('button', { name: 'Deal a new round', exact: true }).click();
  assert.notDeepEqual(await page.locator('.assignment .code-label').allTextContents(), codes);
  await page.getByRole('button', { name: 'Print this round', exact: true }).click();
  assert.equal(await page.locator('.print-card').count(), 8);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: 'test-results/eight-player-round.pdf', preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: 'SK', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'sk');
  await page.getByRole('heading', { name: 'Miesto pre každého.' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile layout overflows horizontally');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('button', { name: 'Knižnica hlavolamov', exact: true }).click();
  await page.screenshot({ path: 'test-results/puzzle-mobile.png', fullPage: true });

  for (const lang of ['en', 'sk']) {
    await page.setViewportSize({ width: 1200, height: 1000 });
    await page.goto(`${origin}/downloads/rulebook-${lang}.html`);
    await page.emulateMedia({ media: 'print' });
    const overflow = await page.locator('.sheet').evaluateAll(sheets => sheets.map(sheet => {
      const folio = sheet.querySelector('.folio').getBoundingClientRect();
      const content = [...sheet.children].filter(el => !el.classList.contains('folio'));
      return Math.max(...content.map(el => el.getBoundingClientRect().bottom)) - folio.top;
    }));
    assert.ok(overflow.every(value => value < -8), `Rulebook ${lang} overlaps page footer: ${overflow}`);
    await page.pdf({ path: `test-results/rulebook-${lang}.pdf`, preferCSSPageSize: true, printBackground: true });
    await page.screenshot({ path: `test-results/rulebook-${lang}.png`, fullPage: true });
    await page.emulateMedia({ media: 'screen' });
  }
  assert.deepEqual(failures, [], 'Browser reported runtime errors or failed requests');
  console.log('Browser checks passed: lookup, solution controls, downloads, eight-player rounds, mobile, and physical print scale.');
} finally {
  await browser?.close();
  server.kill();
}
