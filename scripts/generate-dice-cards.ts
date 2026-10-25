// Permanent physical D6 cards, grouped into inventory-safe four-player blocks.
import { readFileSync, writeFileSync } from 'node:fs';
import { puzzles, type Puzzle } from '../src/lib/puzzles';
import { pieces, type Voxel } from '../src/lib/pieces';
import { solve, validateSolution, assemblyOrder, type Footprint } from '../src/lib/solver';

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
for(const p of puzzles){const n=normalized(p),key=p.difficulty+':'+n.key;const g=groups.get(key)??{key,footprint:n.puzzle.footprint,options:[]};if(!g.options.some(v=>v.pieceIds.join(',')===p.pieceIds.join(',')))g.options.push(n.puzzle);groups.set(key,g);}
const candidates=(difficulty:string)=>[...groups.values()].filter(g=>g.options.length>=6&&g.options[0].difficulty===difficulty);
const quantity=new Map(pieces.map(p=>[p.id,p.quantity4]));
function block(difficulty:'easy'|'hard',avoid:Set<string>):{groups:Group[];codes:string[][]}{
 for(let attempt=0;attempt<400;attempt++){
  const chosen=shuffled(candidates(difficulty).filter(g=>!avoid.has(g.key))).slice(0,4);
  if(chosen.length!==4)throw Error('Not enough distinct D6 boards.');
  const order=chosen.map(g=>shuffled(g.options)),used=chosen.map(()=>new Set<string>()),rows:string[][]=chosen.map(()=>[]);let nodes=0;
  function face(die:number):boolean{
   if(die===6)return true;const remaining=new Map(quantity);
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
for(let pack=1;pack<=12;pack++){
 const cards:Card[]=[];
 for(const difficulty of ['easy','hard'] as const){
  const avoid=new Set<string>();
  for(const [blockIndex,label] of (['A','B'] as const).entries()){
   const b=block(difficulty,avoid);
   for(let i=0;i<4;i++){avoid.add(b.groups[i].key);const slot=blockIndex*4+i+1;cards.push({id:`D6-${String(pack).padStart(2,'0')}-${slot}-${difficulty==='easy'?'E':'H'}`,slot,block:label,difficulty,footprint:b.groups[i].footprint,codes:b.codes[i]});}
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
try{const previous=JSON.parse(readFileSync(target,'utf8'));if(previous.schemaVersion===output.schemaVersion&&JSON.stringify(previous)!==JSON.stringify(output))throw Error('Published D6 cards changed. Version the catalogue before replacing printed mappings.');}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}
writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log(`Generated ${output.doubleSidedCards} double-sided D6 cards in 12 inventory-safe packs; ${output.alternatives} alternatives, ${output.uniquePuzzles} distinct puzzles, all independently solved.`);
