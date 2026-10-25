import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react';
import { getPiece, type Voxel } from '../lib/pieces';
import type { Puzzle } from '../lib/puzzles';
import { canPlace, completion, rotateCubes } from '../lib/practice';
import { normalize, type Placement } from '../lib/solver';
import { PieceIcon } from './PieceIcon';
import { SceneBoundary } from './SceneBoundary';
import './PracticeBoard.css';

const PracticeScene = lazy(() => import('./PracticeScene').then(module => ({ default: module.PracticeScene })));
type Language = 'en' | 'sk';
interface Props { puzzle: Puzzle; language: Language }
interface Snapshot { placements: Placement[]; selectedId: number; orientation: Voxel[]; anchor: Voxel }
const key = (v: readonly number[]) => v.join(',');
const copy = (snapshot: Snapshot): Snapshot => ({ ...snapshot, placements: snapshot.placements.map(p => ({ ...p, cubes: p.cubes.map(v => [...v] as Voxel) })), orientation: snapshot.orientation.map(v => [...v] as Voxel), anchor: [...snapshot.anchor] as Voxel });

const messages = {
  en: {
    title: 'Try the puzzle', intro: 'Choose a piece, rotate it, then select its anchor on either layer and place it. The anchor is the lower corner of the piece’s bounding box.',
    pieces: 'Choose a piece', piece: 'Piece', placed: 'placed', rotate: 'Rotate 90°', orientation: 'Current orientation', anchor: 'Anchor', place: 'Place piece', remove: 'Remove', undo: 'Undo', reset: 'Reset puzzle',
    bottom: 'Bottom layer', top: 'Top layer', grid: 'Choose an anchor', empty: 'empty', hole: 'outside footprint; anchor reference only', proposal: 'candidate', selected: 'selected anchor',
    outside: 'This position extends outside the footprint or above two layers.', overlap: 'This position overlaps a placed piece.', duplicate: 'All copies of this piece are already placed.', shape: 'Choose a valid rotation of a required piece.',
    ready: 'Fits here. Place this piece when ready.', allPlaced: 'All required pieces are placed.', success: 'Solved! Every cell in both layers is filled exactly once.', progress: 'cubes placed',
    layerHelp: 'Both grids show the same footprint. +x points right; +y points up. Numbers identify placed pieces; dashed cells show the candidate. Empty spaces can serve as anchors when a rotated piece does not occupy its own bounding-box corner.',
    preview: 'Your assembly', previewHelp: 'Drag the preview to orbit; pinch or scroll to zoom. The translucent piece is your proposed placement.',
    no3d: '3D preview is unavailable. Both layer grids and all puzzle controls still work.', loading: 'Loading 3D preview…', placements: 'Placed pieces', none: 'No pieces placed yet.',
    noHints: 'This mode checks your own arrangement without showing a solution.', placedAction: 'Piece placed.', removedAction: 'Piece removed.', undoAction: 'Last change undone.', resetAction: 'Puzzle reset.',
  },
  sk: {
    title: 'Vyskúšajte puzzle', intro: 'Vyberte dielik, otočte ho a vyberte jeho kotviaci bod v jednej z vrstiev. Potom ho umiestnite. Kotviaci bod je dolný roh ohraničujúceho kvádra dielika.',
    pieces: 'Vyberte dielik', piece: 'Dielik', placed: 'umiestnený', rotate: 'Otočiť o 90°', orientation: 'Aktuálne natočenie', anchor: 'Kotviaci bod', place: 'Umiestniť dielik', remove: 'Odobrať', undo: 'Späť', reset: 'Začať odznova',
    bottom: 'Spodná vrstva', top: 'Horná vrstva', grid: 'Vyberte kotviaci bod', empty: 'prázdne', hole: 'mimo pôdorysu; iba kotviaci bod', proposal: 'návrh', selected: 'vybraný kotviaci bod',
    outside: 'V tejto polohe dielik presahuje pôdorys alebo výšku dvoch vrstiev.', overlap: 'V tejto polohe sa dielik prekrýva s umiestneným dielikom.', duplicate: 'Všetky kópie tohto dielika sú už umiestnené.', shape: 'Vyberte platné natočenie požadovaného dielika.',
    ready: 'Sem dielik pasuje. Môžete ho umiestniť.', allPlaced: 'Všetky požadované dieliky sú umiestnené.', success: 'Vyriešené! Každé políčko oboch vrstiev je vyplnené práve raz.', progress: 'kociek umiestnených',
    layerHelp: 'Obe mriežky zobrazujú rovnaký pôdorys. +x smeruje doprava; +y smeruje nahor. Čísla označujú dieliky, prerušovaný okraj návrh. Aj medzera môže byť kotviacim bodom, ak otočený dielik nevypĺňa roh svojho ohraničujúceho kvádra.',
    preview: 'Vaša zostava', previewHelp: 'Ťahaním náhľad otáčate; priblíženie zmeníte gestom alebo kolieskom. Priehľadný dielik ukazuje navrhované umiestnenie.',
    no3d: '3D náhľad nie je dostupný. Obe mriežky vrstiev a všetky ovládacie prvky ďalej fungujú.', loading: 'Načítava sa 3D náhľad…', placements: 'Umiestnené dieliky', none: 'Zatiaľ nie je umiestnený žiadny dielik.',
    noHints: 'Tento režim kontroluje vašu zostavu bez zobrazenia riešenia.', placedAction: 'Dielik bol umiestnený.', removedAction: 'Dielik bol odobratý.', undoAction: 'Posledná zmena bola vrátená.', resetAction: 'Puzzle bolo obnovené.',
  },
};

export function PracticeBoard(props: Props) {
  // A new puzzle gets an entirely new editor state, including undo history.
  return <PracticeEditor key={props.puzzle.code} {...props} />;
}

function PracticeEditor({ puzzle, language }: Props) {
  const t = messages[language];
  const bounds = useMemo(() => ({ minX: Math.min(...puzzle.footprint.map(v => v[0])), maxX: Math.max(...puzzle.footprint.map(v => v[0])), minY: Math.min(...puzzle.footprint.map(v => v[1])), maxY: Math.max(...puzzle.footprint.map(v => v[1])) }), [puzzle]);
  const initial = (): Snapshot => ({ placements: [], selectedId: puzzle.pieceIds[0], orientation: normalize(getPiece(puzzle.pieceIds[0]).cubes), anchor: [bounds.minX, bounds.minY, 0] });
  const [state, setState] = useState<Snapshot>(initial);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [announcement, setAnnouncement] = useState<'placedAction' | 'removedAction' | 'undoAction' | 'resetAction' | null>(null);
  const required = useMemo(() => new Map(puzzle.pieceIds.map(id => [id, puzzle.pieceIds.filter(value => value === id).length])), [puzzle]);
  const countPlaced = (id: number, placements = state.placements) => placements.filter(p => p.pieceId === id).length;
  const selectedAvailable = countPlaced(state.selectedId) < (required.get(state.selectedId) ?? 0);
  const proposal = useMemo(() => canPlace(puzzle, state.placements, state.selectedId, state.orientation, state.anchor), [puzzle, state]);
  const done = useMemo(() => completion(puzzle, state.placements), [puzzle, state.placements]);
  const occupied = useMemo(() => new Map(state.placements.flatMap(p => p.cubes.map(v => [key(v), p.pieceId] as const))), [state.placements]);
  const candidate = selectedAvailable ? { pieceId: state.selectedId, cubes: proposal.cubes, valid: proposal.valid } : null;
  const candidateCells = new Set(candidate?.cubes.map(key));
  const footprint = new Set(puzzle.footprint.map(key));
  const width = bounds.maxX - bounds.minX + 1;
  const xs = Array.from({ length: width }, (_, index) => bounds.minX + index);
  const ys = Array.from({ length: bounds.maxY - bounds.minY + 1 }, (_, index) => bounds.maxY - index);
  const totalCubes = puzzle.footprint.length * 2;
  const commit = (next: Snapshot, action: typeof announcement) => {
    setHistory(previous => [...previous, copy(state)]);
    setState(next);
    setAnnouncement(action);
  };
  function placePiece() {
    if (!selectedAvailable || !proposal.valid) return;
    const placements = [...state.placements, { pieceId: state.selectedId, cubes: proposal.cubes }];
    const nextId = puzzle.pieceIds.find(id => countPlaced(id, placements) < (required.get(id) ?? 0));
    commit({ placements, selectedId: nextId ?? state.selectedId, orientation: normalize(getPiece(nextId ?? state.selectedId).cubes), anchor: [...state.anchor] as Voxel }, 'placedAction');
  }
  function removePiece(index: number) {
    const removed = state.placements[index];
    const anchor = [0, 1, 2].map(axis => Math.min(...removed.cubes.map(v => v[axis]))) as Voxel;
    commit({ placements: state.placements.filter((_, i) => i !== index), selectedId: removed.pieceId, orientation: normalize(removed.cubes), anchor }, 'removedAction');
  }
  const validityMessage = done ? t.success : !selectedAvailable ? t.allPlaced : proposal.valid ? t.ready : t[proposal.reason ?? 'shape'];

  return <section className="practice-board" aria-labelledby={`practice-title-${puzzle.code}`}>
    <div className="practice-heading"><div><h3 id={`practice-title-${puzzle.code}`}>{t.title}</h3><p>{t.noHints}</p></div><span className="practice-progress">{occupied.size}/{totalCubes} {t.progress}</span></div>
    <p className="practice-intro">{t.intro}</p>
    <div className="practice-layout">
      <div className="practice-controls">
        <fieldset className="practice-piece-picker"><legend>{t.pieces}</legend><div className="practice-piece-options">
          {[...required].map(([id, count]) => {
            const piece = getPiece(id), placedCount = countPlaced(id), unavailable = placedCount >= count;
            return <button key={id} type="button" data-practice-piece-id={id} className={`practice-piece-option${state.selectedId === id ? ' practice-piece-selected' : ''}`} disabled={unavailable} aria-pressed={state.selectedId === id && !unavailable} aria-label={`${language === 'sk' ? 'Vybrať dielik' : 'Select piece'} #${String(id).padStart(2, '0')}${unavailable ? `, ${t.placed}` : ''}`} onClick={() => { setState(previous => ({ ...previous, selectedId: id, orientation: normalize(piece.cubes) })); setAnnouncement(null); }}>
              <PieceIcon cubes={piece.cubes} color={piece.hex} /><strong>#{id}</strong><small>{unavailable ? t.placed : count > 1 ? `${placedCount}/${count}` : `${piece.cubes.length} ◻`}</small>
            </button>;
          })}
        </div></fieldset>
        {selectedAvailable && <div className="practice-orientation"><div className="practice-current"><PieceIcon cubes={state.orientation} color={getPiece(state.selectedId).hex} /><span>{t.orientation}<strong>#{state.selectedId}</strong></span></div><div className="practice-rotations">
          {(['x', 'y', 'z'] as const).map(axis => <button type="button" key={axis} data-practice-rotate={axis} aria-label={language === 'sk' ? `Otočiť ${axis.toUpperCase()} o 90°` : `Rotate ${axis.toUpperCase()} 90°`} onClick={() => { setState(previous => ({ ...previous, orientation: rotateCubes(previous.orientation, axis) })); setAnnouncement(null); }}>{t.rotate} <strong>{axis.toUpperCase()}</strong></button>)}
        </div></div>}
        <div className="practice-anchor"><strong>{t.anchor}</strong><output aria-label={t.anchor}>x={state.anchor[0]}, y={state.anchor[1]}, z={state.anchor[2]}</output></div>
        <p className={`practice-validity${done ? ' practice-complete' : proposal.valid && selectedAvailable ? ' practice-valid' : ''}`} role="status" aria-live="polite">{validityMessage}</p>
        <button className="practice-place" type="button" disabled={!selectedAvailable || !proposal.valid || done} onClick={placePiece}>{t.place} {selectedAvailable ? `#${state.selectedId}` : ''}</button>
        <div className="practice-history"><button type="button" disabled={!history.length} onClick={() => { const previous = history[history.length-1]; if (!previous) return; setState(previous); setHistory(old => old.slice(0, -1)); setAnnouncement('undoAction'); }}>{t.undo}</button><button type="button" onClick={() => commit(initial(), 'resetAction')}>{t.reset}</button></div>
        <span className="practice-sr-only" role="status" aria-live="polite">{announcement ? t[announcement] : ''}</span>
        <div className="practice-placed-list"><h4>{t.placements}</h4>{!state.placements.length ? <p>{t.none}</p> : <ul>{state.placements.map((placement, index) => <li key={`${placement.pieceId}-${index}`}><span><i style={{ background: getPiece(placement.pieceId).hex }} />{t.piece} #{placement.pieceId}</span><button type="button" aria-label={`${t.remove} ${t.piece.toLowerCase()} ${placement.pieceId}`} onClick={() => removePiece(index)}>{t.remove}</button></li>)}</ul>}</div>
      </div>
      <div className="practice-playground">
        <div className="practice-preview-heading"><h4>{t.preview}</h4><p>{t.previewHelp}</p></div>
        <SceneBoundary key={puzzle.code} fallback={<p className="practice-fallback">{t.no3d}</p>}><Suspense fallback={<p className="practice-fallback">{t.loading}</p>}><PracticeScene puzzle={puzzle} placements={state.placements} candidate={candidate} language={language} /></Suspense></SceneBoundary>
        <div className="practice-layer-grids">{([0, 1] as const).map(z => <fieldset key={z} className="practice-layer"><legend>{z === 0 ? t.bottom : t.top} <span>z={z}</span></legend><div className="practice-grid" role="group" aria-label={`${t.grid}: ${z === 0 ? t.bottom : t.top}`} style={{ gridTemplateColumns: `1.4rem repeat(${width}, minmax(2rem, 1fr))` }}>
          <span className="practice-axis" aria-hidden="true">y↑</span>{xs.map(x => <span className="practice-axis" key={`header-${x}`} aria-hidden="true">{x}</span>)}
          {ys.flatMap(y => [<span className="practice-axis" key={`row-${y}`} aria-hidden="true">{y}</span>, ...xs.map(x => {
            const coordinate = [x, y, z] as Voxel, cellKey = key(coordinate), inBoard = footprint.has(key([x, y]));
            const owner = occupied.get(cellKey), ghost = candidateCells.has(cellKey), selected = state.anchor.every((v, axis) => v === coordinate[axis]);
            const style = owner ? { '--practice-piece': getPiece(owner).hex } as CSSProperties : undefined;
            return <button type="button" key={cellKey} data-x={x} data-y={y} data-z={z} className={`practice-cell${inBoard ? '' : ' practice-hole'}${owner ? ' practice-filled' : ''}${ghost ? ` practice-ghost${proposal.valid ? '' : ' practice-ghost-invalid'}` : ''}${selected ? ' practice-anchor-selected' : ''}`} style={style} aria-pressed={selected} aria-label={`x ${x}, y ${y}, z ${z}; ${owner ? `${t.piece} ${owner}` : inBoard ? t.empty : t.hole}${ghost ? `; ${t.proposal} ${state.selectedId}` : ''}${selected ? `; ${t.selected}` : ''}`} onClick={() => { setState(previous => ({ ...previous, anchor: coordinate })); setAnnouncement(null); }}>
              {owner ? <strong>{owner}</strong> : ghost ? <span className="practice-ghost-id">{state.selectedId}</span> : <span aria-hidden="true">{inBoard ? '·' : ''}</span>}{selected && <span className="practice-anchor-mark" aria-hidden="true">⌖</span>}
            </button>;
          })])}
          <span className="practice-axis practice-axis-x" style={{ gridColumn: `2 / span ${width}` }} aria-hidden="true">x →</span>
        </div></fieldset>)}</div>
        <p className="practice-layer-help">{t.layerHelp}</p>
        <div className="practice-mobile-actions">
          <p>{validityMessage}</p>
          <button type="button" className="practice-bottom-place" disabled={!selectedAvailable || !proposal.valid || done} onClick={placePiece}>{language === 'sk' ? 'Potvrdiť umiestnenie' : 'Confirm placement'} {selectedAvailable ? `#${state.selectedId}` : ''}</button>
        </div>
      </div>
    </div>
  </section>;
}
