'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export const TEAM = {
  gina:      { display: 'Gina Vivar',        initials: 'GV', role: 'editor' as const, title: 'Revenue Enablement' },
  christian: { display: 'Christian Shockley', initials: 'CS', role: 'editor' as const, title: 'Revenue Enablement' },
  emily:     { display: 'Emily Moore',        initials: 'EM', role: 'editor' as const, title: 'Customer Education' },
  eliza:     { display: 'Eliza Nguyen',       initials: 'EN', role: 'editor' as const, title: 'Customer Education' },
  gerard:    { display: 'Gerard Urbano',      initials: 'GU', role: 'editor' as const, title: 'Customer Education' },
  ube:       { display: 'Guest Viewer',       initials: '\u{1F441}', role: 'viewer' as const, title: 'View Only' },
} as const

export type TeamKey = keyof typeof TEAM
export type TeamUser = typeof TEAM[TeamKey]

interface AuthContextType {
  user: TeamUser | null
  isEditor: boolean
  loading: boolean
  login: (key: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isEditor: false,
  loading: true,
  login: async () => false,
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TeamUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount: check localStorage + validate server cookie
  useEffect(() => {
    const stored = localStorage.getItem('eet_user') as TeamKey | null
    if (stored && stored in TEAM) {
      setUser(TEAM[stored])
      // Validate the server cookie is still valid
      fetch('/api/auth/me').then(res => {
        if (!res.ok) {
          // Cookie expired — clear client state
          localStorage.removeItem('eet_user')
          setUser(null)
        }
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (val: string): Promise<boolean> => {
    const key = val.trim().toLowerCase() as TeamKey
    if (!(key in TEAM)) return false

    // Set server cookie via POST /api/auth
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: key }),
      })
      if (!res.ok) return false
    } catch {
      return false
    }

    // Set client state
    localStorage.setItem('eet_user', key)
    setUser(TEAM[key])
    return true
  }, [])

  const logout = useCallback(() => {
    fetch('/api/auth', { method: 'DELETE' }).catch(() => {})
    localStorage.removeItem('eet_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isEditor: user?.role === 'editor', loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
