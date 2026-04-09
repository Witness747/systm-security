import React, { useState } from 'react';
import { SYSCALL_LABELS } from '../core/processManager';

const TABS = [
  { key: 'all',   label: 'All' },
  { key: 'allow', label: 'Allow' },
  { key: 'deny',  label: 'Deny' },
];

export default function AuditLog({ logs }) {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = logs.filter(log => {
    if (activeTab === 'allow') return log.status === 'ALLOWED';
    if (activeTab === 'deny') return log.status === 'DENIED' || log.status === 'QUARANTINE';
    return true;
  });

  const getRiskLevel = (log) => {
    if (log.status === 'QUARANTINE') return 'CRITICAL';
    if (log.status === 'DENIED') return 'HIGH';
    if (['file_delete', 'mem_exec', 'proc_fork'].includes(log.syscall)) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div>
      <div className="section-label">Audit Log</div>
      <div className="audit-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`audit-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-[9px] text-slate-500">{filtered.length} entries</span>
      </div>

      <div className="card" style={{ padding: 0, maxHeight: 220, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-600 text-xs">No entries</div>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Time</th>
                <th>PID</th>
                <th>Result</th>
                <th>Syscall</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <React.Fragment key={log.id}>
                  <tr onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                    <td className="text-slate-500">{log.id}</td>
                    <td className="text-slate-500">{log.time}</td>
                    <td className="font-bold" style={{ color: 'var(--clr-info)' }}>{log.processId}</td>
                    <td>
                      <span className={
                        log.status === 'ALLOWED' ? 'text-success' :
                        log.status === 'QUARANTINE' ? 'text-warning' : 'text-danger'
                      }>
                        {log.status}
                      </span>
                    </td>
                    <td>{SYSCALL_LABELS[log.syscall] || log.syscall}</td>
                    <td className="text-slate-500" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.target}
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div className="audit-expand">
                          <div className="audit-expand-grid">
                            <div className="audit-expand-item">
                              <span className="audit-expand-label">UID</span>
                              <span className="audit-expand-value">{log.detail?.uid ?? '—'}</span>
                            </div>
                            <div className="audit-expand-item">
                              <span className="audit-expand-label">Risk Level</span>
                              <span className="audit-expand-value" style={{
                                color: getRiskLevel(log) === 'CRITICAL' ? 'var(--clr-danger)' :
                                       getRiskLevel(log) === 'HIGH' ? 'var(--clr-warning)' :
                                       getRiskLevel(log) === 'MEDIUM' ? 'var(--clr-info)' : 'var(--clr-success)'
                              }}>
                                {getRiskLevel(log)}
                              </span>
                            </div>
                            <div className="audit-expand-item">
                              <span className="audit-expand-label">Auth Result</span>
                              <span className="audit-expand-value">{log.detail?.authResult || '—'}</span>
                            </div>
                            <div className="audit-expand-item">
                              <span className="audit-expand-label">ACL Decision</span>
                              <span className="audit-expand-value">{log.detail?.aclDecision || '—'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
