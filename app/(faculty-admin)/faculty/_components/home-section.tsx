"use client";

import { AlertTriangle, UserCircle, Building2, Briefcase, BookMarked, PartyPopper } from "lucide-react";
import { facultyProfile } from "./faculty-data";

export function HomeSection() {
  return (
    <div className="space-y-5">
      {/* Welcome heading */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
          Hello, {facultyProfile.name}!
        </h1>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          Welcome to your faculty portal. Access your schedules, class lists, and more.
        </p>
      </div>

      {/* Safari advisory */}
      <div className="animate-fade-in-up motion-delay-50 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          <strong>Safari Users:</strong> If you cannot expand menus, please try Chrome or Edge for the best experience.
        </span>
      </div>

      {/* OneDrive Advisory */}
      <div className="animate-fade-in-up motion-delay-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            ADVISORY: ONEDRIVE STORAGE LIMIT
          </p>
        </div>
        <div className="space-y-4 px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
          <p>
            This is a reminder to everyone of the adjustment to Microsoft 365 storage allocations
            that took effect on July 1, 2025.
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <th className="border-b border-slate-200 px-4 py-2.5 text-left font-semibold text-slate-700 dark:border-white/10 dark:text-slate-300">
                    User Type
                  </th>
                  <th className="border-b border-slate-200 px-4 py-2.5 text-left font-semibold text-slate-700 dark:border-white/10 dark:text-slate-300">
                    New Storage Limit
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="border-b border-slate-100 px-4 py-2.5 dark:border-white/5">Active Employee and Faculty</td>
                  <td className="border-b border-slate-100 px-4 py-2.5 font-medium text-blue-600 dark:border-white/5 dark:text-blue-400">25GB</td>
                </tr>
                <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-2.5">Active Students</td>
                  <td className="px-4 py-2.5 font-medium text-blue-600 dark:text-blue-400">3GB</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Inactive Employee, Faculty, and Student accounts will be permanently deleted, resulting
            in the loss of access to their OneDrive accounts. Files that have exceeded the new
            storage limit will also be deleted. Users are strongly advised to retrieve and back up
            their files before the deletion date.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Only files that pertain to academic, research, and administrative purposes are permitted
            to be stored in your OneDrive. Storing video files is strongly discouraged. Please
            ensure that the files you store align with these guidelines to maintain optimal
            performance and organization.
          </p>
          <p className="text-slate-600 dark:text-slate-400">Thank you for your understanding.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            NOTE: Files uploaded to MSTeams will count towards your total storage allocation.
          </p>
        </div>
      </div>

      {/* Info Cards — staggered entrance */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Schedule */}
        <div className="animate-fade-in-up motion-delay-150 group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-700/50">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            YOUR SCHEDULE TODAY
          </p>
          <PartyPopper className="h-10 w-10 text-slate-300 transition-transform duration-300 group-hover:scale-110 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No classes scheduled today.</p>
        </div>

        {/* Employee ID */}
        <div className="animate-fade-in-up motion-delay-200 group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-700/50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-900/30">
            <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">EMPLOYEE ID</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{facultyProfile.employeeId}</p>
          </div>
        </div>

        {/* Department */}
        <div className="animate-fade-in-up motion-delay-250 group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-indigo-700/50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-900/30">
            <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">DEPARTMENT</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{facultyProfile.department}</p>
          </div>
        </div>

        {/* Position */}
        <div className="animate-fade-in-up motion-delay-300 group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-emerald-700/50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-900/30">
            <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">POSITION</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{facultyProfile.position}</p>
          </div>
        </div>

        {/* Load Count */}
        <div className="animate-fade-in-up motion-delay-350 group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-amber-700/50">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-900/30">
            <BookMarked className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">LOAD COUNT</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{facultyProfile.loadCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
