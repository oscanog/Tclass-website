"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSearch } from "lucide-react";

function NotYetReady({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Fox illustration replacement */}
      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <FileSearch className="h-12 w-12 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Not yet ready</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

export function EvaluationResultsSection() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Faculty Evaluation</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          In this page you can view, print and generate the results of your faculty evaluation.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <Tabs defaultValue="nbc">
          <div className="border-b border-slate-200 px-4 dark:border-white/10">
            <TabsList className="h-auto rounded-none bg-transparent p-0">
              <TabsTrigger
                value="nbc"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-blue-400"
              >
                FOR NBC
              </TabsTrigger>
              <TabsTrigger
                value="afes"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-blue-400"
              >
                AFES INDIVIDUAL RESULT
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="nbc" className="m-0">
            <NotYetReady message="For NBC is still not available for viewing" />
          </TabsContent>

          <TabsContent value="afes" className="m-0">
            <NotYetReady message="AFES Individual Result is still not available for viewing" />
          </TabsContent>
        </Tabs>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400">
        <p>
          <strong>Note:</strong> Faculty Members can only access the Academic Year/s that OHRDM
          enabled for viewing and printing.
        </p>
        <p className="mt-1">
          For security purposes, viewing and printing of AFES Individual Result through the faculty
          portal is time limited for maximum of two weeks.
        </p>
      </div>
    </div>
  );
}
