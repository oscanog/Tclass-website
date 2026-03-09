"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { VocationalPageSkeleton } from "@/components/ui/loading-states";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { submitAdmissionForm } from "@/lib/admission-submit";
import { useFieldCompletionFlash } from "@/lib/use-field-completion-flash";

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
  "Others",
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
const parentGuardianRelationshipOptions = [
  "Mother",
  "Father",
  "Guardian",
  "Grandmother",
  "Grandfather",
  "Aunt",
  "Uncle",
  "Sister",
  "Brother",
  "Stepmother",
  "Stepfather",
  "Foster Parent",
  "Legal Guardian",
  "Relative",
  "Other",
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
  notedByName: string;
  dateReceived: string;
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
  nationality: "Filipino",
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
  notedByName: "",
  dateReceived: "",
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
const DRAFT_TTL_MS = 3 * 60 * 1000;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const LOCATION_NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;
const MIN_VOCATIONAL_AGE = 18;
const GMAIL_ADDRESS_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/i;
const MOBILE_NUMBER_REGEX = /^09\d{9}$/;

type AllowedFileType = "pdf" | "image";

function hasAllowedExtension(fileName: string, extensions: string[]) {
  const lower = fileName.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}

function getAdultBirthdateMaxIso(minAge: number) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const yyyy = String(maxDate.getFullYear());
  const mm = String(maxDate.getMonth() + 1).padStart(2, "0");
  const dd = String(maxDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const NATIONALITY_OPTIONS = [
  "Filipino",
  "Afghan",
  "Albanian",
  "Algerian",
  "Andorran",
  "Angolan",
  "Antiguan and Barbudan",
  "Argentine",
  "Armenian",
  "Australian",
  "Austrian",
  "Azerbaijani",
  "Bahamian",
  "Bahraini",
  "Bangladeshi",
  "Barbadian",
  "Belarusian",
  "Belgian",
  "Belizean",
  "Beninese",
  "Bhutanese",
  "Bolivian",
  "Bosnian and Herzegovinian",
  "Motswana",
  "Brazilian",
  "Bruneian",
  "Bulgarian",
  "Burkinabe",
  "Burundian",
  "Cabo Verdean",
  "Cambodian",
  "Cameroonian",
  "Canadian",
  "Central African",
  "Chadian",
  "Chilean",
  "Chinese",
  "Colombian",
  "Comorian",
  "Congolese",
  "Costa Rican",
  "Ivorian",
  "Croatian",
  "Cuban",
  "Cypriot",
  "Czech",
  "Danish",
  "Djiboutian",
  "Dominican",
  "Ecuadorian",
  "Egyptian",
  "Salvadoran",
  "Equatorial Guinean",
  "Eritrean",
  "Estonian",
  "Eswatini",
  "Ethiopian",
  "Fijian",
  "Finnish",
  "French",
  "Gabonese",
  "Gambian",
  "Georgian",
  "German",
  "Ghanaian",
  "Greek",
  "Grenadian",
  "Guatemalan",
  "Guinean",
  "Bissau-Guinean",
  "Guyanese",
  "Haitian",
  "Honduran",
  "Hungarian",
  "Icelandic",
  "Indian",
  "Indonesian",
  "Iranian",
  "Iraqi",
  "Irish",
  "Israeli",
  "Italian",
  "Jamaican",
  "Japanese",
  "Jordanian",
  "Kazakh",
  "Kenyan",
  "I-Kiribati",
  "Kuwaiti",
  "Kyrgyz",
  "Lao",
  "Latvian",
  "Lebanese",
  "Mosotho",
  "Liberian",
  "Libyan",
  "Liechtensteiner",
  "Lithuanian",
  "Luxembourger",
  "Malagasy",
  "Malawian",
  "Malaysian",
  "Maldivian",
  "Malian",
  "Maltese",
  "Marshallese",
  "Mauritanian",
  "Mauritian",
  "Mexican",
  "Micronesian",
  "Moldovan",
  "Monacan",
  "Mongolian",
  "Montenegrin",
  "Moroccan",
  "Mozambican",
  "Myanmar",
  "Namibian",
  "Nauruan",
  "Nepali",
  "Dutch",
  "New Zealander",
  "Nicaraguan",
  "Nigerien",
  "Nigerian",
  "North Korean",
  "North Macedonian",
  "Norwegian",
  "Omani",
  "Pakistani",
  "Palauan",
  "Panamanian",
  "Papua New Guinean",
  "Paraguayan",
  "Peruvian",
  "Polish",
  "Portuguese",
  "Qatari",
  "Romanian",
  "Russian",
  "Rwandan",
  "Kittitian and Nevisian",
  "Saint Lucian",
  "Saint Vincentian",
  "Samoan",
  "Sammarinese",
  "Sao Tomean",
  "Saudi",
  "Senegalese",
  "Serbian",
  "Seychellois",
  "Sierra Leonean",
  "Singaporean",
  "Slovak",
  "Slovenian",
  "Solomon Islander",
  "Somali",
  "South African",
  "South Korean",
  "South Sudanese",
  "Spanish",
  "Sri Lankan",
  "Sudanese",
  "Surinamese",
  "Swedish",
  "Swiss",
  "Syrian",
  "Taiwanese",
  "Tajik",
  "Tanzanian",
  "Thai",
  "Timorese",
  "Togolese",
  "Tongan",
  "Trinidadian and Tobagonian",
  "Tunisian",
  "Turkish",
  "Turkmen",
  "Tuvaluan",
  "Ugandan",
  "Ukrainian",
  "Emirati",
  "British",
  "American",
  "Uruguayan",
  "Uzbek",
  "Ni-Vanuatu",
  "Vatican",
  "Venezuelan",
  "Vietnamese",
  "Yemeni",
  "Zambian",
  "Zimbabwean"
] as const;

function getNationalityOptions(): string[] {
  return [...NATIONALITY_OPTIONS];
}
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
  type RequiredFieldKey =
    | "lastName"
    | "firstName"
    | "emailAddress"
    | "contactNo"
    | "nationality"
    | "sex"
    | "birthDate"
    | "birthplaceCity"
    | "birthplaceProvince"
    | "birthplaceRegion"
    | "validIdType"
    | "validIdTypeOther"
    | "validIdFront"
    | "validIdBack"
    | "courseQualification"
    | "enrollmentPurposeOthers"
    | "numberStreet"
    | "barangay"
    | "district"
    | "cityMunicipality"
    | "province"
    | "region"
    | "civilStatus"
    | "employmentStatus"
    | "educationalAttainment"
    | "parentGuardianName"
    | "parentGuardianAddress"
    | "parentGuardianBirthdate"
    | "parentGuardianRelationship"
    | "learnerClassifications"
    | "privacyConsent"
    | "applicantSignature"
    | "dateAccomplished"
    | "oneByOnePicture"
    | "entryDate"
    | "birthCertificate"
    | "idPicture";

  const [pageLoading, setPageLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedProgram = searchParams.get("program") ?? ""; 
  const maxAllowedBirthdate = getAdultBirthdateMaxIso(MIN_VOCATIONAL_AGE);
  const selectedProgramRequirements = selectedProgram ? PROGRAM_REQUIREMENTS[selectedProgram] : null;
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idPictureFile, setIdPictureFile] = useState<File | null>(null);
  const [oneByOnePictureFile, setOneByOnePictureFile] = useState<File | null>(null);
  const [rightThumbmarkFile, setRightThumbmarkFile] = useState<File | null>(null);
  const [birthCertificateFile, setBirthCertificateFile] = useState<File | null>(null);
  const [validIdBackImageFile, setValidIdBackImageFile] = useState<File | null>(null);
  const [validIdType, setValidIdType] = useState("");
  const [validIdTypeOther, setValidIdTypeOther] = useState("");
  const [validIdImageFile, setValidIdImageFile] = useState<File | null>(null);
  const [nationalityOptions, setNationalityOptions] = useState<string[]>(["Filipino"]);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [submittedModalOpen, setSubmittedModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useFieldCompletionFlash(formRef);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [invalidFieldKeys, setInvalidFieldKeys] = useState<RequiredFieldKey[]>([]);

  const clearFieldError = (key: RequiredFieldKey) => {
    setInvalidFieldKeys((prev) => prev.filter((item) => item !== key));
  };

  const scrollToField = (key: RequiredFieldKey) => {
    if (typeof window === "undefined") return;
    const container = document.querySelector<HTMLElement>(`[data-field="${key}"]`);
    if (!container) return;
    
    // Scroll to field
    container.scrollIntoView({ behavior: "smooth", block: "center" });
    
    // Focus the input
    const target = container.querySelector<HTMLElement>("input, select, textarea, button, [tabindex]");
    target?.focus();
    
    // Dynamic highlight animation
    container.style.transition = "all 0.3s ease";
    container.style.boxShadow = "0 0 0 4px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.4)";
    container.style.borderRadius = "12px";
    container.style.transform = "scale(1.02)";
    
    // Pulse animation
    let pulseCount = 0;
    const maxPulses = 3;
    const pulse = () => {
      if (pulseCount >= maxPulses) {
        // Reset after pulses
        setTimeout(() => {
          container.style.boxShadow = "";
          container.style.transform = "";
          container.style.borderRadius = "";
        }, 500);
        return;
      }
      container.style.boxShadow = pulseCount % 2 === 0 
        ? "0 0 0 6px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.6)"
        : "0 0 0 4px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.4)";
      pulseCount++;
      setTimeout(pulse, 300);
    };
    
    setTimeout(pulse, 400);
  };

  const requiredFieldClass = (key: RequiredFieldKey, base = "space-y-2") =>
    `${base} ${invalidFieldKeys.includes(key) ? "rounded-lg ring-2 ring-red-500/80 p-1" : ""}`;

  const handleValidatedFileChange = (
    file: File | null,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    label: string,
    allowedType: AllowedFileType,
  ) => {
    if (!file) {
      setFile(null);
      return;
    }

    if (allowedType === "pdf") {
      const isPdf = file.type === "application/pdf" || hasAllowedExtension(file.name, [".pdf"]);
      if (!isPdf) {
        toast.error(`${label} must be a PDF file only.`);
        return;
      }
    }

    if (allowedType === "image") {
      const isAllowedImage = IMAGE_MIME_TYPES.has(file.type) || hasAllowedExtension(file.name, IMAGE_EXTENSIONS);
      if (!isAllowedImage) {
        toast.error(`${label} must be a JPG, JPEG, or PNG file.`);
        return;
      }
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
    setNationalityOptions(getNationalityOptions());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(VOCATIONAL_DRAFT_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as
        | { savedAt: number; formData: Partial<FormState>; validIdType?: string; validIdTypeOther?: string }
        | (Partial<FormState> & { validIdType?: string; validIdTypeOther?: string });

      const savedAt = typeof (parsed as { savedAt?: number }).savedAt === "number"
        ? (parsed as { savedAt: number }).savedAt
        : 0;

      if (!savedAt || Date.now() - savedAt > DRAFT_TTL_MS) {
        window.localStorage.removeItem(VOCATIONAL_DRAFT_KEY);
        return;
      }

      const formData = "formData" in parsed ? parsed.formData : parsed;
      setForm((prev) => ({ ...prev, ...formData }));
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
      window.localStorage.setItem(
        VOCATIONAL_DRAFT_KEY,
        JSON.stringify({
          savedAt: Date.now(),
          formData: form,
          validIdType,
          validIdTypeOther,
        }),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [form, validIdType, validIdTypeOther, isDraftReady]);

  useEffect(() => {
    if (!selectedProgram) return;
    setForm((prev) => ({
      ...prev,
      courseQualificationName: selectedProgram,
    }));
  }, [selectedProgram]);

  useEffect(() => {
    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayIso = `${yyyy}-${mm}-${dd}`;
    setForm((prev) => ({
      ...prev,
      entryDate: prev.entryDate || todayIso,
      nationality: prev.nationality || "Filipino",
    }));
  }, []);

  useEffect(() => {
    const month = Number(form.monthOfBirth);
    const day = Number(form.dayOfBirth);
    const year = Number(form.yearOfBirth);
    if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) return;

    const birthDate = new Date(year, month - 1, day);
    if (
      birthDate.getFullYear() !== year ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day
    ) {
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - year;
    const hasHadBirthday =
      today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);
    if (!hasHadBirthday) age -= 1;
    if (age >= MIN_VOCATIONAL_AGE) {
      setForm((prev) => ({ ...prev, age: String(age) }));
    } else {
      setForm((prev) => ({ ...prev, age: "" }));
    }
  }, [form.monthOfBirth, form.dayOfBirth, form.yearOfBirth]);

  useEffect(() => {
    if (form.disabilityTypes.length > 0) return;
    if (form.disabilityCauses.length === 0) return;
    setForm((prev) => ({ ...prev, disabilityCauses: [] }));
  }, [form.disabilityTypes, form.disabilityCauses]);

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
    const errors: RequiredFieldKey[] = [];
    const addError = (key: RequiredFieldKey) => {
      if (!errors.includes(key)) errors.push(key);
    };
    const normalizedEmail = form.emailAddress.trim().toLowerCase();
    const normalizedContactNo = form.contactNo.replace(/\D/g, "");

    // VISUAL ORDER 1: Required Supporting Documents (appears first in UI)
    if (!birthCertificateFile) addError("birthCertificate");
    if (!validIdType.trim()) addError("validIdType");
    if (validIdType === "Others" && !validIdTypeOther.trim()) addError("validIdTypeOther");
    if (!validIdImageFile) addError("validIdFront");
    if (!validIdBackImageFile) addError("validIdBack");
    if (!idPictureFile) addError("idPicture");

    // VISUAL ORDER 2: Section 1 - T2MIS Auto Generated
    if (!form.entryDate.trim()) addError("entryDate");
    
    // VISUAL ORDER 3: Section 2 - Learner/Manpower Profile
    if (!form.lastName.trim()) addError("lastName");
    if (!form.firstName.trim()) addError("firstName");
    if (!form.numberStreet.trim()) addError("numberStreet");
    if (!form.barangay.trim()) addError("barangay");
    if (!form.district.trim()) addError("district");
    if (!form.cityMunicipality.trim()) addError("cityMunicipality");
    if (!form.province.trim()) addError("province");
    if (!form.region.trim()) {
      addError("region");
    } else if (/\d/.test(form.region.trim())) {
      addError("region");
    }
    if (!normalizedEmail) {
      addError("emailAddress");
    } else if (normalizedEmail.length > 254 || !GMAIL_ADDRESS_REGEX.test(normalizedEmail)) {
      addError("emailAddress");
    }
    if (!MOBILE_NUMBER_REGEX.test(normalizedContactNo)) addError("contactNo");
    if (!form.nationality.trim()) addError("nationality");
    
    // VISUAL ORDER 4: Section 3 - Personal Information
    if (!form.sex) addError("sex");
    if (form.civilStatus.length === 0) addError("civilStatus");
    if (!form.employmentStatus) addError("employmentStatus");
    
    const month = Number(form.monthOfBirth);
    const day = Number(form.dayOfBirth);
    const year = Number(form.yearOfBirth);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(month) || month < 1 || month > 12) addError("birthDate");
    if (!Number.isInteger(day) || day < 1 || day > 31) addError("birthDate");
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) addError("birthDate");
    const birthDate = new Date(year, month - 1, day);
    if (
      birthDate.getFullYear() !== year ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day
    ) {
      addError("birthDate");
    } else {
      let computedAge = currentYear - year;
      const today = new Date();
      const hasHadBirthday =
        today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);
      if (!hasHadBirthday) computedAge -= 1;
      if (computedAge < MIN_VOCATIONAL_AGE) addError("birthDate");
    }

    if (!LOCATION_NAME_REGEX.test(form.birthplaceCity.trim())) addError("birthplaceCity");
    if (!LOCATION_NAME_REGEX.test(form.birthplaceProvince.trim())) addError("birthplaceProvince");
    if (!LOCATION_NAME_REGEX.test(form.birthplaceRegion.trim())) addError("birthplaceRegion");
    if (form.educationalAttainment.length === 0) addError("educationalAttainment");
    if (!form.parentGuardianName.trim()) addError("parentGuardianName");
    if (!form.parentGuardianAddress.trim()) addError("parentGuardianAddress");
    if (!form.parentGuardianBirthdate.trim()) addError("parentGuardianBirthdate");
    if (!form.parentGuardianRelationship.trim()) addError("parentGuardianRelationship");
    
    // VISUAL ORDER 5: Section 4 - Learner Classification
    if (form.learnerClassifications.length === 0) addError("learnerClassifications");
    if (form.learnerClassifications.includes("Others") && !form.learnerClassificationOthers.trim()) {
      addError("learnerClassifications");
    }
    
    // VISUAL ORDER 6: Section 7 - Course Qualification
    if (!selectedProgram || !form.courseQualificationName.trim()) addError("courseQualification");
    
    // VISUAL ORDER 7: Section 8 - If Scholar (optional, no validation needed)
    
    // VISUAL ORDER 8: Section 9 - Privacy Consent
    if (!form.privacyConsent) addError("privacyConsent");
    
    // VISUAL ORDER 9: Section 10 - Applicant's Signature
    if (!form.applicantSignature.trim()) addError("applicantSignature");
    if (!form.dateAccomplished.trim()) addError("dateAccomplished");
    if (!oneByOnePictureFile) addError("oneByOnePicture");
    
    // VISUAL ORDER 10: Section 11 - Enrollment Purposes
    if (form.enrollmentPurposes.length === 0) addError("enrollmentPurposeOthers");
    if (form.enrollmentPurposes.includes("Others") && !form.enrollmentPurposeOthers.trim()) {
      addError("enrollmentPurposeOthers");
    }

    if (errors.length > 0) {
      setInvalidFieldKeys(errors);
      // Show error for the first missing field in the errors array (following visual form order)
      const firstErrorKey = errors[0];
      const errorMessages: Record<RequiredFieldKey, string> = {
        // Documents (Visual Order 1)
        birthCertificate: "Birth Certificate is required.",
        validIdType: "Valid ID type is required.",
        validIdTypeOther: "Please specify the valid ID type for Others.",
        validIdFront: "Valid ID front image is required.",
        validIdBack: "Valid ID back image is required.",
        idPicture: "ID Picture is required.",
        // Section 1 (Visual Order 2)
        entryDate: "Entry Date is required.",
        // Section 2 (Visual Order 3)
        lastName: "Last Name is required.",
        firstName: "First Name is required.",
        numberStreet: "Number, Street is required.",
        barangay: "Barangay is required.",
        district: "District is required.",
        cityMunicipality: "City/Municipality is required.",
        province: "Province is required.",
        region: "Region is required. Number is not allowed in this input field.",
        emailAddress: "Email Address is required and must be a valid Gmail address (example@gmail.com).",
        contactNo: "Contact No. must be 11 digits and start with 09.",
        nationality: "Nationality is required.",
        // Section 3 (Visual Order 4)
        sex: "Sex is required.",
        civilStatus: "Civil Status is required.",
        employmentStatus: "Employment Status is required.",
        birthDate: "Birthdate is required. Learner must be at least 18 years old.",
        birthplaceCity: "Birthplace City/Municipality is required.",
        birthplaceProvince: "Birthplace Province is required.",
        birthplaceRegion: "Birthplace Region is required.",
        educationalAttainment: "Educational Attainment is required.",
        parentGuardianName: "Parent/Guardian Name is required.",
        parentGuardianAddress: "Parent/Guardian Address is required.",
        parentGuardianBirthdate: "Parent/Guardian Birthdate is required.",
        parentGuardianRelationship: "Relationship is required.",
        // Section 4 (Visual Order 5)
        learnerClassifications: "Please select at least one Learner Classification.",
        // Section 7 (Visual Order 6)
        courseQualification: "Course/Qualification is required.",
        // Section 9 (Visual Order 8)
        privacyConsent: "Please select your Privacy Consent (Agree or Disagree).",
        // Section 10 (Visual Order 9)
        applicantSignature: "Applicant's Name is required.",
        dateAccomplished: "Date Accomplished is required.",
        oneByOnePicture: "1x1 Picture is required.",
        // Section 11 (Visual Order 10)
        enrollmentPurposeOthers: "Please select at least one Purpose for Enrolling.",
      };
      showClickableError(firstErrorKey, errorMessages[firstErrorKey] || "Please complete the required field.");
      return false;
    }

    setInvalidFieldKeys([]);
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
        email: form.emailAddress.trim().toLowerCase(),
        applicationType: "vocational",
        validIdType: validIdType === "Others" ? `Others - ${validIdTypeOther.trim()}` : validIdType,
        facebookAccount: form.facebookAccount || null,
        contactNo: form.contactNo.replace(/\D/g, "") || null,
        enrollmentPurposes: form.enrollmentPurposes,
        enrollmentPurposeOthers: form.enrollmentPurposeOthers || null,
        formData: form,
        idPictureFile,
        oneByOnePictureFile,
        rightThumbmarkFile,
        birthCertificateFile,
        validIdImageFile,
        validIdBackImageFile,
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
      setValidIdBackImageFile(null);
      setSubmittedModalOpen(true);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(VOCATIONAL_DRAFT_KEY);
      }
    } catch (error) {
      const fallbackMessage = "Failed to submit vocational enrollment.";
      const rawMessage = error instanceof Error ? error.message : fallbackMessage;
      const normalizedMessage = rawMessage
        .replace(/gender is required/gi, "Sex is required")
        .replace(/The gender field is required\./gi, "Sex is required.")
        .replace(/applicant signature is required/gi, "Applicant's Name is required");
      
      // Map backend error messages to field keys for navigation
      const backendErrorMap: Record<string, RequiredFieldKey> = {
        "full name is required": "firstName",
        "age must be between": "birthDate",
        "sex is required": "sex",
        "gender is required": "sex",
        "primary course is required": "courseQualification",
        "email is required": "emailAddress",
        "email must be a valid email address": "emailAddress",
        "email must be a valid gmail address": "emailAddress",
        "valid id front image upload is required": "validIdFront",
        "valid id back image upload is required": "validIdBack",
        "birth certificate upload is required": "birthCertificate",
        "valid id type is required": "validIdType",
        "contact no format is invalid": "contactNo",
        "please select at least one purpose": "enrollmentPurposeOthers",
        "please specify the purpose": "enrollmentPurposeOthers",
        "entry date is required": "entryDate",
        "number street is required": "numberStreet",
        "barangay is required": "barangay",
        "district is required": "district",
        "city is required": "cityMunicipality",
        "municipality is required": "cityMunicipality",
        "province is required": "province",
        "region is required": "region",
        "civil status is required": "civilStatus",
        "employment status is required": "employmentStatus",
        "educational attainment is required": "educationalAttainment",
        "parent guardian name is required": "parentGuardianName",
        "parent guardian address is required": "parentGuardianAddress",
        "parent guardian birthdate is required": "parentGuardianBirthdate",
        "relationship is required": "parentGuardianRelationship",
        "learner classification is required": "learnerClassifications",
        "privacy consent is required": "privacyConsent",
        "applicant signature is required": "applicantSignature",
        "date accomplished is required": "dateAccomplished",
        "1x1 picture is required": "oneByOnePicture",
      };
      
      const lowerMessage = normalizedMessage.toLowerCase();
      const matchedKey = Object.entries(backendErrorMap).find(([key]) => 
        lowerMessage.includes(key)
      )?.[1];
      
      if (matchedKey) {
        showClickableError(matchedKey, normalizedMessage);
      } else {
        toast.error(normalizedMessage || fallbackMessage);
      }
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

  const showClickableError = (key: RequiredFieldKey, message: string) => {
    toast.custom(
      (t) => (
        <button
          type="button"
          onClick={() => {
            scrollToField(key);
            toast.dismiss(t.id);
          }}
          className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg hover:bg-red-100 transition-all text-left dark:bg-red-950/90 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/90"
        >
          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 dark:text-red-400" />
          <div>
            <p className="font-semibold text-sm">{message}</p>
            <p className="text-xs text-red-600 mt-1 dark:text-red-400">Click to navigate to field</p>
          </div>
        </button>
      ),
      { duration: 8000, position: "top-center" }
    );
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
    { label: "Valid ID Front", value: validIdImageFile ? "Uploaded" : "Missing" },
    { label: "Valid ID Back", value: validIdBackImageFile ? "Uploaded" : "Missing" },
    { label: "ID Picture", value: idPictureFile ? "Uploaded" : "Missing" },
    { label: "1x1 Picture", value: oneByOnePictureFile ? "Uploaded" : "Missing" },
    { label: "Right Thumbmark", value: "Manual on printed PDF" },
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
        <div className="glass-panel sticky top-2 z-30 rounded-2xl p-4 sm:top-4 sm:p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <Badge className="mb-2 bg-blue-100 text-blue-700 border border-blue-200">Vocational Enrollment</Badge>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-blue-950">Learner&apos;s Profile Form</h1>
            <p className="mt-1 max-w-md text-slate-600">Training Programs & Scholarships enrollment profile.</p>
            {selectedProgram && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
                <span>Enrolling in:</span>
                <span className="font-semibold truncate max-w-[250px] sm:max-w-md">{selectedProgram}</span>
              </div>
            )}
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

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5 pb-24 sm:space-y-6 sm:pb-0">
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
              <div className="space-y-2" data-field="birthCertificate">
                <FileUploadField
                  label="Birth Certificate (PDF only) *"
                  accept=".pdf,application/pdf"
                  file={birthCertificateFile}
                  helperText="Accepted: PDF only, max 5MB."
                  onFileChange={(file) => handleValidatedFileChange(file, setBirthCertificateFile, "Birth certificate", "pdf")}
                />
              </div>
              <div className="space-y-2" data-field="validIdType">
                <Label>Valid ID Type *</Label>
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
                <div className="space-y-2 md:col-span-2" data-field="validIdTypeOther">
                  <Label>Specify Valid ID</Label>
                  <Input
                    placeholder="Type the ID name you uploaded"
                    value={validIdTypeOther}
                    onChange={(e) => setValidIdTypeOther(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2 md:col-span-2" data-field="validIdFront">
                <FileUploadField
                  label="Upload Valid ID Front (Image) *"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  file={validIdImageFile}
                  helperText="Accepted: JPG, JPEG, PNG only, max 5MB."
                  onFileChange={(file) => handleValidatedFileChange(file, setValidIdImageFile, "Valid ID file", "image")}
                />
              </div>
              <div className="space-y-2 md:col-span-2" data-field="validIdBack">
                <FileUploadField
                  label="Upload Valid ID Back (Image) *"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  file={validIdBackImageFile}
                  helperText="Accepted: JPG, JPEG, PNG only, max 5MB."
                  onFileChange={(file) => handleValidatedFileChange(file, setValidIdBackImageFile, "Valid ID back file", "image")}
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
              <div className="space-y-2" data-field="idPicture">
                <FileUploadField
                  label="ID Picture *"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  file={idPictureFile}
                  helperText="Accepted: JPG, JPEG, PNG only, max 5MB."
                  onFileChange={(file) => handleValidatedFileChange(file, setIdPictureFile, "ID picture", "image")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">1. T2MIS Auto Generated</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2" data-field="uliNumber">
                <Label>Unique Learner Identifier (ULI) Number</Label>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Numbers only"
                  value={form.uliNumber}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, uliNumber: e.target.value.replace(/\D/g, "") }))
                  }
                />
              </div>
              <div className="space-y-2" data-field="entryDate">
                <Label>Entry Date *</Label>
                <Input
                  type="date"
                  value={form.entryDate}
                  readOnly
                  aria-readonly="true"
                  title="Entry date is auto-set when opening the form."
                  className="dark:[color-scheme:dark]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">2. Learner/Manpower Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2" data-field="lastName">
                  <Label>Last Name *</Label>
                  <Input
                    placeholder="Dela Cruz"
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2" data-field="firstName">
                  <Label>First Name *</Label>
                  <Input
                    placeholder="Juan"
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input
                    placeholder="Santos"
                    value={form.middleName}
                    onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Extension Name (Jr., Sr.)</Label>
                  <Input
                    placeholder="Jr."
                    value={form.extensionName}
                    onChange={(e) => setForm((prev) => ({ ...prev, extensionName: e.target.value }))}
                  />
                </div>
              </div>
              <CardDescription className="text-slate-700 font-medium pt-2">Complete Permanent Mailing Address</CardDescription>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2" data-field="numberStreet">
                  <Label>Number, Street *</Label>
                  <Input
                    placeholder="123 San Roque St."
                    value={form.numberStreet}
                    onChange={(e) => setForm((prev) => ({ ...prev, numberStreet: e.target.value }))}
                  />
                </div>
                <div className="space-y-2" data-field="barangay">
                  <Label>Barangay *</Label>
                  <Input
                    placeholder="San Isidro"
                    value={form.barangay}
                    onChange={(e) => setForm((prev) => ({ ...prev, barangay: e.target.value }))}
                  />
                </div>
                <div className="space-y-2" data-field="district">
                  <Label>District *</Label>
                  <Input
                    placeholder="District 1"
                    value={form.district}
                    onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2" data-field="cityMunicipality">
                  <Label>City/Municipality *</Label>
                  <Input
                    placeholder="Tarlac City"
                    value={form.cityMunicipality}
                    onChange={(e) => setForm((prev) => ({ ...prev, cityMunicipality: e.target.value }))}
                  />
                </div>
                <div className="space-y-2" data-field="province">
                  <Label>Province *</Label>
                  <Input
                    placeholder="Tarlac"
                    value={form.province}
                    onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
                  />
                </div>
                <div className="space-y-2" data-field="region">
                  <Label>Region *</Label>
                  <Input
                    placeholder="Region III"
                    value={form.region}
                    onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2" data-field="emailAddress">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="name@gmail.com"
                    maxLength={254}
                    value={form.emailAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, emailAddress: e.target.value }))}
                    className={
                      form.emailAddress.length > 0 && !GMAIL_ADDRESS_REGEX.test(form.emailAddress.trim().toLowerCase())
                        ? "border-red-500 focus-visible:ring-red-500"
                        : form.emailAddress.length >= 254
                          ? "border-red-500 focus-visible:ring-red-500"
                          : form.emailAddress.length >= 230
                            ? "border-amber-500 focus-visible:ring-amber-500"
                            : ""
                    }
                  />
                  {form.emailAddress.length > 0 && (
                    <p className={`text-xs ${
                      !GMAIL_ADDRESS_REGEX.test(form.emailAddress.trim().toLowerCase())
                        ? "text-red-600 font-medium"
                        : form.emailAddress.length >= 254
                          ? "text-red-600 font-medium"
                          : form.emailAddress.length >= 230
                            ? "text-amber-600"
                            : "text-slate-500"
                    }`}>
                      {!GMAIL_ADDRESS_REGEX.test(form.emailAddress.trim().toLowerCase())
                        ? "Use a valid Gmail address (example@gmail.com)."
                        : form.emailAddress.length >= 254
                        ? "Maximum character limit reached (254)." 
                        : `${form.emailAddress.length}/254 characters`}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Facebook Account</Label>
                  <Input
                    placeholder="Optional Facebook profile/link"
                    value={form.facebookAccount}
                    onChange={(e) => setForm((prev) => ({ ...prev, facebookAccount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2" data-field="contactNo">
                  <Label>Contact No. *</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={11}
                    pattern="09[0-9]{9}"
                    title="Contact number must be 11 digits and start with 09"
                    placeholder="09XXXXXXXXX"
                    value={form.contactNo}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, contactNo: e.target.value.replace(/\D/g, "").slice(0, 11) }))
                    }
                  />
                </div>
                <div className="space-y-2" data-field="nationality">
                  <Label>Nationality *</Label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white/85 px-3 text-sm text-slate-800 shadow-sm outline-none ring-0 transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60"
                    value={form.nationality}
                    onChange={(e) => setForm((prev) => ({ ...prev, nationality: e.target.value }))}
                  >
                    {nationalityOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
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
                <div className="space-y-2" data-field="sex">
                  <Label>Sex *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Male", "Female"].map((item) => (
                      <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                        <input type="radio" name="sex" checked={form.sex === item} onChange={() => setForm((prev) => ({ ...prev, sex: item }))} />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2" data-field="civilStatus">
                  <Label>Civil Status *</Label>
                  <div className="space-y-1">
                    {civilStatuses.map((item) => (
                      <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                        <input type="checkbox" checked={form.civilStatus.includes(item)} onChange={() => toggleArrayValue("civilStatus", item)} />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2" data-field="employmentStatus">
                  <Label>Employment Status (before training) *</Label>
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2" data-field="birthDate">
                  <Label>Birthdate *</Label>
                  <Input
                    type="date"
                    className="dark:[color-scheme:dark]"
                    max={maxAllowedBirthdate}
                    value={
                      form.yearOfBirth && form.monthOfBirth && form.dayOfBirth
                        ? `${form.yearOfBirth.padStart(4, "0")}-${form.monthOfBirth.padStart(2, "0")}-${form.dayOfBirth.padStart(2, "0")}`
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setForm((prev) => ({ ...prev, monthOfBirth: "", dayOfBirth: "", yearOfBirth: "", age: "" }));
                        return;
                      }
                      if (value > maxAllowedBirthdate) {
                        toast.error(`Learner must be at least ${MIN_VOCATIONAL_AGE} years old.`);
                        return;
                      }
                      const [year, month, day] = value.split("-");
                      setForm((prev) => ({
                        ...prev,
                        monthOfBirth: month ?? "",
                        dayOfBirth: day ?? "",
                        yearOfBirth: year ?? "",
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input value={form.age} readOnly aria-readonly="true" title="Auto-calculated from birthdate." />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2" data-field="birthplaceCity">
                  <Label>Birthplace - City/Municipality</Label>
                  <Input
                    pattern="[A-Za-z][A-Za-z\\s.'-]*"
                    title="Use letters, spaces, apostrophe, period, or hyphen only."
                    value={form.birthplaceCity}
                    onChange={(e) => setForm((prev) => ({ ...prev, birthplaceCity: e.target.value }))}
                  />
                </div>
                <div className="space-y-2" data-field="birthplaceProvince">
                  <Label>Birthplace - Province</Label>
                  <Input
                    pattern="[A-Za-z][A-Za-z\\s.'-]*"
                    title="Use letters, spaces, apostrophe, period, or hyphen only."
                    value={form.birthplaceProvince}
                    onChange={(e) => setForm((prev) => ({ ...prev, birthplaceProvince: e.target.value }))}
                  />
                </div>
                <div className="space-y-2" data-field="birthplaceRegion">
                  <Label>Birthplace - Region</Label>
                  <Input
                    pattern="[A-Za-z][A-Za-z\\s.'-]*"
                    title="Use letters, spaces, apostrophe, period, or hyphen only."
                    value={form.birthplaceRegion}
                    onChange={(e) => setForm((prev) => ({ ...prev, birthplaceRegion: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2" data-field="educationalAttainment">
                <Label>Educational Attainment Before the Training (Trainee) *</Label>
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
                <div className="space-y-2" data-field="parentGuardianName">
                  <Label>Parent/Guardian Name *</Label>
                  <Input value={form.parentGuardianName} onChange={(e) => setForm((prev) => ({ ...prev, parentGuardianName: e.target.value }))} />
                </div>
                <div className="space-y-2" data-field="parentGuardianAddress">
                  <Label>Parent/Guardian Complete Permanent Mailing Address *</Label>
                  <Input value={form.parentGuardianAddress} onChange={(e) => setForm((prev) => ({ ...prev, parentGuardianAddress: e.target.value }))} />
                </div>
                <div className="space-y-2" data-field="parentGuardianBirthdate">
                  <Label>Parent/Guardian Birthdate *</Label>
                  <Input type="date" value={form.parentGuardianBirthdate} onChange={(e) => setForm((prev) => ({ ...prev, parentGuardianBirthdate: e.target.value }))} className="dark:[color-scheme:dark]" />
                </div>
                                <div className="space-y-2" data-field="parentGuardianRelationship">
                  <Label>Relationship *</Label>
                  <select
                    value={form.parentGuardianRelationship}
                    onChange={(e) => setForm((prev) => ({ ...prev, parentGuardianRelationship: e.target.value }))}
                    className="w-full rounded-xl border border-blue-100 bg-slate-100 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select relationship</option>
                    {parentGuardianRelationshipOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">4. Learner/Trainee/Student Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-field="learnerClassifications">
              <Label className="block mb-2">Learner/Trainee/Student Classification *</Label>
              <div className="grid md:grid-cols-3 gap-2">
                {learnerClassifications.map((item) => (
                  <label key={item} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={form.learnerClassifications.includes(item)}
                      onChange={() => {
                        const removingOthers = item === "Others" && form.learnerClassifications.includes("Others");
                        toggleArrayValue("learnerClassifications", item);
                        if (removingOthers) {
                          setForm((prev) => ({ ...prev, learnerClassificationOthers: "" }));
                        }
                      }}
                    />
                    {item}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Others (please specify)</Label>
                <Input
                  value={form.learnerClassificationOthers}
                  disabled={!form.learnerClassifications.includes("Others")}
                  placeholder={form.learnerClassifications.includes("Others") ? "Please specify" : "Check \"Others\" to enable"}
                  onChange={(e) => setForm((prev) => ({ ...prev, learnerClassificationOthers: e.target.value }))}
                />
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
                  <input
                    type="checkbox"
                    disabled={form.disabilityTypes.length === 0}
                    checked={form.disabilityCauses.includes(item)}
                    onChange={() => toggleArrayValue("disabilityCauses", item)}
                  />
                  {item}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90" data-field="courseQualification">
            <CardHeader>
              <CardTitle className="text-blue-900">7. Name of Course/Qualification</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={selectedProgram || form.courseQualificationName}
                readOnly
                aria-readonly="true"
                title="This field is auto-generated from the selected program."
              />
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
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8" data-field="privacyConsent">
                <label className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors hover:bg-blue-50/70 sm:items-center sm:px-0 sm:py-0 dark:hover:bg-white/5">
                  <input type="radio" name="privacyConsent" checked={form.privacyConsent === "agree"} onChange={() => setForm((prev) => ({ ...prev, privacyConsent: "agree" }))} />
                  Agree *
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
                <div className="space-y-2" data-field="applicantSignature">
                  <Label>Applicant&apos;s Name *</Label>
                  <Input value={form.applicantSignature} onChange={(e) => setForm((prev) => ({ ...prev, applicantSignature: e.target.value }))} />
                </div>
                <div className="space-y-2" data-field="dateAccomplished">
                  <Label>Date Accomplished *</Label>
                  <Input type="date" value={form.dateAccomplished} onChange={(e) => setForm((prev) => ({ ...prev, dateAccomplished: e.target.value }))} className="dark:[color-scheme:dark]" />
                </div>
                <div className="space-y-2" data-field="oneByOnePicture">
                  <FileUploadField
                    label="1x1 Picture (taken within the last 6 months) *"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    file={oneByOnePictureFile}
                    helperText="Accepted: JPG, JPEG, PNG only, max 5MB."
                    onFileChange={(file) => handleValidatedFileChange(file, setOneByOnePictureFile, "1x1 picture", "image")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Right Thumbmark</Label>
                  <Input
                    value="To be marked personally on the generated PDF"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-slate-500">
                    Disabled in online form. Student/applicant will mark thumbmark manually on printed PDF.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-blue-900">11. Noted by: Registrar/School Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">For official acknowledgment and approval.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Registrar/School Admin Name</Label>
                  <Input value={form.notedByName} onChange={(e) => setForm((prev) => ({ ...prev, notedByName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Date Received</Label>
                  <Input type="date" value={form.dateReceived} onChange={(e) => setForm((prev) => ({ ...prev, dateReceived: e.target.value }))} className="dark:[color-scheme:dark]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="elev-card border-blue-100/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-blue-900">12. Purpose/s and/or Intention for Enrolling</CardTitle>
              <CardDescription>Please check the appropriate box below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3" data-field="enrollmentPurposeOthers">
              <Label className="block mb-2">Purpose/s and/or Intention for Enrolling *</Label>
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
              {form.enrollmentPurposes.includes("Others") && (
                <div className="space-y-2" data-field="enrollmentPurposeOthers">
                  <Label htmlFor="enrollment-purpose-others">If you selected &quot;Others&quot;, please specify *</Label>
                  <Input
                    id="enrollment-purpose-others"
                    value={form.enrollmentPurposeOthers}
                    onChange={(e) => setForm((prev) => ({ ...prev, enrollmentPurposeOthers: e.target.value }))}
                    placeholder="Type your specific intention"
                  />
                </div>
              )}
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



