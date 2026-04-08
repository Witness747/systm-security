import { useEffect, useMemo, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { TopBar } from './components/TopBar.jsx'
import { StatCards } from './components/StatCards.jsx'
import { TracerControl } from './components/TracerControl.jsx'
import { PolicyManager } from './components/PolicyManager.jsx'
import { SyscallTable } from './components/SyscallTable.jsx'
import { ThreatFeed } from './components/ThreatFeed.jsx'
import { StatusBar } from './components/StatusBar.jsx'
import { useSimulation } from './hooks/useSimulation.jsx'
import { usePolicy } from './hooks/usePolicy.js'

function App() {
  const [now, setNow] = useState(() => new Date())
  const {
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
  } = useSimulation()

  const { rules, addRule, deleteRule } = usePolicy()

  const blockedEvents = useMemo(() => events.filter((e) => e.verdict === 'BLOCKED'), [events])

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  function downloadReport() {
    const payload = {
      generatedAt: new Date().toISOString(),
      modeId,
      tracing,
      policyRules: rules,
      events,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SCI-ES_simulation_report_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="hud-bg grid-overlay scanlines min-h-full">
      <TopBar now={now} tracing={tracing} modePills={modePills} modeId={modeId} onModeChange={setMode} />

      <main className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="mono text-xs text-[color:var(--text-muted)]">
            Fully simulated. No backend, no real OS syscalls.
          </div>
          <button
            type="button"
            onClick={downloadReport}
            className="mono inline-flex items-center gap-2 rounded-lg bg-black/30 px-4 py-2 text-xs font-semibold text-[color:var(--accent-cyan)] ring-1 ring-[color:var(--accent-cyan)]/35 shadow-[var(--glow-cyan)] hover:bg-black/40"
          >
            ⭳ SIMULATION_REPORT (JSON)
          </button>
        </div>

        <div className="mt-4">
          <StatCards stats={stats} events={events} />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_280px]">
          <div className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <TracerControl
                tracing={tracing}
                fakePid={fakePid}
                setFakePid={setFakePid}
                start={startTracing}
                stop={stopTracing}
                events={events}
              />
              <PolicyManager rules={rules} addRule={addRule} deleteRule={deleteRule} />
            </div>

            <SyscallTable events={events} />
          </div>

          <aside className="hidden xl:block">
            <ThreatFeed blockedEvents={blockedEvents} />
          </aside>
        </div>
      </main>

      <StatusBar tracing={tracing} stats={stats} rulesCount={rules.length} lastEventAt={lastEventAt} />

      <Toaster
        toastOptions={{
          style: {
            background: 'rgba(13, 17, 23, 0.92)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(0, 212, 255, 0.20)',
          },
        }}
      />
    </div>
  )
}

export default App
