import { useMemo, useState } from 'react'

export function TracerToggle({ running, onStart, onStop, disabled }) {
  const [pid, setPid] = useState('')
  const [busy, setBusy] = useState(false)
  const effectiveDisabled = disabled || busy

  const pidError = useMemo(() => {
    if (!pid.trim()) return null
    const n = Number(pid)
    if (!Number.isInteger(n) || n <= 0) return 'PID must be a positive integer'
    return null
  }, [pid])

  async function handleToggle() {
    setBusy(true)
    try {
      if (running) {
        await onStop()
      } else {
        await onStart(pid.trim() ? Number(pid) : null)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={running}
          onClick={handleToggle}
          disabled={effectiveDisabled || (!running && Boolean(pidError))}
          className={[
            'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold ring-1 transition',
            running
              ? 'bg-red-500/10 text-red-300 ring-red-500/30 shadow-glowRed hover:bg-red-500/15'
              : 'bg-cyber-green/10 text-cyber-green ring-cyber-green/30 shadow-glowGreen hover:bg-cyber-green/15',
            effectiveDisabled ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {running ? 'Stop tracer' : 'Start tracer'}
        </button>

        <label className="flex items-center gap-2 text-sm text-zinc-300 font-mono">
          <span className="text-zinc-400">PID</span>
          <input
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            placeholder="optional"
            inputMode="numeric"
            className="w-40 rounded-md bg-black/40 px-3 py-2 text-sm text-zinc-100 ring-1 ring-cyber-blue/25 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyber-blue shadow-glowBlue"
          />
        </label>
      </div>
      {pidError ? <div className="text-xs text-red-200">{pidError}</div> : null}
      <div className="text-xs text-zinc-400 font-mono">
        If PID is empty, backend starts a demo process and traces it.
      </div>
    </div>
  )
}

