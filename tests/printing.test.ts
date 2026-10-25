import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import config from '../src/data/print.json';
import { puzzles } from '../src/lib/puzzles';

const json=(p:string)=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('20 mm meshes and full colour plates agree with the shared physical inventory',()=>{
 assert.equal(config.unitMm,20);
 const meshes=json('public/downloads/pieces/manifest.json');
 const plates=json('public/downloads/bambu/plate-manifest.json');
 assert.equal(meshes.unitMm,20);assert.equal(plates.unitMm,20);assert.equal(plates.plates.length,4);
 assert.deepEqual(plates.plates.map((p:{count:number})=>p.count),[9,11,10,10]);
 for(const plate of plates.plates){
  for(const o of plate.objects){
   const piece=meshes.pieces.find((p:{id:number})=>p.id===o.pieceId);
   assert.ok(piece);assert.equal(plate.objects.filter((p:{pieceId:number})=>p.pieceId===piece.id).length,piece.quantity4);
   assert.equal(o.height,piece.dimensionsMm[2]);assert.ok(o.x>=20&&o.y>=30&&o.x+o.width<=246&&o.y+o.depth<=246);
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
