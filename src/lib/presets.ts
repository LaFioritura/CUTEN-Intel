import type { LaneId, LaneState, Macros, ScenePreset } from '../types/app';

const emptySteps = () => Array.from({ length: 16 }, () => 0);

export const createDefaultLanes = (): LaneState[] => [
  { id: 'kick', label: 'KICK', colorTag: 'GN', steps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], density: 0.62, variation: 0.2, tone: 0.45, decay: 0.4, chaos: 0.12, muted: false, solo: false },
  { id: 'snare', label: 'SNARE', colorTag: 'OR', steps: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], density: 0.42, variation: 0.18, tone: 0.52, decay: 0.38, chaos: 0.14, muted: false, solo: false },
  { id: 'hat', label: 'HAT', colorTag: 'BL', steps: [0.4,0,0.8,0,0.4,0,0.8,0,0.4,0,0.8,0,0.4,0,0.8,0], density: 0.85, variation: 0.3, tone: 0.7, decay: 0.18, chaos: 0.16, muted: false, solo: false },
  { id: 'perc', label: 'PERC', colorTag: 'YL', steps: [0,0,0.5,0,0,0,0.4,0,0,0.3,0,0,0,0,0.6,0], density: 0.38, variation: 0.44, tone: 0.63, decay: 0.22, chaos: 0.36, muted: false, solo: false },
  { id: 'sub', label: 'SUB', colorTag: 'GN', steps: [1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0], density: 0.52, variation: 0.16, tone: 0.3, decay: 0.5, chaos: 0.08, muted: false, solo: false },
  { id: 'bass', label: 'BASS', colorTag: 'OR', steps: [0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1], density: 0.58, variation: 0.46, tone: 0.58, decay: 0.42, chaos: 0.31, muted: false, solo: false },
  { id: 'lead', label: 'LEAD', colorTag: 'BL', steps: [0,0,0,1,0,0,0.7,0,0,0,0,1,0,0,0.6,0], density: 0.36, variation: 0.55, tone: 0.68, decay: 0.35, chaos: 0.37, muted: false, solo: false },
  { id: 'drone', label: 'DRONE', colorTag: 'WH', steps: [1,0,0,0,1,0,0,0,1,0,0,0,0.5,0,0,0], density: 0.24, variation: 0.14, tone: 0.2, decay: 0.9, chaos: 0.09, muted: false, solo: false }
];

export const defaultMacros: Macros = {
  energy: 0.62,
  tension: 0.54,
  darkness: 0.72,
  complexity: 0.58,
  space: 0.34,
  glitch: 0.18,
  swing: 0.04
};

export const scenePresets: ScenePreset[] = [
  {
    id: 'black-room',
    name: 'BLACK ROOM',
    description: 'Dense warehouse pressure with sharp hats and restrained lead.',
    bpm: 126,
    macros: { ...defaultMacros, energy: 0.72, tension: 0.66, darkness: 0.84, glitch: 0.14 },
    laneTweaks: {
      kick: { density: 0.7, tone: 0.4 },
      hat: { density: 0.94, decay: 0.14 },
      lead: { density: 0.2, muted: true }
    }
  },
  {
    id: 'underpass',
    name: 'UNDERPASS',
    description: 'Broken-grid nocturnal extractor with more movement in bass and perc.',
    bpm: 134,
    macros: { ...defaultMacros, energy: 0.68, tension: 0.58, complexity: 0.7, glitch: 0.32 },
    laneTweaks: {
      perc: { density: 0.62, variation: 0.76 },
      bass: { variation: 0.72, chaos: 0.45 },
      drone: { density: 0.14 }
    }
  },
  {
    id: 'null-sector',
    name: 'NULL SECTOR',
    description: 'More empty space, colder textures, sinister drone.',
    bpm: 118,
    macros: { ...defaultMacros, energy: 0.42, tension: 0.62, darkness: 0.9, space: 0.58 },
    laneTweaks: {
      kick: { density: 0.45 },
      snare: { density: 0.34 },
      drone: { density: 0.42, tone: 0.12, decay: 0.98 },
      lead: { muted: false, density: 0.22, tone: 0.44 }
    }
  },
  {
    id: 'extraction-run',
    name: 'EXTRACTION RUN',
    description: 'Fast and driving, with more aggressive transients and wider bass pulse.',
    bpm: 142,
    macros: { ...defaultMacros, energy: 0.88, tension: 0.83, complexity: 0.64, darkness: 0.68, glitch: 0.26 },
    laneTweaks: {
      kick: { density: 0.82, decay: 0.32 },
      snare: { density: 0.58 },
      hat: { density: 0.98 },
      bass: { density: 0.72 },
      lead: { density: 0.46 }
    }
  }
];

export const laneOrder: LaneId[] = ['kick', 'snare', 'hat', 'perc', 'sub', 'bass', 'lead', 'drone'];

export const resetSteps = (): Record<LaneId, number[]> => ({
  kick: emptySteps(),
  snare: emptySteps(),
  hat: emptySteps(),
  perc: emptySteps(),
  sub: emptySteps(),
  bass: emptySteps(),
  lead: emptySteps(),
  drone: emptySteps()
});
