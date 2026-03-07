"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type EvalRow = {
  id: number;
  code: string;
  title: string;
  units: number;
  year_level: number;
  semester: number;
  grade: number | null;
  result_status: "passed" | "failed" | "incomplete" | null;
};

const IT_CURRICULUM_FALLBACK: EvalRow[] = [
  { id: 1001, code: "PLF101", title: "Program Logic Formulation", units: 3, year_level: 1, semester: 1, grade: 1.25, result_status: "passed" },
  { id: 1002, code: "CC101", title: "Introduction to Computing", units: 3, year_level: 1, semester: 1, grade: 2.0, result_status: "passed" },
  { id: 1003, code: "FILN1", title: "Kontekstwalisadong Komunikasyon", units: 3, year_level: 1, semester: 1, grade: 2.0, result_status: "passed" },
  { id: 1004, code: "GEC5", title: "Purposive Communication", units: 3, year_level: 1, semester: 1, grade: 1.5, result_status: "passed" },
  { id: 1005, code: "GEC4", title: "Mathematics in the Modern World", units: 3, year_level: 1, semester: 1, grade: 1.5, result_status: "passed" },
  { id: 1006, code: "PE1", title: "Fitness and Recreational Activities", units: 2, year_level: 1, semester: 1, grade: 1.75, result_status: "passed" },
  { id: 1007, code: "GEC8", title: "Ethics", units: 3, year_level: 1, semester: 1, grade: 2.0, result_status: "passed" },
  { id: 1008, code: "NSTP1", title: "National Service Training Program 1", units: 3, year_level: 1, semester: 1, grade: null, result_status: "incomplete" },
  { id: 1009, code: "CC102", title: "Computer Programming I", units: 3, year_level: 1, semester: 2, grade: 2.5, result_status: "passed" },
  { id: 1010, code: "HCI101", title: "Introduction to Human Computer Interaction", units: 1, year_level: 1, semester: 2, grade: 2.25, result_status: "passed" },
  { id: 1011, code: "MS101", title: "Discrete Mathematics", units: 3, year_level: 1, semester: 2, grade: 1.75, result_status: "passed" },
  { id: 1012, code: "GEC1", title: "Understanding the Self", units: 3, year_level: 1, semester: 2, grade: 1.75, result_status: "passed" },
  { id: 1013, code: "PE2", title: "Civic Welfare Training Service II", units: 3, year_level: 1, semester: 2, grade: null, result_status: "incomplete" },
  { id: 1014, code: "CC103", title: "Computer Programming II", units: 3, year_level: 2, semester: 1, grade: 1.5, result_status: "passed" },
  { id: 1015, code: "CC104", title: "Data Structures and Algorithms", units: 3, year_level: 2, semester: 2, grade: 2.5, result_status: "passed" },
  { id: 1016, code: "PF102", title: "Event Driven Programming", units: 3, year_level: 3, semester: 1, grade: 2.0, result_status: "passed" },
  { id: 1017, code: "IM101", title: "Advance Database Systems", units: 2, year_level: 3, semester: 1, grade: 2.0, result_status: "passed" },
  { id: 1018, code: "IAS101", title: "Information Assurance and Security", units: 3, year_level: 3, semester: 2, grade: 2.0, result_status: "passed" },
  { id: 1019, code: "CAP101", title: "Capstone Project and Research I", units: 3, year_level: 3, semester: 2, grade: 2.0, result_status: "passed" },
  { id: 1020, code: "NET101", title: "Networking I", units: 3, year_level: 3, semester: 2, grade: 1.5, result_status: "passed" },
];

export default function CurriculumEvaluationPage() {
  const [rows, setRows] = useState<EvalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/student/curriculum-evaluation");
        const fetched = (res as { evaluation: EvalRow[] }).evaluation ?? [];
        setRows(fetched.length > 0 ? fetched : IT_CURRICULUM_FALLBACK);
      } catch (error) {
        setRows(IT_CURRICULUM_FALLBACK);
        toast.error(error instanceof Error ? error.message : "Failed to load curriculum evaluation.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Curriculum Evaluation</h1>
            <p className="text-slate-600">Progress by year/semester based on passed subjects.</p>
          </div>
          <Link href="/student/enrollment">
            <Button variant="outline">Back to Enrollment</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Evaluation List</CardTitle>
            <CardDescription>Subjects, units, grades, and remarks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 text-xs font-semibold text-slate-700 border-b pb-1">
              <p className="col-span-2">Code</p>
              <p className="col-span-4">Name</p>
              <p className="col-span-1">Units</p>
              <p className="col-span-1">Yr</p>
              <p className="col-span-1">Sem</p>
              <p className="col-span-1">Grade</p>
              <p className="col-span-2">Remark</p>
            </div>
            <div className="max-h-[70vh] overflow-auto space-y-1 mt-2">
              {loading &&
                Array.from({ length: 8 }, (_, index) => (
                  <div key={`curriculum-skeleton-${index}`} className="grid grid-cols-12 gap-2 rounded px-2 py-2">
                    <Skeleton className="col-span-2 h-5" />
                    <Skeleton className="col-span-4 h-5" />
                    <Skeleton className="col-span-1 h-5" />
                    <Skeleton className="col-span-1 h-5" />
                    <Skeleton className="col-span-1 h-5" />
                    <Skeleton className="col-span-1 h-5" />
                    <Skeleton className="col-span-2 h-5" />
                  </div>
                ))}
              {!loading && rows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 text-sm rounded px-2 py-1 hover:bg-slate-100">
                  <span className="col-span-2">{row.code}</span>
                  <span className="col-span-4 truncate">{row.title}</span>
                  <span className="col-span-1">{row.units}</span>
                  <span className="col-span-1">{row.year_level}</span>
                  <span className="col-span-1">{row.semester}</span>
                  <span className="col-span-1">{row.grade ?? "-"}</span>
                  <span className="col-span-2">{row.result_status ?? "Pending"}</span>
                </div>
              ))}
              {!loading && rows.length === 0 && <p className="text-sm text-slate-500 py-4">No curriculum data found.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
