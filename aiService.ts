import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in the platform settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface MusicScore {
  bpm: number;
  mood: string;
  intensity: number;
  structure: 'empty_space' | 'climax' | 'industrial_flow' | 'fragmentation';
  influence: string;
  arrangementPhase: 'exploration' | 'peak' | 'decay';
  tensionLevel: number; 
  harmonicFocus: string; 
  bunkerAesthetic: string;
  
  // High-level DNA for the algorithmic engine
  dna: {
    complexity: number;
    energy: number;
    darkness: number;
    industrial: number;
  };

  // Optional overrides
  patterns?: Record<string, number[]>;
  automation?: Record<string, number[]>;
  
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

export async function getArtistScore(influence: string, trigger: string, vector: { x: number, y: number }): Promise<MusicScore> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the Lead Music Director of the C-HELL Extractor performance engine. 
      Your mission: SEAMLESS AUTONOMOUS CONCERT ARRANGEMENT.
      
      CURRENT PERFORMANCE VECTOR:
      - X Axis (0=Ethereal, 1=Brutal): ${vector.x}
      - Y Axis (0=Static, 1=Chaotic): ${vector.y}
      
      You must return a JSON MusicScore.
      Focus on the DNA (complexity, energy, darkness, industrial) between 0 and 1.
      This DNA drives a high-precision algorithmic engine.
      
      CRITICAL INSTRUCTIONS FOR HARMONY:
      - padChords: Array of exactly 4-5 notes (e.g., ["C2", "G2", "Bb2", "Eb3"]). DO NOT USE CHORD NAMES LIKE "Dmin". 
      - leadPhrase: Array of 8-16 notes (e.g., ["C3", "D3", "F3"]). ONLY INDIVIDUAL NOTES.
      - droneFrequency: A number between 20 and 80 (Hz).
      
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
          structure: { type: Type.STRING, enum: ['empty_space', 'climax', 'industrial_flow', 'fragmentation'] },
          arrangementPhase: { type: Type.STRING, enum: ['exploration', 'peak', 'decay'] },
          tensionLevel: { type: Type.NUMBER },
          harmonicFocus: { type: Type.STRING },
          influence: { type: Type.STRING },
          bunkerAesthetic: { type: Type.STRING },
          dna: {
            type: Type.OBJECT,
            properties: {
              complexity: { type: Type.NUMBER },
              energy: { type: Type.NUMBER },
              darkness: { type: Type.NUMBER },
              industrial: { type: Type.NUMBER }
            },
            required: ["complexity", "energy", "darkness", "industrial"]
          },
          leadPhrase: { type: Type.ARRAY, items: { type: Type.STRING } },
          padChords: { type: Type.ARRAY, items: { type: Type.STRING } },
          droneFrequency: { type: Type.NUMBER },
          effects: {
            type: Type.OBJECT,
            properties: {
              distortion: { type: Type.NUMBER },
              bitcrush: { type: Type.NUMBER },
              filterCutoff: { type: Type.NUMBER },
              resonance: { type: Type.NUMBER },
              delaySend: { type: Type.NUMBER },
              reverbSend: { type: Type.NUMBER },
              glitchAmount: { type: Type.NUMBER },
              rumbleDecay: { type: Type.NUMBER }
            },
            required: ["distortion", "bitcrush", "filterCutoff", "resonance", "delaySend", "reverbSend", "glitchAmount", "rumbleDecay"]
          },
          artistCommentary: { type: Type.STRING }
        },
        required: ["bpm", "mood", "intensity", "structure", "arrangementPhase", "tensionLevel", "harmonicFocus", "influence", "bunkerAesthetic", "dna", "leadPhrase", "padChords", "droneFrequency", "effects", "artistCommentary"]
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
