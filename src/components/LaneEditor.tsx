import type { ChangeEvent, MouseEvent } from 'react';
import type { LaneState } from '../types/app';

interface LaneEditorProps {
  lane: LaneState;
  onSelect: () => void;
  selected: boolean;
  onPatch: (patch: Partial<LaneState>) => void;
  onRandomize: () => void;
}

const sliders: Array<keyof Pick<LaneState, 'density' | 'variation' | 'tone' | 'decay' | 'chaos'>> = [
  'density',
  'variation',
  'tone',
  'decay',
  'chaos'
];

export function LaneEditor({ lane, onSelect, selected, onPatch, onRandomize }: LaneEditorProps) {
  const stop = (event: MouseEvent<HTMLButtonElement>) => event.stopPropagation();

  return (
    <div className={`lane-editor ${selected ? 'selected' : ''}`}>
      <div className="lane-editor-top" onClick={onSelect}>
        <strong>{lane.label}</strong>
        <div className="lane-actions">
          <button className={`mini-btn ${lane.muted ? 'alert' : ''}`} onClick={(event) => { stop(event); onPatch({ muted: !lane.muted }); }}>
            {lane.muted ? 'MUTED' : 'MUTE'}
          </button>
          <button className={`mini-btn ${lane.solo ? 'accent' : ''}`} onClick={(event) => { stop(event); onPatch({ solo: !lane.solo }); }}>
            {lane.solo ? 'SOLO ON' : 'SOLO'}
          </button>
          <button className="mini-btn" onClick={(event) => { stop(event); onRandomize(); }}>
            MUTATE
          </button>
        </div>
      </div>
      <div className="lane-slider-list">
        {sliders.map((key) => (
          <label key={key} className="slider-row">
            <span>{key.toUpperCase()}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={lane[key]}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onPatch({ [key]: Number(event.target.value) } as Partial<LaneState>)}
            />
            <em>{lane[key].toFixed(2)}</em>
          </label>
        ))}
      </div>
    </div>
  );
}
