import React, { useRef, useEffect } from 'react';
import { SYSCALL_LABELS } from '../core/processManager';

export default function TerminalOutput({ logs }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs.length]);

  const statusClass = (s) => {
    if (s === 'ALLOWED') return 'ok';
    if (s === 'DENIED') return 'deny';
    if (s === 'QUARANTINE') return 'quar';
    return 'info';
  };

  const statusTag = (s) => {
    if (s === 'ALLOWED') return 'OK';
    if (s === 'DENIED') return 'DENIED';
    if (s === 'QUARANTINE') return 'QUARANTINE';
    return s;
  };

  return (
    <div>
      <div className="section-label">Terminal Output</div>
      <div className="terminal">
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot" style={{ background: '#ef4444' }} />
            <div className="terminal-dot" style={{ background: '#f59e0b' }} />
            <div className="terminal-dot" style={{ background: '#10b981' }} />
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest">kernel.log</span>
        </div>
        <div className="terminal-body" ref={bodyRef}>
          {logs.length === 0 && (
            <div className="term-line info">$ awaiting syscall...</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className={`term-line ${statusClass(log.status)}`}>
              [{log.time}] {log.processId} [{statusTag(log.status)}] {SYSCALL_LABELS[log.syscall] || log.syscall} → {log.target}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
