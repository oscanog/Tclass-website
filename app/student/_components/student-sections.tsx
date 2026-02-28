"use client";

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { ArrowUpDown, Calendar, ClipboardList, Clock3, ListChecks, Printer, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import {
  dashboardStats,
  ledgerRows,
  placeholderCards,
  sectionTitle,
  studentProfile,
  todaySchedule,
  type Section,
} from "./student-data";

type RowValue = ReactNode[] | string[];
type CurriculumEvaluationApiRow = {
  id?: number;
  code: string;
  title: string;
  units?: number | null;
  year_level?: number | null;
  semester?: number | null;
  grade?: number | null;
  result_status?: "passed" | "failed" | "incomplete" | "credited" | null;
  prerequisite_code?: string | null;
};

type EvaluationMatrixRow = {
  termLabel: string;
  code: string;
  title: string;
  units: string;
  grade: string;
  remark: string;
  preReq: string;
};

type EnrollmentHistorySubjectRow = {
  id: number;
  status?: "draft" | "unofficial" | "official" | "rejected" | "dropped";
  assessed_at?: string | null;
  decided_at?: string | null;
};

type EnrollmentHistoryItem = {
  periodName: string;
  registrationId: string;
  registrationDate: string;
  statusLabel: string;
  dotClass: string;
  docs: string[];
};

type EnrolledSubjectPeriod = {
  id: number;
  name: string;
  is_active: number;
};

type EnrolledSubjectRow = {
  id: number;
  status: "unofficial" | "official";
  code: string;
  title: string;
  units: number;
  schedule: string | null;
  section: string | null;
};

type ScheduleBlock = {
  dayIndex: number;
  dayLabel: string;
  startHour: number;
  endHour: number;
  code: string;
  room: string;
  scheduleText: string;
  section: string;
};

type CurriculumEvaluationPayload = {
  program_key?: string | null;
  next_term?: { year_level?: number | null; semester?: number | null } | null;
};

const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const semesterLabel = (semester: number) => {
  if (semester === 1) return "1st Sem";
  if (semester === 2) return "2nd Sem";
  if (semester === 3) return "Summer";
  return `Sem ${semester}`;
};

const yearLevelLabel = (year: number) => {
  if (year === 1) return "1st Year";
  if (year === 2) return "2nd Year";
  if (year === 3) return "3rd Year";
  if (year === 4) return "4th Year";
  return `Year ${year}`;
};

const formatTermLabel = (year?: number | null, semester?: number | null) => {
  if (!year || !semester) return "Unassigned Term";
  return `${yearLevelLabel(year)} - ${semesterLabel(semester)}`;
};

const mapApiEvaluationRows = (rows: CurriculumEvaluationApiRow[]): EvaluationMatrixRow[] =>
  [...rows]
    .sort((a, b) => {
      const ay = Number(a.year_level ?? 999);
      const by = Number(b.year_level ?? 999);
      if (ay !== by) return ay - by;
      const as = Number(a.semester ?? 999);
      const bs = Number(b.semester ?? 999);
      if (as !== bs) return as - bs;
      return String(a.code).localeCompare(String(b.code));
    })
    .map((row) => ({
      termLabel: formatTermLabel(row.year_level, row.semester),
      code: row.code,
      title: row.title,
      units: row.units == null ? "-" : Number(row.units).toFixed(2),
      grade: row.grade == null ? "-" : Number(row.grade).toFixed(2),
      remark: row.result_status ? toTitleCase(row.result_status) : "Pending",
      preReq: row.prerequisite_code || "-",
    }));

const scheduleDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const dayTokenMap: Array<{ token: string; dayIndex: number }> = [
  { token: "SUNDAY", dayIndex: 0 },
  { token: "SUN", dayIndex: 0 },
  { token: "MONDAY", dayIndex: 1 },
  { token: "MON", dayIndex: 1 },
  { token: "TUESDAY", dayIndex: 2 },
  { token: "TUE", dayIndex: 2 },
  { token: "TUES", dayIndex: 2 },
  { token: "WEDNESDAY", dayIndex: 3 },
  { token: "WED", dayIndex: 3 },
  { token: "THURSDAY", dayIndex: 4 },
  { token: "THUR", dayIndex: 4 },
  { token: "THU", dayIndex: 4 },
  { token: "FRIDAY", dayIndex: 5 },
  { token: "FRI", dayIndex: 5 },
  { token: "SATURDAY", dayIndex: 6 },
  { token: "SAT", dayIndex: 6 },
];

function parseHour(rawHour: number, minute: number, meridiem: string): number {
  let hour = rawHour % 12;
  if (meridiem.toUpperCase() === "PM") hour += 12;
  return hour + minute / 60;
}

function parseScheduleBlocks(rows: EnrolledSubjectRow[]): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];

  for (const row of rows) {
    const text = (row.schedule ?? "").trim();
    if (!text) continue;

    const upper = text.toUpperCase();
    const fullMeridiemMatch = upper.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/);
    const endMeridiemOnlyMatch = upper.match(/(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/);
    const timeMatch = fullMeridiemMatch ?? endMeridiemOnlyMatch;
    if (!timeMatch) continue;

    const hasFullMeridiem = Boolean(fullMeridiemMatch);
    const startMeridiem = hasFullMeridiem ? timeMatch[3] : timeMatch[5];
    const endMeridiem = hasFullMeridiem ? timeMatch[6] : timeMatch[5];

    const start = parseHour(Number(timeMatch[1]), Number(timeMatch[2] ?? 0), startMeridiem);
    const end = parseHour(Number(timeMatch[hasFullMeridiem ? 4 : 3]), Number(timeMatch[hasFullMeridiem ? 5 : 4] ?? 0), endMeridiem);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;

    const dayIndexes = new Set<number>();

    const compact = upper.replace(/\s+/g, "");
    if (compact.includes("MWF")) {
      dayIndexes.add(1);
      dayIndexes.add(3);
      dayIndexes.add(5);
    }
    if (compact.includes("TTH")) {
      dayIndexes.add(2);
      dayIndexes.add(4);
    }

    const prefix = upper.slice(0, (timeMatch.index ?? 0) + 1);
    const shortTokenMatches = prefix.match(/\b(TH|M|T|W|F|SAT|SUN)\b/g) ?? [];
    for (const token of shortTokenMatches) {
      if (token === "TH") dayIndexes.add(4);
      if (token === "M") dayIndexes.add(1);
      if (token === "T") dayIndexes.add(2);
      if (token === "W") dayIndexes.add(3);
      if (token === "F") dayIndexes.add(5);
      if (token === "SAT") dayIndexes.add(6);
      if (token === "SUN") dayIndexes.add(0);
    }

    for (const mapping of dayTokenMap) {
      if (upper.includes(mapping.token)) dayIndexes.add(mapping.dayIndex);
    }

    if (dayIndexes.size === 0) continue;

    for (const dayIndex of dayIndexes) {
      blocks.push({
        dayIndex,
        dayLabel: scheduleDays[dayIndex] ?? "Unknown",
        startHour: start,
        endHour: end,
        code: row.code,
        room: row.section ?? "-",
        scheduleText: text,
        section: row.section ?? "-",
      });
    }
  }

  return blocks.sort((a, b) => (a.dayIndex === b.dayIndex ? a.startHour - b.startHour : a.dayIndex - b.dayIndex));
}

function formatProgramLabel(programKey?: string | null): string {
  const key = (programKey ?? "").trim().toUpperCase();
  if (!key) return studentProfile.program;
  if (key.includes("INFORMATION_TECHNOLOGY")) return "BSIT";
  if (key.includes("TECHNOLOGY")) return "BSIT";
  return key.replace(/_/g, " ");
}

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

function ReportGradesToolbar({
  selectedTermId,
  onSelectTerm,
  terms,
}: {
  selectedTermId: string;
  onSelectTerm: (termId: string) => void;
  terms: Array<{ id: string; label: string }>;
}) {
  return (
    <Panel className="p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AY Term</span>
          <div className="min-w-0 flex-1 sm:min-w-[20rem] sm:flex-none">
            <Select
              value={selectedTermId}
              onValueChange={onSelectTerm}
            >
              <SelectTrigger
                aria-label="Select academic year and semester"
                className="h-10 rounded-xl border-slate-300 bg-white/95 shadow-sm dark:border-white/15 dark:bg-slate-950/90"
              >
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200/90 dark:border-white/10">
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
  type GradeRow = {
    code: string;
    title: string;
    units: number;
    grade: number | null;
    remark: string;
    yearLevel: number;
    semester: number;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/student/curriculum-evaluation");
        const rows = ((res as { evaluation?: CurriculumEvaluationApiRow[] }).evaluation ?? []).filter(
          (row): row is CurriculumEvaluationApiRow =>
            Boolean(row?.code && row?.title && row?.year_level && row?.semester)
        );

        if (!mounted) return;
        const mapped = rows.map((row) => ({
          code: row.code,
          title: row.title,
          units: Number(row.units ?? 0),
          grade: row.grade == null ? null : Number(row.grade),
          remark: row.result_status ? toTitleCase(row.result_status) : "Unposted",
          yearLevel: Number(row.year_level),
          semester: Number(row.semester),
        }));
        setGradeRows(mapped);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load report of grades.");
        setGradeRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const terms = useMemo(() => {
    const grouped = new Map<string, string>();
    gradeRows.forEach((row) => {
      const id = `${row.yearLevel}-${row.semester}`;
      const label = `${yearLevelLabel(row.yearLevel)} ${semesterLabel(row.semester)}`;
      if (!grouped.has(id)) grouped.set(id, label);
    });

    return [...grouped.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => {
        const [ay, as] = a.id.split("-").map(Number);
        const [by, bs] = b.id.split("-").map(Number);
        if (ay !== by) return by - ay;
        return bs - as;
      });
  }, [gradeRows]);

  useEffect(() => {
    if (terms.length === 0) {
      setSelectedTermId("");
      return;
    }
    if (!selectedTermId || !terms.some((t) => t.id === selectedTermId)) {
      setSelectedTermId(terms[0].id);
    }
  }, [terms, selectedTermId]);

  const selectedRows = useMemo(() => {
    if (!selectedTermId) return [];
    const [yearLevel, semester] = selectedTermId.split("-").map(Number);
    return gradeRows.filter((row) => row.yearLevel === yearLevel && row.semester === semester);
  }, [gradeRows, selectedTermId]);

  const selectedStats = useMemo(() => {
    const subjects = selectedRows.length;
    const unitsEnrolled = selectedRows.reduce((sum, row) => sum + row.units, 0);
    const passedLike = selectedRows.filter((row) => row.remark === "Passed" || row.remark === "Credited");
    const unitsEarned = passedLike.reduce((sum, row) => sum + row.units, 0);
    const gwaNumerator = passedLike.reduce((sum, row) => sum + (row.grade ?? 0) * row.units, 0);
    const gwa = unitsEarned > 0 ? (gwaNumerator / unitsEarned).toFixed(4) : "-";
    return {
      subjects: String(subjects),
      unitsEnrolled: unitsEnrolled.toFixed(2),
      unitsEarned: unitsEarned.toFixed(2),
      gwa,
    };
  }, [selectedRows]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Report of Grades" subtitle="View your report of grades for the selected semester." />
      <Disclaimer />
      <ReportGradesToolbar selectedTermId={selectedTermId} onSelectTerm={setSelectedTermId} terms={terms} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Subjects Enrolled" value={selectedStats.subjects} icon={ClipboardList} />
        <Stat label="Units Enrolled" value={selectedStats.unitsEnrolled} icon={ListChecks} />
        <Stat label="Units Earned" value={selectedStats.unitsEarned} icon={ShieldCheck} />
        <Stat label="General Weighted Average" value={selectedStats.gwa} icon={ListChecks} />
      </div>
      {error ? (
        <Panel>
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </Panel>
      ) : null}
      <Table
        headers={["Code", "Title", "Unit", "Midterm", "Final", "Remarks", "Date Posted"]}
        minWidth="min-w-[1040px]"
        compact
        rows={selectedRows.map((row) => {
          const remarks = row.remark.toLowerCase();
          const isPassed = remarks === "passed";
          const isUnposted = remarks === "unposted" || remarks === "pending";
          return [
            <span key={`${row.code}-code`} className="font-medium text-slate-900 dark:text-slate-100">{row.code}</span>,
            row.title,
            row.units.toFixed(2),
            "-",
            <span key={`${row.code}-final`} className="font-semibold">{row.grade == null ? "-" : row.grade.toFixed(2)}</span>,
            <Badge
              key={`${row.code}-badge`}
              className={`rounded-full px-2 py-0 text-[10px] ${
                isPassed
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : isUnposted
                    ? "bg-slate-500 hover:bg-slate-500"
                    : "bg-blue-600 hover:bg-blue-600"
              }`}
            >
              {row.remark}
            </Badge>,
            "-",
          ];
        })}
      />
      {!loading && !error && selectedRows.length === 0 ? (
        <Panel>
          <p className="text-sm text-slate-600 dark:text-slate-300">No grade records found for this account in the selected term.</p>
        </Panel>
      ) : null}
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

function AcademicEvaluationMatrixSection() {
  const [rows, setRows] = useState<EvaluationMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programLabel, setProgramLabel] = useState<string>(studentProfile.program);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch("/student/curriculum-evaluation");
        const payload = res as { evaluation?: CurriculumEvaluationApiRow[]; program_key?: string | null };
        const apiRows = (payload.evaluation ?? []).filter(
          (row): row is CurriculumEvaluationApiRow => Boolean(row?.code && row?.title)
        );
        if (!mounted) return;
        setRows(mapApiEvaluationRows(apiRows));
        setProgramLabel(formatProgramLabel(payload.program_key));
      } catch (err) {
        if (!mounted) return;
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load curriculum evaluation.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const groupedRows = useMemo(
    () =>
      rows.reduce<Array<{ term: string; rows: EvaluationMatrixRow[] }>>((acc, row) => {
        const last = acc[acc.length - 1];
        if (!last || last.term !== row.termLabel) {
          acc.push({ term: row.termLabel, rows: [row] });
        } else {
          last.rows.push(row);
        }
        return acc;
      }, []),
    [rows]
  );

  const summary = useMemo(() => {
    const total = rows.length;
    const passed = rows.filter((r) => r.remark === "Passed" || r.remark === "Credited").length;
    const failed = rows.filter((r) => r.remark === "Failed").length;
    const unfinished = rows.filter((r) => r.remark === "Incomplete" || r.remark === "Pending").length;
    return { total, passed, failed, unfinished };
  }, [rows]);

  const rowTone = (remark: string) => {
    if (remark === "Failed") return "bg-rose-100/90 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100";
    if (remark === "Incomplete" || remark === "Pending") {
      return "bg-amber-100/90 text-amber-900 dark:bg-amber-900/25 dark:text-amber-100";
    }
    return "";
  };

  const remarkTone = (remark: string) => {
    if (remark === "Passed") return "text-emerald-700 dark:text-emerald-300";
    if (remark === "Credited") return "text-blue-700 dark:text-blue-300";
    if (remark === "Failed") return "text-rose-700 dark:text-rose-300";
    if (remark === "Incomplete" || remark === "Pending") return "text-amber-700 dark:text-amber-300";
    return "text-slate-700 dark:text-slate-200";
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Academic Evaluation" subtitle="Curriculum evaluation in SIAS-style format (modern portal shell)." />

      <div className="rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Curriculum</p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
          <span className="font-semibold">{programLabel}</span> curriculum evaluation matrix grouped by year/term.
        </p>
      </div>
      {error ? (
        <Panel>
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </Panel>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-full">
          Count: {summary.total}
        </Badge>
        <Badge className="rounded-full bg-emerald-600">Passed/Credited: {summary.passed}</Badge>
        <Badge className="rounded-full bg-rose-600">Failed: {summary.failed}</Badge>
        <Badge className="rounded-full bg-amber-600 text-white">Unfinished: {summary.unfinished}</Badge>
        {loading ? <span className="text-xs text-slate-500 dark:text-slate-400">Loading latest evaluation...</span> : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-blue-700/50 bg-white shadow-sm dark:border-blue-400/20 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full table-fixed text-sm">
            <thead className="sticky top-0 z-10 bg-blue-800 text-white">
              <tr>
                <th className="w-24 px-4 py-3 text-left font-semibold">Code</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="w-20 px-4 py-3 text-left font-semibold">Units</th>
                <th className="w-20 px-4 py-3 text-left font-semibold">Grade</th>
                <th className="w-32 px-4 py-3 text-left font-semibold">Remark</th>
                <th className="w-40 px-4 py-3 text-left font-semibold">Pre-requisites</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.flatMap((group, groupIndex) => {
                const termHeader = (
                  <tr
                    key={`${group.term}-${groupIndex}-header`}
                    className="border-b border-blue-200/60 dark:border-blue-400/10"
                  >
                    <td
                      colSpan={6}
                      className="bg-blue-700 px-4 py-2 text-sm font-semibold text-white dark:bg-blue-700/90"
                    >
                      {group.term}
                    </td>
                  </tr>
                );

                const termRows = group.rows.map((r, rowIndex) => {
                  const zebra =
                    (groupIndex + rowIndex) % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 dark:bg-white/5";
                  return (
                    <tr
                      key={`${group.term}-${r.code}-${rowIndex}`}
                      className={`${zebra} ${rowTone(r.remark)} border-b border-blue-200/60 dark:border-blue-400/10`}
                    >
                      <td className="px-4 py-2.5 align-top font-medium tabular-nums">{r.code}</td>
                      <td className="px-4 py-2.5 align-top">{r.title}</td>
                      <td className="px-4 py-2.5 align-top tabular-nums">{r.units}</td>
                      <td className="px-4 py-2.5 align-top tabular-nums">{r.grade}</td>
                      <td className={`px-4 py-2.5 align-top font-semibold ${remarkTone(r.remark)}`}>{r.remark}</td>
                      <td className="px-4 py-2.5 align-top">{r.preReq}</td>
                    </tr>
                  );
                });

                return [termHeader, ...termRows];
              })}
              {groupedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No curriculum evaluation records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-blue-200/60 bg-slate-50/70 px-4 py-2.5 text-xs dark:border-blue-400/10 dark:bg-white/5">
          <span className="text-slate-600 dark:text-slate-300">Count: {summary.total}</span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-700 dark:text-emerald-300">Passed/Credited: {summary.passed}</span>
          <span className="text-slate-400">|</span>
          <span className="text-rose-700 dark:text-rose-300">Failed: {summary.failed}</span>
          <span className="text-slate-400">|</span>
          <span className="text-amber-700 dark:text-amber-300">Unfinished: {summary.unfinished}</span>
        </div>
      </div>
    </div>
  );
}

function EnrollmentHistorySection() {
  const [items, setItems] = useState<EnrollmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const periodRes = await apiFetch("/student/periods");
        const periods = (periodRes as { periods?: Array<{ id: number; name: string }> }).periods ?? [];

        const history = await Promise.all(
          periods.map(async (period) => {
            const [enrolledRes, preRes] = await Promise.all([
              apiFetch(`/student/enrollments/enrolled-subjects?period_id=${period.id}`),
              apiFetch(`/student/enrollments/pre-enlisted?period_id=${period.id}`),
            ]);

            const enrolledPayload = enrolledRes as {
              enrollment_status?: "not_enrolled" | "unofficial" | "official";
              enrolled_subjects?: EnrollmentHistorySubjectRow[];
            };
            const prePayload = preRes as { pre_enlisted?: EnrollmentHistorySubjectRow[] };

            const enrolledRows = enrolledPayload.enrolled_subjects ?? [];
            const preRows = prePayload.pre_enlisted ?? [];
            if (enrolledRows.length === 0 && preRows.length === 0) return null;

            const hasOfficial = enrolledRows.some((row) => row.status === "official");
            const hasUnofficial = enrolledRows.some((row) => row.status === "unofficial");
            const statusLabel = hasOfficial ? "Officially Enrolled" : hasUnofficial ? "Unofficially Enrolled" : "Draft";

            const dateCandidates = [
              ...enrolledRows.map((row) => row.decided_at).filter(Boolean),
              ...enrolledRows.map((row) => row.assessed_at).filter(Boolean),
            ] as string[];
            const latestDate = dateCandidates.length > 0 ? new Date(dateCandidates.sort().at(-1) ?? "").toLocaleString() : "-";

            const sourceRows = enrolledRows.length > 0 ? enrolledRows : preRows;
            const registrationId = sourceRows[0]?.id ? String(sourceRows[0].id) : "-";

            return {
              periodName: period.name,
              registrationId,
              registrationDate: latestDate,
              statusLabel,
              dotClass: hasOfficial ? "bg-emerald-500" : hasUnofficial ? "bg-amber-500" : "bg-blue-500",
              docs: hasOfficial ? ["COR", "PRE-REG", "SOA"] : ["PRE-REG", "SOA"],
            } satisfies EnrollmentHistoryItem;
          })
        );

        const normalized = history.filter((item): item is EnrollmentHistoryItem => item !== null);
        setItems(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load enrollment history.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Enrollment History" subtitle="View the history of your enrollment records and documents." />
      <Disclaimer />
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Refresh</div>
      {loading ? (
        <Panel>
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading enrollment history...</p>
        </Panel>
      ) : null}
      {error ? (
        <Panel>
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </Panel>
      ) : null}
      <div className="relative space-y-5 pl-4 sm:pl-10">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200 dark:bg-white/10 sm:left-4" />
        {!loading && !error && items.length === 0 ? (
          <Panel>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No enrollment history found for this account yet.
            </p>
          </Panel>
        ) : null}
        {items.map((item) => (
          <div key={`${item.periodName}-${item.registrationId}`} className="relative">
            <span className={`absolute -left-4 top-10 h-4 w-4 rounded-full ring-4 ring-white dark:ring-slate-900 sm:-left-[30px] ${item.dotClass}`} />
            <Panel>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">{item.periodName}</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{item.statusLabel}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Registration ID:</span> {item.registrationId}</p>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Registration Date:</span> {item.registrationDate}</p>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Status:</span> {item.statusLabel}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Available Documents</span>
                {item.docs.map((doc) => (
                  <Badge key={`${item.registrationId}-${doc}`} variant="outline" className="rounded-full">{doc}</Badge>
                ))}
              </div>
            </Panel>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnrolledSubjectsSection() {
  const [periods, setPeriods] = useState<EnrolledSubjectPeriod[]>([]);
  const [periodId, setPeriodId] = useState<string>("");
  const [rows, setRows] = useState<EnrolledSubjectRow[]>([]);
  const [status, setStatus] = useState<"not_enrolled" | "unofficial" | "official">("not_enrolled");
  const [totalUnits, setTotalUnits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const periodRes = await apiFetch("/student/periods");
        const payload = periodRes as { periods?: EnrolledSubjectPeriod[]; active_period_id?: number | null };
        const nextPeriods = payload.periods ?? [];
        setPeriods(nextPeriods);
        setPeriodId(String(payload.active_period_id ?? nextPeriods[0]?.id ?? ""));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load periods.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    if (!periodId) return;
    const run = async () => {
      try {
        const res = await apiFetch(`/student/enrollments/enrolled-subjects?period_id=${periodId}`);
        const payload = res as {
          enrollment_status?: "not_enrolled" | "unofficial" | "official";
          enrolled_subjects?: EnrolledSubjectRow[];
          total_units?: number;
        };
        setRows(payload.enrolled_subjects ?? []);
        setStatus(payload.enrollment_status ?? "not_enrolled");
        setTotalUnits(Number(payload.total_units ?? 0));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load enrolled subjects.");
        setRows([]);
        setStatus("not_enrolled");
        setTotalUnits(0);
      }
    };
    void run();
  }, [periodId]);

  const sectionValue = useMemo(() => {
    const value = rows.find((row) => row.section)?.section?.trim();
    return value && value.length > 0 ? value : "-";
  }, [rows]);

  const statusLabel = status === "official" ? "Officially Enrolled" : status === "unofficial" ? "Unofficially Enrolled" : "Not Enrolled";

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Enrolled Subjects" subtitle="View your past or currently enrolled subjects." />
      <Disclaimer />
      <Panel className="p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AY Term</span>
            <div className="min-w-0 flex-1 sm:min-w-[20rem] sm:flex-none">
              <Select value={periodId} onValueChange={setPeriodId} disabled={loading || periods.length === 0}>
                <SelectTrigger
                  aria-label="Select enrollment period"
                  className="h-10 rounded-xl border-slate-300 bg-white/95 shadow-sm dark:border-white/15 dark:bg-slate-950/90"
                >
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/90 dark:border-white/10">
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={String(period.id)}>
                      {period.name}{period.is_active ? " (Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Badge
            className={`rounded-full px-2 py-0 text-[10px] ${
              status === "official"
                ? "bg-emerald-600 hover:bg-emerald-600"
                : status === "unofficial"
                  ? "bg-amber-600 hover:bg-amber-600"
                  : "bg-slate-500 hover:bg-slate-500"
            }`}
          >
            {statusLabel}
          </Badge>
        </div>
      </Panel>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Subjects Enrolled" value={String(rows.length)} icon={ClipboardList} />
        <Stat label="Units Enrolled" value={totalUnits.toFixed(2)} icon={ListChecks} />
        <Stat label="Section" value={sectionValue} icon={Calendar} />
      </div>
      {error ? (
        <Panel>
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </Panel>
      ) : null}
      <Table
        headers={["Code", "Title", "Unit", "Section", "Schedule"]}
        rows={rows.map((row) => [row.code, row.title, Number(row.units).toFixed(2), row.section ?? "-", row.schedule ?? "-"])}
      />
      {!loading && rows.length === 0 ? (
        <Panel>
          <p className="text-sm text-slate-600 dark:text-slate-300">No enrolled subjects found for the selected period.</p>
        </Panel>
      ) : null}
    </div>
  );
}

function ClassScheduleSection() {
  const [periods, setPeriods] = useState<EnrolledSubjectPeriod[]>([]);
  const [periodId, setPeriodId] = useState<string>("");
  const [rows, setRows] = useState<EnrolledSubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programLabel, setProgramLabel] = useState<string>(studentProfile.program);
  const [yearLabel, setYearLabel] = useState<string>(studentProfile.year);
  const [enrollmentStatus, setEnrollmentStatus] = useState<"not_enrolled" | "unofficial" | "official">("not_enrolled");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const periodRes = await apiFetch("/student/periods");
        const payload = periodRes as { periods?: EnrolledSubjectPeriod[]; active_period_id?: number | null };
        const nextPeriods = payload.periods ?? [];
        setPeriods(nextPeriods);
        setPeriodId(String(payload.active_period_id ?? nextPeriods[0]?.id ?? ""));

        const evalRes = await apiFetch("/student/curriculum-evaluation");
        const evalPayload = evalRes as CurriculumEvaluationPayload;
        setProgramLabel(formatProgramLabel(evalPayload.program_key));
        const nextYear = Number(evalPayload.next_term?.year_level ?? 0);
        if (Number.isFinite(nextYear) && nextYear > 1) {
          const currentYear = nextYear - 1;
          setYearLabel(
            currentYear === 1 ? "1st Year"
              : currentYear === 2 ? "2nd Year"
              : currentYear === 3 ? "3rd Year"
              : currentYear === 4 ? "4th Year"
              : `Year ${currentYear}`
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load periods.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    if (!periodId) return;
    const run = async () => {
      try {
        const res = await apiFetch(`/student/enrollments/enrolled-subjects?period_id=${periodId}`);
        const payload = res as {
          enrolled_subjects?: EnrolledSubjectRow[];
          enrollment_status?: "not_enrolled" | "unofficial" | "official";
        };
        setRows(payload.enrolled_subjects ?? []);
        setEnrollmentStatus(payload.enrollment_status ?? "not_enrolled");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load class schedules.");
        setRows([]);
        setEnrollmentStatus("not_enrolled");
      }
    };
    void run();
  }, [periodId]);

  const blocks = useMemo(() => parseScheduleBlocks(rows), [rows]);
  const hours = useMemo(() => Array.from({ length: 15 }, (_, i) => 7 + i), []);
  const scheduleFallbackRows = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        code: row.code,
        title: row.title,
        schedule: (row.schedule ?? "").trim() || "TBA",
        section: (row.section ?? "").trim() || "TBA",
      })),
    [rows]
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader title="Class Schedules" subtitle="View your class schedule for the selected semester." />
      <Disclaimer />
      <Panel className="p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AY Term</span>
            <div className="min-w-0 flex-1 sm:min-w-[20rem] sm:flex-none">
              <Select value={periodId} onValueChange={setPeriodId} disabled={loading || periods.length === 0}>
                <SelectTrigger
                  aria-label="Select schedule period"
                  className="h-10 rounded-xl border-slate-300 bg-white/95 shadow-sm dark:border-white/15 dark:bg-slate-950/90"
                >
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/90 dark:border-white/10">
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={String(period.id)}>
                      {period.name}{period.is_active ? " (Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Badge
            className={`rounded-full px-2 py-0 text-[10px] ${
              enrollmentStatus === "official"
                ? "bg-emerald-600 hover:bg-emerald-600"
                : enrollmentStatus === "unofficial"
                  ? "bg-amber-600 hover:bg-amber-600"
                  : "bg-slate-500 hover:bg-slate-500"
            }`}
          >
            {enrollmentStatus === "official"
              ? "Officially Enrolled"
              : enrollmentStatus === "unofficial"
                ? "Unofficially Enrolled"
                : "Not Enrolled"}
          </Badge>
        </div>
      </Panel>
      {error ? (
        <Panel>
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </Panel>
      ) : null}
      <Panel className="p-0">
        {blocks.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="relative hidden min-w-[980px] grid-cols-[56px_repeat(7,minmax(120px,1fr))] grid-rows-[30px_repeat(15,44px)] lg:grid">
              <div className="row-start-1 col-start-1 border-b border-r border-slate-200/80 bg-slate-50 dark:border-white/10 dark:bg-white/5" />
              {scheduleDays.map((day, i) => (
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
                scheduleDays.map((_, c) => (
                  <div
                    key={`cell-${h}-${c}`}
                    className="border-b border-r border-slate-200/60 dark:border-white/10"
                    style={{ gridColumnStart: c + 2, gridRowStart: r + 2 }}
                  />
                )),
              )}
              {blocks.map((b) => (
                <div
                  key={`${b.dayIndex}-${b.code}-${b.startHour}`}
                  className="z-10 m-0.5 rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-[11px] shadow-sm dark:border-blue-400/40 dark:bg-blue-500/10"
                  style={{
                    gridColumnStart: b.dayIndex + 2,
                    gridRowStart: Math.max(2, Math.floor(b.startHour) - 7 + 2),
                    gridRowEnd: Math.max(3, Math.ceil(b.endHour) - 7 + 2),
                  }}
                  title={b.scheduleText}
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{b.code}</p>
                  <p className="text-slate-600 dark:text-slate-300">{b.section}</p>
                  <p className="text-slate-600 dark:text-slate-300">{b.scheduleText}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {blocks.map((b) => (
                <div key={`${b.dayLabel}-${b.code}-${b.startHour}`} className="rounded-xl border border-blue-300 bg-blue-50 p-3 dark:border-blue-400/30 dark:bg-blue-500/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{b.dayLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{b.code}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{b.scheduleText}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{b.section}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 md:p-5">
            {scheduleFallbackRows.length > 0 ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Scheduled Subjects</h3>
                  <Badge variant="outline" className="rounded-full">{scheduleFallbackRows.length} subject(s)</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {scheduleFallbackRows.map((row) => (
                    <div
                      key={`sched-card-${row.id}`}
                      className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-white/10 dark:from-slate-900 dark:to-slate-900/60"
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.code} - {row.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className="bg-blue-600 hover:bg-blue-600">{row.schedule}</Badge>
                        <Badge variant="outline" className="rounded-full">
                          {row.section !== "TBA" ? row.section : `${programLabel} - ${yearLabel}`}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {row.section !== "TBA" ? `Section: ${row.section}` : "No section assigned yet"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300/80 px-3 py-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                No schedule found for the selected period.
              </div>
            )}
          </div>
        )}
      </Panel>
      <TableLegend />
    </div>
  );
}

function PlaceholderSection({ section }: { section: Section }) {
  const cards = placeholderCards[section as keyof typeof placeholderCards] ?? [];
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
        {cards.length === 0 ? (
          <Panel className="md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This section is not available in the current shell view. Use the dedicated page route instead.
            </p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

export function SectionContent({ section }: { section: Section }) {
  if (section === "home") return <HomeContent />;

  if (section === "enrolled-subjects") {
    return <EnrolledSubjectsSection />;
  }

  if (section === "class-schedule") {
    return <ClassScheduleSection />;
  }

  if (section === "enrollment-history") {
    return <EnrollmentHistorySection />;
  }

  if (section === "report-of-grades") {
    return <ReportOfGradesSection />;
  }

  if (section === "academic-evaluation") {
    return <AcademicEvaluationMatrixSection />;
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
