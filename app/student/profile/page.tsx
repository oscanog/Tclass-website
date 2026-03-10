"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import StudentShell from "../_components/student-shell";

import { apiFetch } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type StudentProfilePayload = {
  user?: {
    id?: number;
    name?: string;
    email?: string;
    student_number?: string | null;
  };
  application?: {
    id?: number;
    application_type?: string | null;
    primary_course?: string | null;
    status?: string | null;
  } | null;
  profile?: {
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    extension_name?: string;
    number_street?: string;
    barangay?: string;
    district?: string;
    city_municipality?: string;
    province?: string;
    region?: string;
    email_address?: string;
    facebook_account?: string;
    contact_no?: string;
    nationality?: string;
    sex?: string;
    birthplace_city?: string;
    birthplace_province?: string;
    birthplace_region?: string;
    month_of_birth?: string;
    day_of_birth?: string;
    year_of_birth?: string;
  };
};

type ProfileForm = {
  last_name: string;
  first_name: string;
  middle_name: string;
  extension_name: string;
  number_street: string;
  barangay: string;
  district: string;
  city_municipality: string;
  province: string;
  region: string;
  email_address: string;
  facebook_account: string;
  contact_no: string;
  nationality: string;
  sex: string;
  birthplace_city: string;
  birthplace_province: string;
  birthplace_region: string;
  month_of_birth: string;
  day_of_birth: string;
  year_of_birth: string;
};

const defaultForm: ProfileForm = {
  last_name: "",
  first_name: "",
  middle_name: "",
  extension_name: "",
  number_street: "",
  barangay: "",
  district: "",
  city_municipality: "",
  province: "",
  region: "",
  email_address: "",
  facebook_account: "",
  contact_no: "",
  nationality: "",
  sex: "",
  birthplace_city: "",
  birthplace_province: "",
  birthplace_region: "",
  month_of_birth: "",
  day_of_birth: "",
  year_of_birth: "",
};

function StudentProfileSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>(defaultForm);
  const [meta, setMeta] = useState({
    studentNumber: "",
    program: "",
    applicationType: "",
    status: "",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = (await apiFetch("/student/profile")) as StudentProfilePayload;
        if (!mounted) return;

        setForm({
          ...defaultForm,
          ...(response.profile ?? {}),
          email_address: response.profile?.email_address ?? response.user?.email ?? "",
        });
        setMeta({
          studentNumber: String(response.user?.student_number ?? "").trim(),
          program: String(response.application?.primary_course ?? "").trim(),
          applicationType: String(response.application?.application_type ?? "").trim(),
          status: String(response.application?.status ?? "").trim(),
        });
      } catch (error) {
        if (!mounted) return;
        toast.error(error instanceof Error ? error.message : "Failed to load profile.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const profileSummary = useMemo(
    () => [
      { label: "Student Number", value: meta.studentNumber || "-" },
      { label: "Program", value: meta.program || "-" },
      { label: "Application Type", value: meta.applicationType || "-" },
      { label: "Status", value: meta.status || "-" },
    ],
    [meta],
  );

  const updateField = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = (await apiFetch("/student/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      })) as StudentProfilePayload;
      const profile = response.profile ?? {};
      const fullName = [
        profile.first_name ?? "",
        profile.middle_name ?? "",
        profile.last_name ?? "",
        profile.extension_name ?? "",
      ]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" ");
      window.dispatchEvent(
        new CustomEvent("student-profile-updated", {
          detail: {
            name: fullName,
            email: response.user?.email ?? form.email_address,
          },
        }),
      );
      router.refresh();
      toast.success("Student profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-80" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-2xl" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">Student Account</Badge>
            <Badge variant="outline" className="border-slate-200 dark:border-white/10">
              Enrollment Form Data
            </Badge>
          </div>
          <div>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>
              Update the student information saved from your enrollment record.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {profileSummary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>Learner Profile</CardTitle>
          <CardDescription>These fields are synced from your submitted admission or vocational form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input value={form.middle_name} onChange={(event) => updateField("middle_name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Extension Name</Label>
              <Input value={form.extension_name} onChange={(event) => updateField("extension_name", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label>Email Address</Label>
              <Input type="email" value={form.email_address} onChange={(event) => updateField("email_address", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact No.</Label>
              <Input value={form.contact_no} onChange={(event) => updateField("contact_no", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Facebook Account</Label>
              <Input value={form.facebook_account} onChange={(event) => updateField("facebook_account", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Number, Street</Label>
              <Input value={form.number_street} onChange={(event) => updateField("number_street", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Barangay</Label>
              <Input value={form.barangay} onChange={(event) => updateField("barangay", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input value={form.district} onChange={(event) => updateField("district", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>City / Municipality</Label>
              <Input value={form.city_municipality} onChange={(event) => updateField("city_municipality", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Province</Label>
              <Input value={form.province} onChange={(event) => updateField("province", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input value={form.region} onChange={(event) => updateField("region", event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Profile details originally captured in your enrollment form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input value={form.nationality} onChange={(event) => updateField("nationality", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sex</Label>
              <Input value={form.sex} onChange={(event) => updateField("sex", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Month of Birth</Label>
              <Input value={form.month_of_birth} onChange={(event) => updateField("month_of_birth", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Day of Birth</Label>
              <Input value={form.day_of_birth} onChange={(event) => updateField("day_of_birth", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Year of Birth</Label>
              <Input value={form.year_of_birth} onChange={(event) => updateField("year_of_birth", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Birthplace City</Label>
              <Input value={form.birthplace_city} onChange={(event) => updateField("birthplace_city", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Birthplace Province</Label>
              <Input value={form.birthplace_province} onChange={(event) => updateField("birthplace_province", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Birthplace Region</Label>
              <Input value={form.birthplace_region} onChange={(event) => updateField("birthplace_region", event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving} className="min-w-36">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  return <StudentShell initialSection="profile" customSectionContent={{ profile: <StudentProfileSection /> }} />;
}
