'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export const TEAM = {
  gina:      { display: 'Gina Vivar',        initials: 'GV', role: 'editor' as const, title: 'Revenue Enablement' },
  christian: { display: 'Christian Shockley', initials: 'CS', role: 'editor' as const, title: 'Revenue Enablement' },
  emily:     { display: 'Emily Moore',        initials: 'EM', role: 'editor' as const, title: 'Customer Education' },
  eliza:     { display: 'Eliza Nguyen',       initials: 'EN', role: 'editor' as const, title: 'Customer Education' },
  gerard:    { display: 'Gerard Urbano',      initials: 'GU', role: 'editor' as const, title: 'Customer Education' },
  ube:       { display: 'Guest Viewer',       initials: '👁', role: 'viewer' as const, title: 'View Only' },
} as const

export type TeamKey = keyof typeof TEAM
export type TeamUser = typeof TEAM[TeamKey]

interface AuthContextType {
  user: TeamUser | null
  isEditor: boolean
  login: (key: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isEditor: false,
  login: () => false,
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TeamUser | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('eet_user') as TeamKey | null
    if (stored && stored in TEAM) setUser(TEAM[stored])
  }, [])

  function login(val: string): boolean {
    const key = val.trim().toLowerCase() as TeamKey
    if (key in TEAM) {
      localStorage.setItem('eet_user', key)
      setUser(TEAM[key])
      return true
    }
    return false
  }

  function logout() {
    localStorage.removeItem('eet_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isEditor: user?.role === 'editor', login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
