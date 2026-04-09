'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────
export type ActivityType = 'live' | 'async' | 'asset' | 'assessment' | 'comms' | 'other'
type Status = 'todo' | 'in_progress' | 'done'

export interface DrawerActivity {
  id?: string
  title: string
  type: ActivityType
  launchName: string
  owner?: string | null
  dueDate?: string | null
  completed?: boolean | null
  googleMeetLink?: string | null
  recordingLink?: string | null
  audiences?: string[] | null
  duration?: string | null
  notes?: string | null
  format?: string | null
  slideDeckLink?: string | null
  assetStatus?: string | null
  assessmentType?: string | null
  passThreshold?: string | null
  kirkpatrickLevel?: string | null
  commsType?: string | null
  otherDescription?: string | null
  scheduledDate?: string | null
}

interface ActivityDrawerProps {
  isOpen: boolean
  onClose: () => void
  activity: DrawerActivity | null
  onSave?: () => void
  onRemove?: () => void
}

// ── Constants ────────────────────────────────────────────────
const OWNERS = ['Gina Vivar', 'Christian Shockley', 'Emily Moore', 'Gerard Urbano', 'Eliza Wiraatmadja']

const TYPE_TABS: { key: ActivityType; label: string; dot: string }[] = [
  { key: 'live',       label: 'Live',       dot: 'bg-rose-500' },
  { key: 'async',      label: 'Async',      dot: 'bg-sky-500' },
  { key: 'asset',      label: 'Asset',      dot: 'bg-amber-500' },
  { key: 'assessment', label: 'Assessment', dot: 'bg-violet-500' },
  { key: 'comms',      label: 'Comms',      dot: 'bg-emerald-500' },
  { key: 'other',      label: 'Other',      dot: 'bg-slate-400' },
]

const TYPE_DOT: Record<ActivityType, string> = Object.fromEntries(TYPE_TABS.map(t => [t.key, t.dot])) as Record<ActivityType, string>

const STATUSES: { key: Status; label: string }[] = [
  { key: 'todo',        label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done',        label: 'Done' },
]

const LIVE_AUDIENCES = ['Ent AE', 'SMB AE', 'SE', 'SAM', 'Support', 'IMs', 'AI DE', 'Customers']
const DURATIONS = ['30 min', '45 min', '60 min', '90 min', '120 min']
const ASYNC_FORMATS = ['Loom/Video', 'Gong snippet', 'Written summary', 'Slide deck + notes']
const ASSET_STATUSES = ['Draft in progress', 'In review', 'Approved — ready to publish', 'Published / Live']
const ASSESSMENT_TYPES = ['Knowledge check/Quiz', 'Pitch certification', 'Demo certification', 'Manager observation']
const PASS_THRESHOLDS = ['70%', '80%', '90%', '100%']
const KIRKPATRICK = ['L1 Reaction', 'L2 Learning', 'L3 Behavior', 'L4 Results']
const COMMS_TYPES = ['Slack announcement', 'Email to field', 'All-hands update', 'Manager memo', 'In-app notification']

// ── Mapping helpers ─────────────────────────────────────────
function drawerTypeToDb(t: ActivityType): string {
  return t === 'live' ? 'live_session' : t
}

function dbTypeToDrawer(t: string): ActivityType {
  return t === 'live_session' ? 'live' : t as ActivityType
}

// ── Helpers ──────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-500 mb-1.5">{children}</label>
}
function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${props.className ?? ''}`} />
}
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} className={`w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${props.className ?? ''}`}>{children}</select>
}

// ── Component ────────────────────────────────────────────────
export function ActivityDrawer({ isOpen, onClose, activity, onSave, onRemove }: ActivityDrawerProps) {
  const [type, setType] = useState<ActivityType>('live')
  const [status, setStatus] = useState<Status>('todo')
  const [owner, setOwner] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  // Live
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('')
  const [duration, setDuration] = useState('')
  const [audiences, setAudiences] = useState<string[]>([])
  const [meetLink, setMeetLink] = useState('')
  const [recordingLink, setRecordingLink] = useState('')

  // Async
  const [asyncFormat, setAsyncFormat] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [watchTime, setWatchTime] = useState('')
  const [videoLink, setVideoLink] = useState('')
  const [slideDeckLink, setSlideDeckLink] = useState('')

  // Asset
  const [assetLink, setAssetLink] = useState('')
  const [assetStatus, setAssetStatus] = useState('')

  // Assessment
  const [assessmentType, setAssessmentType] = useState('')
  const [passThreshold, setPassThreshold] = useState('')
  const [assessmentDeadline, setAssessmentDeadline] = useState('')
  const [quizLink, setQuizLink] = useState('')
  const [kirkpatrick, setKirkpatrick] = useState('')

  // Comms
  const [commsType, setCommsType] = useState('')
  const [sendDate, setSendDate] = useState('')
  const [draftLink, setDraftLink] = useState('')

  // Other
  const [otherDescription, setOtherDescription] = useState('')
  const [otherLink, setOtherLink] = useState('')

  // Pre-fill all fields when activity changes
  useEffect(() => {
    if (activity) {
      setType(activity.type)
      setStatus(activity.completed ? 'done' : 'todo')
      setOwner(activity.owner ?? '')
      setDueDate(activity.dueDate ? activity.dueDate.slice(0, 10) : '')
      setNotes(activity.notes ?? '')

      // Live fields
      if (activity.scheduledDate) {
        const sd = activity.scheduledDate.slice(0, 10)
        setSessionDate(sd)
        if (activity.scheduledDate.length > 10) {
          setSessionTime(activity.scheduledDate.slice(11, 16))
        } else {
          setSessionTime('')
        }
      } else {
        setSessionDate('')
        setSessionTime('')
      }
      setDuration(activity.duration ?? '')
      setAudiences(activity.audiences ?? [])
      setMeetLink(activity.googleMeetLink ?? '')
      setRecordingLink(activity.recordingLink ?? '')

      // Async fields
      setAsyncFormat(activity.format ?? '')
      setPublishDate('')
      setWatchTime('')
      setVideoLink('')
      setSlideDeckLink(activity.slideDeckLink ?? '')

      // Asset
      setAssetLink('')
      setAssetStatus(activity.assetStatus ?? '')

      // Assessment
      setAssessmentType(activity.assessmentType ?? '')
      setPassThreshold(activity.passThreshold ?? '')
      setAssessmentDeadline('')
      setQuizLink('')
      setKirkpatrick(activity.kirkpatrickLevel ?? '')

      // Comms
      setCommsType(activity.commsType ?? '')
      setSendDate('')
      setDraftLink('')

      // Other
      setOtherDescription(activity.otherDescription ?? '')
      setOtherLink('')
    }
  }, [activity])

  function toggleAudience(a: string) {
    setAudiences(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  async function handleSave() {
    if (!activity?.id || saving) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        type: drawerTypeToDb(type),
        completed: status === 'done',
        owner: owner || null,
        dueDate: dueDate || null,
        notes: notes || null,
      }

      if (type === 'live') {
        let scheduledDate: string | null = null
        if (sessionDate) {
          scheduledDate = sessionTime ? `${sessionDate}T${sessionTime}:00` : sessionDate
        }
        body.scheduledDate = scheduledDate
        body.duration = duration || null
        body.audiences = audiences.length > 0 ? audiences : null
        body.googleMeetLink = meetLink || null
        body.recordingLink = recordingLink || null
      }

      if (type === 'async') {
        body.format = asyncFormat || null
        body.slideDeckLink = slideDeckLink || null
      }

      if (type === 'asset') {
        body.assetStatus = assetStatus || null
      }

      if (type === 'assessment') {
        body.assessmentType = assessmentType || null
        body.passThreshold = passThreshold || null
        body.kirkpatrickLevel = kirkpatrick || null
      }

      if (type === 'comms') {
        body.commsType = commsType || null
      }

      if (type === 'other') {
        body.otherDescription = otherDescription || null
      }

      await apiFetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      onSave?.()
      onClose()
    } catch (err) {
      console.error('Failed to save activity:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!activity?.id || removing) return
    setRemoving(true)
    try {
      await apiFetch(`/api/activities/${activity.id}`, {
        method: 'DELETE',
      })
      onRemove?.()
      onClose()
    } catch (err) {
      console.error('Failed to remove activity:', err)
    } finally {
      setRemoving(false)
    }
  }

  if (!activity) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ── Header ──────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TYPE_DOT[type]}`} />
              <h2 className="text-base font-bold text-slate-900 truncate">{activity.title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0 ml-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{activity.launchName}</span>
          </div>

          {/* Status toggle */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            {STATUSES.map(s => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  status === s.key
                    ? s.key === 'done' ? 'bg-teal-600 text-white' : 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Type tabs ───────────────────────────────────── */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex gap-1 flex-shrink-0 overflow-x-auto">
          {TYPE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                type === t.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${t.dot} ${type === t.key ? 'opacity-100' : 'opacity-50'}`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Shared: Owner + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Owner</Label>
              <Select value={owner} onChange={e => setOwner(e.target.value)}>
                <option value="">Select owner...</option>
                {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
            <div>
              <Label>Due / Target Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* ── LIVE ──────────────────────────────────────── */}
          {type === 'live' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Session Date</Label>
                  <Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
                </div>
                <div>
                  <Label>Time PST</Label>
                  <Input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Duration</Label>
                <Select value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="">Select...</option>
                  {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LIVE_AUDIENCES.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAudience(a)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        audiences.includes(a)
                          ? 'bg-teal-50 border-teal-300 text-teal-700 font-medium'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Google Meet Link</Label>
                <Input type="text" value={meetLink} onChange={e => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..." />
              </div>
              <div>
                <Label>Recording Link <span className="font-normal text-slate-400">(after session)</span></Label>
                <Input type="text" value={recordingLink} onChange={e => setRecordingLink(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* ── ASYNC ─────────────────────────────────────── */}
          {type === 'async' && (
            <div className="space-y-4">
              <div>
                <Label>Format</Label>
                <Select value={asyncFormat} onChange={e => setAsyncFormat(e.target.value)}>
                  <option value="">Select format...</option>
                  {ASYNC_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Publish Date</Label>
                  <Input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)} />
                </div>
                <div>
                  <Label>Est. Watch Time</Label>
                  <Input type="text" value={watchTime} onChange={e => setWatchTime(e.target.value)} placeholder="e.g. 8 min" />
                </div>
              </div>
              <div>
                <Label>Recording / Video Link</Label>
                <Input type="text" value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Slide Deck Link <span className="font-normal text-slate-400">(optional)</span></Label>
                <Input type="text" value={slideDeckLink} onChange={e => setSlideDeckLink(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* ── ASSET ─────────────────────────────────────── */}
          {type === 'asset' && (
            <div className="space-y-4">
              <div>
                <Label>Asset Link</Label>
                <Input type="text" value={assetLink} onChange={e => setAssetLink(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Asset Status</Label>
                <Select value={assetStatus} onChange={e => setAssetStatus(e.target.value)}>
                  <option value="">Select status...</option>
                  {ASSET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
            </div>
          )}

          {/* ── ASSESSMENT ────────────────────────────────── */}
          {type === 'assessment' && (
            <div className="space-y-4">
              <div>
                <Label>Assessment Type</Label>
                <Select value={assessmentType} onChange={e => setAssessmentType(e.target.value)}>
                  <option value="">Select type...</option>
                  {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pass Threshold</Label>
                  <Select value={passThreshold} onChange={e => setPassThreshold(e.target.value)}>
                    <option value="">Select...</option>
                    {PASS_THRESHOLDS.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={assessmentDeadline} onChange={e => setAssessmentDeadline(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Quiz / Form Link</Label>
                <Input type="text" value={quizLink} onChange={e => setQuizLink(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Kirkpatrick Level</Label>
                <div className="flex gap-1">
                  {KIRKPATRICK.map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKirkpatrick(kirkpatrick === k ? '' : k)}
                      className={`flex-1 text-[11px] font-medium py-2 rounded-lg border transition-colors ${
                        kirkpatrick === k
                          ? 'bg-violet-50 border-violet-300 text-violet-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── COMMS ─────────────────────────────────────── */}
          {type === 'comms' && (
            <div className="space-y-4">
              <div>
                <Label>Comms Type</Label>
                <Select value={commsType} onChange={e => setCommsType(e.target.value)}>
                  <option value="">Select type...</option>
                  {COMMS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div>
                <Label>Send / Publish Date</Label>
                <Input type="date" value={sendDate} onChange={e => setSendDate(e.target.value)} />
              </div>
              <div>
                <Label>Link to Draft / Post</Label>
                <Input type="text" value={draftLink} onChange={e => setDraftLink(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* ── OTHER ─────────────────────────────────────── */}
          {type === 'other' && (
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Input type="text" value={otherDescription} onChange={e => setOtherDescription(e.target.value)} placeholder="What is this activity?" />
              </div>
              <div>
                <Label>Link <span className="font-normal text-slate-400">(optional)</span></Label>
                <Input type="text" value={otherLink} onChange={e => setOtherLink(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          )}

          <div className="border-t border-slate-100" />

          {/* Shared: Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Pre-work, logistics, blockers, context..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
          >
            {removing ? 'Removing...' : 'Remove activity'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
