'use client'
import { useState } from 'react'

const EVENTS: Record<string, { label: string; type: 'live' | 'async' | 'content' | 'launch'; owner?: string }[]> = {
  'Apr 15': [{ label: 'Roadmap Training — Live Session', type: 'live', owner: 'Gina' }],
  'Apr 18': [{ label: 'Async Recording + Summary', type: 'async', owner: 'Gerard' }],
  'Apr 26': [{ label: 'Live ILT: Positioning + Pitch', type: 'live', owner: 'Gina' }],
  'Apr 27': [{ label: 'Live ILT: Demo Workshop', type: 'live', owner: 'Christian' }],
  'Apr 29': [{ label: 'Feature Enablement Webinar', type: 'live', owner: 'Emily' }],
  'Apr 30': [{ label: 'Gladly AI Launch', type: 'launch' }],
}

const TYPE_STYLES = {
  live:    'bg-rose-50 border-l-rose-500 text-rose-800',
  async:   'bg-sky-50 border-l-sky-500 text-sky-800',
  content: 'bg-amber-50 border-l-amber-500 text-amber-800',
  launch:  'bg-emerald-50 border-l-emerald-500 text-emerald-800',
}

const TYPE_LABELS = { live: 'Live Session', async: 'Async', content: 'Content', launch: 'Launch Date' }

const RECURRING = [
  { name: 'AE Team Meeting', schedule: 'Fridays 9–10am PST', highlight: false },
  { name: 'BDR Team Meeting', schedule: 'Wednesdays 8–9am PST', highlight: false },
  { name: 'SAM Team Meeting', schedule: 'Thursdays 1–2pm PST', highlight: false },
  { name: 'SE Team Meeting', schedule: 'Mondays 12–12:30pm PST', highlight: false },
  { name: 'Enablement Hour', schedule: 'Thursdays 12–1pm PST', highlight: true },
  { name: 'Technical Enablement', schedule: 'Fridays 10:15–11am PST', highlight: true },
]

const UNSCHEDULED = [
  { label: 'Role-Play Drill', launch: 'Gladly AI Launch', type: 'live' as const },
  { label: 'Async Video: Product Overview', launch: 'Gladly AI Launch', type: 'async' as const },
  { label: 'Competitive Intel Deep Dive', launch: null, type: 'async' as const },
]

const DAYS = ['Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19',
              'Apr 20', 'Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26',
              'Apr 27', 'Apr 28', 'Apr 29', 'Apr 30']

const FILTERS = ['All', 'Live Sessions', 'Async', 'Launch Dates']

export default function CalendarPage() {
  const [filter, setFilter] = useState('All')

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
            Google Calendar sync — coming soon
          </span>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-auto p-4">
          <div className="grid grid-cols-7 gap-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-xs font-semibold text-slate-400 text-center py-2">{d}</div>
            ))}
            {/* Offset for April 13 = Sunday */}
            {DAYS.map((day) => {
              const events = EVENTS[day] ?? []
              return (
                <div key={day} className="min-h-[90px] rounded-lg border border-slate-100 p-1.5 hover:border-slate-200 transition-colors">
                  <div className="text-xs text-slate-500 mb-1 font-medium">{day.split(' ')[1]}</div>
                  {events.map((ev, j) => (
                    <div
                      key={j}
                      className={`text-[10px] leading-snug p-1.5 rounded border-l-2 mb-1 cursor-pointer hover:brightness-95 ${TYPE_STYLES[ev.type]}`}
                    >
                      <div className="font-semibold truncate">{ev.label}</div>
                      {ev.owner && <div className="opacity-70">{ev.owner}</div>}
                      <div className="opacity-60 mt-0.5">{TYPE_LABELS[ev.type]}</div>
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
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{UNSCHEDULED.length}</span>
        </h3>
        <div className="flex gap-3 flex-wrap">
          {UNSCHEDULED.map(u => (
            <div key={u.label} className="bg-white border border-dashed border-slate-300 rounded-lg px-4 py-3 text-sm hover:border-teal-400 hover:shadow-sm transition-all cursor-grab">
              <div className="font-medium text-slate-700 mb-1">{u.label}</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${TYPE_STYLES[u.type]}`}>{TYPE_LABELS[u.type]}</span>
                {u.launch && <span>{u.launch}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
