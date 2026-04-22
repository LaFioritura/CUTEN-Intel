import * as Tone from 'tone';

export class AudioEngine {
  private static instance: AudioEngine;
  
  // Synthesis Layers
  public acidSynth: Tone.MonoSynth;
  public industrialFm: Tone.FMSynth;
  public subBass: Tone.MonoSynth;
  public neuroBass: Tone.FatOscillator;
  public spacePad: Tone.PolySynth;
  public glitchSynth: Tone.NoiseSynth;
  public spectralLead: Tone.Oscillator; 
  public droneSynth: Tone.Oscillator;
  
  // Mix Nodes
  private sidechainNode: Tone.Gain;
  private mainBus: Tone.Gain;
  public recorder: Tone.Recorder;
  public curveFilter: Tone.Filter;
  
  // Drum Layers
  public drumKick: Tone.MembraneSynth;
  public drumSnare: Tone.NoiseSynth;
  public drumPerc: Tone.MetalSynth;
  public drumHihat: Tone.NoiseSynth;
  
  // Effect Rack
  public masterDistortion: Tone.Distortion;
  public masterBitcrush: Tone.BitCrusher; 
  public masterFilter: Tone.Filter;
  public masterLimiter: Tone.Limiter;
  public masterDelay: Tone.FeedbackDelay;
  public masterReverb: Tone.Reverb;
  public bridgeCompressor: Tone.Compressor;
  public padChorus: Tone.Chorus;
  public curveGain: Tone.Gain;
  public ribbonGain: Tone.Gain;
  public spectralFilter: Tone.Filter;
  public recursiveDelay: Tone.FeedbackDelay;
  public industrialShift: Tone.FrequencyShifter;
  public pressureNoise: Tone.Noise;
  public pressureGain: Tone.Gain;
  
  // High-Level Bunker Rack
  public rumbleFilter: Tone.Filter;
  public rumbleGain: Tone.Gain;
  public rumbleDelay: Tone.FeedbackDelay;
  public masterOutput: Tone.Gain;

  private constructor() {
    this.recorder = new Tone.Recorder();
    
    // Final Output Section
    this.masterLimiter = new Tone.Limiter(-4).toDestination(); // More aggressive protection
    this.masterOutput = new Tone.Gain(0).connect(this.masterLimiter); 
    this.mainBus = new Tone.Gain(0.4).connect(this.masterOutput); 
    this.mainBus.connect(this.recorder); 
    
    this.bridgeCompressor = new Tone.Compressor({
      threshold: -32,
      ratio: 5,
      attack: 0.01,
      release: 0.2
    });
    const internalLimiter = new Tone.Limiter(-1).connect(this.mainBus);
    this.bridgeCompressor.connect(internalLimiter);

    // Rumble Engine (Post-Kick Transformer) - EXPOSED
    this.rumbleGain = new Tone.Gain(0).connect(this.bridgeCompressor);
    this.rumbleFilter = new Tone.Filter(110, "lowpass").connect(this.rumbleGain);
    const rumbleVerb = new Tone.Reverb({ decay: 1.2, wet: 0.8 }).connect(this.rumbleFilter);
    this.rumbleDelay = new Tone.FeedbackDelay("16n", 0.3).connect(rumbleVerb);
    
    this.masterBitcrush = new Tone.BitCrusher(8).connect(this.bridgeCompressor);
    this.masterDistortion = new Tone.Distortion(0.4).connect(this.masterBitcrush);
    this.masterFilter = new Tone.Filter(20000, "lowpass").connect(this.masterDistortion);
    
    const bassCut = new Tone.Filter(30, "highpass").connect(this.masterFilter);
    this.sidechainNode = new Tone.Gain(1).connect(bassCut);

    // Synthesis Architecture
    this.masterDelay = new Tone.FeedbackDelay("8n.", 0.2).connect(this.masterFilter);
    this.masterReverb = new Tone.Reverb({
      decay: 2.5,
      preDelay: 0.02,
      wet: 0.15
    }).connect(this.masterFilter);

    this.recursiveDelay = new Tone.FeedbackDelay("16n", 0.3).connect(this.masterReverb);
    this.padChorus = new Tone.Chorus(4, 2.5, 0.5).connect(this.masterReverb);
    this.spectralFilter = new Tone.Filter(1500, "bandpass").connect(this.masterDelay);
    this.industrialShift = new Tone.FrequencyShifter(40).connect(this.masterDistortion);

    // Pressure Module (Atmospheric Noise)
    this.pressureNoise = new Tone.Noise("pink").start();
    const pressureFilter = new Tone.Filter(200, "bandpass").connect(this.masterReverb);
    this.pressureGain = new Tone.Gain(0).connect(pressureFilter);
    this.pressureNoise.connect(this.pressureGain);

    // DRONE - For "Void" moments
    this.droneSynth = new Tone.Oscillator(30, "sine").connect(this.sidechainNode);
    this.droneSynth.volume.value = -30;

    // SUB
    this.subBass = new Tone.MonoSynth({
      oscillator: { type: "square" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.2 }
    }).connect(this.sidechainNode);
    this.subBass.volume.value = -12;

    // CURVE SYNTH
    this.curveGain = new Tone.Gain(0).connect(this.sidechainNode);
    this.curveFilter = new Tone.Filter(800, "lowpass").connect(this.curveGain);
    this.neuroBass = new Tone.FatOscillator({
      type: "sawtooth",
      count: 2,
      spread: 25
    }).connect(this.curveFilter);
    this.neuroBass.volume.value = -20;

    // RIBBON SYNTH
    this.ribbonGain = new Tone.Gain(0).connect(this.spectralFilter);
    this.spectralLead = new Tone.Oscillator({
      type: "triangle", 
      frequency: 440
    }).connect(this.ribbonGain);
    this.spectralLead.volume.value = -26;

    // Glitch Module
    const glitchHPF = new Tone.Filter(2500, "highpass").connect(this.recursiveDelay);
    this.glitchSynth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.005, sustain: 0, release: 0.01 }
    }).connect(glitchHPF);
    this.glitchSynth.volume.value = -18;

    // Acid Synth
    const acidHPF = new Tone.Filter(200, "highpass").connect(this.masterFilter);
    this.acidSynth = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.05 },
      filterEnvelope: { attack: 0.001, decay: 0.15, sustain: 0, baseFrequency: 300, octaves: 4 },
      filter: { Q: 10, type: "lowpass", rolloff: -24 }
    }).connect(acidHPF);
    this.acidSynth.volume.value = -12;

    // Bunker Pad Clusters
    const padHPF = new Tone.Filter(350, "highpass").connect(this.padChorus);
    this.spacePad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatcustom", count: 4, spread: 20 },
      envelope: { attack: 3, decay: 2, sustain: 0.4, release: 4 }
    }).connect(padHPF);
    this.spacePad.volume.value = -32;
    this.spacePad.maxPolyphony = 8; 

    // Lead FM
    this.industrialFm = new Tone.FMSynth({
      harmonicity: 3.5,
      modulationIndex: 12,
      oscillator: { type: "sine" },
      modulation: { type: "square" },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.1 }
    }).connect(this.masterDelay);
    this.industrialFm.volume.value = -20;

    // --- DRUMS ---
    this.drumKick = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 3,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 }
    }).connect(this.bridgeCompressor);
    this.drumKick.volume.value = -6;

    const snareHPF = new Tone.Filter(350, "highpass").connect(this.masterDistortion);
    this.drumSnare = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 }
    }).connect(snareHPF);
    this.drumSnare.volume.value = -16;

    const topEndHPF = new Tone.Filter(5000, "highpass").connect(this.masterFilter);
    this.drumHihat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0 }
    }).connect(topEndHPF);
    this.drumHihat.volume.value = -18;

    this.drumPerc = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.08, release: 0.08 },
      harmonicity: 5,
      modulationIndex: 20,
      resonance: 4000,
      octaves: 1.5
    }).connect(this.masterDelay);
    this.drumPerc.volume.value = -22;

    // --- FINAL ROUTING ---
    const snareLimiter = new Tone.Limiter(-6).connect(this.masterDistortion); 
    const hihatLimiter = new Tone.Limiter(-10).connect(this.masterFilter);
    const synthLimiter = new Tone.Limiter(-6).connect(this.bridgeCompressor);

    this.drumPerc.connect(this.industrialShift);
    this.drumKick.connect(this.rumbleDelay); 
    
    // Safety connections
    this.subBass.connect(synthLimiter);
    this.curveGain.connect(synthLimiter);
    this.ribbonGain.connect(synthLimiter);
    this.industrialFm.connect(synthLimiter);
    this.glitchSynth.connect(this.recursiveDelay);
    
    this.drumSnare.connect(snareLimiter);
    this.drumHihat.connect(hihatLimiter);
  }

  public triggerSidechain(time: number = Tone.now()) {
    this.sidechainNode.gain.cancelScheduledValues(time);
    this.sidechainNode.gain.setValueAtTime(1, time);
    this.sidechainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
    this.sidechainNode.gain.exponentialRampToValueAtTime(1, time + 0.2);
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async start() {
    await Tone.start();
    await this.masterReverb.ready;
    this.masterOutput.gain.rampTo(1, 0.1); 
    if (this.neuroBass.state !== 'started') this.neuroBass.start();
    if (this.spectralLead.state !== 'started') this.spectralLead.start();
    if (this.droneSynth.state !== 'started') this.droneSynth.start();
    Tone.Transport.start();
  }

  public stop() {
    this.masterOutput.gain.cancelScheduledValues(Tone.now());
    this.masterOutput.gain.rampTo(0, 0.1); 
    Tone.Transport.stop();
    // Replaced Destructive Transport.cancel with simple stop to keep timeline events
    
    this.spacePad.releaseAll();
    
    // Explicitly kill gain on stop
    this.curveGain.gain.cancelScheduledValues(Tone.now());
    this.curveGain.gain.setValueAtTime(0, Tone.now());
    this.ribbonGain.gain.cancelScheduledValues(Tone.now());
    this.ribbonGain.gain.setValueAtTime(0, Tone.now());
    this.rumbleGain.gain.setValueAtTime(0, Tone.now());
    this.pressureGain.gain.setValueAtTime(0, Tone.now());
    this.droneSynth.volume.setValueAtTime(-100, Tone.now());
  }

  public setParams(intensity: number, distortion: number, smooth: number = 0.5) {
    const i = (!Number.isFinite(intensity)) ? 0.5 : Math.max(0, Math.min(1, intensity));
    const d = (!Number.isFinite(distortion)) ? 0.1 : Math.max(0, Math.min(0.5, distortion));
    
    this.masterDistortion.distortion = d;
    this.industrialShift.frequency.rampTo(Math.max(0, i * 120), smooth);
    this.masterFilter.frequency.rampTo(Math.max(20, 200 + (i * 18000)), smooth);
    // Ensure threshold doesn't go below -100
    this.bridgeCompressor.threshold.rampTo(Math.max(-100, -20 - (i * 15)), smooth);
  }
}
