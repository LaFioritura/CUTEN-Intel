import * as Tone from 'tone';
import type { LaneId, LaneState, Macros } from '../types/app';

const laneNotes: Record<LaneId, string[]> = {
  kick: ['C1'],
  snare: ['D1'],
  hat: ['F#1'],
  perc: ['A1', 'C2'],
  sub: ['C2', 'A#1', 'G1'],
  bass: ['C2', 'D#2', 'G2', 'A#1'],
  lead: ['C4', 'D#4', 'G4', 'A#4', 'G4'],
  drone: ['C2', 'A#1']
};

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private limiter: Tone.Limiter;
  private compressor: Tone.Compressor;
  private filter: Tone.Filter;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;
  private recorder: Tone.Recorder;
  private kick: Tone.MembraneSynth;
  private snare: Tone.NoiseSynth;
  private hat: Tone.MetalSynth;
  private perc: Tone.MetalSynth;
  private sub: Tone.MonoSynth;
  private bass: Tone.MonoSynth;
  private lead: Tone.FMSynth;
  private drone: Tone.Oscillator;
  private stepPart: Tone.Loop | null = null;
  private step = 0;
  private active = false;
  private phase = 0;

  private constructor() {
    this.recorder = new Tone.Recorder();
    this.limiter = new Tone.Limiter(-2).toDestination();
    this.compressor = new Tone.Compressor({ threshold: -18, ratio: 3 }).connect(this.limiter);
    this.filter = new Tone.Filter(14000, 'lowpass').connect(this.compressor);
    this.delay = new Tone.FeedbackDelay('8n', 0.12).connect(this.filter);
    this.reverb = new Tone.Reverb({ decay: 2.2, wet: 0.18 }).connect(this.filter);
    this.filter.connect(this.recorder);

    this.kick = new Tone.MembraneSynth({ envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.1 } }).connect(this.filter);
    this.snare = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0 } }).connect(this.filter);
    this.hat = new Tone.MetalSynth({ frequency: 250, envelope: { attack: 0.001, decay: 0.05, release: 0.03 }, harmonicity: 5.1, modulationIndex: 24, resonance: 1800, octaves: 1.5 }).connect(this.filter);
    this.perc = new Tone.MetalSynth({ frequency: 180, envelope: { attack: 0.001, decay: 0.1, release: 0.06 }, harmonicity: 8, modulationIndex: 10, resonance: 1200, octaves: 1.2 }).connect(this.delay);
    this.sub = new Tone.MonoSynth({ oscillator: { type: 'square' }, filter: { Q: 1 }, envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.18 } }).connect(this.filter);
    this.bass = new Tone.MonoSynth({ oscillator: { type: 'sawtooth' }, filterEnvelope: { attack: 0.02, decay: 0.12, sustain: 0.2, release: 0.18, baseFrequency: 120, octaves: 3 }, envelope: { attack: 0.005, decay: 0.18, sustain: 0.12, release: 0.12 } }).connect(this.filter);
    this.lead = new Tone.FMSynth({ harmonicity: 2.2, modulationIndex: 8, envelope: { attack: 0.01, decay: 0.12, sustain: 0.08, release: 0.1 }, modulationEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.05, release: 0.05 } }).connect(this.reverb);
    this.drone = new Tone.Oscillator(48, 'sine').connect(this.reverb);
    this.drone.volume.value = -100;
  }

  static getInstance() {
    if (!this.instance) this.instance = new AudioEngine();
    return this.instance;
  }

  async start(lanes: LaneState[], macros: Macros, bpm: number) {
    await Tone.start();
    await this.reverb.ready;
    Tone.Transport.bpm.value = bpm;
    this.applyMacros(macros);
    if (this.drone.state !== 'started') this.drone.start();
    this.installLoop(lanes, macros);
    Tone.Transport.start();
    this.active = true;
  }

  stop() {
    Tone.Transport.stop();
    this.stepPart?.dispose();
    this.stepPart = null;
    this.step = 0;
    this.drone.volume.rampTo(-100, 0.05);
    this.active = false;
  }

  setBpm(bpm: number) {
    Tone.Transport.bpm.rampTo(bpm, 0.1);
  }

  applyMacros(macros: Macros) {
    this.filter.frequency.rampTo(1800 + macros.energy * 15000, 0.08);
    this.filter.Q.value = 0.8 + macros.tension * 6;
    this.delay.feedback.rampTo(0.08 + macros.glitch * 0.36, 0.08);
    this.delay.wet.rampTo(macros.space * 0.22, 0.08);
    this.reverb.wet.rampTo(0.05 + macros.space * 0.32, 0.08);
    this.compressor.threshold.rampTo(-16 - macros.energy * 8, 0.08);
    this.drone.frequency.rampTo(34 + macros.darkness * 26, 0.2);
  }

  private installLoop(lanes: LaneState[], macros: Macros) {
    this.stepPart?.dispose();
    this.step = 0;
    this.stepPart = new Tone.Loop((time) => {
      this.phase += 1;
      const soloed = lanes.filter((lane) => lane.solo && !lane.muted).map((lane) => lane.id);
      for (const lane of lanes) {
        if (lane.muted) continue;
        if (soloed.length > 0 && !soloed.includes(lane.id)) continue;
        const velocity = lane.steps[this.step] ?? 0;
        if (velocity > 0) this.fireLane(lane.id, velocity, lane, macros, time);
      }
      this.step = (this.step + 1) % 16;
    }, '16n');
    this.stepPart.start(0);
  }

  private fireLane(id: LaneId, velocity: number, lane: LaneState, macros: Macros, time: number) {
    const dynamicVelocity = Math.max(0.05, Math.min(1, velocity + lane.variation * 0.15 - lane.chaos * 0.08));
    const phrase = laneNotes[id];
    const note = phrase[(this.phase + Math.round(lane.chaos * 4)) % phrase.length];

    switch (id) {
      case 'kick':
        this.kick.octaves = 2 + macros.energy * 3;
        this.kick.triggerAttackRelease('C1', 0.12 + lane.decay * 0.3, time, dynamicVelocity);
        break;
      case 'snare':
        this.snare.triggerAttackRelease(0.05 + lane.decay * 0.14, time, dynamicVelocity);
        break;
      case 'hat':
        this.hat.resonance = 1000 + lane.tone * 3000;
        this.hat.triggerAttackRelease('32n', time, dynamicVelocity * 0.8);
        break;
      case 'perc':
        this.perc.frequency = 120 + lane.tone * 220;
        this.perc.triggerAttackRelease('16n', time, dynamicVelocity * 0.7);
        break;
      case 'sub':
        this.sub.filter.Q.value = 1 + macros.darkness * 6;
        this.sub.triggerAttackRelease(note, 0.18 + lane.decay * 0.25, time, dynamicVelocity * 0.8);
        break;
      case 'bass':
        this.bass.triggerAttackRelease(note, 0.12 + lane.decay * 0.2, time, dynamicVelocity * 0.65);
        break;
      case 'lead':
        this.lead.modulationIndex.value = 6 + lane.tone * 12;
        this.lead.triggerAttackRelease(note, 0.08 + lane.decay * 0.18, time, dynamicVelocity * 0.55);
        break;
      case 'drone':
        this.drone.volume.rampTo(-34 + dynamicVelocity * 8, 0.06);
        break;
    }
  }

  async startRecording() {
    await this.recorder.start();
  }

  async stopRecording(): Promise<Blob> {
    return this.recorder.stop();
  }

  isRunning() {
    return this.active;
  }
}
