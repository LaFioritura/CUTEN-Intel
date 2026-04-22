export type LaneId =
  | 'kick'
  | 'snare'
  | 'hat'
  | 'perc'
  | 'sub'
  | 'bass'
  | 'lead'
  | 'drone';

export interface LaneState {
  id: LaneId;
  label: string;
  colorTag: string;
  steps: number[];
  density: number;
  variation: number;
  tone: number;
  decay: number;
  chaos: number;
  muted: boolean;
  solo: boolean;
}

export interface Macros {
  energy: number;
  tension: number;
  darkness: number;
  complexity: number;
  space: number;
  glitch: number;
  swing: number;
}

export interface CommerceState {
  freeJsonRemaining: number;
  paidJsonCredits: number;
  recordingUnlocked: boolean;
  totalRevenue: number;
}

export interface MusicScore {
  bpm: number;
  mood: string;
  intensity: number;
  structure: 'empty_space' | 'climax' | 'industrial_flow' | 'fragmentation';
  arrangementPhase: 'exploration' | 'peak' | 'decay';
  tensionLevel: number;
  harmonicFocus: string;
  influence: string;
  bunkerAesthetic: string;
  dna: {
    complexity: number;
    energy: number;
    darkness: number;
    industrial: number;
  };
  leadPhrase: string[];
  padChords: string[];
  droneFrequency: number;
  effects: {
    distortion: number;
    bitcrush: number;
    filterCutoff: number;
    resonance: number;
    delaySend: number;
    reverbSend: number;
    glitchAmount: number;
    rumbleDecay: number;
  };
  artistCommentary: string;
}

export interface ScenePreset {
  id: string;
  name: string;
  description: string;
  bpm: number;
  macros: Macros;
  laneTweaks: Partial<Record<LaneId, Partial<LaneState>>>;
}
