import React, { useState } from 'react';
import { DEFAULT_PROCESSES, SYSCALL_TYPES, SYSCALL_LABELS } from '../core/processManager';
import { ATTACK_SCENARIOS } from '../core/attackScenarios';

export default function ControlRoom({
  selectedProc,
  onSelectProc,
  acl,
  onToggleACL,
  quarantine,
  onToggleQuarantine,
  tokens,
  onManualTrigger,
  onLaunchAttack,
  isRunning,
  logs,
}) {
  const [triggerSyscall, setTriggerSyscall] = useState('file_read');
  const [triggerTarget, setTriggerTarget] = useState('/etc/passwd');
  const [inspecting, setInspecting] = useState(null);

  const handleTrigger = () => {
    onManualTrigger(selectedProc, triggerSyscall, triggerTarget);
  };

  const getProcessStats = (pid) => {
    const procLogs = logs.filter(l => l.processId === pid);
    return {
      total: procLogs.length,
      allowed: procLogs.filter(l => l.status === 'ALLOWED').length,
      denied: procLogs.filter(l => l.status === 'DENIED' || l.status === 'QUARANTINE').length,
    };
  };

  return (
    <div className="panel-left">
      {/* Process Selector */}
      <div>
        <div className="section-label">Process Selector</div>
        <div className="flex flex-col gap-2">
          {Object.entries(DEFAULT_PROCESSES).map(([pid, info]) => {
            const isQ = quarantine[pid];
            const isSel = pid === selectedProc;
            return (
              <div key={pid}>
                <div
                  className={`proc-card ${isSel ? 'selected' : ''} ${isQ ? 'quarantined' : ''}`}
                  onClick={() => onSelectProc(pid)}
                >
                  <div className="proc-header">
                    <span className="proc-pid">{pid}</span>
                    <span className="proc-name">{info.name}</span>
                    <span className="proc-uid">uid:{info.uid}</span>
                  </div>
                  <div className="proc-desc">{info.description}</div>
                  <div className="proc-actions">
                    <button
                      className={`btn-xs ${isQ ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onToggleQuarantine(pid); }}
                      title="Toggle Quarantine"
                    >
                      {isQ ? '🔒 Locked' : '🔓 Free'}
                    </button>
                    <div 
                      className={`btn-xs ${!tokens[pid]?.isValid ? 'active' : ''}`}
                      title={tokens[pid]?.isValid ? "Token Valid" : "Token Forged/Revoked"}
                      style={{ cursor: 'default' }}
                    >
                      {tokens[pid]?.isValid ? '✓ Auth OK' : '⚠ Invalid'}
                    </div>
                    <button
                      className="btn-xs"
                      onClick={(e) => { e.stopPropagation(); setInspecting(inspecting === pid ? null : pid); }}
                    >
                      ℹ Info
                    </button>
                  </div>
                </div>

                {/* Inspector panel */}
                {inspecting === pid && (
                  <div className="card-sm mt-1 mb-1 text-[10px] text-slate-400">
                    {(() => {
                      const stats = getProcessStats(pid);
                      return (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><div className="text-white font-bold text-sm">{stats.total}</div>Total</div>
                          <div><div className="text-green-500 font-bold text-sm">{stats.allowed}</div>OK</div>
                          <div><div className="text-red-500 font-bold text-sm">{stats.denied}</div>Deny</div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ACL Permissions Editor */}
      <div>
        <div className="section-label">ACL Permissions — {selectedProc}</div>
        <div className="acl-grid">
          {SYSCALL_TYPES.map(sc => {
            const isAllowed = acl[selectedProc]?.[sc];
            return (
              <div
                key={sc}
                className={`acl-cell ${isAllowed ? 'allowed' : 'denied'}`}
                onClick={() => onToggleACL(selectedProc, sc)}
                title={`${SYSCALL_LABELS[sc]}: ${isAllowed ? 'Allowed' : 'Denied'} — Click to toggle`}
              >
                {SYSCALL_LABELS[sc]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Syscall Trigger */}
      <div>
        <div className="section-label">Manual Trigger</div>
        <div className="trigger-row">
          <select value={triggerSyscall} onChange={e => setTriggerSyscall(e.target.value)}>
            {SYSCALL_TYPES.map(sc => (
              <option key={sc} value={sc}>{SYSCALL_LABELS[sc]}</option>
            ))}
          </select>
          <input
            type="text"
            value={triggerTarget}
            onChange={e => setTriggerTarget(e.target.value)}
            placeholder="/path/to/target"
          />
        </div>
        <button className="btn-trigger w-full mt-2" onClick={handleTrigger} disabled={isRunning}>
          ▶ Execute Syscall
        </button>
      </div>

      {/* Attack Scenarios */}
      <div>
        <div className="section-label">Attack Scenarios</div>
        <div className="flex flex-col gap-2">
          {ATTACK_SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              className="attack-btn"
              disabled={isRunning}
              onClick={() => onLaunchAttack(scenario)}
              title={scenario.description}
            >
              <span>{scenario.name}</span>
              <span className="attack-launch" style={{ background: 'var(--clr-danger-bg)', color: 'var(--clr-danger)' }}>
                Launch
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
