import { getPiece, type Voxel } from './pieces';
import { normalize, orientations, shapeKey, targetVoxels, validateSolution, type Placement, type PuzzleGeometry } from './solver';

export type RotationAxis = 'x' | 'y' | 'z';
export type PlacementFailure = 'outside' | 'overlap' | 'duplicate' | 'shape';
export interface PlacementCheck {
  valid: boolean;
  reason?: PlacementFailure;
  /** Absolute target cubes, useful for a preview even when outside or overlapping. */
  cubes: Voxel[];
}

const voxelKey = (voxel: Voxel) => voxel.join(',');
function integerCubes(cubes: Voxel[]): boolean {
  return cubes.length > 0 && cubes.every(cube => cube.length === 3 && cube.every(Number.isSafeInteger))
    && new Set(cubes.map(voxelKey)).size === cubes.length;
}
function rigidPiece(pieceId: number, cubes: Voxel[]): boolean {
  if (!integerCubes(cubes)) return false;
  try {
    return orientations(getPiece(pieceId).cubes).some(shape => shapeKey(shape) === shapeKey(cubes));
  } catch {
    return false;
  }
}

/** Positive right-handed quarter turn, with the bounding corner reset to (0,0,0). */
export function rotateCubes(cubes: Voxel[], axis: RotationAxis): Voxel[] {
  if (!['x','y','z'].includes(axis)) throw new Error('Rotation axis must be x, y, or z.');
  if (!integerCubes(cubes)) throw new Error('A rotation requires distinct integer cube coordinates.');
  return normalize(cubes.map(([x,y,z]): Voxel => {
    if (axis === 'x') return [x,-z,y];
    if (axis === 'y') return [z,y,-x];
    return [-y,x,z];
  }));
}

/**
 * Check a manual placement without changing any arguments.
 * The anchor is the minimum x/y/z corner of the rotated shape, not a grabbed cube.
 * Partial arrangements may have unsupported cells: this is a grid editor, not gravity physics.
 */
export function canPlace(
  puzzle: PuzzleGeometry,
  placements: Placement[],
  pieceId: number,
  orientation: Voxel[],
  anchor: Voxel,
): PlacementCheck {
  if (!rigidPiece(pieceId, orientation) || !puzzle.pieceIds.includes(pieceId)) return {valid:false,reason:'shape',cubes:[]};
  if (anchor.length !== 3 || !anchor.every(Number.isSafeInteger)) return {valid:false,reason:'outside',cubes:[]};
  const cubes = normalize(orientation).map(([x,y,z]): Voxel => [x+anchor[0],y+anchor[1],z+anchor[2]]);
  const reject = (reason: PlacementFailure): PlacementCheck => ({valid:false,reason,cubes});
  const allowedCounts = new Map<number,number>();
  for (const id of puzzle.pieceIds) allowedCounts.set(id,(allowedCounts.get(id) ?? 0)+1);
  const usedCounts = new Map<number,number>();
  for (const placement of placements) usedCounts.set(placement.pieceId,(usedCounts.get(placement.pieceId) ?? 0)+1);
  if ((usedCounts.get(pieceId) ?? 0) >= (allowedCounts.get(pieceId) ?? 0)) return reject('duplicate');
  for (const [id,count] of usedCounts) {
    if (!allowedCounts.has(id)) return reject('shape');
    if (count > allowedCounts.get(id)!) return reject('duplicate');
  }
  const target = new Set(targetVoxels(puzzle.footprint).map(voxelKey));
  const occupied = new Set<string>();
  for (const placement of placements) {
    if (!rigidPiece(placement.pieceId,placement.cubes)) return reject('shape');
    for (const cube of placement.cubes) {
      const key = voxelKey(cube);
      if (!target.has(key)) return reject('outside');
      if (occupied.has(key)) return reject('overlap');
      occupied.add(key);
    }
  }
  if (cubes.some(cube => !target.has(voxelKey(cube)))) return reject('outside');
  if (cubes.some(cube => occupied.has(voxelKey(cube)))) return reject('overlap');
  return {valid:true,cubes};
}

/** Any legal full fill wins, including solutions different from the saved example. */
export function completion(puzzle: PuzzleGeometry, placements: Placement[]): boolean {
  try {
    return validateSolution(puzzle,placements).valid;
  } catch {
    return false;
  }
}
