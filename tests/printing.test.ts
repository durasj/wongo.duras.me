import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import config from '../src/data/print.json';
import puzzles from '../src/data/puzzles.json';

const json=(p:string)=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('20 mm meshes and full colour plates agree with the shared physical inventory',()=>{
 assert.equal(config.unitMm,20);
 const meshes=json('public/downloads/pieces/manifest.json');
 const plates=json('public/downloads/bambu/plate-manifest.json');
 assert.equal(meshes.unitMm,20);assert.equal(plates.unitMm,20);assert.equal(plates.plates.length,4);
 assert.deepEqual(plates.plates.map((p:{count:number})=>p.count),[9,11,10,10]);
 assert.equal(plates.slotReliefMm,.15);assert.equal(plates.slotReliefPieceId,4);assert.equal(plates.layoutVersion,'nested-center-v3');
 for(const plate of plates.plates){
  const os=plate.objects,loX=Math.min(...os.map((o:any)=>o.x)),hiX=Math.max(...os.map((o:any)=>o.x+o.width)),loY=Math.min(...os.map((o:any)=>o.y)),hiY=Math.max(...os.map((o:any)=>o.y+o.depth));
  assert.ok(Math.abs((loX+hiX)/2-128)<1e-5&&Math.abs((loY+hiY)/2-128)<1e-5,'Center the complete group on the bed');
  assert.ok(Math.max(hiX-loX,hiY-loY)<=180,'Compact grouping must avoid the outer bed');
  // Reconstruct complete projections independently from canonical printable voxels.
  const projected=os.map((o:any)=>{
   const piece=meshes.pieces.find((p:any)=>p.id===o.pieceId);
   assert.ok(Number.isInteger(o.rotation)&&o.rotation>=0&&o.rotation<4);
   const xy=piece.printCubes.map(([x,y]:number[])=>o.rotation===0?[x,y]:o.rotation===1?[-y,x]:o.rotation===2?[-x,-y]:[y,-x]);
   const minX=Math.min(...xy.map((c:number[])=>c[0])),minY=Math.min(...xy.map((c:number[])=>c[1]));
   return xy.map(([x,y]:number[])=>[o.x+(x-minX)*20,o.y+(y-minY)*20]);
  });
  let nested=false;
  for(let i=0;i<os.length;i++)for(let j=i+1;j<os.length;j++){
   const a=os[i],b=os[j];
   if(a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.depth&&b.y<a.y+a.depth)nested=true;
   for(const [ax,ay] of projected[i])for(const [bx,by] of projected[j]){
    const dx=Math.max(ax-bx-20,bx-ax-20,0),dy=Math.max(ay-by-20,by-ay-20,0);
    assert.ok(Math.hypot(dx,dy)>=6-1e-5,'Keep 6 mm between actual shapes at every height');
   }
  }
  assert.ok(nested,'Use empty footprint space rather than packing only bounding boxes');

  for(const o of plate.objects){
   const piece=meshes.pieces.find((p:{id:number})=>p.id===o.pieceId);
   assert.ok(piece);assert.equal(plate.objects.filter((p:{pieceId:number})=>p.pieceId===piece.id).length,piece.quantity4);
   assert.equal(o.height,piece.dimensionsMm[2]);assert.ok(o.x>=28&&o.y>=28&&o.x+o.width<=228&&o.y+o.depth<=228);
  }
 }
});
test('duplex cards contain each published code once, with correctly paired physical backs',()=>{
 const m=json('public/downloads/puzzles/manifest.json');
 assert.equal(m.unitMm,20);assert.equal(m.pages,500);assert.equal(m.sheets,250);
 assert.equal(m.duplex,'short-edge');
 const codes=m.layout.flatMap((p:{codes:string[]})=>p.codes);
 assert.deepEqual([...codes].sort(),puzzles.map(p=>p.code).sort());
 assert.equal(new Set(codes).size,1000);
 for(let i=0;i<m.layout.length;i+=2){
  const f=m.layout[i],b=m.layout[i+1];
  assert.equal(f.side,'front');assert.equal(b.side,'back');
  assert.deepEqual(f.codes.map((c:string)=>c.replace('-E-','-H-')),b.codes.toReversed());
 }
 for(const p of puzzles){
  assert.ok((Math.max(...p.footprint.map(c=>c[0]))+1)*20<=100);
  assert.ok((Math.max(...p.footprint.map(c=>c[1]))+1)*20<=100);
 }
 const pdf=readFileSync(new URL('../public/downloads/puzzles/wongo-20mm-duplex.pdf',import.meta.url),'utf8');
 assert.ok(pdf.startsWith('%PDF-1.4'));
 assert.equal((pdf.match(/\/Type \/Page \/Parent/g)??[]).length,500);
 const xref=Number(pdf.match(/startxref\n(\d+)/)?.[1]);assert.equal(pdf.slice(xref,xref+4),'xref');
 assert.ok(pdf.endsWith('%%EOF\n'));
});
