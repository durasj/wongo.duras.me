import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const catalogue = JSON.parse(await readFile(new URL('../src/data/puzzles.json', import.meta.url),'utf8'));
const editions = JSON.parse(await readFile(new URL('../src/data/editions.json', import.meta.url),'utf8'));
const pieces = JSON.parse(await readFile(new URL('../src/data/pieces.json', import.meta.url),'utf8'));
const normalized = cubes => {
  const mins = [0,1,2].map(axis=>Math.min(...cubes.map(v=>v[axis])));
  return cubes.map(v=>v.map((n,axis)=>n-mins[axis])).sort((a,b)=>a[2]-b[2]||a[1]-b[1]||a[0]-b[0]);
};
const geometryKey = cubes => JSON.stringify(normalized(cubes));
function rotationPath(from, to) {
  const pending = [{cubes:normalized(from),path:[]}], seen = new Set();
  for (let i=0;i<pending.length;i++) {
    const item=pending[i], signature=geometryKey(item.cubes);
    if(signature===geometryKey(to))return item.path;
    if(seen.has(signature))continue;
    seen.add(signature);
    for (const axis of ['x','y','z']) pending.push({cubes:normalized(item.cubes.map(([x,y,z])=>axis==='x'?[x,-z,y]:axis==='y'?[z,y,-x]:[-y,x,z])),path:[...item.path,axis]});
  }
  throw new Error('Saved witness is not reachable with physical piece rotations');
}

async function solveInBrowser(page, puzzle) {
  await page.getByRole('button', { name: 'Try this puzzle', exact: true }).click();
  await page.locator('.practice-board').waitFor();
  // An oversized proposal must never be placeable.
  const outsideCell = page.locator('.practice-cell[data-z="1"]').last();
  await outsideCell.click();
  assert.ok(await page.locator('.practice-place').isDisabled());
  for (const placement of puzzle.solution) {
    await page.locator(`[data-practice-piece-id="${placement.pieceId}"]`).click();
    const piece=pieces.find(p=>p.id===placement.pieceId);
    for (const axis of rotationPath(piece.cubes,placement.cubes)) await page.locator(`[data-practice-rotate="${axis}"]`).click();
    const anchor=[0,1,2].map(axis=>Math.min(...placement.cubes.map(v=>v[axis])));
    await page.locator(`.practice-cell[data-x="${anchor[0]}"][data-y="${anchor[1]}"][data-z="${anchor[2]}"]`).click();
    assert.ok(await page.locator('.practice-place').isEnabled(),`Legal witness blocked for ${puzzle.code} piece ${placement.pieceId}`);
    await page.locator('.practice-place').click();
  }
  await page.locator('.practice-complete').filter({hasText:'Solved! Every cell in both layers is filled exactly once.'}).waitFor();
  assert.equal(await page.locator('.practice-filled').count(),puzzle.footprint.length*2);
  assert.equal(await page.locator('.solution-layers').count(),0,'Practice leaked stored solution diagrams');
  await page.locator('.practice-board').screenshot({path:`test-results/practice-${puzzle.code}.png`});
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  assert.equal(await page.locator('.practice-complete').count(),0);
  await page.getByRole('button',{name:'Reset puzzle',exact:true}).click();
  assert.equal(await page.locator('.practice-filled').count(),0);
}

// Run against a production build, so asset paths and static downloads are tested too.
const remoteOrigin = process.env.WONGO_BASE_URL;
const server = remoteOrigin ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '5182', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
let page;
const failures = [];
try {
  if (server) {
    // CI may suppress or colour the terminal banner. Readiness is an HTTP response,
    // not a particular log line from Vite.
    let output='';
    server.stdout.on('data',data=>{output+=data;});
    server.stderr.on('data',data=>{output+=data;});
    const deadline=Date.now()+30_000;
    let ready=false;
    while(Date.now()<deadline){
      if(server.exitCode!==null)throw new Error(`Preview server exited (${server.exitCode}): ${output}`);
      try {
        const response=await fetch('http://127.0.0.1:5182/',{signal:AbortSignal.timeout(1000)});
        if(response.ok){ready=true;break;}
      } catch { /* The child may not have bound its port yet. */ }
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    if(!ready)throw new Error(`Preview server did not become reachable: ${output}`);
  }
  await mkdir('test-results', { recursive: true });
  browser = await chromium.launch({
    headless: true,
    ...(remoteOrigin && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
    ...(process.env.WONGO_CHROMIUM_PATH ? { executablePath: process.env.WONGO_CHROMIUM_PATH,
      args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=angle', '--use-angle=swiftshader'] } : {}),
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: process.env.WONGO_IGNORE_HTTPS_ERRORS === '1' });
  page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  page.on('requestfailed', request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  const origin = remoteOrigin ? new URL(remoteOrigin).origin : 'http://127.0.0.1:5182';
  await page.goto(origin);
  await page.getByRole('heading', { name: 'Good things fit together.' }).waitFor();
  await page.locator('canvas').waitFor();
  // Decorative swatches must match the physical filament groups, too.
  const expectedPalette = [1,5,9,13].map(id => pieces.find(piece => piece.id === id).hex);
  for (const selector of ['.tiny-pieces i', '.stat-dots i']) {
    const actual = await page.locator(selector).evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor));
    const expected = expectedPalette.map(hex => `rgb(${[1,3,5].map(index => parseInt(hex.slice(index,index+2),16)).join(', ')})`);
    assert.deepEqual(actual, expected, `${selector} differs from the purchased filament palette`);
  }

  const isTacustav = await page.locator('.app-shell[data-edition="tacustav-2026"]').count() > 0;
  if (isTacustav) {
    await page.locator('.workshop-portrait img').evaluate(image => image.decode());
    assert.equal(await page.locator('.workshop-intro').count(),1,'Edition intro is missing');
    await page.screenshot({path:'test-results/tacustav-intro-desktop.png'});
    await page.locator('.workshop-actions .primary-button').click();
    assert.equal(await page.locator('.workshop-intro').count(),0,'Start building must take the player to the puzzle');
  }
  if(catalogue.length>24){
    const firstCode=await page.locator('.puzzle-card .card-header').first().innerText();
    await page.getByRole('button',{name:'Next',exact:true}).click();
    assert.notEqual(await page.locator('.puzzle-card .card-header').first().innerText(),firstCode);
    await page.getByRole('button',{name:'Previous',exact:true}).click();
    assert.equal(await page.locator('.puzzle-card .card-header').first().innerText(),firstCode);
    await page.getByRole('spinbutton',{name:'Library page',exact:true}).fill(String(Math.ceil(catalogue.length/24)));
    assert.equal(await page.locator('.puzzle-card').count(),catalogue.length%24||24);
    await page.getByRole('spinbutton',{name:'Library page',exact:true}).fill('1');
  }

  // Printing through the browser menu works before the application's print button is used.
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('.print-card').count(),1);
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await solveInBrowser(page,catalogue[0]);
  await page.getByRole('button',{name:'Close practice',exact:true}).click();
  await page.getByRole('button', { name: 'Reveal solution', exact: true }).click();
  await page.getByRole('button', { name: 'Top layer', exact: true }).click();
  await page.getByRole('button', { name: 'Bottom layer', exact: true }).click();
  await page.getByRole('button', { name: 'Both layers', exact: true }).click();
  await page.getByRole('slider', { name: 'Pieces shown' }).fill('2');
  await page.getByRole('checkbox', { name: 'Separate pieces' }).check();
  await page.getByRole('button',{name:'Rotate left',exact:true}).click();
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  assert.equal(await page.locator('.solution-layers svg').count(),2);
  await page.screenshot({ path: 'test-results/solution-desktop.png' });
  await page.getByRole('button', { name: 'Hide solution', exact: true }).click();
  await page.getByRole('textbox', { name: /Find a puzzle/ }).fill('w3-h-048');
  assert.equal(await page.locator('.puzzle-card').count(), 1);
  await page.locator('.puzzle-card').click();
  assert.equal(new URL(page.url()).searchParams.get('p'), 'W3-H-048');
  assert.match(await page.locator('.viewer-heading').innerText(), /W3-H-048/);
  await solveInBrowser(page,catalogue.find(p=>p.code==='W3-H-048'));
  await page.getByRole('button',{name:'Reveal solution',exact:true}).click();
  assert.equal(await page.locator('.practice-board').count(),0);
  await page.locator('.puzzle-card').click();
  assert.ok(await page.getByRole('button',{name:'Reveal solution',exact:true}).isVisible(),'Reselecting a puzzle must hide its solution');
  await page.reload();
  await page.getByRole('button', { name: 'Reveal solution', exact: true }).waitFor();
  assert.match(await page.locator('.viewer-heading').innerText(), /W3-H-048/);
  await page.getByRole('textbox', { name: /Find a puzzle/ }).fill('not-a-code');
  await page.getByText('No puzzles found. Try a different code.').waitFor();

  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Print puzzle', exact: true }).click();
  await page.emulateMedia({ media: 'print' });
  await page.locator('.print-card').waitFor({ state: 'visible' });
  const calibration = await page.locator('.calibration span').evaluate(el => el.getBoundingClientRect().width);
  assert.ok(Math.abs(calibration - 30 * 96 / 25.4) < 0.1, '30mm calibration reference has incorrect size');
  const cell = await page.locator('.print-board .footprint rect').first().evaluate(el => el.getBoundingClientRect().width);
  assert.ok(Math.abs(cell - 20 * 96 / 25.4) < 0.1, 'Printed puzzle cell is not 20 mm');
  assert.equal(await page.locator('.print-solution').count(), 0);
  await page.pdf({ path: 'test-results/puzzle-card.pdf', preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: 'The pieces', exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.get('tab'),'pieces');
  await page.goBack();
  assert.match(await page.locator('.viewer-heading').innerText(),/W3-H-048/);
  await page.goForward();
  await page.getByRole('heading',{name:'Sixteen shapes. Endless possibilities.',exact:true}).waitFor();
  assert.equal(await page.locator('.piece-tile').count(), 16);
  const stlLink = page.getByRole('link', { name: 'Download STL', exact: true });
  const stl = await page.request.get(origin + await stlLink.getAttribute('href'));
  assert.equal(stl.status(), 200);
  assert.match(await stl.text(), /^solid wongo-piece-/);
  const zip = await page.request.get(origin + '/downloads/pieces/all-pieces.zip');
  assert.equal(zip.status(), 200);
  assert.equal((await zip.body()).readUInt32LE(0), 0x04034b50);

  await page.getByRole('button', { name: 'Family table', exact: true }).click();
  await page.locator('.round-toolbar select').first().selectOption('2');
  assert.equal(await page.locator('.assignment').count(),2);
  await page.locator('.round-toolbar select').first().selectOption('3');
  assert.equal(await page.locator('.assignment').count(),3);
  await page.locator('.round-toolbar select').first().selectOption('8');
  await page.locator('.round-toolbar select').nth(1).selectOption('hard');
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

  await page.getByRole('button',{name:'EN',exact:true}).click();
  await page.waitForFunction(()=>localStorage.getItem('wongo-language')==='en');
  await page.goto(`${origin}/?p=NOT-A-REAL-CODE`);
  await page.getByRole('heading',{name:'Unknown puzzle code',exact:true}).waitFor();
  assert.equal(await page.locator('.workbench').count(),0);
  await page.getByRole('button',{name:'Open first puzzle',exact:true}).click();
  assert.match(await page.locator('.viewer-heading').innerText(),/W3-E-001/);
  await page.goBack();
  await page.getByRole('heading',{name:'Unknown puzzle code',exact:true}).waitFor();
  await page.goForward();
  assert.match(await page.locator('.viewer-heading').innerText(),/W3-E-001/);

  // Both reading a solution and completing a puzzle still work without GPU/WebGL support.
  const fallbackPage = await page.context().newPage();
  await fallbackPage.setViewportSize({width:390,height:844});
  await fallbackPage.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args);};
  });
  await fallbackPage.goto(origin);
  await fallbackPage.getByRole('button',{name:'Reveal solution',exact:true}).click();
  assert.equal(await fallbackPage.locator('.solution-layers svg').count(),2);
  await fallbackPage.getByRole('button',{name:'Hide solution',exact:true}).click();
  await solveInBrowser(fallbackPage,catalogue[0]);
  assert.ok(await fallbackPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile practice layout overflows horizontally');
  await fallbackPage.close();

  if (isTacustav) {
    await page.setViewportSize({width:390,height:844});
    await page.goto(origin);
    await page.locator('.workshop-portrait img').evaluate(image => image.decode());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Edition intro overflows mobile width');
    await page.screenshot({path:'test-results/tacustav-intro-mobile.png',fullPage:true});
    await page.locator('.site-rules-link').click();
    await page.locator('.rulebook-card').first().waitFor();
    await page.screenshot({path:'test-results/tacustav-rules-mobile.png',fullPage:true});
    await page.getByRole('button',{name:'Open menu',exact:true}).click();
    await page.locator('.brand-home').click();
    await page.locator('.workshop-intro').waitFor();
  }

  // The printed QR chooses the edition, and a later plain visit remembers it.
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${origin}/?edition=tacustav-2026`);
  await page.locator('[data-edition="tacustav-2026"] .workshop-intro').waitFor();
  await page.waitForFunction(()=>localStorage.getItem('wongo-edition')==='tacustav-2026');
  await page.locator('.workshop-portrait img').evaluate(image=>image.decode());
  await page.screenshot({path:'test-results/tacustav-intro-desktop.png'});
  await page.goto(origin);
  await page.locator('.workshop-intro').waitFor();
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Remembered edition overflows mobile width');
  await page.screenshot({path:'test-results/tacustav-intro-mobile.png',fullPage:true});
  await page.locator('.site-rules-link').click();
  assert.ok((await page.locator('.rulebook-card').first().getAttribute('href')).includes('/tacustav/'));
  await page.screenshot({path:'test-results/tacustav-rules-mobile.png',fullPage:true});
  await page.goto(`${origin}/?edition=classic`);
  await page.locator('.app-shell[data-edition="classic"]').waitFor();
  await page.waitForFunction(()=>localStorage.getItem('wongo-edition')==='classic');
  assert.equal(await page.locator('.workshop-intro').count(),0);
  await page.goto(origin);
  await page.locator('.app-shell[data-edition="classic"]').waitFor();
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('.edition-switch select').selectOption('tacustav-2026');
  await page.locator('.workshop-intro').waitFor();
  await page.locator('.workshop-actions .primary-button').click();
  assert.equal(await page.locator('.workshop-intro').count(),0);
  await page.locator('.edition-switch select').selectOption('classic');
  await page.goBack();
  await page.locator('.app-shell[data-edition="tacustav-2026"]').waitFor();
  await page.goForward();
  await page.locator('.app-shell[data-edition="classic"]').waitFor();

  const noStorage=await context.newPage();
  await noStorage.addInitScript(()=>{
    Storage.prototype.getItem=()=>{throw new Error('Storage disabled');};
    Storage.prototype.setItem=()=>{throw new Error('Storage disabled');};
  });
  await noStorage.goto(`${origin}/?edition=tacustav-2026`);
  await noStorage.locator('.workshop-intro').waitFor();
  await noStorage.close();

  for (const [editionId, edition] of Object.entries(editions)) for (const lang of ['en', 'sk']) {
    await page.setViewportSize({ width: 1200, height: 1000 });
    await page.goto(`${origin}${edition.rulesPath}/rulebook-${lang}.html`);
    {
      assert.equal(await page.locator('.rulebook-cover').count(),1,'Bilingual rulebook needs its illustrated cover');
      await page.locator('.cover-art').evaluate(image=>image.decode());
      await page.screenshot({path:`test-results/${editionId}-cover-${lang}.png`});
    }
    assert.equal(await page.locator('.cover-access').getAttribute('href'),edition.url,'QR cover link points at wrong edition');
    await page.locator('.cover-qr').evaluate(image=>image.decode());
    assert.ok((await page.locator('.cover-specs').innerText()).includes('2–8'));
    const printablePdf=await page.request.get(`${origin}${edition.rulesPath}/rulebook-${lang}.pdf`);
    assert.equal(printablePdf.status(),200);
    assert.equal((await printablePdf.body()).subarray(0,4).toString(),'%PDF');
    await page.emulateMedia({ media: 'print' });
    const overflow = await page.locator('.sheet').evaluateAll(sheets => sheets.map(sheet => {
      const folio = sheet.querySelector('.folio').getBoundingClientRect();
      const content = [...sheet.children].filter(el => !el.classList.contains('folio'));
      return Math.max(...content.map(el => el.getBoundingClientRect().bottom)) - folio.top;
    }));
    assert.ok(overflow.every(value => value < -8), `Rulebook ${lang} overlaps page footer: ${overflow}`);
    await page.pdf({ path: `test-results/${editionId}-rulebook-${lang}.pdf`, preferCSSPageSize: true, printBackground: true });
    await page.screenshot({ path: `test-results/${editionId}-rulebook-${lang}.png`, fullPage: true });
    await page.emulateMedia({ media: 'screen' });
  }
  assert.deepEqual(failures, [], 'Browser reported runtime errors or failed requests');
  console.log(`Browser checks passed${remoteOrigin?' on '+origin:''}: manual solving, no-WebGL fallback, code errors, history, lookup, solution controls, downloads, eight-player rounds, mobile, rulebooks and physical print scale.`);
} catch (error) {
  if (page && !page.isClosed()) {
    await page.screenshot({path:'test-results/browser-failure.png',fullPage:true}).catch(()=>{});
    console.error('At:',page.url(),'Headings:',await page.getByRole('heading').allTextContents().catch(()=>[]),'Errors:',failures);
  }
  throw error;
} finally {
  await browser?.close();
  server?.kill();
}
