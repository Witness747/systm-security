import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { SYSCALL_POOL } from '../engine/argTemplates.js'

export function PolicyManager({ rules, addRule, deleteRule }) {
  const [type, setType] = useState('block')
  const [syscall, setSyscall] = useState('openat')
  const [pathPattern, setPathPattern] = useState('/etc/shadow')

  const canAdd = useMemo(() => Boolean(syscall.trim()), [syscall])

  return (
    <div className="card card-green p-0">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div>
          <div className="orbitron text-sm font-bold">POLICY RULES</div>
          <div className="mono text-xs text-[color:var(--text-muted)]">{rules.length} rules active</div>
        </div>
        <div className="mono rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-white/10 text-[color:var(--text-muted)]">
          Engine: substring match
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 py-4">
        {rules.map((r) => (
          <div
            key={r.id}
            className={clsx(
              'mono inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1',
              r.type === 'block'
                ? 'text-[color:var(--accent-red)] ring-[color:var(--accent-red)]/35 shadow-[var(--glow-red)]'
                : 'text-[color:var(--accent-green)] ring-[color:var(--accent-green)]/35 shadow-[var(--glow-green)]',
            )}
            title={r.id}
          >
            <span className="uppercase tracking-widest">{r.type}</span>
            <span className="text-[color:var(--text-primary)]">{r.syscall}</span>
            <span className="text-[color:var(--text-muted)]">→</span>
            <span className="max-w-[180px] truncate text-[color:var(--text-primary)]">{r.pathPattern || '(any)'}</span>
            <button
              type="button"
              onClick={() => deleteRule(r.id)}
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-white/10 hover:bg-white/10"
              aria-label="Delete rule"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 px-4 py-4">
        <div className="mono mb-2 text-xs font-semibold tracking-widest text-[color:var(--text-muted)]">ADD RULE</div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="mono grid gap-1 text-xs text-[color:var(--text-muted)]">
            Syscall
            <select
              value={syscall}
              onChange={(e) => setSyscall(e.target.value)}
              className="mono rounded-lg bg-[color:var(--bg-elevated)] px-3 py-2 text-sm ring-1 ring-[color:var(--accent-cyan)]/20 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-cyan)]"
            >
              {SYSCALL_POOL.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="mono grid gap-1 text-xs text-[color:var(--text-muted)] md:col-span-2">
            Path pattern (substring)
            <input
              value={pathPattern}
              onChange={(e) => setPathPattern(e.target.value)}
              placeholder="/etc/shadow"
              className="mono rounded-lg bg-[color:var(--bg-elevated)] px-3 py-2 text-sm ring-1 ring-[color:var(--accent-cyan)]/20 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-cyan)]"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setType((t) => (t === 'allow' ? 'block' : 'allow'))}
              className={clsx(
                'mono inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 transition',
                type === 'allow'
                  ? 'text-[color:var(--accent-green)] ring-[color:var(--accent-green)]/35 shadow-[var(--glow-green)]'
                  : 'text-[color:var(--accent-red)] ring-[color:var(--accent-red)]/35 shadow-[var(--glow-red)]',
              )}
              aria-pressed={type === 'allow'}
            >
              {type === 'allow' ? 'ALLOW' : 'BLOCK'}
              <span className="text-[color:var(--text-muted)]">↔</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => canAdd && addRule({ type, syscall, pathPattern })}
            disabled={!canAdd}
            className={clsx(
              'mono inline-flex items-center gap-2 rounded-lg bg-black/30 px-4 py-2 text-sm font-semibold ring-1',
              'text-[color:var(--accent-cyan)] ring-[color:var(--accent-cyan)]/35 shadow-[var(--glow-cyan)] hover:bg-black/40',
              !canAdd && 'opacity-50 cursor-not-allowed',
            )}
          >
            ＋ ADD RULE
          </button>
        </div>
      </div>
    </div>
  )
}

