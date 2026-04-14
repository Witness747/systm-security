import React, { useReducer, useState, useCallback, useRef, useEffect } from 'react';
import IntroPage from './component/IntroPage';
import ControlRoom from './components/ControlRoom';
import KernelPipeline from './components/KernelPipeline';
import TerminalOutput from './components/TerminalOutput';
import AuditLog from './components/AuditLog';
import ThreatMonitor from './components/ThreatMonitor';
import { DEFAULT_PROCESSES, SYSCALL_TYPES, buildInitialACL, buildInitialQuarantine, buildInitialTokens, validateToken, checkTrustLevel, generateToken, resetTokenCounter } from './core/processManager';
import { createLogEntry, createACLChangeLog, resetLogCounter } from './core/logger';

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
function createInitialState() {
  return {
    selectedProc: 'P1',
    acl: buildInitialACL(),
    quarantine: buildInitialQuarantine(),
    tokens: buildInitialTokens(),
    logs: [],
    pipeline: emptyPipeline(),
    idsThreshold: 3,
    isUnderAttack: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_PROC':
      return { ...state, selectedProc: action.pid };

    case 'TOGGLE_ACL': {
      const newAcl = { ...state.acl };
      newAcl[action.pid] = { ...newAcl[action.pid] };
      newAcl[action.pid][action.syscall] = !newAcl[action.pid][action.syscall];
      const log = createACLChangeLog(action.pid, action.syscall, newAcl[action.pid][action.syscall]);
      const newLogs = [...state.logs, log].slice(-MAX_LOGS);
      return { ...state, acl: newAcl, logs: newLogs };
    }

    case 'TOGGLE_QUARANTINE': {
      const newQ = { ...state.quarantine };
      newQ[action.pid] = !newQ[action.pid];
      return { ...state, quarantine: newQ };
    }
    
    case 'FORGE_TOKEN': {
      const newT = { ...state.tokens };
      newT[action.pid] = { ...newT[action.pid], isValid: false };
      return { ...state, tokens: newT };
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

    case 'REFRESH_TOKENS': {
      const newTokens = { ...state.tokens };
      const now = Date.now();
      for (const pid of Object.keys(newTokens)) {
        // Only refresh tokens that are still valid (not forged/revoked)
        if (newTokens[pid]?.isValid) {
          // Refresh if token will expire within 30 seconds
          if (newTokens[pid].expiresAt - now < 30000) {
            newTokens[pid] = generateToken(pid);
          }
        }
      }
      return { ...state, tokens: newTokens };
    }

    case 'RESET_PIPELINE':
      return { ...state, pipeline: emptyPipeline() };

    case 'RESET_ALL':
      resetLogCounter();
      resetTokenCounter();
      return createInitialState();

    default:
      return state;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const [speed, setSpeed] = useState(500);
  const [stepMode, setStepMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Keep a ref to latest state values so async pipeline reads fresh data
  const tokensRef = useRef(state.tokens);
  const quarantineRef = useRef(state.quarantine);
  const aclRef = useRef(state.acl);
  useEffect(() => { tokensRef.current = state.tokens; }, [state.tokens]);
  useEffect(() => { quarantineRef.current = state.quarantine; }, [state.quarantine]);
  useEffect(() => { aclRef.current = state.acl; }, [state.acl]);

  // Auto-refresh tokens before they expire (every 30s check)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'REFRESH_TOKENS' });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

    // Read from refs to always get the latest state (avoids stale closures)
    const isQuarantined = quarantineRef.current[processId];
    const token = tokensRef.current[processId];
    
    if (isQuarantined) {
      stages.authn = 'failed';
      details.authn = `QUARANTINED — Process Locked`;
      update();
      dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'QUARANTINE', target, { uid, authResult: 'QUARANTINED', aclDecision: 'N/A' }, 'AUTHN', 'Process is currently quarantined') });
      return;
    }
    
    const tokenCheck = validateToken(token);
    if (!tokenCheck.valid) {
      stages.authn = 'failed';
      details.authn = tokenCheck.reason;
      update();
      dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'DENIED', target, { uid, authResult: 'INVALID TOKEN', aclDecision: 'N/A' }, 'AUTHN', tokenCheck.reason) });
      return;
    }
    
    const trustCheck = checkTrustLevel(proc.trustLevel, syscall);
    if (!trustCheck.allowed) {
       stages.authn = 'failed';
       details.authn = trustCheck.reason;
       update();
       dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'DENIED', target, { uid, authResult: 'INSUFFICIENT TRUST', trustCheckResult: 'FAILED', aclDecision: 'N/A' }, 'AUTHN', trustCheck.reason) });
       return;
    }

    stages.authn = 'passed';
    details.authn = `Auth OK (${proc.trustLevel} trust)`;
    update();

    // Stage 3: ACL
    stages.acl = 'active';
    details.acl = `Checking ACL for ${syscall}...`;
    update();
    if (stepMode) await waitForContinue();
    else await stageDelay();
    if (abortRef.current) return;

    const isAllowed = aclRef.current[processId]?.[syscall] ?? false;
    if (!isAllowed) {
      stages.acl = 'failed';
      details.acl = `${syscall} DENIED by ACL`;
      stages.exec = 'failed';
      details.exec = 'Blocked';
      update();
      dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'DENIED', target, { uid, authResult: 'PASS', aclDecision: 'DENIED' }, 'ACL', 'Denied by Access Control List matrix') });
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
    dispatch({ type: 'ADD_LOG', log: createLogEntry(processId, syscall, 'ALLOWED', target, { uid, authResult: 'PASS', aclDecision: 'ALLOWED' }, null, 'Syscall fully authorized and dispatched') });

  }, [speed, stepMode]);

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
    
    if (scenario.tokenAction === 'forge') {
       dispatch({ type: 'FORGE_TOKEN', pid: scenario.steps[0].processId });
    }
    
    for (const step of scenario.steps) {
      if (abortRef.current) break;
      dispatch({ type: 'RESET_PIPELINE' });
      dispatch({ type: 'SELECT_PROC', pid: step.processId });
      await runPipeline(step.processId, step.syscall, step.target);
      if (abortRef.current) break;
      // Brief pause between steps (faster if flooding)
      const delay = scenario.isFlood ? Math.max(50, speed / 4) : Math.max(200, speed / 2);
      await new Promise(r => setTimeout(r, delay));
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
          tokens={state.tokens}
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
