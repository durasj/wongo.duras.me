import { getPiece } from '../lib/pieces';
import type { Puzzle } from '../lib/puzzles';

/** A numbered top-down reference stays usable without WebGL and disambiguates same-colour pieces. */
export function SolutionLayers({puzzle,language}:{puzzle:Puzzle;language:'en'|'sk'}) {
  const xs=puzzle.footprint.map(c=>c[0]), ys=puzzle.footprint.map(c=>c[1]);
  const minX=Math.min(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),width=Math.max(...xs)-minX+1,height=maxY-minY+1;
  return <section className="solution-layers" aria-label={language==='en'?'Solution layer diagrams':'Pôdorysy riešenia'}>
    <div className="solution-diagrams-intro"><h3>{language==='en'?'Every cube, accounted for.':'Každá kocka má svoje miesto.'}</h3><p>{language==='en'?'Top-down views. Numbers identify the pieces; both layers have the same orientation.':'Pohľad zhora. Čísla označujú dieliky; obe poschodia majú rovnakú orientáciu.'}</p></div>
    {[0,1].map(z=><figure key={z}><figcaption>{z===0?(language==='en'?'Bottom layer':'Spodné poschodie'):(language==='en'?'Top layer':'Horné poschodie')}</figcaption><svg role="img" aria-label={`${z===0?'Bottom':'Top'} layer of ${puzzle.code}`} viewBox={`-.08 -.08 ${width+.16} ${height+.16}`}>
      {puzzle.footprint.map(([x,y])=>{const placement=puzzle.solution.find(s=>s.cubes.some(c=>c[0]===x&&c[1]===y&&c[2]===z));const piece=placement?getPiece(placement.pieceId):undefined;return <g key={`${x},${y}`}><rect x={x-minX} y={maxY-y} width="1" height="1" fill={piece?.hex??'#fff'} stroke="#fffdf6" strokeWidth=".035"/><text x={x-minX+.5} y={maxY-y+.55} textAnchor="middle" dominantBaseline="middle" fontSize=".3" fontFamily="sans-serif" fontWeight="600" fill="#17271e">{piece?.id??'?'}</text></g>;})}
    </svg><span className="diagram-axes">+x → · +y ↑</span></figure>)}
  </section>;
}
