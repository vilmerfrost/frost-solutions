export function getPortalToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('portal_token')
}

export function setPortalToken(token: string) {
  localStorage.setItem('portal_token', token)
}

export function clearPortalToken() {
  localStorage.removeItem('portal_token')
}

export function getPortalUser(): { id: string; email: string; name: string } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('portal_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setPortalUser(user: { id: string; email: string; name: string }) {
  localStorage.setItem('portal_user', JSON.stringify(user))
}

export function clearPortalUser() {
  localStorage.removeItem('portal_user')
}

export async function portalFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getPortalToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`/app/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (res.status === 401) {
    clearPortalToken()
    clearPortalUser()
    window.location.href = '/app/portal/login'
    throw new Error('Session expired')
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
