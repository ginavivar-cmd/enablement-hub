import { TEAM_MEMBERS, type TeamKey } from '@/lib/auth-config'

export function useAuth() {
  if (typeof window === 'undefined') return { user: null, role: null, isEditor: false }
  const key = localStorage.getItem('eet_user') as TeamKey | null
  if (!key || !(key in TEAM_MEMBERS)) return { user: null, role: null, isEditor: false }
  const user = TEAM_MEMBERS[key]
  return { user, role: user.role, isEditor: user.role === 'editor' }
}
