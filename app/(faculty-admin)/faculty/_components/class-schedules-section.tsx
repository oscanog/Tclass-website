"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg, EventDropArg, EventResizeDoneArg } from "@fullcalendar/core";

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
import {
  addFacultyOfferingStudent,
  clearFacultyPeriodCache,
  clearFacultyRosterCache,
  downloadFacultyFile,
  getFacultyClassScheduleRoomAvailability,
  getFacultyClassSchedules,
  getFacultyOfferingStudents,
  getFacultyPeriods,
  getFacultyScheduleMasters,
  removeFacultyOfferingStudent,
  searchFacultyOfferingStudents,
  updateFacultyOfferingStudent,
  updateFacultySchedule,
  type FacultyOfferingRosterPayload,
  type FacultyOfferingStudentSearchPayload,
  type FacultyPeriodsPayload,
  type FacultyScheduleRoomAvailabilityPayload,
  type FacultyScheduleMastersPayload,
  type FacultySchedulePayload,
} from "./faculty-portal-cache";
import { AyTermRow } from "./shared-ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAY_LABELS: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

const DAY_TO_INDEX: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const INDEX_TO_DAY: Record<number, "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat"> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

type ScheduleItem = NonNullable<FacultySchedulePayload["items"]>[number];
type RosterItem = NonNullable<FacultyOfferingRosterPayload["items"]>[number];
type CandidateItem = NonNullable<FacultyOfferingStudentSearchPayload["items"]>[number];
type RoomAvailabilityItem = NonNullable<FacultyScheduleRoomAvailabilityPayload["items"]>[number];
type SidebarSlot = {
  offering_id: number;
  period_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_id: number | null;
};

const EVENT_DROP_HIGHLIGHT_CLASSES = [
  "ring-2",
  "ring-cyan-500",
  "ring-offset-2",
  "ring-offset-white",
  "dark:ring-offset-slate-900",
];

function trimSeconds(value: string) {
  return value.slice(0, 5);
}

function toTimeValue(value: Date) {
  return value.toTimeString().slice(0, 5);
}

function formatActionLine(action?: RosterItem["latest_action"]) {
  if (!action) return "No recent registrar action.";
  const when = action.acted_at ? new Date(action.acted_at).toLocaleString("en-PH") : "unknown time";
  const actor = action.acted_by_name || "Unknown staff";
  return `${action.action.toUpperCase()} by ${actor} on ${when}`;
}

export function ClassSchedulesSection() {
  const [periods, setPeriods] = useState<FacultyPeriodsPayload["periods"]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [canExport, setCanExport] = useState(false);

  const [teachers, setTeachers] = useState<NonNullable<FacultyScheduleMastersPayload["teachers"]>>([]);
  const [rooms, setRooms] = useState<NonNullable<FacultyScheduleMastersPayload["rooms"]>>([]);
  const [sections, setSections] = useState<NonNullable<FacultyScheduleMastersPayload["sections"]>>([]);

  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"details" | "students">("details");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: "Mon",
    start_time: "07:00",
    end_time: "08:00",
    teacher_id: "",
    room_id: "",
    section_id: "",
  });
  const [roomAvailabilitySearch, setRoomAvailabilitySearch] = useState("");
  const [roomAvailabilityItems, setRoomAvailabilityItems] = useState<RoomAvailabilityItem[]>([]);
  const [roomAvailabilityLoading, setRoomAvailabilityLoading] = useState(false);
  const [roomAvailabilityHasSlot, setRoomAvailabilityHasSlot] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSlot, setSidebarSlot] = useState<SidebarSlot | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sidebarSearchDebounced, setSidebarSearchDebounced] = useState("");
  const [sidebarItems, setSidebarItems] = useState<RoomAvailabilityItem[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarHasSlot, setSidebarHasSlot] = useState(false);
  const [draggingRoomId, setDraggingRoomId] = useState<number | null>(null);

  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterItems, setRosterItems] = useState<RosterItem[]>([]);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [busyEnrollmentId, setBusyEnrollmentId] = useState<number | null>(null);
  const [addingStudentId, setAddingStudentId] = useState<number | null>(null);
  const dragRoomIdRef = useRef<number | null>(null);
  const eventDropHandlersRef = useRef(
    new Map<
      HTMLElement,
      {
        onDragOver: (event: DragEvent) => void;
        onDragLeave: (event: DragEvent) => void;
        onDrop: (event: DragEvent) => void;
      }
    >()
  );

  const selectedPeriod = periods?.find((period) => String(period.id) === selectedPeriodId);

  const loadScheduleRows = useCallback(
    async (periodId: number, force = false) => {
      const payload = await getFacultyClassSchedules(
        periodId,
        teacherFilter !== "all" ? { teacher_id: Number(teacherFilter) } : undefined,
        force
      );
      setItems(payload.items ?? []);
      setCanManage(Boolean(payload.can_manage));
      setCanExport(Boolean(payload.can_export));
      return payload.items ?? [];
    },
    [teacherFilter]
  );

  const loadRoster = useCallback(async (offeringId: number, force = false) => {
    setRosterLoading(true);
    try {
      const payload = await getFacultyOfferingStudents(offeringId, force);
      setRosterItems(payload.items ?? []);
    } finally {
      setRosterLoading(false);
    }
  }, []);

  const loadRoomAvailability = useCallback(
    async (options: {
      period_id?: number;
      day_of_week?: string;
      start_time?: string;
      end_time?: string;
      search?: string;
      exclude_offering_id?: number;
    }) => {
      setRoomAvailabilityLoading(true);
      try {
        const payload = await getFacultyClassScheduleRoomAvailability({
          period_id: options.period_id,
          day_of_week: options.day_of_week,
          start_time: options.start_time,
          end_time: options.end_time,
          search: options.search,
          active_only: true,
          exclude_offering_id: options.exclude_offering_id,
        });
        setRoomAvailabilityHasSlot(Boolean(payload.has_slot));
        setRoomAvailabilityItems(payload.items ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load room availability.");
      } finally {
        setRoomAvailabilityLoading(false);
      }
    },
    []
  );

  const loadSidebarAvailability = useCallback(
    async (slot: SidebarSlot | null, search: string) => {
      setSidebarLoading(true);
      try {
        const payload = await getFacultyClassScheduleRoomAvailability({
          period_id: slot?.period_id,
          day_of_week: slot?.day_of_week,
          start_time: slot?.start_time,
          end_time: slot?.end_time,
          search: search || undefined,
          active_only: true,
          exclude_offering_id: slot?.offering_id,
        });
        setSidebarHasSlot(Boolean(payload.has_slot));
        setSidebarItems(payload.items ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load room sidebar.");
      } finally {
        setSidebarLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let alive = true;

    Promise.all([getFacultyPeriods(true), getFacultyScheduleMasters(true)])
      .then(([periodPayload, mastersPayload]) => {
        if (!alive) return;
        const nextPeriods = periodPayload.periods ?? [];
        setPeriods(nextPeriods);
        const initialPeriod = String(periodPayload.active_period_id ?? nextPeriods[0]?.id ?? "");
        setSelectedPeriodId(initialPeriod);
        setTeachers(mastersPayload.teachers ?? []);
        setRooms(mastersPayload.rooms ?? []);
        setSections(mastersPayload.sections ?? []);
        if (!initialPeriod) {
          setLoading(false);
          setItems([]);
        }
      })
      .catch((error) => {
        if (!alive) return;
        toast.error(error instanceof Error ? error.message : "Failed to load class schedules.");
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPeriodId) return;

    let alive = true;
    setLoading(true);

    loadScheduleRows(Number(selectedPeriodId), true)
      .catch((error) => {
        if (!alive) return;
        setItems([]);
        toast.error(error instanceof Error ? error.message : "Failed to load class schedules.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [loadScheduleRows, selectedPeriodId]);

  const refreshCurrentSchedule = useCallback(async () => {
    if (!selectedPeriodId) return;
    clearFacultyPeriodCache(Number(selectedPeriodId));
    return loadScheduleRows(Number(selectedPeriodId), true);
  }, [loadScheduleRows, selectedPeriodId]);

  useEffect(() => {
    dragRoomIdRef.current = draggingRoomId;
  }, [draggingRoomId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSidebarSearchDebounced(sidebarSearch.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [sidebarSearch]);

  const toSidebarSlot = useCallback((item: ScheduleItem): SidebarSlot => {
    return {
      offering_id: item.offering_id,
      period_id: item.period_id,
      day_of_week: item.day_of_week,
      start_time: trimSeconds(item.start_time),
      end_time: trimSeconds(item.end_time),
      room_id: item.room_id ?? null,
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setSidebarSlot(null);
      return;
    }
    setSidebarSlot((prev) => {
      if (!prev) {
        return toSidebarSlot(items[0]);
      }
      const matched = items.find((item) => item.offering_id === prev.offering_id);
      return matched ? toSidebarSlot(matched) : toSidebarSlot(items[0]);
    });
  }, [items, toSidebarSlot]);

  useEffect(() => {
    void loadSidebarAvailability(sidebarSlot, sidebarSearchDebounced);
  }, [loadSidebarAvailability, sidebarSearchDebounced, sidebarSlot]);

  useEffect(() => {
    if (!selectedItem) return;
    const timer = window.setTimeout(() => {
      void loadRoomAvailability({
        period_id: selectedItem.period_id,
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        search: roomAvailabilitySearch,
        exclude_offering_id: selectedItem.offering_id,
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    loadRoomAvailability,
    roomAvailabilitySearch,
    scheduleForm.day_of_week,
    scheduleForm.end_time,
    scheduleForm.start_time,
    selectedItem,
  ]);

  const openSubjectModal = useCallback(
    async (item: ScheduleItem) => {
      setSelectedItem(item);
      setActiveModalTab("details");
      setScheduleForm({
        day_of_week: item.day_of_week,
        start_time: trimSeconds(item.start_time),
        end_time: trimSeconds(item.end_time),
        teacher_id: item.teacher_id ? String(item.teacher_id) : "",
        room_id: item.room_id ? String(item.room_id) : "",
        section_id: item.section_id ? String(item.section_id) : "",
      });
      setCandidateQuery("");
      setCandidates([]);
      setRoomAvailabilitySearch("");

      if (canManage) {
        clearFacultyRosterCache(item.offering_id);
        await loadRoster(item.offering_id, true);
      } else {
        setRosterItems([]);
      }

      await loadRoomAvailability({
        period_id: item.period_id,
        day_of_week: item.day_of_week,
        start_time: trimSeconds(item.start_time),
        end_time: trimSeconds(item.end_time),
        exclude_offering_id: item.offering_id,
      });
      setSidebarSlot(toSidebarSlot(item));
    },
    [canManage, loadRoomAvailability, loadRoster, toSidebarSlot]
  );

  const handleDragUpdate = async (
    action: EventDropArg | EventResizeDoneArg,
    item: ScheduleItem
  ) => {
    if (!canManage) {
      action.revert();
      return;
    }

    const start = action.event.start;
    const end = action.event.end;
    if (!start || !end) {
      action.revert();
      return;
    }

    const nextDay = INDEX_TO_DAY[start.getDay()];
    if (!nextDay) {
      action.revert();
      toast.error("Schedules can only be placed from Monday to Saturday.");
      return;
    }

    try {
      await updateFacultySchedule(item.offering_id, {
        day_of_week: nextDay,
        start_time: toTimeValue(start),
        end_time: toTimeValue(end),
        teacher_id: item.teacher_id ?? null,
        room_id: item.room_id ?? null,
        section_id: item.section_id ?? null,
      });
      await refreshCurrentSchedule();
      setSidebarSlot(toSidebarSlot({ ...item, day_of_week: nextDay, start_time: `${toTimeValue(start)}:00`, end_time: `${toTimeValue(end)}:00` }));
      toast.success("Schedule updated.");
    } catch (error) {
      action.revert();
      toast.error(error instanceof Error ? error.message : "Failed to move schedule.");
    }
  };

  const suggestNearestRoom = useCallback(
    async (item: ScheduleItem, requestedRoomId: number) => {
      const requestedRoom = rooms.find((room) => room.id === requestedRoomId);
      const requestedBuilding = (requestedRoom?.building ?? "").trim().toLowerCase();
      const payload = await getFacultyClassScheduleRoomAvailability({
        period_id: item.period_id,
        day_of_week: item.day_of_week,
        start_time: trimSeconds(item.start_time),
        end_time: trimSeconds(item.end_time),
        active_only: true,
        exclude_offering_id: item.offering_id,
      });
      setSidebarHasSlot(Boolean(payload.has_slot));
      setSidebarItems(payload.items ?? []);
      const available = (payload.items ?? []).filter((entry) => entry.is_available);
      if (available.length === 0) return null;
      const sorted = [...available].sort((a, b) => {
        const aBuilding = (a.building ?? "").trim().toLowerCase();
        const bBuilding = (b.building ?? "").trim().toLowerCase();
        const aPriority = requestedBuilding && aBuilding === requestedBuilding ? 0 : 1;
        const bPriority = requestedBuilding && bBuilding === requestedBuilding ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.room_code.localeCompare(b.room_code);
      });
      return sorted[0] ?? null;
    },
    [rooms]
  );

  const clearEventDropHighlight = useCallback((element: HTMLElement) => {
    for (const className of EVENT_DROP_HIGHLIGHT_CLASSES) {
      element.classList.remove(className);
    }
  }, []);

  const clearAllEventDropHighlights = useCallback(() => {
    for (const element of eventDropHandlersRef.current.keys()) {
      clearEventDropHighlight(element);
    }
  }, [clearEventDropHighlight]);

  const handleRoomDropOnEvent = useCallback(
    async (roomId: number, item: ScheduleItem) => {
      if (!canManage) return;
      if (item.room_id === roomId) {
        toast("Room already assigned to this schedule.");
        setSidebarSlot(toSidebarSlot(item));
        return;
      }
      const targetRoom = rooms.find((entry) => entry.id === roomId);
      if (!targetRoom) {
        toast.error("Selected room is no longer available.");
        return;
      }

      setSidebarSlot(toSidebarSlot(item));
      try {
        await updateFacultySchedule(item.offering_id, {
          day_of_week: item.day_of_week,
          start_time: trimSeconds(item.start_time),
          end_time: trimSeconds(item.end_time),
          teacher_id: item.teacher_id ?? null,
          room_id: roomId,
          section_id: item.section_id ?? null,
        });
        const refreshed = await refreshCurrentSchedule();
        if (selectedItem?.offering_id === item.offering_id) {
          setScheduleForm((prev) => ({ ...prev, room_id: String(roomId) }));
          const updated = refreshed?.find((entry) => entry.offering_id === item.offering_id) ?? null;
          if (updated) {
            setSelectedItem(updated);
          }
        }
        await loadSidebarAvailability(
          {
            ...toSidebarSlot(item),
            room_id: roomId,
          },
          sidebarSearchDebounced
        );
        toast.success(`Room changed to ${targetRoom.room_code}.`);
      } catch (error) {
        const suggestion = await suggestNearestRoom(item, roomId).catch(() => null);
        const baseMessage = error instanceof Error ? error.message : "Failed to update room assignment.";
        if (suggestion) {
          const buildingSuffix = suggestion.building ? ` (${suggestion.building})` : "";
          toast.error(`${baseMessage} Suggested room: ${suggestion.room_code}${buildingSuffix}.`);
        } else {
          toast.error(baseMessage);
        }
      }
    },
    [
      canManage,
      loadSidebarAvailability,
      refreshCurrentSchedule,
      rooms,
      selectedItem?.offering_id,
      sidebarSearchDebounced,
      suggestNearestRoom,
      toSidebarSlot,
    ]
  );

  const handleSaveSchedule = async () => {
    if (!selectedItem) return;
    if (!scheduleForm.teacher_id || !scheduleForm.room_id || !scheduleForm.section_id) {
      toast.error("Teacher, room, and section are required.");
      return;
    }

    setSavingSchedule(true);
    try {
      await updateFacultySchedule(selectedItem.offering_id, {
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        teacher_id: Number(scheduleForm.teacher_id),
        room_id: Number(scheduleForm.room_id),
        section_id: Number(scheduleForm.section_id),
      });
      const refreshed = await refreshCurrentSchedule();
      clearFacultyRosterCache(selectedItem.offering_id);
      const updated = refreshed?.find((item) => item.offering_id === selectedItem.offering_id);
      if (updated) {
        setSelectedItem(updated);
      }
      toast.success("Subject schedule saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save schedule.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSearchCandidates = async () => {
    if (!selectedItem) return;
    const query = candidateQuery.trim();
    if (!query) {
      setCandidates([]);
      return;
    }

    setCandidateLoading(true);
    try {
      const payload = await searchFacultyOfferingStudents(selectedItem.offering_id, query);
      setCandidates(payload.items ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to search students.");
    } finally {
      setCandidateLoading(false);
    }
  };

  const handleAddStudent = async (studentUserId: number) => {
    if (!selectedItem) return;

    setAddingStudentId(studentUserId);
    try {
      await addFacultyOfferingStudent(selectedItem.offering_id, { student_user_id: studentUserId });
      clearFacultyRosterCache(selectedItem.offering_id);
      await loadRoster(selectedItem.offering_id, true);
      await refreshCurrentSchedule();
      toast.success("Student added as unofficial.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add student.");
    } finally {
      setAddingStudentId(null);
    }
  };

  const handleRosterAction = async (
    enrollmentId: number,
    action: "verify" | "unverify" | "remove"
  ) => {
    if (!selectedItem) return;

    setBusyEnrollmentId(enrollmentId);
    try {
      if (action === "remove") {
        await removeFacultyOfferingStudent(selectedItem.offering_id, enrollmentId);
      } else {
        await updateFacultyOfferingStudent(selectedItem.offering_id, enrollmentId, { action });
      }
      clearFacultyRosterCache(selectedItem.offering_id);
      await loadRoster(selectedItem.offering_id, true);
      await refreshCurrentSchedule();
      toast.success(
        action === "verify"
          ? "Enrollment verified."
          : action === "unverify"
            ? "Enrollment moved back to unofficial."
            : "Enrollment removed."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyEnrollmentId(null);
    }
  };

  const handleExport = async () => {
    if (!selectedPeriodId) return;

    try {
      await downloadFacultyFile(`/faculty/class-schedules/export?period_id=${selectedPeriodId}`, {
        filename: `faculty-schedules-${selectedPeriodId}.csv`,
      });
      toast.success("Schedules exported.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export schedules.");
    }
  };

  const events = useMemo(
    () =>
      items
        .filter((item) => item.day_of_week && item.start_time && item.end_time)
        .map((item) => ({
          id: String(item.offering_id),
          title: `${item.course_code} ${item.section_code || ""}`.trim(),
          daysOfWeek: [DAY_TO_INDEX[item.day_of_week] ?? 1],
          startTime: trimSeconds(item.start_time),
          endTime: trimSeconds(item.end_time),
          backgroundColor: "#2563eb",
          borderColor: "#1d4ed8",
          extendedProps: {
            item,
          },
        })),
    [items]
  );

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const item = arg.event.extendedProps.item as ScheduleItem | undefined;
    const subject = item?.course_title?.trim()
      ? item.course_title
      : item?.course_code?.trim()
        ? item.course_code
        : "Subject";
    const year = item?.section_code?.trim() ? item.section_code : "Year TBD";
    const detailLine = `${subject} - ${year}`;
    const instructor = item?.teacher_name?.trim() ? item.teacher_name : "Instructor TBA";
    const room = item?.room_code?.trim() ? item.room_code : "Room TBD";
    const timeAndRoom = `${arg.timeText || "Time TBD"} | ${room}`;

    return (
      <div className="w-full overflow-hidden">
        <p className="truncate text-[10px] font-semibold leading-tight opacity-95">{timeAndRoom}</p>
        <p className="truncate text-[11px] font-semibold leading-tight">{detailLine}</p>
        <p className="truncate text-[10px] leading-tight opacity-90">{instructor}</p>
      </div>
    );
  }, []);

  const sidebarSelectedRoom = useMemo(() => {
    if (!sidebarSlot?.room_id) return null;
    return rooms.find((room) => room.id === sidebarSlot.room_id) ?? null;
  }, [rooms, sidebarSlot?.room_id]);

  const selectedRoomAvailability = useMemo(() => {
    const roomId = scheduleForm.room_id ? Number(scheduleForm.room_id) : null;
    if (!roomId) return null;
    return roomAvailabilityItems.find((room) => room.room_id === roomId) ?? null;
  }, [roomAvailabilityItems, scheduleForm.room_id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Class Schedules</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Live calendar view with registrar scheduling and roster controls.
        </p>
      </div>

      <AyTermRow
        value={selectedPeriodId}
        onChange={setSelectedPeriodId}
        periods={periods ?? []}
        onExport={handleExport}
        disableExport={!canExport || !selectedPeriodId}
      />

      {selectedPeriod ? (
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Viewing {selectedPeriod.name}
        </p>
      ) : null}

      {canManage ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Teacher</span>
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="All teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={String(teacher.id)}>
                  {teacher.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div
        className={`grid gap-4 ${sidebarOpen ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "xl:grid-cols-[minmax(0,1fr)_76px]"}`}
      >
        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
          {loading ? (
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Loading calendar...</p>
          ) : null}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
            editable={canManage}
            eventStartEditable={canManage}
            eventDurationEditable={canManage}
            eventAllow={(dropInfo) => dropInfo.start.getDay() !== 0}
            events={events}
            eventContent={renderEventContent}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            eventClick={(info: EventClickArg) => {
              const item = info.event.extendedProps.item as ScheduleItem | undefined;
              if (!item) return;
              setSidebarSlot((prev) => {
                if (prev?.offering_id === item.offering_id) return prev;
                return toSidebarSlot(item);
              });
              void openSubjectModal(item);
            }}
            eventMouseEnter={(info) => {
              const item = info.event.extendedProps.item as ScheduleItem | undefined;
              if (!item) return;
              setSidebarSlot((prev) => {
                if (prev?.offering_id === item.offering_id) return prev;
                return toSidebarSlot(item);
              });
            }}
            eventDidMount={(info) => {
              if (!canManage) return;
              const item = info.event.extendedProps.item as ScheduleItem | undefined;
              if (!item) return;
              const element = info.el as HTMLElement;
              const onDragOver = (event: DragEvent) => {
                if (!dragRoomIdRef.current) return;
                event.preventDefault();
                if (event.dataTransfer) {
                  event.dataTransfer.dropEffect = "move";
                }
                for (const className of EVENT_DROP_HIGHLIGHT_CLASSES) {
                  element.classList.add(className);
                }
                setSidebarSlot((prev) => {
                  if (prev?.offering_id === item.offering_id) return prev;
                  return toSidebarSlot(item);
                });
              };
              const onDragLeave = (event: DragEvent) => {
                if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
                clearEventDropHighlight(element);
              };
              const onDrop = (event: DragEvent) => {
                clearEventDropHighlight(element);
                if (!dragRoomIdRef.current) return;
                event.preventDefault();
                const payloadRoomId = event.dataTransfer?.getData("application/x-room-id")
                  || event.dataTransfer?.getData("text/plain");
                const roomId = Number(payloadRoomId || dragRoomIdRef.current);
                if (!Number.isInteger(roomId) || roomId <= 0) return;
                setDraggingRoomId(null);
                dragRoomIdRef.current = null;
                clearAllEventDropHighlights();
                void handleRoomDropOnEvent(roomId, item);
              };
              element.addEventListener("dragover", onDragOver);
              element.addEventListener("dragleave", onDragLeave);
              element.addEventListener("drop", onDrop);
              eventDropHandlersRef.current.set(element, { onDragOver, onDragLeave, onDrop });
            }}
            eventWillUnmount={(info) => {
              const element = info.el as HTMLElement;
              const handlers = eventDropHandlersRef.current.get(element);
              if (!handlers) return;
              element.removeEventListener("dragover", handlers.onDragOver);
              element.removeEventListener("dragleave", handlers.onDragLeave);
              element.removeEventListener("drop", handlers.onDrop);
              clearEventDropHighlight(element);
              eventDropHandlersRef.current.delete(element);
            }}
            eventDrop={(info: EventDropArg) => {
              const item = info.event.extendedProps.item as ScheduleItem | undefined;
              if (!item) return;
              void handleDragUpdate(info, item);
            }}
            eventResize={(info: EventResizeDoneArg) => {
              const item = info.event.extendedProps.item as ScheduleItem | undefined;
              if (!item) return;
              void handleDragUpdate(info, item);
            }}
          />
          {!loading && items.length === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-white/20 dark:bg-white/5 dark:text-slate-300">
              No schedule entries yet for this period. Calendar stays visible so registrar can start planning.
            </div>
          ) : null}
        </div>

        <aside className="hidden rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 xl:block">
          <div className="flex items-center justify-between gap-2">
            {sidebarOpen ? (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Room Sidebar</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {canManage ? "Drag room cards onto a class block." : "Room occupancy context (view only)."}
                </p>
              </div>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rooms</p>
            )}
            <Button type="button" size="sm" variant="outline" onClick={() => setSidebarOpen((prev) => !prev)}>
              {sidebarOpen ? "Collapse" : "Open"}
            </Button>
          </div>

          {sidebarOpen ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
                {sidebarSlot ? (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {sidebarSlot.day_of_week} {sidebarSlot.start_time}-{sidebarSlot.end_time}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Current room: {sidebarSelectedRoom?.room_code || "Unassigned"}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    Hover or click a class event to target a slot for room availability.
                  </p>
                )}
              </div>
              <Input
                value={sidebarSearch}
                onChange={(event) => setSidebarSearch(event.target.value)}
                placeholder="Search room or building"
              />
              <div className="max-h-[620px] space-y-2 overflow-y-auto">
                {sidebarLoading ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading room availability...</p>
                ) : !sidebarHasSlot ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Select an event to evaluate occupancy.</p>
                ) : sidebarItems.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No rooms matched this filter.</p>
                ) : (
                  sidebarItems.map((room) => (
                    <div
                      key={room.room_id}
                      draggable={canManage}
                      onDragStart={(event) => {
                        if (!canManage) return;
                        setDraggingRoomId(room.room_id);
                        dragRoomIdRef.current = room.room_id;
                        event.dataTransfer.setData("application/x-room-id", String(room.room_id));
                        event.dataTransfer.setData("text/plain", String(room.room_id));
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDraggingRoomId(null);
                        dragRoomIdRef.current = null;
                        clearAllEventDropHighlights();
                      }}
                      className={`rounded-md border px-3 py-2 ${
                        room.is_available
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/20"
                          : "border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-950/20"
                      } ${canManage ? "cursor-grab active:cursor-grabbing" : "cursor-default"} ${
                        draggingRoomId === room.room_id ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{room.room_code}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {[room.title, room.building, room.capacity ? `${room.capacity} seats` : null].filter(Boolean).join(" | ")}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            room.is_available
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200"
                          }`}
                        >
                          {room.is_available ? "Open" : "Occupied"}
                        </span>
                      </div>
                      {room.warnings?.length ? (
                        <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300">{room.warnings[0]}</p>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {canManage ? "Drag onto an event to assign this room." : "No overlap for this slot."}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
            setRosterItems([]);
            setCandidates([]);
            setCandidateQuery("");
            setRoomAvailabilityItems([]);
            setRoomAvailabilityHasSlot(false);
            setRoomAvailabilitySearch("");
          }
        }}
      >
        <DialogContent hideCloseButton className="max-h-[90vh] overflow-y-auto sm:max-w-[860px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `${selectedItem.course_code} - ${selectedItem.course_title}` : "Subject details"}
            </DialogTitle>
            <DialogDescription>
              Click tabs to manage schedule details or student roster for this subject offering.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={activeModalTab === "details" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveModalTab("details")}
            >
              Details
            </Button>
            <Button
              type="button"
              variant={activeModalTab === "students" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveModalTab("students");
                if (selectedItem && canManage) {
                  void loadRoster(selectedItem.offering_id, true);
                }
              }}
            >
              Students
            </Button>
          </div>

          {activeModalTab === "details" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedItem?.section_code || "No section"} - {selectedItem?.room_code || "Room TBD"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedItem?.schedule_text || "No schedule text yet"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Last updated: {selectedItem?.updated_at ? new Date(selectedItem.updated_at).toLocaleString() : "N/A"}
                  {selectedItem?.updated_by_name ? ` by ${selectedItem.updated_by_name}` : ""}
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-3">
                  {canManage ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Instructor</Label>
                        <Select
                          value={scheduleForm.teacher_id || "__empty"}
                          onValueChange={(value) =>
                            setScheduleForm((prev) => ({ ...prev, teacher_id: value === "__empty" ? "" : value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose instructor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__empty">Choose instructor</SelectItem>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={String(teacher.id)}>
                                {teacher.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Section</Label>
                        <Select
                          value={scheduleForm.section_id || "__empty"}
                          onValueChange={(value) =>
                            setScheduleForm((prev) => ({ ...prev, section_id: value === "__empty" ? "" : value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__empty">Choose section</SelectItem>
                            {sections.map((section) => (
                              <SelectItem key={section.id} value={String(section.id)}>
                                {section.section_code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Room</Label>
                        <Select
                          value={scheduleForm.room_id || "__empty"}
                          onValueChange={(value) =>
                            setScheduleForm((prev) => ({ ...prev, room_id: value === "__empty" ? "" : value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__empty">Choose room</SelectItem>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={String(room.id)}>
                                {room.room_code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Day</Label>
                        <Select
                          value={scheduleForm.day_of_week}
                          onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, day_of_week: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DAY_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Start time</Label>
                        <Input
                          type="time"
                          value={scheduleForm.start_time}
                          onChange={(event) =>
                            setScheduleForm((prev) => ({ ...prev, start_time: event.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>End time</Label>
                        <Input
                          type="time"
                          value={scheduleForm.end_time}
                          onChange={(event) =>
                            setScheduleForm((prev) => ({ ...prev, end_time: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      You have view-only schedule access. Registrar controls are hidden.
                    </p>
                  )}
                  {!selectedRoomAvailability?.is_available && selectedRoomAvailability?.warnings?.length ? (
                    <div className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/20 dark:text-rose-200">
                      {selectedRoomAvailability.warnings[0]}
                    </div>
                  ) : null}
                </div>

                <aside className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Room Availability
                  </p>
                  <Input
                    value={roomAvailabilitySearch}
                    onChange={(event) => setRoomAvailabilitySearch(event.target.value)}
                    placeholder="Search room"
                  />
                  <div className="max-h-[280px] space-y-2 overflow-y-auto">
                    {roomAvailabilityLoading ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Loading rooms...</p>
                    ) : !roomAvailabilityHasSlot ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select day and time to view occupancy.
                      </p>
                    ) : roomAvailabilityItems.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">No rooms matched the filter.</p>
                    ) : (
                      roomAvailabilityItems.map((room) => (
                        <div
                          key={room.room_id}
                          className={`rounded-md border px-2 py-1.5 ${
                            room.is_available
                              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/20"
                              : "border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-950/20"
                          }`}
                        >
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{room.room_code}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {[room.title, room.capacity ? `${room.capacity} seats` : null].filter(Boolean).join(" | ")}
                          </p>
                          {room.warnings?.length ? (
                            <p className="text-[11px] text-rose-700 dark:text-rose-300">{room.warnings[0]}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!canManage ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Student roster management is only available for registrar-level faculty.
                </p>
              ) : (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add existing student</p>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={candidateQuery}
                        onChange={(event) => setCandidateQuery(event.target.value)}
                        placeholder="Search by name, email, or student number"
                      />
                      <Button type="button" variant="outline" onClick={() => void handleSearchCandidates()}>
                        Search
                      </Button>
                    </div>
                    {candidateLoading ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Searching...</p>
                    ) : null}
                    {candidates.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {candidates.map((candidate) => {
                          const disabled = candidate.existing_status === "official";
                          return (
                            <div
                              key={candidate.student_user_id}
                              className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10"
                            >
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{candidate.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {candidate.student_number || "No student #"} - {candidate.email}
                                </p>
                                {candidate.existing_status ? (
                                  <p className="text-xs text-amber-600 dark:text-amber-300">
                                    Existing status: {candidate.existing_status}
                                  </p>
                                ) : null}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                disabled={disabled || addingStudentId === candidate.student_user_id}
                                onClick={() => void handleAddStudent(candidate.student_user_id)}
                              >
                                {addingStudentId === candidate.student_user_id ? "Adding..." : disabled ? "Official" : "Add"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Current roster</p>
                    {rosterLoading ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Loading roster...</p>
                    ) : rosterItems.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No students enrolled yet.</p>
                    ) : (
                      rosterItems.map((row) => (
                        <div
                          key={row.enrollment_id}
                          className="rounded-md border border-slate-200 px-3 py-2 dark:border-white/10"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {row.name} ({row.student_number || "No student #"})
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {formatActionLine(row.latest_action)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs uppercase dark:border-white/20">
                                {row.status}
                              </span>
                              {row.status === "unofficial" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => void handleRosterAction(row.enrollment_id, "verify")}
                                  disabled={busyEnrollmentId === row.enrollment_id}
                                >
                                  Verify
                                </Button>
                              ) : null}
                              {row.status === "official" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void handleRosterAction(row.enrollment_id, "unverify")}
                                  disabled={busyEnrollmentId === row.enrollment_id}
                                >
                                  Unverify
                                </Button>
                              ) : null}
                              {(row.status === "draft" || row.status === "unofficial") ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => void handleRosterAction(row.enrollment_id, "remove")}
                                  disabled={busyEnrollmentId === row.enrollment_id}
                                >
                                  Remove
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedItem(null)} disabled={savingSchedule}>
              Close
            </Button>
            {activeModalTab === "details" && canManage ? (
              <Button type="button" onClick={() => void handleSaveSchedule()} disabled={savingSchedule}>
                {savingSchedule ? "Saving..." : "Save Details"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
