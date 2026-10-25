// Permanent physical D6 cards, grouped into inventory-safe four-player blocks.
import { readFileSync, writeFileSync } from 'node:fs';
import originalCatalogue from '../src/data/puzzles.json';
import type { Puzzle } from '../src/lib/puzzles';
import { pieces, type Voxel } from '../src/lib/pieces';
import { solve, validateSolution, assemblyOrder, footprintKey, type Footprint } from '../src/lib/solver';

let state=20261026;
const random=()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
function shuffled<T>(items:T[]):T[]{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function rotate([x,y,z]:Voxel,r:number):Voxel{return (r===0?[x,y,z]:r===1?[-y,x,z]:r===2?[-x,-y,z]:[y,-x,z]) as Voxel;}
function normalized(p:Puzzle){
 const candidates=[0,1,2,3].map(r=>{const f=p.footprint.map(([x,y])=>rotate([x,y,0],r));const dx=Math.min(...f.map(v=>v[0])),dy=Math.min(...f.map(v=>v[1]));const footprint=f.map(([x,y])=>[x-dx,y-dy] as [number,number]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);return {r,dx,dy,footprint,key:JSON.stringify(footprint)};}).sort((a,b)=>a.key.localeCompare(b.key));
 const best=candidates[0];const solution=p.solution.map(s=>({pieceId:s.pieceId,cubes:s.cubes.map(c=>{const [x,y,z]=rotate(c,best.r);return [x-best.dx,y-best.dy,z] as Voxel;})}));
 const view={...p,footprint:best.footprint,solution};
 if(!validateSolution(view,solution).valid||!assemblyOrder(solution))throw Error('Rotation damaged a saved witness: '+p.code);
 return {key:best.key,puzzle:view};
}
type Group={key:string;footprint:Footprint;options:Puzzle[]};
type Card={id:string;slot:number;block:'A'|'B';difficulty:'easy'|'hard';footprint:Footprint;codes:string[]};
const groups=new Map<string,Group>();
const puzzles: Puzzle[]=[...originalCatalogue as Puzzle[]];
for(const p of puzzles){const n=normalized(p),key=p.difficulty+':'+n.key;const g=groups.get(key)??{key,footprint:n.puzzle.footprint,options:[]};if(!g.options.some(v=>v.pieceIds.join(',')===p.pieceIds.join(',')))g.options.push(n.puzzle);groups.set(key,g);}
const candidates=(difficulty:string)=>[...groups.values()].filter(g=>g.options.length>=6&&g.options[0].difficulty===difficulty);
const quantity=new Map(pieces.map(p=>[p.id,p.quantity4]));
const extraPuzzles:Puzzle[]=[];
const puzzleSignatures=new Set(puzzles.map(p=>footprintKey(p.footprint)+'|'+p.pieceIds.join(',')));
function enrichBoards(){
 // Expand shared footprints with new piece sets; preserve all existing W3 meanings.
 const combinations=(count:number)=>{const out:number[][]=[];function visit(start:number,ids:number[]){if(ids.length===count){if(new Set(ids.map(id=>pieces.find(p=>p.id===id)!.color)).size===count)out.push(ids);return;}for(let i=start;i<pieces.length;i++)visit(i+1,[...ids,pieces[i].id]);}visit(0,[]);return out;};
 const sets={easy:combinations(3),hard:combinations(4)},numbers={easy:0,hard:0};
 for(const g of groups.values()){
  if(g.options.length<3)continue;
  const difficulty=g.options[0].difficulty,known=new Set(g.options.map(p=>p.pieceIds.join(',')));
  for(const pieceIds of sets[difficulty]){
   const volume=pieceIds.reduce((n,id)=>n+pieces.find(p=>p.id===id)!.cubes.length,0);
   const puzzleSignature=footprintKey(g.footprint)+'|'+pieceIds.join(',');
   if(volume!==g.footprint.length*2||known.has(pieceIds.join(','))||puzzleSignatures.has(puzzleSignature))continue;
   const target={footprint:g.footprint,pieceIds},result=solve(target,150_000);
   if(!result.solution||!validateSolution(target,result.solution).valid)continue;
   const solution=assemblyOrder(result.solution);if(!solution)continue;
   const code=`WD6-${difficulty==='easy'?'E':'H'}-${String(++numbers[difficulty]).padStart(4,'0')}`;
   const puzzle:Puzzle={code,difficulty,...target,solution,metrics:{solverNodes:result.nodes,volume}};
   extraPuzzles.push(puzzle);puzzles.push(puzzle);g.options.push(puzzle);puzzleSignatures.add(puzzleSignature);
  }
 }
 console.log(`Added ${extraPuzzles.length} independently solved and assembly-checked D6 puzzles.`);
}
const codeUsage=new Map<string,number>(),boardUsage=new Map<string,number>(),cardSignatures=new Set<string>();
const signature=(key:string,codes:string[])=>key+':'+[...codes].sort().join(',');
function block(difficulty:'easy'|'hard',avoid:Set<string>,diversify=false):{groups:Group[];codes:string[][]}{
 for(let attempt=0;attempt<400;attempt++){
  const pool=shuffled(candidates(difficulty).filter(g=>!avoid.has(g.key)&&(!diversify||g.options.length>6||!boardUsage.has(g.key))));
  if(diversify&&attempt<50){const priority=new Map(pool.map(g=>[g.key,(boardUsage.get(g.key)??0)+random()*4]));pool.sort((a,b)=>priority.get(a.key)!-priority.get(b.key)!);}
  const chosen=pool.slice(0,4);
  if(chosen.length!==4)throw Error('Not enough distinct D6 boards.');
  const order=chosen.map(g=>{const options=shuffled(g.options);if(diversify)options.sort((a,b)=>(codeUsage.get(a.code)??0)-(codeUsage.get(b.code)??0));return options;}),used=chosen.map(()=>new Set<string>()),rows:string[][]=chosen.map(()=>[]);let nodes=0;
  function face(die:number):boolean{
   if(die===6)return !diversify||chosen.every((g,i)=>!cardSignatures.has(signature(g.key,rows[i])));const remaining=new Map(quantity);
   function place(slot:number):boolean{
    if(++nodes>40_000)return false;
    if(slot===4)return face(die+1);
    for(const option of order[slot]){
     if(used[slot].has(option.code)||option.pieceIds.some(id=>(remaining.get(id)??0)<1))continue;
     for(const id of option.pieceIds)remaining.set(id,remaining.get(id)!-1);
     used[slot].add(option.code);rows[slot].push(option.code);
     if(place(slot+1))return true;
     rows[slot].pop();used[slot].delete(option.code);
     for(const id of option.pieceIds)remaining.set(id,remaining.get(id)!+1);
    }return false;
   }return place(0);
  }
  if(face(0))return {groups:chosen,codes:rows};
 }throw Error('Could not construct an inventory-safe D6 block.');
}
const packs:{id:string;cards:Card[]}[]=[];
for(let pack=1;pack<=36;pack++){
 if(pack===13)enrichBoards();
 const cards:Card[]=[];
 for(const difficulty of ['easy','hard'] as const){
  const avoid=new Set<string>();
  for(const [blockIndex,label] of (['A','B'] as const).entries()){
   if(process.env.DEBUG_D6)console.log('Generating',pack,difficulty,label,candidates(difficulty).length);
   const b=block(difficulty,avoid,pack>12);
   for(let i=0;i<4;i++){const g=b.groups[i];avoid.add(g.key);boardUsage.set(g.key,(boardUsage.get(g.key)??0)+1);for(const code of b.codes[i])codeUsage.set(code,(codeUsage.get(code)??0)+1);cardSignatures.add(signature(g.key,b.codes[i]));const slot=blockIndex*4+i+1;cards.push({id:`D6-${String(pack).padStart(2,'0')}-${slot}-${difficulty==='easy'?'E':'H'}`,slot,block:label,difficulty,footprint:g.footprint,codes:b.codes[i]});}
  }
 }
 packs.push({id:`D6-${String(pack).padStart(2,'0')}`,cards});
}
// Independent proof for every code at its printed orientation, plus every roll/pool.
const lookup=new Map(puzzles.map(p=>[p.code,p]));let witnesses=0,independent=0;
for(const pack of packs)for(const card of pack.cards){
 if(new Set(card.codes).size!==6)throw Error('Repeated alternative on a card.');
 for(const code of card.codes){const p=lookup.get(code)!;const target={footprint:card.footprint,pieceIds:p.pieceIds};const result=solve(target);if(!result.solution||!validateSolution(target,result.solution).valid)throw Error('D6 backtest failed: '+code);independent++;witnesses++;}
}
for(const pack of packs)for(const difficulty of ['easy','hard'])for(let die=0;die<6;die++)for(const which of ['A','B','all']){
 const selected=pack.cards.filter(c=>c.difficulty===difficulty&&(which==='all'||c.block===which));const counts=new Map<number,number>();
 for(const card of selected)for(const id of lookup.get(card.codes[die])!.pieceIds)counts.set(id,(counts.get(id)??0)+1);
 for(const p of pieces)if((counts.get(p.id)??0)>(which==='all'?p.quantity8:p.quantity4))throw Error('D6 inventory overflow.');
}
const output={schemaVersion:1,unitMm:20,dieSides:6,packCount:packs.length,cardsPerPack:8,doubleSidedCards:packs.length*8,a4Sheets:packs.length*4,alternatives:witnesses,uniquePuzzles:new Set(packs.flatMap(p=>p.cards.flatMap(c=>c.codes))).size,independentlySolved:independent,commonDie:true,commonDifficulty:true,packs};
const target=new URL('../src/data/dice-cards.json',import.meta.url);
// Once printed, card IDs and their roll mappings are stable, like puzzle codes.
try{const previous=JSON.parse(readFileSync(target,'utf8'));if(previous.schemaVersion===output.schemaVersion&&(previous.packCount>output.packCount||JSON.stringify(previous.packs)!==JSON.stringify(output.packs.slice(0,previous.packCount))))throw Error('Published D6 cards changed. Append new packs without replacing printed mappings.');}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}
const extraTarget=new URL('../src/data/dice-puzzles.json',import.meta.url);
try{const previous=JSON.parse(readFileSync(extraTarget,'utf8'));if(JSON.stringify(previous)!==JSON.stringify(extraPuzzles))throw Error('Published WD6 puzzle codes changed.');}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}
writeFileSync(target,JSON.stringify(output,null,2)+'\n');
writeFileSync(extraTarget,JSON.stringify(extraPuzzles,null,2)+'\n');
console.log(`Generated ${output.doubleSidedCards} double-sided D6 cards in ${output.packCount} inventory-safe packs; ${output.alternatives} alternatives, ${output.uniquePuzzles} distinct puzzles, all independently solved.`);
