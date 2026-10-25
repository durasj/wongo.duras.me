#!/usr/bin/env node
// Wongo geometry export. Shape catalogue adapted from ps78/Ubongo (GPL-3.0).
// This exporter is original implementation; see docs/PIECES.md for provenance.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('=')));
const unit = Number(args.unit ?? 15);
if (!Number.isFinite(unit) || unit <= 0 || unit > 100) throw new Error('--unit must be >0 and <=100 mm');
const output = args.out ? path.resolve(args.out) : path.join(root, 'public/downloads/pieces');
const pieces = JSON.parse(await readFile(path.join(root, 'src/data/pieces.json'), 'utf8'));
const key = (v) => v.join(',');
const normalize = (cubes) => {
  const mins = [0, 1, 2].map((axis) => Math.min(...cubes.map((v) => v[axis])));
  return cubes.map((v) => v.map((n, axis) => n - mins[axis])).sort((a,b) => key(a).localeCompare(key(b)));
};
const permutations = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const parity = (p) => ((p[0]>p[1]) + (p[0]>p[2]) + (p[1]>p[2])) % 2 ? -1 : 1;
const rotations = [];
for (const p of permutations) for (const sx of [-1,1]) for (const sy of [-1,1]) for (const sz of [-1,1]) {
  const signs = [sx,sy,sz];
  // Only determinant +1: never reflect a chiral piece.
  if (parity(p)*sx*sy*sz === 1) rotations.push((v) => p.map((axis,i) => signs[i]*v[axis]));
}
if (rotations.length !== 24) throw new Error('Expected 24 proper cube rotations');
const orientations = (cubes) => [...new Map(rotations.map((r) => {
  const c = normalize(cubes.map(r)); return [JSON.stringify(c), c];
})).values()];
const supported = (cubes) => {
  const occupied = new Set(cubes.map(key));
  return cubes.every(([x,y,z]) => z === 0 || occupied.has(key([x,y,z-1])));
};
const printOrientation = (cubes) => {
  const candidates = orientations(cubes).filter(supported).sort((a,b) =>
    Math.max(...a.map((v) => v[2])) - Math.max(...b.map((v) => v[2])) ||
    b.filter((v) => v[2] === 0).length - a.filter((v) => v[2] === 0).length ||
    JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (!candidates.length) throw new Error('No support-free orientation found');
  return candidates[0];
};
const faceDefinitions = [
  { n:[1,0,0], v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
  { n:[-1,0,0], v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]] },
  { n:[0,1,0], v:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]] },
  { n:[0,-1,0], v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
  { n:[0,0,1], v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
  { n:[0,0,-1], v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]] },
];
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub = (a,b) => a.map((n,i) => n-b[i]);
const dot = (a,b) => a.reduce((sum,n,i) => sum+n*b[i],0);
function mesh(cubes) {
  const occupied = new Set(cubes.map(key)); const triangles = [];
  for (const cube of cubes) for (const {n,v} of faceDefinitions) {
    if (occupied.has(key(cube.map((c,i) => c+n[i])))) continue;
    // Shared cube faces are omitted: this is the outer union surface.
    const quad = v.map((offset) => cube.map((c,i) => (c+offset[i])*unit));
    triangles.push({n,v:[quad[0],quad[1],quad[2]]},{n,v:[quad[0],quad[2],quad[3]]});
  }
  return triangles;
}
function validateMesh(triangles, cubeCount) {
  const edges = new Map(); let signedVolume = 0;
  for (const {n,v:[a,b,c]} of triangles) {
    if (dot(cross(sub(b,a),sub(c,a)),n) <= 0) throw new Error('Triangle has wrong winding');
    signedVolume += dot(a,cross(b,c))/6;
    for (const [start,end] of [[a,b],[b,c],[c,a]]) {
      const ka=key(start), kb=key(end), edge=ka<kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      const found=edges.get(edge) ?? {count:0,direction:0};
      found.count++; found.direction += ka<kb ? 1 : -1; edges.set(edge,found);
    }
  }
  if ([...edges.values()].some((e) => e.count !== 2 || e.direction !== 0)) throw new Error('STL is not a closed consistently oriented two-manifold');
  if (Math.abs(signedVolume-cubeCount*unit**3) > 1e-5) throw new Error('STL volume does not match catalogue');
  return {watertight:true,consistentlyOriented:true,triangles:triangles.length,volumeMm3:signedVolume};
}
function stl(name, triangles) {
  return [`solid ${name}`,...triangles.flatMap(({n,v}) => [
    `  facet normal ${n.join(' ')}`,'    outer loop',...v.map((p) => `      vertex ${p.join(' ')}`),'    endloop','  endfacet',
  ]),`endsolid ${name}`,''].join('\n');
}
function crc32(bytes) {
  let crc=0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
// Store-only ZIP: portable, deterministic, and no extra export dependencies.
function zip(files) {
  const locals=[], centrals=[]; let offset=0;
  for (const [name,content] of files) {
    const filename=Buffer.from(name), data=Buffer.from(content), crc=crc32(data);
    const local=Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20,4); local.writeUInt16LE(33,12);
    local.writeUInt32LE(crc,14); local.writeUInt32LE(data.length,18); local.writeUInt32LE(data.length,22); local.writeUInt16LE(filename.length,26);
    locals.push(local,filename,data);
    const central=Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20,4); central.writeUInt16LE(20,6); central.writeUInt16LE(33,14);
    central.writeUInt32LE(crc,16); central.writeUInt32LE(data.length,20); central.writeUInt32LE(data.length,24); central.writeUInt16LE(filename.length,28); central.writeUInt32LE(offset,42);
    centrals.push(central,filename); offset+=local.length+filename.length+data.length;
  }
  const directory=Buffer.concat(centrals), end=Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length,8); end.writeUInt16LE(files.length,10); end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,directory,end]);
}

await mkdir(output,{recursive:true});
const exports=[], entries=[], signatures=new Set();
for (const piece of pieces) {
  if (!Number.isInteger(piece.id) || piece.id < 1 || piece.id > 16) throw new Error('Invalid catalogue piece ID');
  if (piece.cubes.some((v) => v.length !== 3 || v.some((n) => !Number.isInteger(n) || n < 0))) throw new Error(`Invalid cube coordinates: ${piece.id}`);
  const occupied = new Set(piece.cubes.map(key));
  if (occupied.size !== piece.cubes.length) throw new Error(`Duplicate occupied cube: ${piece.id}`);
  const visited = new Set(), pending = [piece.cubes[0]];
  while (pending.length) {
    const cube = pending.pop(), k = key(cube);
    if (visited.has(k)) continue;
    visited.add(k);
    for (const {n} of faceDefinitions) {
      const neighbour = cube.map((c,i) => c+n[i]);
      if (occupied.has(key(neighbour)) && !visited.has(key(neighbour))) pending.push(neighbour);
    }
  }
  if (visited.size !== occupied.size) throw new Error(`Disconnected piece: ${piece.id}`);
  const signature=orientations(piece.cubes).map((o) => JSON.stringify(o)).sort()[0];
  if (signatures.has(signature)) throw new Error(`Duplicate shape under rotations: ${piece.id}`);
  signatures.add(signature);
  const cubes=printOrientation(piece.cubes), triangles=mesh(cubes), validation=validateMesh(triangles,cubes.length);
  const basename=`wongo-piece-${String(piece.id).padStart(2,'0')}-${piece.color}`;
  const data=stl(basename,triangles);
  const scad=`// Wongo piece ${piece.id}: ${piece.name}. GPL-3.0; see README.txt.\n// All cube positions derive from the canonical catalogue. z points up.\nunit = ${unit}; // mm, scale all pieces AND cards together\npositions = ${JSON.stringify(cubes)};\nunion() { for (p = positions) translate(p * unit) cube([unit, unit, unit]); }\n`;
  await writeFile(path.join(output,`${basename}.stl`),data); await writeFile(path.join(output,`${basename}.scad`),scad);
  entries.push([`${basename}.stl`,data],[`${basename}.scad`,scad]);
  exports.push({...piece,filename:`${basename}.stl`,scadFilename:`${basename}.scad`,unitMm:unit,printCubes:cubes,supportsRequired:false,dimensionsMm:[0,1,2].map((axis) => (Math.max(...cubes.map((v) => v[axis]))+1)*unit),validation});
}
const manifest={schemaVersion:1,unitMm:unit,shapeCount:pieces.length,inventory4:pieces.reduce((n,p) => n+p.quantity4,0),inventory8:pieces.reduce((n,p) => n+p.quantity8,0),pieces:exports};
const manifestText=JSON.stringify(manifest,null,2)+'\n';
const readme=`WONGO PRINTABLE PIECES\n\n16 distinct shapes. All STL files use millimetres; unit cube side ${unit} mm.\nEach STL is an outer union surface: no internal coincident faces.\nAll are oriented with flat supported layers; supports are not required for ideal geometry.\nPrint quantities are in manifest.json: quantity4 (40 total) or quantity8 (80 total).\nThese are a shared inventory, not 16 pieces per player.\n\nStart with PLA, 0.2 mm layers, 3 walls, 15-20% infill; use your filament profile.\nPrint a small fit sample before committing to the full set. Inspect first-layer flare.\nNo scale clearance or rounding is applied: STL retains the solver's exact geometry.\nSCAD files expose the unit size. Scale all pieces AND future puzzle cards together.\n\nGeometry data adapted from ps78/Ubongo blockfactory/blockfactory.go,\nblob 63c1a892046543f1973b375d3dfba89f90c8114e, GPL-3.0.\nSource: https://github.com/ps78/Ubongo\nWongo source and provenance: https://github.com/durasj/wongo.duras.me\nGame concept: Grzegorz Rejchtman / KOSMOS. Independent family project.\nSee repository LICENSE and docs/PIECES.md.\n`;
await writeFile(path.join(output,'manifest.json'),manifestText); await writeFile(path.join(output,'README.txt'),readme);
entries.push(['manifest.json',manifestText],['README.txt',readme]);
const license=await readFile(path.join(root,'LICENSE'),'utf8');
await writeFile(path.join(output,'LICENSE.txt'),license);
entries.push(['LICENSE.txt',license]);
await writeFile(path.join(output,'all-pieces.zip'),zip(entries));
console.log(`Exported ${pieces.length} distinct watertight STL + SCAD pairs at ${unit} mm. Inventories ${manifest.inventory4}/${manifest.inventory8}. All support-free; no mirrored/duplicate shapes.`);
