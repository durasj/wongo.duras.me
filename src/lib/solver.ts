import { getPiece, type Voxel } from './pieces';

export type Footprint = [number, number][];
export interface Placement { pieceId: number; cubes: Voxel[] }
export interface PuzzleGeometry { footprint: Footprint; pieceIds: number[] }
export interface SolveResult { solution: Placement[] | null; nodes: number; exhausted: boolean }

const key = (v: readonly number[]) => v.join(',');
export function normalize(cubes: Voxel[]): Voxel[] {
  if (!cubes.length) return [];
  const mins = [0, 1, 2].map(axis => Math.min(...cubes.map(v => v[axis])));
  return cubes.map(v => v.map((n, axis) => n - mins[axis]) as Voxel)
    .sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0]);
}
export function shapeKey(cubes: Voxel[]): string { return normalize(cubes).map(key).join(';'); }

/** The rotation group of the cube: determinant +1 only, never mirror a piece. */
export function orientations(cubes: Voxel[]): Voxel[][] {
  const result = new Map<string, Voxel[]>();
  const permutations = [[0,1,2], [0,2,1], [1,0,2], [1,2,0], [2,0,1], [2,1,0]];
  for (const p of permutations) {
    let inversions = 0;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (p[i] > p[j]) inversions++;
    for (const sx of [-1,1]) for (const sy of [-1,1]) for (const sz of [-1,1]) {
      if ((inversions % 2 ? -1 : 1) * sx * sy * sz !== 1) continue;
      const rotated = normalize(cubes.map(v => [sx*v[p[0]], sy*v[p[1]], sz*v[p[2]]]));
      result.set(shapeKey(rotated), rotated);
    }
  }
  return [...result.values()];
}

export function targetVoxels(footprint: Footprint): Voxel[] {
  return footprint.flatMap(([x,y]) => [[x,y,0], [x,y,1]] as Voxel[]);
}

export function isConnected(cells: number[][]): boolean {
  if (!cells.length) return false;
  const all = new Set(cells.map(key)), visited = new Set<string>(), queue = [cells[0]];
  while (queue.length) {
    const cell = queue.pop()!;
    const k = key(cell);
    if (visited.has(k)) continue;
    visited.add(k);
    for (let axis = 0; axis < cell.length; axis++) for (const delta of [-1,1]) {
      const neighbor = [...cell]; neighbor[axis] += delta;
      if (all.has(key(neighbor)) && !visited.has(key(neighbor))) queue.push(neighbor);
    }
  }
  return visited.size === all.size;
}

function assertGeometry(puzzle: PuzzleGeometry): void {
  if (!puzzle.footprint.length || new Set(puzzle.footprint.map(key)).size !== puzzle.footprint.length)
    throw new Error('Footprint must be nonempty with unique cells');
  if (puzzle.footprint.some(cell => cell.length !== 2 || cell.some(n => !Number.isInteger(n))))
    throw new Error('Footprint requires integer grid coordinates');
  if (!isConnected(puzzle.footprint)) throw new Error('Footprint must be face-connected');
  if (!puzzle.pieceIds.length) throw new Error('At least one piece is required');
  for (const id of puzzle.pieceIds) getPiece(id);
}

/** Independent exact-cover search from an empty target; no generated solution is supplied. */
export function solve(puzzle: PuzzleGeometry, maxNodes = 1_000_000): SolveResult {
  assertGeometry(puzzle);
  const target = targetVoxels(puzzle.footprint);
  if (puzzle.pieceIds.reduce((sum, id) => sum + getPiece(id).cubes.length, 0) !== target.length)
    return { solution: null, nodes: 0, exhausted: true };
  const targetMap = new Map(target.map((voxel, index) => [key(voxel), index]));
  const fullMask = (1n << BigInt(target.length)) - 1n;
  const maxX = Math.max(...target.map(v => v[0]));
  const minX = Math.min(...target.map(v => v[0]));
  const maxY = Math.max(...target.map(v => v[1]));
  const minY = Math.min(...target.map(v => v[1]));
  const possible: { occurrence: number; mask: bigint; placement: Placement }[] = [];
  for (let occurrence = 0; occurrence < puzzle.pieceIds.length; occurrence++) {
    const pieceId = puzzle.pieceIds[occurrence];
    for (const shape of orientations(getPiece(pieceId).cubes)) {
      const width = 1 + Math.max(...shape.map(v => v[0]));
      const depth = 1 + Math.max(...shape.map(v => v[1]));
      const height = 1 + Math.max(...shape.map(v => v[2]));
      for (let z = 0; z <= 2-height; z++) for (let y = minY; y <= maxY-depth+1; y++) for (let x = minX; x <= maxX-width+1; x++) {
        const cubes = shape.map(v => [v[0]+x,v[1]+y,v[2]+z] as Voxel);
        let mask = 0n;
        for (const cube of cubes) {
          const index = targetMap.get(key(cube));
          if (index === undefined) { mask = 0n; break; }
          mask |= 1n << BigInt(index);
        }
        if (mask) possible.push({ occurrence, mask, placement: { pieceId, cubes } });
      }
    }
  }
  const byVoxel = target.map((_, index) => possible.filter(p => (p.mask & (1n << BigInt(index))) !== 0n));
  let nodes = 0, limitReached = false;
  const failed = new Set<string>();
  function visit(occupied: bigint, used: number, selected: Placement[]): Placement[] | null {
    if (++nodes > maxNodes) { limitReached = true; return null; }
    if (occupied === fullMask) return selected;
    const state = `${occupied}:${used}`;
    if (failed.has(state)) return null;
    let choices: typeof possible | undefined;
    for (let i = 0; i < target.length; i++) {
      if ((occupied & (1n << BigInt(i))) !== 0n) continue;
      const candidates = byVoxel[i].filter(p => !(used & (1 << p.occurrence)) && !(p.mask & occupied));
      if (!candidates.length) return null;
      if (!choices || candidates.length < choices.length) choices = candidates;
    }
    for (const candidate of choices ?? []) {
      const answer = visit(occupied | candidate.mask, used | (1 << candidate.occurrence), [...selected,candidate.placement]);
      if (answer) return answer;
      if (limitReached) return null;
    }
    failed.add(state);
    return null;
  }
  return { solution: visit(0n, 0, []), nodes, exhausted: !limitReached };
}

/** Check a witness independently: piece multiset, rigid rotations, overlap and exact coverage. */
export function validateSolution(puzzle: PuzzleGeometry, solution: Placement[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  try { assertGeometry(puzzle); } catch (error) { return { valid: false, errors: [String(error)] }; }
  if ([...puzzle.pieceIds].sort((a,b)=>a-b).join(',') !== solution.map(p=>p.pieceId).sort((a,b)=>a-b).join(',')) errors.push('Wrong piece multiset');
  const target = new Set(targetVoxels(puzzle.footprint).map(key)), occupied = new Set<string>();
  for (const placement of solution) {
    let piece;
    try { piece = getPiece(placement.pieceId); } catch { errors.push('Unknown piece'); continue; }
    if (placement.cubes.some(v => v.length !== 3 || v.some(n => !Number.isInteger(n)))) errors.push('Noninteger placement');
    if (!orientations(piece.cubes).some(shape => shapeKey(shape) === shapeKey(placement.cubes))) errors.push(`Piece ${piece.id} is deformed or mirrored`);
    for (const cube of placement.cubes) {
      const k = key(cube);
      if (!target.has(k)) errors.push('Cube outside the target');
      if (occupied.has(k)) errors.push('Overlapping cubes');
      occupied.add(k);
    }
  }
  if (occupied.size !== target.size || [...target].some(k => !occupied.has(k))) errors.push('Target has gaps');
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

/** Conservative assembly proof: an order that permits lowering every rigid piece vertically. */
export function assemblyOrder(solution: Placement[]): Placement[] | null {
  const owner = new Map<string,number>();
  solution.forEach((placement,index) => placement.cubes.forEach(cube => owner.set(key(cube),index)));
  const before = solution.map(() => new Set<number>());
  for (const [cell,upperOwner] of owner) {
    const [x,y,z] = cell.split(',').map(Number);
    if (z !== 1) continue;
    const lowerOwner = owner.get(key([x,y,0]));
    if (lowerOwner !== undefined && lowerOwner !== upperOwner) before[upperOwner].add(lowerOwner);
  }
  const result: Placement[] = [], used = new Set<number>();
  while (result.length < solution.length) {
    const next = solution.findIndex((_,index) => !used.has(index) && [...before[index]].every(dependency=>used.has(dependency)));
    if (next === -1) return null;
    result.push(solution[next]); used.add(next);
  }
  return result;
}

/** Canonical footprint under square-grid rotations/reflections, for conservative deduplication. */
export function footprintKey(footprint: Footprint): string {
  const variants: string[] = [];
  for (const flip of [-1,1]) for (let turn = 0; turn < 4; turn++) {
    const cells = footprint.map(([x,y]) => {
      let a = x*flip, b = y;
      for (let i = 0; i < turn; i++) [a,b] = [-b,a];
      return [a,b];
    });
    const minX = Math.min(...cells.map(v=>v[0])), minY = Math.min(...cells.map(v=>v[1]));
    variants.push(cells.map(([x,y])=>[x-minX,y-minY]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]).map(key).join(';'));
  }
  return variants.sort()[0];
}
