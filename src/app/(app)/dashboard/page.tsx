'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { format } from 'date-fns'

// ── Types ────────────────────────────────────────────────────
interface LaunchProgress {
  id: string
  name: string
  total: number
  completed: number
  eduTotal: number
  eduDone: number
  enbTotal: number
  enbDone: number
}

interface UpcomingActivity {
  id: string
  name: string
  type: string
  scheduledDate: string
  owner?: string | null
  launchName?: string | null
}

interface StatsResponse {
  activeLaunches: number
  totalTasks: number
  completedTasks: number
  openRequests: number
  launchProgress: LaunchProgress[]
  upcoming: UpcomingActivity[]
}

// ── Constants ────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  live_session: 'bg-rose-100 text-rose-700 border-rose-200',
  async:        'bg-sky-100 text-sky-700 border-sky-200',
  asset:        'bg-amber-100 text-amber-700 border-amber-200',
  assessment:   'bg-violet-100 text-violet-700 border-violet-200',
  comms:        'bg-emerald-100 text-emerald-700 border-emerald-200',
  other:        'bg-slate-100 text-slate-700 border-slate-200',
  launch:       'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const TYPE_LABELS: Record<string, string> = {
  live_session: 'Live',
  async:        'Async',
  asset:        'Asset',
  assessment:   'Assessment',
  comms:        'Comms',
  other:        'Other',
}

// ── Component ────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<StatsResponse>('/api/stats')
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Team activity overview</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 text-sm">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Team activity overview</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 text-sm">Failed to load dashboard data.</div>
        </div>
      </div>
    )
  }

  const completionPct = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0

  const STAT_CARDS = [
    {
      label: 'Active Launches',
      value: String(stats.activeLaunches),
      sub: stats.activeLaunches === 1 ? '1 launch in progress' : `${stats.activeLaunches} launches in progress`,
      color: 'text-teal-600',
    },
    {
      label: 'Tasks Complete',
      value: String(stats.completedTasks),
      sub: `of ${stats.totalTasks} total \u00b7 ${completionPct}%`,
      color: 'text-violet-600',
    },
    {
      label: 'Open Requests',
      value: String(stats.openRequests),
      sub: stats.openRequests === 1 ? '1 open request' : `${stats.openRequests} open requests`,
      color: 'text-rose-600',
    },
    {
      label: 'Completion Rate',
      value: `${completionPct}%`,
      sub: `${stats.completedTasks} of ${stats.totalTasks} tasks done`,
      color: 'text-amber-600',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Team activity overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-sm font-semibold text-slate-700">{s.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Launch progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Launch Progress</h2>
          {stats.launchProgress.length === 0 ? (
            <div className="text-sm text-slate-400 py-4">No active launches</div>
          ) : (
            <div className="space-y-5">
              {stats.launchProgress.map(l => {
                const totalPct = l.total > 0 ? Math.round((l.completed / l.total) * 100) : 0
                const eduPct = l.eduTotal > 0 ? Math.round((l.eduDone / l.eduTotal) * 100) : 0
                const enbPct = l.enbTotal > 0 ? Math.round((l.enbDone / l.enbTotal) * 100) : 0
                return (
                  <div key={l.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-800">{l.name}</span>
                      <span className="text-slate-500 font-semibold">{totalPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                      <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${totalPct}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Education</span><span>{eduPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div className="bg-violet-400 h-1 rounded-full" style={{ width: `${eduPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Enablement</span><span>{enbPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div className="bg-teal-400 h-1 rounded-full" style={{ width: `${enbPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Coming Up</h2>
          {stats.upcoming.length === 0 ? (
            <div className="text-sm text-slate-400 py-4">No upcoming events</div>
          ) : (
            <div className="space-y-2">
              {stats.upcoming.map(u => {
                const colorClass = TYPE_COLORS[u.type] || TYPE_COLORS.other
                let formattedDate = ''
                try {
                  formattedDate = format(new Date(u.scheduledDate), 'MMM d')
                } catch {
                  formattedDate = u.scheduledDate
                }
                return (
                  <div key={u.id} className={`flex items-center gap-3 p-3 rounded-lg border ${colorClass}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      <div className="text-xs opacity-70">{TYPE_LABELS[u.type] || u.type}</div>
                    </div>
                    <div className="text-xs font-semibold flex-shrink-0">{formattedDate}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
