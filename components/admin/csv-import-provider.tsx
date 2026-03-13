"use client";

import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { CertificateTrackIcon } from "@/components/icons/certificate-track-icon";
import { YearLevelSchoolIcon } from "@/components/icons/year-level-school-icon";
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
type ImportStatus = "running" | "completed" | "cancelled";
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

const CERTIFICATE_OPTIONS = [
  {
    key: "hospitality-ncii",
    label: "Hospitality NCII",
    description: "Certificate track for service and guest care.",
    badge: "HOSP",
  },
  {
    key: "forklift-ncii",
    label: "Forklift NCII",
    description: "Certificate track for equipment operations.",
    badge: "FORK",
  },
] as const;

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

const normalizeStudentId = (value: string) => value.trim().toLowerCase();

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
const PREVIEW_CHUNK_SIZE = 100;

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
  const [existingStudentEmails, setExistingStudentEmails] = useState<string[]>([]);
  const [existingStudentNumbers, setExistingStudentNumbers] = useState<string[]>([]);
  const [studentLookupFailed, setStudentLookupFailed] = useState(false);
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
  const existingStudentEmailSet = useMemo(
    () => new Set(existingStudentEmails.map((item) => item.trim().toLowerCase())),
    [existingStudentEmails],
  );
  const existingStudentNumberSet = useMemo(
    () => new Set(existingStudentNumbers.map((item) => normalizeStudentId(item))),
    [existingStudentNumbers],
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
    if (!isAdminRoute) return;
    let cancelled = false;
    const loadStudents = async () => {
      try {
        const payload = (await apiFetch("/admin/users?role=student")) as {
          users?: Array<{ email?: string; student_number?: string | null }>;
        };
        const emails = new Set<string>();
        const studentNumbers = new Set<string>();
        for (const user of payload.users ?? []) {
          const email = String(user.email ?? "").trim().toLowerCase();
          if (email) emails.add(email);
          const studentNumber = normalizeStudentId(String(user.student_number ?? ""));
          if (studentNumber) studentNumbers.add(studentNumber);
        }
        if (!cancelled) {
          setExistingStudentEmails(Array.from(emails));
          setExistingStudentNumbers(Array.from(studentNumbers));
          setStudentLookupFailed(false);
        }
      } catch {
        if (!cancelled) {
          setExistingStudentEmails([]);
          setExistingStudentNumbers([]);
          setStudentLookupFailed(true);
        }
      }
    };
    void loadStudents();
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
      if (!/\.csv$/i.test(file.name.trim())) {
        toast.error("Upload a .csv file.");
        return;
      }
      if (studentLookupFailed) {
        setHeaderIssues(["Unable to validate existing students right now. Please refresh and try again."]);
        setRows([]);
        toast.error("Duplicate-check service unavailable. Refresh and try again.");
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

        const emailCounts = new Map<string, number>();
        const studentIdCounts = new Map<string, number>();
        for (const row of parsedRows) {
          const emailKey = row.email.trim().toLowerCase();
          const studentIdKey = normalizeStudentId(row.student_id);
          if (emailKey) emailCounts.set(emailKey, (emailCounts.get(emailKey) ?? 0) + 1);
          if (studentIdKey) studentIdCounts.set(studentIdKey, (studentIdCounts.get(studentIdKey) ?? 0) + 1);
        }

        for (const row of parsedRows) {
          const emailKey = row.email.trim().toLowerCase();
          const studentIdKey = normalizeStudentId(row.student_id);

          if (emailKey && (emailCounts.get(emailKey) ?? 0) > 1) {
            row.issues.push({
              field: "email",
              message: "Duplicate email found in CSV.",
              recommendedFix: "Keep one unique row per student email.",
            });
          }
          if (emailKey && existingStudentEmailSet.has(emailKey)) {
            row.issues.push({
              field: "email",
              message: "Student email already exists in database.",
              recommendedFix: "Remove this row or use the correct non-existing student email.",
            });
          }
          if (studentIdKey && (studentIdCounts.get(studentIdKey) ?? 0) > 1) {
            row.issues.push({
              field: "student_id",
              message: "Duplicate student_id found in CSV.",
              recommendedFix: "Provide a unique student_id for each row.",
            });
          }
          if (studentIdKey && existingStudentNumberSet.has(studentIdKey)) {
            row.issues.push({
              field: "student_id",
              message: "Student ID already exists in database.",
              recommendedFix: "Remove this row or use the correct non-existing student_id.",
            });
          }
          row.isValid = row.issues.length === 0 && row.finalYear !== null && row.normalizedGender !== null;
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
    [courseSet, yearScope, existingStudentEmailSet, existingStudentNumberSet, studentLookupFailed],
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

  const applyResult = useCallback((jobId: string, payload: ImportRowPayload, status: "success" | "failed", message: string) => {
    setActiveJob((current) => {
      if (!current || current.id !== jobId) return current;
      if (current.status !== "running") return current;
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
      current && current.id === job.id && current.status === "running"
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

  const cancelImport = useCallback(() => {
    if (!activeJob || activeJob.status !== "running") return;
    runnerRef.current = null;
    setActiveJob((current) =>
      current && current.status === "running"
        ? {
            ...current,
            status: "cancelled",
            finishedAt: new Date().toISOString(),
            latestStatus: `Import cancelled. ${current.importedCount} succeeded, ${current.failedCount} failed.`,
          }
        : current,
    );
    toast("CSV import cancelled.");
  }, [activeJob]);

  const clearUploadedCsv = useCallback(() => {
    setFileName("");
    setHeaderIssues([]);
    setRows([]);
    setSearch("");
    setFilter("all");
    setNameSort("none");
    setGenderSort("none");
    setValiditySort("none");
  }, []);

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
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  activeJob.status === "running"
                    ? "animate-pulse bg-amber-500"
                    : activeJob.status === "cancelled"
                    ? "bg-rose-500"
                    : "bg-emerald-500",
                )}
              />
              {activeJob.status === "running"
                ? `CSV import ${progress}%`
                : activeJob.status === "cancelled"
                ? "CSV import cancelled"
                : "CSV import complete"}
            </button>
            {activeJob.status !== "running" ? (
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
        onReplaceCsvStart={clearUploadedCsv}
        onRemoveRow={(rowId) => {
          const selectedRow = rows.find((row) => row.id === rowId);
          if (!selectedRow) {
            toast.error("Row not found. Refresh and try again.");
            return;
          }
          setRows((current) => current.filter((row) => row.id !== rowId));
          toast.success(`Removed row ${selectedRow.rowNumber} from import list.`);
        }}
        onFinishImport={startImport}
      />

      <CsvImportProgressDialog
        open={progressOpen}
        onOpenChange={setProgressOpen}
        activeJob={activeJob}
        progress={progress}
        processed={processed}
        onCancelImport={cancelImport}
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
  onReplaceCsvStart: () => void;
  onRemoveRow: (rowId: string) => void;
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
  onReplaceCsvStart,
  onRemoveRow,
  onFinishImport,
}: WizardProps) {
  const [visibleRowsCount, setVisibleRowsCount] = useState(PREVIEW_CHUNK_SIZE);
  const [isAppendingRows, setIsAppendingRows] = useState(false);
  const [openIssueRowIds, setOpenIssueRowIds] = useState<string[]>([]);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [triggerHoverRowId, setTriggerHoverRowId] = useState<string | null>(null);
  const [issueTriggerPositions, setIssueTriggerPositions] = useState<Record<string, number>>({});
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [selectedCertificateLabel, setSelectedCertificateLabel] = useState("");
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const previewSentinelRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const shouldAutoOpenPickerRef = useRef(false);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const shownCount = Math.min(visibleRowsCount, previewRows.length);
  const hasMorePreviewRows = shownCount < previewRows.length;
  const visiblePreviewRows = useMemo(
    () => previewRows.slice(0, shownCount),
    [previewRows, shownCount],
  );

  const resetPreviewWindow = useCallback(() => {
    setVisibleRowsCount(PREVIEW_CHUNK_SIZE);
    setIsAppendingRows(false);
    setOpenIssueRowIds([]);
    setHoveredRowId(null);
    setTriggerHoverRowId(null);
    setIssueTriggerPositions({});
  }, []);

  const loadNextChunk = useCallback(() => {
    if (!hasMorePreviewRows || isAppendingRows) return;
    setIsAppendingRows(true);
    window.requestAnimationFrame(() => {
      setVisibleRowsCount((current) => Math.min(current + PREVIEW_CHUNK_SIZE, previewRows.length));
      setIsAppendingRows(false);
    });
  }, [hasMorePreviewRows, isAppendingRows, previewRows.length]);

  useEffect(() => {
    if (step !== 2) return;
    const root = previewScrollRef.current;
    const sentinel = previewSentinelRef.current;
    if (!root || !sentinel || !hasMorePreviewRows) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadNextChunk();
        }
      },
      { root, rootMargin: "0px 0px 180px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMorePreviewRows, loadNextChunk, step]);

  const handleYearScopeSelect = useCallback((value: YearScope) => {
    resetPreviewWindow();
    setYearScope(value);
  }, [resetPreviewWindow, setYearScope]);

  const handleSearchChange = useCallback((value: string) => {
    resetPreviewWindow();
    setSearch(value);
  }, [resetPreviewWindow, setSearch]);

  const handleFilterChange = useCallback((value: RowFilter) => {
    resetPreviewWindow();
    setFilter(value);
  }, [resetPreviewWindow, setFilter]);

  const handleNameSortChange = useCallback((value: NameSort) => {
    resetPreviewWindow();
    setNameSort(value);
  }, [resetPreviewWindow, setNameSort]);

  const handleGenderSortChange = useCallback((value: GenderSort) => {
    resetPreviewWindow();
    setGenderSort(value);
  }, [resetPreviewWindow, setGenderSort]);

  const handleValiditySortChange = useCallback((value: ValiditySort) => {
    resetPreviewWindow();
    setValiditySort(value);
  }, [resetPreviewWindow, setValiditySort]);

  const handleUploadWithReset = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    resetPreviewWindow();
    onUpload(event);
  }, [onUpload, resetPreviewWindow]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReplaceCsvClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resetPreviewWindow();
    onReplaceCsvStart();
    openFilePicker();
  }, [onReplaceCsvStart, openFilePicker, resetPreviewWindow]);

  const handleStepChange = useCallback((nextStep: 1 | 2 | 3) => {
    if (step === 1 && nextStep === 2) shouldAutoOpenPickerRef.current = true;
    if (nextStep === 2) resetPreviewWindow();
    setStep(nextStep);
  }, [resetPreviewWindow, setStep, step]);

  const openCertificatePreview = useCallback((label: string) => {
    setSelectedCertificateLabel(label);
    setCertificateModalOpen(true);
  }, []);
  const toggleRowIssues = useCallback((rowId: string) => {
    setOpenIssueRowIds((current) =>
      current.includes(rowId)
        ? current.filter((id) => id !== rowId)
        : [...current, rowId],
    );
  }, []);
  const closeAllOpenedIssues = useCallback(() => {
    setOpenIssueRowIds([]);
  }, []);

  const visibleTriggerRowIds = useMemo(
    () =>
      visiblePreviewRows
        .filter(
          (row) =>
            !row.isValid &&
            row.issues.length > 0 &&
            (openIssueRowIds.includes(row.id) || hoveredRowId === row.id || triggerHoverRowId === row.id),
        )
        .map((row) => row.id),
    [hoveredRowId, openIssueRowIds, triggerHoverRowId, visiblePreviewRows],
  );

  const syncIssueTriggerPositions = useCallback(() => {
    const frame = previewFrameRef.current;
    if (!frame) {
      setIssueTriggerPositions({});
      return;
    }

    const frameRect = frame.getBoundingClientRect();
    const nextPositions: Record<string, number> = {};

    for (const rowId of visibleTriggerRowIds) {
      const rowElement = rowRefs.current[rowId];
      if (!rowElement) continue;

      const rowRect = rowElement.getBoundingClientRect();
      const centerY = rowRect.top - frameRect.top + rowRect.height / 2;
      if (centerY < -24 || centerY > frameRect.height + 24) continue;
      nextPositions[rowId] = centerY;
    }

    setIssueTriggerPositions(nextPositions);
  }, [visibleTriggerRowIds]);

  useEffect(() => {
    if (!open || step !== 2 || !shouldAutoOpenPickerRef.current) return;
    shouldAutoOpenPickerRef.current = false;
    window.requestAnimationFrame(() => openFilePicker());
  }, [open, openFilePicker, step]);

  useEffect(() => {
    if (step !== 2) return;

    const scrollRoot = previewScrollRef.current;
    if (!scrollRoot) return;

    const handleSync = () => syncIssueTriggerPositions();
    handleSync();

    scrollRoot.addEventListener("scroll", handleSync, { passive: true });
    window.addEventListener("resize", handleSync);

    return () => {
      scrollRoot.removeEventListener("scroll", handleSync);
      window.removeEventListener("resize", handleSync);
    };
  }, [shownCount, step, syncIssueTriggerPositions]);

  const handleRemovePreviewRow = useCallback(
    (rowId: string) => {
      setOpenIssueRowIds((current) => current.filter((id) => id !== rowId));
      setHoveredRowId((current) => (current === rowId ? null : current));
      setTriggerHoverRowId((current) => (current === rowId ? null : current));
      onRemoveRow(rowId);
    },
    [onRemoveRow],
  );

  const filterControlClass =
    "h-12 border-slate-300 bg-white shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:focus-visible:ring-blue-400";
  const stepTitle =
    step === 1 ? "Pick student year" : step === 2 ? "Preview CSV Data" : "Confirm import";
  const stepDescription =
    step === 1
      ? "Choose where these students belong before upload."
      : step === 2
      ? "Review data, fix invalid rows, and continue."
      : "Review totals, then start the student import.";
  const diplomaCardSelectedTone: Record<YearScope, string> = {
    all: "border-cyan-500 bg-cyan-50/70 dark:border-cyan-400 dark:bg-cyan-500/10",
    "1": "border-emerald-500 bg-emerald-50/70 dark:border-emerald-400 dark:bg-emerald-500/10",
    "2": "border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-500/10",
    "3": "border-violet-500 bg-violet-50/70 dark:border-violet-400 dark:bg-violet-500/10",
    "4": "border-amber-500 bg-amber-50/70 dark:border-amber-400 dark:bg-amber-500/10",
  };
  const diplomaIconTone: Record<YearScope, string> = {
    all: "text-cyan-500 dark:text-cyan-300",
    "1": "text-emerald-500 dark:text-emerald-300",
    "2": "text-indigo-500 dark:text-indigo-300",
    "3": "text-violet-500 dark:text-violet-300",
    "4": "text-amber-500 dark:text-amber-300",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-[1440px] flex-col gap-0 overflow-hidden border border-slate-200 bg-white p-0 md:h-[90vh] md:w-[94vw] lg:w-[90vw] dark:border-slate-700 dark:bg-slate-950">
        <DialogHeader className="border-b border-slate-200 bg-white/95 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <DialogTitle className="shrink-0 text-xl font-bold leading-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-slate-100">
                  {stepTitle}
                </DialogTitle>
                <Badge className="border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Step {step} of 3</Badge>
                {fileName ? (
                  <div
                    className="group relative max-w-[48vw] sm:max-w-[360px] md:max-w-[440px] lg:max-w-[520px]"
                    title={fileName}
                  >
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="w-full truncate rounded-full border border-blue-200 bg-blue-50 px-3 py-1 pr-8 text-left text-xs font-semibold text-blue-700 transition hover:bg-blue-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                    >
                      {fileName}
                    </button>
                    <button
                      type="button"
                      onClick={handleReplaceCsvClick}
                      className="absolute right-1 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-blue-200/80 bg-white text-blue-700 opacity-0 transition hover:bg-blue-100 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/40 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
                      aria-label="Replace CSV file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
              </div>
              <DialogDescription>{stepDescription}</DialogDescription>
            </div>
            {step === 2 ? (
              <div className="flex flex-wrap items-center gap-2 self-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openFilePicker}
                  className="border-slate-400 bg-white text-slate-900 shadow-none hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose CSV
                </Button>
                <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {loadingCourses ? "Loading courses..." : `${knownCourses.length} courses`}
                </Badge>
              </div>
            ) : null}
          </div>
          <Input ref={fileInputRef} id="csv-upload" type="file" accept=".csv,text/csv" className="sr-only" onChange={handleUploadWithReset} />
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Diploma</p>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {YEAR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleYearScopeSelect(option.value)}
                    className={cn(
                      "flex min-h-[198px] flex-col rounded-2xl border p-4 text-left transition",
                      yearScope === option.value
                        ? diplomaCardSelectedTone[option.value]
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-slate-500 dark:hover:bg-slate-900",
                    )}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
                    <div className="mt-auto flex justify-end pt-2">
                      <YearLevelSchoolIcon
                        visual={option.value}
                        badge={option.value === "all" ? "ALL" : `Y${option.value}`}
                        className={cn(
                          "h-24 w-24 md:h-28 md:w-28",
                          yearScope === option.value
                            ? diplomaIconTone[option.value]
                            : "text-slate-400 dark:text-slate-500",
                        )}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Certificate</p>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:max-w-[740px]">
                {CERTIFICATE_OPTIONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openCertificatePreview(item.label)}
                    className={cn(
                      "group flex min-h-[188px] flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left transition",
                      "hover:border-sky-300 hover:bg-sky-50/60 focus-visible:border-sky-400 focus-visible:bg-sky-50/80 focus-visible:outline-none",
                      "active:border-sky-500 active:bg-sky-100/70 dark:border-slate-700 dark:bg-slate-900/70",
                      "dark:hover:border-sky-400/60 dark:hover:bg-sky-500/10 dark:focus-visible:border-sky-400/80 dark:focus-visible:bg-sky-500/10 dark:active:border-sky-300 dark:active:bg-sky-500/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                      </div>
                      <Badge className="border-slate-300 bg-slate-100 text-slate-700 transition group-hover:border-sky-300 group-hover:bg-sky-100/80 group-hover:text-sky-700 group-focus-visible:border-sky-400 group-focus-visible:bg-sky-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:group-hover:border-sky-400/70 dark:group-hover:bg-sky-500/20 dark:group-hover:text-sky-200">
                        Soon
                      </Badge>
                    </div>
                    <div className="mt-auto flex justify-end pt-3">
                      <CertificateTrackIcon
                        badge={item.badge}
                        className="h-24 w-24 text-slate-400 transition group-hover:text-sky-500 group-focus-visible:text-sky-600 group-active:text-sky-600 md:h-28 md:w-28 dark:text-slate-500 dark:group-hover:text-sky-300 dark:group-focus-visible:text-sky-200 dark:group-active:text-sky-200"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Required headers: {REQUIRED_HEADERS.join(", ")}</p>

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

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
                <Input
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search rows..."
                  className={filterControlClass}
                />
                <Select value={nameSort} onValueChange={(value) => handleNameSortChange(value as NameSort)}>
                  <SelectTrigger className={filterControlClass}><SelectValue placeholder="Name sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Name: none</SelectItem>
                    <SelectItem value="asc">Name: A-Z</SelectItem>
                    <SelectItem value="desc">Name: Z-A</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={genderSort} onValueChange={(value) => handleGenderSortChange(value as GenderSort)}>
                  <SelectTrigger className={filterControlClass}><SelectValue placeholder="Gender sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Gender: none</SelectItem>
                    <SelectItem value="male_first">Male first</SelectItem>
                    <SelectItem value="female_first">Female first</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={validitySort} onValueChange={(value) => handleValiditySortChange(value as ValiditySort)}>
                  <SelectTrigger className={filterControlClass}><SelectValue placeholder="Validity sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Validity: none</SelectItem>
                    <SelectItem value="valid_first">Valid first</SelectItem>
                    <SelectItem value="invalid_first">Invalid first</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filter} onValueChange={(value) => handleFilterChange(value as RowFilter)}>
                  <SelectTrigger className={filterControlClass}><SelectValue placeholder="Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All rows</SelectItem>
                    <SelectItem value="valid">Valid only</SelectItem>
                    <SelectItem value="invalid">Invalid only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <p>Showing {shownCount} of {previewRows.length} rows</p>
                <div className="flex items-center gap-2">
                  {hasMorePreviewRows ? (
                    <p>
                      {isAppendingRows
                        ? `Loading next ${PREVIEW_CHUNK_SIZE} rows...`
                        : "Scroll to load more rows"}
                    </p>
                  ) : null}
                  {openIssueRowIds.length > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={closeAllOpenedIssues}
                      className="h-7 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    >
                      Collapse all open rows ({openIssueRowIds.length})
                    </Button>
                  ) : null}
                </div>
              </div>

              <div
                ref={previewFrameRef}
                className="relative overflow-visible rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="overflow-x-auto">
                  <div ref={previewScrollRef} className="max-h-[40vh] overflow-y-auto">
                    <table className="min-w-[1320px] w-full border-collapse text-sm">
                      <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-900">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Status</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Row</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">First name</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Last name</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Email</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Course</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Year</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Gender</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Student ID</th>
                          <th className="sticky top-0 bg-slate-100 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                              No rows to preview.
                            </td>
                          </tr>
                        ) : (
                          visiblePreviewRows.map((row) => {
                            const canExpand = !row.isValid && row.issues.length > 0;
                            const isExpanded = canExpand && openIssueRowIds.includes(row.id);

                            return (
                              <Fragment key={row.id}>
                                <tr
                                  ref={(element) => {
                                    rowRefs.current[row.id] = element;
                                  }}
                                  data-preview-row-id={row.id}
                                  onMouseEnter={() => {
                                    if (canExpand) setHoveredRowId(row.id);
                                  }}
                                  onMouseLeave={(event) => {
                                    const nextTarget = event.relatedTarget;
                                    if (
                                      nextTarget instanceof HTMLElement &&
                                      nextTarget.dataset?.issueTriggerFor === row.id
                                    ) {
                                      return;
                                    }
                                    setHoveredRowId((current) => (current === row.id ? null : current));
                                  }}
                                  className={cn(
                                    "group border-b border-slate-200 dark:border-slate-800",
                                    !row.isValid ? "hover:bg-rose-50/40 dark:hover:bg-rose-500/5" : "",
                                  )}
                                >
                                  <td className="px-3 py-3 text-center align-middle">
                                    <div className="mx-auto inline-flex h-7 w-7 items-center justify-center">
                                      <span className="inline-flex h-5 w-5 items-center justify-center text-base leading-none">
                                        {row.isValid ? "✅" : "❌"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">{row.rowNumber}</td>
                                  <td className="px-3 py-3">{row.first_name}</td>
                                  <td className="px-3 py-3">{row.last_name}</td>
                                  <td className="px-3 py-3">{row.email}</td>
                                  <td className="px-3 py-3">{row.course}</td>
                                  <td className={cn("px-3 py-3", yearScope !== "all" && row.parsedYear !== null && Number(yearScope) !== row.parsedYear ? "font-semibold text-rose-700 dark:text-rose-300" : "")}>{row.year_level}</td>
                                  <td className="px-3 py-3">{row.gender}</td>
                                  <td className="px-3 py-3">{row.student_id}</td>
                                  <td className="px-3 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePreviewRow(row.id)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-500/40 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                      aria-label={`Remove row ${row.rowNumber}`}
                                      title="Remove row"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                                {isExpanded ? (
                                  <tr className="border-b border-slate-200 bg-rose-50/20 dark:border-slate-800 dark:bg-rose-500/5">
                                    <td colSpan={10} className="px-4 py-3">
                                      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
                                        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                                          Row {row.rowNumber} issues ({row.issues.length})
                                        </p>
                                        <div className="mt-2 space-y-2">
                                          {row.issues.map((issue, index) => (
                                            <div key={`${row.id}-issue-${issue.field}-${index}`} className="rounded-lg border border-rose-200/80 bg-white/80 px-3 py-2 text-sm dark:border-rose-500/20 dark:bg-slate-900/50">
                                              <p className="font-medium text-slate-800 dark:text-slate-100">
                                                {issue.field}: {issue.message}
                                              </p>
                                              <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                                                Fix: {issue.recommendedFix}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ) : null}
                              </Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                    <div ref={previewSentinelRef} className="flex h-10 items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                      {hasMorePreviewRows ? (isAppendingRows ? "Loading more rows..." : "Scroll for more...") : ""}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-[200]">
                  {visibleTriggerRowIds.map((rowId) => {
                    const top = issueTriggerPositions[rowId];
                    if (typeof top !== "number") return null;

                    const isExpanded = openIssueRowIds.includes(rowId);

                    return (
                      <button
                        key={`row-trigger-${rowId}`}
                        type="button"
                        data-issue-trigger-for={rowId}
                        onMouseEnter={() => setTriggerHoverRowId(rowId)}
                        onMouseLeave={(event) => {
                          const nextTarget = event.relatedTarget;
                          if (
                            nextTarget instanceof Element &&
                            nextTarget.closest(`[data-preview-row-id="${rowId}"]`)
                          ) {
                            return;
                          }
                          setTriggerHoverRowId((current) => (current === rowId ? null : current));
                        }}
                        onClick={() => toggleRowIssues(rowId)}
                        className="pointer-events-auto absolute left-0 z-[220] inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 shadow-sm transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-500/50 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        style={{ top }}
                        aria-label={isExpanded ? "Hide row details" : "Show row details"}
                      >
                        <ChevronRight className={cn("h-7 w-7 transition-transform", isExpanded ? "rotate-90" : "")} />
                      </button>
                    );
                  })}
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
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-slate-200 bg-white/95 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step === 1 ? "Choose year scope." : step === 2 ? "Upload and validate CSV rows." : "Review summary and finish."}
            </p>
            <div className="flex items-center gap-2">
              {step > 1 ? <Button type="button" variant="outline" onClick={() => handleStepChange(step === 3 ? 2 : 1)}>Back</Button> : null}
              {step < 3 ? (
                <Button type="button" onClick={() => handleStepChange(step === 1 ? 2 : 3)} disabled={step === 2 && !canGoSummary}>
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

        <Dialog open={certificateModalOpen} onOpenChange={setCertificateModalOpen}>
          <DialogContent className="w-[94vw] max-w-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Sparkles className="h-5 w-5 text-amber-500 dark:text-amber-300" />
                Certificate Preview
              </DialogTitle>
              <DialogDescription>
                {selectedCertificateLabel
                  ? `${selectedCertificateLabel}: next release preview.`
                  : "Certificate import: next release preview."}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-3xl font-bold leading-tight text-slate-800 sm:text-4xl md:text-5xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              Certificate import CSV goes live soon.
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setCertificateModalOpen(false)}>Great, got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  onCancelImport,
  onClearMonitor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeJob: ImportJob | null;
  progress: number;
  processed: number;
  onCancelImport: () => void;
  onClearMonitor: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activeJob?.status === "running" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : activeJob?.status === "cancelled" ? (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-300" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            )}
            CSV Import Progress
          </DialogTitle>
          <DialogDescription>
            {activeJob?.status === "running"
              ? "Import continues even if you close this modal."
              : activeJob?.status === "cancelled"
              ? "Import was cancelled. Review partial results."
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
                        <TableCell>{result.status === "success" ? "âœ…" : "âŒ"}</TableCell>
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
          {activeJob?.status === "running" ? (
            <Button type="button" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/50 dark:text-rose-300 dark:hover:bg-rose-500/10" onClick={onCancelImport}>
              Cancel import
            </Button>
          ) : null}
          {activeJob?.status !== "running" ? (
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
