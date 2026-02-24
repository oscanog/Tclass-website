"use client";

import { useState, type ElementType, type ReactNode } from "react";
import { ArrowUpDown, Calendar, ChevronDown, ClipboardList, Clock3, ListChecks, Printer, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  classScheduleCards,
  dashboardStats,
  enrolledSubjectRows,
  enrollmentHistoryItems,
  evaluationRows,
  gradeRows,
  ledgerRows,
  placeholderCards,
  sectionTitle,
  studentProfile,
  todaySchedule,
  type Section,
} from "./student-data";

type RowValue = ReactNode[] | string[];

type ReportGradeTerm = {
  id: string;
  label: string;
  stats: {
    subjects: string;
    unitsEnrolled: string;
    unitsEarned: string;
    gwa: string;
    recomputeLabel: string;
  };
  rows: Array<[string, string, string, string, string, string, string]>;
};

const reportGradeTerms: ReportGradeTerm[] = [
  {
    id: "2025-2026-2nd",
    label: "2025-2026 2nd Semester",
    stats: {
      subjects: "8",
      unitsEnrolled: "23.00",
      unitsEarned: "23.00",
      gwa: "1.8587",
      recomputeLabel: "Recompute",
    },
    rows: gradeRows as Array<[string, string, string, string, string, string, string]>,
  },
  {
    id: "2025-2026-1st",
    label: "2025-2026 1st Semester",
    stats: {
      subjects: "6",
      unitsEnrolled: "18.00",
      unitsEarned: "0",
      gwa: "0.0000",
      recomputeLabel: "Recompute",
    },
    rows: [
      ["FSM 314", "Product Design, Packaging and Labelling", "3.00", "", "", "Unposted", "-"],
      ["TEC 302", "Research 2 - Undergraduate Thesis", "3.00", "", "", "Unposted", "-"],
      ["TEC 264", "Teaching Common Competencies in Industrial Arts", "3.00", "", "", "Unposted", "-"],
      ["TEC 262", "Teaching Competencies in Home Economics", "3.00", "", "", "Unposted", "-"],
      ["TEC 266", "Teaching Competencies in Agri-Fishery Arts", "3.00", "", "", "Unposted", "-"],
      ["TEC 265", "Teaching Competencies in ICT", "3.00", "", "", "Unposted", "-"],
    ],
  },
  {
    id: "2025-summer",
    label: "2025 Summer",
    stats: {
      subjects: "2",
      unitsEnrolled: "6.00",
      unitsEarned: "6.00",
      gwa: "1.8750",
      recomputeLabel: "Recompute",
    },
    rows: [
      ["FSM 111", "Occupational Health and Safety", "3.00", "1.75", "1.75", "Passed", "6/20/2025 9:15 AM"],
      ["FSM 112", "Food Selection, Preparation", "3.00", "2.00", "2.00", "Passed", "6/20/2025 10:02 AM"],
    ],
  },
];

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, icon: Icon, sub }: { label: string; value: string; icon: ElementType; sub?: string }) {
  return (
    <Panel>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-0.5 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          {sub ? <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p> : null}
        </div>
      </div>
    </Panel>
  );
}

function Disclaimer() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-100/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
      <p className="font-semibold text-slate-700 dark:text-slate-200">DISCLAIMER</p>
      <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
        The student bears responsibility for proper disposal of printed documents (COR, ROG, PRE-REG, SOA,
        and payment certificates) obtained from the student portal.
      </p>
    </div>
  );
}

function Toolbar() {
  return (
    <Panel className="p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AY Term</span>
          <div className="flex min-w-0 items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 sm:min-w-[20rem]">
            <span className="truncate">2025-2026 2nd Semester</span>
            <span className="text-xs text-slate-400">v</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <button type="button" aria-label="Print" className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
            <Printer className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Sort" className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Panel>
  );
}

function ReportGradesToolbar({
  selectedTermId,
  onSelectTerm,
}: {
  selectedTermId: string;
  onSelectTerm: (termId: string) => void;
}) {
  return (
    <Panel className="p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AY Term</span>
          <div className="relative sm:min-w-[20rem]">
            <select
              value={selectedTermId}
              onChange={(e) => onSelectTerm(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              aria-label="Select academic year and semester"
            >
              {reportGradeTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <button type="button" aria-label="Print" className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
            <Printer className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Sort" className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Panel>
  );
}

function TableLegend({
  items,
}: {
  items?: ReadonlyArray<readonly [string, string]>;
}) {
  const dots = items ?? ([
    ["bg-blue-500", "Hover"],
    ["bg-pink-500", "Dense"],
    ["bg-emerald-500", "Striped"],
    ["bg-amber-500", "Bordered"],
  ] as const);

  return (
    <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-slate-500 dark:text-slate-400">
      {dots.map(([color, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

function ReportOfGradesSection() {
  const [selectedTermId, setSelectedTermId] = useState<string>(reportGradeTerms[0]?.id ?? "");
  const selectedTerm = reportGradeTerms.find((t) => t.id === selectedTermId) ?? reportGradeTerms[0];

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Report of Grades" subtitle="View your report of grades for the selected semester." />
      <Disclaimer />
      <ReportGradesToolbar selectedTermId={selectedTerm.id} onSelectTerm={setSelectedTermId} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Subjects Enrolled" value={selectedTerm.stats.subjects} icon={ClipboardList} />
        <Stat label="Units Enrolled" value={selectedTerm.stats.unitsEnrolled} icon={ListChecks} />
        <Stat label="Units Earned" value={selectedTerm.stats.unitsEarned} icon={ShieldCheck} />
        <Stat label="General Weighted Average" value={selectedTerm.stats.gwa} icon={ListChecks} sub={selectedTerm.stats.recomputeLabel} />
      </div>
      <Table
        headers={["Code", "Title", "Unit", "Midterm", "Final", "Remarks", "Date Posted"]}
        minWidth="min-w-[1040px]"
        compact
        rows={selectedTerm.rows.map((r) => {
          const remarks = String(r[5]).toLowerCase();
          const isPassed = remarks === "passed";
          const isUnposted = remarks === "unposted";
          return [
            <span key={`${r[0]}-code`} className="font-medium text-slate-900 dark:text-slate-100">{r[0]}</span>,
            r[1],
            r[2] || "-",
            r[3] || "-",
            <span key={`${r[0]}-final`} className="font-semibold">{r[4] || "-"}</span>,
            <Badge
              key={`${r[0]}-badge`}
              className={`rounded-full px-2 py-0 text-[10px] ${
                isPassed
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : isUnposted
                    ? "bg-slate-500 hover:bg-slate-500"
                    : "bg-blue-600 hover:bg-blue-600"
              }`}
            >
              {r[5]}
            </Badge>,
            r[6] || "-",
          ];
        })}
      />
      <TableLegend />
      <p className="text-xs text-rose-500">If there are changes to your grades, click Recompute to calculate the latest General Weighted Average.</p>
    </div>
  );
}

function Table({
  headers,
  rows,
  minWidth = "min-w-[780px]",
  compact = false,
}: {
  headers: string[];
  rows: RowValue[];
  minWidth?: string;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth} ${compact ? "text-xs" : "text-sm"}`}>
          <thead className="bg-slate-50 dark:bg-white/5">
            <tr className="text-left text-slate-600 dark:text-slate-300">
              {headers.map((h) => (
                <th key={h} className={`font-semibold ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 ? "bg-slate-50/50 dark:bg-white/5" : ""}>
                {row.map((cell, j) => (
                  <td key={j} className={`${compact ? "px-3 py-2.5" : "px-4 py-3"} align-top text-slate-700 dark:text-slate-200`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
    </div>
  );
}

function HomeContent() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader
        title={`Hello, ${studentProfile.name.split(" ")[0]}!`}
        subtitle="Welcome to your student portal. Access your records, schedules, and academic services."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {dashboardStats.slice(0, 3).map((s) => <Stat key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} />)}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {dashboardStats.slice(3, 6).map((s) => <Stat key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr_1fr]">
        <Panel>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Enrolled Subjects Statistics</h2>
          <div className="mt-4 space-y-3">
            {[
              ["Enrolled Subjects", "33"],
              ["Passed", "27"],
              ["Failed", "0"],
              ["Credited", "0"],
              ["Incomplete", "0"],
            ].map(([label, total]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{total}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Completion Overview</h2>
          <div className="mt-5 flex items-center justify-center">
            <div className="relative h-52 w-52">
              <div className="absolute inset-0 rounded-full border-[20px] border-blue-500" />
              <div className="absolute inset-[22px] rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">passed</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <TableLegend
              items={[
                ["bg-blue-500", "Passed"],
                ["bg-pink-500", "Failed"],
                ["bg-emerald-500", "Credited"],
                ["bg-amber-500", "Incomplete"],
              ]}
            />
          </div>
        </Panel>

        <Panel>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Your Schedule Today</h2>
          <div className="mt-4 space-y-3">
            {todaySchedule.map((s) => (
              <div key={`${s.time}-${s.code}`} className="rounded-xl border border-slate-100 px-3 py-3 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-slate-200 p-1.5 dark:border-white/10">
                    <Clock3 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{s.time}</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.code}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{studentProfile.section} - {s.room}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ScheduleGrid() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hours = Array.from({ length: 15 }, (_, i) => 7 + i);
  const blocks = [
    { day: 2, start: 7, end: 10, code: "FSM 314", room: "L209", color: "border-blue-300 bg-blue-50" },
    { day: 3, start: 11, end: 14, code: "TEC 265", room: "L306A", color: "border-cyan-300 bg-cyan-50" },
    { day: 5, start: 11, end: 14, code: "TEC 302", room: "L306A", color: "border-indigo-300 bg-indigo-50" },
    { day: 2, start: 15, end: 18, code: "TEC 262", room: "L306A", color: "border-amber-300 bg-amber-50" },
    { day: 3, start: 15, end: 18, code: "TEC 266", room: "L206", color: "border-emerald-300 bg-emerald-50" },
    { day: 5, start: 15, end: 18, code: "TEC 264", room: "L206", color: "border-rose-300 bg-rose-50" },
  ] as const;

  return (
    <Panel className="p-0">
      <div className="overflow-x-auto">
        <div className="relative hidden min-w-[980px] grid-cols-[56px_repeat(7,minmax(120px,1fr))] grid-rows-[30px_repeat(15,44px)] lg:grid">
          <div className="row-start-1 col-start-1 border-b border-r border-slate-200/80 bg-slate-50 dark:border-white/10 dark:bg-white/5" />
          {days.map((day, i) => (
            <div key={day} className="row-start-1 border-b border-r border-slate-200/80 bg-slate-50 px-2 py-1 text-center text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300" style={{ gridColumnStart: i + 2 }}>
              {day}
            </div>
          ))}
          {hours.map((h, idx) => (
            <div key={`time-${h}`} className="border-b border-r border-slate-200/70 px-2 py-1 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400" style={{ gridColumnStart: 1, gridRowStart: idx + 2 }}>
              {h <= 12 ? `${h} AM` : `${h - 12} PM`}
            </div>
          ))}
          {hours.flatMap((h, r) =>
            days.map((_, c) => (
              <div
                key={`cell-${h}-${c}`}
                className="border-b border-r border-slate-200/60 dark:border-white/10"
                style={{ gridColumnStart: c + 2, gridRowStart: r + 2 }}
              />
            )),
          )}
          {blocks.map((b) => (
            <div
              key={`${b.day}-${b.code}-${b.start}`}
              className={`z-10 m-0.5 rounded-md border px-2 py-1 text-[11px] shadow-sm ${b.color}`}
              style={{ gridColumnStart: b.day + 2, gridRowStart: b.start - 7 + 2, gridRowEnd: b.end - 7 + 2 }}
            >
              <p className="font-semibold text-slate-800">{b.code}</p>
              <p className="text-slate-600">{studentProfile.section}</p>
              <p className="text-slate-600">{b.room}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {classScheduleCards.map(([day, code, time, room, color]) => (
            <div key={`${day}-${code}`} className={`rounded-xl border p-3 ${color} dark:border-white/10 dark:bg-white/5`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{day}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{code}</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{time}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{room} - {studentProfile.section}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function LedgerTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full text-xs">
          <thead className="bg-slate-50 dark:bg-white/5">
            <tr className="text-left text-slate-600 dark:text-slate-300">
              {["Academic Year and Term", "Date", "Code", "Reference No.", "Debit", "Credit", "Balance", "Remarks", "Date Posted"].map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ledgerRows.map((r, i) => {
              const isEnding = String(r[0]).startsWith("*** Ending Balance");
              return (
                <tr key={`${i}-${r[0]}-${r[3]}`} className={isEnding ? "bg-rose-300/80 text-rose-950" : i % 2 ? "bg-slate-50/50 dark:bg-white/5" : ""}>
                  {r.map((cell, idx) => (
                    <td
                      key={`${i}-${idx}`}
                      className={`px-3 py-2.5 align-top ${isEnding ? "font-semibold" : "text-slate-700 dark:text-slate-200"} ${idx === 0 && !isEnding ? "font-medium text-slate-900 dark:text-slate-100" : ""}`}
                    >
                      {cell || (idx === 0 ? "" : "-")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlaceholderSection({ section }: { section: Section }) {
  const cards = placeholderCards[section as keyof typeof placeholderCards];
  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title={sectionTitle[section]} subtitle="Static page cards to define the structure first, then wire real endpoints." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Panel key={card.title}>
              <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{card.desc}</p>
              <button type="button" className="mt-4 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
                Open (Static)
              </button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export function SectionContent({ section }: { section: Section }) {
  if (section === "home") return <HomeContent />;

  if (section === "enrolled-subjects") {
    return (
      <div className="space-y-4 sm:space-y-5">
        <SectionHeader title="Enrolled Subjects" subtitle="View your past or currently enrolled subjects." />
        <Disclaimer />
        <Toolbar />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Subjects Enrolled" value="6" icon={ClipboardList} />
          <Stat label="Units Enrolled" value="18.00" icon={ListChecks} />
          <Stat label="Section" value="FSM 3B" icon={Calendar} sub={studentProfile.section} />
        </div>
        <Table headers={["Code", "Title", "Unit", "Section", "Schedule"]} rows={enrolledSubjectRows.map((r) => r.map((c) => c))} />
        <TableLegend />
      </div>
    );
  }

  if (section === "class-schedule") {
    return (
      <div className="space-y-4 sm:space-y-5">
        <SectionHeader title="Class Schedules" subtitle="View your class schedule for the selected semester." />
        <Disclaimer />
        <Toolbar />
        <ScheduleGrid />
      </div>
    );
  }

  if (section === "enrollment-history") {
    return (
      <div className="space-y-4 sm:space-y-5">
        <SectionHeader title="Enrollment History" subtitle="View the history of your enrollment records and documents." />
        <Disclaimer />
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Refresh</div>
        <div className="relative space-y-5 pl-4 sm:pl-10">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200 dark:bg-white/10 sm:left-4" />
          {enrollmentHistoryItems.map(([term, regId, date, gwa, dot]) => (
            <div key={regId} className="relative">
              <span className={`absolute -left-4 top-10 h-4 w-4 rounded-full ring-4 ring-white dark:ring-slate-900 sm:-left-[30px] ${dot}`} />
              <Panel>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">{term}</p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">College of Education Bachelor of Technical Vocational Teacher Education</p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">Registration ID:</span> {regId}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">Registration Date:</span> {date}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">GWA:</span> {gwa}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Available Documents</span>
                  {["COR", "PRE-REG", "SOA"].map((doc) => (
                    <Badge key={`${regId}-${doc}`} variant="outline" className="rounded-full">{doc}</Badge>
                  ))}
                </div>
              </Panel>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === "report-of-grades") {
    return <ReportOfGradesSection />;
  }

  if (section === "academic-evaluation") {
    const groupedEvaluation = evaluationRows.reduce<
      Array<{ term: string; rows: typeof evaluationRows }>
    >((acc, row) => {
      const term = String(row[0]);
      const last = acc[acc.length - 1];
      if (!last || last.term !== term) {
        acc.push({ term, rows: [row] as typeof evaluationRows });
      } else {
        last.rows.push(row);
      }
      return acc;
    }, []);

    return (
      <div className="space-y-4 sm:space-y-5">
        <SectionHeader title="Academic Evaluation" subtitle="Track passed, credited, and pending curriculum subjects." />
        <div className="overflow-hidden rounded-2xl border border-blue-700/50 bg-white shadow-sm dark:border-blue-400/20 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full table-fixed text-sm">
              <thead className="bg-blue-800 text-white">
                <tr>
                  <th className="w-44 px-4 py-3 text-left font-semibold">Year / Term</th>
                  <th className="w-24 px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Course Title</th>
                  <th className="w-44 px-4 py-3 text-left font-semibold">Pre-Req</th>
                  <th className="w-28 px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {groupedEvaluation.map((group, groupIndex) =>
                  group.rows.map((r, rowIndex) => {
                    const status = String(r[4]);
                    const isCredited = status === "Credited";
                    const isPassed = status === "Passed";
                    const rowClass =
                      (groupIndex + rowIndex) % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/70 dark:bg-white/5";
                    const statusTextClass = isCredited
                      ? "text-blue-600 dark:text-blue-300"
                      : isPassed
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-slate-700 dark:text-slate-200";

                    return (
                      <tr
                        key={`${r[0]}-${r[1]}`}
                        className={`${rowClass} border-b border-blue-200/60 dark:border-blue-400/10`}
                      >
                        {rowIndex === 0 && (
                          <td
                            rowSpan={group.rows.length}
                            className="whitespace-pre-line border-r border-blue-200/70 bg-blue-800 px-4 py-3 align-middle font-semibold text-white dark:border-blue-400/10"
                          >
                            {group.term.replace(" - ", " -\n")}
                          </td>
                        )}
                        <td className="px-4 py-3 align-top text-slate-700 dark:text-slate-200">
                          {r[1]}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700 dark:text-slate-200">
                          {r[2]}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-600 dark:text-slate-300">
                          {r[3]}
                        </td>
                        <td className={`px-4 py-3 align-top font-medium ${statusTextClass}`}>
                          {status}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (section === "student-ledger") {
    return (
      <div className="space-y-4 sm:space-y-5">
        <SectionHeader title="Student Ledger" subtitle="View your ledger and print certificates of payment." />
        <Disclaimer />
        <LedgerTable />
      </div>
    );
  }

  return <PlaceholderSection section={section} />;
}
