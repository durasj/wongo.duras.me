import { useId } from 'react';
import { filamentPalette } from '../lib/pieces';
import type { Voxel } from '../lib/pieces';

export function PieceIcon({ cubes, color, className = '' }: { cubes: Voxel[]; color: string; className?: string }) {
  const id = useId();
  const isBlue = color.toLowerCase() === filamentPalette.blue.toLowerCase();
  const shade = (factor: number) => "#" + [1,3,5].map(i => Math.min(255, Math.round(parseInt(color.slice(i,i+2),16)*factor)).toString(16).padStart(2,"0")).join("");
  const points = cubes.map(([x, y, z]) => [28 * (x - y), 14 * (x + y) - 30 * z]);
  const minX = Math.min(...points.map(p => p[0])) - 31;
  const minY = Math.min(...points.map(p => p[1])) - 32;
  const width = Math.max(...points.map(p => p[0])) - minX + 31;
  const height = Math.max(...points.map(p => p[1])) - minY + 31;
  return <svg className={`piece-icon ${className}`} viewBox={`${minX} ${minY} ${width} ${height}`} aria-hidden="true">
    <defs><filter id={id}><feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity=".08" /></filter></defs>
    <g filter={`url(#${id})`} stroke={isBlue ? "#ffffff" : "#25332c"} strokeOpacity={isBlue ? 1 : .18} strokeWidth={isBlue ? 1.4 : 1} strokeLinejoin="round">
      {cubes.slice().sort((a, b) => (a[0] + a[1] + a[2] * 4) - (b[0] + b[1] + b[2] * 4)).map(([x,y,z]) => {
        const px = 28*(x-y), py=14*(x+y)-30*z;
        return <g key={`${x},${y},${z}`} transform={`translate(${px} ${py})`}>
          <path d="M0 -2 L28 -16 L28 14 L0 28 Z" fill={color}/>
          <path d="M0 -2 L-28 -16 L-28 14 L0 28 Z" fill={shade(.78)}/>
          <path d="M0 -30 L28 -16 L0 -2 L-28 -16 Z" fill={shade(1.15)}/>
        </g>;
      })}
    </g>
  </svg>;
}
