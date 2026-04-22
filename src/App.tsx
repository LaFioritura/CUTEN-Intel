import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { LaneEditor } from './components/LaneEditor';
import { MacroPanel } from './components/MacroPanel';
import { Matrix } from './components/Matrix';
import { canExportJson, consumeJsonExport, loadCommerceState, saveCommerceState, unlockJsonPack, unlockRecording } from './lib/commerce';
import { getDirectedScore } from './lib/aiDirector';
import { mutateLanePattern, randomizeSingleStep, regenerateLane } from './lib/patternEngine';
import { createDefaultLanes, defaultMacros, laneOrder, scenePresets } from './lib/presets';
import type { CommerceState, LaneId, LaneState, Macros, MusicScore } from './types/app';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function App() {
  const engineRef = useRef(AudioEngine.getInstance());
  const [lanes, setLanes] = useState<LaneState[]>(createDefaultLanes());
  const [macros, setMacros] = useState<Macros>(defaultMacros);
  const [selectedLane, setSelectedLane] = useState<LaneId>('kick');
  const [sceneId, setSceneId] = useState(scenePresets[0].id);
  const [bpm, setBpm] = useState<number>(126);
  const [running, setRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [barSeed, setBarSeed] = useState<number>(1);
  const [score, setScore] = useState<MusicScore | null>(null);
  const [commerce, setCommerce] = useState<CommerceState>(() => loadCommerceState());
  const [recording, setRecording] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('IDLE');
  const [log, setLog] = useState<string[]>(['OPERATOR BUILD READY']);

  const scene = useMemo(() => scenePresets.find((preset) => preset.id === sceneId) ?? scenePresets[0], [sceneId]);
  const selectedLaneState = lanes.find((lane) => lane.id === selectedLane) ?? lanes[0];

  useEffect(() => saveCommerceState(commerce), [commerce]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentStep((value: number) => (running ? (value + 1) % 16 : value));
    }, (60 / Math.max(40, bpm)) * 250);
    return () => window.clearInterval(timer);
  }, [running, bpm]);

  useEffect(() => {
    engineRef.current.applyMacros(macros);
    engineRef.current.setBpm(bpm);
  }, [macros, bpm]);

  const pushLog = (message: string) => {
    setLog((current: string[]) => [message, ...current].slice(0, 12));
  };

  const patchLane = (laneId: LaneId, patch: Partial<LaneState>) => {
    setLanes((current: LaneState[]) => current.map((lane: LaneState) => (lane.id === laneId ? { ...lane, ...patch } : lane)));
  };

  const toggleStep = (laneId: LaneId, index: number) => {
    setLanes((current: LaneState[]) => current.map((lane: LaneState) => (lane.id === laneId ? randomizeSingleStep(lane, index) : lane)));
  };

  const handleMutateLane = (laneId: LaneId) => {
    setBarSeed((seed: number) => seed + 1);
    setLanes((current: LaneState[]) => current.map((lane: LaneState) => (lane.id === laneId ? mutateLanePattern(lane, macros, barSeed) : lane)));
    pushLog(`${laneId.toUpperCase()} lane mutated.`);
  };

  const handleSceneLoad = async (nextSceneId: string) => {
    const preset = scenePresets.find((item) => item.id === nextSceneId);
    if (!preset) return;
    setSceneId(nextSceneId);
    setBpm(preset.bpm);
    setMacros(preset.macros);
    setLanes((current: LaneState[]) => current.map((lane: LaneState) => ({ ...lane, ...preset.laneTweaks[lane.id] })));
    setStatus('DIRECTING');
    const nextScore = await getDirectedScore(preset.macros, preset.name);
    setScore(nextScore);
    setStatus('SCENE LOADED');
    pushLog(`Scene ${preset.name} loaded.`);
  };

  const handleRun = async () => {
    if (running) {
      engineRef.current.stop();
      setRunning(false);
      setStatus('STOPPED');
      pushLog('Transport stopped.');
      return;
    }
    await engineRef.current.start(lanes, macros, bpm);
    setRunning(true);
    setStatus('RUNNING');
    pushLog(`Transport started at ${bpm} BPM.`);
  };

  const handleAutoDirect = async () => {
    setStatus('DIRECTING');
    const nextScore = await getDirectedScore(macros, scene.name);
    setScore(nextScore);
    setBpm(nextScore.bpm);
    setMacros((current: Macros) => ({
      ...current,
      energy: clamp(nextScore.dna.energy),
      tension: clamp(nextScore.tensionLevel),
      darkness: clamp(nextScore.dna.darkness),
      complexity: clamp(nextScore.dna.complexity),
      space: clamp(nextScore.effects.reverbSend + 0.1),
      glitch: clamp(nextScore.effects.glitchAmount)
    }));
    pushLog('AI/local director refreshed the scene.');
    setStatus('READY');
  };

  const handleRegenerateAll = () => {
    setBarSeed((seed: number) => seed + 1);
    setLanes((current: LaneState[]) => current.map((lane: LaneState, index: number) => regenerateLane(lane, macros, barSeed + index)));
    pushLog('All lanes regenerated from current DNA.');
  };

  const exportPayload = {
    meta: {
      app: 'C-HELL Extractor V2 // Operator Edition',
      scene: scene.name,
      bpm,
      exportedAt: new Date().toISOString()
    },
    commerce,
    macros,
    lanes,
    score
  };

  const handleExportJson = () => {
    if (!canExportJson(commerce)) {
      pushLog('JSON export blocked. Unlock 4 exports for €3.');
      return;
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chell-extractor-${scene.id}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setCommerce((current: CommerceState) => consumeJsonExport(current));
    pushLog('JSON exported.');
  };

  const handleUnlockExports = () => {
    setCommerce((current: CommerceState) => unlockJsonPack(current));
    pushLog('4 JSON exports unlocked for €3.');
  };

  const handleUnlockRecording = () => {
    setCommerce((current: CommerceState) => unlockRecording(current));
    pushLog('Recording download unlocked for €9.99.');
  };

  const handleRecording = async () => {
    if (!commerce.recordingUnlocked) {
      pushLog('Recording download locked. Unlock for €9.99.');
      return;
    }

    if (!recording) {
      await engineRef.current.startRecording();
      setRecording(true);
      pushLog('Recording armed.');
      return;
    }

    const blob = await engineRef.current.stopRecording();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chell-recording-${Date.now()}.webm`;
    link.click();
    URL.revokeObjectURL(url);
    setRecording(false);
    pushLog('Recording downloaded.');
  };

  return (
    <div className="shell">
      <header className="topbar panel">
        <div>
          <div className="eyebrow">C-HELL EXTRACTOR V2</div>
          <h1>OPERATOR EDITION</h1>
        </div>
        <div className="topbar-controls">
          <button className="primary-btn" onClick={handleRun}>{running ? 'STOP' : 'PLAY'}</button>
          <button className="secondary-btn" onClick={handleAutoDirect}>DIRECT</button>
          <button className="secondary-btn" onClick={handleRegenerateAll}>REBUILD</button>
          <label className="compact-field">
            BPM
            <input type="number" min={70} max={180} value={bpm} onChange={(event: ChangeEvent<HTMLInputElement>) => setBpm(Number(event.target.value))} />
          </label>
          <label className="compact-field select-wrap">
            SCENE
            <select value={sceneId} onChange={(event: ChangeEvent<HTMLSelectElement>) => void handleSceneLoad(event.target.value)}>
              {scenePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
            </select>
          </label>
          <div className="status-box">
            <span>STATE</span>
            <strong>{status}</strong>
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="left-column">
          <MacroPanel macros={macros} onChange={(patch: Partial<Macros>) => setMacros((current: Macros) => ({ ...current, ...patch }))} />
          <div className="panel commerce-panel">
            <div className="panel-title">ECONOMY</div>
            <div className="commerce-row"><span>FREE JSON</span><strong>{commerce.freeJsonRemaining}</strong></div>
            <div className="commerce-row"><span>PAID JSON</span><strong>{commerce.paidJsonCredits}</strong></div>
            <div className="commerce-row"><span>REC DOWNLOAD</span><strong>{commerce.recordingUnlocked ? 'UNLOCKED' : 'LOCKED'}</strong></div>
            <div className="commerce-row"><span>REVENUE</span><strong>€ {commerce.totalRevenue.toFixed(2)}</strong></div>
            <button className="secondary-btn block-btn" onClick={handleExportJson}>EXPORT JSON</button>
            <button className="secondary-btn block-btn" onClick={handleUnlockExports}>UNLOCK 4 EXPORTS — €3</button>
            <button className="secondary-btn block-btn" onClick={handleRecording}>{recording ? 'STOP + DOWNLOAD REC' : 'REC / DOWNLOAD'}</button>
            <button className="secondary-btn block-btn" onClick={handleUnlockRecording}>UNLOCK REC — €9.99</button>
          </div>
        </aside>

        <section className="center-column">
          <Matrix lanes={lanes} currentStep={currentStep} onToggle={toggleStep} />
          <div className="panel scene-panel">
            <div className="panel-title">SCENE MEMORY</div>
            <div className="scene-headline">
              <strong>{scene.name}</strong>
              <span>{scene.description}</span>
            </div>
            {score && (
              <div className="score-box">
                <div><strong>DIRECTOR:</strong> {score.influence}</div>
                <div><strong>MOOD:</strong> {score.mood}</div>
                <div><strong>PHASE:</strong> {score.arrangementPhase}</div>
                <div><strong>COMMENT:</strong> {score.artistCommentary}</div>
              </div>
            )}
          </div>
        </section>

        <aside className="right-column panel">
          <div className="panel-title">LANE CONTROL</div>
          <div className="lane-stack">
            {laneOrder.map((laneId) => {
              const lane = lanes.find((item) => item.id === laneId)!;
              return (
                <LaneEditor
                  key={lane.id}
                  lane={lane}
                  selected={selectedLane === lane.id}
                  onSelect={() => setSelectedLane(lane.id)}
                  onPatch={(patch: Partial<LaneState>) => patchLane(lane.id, patch)}
                  onRandomize={() => handleMutateLane(lane.id)}
                />
              );
            })}
          </div>
        </aside>
      </main>

      <footer className="bottom-strip panel">
        <div className="bottom-left">
          <div className="panel-title">SELECTED LANE</div>
          <div className="lane-details">
            <strong>{selectedLaneState.label}</strong>
            <span>Steps active: {selectedLaneState.steps.filter((value: number) => value > 0).length} / 16</span>
            <span>Muted: {selectedLaneState.muted ? 'YES' : 'NO'} / Solo: {selectedLaneState.solo ? 'YES' : 'NO'}</span>
          </div>
        </div>
        <div className="bottom-right">
          <div className="panel-title">EVENT LOG</div>
          <div className="log-list">
            {log.map((entry: string, index: number) => <div key={`${entry}-${index}`}>{entry}</div>)}
          </div>
        </div>
      </footer>
    </div>
  );
}
