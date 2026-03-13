"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, BookOpen, Building2, Calendar, CheckCircle, FileText, MessageSquare, School } from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { AdminCsvImportTrigger } from "@/components/admin/csv-import-trigger";
import { AdminCsvGeneratorTrigger } from "@/components/admin/csv-generator-trigger";
import { GlobalSearchInput } from "@/components/shared/global-search-input";
import { PortalHeader, PortalSidebar } from "@/components/shared/portal-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarActionsMenu } from "@/components/ui/avatar-actions-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Department = {
  id: number;
  name: string;
  head: string;
  faculty: number;
  students: number;
  classes: number;
};

export default function AdminDepartmentCoursesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/admin/departments-overview");
      const rows = (response as { departments?: Department[] }).departments ?? [];
      setDepartments(rows);
    } catch (error) {
      setDepartments([]);
      toast.error(error instanceof Error ? error.message : "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((dept) => `${dept.name} ${dept.head} ${dept.students}`.toLowerCase().includes(q));
  }, [departments, searchQuery]);

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
              <Link href="/admin" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><School className="h-4 w-4" />Dashboard</Link>
              <Link href="/admin" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BarChart3 className="h-4 w-4" />Reports</Link>
              <Link href="/admin/enrollments" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BookOpen className="h-4 w-4" />Enrollments</Link>
              <Link href="/admin/class-scheduling" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><Calendar className="h-4 w-4" />Class Scheduling</Link>
              <Link href="/admin/curriculum" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><FileText className="h-4 w-4" />Curriculum</Link>
            </div>
            <div className="space-y-1 border-t border-slate-200/80 pt-3 dark:border-white/10">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Management</p>
              <Link href="/admin/programs" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BookOpen className="h-4 w-4" />Programs</Link>
              <Link href="/admin/departments" className="flex w-full items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-left text-sm font-medium text-white"><Building2 className="h-4 w-4" />Departments</Link>
              <div className="pl-9">
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100" asChild>
                  <Link href="/admin/departments"><Building2 className="mr-1.5 h-3.5 w-3.5" />School Organizational Chart</Link>
                </Button>
              </div>
              <div className="pl-9">
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/15" asChild>
                  <Link href="/admin/departments/courses-list"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Courses List</Link>
                </Button>
              </div>
              <Link href="/admin/admissions" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><CheckCircle className="h-4 w-4" />Admissions</Link>
              <Link href="/admin/vocationals" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BarChart3 className="h-4 w-4" />Vocationals</Link>
            </div>
          </nav>
        </div>
      </PortalSidebar>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PortalHeader className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
          <div className="px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="-ml-2 flex min-w-0 items-center gap-0 self-stretch">
                <Image src="/tclass_logo.png" alt="TClass Logo" width={90} height={90} className="block h-[90px] w-[90px] shrink-0 self-center object-contain" />
                <span className="-ml-4 hidden text-base font-bold text-slate-900 dark:text-slate-100 md:block">Tarlac Center for Learning and Skills Success</span>
              </div>
              <div className="flex flex-1 items-center justify-end gap-2 xl:gap-3">
                <GlobalSearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search courses..." className="hidden lg:block lg:w-48 xl:w-56 2xl:w-64" />
                <AdminCsvImportTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" />
                <AdminCsvGeneratorTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" />
                <button type="button" className="hidden rounded-full border border-transparent p-2 text-slate-600 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-white/15 dark:hover:bg-white/10 sm:inline-flex">
                  <MessageSquare className="h-5 w-5" />
                </button>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{now ? now.toLocaleTimeString() : "--:--:--"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{now ? now.toLocaleDateString() : "---"}</p>
                </div>
                <AvatarActionsMenu initials="AD" onLogout={handleLogout} name="Administrator" subtitle="admin@tclass.local" triggerName="Administrator" triggerSubtitle="admin@tclass.local" triggerClassName="rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10" fallbackClassName="bg-blue-600 text-white" />
              </div>
            </div>
          </div>
        </PortalHeader>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.16),transparent_45%),linear-gradient(180deg,#020617,#020b16_55%,#020617)]">
          <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Departments Management</h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">Courses List</p>
            </div>

            <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle>Courses</CardTitle>
                <CardDescription>Total student population per course</CardDescription>
                <div className="pt-2 sm:max-w-md">
                  <Input placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={`department-skeleton-${index}`} className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))
                  ) : filteredDepartments.map((dept) => (
                    <div key={dept.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-4 dark:border-white/10 dark:hover:bg-white/5">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/10">
                          <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{dept.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Head: {dept.head || "-"}</p>
                        </div>
                      </div>
                      <div className="grid w-full grid-cols-1 gap-3 text-sm sm:w-auto">
                        <div className="text-center">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{dept.students}</p>
                          <p className="text-slate-500 dark:text-slate-400">Total Students</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loading && filteredDepartments.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                      No courses found for this search.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

