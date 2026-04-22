import type { MusicScore } from '@/aiService';
export interface RuntimePatternSet{kick:number[];snare:number[];hihat:number[];acid:number[];sub:number[];neuro:number[];perc:number[];glitch:number[];spectral:number[];}
export interface EngineSnapshot{score:MusicScore;patterns:RuntimePatternSet;generatedAt:string;source:'ai'|'fallback';prompt:string;vector:{x:number;y:number};}
