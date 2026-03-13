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
  School,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { AdminCsvImportTrigger } from "@/components/admin/csv-import-trigger";
import { AdminCsvGeneratorTrigger } from "@/components/admin/csv-generator-trigger";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarActionsMenu } from "@/components/ui/avatar-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalSearchInput } from "@/components/shared/global-search-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type Period = { id: number; name: string; is_active: number };
type Enrollment = {
  id: number;
  student_id?: number;
  status: "draft" | "unofficial" | "official" | "rejected" | "dropped";
  remarks: string | null;
  requested_at: string | null;
  assessed_at: string | null;
  student_name: string;
  student_email: string;
  course_code: string;
  course_title: string;
  units: number;
  schedule: string | null;
  section: string | null;
  period_id: number | null;
  period_name: string | null;
};

type EnrollmentGroup = {
  key: string;
  studentName: string;
  studentEmail: string;
  periodName: string | null;
  status: Enrollment["status"];
  assessedAt: string | null;
  rows: Enrollment[];
  totalUnits: number;
};

function statusBadgeClass(status: Enrollment["status"]) {
  switch (status) {
    case "official":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
    case "unofficial":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
    case "draft":
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
  }
}

export default function AdminEnrollmentsPage() {
  const router = useRouter();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupRemarks, setGroupRemarks] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>("unofficial");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activePeriodId = useMemo(() => periods.find((p) => p.is_active)?.id, [periods]);
  const groupedRows = useMemo<EnrollmentGroup[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? rows.filter((row) =>
          [row.student_name, row.student_email, row.course_code, row.course_title, row.period_name ?? "", row.status]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : rows;

    const map = new Map<string, EnrollmentGroup>();
    for (const row of filtered) {
      const key = `${row.student_id ?? row.student_email}|${row.period_id ?? "none"}|${row.status}`;
      const existing = map.get(key);
      if (existing) {
        existing.rows.push(row);
        existing.totalUnits += Number(row.units ?? 0);
        if (!existing.assessedAt && row.assessed_at) existing.assessedAt = row.assessed_at;
        continue;
      }
      map.set(key, {
        key,
        studentName: row.student_name,
        studentEmail: row.student_email,
        periodName: row.period_name ?? null,
        status: row.status,
        assessedAt: row.assessed_at,
        rows: [row],
        totalUnits: Number(row.units ?? 0),
      });
    }

    return [...map.values()].map((group) => ({
      ...group,
      rows: [...group.rows].sort((a, b) => a.course_code.localeCompare(b.course_code)),
    }));
  }, [rows, searchQuery]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (periodFilter !== "all") qs.set("period_id", periodFilter);

      const res = await apiFetch(`/admin/enrollments${qs.size ? `?${qs.toString()}` : ""}`);
      const payload = res as { periods: Period[]; enrollments: Enrollment[] };
      setPeriods(payload.periods ?? []);
      setRows(payload.enrollments ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load enrollment requests.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, periodFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const decideGroup = async (group: EnrollmentGroup, status: "official" | "rejected") => {
    try {
      await Promise.all(
        group.rows.map((row) =>
          apiFetch(`/admin/enrollments/${row.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status, remarks: groupRemarks[group.key] || null }),
          })
        )
      );
      toast.success(`${status === "official" ? "Approved" : "Rejected"} set for ${group.studentName}.`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update enrollment.");
    }
  };

  const activatePeriod = async (periodId: number) => {
    try {
      await apiFetch(`/admin/enrollment-periods/${periodId}/activate`, { method: "PATCH" });
      toast.success("Active enrollment period updated.");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to activate period.");
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
      <aside className="hidden xl:flex xl:w-64 xl:flex-col xl:border-r xl:border-slate-200/80 xl:bg-white xl:dark:border-white/10 xl:dark:bg-slate-900">
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
                className="flex w-full items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-left text-sm font-medium text-white"
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
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
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
              <Link
                href="/admin/vocationals"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4" />
                Vocationals
              </Link>
            </div>
          </nav>

          <div className="border-t border-slate-200/80 px-4 py-3 dark:border-white/10">
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">@2026 Copyright - v1.0.0</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
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
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search sections..."
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
                    onLogout={handleLogout}
                    name="Administrator"
                    subtitle="admin@tclass.local"
                    triggerName="Administrator"
                    triggerSubtitle="admin@tclass.local"
                    triggerId="admin-enrollments-avatar-menu-trigger"
                    triggerClassName="rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10"
                    fallbackClassName="bg-blue-600 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.16),transparent_45%),linear-gradient(180deg,#020617,#020b16_55%,#020617)]">
          <div className="w-full px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Enrollment Management</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Manage period activation, review assessed subjects, and finalize approvals.
                </p>
              </div>
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Back to Admin
                </Button>
              </Link>
            </div>

            <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Controls</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Filter requests and set active enrollment period.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">Status</p>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="unofficial">Unofficial</SelectItem>
                      <SelectItem value="official">Official</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">Period</p>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
                      <SelectItem value="all">All Periods</SelectItem>
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                          {p.is_active ? " (Active)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">Activate Period</p>
                  <Select
                    value={activePeriodId ? String(activePeriodId) : ""}
                    onValueChange={(value) => activatePeriod(Number(value))}
                  >
                    <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100">
                      <SelectValue placeholder="Choose active period" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Enrollment Requests</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Review unofficial requests and finalize approvals after verification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div key={`enrollment-request-skeleton-${index}`} className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-4 w-64" />
                        <div className="space-y-2 rounded-lg border border-slate-200/70 p-3 dark:border-white/10">
                          {Array.from({ length: 3 }, (_, rowIndex) => (
                            <div key={`enrollment-row-skeleton-${index}-${rowIndex}`} className="grid grid-cols-[120px_minmax(0,1fr)_70px_120px] gap-2">
                              <Skeleton className="h-4" />
                              <Skeleton className="h-4" />
                              <Skeleton className="h-4" />
                              <Skeleton className="h-4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : groupedRows.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400">No enrollment requests found.</p>
                ) : (
                  <div className="space-y-4">
                    {groupedRows.map((group) => (
                      <div
                        key={group.key}
                        className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/40"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{group.studentName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {group.studentEmail} - {group.periodName ?? "-"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Subjects: {group.rows.length} - Total Units: {group.totalUnits.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Assessed: {group.assessedAt ? new Date(group.assessedAt).toLocaleString() : "-"}
                            </p>
                          </div>
                          <Badge className={statusBadgeClass(group.status)}>{group.status}</Badge>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-slate-200/70 dark:border-white/10">
                          <div className="grid grid-cols-[120px_minmax(0,1fr)_70px_120px] gap-2 bg-slate-100/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-300">
                            <span>Code</span>
                            <span>Subject</span>
                            <span>Units</span>
                            <span>Section</span>
                          </div>
                          <div className="divide-y divide-slate-200/70 dark:divide-white/10">
                            {group.rows.map((row) => (
                              <div
                                key={row.id}
                                className="grid grid-cols-[120px_minmax(0,1fr)_70px_120px] gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                              >
                                <span className="font-medium">{row.course_code}</span>
                                <span className="truncate" title={row.course_title}>{row.course_title}</span>
                                <span>{row.units}</span>
                                <span className="truncate" title={row.section ?? "-"}>{row.section ?? "-"}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {group.status === "unofficial" && (
                          <div className="flex flex-col gap-2 lg:flex-row">
                            <Input
                              placeholder="Optional remarks for this student's set"
                              value={groupRemarks[group.key] ?? ""}
                              onChange={(e) =>
                                setGroupRemarks((prev) => ({ ...prev, [group.key]: e.target.value }))
                              }
                              className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />
                            <Button onClick={() => decideGroup(group, "official")} className="lg:min-w-36">
                              Approve Set
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => decideGroup(group, "rejected")}
                              className="lg:min-w-32"
                            >
                              Reject Set
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

