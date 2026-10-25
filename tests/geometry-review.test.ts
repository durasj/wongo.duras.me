import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pieces, type Voxel } from '../src/lib/pieces';
import { orientations } from '../src/lib/solver';

// Independent group construction: compose physical quarter turns, rather than
// sharing the solver/exporter's signed-permutation implementation.
function canonical(cubes: Voxel[]): string {
  const mins = [0, 1, 2].map(axis => Math.min(...cubes.map(v => v[axis])));
  return cubes.map(v => v.map((n, axis) => n - mins[axis]).join(','))
    .sort().join(';');
}
function quarterTurns(cubes: Voxel[]): Map<string, Voxel[]> {
  const seen = new Map([[canonical(cubes), cubes]]);
  const queue = [cubes];
  for (const shape of queue) for (let axis = 0; axis < 3; axis++) {
    const rotated = shape.map(([x, y, z]) =>
      ([[x, -z, y], [z, y, -x], [-y, x, z]] as Voxel[])[axis]);
    const signature = canonical(rotated);
    if (!seen.has(signature)) { seen.set(signature, rotated); queue.push(rotated); }
  }
  return seen;
}

test('physical quarter turns agree with solver orientations for every shape', () => {
  assert.deepEqual(pieces.map(p => quarterTurns(p.cubes).size),
    [24,12,12,12,24,24,24,12,24,12,12,12,24,24,12,24]);
  for (const piece of pieces) {
    assert.deepEqual(new Set(orientations(piece.cubes).map(canonical)),
      new Set(quarterTurns(piece.cubes).keys()), `Piece ${piece.id}`);
  }
});

test('distinct handed pieces stay distinct; source chirality is preserved', () => {
  for (const [a, b] of [[2,11],[3,10],[5,14],[6,13]]) {
    const left = pieces.find(p => p.id === a)!;
    const right = pieces.find(p => p.id === b)!;
    assert.ok(!quarterTurns(left.cubes).has(canonical(right.cubes)));
    const mirrored = left.cubes.map(([x,y,z]) => [-x,y,z] as Voxel);
    assert.ok(quarterTurns(mirrored).has(canonical(right.cubes)));
  }
  const signatures = pieces.map(p => [...quarterTurns(p.cubes).keys()].sort()[0]);
  assert.equal(new Set(signatures).size, 16);
});

type Triangle = [Voxel, Voxel, Voxel];
function triangles(text: string): Triangle[] {
  const vertices = [...text.matchAll(/vertex\s+([-\d.e+]+)\s+([-\d.e+]+)\s+([-\d.e+]+)/g)]
    .map(m => [Number(m[1]), Number(m[2]), Number(m[3])] as Voxel);
  assert.equal(vertices.length % 3, 0);
  return Array.from({ length: vertices.length / 3 }, (_, i) =>
    vertices.slice(i*3, i*3+3) as Triangle);
}
// Cast an x-directed ray through a non-edge point. This independently recovers
// the solid lattice from the actual STL, rather than trusting its manifest.
function rayInside(point: Voxel, mesh: Triangle[]): boolean {
  const hits: number[] = [];
  for (const [a,b,c] of mesh) {
    if (a[0] !== b[0] || a[0] !== c[0] || a[0] <= point[0]) continue;
    const u = [b[1]-a[1], b[2]-a[2]], v = [c[1]-a[1], c[2]-a[2]];
    const d = [point[1]-a[1], point[2]-a[2]];
    const det = u[0]*v[1]-u[1]*v[0];
    const s = (d[0]*v[1]-d[1]*v[0])/det;
    const t = (u[0]*d[1]-u[1]*d[0])/det;
    if (s >= 0 && t >= 0 && s+t <= 1) hits.push(a[0]);
  }
  return new Set(hits).size % 2 === 1;
}

test('all exported STLs reconstruct the canonical shape using physical rotations only', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/downloads/pieces/manifest.json', import.meta.url), 'utf8'));
  for (const entry of manifest.pieces) {
    const text = readFileSync(new URL(`../public/downloads/pieces/${entry.filename}`, import.meta.url), 'utf8');
    const mesh = triangles(text), unit: number = entry.unitMm;
    const recovered: Voxel[] = [];
    const bounds = [0,1,2].map(axis => Math.max(...mesh.flat().map(v => v[axis]))/unit);
    for (let x=0;x<bounds[0];x++) for (let y=0;y<bounds[1];y++) for (let z=0;z<bounds[2];z++) {
      if (rayInside([(x+.529)*unit,(y+.371)*unit,(z+.613)*unit], mesh)) recovered.push([x,y,z]);
    }
    const source = pieces.find(p => p.id === entry.id)!;
    assert.equal(recovered.length, source.cubes.length, `Piece ${entry.id} STL volume`);
    assert.ok(quarterTurns(source.cubes).has(canonical(recovered)), `Piece ${entry.id} STL handedness`);
    const set = new Set(recovered.map(v => v.join(',')));
    for (const [x,y,z] of recovered) {
      assert.ok(z===0 || set.has([x,y,z-1].join(',')), `Piece ${entry.id} needs support`);
    }
    // Compare signed closed-surface volume without exporter validation metadata.
    let volume=0;
    for (const [a,b,c] of mesh) volume += (a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    assert.ok(Math.abs(volume-source.cubes.length*(unit**3-6*unit*(entry.chamferMm??0)**2+16/3*(entry.chamferMm??0)**3))<1e-5);
  }
});
