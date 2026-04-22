import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MusicScore {
  bpm: number;
  mood: string;
  intensity: number;
  structure: 'intro' | 'build' | 'drop' | 'breakdown' | 'outro';
  influence: string;
  
  // Arrangement & Evolutionary Logic
  arrangementPhase: 'exploration' | 'consolidation' | 'climax' | 'decay';
  tensionLevel: number; 
  harmonicFocus: string; 
  
  // Patterns (16 steps)
  patterns: {
    acid: number[];
    neuro: number[]; // 0 for off, or specific multiplier
    sub: number[];
    kick: number[];
    snare: number[];
    hihat: number[];
    perc: number[];
    glitch: number[];
    spectral: number[];
  };
  
  // Melodic Information
  padChords: string[]; 
  
  effects: {
    distortion: number;
    bitcrush: number;
    filterCutoff: number;
    resonance: number;
    delaySend: number;
    reverbSend: number;
    glitchAmount: number;
  };
  
  artistCommentary: string;
}

export async function getArtistScore(influence: string, trigger: string, vector: { x: number, y: number }): Promise<MusicScore> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the Lead Music Director of the C-HELL Extractor performance engine. 
      Your mission: SEAMLESS AUTONOMOUS CONCERT ARRANGEMENT with HIGH-LEVEL SONIC RESEARCH.
      
      CURRENT PERFORMANCE VECTOR:
      - X Axis (0=Ethereal, 1=Brutal): ${vector.x}
      - Y Axis (0=Static, 1=Chaotic): ${vector.y}
      
      COMPOSITIONAL MANDATES (BUNKER TECHNO):
      1. ARRANGEMENT PHASE: 
         - exploration: Thin textures, searching rhythms.
         - consolidation: Solidifying grooves, adding Sub-Rumble weight.
         - climax: Peak intensity, high density, Industrial saturation.
         - decay: Fragmenting patterns, heavy reverb, dissolving structures.
      2. GENRE AESTHETICS: 
         - TECHNO: Hypnotic, linear. Focus on "Rumble" bass textures.
         - VOID: Cinematic space, sub-harmonic drones, large polyphonic chord clusters.
         - ACID: Liquid resonance, polyphonic 303 clusters.
         - CORE: Maximum energy, breakbeats, industrial percussion clanks.
      3. POLYPHONY & CHORDS:
         - Provide rich, complex chord structures (e.g., ["C3", "Eb3", "G3", "Bb3", "D4"]).
         - Use harmonicFocus to describe the sonic direction (e.g., "Minor 9th Dissonance", "Metallic Resonant Clusters").
      4. VECTOR INFLUENCE: 
         - High X: Brutalism. Increase distortion, rumble gain, and metallic textures.
         - High Y: Chaos. Increase glitch complexity and unpredictable melodic phrasing.
      
      User Signal / Context: ${trigger}
      Current Mode: ${influence}
      
      Response: Return a JSON MusicScore. No prose.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bpm: { type: Type.NUMBER },
          mood: { type: Type.STRING },
          intensity: { type: Type.NUMBER },
          structure: { type: Type.STRING, enum: ['intro', 'build', 'drop', 'breakdown', 'outro'] },
          arrangementPhase: { type: Type.STRING, enum: ['exploration', 'consolidation', 'climax', 'decay'] },
          tensionLevel: { type: Type.NUMBER },
          harmonicFocus: { type: Type.STRING },
          influence: { type: Type.STRING },
          patterns: {
            type: Type.OBJECT,
            properties: {
              acid: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              neuro: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              sub: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              kick: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              snare: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              hihat: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              perc: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              glitch: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              spectral: { type: Type.ARRAY, items: { type: Type.NUMBER } }
            }
          },
          padChords: { type: Type.ARRAY, items: { type: Type.STRING } },
          effects: {
            type: Type.OBJECT,
            properties: {
              distortion: { type: Type.NUMBER },
              bitcrush: { type: Type.NUMBER },
              filterCutoff: { type: Type.NUMBER },
              resonance: { type: Type.NUMBER },
              delaySend: { type: Type.NUMBER },
              reverbSend: { type: Type.NUMBER },
              glitchAmount: { type: Type.NUMBER }
            }
          },
          artistCommentary: { type: Type.STRING }
        },
        required: ["bpm", "mood", "intensity", "structure", "arrangementPhase", "tensionLevel", "harmonicFocus", "influence", "patterns", "padChords", "effects", "artistCommentary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("AI Score Failure", e);
    throw e;
  }
}
