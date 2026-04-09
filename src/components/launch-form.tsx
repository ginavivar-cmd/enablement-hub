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
import { Badge } from "@/components/ui/badge";
import { TRACKS, suggestActivities, type TrackCode } from "@/lib/programming-tracks";

const TIERS = [
  { value: "small", label: "Small", description: "Minimal coverage — 1-2 activities" },
  { value: "medium", label: "Medium", description: "Moderate — drops last activity per team" },
  { value: "large_xl", label: "Large / XL", description: "Full coverage — all suggested activities" },
] as const;

const TRACK_CODES = Object.keys(TRACKS) as TrackCode[];

const TRACK_COLORS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  pink: "bg-pink-50 text-pink-700 border-pink-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-green-50 text-green-700 border-green-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
};

interface LaunchFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LaunchForm({ onSuccess, onCancel }: LaunchFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<TrackCode[]>([]);
  const [targetDate, setTargetDate] = useState("");
  const [notionBriefUrl, setNotionBriefUrl] = useState("");
  const [planningDocUrl, setPlanningDocUrl] = useState("");
  const [goal, setGoal] = useState("");

  function toggleTrack(code: TrackCode) {
    setSelectedTracks((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  const suggested = tier && selectedTracks.length > 0
    ? suggestActivities(tier, selectedTracks)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !tier) return;
    setLoading(true);

    try {
      // Build activities from suggestions
      const activityPayload: { name: string; team: string; type: string; category: string }[] = [];
      if (suggested) {
        suggested.education.forEach((a) => {
          activityPayload.push({ name: a, team: "education", type: "asset", category: "Education" });
        });
        suggested.enablement.forEach((a) => {
          const type = a.toLowerCase().includes("live") ? "live_session" : "async";
          activityPayload.push({ name: a, team: "enablement", type, category: "Enablement" });
        });
      }

      const res = await fetch("/api/launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          tier,
          targetDate: targetDate || null,
          notionBriefUrl: notionBriefUrl || null,
          planningDocUrl: planningDocUrl || null,
          goal: goal || null,
          tracks: selectedTracks,
          activities: activityPayload,
        }),
      });

      if (res.ok) {
        onSuccess?.();
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
      {/* Row 1: Name + Tier */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Launch Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Gladly AI v2 Launch"
            className={inputClass}
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Tier *</Label>
          <Select value={tier} onValueChange={(v) => setTier(v ?? "")}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              {TIERS.map((t) => (
                <SelectItem key={t.value} value={t.value} className={selectItemClass}>
                  {t.label} — {t.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-[#1a1a1a] font-medium text-sm">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this launch about?"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Programming Tracks */}
      <div className="space-y-2">
        <Label className="text-[#1a1a1a] font-medium text-sm">Programming Tracks</Label>
        <p className="text-xs text-[#aaa]">Select the tracks that apply to this launch. Activities will be suggested based on your selection.</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {TRACK_CODES.map((code) => {
            const track = TRACKS[code];
            const isSelected = selectedTracks.includes(code);
            const colorClass = TRACK_COLORS[track.color] || TRACK_COLORS.slate;
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleTrack(code)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
                  isSelected
                    ? `${colorClass} border-current font-semibold ring-1 ring-current/20`
                    : "bg-white border-[#e5e5e5] text-[#737373] hover:border-[#ccc]"
                }`}
              >
                <span className="font-mono text-xs">{code}</span>
                <span>{track.name}</span>
              </button>
            );
          })}
        </div>
        {selectedTracks.length > 0 && (
          <div className="mt-2 space-y-1">
            {selectedTracks.map((code) => (
              <p key={code} className="text-xs text-[#737373]">
                <span className="font-medium">{code}:</span> {TRACKS[code].description}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Activities Preview */}
      {suggested && (suggested.education.length > 0 || suggested.enablement.length > 0) && (
        <div className="rounded-lg bg-[#f9fafb] border border-[#e5e5e5] p-4 space-y-3">
          <h3 className="text-xs font-semibold text-[#aaa] uppercase tracking-wide">
            Suggested Activities
          </h3>
          {suggested.education.length > 0 && (
            <div>
              <p className="text-xs font-medium text-teal-700 mb-1">Customer Education</p>
              <div className="flex flex-wrap gap-1.5">
                {suggested.education.map((a) => (
                  <Badge key={a} variant="secondary" className="bg-teal-50 text-teal-700 border-0 text-xs">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {suggested.enablement.length > 0 && (
            <div>
              <p className="text-xs font-medium text-blue-700 mb-1">Revenue Enablement</p>
              <div className="flex flex-wrap gap-1.5">
                {suggested.enablement.map((a) => (
                  <Badge key={a} variant="secondary" className="bg-blue-50 text-blue-700 border-0 text-xs">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Target Date + Goal */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Target Date</Label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Goal</Label>
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What should reps be able to do after?"
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 3: Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Notion Brief URL</Label>
          <Input
            value={notionBriefUrl}
            onChange={(e) => setNotionBriefUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#1a1a1a] font-medium text-sm">Planning Doc URL</Label>
          <Input
            value={planningDocUrl}
            onChange={(e) => setPlanningDocUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || !name || !tier}
          className="bg-gladly-green text-white font-medium hover:bg-gladly-green/90"
        >
          {loading ? "Creating..." : "Create Launch"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-[#e5e5e5]">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
