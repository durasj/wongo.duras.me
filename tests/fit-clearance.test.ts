import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chamferedMesh } from '../scripts/lib/chamfered-voxel.mjs';
import { openGateSlot } from '../scripts/lib/fit-clearance.mjs';
import { pieces } from '../src/lib/pieces';
function yHits(mesh:any[],x:number,z:number){const hits=new Set<number>();for(const {v:[a,b,c]} of mesh){const u=[b[0]-a[0],b[2]-a[2]],v=[c[0]-a[0],c[2]-a[2]],d=[x-a[0],z-a[2]],det=u[0]*v[1]-u[1]*v[0];if(Math.abs(det)<1e-10)continue;const s=(d[0]*v[1]-d[1]*v[0])/det,t=(u[0]*d[1]-u[1]*d[0])/det;if(s>=0&&t>=0&&s+t<=1)hits.add(Number((a[1]+s*(b[1]-a[1])+t*(c[1]-a[1])).toFixed(6)));}return [...hits].sort((a,b)=>a-b);}
test('clearance opens only the yellow U slot and fits previously printed 20 mm tabs',()=>{
 const gate=pieces.find(p=>p.id===4)!;
 const old=yHits(chamferedMesh(gate.cubes,20,.5),10.529,30.371);
 const revised=yHits(openGateSlot(chamferedMesh(gate.cubes,20,.5),gate.cubes,20,.5,.15),10.529,30.371);
 assert.equal(old.length,4);assert.equal(revised.length,4);
 assert.ok(Math.abs(revised[2]-revised[1]-20.3)<1e-6,'Slot must widen, not shrink');
 const stud=yHits(chamferedMesh([[0,0,0]],20,.5),10.529,10.371);
 assert.ok(Math.abs(stud[1]-stud[0]-20)<1e-6);
 assert.ok(Math.abs((revised[2]-revised[1])-(stud[1]-stud[0])-.3)<1e-6);
});
test('every exported rigid piece remains one connected closed surface after local slot relief',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/downloads/pieces/manifest.json',import.meta.url),'utf8'));
 for(const p of manifest.pieces){
  const text=readFileSync(new URL('../public/downloads/pieces/'+p.filename,import.meta.url),'utf8');
  const vertices=[...text.matchAll(/vertex\s+([-\d.e+]+)\s+([-\d.e+]+)\s+([-\d.e+]+)/g)].map(m=>m.slice(1).map(Number));const graph=new Map<string,Set<string>>(),edges=new Map<string,number>();
  for(let i=0;i<vertices.length;i+=3)for(let j=0;j<3;j++){const a=vertices[i+j].join(','),b=vertices[i+(j+1)%3].join(',');if(!graph.has(a))graph.set(a,new Set());graph.get(a)!.add(b);const key=[a,b].sort().join('|');edges.set(key,(edges.get(key)??0)+1);}
  assert.ok([...edges.values()].every(v=>v===2),'Closed mesh '+p.id);
  const visited=new Set<string>(),pending=[graph.keys().next().value!];while(pending.length){const a=pending.pop()!;if(visited.has(a))continue;visited.add(a);pending.push(...graph.get(a)!);}assert.equal(visited.size,graph.size,'No detached voxel islands '+p.id);
  for(let axis=0;axis<3;axis++){const expected=(Math.max(...p.printCubes.map((v:number[])=>v[axis]))+1)*20;assert.ok(Math.abs(p.dimensionsMm[axis]-expected)<1e-6);}
 }
});

test('all fifteen other published STL files remain byte-for-byte identical',()=>{
 const frozen={
  "wongo-piece-01-yellow.stl": "c830b289583fe45bd8aa874c46b8740028d9f763f72381365c79ebc686023154",
  "wongo-piece-02-yellow.stl": "c103ac46198ee00e105ac3bda666934946c8212a6d68568276d7143811079a5f",
  "wongo-piece-03-yellow.stl": "80557359029d03f08ec2844e6227ca040f05ea2b2ccccb00cb2a193c102310d2",
  "wongo-piece-05-blue.stl": "63c0c186523abbe55b70f5aa7dae6f0b3044461755a682b599bc04b453ec20e6",
  "wongo-piece-06-blue.stl": "1bb391c3047a7346818125d0bae4d6cc0f16dfb765b961a1f6d46a8f2cca4928",
  "wongo-piece-07-blue.stl": "683b490d1d13fc3ce54f27930b22bb03ac591fea65529e8bc721dc61915cedc9",
  "wongo-piece-08-blue.stl": "cade83dccbfe22e453bee9cc05fda7c1a23456271c97b2e34c82f0ae8cb49fdc",
  "wongo-piece-09-red.stl": "b3e395e526e1a5c0465e1b5da2f562d233dd644e296e0ac99dd808d3e92ce5b7",
  "wongo-piece-10-red.stl": "880650012348e65b1f5431ad2e72cd739d6bb22470758e3fad65a1b30ec13c21",
  "wongo-piece-11-red.stl": "aed1525e9724b742388fec2916e33c2440375a837b7848b8f473843edfb79594",
  "wongo-piece-12-red.stl": "cceeb77a06e17d5b2fa1a98e711d634325c446dddcd5ee32d0d5db5419e58014",
  "wongo-piece-13-green.stl": "a9f68393dc1edb4e8f8a8659188a154a16c4ad449a4d3b5ae8d3eb78a7f8fd46",
  "wongo-piece-14-green.stl": "755eb4b6c7dd870141b6b8c5b748415476e0de4f7ee9b45b0b67ab524e400118",
  "wongo-piece-15-green.stl": "190dee45e08903050f2fb91f20d08aef99236560559625cbe9ef21390cb90608",
  "wongo-piece-16-green.stl": "74f1efe5e8097f699f815c4be95d6a4fb293882cc0e7dd83d9dd7c309cc9f588"
};
 for(const [name,hash] of Object.entries(frozen)){const bytes=readFileSync(new URL('../public/downloads/pieces/'+name,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,name);}
});
