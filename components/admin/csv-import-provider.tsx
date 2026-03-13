"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const JOB_KEY = "tclass_admin_csv_import_job_v2";
const REQUIRED_HEADERS = [
  "first_name",
  "last_name",
  "email",
  "course",
  "year_level",
  "gender",
  "student_id",
] as const;

type RequiredHeader = (typeof REQUIRED_HEADERS)[number];
type YearScope = "all" | "1" | "2" | "3" | "4";
type ImportStatus = "running" | "completed";
type RowFilter = "all" | "valid" | "invalid";
type NameSort = "none" | "asc" | "desc";
type GenderSort = "none" | "male_first" | "female_first";
type ValiditySort = "none" | "valid_first" | "invalid_first";

type ImportRowResult = {
  id: string;
  rowNumber: number;
  fullName: string;
  status: "success" | "failed";
  message: string;
};

type ImportRowPayload = {
  id: string;
  rowNumber: number;
  fullName: string;
  email: string;
  course: string;
  yearLevel: string;
  gender: string;
  studentId: string;
};

type ImportJob = {
  id: string;
  status: ImportStatus;
  selectedYearScope: YearScope;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedCount: number;
  failedCount: number;
  latestStatus: string;
  remainingRows: ImportRowPayload[];
  results: ImportRowResult[];
  createdAt: string;
  finishedAt: string | null;
};

type ValidationIssue = {
  field: string;
  message: string;
  recommendedFix: string;
};

type CsvRow = {
  id: string;
  rowNumber: number;
  first_name: string;
  last_name: string;
  email: string;
  course: string;
  year_level: string;
  gender: string;
  student_id: string;
  parsedYear: 1 | 2 | 3 | 4 | null;
  normalizedGender: "Male" | "Female" | null;
  finalYear: 1 | 2 | 3 | 4 | null;
  issues: ValidationIssue[];
  isValid: boolean;
};

type CsvContextValue = {
  openWizard: () => void;
  openMonitor: () => void;
  activeJob: ImportJob | null;
};

const CsvContext = createContext<CsvContextValue | null>(null);

const YEAR_OPTIONS: Array<{ value: YearScope; label: string; description: string }> = [
  { value: "all", label: "All years", description: "Use year_level values from CSV." },
  { value: "1", label: "1st year", description: "Force all valid rows to 1st year." },
  { value: "2", label: "2nd year", description: "Force all valid rows to 2nd year." },
  { value: "3", label: "3rd year", description: "Force all valid rows to 3rd year." },
  { value: "4", label: "4th year", description: "Force all valid rows to 4th year." },
];

const HEADER_ALIASES: Record<string, RequiredHeader> = {
  first_name: "first_name",
  firstname: "first_name",
  first: "first_name",
  last_name: "last_name",
  lastname: "last_name",
  last: "last_name",
  email: "email",
  course: "course",
  program: "course",
  year_level: "year_level",
  yearlevel: "year_level",
  year: "year_level",
  gender: "gender",
  sex: "gender",
  student_id: "student_id",
  studentid: "student_id",
  student_number: "student_id",
  studentnumber: "student_id",
};

const GENDER_ALIASES: Record<string, "Male" | "Female"> = {
  male: "Male",
  m: "Male",
  female: "Female",
  f: "Female",
};

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const parseYear = (value: string): 1 | 2 | 3 | 4 | null => {
  const normalized = normalizeText(value).replace(/[^0-9a-z]/g, "");
  if (["1", "1st", "first", "year1", "1styear"].includes(normalized)) return 1;
  if (["2", "2nd", "second", "year2", "2ndyear"].includes(normalized)) return 2;
  if (["3", "3rd", "third", "year3", "3rdyear"].includes(normalized)) return 3;
  if (["4", "4th", "fourth", "year4", "4thyear"].includes(normalized)) return 4;
  return null;
};

const parseGender = (value: string): "Male" | "Female" | null =>
  GENDER_ALIASES[normalizeText(value).replace(/\./g, "")] ?? null;

const formatYearScope = (value: YearScope) =>
  value === "all" ? "All years" : `${value}${value === "1" ? "st" : value === "2" ? "nd" : value === "3" ? "rd" : "th"} year`;

const escapeCsv = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, "\"\"")}"` : value;

const readText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read CSV file."));
    reader.readAsText(file);
  });

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i] ?? "";
    const next = text[i + 1] ?? "";

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((item) => item.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((item) => item.trim() !== "")) rows.push(row);
  }

  return rows;
};

const canonicalHeader = (value: string): RequiredHeader | null => {
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w]/g, "");
  return HEADER_ALIASES[key] ?? null;
};

const makeJobId = () => `csv-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AdminCsvImportProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const [wizardOpen, setWizardOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [yearScope, setYearScope] = useState<YearScope>("all");
  const [fileName, setFileName] = useState("");
  const [headerIssues, setHeaderIssues] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [knownCourses, setKnownCourses] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RowFilter>("all");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [genderSort, setGenderSort] = useState<GenderSort>("none");
  const [validitySort, setValiditySort] = useState<ValiditySort>("none");
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);

  const runnerRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  const courseSet = useMemo(
    () => new Set(knownCourses.map((item) => normalizeText(item))),
    [knownCourses],
  );

  const resetWizard = useCallback(() => {
    setStep(1);
    setYearScope("all");
    setFileName("");
    setHeaderIssues([]);
    setRows([]);
    setSearch("");
    setFilter("all");
    setNameSort("none");
    setGenderSort("none");
    setValiditySort("none");
  }, []);

  const openWizard = useCallback(() => {
    if (!isAdminRoute) return;
    if (activeJob?.status === "running") {
      setProgressOpen(true);
      toast("CSV import is running. Monitoring opened.");
      return;
    }
    resetWizard();
    setWizardOpen(true);
  }, [activeJob?.status, isAdminRoute, resetWizard]);

  const openMonitor = useCallback(() => {
    if (activeJob) setProgressOpen(true);
  }, [activeJob]);

  const contextValue = useMemo<CsvContextValue>(
    () => ({ openWizard, openMonitor, activeJob }),
    [activeJob, openMonitor, openWizard],
  );

  const validRows = useMemo(() => rows.filter((row) => row.isValid), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => !row.isValid), [rows]);

  const conflict = useMemo(() => {
    if (yearScope === "all") return null;
    const year = Number(yearScope) as 1 | 2 | 3 | 4;
    const withYear = rows.filter((row) => row.parsedYear !== null);
    return {
      total: rows.length,
      already: withYear.filter((row) => row.parsedYear === year).length,
      changed: withYear.filter((row) => row.parsedYear !== year).length,
      sample: withYear.filter((row) => row.parsedYear !== year).slice(0, 5),
    };
  }, [rows, yearScope]);

  const processed = activeJob ? activeJob.totalRows - activeJob.remainingRows.length : 0;
  const progress = activeJob && activeJob.totalRows > 0 ? Math.round((processed / activeJob.totalRows) * 100) : 0;
  const canGoSummary = headerIssues.length === 0 && rows.length > 0 && validRows.length > 0;

  useEffect(() => {
    if (!isAdminRoute) return;
    let cancelled = false;
    const load = async () => {
      setLoadingCourses(true);
      try {
        const payload = (await apiFetch("/admin/programs")) as {
          programs?: Array<{ title?: string; category?: string }>;
        };
        const items = new Set<string>();
        for (const program of payload.programs ?? []) {
          if (program.title?.trim()) items.add(program.title.trim());
          if (program.category?.trim()) items.add(program.category.trim());
        }
        if (!cancelled) setKnownCourses(Array.from(items));
      } catch {
        if (!cancelled) {
          setKnownCourses([]);
          toast.error("Unable to load program catalog for course validation.");
        }
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isAdminRoute]);

  useEffect(() => {
    if (!isAdminRoute || hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = window.localStorage.getItem(JOB_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ImportJob;
      if (!parsed || !parsed.id || !Array.isArray(parsed.remainingRows)) return;
      setActiveJob(parsed);
    } catch {
      window.localStorage.removeItem(JOB_KEY);
    }
  }, [isAdminRoute]);

  useEffect(() => {
    if (!isAdminRoute) return;
    if (!activeJob) {
      window.localStorage.removeItem(JOB_KEY);
      return;
    }
    window.localStorage.setItem(JOB_KEY, JSON.stringify(activeJob));
  }, [activeJob, isAdminRoute]);

  const handleUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Upload a .csv file.");
        return;
      }

      setFileName(file.name);
      try {
        const text = await readText(file);
        const matrix = parseCsv(text);
        if (matrix.length < 2) {
          setHeaderIssues(["CSV must include headers and at least one data row."]);
          setRows([]);
          return;
        }

        const [headerRow, ...dataRows] = matrix;
        const indexByHeader = new Map<RequiredHeader, number>();
        headerRow.forEach((header, index) => {
          const key = canonicalHeader(header);
          if (key && !indexByHeader.has(key)) indexByHeader.set(key, index);
        });

        const missing = REQUIRED_HEADERS.filter((header) => !indexByHeader.has(header));
        if (missing.length > 0) {
          setHeaderIssues(missing.map((header) => `Missing required header: ${header}`));
          setRows([]);
          return;
        }

        const forceYear = yearScope === "all" ? null : (Number(yearScope) as 1 | 2 | 3 | 4);
        const parsedRows: CsvRow[] = [];

        for (let i = 0; i < dataRows.length; i += 1) {
          const cells = dataRows[i] ?? [];
          const row: Omit<CsvRow, "parsedYear" | "normalizedGender" | "finalYear" | "issues" | "isValid"> = {
            id: `row-${i + 2}-${Math.random().toString(36).slice(2, 6)}`,
            rowNumber: i + 2,
            first_name: String(cells[indexByHeader.get("first_name") ?? -1] ?? "").trim(),
            last_name: String(cells[indexByHeader.get("last_name") ?? -1] ?? "").trim(),
            email: String(cells[indexByHeader.get("email") ?? -1] ?? "").trim(),
            course: String(cells[indexByHeader.get("course") ?? -1] ?? "").trim(),
            year_level: String(cells[indexByHeader.get("year_level") ?? -1] ?? "").trim(),
            gender: String(cells[indexByHeader.get("gender") ?? -1] ?? "").trim(),
            student_id: String(cells[indexByHeader.get("student_id") ?? -1] ?? "").trim(),
          };

          const hasValue = REQUIRED_HEADERS.some((header) => row[header] !== "");
          if (!hasValue) continue;

          const issues: ValidationIssue[] = [];
          for (const header of REQUIRED_HEADERS) {
            if (!row[header]) {
              issues.push({
                field: header,
                message: `${header} is required.`,
                recommendedFix: `Provide ${header} in this row.`,
              });
            }
          }

          const parsedYear = parseYear(row.year_level);
          if (row.year_level && !parsedYear) {
            issues.push({
              field: "year_level",
              message: "year_level must be 1..4.",
              recommendedFix: "Use 1, 2, 3, or 4.",
            });
          }

          const normalizedGender = parseGender(row.gender);
          if (row.gender && !normalizedGender) {
            issues.push({
              field: "gender",
              message: "gender must be Male or Female.",
              recommendedFix: "Use Male/Female or M/F.",
            });
          }

          if (courseSet.size === 0) {
            issues.push({
              field: "course",
              message: "Program catalog is empty.",
              recommendedFix: "Create programs before CSV import.",
            });
          } else if (row.course && !courseSet.has(normalizeText(row.course))) {
            issues.push({
              field: "course",
              message: `Unknown course: ${row.course}`,
              recommendedFix: "Match an existing program title/category.",
            });
          }

          const finalYear = forceYear ?? parsedYear;
          const isValid = issues.length === 0 && finalYear !== null && normalizedGender !== null;
          parsedRows.push({ ...row, parsedYear, normalizedGender, finalYear, issues, isValid });
        }

        setHeaderIssues([]);
        setRows(parsedRows);
        toast.success(`Parsed ${parsedRows.length} row(s).`);
      } catch (error) {
        setHeaderIssues(["Unable to parse CSV file."]);
        setRows([]);
        toast.error(error instanceof Error ? error.message : "CSV parsing failed.");
      }
    },
    [courseSet, yearScope],
  );

  const previewRows = useMemo(() => {
    let list = [...rows];
    if (filter === "valid") list = list.filter((row) => row.isValid);
    if (filter === "invalid") list = list.filter((row) => !row.isValid);

    const searchKey = normalizeText(search);
    if (searchKey) {
      list = list.filter((row) =>
        normalizeText(
          `${row.first_name} ${row.last_name} ${row.email} ${row.course} ${row.year_level} ${row.gender} ${row.student_id}`,
        ).includes(searchKey),
      );
    }

    list.sort((a, b) => {
      if (validitySort !== "none" && a.isValid !== b.isValid) {
        return validitySort === "valid_first" ? (a.isValid ? -1 : 1) : a.isValid ? 1 : -1;
      }
      if (nameSort !== "none") {
        const an = normalizeText(`${a.last_name} ${a.first_name}`);
        const bn = normalizeText(`${b.last_name} ${b.first_name}`);
        if (an !== bn) return nameSort === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      }
      if (genderSort !== "none") {
        const rank = (value: "Male" | "Female" | null) => {
          if (genderSort === "male_first") return value === "Male" ? 0 : value === "Female" ? 1 : 2;
          return value === "Female" ? 0 : value === "Male" ? 1 : 2;
        };
        const diff = rank(a.normalizedGender) - rank(b.normalizedGender);
        if (diff !== 0) return diff;
      }
      return a.rowNumber - b.rowNumber;
    });
    return list;
  }, [filter, genderSort, nameSort, rows, search, validitySort]);

  const downloadInvalidCsv = useCallback(() => {
    if (invalidRows.length === 0) return;
    const header = [...REQUIRED_HEADERS, "validation_error", "recommended_fix"].join(",");
    const body = invalidRows
      .map((row) =>
        [
          row.first_name,
          row.last_name,
          row.email,
          row.course,
          row.year_level,
          row.gender,
          row.student_id,
          row.issues.map((item) => item.message).join(" | "),
          row.issues.map((item) => item.recommendedFix).join(" | "),
        ]
          .map((cell) => escapeCsv(String(cell ?? "")))
          .join(","),
      )
      .join("\n");

    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invalid-rows.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [invalidRows]);

  const applyResult = useCallback((jobId: string, payload: ImportRowPayload, status: "success" | "failed", message: string) => {
    setActiveJob((current) => {
      if (!current || current.id !== jobId) return current;
      if (current.results.some((item) => item.id === payload.id)) return current;
      return {
        ...current,
        importedCount: current.importedCount + (status === "success" ? 1 : 0),
        failedCount: current.failedCount + (status === "failed" ? 1 : 0),
        latestStatus: `${payload.fullName}: ${message}`,
        remainingRows: current.remainingRows.filter((item) => item.id !== payload.id),
        results: [...current.results, { id: payload.id, rowNumber: payload.rowNumber, fullName: payload.fullName, status, message }],
      };
    });
  }, []);

  const runJob = useCallback(async (job: ImportJob) => {
    if (runnerRef.current === job.id) return;
    runnerRef.current = job.id;

    const queue = [...job.remainingRows];
    let cursor = 0;
    const workers = Math.min(4, Math.max(1, queue.length >= 20 ? 4 : 2));

    const nextRow = () => {
      const row = queue[cursor];
      cursor += 1;
      return row;
    };

    const worker = async () => {
      while (runnerRef.current === job.id) {
        const item = nextRow();
        if (!item) break;
        try {
          await apiFetch("/admin/users", {
            method: "POST",
            body: JSON.stringify({ name: item.fullName, email: item.email, role: "student" }),
          });
          applyResult(job.id, item, "success", "Imported.");
        } catch (error) {
          applyResult(job.id, item, "failed", error instanceof Error ? error.message : "Import failed.");
        }
      }
    };

    await Promise.all(Array.from({ length: workers }, () => worker()));
    setActiveJob((current) =>
      current && current.id === job.id
        ? {
            ...current,
            status: "completed",
            finishedAt: new Date().toISOString(),
            latestStatus: `Import complete. ${current.importedCount} succeeded, ${current.failedCount} failed.`,
          }
        : current,
    );
    runnerRef.current = null;
  }, [applyResult]);

  useEffect(() => {
    if (!activeJob || activeJob.status !== "running") return;
    if (activeJob.remainingRows.length === 0) {
      setActiveJob((current) =>
        current
          ? {
              ...current,
              status: "completed",
              finishedAt: new Date().toISOString(),
            }
          : current,
      );
      return;
    }
    void runJob(activeJob);
  }, [activeJob, runJob]);

  const startImport = useCallback(() => {
    if (validRows.length === 0) return;
    const payload: ImportRowPayload[] = validRows.map((row) => ({
      id: row.id,
      rowNumber: row.rowNumber,
      fullName: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email.toLowerCase(),
      course: row.course,
      yearLevel: String(row.finalYear ?? row.year_level),
      gender: row.normalizedGender ?? row.gender,
      studentId: row.student_id,
    }));
    const job: ImportJob = {
      id: makeJobId(),
      status: "running",
      selectedYearScope: yearScope,
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      importedCount: 0,
      failedCount: 0,
      latestStatus: "Starting import...",
      remainingRows: payload,
      results: [],
      createdAt: new Date().toISOString(),
      finishedAt: null,
    };
    setActiveJob(job);
    setWizardOpen(false);
    setProgressOpen(true);
  }, [invalidRows.length, rows.length, validRows, yearScope]);

  const clearMonitor = useCallback(() => {
    if (activeJob?.status === "running") return;
    setActiveJob(null);
    setProgressOpen(false);
    window.localStorage.removeItem(JOB_KEY);
  }, [activeJob?.status]);

  return (
    <CsvContext.Provider value={contextValue}>
      {children}

      {isAdminRoute && activeJob ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60]">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openMonitor}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", activeJob.status === "running" ? "animate-pulse bg-amber-500" : "bg-emerald-500")} />
              {activeJob.status === "running" ? `CSV import ${progress}%` : "CSV import complete"}
            </button>
            {activeJob.status === "completed" ? (
              <Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-700" onClick={clearMonitor}>
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <CsvImportWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        step={step}
        setStep={setStep}
        yearScope={yearScope}
        setYearScope={setYearScope}
        fileName={fileName}
        headerIssues={headerIssues}
        rows={rows}
        previewRows={previewRows}
        conflict={conflict}
        loadingCourses={loadingCourses}
        knownCourses={knownCourses}
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        nameSort={nameSort}
        setNameSort={setNameSort}
        genderSort={genderSort}
        setGenderSort={setGenderSort}
        validitySort={validitySort}
        setValiditySort={setValiditySort}
        validRows={validRows}
        invalidRows={invalidRows}
        canGoSummary={canGoSummary}
        onUpload={handleUpload}
        onDownloadInvalid={downloadInvalidCsv}
        onFinishImport={startImport}
      />

      <CsvImportProgressDialog
        open={progressOpen}
        onOpenChange={setProgressOpen}
        activeJob={activeJob}
        progress={progress}
        processed={processed}
        onClearMonitor={clearMonitor}
      />
    </CsvContext.Provider>
  );
}

type WizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: 1 | 2 | 3;
  setStep: (step: 1 | 2 | 3) => void;
  yearScope: YearScope;
  setYearScope: (value: YearScope) => void;
  fileName: string;
  headerIssues: string[];
  rows: CsvRow[];
  previewRows: CsvRow[];
  conflict: { total: number; already: number; changed: number; sample: CsvRow[] } | null;
  loadingCourses: boolean;
  knownCourses: string[];
  search: string;
  setSearch: (value: string) => void;
  filter: RowFilter;
  setFilter: (value: RowFilter) => void;
  nameSort: NameSort;
  setNameSort: (value: NameSort) => void;
  genderSort: GenderSort;
  setGenderSort: (value: GenderSort) => void;
  validitySort: ValiditySort;
  setValiditySort: (value: ValiditySort) => void;
  validRows: CsvRow[];
  invalidRows: CsvRow[];
  canGoSummary: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDownloadInvalid: () => void;
  onFinishImport: () => void;
};

function CsvImportWizard({
  open,
  onOpenChange,
  step,
  setStep,
  yearScope,
  setYearScope,
  fileName,
  headerIssues,
  rows,
  previewRows,
  conflict,
  loadingCourses,
  knownCourses,
  search,
  setSearch,
  filter,
  setFilter,
  nameSort,
  setNameSort,
  genderSort,
  setGenderSort,
  validitySort,
  setValiditySort,
  validRows,
  invalidRows,
  canGoSummary,
  onUpload,
  onDownloadInvalid,
  onFinishImport,
}: WizardProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-[1440px] flex-col gap-0 overflow-hidden border border-slate-200 bg-white p-0 md:h-[90vh] md:w-[94vw] lg:w-[90vw] dark:border-slate-700 dark:bg-slate-950">
        <DialogHeader className="border-b border-slate-200 bg-white/95 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-slate-900 dark:text-slate-100">Import CSV</DialogTitle>
            <Badge className="border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Step {step} of 3</Badge>
            {fileName ? <Badge className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">{fileName}</Badge> : null}
          </div>
          <DialogDescription>Upload CSV, validate rows, then import valid students asynchronously.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {step === 1 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {YEAR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setYearScope(option.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-left",
                    yearScope === option.value
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70",
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Label htmlFor="csv-upload">CSV upload</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Required headers: {REQUIRED_HEADERS.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => document.getElementById("csv-upload")?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose CSV
                    </Button>
                    <Badge className="border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {loadingCourses ? "Loading courses..." : `${knownCourses.length} courses`}
                    </Badge>
                  </div>
                </div>
                <Input id="csv-upload" type="file" accept=".csv,text/csv" className="sr-only" onChange={onUpload} />
              </div>

              {headerIssues.length > 0 ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                  <div className="mb-2 flex items-center gap-2 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4" />
                    Header issues
                  </div>
                  {headerIssues.map((item) => (
                    <p key={item} className="text-sm text-rose-700 dark:text-rose-300">- {item}</p>
                  ))}
                </div>
              ) : null}

              {conflict ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Year override warning ({formatYearScope(yearScope)})</p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Total: {conflict.total} | Already in year: {conflict.already} | Will change: {conflict.changed}</p>
                  {conflict.sample.length > 0 ? (
                    <div className="mt-2 overflow-x-auto rounded-xl border border-amber-200/70 bg-white dark:border-amber-500/30 dark:bg-slate-900/70">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-amber-200/70 dark:border-amber-500/20">
                            <th className="px-3 py-2 text-left">Row</th>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left text-rose-700 dark:text-rose-300">CSV year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {conflict.sample.map((row) => (
                            <tr key={`sample-${row.id}`} className="border-b border-amber-200/40 last:border-b-0 dark:border-amber-500/10">
                              <td className="px-3 py-2">{row.rowNumber}</td>
                              <td className="px-3 py-2">{row.first_name} {row.last_name}</td>
                              <td className="px-3 py-2 text-rose-700 dark:text-rose-300">{row.year_level}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rows..." />
                <Select value={nameSort} onValueChange={(value) => setNameSort(value as NameSort)}>
                  <SelectTrigger><SelectValue placeholder="Name sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Name: none</SelectItem>
                    <SelectItem value="asc">Name: A-Z</SelectItem>
                    <SelectItem value="desc">Name: Z-A</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={genderSort} onValueChange={(value) => setGenderSort(value as GenderSort)}>
                  <SelectTrigger><SelectValue placeholder="Gender sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Gender: none</SelectItem>
                    <SelectItem value="male_first">Male first</SelectItem>
                    <SelectItem value="female_first">Female first</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={validitySort} onValueChange={(value) => setValiditySort(value as ValiditySort)}>
                  <SelectTrigger><SelectValue placeholder="Validity sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Validity: none</SelectItem>
                    <SelectItem value="valid_first">Valid first</SelectItem>
                    <SelectItem value="invalid_first">Invalid first</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filter} onValueChange={(value) => setFilter(value as RowFilter)}>
                  <SelectTrigger><SelectValue placeholder="Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All rows</SelectItem>
                    <SelectItem value="valid">Valid only</SelectItem>
                    <SelectItem value="invalid">Invalid only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="max-h-[40vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-[1] bg-slate-100 dark:bg-slate-900">
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                            No rows to preview.
                          </TableCell>
                        </TableRow>
                      ) : (
                        previewRows.map((row) => (
                          <TableRow key={row.id} className={!row.isValid ? "bg-rose-50/40 dark:bg-rose-500/5" : ""}>
                            <TableCell>{row.isValid ? "✅" : "❌"}</TableCell>
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell>{row.first_name} {row.last_name}</TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.course}</TableCell>
                            <TableCell className={cn(yearScope !== "all" && row.parsedYear !== null && Number(yearScope) !== row.parsedYear ? "font-semibold text-rose-700 dark:text-rose-300" : "")}>{row.year_level}</TableCell>
                            <TableCell>{row.gender}</TableCell>
                            <TableCell>{row.student_id}</TableCell>
                            <TableCell>
                              {row.isValid ? (
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Validated</span>
                              ) : (
                                <details className="rounded-lg border border-rose-200 bg-rose-50/70 px-2 py-1 text-xs dark:border-rose-500/30 dark:bg-rose-500/10">
                                  <summary className="cursor-pointer font-semibold text-rose-700 dark:text-rose-300">Show issues ({row.issues.length})</summary>
                                  <div className="mt-1 space-y-1">
                                    {row.issues.map((issue, index) => (
                                      <p key={`${row.id}-issue-${issue.field}-${index}`} className="text-slate-700 dark:text-slate-300">
                                        <strong>{issue.message}</strong> Fix: {issue.recommendedFix}
                                      </p>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryStat label="Total rows" value={rows.length} />
                <SummaryStat label="Valid rows" value={validRows.length} tone="green" />
                <SummaryStat label="Invalid rows" value={invalidRows.length} tone="rose" />
                <SummaryStat label="To import" value={validRows.length} tone="blue" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-sm text-slate-700 dark:text-slate-300">Selected year scope: <strong>{formatYearScope(yearScope)}</strong></p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Invalid rows are skipped. Valid rows are imported via <code>/admin/users</code> with role <code>student</code>.</p>
                <Button type="button" variant="outline" className="mt-3" onClick={onDownloadInvalid} disabled={invalidRows.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Download invalid rows CSV
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-slate-200 bg-white/95 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step === 1 ? "Choose year scope." : step === 2 ? "Upload and validate CSV rows." : "Review summary and finish."}
            </p>
            <div className="flex items-center gap-2">
              {step > 1 ? <Button type="button" variant="outline" onClick={() => setStep(step === 3 ? 2 : 1)}>Back</Button> : null}
              {step < 3 ? (
                <Button type="button" onClick={() => setStep(step === 1 ? 2 : 3)} disabled={step === 2 && !canGoSummary}>
                  {step === 1 ? "Next: Upload CSV" : "Next: Summary"}
                </Button>
              ) : (
                <Button type="button" onClick={onFinishImport} disabled={validRows.length === 0}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Finish import
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CsvImportProgressDialog({
  open,
  onOpenChange,
  activeJob,
  progress,
  processed,
  onClearMonitor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeJob: ImportJob | null;
  progress: number;
  processed: number;
  onClearMonitor: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activeJob?.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
            CSV Import Progress
          </DialogTitle>
          <DialogDescription>
            {activeJob?.status === "running"
              ? "Import continues even if you close this modal."
              : "Import complete. Review latest results."}
          </DialogDescription>
        </DialogHeader>

        {activeJob ? (
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryChip label="Total" value={activeJob.totalRows} />
              <SummaryChip label="Processed" value={processed} tone="blue" />
              <SummaryChip label="Imported" value={activeJob.importedCount} tone="green" />
              <SummaryChip label="Failed" value={activeJob.failedCount} tone="rose" />
            </div>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/60">{activeJob.latestStatus}</p>
            <div className="max-h-52 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <Table>
                <TableHeader className="sticky top-0 z-[1] bg-slate-100 dark:bg-slate-900">
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeJob.results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Waiting for results...</TableCell>
                    </TableRow>
                  ) : (
                    activeJob.results.slice().reverse().slice(0, 20).map((result) => (
                      <TableRow key={`result-${result.id}`}>
                        <TableCell>{result.rowNumber}</TableCell>
                        <TableCell>{result.fullName}</TableCell>
                        <TableCell>{result.status === "success" ? "✅" : "❌"}</TableCell>
                        <TableCell>{result.message}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No active job.</p>
        )}

        <DialogFooter>
          {activeJob?.status === "completed" ? (
            <Button type="button" variant="outline" onClick={onClearMonitor}>Clear monitor</Button>
          ) : null}
          <Button type="button" onClick={() => onOpenChange(false)}>
            {activeJob?.status === "running" ? "Close (background mode)" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "green" | "rose" | "blue" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      : tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SummaryChip({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "green" | "rose" | "blue" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      : tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200";
  return (
    <div className={`rounded-xl border px-3 py-2 text-center ${toneClass}`}>
      <p className="text-xs">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export function useAdminCsvImport() {
  const context = useContext(CsvContext);
  if (!context) throw new Error("useAdminCsvImport must be used within AdminCsvImportProvider");
  return context;
}
