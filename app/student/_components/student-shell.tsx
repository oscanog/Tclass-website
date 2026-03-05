"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense, type ReactNode } from "react";
import { ChevronDown, ChevronRight, LogOut, Menu, Monitor, Moon, Search, Settings, Sun, X } from "lucide-react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { LogoutModal } from "@/components/ui/logout-modal";

import {
  mobileMoreSections,
  mobileTabs,
  navItems,
  sectionTitle,
  studentProfile,
  type NavItem,
  type Section,
} from "./student-data";
import {
  getStudentCurriculumEvaluation,
  getStudentEnrolledSubjects,
  getStudentPeriods,
  preloadStudentPortal,
} from "./student-portal-cache";

type StudentSessionProfile = {
  initials: string;
  name: string;
  email: string;
  number: string;
  program: string;
  year: string;
  section: string;
};
import { SectionContent } from "./student-sections";

const studentSearchEntries: Array<{ section: Section; label: string }> = navItems.flatMap((item) => {
  if (item.children) {
    return item.children.map((child) => ({ section: child.section, label: child.label }));
  }
  return item.section ? [{ section: item.section, label: item.label }] : [];
});

function toYearLabel(yearLevel?: number | null): string {
  const year = Number(yearLevel ?? 0);
  if (!Number.isFinite(year) || year <= 0) return "";
  if (year === 1) return "1st Year";
  if (year === 2) return "2nd Year";
  if (year === 3) return "3rd Year";
  if (year === 4) return "4th Year";
  return `${year}th Year`;
}

function SidebarItem({
  item,
  active,
  expanded,
  onSelect,
  onToggle,
}: {
  item: NavItem;
  active: Section;
  expanded: Set<string>;
  onSelect: (s: Section) => void;
  onToggle: (label: string) => void;
}) {
  const Icon = item.icon;

  if (item.children) {
    const open = expanded.has(item.label);
    const childActive = item.children.some((c) => c.section === active);

    return (
      <div>
        <button
          type="button"
          onClick={() => onToggle(item.label)}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            childActive
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          }`}
        >
          <span className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-72 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-slate-200/70 pl-3 dark:border-white/10">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const isActive = active === child.section;
              return (
                <button
                  key={child.section}
                  type="button"
                  onClick={() => onSelect(child.section)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                  }`}
                >
                  <ChildIcon className="h-3.5 w-3.5" />
                  <span className="truncate">{child.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const isActive = item.section === active;

  return (
    <button
      type="button"
      onClick={() => item.section && onSelect(item.section)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

type Theme = "light" | "dark" | "system";

function ProfileDropdown({
  onLogout,
  compact = false,
  profile,
}: {
  onLogout: () => void;
  compact?: boolean;
  profile: StudentSessionProfile;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("tclass_theme") as Theme | null;
    return saved === "light" || saved === "dark" ? saved : "system";
  });
  const ref = useRef<HTMLDivElement>(null);
  const themeToastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(
    () => () => {
      if (themeToastTimeoutRef.current !== null) {
        window.clearTimeout(themeToastTimeoutRef.current);
      }
    },
    [],
  );

  function applyTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tclass_theme", "dark");
    } else if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tclass_theme", "light");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      localStorage.removeItem("tclass_theme");
    }
    if (themeToastTimeoutRef.current !== null) {
      window.clearTimeout(themeToastTimeoutRef.current);
    }
    themeToastTimeoutRef.current = window.setTimeout(() => {
      toast.success(`Theme: ${nextTheme}`);
    }, 1200);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
        className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 ${
          open ? "bg-slate-100 dark:bg-white/10" : ""
        } ${compact ? "pl-1 pr-1.5" : ""}`}
      >
        {!compact && (
          <div className="hidden flex-col items-end text-right lg:flex">
            <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">
              {profile.name.split(" ").slice(0, 2).join(" ")}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{profile.email}</span>
          </div>
        )}
        <Avatar className="h-8 w-8 ring-2 ring-blue-100 dark:ring-blue-500/20">
          <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
            {profile.initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`animate-scale-in absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 ${
            compact ? "w-[17.5rem]" : "w-60"
          }`}
        >
          <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 to-slate-50 px-4 py-3 dark:border-white/10 dark:from-blue-900/20 dark:to-slate-900/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-blue-200 dark:ring-blue-700">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {profile.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 px-3 py-2.5 dark:border-white/10">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Appearance</p>
            <div className="flex gap-1">
              {(["light", "dark", "system"] as Theme[]).map((t) => {
                const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => applyTheme(t)}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium capitalize transition-all duration-200 ${
                      theme === t
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                toast.success("Settings coming soon...");
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function StudentShellInner({
  initialSection = "home",
  customSectionContent,
}: {
  initialSection?: Section;
  customSectionContent?: Partial<Record<Section, ReactNode>>;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sessionProfile, setSessionProfile] = useState<StudentSessionProfile>(studentProfile);
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set([
        "Class Records",
        "Academic Records",
        ...(pathname === "/student/enrollment" ? ["Online Services"] : []),
      ])
  );
  const [now, setNow] = useState<Date | null>(null);

  let active: Section = initialSection;
  if (pathname === "/student/enrollment") {
    active = "student-enrollment";
  } else if (pathname === "/student" && sectionParam && sectionParam in sectionTitle) {
    active = sectionParam as Section;
  }

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const [meResult, evaluationResult, periodsResult] = await Promise.allSettled([
          preloadStudentPortal(),
          getStudentCurriculumEvaluation(),
          getStudentPeriods(),
        ]);
        if (!mounted) return;

        const payload =
          meResult.status === "fulfilled"
            ? (meResult.value as { user?: { name?: string; email?: string; student_number?: string | null } })
            : {};
        const user = payload.user;
        if (!user?.email) return;

        const evaluationPayload =
          evaluationResult.status === "fulfilled"
            ? (evaluationResult.value as { program_key?: string | null; next_term?: { year_level?: number | null } | null })
            : {};
        const periodsPayload =
          periodsResult.status === "fulfilled"
            ? (periodsResult.value as { active_period_id?: number | null })
            : {};

        const activePeriodId = Number(periodsPayload.active_period_id ?? 0);
        let hasEnrollment = false;
        let currentSection = "";
        if (activePeriodId > 0) {
          try {
            const enrolledPayload = (await getStudentEnrolledSubjects(activePeriodId)) as {
              enrolled_subjects?: Array<{ id?: number; section?: string | null }>;
            };
            const enrolledRows = enrolledPayload.enrolled_subjects ?? [];
            hasEnrollment = enrolledRows.length > 0;
            currentSection = hasEnrollment
              ? String(enrolledRows.find((row) => String(row.section ?? "").trim())?.section ?? "").trim()
              : "";
          } catch {
            hasEnrollment = false;
            currentSection = "";
          }
        }

        const nextYearLevel = Number(evaluationPayload.next_term?.year_level ?? 0);
        const nextProgramKey = String(evaluationPayload.program_key ?? "").trim();
        const nextProgram =
          hasEnrollment && nextProgramKey
            ? nextProgramKey.includes("INFORMATION_TECHNOLOGY")
              ? "BSIT"
              : nextProgramKey.replace(/_/g, " ")
            : "";

        const nextName = (user.name ?? "").trim() || studentProfile.name;
        const nextEmail = user.email;
        const nextNumber = (user.student_number ?? "").trim() || studentProfile.number;
        const nextInitials =
          nextName
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || studentProfile.initials;

        const nextProfile: StudentSessionProfile = {
          ...studentProfile,
          initials: nextInitials,
          name: nextName,
          email: nextEmail,
          number: nextNumber,
          program: nextProgram,
          year: hasEnrollment ? toYearLabel(nextYearLevel) : "",
          section: currentSection,
        };

        // Keep legacy references in sync for sections using studentProfile directly.
        studentProfile.initials = nextProfile.initials;
        studentProfile.name = nextProfile.name;
        studentProfile.email = nextProfile.email;
        studentProfile.number = nextProfile.number;
        studentProfile.program = nextProfile.program;
        studentProfile.year = nextProfile.year;
        studentProfile.section = nextProfile.section;

        setSessionProfile(nextProfile);
      } catch {
        if (!mounted) return;
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const currentTitle = sectionTitle[active];
  const mobileMoreActive = mobileMoreSections.includes(active);
  const q = search.trim().toLowerCase();
  const matchedSections = q
    ? studentSearchEntries.filter((entry) => entry.label.toLowerCase().includes(q))
    : [];
  const searchMatches = q ? matchedSections.length : null;

  const select = (section: Section) => {
    if (section === "student-enrollment") {
      setExpanded((prev) => new Set(prev).add("Online Services"));
    }
    setMobileOpen(false);
    if (section === "student-enrollment") {
      router.push("/student/enrollment");
      return;
    }
    router.push(`/student?section=${section}`);
  };

  const toggleGroup = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const logout = () => {
    document.cookie = "tclass_token=; path=/; max-age=0";
    document.cookie = "tclass_role=; path=/; max-age=0";
    router.push("/login");
  };

  const handleSearchNavigate = () => {
    if (!q) return;
    const firstMatch = matchedSections[0];
    if (!firstMatch) {
      toast.error(`No section found for "${search.trim()}".`);
      return;
    }
    select(firstMatch.section);
  };

  return (
    <>
      <style jsx global>{`
        .student-page > header,
        .student-page > nav,
        .student-page > div[aria-hidden] {
          display: none !important;
        }
      `}</style>

      <div className="-mb-24 -mt-16 md:mb-0">
        <div className="flex h-screen overflow-hidden bg-slate-50 font-[var(--font-geist-sans)] dark:bg-slate-950">
          <div
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
              mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setMobileOpen(false)}
          />

          <aside
            className={`fixed inset-y-0 left-0 z-50 flex w-[90vw] max-w-80 flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 transition-transform duration-300 dark:border-white/10 dark:bg-slate-900 lg:inset-y-0 lg:relative lg:w-64 lg:max-w-none lg:rounded-none lg:translate-x-0 lg:shadow-none ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200/80 px-4 pb-3 pt-3 dark:border-white/10 lg:hidden">
                <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300/80 dark:bg-white/15" />
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Student Portal</p>
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{currentTitle}</p>
                  </div>
                  <button type="button" onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" aria-label="Close drawer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200/80 px-4 py-4 dark:border-white/10">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Avatar className="h-16 w-16 ring-4 ring-blue-100 ring-offset-2 shadow-lg dark:ring-blue-900/50 dark:ring-offset-slate-900 sm:h-20 sm:w-20">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">
                      {sessionProfile.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">{sessionProfile.name}</p>
                    <p className="break-all text-xs text-blue-600 dark:text-blue-400">{sessionProfile.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{sessionProfile.number}</p>
                    {sessionProfile.year ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {sessionProfile.year}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
                {navItems.map((item) => (
                  <SidebarItem key={item.label} item={item} active={active} expanded={expanded} onSelect={select} onToggle={toggleGroup} />
                ))}
              </nav>
              <div className="border-t border-slate-200/80 px-4 py-3 pb-5 dark:border-white/10 lg:pb-3">
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  @2026 Copyright · v1.0.0
                </p>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
              <div className="px-3 pb-2 pt-2 sm:hidden">
                <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-2 shadow-sm dark:border-white/10 dark:from-slate-900 dark:to-slate-950">
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                      <Menu className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Student Portal</p>
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{currentTitle}</p>
                    </div>
                    <ProfileDropdown compact profile={sessionProfile} onLogout={() => setLogoutOpen(true)} />
                  </div>
                </div>
              </div>

              <div className="hidden h-16 items-center gap-3 px-4 sm:flex sm:px-6">
                <button type="button" className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-0">
                  <Image src="/tclass_logo.png" alt="TClass Logo" width={90} height={90} className="block h-[90px] w-[90px] shrink-0 object-contain" />
                  <span className="-ml-4 hidden text-base font-bold leading-none text-slate-900 dark:text-slate-100 md:block">Tarlac Center for Learning and Skills Success</span>
                  <span className="-ml-4 hidden text-base font-bold leading-none text-slate-900 dark:text-slate-100 sm:block md:hidden">TCLASS Student Portal</span>
                </div>
                <div className="flex-1" />
                <div className="relative hidden w-44 sm:block lg:w-56">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSearchNavigate();
                      }
                    }}
                    placeholder="Search sections..."
                    className="h-8 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm focus:bg-white dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/10"
                  />
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{now ? now.toLocaleTimeString() : "--:--:--"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{now ? now.toLocaleDateString() : "---"}</p>
                </div>
                <div className="hidden h-5 w-px bg-slate-200 dark:bg-white/10 sm:block" />
                <ProfileDropdown profile={sessionProfile} onLogout={() => setLogoutOpen(true)} />
              </div>
            </header>

            <main className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth pb-28 sm:pb-0">
              <div key={active} className="animate-fade-in-up p-3 pb-24 sm:p-6 sm:pb-6">
                <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80 sm:hidden">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Current Section</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{currentTitle}</p>
                </div>
                {searchMatches !== null ? (
                  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-sm text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">
                    <p>
                      Search matches in navigation: <span className="font-semibold">{searchMatches}</span>
                    </p>
                    {matchedSections.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {matchedSections.slice(0, 6).map((entry) => (
                          <button
                            key={entry.section}
                            type="button"
                            onClick={() => select(entry.section)}
                            className="rounded-full border border-blue-300/70 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-300/25 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-800/40"
                          >
                            {entry.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-blue-700/90 dark:text-blue-200/90">Press Enter to open the first matching section.</p>
                    )}
                  </div>
                ) : null}
                {customSectionContent?.[active] ?? <SectionContent section={active} />}
              </div>
            </main>

            <div className={`fixed inset-x-3 bottom-2 z-30 transition-all duration-300 sm:hidden ${mobileOpen ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
              <div className="grid grid-cols-5 gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
                {mobileTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = active === tab.section;
                  return (
                    <button
                      key={tab.section}
                      type="button"
                      onClick={() => select(tab.section)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-all ${
                        isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="leading-none">{tab.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-all ${
                    mobileMoreActive ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="leading-none">More</span>
                </button>
              </div>
            </div>
          </div>

          <LogoutModal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={logout} />
        </div>
      </div>
    </>
  );
}


function StudentShellFallback() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400" />
          <p className="text-slate-600 dark:text-slate-300">Loading student portal...</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentShell(props: { initialSection?: Section; customSectionContent?: Partial<Record<Section, ReactNode>> } = {}) {
  return (
    <Suspense fallback={<StudentShellFallback />}>
      <StudentShellInner {...props} />
    </Suspense>
  );
}
