'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  function handleLogin() {
    const ok = login(value)
    if (ok) {
      router.push('/launches')
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl tracking-wide leading-tight">
            Education +<br />Enablement Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gladly</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Enter your name or access code
          </label>
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="e.g. Gina"
            className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {error && (
            <p className="text-red-400 text-xs mt-2">That name or code wasn't recognized. Try again.</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full mt-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            Sign In →
          </button>
          <p className="text-slate-500 text-xs text-center mt-4 leading-relaxed">
            Education or Revenue Enablement team? Enter your first name.<br />
            Guests enter the access code.
          </p>
        </div>
      </div>
    </div>
  )
}
