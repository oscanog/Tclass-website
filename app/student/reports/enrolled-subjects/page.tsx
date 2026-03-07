"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Period = { id: number; name: string; is_active: number };
type EnrolledSubject = {
  id: number;
  status: "unofficial" | "official";
  code: string;
  title: string;
  units: number;
  schedule: string | null;
  room: string | null;
  instructor: string | null;
  section: string | null;
};

export default function EnrolledSubjectsReportPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodId, setPeriodId] = useState<string>("");
  const [rows, setRows] = useState<EnrolledSubject[]>([]);
  const [status, setStatus] = useState<"not_enrolled" | "unofficial" | "official">("not_enrolled");
  const [totalUnits, setTotalUnits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const periodRes = await apiFetch("/student/periods");
        const p = (periodRes as { periods: Period[]; active_period_id: number | null }).periods ?? [];
        const active = (periodRes as { active_period_id: number | null }).active_period_id;
        setPeriods(p);
        setPeriodId(String(active ?? p[0]?.id ?? ""));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load periods.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    if (!periodId) return;
    const run = async () => {
      try {
        const res = await apiFetch(`/student/enrollments/enrolled-subjects?period_id=${periodId}`);
        const payload = res as {
          enrollment_status: "not_enrolled" | "unofficial" | "official";
          enrolled_subjects: EnrolledSubject[];
          total_units: number;
        };
        setRows(payload.enrolled_subjects ?? []);
        setStatus(payload.enrollment_status ?? "not_enrolled");
        setTotalUnits(Number(payload.total_units ?? 0));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load enrolled subjects.");
      }
    };
    run();
  }, [periodId]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports: Enrolled Subjects</h1>
            <p className="text-slate-600">View enrolled subject list by period.</p>
          </div>
          <Link href="/student/enrollment">
            <Button variant="outline">Back to Enrollment</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subject List</CardTitle>
              <div className="flex items-center gap-2">
                {status === "official" && <Badge className="bg-green-600">Officially Enrolled</Badge>}
                {status === "unofficial" && <Badge className="bg-amber-600">Unofficially Enrolled</Badge>}
              </div>
            </div>
            <CardDescription>Class, units, schedule, section, instructor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-md">
              <p className="text-sm mb-1 text-slate-600">Period</p>
              <Select value={periodId} onValueChange={setPeriodId} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}{p.is_active ? " (Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-12 text-xs font-semibold text-slate-700 border-b pb-1">
              <p className="col-span-2">Class</p>
              <p className="col-span-4">Subject Description</p>
              <p className="col-span-1">Units</p>
              <p className="col-span-2">Schedule</p>
              <p className="col-span-1">Room</p>
              <p className="col-span-1">Instructor</p>
              <p className="col-span-1">Section</p>
            </div>
            <div className="max-h-[65vh] overflow-auto space-y-1">
              {loading
                ? Array.from({ length: 7 }, (_, index) => (
                    <div key={`enrolled-skeleton-${index}`} className="grid grid-cols-12 gap-2 rounded px-2 py-2">
                      <Skeleton className="col-span-2 h-5" />
                      <Skeleton className="col-span-4 h-5" />
                      <Skeleton className="col-span-1 h-5" />
                      <Skeleton className="col-span-2 h-5" />
                      <Skeleton className="col-span-1 h-5" />
                      <Skeleton className="col-span-1 h-5" />
                      <Skeleton className="col-span-1 h-5" />
                    </div>
                  ))
                : rows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 text-sm rounded px-2 py-1 hover:bg-slate-100">
                  <span className="col-span-2">{row.code}</span>
                  <span className="col-span-4 truncate">{row.title}</span>
                  <span className="col-span-1">{row.units}</span>
                  <span className="col-span-2 truncate">{row.schedule ?? "-"}</span>
                  <span className="col-span-1 truncate">{row.room ?? "-"}</span>
                  <span className="col-span-1 truncate">{row.instructor ?? "-"}</span>
                  <span className="col-span-1">{row.section ?? "-"}</span>
                </div>
                ))}
              {!loading && rows.length === 0 && <p className="text-sm text-slate-500 py-4">No enrolled subjects found.</p>}
            </div>
            <div className="text-right text-sm font-semibold text-slate-800">
              {loading ? <Skeleton className="ml-auto h-5 w-24" /> : `Total: ${totalUnits} units`}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
