/**
 * Logger / Audit Module
 * Records all syscall attempts with timestamps, process IDs, actions, and results.
 * Simulates Linux's auditd subsystem.
 */

let logCounter = 0;

/**
 * Create a new log entry with the current timestamp.
 * @param {string} processId - Process ID.
 * @param {string} syscall - System call type.
 * @param {string} status - "ALLOWED", "DENIED", or "QUARANTINE".
 * @param {string} target - The target path/resource.
 * @param {object} detail - Detailed breakdown of each pipeline stage.
 * @returns {object} The log entry object.
 */
export function createLogEntry(processId, syscall, status, target, detail = {}) {
  logCounter++;
  return {
    id: logCounter,
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp: Date.now(),
    processId,
    syscall,
    status,
    target,
    detail,
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
  const header = 'ID,Time,Process,Syscall,Status,Target';
  const rows = logs.map(l => `${l.id},${l.time},${l.processId},${l.syscall},${l.status},${l.target || ''}`);
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
