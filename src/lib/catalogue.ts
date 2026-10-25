import type { Puzzle } from './puzzles';

type PublishedPuzzle = Pick<Puzzle, 'code' | 'difficulty' | 'footprint' | 'pieceIds'>;
function meaning(puzzle: PublishedPuzzle): string {
  return JSON.stringify({
    difficulty: puzzle.difficulty,
    footprint: [...puzzle.footprint].sort((a,b) => a[1]-b[1] || a[0]-b[0]),
    pieceIds: [...puzzle.pieceIds].sort((a,b) => a-b),
  });
}

/** Refuse an incompatible regeneration before any published files are overwritten. */
export function assertPublishedCatalogueUnchanged(previous: PublishedPuzzle[], next: PublishedPuzzle[]): void {
  const candidates = new Map<string, PublishedPuzzle>();
  for (const puzzle of next) {
    if (candidates.has(puzzle.code)) throw new Error(`Duplicate puzzle code: ${puzzle.code}`);
    candidates.set(puzzle.code, puzzle);
  }
  for (const puzzle of previous) {
    const candidate = candidates.get(puzzle.code);
    if (!candidate || meaning(candidate) !== meaning(puzzle)) {
      throw new Error(`Refusing to change published puzzle ${puzzle.code}. Preserve existing puzzles and use new codes for new challenges.`);
    }
  }
}
