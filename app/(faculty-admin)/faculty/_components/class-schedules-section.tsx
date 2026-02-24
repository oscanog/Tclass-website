"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { scheduleBlocks, TIME_SLOTS, DAYS } from "./faculty-data";
import { DisclaimerBanner, AyTermRow } from "./shared-ui";

function formatHour(h: number): string {
  if (h === 12) return "12PM";
  if (h < 12) return `${h}AM`;
  return `${h - 12}PM`;
}

export function ClassSchedulesSection() {
  const [ayTerm, setAyTerm] = useState("2023-2024-1");

  // Group blocks by day column
  const blocksByDay: Record<number, typeof scheduleBlocks> = {};
  for (const b of scheduleBlocks) {
    if (!blocksByDay[b.day]) blocksByDay[b.day] = [];
    blocksByDay[b.day].push(b);
  }

  // day columns: 2=Sun,3=Mon,4=Tue,5=Wed,6=Thu,7=Fri,8=Sat
  const dayCols = [2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Class Schedules</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          In this page you can view your schedule for the selected semester
        </p>
      </div>

      <DisclaimerBanner text="DISCLAIMER: The faculty bears the responsibility for the proper disposal of the documents..." />
      <AyTermRow value={ayTerm} onChange={setAyTerm} />

      {/* Calendar Grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="min-w-[700px]">
          {/* Header row */}
          <div
            className="grid border-b border-slate-200 dark:border-white/10"
            style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
          >
            <div className="border-r border-slate-200 p-2 dark:border-white/10" />
            {DAYS.map((day) => (
              <div
                key={day}
                className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-slate-700 last:border-r-0 dark:border-white/10 dark:text-slate-300"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          {TIME_SLOTS.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-slate-100 last:border-b-0 dark:border-white/5"
              style={{ gridTemplateColumns: "56px repeat(7, 1fr)", minHeight: "56px" }}
            >
              {/* Time label */}
              <div className="flex items-start justify-end border-r border-slate-200 px-2 pt-1 dark:border-white/10">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {formatHour(hour)}
                </span>
              </div>

              {/* Day cells */}
              {dayCols.map((dayCol) => {
                const blocks = (blocksByDay[dayCol] ?? []).filter(
                  (b) => b.startHour === hour
                );
                return (
                  <div
                    key={dayCol}
                    className="relative border-r border-slate-100 last:border-r-0 dark:border-white/5"
                    style={{ minHeight: "56px" }}
                  >
                    {blocks.map((block, idx) => {
                      const spanHours = block.endHour - block.startHour;
                      return (
                        <div
                          key={idx}
                          className="absolute inset-x-0.5 top-0.5 z-10 cursor-pointer overflow-hidden rounded bg-blue-500 px-1.5 py-1 text-white shadow-sm transition-colors hover:bg-blue-600"
                          style={{ height: `calc(${spanHours * 56}px - 4px)` }}
                          onClick={() =>
                            toast.success(
                              `${block.subject} — ${block.section}: ${block.room} (${block.time})`
                            )
                          }
                        >
                          <p className="text-[10px] font-semibold leading-tight">(Class Schedule)</p>
                          <p className="text-[10px] font-bold leading-tight">{block.subject}</p>
                          <p className="text-[10px] leading-tight opacity-90">
                            {block.section}: {block.room}
                          </p>
                          <p className="text-[10px] leading-tight opacity-80">({block.time})</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
