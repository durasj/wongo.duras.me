import test from 'node:test';
import assert from 'node:assert/strict';
import { pieces, getPiece, type Voxel } from '../src/lib/pieces';
import { puzzles } from '../src/lib/puzzles';
import { canPlace, completion, rotateCubes, type RotationAxis } from '../src/lib/practice';
import { normalize, orientations, shapeKey, solve, type Placement, type PuzzleGeometry } from '../src/lib/solver';

function anchorOf(cubes: Voxel[]): Voxel {
  return [0,1,2].map(axis=>Math.min(...cubes.map(cube=>cube[axis]))) as Voxel;
}

test('manual practice can reconstruct every published solution one piece at a time', () => {
  let upperAnchors = 0;
  for (const puzzle of puzzles) {
    const placed: Placement[] = [];
    assert.equal(completion(puzzle,placed),false);
    for (const placement of puzzle.solution) {
      const anchor = anchorOf(placement.cubes);
      if (anchor[2] === 1) upperAnchors++;
      const checked = canPlace(puzzle,placed,placement.pieceId,normalize(placement.cubes),anchor);
      assert.equal(checked.valid,true,`${puzzle.code}: ${checked.reason}`);
      placed.push({pieceId:placement.pieceId,cubes:checked.cubes});
      assert.equal(completion(puzzle,placed),placed.length===puzzle.solution.length,puzzle.code);
    }
  }
  assert.ok(upperAnchors>0,'Must exercise flat pieces anchored in the upper layer');
});

test('quarter turns preserve all pieces, return after four turns, and reach every proper orientation', () => {
  for (const piece of pieces) {
    for (const axis of ['x','y','z'] as RotationAxis[]) {
      let cubes = structuredClone(piece.cubes);
      for (let turn=0;turn<4;turn++) cubes=rotateCubes(cubes,axis);
      assert.deepEqual(cubes,normalize(piece.cubes));
    }
    const queue = [normalize(piece.cubes)], visited = new Set<string>();
    while (queue.length) {
      const next=queue.pop()!,key=shapeKey(next);
      if (visited.has(key)) continue;
      visited.add(key);
      for (const axis of ['x','y','z'] as RotationAxis[]) queue.push(rotateCubes(next,axis));
    }
    assert.deepEqual([...visited].sort(),orientations(piece.cubes).map(shapeKey).sort());
  }
});

const board: PuzzleGeometry = {
  footprint:Array.from({length:16},(_,i)=>[i%4,Math.floor(i/4)] as [number,number]),
  pieceIds:[15,16],
};

test('manual placement rejects overlaps, duplicates, unknown pieces, gaps and bounds violations', () => {
  const first=canPlace(board,[],15,getPiece(15).cubes,[0,0,0]);
  assert.equal(first.valid,true);
  const placements=[{pieceId:15,cubes:first.cubes}];
  assert.equal(canPlace(board,placements,16,getPiece(16).cubes,[0,0,0]).reason,'overlap');
  assert.equal(canPlace(board,placements,15,getPiece(15).cubes,[1,0,0]).reason,'duplicate');
  assert.equal(canPlace(board,[],99,getPiece(16).cubes,[0,0,0]).reason,'shape');
  assert.equal(canPlace(board,[],8,getPiece(8).cubes,[0,0,0]).reason,'shape');
  assert.equal(canPlace(board,[],16,getPiece(16).cubes,[-1,0,0]).reason,'outside');
  assert.equal(canPlace(board,[],16,getPiece(16).cubes,[0,0,2]).reason,'outside');
  assert.equal(canPlace(board,[],16,getPiece(16).cubes,[0.5,0,0]).reason,'outside');
  assert.equal(completion(board,placements),false);
  const hole={footprint:[[0,0],[0,1],[0,2]] as [number,number][],pieceIds:[16]};
  assert.equal(canPlace(hole,[],16,getPiece(16).cubes,[0,0,0]).reason,'outside');
});

test('shape validation rejects mirrored chiral pieces and deformed or repeated cubes', () => {
  const piece=pieces.find(p=>!orientations(p.cubes).some(shape=>shapeKey(shape)===shapeKey(p.cubes.map(([x,y,z])=>[-x,y,z]))))!;
  assert.ok(piece,'Catalogue must contain chiral test geometry');
  const puzzle={...board,pieceIds:[piece.id]};
  assert.equal(canPlace(puzzle,[],piece.id,piece.cubes.map(([x,y,z])=>[-x,y,z]),[0,0,0]).reason,'shape');
  assert.equal(canPlace(board,[],16,[[0,0,0],[0,0,0],[0,1,0],[0,2,0]],[0,0,0]).reason,'shape');
  assert.equal(canPlace(board,[],16,[[0,0,0],[0,1,0],[0,2,0],[2,0,0]],[0,0,0]).reason,'shape');
  assert.throws(()=>rotateCubes([], 'x'),/integer/);
  assert.throws(()=>rotateCubes([[0.5,0,0]],'x'),/integer/);
});

test('practice is pure, normalizes anchor semantics, and permits unsupported partial upper layers', () => {
  const shape=getPiece(16).cubes.map(([x,y,z])=>[x+10,y-20,z+40] as Voxel);
  const before=structuredClone(shape), placements: Placement[]=[];
  const checked=canPlace(board,placements,16,shape,[0,0,1]);
  assert.equal(checked.valid,true);
  assert.ok(checked.cubes.every(cube=>cube[2]===1));
  assert.deepEqual(shape,before);
  assert.deepEqual(placements,[]);
  assert.deepEqual(rotateCubes(shape,'z'),rotateCubes(getPiece(16).cubes,'z'));
});

test('completion accepts a solver-generated fill rather than requiring the saved witness', () => {
  const puzzle=puzzles.find(p=>p.code==='F3-H-001')!;
  const result=solve(puzzle);
  assert.ok(result.solution);
  assert.equal(completion(puzzle,result.solution!),true);
  const corrupted=structuredClone(result.solution!);
  corrupted[0].cubes[0][2]=2;
  assert.equal(completion(puzzle,corrupted),false);
});
