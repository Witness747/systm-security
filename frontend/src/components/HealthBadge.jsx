export function HealthBadge({ health, error, loading }) {
  const status = error ? 'error' : health?.status || (loading ? 'loading' : 'unknown')
  const pill =
    status === 'ok'
      ? 'bg-cyber-green/10 text-cyber-green ring-1 ring-cyber-green/30 shadow-glowGreen'
      : status === 'loading'
        ? 'bg-cyber-blue/10 text-cyber-blue ring-1 ring-cyber-blue/30 shadow-glowBlue'
        : 'bg-red-500/10 text-red-300 ring-1 ring-red-500/30 shadow-glowRed'

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${pill}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80 animate-pulseSoft" />
        {status.toUpperCase()}
      </span>
      <div className="text-xs text-zinc-300 font-mono">
        <span className="font-semibold text-zinc-100">{health?.event_count ?? 0}</span> total ·{' '}
        <span className="font-semibold text-cyber-green">{health?.allowed_count ?? 0}</span> allow ·{' '}
        <span className="font-semibold text-red-300">{health?.blocked_count ?? 0}</span> block
      </div>
    </div>
  )
}

