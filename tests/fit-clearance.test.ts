import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chamferedMesh } from '../scripts/lib/chamfered-voxel.mjs';
import { insetMesh } from '../scripts/lib/fit-clearance.mjs';
import { pieces } from '../src/lib/pieces';
function yHits(mesh:any[],x:number,z:number){const hits=new Set<number>();for(const {v:[a,b,c]} of mesh){const u=[b[0]-a[0],b[2]-a[2]],v=[c[0]-a[0],c[2]-a[2]],d=[x-a[0],z-a[2]],det=u[0]*v[1]-u[1]*v[0];if(Math.abs(det)<1e-10)continue;const s=(d[0]*v[1]-d[1]*v[0])/det,t=(u[0]*d[1]-u[1]*d[0])/det;if(s>=0&&t>=0&&s+t<=1)hits.add(Number((a[1]+s*(b[1]-a[1])+t*(c[1]-a[1])).toFixed(6)));}return [...hits].sort((a,b)=>a-b);}
test('clearance opens the yellow U slot while reducing the mating tab without scaling pitch',()=>{
 const gate=pieces.find(p=>p.id===4)!;
 const old=yHits(chamferedMesh(gate.cubes,20,.5),10.529,30.371);
 const revised=yHits(insetMesh(chamferedMesh(gate.cubes,20,.5),.15),10.529,30.371);
 assert.equal(old.length,4);assert.equal(revised.length,4);
 assert.ok(Math.abs(revised[2]-revised[1]-20.3)<1e-6,'Slot must widen, not shrink');
 const stud=yHits(insetMesh(chamferedMesh([[0,0,0]],20,.5),.15),10.529,10.371);
 assert.ok(Math.abs(stud[1]-stud[0]-19.7)<1e-6);
 assert.ok(Math.abs((revised[2]-revised[1])-(stud[1]-stud[0])-.6)<1e-6);
});
test('every exported rigid piece remains one connected closed surface after inset',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/downloads/pieces/manifest.json',import.meta.url),'utf8'));
 for(const p of manifest.pieces){
  const text=readFileSync(new URL('../public/downloads/pieces/'+p.filename,import.meta.url),'utf8');
  const vertices=[...text.matchAll(/vertex\s+([-\d.e+]+)\s+([-\d.e+]+)\s+([-\d.e+]+)/g)].map(m=>m.slice(1).map(Number));const graph=new Map<string,Set<string>>(),edges=new Map<string,number>();
  for(let i=0;i<vertices.length;i+=3)for(let j=0;j<3;j++){const a=vertices[i+j].join(','),b=vertices[i+(j+1)%3].join(',');if(!graph.has(a))graph.set(a,new Set());graph.get(a)!.add(b);const key=[a,b].sort().join('|');edges.set(key,(edges.get(key)??0)+1);}
  assert.ok([...edges.values()].every(v=>v===2),'Closed mesh '+p.id);
  const visited=new Set<string>(),pending=[graph.keys().next().value!];while(pending.length){const a=pending.pop()!;if(visited.has(a))continue;visited.add(a);pending.push(...graph.get(a)!);}assert.equal(visited.size,graph.size,'No detached voxel islands '+p.id);
  for(let axis=0;axis<3;axis++){const expected=(Math.max(...p.printCubes.map((v:number[])=>v[axis]))+1)*20-.3;assert.ok(Math.abs(p.dimensionsMm[axis]-expected)<1e-6);}
 }
});
