"use client";

import { Upload } from "lucide-react";

import { useAdminCsvImport } from "@/components/admin/csv-import-provider";
import { Button } from "@/components/ui/button";

export function AdminCsvImportTrigger({
  className,
}: {
  className?: string;
}) {
  const { openWizard, activeJob } = useAdminCsvImport();

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={openWizard}
    >
      <Upload className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline">Import CSV</span>
      <span className="sm:hidden">Import</span>
      {activeJob?.status === "running" ? (
        <span className="ml-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500" />
      ) : null}
    </Button>
  );
}

