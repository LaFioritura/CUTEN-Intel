import { MusicScore } from './aiService';

export interface ComposerDNA {
  complexity: number; // 0 to 1
  energy: number; // 0 to 1
  darkness: number; // 0 to 1
  industrial: number; // 0 to 1
}

export const generateAlgorithmicPatterns = (dna: ComposerDNA) => {
  const steps = 16;
  const { complexity, energy, darkness, industrial } = dna;

  const patterns = {
    kick: Array(steps).fill(0),
    snare: Array(steps).fill(0),
    hihat: Array(steps).fill(0),
    acid: Array(steps).fill(0),
    sub: Array(steps).fill(0),
    neuro: Array(steps).fill(0),
    perc: Array(steps).fill(0),
    glitch: Array(steps).fill(0),
    spectral: Array(steps).fill(0)
  };

  // Kick: Bunker Standard
  for (let i = 0; i < steps; i += 4) {
    patterns.kick[i] = 1;
  }
  if (energy > 0.7) {
    patterns.kick[14] = 0.5; // Occasional tail
  }
  if (complexity > 0.6) {
    patterns.kick[10] = 0.3;
  }

  // Snare: Industrial claps
  for (let i = 4; i < steps; i += 8) {
    patterns.snare[i] = 1;
  }
  if (industrial > 0.5) {
    patterns.snare[12] = 0.4;
  }

  // Hihat: Offbeat
  for (let i = 2; i < steps; i += 4) {
    patterns.hihat[i] = 0.8;
  }
  if (energy > 0.5) {
    for (let i = 0; i < steps; i += 2) {
      patterns.hihat[i] = patterns.hihat[i] || 0.4;
    }
  }

  // Sub: Pulse
  for (let i = 0; i < steps; i += 1) {
    if (i % 4 !== 0) patterns.sub[i] = 1; // Sidechained feeling
  }

  // Neuro / Acid : Euclidean-ish or Probabilistic
  const density = Math.floor(3 + complexity * 8);
  for (let i = 0; i < density; i++) {
    const pos = Math.floor((i * steps) / density) % steps;
    patterns.neuro[pos] = 1;
    if (darkness > 0.5 && (pos + 1) < steps) patterns.acid[pos + 1] = 0.5;
  }

  return patterns;
};

export const generateAlgorithmicAutomation = (dna: ComposerDNA) => {
  const steps = 16;
  const { darkness, industrial } = dna;
  
  return {
    filterCutoff: Array(steps).fill(0).map((_, i) => 0.3 + Math.sin(i / 2) * 0.2 + (1 - darkness) * 0.4),
    distortionAmount: Array(steps).fill(0).map(() => 0.1 + industrial * 0.5),
    rumbleIntensity: Array(steps).fill(0).map(() => 0.2 + industrial * 0.6),
    reverbWet: Array(steps).fill(0).map(() => 0.1 + darkness * 0.3),
    noiseTexture: Array(steps).fill(0.2)
  };
};
