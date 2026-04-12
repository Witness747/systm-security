/**
 * Attack Scenarios
 * Pre-built sequences of syscalls that simulate real-world attack patterns.
 *
 * The five required scenarios from the SCIES spec:
 *   1. Privilege Escalation
 *   2. Syscall Flooding (DoS)
 *   3. Token Forgery
 *   4. ACL Bypass Attempt
 *   5. Lateral Movement
 */

export const ATTACK_SCENARIOS = [
  {
    id: 'priv_esc',
    name: 'Privilege Escalation',
    description: 'Malware tries to fork, execute memory, and write to sensitive system files — escalating privileges.',
    color: 'var(--clr-danger)',
    steps: [
      { processId: 'P3', syscall: 'proc_fork',   target: '/bin/sh' },
      { processId: 'P3', syscall: 'mem_exec',    target: '/tmp/exploit.bin' },
      { processId: 'P3', syscall: 'file_write',  target: '/etc/shadow' },
      { processId: 'P3', syscall: 'file_write',  target: '/etc/passwd' },
    ],
  },
  {
    id: 'syscall_flood',
    name: 'Syscall Flooding',
    description: 'DoS via rapid syscall bursts — floods the pipeline with repeated network and fork calls.',
    color: 'var(--clr-info)',
    isFlood: true, // flag for rate-based detection
    steps: [
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:80' },
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:80' },
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:443' },
      { processId: 'P3', syscall: 'proc_fork',   target: 'flood_worker_1' },
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:8080' },
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:8443' },
      { processId: 'P3', syscall: 'proc_fork',   target: 'flood_worker_2' },
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:9090' },
    ],
  },
  {
    id: 'token_forgery',
    name: 'Token Forgery',
    description: 'Injects invalid/expired credentials — attempts to bypass authentication with forged tokens.',
    color: 'var(--clr-purple)',
    tokenAction: 'forge', // signal to App.jsx to forge the token before running
    steps: [
      { processId: 'P3', syscall: 'file_read',   target: '/etc/shadow' },
      { processId: 'P3', syscall: 'file_write',  target: '/tmp/forged_creds' },
      { processId: 'P3', syscall: 'net_connect', target: 'c2server.evil:443' },
      { processId: 'P3', syscall: 'mem_exec',    target: '/tmp/inject_token.so' },
    ],
  },
  {
    id: 'acl_bypass',
    name: 'ACL Bypass Attempt',
    description: 'Crafted requests exploiting misconfigured rules — probes every syscall type across multiple processes.',
    color: 'var(--clr-warning)',
    steps: [
      { processId: 'P1', syscall: 'file_delete', target: '/var/log/audit.log' },     // user can't delete
      { processId: 'P1', syscall: 'mem_exec',    target: '/tmp/rootkit.bin' },        // user can't exec memory
      { processId: 'P1', syscall: 'proc_fork',   target: 'shadow_process' },          // user can't fork
      { processId: 'P4', syscall: 'file_write',  target: '/etc/nginx/nginx.conf' },   // webserver can't write
      { processId: 'P4', syscall: 'proc_fork',   target: 'rogue_worker' },            // webserver can't fork
      { processId: 'P4', syscall: 'file_delete', target: '/var/www/html/index.html' },// webserver can't delete
    ],
  },
  {
    id: 'lateral_movement',
    name: 'Lateral Movement',
    description: 'Chained syscalls probing unauthorized resources — reads credentials, pivots across network boundaries.',
    color: 'var(--clr-cyan)',
    steps: [
      { processId: 'P1', syscall: 'file_read',   target: '/etc/passwd' },
      { processId: 'P1', syscall: 'file_read',   target: '/home/user/.ssh/id_rsa' },
      { processId: 'P1', syscall: 'net_connect', target: '192.168.1.50:22' },
      { processId: 'P1', syscall: 'file_read',   target: '/var/log/auth.log' },
      { processId: 'P1', syscall: 'net_connect', target: '192.168.1.100:3306' },
      { processId: 'P1', syscall: 'file_read',   target: '/etc/shadow' },
    ],
  },
];
