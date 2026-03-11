"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITIES, ENABLEMENT_TYPES, IMPROVEMENT_AREAS } from "@/lib/constants";
import { AudienceMultiSelect } from "@/components/audience-multi-select";

export function IntakeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [title, setTitle] = useState("");
  const [submitter, setSubmitter] = useState("");
  const [details, setDetails] = useState("");
  const [audience, setAudience] = useState<string[]>([]);
  const [priority, setPriority] = useState("");
  const [idealDate, setIdealDate] = useState("");
  const [type, setType] = useState("");
  const [improvementArea, setImprovementArea] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/enablements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          submitter: submitter || null,
          details: details || null,
          audience: audience.length > 0 ? audience.join(", ") : null,
          priority: priority || null,
          idealDate: idealDate || null,
          type: type || null,
          improvementArea: improvementArea || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTitle("");
        setSubmitter("");
        setDetails("");
        setAudience([]);
        setPriority("");
        setIdealDate("");
        setType("");
        setImprovementArea("");
        onSuccess?.();
        setTimeout(() => setSubmitted(false), 4000);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  const selectTriggerClass = "border-[#e5e5e5] bg-white text-[#1a1a1a]";
  const selectContentClass = "border-[#e5e5e5] bg-white";
  const selectItemClass = "text-[#1a1a1a] focus:bg-[#f5f5f5] focus:text-[#1a1a1a]";
  const inputClass = "border-[#e5e5e5] bg-white text-[#1a1a1a] placeholder:text-[#aaa] focus-visible:ring-gladly-green";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1: Title + Submitter */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Request / Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Demo certification for SEs"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Submitter</Label>
          <Input
            value={submitter}
            onChange={(e) => setSubmitter(e.target.value)}
            placeholder="Who's requesting this?"
            className={inputClass}
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <Label className="text-[#1a1a1a] font-medium text-sm">Details / Notes</Label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Context, background, links, relevant notes..."
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Row 2: Audience + Priority + Type */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Audience</Label>
          <AudienceMultiSelect value={audience} onChange={setAudience} />
        </div>

        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v ?? "")}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className={selectItemClass}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? "")}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              {ENABLEMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className={selectItemClass}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Ideal Date + Improvement Area */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Ideal Date</Label>
          <Input
            type="date"
            value={idealDate}
            onChange={(e) => setIdealDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Targeted Improvement Area</Label>
          <Select value={improvementArea} onValueChange={(v) => setImprovementArea(v ?? "")}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent className={`${selectContentClass} min-w-[400px]`}>
              {IMPROVEMENT_AREAS.map((area) => (
                <SelectItem key={area} value={area} className={`${selectItemClass} whitespace-normal`}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-gladly-green text-white font-medium hover:bg-gladly-green/90"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </Button>
        {submitted && (
          <span className="text-sm text-gladly-green font-medium">
            Request submitted successfully
          </span>
        )}
      </div>

      <p className="text-xs text-[#aaa]">
        All fields are optional at submission, but required before scheduling.
      </p>
    </form>
  );
}
