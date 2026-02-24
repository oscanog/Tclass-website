"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { classLists } from "./faculty-data";
import { DisclaimerBanner, AyTermRow, TableViewOptions } from "./shared-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ClassListsSection() {
  const [ayTerm, setAyTerm] = useState("2023-2024-2");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Class Lists</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          In this page you can view your class lists for the selected semester
        </p>
      </div>

      <DisclaimerBanner text="DISCLAIMER: The faculty bears the responsibility for the proper disposal of the documents. It is important to note that any mishandling of printed records obtained from the faculty portal is solely the faculty's liability, and the University cannot be held accountable for such incidents." />
      <AyTermRow value={ayTerm} onChange={setAyTerm} />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">CODE</TableHead>
              <TableHead>TITLE</TableHead>
              <TableHead>SECTION</TableHead>
              <TableHead>SCHEDULE</TableHead>
              <TableHead className="text-right">LIST FORMAT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classLists.map((row, idx) => (
              <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                <TableCell className="font-medium">{row.code}</TableCell>
                <TableCell className="italic">{row.title}</TableCell>
                <TableCell>{row.section}</TableCell>
                <TableCell>{row.schedule}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1">
                    <button
                      onClick={() => toast.success(`Opening Format 1 for ${row.section}...`)}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      FORMAT 1
                    </button>
                    <span className="text-slate-400">|</span>
                    <button
                      onClick={() => toast.success(`Opening Format 2 for ${row.section}...`)}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      FORMAT 2
                    </button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TableViewOptions />
    </div>
  );
}
