"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  Home, BookOpen, ClipboardCheck, Calendar, FileText,
  Users, Wifi, FileUser, LogOut, Menu, X,
  ChevronDown, ChevronRight, Globe, Search,
  Settings, Sun, Moon, Monitor,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutModal } from "@/components/ui/logout-modal";
import { facultyProfile } from "./_components/faculty-data";
import { HomeSection } from "./_components/home-section";
import { ClassSchedulesSection } from "./_components/class-schedules-section";
import { ClassListsSection } from "./_components/class-lists-section";
import { GradeSheetsSection } from "./_components/grade-sheets-section";
import { EvaluationResultsSection } from "./_components/evaluation-results-section";
import {
  RegisteredDocumentsSection,
  OnlinePdsSection,
  WifiAccessSection,
} from "./_components/placeholder-sections";

// ─── Types ────────────────────────────────────────────────────────────────────
type NavSection =
  | "home"
  | "class-schedules"
  | "class-lists"
  | "grade-sheets"
  | "registered-documents"
  | "evaluation-results"
  | "online-pds"
  | "wifi-access";

type ChildNavItem = { label: string; icon: React.ElementType; section: NavSection };
type NavItem =
  | { label: string; icon: React.ElementType; section: NavSection; children?: never }
  | { label: string; icon: React.ElementType; section?: never; children: ChildNavItem[] };

// ─── Section Labels ───────────────────────────────────────────────────────────
const sectionLabel: Record<Exclude<NavSection, "home">, string> = {
  "class-schedules":      "Class Schedules",
  "class-lists":          "Class Lists",
  "grade-sheets":         "Grade Sheets",
  "registered-documents": "Registered Documents",
  "evaluation-results":   "Evaluation Results",
  "online-pds":           "Online PDS",
  "wifi-access":          "Wifi Access Generator",
};

// ─── Nav Config ───────────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Home",                 icon: Home,           section: "home" },
  {
    label: "Class Records", icon: BookOpen,
    children: [
      { label: "Class Schedules", icon: Calendar,       section: "class-schedules" },
      { label: "Class Lists",     icon: Users,          section: "class-lists" },
      { label: "Grade Sheets",    icon: ClipboardCheck, section: "grade-sheets" },
    ],
  },
  { label: "Registered Documents", icon: FileText,       section: "registered-documents" },
  { label: "Evaluation Results",   icon: ClipboardCheck, section: "evaluation-results" },
  {
    label: "Online Services", icon: Globe,
    children: [
      { label: "Online PDS",            icon: FileUser, section: "online-pds" },
      { label: "Wifi Access Generator", icon: Wifi,     section: "wifi-access" },
    ],
  },
];

const mobilePrimaryTabs: Array<{ label: string; icon: React.ElementType; section: NavSection }> = [
  { label: "Home", icon: Home, section: "home" },
  { label: "Schedule", icon: Calendar, section: "class-schedules" },
  { label: "Lists", icon: Users, section: "class-lists" },
  { label: "Grades", icon: ClipboardCheck, section: "grade-sheets" },
];

const mobileSecondarySections: NavSection[] = [
  "registered-documents",
  "evaluation-results",
  "online-pds",
  "wifi-access",
];

function getSectionTitle(section: NavSection) {
  return section === "home" ? "Faculty Dashboard" : sectionLabel[section];
}

// ─── Section Renderer ─────────────────────────────────────────────────────────
function SectionContent({ section }: { section: NavSection }) {
  switch (section) {
    case "home":                 return <HomeSection />;
    case "class-schedules":      return <ClassSchedulesSection />;
    case "class-lists":          return <ClassListsSection />;
    case "grade-sheets":         return <GradeSheetsSection />;
    case "registered-documents": return <RegisteredDocumentsSection />;
    case "evaluation-results":   return <EvaluationResultsSection />;
    case "online-pds":           return <OnlinePdsSection />;
    case "wifi-access":          return <WifiAccessSection />;
    default:                     return <HomeSection />;
  }
}

// ─── Skeleton Loading ─────────────────────────────────────────────────────────
function FacultyPageSkeleton() {
  return (
    <div className="space-y-5 p-4 pb-24 sm:space-y-6 sm:p-6 sm:pb-6">
      {/* Mobile app shell */}
      <div className="space-y-3 sm:hidden">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[72, 92, 80, 84].map((w, i) => (
            <Skeleton
              key={w}
              className="h-9 shrink-0 rounded-full"
              style={{ width: w, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Desktop/tablet header row */}
      <div className="hidden items-start justify-between gap-4 sm:flex">
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-8 w-48 sm:w-64 rounded-xl" />
          <Skeleton className="h-4 w-64 sm:w-80 rounded-lg hidden sm:block" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Skeleton className="h-9 w-40 rounded-xl hidden sm:block" />
          <Skeleton className="h-8 w-24 rounded-lg hidden md:block" />
          <div className="h-px w-px hidden sm:block" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      {/* Advisory */}
      <Skeleton className="h-12 w-full rounded-xl" />
      {/* OneDrive card */}
      <Skeleton className="h-56 w-full rounded-xl" />
      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>

      {/* Mobile bottom nav skeleton */}
      <div className="fixed inset-x-3 bottom-3 z-30 sm:hidden">
        <div className="grid grid-cols-5 gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 rounded-xl py-1.5">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-2.5 w-9 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
function SidebarNavItem({
  item,
  activeSection,
  onSelect,
  expandedGroups,
  onToggleGroup,
}: {
  item: NavItem;
  activeSection: NavSection;
  onSelect: (s: NavSection) => void;
  expandedGroups: Set<string>;
  onToggleGroup: (label: string) => void;
}) {
  const Icon = item.icon;

  if (item.children) {
    const isExpanded = expandedGroups.has(item.label);
    const isChildActive = item.children.some((c) => c.section === activeSection);

    return (
      <div>
        <button
          onClick={() => onToggleGroup(item.label)}
          className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            isChildActive
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-200"
          }`}
        >
          <span className="flex items-center gap-3">
            <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {item.label}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-slate-200/70 pl-3 dark:border-white/10">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const isActive = activeSection === child.section;
              return (
                <button
                  key={child.section}
                  onClick={() => onSelect(child.section)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 font-semibold text-white shadow-sm shadow-blue-500/30"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-200"
                  }`}
                >
                  <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                  {child.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const isActive = activeSection === item.section;
  return (
    <button
      onClick={() => onSelect(item.section!)}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-200"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {item.label}
    </button>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="hidden md:block w-24" />;

  const dateStr = now.toLocaleDateString("en-PH", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-PH", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <div className="hidden flex-col items-end text-right md:flex">
      <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{timeStr}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{dateStr}</span>
    </div>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
type Theme = "light" | "dark" | "system";

function ProfileDropdown({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function applyTheme(t: Theme) {
    setTheme(t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tclass_theme", "dark");
    } else if (t === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tclass_theme", "light");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.removeItem("tclass_theme");
    }
    toast.success(`Theme: ${t}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 ${open ? "bg-slate-100 dark:bg-white/10" : ""}`}
      >
        <div className="hidden flex-col items-end text-right sm:flex">
          <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">
            {facultyProfile.name}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {facultyProfile.email}
          </span>
        </div>
        <Avatar className="h-8 w-8 ring-2 ring-blue-200 ring-offset-1 dark:ring-blue-700 dark:ring-offset-slate-900 transition-all duration-200">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
            {facultyProfile.initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
          {/* User info */}
          <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 to-slate-50 px-4 py-3 dark:border-white/10 dark:from-blue-900/20 dark:to-slate-900/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-blue-200 dark:ring-blue-700">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
                  {facultyProfile.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{facultyProfile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{facultyProfile.email}</p>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="border-b border-slate-100 px-3 py-2.5 dark:border-white/10">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Appearance
            </p>
            <div className="flex gap-1">
              {(["light", "dark", "system"] as Theme[]).map((t) => {
                const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
                return (
                  <button
                    key={t}
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

          {/* Settings */}
          <div className="border-b border-slate-100 dark:border-white/10">
            <button
              onClick={() => { setOpen(false); toast.success("Settings coming soon..."); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FacultyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection>("home");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Class Records"]));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Simulate initial page load
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // Close sidebar on resize to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setMobileSidebarOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  const currentSectionTitle = getSectionTitle(activeSection);
  const mobileMoreActive = mobileSecondarySections.includes(activeSection);

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleSelect(section: NavSection) {
    setActiveSection(section);
    setMobileSidebarOpen(false);
  }

  function handleLogout() {
    document.cookie = "tclass_token=; path=/; max-age=0";
    document.cookie = "tclass_role=; path=/; max-age=0";
    toast.success("Logged out successfully");
    router.push("/login");
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200/80 px-4 pb-3 pt-2 dark:border-white/10 lg:hidden">
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300/80 dark:bg-white/15" />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Faculty Portal
            </p>
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {currentSectionTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
            aria-label="Close navigation drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Profile Card — sidebar starts here, no logo header */}
      <div className="border-b border-slate-200/80 px-4 py-5 dark:border-white/10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-blue-100 ring-offset-2 shadow-lg dark:ring-blue-900/50 dark:ring-offset-slate-900">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">
                {facultyProfile.initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{facultyProfile.name}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">{facultyProfile.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{facultyProfile.facultyNumber}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              {facultyProfile.position}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3 scrollbar-thin">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            item={item}
            activeSection={activeSection}
            onSelect={handleSelect}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200/80 px-4 py-3 pb-5 dark:border-white/10 lg:pb-3">
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          @2026 Copyright · v 1.0.0
        </p>
      </div>
    </div>
  );

  return (
    <div className="faculty-page flex h-screen overflow-hidden bg-slate-50 font-[var(--font-manrope)] dark:bg-slate-950">
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar — CSS transform slide for mobile */}
      <aside
        className={`
          fixed inset-y-2 left-0 z-50 flex w-[86vw] max-w-80 flex-col rounded-r-3xl
          border-r border-slate-200/80 bg-white
          shadow-2xl shadow-slate-900/10
          transition-transform duration-300 ease-in-out motion-reduce:transition-none
          dark:border-white/10 dark:bg-slate-900
          lg:inset-y-0 lg:relative lg:w-64 lg:max-w-none lg:rounded-none lg:translate-x-0 lg:shadow-none
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
          <div className="px-3 pb-2 pt-2 sm:hidden">
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-2.5 shadow-sm shadow-slate-900/5 dark:border-white/10 dark:from-slate-900 dark:to-slate-950">
              <div className="flex items-center gap-2">
                <button
                  className="rounded-xl p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-white/10"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Faculty Portal
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {currentSectionTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast("Search is available on tablet/desktop view.")}
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
                <ProfileDropdown onLogout={() => setShowLogoutModal(true)} />
              </div>
            </div>
          </div>

          <div className="hidden h-16 shrink-0 items-center gap-3 px-4 sm:flex sm:px-6">
          {/* Mobile menu button */}
          <button
            className="rounded-lg p-2.5 text-slate-600 transition-all duration-200 hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-white/10 lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo + School name */}
          <div className="-ml-2 flex items-center gap-0 self-stretch">
            <Image
              src="/tclass_logo.png"
              alt="TClass Logo"
              width={90}
              height={90}
              className="block h-[900px] w-[90px] shrink-0 self-center object-contain"
            />
            <span className="hidden -ml-4 items-center self-center text-base font-bold leading-none text-slate-900 dark:text-slate-100 sm:flex">
              Tarlac Center for Learning and Skills Success
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative hidden w-44 sm:block lg:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm focus:bg-white dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/10"
            />
          </div>

          {/* Live clock */}
          <LiveClock />

          {/* Divider */}
          <div className="hidden h-5 w-px bg-slate-200 dark:bg-white/10 sm:block" />

          {/* Profile */}
          <ProfileDropdown onLogout={() => setShowLogoutModal(true)} />
          </div>
        </header>

        {/* ── Scrollable Content ── */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth pb-24 sm:pb-0">
          {isLoading ? (
            <FacultyPageSkeleton />
          ) : (
            <div key={activeSection} className="animate-fade-in-up p-4 pb-24 sm:p-6 sm:pb-6">
              <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80 sm:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Current Section
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {currentSectionTitle}
                </p>
              </div>
              <SectionContent section={activeSection} />
            </div>
          )}
        </main>

        <div
          className={`fixed inset-x-3 bottom-3 z-30 transition-all duration-300 sm:hidden ${
            mobileSidebarOpen ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          <div className="grid grid-cols-5 gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
            {mobilePrimaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.section;
              return (
                <button
                  key={tab.section}
                  type="button"
                  onClick={() => handleSelect(tab.section)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  }`}
                  aria-label={tab.label}
                >
                  <Icon className="h-4 w-4" />
                  <span className="leading-none">{tab.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-all duration-200 ${
                mobileMoreActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
              }`}
              aria-label="More sections"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="leading-none">More</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
