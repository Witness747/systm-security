const DEFAULT_BASE_URL = 'http://localhost:8000'

export function getBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.detail ? `: ${data.detail}` : ''
    } catch {
      // ignore json parse
    }
    throw new Error(`${method} ${path} failed (${res.status}${detail})`)
  }

  if (res.status === 204) return null
  return await res.json()
}

export function getHealth() {
  return request('/health')
}

export function getSyscalls(limit = 100) {
  const qs = new URLSearchParams({ limit: String(limit) })
  return request(`/syscalls?${qs.toString()}`)
}

export function listPolicy() {
  return request('/policy')
}

export function createPolicy({ syscall, path_pattern, action }) {
  return request('/policy', { method: 'POST', body: { syscall, path_pattern, action } })
}

export function deletePolicy(id) {
  return request(`/policy/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function startTracer(pid) {
  const body = pid ? Number(pid) : null
  return request('/tracer/start', { method: 'POST', body })
}

export function stopTracer() {
  return request('/tracer/stop', { method: 'POST' })
}

