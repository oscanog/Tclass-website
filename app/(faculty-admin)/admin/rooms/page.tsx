"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  BookOpen,
  Building2,
  Calendar,
  Cpu,
  DoorOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  Library,
  MessageSquare,
  Microscope,
  Monitor,
  Plus,
  Presentation,
  Save,
  School,
  ShieldCheck,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { AdminCsvGeneratorTrigger } from "@/components/admin/csv-generator-trigger";
import { AdminCsvImportTrigger } from "@/components/admin/csv-import-trigger";
import { GlobalSearchInput } from "@/components/shared/global-search-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarActionsMenu } from "@/components/ui/avatar-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { clearPortalSessionUserCache, usePortalSessionUser } from "@/lib/portal-session-user";

type Period = { id: number; name: string; is_active: number | boolean };
type Room = {
  id: number;
  room_code: string;
  title?: string | null;
  description?: string | null;
  icon_key?: string | null;
  building?: string | null;
  capacity?: number | null;
  is_active: boolean | number;
  created_by_name?: string | null;
  updated_by_name?: string | null;
};
type Availability = { room_id: number; is_available: boolean; warnings: string[] };

const iconMap: Record<string, LucideIcon> = {
  "building-2": Building2,
  "door-open": DoorOpen,
  school: School,
  monitor: Monitor,
  "flask-conical": FlaskConical,
  microscope: Microscope,
  cpu: Cpu,
  "book-open": BookOpen,
  library: Library,
  presentation: Presentation,
  users: Users,
  "graduation-cap": GraduationCap,
};

const emptyForm = {
  room_code: "",
  title: "",
  description: "",
  icon_key: "building-2",
  building: "",
  capacity: "",
  is_active: true,
};

export default function AdminRoomsPage() {
  const router = useRouter();
  const { sessionUser } = usePortalSessionUser();
  const sessionName = sessionUser?.name?.trim() || "Account";
  const sessionEmail = sessionUser?.email?.trim() || "";
  const sessionInitials = sessionName.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "AD";

  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Mon");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [presets, setPresets] = useState<string[]>(Object.keys(iconMap));
  const [availability, setAvailability] = useState<Map<number, Availability>>(new Map());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");
  const [building, setBuilding] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteImpact, setDeleteImpact] = useState<{ offering_count: number; affected_enrollment_count: number } | null>(null);
  const [deleteCode, setDeleteCode] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const loadMasters = useCallback(async () => {
    const payload = (await apiFetch("/admin/scheduling/masters")) as {
      periods?: Period[];
      room_icon_presets?: string[];
    };
    const nextPeriods = payload.periods ?? [];
    setPeriods(nextPeriods);
    setPeriodId(String(nextPeriods.find((p) => Number(p.is_active) === 1)?.id ?? nextPeriods[0]?.id ?? ""));
    if ((payload.room_icon_presets ?? []).length) {
      setPresets(payload.room_icon_presets ?? []);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (debouncedSearch) qs.set("search", debouncedSearch);
      if (building.trim()) qs.set("building", building.trim());
      if (status !== "all") qs.set("active_only", status === "active" ? "1" : "0");
      const payload = (await apiFetch(`/admin/scheduling/rooms${qs.size ? `?${qs.toString()}` : ""}`)) as {
        items?: Room[];
        room_icon_presets?: string[];
      };
      const items = payload.items ?? [];
      setRooms(items);
      if ((payload.room_icon_presets ?? []).length) setPresets(payload.room_icon_presets ?? []);
      if (!selectedId || !items.some((r) => r.id === selectedId)) setSelectedId(items[0]?.id ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  }, [building, debouncedSearch, selectedId, status]);

  const loadAvailability = useCallback(async () => {
    const qs = new URLSearchParams();
    if (periodId && dayOfWeek && startTime && endTime) {
      qs.set("period_id", periodId);
      qs.set("day_of_week", dayOfWeek);
      qs.set("start_time", startTime);
      qs.set("end_time", endTime);
    }
    if (debouncedSearch) qs.set("search", debouncedSearch);
    if (building.trim()) qs.set("building", building.trim());
    if (status !== "all") qs.set("active_only", status === "active" ? "1" : "0");

    const payload = (await apiFetch(`/admin/scheduling/rooms/availability${qs.size ? `?${qs.toString()}` : ""}`)) as {
      items?: Array<{ room_id: number; is_available: boolean; warnings: string[] }>;
    };
    const map = new Map<number, Availability>();
    for (const row of payload.items ?? []) map.set(row.room_id, row);
    setAvailability(map);
  }, [building, dayOfWeek, debouncedSearch, endTime, periodId, startTime, status]);

  useEffect(() => {
    void loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadAvailability(), 350);
    return () => window.clearTimeout(t);
  }, [loadAvailability]);

  useEffect(() => {
    if (!selectedId) {
      setForm(emptyForm);
      return;
    }
    const room = rooms.find((value) => value.id === selectedId);
    if (!room) return;
    setForm({
      room_code: room.room_code ?? "",
      title: room.title ?? "",
      description: room.description ?? "",
      icon_key: room.icon_key ?? presets[0] ?? "building-2",
      building: room.building ?? "",
      capacity: room.capacity ? String(room.capacity) : "",
      is_active: Boolean(room.is_active),
    });
  }, [presets, rooms, selectedId]);

  const selectedRoom = useMemo(() => rooms.find((x) => x.id === selectedId) ?? null, [rooms, selectedId]);

  const saveRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        room_code: form.room_code.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        icon_key: form.icon_key || null,
        building: form.building.trim() || null,
        capacity: form.capacity.trim() ? Number(form.capacity) : null,
        is_active: form.is_active,
      };
      if (selectedId) {
        await apiFetch(`/admin/scheduling/rooms/${selectedId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/admin/scheduling/rooms", { method: "POST", body: JSON.stringify(payload) });
      }
      toast.success("Room saved.");
      await Promise.all([loadRooms(), loadAvailability()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const previewDelete = async () => {
    if (!selectedId) return;
    setDeleteOpen(true);
    setDeleteCode("");
    try {
      const payload = (await apiFetch(`/admin/scheduling/rooms/${selectedId}?preview=1`, { method: "DELETE" })) as {
        impact?: { offering_count: number; affected_enrollment_count: number };
      };
      setDeleteImpact(payload.impact ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to preview delete impact.");
    }
  };

  const confirmDelete = async () => {
    if (!selectedId || !selectedRoom) return;
    try {
      await apiFetch(`/admin/scheduling/rooms/${selectedId}`, {
        method: "DELETE",
        body: JSON.stringify({ confirm_force: true, confirm_text: deleteCode }),
      });
      toast.success("Room deleted.");
      setDeleteOpen(false);
      setSelectedId(null);
      await Promise.all([loadRooms(), loadAvailability()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const resetNew = () => {
    setSelectedId(null);
    setForm((prev) => ({ ...emptyForm, icon_key: presets[0] ?? prev.icon_key }));
  };

  const logout = () => {
    document.cookie = "tclass_token=; path=/; max-age=0; samesite=lax";
    document.cookie = "tclass_role=; path=/; max-age=0; samesite=lax";
    clearPortalSessionUserCache();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="hidden xl:flex xl:w-64 xl:flex-col xl:border-r xl:border-slate-200/80 xl:bg-white xl:dark:border-white/10 xl:dark:bg-slate-900">
        <div className="flex h-full flex-col p-3">
          <div className="mb-4 flex flex-col items-center gap-2 text-center"><Avatar><AvatarFallback>{sessionInitials}</AvatarFallback></Avatar><p className="text-sm font-semibold">{sessionName}</p><p className="text-xs text-slate-500">{sessionEmail}</p></div>
          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><School className="h-4 w-4" />Dashboard</Link>
            <Link href="/admin/class-scheduling" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><Calendar className="h-4 w-4" />Class Scheduling</Link>
            <Link href="/admin/rooms" className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"><Building2 className="h-4 w-4" />Room Management</Link>
            <Link href="/admin/programs" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><BookOpen className="h-4 w-4" />Programs</Link>
            <Link href="/admin/rbac" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><ShieldCheck className="h-4 w-4" />Faculty RBAC</Link>
            <Link href="/admin/curriculum" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><FileText className="h-4 w-4" />Curriculum</Link>
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center"><Image src="/tclass_logo.png" alt="TClass Logo" width={56} height={56} className="h-14 w-14 object-contain" /><span className="hidden text-sm font-bold md:block">Tarlac Center for Learning and Skills Success</span></div>
            <div className="flex items-center gap-2"><GlobalSearchInput value={search} onChange={setSearch} placeholder="Search rooms..." className="hidden lg:block lg:w-52" /><AdminCsvImportTrigger className="h-9" /><AdminCsvGeneratorTrigger className="h-9" /><Button type="button" variant="ghost" size="icon" className="hidden sm:inline-flex"><MessageSquare className="h-5 w-5" /></Button><AvatarActionsMenu initials={sessionInitials} onLogout={logout} name={sessionName} subtitle={sessionEmail} triggerName={sessionName} triggerSubtitle={sessionEmail} /></div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader><CardTitle>Rooms</CardTitle><CardDescription>{loading ? "Loading rooms..." : `${rooms.length} room(s)`}</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <Input value={building} onChange={(event) => setBuilding(event.target.value)} placeholder="Building filter" />
                  <Select value={status} onValueChange={(value) => setStatus(value as "all" | "active" | "inactive")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="all">All</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
                  <Button type="button" variant="outline" onClick={resetNew}><Plus className="mr-2 h-4 w-4" />New Room</Button>
                </div>
                {rooms.map((room) => {
                  const Icon = iconMap[room.icon_key ?? ""] ?? Building2;
                  const slot = availability.get(room.id);
                  return (
                    <button key={room.id} type="button" onClick={() => setSelectedId(room.id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === room.id ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-white/10"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 text-slate-600 dark:text-slate-300" /><div><p className="font-semibold">{room.room_code}</p><p className="text-xs text-slate-500">{room.title || "Untitled"} | {room.building || "-"} | {room.capacity || 0} seats</p></div></div>
                        <div className="flex flex-col items-end gap-1"><Badge variant={Boolean(room.is_active) ? "secondary" : "outline"}>{Boolean(room.is_active) ? "Active" : "Inactive"}</Badge>{slot ? <Badge variant={slot.is_available ? "secondary" : "destructive"}>{slot.is_available ? "Open" : "Blocked"}</Badge> : null}</div>
                      </div>
                      {slot?.warnings?.length ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{slot.warnings[0]}</p> : null}
                      <p className="mt-1 text-[11px] text-slate-500">Created by {room.created_by_name || "System"} | Last edited by {room.updated_by_name || "System"}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{selectedId ? "Edit Room" : "Create Room"}</CardTitle><CardDescription>Icon + title + description with audit attribution.</CardDescription></CardHeader>
                <CardContent>
                  <form className="space-y-3" onSubmit={saveRoom}>
                    <div className="grid gap-2 md:grid-cols-2"><div><Label>Room Code</Label><Input required value={form.room_code} onChange={(event) => setForm((prev) => ({ ...prev, room_code: event.target.value.toUpperCase() }))} /></div><div><Label>Title</Label><Input required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} /></div></div>
                    <div className="grid gap-2 md:grid-cols-3"><div><Label>Building</Label><Input value={form.building} onChange={(event) => setForm((prev) => ({ ...prev, building: event.target.value }))} /></div><div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))} /></div><div><Label>Status</Label><Select value={form.is_active ? "active" : "inactive"} onValueChange={(value) => setForm((prev) => ({ ...prev, is_active: value === "active" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div></div>
                    <div><Label>Icon</Label><Select value={form.icon_key} onValueChange={(value) => setForm((prev) => ({ ...prev, icon_key: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{presets.map((key) => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></div>
                    <div className="flex gap-2"><Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Room"}</Button>{selectedId ? <Button type="button" variant="destructive" onClick={() => void previewDelete()}><Trash2 className="mr-2 h-4 w-4" />Delete</Button> : null}</div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Availability Slot</CardTitle><CardDescription>Room conflicts are blocked by period + day + overlapping time.</CardDescription></CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-2">
                  <div className="md:col-span-2"><Label>Period</Label><Select value={periodId || "__empty"} onValueChange={(value) => setPeriodId(value === "__empty" ? "" : value)}><SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger><SelectContent>{periods.map((period) => <SelectItem key={period.id} value={String(period.id)}>{period.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Day</Label><Select value={dayOfWeek} onValueChange={setDayOfWeek}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                  <div />
                  <div><Label>Start</Label><Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></div>
                  <div><Label>End</Label><Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Room</DialogTitle><DialogDescription>Force delete cascades to linked offerings. Type room code to confirm.</DialogDescription></DialogHeader>
          <p className="text-sm">Offerings affected: {deleteImpact?.offering_count ?? 0}</p>
          <p className="text-sm">Enrollment rows affected: {deleteImpact?.affected_enrollment_count ?? 0}</p>
          <Input value={deleteCode} onChange={(event) => setDeleteCode(event.target.value)} placeholder={selectedRoom?.room_code ?? ""} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={!selectedRoom || deleteCode.trim().toUpperCase() !== selectedRoom.room_code.toUpperCase()} onClick={() => void confirmDelete()}>Force Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
