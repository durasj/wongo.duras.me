import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import dice from '../src/data/dice-cards.json';
import { getPuzzle, puzzles } from '../src/lib/puzzles';
import { pieces } from '../src/lib/pieces';
import { solve, validateSolution } from '../src/lib/solver';

test('physical D6 cards use six distinct, independently solvable alternatives per shared footprint',()=>{
 assert.equal(dice.packCount,12);assert.equal(dice.doubleSidedCards,96);assert.equal(dice.a4Sheets,48);
 const ids=new Set<string>();const seen=new Set<string>();
 for(const pack of dice.packs){
  assert.equal(pack.cards.length,16);
  for(const card of pack.cards){
   assert.ok(!ids.has(card.id));ids.add(card.id);assert.equal(new Set(card.codes).size,6);
   for(const code of card.codes){const p=getPuzzle(code);assert.ok(p);assert.equal(p.difficulty,card.difficulty);const key=JSON.stringify(card.footprint)+code;if(seen.has(key))continue;seen.add(key);const target={footprint:card.footprint as [number,number][],pieceIds:p.pieceIds};const solution=solve(target).solution;assert.ok(solution);assert.equal(validateSolution(target,solution).valid,true);}
  }
 }
 assert.equal(puzzles.length,1000,'Existing single-puzzle catalogue stays available');
});

test('every shared die roll fits each physical player count and both common difficulty levels',()=>{
 for(const pack of dice.packs)for(const level of ['easy','hard'])for(let roll=0;roll<6;roll++)for(let count=2;count<=8;count++){
  for(const offset of count<=4?[0,4]:[0]){
   const selected=pack.cards.filter(c=>c.difficulty===level&&c.slot>offset&&c.slot<=offset+count);assert.equal(selected.length,count);
   const usage=new Map<number,number>();for(const card of selected)for(const id of getPuzzle(card.codes[roll])!.pieceIds)usage.set(id,(usage.get(id)??0)+1);
   for(const p of pieces)assert.ok((usage.get(p.id)??0)<=(count<=4?p.quantity4:p.quantity8),`${pack.id}, ${level}, roll ${roll+1}, ${count} players, piece ${p.id}`);
  }
 }
});

test('both PDF catalogues retain their page counts and white outlines on red and blue pieces',()=>{
 for(const [name,count] of [['wongo-20mm-duplex.pdf',500],['wongo-d6-20mm.pdf',96]] as const){
  const pdf=readFileSync(new URL('../public/downloads/puzzles/'+name,import.meta.url),'utf8');
  assert.equal((pdf.match(/\/Type \/Page \/Parent/g)??[]).length,count,name);
  for(const id of [5,9]){const match=pdf.match(new RegExp('/P'+id+' (\\d+) 0 R'));assert.ok(match);const body=pdf.split(match[1]+' 0 obj\n')[1]?.split('endobj')[0];assert.ok(body?.includes('1 1 1 RG 0.3 w'),name+' piece '+id);}
 }
});
