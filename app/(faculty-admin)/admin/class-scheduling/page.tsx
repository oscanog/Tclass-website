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
  Save,
  School,
  Search,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarActionsMenu } from "@/components/ui/avatar-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Period = { id: number; name: string; is_active: number };
type Teacher = { id: number; full_name: string };
type Room = { id: number; room_code: string };
type Section = { id: number; section_code: string; program_name: string; year_level: number };
type Course = { id: number; code: string; title: string; units: number; year_level: number; semester: number; program_key: string };

type ScheduleItem = {
  id: number;
  period_id: number | null;
  course_id: number;
  course_code: string;
  course_title: string;
  units: number;
  section_id: number | null;
  teacher_id: number | null;
  room_id: number | null;
  day_of_week: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | null;
  start_time: string | null;
  end_time: string | null;
  schedule_text: string | null;
  capacity: number;
  enrolled_count: number;
  slots_left: number;
  section_code: string | null;
  teacher_name: string | null;
  room_code: string | null;
};

type RowEdit = {
  section_id: string;
  teacher_id: string;
  room_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toProgramLabel = (programKey: string) => {
  const key = (programKey ?? "").trim().toUpperCase();
  if (!key) return "GENERAL";
  if (key.includes("INFORMATION_TECHNOLOGY")) return "BSIT";
  if (key.includes("COMPUTER_SCIENCE")) return "BSCS";
  if (key.includes("BTVTED")) return "BTVTED";
  return key.replace(/_/g, " ");
};

const normalizeProgram = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

export default function AdminClassSchedulingPage() {
  const router = useRouter();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rows, setRows] = useState<ScheduleItem[]>([]);
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const availablePrograms = useMemo(() => {
    const keys = Array.from(new Set(courses.map((c) => c.program_key).filter(Boolean))).sort();
    return keys;
  }, [courses]);

  const availableYears = useMemo(() => {
    if (programFilter === "all") return [];
    const years = Array.from(
      new Set(
        courses
          .filter((c) => c.program_key === programFilter)
          .map((c) => c.year_level)
      )
    ).sort((a, b) => a - b);
    return years;
  }, [courses, programFilter]);

  const loadMasters = useCallback(async () => {
    const res = await apiFetch("/admin/scheduling/masters");
    const payload = res as {
      periods?: Period[];
      teachers?: Teacher[];
      rooms?: Room[];
      sections?: Section[];
      courses?: Course[];
    };
    setPeriods(payload.periods ?? []);
    setTeachers(payload.teachers ?? []);
    setRooms(payload.rooms ?? []);
    setSections(payload.sections ?? []);
    setCourses(payload.courses ?? []);
  }, []);

  const loadItems = useCallback(async () => {
    const qs = new URLSearchParams();
    if (periodFilter !== "all") qs.set("period_id", periodFilter);
    if (sectionFilter !== "all") qs.set("section_id", sectionFilter);
    if (searchQuery.trim()) qs.set("search", searchQuery.trim());

    const res = await apiFetch(`/admin/scheduling/offerings${qs.size ? `?${qs.toString()}` : ""}`);
    const payload = res as { items?: ScheduleItem[] };
    const items = payload.items ?? [];
    setRows(items);
    setEdits(
      items.reduce<Record<number, RowEdit>>((acc, item) => {
        acc[item.id] = {
          section_id: item.section_id ? String(item.section_id) : "",
          teacher_id: item.teacher_id ? String(item.teacher_id) : "",
          room_id: item.room_id ? String(item.room_id) : "",
          day_of_week: item.day_of_week ?? "",
          start_time: item.start_time ? item.start_time.slice(0, 5) : "",
          end_time: item.end_time ? item.end_time.slice(0, 5) : "",
        };
        return acc;
      }, {})
    );
  }, [periodFilter, searchQuery, sectionFilter]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadMasters(), loadItems()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load class scheduling data.");
    } finally {
      setLoading(false);
    }
  }, [loadItems, loadMasters]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const changedIds = useMemo(
    () =>
      rows
        .filter((row) => {
          const edit = edits[row.id];
          if (!edit) return false;
          return (
            edit.section_id !== (row.section_id ? String(row.section_id) : "") ||
            edit.teacher_id !== (row.teacher_id ? String(row.teacher_id) : "") ||
            edit.room_id !== (row.room_id ? String(row.room_id) : "") ||
            edit.day_of_week !== (row.day_of_week ?? "") ||
            edit.start_time !== (row.start_time ? row.start_time.slice(0, 5) : "") ||
            edit.end_time !== (row.end_time ? row.end_time.slice(0, 5) : "")
          );
        })
        .map((row) => row.id),
    [edits, rows]
  );

  const patchEdit = (offeringId: number, patch: Partial<RowEdit>) => {
    setEdits((prev) => ({
      ...prev,
      [offeringId]: {
        section_id: prev[offeringId]?.section_id ?? "",
        teacher_id: prev[offeringId]?.teacher_id ?? "",
        room_id: prev[offeringId]?.room_id ?? "",
        day_of_week: prev[offeringId]?.day_of_week ?? "",
        start_time: prev[offeringId]?.start_time ?? "",
        end_time: prev[offeringId]?.end_time ?? "",
        ...patch,
      },
    }));
  };

  const buildPayload = (offeringId: number) => {
    const row = rows.find((x) => x.id === offeringId);
    const edit = edits[offeringId];
    if (!edit) return null;
    if (!row) return null;
    if (!edit.section_id || !edit.teacher_id || !edit.room_id || !edit.day_of_week || !edit.start_time || !edit.end_time) {
      return null;
    }
    return {
      offering_id: offeringId,
      period_id: row.period_id,
      course_id: row.course_id,
      section_id: Number(edit.section_id),
      teacher_id: Number(edit.teacher_id),
      room_id: Number(edit.room_id),
      day_of_week: edit.day_of_week,
      start_time: edit.start_time,
      end_time: edit.end_time,
    };
  };

  const saveOne = async (offeringId: number) => {
    const payload = buildPayload(offeringId);
    if (!payload) {
      toast.error("Complete all schedule fields first.");
      return;
    }
    setSavingIds((prev) => new Set(prev).add(offeringId));
    try {
      await apiFetch("/admin/scheduling/offerings/upsert", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await loadItems();
      toast.success("Schedule saved.");
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Failed to save schedule.");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(offeringId);
        return next;
      });
    }
  };

  const saveAllChanged = async () => {
    const payloadItems = changedIds.map((id) => buildPayload(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
    if (payloadItems.length === 0) {
      toast.error("No valid pending changes to save.");
      return;
    }
    setSavingAll(true);
    try {
      await apiFetch("/admin/scheduling/items/bulk-upsert", {
        method: "POST",
        body: JSON.stringify({ items: payloadItems }),
      });
      await loadItems();
      toast.success(`Saved ${payloadItems.length} schedule item(s).`);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Failed to save schedules.");
    } finally {
      setSavingAll(false);
    }
  };

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      if (programFilter !== "all") {
        const sectionProgram = normalizeProgram(section.program_name);
        const selectedProgram = normalizeProgram(toProgramLabel(programFilter));
        if (!sectionProgram.includes(selectedProgram) && !selectedProgram.includes(sectionProgram)) return false;
      }
      if (yearFilter !== "all" && section.year_level !== Number(yearFilter)) return false;
      return true;
    });
  }, [programFilter, sections, yearFilter]);

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      const course = courses.find((c) => c.id === row.course_id);
      if (programFilter !== "all" && course?.program_key !== programFilter) return false;
      if (yearFilter !== "all" && course?.year_level !== Number(yearFilter)) return false;
      return true;
    });
  }, [courses, programFilter, rows, yearFilter]);

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
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">AD</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Administrator</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">admin@tclass.local</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">System Management</p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Admin Portal</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
            <div className="space-y-1">
              <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><School className="h-4 w-4" />Dashboard</Link>
              <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BarChart3 className="h-4 w-4" />Reports</Link>
              <Link href="/admin/enrollments" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BookOpen className="h-4 w-4" />Enrollments</Link>
              <Link href="/admin/class-scheduling" className="flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white"><Calendar className="h-4 w-4" />Class Scheduling</Link>
              <Link href="/admin/curriculum" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><FileText className="h-4 w-4" />Curriculum</Link>
            </div>
            <div className="space-y-1 border-t border-slate-200/80 pt-3 dark:border-white/10">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Management</p>
              <Link href="/admin/departments" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><Building2 className="h-4 w-4" />Departments</Link>
              <Link href="/admin/admissions" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><CheckCircle className="h-4 w-4" />Admissions</Link>
              <Link href="/admin/vocationals" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BarChart3 className="h-4 w-4" />Vocationals</Link>
            </div>
          </nav>
          <div className="border-t border-slate-200/80 px-4 py-3 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">@2026 Copyright - v1.0.0</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
          <div className="px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="-ml-2 flex min-w-0 items-center gap-0 self-stretch">
                <Image src="/tclass_logo.png" alt="TClass Logo" width={90} height={90} className="block h-[90px] w-[90px] shrink-0 self-center object-contain" />
                <span className="-ml-4 hidden text-base font-bold text-slate-900 dark:text-slate-100 md:block">Tarlac Center for Learning and Skills Success</span>
              </div>
              <div className="flex flex-1 items-center justify-end gap-2 xl:gap-3">
                <div className="relative hidden lg:block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search student/course..." className="w-56 rounded-full border-slate-200 bg-slate-50/90 pl-9 dark:border-white/15 dark:bg-slate-900/85" />
                </div>
                <Button type="button" variant="ghost" size="icon" className="hidden sm:inline-flex"><MessageSquare className="h-5 w-5" /></Button>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{now ? now.toLocaleTimeString() : "--:--:--"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{now ? now.toLocaleDateString() : "---"}</p>
                </div>
                <AvatarActionsMenu initials="AD" onLogout={handleLogout} name="Administrator" subtitle="admin@tclass.local" triggerName="Administrator" triggerSubtitle="admin@tclass.local" triggerClassName="rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10" fallbackClassName="bg-blue-600 text-white" />
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.16),transparent_45%),linear-gradient(180deg,#020617,#020b16_55%,#020617)]">
          <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Class Scheduling</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Create and manage offered schedules before students enroll.</p>
              </div>
              <Button onClick={saveAllChanged} disabled={savingAll || changedIds.length === 0} className="gap-2">
                <Save className="h-4 w-4" />
                {savingAll ? "Saving..." : `Save All (${changedIds.length})`}
              </Button>
            </div>

            <Card className="border-slate-200/80 bg-white/95 shadow-xl dark:border-white/10 dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Filter</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Use period, course, year, and section to filter schedule items below.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}{p.is_active ? " (Active)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={programFilter} onValueChange={(v) => {
                  setProgramFilter(v);
                  setYearFilter("all");
                  setSectionFilter("all");
                }}>
                  <SelectTrigger><SelectValue placeholder="Course / Program" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {availablePrograms.map((programKey) => (
                      <SelectItem key={programKey} value={programKey}>{toProgramLabel(programKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={(v) => {
                  setYearFilter(v);
                  setSectionFilter("all");
                }}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year === 1 ? "1st Year" : year === 2 ? "2nd Year" : year === 3 ? "3rd Year" : year === 4 ? "4th Year" : `Year ${year}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sectionFilter} onValueChange={setSectionFilter}>
                  <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {filteredSections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.section_code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/95 shadow-xl dark:border-white/10 dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Schedule Items</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">Conflicts are blocked by section, teacher, and room on overlapping time/day.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading schedule items...</p>
                ) : visibleRows.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No schedulable rows found.</p>
                ) : (
                  visibleRows.map((row) => {
                    const edit = edits[row.id] ?? {
                      section_id: "",
                      teacher_id: "",
                      room_id: "",
                      day_of_week: "",
                      start_time: "",
                      end_time: "",
                    };
                    const isSaving = savingIds.has(row.id);
                    return (
                      <div key={row.id} className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-slate-950/50">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{row.course_code} - {row.course_title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{row.units} unit(s) • {row.enrolled_count}/{row.capacity} enrolled • {row.slots_left} slot(s) left</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Offering #{row.id}</Badge>
                            {row.schedule_text ? <Badge variant="outline">{row.schedule_text}</Badge> : null}
                          </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-7">
                          <Select value={edit.section_id || "__empty"} onValueChange={(v) => patchEdit(row.id, { section_id: v === "__empty" ? "" : v })}>
                            <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty">Section</SelectItem>
                              {sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.section_code}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={edit.teacher_id || "__empty"} onValueChange={(v) => patchEdit(row.id, { teacher_id: v === "__empty" ? "" : v })}>
                            <SelectTrigger><SelectValue placeholder="Teacher" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty">Teacher</SelectItem>
                              {teachers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.full_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={edit.room_id || "__empty"} onValueChange={(v) => patchEdit(row.id, { room_id: v === "__empty" ? "" : v })}>
                            <SelectTrigger><SelectValue placeholder="Room" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty">Room</SelectItem>
                              {rooms.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.room_code}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={edit.day_of_week || "__empty"} onValueChange={(v) => patchEdit(row.id, { day_of_week: v === "__empty" ? "" : v })}>
                            <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty">Day</SelectItem>
                              {days.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input type="time" value={edit.start_time} onChange={(e) => patchEdit(row.id, { start_time: e.target.value })} />
                          <Input type="time" value={edit.end_time} onChange={(e) => patchEdit(row.id, { end_time: e.target.value })} />
                          <Button onClick={() => saveOne(row.id)} disabled={isSaving} className="gap-2">
                            <Save className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
