import { v4 as uuid } from 'uuid'
import { sampleArgs } from './argTemplates.js'
import { evaluateVerdict } from './policyEngine.js'

const PIDS = [1234, 2891, 3047, 4102, 5500]
const PROCS = ['bash', 'nginx', 'python3', 'sshd', 'curl', 'node']

function pickWeighted(items, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < items.length; i += 1) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function createRng(seed = Date.now()) {
  // mulberry32
  let t = seed >>> 0
  return function rng() {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export const MODES = {
  idle: {
    id: 'idle',
    label: 'Idle Process',
    syscalls: ['read', 'write', 'stat', 'lstat', 'close', 'access', 'ioctl', 'mmap'],
    weights: [20, 20, 14, 10, 10, 10, 8, 8],
    blockedBias: 0.05,
  },
  web: {
    id: 'web',
    label: 'Web Server',
    syscalls: ['socket', 'bind', 'listen', 'accept', 'read', 'write', 'connect', 'stat', 'close'],
    weights: [12, 8, 8, 12, 20, 20, 6, 8, 6],
    blockedBias: 0.1,
  },
  attack: {
    id: 'attack',
    label: 'Attack Sim',
    syscalls: ['openat', 'execve', 'ptrace', 'connect', 'chmod', 'unlink', 'kill', 'mprotect', 'read', 'write'],
    weights: [18, 14, 10, 12, 10, 6, 6, 6, 10, 8],
    blockedBias: 0.6,
  },
}

function fakeReturnValue(syscall, verdict, rng) {
  if (verdict === 'BLOCKED') {
    const errors = ['-1 EACCES', '-1 EPERM', '-1 ENOENT']
    return errors[Math.floor(rng() * errors.length)]
  }
  if (syscall === 'openat' || syscall === 'socket') return `fd=${3 + Math.floor(rng() * 6)}`
  if (syscall === 'connect') return '0'
  if (syscall === 'execve') return '0'
  if (syscall === 'read') return String(32 + Math.floor(rng() * 4096))
  if (syscall === 'write') return String(8 + Math.floor(rng() * 512))
  if (syscall === 'close') return '0'
  return '0'
}

export function generateEvent({ modeId, policyRules, seed }) {
  const rng = createRng(seed ?? Date.now())
  const mode = MODES[modeId] || MODES.idle

  const syscall = pickWeighted(mode.syscalls, mode.weights, rng)
  const pid = PIDS[Math.floor(rng() * PIDS.length)]
  const processName = PROCS[Math.floor(rng() * PROCS.length)]
  const args = sampleArgs(syscall, rng)

  const base = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    pid,
    processName,
    syscall,
    args,
  }

  let verdict = evaluateVerdict(base, policyRules)

  // Bias toward blocked rate in attack mode by occasionally forcing suspicious templates
  if (verdict === 'ALLOWED' && modeId === 'attack' && rng() < mode.blockedBias) {
    if (syscall === 'openat') base.args = 'AT_FDCWD, "/etc/shadow", O_RDONLY'
    if (syscall === 'connect') base.args = '3, {AF_INET, 45.33.32.156:4444}, 16'
    verdict = evaluateVerdict(base, policyRules)
  }

  const returnValue = fakeReturnValue(syscall, verdict, rng)
  return { ...base, returnValue, verdict }
}

