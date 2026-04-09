'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const NAV = [
  {
    href: '/launches',
    label: 'Launches',
    badge: null,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/requests',
    label: 'Requests',
    badge: 2,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: 'Calendar',
    badge: null,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    badge: null,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-52 bg-slate-900 flex-shrink-0 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="text-white font-bold text-xs tracking-wide leading-tight">
          EDUCATION +<br />ENABLEMENT TRACKER
        </div>
        <div className="text-slate-400 text-xs mt-1">Gladly</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={active ? 'text-teal-400' : ''}>{item.icon}</span>
              {item.label}
              {item.badge != null && (
                <span className="ml-auto bg-teal-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.initials ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.display ?? '—'}</div>
            <div className="text-slate-400 text-xs truncate">{user?.title ?? '—'}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-slate-500 hover:text-slate-300 px-3 py-1 transition-colors"
        >
          ← Sign out
        </button>
      </div>
    </aside>
  )
}
