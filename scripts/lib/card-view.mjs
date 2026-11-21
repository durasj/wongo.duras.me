// Screen y increases downward. Screen-right × screen-up points to the
// observer at (+x,+y,+z), preserving the handedness of the printed model.
export function projectCubePoint([x, y, z]) {
  return [28 * (y - x), 14 * (x + y) - 28 * z];
}

const faces = [
  {corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], shade: .78},
  {corners: [[0,1,0],[1,1,0],[1,1,1],[0,1,1]], shade: 1},
  {corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], shade: 1.15},
];

function view(cubes) {
  const shapes = [];
  // Each rhombus covers two triangles of the same projected lattice.
  // Track the frontmost owner of each triangle to score visible cubes.
  const owners = new Map();
  const depth = ([x,y,z]) => x+y+z;
  for (const cube of [...cubes].sort((a,b) => depth(a)-depth(b))) {
    for (const {corners, shade} of faces) {
      const points = corners.map(corner => projectCubePoint(corner.map((n,i) => n+cube[i])));
      shapes.push({points, shade});
      // The short diagonal divides the face into the two lattice triangles.
      const length = (a,b) => 3*((points[a][0]-points[b][0])/28)**2 +
        ((points[a][1]-points[b][1])/14)**2;
      const tris = length(0,2) < length(1,3) ? [[0,1,2],[0,2,3]] : [[0,1,3],[1,2,3]];
      for (const tri of tris) {
        const key = [0,1].map(axis => tri.reduce((s,i) => s+points[i][axis],0)).join(',');
        owners.set(key,cube);
      }
    }
  }
  const counts = cubes.map(c => [...owners.values()].filter(owner => owner===c).length);
  return {shapes, score: counts.sort((a,b)=>a-b).reduce((score,n)=>score*8+n,0)};
}

export function cardPolygons(cubes) {
  let best = view(cubes);
  for (let turn=1; turn<4; turn++) {
    cubes = cubes.map(([x,y,z]) => [-y,x,z]);
    const candidate = view(cubes);
    if (candidate.score > best.score) best = candidate;
  }
  const vertices = best.shapes.flatMap(s => s.points);
  const xs = vertices.map(p=>p[0]), ys = vertices.map(p=>p[1]);
  const minX = Math.min(...xs)-2, minY = Math.min(...ys)-2;
  return {minX,minY,w:Math.max(...xs)-minX+2,h:Math.max(...ys)-minY+2,shapes:best.shapes};
}
