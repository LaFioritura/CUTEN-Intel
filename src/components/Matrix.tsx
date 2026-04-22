import { Fragment } from 'react';
import type { LaneState } from '../types/app';

interface MatrixProps {
  lanes: LaneState[];
  currentStep: number;
  onToggle: (laneId: LaneState['id'], index: number) => void;
}

export function Matrix({ lanes, currentStep, onToggle }: MatrixProps) {
  return (
    <div className="panel matrix-panel">
      <div className="panel-title">SEQUENCER MATRIX</div>
      <div className="matrix-grid">
        <div className="matrix-header lane-cell blank">LANE</div>
        {Array.from({ length: 16 }, (_, index) => (
          <div key={index} className={`matrix-header step-cell ${currentStep === index ? 'current-step' : ''}`}>
            {index + 1}
          </div>
        ))}
        {lanes.map((lane) => (
          <Fragment key={lane.id}>
            <div key={`${lane.id}-label`} className="lane-cell lane-label">
              <span>{lane.label}</span>
              <span className="lane-tag">{lane.colorTag}</span>
            </div>
            {lane.steps.map((value, index) => (
              <button
                key={`${lane.id}-${index}`}
                className={`step-button ${value > 0 ? 'active' : ''} ${currentStep === index ? 'playing' : ''}`}
                onClick={() => onToggle(lane.id, index)}
                title={`${lane.label} / step ${index + 1}`}
              >
                {value > 0 ? Math.round(value * 9) : ''}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
