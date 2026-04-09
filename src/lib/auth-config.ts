export const TEAM_MEMBERS = {
  gina:      { name: 'Gina Vivar',        role: 'editor', team: 'Revenue Enablement' },
  christian: { name: 'Christian Shockley', role: 'editor', team: 'Revenue Enablement' },
  emily:     { name: 'Emily Moore',        role: 'editor', team: 'Customer Education' },
  eliza:     { name: 'Eliza Nguyen',       role: 'editor', team: 'Customer Education' },
  gerard:    { name: 'Gerard Urbano',      role: 'editor', team: 'Customer Education' },
  ube:       { name: 'Guest Viewer',       role: 'viewer', team: 'Guest' },
} as const

export type TeamKey = keyof typeof TEAM_MEMBERS
export type Role = 'editor' | 'viewer'
