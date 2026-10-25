import catalogue from '../data/pieces.json';

/** Unit-cube origins in a right-handed coordinate system; z points up. */
export type Voxel = [number, number, number];

export interface Piece {
  id: number;
  name: string;
  color: string;
  hex: string;
  cubes: Voxel[];
  quantity4: number;
  quantity8: number;
}

/** The single source of geometry for rendering, solving, and STL generation. */
export const pieces = catalogue as Piece[];

export function getPiece(id: number): Piece {
  const piece = pieces.find((candidate) => candidate.id === id);
  if (!piece) throw new Error(`Unknown piece ID: ${id}`);
  return piece;
}
