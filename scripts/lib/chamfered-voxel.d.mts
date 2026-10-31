export interface MeshTriangle { n: number[]; v: number[][] }
export function chamferedMesh(cubes: number[][], unit: number, chamfer: number): MeshTriangle[];
export function chamferedVoxel(unit: number, chamfer: number): {
 vertices: number[][];
 faces: { n: number[]; indices: number[]; neighbour?: number[] }[];
};
