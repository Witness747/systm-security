import { useMemo, useState } from 'react'

export function PolicyPanel({ rules, onCreate, onDelete }) {
  const [syscall, setSyscall] = useState('open')
  const [pathPattern, setPathPattern] = useState('/etc/shadow')
  const [action, setAction] = useState('BLOCK')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const canSubmit = useMemo(() => {
    return Boolean(syscall.trim()) && Boolean(pathPattern.trim()) && (action === 'ALLOW' || action === 'BLOCK')
  }, [action, pathPattern, syscall])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setErr(null)
    try {
      await onCreate({
        syscall: syscall.trim(),
        path_pattern: pathPattern.trim(),
        action,
      })
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Failed to create rule')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-950/30 ring-1 ring-cyber-green/20 shadow-glowGreen backdrop-blur">
      <div className="border-b border-zinc-800/80 px-4 py-3">
        <div className="text-sm font-semibold text-zinc-100">Policy Rules Manager</div>
        <div className="text-xs text-zinc-400 font-mono">Rules are matched by syscall + glob(path).</div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 px-4 py-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-xs text-zinc-400 font-mono">
            Syscall
            <input
              value={syscall}
              onChange={(e) => setSyscall(e.target.value)}
              className="rounded-md bg-black/40 px-3 py-2 text-sm text-zinc-100 ring-1 ring-cyber-blue/20 focus:outline-none focus:ring-2 focus:ring-cyber-blue shadow-glowBlue"
              placeholder="open"
            />
          </label>
          <label className="grid gap-1 text-xs text-zinc-400 md:col-span-2 font-mono">
            Path pattern (glob)
            <input
              value={pathPattern}
              onChange={(e) => setPathPattern(e.target.value)}
              className="rounded-md bg-black/40 px-3 py-2 text-sm text-zinc-100 ring-1 ring-cyber-blue/20 focus:outline-none focus:ring-2 focus:ring-cyber-blue shadow-glowBlue"
              placeholder="/etc/*"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            Action
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="rounded-md bg-black/40 px-3 py-2 text-sm text-zinc-100 ring-1 ring-cyber-blue/20 focus:outline-none focus:ring-2 focus:ring-cyber-blue shadow-glowBlue"
            >
              <option value="BLOCK">BLOCK</option>
              <option value="ALLOW">ALLOW</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || busy}
            className={[
              'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium ring-1 transition',
              'bg-cyber-blue/10 text-cyber-blue ring-cyber-blue/30 shadow-glowBlue hover:bg-cyber-blue/15',
              !canSubmit || busy ? 'opacity-60 cursor-not-allowed' : '',
            ].join(' ')}
          >
            Add rule
          </button>
        </div>

        {err ? <div className="text-xs text-red-200">{err}</div> : null}
      </form>

      <div className="border-t border-zinc-800/80 px-4 py-3">
        {rules?.length ? (
          <div className="flex flex-wrap gap-2">
            {rules.map((r) => (
              <div
                key={r.id}
                className={[
                  'inline-flex items-center gap-2 rounded-full px-3 py-2 ring-1',
                  'bg-black/30',
                  r.action === 'BLOCK'
                    ? 'text-red-200 ring-red-500/30 shadow-glowRed'
                    : 'text-cyber-green ring-cyber-green/30 shadow-glowGreen',
                ].join(' ')}
                title={r.id}
              >
                <span className="text-xs font-semibold font-mono">{r.action}</span>
                <span className="text-xs font-mono text-zinc-200">{r.syscall}</span>
                <span className="text-xs font-mono text-zinc-400">→</span>
                <span className="text-xs font-mono text-zinc-200">{r.path_pattern}</span>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-zinc-100/80 ring-1 ring-white/10 hover:bg-white/10"
                  aria-label="Delete rule"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No policy rules yet.</div>
        )}
      </div>
    </div>
  )
}

