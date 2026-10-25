import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
      const chosen = picked.map(id=>pieces.find(p=>p.id===id)!);
      if (new Set(chosen.map(piece=>piece.color)).size !== count) return;
      if (chosen.reduce((n,piece)=>n+piece.cubes.length,0)%2===0) result.push(picked);
      return;
    }
    for (let index=start; index<pieces.length; index++) visit(index+1,[...picked,pieces[index].id]);
  }
  visit(0,[]);
  return result;
}

const generated: Puzzle[] = [], seen = new Set<string>();
let rejectedUnsolvable = 0, rejectedBudget = 0, rejectedAssembly = 0, rejectedDuplicate = 0, attempts = 0;
function generateBatch(difficulty: 'easy' | 'hard', firstCode: number, lastCode: number): void {
  const sets = combinations(difficulty==='easy'?3:4);
  let nextCode = firstCode;
  while (nextCode <= lastCode && attempts < 1_000_000) {
    attempts++;
    const pieceIds = sets[Math.floor(random()*sets.length)];
    const volume = pieceIds.reduce((n,id)=>n+pieces.find(p=>p.id===id)!.cubes.length,0);
    const board = footprint(volume/2);
    const fingerprint = `${footprintKey(board)}|${pieceIds.join(',')}`;
    if (seen.has(fingerprint)) { rejectedDuplicate++; continue; }
    const result = solve({ footprint: board, pieceIds }, 150_000);
    if (!result.solution) {
      if (result.exhausted) rejectedUnsolvable++; else rejectedBudget++;
      continue;
    }
    const checked = validateSolution({ footprint: board, pieceIds }, result.solution);
    if (!checked.valid) throw new Error(`Invalid generator witness: ${checked.errors.join('; ')}`);
    const ordered = assemblyOrder(result.solution);
    if (!ordered) { rejectedAssembly++; continue; }
    seen.add(fingerprint);
    generated.push({ code:`W3-${difficulty==='easy'?'E':'H'}-${String(nextCode).padStart(3,'0')}`, difficulty, footprint:board, pieceIds, solution:ordered, metrics:{ solverNodes:result.nodes,volume } });
    nextCode++;
  }
  if (nextCode<=lastCode) throw new Error(`Generation exhausted the candidate limit at ${difficulty} code ${nextCode}`);
  console.log(`${difficulty}: codes ${firstCode}–${lastCode} verified`);
}
// Preserve the RNG sequence, geometry, IDs and witnesses of the original 96.
// Extending the first easy loop directly would silently change published hard codes.
generateBatch('easy',1,48);
generateBatch('hard',1,48);
generateBatch('easy',49,500);
generateBatch('hard',49,500);
generated.sort((a,b)=>a.code.localeCompare(b.code));

// Backtest published data again, starting from an empty board, then verify each returned witness.
let totalNodes = 0;
for (const puzzle of generated) {
  const count=puzzle.difficulty==='easy'?3:4;
  if (puzzle.pieceIds.length!==count || new Set(puzzle.pieceIds.map(id=>pieces.find(piece=>piece.id===id)!.color)).size!==count)
    throw new Error(`Colour rule failed: ${puzzle.code}`);
  const result = solve({footprint:puzzle.footprint,pieceIds:puzzle.pieceIds});
  if (!result.solution || !validateSolution(puzzle,result.solution).valid) throw new Error(`Backtest failed: ${puzzle.code}`);
  totalNodes += result.nodes;
}
mkdirSync('src/data',{recursive:true});
// A one-time, explicitly authorized namespace migration. Preserve every legacy byte;
// retired F3 meanings must never be reassigned or leak into public play/search.
const legacyPath='src/data/legacy-puzzles.json';
const legacySha256='ff7b5467ab7059587ef75f1faf1a6b1425826a701c0a2ce2aad41cde49292335';
const digest=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
let archiveBytes=existsSync(legacyPath)?readFileSync(legacyPath):undefined;
if (archiveBytes && digest(archiveBytes)!==legacySha256) throw new Error('Legacy F3 archive changed; refusing generation.');
if (existsSync('src/data/puzzles.json')) {
  const previousBytes=readFileSync('src/data/puzzles.json');
  const previous=JSON.parse(previousBytes.toString('utf8')) as Puzzle[];
  if (previous.length===96 && previous.every(puzzle=>/^F3-[EH]-\d{3}$/.test(puzzle.code))) {
    if (digest(previousBytes)!==legacySha256) throw new Error('Legacy F3 catalogue changed; refusing migration.');
    if (!archiveBytes) archiveBytes=previousBytes;
  } else {
    if (previous.some(puzzle=>!/^W3-[EH]-\d{3}$/.test(puzzle.code))) throw new Error('Unexpected active catalogue namespace; refusing overwrite.');
    assertPublishedCatalogueUnchanged(previous,generated);
  }
}
if (!archiveBytes) throw new Error('Missing immutable legacy archive; restore src/data/legacy-puzzles.json before generating.');
if (!existsSync(legacyPath)) writeFileSync(legacyPath,archiveBytes);
writeFileSync('src/data/puzzles.json',JSON.stringify(generated,null,2)+'\n');
const diversity=Object.fromEntries((['easy','hard'] as const).map(difficulty=>{
  const category=generated.filter(puzzle=>puzzle.difficulty===difficulty);
  return [difficulty,{
    puzzles:category.length,
    uniqueFootprints:new Set(category.map(puzzle=>footprintKey(puzzle.footprint))).size,
    uniquePieceSets:new Set(category.map(puzzle=>puzzle.pieceIds.join(','))).size,
    areas:[...new Set(category.map(puzzle=>puzzle.footprint.length))].sort((a,b)=>a-b),
    piecesUsed:[...new Set(category.flatMap(puzzle=>puzzle.pieceIds))].sort((a,b)=>a-b),
  }];
}));
writeFileSync('src/data/validation.json',JSON.stringify({
  schemaVersion:3, generatorVersion:'wongo-3-expanded-1000', namespace:'W3', seed, puzzles:generated.length,
  easy:500, hard:500, attempts, rejectedUnsolvable, rejectedBudget, rejectedAssembly, rejectedDuplicate,
  candidateLimit:1_000_000, generationSolverNodeLimit:150_000, backtestSolverNodeLimit:1_000_000,
  diversity,
  uniqueColourVerified:generated.length,
  colourRule:'Easy: exactly 3 pieces from 3 different logical colour groups. Hard: exactly 4 pieces, one from each of the 4 groups.',
  retiredLegacyPuzzles:96, legacySha256,
  independentlySolved:generated.length, witnessesValidated:generated.length,
  verticalAssemblyVerified:generated.length,
  deduplication:'Footprint D4 symmetry plus sorted piece IDs',
  solutionCount:'At least one; uniqueness is not claimed',
  difficulty:'Three pieces (easy) or four pieces (hard); human calibration pending',
  totalBacktestNodes:totalNodes
},null,2)+'\n');
console.log(`Saved ${generated.length} original, independently solved puzzles (${attempts} candidates).`);
