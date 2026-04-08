export function evaluateVerdict(event, policyRules) {
  // Hardcoded simulation "always bad" rules
  if (event.syscall === 'ptrace') return 'BLOCKED'
  if (event.syscall === 'connect' && String(event.args).includes(':4444')) return 'BLOCKED'

  const syscall = event.syscall
  const args = String(event.args || '')

  // First matching BLOCK wins
  const blocks = policyRules.filter((r) => r.type === 'block' && r.syscall === syscall)
  for (const r of blocks) {
    if (!r.pathPattern) return 'BLOCKED'
    if (args.includes(r.pathPattern)) return 'BLOCKED'
  }

  const allows = policyRules.filter((r) => r.type === 'allow' && r.syscall === syscall)
  for (const r of allows) {
    if (!r.pathPattern) return 'ALLOWED'
    if (args.includes(r.pathPattern)) return 'ALLOWED'
  }

  return 'ALLOWED'
}

