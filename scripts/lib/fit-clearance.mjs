// Mitered inward surface offset. Preserve lattice pitch, connectivity and handedness;
// move external faces inward, including the walls of concave slots, rather than
// scaling a whole piece (which would also shrink its holes).
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function solve(a,b){a=a.map((r,i)=>[...r,b[i]]);for(let i=0;i<a.length;i++){let p=i;for(let j=i+1;j<a.length;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;if(Math.abs(a[p][i])<1e-10)return null;[a[i],a[p]]=[a[p],a[i]];const d=a[i][i];a[i]=a[i].map(v=>v/d);for(let j=0;j<a.length;j++)if(j!==i){const m=a[j][i];a[j]=a[j].map((v,k)=>v-m*a[i][k]);}}return a.map(r=>r.at(-1));}
function displacement(normals,inset){
 let best=null,length=Infinity;
 function check(selected){const weights=solve(selected.map(a=>selected.map(b=>dot(a,b))),selected.map(()=>inset));if(!weights||weights.some(w=>w< -1e-8))return;const d=[0,1,2].map(axis=>-selected.reduce((s,n,i)=>s+n[axis]*weights[i],0));if(normals.some(n=>dot(n,d)>-inset+1e-8))return;const size=dot(d,d);if(size<length){best=d;length=size;}}
 for(let i=0;i<normals.length;i++){check([normals[i]]);for(let j=i+1;j<normals.length;j++){check([normals[i],normals[j]]);for(let k=j+1;k<normals.length;k++)check([normals[i],normals[j],normals[k]]);}}
 if(!best)throw Error('Cannot inset a mesh vertex without a topology change.');return best;
}
export function insetMesh(triangles,inset){
 if(!Number.isFinite(inset)||inset<0||inset>0.25)throw Error('Surface inset must be between 0 and 0.25 mm.');if(!inset)return triangles;
 const vertices=new Map();for(const t of triangles)for(const v of t.v){const key=v.join(','),entry=vertices.get(key)??{v,normals:new Map()};entry.normals.set(t.n.map(n=>n.toFixed(8)).join(','),t.n);vertices.set(key,entry);}
 for(const e of vertices.values()){const d=displacement([...e.normals.values()],inset);e.target=e.v.map((v,i)=>Number((v+d[i]).toFixed(8)));}
 const shifted=triangles.map(t=>{const v=t.v.map(p=>vertices.get(p.join(',')).target),n=cross(v[1].map((x,i)=>x-v[0][i]),v[2].map((x,i)=>x-v[0][i])),l=Math.hypot(...n);if(l<1e-8||dot(n,t.n)<=0)throw Error('Surface inset collapsed or inverted a triangle.');return {v,n:n.map(x=>x/l)};});
 // Ground models at z=0 and normalize X/Y; the lattice is translated, never scaled.
 const mins=[0,1,2].map(axis=>Math.min(...[...vertices.values()].map(e=>e.target[axis])));
 return shifted.map(t=>({...t,v:t.v.map(v=>v.map((x,i)=>Number((x-mins[i]).toFixed(8))))}));
}
