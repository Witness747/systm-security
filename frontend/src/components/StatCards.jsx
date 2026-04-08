import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

function useAnimatedNumber(value) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 300, damping: 30 })
  const rounded = useTransform(spring, (v) => Math.round(v))
  return { mv, rounded }
}

function Sparkline({ points, color }) {
  const w = 120
  const h = 28
  const max = Math.max(1, ...points)
  const barW = w / points.length

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      {points.map((p, i) => {
        const bh = Math.max(2, (p / max) * (h - 4))
        return (
          <rect
            key={i}
            x={i * barW + 1}
            y={h - bh - 2}
            width={Math.max(2, barW - 2)}
            height={bh}
            rx="1"
            fill={color}
            opacity={0.55}
          />
        )
      })}
    </svg>
  )
}

function StatCard({ label, value, tone, spark, pulse }) {
  const { mv, rounded } = useAnimatedNumber(value)
  const MotionDiv = motion.div
  const MotionSpan = motion.span

  // keep mv in sync
  if (mv.get() !== value) mv.set(value)

  const styles =
    tone === 'cyan'
      ? 'card'
      : tone === 'green'
        ? 'card card-green'
        : 'card card-red'

  const color =
    tone === 'cyan'
      ? 'var(--accent-cyan)'
      : tone === 'green'
        ? 'var(--accent-green)'
        : 'var(--accent-red)'

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={styles}
    >
      <MotionDiv
        animate={pulse ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={pulse ? { duration: 0.6 } : { duration: 0.2 }}
        className="flex items-center justify-between gap-4 px-5 py-4"
      >
        <div>
          <div className="mono text-xs font-semibold tracking-widest text-[color:var(--text-muted)]">{label}</div>
          <div className="orbitron mt-2 text-3xl font-bold text-[color:var(--text-primary)]">
            <MotionSpan style={{ color }}>{rounded}</MotionSpan>
          </div>
        </div>
        <Sparkline points={spark} color={color} />
      </MotionDiv>
    </MotionDiv>
  )
}

export function StatCards({ stats, events }) {
  const last20 = events.slice(-20)
  const buckets = last20.map((e) => (e.verdict === 'BLOCKED' ? 3 : 1))
  const bucketsAllowed = last20.map((e) => (e.verdict === 'ALLOWED' ? 2 : 0))
  const bucketsBlocked = last20.map((e) => (e.verdict === 'BLOCKED' ? 2 : 0))

  const pulseBlocked = stats.blocked > 0 && last20.some((e) => e.verdict === 'BLOCKED')

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="TOTAL EVENTS" value={stats.total} tone="cyan" spark={buckets} />
      <StatCard label="ALLOWED" value={stats.allowed} tone="green" spark={bucketsAllowed} />
      <StatCard label="BLOCKED" value={stats.blocked} tone="red" spark={bucketsBlocked} pulse={pulseBlocked} />
    </div>
  )
}

