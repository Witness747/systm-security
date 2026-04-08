import { create } from 'zustand'
import { v4 as uuid } from 'uuid'

import { MODES, generateEvent } from '../engine/syscallGenerator.js'

const DEFAULT_RULES = [
  { id: uuid(), type: 'block', syscall: 'openat', pathPattern: '/etc/shadow' },
  { id: uuid(), type: 'block', syscall: 'openat', pathPattern: '/etc/passwd' },
  { id: uuid(), type: 'block', syscall: 'openat', pathPattern: 'id_rsa' },
  { id: uuid(), type: 'block', syscall: 'execve', pathPattern: 'exploit' },
  { id: uuid(), type: 'block', syscall: 'chmod', pathPattern: '/etc' },
  { id: uuid(), type: 'allow', syscall: 'read', pathPattern: '' },
  { id: uuid(), type: 'allow', syscall: 'write', pathPattern: '' },
]

export const useSimulationStore = create((set, get) => ({
  modeId: 'idle',
  tracing: false,
  fakePid: 'auto',
  events: [],
  policyRules: DEFAULT_RULES,
  lastEventAt: null,

  setMode: (modeId) => set({ modeId }),
  setFakePid: (fakePid) => set({ fakePid }),

  start: () => set({ tracing: true }),
  stop: () => set({ tracing: false }),

  addRule: (rule) =>
    set((s) => ({
      policyRules: [
        ...s.policyRules,
        {
          id: uuid(),
          type: rule.type,
          syscall: rule.syscall,
          pathPattern: rule.pathPattern ?? '',
        },
      ],
    })),

  deleteRule: (id) => set((s) => ({ policyRules: s.policyRules.filter((r) => r.id !== id) })),

  pushEvent: () => {
    const s = get()
    const ev = generateEvent({ modeId: s.modeId, policyRules: s.policyRules, seed: Date.now() })
    set((prev) => {
      const next = [...prev.events, ev]
      const trimmed = next.length > 200 ? next.slice(next.length - 200) : next
      return { events: trimmed, lastEventAt: ev.timestamp }
    })
    return ev
  },

  clearEvents: () => set({ events: [], lastEventAt: null }),

  modes: MODES,
}))

