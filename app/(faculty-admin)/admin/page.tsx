"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ThemeIconButton } from "@/components/ui/theme-icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Building2,
  MessageSquare,
  Search,
  Menu,
  X,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  School,
  Trash2,
  Edit,
  Loader2,
  LogOut,
  Inbox,
  Filter,
  Reply,
  Archive,
  Mail,
  MailOpen,
  ChevronLeft,
  UserPlus,
  Calendar,
  CornerUpLeft,
  CheckCheck,
  Trash,
  Eye,
  EyeOff,
  FileText,
  Printer
} from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api-client";
import { AvatarActionsMenu } from "@/components/ui/avatar-actions-menu";
import { LogoutModal } from "@/components/ui/logout-modal";

// Types
interface UserItem {
  id: number;
  name: string;
  email: string;
  role: "Student" | "Faculty" | "Admin";
  status: "active" | "pending" | "inactive";
  joined: string;
}

interface BackendUserItem {
  id?: number;
  name?: string;
  full_name?: string;
  email?: string;
  role?: string;
  status?: string;
  student_number?: string | null;
  created_at?: string;
}

interface AuthSessionUser {
  id: number;
  name: string;
  email: string;
  role?: string | null;
}

interface Department {
  id: number;
  name: string;
  head: string;
  faculty: number;
  students: number;
  classes: number;
}

interface ContactMessageItem {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface ContactMessagesPayload {
  messages?: ContactMessageItem[];
  unread_count?: number;
}

interface AdmissionApplication {
  id: number;
  full_name: string;
  age: number;
  gender: string;
  primary_course: string;
  secondary_course: string | null;
  email: string;
  application_type?: "admission" | "vocational";
  valid_id_type?: string | null;
  status: "pending" | "approved" | "rejected";
  exam_status?: "passed" | "failed" | "not_attended";
  exam_attendance_status?: "attended" | "not_attended";
  created_user_id: number | null;
  remarks?: string | null;
  id_picture_path?: string | null;
  one_by_one_picture_path?: string | null;
  right_thumbmark_path?: string | null;
  birth_certificate_path?: string | null;
  valid_id_path?: string | null;
  exam_schedule_sent_at?: string | null;
  exam_schedule_payload?: {
    subject?: string;
    intro_message?: string;
    exam_date?: string;
    exam_time?: string;
    exam_day?: string;
    location?: string;
    things_to_bring?: string;
    attire_note?: string | null;
    additional_note?: string | null;
    sent_by?: number;
    sent_at?: string;
  } | null;
  form_data?: Record<string, unknown> | null;
}

export default function AdminDashboard() {
  return <AdminDashboardPage initialAdminTab="users" />;
}

type ExamStatus = "attended" | "not_attended";
type ExamResultStatus = "passed" | "failed";
type AdmissionType = "admission" | "vocational";

interface DashboardStats {
  students: number;
  faculty: number;
  classes: number;
  departments: number;
}

interface CourseTrend {
  course: string;
  total: number;
  colorClass: string;
  yearLevels: {
    year: "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
    students: number;
  }[];
}

interface CourseStudentsByYear {
  [year: string]: string[];
}

interface CourseStudentDirectory {
  [course: string]: CourseStudentsByYear;
}

interface VocationalStudentsByBatch {
  [batch: string]: string[];
}

interface VocationalStudentDirectory {
  [program: string]: VocationalStudentsByBatch;
}

interface VocationalTrend {
  program: string;
  total: number;
  colorClass: string;
  breakdown: {
    label: string;
    students: number;
  }[];
}

type AdminSectionTab =
  | "users"
  | "reports"
  | "departments"
  | "admissions"
  | "vocationals"
  | "admissions-masterlist"
  | "vocationals-masterlist";

interface AdminDashboardProps {
  initialAdminTab?: AdminSectionTab;
}

const TREND_COLOR_CLASSES = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-cyan-500", "bg-rose-500"];
const YEAR_LABELS: Array<"1st Year" | "2nd Year" | "3rd Year" | "4th Year"> = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const BATCH_LABELS = ["Batch A", "Batch B", "Batch C", "Batch D"];
const DEFAULT_ADMIN_TAB: AdminSectionTab = "users";
const ADMIN_TABS: AdminSectionTab[] = [
  "users",
  "reports",
  "departments",
  "admissions",
  "vocationals",
  "admissions-masterlist",
  "vocationals-masterlist",
];
const normalizeSearchValue = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
const PRINT_LEARNER_CLASSIFICATIONS = [
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
const PRINT_DISABILITY_TYPES = [
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
const PRINT_DISABILITY_CAUSES = ["Congenital/Inborn", "Illness", "Injury"];
const PRINT_EDUCATIONAL_ATTAINMENTS = [
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
const normalizeOption = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const sanitizeText = (value: unknown, fallback = " ") => {
  const text = String(value ?? "").trim();
  return text === "" ? fallback : text;
};
const parseArrayValue = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fall through and treat value as plain text.
      }
    }
    return [trimmed];
  }
  return [];
};
const findFieldValue = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (key in source && source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== "") {
      return source[key];
    }
  }
  return undefined;
};
const splitFullName = (fullName: string) => {
  const chunks = fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (chunks.length === 0) return { firstName: "", middleName: "", lastName: "", extensionName: "" };
  if (chunks.length === 1) return { firstName: chunks[0], middleName: "", lastName: "", extensionName: "" };
  const lastName = chunks[chunks.length - 1] ?? "";
  const firstName = chunks[0] ?? "";
  const middleName = chunks.slice(1, -1).join(" ");
  return { firstName, middleName, lastName, extensionName: "" };
};
const formatEnumLabel = (value?: string | null) =>
  (value ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "-";
const formatFormKey = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatFormValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map((item) => String(item)).join(", ") : "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
const admissionStatusBadgeClass = (status: AdmissionApplication["status"]) => {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
};
const examStatusBadgeClass = (status: "passed" | "failed" | "not_attended" | "attended" | "unset") => {
  if (status === "passed" || status === "attended") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (status === "failed" || status === "not_attended") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";
  }
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300";
};

const formatJoinedTime = (dateText?: string) => {
  if (!dateText) return "just now";
  const ts = parseTimestamp(dateText);
  if (ts === null) return "just now";
  const ms = Date.now() - ts;
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const parseTimestamp = (dateText?: string): number | null => {
  if (!dateText) return null;
  const raw = dateText.trim();
  if (!raw) return null;

  let normalized = raw;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raw)) {
    // Laravel DB datetime strings often have no timezone. Treat as UTC.
    normalized = `${raw.replace(" ", "T")}Z`;
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raw)) {
    normalized = `${raw}Z`;
  }

  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) return parsed;

  const fallback = Date.parse(raw.replace(" ", "T"));
  if (!Number.isNaN(fallback)) return fallback;

  return null;
};

const formatRelativeTime = (dateText?: string) => {
  if (!dateText) return "just now";
  const ts = parseTimestamp(dateText);
  if (ts === null) return "just now";
  const ms = Date.now() - ts;
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  const exact = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(ts)
    .replace(/\s/g, "")
    .toLowerCase();
  const exactDate = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })
    .format(ts)
    .replace(/\//g, "-");
  const exactStamp = `${exact} - ${exactDate}`;

  if (mins < 1) return `just now - ${exactStamp}`;
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago - ${exactStamp}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago - ${exactStamp}`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago - ${exactStamp}`;
};

const normalizeRole = (role?: string): UserItem["role"] => {
  const value = (role ?? "").toLowerCase();
  if (value.includes("admin")) return "Admin";
  if (value.includes("faculty") || value.includes("teacher")) return "Faculty";
  return "Student";
};

const normalizeStatus = (status?: string): UserItem["status"] => {
  const value = (status ?? "").toLowerCase();
  if (value === "inactive" || value === "disabled") return "inactive";
  if (value === "pending") return "pending";
  return "active";
};

const normalizeUsers = (rows: BackendUserItem[]): UserItem[] =>
  rows.map((row, index) => ({
    id: row.id ?? index + 1,
    name: row.name ?? row.full_name ?? "Unknown User",
    email: row.email ?? "No email",
    role: normalizeRole(row.role),
    status: normalizeStatus(row.status),
    joined: formatJoinedTime(row.created_at),
  }));

const extractUserRows = (payload: unknown): BackendUserItem[] => {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload)) return payload as BackendUserItem[];

  const obj = payload as Record<string, unknown>;
  const directCandidates = [obj.users, obj.data, obj.items, obj.results];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate as BackendUserItem[];
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.data)) return nested.data as BackendUserItem[];
    }
  }

  return [];
};

const isAdminTab = (value: string | null | undefined): value is AdminSectionTab =>
  Boolean(value && ADMIN_TABS.includes(value as AdminSectionTab));

const getAdminTabHref = (tab: AdminSectionTab) =>
  tab === DEFAULT_ADMIN_TAB ? "/admin" : `/admin?tab=${tab}`;

export function AdminDashboardPage({ initialAdminTab = "users" }: AdminDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statsLoadedRef = useRef(false);
  const statsLoadingRef = useRef(false);
  const admissionsLoadedRef = useRef(false);
  const admissionsLoadingRef = useRef(false);
  const departmentsLoadedRef = useRef(false);
  const departmentsLoadingRef = useRef(false);
  const usersLoadingRef = useRef<Record<"student" | "faculty" | "admin", boolean>>({
    student: false,
    faculty: false,
    admin: false,
  });
  const usersCacheRef = useRef<Record<"student" | "faculty" | "admin", UserItem[]>>({
    student: [],
    faculty: [],
    admin: [],
  });
  const usersLoadedRef = useRef<Record<"student" | "faculty" | "admin", boolean>>({
    student: false,
    faculty: false,
    admin: false,
  });
  const [userRoleFilter, setUserRoleFilter] = useState<"student" | "faculty" | "admin">("admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [universalSearchQuery, setUniversalSearchQuery] = useState("");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [admissionSearchQuery, setAdmissionSearchQuery] = useState("");
  const [vocationalSearchQuery, setVocationalSearchQuery] = useState("");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [masterlistSearchQuery, setMasterlistSearchQuery] = useState("");
  
  // Dialog states
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [showAddUserPassword, setShowAddUserPassword] = useState(false);
  const [newUserForm, setNewUserForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: "admin" | "faculty";
    department: string;
    position: string;
  }>({
    name: "",
    email: "",
    password: "",
    role: "admin",
    department: "",
    position: "",
  });
  
  // Data states
  const [users, setUsers] = useState<UserItem[]>([]);
  const [sessionUser, setSessionUser] = useState<AuthSessionUser | null>(null);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [allMessagesOpen, setAllMessagesOpen] = useState(false);
  const [viewAllAccountsOpen, setViewAllAccountsOpen] = useState(false);
  const [visibleAccountsCount, setVisibleAccountsCount] = useState(5);
  const [activeMessagePreview, setActiveMessagePreview] = useState<ContactMessageItem | null>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [messageFilter, setMessageFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedMessageThread, setSelectedMessageThread] = useState<ContactMessageItem | null>(null);
  const [replyComposerOpen, setReplyComposerOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ContactMessageItem | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    students: 0,
    faculty: 0,
    classes: 0,
    departments: 0,
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingAdmissions, setLoadingAdmissions] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [recentCredentials, setRecentCredentials] = useState<{ fullName: string; email: string; studentNumber: string; temporaryPassword: string }[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminSectionTab>(initialAdminTab);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingAdmissionId, setRejectingAdmissionId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingAdmissionId, setApprovingAdmissionId] = useState<number | null>(null);
  const [submittingReject, setSubmittingReject] = useState(false);
  const [selectedAdmissionIds, setSelectedAdmissionIds] = useState<number[]>([]);
  const [selectedVocationalIds, setSelectedVocationalIds] = useState<number[]>([]);
  const [admissionCourseFilter, setAdmissionCourseFilter] = useState<string>("all");
  const [masterlistType, setMasterlistType] = useState<AdmissionType>("vocational");
  const [masterlistCourseFilter, setMasterlistCourseFilter] = useState<string>("all");
  const [updatingExamStatusId, setUpdatingExamStatusId] = useState<number | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleRecipientIds, setScheduleRecipientIds] = useState<number[]>([]);
  const [scheduleRecipientType, setScheduleRecipientType] = useState<AdmissionType>("admission");
  const [admissionDetailOpen, setAdmissionDetailOpen] = useState(false);
  const [selectedAdmissionDetail, setSelectedAdmissionDetail] = useState<AdmissionApplication | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const pdfPreviewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [sendingSchedule, setSendingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    subject: "Entrance Exam Schedule Invitation - TCLASS",
    intro_message: "You have been invited to take the entrance examination for your application at TCLASS. Please review the schedule details below and arrive on time.",
    exam_date: "",
    exam_time: "",
    exam_day: "",
    location: "TCLASS Campus / Admissions Office",
    things_to_bring: "1. Valid ID\n2. Ballpen (black or blue)\n3. Printed/phone copy of this email invitation",
    attire_note: "Please wear proper attire. Avoid sleeveless tops, shorts, and slippers.",
    additional_note: "",
  });

  // Auto-calculate day from date
  useEffect(() => {
    if (scheduleForm.exam_date) {
      const date = new Date(scheduleForm.exam_date);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = days[date.getDay()];
      setScheduleForm((prev) => ({ ...prev, exam_day: dayName }));
    }
  }, [scheduleForm.exam_date]);

  const [courseTrendModalOpen, setCourseTrendModalOpen] = useState(false);
  const [selectedTrendCourse, setSelectedTrendCourse] = useState<CourseTrend | null>(null);
  const [selectedYearLevel, setSelectedYearLevel] = useState<"1st Year" | "2nd Year" | "3rd Year" | "4th Year" | null>(null);
  const [vocationalModalOpen, setVocationalModalOpen] = useState(false);
  const [selectedVocational, setSelectedVocational] = useState<VocationalTrend | null>(null);
  const [selectedVocationalBatch, setSelectedVocationalBatch] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const routeTab = searchParams.get("tab");
  const resolvedAdminTab = isAdminTab(routeTab) ? routeTab : initialAdminTab;
  const admissionsSectionActive =
    activeAdminTab === "admissions" || activeAdminTab === "admissions-masterlist";
  const vocationalsSectionActive =
    activeAdminTab === "vocationals" || activeAdminTab === "vocationals-masterlist";
  const admissionsTabActive =
    activeAdminTab === "reports" ||
    admissionsSectionActive ||
    vocationalsSectionActive;

  useEffect(() => {
    setActiveAdminTab(resolvedAdminTab);
  }, [resolvedAdminTab]);

  useEffect(() => {
    if (activeAdminTab === "admissions-masterlist") {
      setMasterlistType("admission");
    } else if (activeAdminTab === "vocationals-masterlist") {
      setMasterlistType("vocational");
    }
  }, [activeAdminTab]);

  const admissionCourseRows = useMemo(
    () => admissions.filter((item) => (item.application_type ?? "admission") === "admission" && item.primary_course),
    [admissions],
  );
  const vocationalProgramRows = useMemo(
    () => admissions.filter((item) => (item.application_type ?? "admission") === "vocational" && item.primary_course),
    [admissions],
  );

  const courseTrends = useMemo<CourseTrend[]>(() => {
    const grouped = new Map<string, AdmissionApplication[]>();
    for (const row of admissionCourseRows) {
      const key = row.primary_course;
      const list = grouped.get(key) ?? [];
      list.push(row);
      grouped.set(key, list);
    }

    return [...grouped.entries()]
      .map(([course, rows], index) => {
        const total = rows.length;
        const base = Math.floor(total / YEAR_LABELS.length);
        const remainder = total % YEAR_LABELS.length;
        return {
          course,
          total,
          colorClass: TREND_COLOR_CLASSES[index % TREND_COLOR_CLASSES.length],
          yearLevels: YEAR_LABELS.map((year, idx) => ({
            year,
            students: base + (idx < remainder ? 1 : 0),
          })),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [admissionCourseRows]);

  const courseStudentDirectory = useMemo<CourseStudentDirectory>(() => {
    const directory: CourseStudentDirectory = {};
    const grouped = new Map<string, string[]>();
    for (const row of admissionCourseRows) {
      const key = row.primary_course;
      const list = grouped.get(key) ?? [];
      list.push(row.full_name);
      grouped.set(key, list);
    }

    for (const [course, names] of grouped.entries()) {
      const byYear: CourseStudentsByYear = {
        "1st Year": [],
        "2nd Year": [],
        "3rd Year": [],
        "4th Year": [],
      };
      names.forEach((name, index) => {
        byYear[YEAR_LABELS[index % YEAR_LABELS.length]].push(name);
      });
      directory[course] = byYear;
    }

    return directory;
  }, [admissionCourseRows]);

  const vocationalTrends = useMemo<VocationalTrend[]>(() => {
    const grouped = new Map<string, AdmissionApplication[]>();
    for (const row of vocationalProgramRows) {
      const key = row.primary_course;
      const list = grouped.get(key) ?? [];
      list.push(row);
      grouped.set(key, list);
    }

    return [...grouped.entries()]
      .map(([program, rows], index) => {
        const total = rows.length;
        const base = Math.floor(total / BATCH_LABELS.length);
        const remainder = total % BATCH_LABELS.length;
        return {
          program,
          total,
          colorClass: TREND_COLOR_CLASSES[(index + 2) % TREND_COLOR_CLASSES.length],
          breakdown: BATCH_LABELS.map((label, idx) => ({
            label,
            students: base + (idx < remainder ? 1 : 0),
          })),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [vocationalProgramRows]);

  const vocationalStudentDirectory = useMemo<VocationalStudentDirectory>(() => {
    const directory: VocationalStudentDirectory = {};
    const grouped = new Map<string, string[]>();
    for (const row of vocationalProgramRows) {
      const key = row.primary_course;
      const list = grouped.get(key) ?? [];
      list.push(row.full_name);
      grouped.set(key, list);
    }

    for (const [program, names] of grouped.entries()) {
      const byBatch: VocationalStudentsByBatch = {
        "Batch A": [],
        "Batch B": [],
        "Batch C": [],
        "Batch D": [],
      };
      names.forEach((name, index) => {
        byBatch[BATCH_LABELS[index % BATCH_LABELS.length]].push(name);
      });
      directory[program] = byBatch;
    }

    return directory;
  }, [vocationalProgramRows]);

  const loadAdmissions = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (admissionsLoadingRef.current) return;
      if (!force && admissionsLoadedRef.current) return;

      admissionsLoadingRef.current = true;
      setLoadingAdmissions(true);
      try {
        const response = await apiFetch("/admin/admissions");
        const rows = (response as { applications?: AdmissionApplication[] }).applications ?? [];
        setAdmissions(rows);
        admissionsLoadedRef.current = true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load admissions.");
      } finally {
        admissionsLoadingRef.current = false;
        setLoadingAdmissions(false);
      }
    },
    []
  );

  const loadDashboardStats = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (statsLoadingRef.current) return;
      if (!force && statsLoadedRef.current) return;

      statsLoadingRef.current = true;
      setLoadingStats(true);
      try {
        const response = await apiFetch("/admin/dashboard-stats");
        const payload = response as Partial<DashboardStats>;
        setDashboardStats({
          students: Number(payload.students ?? 0),
          faculty: Number(payload.faculty ?? 0),
          classes: Number(payload.classes ?? 0),
          departments: Number(payload.departments ?? 0),
        });
        statsLoadedRef.current = true;
      } catch {
        setDashboardStats({ students: 0, faculty: 0, classes: 0, departments: 0 });
      } finally {
        statsLoadingRef.current = false;
        setLoadingStats(false);
      }
    },
    []
  );

  const loadDepartmentsOverview = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (departmentsLoadingRef.current) return;
      if (!force && departmentsLoadedRef.current) return;

      departmentsLoadingRef.current = true;
      setLoadingDepartments(true);
      try {
        const response = await apiFetch("/admin/departments-overview");
        const rows = (response as { departments?: Department[] }).departments ?? [];
        setDepartments(rows);
        departmentsLoadedRef.current = true;
      } catch {
        setDepartments([]);
      } finally {
        departmentsLoadingRef.current = false;
        setLoadingDepartments(false);
      }
    },
    []
  );

  const loadContactMessages = async (silent = false, limit = 20) => {
    if (!silent) {
      setLoadingMessages(true);
    }
    try {
      const response = await apiFetch(`/admin/contact-messages?limit=${limit}`);
      const payload = response as ContactMessagesPayload;
      const rows = payload.messages ?? [];
      setContactMessages(rows);
      setUnreadCount(Number(payload.unread_count ?? rows.filter((row) => !row.is_read).length));
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "Failed to load contact messages.");
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    let alive = true;
    apiFetch("/auth/me")
      .then((response) => {
        if (!alive) return;
        const payload = response as { user?: { id?: number; name?: string; email?: string; role?: string | null } };
        const user = payload.user;
        if (!user?.id || !user?.email) return;
        setSessionUser({
          id: Number(user.id),
          name: user.name ?? "Administrator",
          email: user.email,
          role: user.role ?? null,
        });
      })
      .catch(() => {
        if (!alive) return;
        setSessionUser(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    void loadDashboardStats();
  }, [loadDashboardStats]);

  useEffect(() => {
    void Promise.all([
      loadDepartmentsOverview(),
      loadAdmissions(),
    ]);
  }, [loadAdmissions, loadDepartmentsOverview]);

  useEffect(() => {
    if (activeAdminTab !== "departments") {
      return;
    }
    void loadDepartmentsOverview();
  }, [activeAdminTab, loadDepartmentsOverview]);

  const stats = {
    totalStudents: dashboardStats.students,
    totalFaculty: dashboardStats.faculty,
    totalClasses: dashboardStats.classes,
    totalDepartments: dashboardStats.departments,
  };

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Memoized + deferred filtering keeps typing smooth on large user lists.
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        user.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      ),
    [users, deferredSearchQuery]
  );
  const visibleUsers = filteredUsers.slice(0, visibleAccountsCount);
  const hasMoreUsers = visibleAccountsCount < filteredUsers.length;

  useEffect(() => {
    if (!viewAllAccountsOpen) return;
    setVisibleAccountsCount(5);
  }, [viewAllAccountsOpen, userRoleFilter, searchQuery]);

  // Handlers
  const handleEditUser = () => {
    if (!selectedUser) return;
    
    setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
    setEditUserOpen(false);
    setSelectedUser(null);
    toast.success("User updated successfully");
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setDeleteConfirmOpen(false);
    toast.success(`User "${selectedUser.name}" deleted successfully`);
    setSelectedUser(null);
  };

  const handleCreateUser = async () => {
    const name = newUserForm.name.trim();
    const email = newUserForm.email.trim().toLowerCase();
    const password = newUserForm.password.trim();
    const department = newUserForm.department.trim();
    const position = newUserForm.position.trim();
    const role = newUserForm.role;

    if (!name || !email) {
      toast.error("Full name and email are required.");
      return;
    }

    if (password && password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setCreatingUser(true);
    try {
      const response = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          role,
          password: password || undefined,
          department: role === "faculty" ? department || undefined : undefined,
          position: role === "faculty" ? position || undefined : undefined,
        }),
      }) as { message?: string; warning?: string | null; credentials_preview?: { temporary_password?: string | null } };

      setAddUserOpen(false);
      setNewUserForm({
        name: "",
        email: "",
        password: "",
        role: "admin",
        department: "",
        position: "",
      });
      setUserRoleFilter(role);
      await loadUsers({ role, force: true });

      const generatedPassword = response.credentials_preview?.temporary_password ?? null;
      toast.success(response.message ?? `${role === "faculty" ? "Faculty" : "Admin"} account created successfully.`);
      if (response.warning) {
        toast.error(response.warning);
      } else {
        toast.success(`Credentials were sent to the ${role} email.`);
      }
      if (generatedPassword) {
        toast(`Temporary password generated: ${generatedPassword}`, { duration: 7000 });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user account.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleViewAllUsersScroll = (event: UIEvent<HTMLDivElement>) => {
    if (loadingUsers || !hasMoreUsers) return;
    const container = event.currentTarget;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 24;
    if (!nearBottom) return;

    setVisibleAccountsCount((current) => Math.min(current + 5, filteredUsers.length));
  };

  const handleClearNotifications = async () => {
    try {
      await apiFetch("/admin/contact-messages/read-all", { method: "PATCH" });
      setContactMessages((rows) => rows.map((row) => ({ ...row, is_read: true, read_at: row.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
      setActiveMessagePreview((current) =>
        current ? { ...current, is_read: true, read_at: current.read_at ?? new Date().toISOString() } : current
      );
      toast.success("All messages marked as read.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark messages as read.");
    }
  };

  const handleOpenMessage = async (messageId: number) => {
    const message = contactMessages.find((item) => item.id === messageId);
    if (!message) {
      return;
    }

    void loadContactMessages(true, 100);
    setActiveMessagePreview(message);
    setShowNotifications(false);
    setAllMessagesOpen(false);

    if (message.is_read) {
      return;
    }

    try {
      await apiFetch(`/admin/contact-messages/${messageId}/read`, { method: "PATCH" });
      setContactMessages((rows) =>
        rows.map((row) =>
          row.id === messageId
            ? { ...row, is_read: true, read_at: row.read_at ?? new Date().toISOString() }
            : row
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      setActiveMessagePreview((current) => {
        if (!current || current.id !== messageId) return current;
        return { ...current, is_read: true, read_at: current.read_at ?? new Date().toISOString() };
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update message status.");
    }
  };

  const sortedMessages = [...contactMessages].sort((a, b) => {
    const aTs = parseTimestamp(a.created_at) ?? 0;
    const bTs = parseTimestamp(b.created_at) ?? 0;
    return bTs - aTs;
  });
  const conversationThreads = useMemo(() => {
    const grouped = new Map<string, { latest: ContactMessageItem; messages: ContactMessageItem[]; unreadCount: number }>();

    for (const msg of sortedMessages) {
      const key = msg.email.toLowerCase().trim();
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          latest: msg,
          messages: [msg],
          unreadCount: msg.is_read ? 0 : 1,
        });
        continue;
      }

      existing.messages.push(msg);
      if (!msg.is_read) existing.unreadCount += 1;
    }

    const term = messageSearchQuery.trim().toLowerCase();
    return [...grouped.values()]
      .filter((thread) => {
        const matchesFilter =
          messageFilter === "all" ||
          (messageFilter === "unread" && thread.unreadCount > 0) ||
          (messageFilter === "read" && thread.unreadCount === 0);

        if (!matchesFilter) return false;
        if (!term) return true;

        return thread.messages.some((msg) =>
          msg.full_name.toLowerCase().includes(term) ||
          msg.email.toLowerCase().includes(term) ||
          msg.message.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const aTs = parseTimestamp(a.latest.created_at) ?? 0;
        const bTs = parseTimestamp(b.latest.created_at) ?? 0;
        return bTs - aTs;
      });
  }, [sortedMessages, messageFilter, messageSearchQuery]);
  const activeSenderMessages = activeMessagePreview
    ? sortedMessages.filter(
        (msg) => msg.email.toLowerCase() === activeMessagePreview.email.toLowerCase()
      )
    : [];
  const latestConversationThreads = conversationThreads.slice(0, 3);

  const handleNavClick = (section: string) => {
    toast(`Navigating to ${section}...`, { icon: "ðŸ”—" });
  };
  const navigateToAdminTab = (tab: AdminSectionTab) => {
    setActiveAdminTab(tab);
    router.push(getAdminTabHref(tab), { scroll: false });
  };
  const setAdminTabFromMobile = (tab: AdminSectionTab) => {
    navigateToAdminTab(tab);
    setMobileMenuOpen(false);
  };
  const headerSearchQuery =
    activeAdminTab === "users"
      ? searchQuery
      : activeAdminTab === "departments"
      ? courseSearchQuery
      : activeAdminTab === "admissions"
      ? admissionSearchQuery
      : activeAdminTab === "vocationals"
      ? vocationalSearchQuery
      : activeAdminTab === "reports"
      ? reportSearchQuery
      : masterlistSearchQuery;
  const headerSearchPlaceholder =
    activeAdminTab === "users"
      ? "Search users..."
      : activeAdminTab === "departments"
      ? "Search courses..."
      : activeAdminTab === "admissions"
      ? "Search admissions..."
      : activeAdminTab === "vocationals"
      ? "Search vocationals..."
      : activeAdminTab === "reports"
      ? "Search report programs..."
      : "Search masterlist...";
  const setHeaderSearchQuery = (value: string) => {
    if (activeAdminTab === "users") {
      setSearchQuery(value);
      return;
    }
    if (activeAdminTab === "departments") {
      setCourseSearchQuery(value);
      return;
    }
    if (activeAdminTab === "admissions") {
      setAdmissionSearchQuery(value);
      return;
    }
    if (activeAdminTab === "vocationals") {
      setVocationalSearchQuery(value);
      return;
    }
    if (activeAdminTab === "reports") {
      setReportSearchQuery(value);
      return;
    }
    setMasterlistSearchQuery(value);
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    document.cookie = "tclass_token=; path=/; max-age=0; samesite=lax";
    document.cookie = "tclass_role=; path=/; max-age=0; samesite=lax";
    router.push("/");
    router.refresh();
  };
  const openEditDialog = (user: UserItem) => {
    setSelectedUser({ ...user });
    setEditUserOpen(true);
  };

  const openDeleteDialog = (user: UserItem) => {
    setSelectedUser(user);
    setDeleteConfirmOpen(true);
  };
  const handleAdmissionPrint = useCallback(() => {
    if (!selectedAdmissionDetail) {
      toast.error("No applicant selected.");
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    const formData =
      selectedAdmissionDetail.form_data && typeof selectedAdmissionDetail.form_data === "object"
        ? (selectedAdmissionDetail.form_data as Record<string, unknown>)
        : {};
    const fullNameParts = splitFullName(selectedAdmissionDetail.full_name ?? "");
    const getValue = (keys: string[], fallback = "") => {
      const value = findFieldValue(formData, keys);
      return sanitizeText(value ?? fallback, "");
    };
    const getArray = (keys: string[]) => parseArrayValue(findFieldValue(formData, keys));
    const isChecked = (selected: string[], option: string) => {
      const target = normalizeOption(option);
      return selected.some((value) => normalizeOption(value) === target);
    };
    const checkbox = (checked: boolean, label: string) =>
      `<div class="check-item"><span class="cb">${checked ? "☑" : "☐"}</span><span>${escapeHtml(label)}</span></div>`;

    const uliNumber = getValue(["uliNumber", "uli_number"]);
    const entryDate = getValue(["entryDate", "entry_date"]);
    const lastName = getValue(["lastName", "last_name"], fullNameParts.lastName);
    const firstName = getValue(["firstName", "first_name"], fullNameParts.firstName);
    const middleName = getValue(["middleName", "middle_name"], fullNameParts.middleName);
    const extensionName = getValue(["extensionName", "extension_name"], fullNameParts.extensionName);
    const numberStreet = getValue(["numberStreet", "number_street"]);
    const barangay = getValue(["barangay"]);
    const district = getValue(["district"]);
    const cityMunicipality = getValue(["cityMunicipality", "city_municipality"]);
    const province = getValue(["province"]);
    const region = getValue(["region"]);
    const emailAddress = getValue(["emailAddress", "email_address"], selectedAdmissionDetail.email ?? "");
    const facebookAccount = getValue(["facebookAccount", "facebook_account"]);
    const contactNo = getValue(["contactNo", "contact_no"], "");
    const nationality = getValue(["nationality"]);
    const sex = getValue(["sex"], selectedAdmissionDetail.gender ?? "");
    const civilStatus = getArray(["civilStatus", "civil_status"]);
    const employmentStatus = getValue(["employmentStatus", "employment_status"]);
    const monthOfBirth = getValue(["monthOfBirth", "month_of_birth"]);
    const dayOfBirth = getValue(["dayOfBirth", "day_of_birth"]);
    const yearOfBirth = getValue(["yearOfBirth", "year_of_birth"]);
    const age = getValue(["age"], String(selectedAdmissionDetail.age ?? ""));
    const birthplaceCity = getValue(["birthplaceCity", "birthplace_city"]);
    const birthplaceProvince = getValue(["birthplaceProvince", "birthplace_province"]);
    const birthplaceRegion = getValue(["birthplaceRegion", "birthplace_region"]);
    const educationalAttainment = getArray(["educationalAttainment", "educational_attainment"]);
    const parentGuardianName = getValue(["parentGuardianName", "parent_guardian_name"]);
    const parentGuardianAddress = getValue(["parentGuardianAddress", "parent_guardian_address"]);
    const parentGuardianBirthdate = getValue(["parentGuardianBirthdate", "parent_guardian_birthdate"]);
    const parentGuardianRelationship = getValue(["parentGuardianRelationship", "parent_guardian_relationship"]);
    const learnerClassifications = getArray(["learnerClassifications", "learner_classifications"]);
    const learnerClassificationOthers = getValue(["learnerClassificationOthers", "learner_classification_others"]);
    const disabilityTypes = getArray(["disabilityTypes", "disability_types"]);
    const disabilityTypeOthers = getValue(["disabilityTypeOthers", "disability_type_others"]);
    const disabilityCauses = getArray(["disabilityCauses", "disability_causes"]);
    const courseQualificationName = getValue(["courseQualificationName", "course_qualification_name"], selectedAdmissionDetail.primary_course ?? "");
    const scholarshipType = getValue(["scholarshipType", "scholarship_type"], selectedAdmissionDetail.secondary_course ?? "");
    const privacyConsent = getValue(["privacyConsent", "privacy_consent"]);
    const applicantSignature = getValue(["applicantSignature", "applicant_signature"], selectedAdmissionDetail.full_name ?? "");
    const dateAccomplished = getValue(["dateAccomplished", "date_accomplished"]);
    const notedByName = getValue(["notedByName", "noted_by_name"]);
    const dateReceived = getValue(["dateReceived", "date_received"]);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const backendOrigin = apiBase.replace(/\/api\/?$/, "");
    const fileUrl = (path?: string | null) => {
      if (!path) return "";
      if (/^https?:\/\//i.test(path)) return path;
      if (!backendOrigin) return "";
      const normalized = path.startsWith("/") ? path : `/storage/${path}`;
      return `${backendOrigin}${normalized}`;
    };
    const proxiedImageUrl = (source?: string) =>
      source ? `/api/proxy-image?url=${encodeURIComponent(source)}` : "";
    const systemLogoUrl = "/tclass_logo.png";

    const idPictureUrl = proxiedImageUrl(fileUrl(selectedAdmissionDetail.id_picture_path));
    const oneByOneUrl = proxiedImageUrl(fileUrl(selectedAdmissionDetail.one_by_one_picture_path));
    const thumbmarkUrl = proxiedImageUrl(fileUrl(selectedAdmissionDetail.right_thumbmark_path));

    const learnerClassificationMarkup = PRINT_LEARNER_CLASSIFICATIONS.map((option) =>
      checkbox(isChecked(learnerClassifications, option), option)
    ).join("");
    const disabilityTypeMarkup = PRINT_DISABILITY_TYPES.map((option) =>
      checkbox(isChecked(disabilityTypes, option), option)
    ).join("");
    const disabilityCauseMarkup = PRINT_DISABILITY_CAUSES.map((option) =>
      checkbox(isChecked(disabilityCauses, option), option)
    ).join("");
    const educationalAttainmentMarkup = PRINT_EDUCATIONAL_ATTAINMENTS.map((option) =>
      checkbox(isChecked(educationalAttainment, option), option)
    ).join("");
    const uliClean = uliNumber.replace(/[^A-Za-z0-9-]/g, "").slice(0, 16);
    const uliBoxesMarkup = Array.from({ length: 16 }, (_, index) => {
      const char = uliClean[index] ?? "";
      return `<span>${escapeHtml(char)}</span>`;
    }).join("");

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>TESDA Registration Form Preview</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; background: #e5e7eb; }
      .wrapper { padding: 14px; display: flex; flex-direction: column; gap: 16px; align-items: center; }
      .page { width: 210mm; min-height: 297mm; background: #fff; border: 1px solid #111; padding: 8mm; font-size: 11px; line-height: 1.25; font-family: "Times New Roman", Times, serif; }
      .row { display: grid; gap: 6px; }
      .field { border: 1px solid #111; min-height: 18px; padding: 2px 5px; }
      .label { font-weight: 700; }
      .small { font-size: 10px; }
      .tiny { font-size: 9px; }
      .center { text-align: center; }
      .right { text-align: right; }
      .mb6 { margin-bottom: 6px; }
      .mb8 { margin-bottom: 8px; }
      .mb10 { margin-bottom: 10px; }
      .section-title { border: 1px solid #111; padding: 3px 6px; font-size: 14px; font-weight: 700; min-height: 24px; margin-bottom: 2px; }
      .line-grid { display: grid; border-left: 1px solid #111; border-top: 1px solid #111; }
      .line-grid > div { border-right: 1px solid #111; border-bottom: 1px solid #111; padding: 3px 5px; min-height: 22px; }
      .check-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-left: 1px solid #111; border-top: 1px solid #111; }
      .check-item { border-right: 1px solid #111; border-bottom: 1px solid #111; padding: 4px 6px; display: flex; align-items: flex-start; gap: 6px; min-height: 24px; }
      .cb { font-size: 13px; line-height: 1; margin-top: 1px; }
      .head-grid { display: grid; grid-template-columns: 80px 1fr 124px; border: 1px solid #111; }
      .head-grid > div { border-right: 1px solid #111; padding: 4px 8px; min-height: 54px; display: flex; align-items: center; justify-content: center; }
      .head-grid > div:last-child { border-right: 0; }
      .head-grid > div:first-child { padding: 0; }
      .logo-box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .logo-core {
        width: 100%;
        height: 100%;
        max-width: 54px;
        max-height: 54px;
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #fff;
      }
      .logo-box img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        image-rendering: -webkit-optimize-contrast;
        filter: contrast(1.06) saturate(1.06);
      }
      .head-copy { text-align: center; line-height: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .head-main { font-size: 12px; font-weight: 700; letter-spacing: 0.1px; white-space: nowrap; }
      .head-sub { margin-top: 2px; font-size: 9.8px; white-space: nowrap; }
      .head-code { text-align: center; line-height: 1.12; font-weight: 700; font-size: 11px; }
      .head-code small { display: block; margin-top: 1px; font-size: 9px; font-weight: 500; }
      .form-main-title {
        font-family: "Arial Black", Arial, Helvetica, sans-serif;
        font-weight: 800;
        text-align: center;
        letter-spacing: 0.4px;
      }
      .photo-box { border: 1px solid #111; height: 98px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .photo-box img { width: 100%; height: 100%; object-fit: cover; }
      .signature-line { border-top: 1px solid #111; padding-top: 4px; font-weight: 700; text-align: center; }
      .signature-wrap { display: grid; grid-template-columns: 1fr 190px; border: 1px solid #111; border-top: 0; min-height: 220px; }
      .signature-left { border-right: 1px solid #111; padding: 6px 8px; display: flex; flex-direction: column; }
      .sig-note { text-align: center; font-size: 10px; margin-bottom: 10px; }
      .sig-row { display: grid; grid-template-columns: 1fr 180px; gap: 10px; align-items: end; }
      .sig-row + .sig-row { margin-top: 10px; }
      .sig-cell { min-height: 56px; display: flex; flex-direction: column; justify-content: flex-end; }
      .sig-value { border-bottom: 1px solid #111; min-height: 24px; display: flex; align-items: flex-end; padding: 0 4px 2px; }
      .sig-label { text-align: center; font-size: 10px; font-weight: 700; margin-top: 3px; }
      .sig-noted { margin-top: 8px; margin-bottom: 6px; font-size: 10px; }
      .signature-right { padding: 4px; display: flex; flex-direction: column; gap: 6px; }
      .signature-right .photo-box { height: 114px; }
      .thumb-box { height: 92px !important; }
      .thumb-caption { text-align: center; font-size: 11px; font-weight: 700; }
      .page-two { font-size: 10.5px; line-height: 1.28; }
      .page-two .section-title { font-size: 13px; margin-bottom: 6px; padding: 3px 6px 6px; }
      .page-two .check-item { min-height: 30px; align-items: flex-start; padding: 4px 6px; }
      .page-two .check-item span:last-child { display: block; line-height: 1.24; }
      .page-two .line-grid > div { min-height: 26px; padding: 4px 6px; }
      .page-two .sig-note { margin-bottom: 14px; }
      .page-two .sig-row + .sig-row { margin-top: 14px; }
      .page-one { padding: 6mm; font-size: 11.5px; line-height: 1.22; }
      .page-one .section-title { font-size: 14px; padding: 3px 7px 6px; margin-bottom: 6px; }
      .page-one .line-grid > div { min-height: 26px; padding: 3px 6px; }
      .page-one .check-item { min-height: 24px; padding: 3px 6px; }
      .uli-wrap .label { margin-bottom: 6px; display: block; line-height: 1.2; }
      .uli-boxes { display: grid; grid-template-columns: repeat(16, minmax(0, 1fr)); border-left: 1px solid #111; border-top: 1px solid #111; }
      .uli-boxes span { border-right: 1px solid #111; border-bottom: 1px solid #111; text-align: center; min-height: 28px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
      .mailing-grid .mailing-tag { grid-row: 1 / span 3; display: flex; align-items: flex-start; padding-top: 6px; }
      .title-registration { font-size: 40px; margin: 10px 0 18px; min-height: 68px; padding-bottom: 8px; display: flex; align-items: center; justify-content: center; line-height: 1.03; }
      .title-learner { font-size: 24px; letter-spacing: 3px; min-height: 96px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
      .page-one .head-grid > div { min-height: 66px; }
      .page-one .logo-box { width: 100%; height: 100%; }
      .page-one .logo-core { width: 100px; height: 54px; max-width: 100px; max-height: 54px; }
      .page-one .photo-box { min-height: 118px; }
      .page-one .tiny { font-size: 10px; }
      .page-one .small { font-size: 11px; }
      .page-one .mb6 { margin-bottom: 9px; }
      .page-one .section-one-title { margin-bottom: 10px; padding-top: 4px; padding-bottom: 8px; }
      .page-one .section-two-title { margin-bottom: 8px; }
      .page-one .mb8 { margin-bottom: 12px; }
      .page-one .mb10 { margin-bottom: 14px; }
      .page-one .personal-main > div { min-height: 124px; }
      .page-one .education-grid .check-item { min-height: 30px; }
      .page-one .parent-grid > div { min-height: 34px; }
      .page-break { page-break-after: always; }
      @media print {
        body { background: #fff; }
        .wrapper { padding: 0; gap: 0; }
        .page { border: 0; width: 100%; min-height: auto; margin: 0; padding: 8mm; }
        .page-break { break-after: page; page-break-after: always; }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <section class="page page-one page-break">
        <div class="head-grid mb8">
          <div><div class="logo-box"><span class="logo-core"><img src="${escapeHtml(systemLogoUrl)}" alt="TCLASS Logo" /></span></div></div>
          <div class="head-copy">
            <div class="head-main">Technical Education and Skills Development Authority</div>
            <div class="head-sub">Pangasiwaan sa Edukasyong Teknikal at Pagpapaunlad ng Kasanayan</div>
          </div>
          <div class="head-code"><div>MIS 03 - 01</div><small>(ver. 2020)</small></div>
        </div>
        <div class="title-registration form-main-title">Registration Form</div>
        <div class="line-grid mb8" style="grid-template-columns: 1fr 190px;">
          <div class="title-learner">LEARNERS PROFILE FORM</div>
          <div>
            <div class="photo-box" style="height: 100px;">${idPictureUrl ? `<img src="${escapeHtml(idPictureUrl)}" alt="I.D. Picture" />` : "I.D. Picture"}</div>
          </div>
        </div>

        <div class="section-title section-one-title">1. T2MIS Auto Generated</div>
        <div class="line-grid mb6" style="grid-template-columns: 1fr 210px;">
          <div class="uli-wrap">
            <span class="label">1.1 Unique Learner Identifier (ULI) Number:</span>
            <div class="uli-boxes">${uliBoxesMarkup}</div>
          </div>
          <div><span class="label">1.2 Entry Date:</span> ${escapeHtml(entryDate || "-")}</div>
        </div>

        <div class="section-title section-two-title">2. Learner/Manpower Profile</div>
        <div class="line-grid" style="grid-template-columns: 1.3fr 0.9fr 0.8fr;">
          <div><span class="label">2.1 Name (Last, Extension):</span> ${escapeHtml([lastName, extensionName].filter(Boolean).join(" ") || "-")}</div>
          <div><span class="label">First:</span> ${escapeHtml(firstName || "-")}</div>
          <div><span class="label">Middle:</span> ${escapeHtml(middleName || "-")}</div>
        </div>
        <div class="line-grid mailing-grid" style="grid-template-columns: 175px 1fr 1fr 1fr;">
          <div class="mailing-tag"><span class="label">2.2 Complete Permanent Mailing Address:</span></div>
          <div><span class="label">2.2 Number/Street:</span> ${escapeHtml(numberStreet || "-")}</div>
          <div><span class="label">Barangay:</span> ${escapeHtml(barangay || "-")}</div>
          <div><span class="label">District:</span> ${escapeHtml(district || "-")}</div>
          <div><span class="label">City/Municipality:</span> ${escapeHtml(cityMunicipality || "-")}</div>
          <div><span class="label">Province:</span> ${escapeHtml(province || "-")}</div>
          <div><span class="label">Region:</span> ${escapeHtml(region || "-")}</div>
        </div>
        <div class="line-grid mb6" style="grid-template-columns: 175px 1fr 1fr 1fr;">
          <div></div>
          <div><span class="label">Email/Facebook:</span> ${escapeHtml([emailAddress, facebookAccount].filter(Boolean).join(" / ") || "-")}</div>
          <div><span class="label">Contact No:</span> ${escapeHtml(contactNo || "-")}</div>
          <div><span class="label">Nationality:</span> ${escapeHtml(nationality || "-")}</div>
        </div>

        <div class="section-title">3. Personal Information</div>
        <div class="line-grid personal-main mb6" style="grid-template-columns: 1fr 1fr 1fr;">
          <div>
            <div class="label mb6">3.1 Sex</div>
            ${checkbox(normalizeOption(sex) === normalizeOption("Male"), "Male")}
            ${checkbox(normalizeOption(sex) === normalizeOption("Female"), "Female")}
          </div>
          <div>
            <div class="label mb6">3.2 Civil Status</div>
            ${["Single", "Married", "Widow/er", "Separated", "Solo Parent"].map((item) => checkbox(isChecked(civilStatus, item), item)).join("")}
          </div>
          <div>
            <div class="label mb6">3.3 Employment Status (before the training)</div>
            ${checkbox(normalizeOption(employmentStatus) === normalizeOption("Employed"), "Employed")}
            ${checkbox(normalizeOption(employmentStatus) === normalizeOption("Unemployed"), "Unemployed")}
          </div>
        </div>
        <div class="line-grid mb6" style="grid-template-columns: 1fr 1fr 1fr 105px;">
          <div><span class="label">3.4 Month of Birth:</span> ${escapeHtml(monthOfBirth || "-")}</div>
          <div><span class="label">Day of Birth:</span> ${escapeHtml(dayOfBirth || "-")}</div>
          <div><span class="label">Year of Birth:</span> ${escapeHtml(yearOfBirth || "-")}</div>
          <div><span class="label">Age:</span> ${escapeHtml(age || "-")}</div>
        </div>
        <div class="line-grid mb6" style="grid-template-columns: 1fr 1fr 1fr;">
          <div><span class="label">3.5 Birthplace City/Municipality:</span> ${escapeHtml(birthplaceCity || "-")}</div>
          <div><span class="label">Province:</span> ${escapeHtml(birthplaceProvince || "-")}</div>
          <div><span class="label">Region:</span> ${escapeHtml(birthplaceRegion || "-")}</div>
        </div>

        <div class="section-title">3.6 Educational Attainment Before the Training (Trainee)</div>
        <div class="check-grid education-grid mb6">${educationalAttainmentMarkup}</div>

        <div class="section-title">3.7 Parent/Guardian</div>
        <div class="line-grid parent-grid" style="grid-template-columns: 1fr 1fr;">
          <div><span class="label">Name:</span> ${escapeHtml(parentGuardianName || "-")}</div>
          <div><span class="label">Complete Permanent Mailing Address:</span> ${escapeHtml(parentGuardianAddress || "-")}</div>
          <div><span class="label">Birthdate:</span> ${escapeHtml(parentGuardianBirthdate || "-")}</div>
          <div><span class="label">Relationship:</span> ${escapeHtml(parentGuardianRelationship || "-")}</div>
        </div>
      </section>

      <section class="page page-two">
        <div class="section-title">4. Learner/Trainee/Student (Clients) Classification</div>
        <div class="check-grid mb8">${learnerClassificationMarkup}</div>
        <div class="line-grid mb8" style="grid-template-columns: 1fr;">
          <div><span class="label">Others (Please Specify):</span> ${escapeHtml(learnerClassificationOthers || "-")}</div>
        </div>

        <div class="section-title">5. Type of Disability (for Persons with Disability Only)</div>
        <div class="check-grid mb8">${disabilityTypeMarkup}</div>
        <div class="line-grid mb8" style="grid-template-columns: 1fr;">
          <div><span class="label">Multiple Disabilities/Others Specify:</span> ${escapeHtml(disabilityTypeOthers || "-")}</div>
        </div>

        <div class="section-title">6. Causes of Disability (for Persons with Disability Only)</div>
        <div class="check-grid mb8">${disabilityCauseMarkup}</div>

        <div class="section-title">7. Name of Course/Qualification</div>
        <div class="line-grid mb8" style="grid-template-columns: 1fr;">
          <div>${escapeHtml(courseQualificationName || "-")}</div>
        </div>

        <div class="section-title">8. If Scholar, What Type of Scholarship Package (TWSP, PESFA, STEP, others)?</div>
        <div class="line-grid mb8" style="grid-template-columns: 1fr;">
          <div>${escapeHtml(scholarshipType || "-")}</div>
        </div>

        <div class="section-title">9. Privacy Disclaimer</div>
        <div class="line-grid mb8" style="grid-template-columns: 1fr;">
          <div>
            I hereby allow TESDA to use/post my contact details, name, email, cellphone/landline nos. and other information I provided
            which may be used for processing of my scholarship application, for employment opportunities and for the survey of TESDA programs.
            <div style="display: flex; gap: 24px; margin-top: 8px;">
              ${checkbox(normalizeOption(privacyConsent) === normalizeOption("agree"), "Agree")}
              ${checkbox(normalizeOption(privacyConsent) === normalizeOption("disagree"), "Disagree")}
            </div>
          </div>
        </div>

        <div class="section-title">10. Applicant's Signature</div>
        <div class="signature-wrap mb8">
          <div class="signature-left">
            <div class="sig-note">This is to certify that the information stated above is true and correct.</div>
            <div class="sig-row">
              <div class="sig-cell">
                <div class="sig-value" style="justify-content:center; text-align:center;">${escapeHtml(applicantSignature || " ")}</div>
                <div class="sig-label">APPLICANT'S SIGNATURE OVER PRINTED NAME</div>
              </div>
              <div class="sig-cell">
                <div class="sig-value" style="justify-content:center;">${escapeHtml(dateAccomplished || " ")}</div>
                <div class="sig-label">DATE ACCOMPLISHED</div>
              </div>
            </div>
            <div class="sig-noted">Noted by:</div>
            <div class="sig-row">
              <div class="sig-cell">
                <div class="sig-value">${escapeHtml(notedByName || " ")}</div>
                <div class="sig-label">REGISTRAR/SCHOOL ADMINISTRATOR</div>
              </div>
              <div class="sig-cell">
                <div class="sig-value" style="justify-content:center;">${escapeHtml(dateReceived || " ")}</div>
                <div class="sig-label">DATE RECEIVED</div>
              </div>
            </div>
          </div>
          <div class="signature-right">
            <div class="photo-box">
              ${oneByOneUrl ? `<img src="${escapeHtml(oneByOneUrl)}" alt="1x1 Picture" />` : `<div class="center small">1x1 picture taken<br />within the last 6 months</div>`}
            </div>
            <div class="photo-box thumb-box">
              ${thumbmarkUrl ? `<img src="${escapeHtml(thumbmarkUrl)}" alt="Right Thumbmark" />` : ""}
            </div>
            <div class="thumb-caption">Right Thumbmark</div>
          </div>
        </div>
      </section>
    </div>
  </body>
</html>`;
    setPdfPreviewHtml(html);
    setPdfPreviewOpen(true);
  }, [selectedAdmissionDetail]);
  const handleGeneratePdf = useCallback(async () => {
    const iframe = pdfPreviewFrameRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) {
      toast.error("PDF view is not ready yet.");
      return;
    }

    setGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { PDFDocument }] = await Promise.all([import("html2canvas"), import("pdf-lib")]);
      const pageNodes = Array.from(doc.querySelectorAll(".page")) as HTMLElement[];
      const targets = pageNodes.length > 0 ? pageNodes : ([doc.body] as HTMLElement[]);
      const pdf = await PDFDocument.create();
      const pointsPerMm = 72 / 25.4;
      const a4Width = 210 * pointsPerMm;
      const a4Height = 297 * pointsPerMm;

      for (let i = 0; i < targets.length; i += 1) {
        const page = targets[i];
        const pageClone = page.cloneNode(true) as HTMLElement;
        pageClone.style.position = "fixed";
        pageClone.style.left = "-10000px";
        pageClone.style.top = "0";
        pageClone.style.zIndex = "-1";
        pageClone.style.pointerEvents = "none";

        const blobToDataUrl = (blob: Blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(new Error("Failed to convert image blob to data URL."));
            reader.readAsDataURL(blob);
          });

        // Resolve all images ahead of html2canvas so broken links do not throw capture-time load errors.
        const cloneImages = Array.from(pageClone.querySelectorAll("img")) as HTMLImageElement[];
        for (const img of cloneImages) {
          const src = img.getAttribute("src") ?? "";
          if (!src) continue;
          if (src.startsWith("data:") || src.startsWith("blob:")) continue;

          try {
            const response = await fetch(src, { cache: "no-store" });
            if (!response.ok) throw new Error(`Image fetch failed (${response.status}).`);
            const blob = await response.blob();
            img.src = await blobToDataUrl(blob);
          } catch {
            const placeholder = pageClone.ownerDocument.createElement("div");
            placeholder.textContent = img.getAttribute("alt") || "Image";
            placeholder.style.display = "flex";
            placeholder.style.alignItems = "center";
            placeholder.style.justifyContent = "center";
            placeholder.style.textAlign = "center";
            placeholder.style.fontSize = "10px";
            placeholder.style.border = "1px solid #111";
            placeholder.style.width = `${img.width || 120}px`;
            placeholder.style.height = `${img.height || 90}px`;
            img.replaceWith(placeholder);
          }
        }

        doc.body.appendChild(pageClone);
        const canvas = await html2canvas(pageClone, {
          scale: 3,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          windowWidth: pageClone.scrollWidth,
          windowHeight: pageClone.scrollHeight,
        });
        pageClone.remove();

        const imgData = canvas.toDataURL("image/png");
        const bytes = Uint8Array.from(atob(imgData.split(",")[1] ?? ""), (char) => char.charCodeAt(0));
        const png = await pdf.embedPng(bytes);
        const pdfPage = pdf.addPage([a4Width, a4Height]);
        const pngRatio = png.width / png.height;
        const pageRatio = a4Width / a4Height;
        let drawWidth = a4Width;
        let drawHeight = a4Height;

        if (pngRatio > pageRatio) {
          drawHeight = a4Width / pngRatio;
        } else {
          drawWidth = a4Height * pngRatio;
        }

        const offsetX = (a4Width - drawWidth) / 2;
        const offsetY = (a4Height - drawHeight) / 2;
        pdfPage.drawImage(png, { x: offsetX, y: offsetY, width: drawWidth, height: drawHeight });
      }

      const fileNameBase = (selectedAdmissionDetail?.full_name ?? "registration-form")
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileNameBase || "registration-form"}_tesda_form.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }, [selectedAdmissionDetail]);

  const pendingAdmissions = admissions.filter((item) => item.status === "pending" && (item.application_type ?? "admission") === "admission");
  const pendingVocationals = admissions.filter((item) => item.status === "pending" && (item.application_type ?? "admission") === "vocational");
  const admissionCourseOptions = Array.from(
    new Set(pendingAdmissions.map((item) => String(item.primary_course ?? "").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const filteredPendingAdmissions =
    admissionCourseFilter === "all"
      ? pendingAdmissions
      : pendingAdmissions.filter((item) => item.primary_course === admissionCourseFilter);
  const admissionSearchTerm = admissionSearchQuery.trim().toLowerCase();
  const filteredPendingAdmissionsBySearch = admissionSearchTerm
    ? filteredPendingAdmissions.filter((item) =>
        [item.full_name, item.email, item.primary_course, item.secondary_course ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(admissionSearchTerm),
      )
    : filteredPendingAdmissions;
  const allPendingAdmissionsSelected =
    filteredPendingAdmissionsBySearch.length > 0 &&
    filteredPendingAdmissionsBySearch.every((item) => selectedAdmissionIds.includes(item.id));
  const vocationalSearchTerm = vocationalSearchQuery.trim().toLowerCase();
  const filteredPendingVocationals = vocationalSearchTerm
    ? pendingVocationals.filter((item) =>
        [item.full_name, item.email, item.primary_course, item.secondary_course ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(vocationalSearchTerm),
      )
    : pendingVocationals;
  const allPendingVocationalsSelected =
    filteredPendingVocationals.length > 0 &&
    filteredPendingVocationals.every((item) => selectedVocationalIds.includes(item.id));
  const toggleAdmissionSelection = (admissionId: number, checked: boolean) => {
    setSelectedAdmissionIds((prev) =>
      checked ? (prev.includes(admissionId) ? prev : [...prev, admissionId]) : prev.filter((id) => id !== admissionId),
    );
  };
  const toggleVocationalSelection = (admissionId: number, checked: boolean) => {
    setSelectedVocationalIds((prev) =>
      checked ? (prev.includes(admissionId) ? prev : [...prev, admissionId]) : prev.filter((id) => id !== admissionId),
    );
  };
  const toggleAllPendingAdmissions = () => {
    setSelectedAdmissionIds((prev) =>
      allPendingAdmissionsSelected
        ? prev.filter((id) => !filteredPendingAdmissionsBySearch.some((item) => item.id === id))
        : Array.from(new Set([...prev, ...filteredPendingAdmissionsBySearch.map((item) => item.id)])),
    );
  };
  const toggleAllPendingVocationals = () => {
    setSelectedVocationalIds((prev) =>
      allPendingVocationalsSelected
        ? prev.filter((id) => !filteredPendingVocationals.some((item) => item.id === id))
        : Array.from(new Set([...prev, ...filteredPendingVocationals.map((item) => item.id)])),
    );
  };
  const masterlistRows = admissions.filter((item) => (item.application_type ?? "admission") === masterlistType);
  const hasSentSchedule = (item: AdmissionApplication) =>
    Boolean(item.exam_schedule_sent_at || item.exam_schedule_payload?.sent_at);
  const masterlistCourses = Array.from(new Set(masterlistRows.filter((item) => hasSentSchedule(item)).map((item) => item.primary_course).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
  const filteredMasterlistRows = masterlistRows.filter((item) =>
    masterlistCourseFilter === "all" ? true : item.primary_course === masterlistCourseFilter
  );
  const scheduledMasterlistRows = filteredMasterlistRows.filter((item) => hasSentSchedule(item));
  const masterlistSearchTerm = masterlistSearchQuery.trim().toLowerCase();
  const filteredScheduledMasterlistRows = masterlistSearchTerm
    ? scheduledMasterlistRows.filter((item) =>
        [item.full_name, item.email, item.primary_course]
          .join(" ")
          .toLowerCase()
          .includes(masterlistSearchTerm),
      )
    : scheduledMasterlistRows;
  const getExamAttendanceStatus = (item: AdmissionApplication): ExamStatus =>
    item.exam_attendance_status ?? (item.exam_status === "not_attended" ? "not_attended" : "attended");
  const getExamResultStatus = (item: AdmissionApplication): ExamResultStatus | "unset" =>
    item.exam_status === "passed" || item.exam_status === "failed" ? item.exam_status : "unset";
  const canApproveAdmission = (item: AdmissionApplication) =>
    getExamAttendanceStatus(item) === "attended" && getExamResultStatus(item) === "passed";
  const getApprovalBlockReason = (item: AdmissionApplication) => {
    if (getExamAttendanceStatus(item) !== "attended") {
      return "Set Exam Attendance to Attended first.";
    }
    if (getExamResultStatus(item) !== "passed") {
      return "Set Exam Result to Passed first.";
    }
    return "";
  };
  const pendingApprovalRows = admissions.filter((item) => item.status === "pending");
  const readinessReady = pendingApprovalRows.filter((item) => canApproveAdmission(item)).length;
  const readinessNoAttendance = pendingApprovalRows.filter((item) => getExamAttendanceStatus(item) !== "attended").length;
  const readinessNoPassResult = pendingApprovalRows.filter(
    (item) => getExamAttendanceStatus(item) === "attended" && getExamResultStatus(item) !== "passed"
  ).length;
  const readinessTotal = Math.max(1, pendingApprovalRows.length);
  const reportSummary = useMemo(() => {
    const total = admissions.length;
    const pending = admissions.filter((item) => item.status === "pending").length;
    const approved = admissions.filter((item) => item.status === "approved").length;
    const rejected = admissions.filter((item) => item.status === "rejected").length;
    const scheduled = admissions.filter((item) => hasSentSchedule(item)).length;
    return { total, pending, approved, rejected, scheduled };
  }, [admissions]);
  const reportPrograms = useMemo(() => {
    const programMap = new Map<string, { total: number; pending: number; approved: number; rejected: number }>();
    admissions.forEach((row) => {
      const key = row.primary_course?.trim() || "Unspecified Program";
      const existing = programMap.get(key) ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
      existing.total += 1;
      if (row.status === "pending") existing.pending += 1;
      if (row.status === "approved") existing.approved += 1;
      if (row.status === "rejected") existing.rejected += 1;
      programMap.set(key, existing);
    });
    return [...programMap.entries()]
      .map(([program, counts]) => ({ program, ...counts }))
      .sort((a, b) => b.total - a.total);
  }, [admissions]);
  const reportSearchTerm = reportSearchQuery.trim().toLowerCase();
  const filteredReportPrograms = reportSearchTerm
    ? reportPrograms.filter((row) => row.program.toLowerCase().includes(reportSearchTerm))
    : reportPrograms;
  const universalTerm = universalSearchQuery.trim().toLowerCase();
  const matchedUsers = universalTerm
    ? users
        .filter(
          (user) =>
            user.name.toLowerCase().includes(universalTerm) ||
            user.email.toLowerCase().includes(universalTerm) ||
            user.role.toLowerCase().includes(universalTerm)
        )
    : [];
  const matchedDepartments = universalTerm
    ? departments
        .filter(
          (department) =>
            department.name.toLowerCase().includes(universalTerm) ||
            department.head.toLowerCase().includes(universalTerm)
        )
    : [];
  const matchedAdmissions = universalTerm
    ? admissions
        .filter((item) =>
          [
            item.full_name,
            item.email,
            item.primary_course,
            item.secondary_course ?? "",
            item.application_type ?? "admission",
          ]
            .join(" ")
            .toLowerCase()
            .includes(universalTerm)
        )
    : [];
  const matchedCourseTrends = universalTerm
    ? courseTrends
        .filter((trend) => trend.course.toLowerCase().includes(universalTerm))
    : [];
  const matchedVocationalTrends = universalTerm
    ? vocationalTrends
        .filter((trend) => trend.program.toLowerCase().includes(universalTerm))
    : [];
  const searchedCourses = useMemo(() => {
    const q = normalizeSearchValue(courseSearchQuery);
    if (!q) return departments;
    const queryTokens = q.split(" ").filter(Boolean);
    return departments.filter((dept) => {
      const searchable = normalizeSearchValue(`${dept.name} ${dept.students} ${dept.students === 1 ? "student" : "students"}`);
      return queryTokens.every((token) => searchable.includes(token));
    });
  }, [departments, courseSearchQuery]);
  const totalUniversalMatches =
    matchedUsers.length +
    matchedDepartments.length +
    matchedAdmissions.length +
    matchedCourseTrends.length +
    matchedVocationalTrends.length;

  const openUserFromUniversalSearch = (user: UserItem) => {
    const roleFilter: "student" | "faculty" | "admin" =
      user.role === "Faculty" ? "faculty" : user.role === "Admin" ? "admin" : "student";
    setUserRoleFilter(roleFilter);
    navigateToAdminTab("users");
    setSearchQuery(user.name);
    setMobileSearchOpen(false);
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1280) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) {
      setUniversalSearchQuery("");
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleApproveAdmission = async (id: number) => {
    const target = admissions.find((item) => item.id === id);
    if (!target || !canApproveAdmission(target)) {
      toast.error(target ? getApprovalBlockReason(target) : "Applicant not found.");
      return;
    }
    setApprovingAdmissionId(id);
    try {
      const response = await apiFetch(`/admin/admissions/${id}/approve`, { method: "POST" });
      const preview = (response as { credentials_preview?: { student_number: string; temporary_password: string }; message?: string }).credentials_preview;
      const approved = admissions.find((a) => a.id === id);
      if (preview && approved) {
        setRecentCredentials((rows) => [
          {
            fullName: approved.full_name,
            email: approved.email,
            studentNumber: preview.student_number,
            temporaryPassword: preview.temporary_password,
          },
          ...rows,
        ]);
      }
      toast.success((response as { message?: string }).message ?? "Admission approved.");
      await loadAdmissions({ force: true });
      await loadDashboardStats({ force: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve admission.");
    } finally {
      setApprovingAdmissionId(null);
    }
  };

  const openRejectAdmissionModal = (id: number) => {
    setRejectingAdmissionId(id);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleRejectAdmission = async () => {
    if (!rejectingAdmissionId) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    setSubmittingReject(true);
    try {
      const response = await apiFetch(`/admin/admissions/${rejectingAdmissionId}/reject`, {
        method: "POST",
        body: JSON.stringify({ remarks: rejectionReason.trim() }),
      });
      toast.error((response as { message?: string }).message ?? "Admission rejected.");
      setRejectModalOpen(false);
      setRejectingAdmissionId(null);
      setRejectionReason("");
      await loadAdmissions({ force: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject admission.");
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleMarkMessageAsRead = async (messageId: number) => {
    const message = contactMessages.find((item) => item.id === messageId);
    if (!message) {
      toast.error("Message not found.");
      return;
    }

    if (!message.is_read) {
      try {
        await apiFetch(`/admin/contact-messages/${messageId}/read`, { method: "PATCH" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to mark message as read.");
        return;
      }
      setContactMessages((rows) =>
        rows.map((row) =>
          row.id === messageId
            ? { ...row, is_read: true, read_at: row.read_at ?? new Date().toISOString() }
            : row
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    setSelectedMessageThread(null);
    setActiveMessagePreview((current) =>
      current && current.id === messageId
        ? { ...current, is_read: true, read_at: current.read_at ?? new Date().toISOString() }
        : current
    );
    toast.success("Message marked as read.");
  };

  const handleArchiveMessage = (messageId: number) => {
    const target = contactMessages.find((item) => item.id === messageId);
    if (!target) {
      toast.error("Message not found.");
      return;
    }

    setContactMessages((rows) => rows.filter((row) => row.id !== messageId));
    if (!target.is_read) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setSelectedMessageThread(null);
    setActiveMessagePreview((current) => (current && current.id === messageId ? null : current));
    toast.success("Message archived.");
  };

  const openReplyComposer = (message: ContactMessageItem) => {
    setReplyTarget(message);
    setReplySubject("Re: Your inquiry to TCLASS");
    setReplyBody(`Hi ${message.first_name || message.full_name},\n\nThank you for your message.\n\n`);
    setReplyComposerOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyTarget) return;
    const subject = replySubject.trim();
    const message = replyBody.trim();

    if (!subject || !message) {
      toast.error("Subject and reply message are required.");
      return;
    }

    setSendingReply(true);
    try {
      await apiFetch(`/admin/contact-messages/${replyTarget.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ subject, message }),
      });

      setReplyComposerOpen(false);
      setReplyTarget(null);
      setReplySubject("");
      setReplyBody("");

      setContactMessages((rows) =>
        rows.map((row) =>
          row.id === replyTarget.id
            ? { ...row, is_read: true, read_at: row.read_at ?? new Date().toISOString() }
            : row
        )
      );
      setUnreadCount((count) => Math.max(0, count - (replyTarget.is_read ? 0 : 1)));
      setSelectedMessageThread((current) =>
        current && current.id === replyTarget.id
          ? { ...current, is_read: true, read_at: current.read_at ?? new Date().toISOString() }
          : current
      );
      setActiveMessagePreview((current) =>
        current && current.id === replyTarget.id
          ? { ...current, is_read: true, read_at: current.read_at ?? new Date().toISOString() }
          : current
      );

      toast.success("Reply sent successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const loadUsers = useCallback(
    async ({ role = userRoleFilter, force = false }: { role?: "student" | "faculty" | "admin"; force?: boolean } = {}) => {
      if (!force && usersLoadedRef.current[role]) {
        const sessionEmail = sessionUser?.email?.toLowerCase() ?? "";
        const cachedRows = usersCacheRef.current[role].map((row) => ({
          ...row,
          status: (sessionEmail && row.email.toLowerCase() === sessionEmail ? "active" : "inactive") as UserItem["status"],
        }));
        usersCacheRef.current[role] = cachedRows;
        setUsers(cachedRows);
        return;
      }
      if (usersLoadingRef.current[role]) return;

      usersLoadingRef.current[role] = true;
      setLoadingUsers(true);
      try {
        const candidates = [`/admin/users?role=${role}`, "/admin/users"];
        let loaded: UserItem[] = [];
        for (const path of candidates) {
          try {
            const response = await apiFetch(path);
            const rows = extractUserRows(response);
            if (rows.length > 0) {
              if (path === "/admin/users") {
                const filteredByRole = rows.filter((row) => {
                  const normalizedRole = (row.role ?? "").toLowerCase();
                  return normalizedRole === role;
                });
                loaded = normalizeUsers(filteredByRole);
              } else {
                loaded = normalizeUsers(rows);
              }
              break;
            }
          } catch {
            continue;
          }
        }
        const sessionEmail = sessionUser?.email?.toLowerCase() ?? "";
        const withDynamicStatus: UserItem[] = loaded.map((row) => ({
          ...row,
          status: (sessionEmail && row.email.toLowerCase() === sessionEmail ? "active" : "inactive") as UserItem["status"],
        }));
        usersCacheRef.current[role] = withDynamicStatus;
        usersLoadedRef.current[role] = true;
        if (role === userRoleFilter) {
          setUsers(withDynamicStatus);
        }
      } catch {
        if (role === userRoleFilter) {
          setUsers([]);
        }
      } finally {
        usersLoadingRef.current[role] = false;
        if (role === userRoleFilter) {
          setLoadingUsers(false);
        }
      }
    },
    [sessionUser?.email, userRoleFilter]
  );

  useEffect(() => {
    if (activeAdminTab !== "users") {
      return;
    }
    void loadUsers();
  }, [activeAdminTab, loadUsers]);

  useEffect(() => {
    if (!admissionsTabActive) {
      return;
    }
    let alive = true;
    setLoadingAdmissions(true);
    apiFetch("/admin/admissions")
      .then((response) => {
        if (!alive) return;
        const rows = (response as { applications?: AdmissionApplication[] }).applications ?? [];
        setAdmissions(rows);
      })
      .catch((error) => {
        if (!alive) return;
        toast.error(error instanceof Error ? error.message : "Failed to load admissions.");
      })
      .finally(() => {
        if (alive) {
          setLoadingAdmissions(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [admissionsTabActive]);

  useEffect(() => {
    if (!showNotifications && !allMessagesOpen) {
      return;
    }
    let alive = true;

    const fetchMessages = async (silent = false) => {
      if (!silent) {
        setLoadingMessages(true);
      }
      try {
        const response = await apiFetch("/admin/contact-messages?limit=20");
        if (!alive) return;
        const payload = response as ContactMessagesPayload;
        const rows = payload.messages ?? [];
        setContactMessages(rows);
        setUnreadCount(Number(payload.unread_count ?? rows.filter((row) => !row.is_read).length));
      } catch (error) {
        if (!alive) return;
        if (!silent) {
          toast.error(error instanceof Error ? error.message : "Failed to load contact messages.");
        }
      } finally {
        if (alive && !silent) {
          setLoadingMessages(false);
        }
      }
    };

    void fetchMessages(false);
    const timer = window.setInterval(() => {
      void fetchMessages(true);
    }, 60000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [allMessagesOpen, showNotifications]);

  const openMasterlist = (type: AdmissionType) => {
    setMasterlistType(type);
    setMasterlistCourseFilter("all");
    navigateToAdminTab(type === "admission" ? "admissions-masterlist" : "vocationals-masterlist");
  };

  const openScheduleModalForSelection = (type: AdmissionType) => {
    const selectedIds = type === "admission" ? selectedAdmissionIds : selectedVocationalIds;
    const pendingRows = type === "admission" ? pendingAdmissions : pendingVocationals;
    const selectedRows = pendingRows.filter((item) => selectedIds.includes(item.id));
    const unscheduledRows = selectedRows.filter((item) => !hasSentSchedule(item));

    if (selectedRows.length === 0) {
      toast.error("Select at least one applicant first.");
      return;
    }
    if (unscheduledRows.length === 0) {
      toast.error("All selected applicants already have sent schedules.");
      return;
    }

    const payload = unscheduledRows[0]?.exam_schedule_payload ?? {};
    setScheduleRecipientType(type);
    setScheduleRecipientIds(unscheduledRows.map((item) => item.id));
    setScheduleForm({
      subject: payload.subject || "Entrance Exam Schedule Invitation - TCLASS",
      intro_message:
        payload.intro_message ||
        "You have been invited to take the entrance examination for your application at TCLASS. Please review the schedule details below and arrive on time.",
      exam_date: payload.exam_date || "",
      exam_time: payload.exam_time || "",
      exam_day: payload.exam_day || "",
      location: payload.location || "TCLASS Campus / Admissions Office",
      things_to_bring:
        payload.things_to_bring ||
        "1. Valid ID\n2. Ballpen (black or blue)\n3. Printed/phone copy of this email invitation",
      attire_note:
        payload.attire_note ||
        "Please wear proper attire. Avoid sleeveless tops, shorts, and slippers.",
      additional_note: payload.additional_note || "",
    });
    setScheduleModalOpen(true);
  };

  const openAdmissionDetail = (application: AdmissionApplication) => {
    setSelectedAdmissionDetail(application);
    setAdmissionDetailOpen(true);
  };

  const handleSendExamSchedule = async () => {
    if (scheduleRecipientIds.length === 0) {
      toast.error("No selected recipients found.");
      return;
    }
    if (!scheduleForm.exam_date.trim() || !scheduleForm.exam_time.trim() || !scheduleForm.exam_day.trim()) {
      toast.error("Please provide the exam date, time, and day.");
      return;
    }
    if (!scheduleForm.location.trim() || !scheduleForm.things_to_bring.trim()) {
      toast.error("Please complete the location and things-to-bring fields.");
      return;
    }

    setSendingSchedule(true);
    try {
      const payload = {
        ...scheduleForm,
        subject: scheduleForm.subject.trim(),
        intro_message: scheduleForm.intro_message.trim(),
        exam_date: scheduleForm.exam_date.trim(),
        exam_time: scheduleForm.exam_time.trim(),
        exam_day: scheduleForm.exam_day.trim(),
        location: scheduleForm.location.trim(),
        things_to_bring: scheduleForm.things_to_bring.trim(),
        attire_note: scheduleForm.attire_note.trim() || null,
        additional_note: scheduleForm.additional_note.trim() || null,
      };

      const results = await Promise.allSettled(
        scheduleRecipientIds.map((id) =>
          apiFetch(`/admin/admissions/${id}/send-exam-schedule`, {
            method: "POST",
            body: JSON.stringify(payload),
          }),
        ),
      );
      const sentCount = results.filter((result) => result.status === "fulfilled").length;
      const failedCount = results.length - sentCount;

      if (sentCount > 0) {
        toast.success(`Schedule sent to ${sentCount} selected applicant${sentCount > 1 ? "s" : ""}.`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} applicant${failedCount > 1 ? "s were" : " was"} not sent.`);
      }

      setScheduleModalOpen(false);
      setScheduleRecipientIds([]);
      if (scheduleRecipientType === "admission") {
        setSelectedAdmissionIds((prev) => prev.filter((id) => !scheduleRecipientIds.includes(id)));
      } else {
        setSelectedVocationalIds((prev) => prev.filter((id) => !scheduleRecipientIds.includes(id)));
      }
      await loadAdmissions({ force: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send exam schedule.");
    } finally {
      setSendingSchedule(false);
    }
  };

  const handleUpdateExamResult = async (id: number, examResult: ExamResultStatus) => {
    setUpdatingExamStatusId(id);
    try {
      await apiFetch(`/admin/admissions/${id}/exam-status`, {
        method: "PATCH",
        body: JSON.stringify({ exam_status: examResult, exam_attendance_status: "attended" }),
      });
      setAdmissions((prev) =>
        prev.map((row) => (row.id === id ? { ...row, exam_status: examResult, exam_attendance_status: "attended" } : row)),
      );
      toast.success("Exam result updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update exam result.");
    } finally {
      setUpdatingExamStatusId(null);
    }
  };

  const handleUpdateAttendanceStatus = async (id: number, attendanceStatus: ExamStatus) => {
    setUpdatingExamStatusId(id);
    try {
      const body =
        attendanceStatus === "not_attended"
          ? { exam_attendance_status: "not_attended", exam_status: "not_attended" }
          : { exam_attendance_status: "attended" };

      await apiFetch(`/admin/admissions/${id}/exam-status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      setAdmissions((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          if (attendanceStatus === "not_attended") {
            return { ...row, exam_attendance_status: "not_attended", exam_status: "not_attended" };
          }
          return { ...row, exam_attendance_status: "attended" };
        }),
      );

      toast.success("Exam attendance status updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update exam attendance status.");
    } finally {
      setUpdatingExamStatusId(null);
    }
  };

  const sessionName = sessionUser?.name?.trim() || "Administrator";
  const sessionEmail = sessionUser?.email?.trim() || "admin@tclass.local";
  const sessionRole = (sessionUser?.role ?? "admin").toLowerCase();
  const sessionRoleLabel = sessionRole === "faculty" ? "Faculty Portal" : sessionRole === "student" ? "Student Portal" : "Admin Portal";
  const sessionInitials = sessionName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

  return (
    <div className="admin-page flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="hidden xl:flex xl:w-64 xl:flex-col xl:border-r xl:border-slate-200/80 xl:bg-white xl:dark:border-white/10 xl:dark:bg-slate-900">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/80 px-4 py-5 dark:border-white/10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-20 w-20 ring-4 ring-blue-100 ring-offset-2 shadow-lg dark:ring-blue-900/50 dark:ring-offset-slate-900">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">
                  {sessionInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{sessionName}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{sessionEmail}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">System Management</p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {sessionRoleLabel}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
            <div className="space-y-1">
              <Link
                href={getAdminTabHref("users")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeAdminTab === "users"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                <School className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href={getAdminTabHref("reports")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeAdminTab === "reports"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Reports
              </Link>
              <Link
                href="/admin/enrollments"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <BookOpen className="h-4 w-4" />
                Enrollments
              </Link>
              <Link
                href="/admin/class-scheduling"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <Calendar className="h-4 w-4" />
                Class Scheduling
              </Link>
              <Link
                href="/admin/curriculum"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <FileText className="h-4 w-4" />
                Curriculum
              </Link>
            </div>

            <div className="space-y-1 border-t border-slate-200/80 pt-3 dark:border-white/10">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Management
              </p>
              <Link
                href={getAdminTabHref("departments")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeAdminTab === "departments"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Departments
              </Link>
              <Link
                href={getAdminTabHref("admissions")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  admissionsSectionActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Admissions
              </Link>
              <div className="pl-9">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs transition-colors ${
                    activeAdminTab === "admissions-masterlist"
                      ? "text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/15 dark:hover:text-blue-200"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  }`}
                  onClick={() => {
                    openMasterlist("admission");
                  }}
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  View List
                </Button>
              </div>
              <Link
                href={getAdminTabHref("vocationals")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  vocationalsSectionActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Vocationals
              </Link>
              <div className="pl-9">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs transition-colors ${
                    activeAdminTab === "vocationals-masterlist"
                      ? "text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/15 dark:hover:text-blue-200"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  }`}
                  onClick={() => {
                    openMasterlist("vocational");
                  }}
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  View List
                </Button>
              </div>
            </div>
          </nav>

          <div className="border-t border-slate-200/80 px-4 py-3 dark:border-white/10">
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">@2026 Copyright · v1.0.0</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
        <div className="px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative shrink-0">
                <div className="absolute inset-1 rounded-full bg-blue-500/20 blur-md" />
                <Image
                  src="/tclass_logo.png"
                  alt="TClass Logo"
                  width={56}
                  height={56}
                  className="relative block h-14 w-14 object-contain drop-shadow-sm"
                />
              </div>
              <div className="hidden min-w-0 flex-col md:flex">
                <span className="truncate text-xl font-black leading-tight tracking-[-0.01em] text-slate-900 dark:text-slate-100">
                  Tarlac Center for Learning and Skills Success
                </span>
              </div>
              <span className="hidden text-sm font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-100 sm:block md:hidden">
                TCLASS
              </span>
            </div>

            <div className="flex-1" />

            {/* Right Section */}
            <div className="flex items-center gap-2 xl:gap-3 shrink-0">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={headerSearchPlaceholder}
                  className="w-44 rounded-full border-slate-200 bg-slate-50/90 pl-9 text-slate-700 placeholder:text-slate-500 focus-visible:bg-white lg:w-48 xl:w-56 2xl:w-64 dark:border-white/15 dark:bg-slate-900/85 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:bg-slate-900"
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                />
              </div>
              {!mobileMenuOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full border border-transparent text-slate-600 transition-colors hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-white/15 dark:hover:bg-white/10"
                  onClick={() => {
                    setShowNotifications(false);
                    setMobileSearchOpen(true);
                  }}
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
              <div className="relative">
                {!mobileMenuOpen && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative rounded-full border border-transparent text-slate-600 transition-colors hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-white/15 dark:hover:bg-white/10"
                    onClick={async () => {
                      const next = !showNotifications;
                      setShowNotifications(next);
                      if (next) {
                        await loadContactMessages(true);
                      }
                    }}
                  >
                    <MessageSquare className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-[11px] font-semibold text-white flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Button>
                )}
                
                {/* Notifications Dropdown */}
                {showNotifications && !mobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-neutral-50 shadow-xl z-50 dark:border-slate-700 dark:bg-slate-950">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Messages</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                          onClick={handleClearNotifications}
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </Button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-700 dark:scrollbar-track-slate-800/50">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                      ) : latestConversationThreads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <Inbox className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">No messages yet</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Messages will appear here</p>
                        </div>
                      ) : (
                        latestConversationThreads.map((thread) => {
                          const msg = thread.latest;
                          return (
                          <button
                            key={msg.email.toLowerCase()}
                            type="button"
                            onClick={() => {
                              setShowNotifications(false);
                              setAllMessagesOpen(true);
                              setSelectedMessageThread(msg);
                            }}
                            className={`group flex w-full items-start gap-2.5 p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 ${
                              thread.unreadCount > 0 ? "bg-blue-50 dark:bg-blue-950/30" : "bg-transparent"
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              thread.unreadCount > 0 
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}>
                              {msg.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`truncate text-xs ${thread.unreadCount > 0 ? "font-semibold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                                  {msg.full_name}
                                </p>
                                {thread.unreadCount > 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{msg.email}</p>
                                {thread.messages.length > 1 && (
                                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                    {thread.messages.length} msgs
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{msg.message}</p>
                              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{formatRelativeTime(msg.created_at)}</p>
                            </div>
                          </button>
                        );
                      })
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-900/60 rounded-b-lg">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-300 dark:border-slate-700"
                        onClick={async () => {
                          await loadContactMessages(false, 100);
                          setAllMessagesOpen(true);
                          setShowNotifications(false);
                        }}
                      >
                        View all messages
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{now ? now.toLocaleTimeString() : "--:--:--"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{now ? now.toLocaleDateString() : "---"}</p>
              </div>
              <div className="hidden h-5 w-px bg-slate-200 dark:bg-white/10 sm:block" />
              
              <div className="hidden sm:flex items-center gap-2">
                <AvatarActionsMenu
                  initials={sessionInitials}
                  onLogout={handleLogout}
                  onSettings={() => handleNavClick("Settings")}
                  name={sessionName}
                  subtitle={sessionEmail}
                  triggerName={sessionName}
                  triggerSubtitle={sessionEmail}
                  triggerId="admin-avatar-menu-trigger"
                  triggerClassName="rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10"
                  fallbackClassName="bg-blue-600 text-white"
                />
              </div>
              {!mobileMenuOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="xl:hidden text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  onClick={() => {
                    setShowNotifications(false);
                    setMobileSearchOpen(false);
                    setMobileMenuOpen(true);
                  }}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-[120] xl:hidden transition-[visibility] duration-300 ${
          mobileMenuOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          aria-label="Close sidebar"
          className={`absolute inset-0 bg-slate-950/62 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin mobile navigation"
          className={`absolute left-0 top-0 h-full w-[84%] max-w-[21rem] border-r border-slate-200 bg-white shadow-[0_26px_65px_rgba(15,23,42,0.32)] transition-transform duration-300 ease-out dark:border-white/15 dark:bg-slate-950 dark:shadow-[0_26px_65px_rgba(0,0,0,0.65)] ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-white/15">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 p-2 shadow-md">
                  <School className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">TClass</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Admin Portal</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="border-b border-slate-200 px-3 pb-3 pt-3 dark:border-white/10">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/15 dark:bg-slate-900">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Theme</span>
                <ThemeIconButton />
              </div>
            </div>

            <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
              Navigation
            </p>
            <div className="flex-1 space-y-1.5 overflow-y-auto px-2 pb-4">
              <button
                onClick={() => setAdminTabFromMobile("users")}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeAdminTab === "users"
                    ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400/70 dark:bg-blue-500"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="h-4 w-4" />
                Users
              </button>
              <button
                onClick={() => setAdminTabFromMobile("reports")}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeAdminTab === "reports"
                    ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400/70 dark:bg-blue-500"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Reports
              </button>
              <button
                onClick={() => setAdminTabFromMobile("departments")}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeAdminTab === "departments"
                    ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400/70 dark:bg-blue-500"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Departments
              </button>
              <button
                onClick={() => setAdminTabFromMobile("admissions")}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  admissionsSectionActive
                    ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400/70 dark:bg-blue-500"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Admissions
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`ml-7 h-7 justify-start px-2 text-xs transition-colors ${
                  activeAdminTab === "admissions-masterlist"
                    ? "text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/15 dark:hover:text-blue-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
                }`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openMasterlist("admission");
                }}
              >
                <Users className="mr-1.5 h-3.5 w-3.5" />
                View List
              </Button>
              <button
                onClick={() => setAdminTabFromMobile("vocationals")}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  vocationalsSectionActive
                    ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400/70 dark:bg-blue-500"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Vocationals
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`ml-7 h-7 justify-start px-2 text-xs transition-colors ${
                  activeAdminTab === "vocationals-masterlist"
                    ? "text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/15 dark:hover:text-blue-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
                }`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openMasterlist("vocational");
                }}
              >
                <Users className="mr-1.5 h-3.5 w-3.5" />
                View List
              </Button>
              <Link
                href="/admin/enrollments"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <BookOpen className="h-4 w-4" />
                Enrollments
              </Link>
              <Link
                href="/admin/class-scheduling"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <Calendar className="h-4 w-4" />
                Class Scheduling
              </Link>
            </div>

            <div className="border-t border-slate-200 p-3 dark:border-white/15">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent className="flex h-[62vh] min-h-[24rem] w-[95vw] max-w-xl flex-col overflow-hidden border border-blue-200/70 bg-white p-0 shadow-2xl dark:border-blue-900/70 dark:bg-slate-950">
          <DialogHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-4 dark:border-blue-900/40 dark:from-blue-950/45 dark:to-cyan-950/30">
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Search</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              Search users, departments, admissions, and trends.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                value={universalSearchQuery}
                onChange={(e) => setUniversalSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="h-11 rounded-xl border-slate-300 bg-slate-50 pl-9 text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  navigateToAdminTab("users");
                  setMobileSearchOpen(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Users
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateToAdminTab("departments");
                  setMobileSearchOpen(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Departments
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateToAdminTab("admissions");
                  setMobileSearchOpen(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Admissions
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateToAdminTab("vocationals");
                  setMobileSearchOpen(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Vocationals
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  router.push("/admin/enrollments");
                }}
                className="col-span-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Enrollments
              </button>
            </div>

            <div className="flex-1 min-h-[11rem] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-slate-900/50">
              {universalTerm ? (
                totalUniversalMatches === 0 ? (
                <p className="px-2 py-4 text-sm text-slate-600 dark:text-slate-300">No matches found for &quot;{universalSearchQuery}&quot;.</p>
              ) : (
                <div className="space-y-3">
                  {matchedUsers.length > 0 && (
                    <div>
                      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Users</p>
                      <div className="max-h-[10.5rem] space-y-1 overflow-y-auto pr-1">
                        {matchedUsers.map((user) => (
                          <button
                            key={`universal-user-${user.id}`}
                            type="button"
                            onClick={() => openUserFromUniversalSearch(user)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedDepartments.length > 0 && (
                    <div>
                      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Departments</p>
                      <div className="max-h-[10.5rem] space-y-1 overflow-y-auto pr-1">
                        {matchedDepartments.map((department) => (
                          <button
                            key={`universal-department-${department.id}`}
                            type="button"
                            onClick={() => {
                              navigateToAdminTab("departments");
                              setMobileSearchOpen(false);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{department.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Head: {department.head}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedAdmissions.length > 0 && (
                    <div>
                      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Admissions</p>
                      <div className="max-h-[10.5rem] space-y-1 overflow-y-auto pr-1">
                        {matchedAdmissions.map((item) => {
                          const targetTab = (item.application_type ?? "admission") === "vocational" ? "vocationals" : "admissions";
                          return (
                            <button
                              key={`universal-admission-${item.id}`}
                              type="button"
                              onClick={() => {
                                navigateToAdminTab(targetTab);
                                setMobileSearchOpen(false);
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                            >
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.full_name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {(item.application_type ?? "admission") === "vocational" ? "Vocational" : "Admission"} â€¢ {item.primary_course}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {matchedCourseTrends.length > 0 && (
                    <div>
                      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">College Trends</p>
                      <div className="max-h-[10.5rem] space-y-1 overflow-y-auto pr-1">
                        {matchedCourseTrends.map((trend) => (
                          <button
                            key={`universal-course-${trend.course}`}
                            type="button"
                            onClick={() => {
                              setSelectedTrendCourse(trend);
                              setSelectedYearLevel(null);
                              setCourseTrendModalOpen(true);
                              setMobileSearchOpen(false);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{trend.course}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{trend.total} students</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedVocationalTrends.length > 0 && (
                    <div>
                      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Vocational Trends</p>
                      <div className="max-h-[10.5rem] space-y-1 overflow-y-auto pr-1">
                        {matchedVocationalTrends.map((trend) => (
                          <button
                            key={`universal-vocational-${trend.program}`}
                            type="button"
                            onClick={() => {
                              setSelectedVocational(trend);
                              setSelectedVocationalBatch(null);
                              setVocationalModalOpen(true);
                              setMobileSearchOpen(false);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{trend.program}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{trend.total} trainees</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <p className="px-2 py-4 text-sm text-slate-500 dark:text-slate-400">
                  Search results will appear here.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setMobileSearchOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth pb-24 sm:pb-0">
        <div className="px-4 pt-6 pb-24 sm:px-6 sm:pb-6">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of school operations and management.</p>
        </div>

        {activeAdminTab === "users" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.02em] text-slate-600">Students</p>
                    {loadingStats ? (
                      <Skeleton className="mt-2 h-6 w-12 rounded-full" />
                    ) : (
                      <p className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalStudents}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.02em] text-slate-600">Faculty</p>
                    {loadingStats ? (
                      <Skeleton className="mt-2 h-6 w-12 rounded-full" />
                    ) : (
                      <p className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalFaculty}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.02em] text-slate-600">Classes</p>
                    {loadingStats ? (
                      <Skeleton className="mt-2 h-6 w-12 rounded-full" />
                    ) : (
                      <p className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalClasses}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.02em] text-slate-600">Departments</p>
                    {loadingStats ? (
                      <Skeleton className="mt-2 h-6 w-12 rounded-full" />
                    ) : (
                      <p className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalDepartments}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${activeAdminTab === "users" ? "lg:grid-cols-3" : ""}`}>
          {/* Main Content */}
          <div className={activeAdminTab === "users" ? "lg:col-span-2 space-y-5 sm:space-y-6" : "space-y-5 sm:space-y-6"}>
            <Tabs value={activeAdminTab} onValueChange={(value) => navigateToAdminTab(value as AdminSectionTab)} className="w-full">

              <TabsContent value="users" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle>Recent Users</CardTitle>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="w-full sm:w-56">
                          <Select value={userRoleFilter} onValueChange={(value: "student" | "faculty" | "admin") => setUserRoleFilter(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="faculty">Faculty</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 gap-1.5 rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/25 transition-colors hover:bg-blue-700 focus-visible:ring-blue-400/60"
                          onClick={() => setAddUserOpen(true)}
                        >
                          <UserPlus className="h-4 w-4" />
                          Add 
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="hidden h-9 rounded-lg border border-blue-200 bg-blue-50 px-3.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20 md:inline-flex"
                          onClick={() => setViewAllAccountsOpen(true)}
                        >
                          View all
                        </Button>
                      </div>
                    </div>
                    <div>
                      <CardDescription>
                        Showing {userRoleFilter} accounts based on selected category.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {searchQuery && (
                      <p className="text-sm text-slate-500 mb-4">
                        Showing {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                      </p>
                    )}
                    <div className="space-y-3 md:hidden">
                      {loadingUsers ? (
                        <div className="rounded-lg border border-slate-200 px-4 py-4 dark:border-slate-700">
                          <div className="space-y-3">
                            {Array.from({ length: 2 }, (_, index) => (
                              <div key={`mobile-user-skeleton-${index}`} className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/30">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-9 w-9 rounded-full" />
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-52" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <p className="rounded-lg border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">No users found.</p>
                      ) : filteredUsers.slice(0, 1).map((user) => (
                        <div key={user.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/30">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs bg-slate-100">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                              <p className="truncate text-xs text-slate-500">{user.email}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant={user.role === 'Student' ? 'secondary' : 'default'}>
                                  {user.role}
                                </Badge>
                                <span className={user.status === 'active' ? 'text-green-600' : 'text-amber-600'}>
                                  {user.status}
                                </span>
                                <span className="text-slate-500">{user.joined}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!loadingUsers && filteredUsers.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full md:hidden"
                        onClick={() => setViewAllAccountsOpen(true)}
                      >
                        View all
                      </Button>
                    )}
                    <div className="hidden md:block w-full overflow-x-auto">
                      <Table className="min-w-[700px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingUsers ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                                <div className="space-y-2">
                                  <Skeleton className="mx-auto h-4 w-48" />
                                  <Skeleton className="mx-auto h-4 w-36" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                                No users found.
                              </TableCell>
                            </TableRow>
                          ) : filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-slate-100">
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-slate-900">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.role === 'Student' ? 'secondary' : 'default'}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {user.status === 'active' ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className={user.status === 'active' ? 'text-green-600' : 'text-amber-600'}>
                                    {user.status}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-500">{user.joined}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>Live admin metrics and program-level admissions summary.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="rounded-lg border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">Total Submissions</p>
                          <p className="text-2xl font-bold text-slate-900">{reportSummary.total}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">Pending</p>
                          <p className="text-2xl font-bold text-amber-700">{reportSummary.pending}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">Approved</p>
                          <p className="text-2xl font-bold text-emerald-700">{reportSummary.approved}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">Rejected</p>
                          <p className="text-2xl font-bold text-rose-700">{reportSummary.rejected}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                          <p className="text-xs uppercase text-slate-500">Schedule Sent</p>
                          <p className="text-2xl font-bold text-sky-700">{reportSummary.scheduled}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <p className="font-semibold text-slate-900">Program Breakdown</p>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Program</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Pending</TableHead>
                                <TableHead>Approved</TableHead>
                                <TableHead>Rejected</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loadingAdmissions && (
                                <TableRow>
                                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                                    <div className="space-y-2">
                                      <Skeleton className="mx-auto h-4 w-52" />
                                      <Skeleton className="mx-auto h-4 w-40" />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                              {!loadingAdmissions && filteredReportPrograms.map((row) => (
                                <TableRow key={row.program}>
                                  <TableCell className="font-medium">{row.program}</TableCell>
                                  <TableCell>{row.total}</TableCell>
                                  <TableCell>{row.pending}</TableCell>
                                  <TableCell>{row.approved}</TableCell>
                                  <TableCell>{row.rejected}</TableCell>
                                </TableRow>
                              ))}
                              {!loadingAdmissions && filteredReportPrograms.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                                    No admissions data available yet.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="departments" className="mt-6">
                <Card className="h-[460px] lg:h-[520px] flex flex-col">
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="w-full sm:max-w-md">
                        <CardTitle>Courses</CardTitle>
                        <CardDescription>Total student population per course</CardDescription>
                        <div className="mt-3">
                          <Input
                            placeholder="Search courses..."
                            value={courseSearchQuery}
                            onChange={(e) => setCourseSearchQuery(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0">
                    <div className="h-full space-y-4 overflow-y-auto pr-1">
                      {loadingDepartments ? (
                        Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={`department-skeleton-${index}`}
                            className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <Skeleton className="h-12 w-12 rounded-lg" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Skeleton className="h-6 w-16 rounded-full" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        ))
                      ) : searchedCourses.map((dept) => (
                        <div key={dept.id} className="flex flex-col gap-3 p-3 sm:p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                            </div>
                          </div>
                          <div className="grid w-full grid-cols-1 gap-3 text-sm sm:w-auto">
                            <div className="text-center">
                              <p className="font-semibold text-slate-900">{dept.students}</p>
                              <p className="text-slate-500">Total Students</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!loadingDepartments && searchedCourses.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                          No courses found for this search.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="admissions" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle>Admission Applications</CardTitle>
                        <CardDescription>Verify first-time enrollment requests, then approve or reject.</CardDescription>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Select value={admissionCourseFilter} onValueChange={setAdmissionCourseFilter}>
                            <SelectTrigger className="h-9 w-[260px]">
                              <SelectValue placeholder="Filter by course" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Courses</SelectItem>
                              {admissionCourseOptions.map((course) => (
                                <SelectItem key={course} value={course}>
                                  {course}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="sm" onClick={toggleAllPendingAdmissions}>
                            {allPendingAdmissionsSelected ? "Unselect all" : "Select all"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-sky-100 text-sky-700 hover:bg-sky-200"
                            onClick={() => openScheduleModalForSelection("admission")}
                            disabled={selectedAdmissionIds.length === 0 || filteredPendingAdmissionsBySearch.length === 0}
                          >
                            Send a Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loadingAdmissions ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={`admission-skeleton-${index}`}
                            className="rounded-lg border border-slate-200 p-4"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 flex-1 space-y-3">
                                <Skeleton className="h-5 w-52" />
                                <Skeleton className="h-4 w-full max-w-md" />
                                <Skeleton className="h-4 w-full max-w-lg" />
                                <Skeleton className="h-3 w-56" />
                              </div>
                              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <Skeleton className="h-9 w-full rounded-full sm:w-32" />
                                <Skeleton className="h-9 w-full rounded-full sm:w-24" />
                                <Skeleton className="h-9 w-full rounded-full sm:w-24" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : pendingAdmissions.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-slate-600">No pending admissions right now.</p>
                      </div>
                    ) : filteredPendingAdmissionsBySearch.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600">No admissions found for the selected course filter.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredPendingAdmissionsBySearch.map((item) => (
                          <div key={item.id} className="border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col items-start gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => openAdmissionDetail(item)}>
                            <div className="flex w-full items-start gap-3 sm:w-auto sm:flex-1">
                              <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 cursor-pointer accent-blue-600"
                                  checked={selectedAdmissionIds.includes(item.id)}
                                  onChange={(e) => toggleAdmissionSelection(item.id, e.target.checked)}
                                  aria-label={`Select ${item.full_name}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.full_name}</p>
                                {hasSentSchedule(item) && (
                                  <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-200">
                                    Schedule Sent
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">
                                {item.email} | Age {item.age} | {item.gender}
                              </p>
                              <p className="text-sm text-slate-600">
                                Primary: {item.primary_course} | Secondary: {item.secondary_course ?? "-"}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Attachments:
                                {" "}
                                ID {item.id_picture_path ? "yes" : "no"},
                                {" "}
                                1x1 {item.one_by_one_picture_path ? "yes" : "no"},
                                {" "}
                                Thumbmark {item.right_thumbmark_path ? "yes" : "no"}
                              </p>
                              </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                                onClick={() => handleApproveAdmission(item.id)}
                                disabled={approvingAdmissionId === item.id || submittingReject || !canApproveAdmission(item)}
                                title={!canApproveAdmission(item) ? getApprovalBlockReason(item) : "Approve applicant"}
                              >
                                {approvingAdmissionId === item.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full sm:w-auto"
                                onClick={() => openRejectAdmissionModal(item.id)}
                                disabled={approvingAdmissionId === item.id || submittingReject}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-slate-800 mb-2">Generated Credentials (Demo Email Queue)</p>
                      <div className="space-y-2">
                        {recentCredentials.slice(0, 5).map((item, index) => (
                          <div key={`${item.email}-${index}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                            <span className="font-semibold">{item.fullName}</span> | {item.email} | USERNAME: <span className="font-mono">{item.studentNumber}</span> | TEMP PASS: <span className="font-mono">{item.temporaryPassword}</span>
                          </div>
                        ))}
                        {recentCredentials.length === 0 && <p className="text-sm text-slate-500">No generated credentials in this session yet.</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vocationals" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle>Vocational Enrollees</CardTitle>
                        <CardDescription>Review Training Programs & Scholarships enrollment applications.</CardDescription>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={toggleAllPendingVocationals}>
                            {allPendingVocationalsSelected ? "Unselect all" : "Select all"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-sky-100 text-sky-700 hover:bg-sky-200"
                            onClick={() => openScheduleModalForSelection("vocational")}
                            disabled={selectedVocationalIds.length === 0}
                          >
                            Send a Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loadingAdmissions ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={`vocational-skeleton-${index}`}
                            className="rounded-lg border border-slate-200 p-4"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 flex-1 space-y-3">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-full max-w-md" />
                                <Skeleton className="h-4 w-full max-w-lg" />
                                <Skeleton className="h-3 w-44" />
                              </div>
                              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <Skeleton className="h-9 w-full rounded-full sm:w-32" />
                                <Skeleton className="h-9 w-full rounded-full sm:w-24" />
                                <Skeleton className="h-9 w-full rounded-full sm:w-24" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : pendingVocationals.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-slate-600">No pending vocational applications right now.</p>
                      </div>
                    ) : filteredPendingVocationals.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600">No vocational applications found for the current search.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredPendingVocationals.map((item) => (
                          <div
                            key={item.id}
                            className="border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col items-start gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            onClick={() => openAdmissionDetail(item)}
                          >
                            <div className="flex w-full items-start gap-3 sm:w-auto sm:flex-1">
                              <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 cursor-pointer accent-blue-600"
                                  checked={selectedVocationalIds.includes(item.id)}
                                  onChange={(e) => toggleVocationalSelection(item.id, e.target.checked)}
                                  aria-label={`Select ${item.full_name}`}
                                />
                              </div>
                              <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-900">{item.full_name}</p>
                                {hasSentSchedule(item) && (
                                  <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-200">
                                    Schedule Sent
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">
                                {item.email} | Age {item.age} | {item.gender}
                              </p>
                              <p className="text-sm text-slate-600">
                                Program: {item.primary_course} | Scholarship: {item.secondary_course ?? "-"}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Valid ID Type: {item.valid_id_type ?? "-"}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Attachments:
                                {" "}
                                Birth Cert {item.birth_certificate_path ? "yes" : "no"},
                                {" "}
                                Valid ID {item.valid_id_path ? "yes" : "no"},
                                {" "}
                                ID Pic {item.id_picture_path ? "yes" : "no"},
                                {" "}
                                1x1 {item.one_by_one_picture_path ? "yes" : "no"},
                                {" "}
                                Thumbmark {item.right_thumbmark_path ? "yes" : "no"}
                              </p>
                              </div>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                                onClick={() => handleApproveAdmission(item.id)}
                                disabled={approvingAdmissionId === item.id || submittingReject || !canApproveAdmission(item)}
                                title={!canApproveAdmission(item) ? getApprovalBlockReason(item) : "Approve applicant"}
                              >
                                {approvingAdmissionId === item.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full sm:w-auto"
                                onClick={() => openRejectAdmissionModal(item.id)}
                                disabled={approvingAdmissionId === item.id || submittingReject}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="admissions-masterlist" className="mt-6">
                <Card className="flex h-[78vh] flex-col">
                  <CardHeader>
                    <CardTitle>Diploma Masterlist</CardTitle>
                    <CardDescription>
                      Students with sent exam schedules. Filter by course and update entrance exam result and attendance status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Form Type</Label>
                        <Select
                          value={masterlistType}
                          onValueChange={(value) => {
                            const nextType = value as AdmissionType;
                            setMasterlistType(nextType);
                            setMasterlistCourseFilter("all");
                            navigateToAdminTab(nextType === "admission" ? "admissions-masterlist" : "vocationals-masterlist");
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vocational">Certificate</SelectItem>
                            <SelectItem value="admission">Diploma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Course Filter</Label>
                        <Select value={masterlistCourseFilter} onValueChange={setMasterlistCourseFilter}>
                          <SelectTrigger><SelectValue placeholder="All courses" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {masterlistCourses.map((course) => (
                              <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Admission Status</TableHead>
                            <TableHead>Exam Attendance</TableHead>
                            <TableHead>Exam Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredScheduledMasterlistRows.map((item) => (
                            <TableRow key={`master-admission-${item.id}`}>
                              <TableCell className="min-w-[180px] font-medium">{item.full_name}</TableCell>
                              <TableCell className="min-w-[210px]">{item.primary_course}</TableCell>
                              <TableCell className="min-w-[230px] text-xs sm:text-sm">{item.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={getExamAttendanceStatus(item)}
                                  onValueChange={(value) => handleUpdateAttendanceStatus(item.id, value as ExamStatus)}
                                  disabled={updatingExamStatusId === item.id}
                                >
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="attended">Attended</SelectItem>
                                    <SelectItem value="not_attended">Not Attended</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={getExamResultStatus(item)}
                                  onValueChange={(value) => handleUpdateExamResult(item.id, value as ExamResultStatus)}
                                  disabled={updatingExamStatusId === item.id || getExamAttendanceStatus(item) === "not_attended"}
                                >
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unset" disabled>Select result</SelectItem>
                                    <SelectItem value="passed">Passed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredScheduledMasterlistRows.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                                No scheduled students found for this filter.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vocationals-masterlist" className="mt-6">
                <Card className="flex h-[78vh] flex-col">
                  <CardHeader>
                    <CardTitle>Certificate Masterlist</CardTitle>
                    <CardDescription>
                      Students with sent exam schedules. Filter by program and update entrance exam result and attendance status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Form Type</Label>
                        <Select
                          value={masterlistType}
                          onValueChange={(value) => {
                            const nextType = value as AdmissionType;
                            setMasterlistType(nextType);
                            setMasterlistCourseFilter("all");
                            navigateToAdminTab(nextType === "admission" ? "admissions-masterlist" : "vocationals-masterlist");
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vocational">Certificate</SelectItem>
                            <SelectItem value="admission">Diploma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Course Filter</Label>
                        <Select value={masterlistCourseFilter} onValueChange={setMasterlistCourseFilter}>
                          <SelectTrigger><SelectValue placeholder="All courses" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {masterlistCourses.map((course) => (
                              <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Admission Status</TableHead>
                            <TableHead>Exam Attendance</TableHead>
                            <TableHead>Exam Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredScheduledMasterlistRows.map((item) => (
                            <TableRow key={`master-vocational-${item.id}`}>
                              <TableCell className="min-w-[180px] font-medium">{item.full_name}</TableCell>
                              <TableCell className="min-w-[210px]">{item.primary_course}</TableCell>
                              <TableCell className="min-w-[230px] text-xs sm:text-sm">{item.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={getExamAttendanceStatus(item)}
                                  onValueChange={(value) => handleUpdateAttendanceStatus(item.id, value as ExamStatus)}
                                  disabled={updatingExamStatusId === item.id}
                                >
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="attended">Attended</SelectItem>
                                    <SelectItem value="not_attended">Not Attended</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={getExamResultStatus(item)}
                                  onValueChange={(value) => handleUpdateExamResult(item.id, value as ExamResultStatus)}
                                  disabled={updatingExamStatusId === item.id || getExamAttendanceStatus(item) === "not_attended"}
                                >
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unset" disabled>Select result</SelectItem>
                                    <SelectItem value="passed">Passed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredScheduledMasterlistRows.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                                No scheduled students found for this filter.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          {activeAdminTab === "users" && (
          <div className="space-y-4 sm:space-y-6">
{/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Vocational Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingAdmissions ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={`vocational-trend-skeleton-${index}`} className="rounded-lg p-2">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))
                  ) : (
                    vocationalTrends.map((trend) => (
                      <button
                        key={trend.program}
                        type="button"
                        onClick={() => {
                          setSelectedVocational(trend);
                          setSelectedVocationalBatch(null);
                          setVocationalModalOpen(true);
                        }}
                        className="w-full text-left rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{trend.program}</span>
                          <span className="font-medium">{trend.total} trainees</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full">
                          <div className={`h-full ${trend.colorClass} rounded-full`} style={{ width: `${Math.min(100, Math.round((trend.total / 100) * 100))}%` }}></div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Approval Readiness */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Approval Readiness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingAdmissions ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={`readiness-skeleton-${index}`} className="rounded-lg p-2">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-4 w-10" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="rounded-lg p-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Ready to Approve</span>
                          <span className="font-medium text-emerald-700">{readinessReady}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.round((readinessReady / readinessTotal) * 100))}%` }} />
                        </div>
                      </div>

                      <div className="rounded-lg p-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Blocked: No Attendance</span>
                          <span className="font-medium text-amber-700">{readinessNoAttendance}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, Math.round((readinessNoAttendance / readinessTotal) * 100))}%` }} />
                        </div>
                      </div>

                      <div className="rounded-lg p-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Blocked: Not Passed</span>
                          <span className="font-medium text-rose-700">{readinessNoPassResult}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full">
                          <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, Math.round((readinessNoPassResult / readinessTotal) * 100))}%` }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
        </div>
      </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-3 bottom-3 z-[70] md:hidden">
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-slate-950/92">
          <div className="grid grid-cols-5 gap-1">
            <button
              type="button"
              onClick={() => navigateToAdminTab("users")}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                activeAdminTab === "users"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <School className="h-4 w-4" />
              Home
            </button>
            <button
              type="button"
              onClick={() => navigateToAdminTab("departments")}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                activeAdminTab === "departments"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Dept
            </button>
            <button
              type="button"
              onClick={() => navigateToAdminTab("admissions")}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                admissionsSectionActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Admit
            </button>
            <button
              type="button"
              onClick={() => navigateToAdminTab("vocationals")}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                vocationalsSectionActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Trends
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNotifications(false);
                setMobileSearchOpen(false);
                setMobileMenuOpen(true);
              }}
              className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <Menu className="h-4 w-4" />
              Menu
            </button>
          </div>
        </div>
      </nav>

      {/* Enhanced Message Preview Card */}
      {activeMessagePreview && (
        <div className="fixed inset-x-2 bottom-20 z-[70] w-auto max-w-[calc(100vw-1rem)] rounded-xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[28rem] dark:border-slate-700 dark:bg-slate-950">
          {/* Header with Avatar */}
          <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white">
              {activeMessagePreview.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {activeMessagePreview.full_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {activeMessagePreview.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {formatRelativeTime(activeMessagePreview.created_at)}
                </span>
                {!activeMessagePreview.is_read && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    New
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full"
              onClick={() => setActiveMessagePreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Message Content */}
          <div className="max-h-48 overflow-y-auto px-4 py-3">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
              {activeMessagePreview.message}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 border-t border-slate-100 px-2 py-2 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => window.open(`mailto:${activeMessagePreview.email}?subject=Re: Your message to TClass&body=\n\n--- Original Message ---\nFrom: ${activeMessagePreview.full_name}\nDate: ${new Date(activeMessagePreview.created_at).toLocaleString()}\n\n${activeMessagePreview.message}`, "_blank")}
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </Button>
            {!activeMessagePreview.is_read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleOpenMessage(activeMessagePreview.id)}
              >
                <MailOpen className="h-3.5 w-3.5" />
                Mark Read
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-500"
              onClick={() => {
                setActiveMessagePreview(null);
                toast.success("Message archived");
              }}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
          
          {/* More from this sender */}
          {activeSenderMessages.length > 1 && (
            <div className="border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {activeSenderMessages.length - 1} more from this sender
                </p>
              </div>
              <div className="max-h-32 overflow-y-auto px-2 pb-2 space-y-1">
                {activeSenderMessages
                  .filter((msg) => msg.id !== activeMessagePreview.id)
                  .slice(0, 3)
                  .map((msg) => (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setActiveMessagePreview(msg)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        !msg.is_read 
                          ? "border-blue-200 bg-blue-50/50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30" 
                          : "border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!msg.is_read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(msg.created_at)}</p>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate mt-0.5">{msg.message}</p>
                    </button>
                  ))}
                {activeSenderMessages.length > 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMessagePreview(null);
                      setAllMessagesOpen(true);
                    }}
                    className="w-full py-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View all messages from {activeMessagePreview.full_name.split(" ")[0]} â†’
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog
        open={addUserOpen}
        onOpenChange={(open) => {
          setAddUserOpen(open);
          if (!open) setShowAddUserPassword(false);
        }}
      >
        <DialogContent
          className={`flex w-[calc(100vw-2rem)] overflow-visible bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 sm:max-w-[580px] sm:flex-col ${
            newUserForm.role === "admin" ? "sm:min-h-[560px]" : ""
          }`}
        >
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Add User Account</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Create an admin or faculty account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-role" className="text-slate-700 dark:text-slate-300">Role *</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(value: "admin" | "faculty") =>
                  setNewUserForm((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger
                  id="new-user-role"
                  className="h-11 rounded-xl border-slate-300 bg-white px-3 text-slate-900 shadow-sm transition-colors focus-visible:border-blue-400 focus-visible:ring-0 focus-visible:outline-none data-[state=open]:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:border-blue-400 dark:data-[state=open]:border-blue-400"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-300 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <SelectItem value="admin" className="text-slate-900 dark:text-slate-100">Admin</SelectItem>
                  <SelectItem value="faculty" className="text-slate-900 dark:text-slate-100">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-name" className="text-slate-700 dark:text-slate-300">Full Name *</Label>
              <Input
                id="new-user-name"
                placeholder="e.g. Dr. Jane Smith"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
                autoComplete="off"
                name="new-user-full-name"
                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email" className="text-slate-700 dark:text-slate-300">Email *</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="e.g. jane.smith@tclass.local"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
              />
            </div>
            {newUserForm.role === "faculty" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-user-department" className="text-slate-700 dark:text-slate-300">Department</Label>
                  <Input
                    id="new-user-department"
                    placeholder="e.g. IT Department"
                    value={newUserForm.department}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, department: e.target.value }))}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-position" className="text-slate-700 dark:text-slate-300">Position</Label>
                  <Input
                    id="new-user-position"
                    placeholder="e.g. Instructor"
                    value={newUserForm.position}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, position: e.target.value }))}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-user-password" className="text-slate-700 dark:text-slate-300">Password (Optional)</Label>
              <div className="relative">
                <Input
                  id="new-user-password"
                  type={showAddUserPassword ? "text" : "password"}
                  placeholder="Leave blank to auto-generate"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
                  autoComplete="new-password"
                  name="new-user-password"
                  className="bg-white pr-10 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={() => setShowAddUserPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label={showAddUserPassword ? "Hide password" : "Show password"}
                >
                  {showAddUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">If blank, the system will generate a temporary password.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)} disabled={creatingUser} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? "Creating..." : `Create ${newUserForm.role === "faculty" ? "Faculty" : "Admin"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Edit User</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Update user information.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-slate-700 dark:text-slate-300">Full Name</Label>
                <Input 
                  id="edit-name" 
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-slate-700 dark:text-slate-300">Role</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value: "Student" | "Faculty" | "Admin") => setSelectedUser({...selectedUser, role: value})}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                    <SelectItem value="Student" className="text-slate-900 dark:text-slate-100">Student</SelectItem>
                    <SelectItem value="Faculty" className="text-slate-900 dark:text-slate-100">Faculty</SelectItem>
                    <SelectItem value="Admin" className="text-slate-900 dark:text-slate-100">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-slate-700 dark:text-slate-300">Status</Label>
                <Select 
                  value={selectedUser.status} 
                  onValueChange={(value: "active" | "pending" | "inactive") => setSelectedUser({...selectedUser, status: value})}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                    <SelectItem value="active" className="text-slate-900 dark:text-slate-100">Active</SelectItem>
                    <SelectItem value="pending" className="text-slate-900 dark:text-slate-100">Pending</SelectItem>
                    <SelectItem value="inactive" className="text-slate-900 dark:text-slate-100">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">Cancel</Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Full-Featured Message Inbox Dialog */}
      <Dialog open={allMessagesOpen} onOpenChange={(open) => {
        setAllMessagesOpen(open);
        if (!open) setSelectedMessageThread(null);
      }}>
        <DialogContent className="max-w-5xl h-[82vh] p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-950/95">
          {!selectedMessageThread ? (
            /* Message List View */
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/60 px-4 py-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 shadow-sm dark:bg-blue-900/30">
                    <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Messages</DialogTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {conversationThreads.length} conversation{conversationThreads.length === 1 ? "" : "s"} | {sortedMessages.length} message{sortedMessages.length === 1 ? "" : "s"} | {unreadCount} unread
                    </p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-full border border-slate-200 bg-white/70 text-xs hover:bg-white dark:border-slate-700 dark:bg-slate-900"
                    onClick={handleClearNotifications}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
              </div>
              
              {/* Search and Filters */}
              <div className="flex items-center gap-2 border-b border-slate-200 bg-white/80 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950/70">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search messages..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="h-9 rounded-full border-slate-300 bg-white pl-9 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <Select value={messageFilter} onValueChange={(v) => setMessageFilter(v as "all" | "unread" | "read")}>
                  <SelectTrigger className="h-9 w-[110px] rounded-full border-slate-300 bg-white text-xs dark:border-slate-700 dark:bg-slate-900">
                    <Filter className="mr-1.5 h-3.5 w-3.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Message List */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40">
                {loadingMessages ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : sortedMessages.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Mail className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">No messages yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Messages from the contact form will appear here.</p>
                  </div>
                ) : conversationThreads.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">No matching conversations</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Try changing your search or filter.</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {conversationThreads.map((thread) => {
                      const msg = thread.latest;
                      const initials = msg.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <button
                          key={msg.email.toLowerCase()}
                          type="button"
                          onClick={() => setSelectedMessageThread(msg)}
                          className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:-translate-y-[1px] hover:shadow-sm ${
                            thread.unreadCount > 0
                              ? "border-blue-200 bg-blue-50/60 hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            thread.unreadCount > 0
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {initials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`truncate text-sm ${thread.unreadCount > 0 ? "font-semibold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                                {msg.full_name}
                              </p>
                              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                                {formatRelativeTime(msg.created_at)}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{msg.email}</p>
                              {thread.messages.length > 1 && (
                                <span className="inline-flex shrink-0 items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  {thread.messages.length} msgs
                                </span>
                              )}
                              {thread.unreadCount > 0 && (
                                <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  {thread.unreadCount} unread
                                </span>
                              )}
                            </div>
                            <p className={`mt-1 line-clamp-2 text-sm ${thread.unreadCount > 0 ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>
                              {msg.message}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Message Detail View */
            <>
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/70 px-4 py-4 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
                <div className="flex items-start gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="mt-1 h-8 w-8 shrink-0 rounded-full border-slate-300 bg-white/90 dark:border-slate-700 dark:bg-slate-950"
                    onClick={() => {
                      setSelectedMessageThread(null);
                      handleOpenMessage(selectedMessageThread.id);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-sm">
                      {selectedMessageThread.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                        {selectedMessageThread.full_name}
                      </DialogTitle>
                      <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">{selectedMessageThread.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(selectedMessageThread.created_at).toLocaleString()}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-medium ${
                          selectedMessageThread.is_read
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}>
                          {selectedMessageThread.is_read ? "Read" : "Unread"}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/40 p-4 dark:bg-slate-950/40">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <MailOpen className="h-3.5 w-3.5" />
                    Message
                  </div>
                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-200">
                    {selectedMessageThread.message}
                  </p>
                </div>

                {activeSenderMessages.length > 1 && (
                  <div className="mt-6">
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <CornerUpLeft className="h-3.5 w-3.5" />
                      Previous Messages ({activeSenderMessages.length - 1})
                    </h4>
                    <div className="space-y-2.5">
                      {activeSenderMessages
                        .filter((msg) => msg.id !== selectedMessageThread.id)
                        .map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            onClick={() => setSelectedMessageThread(msg)}
                            className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${
                              !msg.is_read
                                ? "border-blue-200 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-900/20"
                                : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatRelativeTime(msg.created_at)}
                              </span>
                              {!msg.is_read && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  Unread
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{msg.message}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-white/95 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/95">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full"
                  onClick={() => handleMarkMessageAsRead(selectedMessageThread.id)}
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark as Read
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => openReplyComposer(selectedMessageThread)}
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:hover:bg-red-900/20"
                    onClick={() => handleArchiveMessage(selectedMessageThread.id)}
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={replyComposerOpen}
        onOpenChange={(open) => {
          setReplyComposerOpen(open);
          if (!open && !sendingReply) {
            setReplyTarget(null);
            setReplySubject("");
            setReplyBody("");
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to {replyTarget?.full_name ?? "Sender"}</DialogTitle>
            <DialogDescription>
              This will send an email directly to {replyTarget?.email ?? "the sender"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reply-subject">Subject</Label>
              <Input
                id="reply-subject"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Reply subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-message">Message</Label>
              <Textarea
                id="reply-message"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Type your reply..."
                rows={9}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyComposerOpen(false)} disabled={sendingReply}>
              Cancel
            </Button>
            <Button onClick={handleSendReply} disabled={sendingReply}>
              {sendingReply ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewAllAccountsOpen} onOpenChange={setViewAllAccountsOpen}>
        <DialogContent className="sm:max-w-xl border border-slate-200 bg-neutral-50 dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">All Accounts</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              Showing {filteredUsers.length} {userRoleFilter} account{filteredUsers.length !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div
            className="max-h-[60vh] overflow-y-auto space-y-3 rounded-md border border-slate-200 p-2 dark:border-slate-700"
            onScroll={handleViewAllUsersScroll}
          >
            {loadingUsers ? (
              <div className="rounded-lg border border-slate-200 px-4 py-4 dark:border-slate-700">
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={`dialog-user-skeleton-${index}`} className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/30">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-56" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="rounded-lg border border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
                No users found.
              </p>
            ) : (
              <>
                {visibleUsers.map((user) => (
                  <div key={user.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-slate-100">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                <div className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                  {hasMoreUsers ? "Scroll down to load 5 more accounts..." : "All accounts loaded."}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAllAccountsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={courseTrendModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setCourseTrendModalOpen(true);
          }
        }}
      >
        <DialogContent
          className="border border-blue-200/80 bg-white/95 dark:border-blue-900/80 dark:bg-slate-950/95"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">{selectedTrendCourse?.course ?? "Course Details"}</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              {selectedYearLevel
                ? `Students in ${selectedYearLevel}`
                : "Student distribution per year level (1st to 4th year)."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedTrendCourse && !selectedYearLevel && selectedTrendCourse.yearLevels.map((row) => (
              <button
                key={row.year}
                type="button"
                onClick={() => setSelectedYearLevel(row.year)}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <span className="text-sm text-slate-700 dark:text-slate-200">{row.year}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.students} students</span>
              </button>
            ))}
            {selectedTrendCourse && selectedYearLevel && (
              <div className="space-y-2">
                {(courseStudentDirectory[selectedTrendCourse.course]?.[selectedYearLevel] ?? []).map((student) => (
                  <div
                    key={student}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {student}
                  </div>
                ))}
              </div>
            )}
            {!selectedTrendCourse && (
              <p className="text-sm text-slate-500 dark:text-slate-300">No course selected.</p>
            )}
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            {selectedYearLevel ? (
              <Button variant="outline" onClick={() => setSelectedYearLevel(null)}>
                Back to Year Levels
              </Button>
            ) : (
              <div />
            )}
            <Button
              variant="outline"
              onClick={() => {
                setCourseTrendModalOpen(false);
                setSelectedYearLevel(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={vocationalModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setVocationalModalOpen(true);
          }
        }}
      >
        <DialogContent
          className="border border-blue-200/80 bg-white/95 dark:border-blue-900/80 dark:bg-slate-950/95"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">{selectedVocational?.program ?? "Vocational Program Details"}</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              {selectedVocationalBatch
                ? `Trainees in ${selectedVocationalBatch}`
                : "Batch-level trainee distribution."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedVocational && !selectedVocationalBatch && selectedVocational.breakdown.map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => setSelectedVocationalBatch(row.label)}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <span className="text-sm text-slate-700 dark:text-slate-200">{row.label}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.students} trainees</span>
              </button>
            ))}
            {selectedVocational && selectedVocationalBatch && (
              <div className="space-y-2">
                {(vocationalStudentDirectory[selectedVocational.program]?.[selectedVocationalBatch] ?? []).map((student) => (
                  <div
                    key={student}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {student}
                  </div>
                ))}
              </div>
            )}
            {!selectedVocational && (
              <p className="text-sm text-slate-500 dark:text-slate-300">No program selected.</p>
            )}
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            {selectedVocationalBatch ? (
              <Button variant="outline" onClick={() => setSelectedVocationalBatch(null)}>
                Back to Batches
              </Button>
            ) : (
              <div />
            )}
            <Button
              variant="outline"
              onClick={() => {
                setVocationalModalOpen(false);
                setSelectedVocationalBatch(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scheduleModalOpen}
        onOpenChange={(open) => {
          setScheduleModalOpen(open);
          if (!open) setScheduleRecipientIds([]);
        }}
      >
        <DialogContent className="sm:max-w-2xl border border-slate-200 bg-neutral-50 dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Send Entrance Exam Schedule</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              Compose and send an exam invitation email to {scheduleRecipientIds.length} selected{" "}
              {scheduleRecipientType === "admission" ? "admission applicant" : "vocational enrollee"}
              {scheduleRecipientIds.length === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] space-y-4 overflow-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-subject" className="text-slate-700 dark:text-slate-300">Email Subject</Label>
                <Input id="exam-subject" value={scheduleForm.subject} onChange={(e) => setScheduleForm((p) => ({ ...p, subject: e.target.value }))} className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-intro" className="text-slate-700 dark:text-slate-300">Intro Message</Label>
                <Textarea
                  id="exam-intro"
                  rows={3}
                  value={scheduleForm.intro_message}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, intro_message: e.target.value }))}
                  className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-date" className="text-slate-700 dark:text-slate-300">Date</Label>
                <Input id="exam-date" type="date" value={scheduleForm.exam_date} onChange={(e) => setScheduleForm((p) => ({ ...p, exam_date: e.target.value }))} className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-time" className="text-slate-700 dark:text-slate-300">Time</Label>
                <Input id="exam-time" type="time" value={scheduleForm.exam_time} onChange={(e) => setScheduleForm((p) => ({ ...p, exam_time: e.target.value }))} className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-day" className="text-slate-700 dark:text-slate-300">Day</Label>
                <Input id="exam-day" placeholder="e.g. Monday" value={scheduleForm.exam_day} onChange={(e) => setScheduleForm((p) => ({ ...p, exam_day: e.target.value }))} className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-location" className="text-slate-700 dark:text-slate-300">Where</Label>
                <Input id="exam-location" value={scheduleForm.location} onChange={(e) => setScheduleForm((p) => ({ ...p, location: e.target.value }))} className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-bring" className="text-slate-700 dark:text-slate-300">Things to Bring</Label>
                <Textarea
                  id="exam-bring"
                  rows={4}
                  value={scheduleForm.things_to_bring}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, things_to_bring: e.target.value }))}
                  className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-attire" className="text-slate-700 dark:text-slate-300">Note (Proper Attire)</Label>
                <Textarea
                  id="exam-attire"
                  rows={2}
                  value={scheduleForm.attire_note}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, attire_note: e.target.value }))}
                  className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-note" className="text-slate-700 dark:text-slate-300">Additional Note (Optional)</Label>
                <Textarea
                  id="exam-note"
                  rows={2}
                  value={scheduleForm.additional_note}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, additional_note: e.target.value }))}
                  className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)} disabled={sendingSchedule}>
              Cancel
            </Button>
            <Button className="bg-sky-600 hover:bg-sky-700" onClick={handleSendExamSchedule} disabled={sendingSchedule}>
              {sendingSchedule ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send a Schedule (${scheduleRecipientIds.length})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Admission</DialogTitle>
            <DialogDescription>
              Provide the reason why this registration was rejected. This will be saved in the admission record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection reason</Label>
            <Textarea
              id="rejection-reason"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the rejection reason..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectAdmission} disabled={submittingReject}>
              {submittingReject ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admission Detail Modal */}
      <Dialog open={admissionDetailOpen} onOpenChange={setAdmissionDetailOpen}>
        <DialogContent className="w-[calc(100vw-1.25rem)] max-w-4xl gap-0 overflow-hidden border border-blue-200/70 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-6 py-5 text-left dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="space-y-1.5">
                <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Student Information</DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-300">
                  Complete enrollment profile for <span className="font-medium text-slate-800 dark:text-slate-200">{selectedAdmissionDetail?.full_name}</span>
                </DialogDescription>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAdmissionPrint}
                  className="border-slate-300 bg-white/80 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  PDF view
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedAdmissionDetail && (
            <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
              <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Student Summary</h4>
                  <Badge className={`border text-xs font-semibold ${admissionStatusBadgeClass(selectedAdmissionDetail.status)}`}>
                    {formatEnumLabel(selectedAdmissionDetail.status)}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Full Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedAdmissionDetail.full_name}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Email</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-slate-100">{selectedAdmissionDetail.email}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Gender</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{selectedAdmissionDetail.gender || "-"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Age</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{selectedAdmissionDetail.age || "-"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Application Type</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{formatEnumLabel(selectedAdmissionDetail.application_type || "admission")}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Primary Course</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedAdmissionDetail.primary_course || "-"}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Program Information</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Primary Course</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedAdmissionDetail.primary_course || "-"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Secondary Course / Scholarship</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{selectedAdmissionDetail.secondary_course || "-"}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Examination Status</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Attendance</p>
                    <Badge className={`mt-2 border ${examStatusBadgeClass(selectedAdmissionDetail.exam_attendance_status ?? "unset")}`}>
                      {formatEnumLabel(selectedAdmissionDetail.exam_attendance_status)}
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Result</p>
                    <Badge className={`mt-2 border ${examStatusBadgeClass(selectedAdmissionDetail.exam_status ?? "unset")}`}>
                      {formatEnumLabel(selectedAdmissionDetail.exam_status)}
                    </Badge>
                  </div>
                </div>
              </section>

              {selectedAdmissionDetail.form_data && Object.keys(selectedAdmissionDetail.form_data).length > 0 && (
                <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Additional Form Data</h4>
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
                    {Object.entries(selectedAdmissionDetail.form_data).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0 dark:border-slate-800">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatFormKey(key)}</p>
                        <p className="break-words text-right text-sm text-slate-900 dark:text-slate-100">{formatFormValue(value)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Attachments</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "ID Picture", available: Boolean(selectedAdmissionDetail.id_picture_path) },
                    { label: "Birth Certificate", available: Boolean(selectedAdmissionDetail.birth_certificate_path) },
                    { label: "Valid ID", available: Boolean(selectedAdmissionDetail.valid_id_path) },
                    { label: "1x1 Picture", available: Boolean(selectedAdmissionDetail.one_by_one_picture_path) },
                    { label: "Right Thumbmark", available: Boolean(selectedAdmissionDetail.right_thumbmark_path) },
                  ].map((attachment) => (
                    <div
                      key={attachment.label}
                      className={`rounded-xl border px-3 py-2.5 ${
                        attachment.available
                          ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                          : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                      }`}
                    >
                      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{attachment.label}</p>
                      <p className={`mt-1 text-sm font-semibold ${attachment.available ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {attachment.available ? "Available" : "Not Submitted"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
            <Button variant="outline" onClick={() => setAdmissionDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="flex h-[94vh] w-[98vw] max-w-[98vw] flex-col gap-0 overflow-hidden border border-slate-200 bg-slate-100 p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-200 bg-white px-5 py-3 text-left dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3 pr-8">
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">PDF View</DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-300">
                  TESDA registration form preview inside the portal.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGeneratePdf}
                  disabled={generatingPdf}
                  className="bg-sky-600 text-white hover:bg-sky-700"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {generatingPdf ? "Generating..." : "Generate PDF"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPdfPreviewOpen(false)}
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-200 p-3 dark:bg-slate-900">
            <iframe
              ref={pdfPreviewFrameRef}
              title="TESDA Registration Form Preview"
              srcDoc={pdfPreviewHtml}
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </DialogContent>
      </Dialog>

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

