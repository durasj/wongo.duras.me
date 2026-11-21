import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('card illustrations show a physical quarter-turn of every print-bed shape', () => {
  const read = (p: string) => readFileSync('public/downloads/'+p,'utf8');
  const html = read('puzzles/wongo-d6-20mm.html');
  for (const piece of JSON.parse(read('pieces/manifest.json')).pieces) {
    const symbol = html.match(new RegExp('<symbol id="piece-'+piece.id+'"[^>]*>(.*?)</symbol>'))![1];
    const polygons = [...symbol.matchAll(/<polygon points="([^"]+)"/g)];
    // The first face for every cube is its +X face. Its first vertex
    // is the near lower X corner at (x+1,y,z).
    const anchors = polygons.filter((_,i)=>i%3===0).map(m=>m[1].split(' ')[0]);
    let cubes: number[][] = piece.printCubes;
    let matches = false;
    for (let turn=0;turn<4;turn++) {
      const expected = cubes.map(([x,y,z])=>[28*(y-x-1),14*(x+1+y)-28*z].join(','));
      if (expected.sort().join(';') === [...anchors].sort().join(';')) matches = true;
      cubes = cubes.map(([x,y,z])=>[-y,x,z]);
    }
    assert.ok(matches,'Incorrect printed view for #'+piece.id);
  }
});
