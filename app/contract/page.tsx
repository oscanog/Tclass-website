import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { policyEffectiveDate, policyWebsite } from "@/lib/site-policies";

export const metadata: Metadata = {
  title: "Contract | TCLASS",
  description: "TCLASS contract and policy reference page.",
};

const userCommitments = [
  "Provide accurate enrollment and registration information.",
  "Use the platform lawfully and respect institute systems.",
  "Respect payment terms, course requirements, and material ownership.",
];

const tclassCommitments = [
  "Manage academic and enrollment records responsibly.",
  "Protect personal data under the Data Privacy Act of 2012.",
  "Communicate updates, requirements, and institutional changes transparently.",
];

export default function ContractPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#3b82f6_0%,#0f172a_36%,#020617_100%)]">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/85 shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-[linear-gradient(135deg,#1d4ed8_0%,#0f172a_58%,#020617_100%)] px-5 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge className="border border-white/20 bg-white/10 text-blue-100">TCLASS Contract</Badge>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  TClass Institute Contract Overview
                </h1>
                <p className="mt-4 text-sm leading-7 text-blue-100/80 sm:text-base">
                  This page summarizes the working commitments between TClass Institute and its students,
                  applicants, and website users.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="outline" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button asChild className="rounded-xl bg-white text-slate-950 hover:bg-blue-50">
                  <Link href="/terms">View Terms Page</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="px-5 py-8 sm:px-8 lg:px-10">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Institute</p>
                <p className="mt-2 font-semibold text-white">TClass Institute</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Website</p>
                <p className="mt-2 font-semibold text-white">{policyWebsite}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Effective Date</p>
                <p className="mt-2 font-semibold text-white">{policyEffectiveDate}</p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Contract Summary</h2>
                  <p className="text-sm text-blue-100/80">
                    TClass policies, data protection, platform use, and enrollment rules work together as a
                    single agreement with users.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white">Your Commitments</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                  {userCommitments.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white">TClass Commitments</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                  {tclassCommitments.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">Binding Policy Reference</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                The contractual relationship between TClass and website users is governed by the Privacy Policy
                and Terms of Service. Continued use of the portal, submission of information, and enrollment
                actions signify acceptance of those policies under Philippine law.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
                  <Link href="/privacy">Read the Privacy Policy</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href="/terms">Read the Terms of Service</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
