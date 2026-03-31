"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITIES,
  ENABLEMENT_TYPES,
  IMPROVEMENT_AREAS,
  TYPE_COLORS,
  RECURRING_MEETINGS,
  USERS,
  BRANCH_LABELS,
} from "@/lib/constants";
import { useSearch } from "@/lib/use-search";
import { AudienceMultiSelect } from "@/components/audience-multi-select";
import { ArchiveReasonModal } from "@/components/archive-reason-modal";

const DELIVERY_SLOTS = [
  { value: "one-off", label: "One off", schedule: null },
  { value: "meeting-ae", label: "Team Meeting: AE", schedule: "Fridays, 9–10am PST / 12–1pm EST" },
  { value: "meeting-bdr", label: "Team Meeting: BDR", schedule: "Wednesdays, 8–9am PST / 11am–12pm EST" },
  { value: "meeting-sam", label: "Team Meeting: SAM", schedule: "Thursdays, 1–2pm PST / 4–5pm EST" },
  { value: "meeting-se", label: "Team Meeting: SE", schedule: "Mondays, 12–12:30pm PST / 3–3:30pm EST" },
];

interface Enablement {
  id: string;
  title: string | null;
  details: string | null;
  owner: string | null;
  audience: string | null;
  priority: string | null;
  type: string | null;
  improvementArea: string | null;
  planningDocLink: string | null;
  educationPlanningLink: string | null;
  slackLink: string | null;
  scheduledDate: string | null;
  scheduledEndDate: string | null;
  status: string;
  googleCalendarEventId: string | null;
  submitter: string | null;
  source: string | null;
  sourceSlackChannel: string | null;
  sourceSlackLink: string | null;
  sourceSlackAuthor: string | null;
  branches: string | null;
  sourceSignal: string | null;
  learningObjective: string | null;
  proposedDeliverables: string | null;
  confidence: string | null;
  priorityReason: string | null;
}

// Fields needed to display on calendar — all fields required before scheduling
const SCHEDULE_REQUIRED: { key: keyof Enablement; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "details", label: "Description" },
  { key: "owner", label: "Owner" },
  { key: "audience", label: "Audience" },
  { key: "priority", label: "Priority" },
  { key: "type", label: "Type" },
  { key: "improvementArea", label: "Improvement Area" },
];

function hasDocLink(e: Enablement | Record<string, string>): boolean {
  return !!(e.planningDocLink || e.educationPlanningLink);
}

function isComplete(e: Enablement): boolean {
  return SCHEDULE_REQUIRED.every((f) => e[f.key]) && hasDocLink(e);
}

function getMissingFields(e: Enablement): string[] {
  const missing = SCHEDULE_REQUIRED.filter((f) => !e[f.key]).map((f) => f.label);
  if (!hasDocLink(e)) missing.push("Education Planning Link or Enablement Planning Doc Link");
  return missing;
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

export function CalendarView() {
  const [accepted, setAccepted] = useState<Enablement[]>([]);
  const [scheduled, setScheduled] = useState<Enablement[]>([]);
  const [editingItem, setEditingItem] = useState<Enablement | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingEndDate, setPendingEndDate] = useState<string | null>(null);
  const [scheduleDates, setScheduleDates] = useState<
    Record<string, { start: string; end?: string }>
  >({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandedForm, setExpandedForm] = useState<Record<string, string>>({});
  const [viewingEvent, setViewingEvent] = useState<Enablement | null>(null);
  const [archivingItem, setArchivingItem] = useState<Enablement | null>(null);
  const [deliverySlots, setDeliverySlots] = useState<Record<string, string>>({});
  const [customTimes, setCustomTimes] = useState<Record<string, { time: string; timezone: string }>>({});
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const { query: searchQuery, setQuery: setSearchQuery, filtered: visibleAccepted } = useSearch(accepted);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);

  const load = useCallback(() => {
    fetch("/api/enablements?status=accepted")
      .then((r) => r.json())
      .then((data) => setAccepted(data.enablements || []));
    fetch("/api/enablements?status=scheduled")
      .then((r) => r.json())
      .then((data) => setScheduled(data.enablements || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((data) => setGoogleConnected(data.connected))
      .catch(() => setGoogleConnected(false));
  }, []);

  // Initialize external draggable on card container
  useEffect(() => {
    if (!cardContainerRef.current) return;
    // Destroy previous instance
    if (draggableRef.current) {
      draggableRef.current.destroy();
    }
    draggableRef.current = new Draggable(cardContainerRef.current, {
      itemSelector: ".fc-draggable-card",
      eventData(eventEl) {
        const raw = eventEl.getAttribute("data-event");
        if (!raw) return {};
        return JSON.parse(raw);
      },
    });
    return () => {
      draggableRef.current?.destroy();
    };
  }, [accepted]);

  const calendarEvents = scheduled
    .filter((e) => e.scheduledDate)
    .map((e) => {
      const start = toDateInputValue(e.scheduledDate);
      const isCert = e.type === "Certification";
      let end: string | undefined;
      if (isCert && e.scheduledEndDate) {
        end = toDateInputValue(e.scheduledEndDate);
      }
      return {
        id: e.id,
        title: e.title || "Untitled",
        start,
        end,
        backgroundColor: TYPE_COLORS[e.type || ""] || "#009b00",
        borderColor: TYPE_COLORS[e.type || ""] || "#009b00",
        textColor: "#ffffff",
        allDay: true,
      };
    });

  async function handleEventDrop(info: { event: { id: string; startStr: string }; revert: () => void }) {
    try {
      await fetch(`/api/enablements/${info.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: info.event.startStr }),
      });
      load();
    } catch {
      info.revert();
    }
  }

  async function handleEventResize(info: { event: { id: string; startStr: string; endStr: string }; revert: () => void }) {
    try {
      await fetch(`/api/enablements/${info.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: info.event.startStr,
          scheduledEndDate: info.event.endStr,
        }),
      });
      load();
    } catch {
      info.revert();
    }
  }

  function handleDateClick(info: { dateStr: string }) {
    if (accepted.length === 1) {
      const item = accepted[0];
      if (isComplete(item)) {
        scheduleItem(item.id, info.dateStr);
      } else {
        openEditModal(item, info.dateStr);
      }
    }
  }

  // Handle external drop from cards to calendar
  async function handleEventReceive(info: { event: { id: string; startStr: string; remove: () => void } }) {
    try {
      await scheduleItem(info.event.id, info.event.startStr);
    } catch {
      info.event.remove();
    }
  }

  // Handle clicking a calendar event to view details
  function handleEventClick(info: { event: { id: string }; jsEvent: MouseEvent }) {
    info.jsEvent.preventDefault();
    const item = scheduled.find((e) => e.id === info.event.id);
    if (item) {
      setViewingEvent(item);
    }
  }

  async function scheduleItem(id: string, date: string, endDate?: string) {
    const body: Record<string, string> = { status: "scheduled", scheduledDate: date };
    if (endDate) body.scheduledEndDate = endDate;
    // Pass delivery slot info for Google Calendar time mapping
    if (deliverySlots[id]) body.deliverySlot = deliverySlots[id];
    if (customTimes[id]?.time) body.customTime = customTimes[id].time;
    if (customTimes[id]?.timezone) body.customTimezone = customTimes[id].timezone;
    const res = await fetch(`/api/enablements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("Failed to schedule:", await res.text());
      return;
    }
    setScheduleDates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    load();
  }

  function openEditModal(item: Enablement, date?: string) {
    setEditingItem(item);
    setPendingDate(date || null);
    setPendingEndDate(null);
    setEditForm({
      title: item.title || "",
      details: item.details || "",
      owner: item.owner || "",
      audience: item.audience || "",
      priority: item.priority || "",
      type: item.type || "",
      improvementArea: item.improvementArea || "",
      planningDocLink: item.planningDocLink || "",
      educationPlanningLink: item.educationPlanningLink || "",
      slackLink: item.slackLink || "",
    });
  }

  function openEditModalFromEvent(item: Enablement) {
    setEditingItem(item);
    setPendingDate(item.scheduledDate ? toDateInputValue(item.scheduledDate) : null);
    setPendingEndDate(
      item.type === "Certification" && item.scheduledEndDate
        ? toDateInputValue(item.scheduledEndDate)
        : null
    );
    setEditForm({
      title: item.title || "",
      details: item.details || "",
      owner: item.owner || "",
      audience: item.audience || "",
      priority: item.priority || "",
      type: item.type || "",
      improvementArea: item.improvementArea || "",
      planningDocLink: item.planningDocLink || "",
      educationPlanningLink: item.educationPlanningLink || "",
      slackLink: item.slackLink || "",
    });
  }

  async function handleCompleteAndSchedule() {
    if (!editingItem || !pendingDate) return;
    const patchBody: Record<string, string> = { ...editForm };
    await fetch(`/api/enablements/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    });
    await scheduleItem(editingItem.id, pendingDate, pendingEndDate || undefined);
    setEditingItem(null);
    setPendingDate(null);
    setPendingEndDate(null);
    setEditForm({});
  }

  async function handleSaveOnly() {
    if (!editingItem) return;
    const patchBody: Record<string, string | null> = { ...editForm };
    if (pendingDate) patchBody.scheduledDate = pendingDate;
    if (pendingEndDate) patchBody.scheduledEndDate = pendingEndDate;
    await fetch(`/api/enablements/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    });
    setEditingItem(null);
    setPendingDate(null);
    setPendingEndDate(null);
    setEditForm({});
    load();
  }

  async function handleScheduleCard(item: Enablement) {
    const dates = scheduleDates[item.id];
    if (!dates?.start) return;

    if (!isComplete(item)) {
      openEditModal(item, dates.start);
      return;
    }

    await scheduleItem(item.id, dates.start, dates.end);
  }

  async function handleArchive(item: Enablement, reason: string) {
    await fetch(`/api/enablements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "deprioritized",
        archivedReason: reason,
      }),
    });
    setArchivingItem(null);
    load();
  }

  function initExpandedForm(item: Enablement) {
    setExpandedForm({
      title: item.title || "",
      details: item.details || "",
      owner: item.owner || "",
      audience: item.audience || "",
      priority: item.priority || "",
      type: item.type || "",
      improvementArea: item.improvementArea || "",
      planningDocLink: item.planningDocLink || "",
      educationPlanningLink: item.educationPlanningLink || "",
      slackLink: item.slackLink || "",
    });
  }

  async function handleSaveExpandedForm(item: Enablement) {
    await fetch(`/api/enablements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expandedForm),
    });
    setExpandedCardId(null);
    setExpandedForm({});
    load();
  }

  const allEditFieldsFilled = SCHEDULE_REQUIRED.every(
    (f) => editForm[f.key]?.trim()
  ) && hasDocLink(editForm);

  const isCertType = (type: string | null) => type === "Certification";

  return (
    <div className="space-y-8">
      {/* Top section: Calendar + sidebar */}
      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 rounded-lg bg-white border border-[#e5e5e5] shadow-sm p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            timeZone="UTC"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={calendarEvents}
            editable={true}
            droppable={true}
            eventResizableFromStart={true}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventReceive={handleEventReceive}
            eventClick={handleEventClick}
            height="auto"
            eventDisplay="block"
          />
        </div>

        {/* Sidebar: Key + Recurring meetings */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Google Calendar connection */}
          {googleConnected === false && (
            <a
              href="/api/google/auth"
              className="flex items-center gap-2 rounded-lg bg-white border border-[#e5e5e5] shadow-sm p-3 hover:bg-[#f9f9f9] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" fill="#4285F4"/>
              </svg>
              <span className="text-xs font-medium text-[#4285F4]">
                Connect Google Calendar
              </span>
            </a>
          )}
          {googleConnected === true && (
            <div className="flex items-center gap-2 rounded-lg bg-white border border-[#e5e5e5] shadow-sm p-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-[#737373]">
                Google Calendar connected
              </span>
            </div>
          )}

          {/* Color key */}
          <div className="rounded-lg bg-white border border-[#e5e5e5] shadow-sm p-4">
            <h3 className="text-xs font-semibold text-[#aaa] uppercase tracking-wide mb-3">
              Color Key
            </h3>
            <div className="space-y-2">
              {ENABLEMENT_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: TYPE_COLORS[t] }}
                  />
                  <span className="text-sm text-[#1a1a1a]">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring meetings */}
          <div className="rounded-lg bg-white border border-[#e5e5e5] shadow-sm p-4">
            <h3 className="text-xs font-semibold text-[#aaa] uppercase tracking-wide mb-3">
              Recurring Meetings
            </h3>
            <div className="space-y-3">
              {RECURRING_MEETINGS.map((m) => (
                <div key={m.name}>
                  <p className="text-sm font-medium text-[#1a1a1a]">{m.name}</p>
                  <p className="text-xs text-[#737373]">{m.schedule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accepted enablements — ready to schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">
            Ready to Schedule
            <span className="ml-2 text-gladly-green">({accepted.length})</span>
          </h2>
          {accepted.length > 0 && (
            <Input
              type="search"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[#e5e5e5] bg-white h-8 text-sm w-56"
            />
          )}
        </div>

        {accepted.length === 0 ? (
          <div className="rounded-lg bg-white border border-dashed border-[#e5e5e5] p-8 text-center text-[#aaa] text-sm">
            No accepted enablements. Accept items from &quot;What We&apos;re Hearing&quot; to schedule them.
          </div>
        ) : (
          <div ref={cardContainerRef} className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {visibleAccepted.map((item) => {
              const complete = isComplete(item);
              const missing = getMissingFields(item);
              const isExpanded = expandedCardId === item.id;
              const eventData = complete
                ? JSON.stringify({
                    id: item.id,
                    title: item.title || "Untitled",
                    color: TYPE_COLORS[item.type || ""] || "#009b00",
                    allDay: true,
                  })
                : undefined;
              return (
                <div
                  key={item.id}
                  className={`rounded-lg bg-white border shadow-sm p-4 border-l-4 ${
                    complete ? "border-l-gladly-green" : "border-l-amber-400"
                  } border-[#e5e5e5] ${complete && !isExpanded ? "fc-draggable-card fc-drag-cursor" : ""}`}
                  data-event={eventData}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#1a1a1a]">
                      {item.title || "Untitled"}
                    </h4>
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedCardId(null);
                          setExpandedForm({});
                        } else {
                          setExpandedCardId(item.id);
                          initExpandedForm(item);
                        }
                      }}
                      className="shrink-0 text-xs text-gladly-green hover:underline font-medium"
                    >
                      {isExpanded ? "Collapse" : "Details"}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.type && (
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          item.type === "Live"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.type === "Async"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.type}
                      </Badge>
                    )}
                    {item.audience && item.audience.split(", ").map((aud) => (
                      <Badge key={aud} variant="secondary" className="bg-[#f0f0f0] text-[#737373] border-0 text-xs">
                        {aud}
                      </Badge>
                    ))}
                    {item.priority && (
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          item.priority === "High"
                            ? "bg-red-50 text-red-600 font-medium"
                            : item.priority === "Medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-[#f0f0f0] text-[#737373]"
                        }`}
                      >
                        {item.priority}
                      </Badge>
                    )}
                  </div>
                  {item.owner && (
                    <p className="mt-2 text-xs text-[#737373]">Owner: {item.owner}</p>
                  )}

                  {/* Expanded editable form */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#e5e5e5] space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1a1a1a]">Title</Label>
                        <Input
                          value={expandedForm.title || ""}
                          onChange={(e) => setExpandedForm({ ...expandedForm, title: e.target.value })}
                          className="h-8 border-[#e5e5e5] text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1a1a1a]">Description</Label>
                        <Textarea
                          value={expandedForm.details || ""}
                          onChange={(e) => setExpandedForm({ ...expandedForm, details: e.target.value })}
                          className="border-[#e5e5e5] resize-none text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1a1a1a]">Owner</Label>
                        <Select value={expandedForm.owner || ""} onValueChange={(v) => setExpandedForm({ ...expandedForm, owner: v ?? "" })}>
                          <SelectTrigger className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-sm">
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                          <SelectContent className="border-[#e5e5e5] bg-white">
                            {USERS.map((u) => (
                              <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-[#1a1a1a]">Audience</Label>
                          <AudienceMultiSelect
                            compact
                            value={expandedForm.audience ? expandedForm.audience.split(", ") : []}
                            onChange={(v) => setExpandedForm({ ...expandedForm, audience: v.join(", ") })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-[#1a1a1a]">Priority</Label>
                          <Select value={expandedForm.priority || ""} onValueChange={(v) => setExpandedForm({ ...expandedForm, priority: v ?? "" })}>
                            <SelectTrigger className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="border-[#e5e5e5] bg-white">
                              {PRIORITIES.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-[#1a1a1a]">Type</Label>
                          <Select value={expandedForm.type || ""} onValueChange={(v) => setExpandedForm({ ...expandedForm, type: v ?? "" })}>
                            <SelectTrigger className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="border-[#e5e5e5] bg-white">
                              {ENABLEMENT_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-[#1a1a1a]">Enablement Planning Doc</Label>
                          <Input
                            value={expandedForm.planningDocLink || ""}
                            onChange={(e) => setExpandedForm({ ...expandedForm, planningDocLink: e.target.value })}
                            placeholder="https://..."
                            className="h-8 border-[#e5e5e5] text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-[#1a1a1a]">Education Planning Link</Label>
                          <Input
                            value={expandedForm.educationPlanningLink || ""}
                            onChange={(e) => setExpandedForm({ ...expandedForm, educationPlanningLink: e.target.value })}
                            placeholder="https://..."
                            className="h-8 border-[#e5e5e5] text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-[#1a1a1a]">Slack Message or Release Brief Link</Label>
                          <Input
                            value={expandedForm.slackLink || ""}
                            onChange={(e) => setExpandedForm({ ...expandedForm, slackLink: e.target.value })}
                            placeholder="https://..."
                            className="h-8 border-[#e5e5e5] text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#1a1a1a]">Improvement Area</Label>
                        <Select value={expandedForm.improvementArea || ""} onValueChange={(v) => setExpandedForm({ ...expandedForm, improvementArea: v ?? "" })}>
                          <SelectTrigger className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-sm">
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent className="border-[#e5e5e5] bg-white min-w-[400px]">
                            {IMPROVEMENT_AREAS.map((area) => (
                              <SelectItem key={area} value={area} className="whitespace-normal">{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveExpandedForm(item)}
                        className="h-8 bg-gladly-green text-white hover:bg-gladly-green/90 text-xs"
                      >
                        Save
                      </Button>
                    </div>
                  )}

                  {!complete && !isExpanded && (
                    <div className="mt-3">
                      <p className="text-xs text-amber-600 font-medium">
                        Missing: {missing.join(", ")}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1 h-7 text-xs text-gladly-green hover:text-gladly-green/80 hover:bg-gladly-green/5 px-0"
                        onClick={() => openEditModal(item)}
                      >
                        Complete card
                      </Button>
                    </div>
                  )}

                  {/* Schedule controls + Archive */}
                  <div className="mt-3 pt-3 border-t border-[#e5e5e5] space-y-2">
                    {/* Delivery slot */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#aaa] uppercase">Time</span>
                      <Select
                        value={deliverySlots[item.id] || ""}
                        onValueChange={(v) =>
                          setDeliverySlots((prev) => ({ ...prev, [item.id]: v ?? "" }))
                        }
                      >
                        <SelectTrigger className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-xs">
                          <SelectValue placeholder="Select time slot..." />
                        </SelectTrigger>
                        <SelectContent className="border-[#e5e5e5] bg-white">
                          {DELIVERY_SLOTS.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value} className="text-xs">
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {deliverySlots[item.id] === "one-off" && (
                        <div className="flex gap-1">
                          <Input
                            type="time"
                            value={customTimes[item.id]?.time || ""}
                            onChange={(e) =>
                              setCustomTimes((prev) => ({
                                ...prev,
                                [item.id]: {
                                  time: e.target.value,
                                  timezone: prev[item.id]?.timezone || "PST",
                                },
                              }))
                            }
                            className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-xs flex-1"
                          />
                          <Select
                            value={customTimes[item.id]?.timezone || "PST"}
                            onValueChange={(v) =>
                              setCustomTimes((prev) => ({
                                ...prev,
                                [item.id]: {
                                  time: prev[item.id]?.time || "",
                                  timezone: v ?? "PST",
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-xs w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-[#e5e5e5] bg-white">
                              <SelectItem value="PST" className="text-xs">PST</SelectItem>
                              <SelectItem value="EST" className="text-xs">EST</SelectItem>
                              <SelectItem value="CST" className="text-xs">CST</SelectItem>
                              <SelectItem value="MST" className="text-xs">MST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {deliverySlots[item.id] &&
                        deliverySlots[item.id] !== "one-off" && (
                          <p className="text-xs text-[#737373]">
                            {DELIVERY_SLOTS.find(
                              (s) => s.value === deliverySlots[item.id]
                            )?.schedule}
                          </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        {isCertType(item.type) ? (
                          <div className="flex gap-1">
                            <div className="flex-1">
                              <span className="text-[10px] text-[#aaa] uppercase">Start</span>
                              <Input
                                type="date"
                                value={scheduleDates[item.id]?.start || ""}
                                onChange={(e) =>
                                  setScheduleDates((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], start: e.target.value },
                                  }))
                                }
                                className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-xs"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] text-[#aaa] uppercase">End</span>
                              <Input
                                type="date"
                                value={scheduleDates[item.id]?.end || ""}
                                onChange={(e) =>
                                  setScheduleDates((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], start: prev[item.id]?.start || "", end: e.target.value },
                                  }))
                                }
                                className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <Input
                            type="date"
                            value={scheduleDates[item.id]?.start || ""}
                            onChange={(e) =>
                              setScheduleDates((prev) => ({
                                ...prev,
                                [item.id]: { start: e.target.value },
                              }))
                            }
                            className="h-8 border-[#e5e5e5] bg-white text-[#1a1a1a] text-xs"
                          />
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 self-end">
                        <Button
                          size="sm"
                          onClick={() => handleScheduleCard(item)}
                          disabled={!scheduleDates[item.id]?.start}
                          className="h-8 bg-gladly-green text-white hover:bg-gladly-green/90 text-xs"
                        >
                          Schedule
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setArchivingItem(item)}
                          className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                        >
                          Archive
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Complete modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-[#e5e5e5] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">
              Complete Enablement Card
            </h3>
            <p className="text-sm text-[#737373] mb-5">
              All fields are required before scheduling.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1a1a1a]">Title</Label>
                <Input
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="border-[#e5e5e5]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1a1a1a]">Description</Label>
                <Textarea
                  value={editForm.details || ""}
                  onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                  className="border-[#e5e5e5] resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1a1a1a]">Owner</Label>
                <Select value={editForm.owner || ""} onValueChange={(v) => setEditForm({ ...editForm, owner: v ?? "" })}>
                  <SelectTrigger className="border-[#e5e5e5] bg-white text-[#1a1a1a]">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent className="border-[#e5e5e5] bg-white">
                    {USERS.map((u) => (
                      <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1a1a1a]">Audience</Label>
                  <AudienceMultiSelect
                    value={editForm.audience ? editForm.audience.split(", ") : []}
                    onChange={(v) => setEditForm({ ...editForm, audience: v.join(", ") })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1a1a1a]">Priority</Label>
                  <Select value={editForm.priority || ""} onValueChange={(v) => setEditForm({ ...editForm, priority: v ?? "" })}>
                    <SelectTrigger className="border-[#e5e5e5] bg-white text-[#1a1a1a]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="border-[#e5e5e5] bg-white">
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1a1a1a]">Type</Label>
                  <Select value={editForm.type || ""} onValueChange={(v) => setEditForm({ ...editForm, type: v ?? "" })}>
                    <SelectTrigger className="border-[#e5e5e5] bg-white text-[#1a1a1a]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="border-[#e5e5e5] bg-white">
                      {ENABLEMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1a1a1a]">Enablement Planning Doc Link</Label>
                  <Input
                    value={editForm.planningDocLink || ""}
                    onChange={(e) => setEditForm({ ...editForm, planningDocLink: e.target.value })}
                    placeholder="https://..."
                    className="border-[#e5e5e5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1a1a1a]">Education Planning Link</Label>
                  <Input
                    value={editForm.educationPlanningLink || ""}
                    onChange={(e) => setEditForm({ ...editForm, educationPlanningLink: e.target.value })}
                    placeholder="https://..."
                    className="border-[#e5e5e5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1a1a1a]">Slack Message or Release Brief Link</Label>
                  <Input
                    value={editForm.slackLink || ""}
                    onChange={(e) => setEditForm({ ...editForm, slackLink: e.target.value })}
                    placeholder="https://..."
                    className="border-[#e5e5e5]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1a1a1a]">Targeted Improvement Area</Label>
                <Select value={editForm.improvementArea || ""} onValueChange={(v) => setEditForm({ ...editForm, improvementArea: v ?? "" })}>
                  <SelectTrigger className="border-[#e5e5e5] bg-white text-[#1a1a1a]">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent className="border-[#e5e5e5] bg-white min-w-[400px]">
                    {IMPROVEMENT_AREAS.map((area) => (
                      <SelectItem key={area} value={area} className="whitespace-normal">{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time / delivery slot */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1a1a1a]">Time</Label>
                <Select
                  value={deliverySlots[editingItem.id] || ""}
                  onValueChange={(v) =>
                    setDeliverySlots((prev) => ({ ...prev, [editingItem.id]: v ?? "" }))
                  }
                >
                  <SelectTrigger className="border-[#e5e5e5] bg-white text-[#1a1a1a]">
                    <SelectValue placeholder="Select time slot..." />
                  </SelectTrigger>
                  <SelectContent className="border-[#e5e5e5] bg-white">
                    {DELIVERY_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deliverySlots[editingItem.id] === "one-off" && (
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={customTimes[editingItem.id]?.time || ""}
                      onChange={(e) =>
                        setCustomTimes((prev) => ({
                          ...prev,
                          [editingItem.id]: {
                            time: e.target.value,
                            timezone: prev[editingItem.id]?.timezone || "PST",
                          },
                        }))
                      }
                      className="border-[#e5e5e5] flex-1"
                    />
                    <Select
                      value={customTimes[editingItem.id]?.timezone || "PST"}
                      onValueChange={(v) =>
                        setCustomTimes((prev) => ({
                          ...prev,
                          [editingItem.id]: {
                            time: prev[editingItem.id]?.time || "",
                            timezone: v ?? "PST",
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="border-[#e5e5e5] bg-white text-[#1a1a1a] w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#e5e5e5] bg-white">
                        <SelectItem value="PST">PST</SelectItem>
                        <SelectItem value="EST">EST</SelectItem>
                        <SelectItem value="CST">CST</SelectItem>
                        <SelectItem value="MST">MST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {deliverySlots[editingItem.id] &&
                  deliverySlots[editingItem.id] !== "one-off" && (
                    <p className="text-xs text-[#737373]">
                      {DELIVERY_SLOTS.find(
                        (s) => s.value === deliverySlots[editingItem.id]
                      )?.schedule}
                    </p>
                  )}
              </div>

              {/* Schedule date in modal if pending */}
              {pendingDate && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1a1a1a]">
                    {isCertType(editForm.type) ? "Start Date" : "Scheduled Date"}
                  </Label>
                  <Input
                    type="date"
                    value={pendingDate}
                    onChange={(e) => setPendingDate(e.target.value)}
                    className="border-[#e5e5e5]"
                  />
                </div>
              )}

              {/* End date for certifications */}
              {pendingDate && isCertType(editForm.type) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1a1a1a]">End Date</Label>
                  <Input
                    type="date"
                    value={pendingEndDate || ""}
                    onChange={(e) => setPendingEndDate(e.target.value)}
                    className="border-[#e5e5e5]"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              {pendingDate ? (
                <Button
                  onClick={handleCompleteAndSchedule}
                  disabled={!allEditFieldsFilled || !pendingDate}
                  className="bg-gladly-green text-white hover:bg-gladly-green/90"
                >
                  Save & Schedule
                </Button>
              ) : (
                <Button
                  onClick={handleSaveOnly}
                  className="bg-gladly-green text-white hover:bg-gladly-green/90"
                >
                  Save
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingItem(null);
                  setPendingDate(null);
                  setPendingEndDate(null);
                  setEditForm({});
                }}
                className="text-[#737373]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Event detail modal (read-only) */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-[#e5e5e5] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">
              {viewingEvent.title || "Untitled"}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {viewingEvent.type && (
                <Badge
                  variant="secondary"
                  className={`border-0 text-xs ${
                    viewingEvent.type === "Live"
                      ? "bg-emerald-50 text-emerald-700"
                      : viewingEvent.type === "Async"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {viewingEvent.type}
                </Badge>
              )}
              {viewingEvent.audience && viewingEvent.audience.split(", ").map((aud) => (
                <Badge key={aud} variant="secondary" className="bg-[#f0f0f0] text-[#737373] border-0 text-xs">
                  {aud}
                </Badge>
              ))}
              {viewingEvent.priority && (
                <Badge
                  variant="secondary"
                  className={`border-0 text-xs ${
                    viewingEvent.priority === "High"
                      ? "bg-red-50 text-red-600 font-medium"
                      : viewingEvent.priority === "Medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-[#f0f0f0] text-[#737373]"
                  }`}
                >
                  {viewingEvent.priority}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-gladly-green/10 text-gladly-green border-0 text-xs font-medium">
                Scheduled
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {viewingEvent.scheduledDate && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">
                    {isCertType(viewingEvent.type) ? "Start Date" : "Scheduled Date"}
                  </span>
                  <p className="mt-0.5 text-sm text-[#1a1a1a]">
                    {new Date(viewingEvent.scheduledDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                </div>
              )}
              {isCertType(viewingEvent.type) && viewingEvent.scheduledEndDate && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">End Date</span>
                  <p className="mt-0.5 text-sm text-[#1a1a1a]">
                    {new Date(viewingEvent.scheduledEndDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                </div>
              )}
              {viewingEvent.owner && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Owner</span>
                  <p className="mt-0.5 text-sm text-[#1a1a1a]">{viewingEvent.owner}</p>
                </div>
              )}
              {viewingEvent.details && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Description</span>
                  <p className="mt-0.5 text-sm text-[#1a1a1a] whitespace-pre-wrap">{viewingEvent.details}</p>
                </div>
              )}
              {viewingEvent.improvementArea && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Improvement Area</span>
                  <p className="mt-0.5 text-sm text-[#1a1a1a]">{viewingEvent.improvementArea}</p>
                </div>
              )}
              {viewingEvent.planningDocLink && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Enablement Planning Doc</span>
                  <p className="mt-0.5">
                    <a
                      href={viewingEvent.planningDocLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gladly-green hover:underline"
                    >
                      Open document
                    </a>
                  </p>
                </div>
              )}
              {viewingEvent.educationPlanningLink && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Education Planning Link</span>
                  <p className="mt-0.5">
                    <a
                      href={viewingEvent.educationPlanningLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gladly-green hover:underline"
                    >
                      Open document
                    </a>
                  </p>
                </div>
              )}
              {viewingEvent.slackLink && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Slack Message or Release Brief Link</span>
                  <p className="mt-0.5">
                    <a
                      href={viewingEvent.slackLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gladly-green hover:underline"
                    >
                      Open link
                    </a>
                  </p>
                </div>
              )}
              {viewingEvent.submitter && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Submitter</span>
                  <p className="mt-0.5 text-sm text-[#1a1a1a]">{viewingEvent.submitter}</p>
                </div>
              )}
              {viewingEvent.branches && (() => {
                try {
                  const parsed = JSON.parse(viewingEvent.branches) as string[];
                  if (parsed.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.map((b) => {
                        const info = BRANCH_LABELS[b];
                        return info ? (
                          <Badge key={b} variant="secondary" className={`border-0 text-xs font-medium ${info.color}`}>
                            {info.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  );
                } catch { return null; }
              })()}
              {viewingEvent.sourceSignal && (
                <div className="rounded bg-[#f5f5f5] px-3 py-2 border-l-2 border-[#ccc]">
                  <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Source signal</span>
                  <p className="text-xs text-[#555] italic mt-0.5">&ldquo;{viewingEvent.sourceSignal}&rdquo;</p>
                </div>
              )}
              {viewingEvent.learningObjective && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Learning Objective</span>
                  <p className="mt-0.5 text-sm text-[#1a1a1a]">{viewingEvent.learningObjective}</p>
                </div>
              )}
              {viewingEvent.confidence && (
                <div>
                  <span className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">Confidence</span>
                  <span className={`ml-2 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    viewingEvent.confidence === "high"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {viewingEvent.confidence}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={() => {
                  openEditModalFromEvent(viewingEvent);
                  setViewingEvent(null);
                }}
                className="bg-gladly-green text-white hover:bg-gladly-green/90"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setArchivingItem(viewingEvent);
                  setViewingEvent(null);
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Archive
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewingEvent(null)}
                className="text-[#737373]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Archive reason modal */}
      {archivingItem && (
        <ArchiveReasonModal
          title={archivingItem.title || "Untitled"}
          onConfirm={(reason) => handleArchive(archivingItem, reason)}
          onCancel={() => setArchivingItem(null)}
        />
      )}
    </div>
  );
}
