'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { KebabMenu } from '@/components/kebab-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'

// ── Types ─────────────────────────────────────────────────────────────

interface Activity {
  id: string
  name: string
  type: string
  completed: boolean
}

interface Request {
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

interface ScanResult {
  need: string
  tracks: string[]
  suggestedActivities: string[]
  relatedLaunch: string | null
  urgency: 'high' | 'medium' | 'low'
}

// ── Helpers ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  planning:    { label: 'Planning',     className: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'In Progress',  className: 'bg-yellow-100 text-yellow-700' },
  done:        { label: 'Done',         className: 'bg-green-100 text-green-700' },
  archived:    { label: 'Archived',     className: 'bg-slate-100 text-slate-500' },
}

const TYPE_MAP: Record<string, { label: string; className: string }> = {
  live_session: { label: 'Live',  className: 'bg-blue-100 text-blue-700' },
  async:        { label: 'Async', className: 'bg-teal-100 text-teal-700' },
  asset:        { label: 'Asset', className: 'bg-amber-100 text-amber-700' },
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────

export default function RequestsPage() {
  const { isEditor } = useAuth()
  const router = useRouter()

  // Data
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scanner
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanInput, setScanInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [loggingScan, setLoggingScan] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const reqToDelete = requests.find(r => r.id === deleteTarget)

  // Log Request form
  const [showLogForm, setShowLogForm] = useState(false)
  const [logTitle, setLogTitle] = useState('')
  const [logDescription, setLogDescription] = useState('')
  const [logAudience, setLogAudience] = useState('')
  const [logOwner, setLogOwner] = useState('')
  const [logSaving, setLogSaving] = useState(false)

  // ── Fetch requests ──────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiFetch<{ requests: Request[] }>('/api/requests')
      setRequests(data.requests)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // ── AI Scanner ──────────────────────────────────────────────────────

  async function handleScan() {
    if (!scanInput.trim()) return
    setScanning(true)
    setScanError(null)
    setScanResult(null)
    try {
      const result = await apiFetch<ScanResult>('/api/scan-request', {
        method: 'POST',
        body: JSON.stringify({ text: scanInput }),
      })
      setScanResult(result)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function handleLogFromScan() {
    if (!scanResult) return
    setLoggingScan(true)
    try {
      await apiFetch('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: scanResult.need,
          description: scanInput,
          aiScanNotes: JSON.stringify({
            tracks: scanResult.tracks,
            suggestedActivities: scanResult.suggestedActivities,
            relatedLaunch: scanResult.relatedLaunch,
            urgency: scanResult.urgency,
          }),
        }),
      })
      setScanResult(null)
      setScanInput('')
      await fetchRequests()
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to log request')
    } finally {
      setLoggingScan(false)
    }
  }

  // ── Log Request (manual) ────────────────────────────────────────────

  async function handleLogRequest() {
    if (!logTitle.trim()) return
    setLogSaving(true)
    try {
      await apiFetch('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: logTitle.trim(),
          description: logDescription.trim() || null,
          audience: logAudience.trim() || null,
          owner: logOwner.trim() || null,
        }),
      })
      setShowLogForm(false)
      setLogTitle('')
      setLogDescription('')
      setLogAudience('')
      setLogOwner('')
      await fetchRequests()
    } catch {
      // silently handled
    } finally {
      setLogSaving(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await apiFetch(`/api/requests/${deleteTarget}`, { method: 'DELETE' })
      setDeleteTarget(null)
      await fetchRequests()
    } catch {
      // silently handled
    }
  }

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

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={() => { setLoading(true); fetchRequests() }} className="mt-3 text-sm text-teal-600 hover:text-teal-800 font-medium">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Ad-hoc enablement not tied to a launch</p>
        </div>
        {isEditor && (
          <button
            onClick={() => setShowLogForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Log Request
          </button>
        )}
      </div>

      {/* Log Request Form (modal) */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Log Request</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
                <input
                  type="text"
                  value={logTitle}
                  onChange={e => setLogTitle(e.target.value)}
                  placeholder="What's the enablement need?"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={logDescription}
                  onChange={e => setLogDescription(e.target.value)}
                  placeholder="Background context..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Audience</label>
                <input
                  type="text"
                  value={logAudience}
                  onChange={e => setLogAudience(e.target.value)}
                  placeholder="e.g. All AEs, BDRs"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Owner</label>
                <input
                  type="text"
                  value={logOwner}
                  onChange={e => setLogOwner(e.target.value)}
                  placeholder="e.g. Gina Vivar"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setShowLogForm(false)}
                className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogRequest}
                disabled={!logTitle.trim() || logSaving}
                className="text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {logSaving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Scanner */}
      <div className="bg-gradient-to-r from-violet-50 to-slate-50 border border-violet-200 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-slate-800">AI Request Scanner</span>
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
                onClick={handleScan}
                disabled={!scanInput.trim() || scanning}
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Scan Request
                  </>
                )}
              </button>
              <span className="text-xs text-slate-400">or attach a file</span>
            </div>

            {scanError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {scanError}
              </div>
            )}

            {scanResult && (
              <div className="mt-4 bg-white border border-violet-200 rounded-lg p-4 animate-[fadeIn_0.3s_ease]">
                <div className="text-sm font-semibold text-slate-800 mb-3">Scan Results</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold mt-0.5">&rarr;</span>
                    <div>
                      <span className="font-medium text-slate-700">Need identified:</span>{' '}
                      <span className="text-slate-600">{scanResult.need}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold mt-0.5">&rarr;</span>
                    <div>
                      <span className="font-medium text-slate-700">Suggested track:</span>{' '}
                      {scanResult.tracks.map(t => (
                        <span key={t} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 mr-1">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold mt-0.5">&rarr;</span>
                    <div>
                      <span className="font-medium text-slate-700">Suggested activities:</span>{' '}
                      <span className="text-slate-600">{scanResult.suggestedActivities.join(', ')}</span>
                    </div>
                  </div>
                  {scanResult.relatedLaunch && (
                    <div className="flex items-start gap-2">
                      <span className="text-violet-500 font-bold mt-0.5">&rarr;</span>
                      <div>
                        <span className="font-medium text-slate-700">Related launch:</span>{' '}
                        <span className="text-slate-600">{scanResult.relatedLaunch}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold mt-0.5">&rarr;</span>
                    <div>
                      <span className="font-medium text-slate-700">Urgency:</span>{' '}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        scanResult.urgency === 'high' ? 'bg-red-100 text-red-700' :
                        scanResult.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{scanResult.urgency}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={handleLogFromScan}
                    disabled={loggingScan}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loggingScan ? 'Logging...' : 'Log as Request \u2192'}
                  </button>
                  <button className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-lg">Add to existing launch</button>
                  <button onClick={() => setScanResult(null)} className="text-xs text-slate-400 hover:text-slate-600">Dismiss</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request cards */}
      {requests.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-slate-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-sm text-slate-500 font-medium">No requests yet</p>
          <p className="text-xs text-slate-400 mt-1">Use the AI Scanner or click &quot;Log Request&quot; to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.planning
            const typeInfo = req.type ? TYPE_MAP[req.type] : null

            return (
              <div key={req.id} className="relative">
                <Link
                  href={`/requests/${req.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-slate-900">{req.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.className}`}>{statusInfo.label}</span>
                        {typeInfo && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.className}`}>{typeInfo.label}</span>
                        )}
                      </div>
                      {req.description && (
                        <p className="text-slate-500 text-sm">{req.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-400">
                        {req.audience && <span>{req.audience}</span>}
                        {req.audience && req.owner && <span>&middot;</span>}
                        {req.owner && <span>Owner: {req.owner}</span>}
                        {(req.audience || req.owner) && req.dueDate && <span>&middot;</span>}
                        {req.dueDate && <span>Due {formatDate(req.dueDate)}</span>}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
                {isEditor && (
                  <div className="absolute top-3 right-3 z-10">
                    <KebabMenu items={[
                      { label: 'Edit', onClick: () => router.push(`/requests/${req.id}`) },
                      { label: 'Export PDF', onClick: () => window.print() },
                      { label: 'Delete', variant: 'danger', onClick: () => setDeleteTarget(req.id) },
                    ]} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && reqToDelete && (
        <ConfirmDialog
          title={`Delete ${reqToDelete.title}?`}
          description="This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
