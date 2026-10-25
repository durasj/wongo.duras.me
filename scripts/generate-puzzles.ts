import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pieces } from '../src/lib/pieces';
import { assemblyOrder, footprintKey, solve, validateSolution, type Footprint } from '../src/lib/solver';
import type { Puzzle } from '../src/lib/puzzles';
import { assertPublishedCatalogueUnchanged } from '../src/lib/catalogue';

// Never import the generated library at runtime: this script bootstraps a fresh checkout.
const seed = 20261025;
let state = seed;
function random(): number {
  state += 0x6D2B79F5;
  let t = state;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function footprint(size: number): Footprint {
  const cells: Footprint = [[0,0]], keys = new Set(['0,0']);
  while (cells.length < size) {
    const [x,y] = cells[Math.floor(random()*cells.length)];
    const [dx,dy] = [[1,0],[-1,0],[0,1],[0,-1]][Math.floor(random()*4)];
    const next: [number,number] = [x+dx,y+dy];
    if (keys.has(next.join(','))) continue;
    // Compact enough for a physical card, without restricting to rectangles.
    const xs = [...cells.map(c=>c[0]),next[0]], ys = [...cells.map(c=>c[1]),next[1]];
    if (Math.max(...xs)-Math.min(...xs) > 4 || Math.max(...ys)-Math.min(...ys) > 4) continue;
    cells.push(next); keys.add(next.join(','));
  }
  const minX = Math.min(...cells.map(c=>c[0])), minY = Math.min(...cells.map(c=>c[1]));
  return cells.map(([x,y])=>[x-minX,y-minY] as [number,number]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
}
function combinations(count: number): number[][] {
  const result: number[][] = [];
  function visit(start: number, picked: number[]) {
    if (picked.length === count) {
      if (picked.reduce((n,id)=>n+pieces.find(p=>p.id===id)!.cubes.length,0)%2===0) result.push(picked);
      return;
    }
    for (let index=start; index<pieces.length; index++) visit(index+1,[...picked,pieces[index].id]);
  }
  visit(0,[]);
  return result;
}

const generated: Puzzle[] = [], seen = new Set<string>();
let rejectedUnsolvable = 0, rejectedBudget = 0, rejectedAssembly = 0, attempts = 0;
for (const difficulty of ['easy','hard'] as const) {
  const sets = combinations(difficulty==='easy'?3:4);
  let found = 0;
  while (found < 48 && attempts < 100_000) {
    attempts++;
    const pieceIds = sets[Math.floor(random()*sets.length)];
    const volume = pieceIds.reduce((n,id)=>n+pieces.find(p=>p.id===id)!.cubes.length,0);
    const board = footprint(volume/2);
    const fingerprint = `${footprintKey(board)}|${pieceIds.join(',')}`;
    if (seen.has(fingerprint)) continue;
    const result = solve({ footprint: board, pieceIds }, 150_000);
    if (!result.solution) {
      if (result.exhausted) rejectedUnsolvable++; else rejectedBudget++;
      continue;
    }
    const checked = validateSolution({ footprint: board, pieceIds }, result.solution);
    if (!checked.valid) throw new Error(`Invalid generator witness: ${checked.errors.join('; ')}`);
    const ordered = assemblyOrder(result.solution);
    if (!ordered) { rejectedAssembly++; continue; }
    seen.add(fingerprint); found++;
    generated.push({ code:`F3-${difficulty==='easy'?'E':'H'}-${String(found).padStart(3,'0')}`, difficulty, footprint:board, pieceIds, solution:ordered, metrics:{ solverNodes:result.nodes,volume } });
  }
  if (found!==48) throw new Error(`Only generated ${found} ${difficulty} puzzles`);
  console.log(`${difficulty}: ${found} puzzles verified`);
}

// Backtest published data again, starting from an empty board, then verify each returned witness.
let totalNodes = 0;
for (const puzzle of generated) {
  const result = solve({footprint:puzzle.footprint,pieceIds:puzzle.pieceIds});
  if (!result.solution || !validateSolution(puzzle,result.solution).valid) throw new Error(`Backtest failed: ${puzzle.code}`);
  totalNodes += result.nodes;
}
mkdirSync('src/data',{recursive:true});
if (existsSync('src/data/puzzles.json')) {
  assertPublishedCatalogueUnchanged(JSON.parse(readFileSync('src/data/puzzles.json','utf8')) as Puzzle[],generated);
}
writeFileSync('src/data/puzzles.json',JSON.stringify(generated,null,2)+'\n');
writeFileSync('src/data/validation.json',JSON.stringify({
  schemaVersion:1, generatorVersion:'fongo-1', seed, puzzles:generated.length,
  easy:48, hard:48, attempts, rejectedUnsolvable, rejectedBudget, rejectedAssembly,
  independentlySolved:generated.length, witnessesValidated:generated.length,
  verticalAssemblyVerified:generated.length,
  deduplication:'Footprint D4 symmetry plus sorted piece IDs',
  solutionCount:'At least one; uniqueness is not claimed',
  difficulty:'Three pieces (easy) or four pieces (hard); human calibration pending',
  totalBacktestNodes:totalNodes
},null,2)+'\n');
console.log(`Saved ${generated.length} original, independently solved puzzles (${attempts} candidates).`);
