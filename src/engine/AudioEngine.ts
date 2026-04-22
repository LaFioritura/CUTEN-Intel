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
  
  // High-Level Bunker Rack
  public rumbleFilter: Tone.Filter;
  public rumbleGain: Tone.Gain;
  public masterOutput: Tone.Gain;

  private constructor() {
    this.recorder = new Tone.Recorder();
    
    // Final Output Section
    this.masterLimiter = new Tone.Limiter(-1.5).toDestination();
    this.masterOutput = new Tone.Gain(0).connect(this.masterLimiter); // Hard Mute by default
    this.mainBus = new Tone.Gain(0.6).connect(this.masterOutput); 
    this.mainBus.connect(this.recorder); 
    
    this.bridgeCompressor = new Tone.Compressor({
      threshold: -18,
      ratio: 5,
      attack: 0.01,
      release: 0.15
    }).connect(this.mainBus);

    // Rumble Engine (Post-Kick Transformer)
    this.rumbleGain = new Tone.Gain(0).connect(this.bridgeCompressor);
    this.rumbleFilter = new Tone.Filter(150, "lowpass").connect(this.rumbleGain);
    const rumbleVerb = new Tone.Reverb({ decay: 0.5, wet: 1 }).connect(this.rumbleFilter);
    const rumbleDelay = new Tone.FeedbackDelay("16n", 0.4).connect(rumbleVerb);
    
    this.masterBitcrush = new Tone.BitCrusher(12).connect(this.bridgeCompressor);
    this.masterDistortion = new Tone.Distortion(0.25).connect(this.masterBitcrush);
    this.masterFilter = new Tone.Filter(20000, "lowpass").connect(this.masterDistortion);
    
    const bassCut = new Tone.Filter(35, "highpass").connect(this.masterFilter);
    this.sidechainNode = new Tone.Gain(1).connect(bassCut);

    // Synthesis Architecture
    this.masterDelay = new Tone.FeedbackDelay("8n.", 0.35).connect(this.masterFilter);
    this.masterReverb = new Tone.Reverb({
      decay: 3.5,
      preDelay: 0.03,
      wet: 0.2
    }).connect(this.masterFilter);

    this.recursiveDelay = new Tone.FeedbackDelay("16n", 0.7).connect(this.masterReverb);
    this.padChorus = new Tone.Chorus(4, 2.5, 0.5).connect(this.masterReverb);
    this.spectralFilter = new Tone.Filter(1500, "bandpass").connect(this.masterDelay);
    this.industrialShift = new Tone.FrequencyShifter(40).connect(this.masterDistortion);

    // SUB
    this.subBass = new Tone.MonoSynth({
      oscillator: { type: "square" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.2 }
    }).connect(this.sidechainNode);
    this.subBass.volume.value = -6;

    // CURVE SYNTH - Optimized for zero-bleed
    this.curveGain = new Tone.Gain(0).connect(this.sidechainNode);
    this.curveFilter = new Tone.Filter(800, "lowpass").connect(this.curveGain);
    this.neuroBass = new Tone.FatOscillator({
      type: "sawtooth",
      count: 2,
      spread: 25
    }).connect(this.curveFilter);
    this.neuroBass.volume.value = -16;

    // RIBBON EXPRESSION - Optimized for zero-bleed
    this.ribbonGain = new Tone.Gain(0).connect(this.spectralFilter);
    this.spectralLead = new Tone.Oscillator({
      type: "triangle", 
      frequency: 440
    }).connect(this.ribbonGain);
    this.spectralLead.volume.value = -22;

    // Glitch/Void Module
    const glitchHPF = new Tone.Filter(1000, "highpass").connect(this.recursiveDelay);
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

    // Bunker Pad Clusters - High-Level Polyphony
    const padHPF = new Tone.Filter(350, "highpass").connect(this.padChorus);
    this.spacePad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatcustom", count: 4, spread: 20 },
      envelope: { attack: 2, decay: 2, sustain: 0.4, release: 2 }
    }).connect(padHPF);
    this.spacePad.volume.value = -28;
    this.spacePad.maxPolyphony = 32; // Increased pool to prevent drops

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
    this.drumKick.volume.value = -1;

    const snareHPF = new Tone.Filter(350, "highpass").connect(this.masterDistortion);
    this.drumSnare = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 }
    }).connect(snareHPF);
    this.drumSnare.volume.value = -10;

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
    rumbleDelay.connect(this.rumbleFilter); 
    this.drumPerc.connect(this.industrialShift);
    this.drumKick.connect(rumbleDelay); 
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
    this.masterOutput.gain.rampTo(1, 0.1); // Smooth Unmute
    this.neuroBass.start();
    this.spectralLead.start();
    Tone.Transport.start();
  }

  public stop() {
    this.masterOutput.gain.cancelScheduledValues(Tone.now());
    this.masterOutput.gain.rampTo(0, 0.05); // Faster Mute
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clear any pending events
    
    this.neuroBass.stop();
    this.spectralLead.stop();
    this.spacePad.releaseAll();
    
    // Reset gain nodes that might be open
    this.curveGain.gain.setValueAtTime(0, Tone.now());
    this.ribbonGain.gain.setValueAtTime(0, Tone.now());
    this.rumbleGain.gain.setValueAtTime(0, Tone.now());
  }

  public setParams(intensity: number, distortion: number, smooth: number = 0.5) {
    this.masterDistortion.distortion = distortion;
    this.industrialShift.frequency.rampTo(intensity * 120, smooth);
    this.masterFilter.frequency.rampTo(200 + (intensity * 18000), smooth);
    this.bridgeCompressor.threshold.rampTo(-10 - (intensity * 20), smooth);
  }
}
