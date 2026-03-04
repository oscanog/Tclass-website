import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  policyContactEmail,
  policyEffectiveDate,
  policyWebsite,
  termsSections,
} from "@/lib/site-policies";

export const metadata: Metadata = {
  title: "Terms of Service | TCLASS",
  description: "TCLASS Terms of Service.",
};

function renderSection(section: { title: string; body?: string; bullets?: string[] }) {
  return (
    <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{section.title}</h2>
      {section.body ? (
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.body}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {section.bullets?.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff7ed_0%,#fde68a_22%,#0f172a_22%,#020617_100%)] dark:bg-[linear-gradient(135deg,#0f172a_0%,#020617_100%)]">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2rem] border border-white/20 bg-white/85 p-5 shadow-2xl backdrop-blur sm:p-8 dark:border-white/10 dark:bg-slate-950/80">
          <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="border border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                TCLASS Legal
              </Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-5xl">
                Terms of Service
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                These terms define the rules for using the TClass website, submitting information,
                and accessing enrollment-related services.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
                <Link href="/contract">View Contract Page</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Website</p>
              <p className="mt-2 font-semibold text-slate-950 dark:text-slate-100">{policyWebsite}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Effective Date</p>
              <p className="mt-2 font-semibold text-slate-950 dark:text-slate-100">{policyEffectiveDate}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Contact Email</p>
              <p className="mt-2 font-semibold text-slate-950 dark:text-slate-100">{policyContactEmail}</p>
            </div>
          </div>

          <div className="mt-10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Terms</p>
                <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">Platform Use and Conditions</h2>
              </div>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50/90 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                Effective Date: {policyEffectiveDate}. Website: {policyWebsite}. By accessing and using this
                website, enrolling in courses, or submitting information through the portal, you agree to these terms.
              </p>
            </div>
            <div className="space-y-4">
              {termsSections.map(renderSection)}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
