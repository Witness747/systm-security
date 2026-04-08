import { useCallback, useEffect, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { useSimulationStore } from '../store/simulationStore.js'

export function useSimulation() {
  const tracing = useSimulationStore((s) => s.tracing)
  const modeId = useSimulationStore((s) => s.modeId)
  const modes = useSimulationStore((s) => s.modes)
  const setMode = useSimulationStore((s) => s.setMode)
  const fakePid = useSimulationStore((s) => s.fakePid)
  const setFakePid = useSimulationStore((s) => s.setFakePid)
  const events = useSimulationStore((s) => s.events)
  const lastEventAt = useSimulationStore((s) => s.lastEventAt)
  const start = useSimulationStore((s) => s.start)
  const stop = useSimulationStore((s) => s.stop)
  const pushEvent = useSimulationStore((s) => s.pushEvent)

  const intervalRef = useRef(null)

  const stats = useMemo(() => {
    let allowed = 0
    let blocked = 0
    for (const e of events) {
      if (e.verdict === 'BLOCKED') blocked += 1
      else allowed += 1
    }
    return { total: events.length, allowed, blocked }
  }, [events])

  useEffect(() => {
    if (!tracing) return

    intervalRef.current = window.setInterval(() => {
      const ev = pushEvent()
      if (ev?.verdict === 'BLOCKED') {
        toast.custom(
          (t) => (
            <div
              className={[
                'rounded-xl bg-[color:var(--bg-surface)] px-4 py-3 ring-1 ring-[color:var(--accent-red)]/35 shadow-[var(--glow-red)]',
                'text-[color:var(--text-primary)]',
                t.visible ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              <div className="mono text-xs font-semibold text-[color:var(--accent-red)]">⛔ BLOCKED</div>
              <div className="mono mt-0.5 text-sm font-semibold">
                {ev.processName} → {ev.syscall}
              </div>
              <div className="mono mt-0.5 max-w-[420px] truncate text-xs text-[color:var(--text-muted)]">
                {ev.args}
              </div>
            </div>
          ),
          { id: ev.id, duration: 2500, position: 'bottom-right' },
        )
      }
    }, 1800)

    return () => window.clearInterval(intervalRef.current)
  }, [pushEvent, tracing])

  const startTracing = useCallback(() => start(), [start])
  const stopTracing = useCallback(() => stop(), [stop])

  const modePills = useMemo(() => Object.values(modes), [modes])

  return {
    tracing,
    modeId,
    modePills,
    setMode,
    fakePid,
    setFakePid,
    startTracing,
    stopTracing,
    events,
    stats,
    lastEventAt,
  }
}

