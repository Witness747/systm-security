import clsx from 'clsx'
import { useMemo } from 'react'

function secondsAgo(ts) {
  if (!ts) return null
  const t = new Date(ts).getTime()
  if (Number.isNaN(t)) return null
  return Math.max(0, Math.floor((Date.now() - t) / 1000))
}

export function StatusBar({ tracing, stats, rulesCount, lastEventAt }) {
  const ago = useMemo(() => secondsAgo(lastEventAt), [lastEventAt])
  const perMin = Math.round((stats.total / Math.max(1, (Math.min(200, stats.total) * 1.8) / 60)) || 0)

  return (
    <div className="sticky bottom-0 z-10 border-t border-white/5 bg-[color:var(--bg-surface)]/70 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="mono flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
          <span className={clsx('h-2 w-2 rounded-full', tracing ? 'bg-[color:var(--accent-cyan)] animate-pulse' : 'bg-white/20')} />
          {tracing ? 'LIVE SIMULATION — generating every 1.8s' : 'SIMULATION PAUSED'}
        </div>

        <div className="mono text-xs text-[color:var(--text-muted)]">~{perMin} events/min</div>

        <div className="mono flex items-center gap-3 text-xs text-[color:var(--text-muted)]">
          <span>Policy Engine: {rulesCount} rules active</span>
          <span className="text-white/20">|</span>
          <span>Last event: {ago == null ? '—' : `${ago}s ago`}</span>
        </div>
      </div>
    </div>
  )
}

