'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

const REQUESTS = [
  {
    id: '1',
    title: 'Roadmap Knowledge Gap Training',
    status: 'In Progress',
    statusColor: 'bg-yellow-100 text-yellow-700',
    type: 'Live',
    typeColor: 'bg-blue-100 text-blue-700',
    audience: 'All AEs',
    owner: 'Gina Vivar',
    due: 'Apr 22, 2026',
    description: 'AE team is entering Q2 QBR season and leaders flagged a gap: reps can\'t speak confidently to what\'s coming in H2 without over-promising.',
  },
  {
    id: '2',
    title: 'Competitive Intel: Sierra Deep Dive',
    status: 'Planning',
    statusColor: 'bg-slate-100 text-slate-600',
    type: 'Async',
    typeColor: 'bg-teal-100 text-teal-700',
    audience: 'BDRs, Growth AEs',
    owner: 'Christian Shockley',
    due: 'Apr 28, 2026',
    description: 'BDRs and AEs need a refresher on Sierra\'s recent product updates and how to position against them.',
  },
]

export default function RequestsPage() {
  const { isEditor } = useAuth()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanInput, setScanInput] = useState('')
  const [scanResult, setScanResult] = useState(false)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Ad-hoc enablement not tied to a launch</p>
        </div>
        {isEditor && (
          <button className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Log Request
          </button>
        )}
      </div>

      {/* AI Scanner */}
      <div className="bg-gradient-to-r from-violet-50 to-slate-50 border border-violet-200 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-slate-800">✨ AI Request Scanner</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Beta</span>
            </div>
            <p className="text-xs text-slate-500">Paste a Slack message, email, or meeting notes — AI identifies the need and suggests activities.</p>
          </div>
          <button
            onClick={() => setScannerOpen(o => !o)}
            className="text-xs text-violet-600 hover:text-violet-800 font-medium px-3 py-1.5 border border-violet-200 rounded-lg hover:bg-violet-50"
          >
            {scannerOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {scannerOpen && (
          <div>
            <textarea
              rows={4}
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              placeholder="e.g. 'Hey Gina — the BDR team is struggling to talk about our Gorgias migration play. Getting a lot of why should I switch questions and they're not sure how to respond. Can we do something?'"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white mb-3 resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => { if (scanInput.trim()) setScanResult(true) }}
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Scan Request
              </button>
              <span className="text-xs text-slate-400">or attach a file</span>
            </div>
            {scanResult && (
              <div className="mt-4 bg-white border border-violet-200 rounded-lg p-4 animate-[fadeIn_0.3s_ease]">
                <div className="text-sm font-semibold text-slate-800 mb-3">📋 Scan Results</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2"><span className="text-violet-500 font-bold mt-0.5">→</span><div><span className="font-medium text-slate-700">Need identified:</span> <span className="text-slate-600">BDRs can't handle "why switch from Gorgias?" objections in live calls</span></div></div>
                  <div className="flex items-start gap-2"><span className="text-violet-500 font-bold mt-0.5">→</span><div><span className="font-medium text-slate-700">Suggested track:</span> <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">T2 Blocker Buster</span> <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 ml-1">T6 Partner / Migration</span></div></div>
                  <div className="flex items-start gap-2"><span className="text-violet-500 font-bold mt-0.5">→</span><div><span className="font-medium text-slate-700">Suggested activities:</span> <span className="text-slate-600">Migration battlecard, objection drill, 3–5 Gong clips showing the objection being handled well</span></div></div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2 rounded-lg">Log as Request →</button>
                  <button className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-lg">Add to existing launch</button>
                  <button onClick={() => setScanResult(false)} className="text-xs text-slate-400 hover:text-slate-600">Dismiss</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request cards */}
      <div className="space-y-3">
        {REQUESTS.map(req => (
          <Link
            key={req.id}
            href={`/requests/${req.id}`}
            className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="font-semibold text-slate-900">{req.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req.statusColor}`}>{req.status}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req.typeColor}`}>{req.type}</span>
                </div>
                <p className="text-slate-500 text-sm">{req.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-400">
                  <span>{req.audience}</span><span>·</span><span>Owner: {req.owner}</span><span>·</span><span>Due {req.due}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
