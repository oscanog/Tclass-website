"use client";

import { apiFetch } from "@/lib/api-client";

type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
};

const singleCache = {
  me: {} as CacheEntry<unknown>,
  periods: {} as CacheEntry<unknown>,
  dashboardSummary: {} as CacheEntry<unknown>,
  curriculumEvaluation: {} as CacheEntry<unknown>,
  enrollmentHistory: {} as CacheEntry<unknown>,
};

const periodCache = {
  enrolledSubjects: new Map<number, CacheEntry<unknown>>(),
  preEnlisted: new Map<number, CacheEntry<unknown>>(),
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

async function loadByPeriod<T>(
  store: Map<number, CacheEntry<unknown>>,
  periodId: number,
  loader: () => Promise<T>,
  force = false
): Promise<T> {
  const entry = store.get(periodId) ?? {};
  store.set(periodId, entry);

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

export const getStudentMe = <T = unknown>(force = false) =>
  loadSingle<T>(singleCache.me, () => apiFetch("/auth/me") as Promise<T>, force);

export const getStudentPeriods = <T = unknown>(force = false) =>
  loadSingle<T>(singleCache.periods, () => apiFetch("/student/periods") as Promise<T>, force);

export const getStudentDashboardSummary = <T = unknown>(force = false) =>
  loadSingle<T>(singleCache.dashboardSummary, () => apiFetch("/student/dashboard-summary") as Promise<T>, force);

export const getStudentCurriculumEvaluation = <T = unknown>(force = false) =>
  loadSingle<T>(singleCache.curriculumEvaluation, () => apiFetch("/student/curriculum-evaluation") as Promise<T>, force);

export const getStudentEnrollmentHistory = <T = unknown>(force = false) =>
  loadSingle<T>(singleCache.enrollmentHistory, () => apiFetch("/student/enrollment-history") as Promise<T>, force);

export const getStudentEnrolledSubjects = <T = unknown>(periodId: number, force = false) =>
  loadByPeriod<T>(
    periodCache.enrolledSubjects,
    periodId,
    () => apiFetch(`/student/enrollments/enrolled-subjects?period_id=${periodId}`) as Promise<T>,
    force
  );

export const getStudentPreEnlisted = <T = unknown>(periodId: number, force = false) =>
  loadByPeriod<T>(
    periodCache.preEnlisted,
    periodId,
    () => apiFetch(`/student/enrollments/pre-enlisted?period_id=${periodId}`) as Promise<T>,
    force
  );

export async function preloadStudentPortal() {
  const [mePayload, periodsPayload] = await Promise.all([
    getStudentMe(),
    getStudentPeriods<{ active_period_id?: number | null }>(),
    getStudentCurriculumEvaluation(),
    getStudentDashboardSummary(),
  ]);

  const activePeriodId = Number((periodsPayload as { active_period_id?: number | null }).active_period_id ?? 0);
  if (activePeriodId > 0) {
    void getStudentEnrolledSubjects(activePeriodId);
  }

  return mePayload;
}
