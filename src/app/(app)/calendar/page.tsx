"use client";

import { CalendarView } from "@/components/calendar-view";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Calendar / Planning</h1>
        <p className="mt-1 text-gladly-green font-medium">
          Schedule and plan accepted enablements with drag-and-drop
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
