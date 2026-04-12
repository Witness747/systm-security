import React, { useState } from 'react';
import { SYSCALL_LABELS } from '../core/processManager';
import { exportLogsCSV, exportLogsJSON, downloadFile } from '../core/logger';

const TABS = [
  { key: 'all',   label: 'All' },
  { key: 'allow', label: 'Allow' },
  { key: 'deny',  label: 'Deny' },
];

export default function AuditLog({ logs }) {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const [filterPid, setFilterPid] = useState('');
  const [filterSyscall, setFilterSyscall] = useState('');

  const filtered = logs.filter(log => {
    if (activeTab === 'allow' && log.status !== 'ALLOWED') return false;
    if (activeTab === 'deny' && log.status !== 'DENIED' && log.status !== 'QUARANTINE') return false;
    if (filterPid && !log.processId.toLowerCase().includes(filterPid.toLowerCase())) return false;
    if (filterSyscall && !log.syscall.toLowerCase().includes(filterSyscall.toLowerCase())) return false;
    return true;
  });

  const handleExportJSON = () => {
    const json = exportLogsJSON(filtered);
    downloadFile(json, 'syscall_audit_log.json', 'application/json');
  };

  const handleExportCSV = () => {
    const csv = exportLogsCSV(filtered);
    downloadFile(csv, 'syscall_audit_log.csv', 'text/csv');
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
      </div>
      
      <div className="audit-filters" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input 
          type="text" 
          placeholder="Filter PID..." 
          value={filterPid} 
          onChange={e => setFilterPid(e.target.value)}
          className="filter-input"
          style={{ background: 'var(--clr-bg-3)', border: '1px solid var(--clr-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: 'var(--clr-text)' }}
        />
        <input 
          type="text" 
          placeholder="Filter Syscall..." 
          value={filterSyscall} 
          onChange={e => setFilterSyscall(e.target.value)}
          className="filter-input"
          style={{ background: 'var(--clr-bg-3)', border: '1px solid var(--clr-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: 'var(--clr-text)' }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={handleExportCSV} className="btn-xs" style={{ padding: '4px 8px' }}>CSV</button>
          <button onClick={handleExportJSON} className="btn-xs" style={{ padding: '4px 8px' }}>JSON</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
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
                              <span className="audit-expand-label">Severity</span>
                              <span className="audit-expand-value" style={{
                                color: log.severity === 'CRITICAL' ? 'var(--clr-danger)' :
                                       log.severity === 'HIGH' ? 'var(--clr-warning)' :
                                       log.severity === 'MEDIUM' ? 'var(--clr-info)' : 'var(--clr-success)'
                              }}>
                                {log.severity || 'LOW'} ({log.riskScore ?? 0})
                              </span>
                            </div>
                            <div className="audit-expand-item">
                              <span className="audit-expand-label">Auth Result</span>
                              <span className="audit-expand-value">{log.detail?.authResult || '—'}</span>
                            </div>
                            <div className="audit-expand-item">
                              <span className="audit-expand-label">Stage Stopped</span>
                              <span className="audit-expand-value">{log.rejectedAtStage || (log.status === 'ALLOWED' ? 'Completed' : '—')}</span>
                            </div>
                          </div>
                          
                          <div style={{ marginTop: '12px' }}>
                            <span className="audit-expand-label" style={{ display: 'block', marginBottom: '4px' }}>Reason</span>
                            <div style={{ background: 'var(--clr-bg-4)', padding: '6px 10px', borderRadius: '4px', color: 'var(--clr-text)' }}>
                              {log.reason || 'No detailed reason provided.'}
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
