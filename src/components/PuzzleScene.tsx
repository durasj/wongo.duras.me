import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { getPiece, type Piece } from '../lib/pieces';
import type { Puzzle } from '../lib/puzzles';

type Layer = 'all' | 'bottom' | 'top';
export function PuzzleScene({ puzzle, piece, revealed, step, layer, exploded }: { puzzle?: Puzzle; piece?: Piece; revealed: boolean; step: number; layer: Layer; exploded: boolean }) {
  const footprint = puzzle?.footprint ?? [];
  const cx = footprint.length ? (Math.min(...footprint.map(p=>p[0]))+Math.max(...footprint.map(p=>p[0])))/2 : 0;
  const cy = footprint.length ? (Math.min(...footprint.map(p=>p[1]))+Math.max(...footprint.map(p=>p[1])))/2 : 0;
  const voxels = useMemo(() => piece ? [{ pieceId:piece.id, cubes:piece.cubes }] : revealed ? puzzle?.solution.slice(0, step) ?? [] : [], [piece,puzzle,revealed,step]);
  return <div className="canvas-wrap" role="img" aria-label={piece ? `3D model of piece ${piece.id}` : revealed ? `3D solution for ${puzzle?.code}` : `Empty puzzle board for ${puzzle?.code}`}>
    <Canvas shadows camera={{ position:[7,8,9], fov:38 }} dpr={[1,2]}>
      <color attach="background" args={['#eef0e6']} />
      <ambientLight intensity={1.5}/><directionalLight castShadow position={[5,10,6]} intensity={2} shadow-mapSize={[1024,1024]}/>
      <Suspense fallback={null}>
        <group position={piece ? [-1,0,0] : [0,0,0]}>
          {footprint.map(([x,y]) => <RoundedBox key={`${x},${y}`} args={[.98,.12,.98]} radius={.035} smoothness={2} position={[x-cx,-.12,-y+cy]} receiveShadow><meshStandardMaterial color="#d7dccc" roughness={.85}/></RoundedBox>)}
          {voxels.map(({pieceId,cubes},index)=>cubes.filter(c=>layer==='all'||c[2]===(layer==='bottom'?0:1)).map(([x,y,z])=><RoundedBox key={`${pieceId}-${index}-${x}-${y}-${z}`} args={[.97,.97,.97]} radius={.045} smoothness={3} castShadow receiveShadow position={[x-cx,z+.45+(exploded?index*.42:0),-y+cy]}><meshStandardMaterial color={getPiece(pieceId).hex} roughness={.45}/></RoundedBox>))}
        </group>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.23,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.11}/></mesh>
      </Suspense>
      <OrbitControls makeDefault minDistance={4} maxDistance={22} target={[0,.6,0]} maxPolarAngle={Math.PI*.47}/>
    </Canvas>
  </div>;
}
