'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { KebabMenu } from '@/components/kebab-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'

// ── Size → Tier mapping (for Notion import) ────────────────
const SIZE_TO_TIER: Record<string, string> = {
  'Small': 'Small',
  'Medium': 'Medium',
  'Large': 'Large / XL',
  'XL': 'Large / XL',
  'Large / XL': 'Large / XL',
}

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

// Size display → DB tier enum (used in launch cards)
const SIZE_DISPLAY: Record<string, string> = {
  'small': 'Small',
  'medium': 'Medium',
  'large_xl': 'Large / XL',
}

// Track label → color
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

// ── Types ──────────────────────────────────────────────────
interface ApiActivity {
  id: string
  team: string
  completed: boolean
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
  kirkpatrick: Record<string, string> | null
  tracks: string[]
  activities: ApiActivity[]
}

const FILTERS = ['All', 'In Progress', 'Planning', 'Shipped']
const FILTER_TO_STATUS: Record<string, string> = {
  'In Progress': 'in_progress',
  'Planning': 'planning',
  'Shipped': 'shipped',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function LaunchesPage() {
  const { isEditor } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState('All')
  const [launches, setLaunches] = useState<ApiLaunch[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const launchToDelete = launches.find(l => l.id === deleteTarget)

  // ── New Launch form state ──────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSize, setFormSize] = useState('')
  const [formTracks, setFormTracks] = useState<string[]>([])
  const [formTargetDate, setFormTargetDate] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formNotionUrl, setFormNotionUrl] = useState('')
  const [formPlanningDocUrl, setFormPlanningDocUrl] = useState('')
  const [creating, setCreating] = useState(false)

  // Notion import state — disabled for now, kept for re-enable
  // const [notionInput, setNotionInput] = useState('')
  // const [notionLoading, setNotionLoading] = useState(false)
  // const [notionError, setNotionError] = useState('')
  // const [notionImported, setNotionImported] = useState(false)

  // ── Fetch launches ─────────────────────────────────────
  const fetchLaunches = useCallback(async () => {
    try {
      const data = await apiFetch<{ launches: ApiLaunch[] }>('/api/launches')
      setLaunches(data.launches)
    } catch {
      // silently fail — launches stays empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLaunches()
  }, [fetchLaunches])

  function resetForm() {
    setFormName(''); setFormSize(''); setFormTracks([]); setFormTargetDate(''); setFormDescription('')
    setFormNotionUrl(''); setFormPlanningDocUrl('')
    // setNotionInput(''); setNotionError(''); setNotionImported(false)
  }

  function openModal() { resetForm(); setShowModal(true) }
  function closeModal() { setShowModal(false); resetForm() }

  // Notion import — disabled for now, kept for re-enable
  // async function handleNotionImport() { ... }

  const SIZE_TO_DB: Record<string, string> = { 'Small': 'small', 'Medium': 'medium', 'Large': 'large_xl', 'XL': 'large_xl' }

  async function handleCreateLaunch() {
    if (!formName.trim() || !formSize) return
    setCreating(true)
    try {
      const body: Record<string, unknown> = {
        name: formName.trim(),
        tier: SIZE_TO_DB[formSize] || 'medium',
      }
      if (formDescription.trim()) body.description = formDescription.trim()
      if (formTargetDate) body.targetDate = formTargetDate
      if (formNotionUrl.trim()) body.notionBriefUrl = formNotionUrl.trim()
      if (formPlanningDocUrl.trim()) body.planningDocUrl = formPlanningDocUrl.trim()
      if (formTracks.length > 0) body.tracks = formTracks

      await apiFetch('/api/launches', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      closeModal()
      await fetchLaunches()
    } catch {
      // could show error — for now silently fail
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/launches/${id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await fetchLaunches()
    } catch {
      // silently fail
    }
  }

  // ── Derived data ───────────────────────────────────────
  const filtered = filter === 'All'
    ? launches
    : launches.filter(l => l.status === FILTER_TO_STATUS[filter])

  const pct = (done: number, total: number) => total === 0 ? 0 : Math.round((done / total) * 100)

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-slate-500">Loading launches...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Launches</h1>
          <p className="text-slate-500 text-sm mt-1">Track education + enablement activity tied to product launches</p>
        </div>
        {isEditor && (
          <button
            onClick={openModal}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Launch
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 w-fit border border-slate-200 shadow-sm">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              filter === f ? 'bg-slate-900 text-white font-medium' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── New Launch Modal ──────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New Launch</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Notion import — disabled, re-enable when integration is configured */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 opacity-60">
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 font-medium py-2 cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.58 2.29c-.42-.326-.98-.7-2.055-.607L3.48 2.84c-.467.047-.56.28-.374.466l1.353 1.062zm.793 2.195v13.895c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V5.45c0-.606-.233-.933-.747-.886l-15.177.84c-.56.047-.746.327-.746.886zm14.337.746c.093.42 0 .84-.42.887l-.7.14v10.264c-.607.327-1.167.514-1.634.514-.746 0-.933-.234-1.493-.933l-4.574-7.186v6.952l1.447.327s0 .84-1.167.84l-3.22.187c-.093-.187 0-.653.327-.747l.84-.233V8.822L7.293 8.73c-.093-.42.14-1.027.793-1.073l3.454-.234 4.76 7.28v-6.44l-1.214-.14c-.093-.513.28-.886.747-.933l3.22-.187z" /></svg>
                  Import from Notion — coming soon
                </button>
              </div>

              {/* Launch name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Launch Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g., Gladly AI v2 Launch"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Size + Target Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Size *</label>
                  <select
                    value={formSize}
                    onChange={e => setFormSize(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  >
                    <option value="">Select size...</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="XL">XL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">GA Date</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={e => setFormTargetDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Programming Tracks */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Programming Tracks</label>
                <p className="text-xs text-slate-400 mb-3">Select the tracks that apply. This determines the default checklist template.</p>
                <div className="space-y-2">
                  {[
                    { code: 'T1', label: 'T1 · Pipeline Driver', desc: 'Drives pipeline — teams need to pitch + demo' },
                    { code: 'T2', label: 'T2 · Retention Play', desc: 'Helps CSMs and SAMs expand or protect accounts' },
                    { code: 'T3', label: 'T3 · Efficiency Gain', desc: 'Makes reps faster — workflow, tooling, or process' },
                    { code: 'T4', label: 'T4 · Education / Awareness', desc: 'Builds knowledge — not directly tied to a deal motion' },
                    { code: 'T5', label: 'T5 · Retire + Replace', desc: 'Something going away — change management needed' },
                    { code: 'T6', label: 'T6 · Partner / Migration', desc: 'Partnership or competitive displacement play' },
                    { code: 'Custom', label: 'Custom / Doesn\'t fit a track', desc: 'Start with a blank checklist' },
                  ].map(track => {
                    const selected = formTracks.includes(track.code)
                    return (
                      <button
                        key={track.code}
                        type="button"
                        onClick={() => setFormTracks(prev =>
                          prev.includes(track.code) ? prev.filter(t => t !== track.code) : [...prev, track.code]
                        )}
                        className={`w-full text-left rounded-lg border p-3 transition-all flex items-start gap-3 ${
                          selected
                            ? 'border-teal-400 bg-teal-50/50 ring-1 ring-teal-400/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                        }`}>
                          {selected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${selected ? 'text-teal-800' : 'text-slate-700'}`}>{track.label}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{track.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="What is this launch about?"
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notion Brief URL</label>
                  <input
                    type="text"
                    value={formNotionUrl}
                    onChange={e => setFormNotionUrl(e.target.value)}
                    placeholder="https://notion.so/..."
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Planning Doc URL</label>
                  <input
                    type="text"
                    value={formPlanningDocUrl}
                    onChange={e => setFormPlanningDocUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button onClick={closeModal} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleCreateLaunch}
                disabled={!formName.trim() || !formSize || creating}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {creating ? 'Creating...' : 'Create Launch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {launches.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-slate-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No launches yet</h3>
          <p className="text-sm text-slate-500">Create your first launch to get started.</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map(launch => {
          const totalTasks = launch.activities.length
          const completedTasks = launch.activities.filter(a => a.completed).length
          const eduActivities = launch.activities.filter(a => a.team === 'education')
          const enbActivities = launch.activities.filter(a => a.team === 'enablement')
          const eduTotal = eduActivities.length
          const eduDone = eduActivities.filter(a => a.completed).length
          const enbTotal = enbActivities.length
          const enbDone = enbActivities.filter(a => a.completed).length
          const tierLabel = TIER_LABEL[launch.tier] || launch.tier
          const tierColor = TIER_COLOR[launch.tier] || 'bg-slate-100 text-slate-600'
          const statusLabel = STATUS_LABEL[launch.status] || launch.status
          const statusColor = STATUS_COLOR[launch.status] || 'bg-slate-100 text-slate-600'
          const displayDate = formatDate(launch.targetDate)
          const tracks = (launch.tracks || []).map(t => ({
            label: t,
            color: getTrackColor(t),
          }))

          return (
            <div key={launch.id} className="relative">
              <Link
                href={`/launches/${launch.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 text-base">{launch.name}</h3>
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${tierColor}`}>{tierLabel}</span>
                      {tracks.map(t => (
                        <span key={t.label} className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
                      ))}
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                    </div>
                    {launch.description && <p className="text-slate-500 text-sm mb-3">{launch.description}</p>}
                    <div className="flex items-center gap-3 flex-wrap">
                      {launch.notionBriefUrl && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Notion Release Brief
                        </span>
                      )}
                      {launch.planningDocUrl && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium">
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Enablement Plan
                        </span>
                      )}
                      {!launch.notionBriefUrl && isEditor && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 border border-dashed border-slate-200 px-2.5 py-1 rounded-lg">
                          + Link Release Brief
                        </span>
                      )}
                      {displayDate && <span className="text-xs text-slate-400">Target: {displayDate}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-slate-900">{pct(completedTasks, totalTasks)}%</div>
                    <div className="text-xs text-slate-500 mb-2">{completedTasks} / {totalTasks} tasks</div>
                    <div className="w-32 bg-slate-100 rounded-full h-2">
                      <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${pct(completedTasks, totalTasks)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Education</span>
                      <span>{eduDone} / {eduTotal}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${pct(eduDone, eduTotal)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Rev Enablement</span>
                      <span>{enbDone} / {enbTotal}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${pct(enbDone, enbTotal)}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
              {isEditor && (
                <div className="absolute top-4 right-4 z-10">
                  <KebabMenu items={[
                    { label: 'Edit', onClick: () => router.push(`/launches/${launch.id}`) },
                    { label: 'Export PDF', onClick: () => window.print() },
                    { label: 'Delete', variant: 'danger', onClick: () => setDeleteTarget(launch.id) },
                  ]} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {deleteTarget && launchToDelete && (
        <ConfirmDialog
          title={`Delete ${launchToDelete.name}?`}
          description="This cannot be undone."
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
