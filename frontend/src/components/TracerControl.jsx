import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import clsx from 'clsx'
import { useMemo } from 'react'

function makeRateSeries(events) {
  // last 10 "buckets" of ~2s ticks (approx). We'll just derive from last 10 events.
  const last = events.slice(-10)
  return last.map((e, idx) => ({
    t: idx + 1,
    v: e ? 1 : 0,
  }))
}

export function TracerControl({ tracing, fakePid, setFakePid, start, stop, events }) {
  const series = useMemo(() => makeRateSeries(events), [events])

  return (
    <div className="card p-0">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div>
          <div className="orbitron text-sm font-bold">TRACER CONTROL</div>
          <div className="mono text-xs text-[color:var(--text-muted)]">Generating ~1 event / 1.8s</div>
        </div>
        <div
          className={clsx(
            'mono rounded-full px-3 py-1 text-xs font-semibold ring-1',
            tracing
              ? 'text-[color:var(--accent-green)] ring-[color:var(--accent-green)]/35 shadow-[var(--glow-green)]'
              : 'text-[color:var(--accent-red)] ring-[color:var(--accent-red)]/35 shadow-[var(--glow-red)]',
          )}
        >
          {tracing ? 'TRACING' : 'STOPPED'}
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4">
        <div className="mono flex flex-wrap items-center gap-3">
          <div className="text-[color:var(--text-muted)]">$ attach --pid</div>
          <input
            value={fakePid}
            onChange={(e) => setFakePid(e.target.value)}
            className="mono w-32 rounded-lg bg-[color:var(--bg-elevated)] px-3 py-2 text-sm ring-1 ring-[color:var(--accent-cyan)]/20 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-cyan)]"
          />
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={start}
              className="mono inline-flex items-center gap-2 rounded-lg bg-black/30 px-4 py-2 text-sm font-semibold text-[color:var(--accent-green)] ring-1 ring-[color:var(--accent-green)]/35 shadow-[var(--glow-green)] hover:bg-black/40"
            >
              ▶ START
            </button>
            <button
              type="button"
              onClick={stop}
              className="mono inline-flex items-center gap-2 rounded-lg bg-black/30 px-4 py-2 text-sm font-semibold text-[color:var(--accent-red)] ring-1 ring-[color:var(--accent-red)]/35 shadow-[var(--glow-red)] hover:bg-black/40"
            >
              ■ STOP
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="mono text-xs text-[color:var(--text-muted)]">Event rate (last 10 ticks)</div>
          <div className="h-24 rounded-xl bg-black/20 ring-1 ring-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={[0, 2]} />
                <Tooltip contentStyle={{ background: 'rgba(13,17,23,0.9)', border: '1px solid rgba(0,212,255,0.25)', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="v" stroke="var(--accent-cyan)" fill="url(#rateFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mono text-xs text-[color:var(--text-muted)]">
            {tracing ? 'Tracer running' : 'Tracer stopped'}
          </div>
        </div>
      </div>
    </div>
  )
}

