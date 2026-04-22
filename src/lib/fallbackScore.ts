import type { Macros, MusicScore } from '../types/app';

export function makeFallbackScore(macros: Macros, sceneName: string): MusicScore {
  return {
    bpm: 118 + Math.round(macros.energy * 28),
    mood: sceneName,
    intensity: macros.energy,
    structure: macros.space > 0.5 ? 'empty_space' : macros.glitch > 0.4 ? 'fragmentation' : 'industrial_flow',
    arrangementPhase: macros.tension > 0.75 ? 'peak' : macros.energy < 0.45 ? 'decay' : 'exploration',
    tensionLevel: macros.tension,
    harmonicFocus: macros.darkness > 0.7 ? 'minor pressure node' : 'neutral node',
    influence: 'local fallback director',
    bunkerAesthetic: 'operator build / steel chamber / dry voltage',
    dna: {
      complexity: macros.complexity,
      energy: macros.energy,
      darkness: macros.darkness,
      industrial: Math.min(1, (macros.tension + macros.glitch) / 2)
    },
    leadPhrase: ['C4', 'D#4', 'G4', 'A#4', 'G4', 'F4', 'D#4', 'C4'],
    padChords: ['C2', 'G2', 'A#2', 'D#3'],
    droneFrequency: 32 + Math.round(macros.darkness * 24),
    effects: {
      distortion: 0.1 + macros.tension * 0.35,
      bitcrush: 0.05 + macros.glitch * 0.25,
      filterCutoff: 0.25 + macros.energy * 0.55,
      resonance: 0.12 + macros.tension * 0.32,
      delaySend: 0.08 + macros.space * 0.22,
      reverbSend: 0.08 + macros.space * 0.28,
      glitchAmount: macros.glitch,
      rumbleDecay: 0.18 + macros.darkness * 0.45
    },
    artistCommentary: 'Local score generated. Increase tension and variation for a harder extraction window.'
  };
}
