"use client";

import { Suspense, useEffect, useState } from "react";
import { VocationalPageSkeleton } from "@/components/ui/loading-states";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitAdmissionForm } from "@/lib/admission-submit";

import { Badge } from "@/components/ui/badge";
import { ThemeIconButton } from "@/components/ui/theme-icon-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadField } from "@/components/ui/file-upload-field";

const learnerClassifications = [
  "4Ps Beneficiary",
  "Agrarian Reform Beneficiary",
  "Balik Probinsya",
  "Displaced Workers",
  "Drug Dependents Surrenderees/Surrenderers",
  "Family Members of AFP and PNP Killed-in-Action",
  "Family Members of AFP and PNP Wounded-in-Action",
  "Farmers and Fishermen",
  "Indigenous People and Cultural Communities",
  "Industry Workers",
  "Inmates and Detainees",
  "MILF Beneficiary",
  "Out-of-School-Youth",
  "Overseas Filipino Workers (OFW) Dependents",
  "RCEF-RESP",
  "Rebel Returnees/Decommissioned Combatants",
  "Returning/Repatriated Overseas Filipino Workers (OFW)",
  "Student",
  "TESDA Alumni",
  "TVET Trainers",
  "Uniformed Personnel",
  "Victim of Natural Disasters and Calamities",
  "Wounded-in-Action AFP and PNP Personnel",
];

const disabilityTypes = [
  "Mental/Intellectual",
  "Visual Disability",
  "Orthopedic (Musculoskeletal) Disability",
  "Hearing Disability",
  "Speech Impairment",
  "Multiple Disabilities (specify)",
  "Psychosocial Disability",
  "Disability Due to Chronic Illness",
  "Learning Disability",
];

const disabilityCauses = ["Congenital/Inborn", "Illness", "Injury"];

const civilStatuses = ["Single", "Married", "Widow/er", "Separated", "Solo Parent"];
const employmentStatuses = ["Employed", "Unemployed"];
const educationalAttainments = [
  "No Grade Completed",
  "Pre-School (Nursery/Kinder/Prep)",
  "High School Undergraduate",
  "High School Graduate",
  "Elementary Undergraduate",
  "Post Secondary Undergraduate",
  "College Undergraduate",
  "College Graduate or Higher",
  "Elementary Graduate",
  "Post Secondary Graduate",
  "Junior High Graduate",
  "Senior High Graduate",
];
const enrollmentPurposes = [
  "Employment (Local)",
  "Employment (Overseas)",
  "Entrepreneurship (Establishment of business)",
  "Entrepreneurship (Enhancement of business)",
  "Others",
];

type FormState = {
  uliNumber: string;
  entryDate: string;
  lastName: string;
  firstName: string;
  middleName: string;
  extensionName: string;
  numberStreet: string;
  barangay: string;
  district: string;
  cityMunicipality: string;
  province: string;
  region: string;
  emailAddress: string;
  facebookAccount: string;
  contactNo: string;
  nationality: string;
  sex: string;
  civilStatus: string[];
  employmentStatus: string;
  monthOfBirth: string;
  dayOfBirth: string;
  yearOfBirth: string;
  age: string;
  birthplaceCity: string;
  birthplaceProvince: string;
  birthplaceRegion: string;
  educationalAttainment: string[];
  parentGuardianName: string;
  parentGuardianAddress: string;
  parentGuardianBirthdate: string;
  parentGuardianRelationship: string;
  learnerClassifications: string[];
  learnerClassificationOthers: string;
  disabilityTypes: string[];
  disabilityTypeOthers: string;
  disabilityCauses: string[];
  courseQualificationName: string;
  scholarshipType: string;
  enrollmentPurposes: string[];
  enrollmentPurposeOthers: string;
  privacyConsent: "agree" | "disagree" | "";
  applicantSignature: string;
  dateAccomplished: string;
  idPictureNote: string;
  rightThumbmarkNote: string;
};

const defaultForm: FormState = {
  uliNumber: "",
  entryDate: "",
  lastName: "",
  firstName: "",
  middleName: "",
  extensionName: "",
  numberStreet: "",
  barangay: "",
  district: "",
  cityMunicipality: "",
  province: "",
  region: "",
  emailAddress: "",
  facebookAccount: "",
  contactNo: "",
  nationality: "",
  sex: "",
  civilStatus: [],
  employmentStatus: "",
  monthOfBirth: "",
  dayOfBirth: "",
  yearOfBirth: "",
  age: "",
  birthplaceCity: "",
  birthplaceProvince: "",
  birthplaceRegion: "",
  educationalAttainment: [],
  parentGuardianName: "",
  parentGuardianAddress: "",
  parentGuardianBirthdate: "",
  parentGuardianRelationship: "",
  learnerClassifications: [],
  learnerClassificationOthers: "",
  disabilityTypes: [],
  disabilityTypeOthers: "",
  disabilityCauses: [],
  courseQualificationName: "",
  scholarshipType: "",
  enrollmentPurposes: [],
  enrollmentPurposeOthers: "",
  privacyConsent: "",
  applicantSignature: "",
  dateAccomplished: "",
  idPictureNote: "",
  rightThumbmarkNote: "",
};

const VOCATIONAL_DRAFT_KEY = "tclass_vocational_form_draft_v1";
const PH_VALID_IDS = [
  "PhilSys National ID",
  "Passport",
  "Driver's License",
  "UMID",
  "SSS ID",
  "PRC ID",
  "Voter's ID",
  "Postal ID",
  "Barangay ID",
  "Senior Citizen ID",
  "PWD ID",
  "TIN ID",
  "Others",
];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const PROGRAM_REQUIREMENTS: Record<
  string,
  {
    qualifications: string[];
    documentaryRequirements: string[];
  }
> = {
  "Rigid Highway Dump Truck NCII": {
    qualifications: [
      "At least High School or SHS Graduate/ALS passer/College level or graduate",
      "18 years old and above",
      "Physically and mentally fit",
      "Can comply with all requirements needed",
    ],
    documentaryRequirements: [
      "High School Graduate: Photocopy of Diploma, and Certified True Copy of Form 138/137/Form 9",
      "ALS Graduate: ALS Certificate",
      "College Level/Graduate: Photocopy of Diploma, Certified True Copy of Transcript of Records, National Certificates (if applicable)",
      "PSA Birth Certificate (photocopy)",
      "PSA Marriage Certificate (for female married students)",
      "Picture in white background with collar (studio shot): 3 pcs passport size, 4 pcs 1x1",
      "Original Barangay Indigency",
      "Original Medical Certificate",
      "Voter's ID/Certification or any government-issued ID with address (photocopy)",
      "Long envelope with clear plastic envelope",
      "For driving/heavy equipment: Driver's license (original and photocopy), bring original documents for verification, and must be capable of operating a 4-wheeled vehicle",
    ],
  },
  "Transit Mixer NCII": {
    qualifications: [
      "At least High School or SHS Graduate/ALS passer/College level or graduate",
      "18 years old and above",
      "Physically and mentally fit",
      "Can comply with all requirements needed",
    ],
    documentaryRequirements: [
      "High School Graduate: Photocopy of Diploma, and Certified True Copy of Form 138/137/Form 9",
      "ALS Graduate: ALS Certificate",
      "College Level/Graduate: Photocopy of Diploma, Certified True Copy of Transcript of Records, National Certificates (if applicable)",
      "PSA Birth Certificate (photocopy)",
      "PSA Marriage Certificate (for female married students)",
      "Picture in white background with collar (studio shot): 3 pcs passport size, 4 pcs 1x1",
      "Original Barangay Indigency",
      "Original Medical Certificate",
      "Voter's ID/Certification or any government-issued ID with address (photocopy)",
      "Long envelope with clear plastic envelope",
      "For driving/heavy equipment: Driver's license (original and photocopy), bring original documents for verification, and must be capable of operating a 4-wheeled vehicle",
    ],
  },
  "Forklift NCII": {
    qualifications: [
      "At least High School or SHS Graduate/ALS passer/College level or graduate",
      "18 years old and above",
      "Physically and mentally fit",
      "Can comply with all requirements needed",
    ],
    documentaryRequirements: [
      "High School Graduate: Photocopy of Diploma, and Certified True Copy of Form 138/137/Form 9",
      "ALS Graduate: ALS Certificate",
      "College Level/Graduate: Photocopy of Diploma, Certified True Copy of Transcript of Records, National Certificates (if applicable)",
      "PSA Birth Certificate (photocopy)",
      "PSA Marriage Certificate (for female married students)",
      "Picture in white background with collar (studio shot): 3 pcs passport size, 4 pcs 1x1",
      "Original Barangay Indigency",
      "Original Medical Certificate",
      "Voter's ID/Certification or any government-issued ID with address (photocopy)",
      "Long envelope with clear plastic envelope",
      "For driving/heavy equipment: Driver's license (original and photocopy), bring original documents for verification, and must be capable of operating a 4-wheeled vehicle",
    ],
  },
  "3-Year Diploma in ICT": {
    qualifications: [
      "18 years old and above",
      "Graduate of Senior High School / ALS / Old Curriculum",
      "Must meet interview requirements",
    ],
    documentaryRequirements: [
      "Valid ID / Recent School ID",
      "PSA Birth Certificate",
      "SF9 / Report Card",
      "Certificate of Good Moral Conduct",
    ],
  },
  "Housekeeping NCII": {
    qualifications: [
      "At least High School or SHS Graduate/ALS passer/College level or graduate",
      "18 years old and above",
      "Physically and mentally fit",
      "Can comply with all requirements needed",
    ],
    documentaryRequirements: [
      "High School Graduate: Photocopy of Diploma, and Certified True Copy of Form 138/137/Form 9",
      "ALS Graduate: ALS Certificate",
      "College Level/Graduate: Photocopy of Diploma, Certified True Copy of Transcript of Records, National Certificates (if applicable)",
      "PSA Birth Certificate (photocopy)",
      "PSA Marriage Certificate (for female married students)",
      "Picture in white background with collar (studio shot): 3 pcs passport size, 4 pcs 1x1",
      "Original Barangay Indigency",
      "Original Medical Certificate",
      "Voter's ID/Certification or any government-issued ID with address (photocopy)",
      "Long envelope with clear plastic envelope",
    ],
  },
  "Health Care Services NCII": {
    qualifications: [
      "At least High School or SHS Graduate/ALS passer/College level or graduate",
      "18 years old and above",
      "Physically and mentally fit",
      "Can comply with all requirements needed",
    ],
    documentaryRequirements: [
      "High School Graduate: Photocopy of Diploma, and Certified True Copy of Form 138/137/Form 9",
      "ALS Graduate: ALS Certificate",
      "College Level/Graduate: Photocopy of Diploma, Certified True Copy of Transcript of Records, National Certificates (if applicable)",
      "PSA Birth Certificate (photocopy)",
      "PSA Marriage Certificate (for female married students)",
      "Picture in white background with collar (studio shot): 3 pcs passport size, 4 pcs 1x1",
      "Original Barangay Indigency",
      "Original Medical Certificate",
      "Voter's ID/Certification or any government-issued ID with address (photocopy)",
      "Long envelope with clear plastic envelope",
    ],
  },
};

function VocationalPageContent() {
  const [pageLoading, setPageLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedProgram = searchParams.get("program") ?? ""; 
  const selectedProgramRequirements = selectedProgram ? PROGRAM_REQUIREMENTS[selectedProgram] : null;
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idPictureFile, setIdPictureFile] = useState<File | null>(null);
  const [oneByOnePictureFile, setOneByOnePictureFile] = useState<File | null>(null);
  const [rightThumbmarkFile, setRightThumbmarkFile] = useState<File | null>(null);
  const [birthCertificateFile, setBirthCertificateFile] = useState<File | null>(null);
  const [validIdType, setValidIdType] = useState("");
  const [validIdTypeOther, setValidIdTypeOther] = useState("");
  const [validIdImageFile, setValidIdImageFile] = useState<File | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [submittedModalOpen, setSubmittedModalOpen] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(false);

  const handleValidatedFileChange = (
    file: File | null,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    label: string,
  ) => {
    if (!file) {
      setFile(null);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`${label} must be 5MB or less.`);
      return;
    }
    setFile(file);
  };

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(VOCATIONAL_DRAFT_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<FormState> & { validIdType?: string; validIdTypeOther?: string };
      setForm((prev) => ({ ...prev, ...parsed }));
      setValidIdType(parsed.validIdType ?? "");
      setValidIdTypeOther(parsed.validIdTypeOther ?? "");
      toast.success("Draft restored. You can continue where you left off.", {
        id: "vocational-draft-restored",
      });
    } catch {
      // Ignore invalid draft payload.
    } finally {
      setIsDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDraftReady) return;
    try {
      window.localStorage.setItem(VOCATIONAL_DRAFT_KEY, JSON.stringify({ ...form, validIdType, validIdTypeOther }));
    } catch {
      // Ignore storage failures.
    }
  }, [form, validIdType, validIdTypeOther, isDraftReady]);

  useEffect(() => {
    if (!selectedProgram) return;
    setForm((prev) => ({
      ...prev,
      courseQualificationName: prev.courseQualificationName || selectedProgram,
    }));
  }, [selectedProgram]);

  const toggleArrayValue = (
    key:
      | "civilStatus"
      | "educationalAttainment"
      | "learnerClassifications"
      | "disabilityTypes"
      | "disabilityCauses"
      | "enrollmentPurposes",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const validateBeforeSubmit = () => {
    if (form.age.trim() && (!Number.isFinite(Number(form.age)) || Number(form.age) < 18)) {
      toast.error("For certificate enrollment, age must be 18 and above.");
      return false;
    }
    if (validIdType === "Others" && !validIdTypeOther.trim()) {
      toast.error("Please specify the valid ID type for Others.");
      return false;
    }
    if (form.enrollmentPurposes.includes("Others") && !form.enrollmentPurposeOthers.trim()) {
      toast.error("Please specify the purpose under Others.");
      return false;
    }
    return true;
  };

  const submitEnrollment = async () => {
    setIsSubmitting(true);
    try {
      const fullName = [form.firstName, form.middleName, form.lastName, form.extensionName]
        .filter((value) => value.trim().length > 0)
        .join(" ");

      const response = await submitAdmissionForm({
        fullName,
        age: Number(form.age),
        gender: form.sex,
        primaryCourse: form.courseQualificationName,
        secondaryCourse: form.scholarshipType || null,
        email: form.emailAddress,
        applicationType: "vocational",
        validIdType: validIdType === "Others" ? `Others - ${validIdTypeOther.trim()}` : validIdType,
        facebookAccount: form.facebookAccount || null,
        contactNo: form.contactNo || null,
        enrollmentPurposes: form.enrollmentPurposes,
        enrollmentPurposeOthers: form.enrollmentPurposeOthers || null,
        formData: form,
        idPictureFile,
        oneByOnePictureFile,
        rightThumbmarkFile,
        birthCertificateFile,
        validIdImageFile,
      });

      toast.success((response as { message?: string }).message ?? "Vocational enrollment submitted successfully.");
      setForm(defaultForm);
      setIdPictureFile(null);
      setOneByOnePictureFile(null);
      setRightThumbmarkFile(null);
      setBirthCertificateFile(null);
      setValidIdType("");
      setValidIdTypeOther("");
      setValidIdImageFile(null);
      setSubmittedModalOpen(true);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(VOCATIONAL_DRAFT_KEY);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit admission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;
    setSummaryModalOpen(true);
  };

  const handleConfirmSummarySubmit = async () => {
    setSummaryModalOpen(false);
    await submitEnrollment();
  };

  const summaryRows = [
    { label: "Full Name", value: [form.firstName, form.middleName, form.lastName, form.extensionName].filter(Boolean).join(" ") || "Not provided" },
    { label: "Email", value: form.emailAddress || "Not provided" },
    { label: "Contact Number", value: form.contactNo || "Not provided" },
    { label: "Program", value: form.courseQualificationName || selectedProgram || "Not selected" },
    { label: "Scholarship Type", value: form.scholarshipType || "Not provided" },
    { label: "Address", value: [form.numberStreet, form.barangay, form.cityMunicipality, form.province, form.region].filter(Boolean).join(", ") || "Not provided" },
    { label: "Enrollment Purpose", value: form.enrollmentPurposes.length ? form.enrollmentPurposes.join(", ") : "Not selected" },
    { label: "Valid ID", value: validIdType === "Others" ? `Others - ${validIdTypeOther || "Not provided"}` : (validIdType || "Not selected") },
  ];

  const uploadedDocs = [
    { label: "Birth Certificate", value: birthCertificateFile ? "Uploaded" : "Missing" },
    { label: "Valid ID File", value: validIdImageFile ? "Uploaded" : "Missing" },
    { label: "ID Picture", value: idPictureFile ? "Uploaded" : "Missing" },
    { label: "1x1 Picture", value: oneByOnePictureFile ? "Uploaded" : "Missing" },
    { label: "Right Thumbmark", value: rightThumbmarkFile ? "Uploaded" : "Missing" },
  ];

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-6 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <VocationalPageSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="vocational-page min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-white p-2.5 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <Badge className="mb-2 bg-blue-100 text-blue-700 border border-blue-200">Vocational Enrollment</Badge>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-blue-950">Learner&apos;s Profile Form</h1>
            <p className="mt-1 max-w-md text-slate-600">Training Programs & Scholarships enrollment profile.</p>
          </div>
          <div className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)] items-stretch gap-2 md:flex md:w-auto md:items-center md:justify-end">
            <ThemeIconButton className="h-10 w-10 rounded-xl" />
            <Link href="/programs" className="min-w-0">
              <Button
                variant="outline"
                className="h-10 w-full justify-center rounded-xl border-blue-200 px-3 text-center text-blue-800 hover:bg-blue-50 md:w-auto md:whitespace-nowrap"
              >
                Back to Training Programs
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 pb-24 sm:space-y-6 sm:pb-0">
          {selectedProgramRequirements && (
            <Card className="elev-card border-blue-100/80 bg-white/90">
              <CardHeader>
                <CardTitle className="text-blue-900">Program Requirements: {selectedProgram}</CardTitle>
                <CardDescription>Please review these before submitting your registration.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Documentary Requirements</h3>
                  <ul className="space-y-1 text-sm text-slate-700 list-disc pl-5">
                    {selectedProgramRequirements.documentaryRequirements.map((item, index) => (
                      <li key={`document-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Qualifications</h3>
                  <ul className="space-y-1 text-sm text-slate-700 list-disc pl-5">
                    {selectedProgramRequirements.qualifications.map((item, index) => (
                      <li key={`qualification-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">Required Supporting Documents</CardTitle>
              <CardDescription>These are required for Training Programs & Scholarships enrollment.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FileUploadField
                  label="Birth Certificate (Image or PDF)"
                  accept="image/*,.pdf,application/pdf"
                  file={birthCertificateFile}
                  helperText="Accepted: all image formats or PDF, max 5MB."
                  onFileChange={(file) => handleValidatedFileChange(file, setBirthCertificateFile, "Birth certificate")}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid ID Type</Label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white/85 px-3 text-sm text-slate-800 shadow-sm outline-none ring-0 transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60"
                  value={validIdType}
                  onChange={(e) => {
                    setValidIdType(e.target.value);
                    if (e.target.value !== "Others") {
                      setValidIdTypeOther("");
                    }
                  }}
                >
                  <option value="">Select valid ID</option>
                  {PH_VALID_IDS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              {validIdType === "Others" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Specify Valid ID</Label>
                  <Input
                    placeholder="Type the ID name you uploaded"
                    value={validIdTypeOther}
                    onChange={(e) => setValidIdTypeOther(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2 md:col-span-2">
                <FileUploadField
                  label="Upload Valid ID (Image or PDF)"
                  accept="image/*,.pdf,application/pdf"
                  file={validIdImageFile}
                  helperText="Accepted: all image formats or PDF, max 5MB."
                  onFileChange={(file) => handleValidatedFileChange(file, setValidIdImageFile, "Valid ID file")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">Learner ID Picture</CardTitle>
              <CardDescription>Attach learner ID picture (for profile and verification).</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FileUploadField
                  label="ID Picture"
                  accept="image/*"
                  file={idPictureFile}
                  helperText="Accepted: all image formats, max 5MB."
                  onFileChange={(file) => handleValidatedFileChange(file, setIdPictureFile, "ID picture")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">1. T2MIS Auto Generated</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unique Learner Identifier (ULI) Number</Label>
                <Input value={form.uliNumber} onChange={(e) => setForm((prev) => ({ ...prev, uliNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Entry Date</Label>
                <Input type="date" value={form.entryDate} onChange={(e) => setForm((prev) => ({ ...prev, entryDate: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">2. Learner/Manpower Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Last Name</Label>
                  <Input value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input value={form.middleName} onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))} />
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Extension Name (Jr., Sr.)</Label>
                  <Input value={form.extensionName} onChange={(e) => setForm((prev) => ({ ...prev, extensionName: e.target.value }))} />
                </div>
              </div>
              <CardDescription className="text-slate-700 font-medium pt-2">Complete Permanent Mailing Address</CardDescription>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Number, Street</Label>
                  <Input value={form.numberStreet} onChange={(e) => setForm((prev) => ({ ...prev, numberStreet: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Barangay</Label>
                  <Input value={form.barangay} onChange={(e) => setForm((prev) => ({ ...prev, barangay: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input value={form.district} onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City/Municipality</Label>
                  <Input value={form.cityMunicipality} onChange={(e) => setForm((prev) => ({ ...prev, cityMunicipality: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Input value={form.province} onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input value={form.region} onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))} />
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="Primary email for login credentials"
                    value={form.emailAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, emailAddress: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facebook Account</Label>
                  <Input
                    placeholder="Optional Facebook profile/link"
                    value={form.facebookAccount}
                    onChange={(e) => setForm((prev) => ({ ...prev, facebookAccount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact No.</Label>
                  <Input value={form.contactNo} onChange={(e) => setForm((prev) => ({ ...prev, contactNo: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input value={form.nationality} onChange={(e) => setForm((prev) => ({ ...prev, nationality: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">3. Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Sex</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Male", "Female"].map((item) => (
                      <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                        <input type="radio" name="sex" checked={form.sex === item} onChange={() => setForm((prev) => ({ ...prev, sex: item }))} />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Civil Status</Label>
                  <div className="space-y-1">
                    {civilStatuses.map((item) => (
                      <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                        <input type="checkbox" checked={form.civilStatus.includes(item)} onChange={() => toggleArrayValue("civilStatus", item)} />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Employment Status (before training)</Label>
                  <div className="space-y-1">
                    {employmentStatuses.map((item) => (
                      <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                        <input type="radio" name="employment" checked={form.employmentStatus === item} onChange={() => setForm((prev) => ({ ...prev, employmentStatus: item }))} />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Month of Birth</Label>
                  <Input value={form.monthOfBirth} onChange={(e) => setForm((prev) => ({ ...prev, monthOfBirth: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Day of Birth</Label>
                  <Input value={form.dayOfBirth} onChange={(e) => setForm((prev) => ({ ...prev, dayOfBirth: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Year of Birth</Label>
                  <Input value={form.yearOfBirth} onChange={(e) => setForm((prev) => ({ ...prev, yearOfBirth: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    min={18}
                    value={form.age}
                    onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Birthplace - City/Municipality</Label>
                  <Input value={form.birthplaceCity} onChange={(e) => setForm((prev) => ({ ...prev, birthplaceCity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Birthplace - Province</Label>
                  <Input value={form.birthplaceProvince} onChange={(e) => setForm((prev) => ({ ...prev, birthplaceProvince: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Birthplace - Region</Label>
                  <Input value={form.birthplaceRegion} onChange={(e) => setForm((prev) => ({ ...prev, birthplaceRegion: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Educational Attainment Before the Training (Trainee)</Label>
                <div className="grid md:grid-cols-3 gap-2">
                  {educationalAttainments.map((item) => (
                    <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                      <input type="checkbox" checked={form.educationalAttainment.includes(item)} onChange={() => toggleArrayValue("educationalAttainment", item)} />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parent/Guardian Name</Label>
                  <Input value={form.parentGuardianName} onChange={(e) => setForm((prev) => ({ ...prev, parentGuardianName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Parent/Guardian Complete Permanent Mailing Address</Label>
                  <Input value={form.parentGuardianAddress} onChange={(e) => setForm((prev) => ({ ...prev, parentGuardianAddress: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Parent/Guardian Birthdate</Label>
                  <Input type="date" value={form.parentGuardianBirthdate} onChange={(e) => setForm((prev) => ({ ...prev, parentGuardianBirthdate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input value={form.parentGuardianRelationship} onChange={(e) => setForm((prev) => ({ ...prev, parentGuardianRelationship: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">4. Learner/Trainee/Student Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-2">
                {learnerClassifications.map((item) => (
                  <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                    <input type="checkbox" checked={form.learnerClassifications.includes(item)} onChange={() => toggleArrayValue("learnerClassifications", item)} />
                    {item}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Others (please specify)</Label>
                <Input value={form.learnerClassificationOthers} onChange={(e) => setForm((prev) => ({ ...prev, learnerClassificationOthers: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">5. Type of Disability (for Persons with Disability only)</CardTitle>
              <CardDescription>To be filled up by TESDA personnel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-2">
                {disabilityTypes.map((item) => (
                  <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                    <input type="checkbox" checked={form.disabilityTypes.includes(item)} onChange={() => toggleArrayValue("disabilityTypes", item)} />
                    {item}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label>If multiple/others, please specify</Label>
                <Input value={form.disabilityTypeOthers} onChange={(e) => setForm((prev) => ({ ...prev, disabilityTypeOthers: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">6. Causes of Disability (for Persons with Disability only)</CardTitle>
              <CardDescription>To be filled up by TESDA personnel.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-2">
              {disabilityCauses.map((item) => (
                <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                  <input type="checkbox" checked={form.disabilityCauses.includes(item)} onChange={() => toggleArrayValue("disabilityCauses", item)} />
                  {item}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">7. Name of Course/Qualification</CardTitle>
            </CardHeader>
            <CardContent>
              <Input value={form.courseQualificationName} onChange={(e) => setForm((prev) => ({ ...prev, courseQualificationName: e.target.value }))} />
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">8. If Scholar, Type of Scholarship Package (TWSP, PESFA, STEP, others)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input value={form.scholarshipType} onChange={(e) => setForm((prev) => ({ ...prev, scholarshipType: e.target.value }))} />
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">9. Privacy Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                I hereby allow TESDA to use/post my contact details, name, email, cellphone/landline nos. and other information I provided
                which may be used for processing of my scholarship application, for employment opportunities and for the survey of TESDA programs.
              </p>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
                <label className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                  <input type="radio" name="privacyConsent" checked={form.privacyConsent === "agree"} onChange={() => setForm((prev) => ({ ...prev, privacyConsent: "agree" }))} />
                  Agree
                </label>
                <label className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                  <input type="radio" name="privacyConsent" checked={form.privacyConsent === "disagree"} onChange={() => setForm((prev) => ({ ...prev, privacyConsent: "disagree" }))} />
                  Disagree
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-blue-900">10. Applicant&apos;s Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">This is to certify that the information stated above is true and correct.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Applicant&apos;s Signature Over Printed Name</Label>
                  <Input value={form.applicantSignature} onChange={(e) => setForm((prev) => ({ ...prev, applicantSignature: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Date Accomplished</Label>
                  <Input type="date" value={form.dateAccomplished} onChange={(e) => setForm((prev) => ({ ...prev, dateAccomplished: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <FileUploadField
                    label="1x1 Picture (taken within the last 6 months)"
                    accept="image/*"
                    file={oneByOnePictureFile}
                    helperText="Accepted: all image formats, max 5MB."
                    onFileChange={(file) => handleValidatedFileChange(file, setOneByOnePictureFile, "1x1 picture")}
                  />
                </div>
                <div className="space-y-2">
                  <FileUploadField
                    label="Right Thumbmark"
                    accept="image/*"
                    file={rightThumbmarkFile}
                    helperText="Accepted: all image formats, max 5MB."
                    onFileChange={(file) => handleValidatedFileChange(file, setRightThumbmarkFile, "Right thumbmark")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">11. Purpose/s and/or Intention for Enrolling</CardTitle>
              <CardDescription>Please check the appropriate box below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-2">
                {enrollmentPurposes.map((item) => (
                  <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={form.enrollmentPurposes.includes(item)}
                      onChange={() => {
                        toggleArrayValue("enrollmentPurposes", item);
                        if (item === "Others" && form.enrollmentPurposes.includes("Others")) {
                          setForm((prev) => ({ ...prev, enrollmentPurposeOthers: "" }));
                        }
                      }}
                    />
                    {item}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Others, please specify</Label>
                <Input
                  value={form.enrollmentPurposeOthers}
                  onChange={(e) => setForm((prev) => ({ ...prev, enrollmentPurposeOthers: e.target.value }))}
                  disabled={!form.enrollmentPurposes.includes("Others")}
                  placeholder="Type your specific intention"
                />
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-2 z-20 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white/90 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:border-white/10 dark:bg-slate-900/85 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none sm:supports-[backdrop-filter]:bg-transparent sm:flex-row sm:items-center">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Review and Submit"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(defaultForm)} className="w-full sm:w-auto">
              Reset
            </Button>
          </div>
        </form>

        <Dialog open={summaryModalOpen} onOpenChange={setSummaryModalOpen}>
          <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl overflow-hidden border-blue-100 bg-white p-0 shadow-2xl sm:w-full dark:border-white/10 dark:bg-slate-950">
            <div className="h-1.5 bg-gradient-to-r from-blue-700 via-cyan-500 to-blue-700" />
            <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-xl text-blue-950 dark:text-slate-100 sm:text-2xl">Review Your Application Summary</DialogTitle>
                <DialogDescription className="text-sm text-slate-600 dark:text-slate-300">
                  Please check your details before final submission.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Applicant Details</p>
                  <div className="space-y-2 text-sm">
                    {summaryRows.map((item) => (
                      <div key={item.label} className="grid grid-cols-[9rem,1fr] gap-2">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
                        <p className="text-slate-600 dark:text-slate-300">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">Uploaded Documents</p>
                  <div className="space-y-2 text-sm">
                    {uploadedDocs.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-blue-100/80 bg-white/80 px-3 py-2 dark:border-blue-400/20 dark:bg-slate-900/50">
                        <p className="text-slate-700 dark:text-slate-200">{item.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.value === "Uploaded" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-5 flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSummaryModalOpen(false)}>
                  Edit Details
                </Button>
                <Button className="w-full sm:w-auto" onClick={handleConfirmSummarySubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm and Submit"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={submittedModalOpen} onOpenChange={setSubmittedModalOpen}>
          <DialogContent className="w-[calc(100vw-1rem)] max-w-[34rem] overflow-hidden border-blue-100 bg-white p-0 shadow-2xl sm:w-full dark:border-white/10 dark:bg-slate-950">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />
            <div className="p-4 sm:p-6">
              <DialogHeader className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/10">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      Submission Confirmed
                    </div>
                    <DialogTitle className="text-xl leading-tight text-blue-950 dark:text-slate-100 sm:text-2xl">
                      Enrollment Submitted
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                      Thank you for registering for <span className="font-semibold text-slate-800 dark:text-slate-100">Training Programs & Scholarships</span>.
                      Please wait for admin approval on your email.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-400/15 dark:bg-blue-500/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                    What happens next
                  </p>
                  <p className="mt-1 text-sm text-blue-950 dark:text-blue-100">
                    We will review your application and send your login credentials after approval.
                  </p>
                </div>

                <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <p><span className="font-semibold">Status:</span> Pending admin review</p>
                  <p><span className="font-semibold">Delivery:</span> Credentials will be sent via email</p>
                </div>
              </div>

              <DialogFooter className="mt-5 flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSubmittedModalOpen(false)}>
                  Close
                </Button>
                <Link href="/" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">Back to Home</Button>
                </Link>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

export default function VocationalPage() {
  return (
    <Suspense fallback={null}>
      <VocationalPageContent />
    </Suspense>
  );
}



