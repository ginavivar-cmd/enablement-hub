'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { ActivityDrawer, type ActivityType, type DrawerActivity } from '@/components/activity-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'

// ── DB enum → display mappings ─────────────────────────────
const TIER_LABEL: Record<string, string> = {
  small: 'Small',
  medium: 'Medium',
  large_xl: 'Large / XL',
}
const TIER_COLOR: Record<string, string> = {
  small: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  large_xl: 'bg-purple-100 text-purple-700',
}
const STATUS_LABEL: Record<string, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  shipped: 'Shipped',
  archived: 'Archived',
}
const STATUS_COLOR: Record<string, string> = {
  planning: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-green-100 text-green-700',
  shipped: 'bg-teal-100 text-teal-700',
  archived: 'bg-slate-100 text-slate-500',
}

const TRACK_COLORS: Record<string, string> = {
  T1: 'bg-blue-100 text-blue-700',
  T2: 'bg-pink-100 text-pink-700',
  T3: 'bg-amber-100 text-amber-700',
  T4: 'bg-green-100 text-green-700',
  T5: 'bg-orange-100 text-orange-700',
  T6: 'bg-purple-100 text-purple-700',
  Custom: 'bg-slate-100 text-slate-600',
}

function getTrackColor(track: string): string {
  for (const prefix of Object.keys(TRACK_COLORS)) {
    if (track.startsWith(prefix)) return TRACK_COLORS[prefix]
  }
  return TRACK_COLORS.Custom
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Types ──────────────────────────────────────────────────
interface ApiActivity {
  id: string
  name: string
  team: string
  category: string | null
  type: string
  owner: string | null
  completed: boolean
  dueDate?: string | null
  scheduledTime?: string | null
  assetUrl?: string | null
  [key: string]: unknown
}

interface ApiLaunch {
  id: string
  name: string
  description: string | null
  tier: string
  status: string
  targetDate: string | null
  notionBriefUrl: string | null
  planningDocUrl: string | null
  goal: string | null
  learningObjectives: string[] | null
  kirkpatrick: { l1?: string; l2?: string; l3?: string; l4?: string } | null
  tracks: string[]
  activities: ApiActivity[]
}

// ── Tooltip component ────────────────────────────────────
function Tip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center cursor-help">
      <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-slate-200 text-[11px] leading-relaxed px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-normal">
        {text}
      </span>
    </span>
  )
}

// ── Activity row ─────────────────────────────────────────
function ActivityRow({
  activity, isLive, isEditor,
  onToggle, onRemove, onOpen,
}: {
  activity: ApiActivity; isLive?: boolean; isEditor: boolean
  onToggle: () => void; onRemove: () => void; onOpen?: () => void
}) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  return (
    <div
      className={`group rounded-lg border p-3 transition-colors cursor-pointer ${isLive ? 'border-rose-200 bg-white' : 'border-slate-200 bg-white'} hover:bg-slate-50`}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={activity.completed}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          disabled={!isEditor}
          className="mt-0.5 w-4 h-4 accent-teal-600 cursor-pointer flex-shrink-0 disabled:opacity-40"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-medium ${activity.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {activity.name}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {activity.scheduledTime && (
                <span className="text-xs bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full">{activity.scheduledTime}</span>
              )}
              {activity.assetUrl && (
                <a href={activity.assetUrl as string} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-700" onClick={e => e.stopPropagation()}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
              {isEditor && (
                confirmRemove ? (
                  <button onClick={e => { e.stopPropagation(); onRemove() }} className="text-xs text-red-600 font-semibold hover:text-red-800 transition-colors">
                    Confirm?
                  </button>
                ) : (
                  <button onClick={e => { e.stopPropagation(); setConfirmRemove(true); setTimeout(() => setConfirmRemove(false), 3000) }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )
              )}
            </div>
          </div>
          {!activity.completed && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {activity.owner && <span className="text-xs text-slate-400">{activity.owner}</span>}
              {activity.dueDate && <span className="text-xs text-slate-400">· {formatDate(activity.dueDate)}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────
function SectionLabel({ label, tip, badge }: { label: string; tip?: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 py-1.5">
      {label}
      {badge}
      {tip && <Tip text={tip} />}
    </div>
  )
}

// ── Infer activity type from name/category ───────────────
function inferType(name: string, category?: string): ActivityType {
  const lower = (name + ' ' + (category ?? '')).toLowerCase()
  if (lower.includes('live') || lower.includes('ilt') || lower.includes('drill') || lower.includes('role-play') || lower.includes('workshop')) return 'live'
  if (lower.includes('async') || lower.includes('video') || lower.includes('recording') || lower.includes('loom')) return 'async'
  if (lower.includes('quiz') || lower.includes('cert') || lower.includes('assessment') || lower.includes('knowledge check')) return 'assessment'
  if (lower.includes('slack') || lower.includes('email') || lower.includes('announcement') || lower.includes('memo') || lower.includes('notification') || lower.includes('drip')) return 'comms'
  if (lower.includes('doc') || lower.includes('one-pager') || lower.includes('battlecard') || lower.includes('cheat') || lower.includes('guide') || lower.includes('help docs')) return 'asset'
  return 'other'
}

// ── Inline add activity input ────────────────────────────
function AddActivityInput({ onSubmit, placeholder }: { onSubmit: (name: string) => void; placeholder: string }) {
  const [active, setActive] = useState(false)
  const [value, setValue] = useState('')

  function handleSubmit() {
    if (!value.trim()) return
    onSubmit(value.trim())
    setValue('')
    setActive(false)
  }

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="w-full text-left text-xs text-slate-400 hover:text-teal-600 px-3 py-2 border border-dashed border-slate-200 rounded-lg hover:border-teal-400 transition-colors flex items-center gap-1.5 mt-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        {placeholder}
      </button>
    )
  }

  return (
    <div className="flex gap-2 mt-1">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setActive(false); setValue('') } }}
        placeholder="Activity name..."
        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
      <button onClick={handleSubmit} disabled={!value.trim()} className="text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 px-3 py-1.5 rounded-lg transition-colors">
        Add
      </button>
      <button onClick={() => { setActive(false); setValue('') }} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5">
        Cancel
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function LaunchDetailPage() {
  const { isEditor } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [launch, setLaunch] = useState<ApiLaunch | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [objOpen, setObjOpen] = useState(false)
  const [drawerActivity, setDrawerActivity] = useState<(DrawerActivity & { id?: string }) | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Fetch launch data ──────────────────────────────────
  const fetchLaunch = useCallback(async () => {
    try {
      const data = await apiFetch<{ launch: ApiLaunch }>(`/api/launches/${id}`)
      setLaunch(data.launch)
      setNotFound(false)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchLaunch()
  }, [fetchLaunch])

  function openDrawer(activity: ApiActivity) {
    setDrawerActivity({
      title: activity.name,
      type: inferType(activity.name, activity.category || undefined),
      launchName: launch?.name || '',
      id: activity.id,
    })
    setDrawerOpen(true)
  }
  function closeDrawer() { setDrawerOpen(false) }

  // ── Toggle activity completion ─────────────────────────
  async function toggleActivity(activityId: string) {
    if (!launch) return
    const activity = launch.activities.find(a => a.id === activityId)
    if (!activity) return

    // Optimistic update
    const newCompleted = !activity.completed
    setLaunch(prev => {
      if (!prev) return prev
      return {
        ...prev,
        activities: prev.activities.map(a =>
          a.id === activityId ? { ...a, completed: newCompleted } : a
        ),
      }
    })

    try {
      await apiFetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: newCompleted }),
      })
    } catch {
      // Revert on error
      setLaunch(prev => {
        if (!prev) return prev
        return {
          ...prev,
          activities: prev.activities.map(a =>
            a.id === activityId ? { ...a, completed: !newCompleted } : a
          ),
        }
      })
    }
  }

  // ── Remove activity ────────────────────────────────────
  async function removeActivity(activityId: string) {
    if (!launch) return

    // Optimistic remove
    const removed = launch.activities.find(a => a.id === activityId)
    setLaunch(prev => {
      if (!prev) return prev
      return {
        ...prev,
        activities: prev.activities.filter(a => a.id !== activityId),
      }
    })

    try {
      await apiFetch(`/api/activities/${activityId}`, { method: 'DELETE' })
    } catch {
      // Revert on error
      if (removed) {
        setLaunch(prev => {
          if (!prev) return prev
          return {
            ...prev,
            activities: [...prev.activities, removed],
          }
        })
      }
    }
  }

  // ── Add activity ───────────────────────────────────────
  async function addActivity(team: 'education' | 'enablement', category: string, name: string) {
    if (!launch) return
    try {
      await apiFetch('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          launchId: id,
          team,
          category,
          name,
          type: 'other',
        }),
      })
      await fetchLaunch()
    } catch {
      // silently fail
    }
  }

  // ── Delete launch ──────────────────────────────────────
  async function handleDeleteLaunch() {
    try {
      await apiFetch(`/api/launches/${id}`, { method: 'DELETE' })
      router.push('/launches')
    } catch {
      setShowDeleteConfirm(false)
    }
  }

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-slate-500">Loading launch...</span>
        </div>
      </div>
    )
  }

  // ── Not found state ────────────────────────────────────
  if (notFound || !launch) {
    return (
      <div className="p-8 text-center py-20">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Launch not found</h2>
        <p className="text-sm text-slate-500 mb-4">The launch you are looking for does not exist or has been deleted.</p>
        <Link href="/launches" className="text-sm text-teal-600 hover:text-teal-800 font-medium">
          Back to Launches
        </Link>
      </div>
    )
  }

  // ── Computed values ────────────────────────────────────
  const tierLabel = TIER_LABEL[launch.tier] || launch.tier
  const tierColor = TIER_COLOR[launch.tier] || 'bg-slate-100 text-slate-600'
  const statusLabel = STATUS_LABEL[launch.status] || launch.status
  const statusColor = STATUS_COLOR[launch.status] || 'bg-slate-100 text-slate-600'
  const displayDate = formatDate(launch.targetDate)
  const tracks = (launch.tracks || []).map(t => ({ label: t, color: getTrackColor(t) }))

  // Group activities by team then category
  const eduActivities = launch.activities.filter(a => a.team === 'education')
  const enbActivities = launch.activities.filter(a => a.team === 'enablement')

  function groupByCategory(activities: ApiActivity[]): Record<string, ApiActivity[]> {
    const groups: Record<string, ApiActivity[]> = {}
    for (const a of activities) {
      const cat = a.category || 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(a)
    }
    return groups
  }

  const eduGroups = groupByCategory(eduActivities)
  const enbGroups = groupByCategory(enbActivities)

  const eduDone = eduActivities.filter(a => a.completed).length
  const eduTotal = eduActivities.length
  const enbDone = enbActivities.filter(a => a.completed).length
  const enbTotal = enbActivities.length
  const totalDone = eduDone + enbDone
  const totalTotal = eduTotal + enbTotal

  // Objectives data
  const kirkpatrick = launch.kirkpatrick
  const kirkpatrickEntries: [string, string][] = []
  if (kirkpatrick) {
    if (kirkpatrick.l1) kirkpatrickEntries.push(['L1 React.', kirkpatrick.l1])
    if (kirkpatrick.l2) kirkpatrickEntries.push(['L2 Learn.', kirkpatrick.l2])
    if (kirkpatrick.l3) kirkpatrickEntries.push(['L3 Behav.', kirkpatrick.l3])
    if (kirkpatrick.l4) kirkpatrickEntries.push(['L4 Result.', kirkpatrick.l4])
  }

  const hasObjectives = launch.goal || (launch.learningObjectives && launch.learningObjectives.length > 0) || kirkpatrickEntries.length > 0

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link href="/launches" className="hover:text-teal-600">Launches</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-800 font-medium">{launch.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{launch.name}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierColor}`}>{tierLabel}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
            {tracks.map(t => (
              <span key={t.label} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {displayDate && (
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {displayDate}
              </span>
            )}
            {launch.notionBriefUrl && (
              <a href={launch.notionBriefUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:border-teal-400 transition-colors">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Notion Release Brief
              </a>
            )}
            {launch.planningDocUrl && (
              <a href={launch.planningDocUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:border-emerald-400 transition-colors font-medium">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Enablement Plan <span className="font-normal text-emerald-500 ml-0.5">Google Doc</span>
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-6">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:border-teal-400 hover:text-teal-700 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export PDF
            </button>
            {isEditor && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-xs font-medium text-red-600 bg-white border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{totalTotal === 0 ? 0 : Math.round((totalDone / totalTotal) * 100)}%</div>
            <div className="text-sm text-slate-500">{totalDone} of {totalTotal} tasks</div>
          </div>
        </div>
      </div>

      {/* Track guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-xs text-blue-700 leading-relaxed">
        <span className="font-semibold text-blue-800">Track Guidance -- </span>
        <strong>T1:</strong> Don&apos;t skip live practice. Ship async video first as pre-work. --
        <strong>T5:</strong> Terminology cheat sheet is non-negotiable. Monitor Gong for &quot;Sidekick&quot; for 30 days post-launch.
      </div>

      {/* Objectives panel */}
      <div className="bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden">
        <button
          onClick={() => setObjOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-slate-800">Enablement Plan Objectives</span>
            <span className="text-xs text-slate-400 font-normal">Goal -- Learning Objectives -- Measurement</span>
            <Tip text="A quick view of your planning doc's goal and learning objectives -- so you can stay grounded on outcomes while tracking tasks." />
          </div>
          <div className="flex items-center gap-2">
            {launch.planningDocUrl && (
              <a href={launch.planningDocUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Open full doc</a>
            )}
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${objOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        {objOpen && (
          <div className="border-t border-slate-100 px-5 py-4">
            {hasObjectives ? (
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Goal</div>
                  {launch.goal ? (
                    <p className="text-sm text-slate-700 leading-relaxed">{launch.goal}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No goal set yet. Add one in the planning doc.</p>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Learning Objectives</div>
                  {launch.learningObjectives && launch.learningObjectives.length > 0 ? (
                    <ol className="text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
                      {launch.learningObjectives.map((obj, i) => (
                        <li key={i} className="leading-snug">{obj}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No learning objectives defined yet.</p>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">How We&apos;ll Measure</div>
                  {kirkpatrickEntries.length > 0 ? (
                    <div className="space-y-1.5 text-xs">
                      {kirkpatrickEntries.map(([k, v]) => (
                        <div key={k} className="flex items-start gap-2">
                          <span className="font-semibold text-slate-500 w-16 flex-shrink-0">{k}</span>
                          <span className="text-slate-600">{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No measurement criteria defined yet.</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Sessions tracked here in the Hub -- Strategy in the doc
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No objectives configured yet. Add goal, learning objectives, and measurement criteria in the planning doc.</p>
            )}
          </div>
        )}
      </div>

      {/* Two-col checklist */}
      <div className="grid grid-cols-2 gap-6">
        {/* EDUCATION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900">Education</h2>
              <Tip text="Education tracks what the Education team needs to create or update -- external docs, media, learning events, and technical content." />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{eduDone} / {eduTotal}</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(eduGroups).map(([cat, items]) => (
              <div key={cat}>
                <SectionLabel label={cat} />
                {items.map(a => (
                  <ActivityRow
                    key={a.id}
                    activity={a}
                    isEditor={isEditor}
                    onToggle={() => toggleActivity(a.id)}
                    onRemove={() => removeActivity(a.id)}
                    onOpen={() => openDrawer(a)}
                  />
                ))}
                {isEditor && (
                  <AddActivityInput
                    placeholder="Add education activity"
                    onSubmit={(name) => addActivity('education', cat, name)}
                  />
                )}
              </div>
            ))}
            {Object.keys(eduGroups).length === 0 && isEditor && (
              <AddActivityInput
                placeholder="Add education activity"
                onSubmit={(name) => addActivity('education', 'General', name)}
              />
            )}
          </div>
        </div>

        {/* ENABLEMENT */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900">Revenue Enablement</h2>
              <Tip text="Revenue Enablement tracks what the enablement team builds -- live sessions, assets, and reinforcement tools. Live sessions sync to the calendar." />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{enbDone} / {enbTotal}</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(enbGroups).map(([cat, items]) => (
              <div key={cat}>
                <SectionLabel
                  label={cat}
                  badge={cat.toLowerCase().includes('live') ? (
                    <span className="text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      syncs to calendar
                    </span>
                  ) : undefined}
                  tip={cat.toLowerCase().includes('live') ? 'These are sessions other teams need to attend. They appear on the calendar and will eventually sync to Google Calendar.' : undefined}
                />
                {items.map(a => (
                  <ActivityRow
                    key={a.id}
                    activity={a}
                    isLive={cat.toLowerCase().includes('live')}
                    isEditor={isEditor}
                    onToggle={() => toggleActivity(a.id)}
                    onRemove={() => removeActivity(a.id)}
                    onOpen={() => openDrawer(a)}
                  />
                ))}
                {isEditor && (
                  <AddActivityInput
                    placeholder={cat.toLowerCase().includes('live') ? 'Add live session' : 'Add asset or activity'}
                    onSubmit={(name) => addActivity('enablement', cat, name)}
                  />
                )}
              </div>
            ))}
            {Object.keys(enbGroups).length === 0 && isEditor && (
              <AddActivityInput
                placeholder="Add asset or activity"
                onSubmit={(name) => addActivity('enablement', 'General', name)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Cross-functional */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-semibold text-amber-900 mb-3 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          What We Need From Others
          <Tip text="These dependencies are auto-populated from the programming track. Send requests to these teams early -- don't wait until build week." />
        </h3>
        <div className="grid grid-cols-3 gap-5 text-xs">
          <div><div className="font-semibold text-amber-800 mb-1">Product</div><div className="text-amber-700">Sandbox ready 1 week before training. SME for live Q&amp;A. Early feature access.</div></div>
          <div><div className="font-semibold text-amber-800 mb-1">PMM</div><div className="text-amber-700">Positioning doc + messaging framework 2 weeks out. Competitive brief vs. Sierra/Gorgias AI.</div></div>
          <div><div className="font-semibold text-amber-800 mb-1">Sales Leadership</div><div className="text-amber-700">Manager attendance at ILT. Reinforce in 1:1s for 4 weeks. Pipeline targets set.</div></div>
        </div>
      </div>

      <ActivityDrawer isOpen={drawerOpen} onClose={closeDrawer} activity={drawerActivity} />

      {showDeleteConfirm && (
        <ConfirmDialog
          title={`Delete ${launch.name}?`}
          description="This will remove the launch and all its activities. This cannot be undone."
          onConfirm={handleDeleteLaunch}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
