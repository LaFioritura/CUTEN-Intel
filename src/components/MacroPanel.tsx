import type { ChangeEvent } from 'react';
import type { Macros } from '../types/app';

interface MacroPanelProps {
  macros: Macros;
  onChange: (patch: Partial<Macros>) => void;
}

export function MacroPanel({ macros, onChange }: MacroPanelProps) {
  return (
    <div className="panel macro-panel">
      <div className="panel-title">GLOBAL DNA</div>
      {Object.entries(macros).map(([key, value]) => (
        <label key={key} className="slider-row">
          <span>{key.toUpperCase()}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ [key]: Number(event.target.value) } as Partial<Macros>)}
          />
          <em>{value.toFixed(2)}</em>
        </label>
      ))}
    </div>
  );
}
