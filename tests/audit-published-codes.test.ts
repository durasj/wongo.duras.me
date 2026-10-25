import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { puzzles, getPuzzle } from '../src/lib/puzzles';
import { pieces } from '../src/lib/pieces';
import { orientations, shapeKey } from '../src/lib/solver';

test('published piece IDs retain their exact physical shapes, including handedness', () => {
  const shapes=pieces.map(piece=>({id:piece.id,shape:orientations(piece.cubes).map(shapeKey).sort()[0]})).sort((a,b)=>a.id-b.id);
  assert.equal(createHash('sha256').update(JSON.stringify(shapes)).digest('hex'),
    'bdb969938022e69b0f22261ff776823203a96d69c52505cb4fefc17fd0cedd80',
    'Physical piece shapes changed. Existing printed cards and pieces must remain compatible.');
});

// These codes are published on printable cards. A future generator must keep
// their original meaning and add a new namespace for incompatible catalogues.
// Solutions/metrics are deliberately excluded: a better valid witness is fine.
test('published F3 v1 codes retain their original footprints and piece lists', () => {
  const published = [];
  for (const category of ['E', 'H']) for (let n=1; n<=48; n++) {
    const code = `F3-${category}-${String(n).padStart(3, '0')}`;
    const puzzle = getPuzzle(code);
    assert.ok(puzzle, `Published code removed: ${code}`);
    assert.equal(puzzles.filter(p => p.code === code).length, 1, `Ambiguous code: ${code}`);
    published.push({
      code: puzzle.code,
      difficulty: puzzle.difficulty,
      footprint: [...puzzle.footprint].sort((a,b) => a[1]-b[1] || a[0]-b[0]),
      pieceIds: [...puzzle.pieceIds].sort((a,b) => a-b),
    });
  }
  published.sort((a,b) => a.code.localeCompare(b.code));
  const digest = createHash('sha256').update(JSON.stringify(published)).digest('hex');
  assert.equal(digest, 'f29555e6d8aafac0b2c0869ace3c46e022afa51ed768b351be0d6794f622e5e5',
    'Published puzzle meanings changed. Preserve v1 data and publish new codes instead.');
});
