"use client";

import { FileText, FileUser, Wifi, Users, Heart, Construction } from "lucide-react";

function PlaceholderSection({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-24 text-center dark:border-white/20 dark:bg-slate-900">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-base font-semibold text-slate-600 dark:text-slate-400">{title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
          <Construction className="h-4 w-4" />
          This section is under development
        </p>
      </div>
    </div>
  );
}

export function RegisteredDocumentsSection() {
  return (
    <PlaceholderSection
      icon={FileText}
      title="Registered Documents"
      description="In this page you can view and manage your registered documents."
    />
  );
}

export function OnlinePdsSection() {
  return (
    <PlaceholderSection
      icon={FileUser}
      title="Online PDS"
      description="In this page you can view and update your Personal Data Sheet (PDS) online."
    />
  );
}

export function WifiAccessSection() {
  return (
    <PlaceholderSection
      icon={Wifi}
      title="Wifi Access Generator"
      description="In this page you can generate wifi access credentials for your students."
    />
  );
}

export function CommunitySection() {
  return (
    <PlaceholderSection
      icon={Users}
      title="Community"
      description="In this page you can connect and collaborate with the faculty community."
    />
  );
}

export function HealthcareSection() {
  return (
    <PlaceholderSection
      icon={Heart}
      title="Healthcare Services"
      description="In this page you can access healthcare services and benefits information."
    />
  );
}
