import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'

function formatTime(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function VerdictBadge({ verdict }) {
  if (verdict === 'BLOCKED') {
    return (
      <span className="mono inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--accent-red)] ring-1 ring-[color:var(--accent-red)]/35 shadow-[var(--glow-red)]">
        ⛔ BLOCKED
      </span>
    )
  }
  return (
    <span className="mono inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--accent-green)] ring-1 ring-[color:var(--accent-green)]/25 shadow-[var(--glow-green)]">
      ✓ ALLOWED
    </span>
  )
}

function ArgsCell({ args }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <div
        className="mono max-w-[40ch] truncate text-xs text-[color:var(--text-primary)]"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {args}
      </div>
      {open ? (
        <div className="absolute z-10 mt-2 w-[520px] max-w-[80vw] rounded-xl bg-[color:var(--bg-surface)] px-3 py-2 text-xs text-[color:var(--text-primary)] ring-1 ring-[color:var(--accent-cyan)]/25 shadow-[var(--glow-cyan)]">
          <div className="mono break-words">{args}</div>
        </div>
      ) : null}
    </div>
  )
}

export function SyscallTable({ events }) {
  const MotionDiv = motion.div
  const containerRef = useRef(null)
  const [isPinnedToBottom, setPinned] = useState(true)

  const rows = useMemo(() => events.slice(-200), [events])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onScroll() {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      setPinned(nearBottom)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isPinnedToBottom) return
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [isPinnedToBottom, rows.length])

  return (
    <div className="card p-0">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="orbitron text-sm font-bold">SYSCALL EVENT TABLE</div>
        <div className="mono text-xs text-[color:var(--text-muted)]">{rows.length} / 200</div>
      </div>

      <div className="overflow-hidden">
        <div className="grid grid-cols-[48px_92px_70px_110px_86px_1fr_92px_120px] gap-0 border-b border-[color:var(--accent-cyan)]/20 bg-black/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-muted)]">
          <div>#</div>
          <div>TIME</div>
          <div>PID</div>
          <div>PROCESS</div>
          <div>SYSCALL</div>
          <div>ARGUMENTS</div>
          <div>RETURN</div>
          <div>VERDICT</div>
        </div>

        <div ref={containerRef} className="max-h-[55vh] overflow-y-auto">
          <AnimatePresence initial={false}>
            {rows.map((e, idx) => {
              const blocked = e.verdict === 'BLOCKED'
              return (
                <MotionDiv
                  key={e.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={clsx(
                    'grid grid-cols-[48px_92px_70px_110px_86px_1fr_92px_120px] items-center gap-0 px-4 py-2',
                    'border-l-[3px] hover:bg-[rgba(0,212,255,0.05)] transition-colors',
                    blocked
                      ? 'border-l-[color:var(--accent-red)] bg-[rgba(255,56,96,0.08)]'
                      : 'border-l-[color:var(--accent-green)]/40 bg-[rgba(0,255,136,0.04)]',
                  )}
                >
                  <div className="mono text-xs text-[color:var(--text-muted)]">{idx + 1}</div>
                  <div className="mono text-xs text-[color:var(--text-muted)]">{formatTime(e.timestamp)}</div>
                  <div className="mono text-xs text-[color:var(--text-primary)]">{e.pid}</div>
                  <div className="mono text-xs text-[color:var(--text-primary)]">{e.processName}</div>
                  <div
                    className={clsx(
                      'mono text-xs font-semibold',
                      blocked ? 'text-[color:var(--accent-red)]' : 'text-[color:var(--accent-cyan)]',
                    )}
                  >
                    {e.syscall}
                  </div>
                  <ArgsCell args={e.args} />
                  <div className="mono text-xs text-[color:var(--text-primary)]">{e.returnValue}</div>
                  <div>
                    <VerdictBadge verdict={e.verdict} />
                  </div>
                </MotionDiv>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

