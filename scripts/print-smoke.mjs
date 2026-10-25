import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5184','--strictPort'],{stdio:'ignore'});
const origin='http://127.0.0.1:5184';let browser;
try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
 assert.ok(ready,'Preview did not start');
 browser=await chromium.launch({headless:true,...(process.env.WONGO_CHROMIUM_PATH?{executablePath:process.env.WONGO_CHROMIUM_PATH,args:['--no-sandbox']}: {})});
 const page=await browser.newPage({viewport:{width:1300,height:900}});
 await page.goto(origin+'/downloads/puzzles/wongo-20mm-duplex.html');
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.sheet').count(),500);assert.equal(await page.locator('.card').count(),1000);
 const mm=96/25.4;
 const dimensions=await page.locator('.sheet').first().evaluate(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}));
 assert.ok(Math.abs(dimensions.w-297*mm)<.1);assert.ok(Math.abs(dimensions.h-210*mm)<.1);
 const issues=await page.locator('.card').evaluateAll(cards=>cards.flatMap(card=>{
  const outer=card.getBoundingClientRect(),board=card.querySelector('.board').getBoundingClientRect(),footer=card.querySelector('footer').getBoundingClientRect();
  const box=card.querySelector('.board').viewBox.baseVal;
  const cellW=board.width/box.width;
  return [Math.abs(cellW-20*96/25.4)>.1?'cell size':null,board.left<outer.left||board.right>outer.right?'board width':null,footer.bottom>outer.bottom-4?'footer overflow':null].filter(Boolean).map(issue=>card.dataset.code+': '+issue);
 }));
 assert.deepEqual(issues,[]);
 const guide=await page.locator('.calibration span').first().evaluate(el=>el.getBoundingClientRect().width);assert.ok(Math.abs(guide-40*mm)<.1);
 await mkdir('test-results',{recursive:true});
 await page.locator('.sheet').first().screenshot({path:'test-results/duplex-front.png'});
 await page.locator('.sheet').nth(1).screenshot({path:'test-results/duplex-back.png'});
 const manifest=JSON.parse(await readFile('public/downloads/puzzles/manifest.json','utf8'));
 const pdf=await page.request.get(origin+'/downloads/puzzles/wongo-20mm-duplex.pdf');
 assert.equal(pdf.status(),200);assert.ok((await pdf.body()).subarray(0,4).toString()==='%PDF');
 assert.equal(manifest.sheets,250);
 await page.goto(origin+'/downloads/puzzles/wongo-d6-20mm.html');
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.sheet').count(),288);assert.equal(await page.locator('.dice-card').count(),576);assert.equal(await page.locator('.dice-choice').count(),3456);
 const badges=await page.locator('.dice-card').evaluateAll(cards=>cards.map(card=>({pack:card.dataset.pack,label:card.querySelector('.pack-badge').textContent,id:card.dataset.id})));
 assert.equal(badges.length,576);for(const badge of badges){assert.equal(badge.label,'SADA / SET '+badge.pack);assert.equal(badge.pack,badge.id.split('-')[1]);}
 for(let i=0;i<36;i++)assert.ok(badges.slice(i*16,(i+1)*16).every(b=>b.pack===String(i+1).padStart(2,'0')),'Keep every set together in print order');
 const d6issues=await page.locator('.dice-card').evaluateAll(cards=>cards.flatMap(card=>{const b=card.getBoundingClientRect(),board=card.querySelector('.board').getBoundingClientRect(),v=card.querySelector('.board').viewBox.baseVal,f=card.querySelector('footer').getBoundingClientRect();return [Math.abs(board.width/v.width-20*96/25.4)>.1?'cell':null,f.bottom>b.bottom-4?'overflow':null].filter(Boolean).map(x=>card.dataset.id+': '+x);}));assert.deepEqual(d6issues,[]);
 for(const id of [5,6,7,8,9,10,11,12])assert.ok(await page.locator('#piece-'+id+' polygon').evaluateAll(nodes=>nodes.length>0&&nodes.every(n=>n.getAttribute('stroke')==='#ffffff')));
 await page.locator('.sheet').first().screenshot({path:'test-results/d6-front.png'});await page.locator('.sheet').nth(1).screenshot({path:'test-results/d6-back.png'});
 const d6pdf=await page.request.get(origin+'/downloads/puzzles/wongo-d6-20mm.pdf');assert.equal(d6pdf.status(),200);assert.equal((await d6pdf.body()).subarray(0,4).toString(),'%PDF');
 console.log('Print checks passed: all 1000 cards, 20 mm cells, A4/A5 bounds, 40 mm calibration and PDF download.');
}finally{await browser?.close();server.kill('SIGTERM');}
