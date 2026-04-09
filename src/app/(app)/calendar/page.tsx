'use client'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isSameDay, addMonths, subMonths } from 'date-fns'
import { ActivityDrawer, type DrawerActivity, type ActivityType } from '@/components/activity-drawer'

// ── Types ────────────────────────────────────────────────────
interface ApiActivity {
  id: string
  name: string
  type: string
  owner?: string | null
  scheduledDate?: string | null
  dueDate?: string | null
  completed?: boolean | null
  googleMeetLink?: string | null
  recordingLink?: string | null
  audiences?: string[] | null
  duration?: string | null
  notes?: string | null
  format?: string | null
  slideDeckLink?: string | null
  assetStatus?: string | null
  assessmentType?: string | null
  passThreshold?: string | null
  kirkpatrickLevel?: string | null
  commsType?: string | null
  otherDescription?: string | null
  launchId?: string | null
}

interface ApiLaunch {
  id: string
  name: string
  targetDate?: string | null
  activities: ApiActivity[]
}

// ── Constants ────────────────────────────────────────────────
const TYPE_STYLES: Record<string, string> = {
  live_session: 'bg-rose-50 border-l-rose-500 text-rose-800',
  async:        'bg-sky-50 border-l-sky-500 text-sky-800',
  asset:        'bg-amber-50 border-l-amber-500 text-amber-800',
  assessment:   'bg-violet-50 border-l-violet-500 text-violet-800',
  comms:        'bg-emerald-50 border-l-emerald-500 text-emerald-800',
  other:        'bg-slate-50 border-l-slate-400 text-slate-700',
  launch:       'bg-emerald-50 border-l-emerald-500 text-emerald-800',
}

const TYPE_LABELS: Record<string, string> = {
  live_session: 'Live Session',
  async:        'Async',
  asset:        'Asset',
  assessment:   'Assessment',
  comms:        'Comms',
  other:        'Other',
  launch:       'Launch Date',
}

const RECURRING = [
  { name: 'AE Team Meeting', schedule: 'Fridays 9-10am PST', highlight: false },
  { name: 'BDR Team Meeting', schedule: 'Wednesdays 8-9am PST', highlight: false },
  { name: 'SAM Team Meeting', schedule: 'Thursdays 1-2pm PST', highlight: false },
  { name: 'SE Team Meeting', schedule: 'Mondays 12-12:30pm PST', highlight: false },
  { name: 'Enablement Hour', schedule: 'Thursdays 12-1pm PST', highlight: true },
  { name: 'Technical Enablement', schedule: 'Fridays 10:15-11am PST', highlight: true },
]

const FILTERS = ['All', 'Live Sessions', 'Async', 'Launch Dates']

function dbTypeToDrawer(t: string): ActivityType {
  return t === 'live_session' ? 'live' : t as ActivityType
}

// ── Component ────────────────────────────────────────────────
export default function CalendarPage() {
  const [filter, setFilter] = useState('All')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [scheduledActivities, setScheduledActivities] = useState<ApiActivity[]>([])
  const [unscheduledActivities, setUnscheduledActivities] = useState<ApiActivity[]>([])
  const [launches, setLaunches] = useState<ApiLaunch[]>([])
  const [loading, setLoading] = useState(true)
  const [launchNameMap, setLaunchNameMap] = useState<Record<string, string>>({})

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerActivity, setDrawerActivity] = useState<DrawerActivity | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [scheduledRes, unscheduledRes, launchesRes] = await Promise.all([
        apiFetch<{ activities: ApiActivity[] }>('/api/activities?scheduled=true'),
        apiFetch<{ activities: ApiActivity[] }>('/api/activities?scheduled=false'),
        apiFetch<{ launches: ApiLaunch[] }>('/api/launches'),
      ])
      setScheduledActivities(scheduledRes.activities)
      setUnscheduledActivities(unscheduledRes.activities)
      setLaunches(launchesRes.launches)

      // Build launch name map
      const map: Record<string, string> = {}
      for (const l of launchesRes.launches) {
        map[l.id] = l.name
        for (const a of l.activities) {
          map[a.id] = l.name
        }
      }
      setLaunchNameMap(map)
    } catch (err) {
      console.error('Failed to load calendar data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart) // 0=Sun

  // Group scheduled activities by date string
  const actsByDate: Record<string, ApiActivity[]> = {}
  for (const act of scheduledActivities) {
    if (act.scheduledDate) {
      const dateKey = act.scheduledDate.slice(0, 10)
      if (!actsByDate[dateKey]) actsByDate[dateKey] = []
      actsByDate[dateKey].push(act)
    }
  }

  // Launch target dates this month
  interface LaunchDate { launchId: string; name: string; date: Date }
  const launchDates: LaunchDate[] = []
  for (const l of launches) {
    if (l.targetDate) {
      const d = new Date(l.targetDate)
      if (d >= monthStart && d <= monthEnd) {
        launchDates.push({ launchId: l.id, name: l.name, date: d })
      }
    }
  }

  function getLaunchName(act: ApiActivity): string {
    if (act.launchId && launchNameMap[act.launchId]) return launchNameMap[act.launchId]
    if (act.id && launchNameMap[act.id]) return launchNameMap[act.id]
    return ''
  }

  function openDrawer(act: ApiActivity) {
    setDrawerActivity({
      id: act.id,
      title: act.name,
      type: dbTypeToDrawer(act.type),
      launchName: getLaunchName(act),
      owner: act.owner,
      dueDate: act.dueDate,
      completed: act.completed,
      googleMeetLink: act.googleMeetLink,
      recordingLink: act.recordingLink,
      audiences: act.audiences,
      duration: act.duration,
      notes: act.notes,
      format: act.format,
      slideDeckLink: act.slideDeckLink,
      assetStatus: act.assetStatus,
      assessmentType: act.assessmentType,
      passThreshold: act.passThreshold,
      kirkpatrickLevel: act.kirkpatrickLevel,
      commsType: act.commsType,
      otherDescription: act.otherDescription,
      scheduledDate: act.scheduledDate,
    })
    setDrawerOpen(true)
  }

  // Filter logic
  function shouldShowActivity(type: string): boolean {
    if (filter === 'All') return true
    if (filter === 'Live Sessions') return type === 'live_session'
    if (filter === 'Async') return type === 'async'
    return false
  }
  function shouldShowLaunches(): boolean {
    return filter === 'All' || filter === 'Launch Dates'
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Sessions and dates that impact other teams</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading calendar...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <p className="text-slate-500 text-sm mt-1">Sessions and dates that impact other teams</p>
      </div>

      {/* Filter + legend */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500" />Live Session</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-500" />Async</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" />Content</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" />Launch Date</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Google Calendar sync -- coming soon
          </span>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-auto p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-sm font-semibold text-slate-700">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-xs font-semibold text-slate-400 text-center py-2">{d}</div>
            ))}
            {/* Padding cells for day-of-week alignment */}
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[90px]" />
            ))}
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayActivities = (actsByDate[dateKey] ?? []).filter(a => shouldShowActivity(a.type))
              const dayLaunches = shouldShowLaunches()
                ? launchDates.filter(l => isSameDay(l.date, day))
                : []

              return (
                <div key={dateKey} className="min-h-[90px] rounded-lg border border-slate-100 p-1.5 hover:border-slate-200 transition-colors">
                  <div className="text-xs text-slate-500 mb-1 font-medium">{format(day, 'd')}</div>
                  {dayActivities.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => openDrawer(ev)}
                      className={`text-[10px] leading-snug p-1.5 rounded border-l-2 mb-1 cursor-pointer hover:brightness-95 ${TYPE_STYLES[ev.type] || TYPE_STYLES.other}`}
                    >
                      <div className="font-semibold truncate">{ev.name}</div>
                      {ev.owner && <div className="opacity-70">{ev.owner}</div>}
                      <div className="opacity-60 mt-0.5">{TYPE_LABELS[ev.type] || ev.type}</div>
                    </div>
                  ))}
                  {dayLaunches.map((l) => (
                    <div
                      key={l.launchId}
                      className={`text-[10px] leading-snug p-1.5 rounded border-l-2 mb-1 ${TYPE_STYLES.launch}`}
                    >
                      <div className="font-semibold truncate">{l.name}</div>
                      <div className="opacity-60 mt-0.5">Launch Date</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Recurring meetings sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recurring Meetings</h3>
            <div className="space-y-2.5">
              {RECURRING.map(r => (
                <div key={r.name} className={`rounded-lg p-2.5 ${r.highlight ? 'bg-teal-50 border border-teal-200' : 'bg-slate-50'}`}>
                  <div className={`text-xs font-semibold ${r.highlight ? 'text-teal-800' : 'text-slate-700'}`}>{r.name}</div>
                  <div className={`text-xs mt-0.5 ${r.highlight ? 'text-teal-600' : 'text-slate-400'}`}>{r.schedule}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Unscheduled items */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          Unscheduled Items
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{unscheduledActivities.length}</span>
        </h3>
        {unscheduledActivities.length === 0 ? (
          <div className="text-sm text-slate-400">No unscheduled items</div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {unscheduledActivities.map(u => (
              <div
                key={u.id}
                onClick={() => openDrawer(u)}
                className="bg-white border border-dashed border-slate-300 rounded-lg px-4 py-3 text-sm hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="font-medium text-slate-700 mb-1">{u.name}</div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${TYPE_STYLES[u.type] || TYPE_STYLES.other}`}>
                    {TYPE_LABELS[u.type] || u.type}
                  </span>
                  {getLaunchName(u) && <span>{getLaunchName(u)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Drawer */}
      <ActivityDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activity={drawerActivity}
        onSave={fetchData}
        onRemove={fetchData}
      />
    </div>
  )
}
