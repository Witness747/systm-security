import { AnimatePresence, motion } from 'framer-motion'

function formatTime(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function ThreatFeed({ blockedEvents }) {
  const items = blockedEvents.slice(-8).reverse()
  const MotionDiv = motion.div

  return (
    <div className="card card-red p-0">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="orbitron text-sm font-bold text-[color:var(--accent-amber)]">⚠ THREAT FEED</div>
        <div className="mono text-xs text-[color:var(--text-muted)]">{items.length} alerts</div>
      </div>

      <div className="grid gap-3 px-4 py-4">
        {items.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-3 ring-1 ring-white/5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--accent-green)] animate-pulse" />
            <div className="mono text-xs text-[color:var(--text-muted)]">No threats detected</div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((e) => (
              <MotionDiv
                key={e.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="rounded-xl bg-black/20 px-3 py-3 ring-1 ring-white/5"
              >
                <div className="mono text-xs text-[color:var(--text-muted)]">{formatTime(e.timestamp)}</div>
                <div className="mono mt-1 text-sm font-semibold text-[color:var(--accent-red)]">
                  {e.processName} → {e.syscall}
                </div>
                <div className="mono mt-1 truncate text-xs text-[color:var(--text-primary)]" title={e.args}>
                  {e.args}
                </div>
              </MotionDiv>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

