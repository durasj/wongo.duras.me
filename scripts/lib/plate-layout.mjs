// Nest conservative XY projections, including every occupied voxel at every Z.
// Four proper bed-plane rotations preserve the established support-free orientation.
export function projectedCells(cubes,unit=20,rotation=0){
 const cells=[...new Map(cubes.map(([x,y])=>{let a=x,b=y;for(let r=0;r<rotation;r++)[a,b]=[-b,a];return [[a,b].join(','),[a*unit,b*unit]];})).values()];
 const minX=Math.min(...cells.map(c=>c[0])),minY=Math.min(...cells.map(c=>c[1]));
 return cells.map(([x,y])=>({x:x-minX,y:y-minY,width:unit,depth:unit}));
}
export function projectionGap(a,b){
 let minimum=Infinity;
 for(const u of a.cells)for(const v of b.cells){
  const dx=Math.max(a.x+u.x-b.x-v.x-v.width,b.x+v.x-a.x-u.x-u.width,0);
  const dy=Math.max(a.y+u.y-b.y-v.y-v.depth,b.y+v.y-a.y-u.y-u.depth,0);
  minimum=Math.min(minimum,Math.hypot(dx,dy));
 }return minimum;
}
function clear(a,b,gap){
 if(a.x+a.width+gap<=b.x||b.x+b.width+gap<=a.x||a.y+a.depth+gap<=b.y||b.y+b.depth+gap<=a.y)return true;
 // Square inflation is conservative at diagonal corners, ensuring >= gap Euclidean distance.
 for(const u of a.cells)for(const v of b.cells)
  if(a.x+u.x<b.x+v.x+v.width+gap-1e-7&&a.x+u.x+u.width+gap>b.x+v.x+1e-7&&a.y+u.y<b.y+v.y+v.depth+gap-1e-7&&a.y+u.y+u.depth+gap>b.y+v.y+1e-7)return false;
 return true;
}
export function centeredLayout(items,{bed=256,gap=6,maxSpan=200}={}){
 const variants=new Map(items.map(item=>[item.id,[0,1,2,3].map(rotation=>{
  const cells=item.cells?projectedCells(item.cells,item.unit??20,rotation):[{x:0,y:0,width:rotation%2?item.depth:item.width,depth:rotation%2?item.width:item.depth}];
  return {...item,rotation,rotated:rotation%2===1,cells,width:Math.max(...cells.map(c=>c.x+c.width)),depth:Math.max(...cells.map(c=>c.y+c.depth))};
 })]));
 const orders=['area','long','short','id'].map(mode=>[...items].sort((a,b)=>mode==='area'?b.width*b.depth-a.width*a.depth:mode==='long'?Math.max(b.width,b.depth)-Math.max(a.width,a.depth):mode==='short'?Math.min(b.width,b.depth)-Math.min(a.width,a.depth):a.id-b.id));
 let state=20261031;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let k=0;k<200;k++){const order=[...items];for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}orders.push(order);}
 let best=null;
 for(let limit=100;limit<=maxSpan;limit+=2)for(const order of orders){
  const placed=[];let ok=true;
  for(const item of order){
   let chosen=null;
   for(const variant of variants.get(item.id)){
    const xs=new Set([0]),ys=new Set([0]);
    for(const p of placed)for(const u of p.cells)for(const v of variant.cells){
     xs.add(p.x+u.x+u.width+gap-v.x);xs.add(p.x+u.x-gap-v.x-v.width);
     ys.add(p.y+u.y+u.depth+gap-v.y);ys.add(p.y+u.y-gap-v.y-v.depth);
    }
    const xx=[...xs].filter(x=>x>=0&&x+variant.width<=limit+1e-8).sort((a,b)=>a-b);
    const yy=[...ys].filter(y=>y>=0&&y+variant.depth<=Math.min(maxSpan,best?Math.max(best.width,best.depth):maxSpan)+1e-8).sort((a,b)=>a-b);
    for(const y of yy){if(chosen&&(y+variant.depth)*1000>chosen.score)break;
     for(const x of xx){const candidate={...variant,x,y},score=(y+variant.depth)*1000+x+variant.width/1000;
      if(chosen&&score>=chosen.score)continue;
      if(placed.every(p=>clear(candidate,p,gap)))chosen={...candidate,score};
     }
    }
   }
   if(!chosen){ok=false;break;}placed.push(chosen);
  }
  if(!ok)continue;
  const width=Math.max(...placed.map(p=>p.x+p.width)),depth=Math.max(...placed.map(p=>p.y+p.depth)),score=Math.max(width,depth)*1e6+width*depth;
  if(!best||score<best.score)best={placed,width,depth,score};
 }
 if(!best)throw Error('Cannot nest the complete plate into the central print region.');
 const dx=(bed-best.width)/2,dy=(bed-best.depth)/2;
 return best.placed.sort((a,b)=>a.id-b.id).map(p=>({...p,x:Number((p.x+dx).toFixed(6)),y:Number((p.y+dy).toFixed(6))}));
}
