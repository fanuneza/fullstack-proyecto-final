import { mockRequest } from './mockApi'

const baseUrl = import.meta.env.VITE_API_URL || '/api'
export const isDemo = import.meta.env.VITE_USE_MOCK !== 'false'

export async function request(path, { method = 'GET', body, token } = {}) {
  if (isDemo) return mockRequest(path, { method, body, token })
  let response
  try {
    response = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const error = new Error(data?.error?.mensaje || 'No se pudo completar la solicitud.')
    error.status = response.status
    throw error
  }
  return response.json()
}
