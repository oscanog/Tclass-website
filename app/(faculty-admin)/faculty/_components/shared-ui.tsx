"use client";

import { Calendar, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
      <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export function AyTermRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">AY TERM</span>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-2025-1">2024-2025 1st Semester</SelectItem>
            <SelectItem value="2023-2024-2">2023-2024 2nd Semester</SelectItem>
            <SelectItem value="2023-2024-1">2023-2024 1st Semester</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => toast.success("Printing...")}>
          <Printer className="mr-1.5 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.success("Exporting to Excel...")}>
          <Download className="mr-1.5 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}

export function TableViewOptions() {
  return (
    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
      <label className="flex cursor-pointer items-center gap-1.5">
        <span className="inline-block h-3 w-6 rounded-full bg-blue-500" />
        Hover
      </label>
      <label className="flex cursor-pointer items-center gap-1.5">
        <span className="inline-block h-3 w-6 rounded-full bg-pink-400" />
        Dense
      </label>
      <label className="flex cursor-pointer items-center gap-1.5">
        <span className="inline-block h-3 w-6 rounded-full bg-emerald-400" />
        Striped
      </label>
      <label className="flex cursor-pointer items-center gap-1.5">
        <span className="inline-block h-3 w-6 rounded-full bg-amber-400" />
        Bordered
      </label>
    </div>
  );
}
