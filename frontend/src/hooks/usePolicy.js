import { useCallback } from 'react'
import { useSimulationStore } from '../store/simulationStore.js'

export function usePolicy() {
  const rules = useSimulationStore((s) => s.policyRules)
  const addRuleRaw = useSimulationStore((s) => s.addRule)
  const deleteRuleRaw = useSimulationStore((s) => s.deleteRule)

  const addRule = useCallback(
    ({ type, syscall, pathPattern }) => {
      addRuleRaw({
        type,
        syscall: String(syscall || '').trim(),
        pathPattern: String(pathPattern || ''),
      })
    },
    [addRuleRaw],
  )

  const deleteRule = useCallback((id) => deleteRuleRaw(id), [deleteRuleRaw])

  return { rules, addRule, deleteRule }
}

