"use client";

import { apiFetch, getCookieValue } from "@/lib/api-client";

type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
};

const singleCache = {
  me: {} as CacheEntry<unknown>,
  periods: {} as CacheEntry<unknown>,
  scheduleMasters: {} as CacheEntry<unknown>,
  dashboardSummary: new Map<number, CacheEntry<unknown>>(),
  classSchedules: new Map<string, CacheEntry<unknown>>(),
  classScheduleRoster: new Map<number, CacheEntry<unknown>>(),
  classScheduleRooms: new Map<string, CacheEntry<unknown>>(),
  classLists: new Map<number, CacheEntry<unknown>>(),
  classes: new Map<number, CacheEntry<unknown>>(),
  students: new Map<number, CacheEntry<unknown>>(),
  assignments: new Map<number, CacheEntry<unknown>>(),
  gradeSheets: new Map<number, CacheEntry<unknown>>(),
  grades: new Map<number, CacheEntry<unknown>>(),
  gradeSheetDetails: new Map<number, CacheEntry<unknown>>(),
};

async function loadSingle<T>(entry: CacheEntry<unknown>, loader: () => Promise<T>, force = false): Promise<T> {
  if (!force && entry.data !== undefined) {
    return entry.data as T;
  }
  if (!force && entry.promise) {
    return entry.promise as Promise<T>;
  }

  const promise = loader()
    .then((data) => {
      entry.data = data;
      return data;
    })
    .finally(() => {
      entry.promise = undefined;
    });

  entry.promise = promise;
  return promise;
}

async function loadByKey<T>(
  store: Map<number, CacheEntry<unknown>>,
  key: number,
  loader: () => Promise<T>,
  force = false
): Promise<T> {
  const entry = store.get(key) ?? {};
  store.set(key, entry);

  if (!force && entry.data !== undefined) {
    return entry.data as T;
  }
  if (!force && entry.promise) {
    return entry.promise as Promise<T>;
  }

  const promise = loader()
    .then((data) => {
      entry.data = data;
      return data;
    })
    .finally(() => {
      entry.promise = undefined;
    });

  entry.promise = promise;
  return promise;
}

async function loadByStringKey<T>(
  store: Map<string, CacheEntry<unknown>>,
  key: string,
  loader: () => Promise<T>,
  force = false
): Promise<T> {
  const entry = store.get(key) ?? {};
  store.set(key, entry);

  if (!force && entry.data !== undefined) {
    return entry.data as T;
  }
  if (!force && entry.promise) {
    return entry.promise as Promise<T>;
  }

  const promise = loader()
    .then((data) => {
      entry.data = data;
      return data;
    })
    .finally(() => {
      entry.promise = undefined;
    });

  entry.promise = promise;
  return promise;
}

export type FacultyPermissionKey =
  | "faculty.schedules.view"
  | "faculty.schedules.manage"
  | "faculty.schedules.export"
  | "faculty.class_lists.view"
  | "faculty.class_lists.export"
  | "faculty.students.view"
  | "faculty.assignments.view"
  | "faculty.assignments.manage"
  | "faculty.grade_sheets.view"
  | "faculty.grade_sheets.post"
  | "faculty.grades.view"
  | "faculty.grades.manage"
  | "faculty.syllabi.view"
  | "faculty.syllabi.upload";

export type FacultyMePayload = {
  user?: {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
  };
  profile?: {
    employee_id?: string | null;
    department?: string | null;
    position_id?: number | null;
    position?: string | null;
    schedule_teacher_id?: number | null;
    teacher_name?: string | null;
  };
  permissions?: string[];
  template?: string | null;
};

export type FacultyPeriodsPayload = {
  periods?: Array<{ id: number; name: string; is_active?: boolean }>;
  active_period_id?: number | null;
};

export type FacultyDashboardSummaryPayload = {
  profile?: {
    employee_id?: string | null;
    department?: string | null;
    position?: string | null;
    position_id?: number | null;
  };
  stats?: {
    classes?: number;
    students?: number;
    load_count?: number;
  };
  today_schedule?: Array<{
    offering_id: number;
    course_code: string;
    course_title: string;
    section_code: string;
    schedule_text: string;
    room_code: string;
  }>;
  permissions?: string[];
  template?: string | null;
  active_period_id?: number | null;
};

export type FacultySchedulePayload = {
  items?: Array<{
    offering_id: number;
    period_id: number;
    course_id: number;
    course_code: string;
    course_title: string;
    section_id?: number | null;
    section_code: string;
    teacher_id?: number | null;
    teacher_name: string;
    room_id?: number | null;
    room_code: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    schedule_text: string;
    period_name: string;
    capacity?: number;
    updated_at?: string | null;
    updated_by_user_id?: number | null;
    updated_by_name?: string | null;
  }>;
  can_manage?: boolean;
  can_export?: boolean;
};

export type FacultyScheduleMastersPayload = {
  teachers?: Array<{ id: number; full_name: string; email?: string | null }>;
  rooms?: Array<{
    id: number;
    room_code: string;
    title?: string | null;
    description?: string | null;
    icon_key?: string | null;
    building?: string | null;
    capacity?: number | null;
    is_active?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    created_by_user_id?: number | null;
    updated_by_user_id?: number | null;
    created_by_name?: string | null;
    updated_by_name?: string | null;
  }>;
  sections?: Array<{ id: number; section_code: string; program_name?: string | null; year_level?: number | null }>;
  can_manage?: boolean;
  room_icon_presets?: string[];
};

export type FacultyScheduleRoomsPayload = {
  items?: Array<{
    id: number;
    room_code: string;
    title?: string | null;
    description?: string | null;
    icon_key?: string | null;
    building?: string | null;
    capacity?: number | null;
    is_active?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    created_by_user_id?: number | null;
    updated_by_user_id?: number | null;
    created_by_name?: string | null;
    updated_by_name?: string | null;
  }>;
  room_icon_presets?: string[];
};

export type FacultyScheduleRoomAvailabilityPayload = {
  has_slot?: boolean;
  items?: Array<{
    room_id: number;
    room_code: string;
    title?: string | null;
    description?: string | null;
    icon_key?: string | null;
    building?: string | null;
    capacity?: number | null;
    is_active?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    created_by_user_id?: number | null;
    updated_by_user_id?: number | null;
    created_by_name?: string | null;
    updated_by_name?: string | null;
    is_available: boolean;
    warnings?: string[];
    conflicts?: Array<{
      offering_id: number;
      course_code: string;
      course_title: string;
      day_of_week: string;
      start_time: string;
      end_time: string;
    }>;
  }>;
};

export type FacultyOfferingRosterPayload = {
  offering?: {
    offering_id: number;
    period_id: number;
    course_id: number;
    course_code: string;
    course_title: string;
    section_code: string;
    teacher_name: string;
    room_code: string;
    schedule_text: string;
    capacity: number;
    enrolled_count: number;
  };
  items?: Array<{
    enrollment_id: number;
    student_user_id: number;
    name: string;
    email: string;
    student_number: string;
    status: "draft" | "unofficial" | "official" | "rejected" | "dropped";
    requested_at?: string | null;
    assessed_at?: string | null;
    decided_at?: string | null;
    remarks?: string | null;
    latest_action?: {
      action: "add" | "verify" | "unverify" | "remove";
      from_status?: string | null;
      to_status?: string | null;
      note?: string | null;
      acted_at?: string | null;
      acted_by_name?: string | null;
    } | null;
  }>;
};

export type FacultyOfferingStudentSearchPayload = {
  items?: Array<{
    student_user_id: number;
    name: string;
    email: string;
    student_number: string;
    enrollment_id?: number | null;
    existing_offering_id?: number | null;
    existing_status?: string | null;
  }>;
};

export type FacultyClassListsPayload = {
  items?: Array<{
    offering_id: number;
    course_code: string;
    course_title: string;
    section_code: string;
    schedule_text: string;
    room_code: string;
    teacher_name: string;
    enrolled_count: number;
  }>;
  can_export?: boolean;
};

export type FacultyClassesPayload = {
  items?: Array<{
    offering_id: number;
    course_code: string;
    course_title: string;
    section_code: string;
    schedule_text: string;
    room_code: string;
    teacher_name: string;
    enrolled_count: number;
    syllabus?: {
      file_name: string;
      uploaded_at: string;
    } | null;
  }>;
  can_upload_syllabus?: boolean;
  can_manage_assignments?: boolean;
};

export type FacultyStudentsPayload = {
  items?: Array<{
    user_id: number;
    name: string;
    email: string;
    student_number: string;
    course_code: string;
    course_title: string;
    section_code: string;
    midterm_grade?: number | null;
    final_grade?: number | null;
    re_exam_grade?: number | null;
    enrollment_status: string;
  }>;
};

export type FacultyAssignmentsPayload = {
  items?: Array<{
    id: number;
    offering_id: number;
    course_code: string;
    course_title: string;
    section_code: string;
    title: string;
    description: string;
    points: number;
    due_at?: string | null;
    is_published: boolean;
  }>;
  can_manage?: boolean;
};

export type FacultyGradeSheetsPayload = {
  items?: Array<{
    offering_id: number;
    course_code: string;
    course_title: string;
    section_code: string;
    schedule_text: string;
    total_rows: number;
    posted_rows: number;
    latest_posted_at?: string | null;
  }>;
  can_post?: boolean;
  can_manage?: boolean;
};

export type FacultyGradeSheetDetailPayload = {
  items?: Array<{
    enrollment_id: number;
    student_number: string;
    name: string;
    midterm_grade?: number | null;
    final_grade?: number | null;
    re_exam_grade?: number | null;
    status: string;
    posted_at?: string | null;
  }>;
  grading_system?: Array<{
    grade: string;
    equiv: string;
    desc: string;
    remarks: string;
  }>;
  can_post?: boolean;
  can_manage?: boolean;
};

export type FacultyGradesPayload = {
  items?: Array<{
    id: number;
    enrollment_id: number;
    offering_id: number;
    student_name: string;
    student_number: string;
    course_code: string;
    course_title: string;
    midterm_grade?: number | null;
    final_grade?: number | null;
    re_exam_grade?: number | null;
    status: string;
  }>;
  can_manage?: boolean;
};

export const getFacultyMe = <T = FacultyMePayload>(force = false) =>
  loadSingle<T>(singleCache.me, () => apiFetch("/faculty/me") as Promise<T>, force);

export const getFacultyPeriods = <T = FacultyPeriodsPayload>(force = false) =>
  loadSingle<T>(singleCache.periods, () => apiFetch("/faculty/periods") as Promise<T>, force);

export const getFacultyDashboardSummary = <T = FacultyDashboardSummaryPayload>(periodId: number, force = false) =>
  loadByKey<T>(
    singleCache.dashboardSummary,
    periodId,
    () => apiFetch(`/faculty/dashboard-summary?period_id=${periodId}`) as Promise<T>,
    force
  );

const makeClassScheduleCacheKey = (periodId: number, teacherId?: number | null) =>
  `period=${periodId}|teacher=${teacherId ? String(teacherId) : "all"}`;

export const getFacultyScheduleMasters = <T = FacultyScheduleMastersPayload>(force = false) =>
  loadSingle<T>(singleCache.scheduleMasters, () => apiFetch("/faculty/class-schedules/masters") as Promise<T>, force);

const makeClassScheduleRoomsCacheKey = (params: {
  search?: string;
  active_only?: boolean;
  building?: string;
  capacity_min?: number;
  capacity_max?: number;
}) =>
  `search=${(params.search ?? "").trim().toLowerCase()}|active=${params.active_only === undefined ? "all" : params.active_only ? "1" : "0"}|building=${(params.building ?? "").trim().toLowerCase()}|min=${params.capacity_min ?? ""}|max=${params.capacity_max ?? ""}`;

export const getFacultyClassSchedules = <T = FacultySchedulePayload>(
  periodId: number,
  options?: { teacher_id?: number | null },
  force = false
) => {
  const teacherId = options?.teacher_id ?? null;
  const cacheKey = makeClassScheduleCacheKey(periodId, teacherId);
  const query = new URLSearchParams({ period_id: String(periodId) });
  if (teacherId) query.set("teacher_id", String(teacherId));
  return loadByStringKey<T>(
    singleCache.classSchedules,
    cacheKey,
    () => apiFetch(`/faculty/class-schedules?${query.toString()}`) as Promise<T>,
    force
  );
};

export const getFacultyClassScheduleRooms = <T = FacultyScheduleRoomsPayload>(
  options?: {
    search?: string;
    active_only?: boolean;
    building?: string;
    capacity_min?: number;
    capacity_max?: number;
  },
  force = false
) => {
  const query = new URLSearchParams();
  if (options?.search?.trim()) query.set("search", options.search.trim());
  if (typeof options?.active_only === "boolean") query.set("active_only", options.active_only ? "1" : "0");
  if (options?.building?.trim()) query.set("building", options.building.trim());
  if (typeof options?.capacity_min === "number") query.set("capacity_min", String(options.capacity_min));
  if (typeof options?.capacity_max === "number") query.set("capacity_max", String(options.capacity_max));

  const key = makeClassScheduleRoomsCacheKey(options ?? {});
  return loadByStringKey<T>(
    singleCache.classScheduleRooms,
    key,
    () => apiFetch(`/faculty/class-schedules/rooms${query.size ? `?${query.toString()}` : ""}`) as Promise<T>,
    force
  );
};

export const getFacultyClassScheduleRoomAvailability = <T = FacultyScheduleRoomAvailabilityPayload>(options?: {
  period_id?: number;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  search?: string;
  active_only?: boolean;
  building?: string;
  capacity_min?: number;
  capacity_max?: number;
  exclude_offering_id?: number;
}) => {
  const query = new URLSearchParams();
  if (typeof options?.period_id === "number") query.set("period_id", String(options.period_id));
  if (options?.day_of_week) query.set("day_of_week", options.day_of_week);
  if (options?.start_time) query.set("start_time", options.start_time);
  if (options?.end_time) query.set("end_time", options.end_time);
  if (options?.search?.trim()) query.set("search", options.search.trim());
  if (typeof options?.active_only === "boolean") query.set("active_only", options.active_only ? "1" : "0");
  if (options?.building?.trim()) query.set("building", options.building.trim());
  if (typeof options?.capacity_min === "number") query.set("capacity_min", String(options.capacity_min));
  if (typeof options?.capacity_max === "number") query.set("capacity_max", String(options.capacity_max));
  if (typeof options?.exclude_offering_id === "number") query.set("exclude_offering_id", String(options.exclude_offering_id));

  return apiFetch(`/faculty/class-schedules/rooms/availability${query.size ? `?${query.toString()}` : ""}`) as Promise<T>;
};

export const getFacultyOfferingStudents = <T = FacultyOfferingRosterPayload>(offeringId: number, force = false) =>
  loadByKey<T>(
    singleCache.classScheduleRoster,
    offeringId,
    () => apiFetch(`/faculty/class-schedules/${offeringId}/students`) as Promise<T>,
    force
  );

export const searchFacultyOfferingStudents = <T = FacultyOfferingStudentSearchPayload>(
  offeringId: number,
  query: string
) =>
  apiFetch(
    `/faculty/class-schedules/${offeringId}/students/search?q=${encodeURIComponent(query)}`
  ) as Promise<T>;

export const getFacultyClassLists = <T = FacultyClassListsPayload>(periodId: number, force = false) =>
  loadByKey<T>(
    singleCache.classLists,
    periodId,
    () => apiFetch(`/faculty/class-lists?period_id=${periodId}`) as Promise<T>,
    force
  );

export const getFacultyClasses = <T = FacultyClassesPayload>(periodId: number, force = false) =>
  loadByKey<T>(
    singleCache.classes,
    periodId,
    () => apiFetch(`/faculty/classes?period_id=${periodId}`) as Promise<T>,
    force
  );

export const getFacultyStudents = <T = FacultyStudentsPayload>(periodId: number, force = false) =>
  loadByKey<T>(
    singleCache.students,
    periodId,
    () => apiFetch(`/faculty/students?period_id=${periodId}`) as Promise<T>,
    force
  );

export const getFacultyAssignments = <T = FacultyAssignmentsPayload>(periodId: number, force = false) =>
  loadByKey<T>(
    singleCache.assignments,
    periodId,
    () => apiFetch(`/faculty/assignments?period_id=${periodId}`) as Promise<T>,
    force
  );

export const getFacultyGradeSheets = <T = FacultyGradeSheetsPayload>(periodId: number, force = false) =>
  loadByKey<T>(
    singleCache.gradeSheets,
    periodId,
    () => apiFetch(`/faculty/grade-sheets?period_id=${periodId}`) as Promise<T>,
    force
  );

export const getFacultyGradeSheetDetail = <T = FacultyGradeSheetDetailPayload>(offeringId: number, force = false) =>
  loadByKey<T>(
    singleCache.gradeSheetDetails,
    offeringId,
    () => apiFetch(`/faculty/grade-sheets/${offeringId}`) as Promise<T>,
    force
  );

export const getFacultyGrades = <T = FacultyGradesPayload>(periodId: number, force = false) =>
  loadByKey<T>(
    singleCache.grades,
    periodId,
    () => apiFetch(`/faculty/grades?period_id=${periodId}`) as Promise<T>,
    force
  );

type DownloadOptions = {
  filename: string;
  method?: "GET" | "POST";
  body?: BodyInit | null;
  headers?: HeadersInit;
};

async function authorizedFetch(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  const token = getCookieValue("tclass_token");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    cache: options.cache ?? "no-store",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = (payload as { message?: string }).message ?? "Request failed.";
    throw new Error(message);
  }

  return response;
}

export async function downloadFacultyFile(path: string, options: DownloadOptions) {
  const response = await authorizedFetch(path, {
    method: options.method ?? "GET",
    body: options.body,
    headers: options.headers,
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = options.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function updateFacultySchedule(
  offeringId: number,
  payload: {
    day_of_week: string;
    start_time: string;
    end_time: string;
    room_id?: number | null;
    teacher_id?: number | null;
    section_id?: number | null;
  }
) {
  return apiFetch(`/faculty/class-schedules/${offeringId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createFacultyClassScheduleRoom(payload: {
  room_code: string;
  title: string;
  description?: string | null;
  icon_key?: string | null;
  building?: string | null;
  capacity?: number | null;
  is_active?: boolean;
}) {
  return apiFetch("/faculty/class-schedules/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFacultyClassScheduleRoom(
  roomId: number,
  payload: {
    room_code?: string;
    title?: string;
    description?: string | null;
    icon_key?: string | null;
    building?: string | null;
    capacity?: number | null;
    is_active?: boolean;
  }
) {
  return apiFetch(`/faculty/class-schedules/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function previewDeleteFacultyClassScheduleRoom(roomId: number) {
  return apiFetch(`/faculty/class-schedules/rooms/${roomId}?preview=1`, {
    method: "DELETE",
  });
}

export async function deleteFacultyClassScheduleRoom(roomId: number, confirmText: string) {
  return apiFetch(`/faculty/class-schedules/rooms/${roomId}`, {
    method: "DELETE",
    body: JSON.stringify({
      confirm_force: true,
      confirm_text: confirmText,
    }),
  });
}

export async function addFacultyOfferingStudent(
  offeringId: number,
  payload: {
    student_user_id: number;
    note?: string | null;
  }
) {
  return apiFetch(`/faculty/class-schedules/${offeringId}/students`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFacultyOfferingStudent(
  offeringId: number,
  enrollmentId: number,
  payload: {
    action: "verify" | "unverify";
    note?: string | null;
  }
) {
  return apiFetch(`/faculty/class-schedules/${offeringId}/students/${enrollmentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function removeFacultyOfferingStudent(offeringId: number, enrollmentId: number) {
  return apiFetch(`/faculty/class-schedules/${offeringId}/students/${enrollmentId}`, {
    method: "DELETE",
  });
}

export async function uploadFacultySyllabus(offeringId: number, file: File) {
  const formData = new FormData();
  formData.append("syllabus", file);

  return apiFetch(`/faculty/classes/${offeringId}/syllabus`, {
    method: "POST",
    body: formData,
  });
}

export async function createFacultyAssignment(payload: {
  offering_id: number;
  title: string;
  description?: string;
  points?: number;
  due_at?: string | null;
  is_published?: boolean;
}) {
  return apiFetch("/faculty/assignments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFacultyAssignment(
  assignmentId: number,
  payload: {
    title: string;
    description?: string;
    points?: number;
    due_at?: string | null;
    is_published?: boolean;
  }
) {
  return apiFetch(`/faculty/assignments/${assignmentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteFacultyAssignment(assignmentId: number) {
  return apiFetch(`/faculty/assignments/${assignmentId}`, {
    method: "DELETE",
  });
}

export async function saveFacultyGradeSheet(
  offeringId: number,
  items: Array<{
    enrollment_id: number;
    midterm_grade?: number | null;
    final_grade?: number | null;
    re_exam_grade?: number | null;
  }>
) {
  return apiFetch(`/faculty/grade-sheets/${offeringId}/save`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function postFacultyGradeSheet(offeringId: number) {
  return apiFetch(`/faculty/grade-sheets/${offeringId}/post`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export const clearFacultyPeriodCache = (periodId?: number) => {
  if (typeof periodId === "number") {
    singleCache.dashboardSummary.delete(periodId);
    for (const key of singleCache.classSchedules.keys()) {
      if (key.startsWith(`period=${periodId}|`)) {
        singleCache.classSchedules.delete(key);
      }
    }
    singleCache.classLists.delete(periodId);
    singleCache.classes.delete(periodId);
    singleCache.students.delete(periodId);
    singleCache.assignments.delete(periodId);
    singleCache.gradeSheets.delete(periodId);
    singleCache.grades.delete(periodId);
    singleCache.classScheduleRoster.clear();
    singleCache.classScheduleRooms.clear();
    return;
  }

  singleCache.dashboardSummary.clear();
  singleCache.classSchedules.clear();
  singleCache.classScheduleRoster.clear();
  singleCache.classScheduleRooms.clear();
  singleCache.classLists.clear();
  singleCache.classes.clear();
  singleCache.students.clear();
  singleCache.assignments.clear();
  singleCache.gradeSheets.clear();
  singleCache.grades.clear();
  singleCache.gradeSheetDetails.clear();
};

export const clearFacultyPortalCache = () => {
  singleCache.me = {};
  singleCache.periods = {};
  singleCache.scheduleMasters = {};
  singleCache.classScheduleRooms.clear();
  clearFacultyPeriodCache();
};

export const clearFacultyRosterCache = (offeringId?: number) => {
  if (typeof offeringId === "number") {
    singleCache.classScheduleRoster.delete(offeringId);
    return;
  }

  singleCache.classScheduleRoster.clear();
};
