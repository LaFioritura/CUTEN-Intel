import type { LaneState, Macros } from '../types/app';

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

function seededChance(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

export function mutateLanePattern(lane: LaneState, macros: Macros, barSeed: number): LaneState {
  const next = [...lane.steps];
  const lanePressure = clamp((lane.density + lane.variation + lane.chaos + macros.complexity) / 4);

  for (let i = 0; i < next.length; i += 1) {
    const seed = barSeed * 100 + i * 13 + lane.id.length;
    const random = seededChance(seed);
    const hitProbability = clamp(lane.density * 0.8 + macros.energy * 0.25 - (i % 4 === 0 ? 0 : 0.08));
    const mutateProbability = clamp(lane.variation * 0.55 + lane.chaos * 0.4 + macros.glitch * 0.25);

    if (random < mutateProbability * 0.45) {
      next[i] = next[i] > 0 ? 0 : clamp(hitProbability + lanePressure * 0.15);
    } else if (next[i] > 0) {
      next[i] = clamp(next[i] + (random - 0.5) * (0.25 + lane.variation * 0.35));
    }
  }

  if (lane.id === 'kick') {
    next[0] = Math.max(next[0], 1);
    if (macros.energy > 0.72) next[14] = Math.max(next[14], 0.55);
  }

  if (lane.id === 'snare') {
    next[4] = Math.max(next[4], 0.95);
    next[12] = Math.max(next[12], 0.95);
  }

  if (lane.id === 'hat') {
    for (let i = 0; i < 16; i += 2) next[i] = Math.max(next[i], 0.28 + macros.energy * 0.25);
  }

  if (lane.id === 'drone') {
    next.fill(0);
    next[0] = 1;
    next[4] = macros.darkness > 0.5 ? 0.6 : 0;
    next[8] = 0.8;
    next[12] = macros.tension > 0.7 ? 0.9 : 0.4;
  }

  return { ...lane, steps: next.map((value) => Math.round(clamp(value) * 100) / 100) };
}

export function randomizeSingleStep(lane: LaneState, index: number): LaneState {
  const next = [...lane.steps];
  next[index] = next[index] > 0 ? 0 : 1;
  return { ...lane, steps: next };
}

export function regenerateLane(lane: LaneState, macros: Macros, seed: number): LaneState {
  return mutateLanePattern({ ...lane, steps: lane.steps.map(() => 0) }, macros, seed + 7);
}
