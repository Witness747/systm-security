/**
 * Process Manager Module
 * Defines simulated processes with their identities, UIDs, roles,
 * and per-process authentication tokens with expiry.
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

/** Trust levels — higher number = more privileged */
export const TRUST_LEVELS = {
  sandboxed: { rank: 0, label: 'Sandboxed', color: 'var(--clr-danger)' },
  guest:     { rank: 1, label: 'Guest',     color: 'var(--clr-warning)' },
  user:      { rank: 2, label: 'User',      color: 'var(--clr-info)' },
  service:   { rank: 3, label: 'Service',   color: 'var(--clr-cyan)' },
  admin:     { rank: 4, label: 'Admin',     color: 'var(--clr-success)' },
  root:      { rank: 5, label: 'Root',      color: 'var(--clr-purple)' },
};

/** Minimum trust level required per syscall type */
export const SYSCALL_TRUST_REQUIREMENTS = {
  file_read:   'guest',     // rank 1
  file_write:  'user',      // rank 2
  file_delete: 'admin',     // rank 4
  net_connect: 'user',      // rank 2
  proc_fork:   'service',   // rank 3
  mem_exec:    'admin',     // rank 4
};

export const DEFAULT_PROCESSES = {
  P1: { name: 'user_shell',    uid: 1001, role: 'user',      trustLevel: 'user',      description: 'Standard user-level shell process' },
  P2: { name: 'admin_daemon',  uid: 0,    role: 'admin',     trustLevel: 'root',      description: 'Administrative daemon with root privileges' },
  P3: { name: 'malware_agent', uid: 1337, role: 'attacker',  trustLevel: 'sandboxed', description: 'Malicious process — untrusted binary' },
  P4: { name: 'web_server',    uid: 80,   role: 'service',   trustLevel: 'service',   description: 'HTTP web server (httpd / nginx)' },
};

/** Default ACL map: processId -> Set of allowed syscall types */
export const DEFAULT_ACL = {
  P1: new Set(['file_read', 'file_write']),
  P2: new Set(['file_read', 'file_write', 'file_delete', 'net_connect', 'proc_fork', 'mem_exec']),
  P3: new Set(['file_read']),
  P4: new Set(['file_read', 'net_connect']),
};

// ─── Token System ────────────────────────────────────────────────────────────

let tokenCounter = 0;

/**
 * Generate a fresh authentication token for a process.
 * @param {string} pid - Process ID.
 * @param {number} ttlSeconds - Time-to-live in seconds (default 120s = 2 minutes).
 * @returns {object} Token object.
 */
export function generateToken(pid, ttlSeconds = 120) {
  tokenCounter++;
  const now = Date.now();
  return {
    tokenId: `TKN-${pid}-${String(tokenCounter).padStart(4, '0')}`,
    processId: pid,
    issuedAt: now,
    expiresAt: now + ttlSeconds * 1000,
    isValid: true,
    sessionId: `SES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
}

/**
 * Validate a token: checks existence, validity flag, and expiry.
 * @param {object|null} token - The token to validate.
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateToken(token) {
  if (!token) {
    return { valid: false, reason: 'No token issued — process unauthenticated' };
  }
  if (!token.isValid) {
    return { valid: false, reason: `Token ${token.tokenId} revoked / forged` };
  }
  if (Date.now() > token.expiresAt) {
    return { valid: false, reason: `Token ${token.tokenId} expired` };
  }
  return { valid: true, reason: `Token ${token.tokenId} valid (session: ${token.sessionId})` };
}

/**
 * Check if a process's trust level is sufficient for a syscall.
 * @param {string} trustLevel - The process's trust level key.
 * @param {string} syscall - The syscall type.
 * @returns {{ allowed: boolean, reason: string }}
 */
export function checkTrustLevel(trustLevel, syscall) {
  const required = SYSCALL_TRUST_REQUIREMENTS[syscall];
  const procRank = TRUST_LEVELS[trustLevel]?.rank ?? 0;
  const reqRank = TRUST_LEVELS[required]?.rank ?? 0;

  if (procRank >= reqRank) {
    return {
      allowed: true,
      reason: `Trust ${TRUST_LEVELS[trustLevel]?.label} (${procRank}) ≥ required ${TRUST_LEVELS[required]?.label} (${reqRank})`,
    };
  }
  return {
    allowed: false,
    reason: `Trust ${TRUST_LEVELS[trustLevel]?.label} (${procRank}) < required ${TRUST_LEVELS[required]?.label} (${reqRank})`,
  };
}

/**
 * Build initial token state — one valid token per process.
 */
export function buildInitialTokens() {
  const tokens = {};
  for (const pid of Object.keys(DEFAULT_PROCESSES)) {
    tokens[pid] = generateToken(pid);
  }
  return tokens;
}

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
