import test from 'node:test';
import assert from 'node:assert/strict';
import { pieces, getPiece, type Voxel } from '../src/lib/pieces';
import report from '../src/data/validation.json';
import { puzzles, getPuzzle, isPlayablePuzzle, selectRound } from '../src/lib/puzzles';
import { assemblyOrder, orientations, shapeKey, isConnected, footprintKey, solve, validateSolution } from '../src/lib/solver';

test('all 16 rigid, connected pieces have unique identities and expected volumes', () => {
  assert.deepEqual(pieces.map(p=>p.id),Array.from({length:16},(_,i)=>i+1));
  assert.deepEqual(pieces.map(p=>p.cubes.length),[5,5,4,5,5,5,5,3,5,4,5,4,5,5,4,4]);
  for (const piece of pieces) {
    assert.ok(isConnected(piece.cubes),`Disconnected piece ${piece.id}`);
    assert.equal(new Set(piece.cubes.map(v=>v.join(','))).size,piece.cubes.length);
    assert.ok(orientations(piece.cubes).length <= 24);
  }
  assert.equal(pieces.reduce((n,p)=>n+p.quantity4,0),40);
  assert.equal(pieces.reduce((n,p)=>n+p.quantity8,0),80);
  assert.throws(()=>getPiece(99));
});

test('rotation group includes all 24 rigid rotations, never reflections', () => {
  const chiral: Voxel[] = [[0,0,0],[1,0,0],[2,0,0],[3,0,0],[0,1,0],[0,2,0],[0,0,1]];
  const rotations = orientations(chiral);
  assert.equal(rotations.length,24);
  assert.ok(!rotations.some(v=>shapeKey(v)===shapeKey(chiral.map(([x,y,z])=>[-x,y,z]))));
  for (const rotated of rotations) assert.equal(orientations(rotated).map(shapeKey).sort().join('|'),rotations.map(shapeKey).sort().join('|'));
});

test('all original and supplemental challenges independently solve from an empty target', () => {
  assert.equal(puzzles.filter(p=>p.code.startsWith('W3-')).length,1000);
  assert.equal(puzzles.filter(puzzle=>puzzle.code.startsWith('W3-')&&puzzle.difficulty==='easy').length,500);
  assert.equal(puzzles.filter(puzzle=>puzzle.code.startsWith('W3-')&&puzzle.difficulty==='hard').length,500);
  const seen = new Set<string>();
  for (const puzzle of puzzles) {
    assert.equal(puzzle.pieceIds.length,puzzle.difficulty==='easy'?3:4);
    assert.match(puzzle.code,/^(?:W3-[EH]-\d{3}|WD6-[EH]-\d{4})$/);
    assert.equal(isPlayablePuzzle(puzzle),true,puzzle.code);
    assert.equal(new Set(puzzle.pieceIds.map(id=>getPiece(id).color)).size,puzzle.pieceIds.length,puzzle.code);
    const signature = `${footprintKey(puzzle.footprint)}|${[...puzzle.pieceIds].sort((a,b)=>a-b)}`;
    assert.ok(!seen.has(signature),`Duplicate ${puzzle.code}`); seen.add(signature);
    assert.deepEqual(validateSolution(puzzle,puzzle.solution),{valid:true,errors:[]},puzzle.code);
    assert.deepEqual(assemblyOrder(puzzle.solution),puzzle.solution,`Witness not in assembly order: ${puzzle.code}`);
    const result = solve({footprint:puzzle.footprint,pieceIds:puzzle.pieceIds});
    assert.ok(result.solution,`No independent solution for ${puzzle.code}`);
    assert.equal(validateSolution(puzzle,result.solution!).valid,true,puzzle.code);
  }
});

test('assembly check detects cyclic interlocking and orders lower pieces first', () => {
  const a = {pieceId:1,cubes:[[0,0,0],[1,0,1]] as Voxel[]};
  const b = {pieceId:2,cubes:[[0,0,1],[1,0,0]] as Voxel[]};
  assert.equal(assemblyOrder([a,b]),null);
  const lower = {pieceId:1,cubes:[[0,0,0]] as Voxel[]};
  const upper = {pieceId:2,cubes:[[0,0,1]] as Voxel[]};
  assert.deepEqual(assemblyOrder([upper,lower]),[lower,upper]);
});

test('validator rejects gaps, overlap, wrong pieces and out-of-bounds placements', () => {
  const puzzle = puzzles[0];
  assert.equal(validateSolution(puzzle,puzzle.solution.slice(1)).valid,false);
  const overlap = structuredClone(puzzle.solution);
  overlap[1].cubes = structuredClone(overlap[0].cubes);
  assert.equal(validateSolution(puzzle,overlap).valid,false);
  const outside = structuredClone(puzzle.solution);
  outside[0].cubes = outside[0].cubes.map(([x,y,z])=>[x+50,y,z]);
  assert.equal(validateSolution(puzzle,outside).valid,false);
  const wrong = structuredClone(puzzle.solution);
  wrong[0].pieceId = 99;
  assert.equal(validateSolution(puzzle,wrong).valid,false);
});

test('unsolvable boards fail; search budget exhaustion is not a solvability verdict', () => {
  // Correct volume, but the five-cell gate cannot fit a one-cell-wide prism.
  const impossible = { footprint:[[0,0],[1,0],[2,0],[3,0],[4,0]] as [number,number][],pieceIds:[4,4] };
  const result = solve(impossible);
  assert.equal(result.solution,null);
  assert.equal(result.exhausted,true);
  const timedOut = solve(puzzles[0],0);
  assert.equal(timedOut.solution,null);
  assert.equal(timedOut.exhausted,false);
  assert.throws(()=>solve({footprint:[[0,0],[3,0]],pieceIds:[15]}),/face-connected/);
});

test('code lookup is case-insensitive and round selection is repeatable', () => {
  assert.equal(getPuzzle(' w3-e-001 ')?.code,'W3-E-001');
  assert.equal(getPuzzle('F3-E-001'),undefined);
  assert.equal(getPuzzle('F3-H-048'),undefined);
  assert.equal(getPuzzle('nonsense'),undefined);
  assert.deepEqual(selectRound(8,'hard',42).map(p=>p.code),selectRound(8,'hard',42).map(p=>p.code));
});

test('every player count from two to eight and both difficulties fit the real inventory across many rounds', () => {
  for (let count=2;count<=8;count++) for (const difficulty of ['easy','hard'] as const) for (let seed=0;seed<20;seed++) {
    const round = selectRound(count,difficulty,seed);
    assert.equal(round.length,count);
    assert.equal(new Set(round.map(p=>p.code)).size,count);
    const used = new Map<number,number>();
    for (const puzzle of round) for (const id of puzzle.pieceIds) used.set(id,(used.get(id)??0)+1);
    assert.ok(round.every(p=>p.difficulty===difficulty && isPlayablePuzzle(p)));
    for (const piece of pieces) assert.ok((used.get(piece.id)??0) <= (count<=4?piece.quantity4:piece.quantity8));
  }
  assert.throws(()=>selectRound(2,'easy',1,{}),/Not enough pieces/);
  assert.throws(()=>selectRound(3,'hard',1,{}),/Not enough pieces/);
  assert.throws(()=>selectRound(8,'hard',1,{}),/Not enough pieces/);
  for(const count of [1,9,2.5,Number.NaN,Number.POSITIVE_INFINITY]) {
    assert.throws(()=>selectRound(count,'easy'),/2 and 8/);
  }
});

test('global colour rule rejects repeated colour groups and incorrect difficulty counts', () => {
  assert.equal(isPlayablePuzzle({difficulty:'easy',pieceIds:[1,8,15]}),true);
  assert.equal(isPlayablePuzzle({difficulty:'hard',pieceIds:[1,8,10,15]}),true);
  assert.equal(isPlayablePuzzle({difficulty:'easy',pieceIds:[1,2,15]}),false);
  assert.equal(isPlayablePuzzle({difficulty:'hard',pieceIds:[1,2,8,15]}),false);
  assert.equal(isPlayablePuzzle({difficulty:'easy',pieceIds:[1,8,10,15]}),false);
  assert.equal(isPlayablePuzzle({difficulty:'hard',pieceIds:[1,8,15]}),false);
  assert.equal(isPlayablePuzzle({difficulty:'easy',pieceIds:[1,8,99]}),false);
  const invalid={...puzzles[0],code:'W3-E-999',pieceIds:[1,2,15]};
  puzzles.push(invalid);
  try {
    assert.equal(getPuzzle(invalid.code),undefined);
    for(let seed=0;seed<20;seed++) assert.ok(selectRound(8,'easy',seed).every(p=>p.code!==invalid.code));
  } finally {
    puzzles.pop();
  }
});

test('validation report accounts for every candidate and reflects the full catalogue diversity', () => {
  assert.equal(report.puzzles,1000);
  assert.equal(report.independentlySolved,1000);
  assert.equal(report.witnessesValidated,1000);
  assert.equal(report.verticalAssemblyVerified,1000);
  assert.equal(report.uniqueColourVerified,1000);
  assert.equal(report.attempts,report.puzzles+report.rejectedUnsolvable+report.rejectedBudget+report.rejectedAssembly+report.rejectedDuplicate);
  for (const difficulty of ['easy','hard'] as const) {
    const category=puzzles.filter(p=>p.code.startsWith('W3-')&&p.difficulty===difficulty);
    assert.equal(report.diversity[difficulty].puzzles,500);
    assert.equal(report.diversity[difficulty].uniqueFootprints,new Set(category.map(p=>footprintKey(p.footprint))).size);
    assert.equal(report.diversity[difficulty].uniquePieceSets,new Set(category.map(p=>p.pieceIds.join(','))).size);
    assert.deepEqual([...new Set(category.flatMap(p=>p.pieceIds))].sort((a,b)=>a-b),pieces.map(p=>p.id));
  }
  assert.ok(report.diversity.easy.uniqueFootprints>=80);
  assert.ok(report.diversity.hard.uniqueFootprints>=200);
});
