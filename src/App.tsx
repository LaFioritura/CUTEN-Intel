/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Square, 
  Activity, 
  Cpu, 
  Zap, 
  Volume2, 
  Waves, 
  Wind, 
  Terminal,
  RefreshCw,
  Maximize2,
  Download,
  Disc,
  Circle
} from 'lucide-react';
import { AudioEngine } from './engine/AudioEngine';
import { getArtistScore, MusicScore } from './services/aiService';
import { generateAlgorithmicPatterns, generateAlgorithmicAutomation, ComposerDNA } from './services/algorithmicComposer';

const STEPS = 16;
const INITIAL_BPM = 174;

const safe = (val: any, def: number): number => {
  const n = parseFloat(val);
  return (Number.isFinite(n)) ? n : def;
};

const safeFreq = (note: string, defFreq: number = 440): number => {
  try {
    const f = Tone.Frequency(note).toFrequency();
    return Number.isFinite(f) && f > 0 ? f : defFreq;
  } catch {
    return defFreq;
  }
};

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(135);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeScore, setActiveScore] = useState<MusicScore | null>(null);
  const pendingScoreRef = useRef<MusicScore | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [triggerCount, setTriggerCount] = useState(0);
  const [currentInfluence, setCurrentInfluence] = useState<'TECHNO' | 'VOID' | 'ACID' | 'CORE'>('TECHNO');
  const [isRecording, setIsRecording] = useState(false);
  const [autoEvolve, setAutoEvolve] = useState(true);
  const [isPure, setIsPure] = useState(true);
  const [phraseCount, setPhraseCount] = useState(0);
  const [ribbonValue, setRibbonValue] = useState(0.5);
  const [curvePoints, setCurvePoints] = useState([0.2, 0.8, 0.3, 0.9]);
  const [aestheticVector, setAestheticVector] = useState({ x: 0.5, y: 0.5 });
  const [memoryBank, setMemoryBank] = useState<MusicScore[]>([]);
  const [gridSeeds, setGridSeeds] = useState<Record<string, number[]>>({
    kick: Array(16).fill(0),
    snare: Array(16).fill(0),
    hihat: Array(16).fill(0),
    perc: Array(16).fill(0)
  });
  
  const [isStrobe, setIsStrobe] = useState(false);
  const [directorLog, setDirectorLog] = useState<string[]>([]);
  
  const engineRef = useRef<AudioEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const scoreRef = useRef<MusicScore | null>(null);

  // Sync Ribbon & Curves to Engine (removed continuous bleed logic)
  useEffect(() => {
    if (!isPlaying && engineRef.current) {
      engineRef.current.curveGain.gain.setValueAtTime(0, Tone.now());
      engineRef.current.ribbonGain.gain.setValueAtTime(0, Tone.now());
    }
  }, [isPlaying]);

  // INITIALIZE SCORE REF
  useEffect(() => {
    scoreRef.current = activeScore;
  }, [activeScore]);

  // PHRASE EVOLUTION ENGINE
  useEffect(() => {
    if (isPlaying && autoEvolve && currentStep === 0) {
      const pCount = phraseCount + 1;
      setPhraseCount(pCount);
      
      // Every 8 phrases (bars), we slightly shift the narrative
      if (pCount > 1 && pCount % 8 === 0) {
        triggerAiArtist(`PHRASE_MARKER_${pCount}: Evolve composition structure. Genre: ${currentInfluence}. BPM: ${bpm}.`);
      }
    }
  }, [currentStep, isPlaying, autoEvolve, bpm, currentInfluence]);

  // Debounced AI trigger on Vector change
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      triggerAiArtist(`VECTOR_SHIFT: Performance vector changed to X:${aestheticVector.x.toFixed(2)}, Y:${aestheticVector.y.toFixed(2)}.`);
    }, 1500); // 1.5s silence after move triggers evolution
    return () => clearTimeout(timer);
  }, [aestheticVector]);

  const [presets, setPresets] = useState<MusicScore[]>([]);

  useEffect(() => {
    if (activeScore) applyScoreToEngine(activeScore);
  }, [isPure]);

  const handleSavePreset = () => {
    if (activeScore) {
      const newPresets = [...presets, activeScore];
      setPresets(newPresets);
      localStorage.setItem('chell_presets', JSON.stringify(newPresets));
    }
  };

  const handleSeedGrid = (lane: string, step: number) => {
    setGridSeeds(prev => ({
      ...prev,
      [lane]: prev[lane].map((v, i) => i === step ? (v > 0 ? 0 : 1) : v)
    }));
    triggerAiArtist(`SEED_INPUT: User seeded ${lane} at step ${step}. Incorporate into next scoring.`);
  };

  const applyScoreToEngine = (score: MusicScore) => {
    const dna = score.dna || { complexity: 0.5, energy: 0.5, darkness: 0.5, industrial: 0.5 };
    
    // Fill in missing algorithmic components
    if (!score.patterns) score.patterns = generateAlgorithmicPatterns(dna);
    if (!score.automation) score.automation = generateAlgorithmicAutomation(dna);

    const smoothTime = 2; 
    const effects = score.effects || {
      distortion: 0.1,
      bitcrush: 0,
      filterCutoff: 0.8,
      resonance: 2,
      delaySend: 0.1,
      reverbSend: 0.1,
      glitchAmount: 0.05,
      rumbleDecay: 0.3
    };
    const safeDistortion = Math.min(safe(effects.distortion, 0.1), 0.4);
    const safeReverb = Math.min(safe(effects.reverbSend, 0.1), 0.3);
    const safeDelay = Math.min(safe(effects.delaySend, 0.1), 0.3);

    if (engineRef.current) {
      engineRef.current.setParams(safe(score.intensity, 0.5), safeDistortion, smoothTime);
      
      const targetBpm = safe(score.bpm, 135);
      if (isPlaying) {
        Tone.Transport.bpm.rampTo(Math.max(60, Math.min(220, targetBpm)), smoothTime);
      } else {
        Tone.Transport.bpm.value = Math.max(60, Math.min(220, targetBpm));
        setBpm(targetBpm);
      }

      // Automation of Drone & Pressure
      if (score.structure === 'empty_space' || score.bunkerAesthetic === 'void') {
        engineRef.current.droneSynth.volume.rampTo(-18, smoothTime);
        engineRef.current.pressureGain.gain.rampTo(0.1, smoothTime);
      } else {
        engineRef.current.droneSynth.volume.rampTo(-80, smoothTime);
        engineRef.current.pressureGain.gain.rampTo(0, smoothTime);
      }

      engineRef.current.droneSynth.frequency.rampTo(Math.max(10, safe(score.droneFrequency, 30)), smoothTime);

      if (engineRef.current.masterBitcrush) {
        engineRef.current.masterBitcrush.bits.rampTo(Math.max(1, 8 - (safe(effects.bitcrush, 0) * 4)), smoothTime);
      }
      
      if (engineRef.current.rumbleDelay) {
        engineRef.current.rumbleDelay.feedback.rampTo(Math.min(Math.max(0, 0.2 + (safe(effects.rumbleDecay, 0.3) * 0.5)), 0.7), smoothTime);
      }

      if (engineRef.current.acidSynth.filter) {
        engineRef.current.acidSynth.filter.Q.rampTo(Math.max(0.1, safe(effects.resonance, 2)), smoothTime);
      }
      engineRef.current.glitchSynth.volume.rampTo(Math.max(-100, -25 + (safe(effects.glitchAmount, 0.05) * 15)), smoothTime);
      engineRef.current.masterDelay.wet.rampTo(Math.max(0, safeDelay), smoothTime);
      engineRef.current.masterReverb.wet.rampTo(Math.max(0, safeReverb), smoothTime);
      
      // Bunker Rumble Mapping
      if (engineRef.current.rumbleGain) {
        const rumbleBase = isPure ? 0.3 : 0.6;
        const rumbleTarget = rumbleBase + (safe(effects.rumbleDecay, 0.3) * 0.4);
        engineRef.current.rumbleGain.gain.rampTo(Math.min(Math.max(0, rumbleTarget), 1.0), smoothTime);
      }

      if (engineRef.current.recursiveDelay) {
        engineRef.current.recursiveDelay.feedback.rampTo(Math.min(Math.max(0, 0.1 + (safe(effects.glitchAmount, 0.05) * 0.5)), 0.8), smoothTime);
        engineRef.current.recursiveDelay.wet.rampTo(Math.max(0, safe(effects.glitchAmount, 0.05) * 0.4), smoothTime);
      }
      if (engineRef.current.spectralFilter) {
        engineRef.current.spectralFilter.frequency.rampTo(Math.max(20, 1000 + (safe(effects.filterCutoff, 0.5) * 5000)), smoothTime);
      }
    }
  };

  const handleRecallMemory = (score: MusicScore) => {
    pendingScoreRef.current = score;
    applyScoreToEngine(score);
    setTriggerCount(prev => prev + 1);
  };

  useEffect(() => {
    const saved = localStorage.getItem('chell_presets');
    if (saved) setPresets(JSON.parse(saved));
  }, []);

  const handleRecord = async () => {
    if (!engineRef.current) return;
    if (!isRecording) {
      engineRef.current.recorder.start();
      setIsRecording(true);
    } else {
      const recording = await engineRef.current.recorder.stop();
      const url = URL.createObjectURL(recording);
      const anchor = document.createElement("a");
      anchor.download = `C-HELL_REC_${Date.now()}.wav`;
      anchor.href = url;
      anchor.click();
      setIsRecording(false);
    }
  };

  // Initialize Engine & STABLE Sequencer
  useEffect(() => {
    engineRef.current = AudioEngine.getInstance();
    analyserRef.current = new Tone.Analyser("waveform", 1024);
    Tone.getDestination().connect(analyserRef.current);
    
    // Log Context State
    const ctx = Tone.getContext();
    ctx.on('statechange', (state) => {
      console.log(`[AUDIO_CONTEXT_STATE]: ${state}`);
    });

    const initialScore: MusicScore = {
      bpm: 135,
      mood: "Harmonic Start",
      intensity: 0.5,
      structure: 'empty_space',
      arrangementPhase: 'exploration',
      tensionLevel: 0.2,
      harmonicFocus: "INITIALIZING",
      influence: 'CORE', 
      bunkerAesthetic: 'void',
      dna: {
        complexity: 0.3,
        energy: 0.4,
        darkness: 0.6,
        industrial: 0.5
      },
      padChords: ["C2", "G2"],
      droneFrequency: 30,
      leadPhrase: ["C4"],
      effects: {
        distortion: 0.1,
        bitcrush: 0,
        filterCutoff: 0.8,
        resonance: 2,
        delaySend: 0.1,
        reverbSend: 0.1,
        glitchAmount: 0.05,
        rumbleDecay: 0.3
      },
      artistCommentary: "EXTRACTOR READY. INITIALIZING HARMONIC GRID."
    };

    // Ensure patterns exist for the initial score
    initialScore.patterns = generateAlgorithmicPatterns(initialScore.dna);
    initialScore.automation = generateAlgorithmicAutomation(initialScore.dna);
    
    scoreRef.current = initialScore;
    setActiveScore(initialScore);

    // PERSISTENT SEQUENCER LOOP
    const sequence = new Tone.Sequence((time, step) => {
      const engine = engineRef.current;
      const score = scoreRef.current;
      if (!engine || !score) return;

      // Handle Quantized Score Swap
      if (step === 0 && pendingScoreRef.current) {
        const nextScore = pendingScoreRef.current;
        pendingScoreRef.current = null;
        setActiveScore(nextScore); // This triggers UI update
        scoreRef.current = nextScore; // This triggers immediate sequence update
        Tone.Transport.bpm.rampTo(nextScore.bpm, 1);
      }

      setCurrentStep(step);
      const p = score.patterns || ({} as any);
      const a = score.automation || ({} as any);

      // --- RUN AUTOMATION LANES (16th note precision) ---
      if (a) {
        const filterVal = safe(a.filterCutoff?.[step], 0.5);
        const distVal = safe(a.distortionAmount?.[step], 0.1);
        const noiseVal = safe(a.noiseTexture?.[step], 0.1);
        const reverbVal = safe(a.reverbWet?.[step], 0.1);

        engine.masterFilter.frequency.setTargetAtTime(Math.max(20, 200 + (filterVal * 12000)), time, 0.05);
        engine.masterDistortion.distortion = Math.max(0, 0.1 + (distVal * 0.6));
        engine.pressureGain.gain.setTargetAtTime(Math.max(0, noiseVal * 0.15), time, 0.1);
        engine.masterReverb.wet.setTargetAtTime(Math.max(0, 0.05 + (reverbVal * 0.3)), time, 0.1);
      }

      // Drums & Sidechain Triggering
      const kickVol = safe(p.kick?.[step], 0);
      if (kickVol > 0) {
        const kickVel = kickVol * (1 + safe(a?.rumbleIntensity?.[step], 0) * 0.5);
        engine.drumKick.triggerAttackRelease("C1", "16n", time, Math.min(Math.max(0, kickVel), 1.1));
        engine.triggerSidechain(time);
        
        // Strobe trigger
        Tone.Draw.schedule(() => {
          setIsStrobe(true);
        }, time);
        Tone.Draw.schedule(() => {
          setIsStrobe(false);
        }, time + 0.05);
      }
      
      if (safe(p.snare?.[step], 0) > 0) engine.drumSnare.triggerAttackRelease("16n", time);
      if (safe(p.hihat?.[step], 0) > 0) engine.drumHihat.triggerAttackRelease("32n", time);
      if (safe(p.perc?.[step], 0) > 0) engine.drumPerc.triggerAttackRelease("16n", time);
      if (safe(p.glitch?.[step], 0) > 0) engine.glitchSynth.triggerAttackRelease("16n", time);

      // Lead Morph (Spectral Phrase)
      const spectralVol = safe(p.spectral?.[step], 0);
      const leadPhrase = score.leadPhrase || [];
      if (step % 2 === 0 && leadPhrase.length > 0) {
        const noteIdx = Math.floor(step / 2) % leadPhrase.length;
        const note = leadPhrase[noteIdx];
        if (note && spectralVol > 0) {
          const freq = safeFreq(note, 440);
          engine.spectralLead.frequency.setTargetAtTime(freq, time, 0.1);
          engine.ribbonGain.gain.setTargetAtTime(Math.max(0, spectralVol * 0.6), time, 0.1); // Scaled
        } else {
          engine.ribbonGain.gain.setTargetAtTime(0, time, 0.1);
        }
      } else if (spectralVol === 0) {
        engine.ribbonGain.gain.setTargetAtTime(0, time, 0.1);
      }

      // Bass Layers
      const subVol = safe(p.sub?.[step], 0);
      if (subVol > 0) {
        const vel = Math.min(subVol, 0.8);
        engine.subBass.triggerAttackRelease("C1", "16n", time, vel);
      }
      
      // Curve Synth (Modulated by Curve Points)
      const neuroVol = safe(p.neuro?.[step], 0);
      if (neuroVol > 0) {
        const notes = ["D1", "F1", "G1", "Ab1"];
        const freq = Tone.Frequency(notes[step % notes.length]).toFrequency();
        engine.neuroBass.frequency.setValueAtTime(freq, time);
        engine.curveGain.gain.setTargetAtTime(neuroVol * 0.5, time, 0.1); // Scaled
      } else {
        engine.curveGain.gain.setTargetAtTime(0, time, 0.1);
      }
      
      // Acid Synth
      const acidVol = safe(p.acid?.[step], 0);
      if (acidVol > 0) {
        const notes = ["C1", "C2", "Eb1", "F2", "Bb1", "Db2"];
        const note = notes[Math.floor(acidVol * notes.length) % notes.length];
        const vel = Math.min(acidVol, 0.7);
        engine.acidSynth.triggerAttackRelease(note, "16n", time, vel);
      }

      // Lead FM (Trigger on accents)
      if (step % 8 === 4 && score.intensity > 0.7) {
        engine.industrialFm.triggerAttackRelease("A3", "16n", time, 0.3);
      }

      // Pad trigger (Hard quantized release)
      if (step === 0 && score.padChords.length > 0) {
        engine.spacePad.releaseAll(time);
        engine.spacePad.triggerAttackRelease(score.padChords, "2n", time, 0.3);
      }
    }, [...Array(STEPS).keys()], "16n");

    sequence.start(0);

    return () => {
      sequence.dispose();
      Tone.Transport.cancel();
      engineRef.current?.stop();
    };
  }, []);

  // Performance Visualizer Loop (Spectral Flux)
  useEffect(() => {
    let animationId: number;
    const draw = () => {
      if (canvasRef.current && analyserRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const values = analyserRef.current.getValue() as Float32Array;
          const width = canvasRef.current.width;
          const height = canvasRef.current.height;
          
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, width, height);
          
          // Draw Spectral Glow
          ctx.beginPath();
          ctx.lineWidth = 1;
          const color = isPlaying ? (currentInfluence === 'CORE' ? '#FF3E00' : '#00FF41') : '#222';
          ctx.strokeStyle = color;
          
          if (isPure) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
          }

          const barWidth = width / 64;
          for (let i = 0; i < 64; i++) {
            const val = Math.abs(values[i * (values.length / 64) | 0]);
            const h = val * height * 2.5;
            ctx.globalAlpha = isPure ? 0.15 : 0.3;
            ctx.fillStyle = color;
            ctx.fillRect(i * barWidth, height / 2 - h / 2, barWidth - 1, h);
          }

          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.lineWidth = isPure ? 0.5 : 1;
          for (let i = 0; i < values.length; i += 4) {
            const x = (i / values.length) * width;
            const y = (values[i] + 1) / 2 * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, currentInfluence]);

  const handleStartStop = async () => {
    if (!isPlaying) {
      await engineRef.current?.start();
    } else {
      engineRef.current?.stop();
    }
    setIsPlaying(!isPlaying);
  };

  const triggerAiArtist = async (triggerPrompt: string) => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);
    setDirectorLog(prev => [`> SIGNAL SENT: ${triggerPrompt}`, ...prev.slice(0, 15)]);
    
    try {
      const fullPrompt = `ARCHITECT_SYNC: [BPM:${bpm}, INTENSITY:${activeScore?.intensity}, PHASE: ${activeScore?.arrangementPhase}]. 
      USER_SIGNAL: ${triggerPrompt}. `;
      
      const score = await getArtistScore(currentInfluence, fullPrompt, aestheticVector);
      
      // SCRUBBER: Remove invalid notes (chords like "Dmin" crash Tone.js PolySynth)
      if (score.padChords) {
        score.padChords = score.padChords
          .map(n => n.replace(/minor|major|min|maj|m|M/gi, '')) // Try to salvage root note
          .filter(n => /^[A-G][b#]?[0-9]?$/.test(n))
          .map(n => /[0-9]/.test(n) ? n : `${n}2`); // Ensure octave
      }
      if (score.leadPhrase) {
        score.leadPhrase = score.leadPhrase
          .map(n => n.replace(/minor|major|min|maj|m|M/gi, ''))
          .filter(n => /^[A-G][b#]?[0-9]?$/.test(n))
          .map(n => /[0-9]/.test(n) ? n : `${n}3`); // Lead usually higher
      }

      // ALGORITHMIC HARDENING: Ensure patterns and automation are never null
      const dna = score.dna || { complexity: 0.5, energy: 0.5, darkness: 0.5, industrial: 0.5 };
      if (!score.patterns) score.patterns = generateAlgorithmicPatterns(dna);
      if (!score.automation) score.automation = generateAlgorithmicAutomation(dna);

      pendingScoreRef.current = score;
      setMemoryBank(prev => [score, ...prev].slice(0, 20)); 
      setDirectorLog(prev => [`> EXTRACTOR RESPONSE: ${score.artistCommentary}`, ...prev.slice(0, 15)]);
      
      if (!isPlaying) {
        setActiveScore(score);
        scoreRef.current = score;
        applyScoreToEngine(score);
      }
    } catch (e) {
      console.error("EXTRACTION ERROR:", e);
      setDirectorLog(prev => [`> SIGNAL LOST: FALLBACK_MODE_ACTIVE`, ...prev.slice(0, 15)]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#E0E0E0] font-sans selection:bg-[#00FF41] selection:text-black p-6 flex flex-col overflow-hidden transition-colors duration-75 ${isStrobe ? 'bg-zinc-900' : ''}`}>
      
      {/* HEADER: OPERATIONAL STATUS */}
      <header className="flex justify-between items-end border-b border-[#222] pb-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="w-10 h-10 bg-[#FF3E00] flex items-center justify-center font-black text-black">CH</div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-[#00FF41]">C-HELL EXTRACTOR</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Autonomous Harmonic Extraction</p>
          </div>
        </div>
        <div className="flex gap-8 items-center text-[10px]">
          <div className="flex flex-col gap-1 border-l border-zinc-800 pl-4">
             <span className="text-zinc-600 uppercase text-[7px] tracking-widest">Vector_Pos</span>
             <span className="text-[#00FF41] font-mono">X:{aestheticVector.x.toFixed(2)} Y:{aestheticVector.y.toFixed(2)}</span>
          </div>
          <div className="flex gap-1 border border-[#333] p-1 bg-zinc-900/50">
             <span className="text-zinc-600 uppercase text-[8px] px-2 py-1">Tempo</span>
             <input 
               type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
               className="w-12 bg-black text-[#00FF41] font-bold text-center border-none focus:ring-0"
             />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPure(!isPure)}
              className={`flex items-center gap-2 px-3 py-1 border transition-all ${isPure ? 'bg-zinc-100 border-white text-black font-bold' : 'bg-zinc-900 border-zinc-700 text-zinc-500'}`}
            >
              <Zap size={12} className={isPure ? 'fill-current' : ''} />
              <span>{isPure ? 'SONIC_PURITY' : 'RAW_EXTRACTION'}</span>
            </button>
            <button 
              onClick={handleRecord}
              className={`flex items-center gap-2 px-3 py-1 border transition-all ${isRecording ? 'bg-[#FF3E00] border-[#FF3E00] text-black animate-pulse' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
            >
              <Disc size={12} />
              <span>REC</span>
            </button>
            <button 
              onClick={() => setAutoEvolve(!autoEvolve)}
              className={`flex items-center gap-2 px-3 py-1 border transition-all ${autoEvolve ? 'bg-[#00FF41]/20 border-[#00FF41] text-[#00FF41]' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}
            >
              <RefreshCw size={12} className={autoEvolve ? 'animate-spin-slow' : ''} />
              <span>{autoEvolve ? 'AUTO' : 'MANUAL'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE: 12-COL GRID */}
      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        
        {/* LEFT: MEMORY BANK & LIBRARY */}
        <section className="col-span-3 flex flex-col gap-4">
          <div className="border border-[#222] bg-[#0c0c0c] p-4 flex-1 flex flex-col">
            <span className="text-[10px] uppercase text-zinc-500 mb-4 block tracking-widest">Phrase Memory Bank</span>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {memoryBank.map((m, i) => (
                <div 
                  key={i} 
                  onClick={() => handleRecallMemory(m)}
                  className="group p-2 border border-zinc-900 bg-zinc-900/20 hover:border-[#00FF41] cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-zinc-400 group-hover:text-[#00FF41]">{m.arrangementPhase.toUpperCase()}</span>
                    <span className="text-[8px] text-zinc-700">{m.bpm} BPM</span>
                  </div>
                  <div className="text-[9px] text-zinc-600 italic truncate italic">"{m.mood}"</div>
                </div>
              ))}
              {memoryBank.length === 0 && <div className="text-[10px] text-zinc-700 italic">Extraction history empty...</div>}
            </div>

            <div className="mt-8">
               <span className="text-[10px] uppercase text-zinc-500 mb-2 block tracking-widest">Evolved Signals</span>
               <div className="space-y-1">
                 {['SPECTRAL_FLUX', 'CURVE_REESE', 'VOID_RECURSION', 'ACID_LATTICE'].map((s, i) => (
                   <div key={i} className="group flex justify-between items-center text-[9px] bg-zinc-900/40 p-2 cursor-pointer hover:bg-zinc-900 transition-all border-l-2 border-transparent hover:border-[#00FF41]">
                     <span className="text-zinc-400">{s}</span>
                     <Volume2 size={8} className="text-zinc-700 group-hover:text-[#00FF41]" />
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </section>

        {/* CENTER: PLAYGROUND & VECTOR CORE */}
        <section className="col-span-6 flex flex-col gap-4 overflow-hidden">
          {/* SPECTRAL FLUX VISUALIZER */}
          <div className="h-40 bg-black border border-[#222] relative overflow-hidden group">
            <canvas ref={canvasRef} className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-2 left-2 flex flex-col gap-0.5">
               <span className="text-[8px] text-[#00FF41] font-mono tracking-widest uppercase">Harmonic Flux Monitor</span>
               <span className="text-[7px] text-zinc-600 font-mono italic">{activeScore?.harmonicFocus || 'IDLE_MODE'}</span>
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
               <Activity size={10} className="text-[#FF3E00] animate-pulse" />
               <span className="text-[8px] text-zinc-500 font-mono">TENSION_LVL: {(activeScore?.tensionLevel || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* VECTOR CORE (XY PAD) */}
          <div className="h-32 bg-[#0c0c0c] border border-[#222] relative cursor-crosshair overflow-hidden group"
               onMouseMove={(e) => {
                 if (e.buttons === 1) {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                   const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
                   setAestheticVector({ x, y });
                 }
               }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div className="w-full h-px bg-zinc-800" />
              <div className="h-full w-px bg-zinc-800" />
            </div>
            {/* Axis Labels */}
            <div className="absolute inset-x-2 top-2 flex justify-between">
               <span className="text-[7px] text-zinc-700 uppercase tracking-widest">{isPure ? 'Spectral_Focus' : 'Research_Grit'}</span>
               <span className="text-[7px] text-zinc-700 uppercase tracking-widest">{isPure ? 'Harmonic_Mass' : 'Bunker_Weight'}</span>
            </div>
            <div className="absolute inset-x-2 bottom-2 flex justify-between">
               <span className="text-[7px] text-zinc-700 uppercase tracking-widest">{isPure ? 'Static_Field' : 'Ordered'}</span>
               <span className="text-[7px] text-zinc-700 uppercase tracking-widest">{isPure ? 'Kinetic_Flux' : 'Chaotic'}</span>
            </div>

            <motion.div 
               animate={{ left: `${aestheticVector.x * 100}%`, bottom: `${aestheticVector.y * 100}%` }}
               className="absolute w-6 h-6 -ml-3 -mb-3 border-2 border-[#00FF41] rounded-full shadow-[0_0_15px_#00FF41] flex items-center justify-center"
            >
               <div className="w-1 h-1 bg-[#00FF41] rounded-full" />
            </motion.div>
            <div className="absolute inset-x-0 bottom-0 py-1 bg-zinc-900/50 flex justify-center text-[7px] text-zinc-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
               Aesthetic Vector Morph Core
            </div>
          </div>

          {/* INTERACTIVE NEURAL GRID */}
          <div className="flex-1 bg-black border border-[#222] p-2 flex flex-col gap-1 overflow-hidden">
             {activeScore && activeScore.patterns && ['kick', 'snare', 'hihat', 'perc'].map(lane => (
                <div key={lane} className="flex-1 flex gap-1 group">
                   <div className="w-8 flex items-center justify-center text-[7px] text-zinc-700 font-bold uppercase rotate-180 [writing-mode:vertical-lr] group-hover:text-[#FF3E00] transition-colors">{lane}</div>
                   <div className="flex-1 grid grid-cols-16 gap-0.5">
                      {(activeScore.patterns[lane] || Array(16).fill(0)).map((v: number, i: number) => {
                        const isSeeded = gridSeeds[lane] && gridSeeds[lane][i] > 0;
                        return (
                          <div 
                            key={i} 
                            onClick={() => handleSeedGrid(lane, i)}
                            className={`h-full border transition-all duration-300 cursor-pointer ${
                              i === currentStep ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 hover:border-white/20'
                            } ${v > 0 ? 'border-b-2 border-b-[#FF3E00]' : ''} ${isSeeded ? 'bg-[#FF3E00]/20' : ''}`} 
                          />
                        );
                      })}
                   </div>
                </div>
             ))}
          </div>

          {/* AUTOMATION MONITOR - ABLETON STYLE */}
          <div className="h-24 bg-black border border-[#222] p-2 flex flex-col gap-1">
             <div className="flex justify-between items-center px-1">
                <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Automation Matrix</span>
                <span className="text-[6px] text-zinc-800 font-mono italic">INTERPOLATED_16THS</span>
             </div>
             <div className="flex-1 grid grid-cols-16 gap-0.5">
                {activeScore?.automation?.filterCutoff.map((val, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex-1 bg-zinc-900/50 relative overflow-hidden">
                       <motion.div animate={{ height: `${val * 100}%` }} className="absolute bottom-0 left-0 right-0 bg-[#00FF41]/20" />
                       <motion.div animate={{ height: `${(activeScore.automation.distortionAmount[i] || 0) * 100}%` }} className="absolute bottom-0 left-0 right-0 bg-[#FF3E00]/10" />
                    </div>
                    <div className={`h-0.5 ${i === currentStep ? 'bg-[#00FF41]' : 'bg-zinc-800'}`} />
                  </div>
                ))}
             </div>
          </div>

          {/* DYNAMIC CURVE MORPH */}
          <div className="h-16 bg-[#0c0c0c] border border-[#222] p-2 flex gap-2">
             <div className="w-12 text-[7px] text-zinc-700 uppercase flex flex-col justify-center leading-tight">Extraction Curves</div>
             <div className="flex-1 flex gap-2">
                {curvePoints.map((p, i) => (
                  <div key={i} className="flex-1 bg-zinc-900/30 relative overflow-hidden group">
                     <motion.div 
                        animate={{ height: `${p * 100}%` }}
                        className="absolute bottom-0 left-0 right-0 bg-[#00FF41]/10 border-t border-[#00FF41]/30"
                     />
                     <input 
                       type="range" min="0" max="1" step="0.01" value={p}
                       onChange={(e) => {
                         const next = [...curvePoints];
                         next[i] = Number(e.target.value);
                         setCurvePoints(next);
                       }}
                       className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-ns-resize"
                     />
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* RIGHT: ENGINE & ARRANGEMENT */}
        <section className="col-span-3 flex flex-col gap-4">
          <div className="border border-[#222] bg-[#0c0c0c] p-4 h-full flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <span className="text-[8px] uppercase text-zinc-600 tracking-widest">Synthesis Engine</span>
               <div className="px-2 py-0.5 bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] text-[7px] font-bold animate-pulse">
                 {activeScore?.arrangementPhase.toUpperCase() || 'PHASE_IDLE'}
               </div>
             </div>

             <div className="space-y-4">
                {[
                  { l: 'Bit_Rate', v: activeScore?.effects.bitcrush || 0, c: '#FF3E00' },
                  { l: 'Spectral_Res', v: activeScore?.effects.resonance / 10 || 0, c: '#00FF41' },
                  { l: 'Space_Flux', v: activeScore?.effects.reverbSend || 0, c: '#00FF41' },
                  { l: 'Recursive_Mod', v: activeScore?.effects.glitchAmount || 0, c: '#FF3E00' }
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[8px] text-zinc-500 mb-1">
                      <span>{m.l}</span>
                      <span>{(m.v * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-0.5 bg-zinc-900 overflow-hidden">
                      <motion.div animate={{ width: `${m.v * 100}%` }} className="h-full" style={{ backgroundColor: m.c }} />
                    </div>
                  </div>
                ))}
             </div>

             <div className="mt-8 flex-1">
                <div className="flex flex-col gap-4">
                  <div className="p-2 border border-zinc-800 bg-zinc-900/30">
                    <span className="text-[7px] text-zinc-600 uppercase block mb-1">Aesthetic Archetype</span>
                    <div className="text-[9px] text-[#00FF41] font-bold">{activeScore?.mood.toUpperCase()}</div>
                  </div>
                  <div className="p-2 border border-zinc-800 bg-zinc-900/30">
                    <span className="text-[7px] text-zinc-600 uppercase block mb-1">Director Log</span>
                    <div className="text-[8px] text-zinc-500 font-mono space-y-1 h-12 overflow-hidden">
                       {directorLog.map((log, i) => <div key={i} className="truncate">{log}</div>)}
                       {directorLog.length === 0 && <div className="italic opacity-30">Awakening director...</div>}
                    </div>
                  </div>
                </div>
             </div>

             <div className="flex gap-1 mb-4">
               <button onClick={handleSavePreset} className="flex-1 py-2 bg-zinc-900/50 border border-zinc-800 text-[8px] uppercase hover:bg-zinc-800 transition-all">Save Core</button>
               <button onClick={() => presets.length > 0 && handleRecallMemory(presets[presets.length-1])} className="flex-1 py-2 bg-zinc-900/50 border border-zinc-800 text-[8px] uppercase hover:bg-zinc-800 transition-all">Restore</button>
             </div>

             <button 
                onClick={handleStartStop}
                className={`w-full py-6 font-black transition-all border-b-2 flex flex-col items-center gap-1 ${isPlaying ? 'bg-[#FF3E00] border-[#992500] text-black shadow-[0_0_20px_rgba(255,62,0,0.3)]' : 'bg-[#00FF41] border-[#00992a] text-black'}`}
             >
               <span className="text-xl tracking-[0.2em]">{isPlaying ? 'STOP_PERFORM' : 'PLAY_CONCERT'}</span>
               <span className="text-[8px] opacity-70 uppercase font-normal">{isPlaying ? 'Interrupt sequence' : 'Begin autonomous concert'}</span>
             </button>
          </div>
        </section>
      </div>

      {/* FOOTER: SIGNAL MONITOR */}
      <footer className="mt-6 h-8 flex gap-2">
         {Array(8).fill(0).map((_, i) => (
           <div key={i} className="flex-1 bg-zinc-900/20 border-t border-zinc-800 flex items-center justify-center">
             <motion.div 
               animate={{ opacity: currentStep % 8 === i ? 1 : 0.2, scale: currentStep % 8 === i ? 1.2 : 1 }}
               className="w-1 h-1 rounded-full bg-[#00FF41]"
             />
           </div>
         ))}
      </footer>

      {/* SEAMLESS TRANSITION OVERLAY (STAY MUSICAL) */}
      <AnimatePresence>
        {isAiGenerating && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 pointer-events-none"
          >
             <RefreshCw size={12} className="text-[#00FF41] animate-spin" />
             <span className="text-[8px] text-[#00FF41] font-bold uppercase tracking-widest">Recalculating_Score...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
