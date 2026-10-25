import { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Edges, OrbitControls, RoundedBox } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus } from 'lucide-react';
import { getPiece, filamentPalette, type Piece } from '../lib/pieces';
import type { Puzzle } from '../lib/puzzles';
import printConfig from '../data/print.json';

type Layer = 'all' | 'bottom' | 'top';
export function PuzzleScene({ puzzle, piece, revealed, step, layer, exploded, language='en' }: { puzzle?: Puzzle; piece?: Piece; revealed: boolean; step: number; layer: Layer; exploded: boolean; language?:'en'|'sk' }) {
  const controls=useRef<OrbitControlsImpl>(null);
  const adjust=(action:'left'|'right'|'up'|'down'|'in'|'out')=>{const control=controls.current;if(!control)return;if(action==='left'||action==='right')control.setAzimuthalAngle(control.getAzimuthalAngle()+(action==='left'?-1:1)*Math.PI/8);else if(action==='up'||action==='down')control.setPolarAngle(Math.max(.15,Math.min(Math.PI*.47,control.getPolarAngle()+(action==='up'?-1:1)*Math.PI/12)));else{const offset=control.object.position.clone().sub(control.target);control.object.position.copy(control.target).add(offset.multiplyScalar(action==='in'?.8:1.25));}control.update();};
  const footprint = puzzle?.footprint ?? [];
  const cx = footprint.length ? (Math.min(...footprint.map(p=>p[0]))+Math.max(...footprint.map(p=>p[0])))/2 : 0;
  const cy = footprint.length ? (Math.min(...footprint.map(p=>p[1]))+Math.max(...footprint.map(p=>p[1])))/2 : 0;
  const voxels = useMemo(() => piece ? [{ pieceId:piece.id, cubes:piece.cubes }] : revealed ? puzzle?.solution.slice(0, step) ?? [] : [], [piece,puzzle,revealed,step]);
  return <div className="canvas-wrap" role="group" aria-label={piece ? `3D model of piece ${piece.id}` : revealed ? `3D solution for ${puzzle?.code}` : `Empty puzzle board for ${puzzle?.code}`}>
    <Canvas shadows camera={{ position:[7,8,9], fov:38 }} dpr={[1,2]}>
      <color attach="background" args={['#ece8dc']} />
      <ambientLight intensity={1.5}/><directionalLight castShadow position={[5,10,6]} intensity={2} shadow-mapSize={[1024,1024]}/>
      <Suspense fallback={null}>
        <group position={piece ? [-1,0,0] : [0,0,0]}>
          {footprint.map(([x,y]) => <RoundedBox key={`${x},${y}`} args={[.98,.12,.98]} radius={.035} smoothness={2} position={[x-cx,-.12,-y+cy]} receiveShadow><meshStandardMaterial color="#d9d4c6" roughness={.85}/></RoundedBox>)}
          {voxels.map(({pieceId,cubes},index)=>cubes.filter(c=>layer==='all'||c[2]===(layer==='bottom'?0:1)).map(([x,y,z])=><RoundedBox key={`${pieceId}-${index}-${x}-${y}-${z}`} args={[1,1,1]} radius={printConfig.chamferMm/printConfig.unitMm} smoothness={1} castShadow receiveShadow position={[x-cx,z+.45+(exploded?index*.42:0),-y+cy]}><meshStandardMaterial color={getPiece(pieceId).hex} roughness={.45}/>{['blue','red'].includes(getPiece(pieceId).color)&&<Edges color="#ffffff" threshold={15}/>}</RoundedBox>))}
        </group>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.23,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.11}/></mesh>
      </Suspense>
      <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={4} maxDistance={22} target={[0,.6,0]} maxPolarAngle={Math.PI*.47}/>
    </Canvas>
    <div className="scene-tools" role="group" aria-label={language==='en'?'3D view controls':'Ovládanie 3D pohľadu'}>
      {([['left',ChevronLeft,'Rotate left','Otočiť doľava'],['right',ChevronRight,'Rotate right','Otočiť doprava'],['up',ChevronUp,'Tilt up','Nakloniť nahor'],['down',ChevronDown,'Tilt down','Nakloniť nadol'],['in',Plus,'Zoom in','Priblížiť'],['out',Minus,'Zoom out','Oddialiť']] as const).map(([action,Icon,en,sk])=><button key={action} onClick={()=>adjust(action)} aria-label={language==='en'?en:sk} title={language==='en'?en:sk}><Icon/></button>)}
    </div>
  </div>;
}
