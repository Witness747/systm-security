import React, { useReducer, useState, useCallback, useRef } from 'react';
import IntroPage from './component/IntroPage';
import ControlRoom from './components/ControlRoom';
import KernelPipeline from './components/KernelPipeline';
import TerminalOutput from './components/TerminalOutput';
import AuditLog from './components/AuditLog';
import ThreatMonitor from './components/ThreatMonitor';
import { DEFAULT_PROCESSES, SYSCALL_TYPES, buildInitialACL, buildInitialQuarantine } from './core/processManager';
import { createLogEntry } from './core/logger';

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_LOGS = 200;

const PIPELINE_STAGES = ['init', 'authn', 'acl', 'exec'];

function emptyPipeline() {
  return {
    stages: { init: 'idle', authn: 'idle', acl: 'idle', exec: 'idle' },
    details: { init: 'Process Lookup', authn: 'Authentication', acl: 'Permission Gate', exec: 'Syscall Dispatch' },
  };
}

// ─── State ───────────────────────────────────────────────────────────────────
const initialState = {
  selectedProc: 'P1',
  acl: buildInitialACL(),
  quarantine: buildInitialQuarantine(),
  logs: [],
  pipeline: emptyPipeline(),
  idsThreshold: 3,
  isUnderAttack: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_PROC':
      return { ...state, selectedProc: action.pid };

    case 'TOGGLE_ACL': {
      const newAcl = { ...state.acl };
      newAcl[action.pid] = { ...newAcl[action.pid] };
      newAcl[action.pid][action.syscall] = !newAcl[action.pid][action.syscall];
      return { ...state, acl: newAcl };
    }

    case 'TOGGLE_QUARANTINE': {
      const newQ = { ...state.quarantine };
      newQ[action.pid] = !newQ[action.pid];
      return { ...state, quarantine: newQ };
    }

    case 'SET_PIPELINE':
      return { ...state, pipeline: action.pipeline };

    case 'ADD_LOG': {
      const newLogs = [...state.logs, action.log].slice(-MAX_LOGS);
      // Check IDS: count denials in last 10
      const last10 = newLogs.slice(-10);
      const recentDenials = last10.filter(l => l.status === 'DENIED' || l.status === 'QUARANTINE').length;
      const isUnderAttack = recentDenials >= state.idsThreshold;
      return { ...state, logs: newLogs, isUnderAttack };
    }

    case 'SET_IDS_THRESHOLD': {
      const last10 = state.logs.slice(-10);
      const recentDenials = last10.filter(l => l.status === 'DENIED' || l.status === 'QUARANTINE').length;
      return { ...state, idsThreshold: action.value, isUnderAttack: recentDenials >= action.value };
    }

    case 'RESET_PIPELINE':
      return { ...state, pipeline: emptyPipeline() };

    case 'RESET_ALL':
      return { ...initialState };

    default:
      return state;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [speed, setSpeed] = useState(500);
  const [stepMode, setStepMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('dark');

  // For step mode: resolve a promise when user clicks Continue
  const continueRef = useRef(null);
  const abortRef = useRef(false);

  const waitForContinue = () => new Promise(resolve => {
    continueRef.current = resolve;
  });

  const handleContinue = useCallback(() => {
    if (continueRef.current) {
      continueRef.current();
      continueRef.current = null;
    }
  }, []);

  const handleStop = useCallback(() => {
    abortRef.current = true;
    if (continueRef.current) {
      continueRef.current();
      continueRef.current = null;
    }
  }, []);

  // ─── Run a single syscall through the animated pipeline ─────────────────
  const runPipeline = useCallback(async (processId, syscall, target) => {
    if (abortRef.current) return;

    const stageDelay = () => new Promise(r => setTimeout(r, speed));

    const proc = DEFAULT_PROCESSES[processId];
    const uid = proc?.uid ?? '?';

    let stages = { init: 'idle', authn: 'idle', acl: 'idle', exec: 'idle' };
    let details = { init: '', authn: '', acl: '', exec: '' };

    const update = () => {
      dispatch({ type: 'SET_PIPELINE', pipeline: { stages: { ...stages }, details: { ...details } } });
    };

    // Stage 1: INIT
    stages.init = 'active';
    details.init = `Looking up ${processId}...`;
    update();
    if (stepMode) await waitForContinue();
    else await stageDelay();
    if (abortRef.current) return;
    
    if (!proc) {
      stages.init = 'failed';
      details.init = `PID ${processId} not found`;
      update();
      dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'DENIED', target, { uid, authResult: 'N/A', aclDecision: 'N/A' }) });
      return;
    }
    stages.init = 'passed';
    details.init = `${processId} (${proc.name}) uid:${uid}`;
    update();

    // Stage 2: AUTHN
    stages.authn = 'active';
    details.authn = `Authenticating uid:${uid}...`;
    update();
    if (stepMode) await waitForContinue();
    else await stageDelay();
    if (abortRef.current) return;

    // Read quarantine from latest state (we access it via a closure trick — check state ref)
    // Since we can't easily get latest state in an async function,
    // we'll use a simple approach: check quarantine from the passed-in state snapshot
    // This is OK because quarantine changes are rare during a run.
    const isQuarantined = state.quarantine[processId];
    if (isQuarantined) {
      stages.authn = 'failed';
      details.authn = `QUARANTINED — blocked at authentication`;
      update();
      dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'QUARANTINE', target, { uid, authResult: 'QUARANTINED', aclDecision: 'N/A' }) });
      return;
    }
    stages.authn = 'passed';
    details.authn = `uid:${uid} authenticated`;
    update();

    // Stage 3: ACL
    stages.acl = 'active';
    details.acl = `Checking ACL for ${syscall}...`;
    update();
    if (stepMode) await waitForContinue();
    else await stageDelay();
    if (abortRef.current) return;

    const isAllowed = state.acl[processId]?.[syscall] ?? false;
    if (!isAllowed) {
      stages.acl = 'failed';
      details.acl = `${syscall} DENIED by ACL`;
      stages.exec = 'failed';
      details.exec = 'Blocked';
      update();
      dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'DENIED', target, { uid, authResult: 'PASS', aclDecision: 'DENIED' }) });
      return;
    }
    stages.acl = 'passed';
    details.acl = `${syscall} ALLOWED`;
    update();

    // Stage 4: EXEC
    stages.exec = 'active';
    details.exec = `Dispatching ${syscall}...`;
    update();
    if (stepMode) await waitForContinue();
    else await stageDelay();
    if (abortRef.current) return;

    stages.exec = 'passed';
    details.exec = `${syscall} → ${target}`;
    update();
    dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'ALLOWED', target, { uid, authResult: 'PASS', aclDecision: 'ALLOWED' }) });

  }, [speed, stepMode, state.quarantine, state.acl]);

  // ─── Manual trigger ─────────────────────────────────────────────────────
  const handleManualTrigger = useCallback(async (processId, syscall, target) => {
    if (isRunning) return;
    setIsRunning(true);
    abortRef.current = false;
    dispatch({ type: 'RESET_PIPELINE' });
    await runPipeline(processId, syscall, target);
    setIsRunning(false);
  }, [isRunning, runPipeline]);

  // ─── Launch attack scenario ─────────────────────────────────────────────
  const handleLaunchAttack = useCallback(async (scenario) => {
    if (isRunning) return;
    setIsRunning(true);
    abortRef.current = false;
    for (const step of scenario.steps) {
      if (abortRef.current) break;
      dispatch({ type: 'RESET_PIPELINE' });
      dispatch({ type: 'SELECT_PROC', pid: step.processId });
      await runPipeline(step.processId, step.syscall, step.target);
      if (abortRef.current) break;
      // Brief pause between steps
      await new Promise(r => setTimeout(r, Math.max(200, speed / 2)));
    }
    dispatch({ type: 'RESET_PIPELINE' });
    setIsRunning(false);
  }, [isRunning, runPipeline, speed]);

  if (showIntro) {
    return <IntroPage onEnter={() => setShowIntro(false)} />;
  }

  return (
    <div className="app-shell" data-theme={theme}>
      {/* ─── Header ─── */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">⚡</div>
          <span className="header-title font-sans">Cybersecurity Dashboard</span>
          <span className="header-badge">v4.0</span>
        </div>
        <div className="header-controls">
          <div className="header-control-group">
            <label>Speed</label>
            <input
              type="range" min={100} max={2000} step={100}
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
            />
            <span className="text-[10px] text-slate-500" style={{ minWidth: 40 }}>{speed}ms</span>
          </div>
          <div className="header-control-group">
            <label>Step</label>
            <input
              type="checkbox"
              checked={stepMode}
              onChange={e => setStepMode(e.target.checked)}
            />
          </div>
          {isRunning && (
            <button className="btn-stop" onClick={handleStop}>■ Stop</button>
          )}

          <button 
            className="btn-theme-toggle" 
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className={`status-badge ${state.isUnderAttack ? 'attack' : 'secure'}`}>
            <span className="status-dot" />
            {state.isUnderAttack ? 'UNDER ATTACK' : 'SECURE'}
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="app-body">
        <ControlRoom
          selectedProc={state.selectedProc}
          onSelectProc={pid => dispatch({ type: 'SELECT_PROC', pid })}
          acl={state.acl}
          onToggleACL={(pid, sc) => dispatch({ type: 'TOGGLE_ACL', pid, syscall: sc })}
          quarantine={state.quarantine}
          onToggleQuarantine={pid => dispatch({ type: 'TOGGLE_QUARANTINE', pid })}
          onManualTrigger={handleManualTrigger}
          onLaunchAttack={handleLaunchAttack}
          isRunning={isRunning}
          logs={state.logs}
        />

        <div className="panel-center">
          <KernelPipeline
            pipelineState={state.pipeline}
            stepMode={stepMode}
            onContinue={handleContinue}
            onReset={() => { handleStop(); dispatch({ type: 'RESET_ALL' }); setIsRunning(false); }}
            isRunning={isRunning}
            onStop={handleStop}
          />
          <ThreatMonitor
            logs={state.logs}
            acl={state.acl}
            onToggleACL={(pid, sc) => dispatch({ type: 'TOGGLE_ACL', pid, syscall: sc })}
            idsThreshold={state.idsThreshold}
            onSetIdsThreshold={val => dispatch({ type: 'SET_IDS_THRESHOLD', value: val })}
            isUnderAttack={state.isUnderAttack}
          />
          <TerminalOutput logs={state.logs} />
          <AuditLog logs={state.logs} />
        </div>
      </div>
    </div>
  );
}
