import React from 'react';
import { DEFAULT_PROCESSES, SYSCALL_TYPES, SYSCALL_LABELS } from '../core/processManager';
import { getSeverityColor } from '../core/logger';

export default function ThreatMonitor({ logs, acl, onToggleACL, idsThreshold, onSetIdsThreshold, isUnderAttack }) {
  const total = logs.length;
  const allowed = logs.filter(l => l.status === 'ALLOWED').length;
  const denied = logs.filter(l => l.status === 'DENIED' || l.status === 'QUARANTINE').length;
  const efficiency = total === 0 ? 100 : Math.round((allowed / total) * 100);

  // Deny ratio for threat bar
  const denyRatio = total === 0 ? 0 : Math.round((denied / total) * 100);
  const threatColor = denyRatio < 30 ? 'var(--clr-success)' : denyRatio < 60 ? 'var(--clr-warning)' : 'var(--clr-danger)';

  // Fault chart: last 12 events
  const last12 = logs.slice(-12);

  // Recent denials: last 5 denied
  const recentDenials = logs.filter(l => l.status === 'DENIED' || l.status === 'QUARANTINE').slice(-5).reverse();

  return (
    <div className="threat-monitor-inline">
      <div className="section-label">Security Metrics</div>

      {/* 4 Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--clr-info)' }}>{total}</div>
          <div className="metric-label">Total</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--clr-success)' }}>{allowed}</div>
          <div className="metric-label">Allowed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--clr-danger)' }}>{denied}</div>
          <div className="metric-label">Blocked</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: efficiency > 70 ? 'var(--clr-success)' : 'var(--clr-warning)' }}>
            {efficiency}%
          </div>
          <div className="metric-label">Efficiency</div>
        </div>
      </div>

      {/* Threat Level Bar */}
      <div>
        <div className="section-label">Threat Level</div>
        <div className="threat-bar-container">
          <div className="threat-bar" style={{ width: `${denyRatio}%`, background: threatColor }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-500">0%</span>
          <span className="text-[9px]" style={{ color: threatColor }}>{denyRatio}% deny ratio</span>
          <span className="text-[9px] text-slate-500">100%</span>
        </div>
      </div>

      {/* IDS Threshold */}
      <div>
        <div className="section-label">IDS Threshold</div>
        <div className="ids-slider">
          <span className="text-[9px] text-slate-500">1</span>
          <input
            type="range"
            min={1}
            max={10}
            value={idsThreshold}
            onChange={e => onSetIdsThreshold(Number(e.target.value))}
          />
          <span className="text-[9px] text-slate-500">10</span>
          <span className="ids-slider-val">{idsThreshold}</span>
        </div>
      </div>

      {/* Fault Accumulation Chart */}
      <div>
        <div className="section-label">Fault Accumulation (Last 12)</div>
        <div className="fault-chart">
          {last12.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[10px] text-slate-600">No data</div>
          ) : (
            last12.map((log, i) => {
              const barHeight = Math.max(15, Math.min(100, (log.riskScore ?? 10) + 10));
              return (
                <div
                  key={log.id}
                  className="fault-bar"
                  title={`${log.processId} ${log.syscall} — Risk: ${log.riskScore ?? 0}`}
                  style={{
                    height: `${barHeight}%`,
                    background: log.status === 'ALLOWED' ? 'var(--clr-success)' : getSeverityColor(log.severity) || 'var(--clr-danger)',
                    opacity: 0.5 + (i / last12.length) * 0.5,
                  }}
                />
              );
            }))
          }
        </div>
      </div>

      {/* ACL Overview Matrix */}
      <div>
        <div className="section-label">ACL Overview Matrix</div>
        <div className="acl-matrix" style={{ gridTemplateColumns: `40px repeat(${SYSCALL_TYPES.length}, 1fr)` }}>
          {/* Header row */}
          <div /> {/* empty corner */}
          {SYSCALL_TYPES.map(sc => (
            <div key={sc} className="acl-matrix-header">{sc.split('_')[0][0]}{sc.split('_')[1]?.[0] || ''}</div>
          ))}
          {/* Data rows */}
          {Object.keys(DEFAULT_PROCESSES).map(pid => (
            <React.Fragment key={pid}>
              <div className="acl-matrix-pid">{pid}</div>
              {SYSCALL_TYPES.map(sc => (
                <button
                  key={sc}
                  className={`acl-matrix-cell ${acl[pid]?.[sc] ? 'on' : 'off'}`}
                  onClick={() => onToggleACL(pid, sc)}
                  title={`${pid} / ${SYSCALL_LABELS[sc]}: ${acl[pid]?.[sc] ? 'ON' : 'OFF'}`}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent Denials Feed */}
      <div>
        <div className="section-label">Recent Denials</div>
        <div className="flex flex-col gap-2">
          {recentDenials.length === 0 ? (
            <div className="text-[10px] text-slate-600 text-center py-3">No denials</div>
          ) : (
            recentDenials.map(log => (
              <div key={log.id} className="denial-feed-item">
                <span className="deny-dot" style={{ background: getSeverityColor(log.severity) || 'var(--clr-danger)' }} />
                <span className="font-bold text-info">{log.processId}</span>
                <span>{SYSCALL_LABELS[log.syscall] || log.syscall}</span>
                <span className="ml-auto text-[9px] text-slate-500">{log.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
