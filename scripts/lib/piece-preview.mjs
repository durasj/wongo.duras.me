// Exact isometric view of the same chamfer planes used in the physical STL.
export function piecePreviewSVG(piece,unit,chamfer,voxelFactory){
 const voxel=voxelFactory(unit,chamfer),set=new Set(piece.printCubes.map(c=>c.join(','))),faces=[];
 const project=([x,y,z])=>[(x-y)*.8660254,(x+y)*.5-z];
 for(const cube of piece.printCubes)for(const face of voxel.faces){
  if(face.neighbour&&set.has(cube.map((v,i)=>v+face.neighbour[i]).join(',')))continue;
  if(face.n[0]+face.n[1]+face.n[2]<=0)continue;
  const points=face.indices.map(i=>voxel.vertices[i].map((v,a)=>v+cube[a]*unit));
  faces.push({points,n:face.n,depth:points.reduce((sum,v)=>sum+v[0]+v[1]+v[2],0)/points.length});
 }
 faces.sort((a,b)=>a.depth-b.depth);
 const flat=faces.flatMap(f=>f.points.map(project)),xs=flat.map(p=>p[0]),ys=flat.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),w=Math.max(...xs)-minX,h=Math.max(...ys)-minY,scale=Math.min(500/w,310/h);
 const color=n=>{const shade=Math.max(.55,Math.min(1.15,.66+.17*n[0]+.08*n[1]+.41*n[2]));return '#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(piece.hex.slice(i,i+2),16)*shade)).toString(16).padStart(2,'0')).join('');};
 const paths=faces.map(f=>'<polygon points="'+f.points.map(v=>{const [x,y]=project(v);return [(x-minX)*scale+(600-w*scale)/2,(y-minY)*scale+58].map(n=>n.toFixed(3)).join(',');}).join(' ')+'" fill="'+color(f.n)+'" stroke="'+(['blue','red'].includes(piece.color)?'#ffffff':'#25332c')+'" stroke-width=".65" stroke-linejoin="round"/>').join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" fill="#fffdf7"/><text x="30" y="31" fill="#25332c" font-family="Arial,sans-serif" font-size="18">WONGO / '+unit+' mm pitch / '+chamfer+' mm chamfer</text>'+paths+'<text x="30" y="402" fill="#25332c" font-family="Arial,sans-serif" font-size="13">Piece '+piece.id+' / exact model geometry / visible voxel seams</text></svg>\n';
}
