'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ActivityDrawer, type ActivityType, type DrawerActivity } from '@/components/activity-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'

function inferRequestType(name: string, typeLabel: string): ActivityType {
  const t = typeLabel.toLowerCase()
  if (t === 'live') return 'live'
  if (t === 'async') return 'async'
  if (t === 'asset') return 'asset'
  const lower = name.toLowerCase()
  if (lower.includes('live') || lower.includes('session') || lower.includes('training')) return 'live'
  if (lower.includes('async') || lower.includes('recording') || lower.includes('video')) return 'async'
  return 'other'
}

const ACTIVITIES = [
  { id: 'a1', name: 'Roadmap Training — Live Session', type: 'Live', typeColor: 'bg-rose-100 text-rose-700', owner: 'Gina Vivar', scheduled: 'Apr 15 · 10am PST', assetUrl: '#', done: true },
  { id: 'a2', name: 'Async Recording + Summary', type: 'Async', typeColor: 'bg-blue-100 text-blue-700', owner: 'Gerard Urbano', dueDate: 'Apr 18', done: false },
  { id: 'a3', name: '"What to say / not say" cheat sheet', type: 'Asset', typeColor: 'bg-slate-100 text-slate-600', owner: 'Christian Shockley', dueDate: 'Apr 20', done: false },
]

export default function RequestDetailPage() {
  const { isEditor } = useAuth()
  const router = useRouter()
  const [drawerActivity, setDrawerActivity] = useState<DrawerActivity | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activities, setActivities] = useState(ACTIVITIES)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  function openDrawer(name: string, typeLabel: string) {
    setDrawerActivity({ title: name, type: inferRequestType(name, typeLabel), launchName: 'Roadmap Knowledge Gap Training' })
    setDrawerOpen(true)
  }
  function closeDrawer() { setDrawerOpen(false) }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link href="/requests" className="hover:text-teal-600">Requests</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-800 font-medium">Roadmap Knowledge Gap Training</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Roadmap Knowledge Gap Training</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">In Progress</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Live</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>All AEs</span><span>·</span><span>Owner: Gina Vivar</span><span>·</span><span>Due Apr 22, 2026</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <a href="#" className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:border-emerald-400 transition-colors font-medium">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Planning Doc ↗ <span className="font-normal text-emerald-500">Google Doc</span>
            </a>
            {isEditor && (
              <button className="flex items-center gap-1.5 text-xs text-slate-400 border border-dashed border-slate-200 px-2.5 py-1 rounded-lg hover:border-slate-300">+ Link doc</button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:border-teal-400 hover:text-teal-700 transition-colors shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export PDF
          </button>
          {isEditor && (
            <>
              <button className="text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-xs font-medium text-red-600 bg-white border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Background</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          AE team is entering Q2 QBR season and leaders flagged a gap: reps can't speak confidently to what's coming in H2 without over-promising. Request for a training session covering roadmap context, what to say vs. not say, and how to use roadmap as a proof point in late-stage deals.
        </p>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
          <span>Requested by Jake Morrison (AE Manager)</span>
          <span>·</span>
          <span>via Slack</span>
          <span>·</span>
          <span>Apr 3, 2026</span>
        </div>
      </div>

      {/* Activities */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Activities</h2>
          {isEditor && (
            <button className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add activity
            </button>
          )}
        </div>
        <div className="space-y-2">
          {activities.map(a => (
            <div key={a.id} className="group flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => openDrawer(a.name, a.type)}>
              <input type="checkbox" defaultChecked={a.done} disabled={!isEditor} onClick={e => e.stopPropagation()} className="w-4 h-4 accent-teal-600 flex-shrink-0 disabled:opacity-40" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${a.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{a.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.typeColor}`}>{a.type}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                  <span>{a.owner}</span>
                  {a.scheduled && <><span>·</span><span className="text-teal-600 font-medium">{a.scheduled}</span></>}
                  {a.dueDate && <><span>·</span><span>Due {a.dueDate}</span></>}
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
                  <button onClick={e => { e.stopPropagation(); setActivities(prev => prev.filter(x => x.id !== a.id)); setConfirmRemoveId(null) }} className="text-xs text-red-600 font-semibold hover:text-red-800 flex-shrink-0">
                    Confirm?
                  </button>
                ) : (
                  <button onClick={e => { e.stopPropagation(); setConfirmRemoveId(a.id); setTimeout(() => setConfirmRemoveId(null), 3000) }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Notes</h2>
        <textarea
          rows={3}
          disabled={!isEditor}
          defaultValue="Coordinate with Product for what can be shared externally. Keep roadmap specifics vague — focus on themes and timing ranges, not hard dates."
          className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      <ActivityDrawer isOpen={drawerOpen} onClose={closeDrawer} activity={drawerActivity} />

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Roadmap Knowledge Gap Training?"
          description="This will remove the request and all its activities. This cannot be undone."
          onConfirm={() => { setShowDeleteConfirm(false); router.push('/requests') }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
