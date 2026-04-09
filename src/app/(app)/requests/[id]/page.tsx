'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { ActivityDrawer, type ActivityType, type DrawerActivity } from '@/components/activity-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'

// ── Types ─────────────────────────────────────────────────────────────

interface Activity {
  id: string
  requestId: string | null
  launchId: string | null
  team: string
  category: string | null
  name: string
  type: 'live_session' | 'async' | 'asset' | 'assessment' | 'comms' | 'other'
  owner: string | null
  dueDate: string | null
  scheduledDate: string | null
  assetUrl: string | null
  completed: boolean
  sortOrder: number
  googleMeetLink: string | null
  recordingLink: string | null
  audiences: string[] | null
  duration: string | null
  notes: string | null
  format: string | null
  slideDeckLink: string | null
  assetStatus: string | null
  assessmentType: string | null
  passThreshold: string | null
  kirkpatrickLevel: string | null
  commsType: string | null
  otherDescription: string | null
  createdAt: string
}

interface RequestDetail {
  id: string
  title: string
  description: string | null
  audience: string | null
  owner: string | null
  status: 'planning' | 'in_progress' | 'done' | 'archived'
  type: 'live_session' | 'async' | 'asset' | 'assessment' | 'comms' | 'other' | null
  dueDate: string | null
  planningDocUrl: string | null
  requestedBy: string | null
  requestSource: string | null
  aiScanNotes: string | null
  createdAt: string
  updatedAt: string
  activities: Activity[]
}

// ── Helpers ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  planning:    { label: 'Planning',    className: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-700' },
  done:        { label: 'Done',        className: 'bg-green-100 text-green-700' },
  archived:    { label: 'Archived',    className: 'bg-slate-100 text-slate-500' },
}

const TYPE_MAP: Record<string, { label: string; className: string }> = {
  live_session: { label: 'Live',       className: 'bg-blue-100 text-blue-700' },
  async:        { label: 'Async',      className: 'bg-teal-100 text-teal-700' },
  asset:        { label: 'Asset',      className: 'bg-amber-100 text-amber-700' },
  assessment:   { label: 'Assessment', className: 'bg-violet-100 text-violet-700' },
  comms:        { label: 'Comms',      className: 'bg-emerald-100 text-emerald-700' },
  other:        { label: 'Other',      className: 'bg-slate-100 text-slate-600' },
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function inferDrawerType(dbType: string): ActivityType {
  if (dbType === 'live_session') return 'live'
  if (dbType === 'async') return 'async'
  if (dbType === 'asset') return 'asset'
  if (dbType === 'assessment') return 'assessment'
  if (dbType === 'comms') return 'comms'
  return 'other'
}

// ── Component ─────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const { isEditor } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // Data
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Notes
  const [notes, setNotes] = useState('')

  // Drawer
  const [drawerActivity, setDrawerActivity] = useState<DrawerActivity | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Activity remove (2-click)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  // Add activity inline
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newActivityName, setNewActivityName] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)

  // ── Fetch request ───────────────────────────────────────────────────

  const fetchRequest = useCallback(async () => {
    try {
      const data = await apiFetch<{ request: RequestDetail }>(`/api/requests/${id}`)
      setRequest(data.request)
      setNotes(data.request.description || '')
      setNotFound(false)
    } catch (err) {
      if (err instanceof Error && err.message === 'Not Found') {
        setNotFound(true)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchRequest() }, [fetchRequest])

  // ── Activity toggle ─────────────────────────────────────────────────

  async function handleToggleActivity(activityId: string, currentCompleted: boolean) {
    // Optimistic update
    setRequest(prev => {
      if (!prev) return prev
      return {
        ...prev,
        activities: prev.activities.map(a =>
          a.id === activityId ? { ...a, completed: !currentCompleted } : a
        ),
      }
    })
    try {
      await apiFetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !currentCompleted }),
      })
    } catch {
      // Revert on error
      setRequest(prev => {
        if (!prev) return prev
        return {
          ...prev,
          activities: prev.activities.map(a =>
            a.id === activityId ? { ...a, completed: currentCompleted } : a
          ),
        }
      })
    }
  }

  // ── Activity remove ─────────────────────────────────────────────────

  async function handleRemoveActivity(activityId: string) {
    try {
      await apiFetch(`/api/activities/${activityId}`, { method: 'DELETE' })
      setRequest(prev => {
        if (!prev) return prev
        return { ...prev, activities: prev.activities.filter(a => a.id !== activityId) }
      })
      setConfirmRemoveId(null)
    } catch {
      // silently handled
    }
  }

  // ── Add activity ────────────────────────────────────────────────────

  async function handleAddActivity() {
    if (!newActivityName.trim()) return
    setAddingSaving(true)
    try {
      await apiFetch('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          requestId: id,
          name: newActivityName.trim(),
          team: 'enablement',
          type: 'other',
        }),
      })
      setNewActivityName('')
      setShowAddActivity(false)
      await fetchRequest()
    } catch {
      // silently handled
    } finally {
      setAddingSaving(false)
    }
  }

  // ── Save notes on blur ──────────────────────────────────────────────

  async function handleNotesSave() {
    if (!request) return
    if (notes === (request.description || '')) return
    try {
      await apiFetch(`/api/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: notes }),
      })
    } catch {
      // silently handled
    }
  }

  // ── Delete request ──────────────────────────────────────────────────

  async function handleDeleteRequest() {
    try {
      await apiFetch(`/api/requests/${id}`, { method: 'DELETE' })
      router.push('/requests')
    } catch {
      setShowDeleteConfirm(false)
    }
  }

  // ── Drawer ──────────────────────────────────────────────────────────

  function openDrawer(activity: Activity) {
    setDrawerActivity({
      title: activity.name,
      type: inferDrawerType(activity.type),
      launchName: request?.title || '',
    })
    setDrawerOpen(true)
  }

  function closeDrawer() { setDrawerOpen(false) }

  // ── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </div>
    )
  }

  if (notFound || !request) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <p className="text-slate-500 text-sm font-medium">Request not found</p>
          <Link href="/requests" className="mt-3 inline-block text-sm text-teal-600 hover:text-teal-800 font-medium">
            Back to Requests
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[request.status] || STATUS_MAP.planning
  const typeInfo = request.type ? TYPE_MAP[request.type] : null

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link href="/requests" className="hover:text-teal-600">Requests</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-800 font-medium">{request.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{request.title}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.className}`}>{statusInfo.label}</span>
            {typeInfo && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.className}`}>{typeInfo.label}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {request.audience && <span>{request.audience}</span>}
            {request.audience && request.owner && <span>&middot;</span>}
            {request.owner && <span>Owner: {request.owner}</span>}
            {(request.audience || request.owner) && request.dueDate && <span>&middot;</span>}
            {request.dueDate && <span>Due {formatDate(request.dueDate)}</span>}
          </div>
          <div className="flex items-center gap-2 mt-3">
            {request.planningDocUrl && (
              <a href={request.planningDocUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:border-emerald-400 transition-colors font-medium">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Planning Doc
              </a>
            )}
          </div>
        </div>
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
      </div>

      {/* Background / Description */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Background</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {request.description || 'No description provided.'}
        </p>
        {(request.requestedBy || request.requestSource || request.createdAt) && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            {request.requestedBy && <span>Requested by {request.requestedBy}</span>}
            {request.requestedBy && request.requestSource && <span>&middot;</span>}
            {request.requestSource && <span>via {request.requestSource}</span>}
            {(request.requestedBy || request.requestSource) && request.createdAt && <span>&middot;</span>}
            {request.createdAt && <span>{formatDate(request.createdAt)}</span>}
          </div>
        )}
      </div>

      {/* Activities */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Activities</h2>
          {isEditor && (
            <button
              onClick={() => setShowAddActivity(true)}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add activity
            </button>
          )}
        </div>

        {/* Inline add activity */}
        {showAddActivity && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newActivityName}
              onChange={e => setNewActivityName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); if (e.key === 'Escape') { setShowAddActivity(false); setNewActivityName('') } }}
              placeholder="Activity name..."
              autoFocus
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              onClick={handleAddActivity}
              disabled={!newActivityName.trim() || addingSaving}
              className="text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-lg disabled:opacity-50"
            >
              {addingSaving ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => { setShowAddActivity(false); setNewActivityName('') }}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="space-y-2">
          {request.activities.length === 0 && !showAddActivity && (
            <p className="text-sm text-slate-400 py-4 text-center">No activities yet</p>
          )}
          {request.activities.map(a => {
            const actTypeInfo = TYPE_MAP[a.type] || TYPE_MAP.other

            return (
              <div
                key={a.id}
                className="group flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
                onClick={() => openDrawer(a)}
              >
                <input
                  type="checkbox"
                  checked={a.completed}
                  disabled={!isEditor}
                  onClick={e => { e.stopPropagation(); handleToggleActivity(a.id, a.completed) }}
                  onChange={() => {}}
                  className="w-4 h-4 accent-teal-600 flex-shrink-0 disabled:opacity-40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${a.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{a.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actTypeInfo.className}`}>{actTypeInfo.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                    {a.owner && <span>{a.owner}</span>}
                    {a.scheduledDate && (
                      <>
                        <span>&middot;</span>
                        <span className="text-teal-600 font-medium">{formatDate(a.scheduledDate)}</span>
                      </>
                    )}
                    {a.dueDate && (
                      <>
                        <span>&middot;</span>
                        <span>Due {formatDate(a.dueDate)}</span>
                      </>
                    )}
                    {a.assetUrl && (
                      <a href={a.assetUrl} onClick={e => e.stopPropagation()} className="text-teal-500 hover:text-teal-700 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        View asset
                      </a>
                    )}
                  </div>
                </div>
                {isEditor && (
                  confirmRemoveId === a.id ? (
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveActivity(a.id) }}
                      className="text-xs text-red-600 font-semibold hover:text-red-800 flex-shrink-0"
                    >
                      Confirm?
                    </button>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmRemoveId(a.id); setTimeout(() => setConfirmRemoveId(null), 3000) }}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Notes</h2>
        <textarea
          rows={3}
          disabled={!isEditor}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={handleNotesSave}
          className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      <ActivityDrawer isOpen={drawerOpen} onClose={closeDrawer} activity={drawerActivity} />

      {showDeleteConfirm && (
        <ConfirmDialog
          title={`Delete ${request.title}?`}
          description="This will remove the request and all its activities. This cannot be undone."
          onConfirm={handleDeleteRequest}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
