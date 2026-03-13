"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  School,
  Trash2,
  Upload,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { AdminCsvImportTrigger } from "@/components/admin/csv-import-trigger";
import { AdminCsvGeneratorTrigger } from "@/components/admin/csv-generator-trigger";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarActionsMenu } from "@/components/ui/avatar-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalSearchInput } from "@/components/shared/global-search-input";

type CurriculumVersion = {
  id: number;
  program_name: string;
  label: string;
  effective_ay: string | null;
  version: string;
  source_file_name: string | null;
  is_active: boolean;
  subject_count: number;
  updated_at: string;
};

type SubjectRow = {
  id: number;
  year_level: number;
  semester: number;
  code: string;
  title: string;
  units: string;
  prerequisite_code: string;
};

type SubjectPresetRow = Omit<SubjectRow, "id">;
type CurriculumSubjectView = {
  id: number;
  year_level: number;
  semester: number;
  code: string;
  title: string;
  units: string | number;
  prerequisite_code: string | null;
};

const programs = ["BS Information Technology", "BTVTED", "ICT Diploma", "Hospitality NCII", "Forklift NCII"];
const mkRow = (): SubjectRow => ({ id: Date.now() + Math.random(), year_level: 1, semester: 1, code: "", title: "", units: "3", prerequisite_code: "" });
const formatSemesterLabel = (semester: number) => {
  if (semester === 1) return "1st Semester";
  if (semester === 2) return "2nd Semester";
  if (semester === 3) return "Midyear / Summer";
  return `Semester ${semester}`;
};

const BSIT_TESDA_CURRICULUM_PRESET: SubjectPresetRow[] = [
  { year_level: 1, semester: 1, code: "CC101", title: "Introduction to Computing", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 1, code: "CC102", title: "Computer Programming 1", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 1, code: "GE1", title: "Purposive Communication", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 1, code: "IT25", title: "Multimedia Systems", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 1, code: "HCI101", title: "Introduction to Human Computer Interaction 1", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 1, code: "GE6", title: "Ethics", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 1, code: "GE2", title: "Reading in Philippine History", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 1, code: "PE1", title: "Physical Activities Toward Health and Fitness 1", units: "2", prerequisite_code: "" },
  { year_level: 1, semester: 1, code: "NSTP1", title: "Civic Welfare Training Program 1", units: "3", prerequisite_code: "" },

  { year_level: 1, semester: 2, code: "HCI102", title: "Human and Computer Interaction 2", units: "3", prerequisite_code: "HCI101" },
  { year_level: 1, semester: 2, code: "CC103", title: "Computer Programming 2", units: "3", prerequisite_code: "CC102" },
  { year_level: 1, semester: 2, code: "CC104", title: "Data Structure and Algorithm", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 2, code: "WS101", title: "Web Systems and Technologies 1", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 2, code: "ELEC1", title: "Elective 1", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 2, code: "GE5", title: "Science, Technology and Society", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 2, code: "MS102", title: "Quantitative Methods", units: "3", prerequisite_code: "" },
  { year_level: 1, semester: 2, code: "PE2", title: "Physical Activities Toward Health and Fitness 2", units: "2", prerequisite_code: "" },
  { year_level: 1, semester: 2, code: "NSTP2", title: "Civic Welfare Training Program 2", units: "3", prerequisite_code: "NSTP1" },

  { year_level: 1, semester: 3, code: "SIL1", title: "Supervised-Industry Learning 1", units: "3", prerequisite_code: "" },

  { year_level: 2, semester: 1, code: "PT101", title: "Platform Technologies", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 1, code: "GE3", title: "Mathematics in the Modern World", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 1, code: "WS102", title: "Web Systems and Technologies 2", units: "3", prerequisite_code: "WS101" },
  { year_level: 2, semester: 1, code: "CC105", title: "Information Management", units: "3", prerequisite_code: "CC103" },
  { year_level: 2, semester: 1, code: "PF101", title: "Object-Oriented Programming", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 1, code: "SP101", title: "Social and Professional Issues", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 1, code: "GE4", title: "Understanding the Self", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 1, code: "PE3", title: "Physical Activities Toward Health and Fitness 3", units: "2", prerequisite_code: "" },

  { year_level: 2, semester: 2, code: "IS104", title: "System Analysis and Designs", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 2, code: "IM101", title: "Database Management Systems", units: "3", prerequisite_code: "CC105" },
  { year_level: 2, semester: 2, code: "SIA101", title: "System Integration and Architecture", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 2, code: "CC106", title: "Applications Development and Emerging Technologies", units: "3", prerequisite_code: "CC105" },
  { year_level: 2, semester: 2, code: "NET101", title: "Networking 1", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 2, code: "ELEC2", title: "Elective 2", units: "3", prerequisite_code: "" },
  { year_level: 2, semester: 2, code: "PE4", title: "Physical Activities Toward Health and Fitness 4", units: "2", prerequisite_code: "" },

  { year_level: 2, semester: 3, code: "SIL2", title: "Supervised-Industry Learning 2", units: "3", prerequisite_code: "SIL1" },

  { year_level: 3, semester: 1, code: "RIZAL", title: "Life and Works of Rizal", units: "3", prerequisite_code: "" },
  { year_level: 3, semester: 1, code: "GE7", title: "The Contemporary World", units: "3", prerequisite_code: "" },
  { year_level: 3, semester: 1, code: "SA101", title: "Systems Administration and Maintenance", units: "3", prerequisite_code: "" },
  { year_level: 3, semester: 1, code: "IAS101", title: "Information Assurance and Security 1", units: "3", prerequisite_code: "" },
  { year_level: 3, semester: 1, code: "NET102", title: "Networking 2", units: "3", prerequisite_code: "NET101" },
  { year_level: 3, semester: 1, code: "IPT101", title: "Integrative Programming and Technologies", units: "3", prerequisite_code: "" },
  { year_level: 3, semester: 1, code: "CAP101", title: "Capstone Project and Research 1", units: "3", prerequisite_code: "" },
  { year_level: 3, semester: 1, code: "ELEC3", title: "Elective 3", units: "3", prerequisite_code: "" },

  { year_level: 3, semester: 2, code: "CAP102", title: "Capstone Project and Research 2", units: "3", prerequisite_code: "CAP101" },
  { year_level: 3, semester: 2, code: "FELEC1", title: "Fundamental of BPO 1 (Free Elective 1)", units: "3", prerequisite_code: "" },
  { year_level: 3, semester: 2, code: "IT55", title: "Advance Web Development", units: "3", prerequisite_code: "" },
  { year_level: 3, semester: 2, code: "IAS102", title: "Information Assurance and Security 2", units: "3", prerequisite_code: "IAS101" },

  { year_level: 4, semester: 1, code: "ORIENT1", title: "Student Life and Culture", units: "3", prerequisite_code: "" },
  { year_level: 4, semester: 1, code: "THEO1", title: "Moral Theology", units: "3", prerequisite_code: "" },
  { year_level: 4, semester: 1, code: "ORIENT2", title: "Kapampangan Language and Culture", units: "3", prerequisite_code: "" },
  { year_level: 4, semester: 1, code: "THEO2", title: "The Church and Vatican II", units: "3", prerequisite_code: "" },
  { year_level: 4, semester: 1, code: "FIL1", title: "Mga Natatanging Diskurso sa Wika at Panitikan", units: "3", prerequisite_code: "" },
  { year_level: 4, semester: 1, code: "IT64", title: "Game Development", units: "3", prerequisite_code: "" },

  { year_level: 4, semester: 2, code: "TECHENG1", title: "Technical English 1", units: "3", prerequisite_code: "" },
  { year_level: 4, semester: 2, code: "THEO3", title: "Basic Christian Religious Education", units: "3", prerequisite_code: "" },
  { year_level: 4, semester: 2, code: "FIL2", title: "Sanaysay at Talumpati", units: "3", prerequisite_code: "" },
  { year_level: 4, semester: 2, code: "THEO4", title: "Introduction to Liturgy and Lay Ministry", units: "3", prerequisite_code: "" },
];

function AdminCurriculumPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCurriculumListView = searchParams.get("child") === "list";
  const [now, setNow] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [programName, setProgramName] = useState(programs[0]);
  const [label, setLabel] = useState("");
  const [effectiveAy, setEffectiveAy] = useState("2026-2027");
  const [version, setVersion] = useState("v1");
  const [notes, setNotes] = useState("");
  const [activateNow, setActivateNow] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulkRowsText, setBulkRowsText] = useState("");
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>([mkRow()]);
  const [curricula, setCurricula] = useState<CurriculumVersion[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingCurriculum, setViewingCurriculum] = useState<CurriculumVersion | null>(null);
  const [viewSubjects, setViewSubjects] = useState<CurriculumSubjectView[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadCurricula = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/curricula");
      setCurricula((res as { curricula?: CurriculumVersion[] }).curricula ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load curricula.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurricula();
  }, []);

  const visibleCurricula = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return curricula;
    return curricula.filter((c) => `${c.program_name} ${c.label} ${c.version} ${c.effective_ay ?? ""}`.toLowerCase().includes(q));
  }, [curricula, searchQuery]);

  const validRows = subjectRows.filter((r) => r.code.trim() && r.title.trim());

  const handleLogout = () => {
    document.cookie = "tclass_token=; path=/; max-age=0; samesite=lax";
    document.cookie = "tclass_role=; path=/; max-age=0; samesite=lax";
    router.push("/");
    router.refresh();
  };

  const patchRow = (id: number, patch: Partial<SubjectRow>) => setSubjectRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setSubjectRows((rows) => [...rows, mkRow()]);
  const removeRow = (id: number) => setSubjectRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  const loadBsitPreset = () => {
    setProgramName("BS Information Technology");
    setLabel("BSIT TESDA Curriculum");
    setVersion("v1");
    setSubjectRows(
      BSIT_TESDA_CURRICULUM_PRESET.map((row, index) => ({
        ...row,
        id: Date.now() + index,
      }))
    );
    setBulkRowsText("");
    toast.success(`Loaded BSIT curriculum preset (${BSIT_TESDA_CURRICULUM_PRESET.length} subjects). Upload PDF and save to activate.`);
  };

  const parseBulk = () => {
    const parsed = bulkRowsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => (line.includes("\t") ? line.split("\t") : line.split(",").map((x) => x.trim())))
      .filter((cols) => cols.length >= 5)
      .map((cols, i) => ({
        id: Date.now() + i,
        year_level: Number(cols[0]) || 1,
        semester: Number(cols[1]) || 1,
        code: cols[2] ?? "",
        title: cols[3] ?? "",
        units: cols[4] ?? "3",
        prerequisite_code: cols[5] ?? "",
      }));

    if (!parsed.length) return toast.error("No valid rows parsed.");
    setSubjectRows(parsed);
    toast.success(`Parsed ${parsed.length} rows.`);
  };

  const saveCurriculum = async () => {
    if (!label.trim()) return toast.error("Curriculum label is required.");
    if (!selectedFile) return toast.error("Upload the curriculum PDF file.");
    if (!validRows.length) return toast.error("Add at least one subject row.");

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("program_name", programName);
      fd.append("label", label.trim());
      fd.append("effective_ay", effectiveAy.trim());
      fd.append("version", version.trim());
      fd.append("notes", notes);
      fd.append("activate", activateNow ? "1" : "0");
      fd.append("curriculum_file", selectedFile);
      fd.append(
        "rows",
        JSON.stringify(
          validRows.map((r, i) => ({
            year_level: Number(r.year_level),
            semester: Number(r.semester),
            code: r.code.trim(),
            title: r.title.trim(),
            units: Number(r.units || 3),
            prerequisite_code: r.prerequisite_code.trim() || null,
            sort_order: i + 1,
          }))
        )
      );
      const res = await apiFetch("/admin/curricula", { method: "POST", body: fd });
      toast.success((res as { message?: string }).message ?? "Curriculum saved.");
      setLabel("");
      setNotes("");
      setVersion("v1");
      setSelectedFile(null);
      setBulkRowsText("");
      setSubjectRows([mkRow()]);
      await loadCurricula();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save curriculum.");
    } finally {
      setSaving(false);
    }
  };

  const activateCurriculum = async (id: number) => {
    try {
      setActivatingId(id);
      const res = await apiFetch(`/admin/curricula/${id}/activate`, { method: "PATCH" });
      toast.success((res as { message?: string }).message ?? "Curriculum activated.");
      await loadCurricula();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to activate.");
    } finally {
      setActivatingId(null);
    }
  };

  const openViewCurriculum = async (curriculum: CurriculumVersion) => {
    try {
      setViewLoading(true);
      setViewingCurriculum(curriculum);
      setViewOpen(true);
      const res = await apiFetch(`/admin/curricula/${curriculum.id}/subjects`);
      setViewSubjects((res as { subjects?: CurriculumSubjectView[] }).subjects ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load curriculum subjects.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="hidden xl:flex xl:w-64 xl:flex-col xl:border-r xl:border-slate-200/80 xl:bg-white dark:xl:border-white/10 dark:xl:bg-slate-900">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/80 px-4 py-5 dark:border-white/10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-20 w-20 ring-4 ring-blue-100 ring-offset-2 shadow-lg dark:ring-blue-900/50 dark:ring-offset-slate-900"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">AD</AvatarFallback></Avatar>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Administrator</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">admin@tclass.local</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">System Management</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
            <div className="space-y-1">
              <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><School className="h-4 w-4" />Dashboard</Link>
              <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BarChart3 className="h-4 w-4" />Reports</Link>
              <Link href="/admin/enrollments" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BookOpen className="h-4 w-4" />Enrollments</Link>
              <Link href="/admin/class-scheduling" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><Calendar className="h-4 w-4" />Class Scheduling</Link>
              <div className="space-y-1">
                <Link href="/admin/curriculum" className="flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white"><FileText className="h-4 w-4" />Curriculum</Link>
                <Link
                  href="/admin/curriculum?child=list"
                  className={`ml-6 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    isCurriculumListView
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                      : "text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Curriculum List
                </Link>
              </div>
            </div>
            <div className="space-y-1 border-t border-slate-200/80 pt-3 dark:border-white/10">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Management</p>
              <Link href="/admin/programs" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BookOpen className="h-4 w-4" />Programs</Link>
              <Link href="/admin/departments" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><Building2 className="h-4 w-4" />Departments</Link>
              <div className="pl-9">
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100" asChild>
                  <Link href="/admin/departments"><Building2 className="mr-1.5 h-3.5 w-3.5" />School Organizational Chart</Link>
                </Button>
              </div>
              <div className="pl-9">
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100" asChild>
                  <Link href="/admin/departments/courses-list"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Courses List</Link>
                </Button>
              </div>
              <Link href="/admin/admissions" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><CheckCircle className="h-4 w-4" />Admissions</Link>
              <Link href="/admin/vocationals" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BarChart3 className="h-4 w-4" />Vocationals</Link>
            </div>
          </nav>
          <div className="border-t border-slate-200/80 px-4 py-3 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">@2026 Copyright · v1.0.0</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
          <div className="px-4 sm:px-6"><div className="flex h-16 items-center justify-between gap-4">
            <div className="-ml-2 flex min-w-0 items-center gap-0 self-stretch">
              <Image src="/tclass_logo.png" alt="TClass Logo" width={90} height={90} className="block h-[90px] w-[90px] shrink-0 self-center object-contain" />
              <span className="-ml-4 hidden text-base font-bold text-slate-900 dark:text-slate-100 md:block">Tarlac Center for Learning and Skills Success</span>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 xl:gap-3">
              <GlobalSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search curriculum..."
                className="hidden w-56 lg:block"
              />
              <AdminCsvImportTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" />
                <AdminCsvGeneratorTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" />
              <Button type="button" variant="ghost" size="icon" className="hidden sm:inline-flex"><MessageSquare className="h-5 w-5" /></Button>
              <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{now ? now.toLocaleTimeString() : "--:--:--"}</p><p className="text-xs text-slate-500 dark:text-slate-400">{now ? now.toLocaleDateString() : "---"}</p></div>
              <AvatarActionsMenu initials="AD" onLogout={handleLogout} name="Administrator" subtitle="admin@tclass.local" triggerName="Administrator" triggerSubtitle="admin@tclass.local" triggerClassName="rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10" fallbackClassName="bg-blue-600 text-white" />
            </div>
          </div></div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.16),transparent_45%),linear-gradient(180deg,#020617,#020b16_55%,#020617)]">
          <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
                  {isCurriculumListView ? "Curriculum List" : "Curriculum Management"}
                </h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  {isCurriculumListView
                    ? "Browse curriculum versions and activate the one used for enrollment."
                    : "Upload PDF for reference and save subject rows used by student enrollment."}
                </p>
              </div>
              <Badge className="border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">Dynamic Enrollment Source</Badge>
            </div>

            {!isCurriculumListView && (
            <Card className="border-slate-200/80 bg-white/95 shadow-xl dark:border-white/10 dark:bg-slate-900/60">
              <CardHeader><CardTitle className="text-slate-900 dark:text-slate-100">Important</CardTitle><CardDescription className="text-slate-600 dark:text-slate-400">What reflects to student enrollment now.</CardDescription></CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40">
                  <ol className="space-y-1">
                    <li>1. Upload curriculum version with subject rows.</li>
                    <li>2. Activate the version for the program.</li>
                    <li>3. Student curriculum evaluation + auto pre-enlist use the active version.</li>
                  </ol>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-200">
                  PDF is stored for testing/reference. Subject rows are the actual data source (PDF auto-parsing is not installed on this machine yet).
                </div>
              </CardContent>
            </Card>
            )}

            {!isCurriculumListView && (
            <div className="space-y-6">
              <Card className="border-slate-200/80 bg-white/95 shadow-xl dark:border-white/10 dark:bg-slate-900/60">
                <CardHeader><CardTitle className="text-slate-900 dark:text-slate-100">Create Curriculum Version</CardTitle><CardDescription className="text-slate-600 dark:text-slate-400">Student auto-enlistment reflects the active version per program.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 dark:border-blue-400/20 dark:bg-blue-500/10">
                    <Badge className="bg-blue-600 text-white">Preset</Badge>
                    <p className="text-sm text-blue-900 dark:text-blue-100">Load the provided TESDA-style BS Information Technology curriculum into subject rows.</p>
                    <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={loadBsitPreset}>
                      Load IT Curriculum Preset
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label className="text-slate-700 dark:text-slate-300">Program</Label><Select value={programName} onValueChange={setProgramName}><SelectTrigger className="border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80"><SelectValue /></SelectTrigger><SelectContent>{programs.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label className="text-slate-700 dark:text-slate-300">Effective AY</Label><Input value={effectiveAy} onChange={(e) => setEffectiveAy(e.target.value)} className="border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80" /></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                    <div className="space-y-2"><Label className="text-slate-700 dark:text-slate-300">Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="BTVTED Curriculum 2026" className="border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80" /></div>
                    <div className="space-y-2"><Label className="text-slate-700 dark:text-slate-300">Version</Label><Input value={version} onChange={(e) => setVersion(e.target.value)} className="border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Curriculum PDF</Label>
                    <Input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      PDF is stored for reference only. Enter/paste curriculum subjects manually below.
                    </p>
                  </div>
                  <div className="space-y-2"><Label className="text-slate-700 dark:text-slate-300">Quick Paste Rows (optional)</Label><Textarea rows={3} value={bulkRowsText} onChange={(e) => setBulkRowsText(e.target.value)} placeholder="year, semester, code, title, units, prerequisite (optional)" className="border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80" /><Button type="button" variant="outline" onClick={parseBulk}>Parse Paste</Button></div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40">
                    <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Subject Rows</p><Button type="button" size="sm" variant="outline" onClick={addRow}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button></div>
                    <div className="mb-2 hidden px-2 lg:grid lg:grid-cols-[72px_104px_120px_minmax(220px,1fr)_90px_170px_44px] lg:gap-2 lg:[&>*]:text-center">
                      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Year</p>
                      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Semester</p>
                      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Code</p>
                      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Title</p>
                      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Units</p>
                      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Prerequisite</p>
                      <span />
                    </div>
                    <div className="space-y-2">
                      {subjectRows.map((r) => (
                        <div key={r.id} className="grid items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900/50 lg:grid-cols-[72px_104px_120px_minmax(220px,1fr)_90px_170px_44px] lg:[&>*]:justify-self-center">
                          <Input type="number" min={1} placeholder="Year" value={r.year_level} onChange={(e) => patchRow(r.id, { year_level: Number(e.target.value) || 1 })} className="w-full text-center placeholder:text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                          <Input type="number" min={1} max={3} placeholder="Semester" value={r.semester} onChange={(e) => patchRow(r.id, { semester: Number(e.target.value) || 1 })} className="w-full text-center placeholder:text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                          <Input value={r.code} onChange={(e) => patchRow(r.id, { code: e.target.value })} placeholder="Code" className="w-full text-center placeholder:text-center" />
                          <Input value={r.title} onChange={(e) => patchRow(r.id, { title: e.target.value })} placeholder="Title" className="w-full text-center placeholder:text-center" />
                          <Input value={r.units} onChange={(e) => patchRow(r.id, { units: e.target.value })} placeholder="Units" className="w-full text-center placeholder:text-center" />
                          <Input value={r.prerequisite_code} onChange={(e) => patchRow(r.id, { prerequisite_code: e.target.value })} placeholder="Prerequisite" className="w-full text-center placeholder:text-center" />
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeRow(r.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Valid rows: {validRows.length}. Required fields per row: Year, Semester, Code, Title, Units.</p>
                  </div>

                  <div className="space-y-2"><Label className="text-slate-700 dark:text-slate-300">Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80" /></div>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={activateNow} onChange={(e) => setActivateNow(e.target.checked)} />Activate after upload</label>
                  <Button onClick={saveCurriculum} disabled={saving} className="gap-2"><Upload className="h-4 w-4" />{saving ? "Saving..." : "Upload / Save Curriculum"}</Button>
                </CardContent>
              </Card>
            </div>
            )}

            {isCurriculumListView && (
            <Card id="curriculum-versions" className="border-slate-200/80 bg-white/95 shadow-xl dark:border-white/10 dark:bg-slate-900/60">
              <CardHeader><CardTitle className="text-slate-900 dark:text-slate-100">Curriculum Versions</CardTitle><CardDescription className="text-slate-600 dark:text-slate-400">Activate a version to make it reflect in enrollment.</CardDescription></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div key={`curricula-skeleton-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="mt-2 h-4 w-80" />
                        <Skeleton className="mt-2 h-4 w-52" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleCurricula.map((c) => (
                      <div key={c.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{c.label}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{c.program_name} · AY {c.effective_ay ?? "-"} · {c.version} · {c.subject_count} subjects</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{c.source_file_name ?? "No PDF"} · {new Date(c.updated_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={c.is_active ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}>{c.is_active ? "active" : "draft"}</Badge>
                          <Button type="button" size="sm" variant="outline" onClick={() => openViewCurriculum(c)} className="gap-1">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button type="button" size="sm" variant="outline" disabled={c.is_active || activatingId === c.id} onClick={() => activateCurriculum(c.id)}>{activatingId === c.id ? "Activating..." : "Set Active"}</Button>
                        </div>
                      </div>
                    ))}
                    {!visibleCurricula.length && <p className="text-sm text-slate-500 dark:text-slate-400">No curriculum versions found.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>

          <Dialog open={viewOpen} onOpenChange={setViewOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{viewingCurriculum?.label ?? "Curriculum"} - Subjects</DialogTitle>
                <DialogDescription>
                  {viewingCurriculum ? `${viewingCurriculum.program_name} · AY ${viewingCurriculum.effective_ay ?? "-"} · ${viewingCurriculum.version}` : "Curriculum subjects"}
                </DialogDescription>
              </DialogHeader>
              {viewLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }, (_, index) => (
                    <div key={`subject-view-skeleton-${index}`} className="grid grid-cols-6 gap-2">
                      <Skeleton className="h-5" />
                      <Skeleton className="h-5" />
                      <Skeleton className="h-5" />
                      <Skeleton className="col-span-2 h-5" />
                      <Skeleton className="h-5" />
                    </div>
                  ))}
                </div>
              ) : !viewSubjects.length ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No subjects found for this curriculum.</p>
              ) : (
                <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-200 dark:border-white/10">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/90">
                      <tr className="text-left text-slate-600 dark:text-slate-300">
                        <th className="px-3 py-2">Year</th>
                        <th className="px-3 py-2">Semester</th>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Units</th>
                        <th className="px-3 py-2">Prerequisite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewSubjects.map((subject) => (
                        <tr key={subject.id} className="border-t border-slate-100 dark:border-white/10">
                          <td className="px-3 py-2">{subject.year_level}</td>
                          <td className="px-3 py-2">{formatSemesterLabel(subject.semester)}</td>
                          <td className="px-3 py-2 font-medium">{subject.code}</td>
                          <td className="px-3 py-2">{subject.title}</td>
                          <td className="px-3 py-2">{subject.units}</td>
                          <td className="px-3 py-2">{subject.prerequisite_code || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

export default function AdminCurriculumPage() {
  return (
    <Suspense fallback={null}>
      <AdminCurriculumPageContent />
    </Suspense>
  );
}


