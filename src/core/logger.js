/**
 * Logger / Audit Module
 * Records all syscall attempts with timestamps, process IDs, actions, and results.
 * Simulates Linux's auditd subsystem.
 *
 * Each log entry now includes:
 *  - rejectedAtStage: which pipeline stage rejected (null if allowed)
 *  - reason: human-readable denial/approval reason
 *  - riskScore: numeric 0–100 risk score
 */

let logCounter = 0;

/**
 * Reset the log counter (call on simulator reset).
 */
export function resetLogCounter() {
  logCounter = 0;
}

/**
 * Compute a numeric risk score (0–100) for a log entry.
 */
export function computeRiskScore(status, syscall, detail = {}) {
  let score = 0;

  // Base score by status
  if (status === 'QUARANTINE') score += 60;
  else if (status === 'DENIED') score += 40;
  else score += 5; // ALLOWED

  // Syscall sensitivity
  const sensitivityMap = {
    mem_exec: 25,
    file_delete: 20,
    proc_fork: 15,
    file_write: 10,
    net_connect: 10,
    file_read: 5,
  };
  score += sensitivityMap[syscall] || 0;

  // Trust violations
  if (detail.trustCheckResult === 'FAILED') score += 15;

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Get a severity label from a risk score.
 */
export function getSeverityFromScore(riskScore) {
  if (riskScore >= 70) return 'CRITICAL';
  if (riskScore >= 50) return 'HIGH';
  if (riskScore >= 25) return 'MEDIUM';
  if (riskScore >= 10) return 'LOW';
  return 'INFO';
}

/**
 * Get the color for a severity label.
 */
export function getSeverityColor(severity) {
  switch (severity) {
    case 'CRITICAL': return 'var(--clr-danger)';
    case 'HIGH':     return 'var(--clr-warning)';
    case 'MEDIUM':   return 'var(--clr-info)';
    case 'LOW':      return 'var(--clr-success)';
    case 'INFO':     return 'var(--clr-text-muted)';
    default:         return 'var(--clr-text-muted)';
  }
}

/**
 * Create a new log entry with the current timestamp.
 * @param {string} processId - Process ID.
 * @param {string} syscall - System call type.
 * @param {string} status - "ALLOWED", "DENIED", or "QUARANTINE".
 * @param {string} target - The target path/resource.
 * @param {object} detail - Detailed breakdown of each pipeline stage.
 * @param {string|null} rejectedAtStage - Which stage rejected (null if allowed).
 * @param {string} reason - Human-readable reason for the result.
 * @returns {object} The log entry object.
 */
export function createLogEntry(processId, syscall, status, target, detail = {}, rejectedAtStage = null, reason = '') {
  logCounter++;
  const riskScore = computeRiskScore(status, syscall, detail);
  const severity = getSeverityFromScore(riskScore);
  return {
    id: logCounter,
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp: Date.now(),
    processId,
    syscall,
    status,
    target,
    detail,
    rejectedAtStage,
    reason,
    riskScore,
    severity,
  };
}

/**
 * Create a log entry for ACL modifications.
 */
export function createACLChangeLog(processId, syscall, newValue, changedBy = 'user') {
  logCounter++;
  return {
    id: logCounter,
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp: Date.now(),
    processId,
    syscall,
    status: 'ACL_CHANGE',
    target: `${syscall} → ${newValue ? 'ALLOW' : 'DENY'}`,
    detail: { changedBy, previousValue: !newValue, newValue },
    rejectedAtStage: null,
    reason: `ACL rule modified: ${processId}/${syscall} set to ${newValue ? 'ALLOW' : 'DENY'} by ${changedBy}`,
    riskScore: 15,
    severity: 'LOW',
  };
}

/**
 * Export logs as a JSON string.
 */
export function exportLogsJSON(logs) {
  return JSON.stringify(logs, null, 2);
}

/**
 * Export logs as CSV string.
 */
export function exportLogsCSV(logs) {
  const header = 'ID,Time,Process,Syscall,Status,Target,RejectedAt,Reason,RiskScore,Severity';
  const esc = (v) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const rows = logs.map(l =>
    [l.id, l.time, l.processId, l.syscall, l.status, l.target || '', l.rejectedAtStage || '', l.reason || '', l.riskScore ?? '', l.severity || ''].map(esc).join(',')
  );
  return [header, ...rows].join('\n');
}

/**
 * Trigger file download from a data string.
 */
export function downloadFile(data, filename, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
