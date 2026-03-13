"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FilePlus2 } from "lucide-react";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REQUIRED_HEADERS = [
  "first_name",
  "last_name",
  "email",
  "course",
  "year_level",
  "gender",
  "student_id",
] as const;

type YearScope = "all" | "1" | "2" | "3" | "4";
type GeneratorScenario = "valid_only" | "invalid_only" | "mixed" | "full_matrix";
type HeaderKey = (typeof REQUIRED_HEADERS)[number];
type CsvStudentRow = Record<HeaderKey, string>;
type NameSeed = { first: string; last: string };
type InvalidCase =
  | "missing_first_name"
  | "missing_last_name"
  | "missing_email"
  | "missing_course"
  | "missing_year_level"
  | "missing_gender"
  | "missing_student_id"
  | "invalid_year_level"
  | "invalid_gender"
  | "unknown_course"
  | "multi_error";

const YEAR_OPTIONS: Array<{ value: YearScope; label: string }> = [
  { value: "all", label: "All years" },
  { value: "1", label: "1st year" },
  { value: "2", label: "2nd year" },
  { value: "3", label: "3rd year" },
  { value: "4", label: "4th year" },
];

const SCENARIO_OPTIONS: Array<{ value: GeneratorScenario; label: string; description: string }> = [
  { value: "valid_only", label: "Valid only", description: "All rows should validate." },
  { value: "invalid_only", label: "Invalid only", description: "All rows intentionally fail validation." },
  { value: "mixed", label: "Mixed", description: "Blend valid and invalid rows." },
  { value: "full_matrix", label: "Full matrix", description: "Includes every invalid case + valid controls." },
];

const INVALID_CASES: InvalidCase[] = [
  "missing_first_name",
  "missing_last_name",
  "missing_email",
  "missing_course",
  "missing_year_level",
  "missing_gender",
  "missing_student_id",
  "invalid_year_level",
  "invalid_gender",
  "unknown_course",
  "multi_error",
];

const FALLBACK_COURSES = [
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Computer Science",
  "Bachelor of Technical Vocational Teacher Education",
  "Bachelor of Elementary Education",
  "Bachelor of Science in Business Administration",
  "Bachelor of Science in Hospitality Management",
  "3-Year Diploma in ICT",
  "Housekeeping NCII",
  "Health Care Services NCII",
];

const FIRST_NAMES = [
  "Alyssa",
  "Bianca",
  "Carlo",
  "Darren",
  "Elijah",
  "Faith",
  "Gabriel",
  "Hannah",
  "Isabel",
  "Jared",
  "Katrina",
  "Lance",
  "Mira",
  "Noel",
  "Olivia",
  "Paolo",
  "Queenie",
  "Rafael",
  "Sophia",
  "Tyler",
  "Uma",
  "Vince",
  "Wendy",
  "Xavier",
  "Yanna",
  "Zane",
];

const LAST_NAMES = [
  "Aguilar",
  "Bautista",
  "Castro",
  "DelosSantos",
  "Espino",
  "Flores",
  "Garcia",
  "Hernandez",
  "Ibarra",
  "Jimenez",
  "Lopez",
  "Mendoza",
  "Navarro",
  "Ortega",
  "Perez",
  "Quinto",
  "Reyes",
  "Santos",
  "Torres",
  "Uy",
  "Valdez",
  "Wong",
  "Yu",
  "Zamora",
];

const escapeCsv = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, "\"\"")}"` : value;

const isLocalCsvGeneratorEnabled = () =>
  (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase() === "local";

function buildRows(params: {
  yearScope: YearScope;
  scenario: GeneratorScenario;
  count: number;
  mixedInvalidPercent: number;
  courses: string[];
  names: NameSeed[];
}): { rows: CsvStudentRow[]; effectiveCount: number } {
  const { yearScope, scenario, count, mixedInvalidPercent, courses, names } = params;
  const coursePool = courses.length > 0 ? courses : FALLBACK_COURSES;
  const namePool = names.length > 0 ? names : [];
  let seed = Date.now() % 100000;

  const buildValidRow = (): CsvStudentRow => {
    seed += 1;
    const picked = namePool[seed % namePool.length];
    const firstName = picked?.first || FIRST_NAMES[seed % FIRST_NAMES.length] || "Student";
    const lastName = picked?.last || LAST_NAMES[(seed * 3) % LAST_NAMES.length] || "Sample";
    const suffix = String(100000 + seed);
    const yearLevel = yearScope === "all" ? String((seed % 4) + 1) : yearScope;

    return {
      first_name: firstName,
      last_name: lastName,
      email: `${firstName}.${lastName}.${suffix}@dryrun.local`.toLowerCase(),
      course: coursePool[seed % coursePool.length] ?? FALLBACK_COURSES[0],
      year_level: yearLevel,
      gender: seed % 2 === 0 ? "Male" : "Female",
      student_id: `DRY${suffix}`,
    };
  };

  const buildInvalidRow = (invalidCase: InvalidCase): CsvStudentRow => {
    const row = buildValidRow();
    if (invalidCase === "missing_first_name") row.first_name = "";
    if (invalidCase === "missing_last_name") row.last_name = "";
    if (invalidCase === "missing_email") row.email = "";
    if (invalidCase === "missing_course") row.course = "";
    if (invalidCase === "missing_year_level") row.year_level = "";
    if (invalidCase === "missing_gender") row.gender = "";
    if (invalidCase === "missing_student_id") row.student_id = "";
    if (invalidCase === "invalid_year_level") row.year_level = "7th";
    if (invalidCase === "invalid_gender") row.gender = "Unknown";
    if (invalidCase === "unknown_course") row.course = "Program Not In Catalog";
    if (invalidCase === "multi_error") {
      row.first_name = "";
      row.course = "Program Not In Catalog";
      row.year_level = "0";
      row.gender = "X";
      row.student_id = "";
    }
    return row;
  };

  if (scenario === "valid_only") {
    return { rows: Array.from({ length: count }, () => buildValidRow()), effectiveCount: count };
  }

  if (scenario === "invalid_only") {
    const rows = Array.from({ length: count }, (_, index) => buildInvalidRow(INVALID_CASES[index % INVALID_CASES.length]));
    return { rows, effectiveCount: count };
  }

  if (scenario === "mixed") {
    const invalidCount = Math.max(1, Math.min(count - 1, Math.round(count * (mixedInvalidPercent / 100))));
    const validCount = count - invalidCount;
    const rows = [
      ...Array.from({ length: validCount }, () => buildValidRow()),
      ...Array.from({ length: invalidCount }, (_, index) => buildInvalidRow(INVALID_CASES[index % INVALID_CASES.length])),
    ];
    rows.sort(() => Math.random() - 0.5);
    return { rows, effectiveCount: count };
  }

  const minimum = INVALID_CASES.length + 1;
  const effectiveCount = Math.max(count, minimum);
  const rows: CsvStudentRow[] = [buildValidRow(), ...INVALID_CASES.map((item) => buildInvalidRow(item))];
  const remaining = effectiveCount - rows.length;
  for (let i = 0; i < remaining; i += 1) {
    rows.push(i % 2 === 0 ? buildValidRow() : buildInvalidRow(INVALID_CASES[i % INVALID_CASES.length]));
  }
  return { rows, effectiveCount };
}

export function AdminCsvGeneratorTrigger({
  className,
}: {
  className?: string;
}) {
  const enabled = isLocalCsvGeneratorEnabled();
  const [open, setOpen] = useState(false);
  const [yearScope, setYearScope] = useState<YearScope>("all");
  const [scenario, setScenario] = useState<GeneratorScenario>("mixed");
  const [rowCount, setRowCount] = useState("50");
  const [mixedInvalidPercent, setMixedInvalidPercent] = useState("30");
  const [knownCourses, setKnownCourses] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [nameSeeds, setNameSeeds] = useState<NameSeed[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);

  const loadCourses = useCallback(async () => {
    if (!enabled) return;
    setLoadingCourses(true);
    try {
      const payload = (await apiFetch("/admin/programs")) as { programs?: Array<{ title?: string; category?: string }> };
      const items = new Set<string>();
      for (const program of payload.programs ?? []) {
        if (program.title?.trim()) items.add(program.title.trim());
        if (program.category?.trim()) items.add(program.category.trim());
      }
      setKnownCourses(Array.from(items));
    } catch {
      setKnownCourses([]);
      toast.error("Program catalog unavailable, generator will use fallback course list.");
    } finally {
      setLoadingCourses(false);
    }
  }, [enabled]);

  const loadNameSeeds = useCallback(async () => {
    if (!enabled) return;
    setLoadingNames(true);
    try {
      const roles = ["student", "faculty", "admin"] as const;
      const results = await Promise.allSettled(
        roles.map((role) =>
          apiFetch(`/admin/users?role=${role}`) as Promise<{ users?: Array<{ name?: string | null }> }>
        ),
      );

      const unique = new Map<string, NameSeed>();
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        for (const user of result.value.users ?? []) {
          const raw = String(user.name ?? "").trim();
          if (!raw) continue;
          const compact = raw.replace(/\s+/g, " ").trim();
          const parts = compact.split(" ").filter(Boolean);
          if (parts.length < 2) continue;
          const first = parts[0] ?? "";
          const last = parts[parts.length - 1] ?? "";
          if (!first || !last) continue;
          const key = `${first.toLowerCase()}|${last.toLowerCase()}`;
          if (!unique.has(key)) unique.set(key, { first, last });
        }
      }

      setNameSeeds(Array.from(unique.values()));
      if (unique.size === 0) {
        toast("No local DB names found; using curated fallback names.");
      }
    } catch {
      setNameSeeds([]);
      toast.error("Unable to load local name seeds; using fallback realistic names.");
    } finally {
      setLoadingNames(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!open || knownCourses.length > 0 || loadingCourses) return;
    void loadCourses();
  }, [knownCourses.length, loadCourses, loadingCourses, open]);

  useEffect(() => {
    if (!open || nameSeeds.length > 0 || loadingNames) return;
    void loadNameSeeds();
  }, [loadNameSeeds, loadingNames, nameSeeds.length, open]);

  const summary = useMemo(() => {
    const parsedCount = Number.parseInt(rowCount, 10);
    if (!Number.isFinite(parsedCount) || parsedCount < 1) {
      return { valid: 0, invalid: 0, effectiveCount: 0 };
    }
    if (scenario === "valid_only") return { valid: parsedCount, invalid: 0, effectiveCount: parsedCount };
    if (scenario === "invalid_only") return { valid: 0, invalid: parsedCount, effectiveCount: parsedCount };
    if (scenario === "mixed") {
      const percent = Number.parseInt(mixedInvalidPercent, 10);
      const invalid = Math.max(1, Math.min(parsedCount - 1, Math.round(parsedCount * ((Number.isFinite(percent) ? percent : 30) / 100))));
      return { valid: parsedCount - invalid, invalid, effectiveCount: parsedCount };
    }
    const effectiveCount = Math.max(parsedCount, INVALID_CASES.length + 1);
    return { valid: Math.max(1, Math.ceil((effectiveCount - INVALID_CASES.length) / 2)), invalid: effectiveCount - Math.max(1, Math.ceil((effectiveCount - INVALID_CASES.length) / 2)), effectiveCount };
  }, [mixedInvalidPercent, rowCount, scenario]);

  const handleDownload = useCallback(() => {
    const count = Number.parseInt(rowCount, 10);
    if (!Number.isFinite(count) || count < 1 || count > 50000) {
      toast.error("Rows must be a whole number from 1 to 50000.");
      return;
    }

    const invalidPercent = Number.parseInt(mixedInvalidPercent, 10);
    if (scenario === "mixed" && (!Number.isFinite(invalidPercent) || invalidPercent < 1 || invalidPercent > 99)) {
      toast.error("Mixed invalid percent must be from 1 to 99.");
      return;
    }

    const { rows, effectiveCount } = buildRows({
      yearScope,
      scenario,
      count,
      mixedInvalidPercent: Number.isFinite(invalidPercent) ? invalidPercent : 30,
      courses: knownCourses,
      names: nameSeeds,
    });

    const header = REQUIRED_HEADERS.join(",");
    const body = rows
      .map((row) => REQUIRED_HEADERS.map((column) => escapeCsv(row[column] ?? "")).join(","))
      .join("\n");

    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const scopeName = yearScope === "all" ? "all-years" : `year-${yearScope}`;
    anchor.href = url;
    anchor.download = `students-${scopeName}-${scenario.replace("_", "-")}-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    const message = scenario === "full_matrix" && effectiveCount !== count
      ? `Downloaded ${effectiveCount} rows (full matrix minimum applied).`
      : `Downloaded ${effectiveCount} rows.`;
    toast.success(`${message} Saved via browser default Downloads behavior.`);
    setOpen(false);
  }, [knownCourses, mixedInvalidPercent, nameSeeds, rowCount, scenario, yearScope]);

  if (!enabled) return null;

  return (
    <>
      <Button type="button" variant="outline" className={className} onClick={() => setOpen(true)}>
        <FilePlus2 className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Gen CSV</span>
        <span className="sm:hidden">Gen</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[92vh] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden border border-slate-200 bg-white p-0 md:h-[88vh] md:w-[94vw] dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-200 bg-white/95 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-slate-900 dark:text-slate-100">Generate Student CSV</DialogTitle>
              <Badge className="border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Local Only</Badge>
              <Badge className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                {loadingCourses ? "Loading courses..." : `${knownCourses.length || FALLBACK_COURSES.length} courses`}
              </Badge>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                {loadingNames ? "Loading names..." : `${nameSeeds.length || FIRST_NAMES.length} names`}
              </Badge>
            </div>
            <DialogDescription>
              Generates downloadable CSV fixtures for dry-run testing. Browser controls final download folder.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <section className="space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Year scope</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {YEAR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setYearScope(option.value)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left text-sm",
                      yearScope === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Scenario</Label>
                <Select value={scenario} onValueChange={(value) => setScenario(value as GeneratorScenario)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENARIO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {SCENARIO_OPTIONS.find((item) => item.value === scenario)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Rows to generate</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={50000}
                  value={rowCount}
                  onChange={(event) => setRowCount(event.target.value)}
                  placeholder="50"
                />
                {scenario === "mixed" ? (
                  <div className="space-y-2">
                    <Label>Mixed invalid %</Label>
                    <Input
                      inputMode="numeric"
                      type="number"
                      min={1}
                      max={99}
                      value={mixedInvalidPercent}
                      onChange={(event) => setMixedInvalidPercent(event.target.value)}
                      placeholder="30"
                    />
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Summary</p>
              <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">Total: {summary.effectiveCount}</p>
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">Valid target: {summary.valid}</p>
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">Invalid target: {summary.invalid}</p>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Headers: {REQUIRED_HEADERS.join(", ")}</p>
            </section>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white/95 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Download path uses your browser/OS default Downloads configuration.
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Generate & Download
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
