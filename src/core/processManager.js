/**
 * Process Manager Module
 * Defines simulated processes with their identities, UIDs, and roles.
 */

export const SYSCALL_TYPES = [
  'file_read',
  'file_write',
  'file_delete',
  'net_connect',
  'proc_fork',
  'mem_exec',
];

export const SYSCALL_LABELS = {
  file_read:   'File Read',
  file_write:  'File Write',
  file_delete: 'File Delete',
  net_connect: 'Net Connect',
  proc_fork:   'Proc Fork',
  mem_exec:    'Mem Exec',
};

export const DEFAULT_PROCESSES = {
  P1: { name: 'user_shell',    uid: 1001, role: 'user',     description: 'Standard user-level shell process' },
  P2: { name: 'admin_daemon',  uid: 0,    role: 'admin',    description: 'Administrative daemon with root privileges' },
  P3: { name: 'malware_agent', uid: 1337, role: 'attacker', description: 'Malicious process — untrusted binary' },
  P4: { name: 'web_server',    uid: 80,   role: 'service',  description: 'HTTP web server (httpd / nginx)' },
};

/** Default ACL map: processId -> Set of allowed syscall types */
export const DEFAULT_ACL = {
  P1: new Set(['file_read', 'file_write']),
  P2: new Set(['file_read', 'file_write', 'file_delete', 'net_connect', 'proc_fork', 'mem_exec']),
  P3: new Set(['file_read']),
  P4: new Set(['file_read', 'net_connect']),
};

/** Build a serializable ACL (arrays instead of Sets) for state */
export function buildInitialACL() {
  const acl = {};
  for (const [pid, perms] of Object.entries(DEFAULT_ACL)) {
    acl[pid] = {};
    for (const sc of SYSCALL_TYPES) {
      acl[pid][sc] = perms.has(sc);
    }
  }
  return acl;
}

/** Build initial quarantine state — all processes free */
export function buildInitialQuarantine() {
  const q = {};
  for (const pid of Object.keys(DEFAULT_PROCESSES)) {
    q[pid] = false;
  }
  return q;
}
