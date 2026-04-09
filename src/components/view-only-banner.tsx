'use client'
import { useAuth } from '@/lib/auth'

export default function ViewOnlyBanner() {
  const { user } = useAuth()
  if (!user || user.role !== 'viewer') return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5">
      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span className="text-amber-800 text-xs font-medium">You're in view-only mode.</span>
      <span className="text-amber-600 text-xs">
        You can browse launches, activities, and assets but cannot make edits. Need access? Reach out to Gina.
      </span>
    </div>
  )
}
