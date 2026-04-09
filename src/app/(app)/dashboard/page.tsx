'use client'

const STATS = [
  { label: 'Active Launches', value: '2', sub: '1 large, 1 medium', color: 'text-teal-600' },
  { label: 'Tasks Complete', value: '14', sub: 'of 33 total · 42%', color: 'text-violet-600' },
  { label: 'Sessions This Month', value: '5', sub: '3 live · 2 async', color: 'text-rose-600' },
  { label: 'Unscheduled Items', value: '3', sub: 'need a date', color: 'text-amber-600' },
]

const LAUNCHES_PROGRESS = [
  { name: 'Gladly AI Launch', pct: 52, color: 'bg-teal-500', edu: 55, enb: 50 },
  { name: 'Team Assist', pct: 25, color: 'bg-amber-400', edu: 29, enb: 20 },
]

const UPCOMING = [
  { label: 'Live ILT: Positioning + Pitch', date: 'Apr 26', type: 'Live', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { label: 'Live ILT: Demo Workshop', date: 'Apr 27', type: 'Live', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { label: 'Gladly AI Launch', date: 'Apr 30', type: 'Launch', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { label: 'Async Recording + Summary', date: 'Apr 18', type: 'Async', color: 'bg-sky-100 text-sky-700 border-sky-200' },
]

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Team activity overview — April 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STATS.map(s => (
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
          <div className="space-y-5">
            {LAUNCHES_PROGRESS.map(l => (
              <div key={l.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-800">{l.name}</span>
                  <span className="text-slate-500 font-semibold">{l.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div className={`${l.color} h-2 rounded-full`} style={{ width: `${l.pct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>📚 Education</span><span>{l.edu}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1">
                      <div className="bg-violet-400 h-1 rounded-full" style={{ width: `${l.edu}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>⚡ Enablement</span><span>{l.enb}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1">
                      <div className="bg-teal-400 h-1 rounded-full" style={{ width: `${l.enb}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Coming Up</h2>
          <div className="space-y-2">
            {UPCOMING.map(u => (
              <div key={u.label} className={`flex items-center gap-3 p-3 rounded-lg border ${u.color}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.label}</div>
                  <div className="text-xs opacity-70">{u.type}</div>
                </div>
                <div className="text-xs font-semibold flex-shrink-0">{u.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
