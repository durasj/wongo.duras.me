import catalogue from '../data/puzzles.json';
import { getPiece, pieces } from './pieces';
import type { Footprint, Placement } from './solver';

export type Difficulty = 'easy' | 'hard';
export interface Puzzle {
  code: string;
  difficulty: Difficulty;
  footprint: Footprint;
  pieceIds: number[];
  solution: Placement[];
  metrics?: { solverNodes: number; volume: number };
}
/** Global play rule: three distinct colour groups on easy, all four on hard. */
export function isPlayablePuzzle(puzzle: Pick<Puzzle, 'difficulty' | 'pieceIds'>): boolean {
  if (puzzle.difficulty !== 'easy' && puzzle.difficulty !== 'hard') return false;
  const requiredCount = puzzle.difficulty === 'easy' ? 3 : 4;
  if (puzzle.pieceIds.length !== requiredCount) return false;
  try {
    return new Set(puzzle.pieceIds.map(id => getPiece(id).color)).size === requiredCount;
  } catch {
    return false;
  }
}
const activeCode = /^W3-[EH]-\d{3}$/;
/** Retired F3 data is intentionally not imported into the application bundle. */
export const puzzles = (catalogue as Puzzle[]).filter(puzzle => activeCode.test(puzzle.code) && isPlayablePuzzle(puzzle));
export function getPuzzle(code: string): Puzzle | undefined {
  const normalized = code.trim().toUpperCase();
  if (!activeCode.test(normalized)) return undefined;
  return puzzles.find(puzzle => puzzle.code === normalized && isPlayablePuzzle(puzzle));
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Assign simultaneous challenges without exceeding the shared physical piece pool. */
export function selectRound(playerCount: number, difficulty: Difficulty, seed = 1, inventory?: Record<number, number>): Puzzle[] {
  if (!Number.isInteger(playerCount) || playerCount < 4 || playerCount > 8) throw new Error('Choose between 4 and 8 players.');
  if (!['easy','hard'].includes(difficulty)) throw new Error('Unknown difficulty.');
  const remaining = new Map(pieces.map(piece => [piece.id, inventory ? (inventory[piece.id] ?? 0) : (playerCount <= 4 ? piece.quantity4 : piece.quantity8)]));
  if ([...remaining.values()].some(n => !Number.isInteger(n) || n < 0)) throw new Error('Inventory quantities must be nonnegative integers.');
  const random = seededRandom(seed);
  const pool = puzzles.filter(p => p.difficulty === difficulty && activeCode.test(p.code) && isPlayablePuzzle(p));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i],pool[j]] = [pool[j],pool[i]];
  }
  const chosen: Puzzle[] = [];
  function search(start: number): boolean {
    if (chosen.length === playerCount) return true;
    if (pool.length-start < playerCount-chosen.length) return false;
    for (let i = start; i < pool.length; i++) {
      const puzzle = pool[i], counts = new Map<number,number>();
      for (const id of puzzle.pieceIds) counts.set(id,(counts.get(id) ?? 0)+1);
      if ([...counts].some(([id,count]) => (remaining.get(id) ?? 0) < count)) continue;
      for (const [id,count] of counts) remaining.set(id,remaining.get(id)!-count);
      chosen.push(puzzle);
      if (search(i+1)) return true;
      chosen.pop();
      for (const [id,count] of counts) remaining.set(id,remaining.get(id)!+count);
    }
    return false;
  }
  if (!search(0)) throw new Error('Not enough pieces or distinct puzzles for this round. Increase the inventory or change difficulty.');
  return chosen;
}
