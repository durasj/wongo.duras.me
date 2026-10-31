// Deterministic bounding-box packing. Search both XY rotations and several orders,
// minimize the longest packed span, then area, and center the final group on the bed.
export function centeredLayout(items,{bed=256,gap=6,maxSpan=200}={}){
 const orders=[...['area','long','short','id'].map(mode=>[...items].sort((a,b)=>mode==='area'?b.width*b.depth-a.width*a.depth:mode==='long'?Math.max(b.width,b.depth)-Math.max(a.width,a.depth):mode==='short'?Math.min(b.width,b.depth)-Math.min(a.width,a.depth):a.id-b.id))];
 let best=null;
 for(let limit=80;limit<=maxSpan;limit+=2)for(const order of orders){
  const placed=[];let ok=true;
  for(const item of order){
   const xs=[0,...placed.map(p=>p.x+p.width+gap)],ys=[0,...placed.map(p=>p.y+p.depth+gap)];let chosen=null;
   for(const rotated of [false,true]){const width=rotated?item.depth:item.width,depth=rotated?item.width:item.depth;
    for(const x of xs)for(const y of ys){if(x+width>limit+1e-8||y+depth>maxSpan+1e-8)continue;if(placed.some(p=>x<p.x+p.width+gap-1e-8&&x+width+gap>p.x+1e-8&&y<p.y+p.depth+gap-1e-8&&y+depth+gap>p.y+1e-8))continue;
     const score=(y+depth)*1000+x+width/1000;if(!chosen||score<chosen.score)chosen={...item,x,y,width,depth,rotated,score};
    }
   }
   if(!chosen){ok=false;break;}placed.push(chosen);
  }
  if(!ok)continue;const width=Math.max(...placed.map(p=>p.x+p.width)),depth=Math.max(...placed.map(p=>p.y+p.depth)),score=Math.max(width,depth)*1e6+width*depth;
  if(!best||score<best.score)best={placed,width,depth,score};
 }
 if(!best)throw Error('Cannot pack the complete plate into the central print region.');
 const dx=(bed-best.width)/2,dy=(bed-best.depth)/2;
 return best.placed.sort((a,b)=>a.id-b.id).map(p=>({...p,x:Number((p.x+dx).toFixed(6)),y:Number((p.y+dy).toFixed(6))}));
}
