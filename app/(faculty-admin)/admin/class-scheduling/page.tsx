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
  ShieldCheck,
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
import { clearPortalSessionUserCache, usePortalSessionUser } from "@/lib/portal-session-user";

type Period = { id: number; name: string; is_active: number };
type Teacher = { id: number; full_name: string };
type Room = {
  id: number;
  room_code: string;
  title?: string | null;
  description?: string | null;
  icon_key?: string | null;
  building?: string | null;
  capacity?: number | null;
  is_active?: boolean | number;
  created_at?: string | null;
  updated_at?: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
};
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
  updated_at?: string | null;
  updated_by_user_id?: number | null;
  updated_by_name?: string | null;
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
type SchedulingMastersPayload = {
  periods: Period[];
  teachers: Teacher[];
  rooms: Room[];
  sections: Section[];
  courses: Course[];
};

type RoomAvailabilityItem = {
  room_id: number;
  room_code: string;
  title?: string | null;
  description?: string | null;
  icon_key?: string | null;
  building?: string | null;
  capacity?: number | null;
  is_active: boolean;
  is_available: boolean;
  warnings: string[];
  conflicts: Array<{
    offering_id: number;
    course_code: string;
    course_title: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  }>;
};

const classSchedulingCache: {
  masters: SchedulingMastersPayload | null;
  offeringsByKey: Map<string, ScheduleItem[]>;
  conflictPoolByPeriod: Map<string, ScheduleItem[]>;
} = {
  masters: null,
  offeringsByKey: new Map<string, ScheduleItem[]>(),
  conflictPoolByPeriod: new Map<string, ScheduleItem[]>(),
};

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
const parsePeriodName = (name?: string | null) => {
  const pattern = /^(1st Semester|2nd Semester|Summer)\s+AY\s+(\d{4})-(\d{4})$/i;
  const match = String(name ?? "").trim().match(pattern);
  if (!match) return null;
  return {
    term: match[1].toLowerCase() === "1st semester" ? "1st Semester" : match[1].toLowerCase() === "2nd semester" ? "2nd Semester" : "Summer",
    startYear: Number(match[2]),
    endYear: Number(match[3]),
  } as const;
};
const getNextPeriodName = (name?: string | null) => {
  const parsed = parsePeriodName(name);
  if (!parsed) return null;

  if (parsed.term === "1st Semester") {
    return `2nd Semester AY ${parsed.startYear}-${parsed.endYear}`;
  }
  if (parsed.term === "2nd Semester") {
    return `Summer AY ${parsed.startYear}-${parsed.endYear}`;
  }
  return `1st Semester AY ${parsed.startYear + 1}-${parsed.endYear + 1}`;
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

const makeOfferingsCacheKey = (params: { period: string; section: string; search: string }) => {
  const normalizedSearch = params.search.trim().toLowerCase();
  return `period=${params.period}|section=${params.section}|search=${normalizedSearch}`;
};

export default function AdminClassSchedulingPage() {
  const router = useRouter();
  const { sessionUser } = usePortalSessionUser();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rows, setRows] = useState<ScheduleItem[]>([]);
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [focusedRowKey, setFocusedRowKey] = useState<string | null>(null);
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
  const [roomAvailabilitySearch, setRoomAvailabilitySearch] = useState("");
  const [roomAvailabilityActiveOnly, setRoomAvailabilityActiveOnly] = useState<"all" | "active" | "inactive">("active");
  const [roomAvailabilityItems, setRoomAvailabilityItems] = useState<RoomAvailabilityItem[]>([]);
  const [roomAvailabilityLoading, setRoomAvailabilityLoading] = useState(false);
  const [roomAvailabilityHasSlot, setRoomAvailabilityHasSlot] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [periodOfferings, setPeriodOfferings] = useState<ScheduleItem[]>([]);
  const sessionName = sessionUser?.name?.trim() || "Account";
  const sessionEmail = sessionUser?.email?.trim() || "";
  const sessionInitials = sessionName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

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
  const nextPeriodName = useMemo(() => getNextPeriodName(activePeriod?.name), [activePeriod]);

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
    if (classSchedulingCache.masters) {
      const cached = classSchedulingCache.masters;
      setPeriods(cached.periods);
      setTeachers(cached.teachers);
      setRooms(cached.rooms);
      setSections(cached.sections);
      setCourses(cached.courses);
      return;
    }

    const res = await apiFetch("/admin/scheduling/masters");
    const payload = res as {
      periods?: Period[];
      teachers?: Teacher[];
      rooms?: Room[];
      sections?: Section[];
      courses?: Course[];
    };
    const next = {
      periods: payload.periods ?? [],
      teachers: payload.teachers ?? [],
      rooms: payload.rooms ?? [],
      sections: payload.sections ?? [],
      courses: payload.courses ?? [],
    };
    classSchedulingCache.masters = next;
    setPeriods(next.periods);
    setTeachers(next.teachers);
    setRooms(next.rooms);
    setSections(next.sections);
    setCourses(next.courses);
  }, []);

  const loadItems = useCallback(async () => {
    if (!viewPastRecords && periodFilter === "all" && activePeriod) {
      return;
    }

    const cacheKey = makeOfferingsCacheKey({
      period: effectivePeriodFilter || "all",
      section: sectionFilter,
      search: searchQuery,
    });
    const cachedItems = classSchedulingCache.offeringsByKey.get(cacheKey);
    if (cachedItems) {
      setRows(cachedItems);
      setEdits(
        cachedItems.reduce<Record<string, RowEdit>>((acc, item) => {
          acc[getRowKey(item)] = emptyEdit();
          return acc;
        }, {})
      );
      return;
    }

    const qs = new URLSearchParams();
    if (effectivePeriodFilter && effectivePeriodFilter !== "all") qs.set("period_id", effectivePeriodFilter);
    if (sectionFilter !== "all") qs.set("section_id", sectionFilter);
    if (searchQuery.trim()) qs.set("search", searchQuery.trim());

    const res = await apiFetch(`/admin/scheduling/offerings${qs.size ? `?${qs.toString()}` : ""}`);
    const payload = res as { items?: ScheduleItem[] };
    const items = payload.items ?? [];
    classSchedulingCache.offeringsByKey.set(cacheKey, items);
    setRows(items);
    setEdits(
      items.reduce<Record<string, RowEdit>>((acc, item) => {
        acc[getRowKey(item)] = emptyEdit();
        return acc;
      }, {})
    );
  }, [activePeriod, effectivePeriodFilter, periodFilter, searchQuery, sectionFilter, viewPastRecords]);

  const loadConflictPool = useCallback(async () => {
    if (!effectivePeriodFilter || effectivePeriodFilter === "all") {
      setPeriodOfferings([]);
      return;
    }

    const cached = classSchedulingCache.conflictPoolByPeriod.get(effectivePeriodFilter);
    if (cached) {
      setPeriodOfferings(cached);
      return;
    }

    try {
      const res = await apiFetch(`/admin/scheduling/offerings?period_id=${effectivePeriodFilter}`);
      const payload = res as { items?: ScheduleItem[] };
      const items = payload.items ?? [];
      classSchedulingCache.conflictPoolByPeriod.set(effectivePeriodFilter, items);
      setPeriodOfferings(items);
    } catch {
      setPeriodOfferings([]);
    }
  }, [effectivePeriodFilter]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void loadMasters()
      .catch((error) => {
        if (!alive) return;
        toast.error(error instanceof Error ? error.message : "Failed to load class scheduling data.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [loadMasters]);

  useEffect(() => {
    if (periods.length === 0) return;
    void loadItems();
  }, [loadItems, periods.length]);

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
    const candidates = visibleRows
      .map((row): PlannedSchedule | null => {
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
        };
      })
      .filter((v): v is PlannedSchedule => v !== null);

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
    setFocusedRowKey(rowKey);
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
      classSchedulingCache.offeringsByKey.clear();
      classSchedulingCache.conflictPoolByPeriod.delete(String(payload.period_id));
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
      classSchedulingCache.offeringsByKey.clear();
      if (effectivePeriodFilter && effectivePeriodFilter !== "all") {
        classSchedulingCache.conflictPoolByPeriod.delete(effectivePeriodFilter);
      }
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
    const preview = nextPeriodName ? `\n\nCurrent: ${activePeriod?.name}\nNext: ${nextPeriodName}` : "";
    const proceed = window.confirm(
      `Prepare the next enrollment term? This will not change the currently active period.${preview}`,
    );
    if (!proceed) return;

    setRollingPeriod(true);
    try {
      const res = await apiFetch("/admin/enrollment-periods/rollover", {
        method: "POST",
        body: JSON.stringify({ activate: false }),
      });
      const payload = res as { to?: { id?: number; name?: string }; message?: string; activated?: boolean };
      const nextId = payload.to?.id;
      if (payload.activated && nextId) {
        setPeriodFilter(String(nextId));
        setViewPastRecords(false);
      }
      classSchedulingCache.masters = null;
      classSchedulingCache.offeringsByKey.clear();
      classSchedulingCache.conflictPoolByPeriod.clear();
      await loadMasters();
      await loadItems();
      await loadConflictPool();
      toast.success(payload.message ?? "Enrollment period updated.");
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
    clearPortalSessionUserCache();
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

  useEffect(() => {
    if (visibleRows.length === 0) {
      setFocusedRowKey(null);
      return;
    }

    if (!focusedRowKey || !visibleRows.some((row) => getRowKey(row) === focusedRowKey)) {
      setFocusedRowKey(getRowKey(visibleRows[0]));
    }
  }, [focusedRowKey, visibleRows]);

  const activeRoomEdit = useMemo(() => {
    if (!focusedRowKey) return null;
    const row = visibleRows.find((value) => getRowKey(value) === focusedRowKey);
    if (!row) return null;
    const edit = edits[focusedRowKey] ?? {
      section_id: row.section_id ? String(row.section_id) : "",
      teacher_id: row.teacher_id ? String(row.teacher_id) : "",
      room_id: row.room_id ? String(row.room_id) : "",
      day_of_week: row.day_of_week ?? "",
      start_time: row.start_time ? row.start_time.slice(0, 5) : "",
      end_time: row.end_time ? row.end_time.slice(0, 5) : "",
    };
    return { row, edit };
  }, [edits, focusedRowKey, visibleRows]);

  const activeRoomSlot = useMemo(() => {
    if (!activeRoomEdit?.row || !activeRoomEdit.edit) return null;
    const periodId = activeRoomEdit.row.period_id;
    const day = activeRoomEdit.edit.day_of_week;
    const start = activeRoomEdit.edit.start_time;
    const end = activeRoomEdit.edit.end_time;
    if (!periodId || !day || !start || !end) return null;

    return {
      period_id: Number(periodId),
      day_of_week: day,
      start_time: start,
      end_time: end,
      exclude_offering_id: activeRoomEdit.row.id ? Number(activeRoomEdit.row.id) : undefined,
    };
  }, [activeRoomEdit]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!activeRoomSlot) {
        setRoomAvailabilityHasSlot(false);
        setRoomAvailabilityItems([]);
        return;
      }

      setRoomAvailabilityLoading(true);
      try {
        const qs = new URLSearchParams({
          period_id: String(activeRoomSlot.period_id),
          day_of_week: activeRoomSlot.day_of_week,
          start_time: activeRoomSlot.start_time,
          end_time: activeRoomSlot.end_time,
        });
        if (activeRoomSlot.exclude_offering_id) qs.set("exclude_offering_id", String(activeRoomSlot.exclude_offering_id));
        if (roomAvailabilitySearch.trim()) qs.set("search", roomAvailabilitySearch.trim());
        if (roomAvailabilityActiveOnly !== "all") qs.set("active_only", roomAvailabilityActiveOnly === "active" ? "1" : "0");

        const response = await apiFetch(`/admin/scheduling/rooms/availability?${qs.toString()}`) as {
          has_slot?: boolean;
          items?: RoomAvailabilityItem[];
        };
        setRoomAvailabilityHasSlot(Boolean(response.has_slot));
        setRoomAvailabilityItems(response.items ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load room availability.");
      } finally {
        setRoomAvailabilityLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [activeRoomSlot, roomAvailabilityActiveOnly, roomAvailabilitySearch]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="hidden xl:flex xl:w-64 xl:flex-col xl:border-r xl:border-slate-200/80 xl:bg-white xl:dark:border-white/10 xl:dark:bg-slate-900">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/80 px-4 py-5 dark:border-white/10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-20 w-20 ring-4 ring-blue-100 ring-offset-2 shadow-lg dark:ring-blue-900/50 dark:ring-offset-slate-900">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">{sessionInitials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{sessionName}</p>
                {sessionEmail ? <p className="text-xs text-blue-600 dark:text-blue-400">{sessionEmail}</p> : null}
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
              <Link href="/admin/rooms" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><Building2 className="h-4 w-4" />Room Management</Link>
              <Link href="/admin/curriculum" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><FileText className="h-4 w-4" />Curriculum</Link>
            </div>
            <div className="space-y-1 border-t border-slate-200/80 pt-3 dark:border-white/10">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Management</p>
              <Link href="/admin/programs" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><BookOpen className="h-4 w-4" />Programs</Link>
              <Link href="/admin/departments" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><Building2 className="h-4 w-4" />Departments</Link>
              <Link href="/admin/rbac" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"><ShieldCheck className="h-4 w-4" />Faculty RBAC</Link>
              <div className="pl-9">
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100" asChild>
                  <Link href="/admin/departments"><Building2 className="mr-1.5 h-3.5 w-3.5" />Organizational Chart</Link>
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
                <GlobalSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search student/course..."
                  className="hidden lg:block lg:w-48 xl:w-56 2xl:w-64"
                />
                <AdminCsvImportTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" />
                <AdminCsvGeneratorTrigger className="h-9 rounded-xl border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10" />
                <Button type="button" variant="ghost" size="icon" className="hidden sm:inline-flex"><MessageSquare className="h-5 w-5" /></Button>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{now ? now.toLocaleTimeString() : "--:--:--"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{now ? now.toLocaleDateString() : "---"}</p>
                </div>
                <AvatarActionsMenu initials={sessionInitials} onLogout={handleLogout} name={sessionName} subtitle={sessionEmail} triggerName={sessionName} triggerSubtitle={sessionEmail} triggerClassName="rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10" fallbackClassName="bg-blue-600 text-white" />
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.16),transparent_45%),linear-gradient(180deg,#020617,#020b16_55%,#020617)]">
          <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Class Scheduling</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Create and manage offered schedules before students enroll.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/rooms">
                    <Building2 className="h-4 w-4" />
                    Manage Rooms
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={advanceToNextPeriod}
                  disabled={rollingPeriod || !activePeriod}
                  title={nextPeriodName ? `Prepare ${nextPeriodName}` : "Prepare next enrollment period"}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  {rollingPeriod ? "Preparing..." : nextPeriodName ? `Prepare ${nextPeriodName}` : "Prepare Next Period"}
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
              <CardContent>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }, (_, index) => (
                      <div key={`schedule-item-skeleton-${index}`} className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-slate-950/50">
                        <Skeleton className="h-5 w-64" />
                        <Skeleton className="mt-2 h-4 w-48" />
                        <div className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-7">
                          {Array.from({ length: 7 }, (_, fieldIndex) => (
                            <Skeleton key={`schedule-field-skeleton-${index}-${fieldIndex}`} className="h-10" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    const isFocused = focusedRowKey === rowKey;
                    const selectedRoomId = edit.room_id ? Number(edit.room_id) : null;
                    const selectedRoomAvailability = isFocused && selectedRoomId
                      ? roomAvailabilityItems.find((entry) => entry.room_id === selectedRoomId)
                      : undefined;
                    return (
                      <div
                        key={rowKey}
                        className={`rounded-xl border p-3 ${
                          hasConflict
                            ? "border-rose-300 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-950/20"
                            : hasMissing
                              ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-950/20"
                            : "border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/50"
                        } ${isFocused ? "ring-2 ring-blue-400/60 dark:ring-blue-500/40" : ""}`}
                        onClick={() => setFocusedRowKey(rowKey)}
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{row.course_code} - {row.course_title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{row.units} unit(s) | {row.enrolled_count}/{row.capacity} enrolled | {row.slots_left} slot(s) left</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Last updated: {row.updated_at ? new Date(row.updated_at).toLocaleString() : "Not yet updated"}
                              {row.updated_by_name ? ` by ${row.updated_by_name}` : ""}
                            </p>
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
                        {!hasConflict && selectedRoomAvailability && !selectedRoomAvailability.is_available && selectedRoomAvailability.warnings?.length ? (
                          <div className="mb-2 rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/20 dark:text-rose-200">
                            {selectedRoomAvailability.warnings[0]}
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
                  </div>

                  <aside className="space-y-3">
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/50">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Room Availability Panel</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {activeRoomSlot
                          ? `Checking ${activeRoomSlot.day_of_week} ${activeRoomSlot.start_time}-${activeRoomSlot.end_time}`
                          : "Pick day and time in a row to view available rooms."}
                      </p>
                      <div className="mt-3 space-y-2">
                        <Input
                          value={roomAvailabilitySearch}
                          onChange={(event) => setRoomAvailabilitySearch(event.target.value)}
                          placeholder="Search room or building"
                        />
                        <Select value={roomAvailabilityActiveOnly} onValueChange={(value) => setRoomAvailabilityActiveOnly(value as "all" | "active" | "inactive")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter rooms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active rooms only</SelectItem>
                            <SelectItem value="all">All rooms</SelectItem>
                            <SelectItem value="inactive">Inactive rooms only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="max-h-[620px] space-y-2 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-slate-900/60">
                      {roomAvailabilityLoading ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Loading room availability...</p>
                      ) : !roomAvailabilityHasSlot ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Availability appears after selecting day and time.</p>
                      ) : roomAvailabilityItems.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No rooms matched the current filters.</p>
                      ) : (
                        roomAvailabilityItems.map((roomItem) => (
                          <div
                            key={roomItem.room_id}
                            className={`rounded-lg border px-3 py-2 ${
                              roomItem.is_available
                                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-950/20"
                                : "border-rose-200 bg-rose-50/70 dark:border-rose-500/40 dark:bg-rose-950/20"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{roomItem.room_code}</p>
                              <Badge variant={roomItem.is_available ? "secondary" : "destructive"} className="text-[10px]">
                                {roomItem.is_available ? "Available" : "Occupied"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {[roomItem.title, roomItem.building, roomItem.capacity ? `${roomItem.capacity} seats` : null].filter(Boolean).join(" | ")}
                            </p>
                            {roomItem.warnings?.length ? (
                              <p className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-300">{roomItem.warnings[0]}</p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </aside>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

