"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  Eye,
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
  id: number | null;
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

type PlannedSchedule = {
  key: string;
  rowKey: string | null;
  period_id: number;
  offering_id: number | null;
  course_code: string;
  section_id: number;
  teacher_id: number;
  room_id: number;
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
const inferSemesterFromPeriodName = (name?: string | null): number | null => {
  const value = (name ?? "").toLowerCase();
  if (!value) return null;
  if (value.includes("1st semester")) return 1;
  if (value.includes("2nd semester")) return 2;
  if (value.includes("summer")) return 3;
  return null;
};

const getRowKey = (row: ScheduleItem) => (row.id ? `o-${row.id}` : `c-${row.course_id}`);
const emptyEdit = (): RowEdit => ({
  section_id: "",
  teacher_id: "",
  room_id: "",
  day_of_week: "",
  start_time: "",
  end_time: "",
});
const isEditBlank = (edit?: RowEdit) =>
  !edit || (!edit.section_id && !edit.teacher_id && !edit.room_id && !edit.day_of_week && !edit.start_time && !edit.end_time);
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
};
const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
  const as = toMinutes(aStart);
  const ae = toMinutes(aEnd);
  const bs = toMinutes(bStart);
  const be = toMinutes(bEnd);
  if (![as, ae, bs, be].every(Number.isFinite)) return false;
  return as < be && ae > bs;
};

export default function AdminClassSchedulingPage() {
  const router = useRouter();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rows, setRows] = useState<ScheduleItem[]>([]);
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [rollingPeriod, setRollingPeriod] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [pastPeriodFilter, setPastPeriodFilter] = useState<string>("");
  const [viewPastRecords, setViewPastRecords] = useState(false);
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [now, setNow] = useState<Date | null>(null);
  const [periodOfferings, setPeriodOfferings] = useState<ScheduleItem[]>([]);

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

  const selectedPeriod = useMemo(
    () => periods.find((p) => String(p.id) === periodFilter) ?? null,
    [periodFilter, periods]
  );
  const effectivePeriodFilter = useMemo(
    () => (viewPastRecords ? pastPeriodFilter : periodFilter),
    [pastPeriodFilter, periodFilter, viewPastRecords]
  );
  const targetSemester = useMemo(
    () => inferSemesterFromPeriodName(selectedPeriod?.name ?? null),
    [selectedPeriod]
  );
  const isFilterReady = useMemo(
    () => programFilter !== "all" && yearFilter !== "all",
    [programFilter, yearFilter]
  );

  const activePeriod = useMemo(
    () => periods.find((p) => Number(p.is_active) === 1) ?? null,
    [periods]
  );

  const extractAy = useCallback((name: string) => {
    const match = name.match(/AY\s+(\d{4}-\d{4})/i);
    return match?.[1] ?? null;
  }, []);

  const activeAy = useMemo(() => (activePeriod ? extractAy(activePeriod.name) : null), [activePeriod, extractAy]);

  const currentAyPeriods = useMemo(() => {
    if (!activeAy) return periods;
    return periods.filter((p) => extractAy(p.name) === activeAy);
  }, [activeAy, extractAy, periods]);

  const pastAyPeriods = useMemo(() => {
    if (!activeAy) return [];
    return periods.filter((p) => extractAy(p.name) !== activeAy);
  }, [activeAy, extractAy, periods]);

  useEffect(() => {
    if (viewPastRecords) return;
    if (periodFilter === "all") {
      if (activePeriod) setPeriodFilter(String(activePeriod.id));
      return;
    }
    if (!currentAyPeriods.some((p) => String(p.id) === periodFilter)) {
      if (activePeriod) setPeriodFilter(String(activePeriod.id));
      else setPeriodFilter("all");
    }
  }, [activePeriod, currentAyPeriods, periodFilter, viewPastRecords]);

  useEffect(() => {
    if (!viewPastRecords) return;
    if (!pastAyPeriods.length) {
      setPastPeriodFilter("");
      return;
    }
    if (!pastPeriodFilter || !pastAyPeriods.some((p) => String(p.id) === pastPeriodFilter)) {
      setPastPeriodFilter(String(pastAyPeriods[0].id));
    }
  }, [pastAyPeriods, pastPeriodFilter, viewPastRecords]);

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
    if (effectivePeriodFilter && effectivePeriodFilter !== "all") qs.set("period_id", effectivePeriodFilter);
    if (sectionFilter !== "all") qs.set("section_id", sectionFilter);
    if (searchQuery.trim()) qs.set("search", searchQuery.trim());

    const res = await apiFetch(`/admin/scheduling/offerings${qs.size ? `?${qs.toString()}` : ""}`);
    const payload = res as { items?: ScheduleItem[] };
    const items = payload.items ?? [];
    setRows(items);
    setEdits(
      items.reduce<Record<string, RowEdit>>((acc, item) => {
        acc[getRowKey(item)] = emptyEdit();
        return acc;
      }, {})
    );
  }, [effectivePeriodFilter, searchQuery, sectionFilter]);

  const loadConflictPool = useCallback(async () => {
    if (!effectivePeriodFilter || effectivePeriodFilter === "all") {
      setPeriodOfferings([]);
      return;
    }

    try {
      const res = await apiFetch(`/admin/scheduling/offerings?period_id=${effectivePeriodFilter}`);
      const payload = res as { items?: ScheduleItem[] };
      setPeriodOfferings(payload.items ?? []);
    } catch {
      setPeriodOfferings([]);
    }
  }, [effectivePeriodFilter]);

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

  useEffect(() => {
    void loadConflictPool();
  }, [loadConflictPool]);

  const curriculumRows = useMemo(() => {
    if (!isFilterReady) return [] as ScheduleItem[];
    const coursesInScope = courses
      .filter((course) => {
        if (programFilter !== "all" && course.program_key !== programFilter) return false;
        if (yearFilter !== "all" && course.year_level !== Number(yearFilter)) return false;
        if (targetSemester && course.semester !== targetSemester) return false;
        return true;
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    const byCourse = new Map<number, ScheduleItem>();
    for (const row of rows) {
      if (!byCourse.has(row.course_id)) byCourse.set(row.course_id, row);
    }

    return coursesInScope.map((course) => {
      const existing = byCourse.get(course.id);
      if (existing) return existing;
      return {
        id: null,
        period_id: selectedPeriod?.id ?? activePeriod?.id ?? null,
        course_id: course.id,
        course_code: course.code,
        course_title: course.title,
        units: Number(course.units),
        section_id: null,
        teacher_id: null,
        room_id: null,
        day_of_week: null,
        start_time: null,
        end_time: null,
        schedule_text: null,
        capacity: 40,
        enrolled_count: 0,
        slots_left: 40,
        section_code: null,
        teacher_name: null,
        room_code: null,
      };
    });
  }, [activePeriod, courses, isFilterReady, programFilter, rows, selectedPeriod, targetSemester, yearFilter]);

  const visibleRows = useMemo(() => {
    if (!searchQuery.trim()) return curriculumRows;
    const keyword = searchQuery.trim().toLowerCase();
    return curriculumRows.filter((row) =>
      row.course_code.toLowerCase().includes(keyword) ||
      row.course_title.toLowerCase().includes(keyword)
    );
  }, [curriculumRows, searchQuery]);

  const changedIds = useMemo(
    () =>
      visibleRows
        .filter((row) => {
          const edit = edits[getRowKey(row)];
          if (isEditBlank(edit)) return false;
          return (
            edit.section_id !== (row.section_id ? String(row.section_id) : "") ||
            edit.teacher_id !== (row.teacher_id ? String(row.teacher_id) : "") ||
            edit.room_id !== (row.room_id ? String(row.room_id) : "") ||
            edit.day_of_week !== (row.day_of_week ?? "") ||
            edit.start_time !== (row.start_time ? row.start_time.slice(0, 5) : "") ||
            edit.end_time !== (row.end_time ? row.end_time.slice(0, 5) : "")
          );
        })
        .map((row) => getRowKey(row)),
    [edits, visibleRows]
  );

  const rowValidationMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const row of visibleRows) {
      const rowKey = getRowKey(row);
      const edit = edits[rowKey];
      if (isEditBlank(edit)) continue;

      const missing: string[] = [];
      if (!row.period_id) missing.push("Period");
      if (!edit.section_id) missing.push("Section");
      if (!edit.teacher_id) missing.push("Teacher");
      if (!edit.room_id) missing.push("Room");
      if (!edit.day_of_week) missing.push("Day");
      if (!edit.start_time) missing.push("Start Time");
      if (!edit.end_time) missing.push("End Time");

      if (missing.length > 0) {
        map[rowKey] = missing;
      }
    }
    return map;
  }, [edits, visibleRows]);

  const localConflictMap = useMemo(() => {
    const candidates: PlannedSchedule[] = visibleRows
      .map((row) => {
        const rowKey = getRowKey(row);
        const edit = edits[rowKey];
        if (isEditBlank(edit) || !row.period_id) return null;
        if (!edit.section_id || !edit.teacher_id || !edit.room_id || !edit.day_of_week || !edit.start_time || !edit.end_time) return null;
        return {
          key: row.id ? `offering-${row.id}` : `new-${row.course_id}-${rowKey}`,
          rowKey,
          period_id: Number(row.period_id),
          offering_id: row.id ? Number(row.id) : null,
          course_code: row.course_code,
          section_id: Number(edit.section_id),
          teacher_id: Number(edit.teacher_id),
          room_id: Number(edit.room_id),
          day_of_week: edit.day_of_week,
          start_time: edit.start_time,
          end_time: edit.end_time,
        } satisfies PlannedSchedule;
      })
      .filter((v): v is PlannedSchedule => Boolean(v));

    const updatingOfferingIds = new Set(candidates.map((c) => c.offering_id).filter((v): v is number => Number.isInteger(v)));

    const existing: PlannedSchedule[] = periodOfferings
      .filter((row) => {
        if (!row.id || updatingOfferingIds.has(Number(row.id))) return false;
        if (!row.period_id || !row.section_id || !row.teacher_id || !row.room_id || !row.day_of_week || !row.start_time || !row.end_time) return false;
        return true;
      })
      .map((row) => ({
        key: `existing-${row.id}`,
        rowKey: null,
        period_id: Number(row.period_id),
        offering_id: Number(row.id),
        course_code: row.course_code,
        section_id: Number(row.section_id),
        teacher_id: Number(row.teacher_id),
        room_id: Number(row.room_id),
        day_of_week: String(row.day_of_week),
        start_time: String(row.start_time).slice(0, 5),
        end_time: String(row.end_time).slice(0, 5),
      }));

    const schedules = [...existing, ...candidates];
    const byRowKey = new Map<string, Set<string>>();
    const addConflict = (rowKey: string | null, message: string) => {
      if (!rowKey) return;
      if (!byRowKey.has(rowKey)) byRowKey.set(rowKey, new Set());
      byRowKey.get(rowKey)?.add(message);
    };

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const a = schedules[i];
        const b = schedules[j];
        if (a.period_id !== b.period_id) continue;
        if (a.day_of_week !== b.day_of_week) continue;
        if (!overlaps(a.start_time, a.end_time, b.start_time, b.end_time)) continue;

        const types: string[] = [];
        if (a.room_id === b.room_id) types.push("Room");
        if (a.teacher_id === b.teacher_id) types.push("Teacher");
        if (a.section_id === b.section_id) types.push("Section");
        if (types.length === 0) continue;

        addConflict(a.rowKey, `${types.join("/")} conflict with ${b.course_code} (${b.day_of_week} ${b.start_time}-${b.end_time})`);
        addConflict(b.rowKey, `${types.join("/")} conflict with ${a.course_code} (${a.day_of_week} ${a.start_time}-${a.end_time})`);
      }
    }

    return Object.fromEntries([...byRowKey.entries()].map(([k, v]) => [k, [...v]]));
  }, [edits, periodOfferings, visibleRows]);

  const patchEdit = (rowKey: string, patch: Partial<RowEdit>) => {
    setEdits((prev) => ({
      ...prev,
      [rowKey]: {
        section_id: prev[rowKey]?.section_id ?? "",
        teacher_id: prev[rowKey]?.teacher_id ?? "",
        room_id: prev[rowKey]?.room_id ?? "",
        day_of_week: prev[rowKey]?.day_of_week ?? "",
        start_time: prev[rowKey]?.start_time ?? "",
        end_time: prev[rowKey]?.end_time ?? "",
        ...patch,
      },
    }));
  };

  const buildPayload = (rowKey: string) => {
    const row = visibleRows.find((x) => getRowKey(x) === rowKey);
    const edit = edits[rowKey];
    if (!edit) return null;
    if (!row) return null;
    if (!row.period_id) return null;
    if (!edit.section_id || !edit.teacher_id || !edit.room_id || !edit.day_of_week || !edit.start_time || !edit.end_time) {
      return null;
    }
    const payload: Record<string, unknown> = {
      period_id: row.period_id,
      course_id: row.course_id,
      section_id: Number(edit.section_id),
      teacher_id: Number(edit.teacher_id),
      room_id: Number(edit.room_id),
      day_of_week: edit.day_of_week,
      start_time: edit.start_time,
      end_time: edit.end_time,
    };
    if (row.id) payload.offering_id = row.id;
    return payload;
  };

  const saveOne = async (rowKey: string) => {
    const missing = rowValidationMap[rowKey] ?? [];
    if (missing.length > 0) {
      toast.error(`Complete required fields first: ${missing.join(", ")}`);
      return;
    }
    const payload = buildPayload(rowKey);
    if (!payload) {
      toast.error("Complete all schedule fields first.");
      return;
    }
    if ((localConflictMap[rowKey] ?? []).length > 0) {
      toast.error("Conflict found. Resolve highlighted row first.");
      return;
    }
    setSavingIds((prev) => new Set(prev).add(rowKey));
    try {
      await apiFetch("/admin/scheduling/offerings/upsert", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await loadItems();
      await loadConflictPool();
      setEdits((prev) => ({
        ...prev,
        [rowKey]: emptyEdit(),
      }));
      toast.success("Schedule saved.");
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Failed to save schedule.");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });
    }
  };

  const saveAllChanged = async () => {
    const incompleteChanged = changedIds.filter((id) => (rowValidationMap[id] ?? []).length > 0);
    if (incompleteChanged.length > 0) {
      toast.error(`Cannot save all: ${incompleteChanged.length} row(s) have missing required fields.`);
      return;
    }

    const conflictingChanged = changedIds.filter((id) => (localConflictMap[id] ?? []).length > 0);
    if (conflictingChanged.length > 0) {
      toast.error(`Conflict detected in ${conflictingChanged.length} row(s). Check highlighted items.`);
      return;
    }

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
      await loadConflictPool();
      setEdits((prev) => {
        const next = { ...prev };
        for (const id of changedIds) {
          next[id] = emptyEdit();
        }
        return next;
      });
      toast.success(`Saved ${payloadItems.length} schedule item(s).`);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Failed to save schedules.");
    } finally {
      setSavingAll(false);
    }
  };

  const advanceToNextPeriod = async () => {
    const proceed = window.confirm("Advance active enrollment period to the next term?");
    if (!proceed) return;

    setRollingPeriod(true);
    try {
      const res = await apiFetch("/admin/enrollment-periods/rollover", {
        method: "POST",
      });
      const payload = res as { to?: { id?: number; name?: string } };
      const nextId = payload.to?.id;
      if (nextId) {
        setPeriodFilter(String(nextId));
        setViewPastRecords(false);
      }
      await loadAll();
      toast.success(payload.to?.name ? `Active period is now ${payload.to.name}.` : "Enrollment period advanced.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to advance period.");
    } finally {
      setRollingPeriod(false);
    }
  };

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      if (programFilter !== "all") {
        const sectionProgram = normalizeProgram(section.program_name);
        const sectionCode = normalizeProgram(section.section_code);
        const selectedProgram = normalizeProgram(toProgramLabel(programFilter));
        const matchesProgram =
          sectionProgram.includes(selectedProgram) ||
          selectedProgram.includes(sectionProgram) ||
          sectionCode.includes(selectedProgram);
        if (!matchesProgram) return false;
      }
      if (yearFilter !== "all" && section.year_level !== Number(yearFilter)) return false;
      return true;
    });
  }, [programFilter, sections, yearFilter]);

  useEffect(() => {
    if (sectionFilter === "all") return;
    setEdits((prev) => {
      const next = { ...prev };
      for (const row of visibleRows) {
        const rowKey = getRowKey(row);
        const current = next[rowKey] ?? {
          section_id: row.section_id ? String(row.section_id) : "",
          teacher_id: row.teacher_id ? String(row.teacher_id) : "",
          room_id: row.room_id ? String(row.room_id) : "",
          day_of_week: row.day_of_week ?? "",
          start_time: row.start_time ? row.start_time.slice(0, 5) : "",
          end_time: row.end_time ? row.end_time.slice(0, 5) : "",
        };
        if (current.section_id !== sectionFilter) {
          next[rowKey] = { ...current, section_id: sectionFilter };
        }
      }
      return next;
    });
  }, [sectionFilter, visibleRows]);

  useEffect(() => {
    if (sectionFilter !== "all") return;
    setEdits((prev) => {
      const next = { ...prev };
      for (const row of visibleRows) {
        const rowKey = getRowKey(row);
        const current = next[rowKey] ?? {
          section_id: row.section_id ? String(row.section_id) : "",
          teacher_id: row.teacher_id ? String(row.teacher_id) : "",
          room_id: row.room_id ? String(row.room_id) : "",
          day_of_week: row.day_of_week ?? "",
          start_time: row.start_time ? row.start_time.slice(0, 5) : "",
          end_time: row.end_time ? row.end_time.slice(0, 5) : "",
        };
        if (current.section_id !== "") {
          next[rowKey] = { ...current, section_id: "" };
        }
      }
      return next;
    });
  }, [sectionFilter, visibleRows]);

  const handleLogout = () => {
    document.cookie = "tclass_token=; path=/; max-age=0; samesite=lax";
    document.cookie = "tclass_role=; path=/; max-age=0; samesite=lax";
    router.push("/");
    router.refresh();
  };

  const toggleViewPastRecords = () => {
    if (!viewPastRecords && pastAyPeriods.length === 0) {
      toast.error("No past periods found.");
      return;
    }
    setViewPastRecords((prev) => !prev);
  };

  const selectedSectionCode = useMemo(
    () => sections.find((s) => String(s.id) === sectionFilter)?.section_code ?? "",
    [sectionFilter, sections]
  );

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
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={advanceToNextPeriod} disabled={rollingPeriod}>
                  <ArrowRightLeft className="h-4 w-4" />
                  {rollingPeriod ? "Switching..." : "Advance Period"}
                </Button>
                <Button onClick={saveAllChanged} disabled={viewPastRecords || savingAll || changedIds.length === 0} className="gap-2">
                  <Save className="h-4 w-4" />
                  {savingAll ? "Saving..." : `Save All (${changedIds.length})`}
                </Button>
              </div>
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
                    {currentAyPeriods.map((p) => (
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
                }} disabled={programFilter === "all"}>
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
                <Select value={sectionFilter} onValueChange={setSectionFilter} disabled={programFilter === "all" || yearFilter === "all"}>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Schedule Items</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      {viewPastRecords
                        ? "Viewing past records only. Editing is disabled."
                        : "Conflicts are blocked by section, teacher, and room on overlapping time/day."}
                    </CardDescription>
                    {sectionFilter !== "all" ? (
                      <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-300">
                        Editing subjects under one section set: {sections.find((s) => String(s.id) === sectionFilter)?.section_code ?? "Selected section"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {viewPastRecords ? (
                      <Select value={pastPeriodFilter || "__empty"} onValueChange={(v) => setPastPeriodFilter(v === "__empty" ? "" : v)}>
                        <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select past period" /></SelectTrigger>
                        <SelectContent>
                          {pastAyPeriods.length === 0 ? (
                            <SelectItem value="__empty" disabled>No past periods</SelectItem>
                          ) : (
                            pastAyPeriods.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : null}
                    <Button type="button" variant="outline" onClick={toggleViewPastRecords} className="gap-2">
                      <Eye className="h-4 w-4" />
                      {viewPastRecords ? "Back to Current" : "View Past Records"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading schedule items...</p>
                ) : !viewPastRecords && !isFilterReady ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Fill the filter first (Course and Year) to display subjects.
                  </p>
                ) : visibleRows.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No schedulable rows found.</p>
                ) : (
                  visibleRows.map((row) => {
                    const rowKey = getRowKey(row);
                    const edit = edits[rowKey] ?? {
                      section_id: "",
                      teacher_id: "",
                      room_id: "",
                      day_of_week: "",
                      start_time: "",
                      end_time: "",
                    };
                    const isSaving = savingIds.has(rowKey);
                    const rowMissing = rowValidationMap[rowKey] ?? [];
                    const hasMissing = rowMissing.length > 0;
                    const rowConflicts = localConflictMap[rowKey] ?? [];
                    const hasConflict = rowConflicts.length > 0;
                    return (
                      <div
                        key={rowKey}
                        className={`rounded-xl border p-3 ${
                          hasConflict
                            ? "border-rose-300 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-950/20"
                            : hasMissing
                              ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-950/20"
                            : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/50"
                        }`}
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{row.course_code} - {row.course_title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{row.units} unit(s) • {row.enrolled_count}/{row.capacity} enrolled • {row.slots_left} slot(s) left</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{row.id ? `Offering #${row.id}` : "Not yet scheduled"}</Badge>
                            {row.schedule_text ? <Badge variant="outline">{row.schedule_text}</Badge> : null}
                          </div>
                        </div>
                        {hasConflict ? (
                          <div className="mb-2 rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/20 dark:text-rose-200">
                            {rowConflicts.join(" | ")}
                          </div>
                        ) : null}
                        {!hasConflict && hasMissing ? (
                          <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/20 dark:text-amber-200">
                            Missing required: {rowMissing.join(", ")}
                          </div>
                        ) : null}
                        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-7">
                          <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
                            {sectionFilter !== "all" ? (selectedSectionCode || "Selected section") : "Choose section"}
                          </div>
                          <Select value={edit.teacher_id || "__empty"} onValueChange={(v) => patchEdit(rowKey, { teacher_id: v === "__empty" ? "" : v })}>
                            <SelectTrigger disabled={viewPastRecords}><SelectValue placeholder="Teacher" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty">Teacher</SelectItem>
                              {teachers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.full_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={edit.room_id || "__empty"} onValueChange={(v) => patchEdit(rowKey, { room_id: v === "__empty" ? "" : v })}>
                            <SelectTrigger disabled={viewPastRecords}><SelectValue placeholder="Room" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty">Room</SelectItem>
                              {rooms.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.room_code}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={edit.day_of_week || "__empty"} onValueChange={(v) => patchEdit(rowKey, { day_of_week: v === "__empty" ? "" : v })}>
                            <SelectTrigger disabled={viewPastRecords}><SelectValue placeholder="Day" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty">Day</SelectItem>
                              {days.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input type="time" value={edit.start_time} onChange={(e) => patchEdit(rowKey, { start_time: e.target.value })} disabled={viewPastRecords} />
                          <Input type="time" value={edit.end_time} onChange={(e) => patchEdit(rowKey, { end_time: e.target.value })} disabled={viewPastRecords} />
                          <Button onClick={() => saveOne(rowKey)} disabled={viewPastRecords || isSaving} className="gap-2">
                            <Save className="h-4 w-4" />
                            {viewPastRecords ? "View Only" : isSaving ? "Saving..." : "Save"}
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
