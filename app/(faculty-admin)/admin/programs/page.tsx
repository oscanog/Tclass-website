"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  School,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { AdminCsvImportTrigger } from "@/components/admin/csv-import-trigger";
import { AdminCsvGeneratorTrigger } from "@/components/admin/csv-generator-trigger";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarActionsMenu } from "@/components/ui/avatar-actions-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalSearchInput } from "@/components/shared/global-search-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalHeader, PortalSidebar } from "@/components/shared/portal-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProgramCatalogItem, ProgramCatalogType } from "@/components/programs/program-catalog";

type ProgramCatalogPayload = {
  programs?: ProgramCatalogItem[];
};

type FormState = {
  type: ProgramCatalogType;
  title: string;
  category: string;
  description: string;
  duration: string;
  credential_label: string;
  icon_key: string;
  theme_key: string;
  is_limited_slots: boolean;
  slots_limit: string;
  is_active: boolean;
};

const iconOptions = [
  { value: "truck", label: "Truck" },
  { value: "hard-hat", label: "Hard Hat" },
  { value: "laptop", label: "Laptop" },
  { value: "users", label: "Users" },
  { value: "award", label: "Award" },
  { value: "graduation-cap", label: "Graduation Cap" },
  { value: "briefcase", label: "Briefcase" },
  { value: "book-open", label: "Book Open" },
];

const themeOptions = [
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Purple" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
];

const typeOptions = [
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
];

const emptyForm = (): FormState => ({
  type: "certificate",
  title: "",
  category: "",
  description: "",
  duration: "",
  credential_label: "NCII",
  icon_key: "book-open",
  theme_key: "blue",
  is_limited_slots: false,
  slots_limit: "",
  is_active: true,
});

const normalizeProgram = (program: ProgramCatalogItem): ProgramCatalogItem => ({
  ...program,
  is_limited_slots: Boolean(program.is_limited_slots),
  is_active: Boolean(program.is_active),
  slots_limit:
    typeof program.slots_limit === "number" && Number.isFinite(program.slots_limit) && program.slots_limit > 0
      ? program.slots_limit
      : null,
  enrolled_count: Math.max(0, Number(program.enrolled_count ?? 0)),
  slots_left:
    typeof program.slots_left === "number"
      ? Math.max(0, Number(program.slots_left))
      : typeof program.slots_limit === "number" && Number.isFinite(program.slots_limit)
        ? Math.max(0, Number(program.slots_limit) - Math.max(0, Number(program.enrolled_count ?? 0)))
        : undefined,
});

export default function AdminProgramsPage() {
  const router = useRouter();
  const pageSize = 4;
  const [programs, setPrograms] = useState<ProgramCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | ProgramCatalogType | "inactive">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const query = filterType === "certificate" || filterType === "diploma" ? `?type=${filterType}` : "";
      const response = (await apiFetch(`/admin/programs${query}`)) as ProgramCatalogPayload;
      setPrograms(Array.isArray(response.programs) ? response.programs.map(normalizeProgram) : []);
    } catch (error) {
      setPrograms([]);
      toast.error(error instanceof Error ? error.message : "Failed to load programs.");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  const filteredPrograms = useMemo(() => {
    const rows = filterType === "inactive" ? programs.filter((program) => !program.is_active) : programs;

    if (!searchTerm.trim()) return rows;
    const normalized = searchTerm.trim().toLowerCase();
    return rows.filter((program) =>
      [program.title, program.category, program.description, program.type, program.credential_label]
        .concat(
          ` ${program.is_active ? "active" : "inactive"} ${program.is_limited_slots ? "limited slots" : ""} ${
            program.is_limited_slots &&
            typeof program.slots_limit === "number" &&
            Math.max(0, Number(program.enrolled_count ?? 0)) >= program.slots_limit
              ? "no slots available full"
              : ""
          }`,
        )
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [filterType, programs, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, programs.length]);

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / pageSize));
  const paginatedPrograms = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPrograms.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredPrograms]);

  const paginationSummary =
    filteredPrograms.length === 0
      ? "No records"
      : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredPrograms.length)} of ${filteredPrograms.length}`;

  const handleInputChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (program: ProgramCatalogItem) => {
    setEditingId(program.id);
    setForm({
      type: program.type,
      title: program.title,
      category: program.category,
      description: program.description,
      duration: program.duration,
      credential_label: program.credential_label,
      icon_key: program.icon_key,
      theme_key: program.theme_key,
      is_limited_slots: program.is_limited_slots,
      slots_limit:
        typeof program.slots_limit === "number" && Number.isFinite(program.slots_limit) && program.slots_limit > 0
          ? String(program.slots_limit)
          : "",
      is_active: program.is_active,
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.description.trim() || !form.duration.trim()) {
      toast.error("Please complete the required program details.");
      return;
    }
    if (form.is_limited_slots) {
      const parsedSlots = Number(form.slots_limit);
      const isValidSlots = Number.isInteger(parsedSlots) && parsedSlots > 0;
      if (!isValidSlots) {
        toast.error("Please enter a valid slots limit (whole number greater than 0).");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        duration: form.duration.trim(),
        credential_label: form.credential_label.trim(),
        slots_limit: form.is_limited_slots ? Number(form.slots_limit) : null,
      };

      if (editingId) {
        await apiFetch(`/admin/programs/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Program updated.");
      } else {
        await apiFetch("/admin/programs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Program added.");
      }

      resetForm();
      await loadPrograms();
      setCurrentPage(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save program.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "tclass_token=; path=/; max-age=0; samesite=lax";
    document.cookie = "tclass_role=; path=/; max-age=0; samesite=lax";
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <PortalSidebar className="hidden xl:flex xl:w-64 xl:flex-col xl:border-r xl:border-slate-200/80 xl:bg-white xl:dark:border-white/10 xl:dark:bg-slate-900">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/80 px-4 py-5 dark:border-white/10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-20 w-20 ring-4 ring-blue-100 ring-offset-2 shadow-lg dark:ring-blue-900/50 dark:ring-offset-slate-900">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Administrator</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">admin@tclass.local</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">System Management</p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
            <div className="space-y-1">
              <Link
                href="/admin"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <School className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/admin"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4" />
                Reports
              </Link>
              <Link
                href="/admin/enrollments"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <BookOpen className="h-4 w-4" />
                Enrollments
              </Link>
              <Link
                href="/admin/class-scheduling"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <Calendar className="h-4 w-4" />
                Class Scheduling
              </Link>
              <Link
                href="/admin/curriculum"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <FileText className="h-4 w-4" />
                Curriculum
              </Link>
            </div>

            <div className="space-y-1 border-t border-slate-200/80 pt-3 dark:border-white/10">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Management
              </p>
              <Link
                href="/admin/programs"
                className="flex w-full items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-left text-sm font-medium text-white"
              >
                <BookOpen className="h-4 w-4" />
                Programs
              </Link>
              <Link
                href="/admin/departments"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <Building2 className="h-4 w-4" />
                Departments
              </Link>
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
              <Link
                href="/admin/admissions"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <CheckCircle className="h-4 w-4" />
                Admissions
              </Link>
              <div className="pl-9">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  asChild
                >
                  <Link href="/admin/admissions">
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    View List
                  </Link>
                </Button>
              </div>
              <Link
                href="/admin/vocationals"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4" />
                Vocationals
              </Link>
              <div className="pl-9">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  asChild
                >
                  <Link href="/admin/vocationals">
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    View List
                  </Link>
                </Button>
              </div>
            </div>
          </nav>

          <div className="border-t border-slate-200/80 px-4 py-3 dark:border-white/10">
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">@2026 Copyright - v1.0.0</p>
          </div>
        </div>
      </PortalSidebar>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PortalHeader className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
          <div className="px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="-ml-2 flex min-w-0 items-center gap-0 self-stretch">
                <Image
                  src="/tclass_logo.png"
                  alt="TClass Logo"
                  width={90}
                  height={90}
                  className="block h-[90px] w-[90px] shrink-0 self-center object-contain"
                />
                <span className="-ml-4 hidden text-base font-bold leading-none text-slate-900 dark:text-slate-100 md:block">
                  Tarlac Center for Learning and Skills Success
                </span>
                <span className="-ml-4 hidden text-base font-bold leading-none text-slate-900 dark:text-slate-100 sm:block md:hidden">
                  TCLASS Admin Portal
                </span>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2 xl:gap-3">
                <GlobalSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search programs..."
                  className="hidden lg:block lg:w-48 xl:w-56 2xl:w-64"
                />
                <AdminCsvImportTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" />
                <AdminCsvGeneratorTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hidden rounded-full border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-white/15 dark:hover:bg-white/10 sm:inline-flex"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {now ? now.toLocaleTimeString() : "--:--:--"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {now ? now.toLocaleDateString() : "---"}
                  </p>
                </div>
                <div className="hidden h-5 w-px bg-slate-200 dark:bg-white/10 sm:block" />
                <div className="flex items-center gap-2">
                  <AvatarActionsMenu
                    initials="AD"
                    name="Administrator"
                    email="admin@tclass.local"
                    onLogout={handleLogout}
                    avatarClassName="bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </PortalHeader>

          <main className="flex-1 overflow-y-auto bg-slate-100/80 px-4 py-6 dark:bg-slate-950/80 sm:px-6">
            <div className="w-full space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Program Management</h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Add and maintain the certificate and diploma programs shown to new students before enrollment.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | ProgramCatalogType | "inactive")}>
                    <SelectTrigger className="w-[180px] border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80">
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    New
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
                <Card className="border-slate-200 bg-white/95 shadow-sm xl:sticky xl:top-24 xl:self-start dark:border-white/10 dark:bg-slate-900/95">
                  <CardHeader>
                    <CardTitle>{editingId ? "Edit Program" : "Add Course / Program"}</CardTitle>
                    <CardDescription>Create the public program cards for certificate and diploma enrollment.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={form.type} onValueChange={(value) => handleInputChange("type", value as ProgramCatalogType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {typeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input value={form.category} onChange={(event) => handleInputChange("category", event.target.value)} placeholder="heavy-equipment, ict, business" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Program Title</Label>
                      <Input value={form.title} onChange={(event) => handleInputChange("title", event.target.value)} placeholder="Bachelor of Science in Information Technology" />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={form.description} onChange={(event) => handleInputChange("description", event.target.value)} placeholder="Program summary shown on the public card." />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input value={form.duration} onChange={(event) => handleInputChange("duration", event.target.value)} placeholder="4 years" />
                      </div>
                      <div className="space-y-2">
                        <Label>Credential Label</Label>
                        <Input value={form.credential_label} onChange={(event) => handleInputChange("credential_label", event.target.value)} placeholder="NCII or Degree" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <Select value={form.icon_key} onValueChange={(value) => handleInputChange("icon_key", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select value={form.theme_key} onValueChange={(value) => handleInputChange("theme_key", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {themeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-slate-950/60">
                        <input
                          type="checkbox"
                          checked={Boolean(form.is_limited_slots)}
                          onChange={(event) => {
                            handleInputChange("is_limited_slots", event.target.checked);
                            if (!event.target.checked) handleInputChange("slots_limit", "");
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Limited slots</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Show the public card with a limited slots badge.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-slate-950/60">
                        <input
                          type="checkbox"
                          checked={Boolean(form.is_active)}
                          onChange={(event) => handleInputChange("is_active", event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Active status</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Inactive cards stay visible to students but enrollment is disabled.</p>
                        </div>
                      </label>
                    </div>
                    <div
                      className={`grid overflow-hidden transition-all duration-300 ease-out ${
                        form.is_limited_slots ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0">
                        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-slate-950/60">
                          <Label htmlFor="slots_limit" className="text-slate-800 dark:text-slate-100">Available Slots</Label>
                          <Input
                            id="slots_limit"
                            type="number"
                            min={1}
                            step={1}
                            value={form.slots_limit}
                            onChange={(event) => handleInputChange("slots_limit", event.target.value.replace(/[^\d]/g, ""))}
                            placeholder="e.g. 10"
                            className="bg-white dark:bg-slate-900/80"
                            disabled={!form.is_limited_slots}
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enrollment auto-disables when enrolled count reaches this limit.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="button" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving..." : editingId ? "Update Program" : "Add Program"}
                      </Button>
                      {editingId ? (
                        <Button type="button" variant="outline" onClick={resetForm}>
                          Cancel Edit
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white/95 shadow-sm dark:border-white/10 dark:bg-slate-900/95">
                  <CardHeader className="border-b border-slate-200/80 pb-4 dark:border-white/10">
                    <CardTitle>Published Programs</CardTitle>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <CardDescription>{loading ? "Loading..." : `${filteredPrograms.length} program(s) matched your current filter.`}</CardDescription>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{paginationSummary}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                        Loading program catalog...
                      </div>
                    ) : filteredPrograms.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                        No programs found for the current filter.
                      </div>
                    ) : (
                      paginatedPrograms.map((program) => (
                        <div
                          key={program.id}
                          className={`rounded-2xl border p-4 ${
                            program.is_limited_slots &&
                            typeof program.slots_limit === "number" &&
                            Math.max(0, Number(program.enrolled_count ?? 0)) >= program.slots_limit
                              ? "border-rose-200 bg-rose-50/80 dark:border-rose-500/25 dark:bg-rose-500/10"
                              : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-slate-950/60"
                          }`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              {(() => {
                                const hasSlotLimit = typeof program.slots_limit === "number" && Number.isFinite(program.slots_limit) && program.slots_limit > 0;
                                const enrolledCount = Math.max(0, Number(program.enrolled_count ?? 0));
                                const slotsLeft = typeof program.slots_left === "number" ? Math.max(0, program.slots_left) : hasSlotLimit ? Math.max(0, Number(program.slots_limit) - enrolledCount) : null;
                                const noSlotsAvailable = Boolean(program.is_limited_slots && hasSlotLimit && enrolledCount >= Number(program.slots_limit));
                                return (
                                  <>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                  {program.type}
                                </span>
                                {program.is_limited_slots ? (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                    Limited slots
                                  </span>
                                ) : null}
                                {noSlotsAvailable ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                    No slots available
                                  </span>
                                ) : null}
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    noSlotsAvailable
                                      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                      : program.is_active
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                  }`}
                                >
                                  {noSlotsAvailable ? "Full" : program.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{program.title}</h3>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{program.description}</p>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span>Category: {program.category}</span>
                                <span>Duration: {program.duration}</span>
                                <span>Credential: {program.credential_label}</span>
                                {program.is_limited_slots && hasSlotLimit ? (
                                  <span>
                                    Slots: {enrolledCount}/{program.slots_limit}
                                    {typeof slotsLeft === "number" ? ` (${slotsLeft} left)` : ""}
                                  </span>
                                ) : null}
                              </div>
                                  </>
                                );
                              })()}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => startEdit(program)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {!loading && filteredPrograms.length > 0 ? (
                      <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, index) => index + 1).slice(
                              Math.max(0, currentPage - 3),
                              Math.max(0, currentPage - 3) + 5,
                            ).map((page) => (
                              <Button
                                key={page}
                                type="button"
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                className="min-w-9"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
  );
}

