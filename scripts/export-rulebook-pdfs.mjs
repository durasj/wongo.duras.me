// Rebuild HTML first, then export the illustrated A4 cover and rules from a production build.
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { access, copyFile, readFile, mkdir } from 'node:fs/promises';

await access(new URL('../dist/index.html',import.meta.url));
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5183','--strictPort'],{stdio:'ignore'});
let browser;
try {
  const origin='http://127.0.0.1:5183';
  let ready=false;
  for(let i=0;i<100;i++){
    try {if((await fetch(origin)).ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!ready)throw Error('Production preview did not start');
  browser=await chromium.launch({headless:true,...(process.env.WONGO_CHROMIUM_PATH?{executablePath:process.env.WONGO_CHROMIUM_PATH,args:['--no-sandbox','--no-zygote','--single-process']}: {})});
  const page=await browser.newPage();
  const editions=JSON.parse(await readFile(new URL('../src/data/editions.json',import.meta.url),'utf8'));
  const canOptimize=spawnSync('gs',['--version'],{stdio:'ignore'}).status===0;
  await mkdir('test-results',{recursive:true});
  for(const [id,edition] of Object.entries(editions).filter(([id])=>!process.env.WONGO_RULEBOOK_EDITION||id===process.env.WONGO_RULEBOOK_EDITION)) for(const lang of ['en','sk']){
    await page.goto(`${origin}${edition.rulesPath}/rulebook-${lang}.html`);
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.cover-art').evaluate(img=>img.decode());
    await page.locator('.cover-qr').evaluate(img=>img.decode());
    await page.locator('.crew-photo-crop img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
    const target=`public${edition.rulesPath}/rulebook-${lang}.pdf`;
    const raw=`test-results/${id}-rulebook-${lang}-raw.pdf`;
    await page.pdf({path:raw,preferCSSPageSize:true,printBackground:true});
    if(canOptimize){
      const result=spawnSync('gs',['-sDEVICE=pdfwrite','-dCompatibilityLevel=1.7','-dPDFSETTINGS=/prepress','-dAutoFilterColorImages=false','-dColorImageFilter=/DCTEncode','-dDownsampleColorImages=false','-dJPEGQ=90','-dNOPAUSE','-dBATCH','-dSAFER',`-sOutputFile=${target}`,raw],{stdio:'ignore'});
      if(result.status!==0)throw Error(`PDF optimization failed for ${id}/${lang}`);
    } else await copyFile(raw,target);
    await copyFile(target,`dist${edition.rulesPath}/rulebook-${lang}.pdf`);
    console.log(`Exported ${target}`);
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
