"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { gradeSheets, gradeSheetStudents, gradingSystem } from "./faculty-data";
import { DisclaimerBanner, AyTermRow, TableViewOptions } from "./shared-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, ExternalLink } from "lucide-react";

type GradeSheet = typeof gradeSheets[0];

export function GradeSheetsSection() {
  const [ayTerm, setAyTerm] = useState("2023-2024-2");
  const [selectedSheet, setSelectedSheet] = useState<GradeSheet | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Grade Sheets</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          In this page you can view, edit, save and post grades for the selected semester
        </p>
      </div>

      <DisclaimerBanner text="DISCLAIMER: The faculty bears the responsibility for the proper disposal of the documents. Any mishandling of printed records obtained from the faculty portal is solely the faculty's liability." />
      <AyTermRow value={ayTerm} onChange={setAyTerm} />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">CODE</TableHead>
              <TableHead>TITLE</TableHead>
              <TableHead>SECTION</TableHead>
              <TableHead>SCHEDULE</TableHead>
              <TableHead>DATE POSTED</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradeSheets.map((row, idx) => (
              <TableRow
                key={idx}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                onClick={() => setSelectedSheet(row)}
              >
                <TableCell className="font-medium">{row.code}</TableCell>
                <TableCell className="italic">{row.title}</TableCell>
                <TableCell>{row.section}</TableCell>
                <TableCell>{row.schedule}</TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400">{row.datePosted}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TableViewOptions />

      {/* Grade Sheet Modal */}
      <Dialog open={!!selectedSheet} onOpenChange={() => setSelectedSheet(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Grade Sheet</span>
            </DialogTitle>
          </DialogHeader>

          {selectedSheet && (
            <div className="space-y-4">
              {/* Sheet header */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedSheet.title} ({selectedSheet.section})
                  </span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success("Printing grade sheet...")}>
                    <Printer className="mr-1.5 h-4 w-4" />
                    PRINT
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Exporting grade sheet...")}>
                    <Download className="mr-1.5 h-4 w-4" />
                    EXPORT
                  </Button>
                  <Button size="sm" onClick={() => toast.success("Grade sheet posted!")}>
                    POST
                  </Button>
                </div>
              </div>

              {/* Two-column layout: students + grading system */}
              <div className="flex gap-4">
                {/* Students table */}
                <div className="flex-1 overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">STUDENT NO</TableHead>
                        <TableHead>NAME</TableHead>
                        <TableHead className="w-20 text-center">MIDTERM</TableHead>
                        <TableHead className="w-20 text-center">FINAL</TableHead>
                        <TableHead className="w-20 text-center">RE EXAM</TableHead>
                        <TableHead className="w-40">DATE POSTED</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradeSheetStudents.map((student, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <TableCell className="font-mono text-sm">{student.studentNo}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell className="text-center">{student.midterm}</TableCell>
                          <TableCell className="text-center">{student.final}</TableCell>
                          <TableCell className="text-center text-slate-400">{student.reExam || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-500 dark:text-slate-400">{student.datePosted}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Grading System */}
                <div className="w-64 shrink-0 rounded-lg border border-slate-200 dark:border-white/10">
                  <div className="border-b border-slate-200 px-3 py-2 dark:border-white/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      GRADING SYSTEM
                    </p>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-800">
                        <th className="px-2 py-1.5 text-left font-semibold">GRADE</th>
                        <th className="px-2 py-1.5 text-left font-semibold">EQUIV</th>
                        <th className="px-2 py-1.5 text-left font-semibold">DESC</th>
                        <th className="px-2 py-1.5 text-left font-semibold">REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradingSystem.map((g, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-b-0 dark:border-white/5">
                          <td className="px-2 py-1 font-medium">{g.grade}</td>
                          <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{g.equiv}</td>
                          <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{g.desc}</td>
                          <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{g.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="space-y-1 border-t border-slate-200 px-3 py-2 dark:border-white/10">
                    <button
                      onClick={() => toast.success("Start Encoding mode activated")}
                      className="w-full rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      START ENCODING
                    </button>
                    <button
                      onClick={() => toast.success("End Encoding mode activated")}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      END ENCODING
                    </button>
                    <button
                      onClick={() => toast.success("INC Due Date set")}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      INC DUE DATE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
