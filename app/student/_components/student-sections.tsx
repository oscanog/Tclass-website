"use client";

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { ArrowUpDown, Calendar, ClipboardList, Clock3, ListChecks, Printer, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ledgerRows,
  placeholderCards,
  sectionTitle,
  studentProfile,
  type Section,
} from "./student-data";
import {
  getStudentCurriculumEvaluation,
  getStudentEnrolledSubjects,
  getStudentPeriods,
  getStudentPreEnlisted,
} from "./student-portal-cache";

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

const scheduleToneStyles = [
  {
    desktop: "border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(219,234,254,0.90))] text-slate-900 shadow-[0_10px_24px_rgba(59,130,246,0.10)] dark:border-blue-400/70 dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.34),rgba(37,99,235,0.18))] dark:text-white dark:shadow-[0_10px_24px_rgba(37,99,235,0.18)]",
    mobile: "border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(219,234,254,0.94))] text-slate-900 dark:border-blue-300/50 dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.20),rgba(59,130,246,0.10))] dark:text-slate-100",
    accent: "bg-blue-300",
  },
  {
    desktop: "border-blue-200 bg-[linear-gradient(135deg,rgba(243,248,255,0.98),rgba(219,234,254,0.86))] text-slate-900 shadow-[0_10px_24px_rgba(37,99,235,0.10)] dark:border-blue-400/70 dark:bg-[linear-gradient(135deg,rgba(29,78,216,0.32),rgba(59,130,246,0.16))] dark:text-white dark:shadow-[0_10px_24px_rgba(59,130,246,0.16)]",
    mobile: "border-blue-200 bg-[linear-gradient(135deg,rgba(243,248,255,0.98),rgba(219,234,254,0.92))] text-slate-900 dark:border-blue-300/50 dark:bg-[linear-gradient(135deg,rgba(29,78,216,0.20),rgba(59,130,246,0.10))] dark:text-slate-100",
    accent: "bg-blue-300",
  },
  {
    desktop: "border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(191,219,254,0.82))] text-slate-900 shadow-[0_10px_24px_rgba(29,78,216,0.10)] dark:border-blue-400/70 dark:bg-[linear-gradient(135deg,rgba(30,58,138,0.36),rgba(37,99,235,0.18))] dark:text-white dark:shadow-[0_10px_24px_rgba(30,64,175,0.18)]",
    mobile: "border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(191,219,254,0.90))] text-slate-900 dark:border-blue-300/50 dark:bg-[linear-gradient(135deg,rgba(30,58,138,0.22),rgba(37,99,235,0.10))] dark:text-slate-100",
    accent: "bg-blue-300",
  },
  {
    desktop: "border-blue-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(219,234,254,0.84))] text-slate-900 shadow-[0_10px_24px_rgba(37,99,235,0.08)] dark:border-blue-400/70 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.40),rgba(37,99,235,0.18))] dark:text-white dark:shadow-[0_10px_24px_rgba(15,23,42,0.18)]",
    mobile: "border-blue-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(219,234,254,0.90))] text-slate-900 dark:border-blue-300/50 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.24),rgba(37,99,235,0.10))] dark:text-slate-100",
    accent: "bg-blue-300",
  },
];

function scheduleToneFor(code: string) {
  const seed = code
    .trim()
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return scheduleToneStyles[seed % scheduleToneStyles.length];
}

function scheduleQuarterLine(hourValue: number) {
  return Math.round((hourValue - 7) * 4) + 2;
}

function scheduleQuarterSpan(startHour: number, endHour: number) {
  return Math.max(4, Math.round((endHour - startHour) * 4));
}

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
    <Panel className="h-full">
      <div className="flex h-full items-start gap-3 sm:gap-3.5">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">{value || "-"}</p>
          {sub ? <p className="mt-auto pt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{sub}</p> : null}
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
        const res = await getStudentCurriculumEvaluation();
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
      <div className="space-y-3 p-3 sm:hidden">
        {rows.length > 0 ? (
          rows.map((row, i) => (
            <div
              key={`mobile-row-${i}`}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <div className="space-y-2.5">
                {row.map((cell, j) => (
                  <div
                    key={`mobile-row-${i}-cell-${j}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-2.5 last:border-b-0 last:pb-0 dark:border-white/10"
                  >
                    <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {headers[j]}
                    </span>
                    <div className="min-w-0 flex-1 text-right text-sm text-slate-700 dark:text-slate-200">
                      {cell}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
            No records found.
          </div>
        )}
      </div>
      <div className="hidden overflow-x-auto sm:block">
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
    <div className="space-y-1.5">
      <h1 className="text-xl font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{title}</h1>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{subtitle}</p>
    </div>
  );
}

function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [programLabel, setProgramLabel] = useState("");
  const [yearLabel, setYearLabel] = useState("");
  const [todayRows, setTodayRows] = useState<ScheduleBlock[]>([]);
  const [stats, setStats] = useState({
    enrolledSubjects: 0,
    passed: 0,
    failed: 0,
    credited: 0,
    incomplete: 0,
    cumulativeGwa: "",
  });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);

        const [periodRes, evaluationRes] = await Promise.all([
          getStudentPeriods(),
          getStudentCurriculumEvaluation(),
        ]);

        if (!mounted) return;

        const periodsPayload = periodRes as { active_period_id?: number | null };
        const evaluationPayload = evaluationRes as {
          program_key?: string | null;
          next_term?: { year_level?: number | null } | null;
          evaluation?: CurriculumEvaluationApiRow[];
        };

        const activePeriodId = Number(periodsPayload.active_period_id ?? 0);
        const evaluationRows = evaluationPayload.evaluation ?? [];

        const passedRows = evaluationRows.filter((row) => row.result_status === "passed");
        const creditedRows = evaluationRows.filter((row) => row.result_status === "credited");
        const failedRows = evaluationRows.filter((row) => row.result_status === "failed");
        const incompleteRows = evaluationRows.filter(
          (row) => row.result_status === "incomplete" || row.result_status == null
        );

        const gradedRows = evaluationRows.filter(
          (row) => typeof row.grade === "number" && (row.result_status === "passed" || row.result_status === "credited")
        );
        const totalUnits = gradedRows.reduce((sum, row) => sum + Number(row.units ?? 0), 0);
        const gwaNumerator = gradedRows.reduce(
          (sum, row) => sum + Number(row.grade ?? 0) * Number(row.units ?? 0),
          0
        );
        const cumulativeGwa = totalUnits > 0 ? (gwaNumerator / totalUnits).toFixed(4) : "";

        let enrolledRows: EnrolledSubjectRow[] = [];
        if (activePeriodId > 0) {
          const enrolledRes = await getStudentEnrolledSubjects(activePeriodId);
          const enrolledPayload = enrolledRes as { enrolled_subjects?: EnrolledSubjectRow[] };
          enrolledRows = enrolledPayload.enrolled_subjects ?? [];
        }

        const hasEnrollment = enrolledRows.length > 0;
        const todayDayIndex = new Date().getDay();
        const blocks = parseScheduleBlocks(enrolledRows).filter((row) => row.dayIndex === todayDayIndex);

        setProgramLabel(hasEnrollment ? formatProgramLabel(evaluationPayload.program_key) : "");
        setYearLabel(hasEnrollment ? yearLevelLabel(Number(evaluationPayload.next_term?.year_level ?? 0)) : "");
        setTodayRows(blocks);
        setStats({
          enrolledSubjects: enrolledRows.length,
          passed: passedRows.length,
          failed: failedRows.length,
          credited: creditedRows.length,
          incomplete: incompleteRows.length,
          cumulativeGwa,
        });
      } catch {
        if (!mounted) return;
        setProgramLabel("");
        setYearLabel("");
        setTodayRows([]);
        setStats({
          enrolledSubjects: 0,
          passed: 0,
          failed: 0,
          credited: 0,
          incomplete: 0,
          cumulativeGwa: "",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const dashboardStats = [
    { label: "Student Number", value: studentProfile.number, sub: undefined, icon: Calendar },
    { label: "Program", value: programLabel, sub: programLabel ? undefined : "Blank until enrolled", icon: ClipboardList },
    { label: "Year Level", value: yearLabel, sub: yearLabel ? undefined : "Blank until enrolled", icon: ListChecks },
    { label: "Outstanding Balance", value: "", sub: "No ledger API yet", icon: Calendar },
    { label: "Pending Online Payment", value: "", sub: "No payment API yet", icon: Calendar },
    { label: "Cumulative GWA", value: stats.cumulativeGwa, sub: stats.cumulativeGwa ? undefined : "No graded records yet", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <SectionHeader
        title={`Hello, ${studentProfile.name.split(" ")[0]}!`}
        subtitle="Welcome to your student portal. Access your records, schedules, and academic services."
      />

      <div className="grid grid-cols-1 gap-3 sm:auto-rows-fr sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {dashboardStats.map((s) => <Stat key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:auto-rows-fr xl:grid-cols-3">
        <Panel className="h-full">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Enrolled Subjects Statistics</h2>
          <div className="mt-4 space-y-3">
            {[
              ["Enrolled Subjects", String(stats.enrolledSubjects)],
              ["Passed", String(stats.passed)],
              ["Failed", String(stats.failed)],
              ["Credited", String(stats.credited)],
              ["Incomplete", String(stats.incomplete)],
            ].map(([label, total]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{total}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="flex h-full flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Completion Overview</h2>
          <div className="mt-5 flex flex-1 items-center justify-center">
            <div className="relative h-40 w-40 sm:h-52 sm:w-52">
              <div className="absolute inset-0 rounded-full border-[18px] border-blue-500 sm:border-[20px]" />
              <div className="absolute inset-[20px] rounded-full border border-slate-200 bg-white sm:inset-[22px] dark:border-white/10 dark:bg-slate-900" />
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

        <Panel className="flex h-full flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Your Schedule Today</h2>
          <div className="mt-4 flex flex-1 flex-col space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading today&apos;s schedule...</p>
            ) : todayRows.length > 0 ? (
              todayRows.map((row) => (
                <div key={`${row.code}-${row.startHour}`} className="rounded-xl border border-slate-100 px-3 py-3 dark:border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full border border-slate-200 p-1.5 dark:border-white/10">
                      <Clock3 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{row.scheduleText}</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.code}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {[row.section, row.room].filter(Boolean).join(" - ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No class schedule for today.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function LedgerTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="space-y-3 p-3 sm:hidden">
        {ledgerRows.map((r, i) => {
          const isEnding = String(r[0]).startsWith("*** Ending Balance");
          return (
            <div
              key={`ledger-mobile-${i}`}
              className={`rounded-2xl border p-3 ${
                isEnding
                  ? "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
                  : "border-slate-200/80 bg-slate-50/70 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              <div className="space-y-2.5">
                {[
                  ["Academic Year and Term", r[0]],
                  ["Date", r[1]],
                  ["Code", r[2]],
                  ["Reference No.", r[3]],
                  ["Debit", r[4]],
                  ["Credit", r[5]],
                  ["Balance", r[6]],
                  ["Remarks", r[7]],
                  ["Date Posted", r[8]],
                ].map(([label, value]) => (
                  <div
                    key={`${i}-${label}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-2.5 last:border-b-0 last:pb-0 dark:border-white/10"
                  >
                    <span className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {label}
                    </span>
                    <span className="min-w-0 flex-1 text-right text-sm">{String(value || "-")}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto sm:block">
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
        const res = await getStudentCurriculumEvaluation();
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
        <div className="space-y-3 p-3 sm:hidden">
          {groupedRows.flatMap((group) =>
            group.rows.map((r, rowIndex) => (
              <div key={`${group.term}-${r.code}-${rowIndex}-mobile`} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3 dark:border-blue-400/20 dark:bg-blue-500/10">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-200">{group.term}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{r.code}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{r.title}</p>
                  </div>
                  <Badge variant="outline" className={`rounded-full ${remarkTone(r.remark)}`}>
                    {r.remark}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Units</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{r.units}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Grade</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{r.grade}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Pre-requisites</span>
                    <span className="text-right text-slate-900 dark:text-slate-100">{r.preReq}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          {groupedRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
              No curriculum evaluation records found.
            </div>
          ) : null}
        </div>
        <div className="hidden overflow-x-auto sm:block">
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
        <div className="hidden flex-wrap items-center justify-end gap-2 border-t border-blue-200/60 bg-slate-50/70 px-4 py-2.5 text-xs dark:border-blue-400/10 dark:bg-white/5 sm:flex">
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

        const periodRes = await getStudentPeriods();
        const periods = (periodRes as { periods?: Array<{ id: number; name: string }> }).periods ?? [];

        const history = await Promise.all(
          periods.map(async (period) => {
            const [enrolledRes, preRes] = await Promise.all([
              getStudentEnrolledSubjects(period.id),
              getStudentPreEnlisted(period.id),
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
      <div className="relative space-y-4 pl-0 sm:space-y-5 sm:pl-10">
        <div className="absolute bottom-2 left-4 top-2 hidden w-px bg-slate-200 dark:bg-white/10 sm:block" />
        {!loading && !error && items.length === 0 ? (
          <Panel>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No enrollment history found for this account yet.
            </p>
          </Panel>
        ) : null}
        {items.map((item) => (
          <div key={`${item.periodName}-${item.registrationId}`} className="relative">
            <span className={`absolute left-0 top-5 hidden h-4 w-4 rounded-full ring-4 ring-white dark:ring-slate-900 sm:block sm:-left-[30px] ${item.dotClass}`} />
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
        const periodRes = await getStudentPeriods();
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
        const res = await getStudentEnrolledSubjects(Number(periodId));
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
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
        const periodRes = await getStudentPeriods();
        const payload = periodRes as { periods?: EnrolledSubjectPeriod[]; active_period_id?: number | null };
        const nextPeriods = payload.periods ?? [];
        setPeriods(nextPeriods);
        setPeriodId(String(payload.active_period_id ?? nextPeriods[0]?.id ?? ""));

        const evalRes = await getStudentCurriculumEvaluation();
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
        const res = await getStudentEnrolledSubjects(Number(periodId));
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
  const quarterRows = useMemo(() => Array.from({ length: hours.length * 4 }, (_, i) => i), [hours.length]);
  const totalUnits = useMemo(() => rows.reduce((sum, row) => sum + Number(row.units ?? 0), 0), [rows]);
  const sectionLabel = useMemo(() => {
    const value = rows.find((row) => String(row.section ?? "").trim())?.section?.trim();
    return value || "Unassigned";
  }, [rows]);
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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-sky-200/80 bg-[linear-gradient(135deg,#f6fbff_0%,#eaf4ff_52%,#dbeafe_100%)] p-4 text-slate-900 shadow-[0_18px_40px_rgba(59,130,246,0.10)] sm:rounded-[1.75rem] sm:p-5 dark:border-sky-500/20 dark:bg-[linear-gradient(135deg,#08152d_0%,#0b1d44_52%,#0f2f63_100%)] dark:text-white dark:shadow-[0_24px_60px_rgba(2,6,23,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.30),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.24),transparent_36%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.22),transparent_36%)]" />
          <div className="relative flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700/70 dark:text-sky-200/80">Class Record</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Weekly Schedule Board</h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-700/78 dark:text-sky-50/72">
                  Your enrolled subjects are arranged by meeting day and time for the selected academic term.
                </p>
              </div>
              <Badge
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${
                  enrollmentStatus === "official"
                    ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-100 dark:hover:bg-blue-400/15"
                    : enrollmentStatus === "unofficial"
                      ? "border-blue-200 bg-blue-50/70 text-blue-700 hover:bg-blue-50/70 dark:border-blue-300/20 dark:bg-blue-300/10 dark:text-blue-100 dark:hover:bg-blue-300/10"
                      : "border-blue-100 bg-white/75 text-slate-700 hover:bg-white/75 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/10"
                }`}
              >
                {enrollmentStatus === "official"
                  ? "Officially Enrolled"
                  : enrollmentStatus === "unofficial"
                    ? "Unofficially Enrolled"
                    : "Not Enrolled"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3 backdrop-blur-sm dark:border-white/12 dark:bg-white/8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-sky-100/70">Program</p>
                <p className="mt-1 text-lg font-semibold">{programLabel || "Not available yet"}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3 backdrop-blur-sm dark:border-white/12 dark:bg-white/8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-sky-100/70">Year & Section</p>
                <p className="mt-1 text-lg font-semibold">
                  {yearLabel || "No year level"}
                  {sectionLabel !== "Unassigned" ? ` • ${sectionLabel}` : ""}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3 backdrop-blur-sm dark:border-white/12 dark:bg-white/8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-sky-100/70">Subject Load</p>
                <p className="mt-1 text-lg font-semibold">{rows.length} subject{rows.length === 1 ? "" : "s"}</p>
                <p className="text-xs text-slate-500 dark:text-sky-50/70">{totalUnits.toFixed(2)} total units</p>
              </div>
            </div>
          </div>
        </div>

        <Panel className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:from-slate-900 dark:to-slate-900/70">
          <div className="flex h-full flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">AY Term</p>
            <div className="min-w-0">
              <Select value={periodId} onValueChange={setPeriodId} disabled={loading || periods.length === 0}>
                <SelectTrigger
                  aria-label="Select schedule period"
                  className="h-12 rounded-2xl border-slate-300 bg-white/95 shadow-sm dark:border-white/15 dark:bg-slate-950/90"
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
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Weekly Blocks</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{blocks.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Meeting Days</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {new Set(blocks.map((block) => block.dayIndex)).size}
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
      {error ? (
        <Panel>
          <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
        </Panel>
      ) : null}
      <Panel className="overflow-hidden border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-0 shadow-[0_18px_40px_rgba(59,130,246,0.08)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(6,18,44,0.98),rgba(8,24,57,0.98))] dark:shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
        <div className="border-b border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5 dark:border-white/10 dark:text-sky-100/70">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-white/80">Schedule Matrix</span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/30" />
            <span>Drag-free overview by day and time</span>
          </div>
        </div>
        {blocks.length > 0 ? (
          <div className="overflow-x-auto p-3 sm:p-5">
            <div className="relative hidden min-w-[1040px] grid-cols-[68px_repeat(7,minmax(126px,1fr))] grid-rows-[38px_repeat(60,12px)] lg:grid">
              <div className="row-start-1 col-start-1 rounded-tl-2xl border-b border-r border-slate-200 bg-slate-100/80 dark:border-white/10 dark:bg-white/5" />
              {scheduleDays.map((day, i) => (
                <div
                  key={day}
                  className="row-start-1 border-b border-r border-slate-200 bg-white/75 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-sky-50/76"
                  style={{ gridColumnStart: i + 2 }}
                >
                  {day}
                </div>
              ))}
              {hours.map((h, idx) => (
                <div
                  key={`time-${h}`}
                  className="border-b border-r border-slate-200 px-2 py-2 text-center text-xs font-medium text-slate-500 dark:border-white/10 dark:text-sky-100/58"
                  style={{ gridColumnStart: 1, gridRowStart: idx * 4 + 2, gridRowEnd: idx * 4 + 6 }}
                >
                  {h <= 12 ? `${h} AM` : `${h - 12} PM`}
                </div>
              ))}
              {quarterRows.flatMap((quarterIndex) =>
                scheduleDays.map((_, c) => (
                  <div
                    key={`cell-${quarterIndex}-${c}`}
                    className={`border-r border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(239,246,255,0.5))] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] ${
                      quarterIndex % 4 === 3 ? "border-b border-slate-200 dark:border-b dark:border-white/10" : ""
                    }`}
                    style={{ gridColumnStart: c + 2, gridRowStart: quarterIndex + 2 }}
                  />
                )),
              )}
              {blocks.map((b) => {
                const tone = scheduleToneFor(b.code);
                return (
                  <div
                    key={`${b.dayIndex}-${b.code}-${b.startHour}`}
                    className="z-10 p-1"
                    style={{
                      gridColumnStart: b.dayIndex + 2,
                      gridRowStart: Math.max(2, scheduleQuarterLine(b.startHour)),
                      gridRowEnd: `span ${scheduleQuarterSpan(b.startHour, b.endHour)}`,
                    }}
                  >
                    <div
                      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border px-3 py-2 text-[11px] backdrop-blur-sm transition-transform hover:scale-[1.01] ${tone.desktop}`}
                      title={b.scheduleText}
                    >
                      <span className={`mb-2 block h-1.5 w-10 rounded-full ${tone.accent}`} />
                      <p className="font-semibold tracking-[0.02em]">{b.code}</p>
                      <p className="mt-0.5 text-slate-600 dark:text-white/72">{b.section}</p>
                      <p className="mt-auto pt-2 text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-white/50">{b.dayLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-3 lg:hidden">
              {blocks.map((b) => {
                const tone = scheduleToneFor(b.code);
                return (
                  <div
                    key={`${b.dayLabel}-${b.code}-${b.startHour}`}
                    className={`rounded-2xl border p-4 shadow-sm ${tone.mobile}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/62">{b.dayLabel}</p>
                        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{b.code}</p>
                      </div>
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tone.accent}`} />
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-white/78">{b.scheduleText}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-white/58">{b.section}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 md:p-5">
            {scheduleFallbackRows.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-white/76">Scheduled Subjects</h3>
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white/70 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-white/76">
                    {scheduleFallbackRows.length} subject(s)
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {scheduleFallbackRows.map((row) => {
                    const tone = scheduleToneFor(row.code);
                    return (
                      <div
                        key={`sched-card-${row.id}`}
                        className={`rounded-2xl border p-3.5 ${tone.mobile}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{row.code}</p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-white/78">{row.title}</p>
                          </div>
                          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tone.accent}`} />
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                          <Badge className="justify-start border border-slate-200 bg-white/80 text-slate-700 hover:bg-white/80 dark:border-0 dark:bg-white/12 dark:text-white dark:hover:bg-white/12">{row.schedule}</Badge>
                          <Badge variant="outline" className="justify-start rounded-full border-slate-200 bg-transparent text-slate-600 dark:border-white/18 dark:text-white/76">
                            {row.section !== "TBA" ? row.section : `${programLabel} ${yearLabel}`.trim() || "No section yet"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-white/58">
                No schedule found for the selected period.
              </div>
            )}
          </div>
        )}
      </Panel>
      <div className="hidden sm:block">
        <TableLegend />
      </div>
    </div>
  );
}

function PlaceholderSection({ section }: { section: Section }) {
  const cards = (placeholderCards[section as keyof typeof placeholderCards] ?? []) as unknown as Array<{ title: string; desc: string; icon: ElementType }>;
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
