'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/sidebar'
import ViewOnlyBanner from '@/components/view-only-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-100"><div className="text-slate-400 text-sm">Loading...</div></div>
  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        <ViewOnlyBanner />
        {children}
      </main>
    </div>
  )
}
