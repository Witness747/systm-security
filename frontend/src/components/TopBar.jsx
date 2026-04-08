import { motion } from 'framer-motion'
import clsx from 'clsx'

function formatClock(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function TopBar({ now, tracing, modePills, modeId, onModeChange }) {
  const MotionDiv = motion.div
  return (
    <div className="sticky top-0 z-20 border-b border-white/5 bg-[color:var(--bg-surface)]/70 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-black/30 ring-1 ring-[color:var(--accent-cyan)]/25 shadow-[var(--glow-cyan)]" />
          <div className="leading-tight">
            <div className="orbitron text-sm font-bold text-[color:var(--text-primary)]">
              <span className="glitch" data-text="SCI-ES">
                SCI-ES
              </span>
            </div>
            <div className="text-xs text-[color:var(--text-muted)]">Syscall Monitor v2.0</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {modePills.map((m) => {
            const active = m.id === modeId
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onModeChange(m.id)}
                className={clsx(
                  'mono rounded-full px-4 py-2 text-xs font-semibold ring-1 transition',
                  active
                    ? 'bg-black/30 text-[color:var(--accent-cyan)] ring-[color:var(--accent-cyan)]/40 shadow-[var(--glow-cyan)]'
                    : 'bg-black/20 text-[color:var(--text-muted)] ring-white/10 hover:text-[color:var(--text-primary)]',
                )}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="mono hidden text-xs text-[color:var(--text-muted)] sm:block">{formatClock(now)}</div>
          <MotionDiv
            initial={false}
            animate={{ opacity: 1 }}
            className={clsx(
              'mono inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1',
              tracing
                ? 'text-[color:var(--accent-green)] ring-[color:var(--accent-green)]/35 shadow-[var(--glow-green)]'
                : 'text-[color:var(--accent-red)] ring-[color:var(--accent-red)]/35 shadow-[var(--glow-red)]',
            )}
          >
            <span className={clsx('h-2 w-2 rounded-full', tracing ? 'bg-[color:var(--accent-green)] animate-pulse' : 'bg-[color:var(--accent-red)]')} />
            {tracing ? '● TRACING' : '◉ IDLE'}
          </MotionDiv>
        </div>
      </div>
    </div>
  )
}

