// Convex 45-degree chamfer: cube shrunk by c, Minkowski-summed with an octahedron.
// Coordinates remain on the original lattice pitch. Faces use outward winding.
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const normalized=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
export function chamferedVoxel(unit,c){
  if(!(c>0&&c<unit/4))throw Error('Chamfer must be positive and less than one quarter of the cube pitch.');
  const h=unit/2,vertices=[],planes=[];
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
    const n=[0,0,0];n[axis]=sign;planes.push({n,d:h,neighbour:n});
    const rest=[0,1,2].filter(i=>i!==axis);
    for(const a of [-1,1])for(const b of [-1,1]){const v=[0,0,0];v[axis]=sign*h;v[rest[0]]=a*(h-c);v[rest[1]]=b*(h-c);vertices.push(v);}
  }
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)for(const sa of [-1,1])for(const sb of [-1,1]){const n=[0,0,0];n[a]=sa;n[b]=sb;planes.push({n,d:2*h-c});}
  for(const a of [-1,1])for(const b of [-1,1])for(const d of [-1,1])planes.push({n:[a,b,d],d:3*h-2*c});
  const faces=planes.map(plane=>{
    const indices=vertices.flatMap((v,i)=>Math.abs(dot(v,plane.n)-plane.d)<1e-8?[i]:[]);
    const center=[0,1,2].map(axis=>indices.reduce((n,i)=>n+vertices[i][axis],0)/indices.length);
    const n=normalized(plane.n),u=normalized(sub(vertices[indices[0]],center)),v=cross(n,u);
    indices.sort((a,b)=>Math.atan2(dot(sub(vertices[a],center),v),dot(sub(vertices[a],center),u))-Math.atan2(dot(sub(vertices[b],center),v),dot(sub(vertices[b],center),u)));
    return {n,indices,neighbour:plane.neighbour};
  });
  return {vertices:vertices.map(v=>v.map(x=>Number((x+h).toFixed(8)))),faces};
}
export function chamferedMesh(cubes,unit,c){
  const voxel=chamferedVoxel(unit,c),occupied=new Set(cubes.map(v=>v.join(','))),triangles=[];
  for(const cube of cubes)for(const face of voxel.faces){
    if(face.neighbour&&occupied.has(cube.map((v,i)=>v+face.neighbour[i]).join(',')))continue;
    const polygon=face.indices.map(i=>voxel.vertices[i].map((v,axis)=>Number((v+cube[axis]*unit).toFixed(8))));
    for(let i=1;i<polygon.length-1;i++)triangles.push({n:face.n,v:[polygon[0],polygon[i],polygon[i+1]]});
  }
  return triangles;
}
