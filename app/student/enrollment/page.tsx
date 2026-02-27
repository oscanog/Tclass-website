"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FileDown, Wand2 } from "lucide-react";

import { EnrollmentPageSkeleton } from "@/components/ui/loading-states";
import StudentShell from "../_components/student-shell";

import { apiFetch } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Period = { id: number; name: string; is_active: number };
type EvalRow = {
  id: number;
  code: string;
  title: string;
  units: number;
  year_level: number;
  semester: number;
  grade: number | null;
  result_status: "passed" | "failed" | "incomplete" | "credited" | null;
};

type SubjectOption = {
  id: number;
  offeringId?: number;
  enrollmentId?: number;
  code: string;
  title: string;
  units: number;
  section: string;
  schedule: string;
  instructor: string;
  slotsLeft?: number;
};

type EnrollmentStatus = "not_enrolled" | "unofficial" | "official";

const IT_CURRICULUM_FALLBACK: EvalRow[] = [
  { id: 1001, code: "PLF101", title: "Program Logic Formulation", units: 3, year_level: 1, semester: 1, grade: null, result_status: null },
  { id: 1002, code: "CC101", title: "Introduction to Computing", units: 3, year_level: 1, semester: 1, grade: null, result_status: null },
  { id: 1003, code: "FILN1", title: "Kontekstwalisadong Komunikasyon", units: 3, year_level: 1, semester: 1, grade: null, result_status: null },
  { id: 1004, code: "GEC5", title: "Purposive Communication", units: 3, year_level: 1, semester: 1, grade: null, result_status: null },
  { id: 1005, code: "GEC4", title: "Mathematics in the Modern World", units: 3, year_level: 1, semester: 1, grade: null, result_status: null },
  { id: 1006, code: "PE1", title: "Fitness and Recreational Activities", units: 2, year_level: 1, semester: 1, grade: null, result_status: null },
  { id: 1007, code: "GEC8", title: "Ethics", units: 3, year_level: 1, semester: 1, grade: null, result_status: null },
  { id: 1008, code: "NSTP1", title: "National Service Training Program 1", units: 3, year_level: 1, semester: 1, grade: null, result_status: null },
  { id: 1009, code: "CC102", title: "Computer Programming I", units: 3, year_level: 1, semester: 2, grade: null, result_status: null },
  { id: 1010, code: "HCI101", title: "Introduction to Human Computer Interaction", units: 1, year_level: 1, semester: 2, grade: null, result_status: null },
  { id: 1011, code: "MS101", title: "Discrete Mathematics", units: 3, year_level: 1, semester: 2, grade: null, result_status: null },
  { id: 1012, code: "GEC1", title: "Understanding the Self", units: 3, year_level: 1, semester: 2, grade: null, result_status: null },
  { id: 1013, code: "PE2", title: "Civic Welfare Training Service II", units: 3, year_level: 1, semester: 2, grade: null, result_status: null },
  { id: 1014, code: "CC103", title: "Computer Programming II", units: 3, year_level: 2, semester: 1, grade: null, result_status: null },
  { id: 1015, code: "CC104", title: "Data Structures and Algorithms", units: 3, year_level: 2, semester: 2, grade: null, result_status: null },
  { id: 1016, code: "PF102", title: "Event Driven Programming", units: 3, year_level: 3, semester: 1, grade: null, result_status: null },
  { id: 1017, code: "IM101", title: "Advance Database Systems", units: 2, year_level: 3, semester: 1, grade: null, result_status: null },
  { id: 1018, code: "IAS101", title: "Information Assurance and Security", units: 3, year_level: 3, semester: 2, grade: null, result_status: null },
  { id: 1019, code: "CAP101", title: "Capstone Project and Research I", units: 3, year_level: 3, semester: 2, grade: null, result_status: null },
  { id: 1020, code: "NET101", title: "Networking I", units: 3, year_level: 3, semester: 2, grade: null, result_status: null },
];

const isRowPassedEquivalent = (row: EvalRow) =>
  row.result_status === "passed" ||
  row.result_status === "credited" ||
  (row.grade !== null && row.grade >= 75);

const pickNextTerm = (rows: EvalRow[]): { year: number; sem: number } | null => {
  if (rows.length === 0) return null;

  const terms = new Map<string, EvalRow[]>();
  for (const row of rows) {
    const key = `${row.year_level}-${row.semester}`;
    const list = terms.get(key) ?? [];
    list.push(row);
    terms.set(key, list);
  }

  const sorted = [...terms.keys()]
    .map((k) => {
      const [year, sem] = k.split("-").map(Number);
      return { year, sem, key: k };
    })
    .sort((a, b) => (a.year === b.year ? a.sem - b.sem : a.year - b.year));

  for (const term of sorted) {
    const termRows = terms.get(term.key) ?? [];
    if (termRows.length === 0) continue;

    const allPassed = termRows.every(isRowPassedEquivalent);
    if (!allPassed) {
      return { year: term.year, sem: term.sem };
    }
  }

  const last = sorted[sorted.length - 1];
  if (last) {
    if (last.sem === 1) return { year: last.year, sem: 2 };
    return { year: last.year + 1, sem: 1 };
  }

  return null;
};

function StudentEnrollmentContent() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodId, setPeriodId] = useState<string>("");
  const [evalRows, setEvalRows] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  const [selectedAvailableId, setSelectedAvailableId] = useState<number | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
  const [preEnlisted, setPreEnlisted] = useState<SubjectOption[]>([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState<SubjectOption[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>("not_enrolled");
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState<string>("");
  const [selectedCurriculumSemester, setSelectedCurriculumSemester] = useState<string>("");
  const [enrollmentSyncConnected, setEnrollmentSyncConnected] = useState<boolean | null>(null);
  const [enrollmentSyncError, setEnrollmentSyncError] = useState<string>("");

  const mapEnrollmentRowToSubject = (row: {
    id: number;
    course_id?: number;
    code: string;
    title: string;
    units: number;
    schedule?: string | null;
    instructor?: string | null;
    section?: string | null;
  }): SubjectOption => ({
    id: Number(row.course_id ?? row.id),
    enrollmentId: Number(row.id),
    code: row.code,
    title: row.title,
    units: Number(row.units ?? 0),
    schedule: row.schedule ?? "-",
    instructor: row.instructor ?? "-",
    section: row.section ?? "-",
  });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const periodRes = await apiFetch("/student/periods");
        const p = (periodRes as { periods: Period[]; active_period_id: number | null }).periods ?? [];
        const active = (periodRes as { active_period_id: number | null }).active_period_id;
        setPeriods(p);
        setPeriodId(String(active ?? p[0]?.id ?? ""));

        const evalRes = await apiFetch("/student/curriculum-evaluation");
        const fetchedEval = (evalRes as { evaluation: EvalRow[] }).evaluation ?? [];
        setEvalRows(fetchedEval.length > 0 ? fetchedEval : IT_CURRICULUM_FALLBACK);
      } catch (error) {
        setEvalRows(IT_CURRICULUM_FALLBACK);
        toast.error(error instanceof Error ? error.message : "Failed to load enrollment data.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const loadPreEnlistedFromBackend = async (pid: string) => {
    const res = await apiFetch(`/student/enrollments/pre-enlisted?period_id=${pid}`);
    const payload = res as {
      pre_enlisted?: Array<{
        id: number;
        course_id: number;
        code: string;
        title: string;
        units: number;
        schedule: string | null;
        instructor: string | null;
        section: string | null;
      }>;
    };
    setPreEnlisted((payload.pre_enlisted ?? []).map(mapEnrollmentRowToSubject));
  };

  const loadEnrolledFromBackend = async (pid: string) => {
    const res = await apiFetch(`/student/enrollments/enrolled-subjects?period_id=${pid}`);
    const payload = res as {
      enrollment_status: EnrollmentStatus;
      enrolled_subjects?: Array<{
        id: number;
        course_id: number;
        code: string;
        title: string;
        units: number;
        schedule: string | null;
        instructor: string | null;
        section: string | null;
      }>;
    };
    setEnrollmentStatus(payload.enrollment_status ?? "not_enrolled");
    setEnrolledSubjects((payload.enrolled_subjects ?? []).map(mapEnrollmentRowToSubject));
  };

  const refreshEnrollmentLists = async (pid: string) => {
    await Promise.all([loadPreEnlistedFromBackend(pid), loadEnrolledFromBackend(pid)]);
    setEnrollmentSyncConnected(true);
    setEnrollmentSyncError("");
  };

  useEffect(() => {
    if (!periodId) return;
    const run = async () => {
      try {
        await refreshEnrollmentLists(periodId);
      } catch (error) {
        setEnrollmentSyncConnected(false);
        setEnrollmentSyncError(error instanceof Error ? error.message : "Failed to load enrollment records from server.");
      }
    };
    void run();
    // refreshEnrollmentLists is intentionally stable within component lifecycle for this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodId]);

  const targetTerm = useMemo(() => pickNextTerm(evalRows), [evalRows]);

  useEffect(() => {
    if (!targetTerm) return;
    setSelectedCurriculumYear((prev) => (prev ? prev : String(targetTerm.year)));
    setSelectedCurriculumSemester((prev) => (prev ? prev : String(targetTerm.sem)));
  }, [targetTerm]);

  const curriculumYearOptions = useMemo(() => {
    const uniqueYears = Array.from(new Set(evalRows.map((r) => r.year_level))).sort((a, b) => a - b);
    return uniqueYears;
  }, [evalRows]);

  const curriculumSemesterOptions = useMemo(() => {
    const selectedYearNum = Number(selectedCurriculumYear);
    const base = evalRows.filter((r) => (selectedYearNum ? r.year_level === selectedYearNum : true));
    const uniqueSems = Array.from(new Set(base.map((r) => r.semester))).sort((a, b) => a - b);
    return uniqueSems;
  }, [evalRows, selectedCurriculumYear]);

  useEffect(() => {
    if (!curriculumSemesterOptions.length) return;
    if (!selectedCurriculumSemester || !curriculumSemesterOptions.includes(Number(selectedCurriculumSemester))) {
      setSelectedCurriculumSemester(String(curriculumSemesterOptions[0]));
    }
  }, [curriculumSemesterOptions, selectedCurriculumSemester]);

  useEffect(() => {
    if (!periodId || !selectedCurriculumYear || !selectedCurriculumSemester) {
      setAvailableSubjects([]);
      return;
    }

    const run = async () => {
      try {
        const res = await apiFetch(
          `/student/enrollment-offerings?period_id=${Number(periodId)}&year_level=${Number(selectedCurriculumYear)}&semester=${Number(selectedCurriculumSemester)}`
        );
        const payload = res as {
          offerings?: Array<{
            offering_id: number;
            course_id: number;
            code: string;
            title: string;
            units: number;
            section: string;
            instructor: string;
            room: string;
            schedule: string;
            slots_left: number;
          }>;
        };

        const blockedCourseIds = new Set([
          ...preEnlisted.map((row) => row.id),
          ...enrolledSubjects.map((row) => row.id),
        ]);

        const mapped = (payload.offerings ?? [])
          .filter((row) => !blockedCourseIds.has(Number(row.course_id)))
          .map((row) => ({
            id: Number(row.course_id),
            offeringId: Number(row.offering_id),
            code: row.code,
            title: row.title,
            units: Number(row.units ?? 0),
            section: row.section ?? "-",
            schedule: row.schedule ?? "-",
            instructor: row.instructor ?? "-",
            slotsLeft: Number(row.slots_left ?? 0),
          }));

        setAvailableSubjects(mapped);
      } catch {
        setAvailableSubjects([]);
      }
    };

    void run();
  }, [periodId, selectedCurriculumYear, selectedCurriculumSemester, preEnlisted, enrolledSubjects]);

  const selectedAvailable = useMemo(
    () => availableSubjects.find((s) => s.offeringId === selectedAvailableId) ?? null,
    [availableSubjects, selectedAvailableId]
  );

  const preTotalUnits = useMemo(
    () => preEnlisted.reduce((sum, row) => sum + Number(row.units || 0), 0),
    [preEnlisted]
  );
  const enrolledTotalUnits = useMemo(
    () => enrolledSubjects.reduce((sum, row) => sum + Number(row.units || 0), 0),
    [enrolledSubjects]
  );
  const isEnrollmentLocked = enrollmentStatus === "unofficial" || enrollmentStatus === "official";

  const panelClass =
    "rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80";

  const addSelectedSubject = async () => {
    if (isEnrollmentLocked) {
      toast.error("Enrollment is already submitted. Wait for admin approval to modify subjects.");
      return;
    }
    if (!selectedAvailable) {
      toast.error("Select a subject first.");
      return;
    }
    const exists = preEnlisted.some((row) => row.id === selectedAvailable.id);
    if (exists) {
      toast("Subject already in Pre-Enlisted.");
      return;
    }
    if (!periodId) {
      toast.error("Select a period first.");
      return;
    }

    try {
      await apiFetch("/student/enrollments/add", {
        method: "POST",
        body: JSON.stringify({
          course_id: selectedAvailable.id,
          offering_id: selectedAvailable.offeringId,
          period_id: Number(periodId),
        }),
      });
      await loadPreEnlistedFromBackend(periodId);
      setEnrollmentSyncConnected(true);
      setEnrollmentSyncError("");
      toast.success(`${selectedAvailable.code} added to Pre-Enlisted.`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add subject.";
      setEnrollmentSyncConnected(false);
      setEnrollmentSyncError(message);
      toast.error(`Server add failed: ${message}`);
      return;
    }
  };

  const removePreEnlisted = async (id: number) => {
    if (isEnrollmentLocked) {
      toast.error("Enrollment is already submitted. Pre-enlisted subjects are locked.");
      return;
    }
    const target = preEnlisted.find((row) => row.id === id);
    if (!target) return;

    if (target.enrollmentId && periodId) {
      try {
        await apiFetch(`/student/enrollments/${target.enrollmentId}`, { method: "DELETE" });
        await loadPreEnlistedFromBackend(periodId);
        setEnrollmentSyncConnected(true);
        setEnrollmentSyncError("");
        toast.success("Removed from Pre-Enlisted.");
        return;
      } catch (error) {
        setEnrollmentSyncConnected(false);
        setEnrollmentSyncError(error instanceof Error ? error.message : "Failed to remove subject.");
        toast.error(error instanceof Error ? error.message : "Failed to remove subject.");
        return;
      }
    }

    setPreEnlisted((rows) => rows.filter((row) => row.id !== id));
  };

  const removeAllPreEnlisted = async () => {
    if (isEnrollmentLocked) {
      toast.error("Enrollment is already submitted. Pre-enlisted subjects are locked.");
      return;
    }
    if (preEnlisted.length === 0) {
      toast.error("No pre-enlisted subjects to remove.");
      return;
    }
    if (!periodId) {
      toast.error("Select a period first.");
      return;
    }

    try {
      await apiFetch(`/student/enrollments?period_id=${Number(periodId)}`, { method: "DELETE" });
      await loadPreEnlistedFromBackend(periodId);
      setEnrollmentSyncConnected(true);
      setEnrollmentSyncError("");
      toast.success("Removed all pre-enlisted subjects.");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear pre-enlisted subjects.";
      setEnrollmentSyncConnected(false);
      setEnrollmentSyncError(message);
      toast.error(`Server remove-all failed: ${message}`);
      return;
    }
  };

  const autoPreEnlist = async () => {
    if (isEnrollmentLocked) {
      toast.error("Enrollment is already submitted. Auto pre-enlist is disabled.");
      return;
    }
    if (!periodId) {
      toast.error("Select a period first.");
      return;
    }

    try {
      const result = await apiFetch("/student/enrollments/auto", {
        method: "POST",
        body: JSON.stringify({
          period_id: Number(periodId),
          year_level: Number(selectedCurriculumYear),
          semester: Number(selectedCurriculumSemester),
        }),
      });
      const payload = result as { added_count?: number; skipped_no_section?: string[]; message?: string };

      await loadPreEnlistedFromBackend(periodId);
      setEnrollmentSyncConnected(true);
      setEnrollmentSyncError("");
      const addedCount = Number(payload.added_count ?? 0);
      const yearLabel =
        selectedCurriculumYear === "1"
          ? "1st Year"
          : selectedCurriculumYear === "2"
            ? "2nd Year"
            : selectedCurriculumYear === "3"
              ? "3rd Year"
              : selectedCurriculumYear === "4"
                ? "4th Year"
                : `Year ${selectedCurriculumYear}`;
      const semLabel =
        selectedCurriculumSemester === "1"
          ? "1st Semester"
          : selectedCurriculumSemester === "2"
            ? "2nd Semester"
            : selectedCurriculumSemester === "3"
              ? "Midyear/Summer"
              : `Sem ${selectedCurriculumSemester}`;

      toast.success(
        `Auto pre-enlist synced for ${yearLabel} ${semLabel}. Added ${addedCount} subject(s).`
      );
      if ((payload.skipped_no_section ?? []).length > 0) {
        toast.error(`No available section for: ${(payload.skipped_no_section ?? []).slice(0, 3).join(", ")}`);
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to auto pre-enlist.";
      setEnrollmentSyncConnected(false);
      setEnrollmentSyncError(message);
      toast.error(`Server auto pre-enlist failed: ${message}`);
      return;
    }
  };

  const assessEnrollment = async () => {
    if (isEnrollmentLocked) {
      toast.error("Enrollment is already submitted.");
      return;
    }
    if (preEnlisted.length === 0) {
      toast.error("Add subjects to Pre-Enlisted before assessment.");
      return;
    }

    if (!periodId) {
      toast.error("Select a period first.");
      return;
    }

    try {
      await apiFetch("/student/enrollments/assess", {
        method: "POST",
        body: JSON.stringify({
          period_id: Number(periodId || 0),
        }),
      });
      await refreshEnrollmentLists(periodId);
      setEnrollmentSyncConnected(true);
      setEnrollmentSyncError("");
      toast.success("Assessment completed. Status is now Unofficially Enrolled.");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assess enrollment.";
      setEnrollmentSyncConnected(false);
      setEnrollmentSyncError(message);
      toast.error(`Server assess failed: ${message}. Admin will not receive this request.`);
      return;
    }
  };

  const openSubjectListPdf = () => {
    const rows = enrolledSubjects.length > 0 ? enrolledSubjects : preEnlisted;
    if (rows.length === 0) {
      toast.error("No subject list available to print.");
      return;
    }

    const html = `
      <html>
        <head><title>Subject List</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px">
          <h2>Subject List (${enrollmentStatus.toUpperCase()})</h2>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%">
            <thead><tr><th>Code</th><th>Title</th><th>Units</th><th>Section</th><th>Schedule</th></tr></thead>
            <tbody>
              ${rows
                .map(
                  (r) =>
                    `<tr><td>${r.code}</td><td>${r.title}</td><td>${r.units}</td><td>${r.section}</td><td>${r.schedule}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const viewCor = () => {
    if (enrollmentStatus !== "official") {
      toast.error("COR is available only when status is Officially Enrolled.");
      return;
    }
    toast.success("Opening COR PDF...");
    openSubjectListPdf();
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <EnrollmentPageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="student-page min-h-screen bg-slate-100/80 p-4 md:p-6 dark:bg-transparent">
      <div className="mx-auto max-w-7xl space-y-5 md:space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200">
              Online Services
            </Badge>
            <Badge variant="outline" className="rounded-full">
              Enrollment
            </Badge>
            {targetTerm ? (
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                Target: Year {targetTerm.year} / Sem {targetTerm.sem}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-slate-100">Student Enrollment</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Pre-enlist subjects, assess, and track enrollment status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {enrollmentStatus === "official" && <Badge className="bg-emerald-600">Officially Enrolled</Badge>}
              {enrollmentStatus === "unofficial" && <Badge className="bg-amber-600">Unofficially Enrolled</Badge>}
              {enrollmentStatus === "not_enrolled" && <Badge variant="outline">Not Enrolled</Badge>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-100/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
          <p className="font-semibold text-slate-700 dark:text-slate-200">DISCLAIMER</p>
          <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
            Subject lists (PRE-REG / File) may be viewed after assessment. COR is only available once your enrollment is officially approved.
          </p>
        </div>

        {enrollmentSyncConnected === false && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
            <p className="font-semibold">Enrollment sync issue</p>
            <p className="mt-1">
              Student page could not sync enrollment actions to the backend. Admin will not see requests until this is fixed.
              {enrollmentSyncError ? ` (${enrollmentSyncError})` : ""}
            </p>
          </div>
        )}

        {enrollmentSyncConnected === true && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
            Enrollment actions are synced to the backend. After clicking <span className="font-semibold">Assess</span>, admin can review them in <span className="font-semibold">Admin → Enrollments → Enrollment Requests</span>.
          </div>
        )}

        {isEnrollmentLocked && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-semibold">Enrollment is locked after assessment.</p>
            <p className="mt-1">
              Available Subjects and Pre-Enlisted Subjects are read-only now to prevent duplicate requests. Refresh will continue loading your submitted subjects from the backend.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Workflow</span>
            <Badge variant="outline" className="rounded-full">Available Subjects</Badge>
            <span className="text-slate-400">→</span>
            <Badge variant="outline" className="rounded-full">Pre-Enlisted</Badge>
            <span className="text-slate-400">→</span>
            <Badge variant="outline" className="rounded-full">Assess</Badge>
            <span className="text-slate-400">→</span>
            <Badge variant="outline" className="rounded-full">Unofficial / Official</Badge>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Pre-Enlisted: <span className="font-semibold text-slate-700 dark:text-slate-200">{preEnlisted.length}</span> | Enrolled:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{enrolledSubjects.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Enrollment Session</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Select period, auto-pre-enlist from curriculum evaluation, then assess your subject list.
            </p>
          </div>
        </div>

        <Card className={panelClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900 dark:text-slate-100">Enrollment Controls</CardTitle>
            <CardDescription className="dark:text-slate-300">
              Choose period, auto-add based on evaluation, assess, and print files.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">Curriculum Year</p>
              <Select value={selectedCurriculumYear} onValueChange={setSelectedCurriculumYear} disabled={isEnrollmentLocked}>
                <SelectTrigger className="h-10 rounded-xl border-slate-300 bg-white/95 shadow-sm dark:border-white/15 dark:bg-slate-950/80">
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/90 dark:border-white/10">
                  {curriculumYearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year === 1 ? "1st Year" : year === 2 ? "2nd Year" : year === 3 ? "3rd Year" : year === 4 ? "4th Year" : `Year ${year}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">Curriculum Semester</p>
              <Select value={selectedCurriculumSemester} onValueChange={setSelectedCurriculumSemester} disabled={isEnrollmentLocked}>
                <SelectTrigger className="h-10 rounded-xl border-slate-300 bg-white/95 shadow-sm dark:border-white/15 dark:bg-slate-950/80">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/90 dark:border-white/10">
                  {curriculumSemesterOptions.map((sem) => (
                    <SelectItem key={sem} value={String(sem)}>
                      {sem === 1 ? "1st Semester" : sem === 2 ? "2nd Semester" : sem === 3 ? "Midyear / Summer" : `Semester ${sem}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-4">
              <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">Period</p>
              <Select value={periodId} onValueChange={setPeriodId} disabled={loading || isEnrollmentLocked}>
                <SelectTrigger className="h-10 rounded-xl border-slate-300 bg-white/95 shadow-sm dark:border-white/15 dark:bg-slate-950/80">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/90 dark:border-white/10">
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                      {p.is_active ? " (Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-4 flex flex-wrap items-end gap-2">
              <Button type="button" variant="outline" onClick={autoPreEnlist} disabled={isEnrollmentLocked} className="rounded-xl">
                <Wand2 className="mr-2 h-4 w-4" />
                Auto
              </Button>
              <Button type="button" onClick={assessEnrollment} disabled={isEnrollmentLocked} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                Assess
              </Button>
              <Button type="button" variant="outline" onClick={openSubjectListPdf} className="rounded-xl">
                <FileDown className="mr-2 h-4 w-4" />
                File
              </Button>
              <Button type="button" variant="outline" onClick={viewCor} className="rounded-xl">
                View COR
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className={`${panelClass} xl:col-span-1`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-slate-100">Available Subjects</CardTitle>
              <CardDescription className="dark:text-slate-300">
                {selectedCurriculumYear && selectedCurriculumSemester
                  ? `Curriculum Evaluation target: Year ${selectedCurriculumYear} - Sem ${selectedCurriculumSemester}`
                  : targetTerm
                    ? `Suggested next term: Year ${targetTerm.year} - Sem ${targetTerm.sem}`
                    : "No curriculum term detected."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEnrollmentLocked ? (
                <div className="rounded-xl border border-dashed border-slate-300/80 px-3 py-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                  Available Subjects is locked after assessment. Your submitted subject list is shown in <span className="font-semibold">Enrolled Subjects</span>.
                </div>
              ) : (
                <>
                  <Select
                    value={selectedAvailableId ? String(selectedAvailableId) : ""}
                    onValueChange={(value) => setSelectedAvailableId(Number(value))}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-slate-300 bg-white/95 shadow-sm dark:border-white/15 dark:bg-slate-950/80">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200/90 dark:border-white/10">
                      {availableSubjects.map((row) => (
                        <SelectItem key={`${row.offeringId}-${row.id}`} value={String(row.offeringId)}>
                          {row.code} - {row.title} | {row.section} | {row.schedule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" className="w-full rounded-xl bg-blue-600 hover:bg-blue-700" onClick={addSelectedSubject}>
                      Add
                    </Button>
                    <Button type="button" variant="outline" className="w-full rounded-xl" onClick={autoPreEnlist}>
                      Add All
                    </Button>
                  </div>
                  {selectedAvailable && (
                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-sm dark:border-blue-400/20 dark:bg-blue-500/10">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        {selectedAvailable.code} - {selectedAvailable.title}
                      </p>
                      <p className="mt-1 text-blue-700 dark:text-blue-200">
                        {selectedAvailable.units} units | Section {selectedAvailable.section} | {selectedAvailable.schedule}
                      </p>
                      {typeof selectedAvailable.slotsLeft === "number" ? (
                        <p className="mt-1 text-blue-700 dark:text-blue-200">Available slots: {selectedAvailable.slotsLeft}</p>
                      ) : null}
                    </div>
                  )}
                  {availableSubjects.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300/80 px-3 py-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      No available subjects found from curriculum evaluation.
                    </div>
                  )}
                  {availableSubjects.length > 0 && (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                      <p className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Available Subjects & Sections</p>
                      <div className="max-h-44 space-y-2 overflow-auto pr-1">
                        {availableSubjects.map((row) => (
                          <button
                            key={`avail-list-${row.offeringId}-${row.id}`}
                            type="button"
                            onClick={() => setSelectedAvailableId(row.offeringId ?? null)}
                            className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                              selectedAvailableId === row.offeringId
                                ? "border-blue-300 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-500/10"
                                : "border-slate-200 bg-white/80 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            }`}
                          >
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {row.code} - {row.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Sec {row.section} | {row.schedule} | {row.units} units
                              {typeof row.slotsLeft === "number" ? ` | Slots: ${row.slotsLeft}` : ""}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className={`${panelClass} xl:col-span-1`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-slate-900 dark:text-slate-100">Pre-Enlisted Subjects</CardTitle>
                <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={removeAllPreEnlisted} disabled={isEnrollmentLocked}>
                  Remove All
                </Button>
              </div>
              <CardDescription className="dark:text-slate-300">Chosen subjects before assessment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isEnrollmentLocked && (
                <div className="rounded-xl border border-dashed border-slate-300/80 px-3 py-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                  Pre-Enlisted is locked after assessment. Changes are disabled until admin review.
                </div>
              )}
              <div className="max-h-[20rem] space-y-2 overflow-auto pr-1">
              {preEnlisted.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-200/90 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{row.code} - {row.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {row.units} units | Sec {row.section} | {row.schedule}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-full">
                      {row.units}u
                    </Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removePreEnlisted(row.id)} disabled={isEnrollmentLocked} className="mt-1 rounded-lg">
                    Remove
                  </Button>
                </div>
              ))}
              </div>
              {preEnlisted.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300/80 px-3 py-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  No pre-enlisted subjects yet.
                </div>
              )}
              <p className="text-right text-sm font-semibold text-slate-800 dark:text-slate-200">Total: {preTotalUnits} units</p>
            </CardContent>
          </Card>

          <Card className={`${panelClass} xl:col-span-1`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-slate-100">Enrolled Subjects</CardTitle>
              <CardDescription className="dark:text-slate-300">Shown after clicking Assess.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="max-h-[20rem] space-y-2 overflow-auto pr-1">
              {enrolledSubjects.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-200/90 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{row.code} - {row.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                    {row.units} units | Sec {row.section} | {row.schedule}
                  </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-full border-emerald-200 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-200">
                      {row.units}u
                    </Badge>
                  </div>
                </div>
              ))}
              </div>
              {enrolledSubjects.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300/80 px-3 py-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  No enrolled subjects yet.
                </div>
              )}
              <p className="text-right text-sm font-semibold text-slate-800 dark:text-slate-200">Total: {enrolledTotalUnits} units</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function StudentEnrollmentPage() {
  return (
    <StudentShell
      initialSection="student-enrollment"
      customSectionContent={{
        "student-enrollment": <StudentEnrollmentContent />,
      }}
    />
  );
}
