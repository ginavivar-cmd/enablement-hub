'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { ActivityDrawer, type ActivityType, type DrawerActivity } from '@/components/activity-drawer'

// ── Types ────────────────────────────────────────────────
type Activity = {
  id: string; name: string; owner: string; dueDate?: string
  scheduledTime?: string; assetUrl?: string; done: boolean; needsSchedule?: boolean
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
  activity: Activity; isLive?: boolean; isEditor: boolean
  onToggle: () => void; onRemove: () => void; onOpen?: () => void
}) {
  return (
    <div
      className={`group rounded-lg border p-3 transition-colors cursor-pointer ${isLive ? 'border-rose-200 bg-white' : 'border-slate-200 bg-white'} hover:bg-slate-50`}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={activity.done}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          disabled={!isEditor}
          className="mt-0.5 w-4 h-4 accent-teal-600 cursor-pointer flex-shrink-0 disabled:opacity-40"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-medium ${activity.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {activity.name}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {activity.scheduledTime && (
                <span className="text-xs bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full">{activity.scheduledTime}</span>
              )}
              {activity.needsSchedule && isEditor && (
                <button className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Schedule
                </button>
              )}
              {activity.assetUrl && (
                <a href={activity.assetUrl} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
              {isEditor && (
                <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          {!activity.done && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {activity.owner && <span className="text-xs text-slate-400">{activity.owner}</span>}
              {activity.dueDate && <span className="text-xs text-slate-400">· {activity.dueDate}</span>}
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

// ── Main page ─────────────────────────────────────────────
export default function LaunchDetailPage() {
  const { isEditor } = useAuth()
  const [objOpen, setObjOpen] = useState(false)
  const [drawerActivity, setDrawerActivity] = useState<DrawerActivity | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function openDrawer(name: string, category?: string) {
    setDrawerActivity({ title: name, type: inferType(name, category), launchName: 'Gladly AI Launch' })
    setDrawerOpen(true)
  }
  function closeDrawer() { setDrawerOpen(false) }

  const [eduItems, setEduItems] = useState<Record<string, Activity[]>>({
    'Customer Education — External': [
      { id: 'e1', name: 'Help Docs', owner: 'Emily', dueDate: 'Apr 10', done: true, assetUrl: '#' },
      { id: 'e2', name: 'In-App Notification', owner: 'Emily', dueDate: 'Apr 15', done: true },
      { id: 'e3', name: 'Implementation Docs', owner: 'Emily', dueDate: 'Apr 22', done: false },
      { id: 'e4', name: 'Email Announcement', owner: 'Emily', dueDate: 'Apr 25', done: false },
    ],
    'Media': [
      { id: 'e5', name: 'Video', owner: 'Emily', dueDate: 'Apr 8', done: true, assetUrl: '#' },
      { id: 'e6', name: 'One Pager', owner: 'Emily', dueDate: 'Apr 9', done: true },
    ],
    'Learning Events': [
      { id: 'e7', name: 'Feature Enablement Webinar', owner: 'Emily', dueDate: 'Apr 29', done: false },
    ],
  })

  const [enbItems, setEnbItems] = useState<Record<string, Activity[]>>({
    'Live Sessions': [
      { id: 'n1', name: 'Live ILT: Positioning + Pitch', owner: 'Gina', scheduledTime: 'Apr 26 · 10am', done: true },
      { id: 'n2', name: 'Live ILT: Demo Workshop', owner: 'Christian', scheduledTime: 'Apr 27 · 10am', done: true },
      { id: 'n3', name: 'Role-Play Drill', owner: 'Gina', dueDate: 'May 2', done: false, needsSchedule: true },
    ],
    'Assets': [
      { id: 'n4', name: 'One-Pager / Battlecard', owner: 'Christian', dueDate: 'Apr 10', done: true, assetUrl: '#' },
      { id: 'n5', name: 'Async Video: Product Overview', owner: 'Gerard', dueDate: 'Apr 18', done: false },
    ],
    'Retire + Replace (T5)': [
      { id: 'n6', name: 'Terminology Cheat Sheet', owner: 'Gina', dueDate: 'Apr 8', done: true },
      { id: 'n7', name: 'Slack Drip Campaign', owner: 'Gina', dueDate: 'Apr 28', done: false },
    ],
  })

  function toggleEdu(cat: string, id: string) {
    setEduItems(prev => ({
      ...prev,
      [cat]: prev[cat].map(a => a.id === id ? { ...a, done: !a.done } : a)
    }))
  }
  function removeEdu(cat: string, id: string) {
    setEduItems(prev => ({ ...prev, [cat]: prev[cat].filter(a => a.id !== id) }))
  }
  function toggleEnb(cat: string, id: string) {
    setEnbItems(prev => ({
      ...prev,
      [cat]: prev[cat].map(a => a.id === id ? { ...a, done: !a.done } : a)
    }))
  }
  function removeEnb(cat: string, id: string) {
    setEnbItems(prev => ({ ...prev, [cat]: prev[cat].filter(a => a.id !== id) }))
  }

  const eduDone = Object.values(eduItems).flat().filter(a => a.done).length
  const eduTotal = Object.values(eduItems).flat().length
  const enbDone = Object.values(enbItems).flat().filter(a => a.done).length
  const enbTotal = Object.values(enbItems).flat().length
  const totalDone = eduDone + enbDone
  const totalTotal = eduTotal + enbTotal

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link href="/launches" className="hover:text-teal-600">Launches</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-800 font-medium">Gladly AI Launch</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Gladly AI Launch</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Large / XL</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">In Progress</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">T1 Pipeline Driver</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">T5 Retire + Replace</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Apr 30, 2026
            </span>
            <a href="#" className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:border-teal-400 transition-colors">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Notion Release Brief ↗
            </a>
            <a href="#" className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:border-emerald-400 transition-colors font-medium">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Enablement Plan ↗ <span className="font-normal text-emerald-500 ml-0.5">Google Doc</span>
            </a>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-6">
          <button className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:border-teal-400 hover:text-teal-700 transition-colors shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export PDF
          </button>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{Math.round((totalDone / totalTotal) * 100)}%</div>
            <div className="text-sm text-slate-500">{totalDone} of {totalTotal} tasks</div>
          </div>
        </div>
      </div>

      {/* Track guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-xs text-blue-700 leading-relaxed">
        <span className="font-semibold text-blue-800">📋 Track Guidance — </span>
        <strong>T1:</strong> Don't skip live practice. Ship async video first as pre-work. ·
        <strong>T5:</strong> Terminology cheat sheet is non-negotiable. Monitor Gong for "Sidekick" for 30 days post-launch.
      </div>

      {/* Objectives panel */}
      <div className="bg-white border border-slate-200 rounded-xl mb-6 overflow-hidden">
        <button
          onClick={() => setObjOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-slate-800">🎯 Enablement Plan Objectives</span>
            <span className="text-xs text-slate-400 font-normal">Goal · Learning Objectives · Measurement</span>
            <Tip text="A quick view of your planning doc's goal and learning objectives — so you can stay grounded on outcomes while tracking tasks." />
          </div>
          <div className="flex items-center gap-2">
            <a href="#" onClick={e => e.stopPropagation()} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Open full doc ↗</a>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${objOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        {objOpen && (
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Goal</div>
                <p className="text-sm text-slate-700 leading-relaxed">Field can confidently position Gladly AI vs. Sidekick, handle "why AI now?" objections, and demo key moments without assistance — tied to Q2 pipeline conversion targets.</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Learning Objectives</div>
                <ol className="text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
                  <li className="leading-snug">Articulate the 3 core Gladly AI differentiators in a discovery call.</li>
                  <li className="leading-snug">Demo the AI moment without coaching in a live role-play.</li>
                  <li className="leading-snug">Handle "we already use Sidekick" objection using the migration frame.</li>
                </ol>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">How We'll Measure</div>
                <div className="space-y-1.5 text-xs">
                  {[['L1 React.', 'Post-session survey + attendance rate'], ['L2 Learn.', 'Role-play certification + knowledge check'], ['L3 Behav.', 'Gong review — Sidekick mentions 30 days out'], ['L4 Result.', 'Pipeline conversion + win rate vs. Gorgias']].map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2">
                      <span className="font-semibold text-slate-500 w-16 flex-shrink-0">{k}</span>
                      <span className="text-slate-600">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Sessions tracked here in the Hub · Strategy in the doc
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two-col checklist */}
      <div className="grid grid-cols-2 gap-6">
        {/* EDUCATION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <h2 className="font-bold text-slate-900">Education</h2>
              <span className="text-xs text-slate-400">Emily · Eliza · Gerard</span>
              <Tip text="Education tracks what the Education team needs to create or update — external docs, media, learning events, and technical content." />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{eduDone} / {eduTotal}</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(eduItems).map(([cat, items]) => (
              <div key={cat}>
                <SectionLabel label={cat} />
                {items.map(a => (
                  <ActivityRow key={a.id} activity={a} isEditor={isEditor}
                    onToggle={() => toggleEdu(cat, a.id)} onRemove={() => removeEdu(cat, a.id)} onOpen={() => openDrawer(a.name, cat)} />
                ))}
                {isEditor && (
                  <button className="w-full text-left text-xs text-slate-400 hover:text-teal-600 px-3 py-2 border border-dashed border-slate-200 rounded-lg hover:border-teal-400 transition-colors flex items-center gap-1.5 mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add education activity
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ENABLEMENT */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h2 className="font-bold text-slate-900">Revenue Enablement</h2>
              <span className="text-xs text-slate-400">Gina · Christian</span>
              <Tip text="Revenue Enablement tracks what Gina + Christian's team builds — live sessions, assets, and reinforcement tools. Live sessions sync to the calendar." />
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{enbDone} / {enbTotal}</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(enbItems).map(([cat, items]) => (
              <div key={cat}>
                <SectionLabel
                  label={cat}
                  badge={cat === 'Live Sessions' ? (
                    <span className="text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      syncs to calendar
                    </span>
                  ) : undefined}
                  tip={cat === 'Live Sessions' ? 'These are sessions other teams need to attend. They appear on the calendar and will eventually sync to Google Calendar.' : undefined}
                />
                {items.map(a => (
                  <ActivityRow key={a.id} activity={a} isLive={cat === 'Live Sessions'} isEditor={isEditor}
                    onToggle={() => toggleEnb(cat, a.id)} onRemove={() => removeEnb(cat, a.id)} onOpen={() => openDrawer(a.name, cat)} />
                ))}
                {isEditor && (
                  <button className="w-full text-left text-xs text-slate-400 hover:text-teal-600 px-3 py-2 border border-dashed border-slate-200 rounded-lg hover:border-teal-400 transition-colors flex items-center gap-1.5 mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add {cat === 'Live Sessions' ? 'live session' : 'asset or activity'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-functional */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-semibold text-amber-900 mb-3 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          What We Need From Others
          <Tip text="These dependencies are auto-populated from the programming track. Send requests to these teams early — don't wait until build week." />
        </h3>
        <div className="grid grid-cols-3 gap-5 text-xs">
          <div><div className="font-semibold text-amber-800 mb-1">Product</div><div className="text-amber-700">Sandbox ready 1 week before training. SME for live Q&A. Early feature access.</div></div>
          <div><div className="font-semibold text-amber-800 mb-1">PMM</div><div className="text-amber-700">Positioning doc + messaging framework 2 weeks out. Competitive brief vs. Sierra/Gorgias AI.</div></div>
          <div><div className="font-semibold text-amber-800 mb-1">Sales Leadership</div><div className="text-amber-700">Manager attendance at ILT. Reinforce in 1:1s for 4 weeks. Pipeline targets set.</div></div>
        </div>
      </div>

      <ActivityDrawer isOpen={drawerOpen} onClose={closeDrawer} activity={drawerActivity} />
    </div>
  )
}
