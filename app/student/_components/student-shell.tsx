"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, LogOut, Menu, Monitor, Moon, Search, Settings, Sun, X } from "lucide-react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { LogoutModal } from "@/components/ui/logout-modal";
import { Skeleton } from "@/components/ui/skeleton";

import {
  mobileMoreSections,
  mobileTabs,
  navItems,
  sectionTitle,
  studentProfile,
  type NavItem,
  type Section,
} from "./student-data";
import { SectionContent } from "./student-sections";

function LoadingView() {
  return (
    <div className="space-y-5 p-4 pb-24 sm:space-y-6 sm:p-6 sm:pb-6">
      <div className="space-y-3 sm:hidden">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>

      <div className="hidden items-start justify-between gap-4 sm:flex">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-52 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>

      <div className="fixed inset-x-3 bottom-3 z-30 sm:hidden">
        <div className="grid grid-cols-5 gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
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
}: {
  onLogout: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tclass_theme") as Theme | null;
    setTheme(saved === "light" || saved === "dark" ? saved : "system");
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    toast.success(`Theme: ${nextTheme}`);
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
              {studentProfile.name.split(" ").slice(0, 2).join(" ")}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{studentProfile.email}</span>
          </div>
        )}
        <Avatar className="h-8 w-8 ring-2 ring-blue-100 dark:ring-blue-500/20">
          <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
            {studentProfile.initials}
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
                  {studentProfile.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {studentProfile.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{studentProfile.email}</p>
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

export default function StudentShell() {
  const router = useRouter();
  const [active, setActive] = useState<Section>("home");
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Class Records", "Academic Records"]));
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 850);
    return () => window.clearTimeout(t);
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
  const searchMatches = q
    ? navItems.reduce((count, item) => {
        if (item.children) return count + item.children.filter((c) => c.label.toLowerCase().includes(q)).length;
        return count + (item.label.toLowerCase().includes(q) ? 1 : 0);
      }, 0)
    : null;

  const select = (section: Section) => {
    setActive(section);
    setMobileOpen(false);
  };

  const toggleGroup = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const logout = () => {
    document.cookie = "tclass_token=; path=/; max-age=0";
    document.cookie = "tclass_role=; path=/; max-age=0";
    router.push("/login");
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
            className={`fixed inset-y-2 left-0 z-50 flex w-[86vw] max-w-80 flex-col rounded-r-3xl border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 transition-transform duration-300 dark:border-white/10 dark:bg-slate-900 lg:inset-y-0 lg:relative lg:w-64 lg:max-w-none lg:rounded-none lg:translate-x-0 lg:shadow-none ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200/80 px-4 pb-3 pt-2 dark:border-white/10 lg:hidden">
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

              <div className="border-b border-slate-200/80 px-4 py-5 dark:border-white/10">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Avatar className="h-20 w-20 ring-4 ring-blue-100 ring-offset-2 shadow-lg dark:ring-blue-900/50 dark:ring-offset-slate-900">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">
                      {studentProfile.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{studentProfile.name}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{studentProfile.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{studentProfile.number}</p>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {studentProfile.year}
                    </span>
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
                <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-2.5 shadow-sm dark:border-white/10 dark:from-slate-900 dark:to-slate-950">
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                      <Menu className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Student Portal</p>
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{currentTitle}</p>
                    </div>
                    <button type="button" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" aria-label="Search">
                      <Search className="h-4 w-4" />
                    </button>
                    <ProfileDropdown compact onLogout={() => setLogoutOpen(true)} />
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
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sections..." className="h-8 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm focus:bg-white dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/10" />
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{now ? now.toLocaleTimeString() : "--:--:--"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{now ? now.toLocaleDateString() : "---"}</p>
                </div>
                <div className="hidden h-5 w-px bg-slate-200 dark:bg-white/10 sm:block" />
                <ProfileDropdown onLogout={() => setLogoutOpen(true)} />
              </div>
            </header>

            <main className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth pb-24 sm:pb-0">
              {loading ? (
                <LoadingView />
              ) : (
                <div key={active} className="animate-fade-in-up p-4 pb-24 sm:p-6 sm:pb-6">
                  <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80 sm:hidden">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Current Section</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{currentTitle}</p>
                  </div>
                  {searchMatches !== null ? (
                    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-sm text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">
                      Search matches in navigation: <span className="font-semibold">{searchMatches}</span>
                    </div>
                  ) : null}
                  <SectionContent section={active} />
                </div>
              )}
            </main>

            <div className={`fixed inset-x-3 bottom-3 z-30 transition-all duration-300 sm:hidden ${mobileOpen ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
              <div className="grid grid-cols-5 gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
                {mobileTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = active === tab.section;
                  return (
                    <button
                      key={tab.section}
                      type="button"
                      onClick={() => select(tab.section)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-all ${
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
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-all ${
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

