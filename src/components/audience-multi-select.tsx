"use client";

import { useState, useRef, useEffect } from "react";
import { AUDIENCES } from "@/lib/constants";

interface AudienceMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  compact?: boolean;
}

export function AudienceMultiSelect({
  value,
  onChange,
  className = "",
  compact = false,
}: AudienceMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(item: string) {
    if (item === "All of the above") {
      if (value.includes("All of the above")) {
        onChange([]);
      } else {
        onChange(["All of the above"]);
      }
      return;
    }
    const without = value.filter((v) => v !== "All of the above");
    if (without.includes(item)) {
      onChange(without.filter((v) => v !== item));
    } else {
      onChange([...without, item]);
    }
  }

  const displayText =
    value.length === 0
      ? "Select audience"
      : value.length === 1
      ? value[0]
      : `${value.length} selected`;

  const height = compact ? "h-8" : "h-9";
  const textSize = compact ? "text-sm" : "text-sm";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${height} w-full flex items-center justify-between rounded-md border border-[#e5e5e5] bg-white px-3 ${textSize} text-[#1a1a1a] hover:bg-[#fafafa] transition-colors`}
      >
        <span className={value.length === 0 ? "text-[#aaa]" : ""}>
          {displayText}
        </span>
        <svg
          className={`h-4 w-4 text-[#aaa] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[#e5e5e5] bg-white shadow-lg py-1 max-h-64 overflow-y-auto">
          {AUDIENCES.map((aud) => {
            const checked = value.includes(aud);
            return (
              <label
                key={aud}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] cursor-pointer text-sm text-[#1a1a1a]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(aud)}
                  className="h-3.5 w-3.5 rounded border-[#e5e5e5] text-gladly-green accent-[#009b00]"
                />
                {aud}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
