/**
 * Attack Scenarios
 * Pre-built sequences of syscalls that simulate real-world attack patterns.
 */

export const ATTACK_SCENARIOS = [
  {
    id: 'priv_esc',
    name: 'Privilege Escalation',
    description: 'Malware tries to fork, execute, and write — escalating privileges.',
    color: 'var(--clr-danger)',
    steps: [
      { processId: 'P3', syscall: 'proc_fork',   target: '/bin/sh' },
      { processId: 'P3', syscall: 'mem_exec',    target: '/tmp/exploit.bin' },
      { processId: 'P3', syscall: 'file_write',  target: '/etc/shadow' },
      { processId: 'P3', syscall: 'file_write',  target: '/etc/passwd' },
    ],
  },
  {
    id: 'ransomware',
    name: 'Ransomware',
    description: 'Encrypts files by reading then deleting originals.',
    color: 'var(--clr-warning)',
    steps: [
      { processId: 'P3', syscall: 'file_read',   target: '/home/user/documents/' },
      { processId: 'P3', syscall: 'file_write',  target: '/home/user/documents.enc' },
      { processId: 'P3', syscall: 'file_delete', target: '/home/user/documents/' },
      { processId: 'P3', syscall: 'file_write',  target: '/home/user/RANSOM_NOTE.txt' },
      { processId: 'P3', syscall: 'net_connect', target: 'c2server.evil:443' },
    ],
  },
  {
    id: 'ddos',
    name: 'DDoS Flood',
    description: 'Opens mass network connections to flood target.',
    color: 'var(--clr-info)',
    steps: [
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:80' },
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:80' },
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:443' },
      { processId: 'P3', syscall: 'proc_fork',   target: 'flood_worker' },
      { processId: 'P3', syscall: 'net_connect', target: '10.0.0.1:8080' },
    ],
  },
  {
    id: 'exfiltration',
    name: 'Data Exfiltration',
    description: 'Reads sensitive files and sends them over the network.',
    color: 'var(--clr-purple)',
    steps: [
      { processId: 'P1', syscall: 'file_read',   target: '/etc/passwd' },
      { processId: 'P1', syscall: 'file_read',   target: '/var/log/auth.log' },
      { processId: 'P1', syscall: 'net_connect', target: 'exfil.attacker.com:9999' },
      { processId: 'P1', syscall: 'file_read',   target: '/home/user/.ssh/id_rsa' },
      { processId: 'P1', syscall: 'net_connect', target: 'exfil.attacker.com:9999' },
    ],
  },
  {
    id: 'insider',
    name: 'Insider Threat',
    description: 'Admin process performs suspicious deletions and memory executions.',
    color: 'var(--clr-warning)',
    steps: [
      { processId: 'P2', syscall: 'file_delete', target: '/var/log/audit.log' },
      { processId: 'P2', syscall: 'file_delete', target: '/var/log/syslog' },
      { processId: 'P2', syscall: 'mem_exec',    target: '/tmp/backdoor.so' },
      { processId: 'P2', syscall: 'net_connect', target: 'darkweb.onion:443' },
      { processId: 'P2', syscall: 'file_write',  target: '/root/.bashrc' },
    ],
  },
];
