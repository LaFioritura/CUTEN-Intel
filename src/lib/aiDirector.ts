import { GoogleGenAI, Type } from '@google/genai';
import type { Macros, MusicScore } from '../types/app';
import { makeFallbackScore } from './fallbackScore';

let ai: GoogleGenAI | null = null;

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!ai) ai = new GoogleGenAI({ apiKey });
  return ai;
}

export async function getDirectedScore(macros: Macros, sceneName: string): Promise<MusicScore> {
  const client = getAI();
  if (!client) return makeFallbackScore(macros, sceneName);

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the music director for C-HELL Extractor. Return only a JSON object.
Current scene: ${sceneName}
Macros:
energy=${macros.energy}
tension=${macros.tension}
darkness=${macros.darkness}
complexity=${macros.complexity}
space=${macros.space}
glitch=${macros.glitch}
Need an operator-focused, dark, dry, warehouse-adjacent score with precise notes and realistic values.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bpm: { type: Type.NUMBER },
            mood: { type: Type.STRING },
            intensity: { type: Type.NUMBER },
            structure: { type: Type.STRING },
            arrangementPhase: { type: Type.STRING },
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
              required: ['complexity', 'energy', 'darkness', 'industrial']
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
              required: ['distortion', 'bitcrush', 'filterCutoff', 'resonance', 'delaySend', 'reverbSend', 'glitchAmount', 'rumbleDecay']
            },
            artistCommentary: { type: Type.STRING }
          },
          required: ['bpm', 'mood', 'intensity', 'structure', 'arrangementPhase', 'tensionLevel', 'harmonicFocus', 'influence', 'bunkerAesthetic', 'dna', 'leadPhrase', 'padChords', 'droneFrequency', 'effects', 'artistCommentary']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}') as MusicScore;
    return parsed.bpm ? parsed : makeFallbackScore(macros, sceneName);
  } catch {
    return makeFallbackScore(macros, sceneName);
  }
}
