import { useEffect, useRef, useState } from 'react'

export function usePolling(
  fetcher,
  { intervalMs = 2000, enabled = true, initialData, onData, onError } = {},
) {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const aliveRef = useRef(true)
  const prevDataRef = useRef(initialData)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let timer = null
    const onDataRef = onData
    const onErrorRef = onError

    async function tick() {
      try {
        const next = await fetcher()
        if (!aliveRef.current) return
        setData(next)
        setError(null)
        try {
          onDataRef?.(next, prevDataRef.current)
        } finally {
          prevDataRef.current = next
        }
      } catch (e) {
        if (!aliveRef.current) return
        setError(e instanceof Error ? e : new Error('Polling failed'))
        onErrorRef?.(e)
      } finally {
        if (aliveRef.current) setLoading(false)
      }
    }

    tick()
    timer = setInterval(tick, intervalMs)
    return () => clearInterval(timer)
  }, [fetcher, enabled, intervalMs, onData, onError])

  return { data, error, loading }
}

