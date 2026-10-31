// Local relief of the yellow U/Gate slot only. Preserve all exterior bounds,
// all other pieces, the 20 mm lattice, and the original chamfered surface mesh.
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function openGateSlot(triangles,cubes,unit,chamfer,relief){
 if(!Number.isFinite(relief)||relief<0||relief>.3)throw Error('Gate slot wall relief must be between 0 and 0.3 mm.');
 if(!relief)return triangles;if(!chamfer)throw Error('Slot relief requires the chamfered Gate mesh.');
 const spans=[0,1,2].map(axis=>Math.max(...cubes.map(v=>v[axis]))+1),gap=spans.indexOf(3),reach=spans.indexOf(2),thin=spans.indexOf(1);
 if(cubes.length!==5||gap<0||reach<0||thin<0||cubes.some(v=>v[thin]!==0||(v[reach]===1&&v[gap]===1)))throw Error('Slot relief is restricted to the five-cube U/Gate.');
 function move(v){const out=[...v],weight=Math.max(0,Math.min(1,(v[reach]-(unit-chamfer))/(2*chamfer))),y=v[gap];
  const taper=y<=unit?-y/unit:y>=2*unit?(3*unit-y)/unit:2*(y-unit)/unit-1;
  out[gap]=Number((y+relief*weight*taper).toFixed(8));return out;
 }
 return triangles.map(t=>{const v=t.v.map(move),n=cross(v[1].map((x,i)=>x-v[0][i]),v[2].map((x,i)=>x-v[0][i])),length=Math.hypot(...n);
  if(length<1e-8||n.reduce((s,x,i)=>s+x*t.n[i],0)<=0)throw Error('Slot relief collapsed or inverted a triangle.');return {v,n:n.map(x=>x/length)};
 });
}
