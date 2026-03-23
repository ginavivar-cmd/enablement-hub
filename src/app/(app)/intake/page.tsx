"use client";

import { useState, useEffect, useCallback } from "react";
import { IntakeForm } from "@/components/intake-form";
import { NotesScanner } from "@/components/notes-scanner";
import { Badge } from "@/components/ui/badge";

interface Enablement {
  id: string;
  title: string | null;
  submitter: string | null;
  audience: string | null;
  priority: string | null;
  type: string | null;
  status: string;
  createdAt: string;
}

interface SlackScanEntry {
  id: number;
  scannedAt: string;
  channelsScanned: number;
  messagesFound: number;
  signalsGenerated: number;
}

export default function IntakePage() {
  const [recent, setRecent] = useState<Enablement[]>([]);
  const [lastScan, setLastScan] = useState<SlackScanEntry | null>(null);

  const loadRecent = useCallback(() => {
    fetch("/api/enablements?status=submitted")
      .then((res) => res.json())
      .then((data) => setRecent(data.enablements?.slice(0, 10) || []))
      .catch(() => {});
  }, []);

  const loadLastScan = useCallback(() => {
    fetch("/api/slack/scan-log")
      .then((res) => res.json())
      .then((data) => setLastScan(data.lastScan || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadRecent();
    loadLastScan();
  }, [loadRecent, loadLastScan]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Intake</h1>
        <p className="mt-1 text-[#737373]">
          Submit enablement requests from meeting notes, ad hoc requests, Slack messages, and field feedback.
        </p>
      </div>

      {/* Recent Slack Scans */}
      {lastScan && (
        <div className="rounded-lg bg-white shadow-sm border border-[#e5e5e5] p-4 flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-50 text-purple-600 text-sm font-bold">S</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1a1a1a]">Last Slack Scan</p>
            <p className="text-xs text-[#737373]">
              {new Date(lastScan.scannedAt).toLocaleDateString()} &middot;{" "}
              {lastScan.channelsScanned} channel{lastScan.channelsScanned !== 1 ? "s" : ""} &middot;{" "}
              {lastScan.messagesFound} messages &middot;{" "}
              {lastScan.signalsGenerated} signal{lastScan.signalsGenerated !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      )}

      {/* AI Notes Scanner */}
      <NotesScanner onSuccess={loadRecent} />

      {/* Form card — white with green left border */}
      <div className="rounded-lg bg-white shadow-sm border-l-4 border-l-gladly-green border border-[#e5e5e5] p-6">
        <h2 className="mb-5 text-lg font-bold text-[#1a1a1a]">New Request</h2>
        <IntakeForm onSuccess={loadRecent} />
      </div>

      {/* Recent submissions */}
      {recent.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">
            Recent Submissions
          </h2>
          <div className="space-y-2">
            {recent.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white border border-[#e5e5e5] shadow-sm px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#1a1a1a]">
                    {item.title || "Untitled request"}
                  </span>
                  {item.audience && item.audience.split(", ").map((aud) => (
                    <Badge key={aud} variant="secondary" className="bg-[#f0f0f0] text-[#737373] border-0 text-xs">
                      {aud}
                    </Badge>
                  ))}
                  {item.type && (
                    <Badge variant="secondary" className="bg-[#f0f0f0] text-[#737373] border-0 text-xs">
                      {item.type}
                    </Badge>
                  )}
                  {item.priority && (
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs ${
                        item.priority === "High"
                          ? "bg-red-50 text-red-600"
                          : item.priority === "Medium"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-[#f0f0f0] text-[#737373]"
                      }`}
                    >
                      {item.priority}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#aaa]">
                  {item.submitter && <span>by {item.submitter}</span>}
                  <span>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
