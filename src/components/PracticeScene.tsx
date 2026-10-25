import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { getPiece, filamentPalette, type Voxel } from '../lib/pieces';
import type { Puzzle } from '../lib/puzzles';
import type { Placement } from '../lib/solver';

interface Props {
  puzzle: Puzzle;
  placements: Placement[];
  candidate: { pieceId: number; cubes: Voxel[]; valid: boolean } | null;
  language: 'en' | 'sk';
}

/** Logical x,y,z -> scene x,z,-y is a proper rotation, preserving handedness. */
export function PracticeScene({ puzzle, placements, candidate, language }: Props) {
  const xs = puzzle.footprint.map(v => v[0]), ys = puzzle.footprint.map(v => v[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const size = Math.max(Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1);
  const fallback = <p className="practice-fallback">{language === 'sk' ? '3D náhľad nie je dostupný. Puzzle môžete ďalej skladať v mriežkach oboch vrstiev.' : '3D preview is unavailable. You can still solve the puzzle using both layer grids.'}</p>;
  return <div className="practice-scene" role="img" aria-label={language === 'sk' ? '3D náhľad vašich umiestnených dielikov a priehľadného návrhu' : '3D view of your placed pieces and translucent candidate'}>
    <Canvas shadows fallback={fallback} camera={{ position: [size * 1.1 + 2, size * 1.2 + 2, size * 1.35 + 2], fov: 36 }} dpr={[1, 2]}>
      <color attach="background" args={['#ece8dc']} />
      <ambientLight intensity={1.7} />
      <directionalLight position={[4, 9, 5]} intensity={2.2} castShadow />
      <Suspense fallback={null}>
        {puzzle.footprint.map(([x, y]) => <mesh key={`${x},${y}`} position={[x-cx, -.1, -y+cy]} receiveShadow>
          <boxGeometry args={[.97, .12, .97]} />
          <meshStandardMaterial color="#d9d4c6" roughness={.8} />
        </mesh>)}
        {placements.flatMap((placement, index) => placement.cubes.map(([x,y,z]) => <mesh key={`placed-${index}-${x}-${y}-${z}`} position={[x-cx, z+.5, -y+cy]} castShadow receiveShadow>
          <boxGeometry args={[.96, .96, .96]} />
          <meshStandardMaterial color={getPiece(placement.pieceId).hex} roughness={.45} />
        </mesh>))}
        {candidate?.cubes.map(([x,y,z]) => <group key={`candidate-${x}-${y}-${z}`} position={[x-cx, z+.5, -y+cy]}>
          <mesh renderOrder={2}>
            <boxGeometry args={[.985, .985, .985]} />
            <meshStandardMaterial color={candidate.valid ? getPiece(candidate.pieceId).hex : filamentPalette.red} transparent opacity={.35} depthWrite={false} roughness={.3} />
          </mesh>
          <mesh renderOrder={3}>
            <boxGeometry args={[.995, .995, .995]} />
            <meshBasicMaterial color={candidate.valid ? filamentPalette.blue : filamentPalette.red} wireframe transparent opacity={.75} depthWrite={false} />
          </mesh>
        </group>)}
      </Suspense>
      <OrbitControls makeDefault target={[0, .7, 0]} minDistance={3} maxDistance={30} maxPolarAngle={Math.PI * .48} enablePan />
    </Canvas>
  </div>;
}
