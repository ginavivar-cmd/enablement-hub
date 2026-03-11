"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ArchiveReasonModalProps {
  title: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ArchiveReasonModal({
  title,
  onConfirm,
  onCancel,
}: ArchiveReasonModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-[#e5e5e5] p-6">
        <h3 className="text-lg font-bold text-[#1a1a1a]">Archive Enablement</h3>
        <p className="mt-1 text-sm text-[#737373]">
          Why is <span className="font-medium text-[#1a1a1a]">&ldquo;{title}&rdquo;</span> being deprioritized?
        </p>

        <div className="mt-4 space-y-2">
          <Label className="text-sm font-medium text-[#1a1a1a]">Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this enablement is being archived..."
            className="border-[#e5e5e5] resize-none"
            rows={4}
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Archive
          </Button>
          <Button variant="ghost" onClick={onCancel} className="text-[#737373]">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
