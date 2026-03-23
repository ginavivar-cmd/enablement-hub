"use client";

import { useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BRANCH_LABELS } from "@/lib/constants";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

interface Opportunity {
  title: string;
  details: string;
  type: "Async" | "Live" | "Certification";
  audience: string;
  priority: "High" | "Medium" | "Low";
  improvementArea?: string;
  level?: "Foundational" | "Tactical" | "Strategic" | "Technical";
  branches?: string[];
  source_signal?: string;
  learning_objective?: string;
  proposed_deliverables?: string[];
  confidence?: "high" | "low";
  priority_reason?: string;
}

interface NotesScannerProps {
  onSuccess?: () => void;
}

export function NotesScanner({ onSuccess }: NotesScannerProps) {
  const [notes, setNotes] = useState("");
  const [scanning, setScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<number>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/parse", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Failed to parse ${file.name}`);
    }

    const data = await res.json();
    return { text: data.text as string, fileName: data.fileName as string };
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      ACCEPTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    if (fileArray.length === 0) {
      setError("No supported files. Use PDF, DOCX, TXT, or MD.");
      return;
    }

    setParsing(true);
    setError(null);

    try {
      const results = await Promise.all(fileArray.map(parseFile));
      const newText = results
        .map((r) => `--- ${r.fileName} ---\n${r.text}`)
        .join("\n\n");

      setNotes((prev) => (prev.trim() ? `${prev}\n\n${newText}` : newText));
      setParsedFiles((prev) => [...prev, ...results.map((r) => r.fileName)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file(s)");
    } finally {
      setParsing(false);
    }
  }, [parseFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  async function handleScan() {
    if (!notes.trim()) return;
    setScanning(true);
    setError(null);
    setOpportunities([]);
    setSubmittedIds(new Set());
    setDismissedIds(new Set());

    try {
      const res = await fetch("/api/enablements/scan-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        let errMsg = "Scan failed";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch {
          errMsg = `Server error (${res.status})`;
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(opp: Opportunity, index: number) {
    try {
      const res = await fetch("/api/enablements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: opp.title,
          details: opp.details,
          type: opp.type,
          audience: opp.audience,
          priority: opp.priority,
          improvementArea: opp.improvementArea || null,
          branches: opp.branches || null,
          sourceSignal: opp.source_signal || null,
          learningObjective: opp.learning_objective || null,
          proposedDeliverables: opp.proposed_deliverables || null,
          confidence: opp.confidence || null,
          priorityReason: opp.priority_reason || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmittedIds((prev) => new Set(prev).add(index));
      onSuccess?.();
    } catch {
      // silently fail — user can try again
    }
  }

  function handleDismiss(index: number) {
    setDismissedIds((prev) => new Set(prev).add(index));
  }

  const visibleOpps = opportunities.filter(
    (_, i) => !dismissedIds.has(i)
  );

  return (
    <div className="rounded-lg bg-white shadow-sm border-l-4 border-l-blue-500 border border-[#e5e5e5] p-6">
      <h2 className="mb-1 text-lg font-bold text-[#1a1a1a]">
        Scan for Enablement Opportunities
      </h2>
      <p className="mb-4 text-sm text-[#737373]">
        Paste meeting notes, Slack threads, call summaries, deal reviews, or support tickets to automatically identify enablement opportunities.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50/50"
            : "border-[#e5e5e5] bg-white"
        }`}
      >
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste content here or drop files (PDF, DOCX, TXT)..."
          className="border-0 resize-none min-h-[120px] focus-visible:ring-0"
          rows={5}
        />
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-50/80 pointer-events-none">
            <p className="text-sm font-medium text-blue-600">Drop files here</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button
          onClick={handleScan}
          disabled={scanning || parsing || !notes.trim()}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {scanning ? "Scanning..." : "Scan for Opportunities"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={parsing}
          onClick={() => fileInputRef.current?.click()}
          className="text-sm"
        >
          {parsing ? "Parsing..." : "Upload File"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
        {scanning && (
          <span className="text-sm text-[#737373] animate-pulse">
            AI is analyzing your notes...
          </span>
        )}
        {parsing && (
          <span className="text-sm text-[#737373] animate-pulse">
            Extracting text from file...
          </span>
        )}
      </div>

      {parsedFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {parsedFiles.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {name}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {visibleOpps.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">
            Identified Opportunities ({visibleOpps.length})
          </h3>
          {opportunities.map((opp, index) => {
            if (dismissedIds.has(index)) return null;
            const isSubmitted = submittedIds.has(index);

            return (
              <div
                key={index}
                className={`rounded-lg border border-[#e5e5e5] p-4 ${
                  isSubmitted ? "bg-green-50/50 opacity-60" : "bg-[#fafafa]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isSubmitted && (
                        <span className="text-green-600 text-sm">&#10003;</span>
                      )}
                      <h4 className="text-sm font-bold text-[#1a1a1a]">
                        {opp.title}
                      </h4>
                      {opp.confidence && (
                        <span className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          opp.confidence === "high"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {opp.confidence}
                        </span>
                      )}
                    </div>
                    {/* Badges row: branches, type, audience, priority, area, level */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {opp.branches?.map((branch) => {
                        const info = BRANCH_LABELS[branch];
                        return info ? (
                          <Badge key={branch} variant="secondary" className={`border-0 text-xs font-medium ${info.color}`}>
                            {info.label}
                          </Badge>
                        ) : null;
                      })}
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          opp.type === "Live"
                            ? "bg-emerald-50 text-emerald-700"
                            : opp.type === "Async"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {opp.type}
                      </Badge>
                      {opp.audience.split(", ").map((aud) => (
                        <Badge
                          key={aud}
                          variant="secondary"
                          className="bg-[#f0f0f0] text-[#737373] border-0 text-xs"
                        >
                          {aud}
                        </Badge>
                      ))}
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          opp.priority === "High"
                            ? "bg-red-50 text-red-600"
                            : opp.priority === "Medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-[#f0f0f0] text-[#737373]"
                        }`}
                      >
                        {opp.priority}
                      </Badge>
                      {opp.improvementArea && (
                        <Badge
                          variant="secondary"
                          className="bg-violet-50 text-violet-700 border-0 text-xs"
                        >
                          {opp.improvementArea}
                        </Badge>
                      )}
                      {opp.level && (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-600 border-0 text-xs"
                        >
                          {opp.level}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[#737373]">
                      {opp.details}
                    </p>
                    {/* Source signal */}
                    {opp.source_signal && (
                      <div className="mt-2 rounded bg-[#f5f5f5] px-3 py-2 border-l-2 border-[#ccc]">
                        <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Source signal</span>
                        <p className="text-xs text-[#555] italic mt-0.5">&ldquo;{opp.source_signal}&rdquo;</p>
                      </div>
                    )}
                    {/* Learning objective */}
                    {opp.learning_objective && (
                      <div className="mt-2">
                        <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Learning objective</span>
                        <p className="text-xs text-[#555] mt-0.5">{opp.learning_objective}</p>
                      </div>
                    )}
                    {/* Proposed deliverables */}
                    {opp.proposed_deliverables && opp.proposed_deliverables.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Proposed deliverables</span>
                        <ul className="mt-0.5 space-y-0.5">
                          {opp.proposed_deliverables.map((d, i) => (
                            <li key={i} className="text-xs text-[#555] flex items-start gap-1.5">
                              <span className="text-[#ccc] mt-px">&#8226;</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Priority reason */}
                    {opp.priority_reason && (
                      <p className="mt-2 text-xs text-[#888]">
                        <span className="font-semibold text-[#aaa]">Why {opp.priority}:</span> {opp.priority_reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {isSubmitted ? (
                    <span className="text-xs text-green-600 font-medium">
                      Submitted
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(opp, index)}
                      className="h-7 bg-gladly-green text-white hover:bg-gladly-green/90 text-xs"
                    >
                      Submit as Enablement
                    </Button>
                  )}
                  {!isSubmitted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(index)}
                      className="h-7 text-xs text-[#aaa] hover:text-[#737373]"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
