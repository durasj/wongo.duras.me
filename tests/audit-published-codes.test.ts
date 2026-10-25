import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import archive from '../src/data/legacy-puzzles.json';
import { puzzles, getPuzzle } from '../src/lib/puzzles';
import { pieces } from '../src/lib/pieces';
import { orientations, shapeKey } from '../src/lib/solver';

test('published piece IDs retain their exact physical shapes, including handedness', () => {
  const shapes=pieces.map(piece=>({id:piece.id,shape:orientations(piece.cubes).map(shapeKey).sort()[0]})).sort((a,b)=>a.id-b.id);
  assert.equal(createHash('sha256').update(JSON.stringify(shapes)).digest('hex'),
    'bdb969938022e69b0f22261ff776823203a96d69c52505cb4fefc17fd0cedd80',
    'Physical piece shapes changed. Existing printed cards and pieces must remain compatible.');
});

// F3 codes are retired from play under the new global colour rule, but their
// historical meanings remain unchanged in the immutable source archive.
test('retired F3 archive preserves every byte and original puzzle meaning without exposing it for play', () => {
  assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/legacy-puzzles.json',import.meta.url))).digest('hex'),
    'ff7b5467ab7059587ef75f1faf1a6b1425826a701c0a2ce2aad41cde49292335');
  assert.equal(archive.length,96);
  const published = [];
  for (const category of ['E', 'H']) for (let n=1; n<=48; n++) {
    const code = `F3-${category}-${String(n).padStart(3, '0')}`;
    const puzzle = archive.find(p=>p.code===code);
    assert.ok(puzzle, `Published code removed: ${code}`);
    assert.equal(archive.filter(p => p.code === code).length, 1, `Ambiguous code: ${code}`);
    assert.equal(getPuzzle(code),undefined,`Retired code still searchable: ${code}`);
    assert.ok(!puzzles.some(p=>p.code===code),`Retired code in active pool: ${code}`);
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

// Solutions/metrics are deliberately excluded: a better valid witness is fine.
test('original 96 W3 codes retain their complete records and unique-colour meanings', () => {
  const original=puzzles.filter(puzzle=>Number(puzzle.code.slice(-3))<=48);
  assert.equal(original.length,96);
  assert.equal(createHash('sha256').update(JSON.stringify(original,null,2)+'\n').digest('hex'),
    'bc0c04d9aae44a55aaf118c5386451a22773f30eb0320feda73ee45123e03ce7',
    'The 1,000-puzzle expansion changed original W3 records or saved witnesses.');
  const published=[];
  for(const category of ['E','H']) for(let n=1;n<=48;n++) {
    const code=`W3-${category}-${String(n).padStart(3,'0')}`;
    const puzzle=getPuzzle(code);
    assert.ok(puzzle,`Published code removed: ${code}`);
    assert.equal(puzzles.filter(p=>p.code===code).length,1,`Ambiguous code: ${code}`);
    published.push({code:puzzle.code,difficulty:puzzle.difficulty,
      footprint:[...puzzle.footprint].sort((a,b)=>a[1]-b[1]||a[0]-b[0]),
      pieceIds:[...puzzle.pieceIds].sort((a,b)=>a-b)});
  }
  published.sort((a,b)=>a.code.localeCompare(b.code));
  assert.equal(createHash('sha256').update(JSON.stringify(published)).digest('hex'),
    'cf678194508431384925e799d877e56ed298c0493a85d6d44f335a090a106b3c',
    'Active W3 puzzle meanings changed. Preserve this catalogue and use a new namespace.');
});

test('all 1000 active W3 codes retain their expanded catalogue meanings', () => {
  const published=[];
  for(const category of ['E','H']) for(let n=1;n<=500;n++) {
    const code=`W3-${category}-${String(n).padStart(3,'0')}`;
    const puzzle=getPuzzle(code);
    assert.ok(puzzle,`Published code removed: ${code}`);
    assert.equal(puzzles.filter(p=>p.code===code).length,1,`Ambiguous code: ${code}`);
    published.push({code:puzzle.code,difficulty:puzzle.difficulty,
      footprint:[...puzzle.footprint].sort((a,b)=>a[1]-b[1]||a[0]-b[0]),
      pieceIds:[...puzzle.pieceIds].sort((a,b)=>a-b)});
  }
  published.sort((a,b)=>a.code.localeCompare(b.code));
  assert.equal(createHash('sha256').update(JSON.stringify(published)).digest('hex'),
    '6ee4ef6b16f727bbcb741aa05eedb3b792ca444a41069ae767a28b0bbe444952',
    'Expanded W3 puzzle meanings changed. Preserve this catalogue and use a new namespace.');
});
