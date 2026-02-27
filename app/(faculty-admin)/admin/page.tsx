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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  Plus,
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
  UserCircle2,
  Calendar,
  CornerUpLeft,
  CheckCheck,
  Trash,
  FileText
} from "lucide-react";
import { useEffect, useState, type UIEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api-client";
import { AvatarActionsMenu } from "@/components/ui/avatar-actions-menu";
import { LogoutModal } from "@/components/ui/logout-modal";
import { AdminDashboardSkeleton } from "@/components/ui/loading-states";

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
  } | null;
}

export default function AdminDashboard() {
  return <AdminDashboardPage initialAdminTab="users" />;
}

type ExamStatus = "passed" | "failed" | "not_attended";
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

type AdminSectionTab = "users" | "departments" | "admissions" | "vocationals";

interface AdminDashboardProps {
  initialAdminTab?: AdminSectionTab;
}

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

export function AdminDashboardPage({ initialAdminTab = "users" }: AdminDashboardProps) {
  const router = useRouter();
  const [userRoleFilter, setUserRoleFilter] = useState<"student" | "faculty" | "admin">("admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [universalSearchQuery, setUniversalSearchQuery] = useState("");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [addDepartmentOpen, setAddDepartmentOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    head: "",
  });
  
  // Data states
  const [users, setUsers] = useState<UserItem[]>([]);
  
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: "Mathematics", head: "Prof. Santos", faculty: 8, students: 320, classes: 24 },
    { id: 2, name: "Science", head: "Prof. Cruz", faculty: 10, students: 280, classes: 22 },
    { id: 3, name: "English", head: "Prof. Reyes", faculty: 6, students: 250, classes: 18 },
    { id: 4, name: "History", head: "Prof. Garcia", faculty: 5, students: 200, classes: 15 },
  ]);
  
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

  const [showNotifications, setShowNotifications] = useState(false);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    students: 0,
    faculty: 0,
    classes: 0,
    departments: 0,
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [recentCredentials, setRecentCredentials] = useState<{ fullName: string; email: string; studentNumber: string; temporaryPassword: string }[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminSectionTab>(initialAdminTab);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingAdmissionId, setRejectingAdmissionId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingAdmissionId, setApprovingAdmissionId] = useState<number | null>(null);
  const [submittingReject, setSubmittingReject] = useState(false);
  const [masterlistOpen, setMasterlistOpen] = useState(false);
  const [masterlistType, setMasterlistType] = useState<AdmissionType>("vocational");
  const [masterlistCourseFilter, setMasterlistCourseFilter] = useState<string>("all");
  const [updatingExamStatusId, setUpdatingExamStatusId] = useState<number | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<AdmissionApplication | null>(null);
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
  const [loading, setLoading] = useState(true);
  const [courseTrendModalOpen, setCourseTrendModalOpen] = useState(false);
  const [selectedTrendCourse, setSelectedTrendCourse] = useState<CourseTrend | null>(null);
  const [selectedYearLevel, setSelectedYearLevel] = useState<"1st Year" | "2nd Year" | "3rd Year" | "4th Year" | null>(null);
  const [vocationalModalOpen, setVocationalModalOpen] = useState(false);
  const [selectedVocational, setSelectedVocational] = useState<VocationalTrend | null>(null);
  const [selectedVocationalBatch, setSelectedVocationalBatch] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setActiveAdminTab(initialAdminTab);
  }, [initialAdminTab]);

  const courseTrends: CourseTrend[] = [
    {
      course: "BS Nursing",
      total: 420,
      colorClass: "bg-blue-500",
      yearLevels: [
        { year: "1st Year", students: 130 },
        { year: "2nd Year", students: 110 },
        { year: "3rd Year", students: 95 },
        { year: "4th Year", students: 85 },
      ],
    },
    {
      course: "BS Information Technology",
      total: 360,
      colorClass: "bg-emerald-500",
      yearLevels: [
        { year: "1st Year", students: 120 },
        { year: "2nd Year", students: 95 },
        { year: "3rd Year", students: 80 },
        { year: "4th Year", students: 65 },
      ],
    },
    {
      course: "BS Civil Engineering",
      total: 310,
      colorClass: "bg-violet-500",
      yearLevels: [
        { year: "1st Year", students: 92 },
        { year: "2nd Year", students: 82 },
        { year: "3rd Year", students: 72 },
        { year: "4th Year", students: 64 },
      ],
    },
    {
      course: "BS Accountancy",
      total: 270,
      colorClass: "bg-amber-500",
      yearLevels: [
        { year: "1st Year", students: 84 },
        { year: "2nd Year", students: 72 },
        { year: "3rd Year", students: 61 },
        { year: "4th Year", students: 53 },
      ],
    },
  ];

  const courseStudentDirectory: CourseStudentDirectory = {
    "BS Nursing": {
      "1st Year": ["Alyssa Ramos", "John Carlo Rivera", "Mika Tan", "Patricia Gomez", "Noel Mendoza"],
      "2nd Year": ["Angelica Cruz", "Jerome Garcia", "Mia Santos", "Rachel Flores", "Lea Bautista"],
      "3rd Year": ["Karen Dela Cruz", "Mark Villanueva", "Sophia Lim", "Chloe Reyes", "Lloyd Javier"],
      "4th Year": ["Hazel Navarro", "Paolo Dizon", "Tricia Mendoza", "Vince Mercado", "Shane Aquino"],
    },
    "BS Information Technology": {
      "1st Year": ["Kevin Torres", "Neil Castro", "Aaron Magno", "Jessa Pangan", "Janelle Ong"],
      "2nd Year": ["Daniel Yap", "Princess Diaz", "Kim Alonzo", "Ralph Espino", "Mae Salazar"],
      "3rd Year": ["Franco Dela Rosa", "Eunice Tolentino", "Bryan Ramos", "Ivy Caballero", "Sean Velasco"],
      "4th Year": ["Kyle David", "Rica Morales", "Nico Javier", "Alexa Cruz", "Pauline Chua"],
    },
    "BS Civil Engineering": {
      "1st Year": ["Joshua Aguilar", "Ian Simeon", "Paula Mendoza", "Nica Robles", "Warren Uy"],
      "2nd Year": ["Justine Go", "Rica Manalo", "Lance Mejia", "Bea Cordero", "Renz Domingo"],
      "3rd Year": ["Ariane Lacson", "Miguel Tolentino", "Raine Cabrera", "Noah de Leon", "Jude Salonga"],
      "4th Year": ["Tristan Laurel", "Megan Zafra", "Carlo Simbulan", "Nina Esteban", "Alden Santos"],
    },
    "BS Accountancy": {
      "1st Year": ["Aileen Pineda", "Krizelle Ramos", "Ethan Castillo", "Ralph Tiu", "Jam Ortega"],
      "2nd Year": ["Meryl Pascual", "Eli Cortez", "Camille Ventura", "Jon Santos", "Liza Fajardo"],
      "3rd Year": ["Sophia Dizon", "Troy Abad", "Mina Arcilla", "Faye Navarro", "Nash Bautista"],
      "4th Year": ["Paige Montero", "Harvey Ocampo", "Trina Serrano", "Rico Valencia", "Jules Pangan"],
    },
  };

  const vocationalStudentDirectory: VocationalStudentDirectory = {
    "Forklift NCII": {
      "Batch A": ["Miguel Ramos", "Jayson Cruz", "Mark Dela Pena", "John Velasco", "Ariel Aquino"],
      "Batch B": ["Carlo Reyes", "Nathan Salazar", "Jude Flores", "Lance Castro", "Edwin Javier"],
      "Batch C": ["Paolo Garcia", "Noel Mariano", "Clyde Mendoza", "Troy Santos", "Renz Cabrera"],
      "Batch D": ["Ethan Lim", "Vince Gonzales", "Bryan Mercado", "Shane Rivera", "Kurt Domingo"],
    },
    "Housekeeping NCII": {
      "Batch A": ["Mae Ramos", "Joy Tan", "Kylie Gomez", "Patricia Cruz", "Andrea Flores"],
      "Batch B": ["Hazel Dizon", "Lea Pangan", "Mica Uy", "Rica Torres", "Claire Navarro"],
      "Batch C": ["Alyssa Santos", "Mina Bautista", "Jessa Robles", "Nina David", "Faye Ocampo"],
      "Batch D": ["Trina Mercado", "Paige Montero", "Camille Ventura", "Liza Fajardo", "Bea Cordero"],
    },
    "Health Care Services NCII": {
      "Batch A": ["Sophia Lim", "Rachel Aquino", "Karen Dela Cruz", "Angelica Cruz", "Mia Santos"],
      "Batch B": ["Eunice Tolentino", "Janelle Ong", "Alexa Cruz", "Pauline Chua", "Rica Morales"],
      "Batch C": ["Megan Zafra", "Nica Robles", "Raine Cabrera", "Ariane Lacson", "Nina Esteban"],
      "Batch D": ["Tricia Mendoza", "Lea Bautista", "Meryl Pascual", "Faye Navarro", "Jam Ortega"],
    },
  };

  const vocationalTrends: VocationalTrend[] = [
    {
      program: "Forklift NCII",
      total: 96,
      colorClass: "bg-cyan-500",
      breakdown: [
        { label: "Batch A", students: 28 },
        { label: "Batch B", students: 24 },
        { label: "Batch C", students: 22 },
        { label: "Batch D", students: 22 },
      ],
    },
    {
      program: "Housekeeping NCII",
      total: 84,
      colorClass: "bg-emerald-500",
      breakdown: [
        { label: "Batch A", students: 22 },
        { label: "Batch B", students: 21 },
        { label: "Batch C", students: 20 },
        { label: "Batch D", students: 21 },
      ],
    },
    {
      program: "Health Care Services NCII",
      total: 78,
      colorClass: "bg-violet-500",
      breakdown: [
        { label: "Batch A", students: 19 },
        { label: "Batch B", students: 20 },
        { label: "Batch C", students: 20 },
        { label: "Batch D", students: 19 },
      ],
    },
  ];

  const loadAdmissions = async () => {
    try {
      const response = await apiFetch("/admin/admissions");
      const rows = (response as { applications?: AdmissionApplication[] }).applications ?? [];
      setAdmissions(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load admissions.");
    }
  };

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
    setLoading(true);
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
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    apiFetch("/admin/dashboard-stats")
      .then((response) => {
        if (!alive) return;
        const payload = response as Partial<DashboardStats>;
        setDashboardStats({
          students: Number(payload.students ?? 0),
          faculty: Number(payload.faculty ?? 0),
          classes: Number(payload.classes ?? 0),
          departments: Number(payload.departments ?? 0),
        });
      })
      .catch(() => {
        if (!alive) return;
        setDashboardStats({ students: 0, faculty: 0, classes: 0, departments: 0 });
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
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

    fetchMessages(false);
    const timer = window.setInterval(() => {
      fetchMessages(true);
    }, 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const candidates = [`/admin/users?role=${userRoleFilter}`, "/admin/users"];
        let loaded: UserItem[] = [];
        for (const path of candidates) {
          try {
            const response = await apiFetch(path);
            const rows = extractUserRows(response);
            if (rows.length > 0) {
              if (path === "/admin/users") {
                const filteredByRole = rows.filter((row) => {
                  const role = (row.role ?? "").toLowerCase();
                  return role === userRoleFilter;
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
        if (!alive) return;
        setUsers(loaded);
      } catch {
        if (!alive) return;
        setUsers([]);
      } finally {
        if (alive) setLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => {
      alive = false;
    };
  }, [userRoleFilter]);

  const stats = {
    totalStudents: dashboardStats.students,
    totalFaculty: dashboardStats.faculty,
    totalClasses: dashboardStats.classes,
    totalDepartments: dashboardStats.departments,
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleViewAllUsersScroll = (event: UIEvent<HTMLDivElement>) => {
    if (loadingUsers || !hasMoreUsers) return;
    const container = event.currentTarget;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 24;
    if (!nearBottom) return;

    setVisibleAccountsCount((current) => Math.min(current + 5, filteredUsers.length));
  };

  const handleAddDepartment = () => {
    if (!newDepartment.name || !newDepartment.head) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const dept: Department = {
      id: departments.length + 1,
      ...newDepartment,
      faculty: 0,
      students: 0,
      classes: 0,
    };
    
    setDepartments([...departments, dept]);
    setNewDepartment({ name: "", head: "" });
    setAddDepartmentOpen(false);
    toast.success(`Department "${dept.name}" added successfully`);
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
  const activeSenderMessages = activeMessagePreview
    ? sortedMessages.filter(
        (msg) => msg.email.toLowerCase() === activeMessagePreview.email.toLowerCase()
      )
    : [];
  const latestMessages = sortedMessages.slice(0, 3);

  const handleNavClick = (section: string) => {
    toast(`Navigating to ${section}...`, { icon: "🔗" });
  };
  const setAdminTabFromMobile = (tab: "users" | "departments" | "admissions" | "vocationals") => {
    setActiveAdminTab(tab);
    setMobileMenuOpen(false);
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

  const pendingAdmissions = admissions.filter((item) => item.status === "pending" && (item.application_type ?? "admission") === "admission");
  const pendingVocationals = admissions.filter((item) => item.status === "pending" && (item.application_type ?? "admission") === "vocational");
  const masterlistRows = admissions.filter((item) => (item.application_type ?? "admission") === masterlistType);
  const masterlistCourses = Array.from(new Set(masterlistRows.map((item) => item.primary_course).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
  const filteredMasterlistRows = masterlistRows.filter((item) =>
    masterlistCourseFilter === "all" ? true : item.primary_course === masterlistCourseFilter
  );
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
    setActiveAdminTab("users");
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
      await loadAdmissions();
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
      await loadAdmissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject admission.");
    } finally {
      setSubmittingReject(false);
    }
  };

  const openMasterlist = (type: AdmissionType) => {
    setMasterlistType(type);
    setMasterlistCourseFilter("all");
    setMasterlistOpen(true);
  };

  const openScheduleModal = (application: AdmissionApplication) => {
    const payload = application.exam_schedule_payload ?? {};
    setScheduleTarget(application);
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

  const handleSendExamSchedule = async () => {
    if (!scheduleTarget) return;
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
      const response = await apiFetch(`/admin/admissions/${scheduleTarget.id}/send-exam-schedule`, {
        method: "POST",
        body: JSON.stringify({
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
        }),
      });
      toast.success((response as { message?: string }).message ?? "Exam schedule sent.");
      setScheduleModalOpen(false);
      setScheduleTarget(null);
      await loadAdmissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send exam schedule.");
    } finally {
      setSendingSchedule(false);
    }
  };

  const handleUpdateExamStatus = async (id: number, examStatus: ExamStatus) => {
    setUpdatingExamStatusId(id);
    try {
      await apiFetch(`/admin/admissions/${id}/exam-status`, {
        method: "PATCH",
        body: JSON.stringify({ exam_status: examStatus }),
      });
      setAdmissions((prev) => prev.map((row) => (row.id === id ? { ...row, exam_status: examStatus } : row)));
      toast.success("Exam status updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update exam status.");
    } finally {
      setUpdatingExamStatusId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <AdminDashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="hidden xl:flex xl:w-64 xl:flex-col xl:border-r xl:border-slate-200/80 xl:bg-white xl:dark:border-white/10 xl:dark:bg-slate-900">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/80 px-4 py-5 dark:border-white/10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-20 w-20 ring-4 ring-blue-100 ring-offset-2 shadow-lg dark:ring-blue-900/50 dark:ring-offset-slate-900">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Administrator</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">admin@tclass.local</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">System Management</p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
            <div className="space-y-1">
              <Link
                href="/admin"
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeAdminTab === "users"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                <School className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => handleNavClick("Reports")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4" />
                Reports
              </button>
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
                href="/admin/departments"
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
                href="/admin/admissions"
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeAdminTab === "admissions"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Admissions
              </Link>
              <Link
                href="/admin/vocationals"
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeAdminTab === "vocationals"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Vocationals
              </Link>
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
            <div className="-ml-2 flex min-w-0 items-center gap-0 self-stretch">
              <Image
                src="/tclass_logo.png"
                alt="TClass Logo"
                width={90}
                height={90}
                className="block h-[90px] w-[90px] shrink-0 self-center object-contain"
              />
              <span className="-ml-4 hidden text-base font-bold leading-none text-slate-900 dark:text-slate-100 md:block">
                Tarlac Center for Learning and Skills Success
              </span>
              <span className="-ml-4 hidden text-base font-bold leading-none text-slate-900 dark:text-slate-100 sm:block md:hidden">
                TCLASS Admin Portal
              </span>
            </div>

            <div className="flex-1" />

            {/* Right Section */}
            <div className="flex items-center gap-2 xl:gap-3 shrink-0">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search sections..." 
                  className="w-44 rounded-full border-slate-200 bg-slate-50/90 pl-9 text-slate-700 placeholder:text-slate-500 focus-visible:bg-white lg:w-48 xl:w-56 2xl:w-64 dark:border-white/15 dark:bg-slate-900/85 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:bg-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                      ) : latestMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <Inbox className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">No messages yet</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Messages will appear here</p>
                        </div>
                      ) : (
                        latestMessages.map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            onClick={() => {
                              setShowNotifications(false);
                              setAllMessagesOpen(true);
                              setSelectedMessageThread(msg);
                            }}
                            className={`group flex w-full items-start gap-2.5 p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 ${
                              !msg.is_read ? "bg-blue-50 dark:bg-blue-950/30" : "bg-transparent"
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              !msg.is_read 
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}>
                              {msg.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`truncate text-xs ${!msg.is_read ? "font-semibold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                                  {msg.full_name}
                                </p>
                                {!msg.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                              </div>
                              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{msg.email}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{msg.message}</p>
                              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{formatRelativeTime(msg.created_at)}</p>
                            </div>
                          </button>
                        ))
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
                  initials="AD"
                  onLogout={handleLogout}
                  onSettings={() => handleNavClick("Settings")}
                  name="Administrator"
                  subtitle="admin@tclass.local"
                  triggerName="Administrator"
                  triggerSubtitle="admin@tclass.local"
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
                  activeAdminTab === "admissions"
                    ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400/70 dark:bg-blue-500"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Admissions
              </button>
              <button
                onClick={() => setAdminTabFromMobile("vocationals")}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeAdminTab === "vocationals"
                    ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400/70 dark:bg-blue-500"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Vocationals
              </button>
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
                  setActiveAdminTab("users");
                  setMobileSearchOpen(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Users
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAdminTab("departments");
                  setMobileSearchOpen(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Departments
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAdminTab("admissions");
                  setMobileSearchOpen(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Admissions
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAdminTab("vocationals");
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
                              setActiveAdminTab("departments");
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
                                setActiveAdminTab(targetTab);
                                setMobileSearchOpen(false);
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                            >
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.full_name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {(item.application_type ?? "admission") === "vocational" ? "Vocational" : "Admission"} • {item.primary_course}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.02em] text-slate-600">Students</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalStudents}</p>
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
                  <p className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalFaculty}</p>
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
                  <p className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalClasses}</p>
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
                  <p className="text-lg sm:text-xl font-bold text-slate-900">{stats.totalDepartments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            <Tabs value={activeAdminTab} onValueChange={(value) => setActiveAdminTab(value as AdminSectionTab)} className="w-full">

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
                          variant="outline"
                          className="hidden md:inline-flex"
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
                        <p className="rounded-lg border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">Loading users...</p>
                      ) : filteredUsers.length === 0 ? (
                        <p className="rounded-lg border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">No users found.</p>
                      ) : filteredUsers.slice(0, 1).map((user) => (
                        <div key={user.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/30">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-xs bg-slate-100">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                                <p className="truncate text-xs text-slate-500">{user.email}</p>
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
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingUsers ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                Loading users...
                              </TableCell>
                            </TableRow>
                          ) : filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-slate-500 py-8">
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
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
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
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="departments" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle>Departments</CardTitle>
                        <CardDescription>Academic departments overview</CardDescription>
                      </div>
                      <Dialog open={addDepartmentOpen} onOpenChange={setAddDepartmentOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Department
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Department</DialogTitle>
                            <DialogDescription>
                              Create a new academic department.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="dept-name">Department Name</Label>
                              <Input 
                                id="dept-name" 
                                placeholder="e.g., Computer Science"
                                value={newDepartment.name}
                                onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dept-head">Department Head</Label>
                              <Input 
                                id="dept-head" 
                                placeholder="e.g., Prof. Smith"
                                value={newDepartment.head}
                                onChange={(e) => setNewDepartment({...newDepartment, head: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setAddDepartmentOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddDepartment}>Add Department</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {departments.map((dept) => (
                        <div key={dept.id} className="flex flex-col gap-3 p-3 sm:p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                              <p className="text-sm text-slate-600">Head: {dept.head}</p>
                            </div>
                          </div>
                          <div className="grid w-full grid-cols-3 gap-3 text-sm sm:w-auto sm:flex sm:gap-6">
                            <div className="text-center">
                              <p className="font-semibold text-slate-900">{dept.faculty}</p>
                              <p className="text-slate-500">Faculty</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-slate-900">{dept.students}</p>
                              <p className="text-slate-500">Students</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-slate-900">{dept.classes}</p>
                              <p className="text-slate-500">Classes</p>
                            </div>
                          </div>
                        </div>
                      ))}
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
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 self-start"
                        onClick={() => openMasterlist("admission")}
                      >
                        <Users className="h-4 w-4" />
                        View List
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {pendingAdmissions.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-slate-600">No pending admissions right now.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingAdmissions.map((item) => (
                          <div key={item.id} className="border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col items-start gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{item.full_name}</p>
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
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                              <Button
                                size="sm"
                                type="button"
                                className="w-full bg-sky-100 text-sky-700 hover:bg-sky-200 sm:w-auto"
                                onClick={() => openScheduleModal(item)}
                                disabled={approvingAdmissionId === item.id || submittingReject}
                              >
                                Send a Schedule
                              </Button>
                              <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                                onClick={() => handleApproveAdmission(item.id)}
                                disabled={approvingAdmissionId === item.id || submittingReject}
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
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 self-start"
                        onClick={() => openMasterlist("vocational")}
                      >
                        <Users className="h-4 w-4" />
                        View List
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {pendingVocationals.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-slate-600">No pending vocational applications right now.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingVocationals.map((item) => (
                          <div key={item.id} className="border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col items-start gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{item.full_name}</p>
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
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                              <Button
                                size="sm"
                                type="button"
                                className="w-full bg-sky-100 text-sky-700 hover:bg-sky-200 sm:w-auto"
                                onClick={() => openScheduleModal(item)}
                                disabled={approvingAdmissionId === item.id || submittingReject}
                              >
                                Send a Schedule
                              </Button>
                              <Button
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                                onClick={() => handleApproveAdmission(item.id)}
                                disabled={approvingAdmissionId === item.id || submittingReject}
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
            </Tabs>
          </div>

          {/* Sidebar */}
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
                  {vocationalTrends.map((trend) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enrollment Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Enrollment Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseTrends.map((trend) => (
                    <button
                      key={trend.course}
                      type="button"
                      onClick={() => {
                        setSelectedTrendCourse(trend);
                        setSelectedYearLevel(null);
                        setCourseTrendModalOpen(true);
                      }}
                      className="w-full text-left rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{trend.course}</span>
                        <span className="font-medium">{trend.total} students</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full">
                        <div className={`h-full ${trend.colorClass} rounded-full`} style={{ width: `${Math.min(100, Math.round((trend.total / 450) * 100))}%` }}></div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
              onClick={() => setActiveAdminTab("users")}
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
              onClick={() => setActiveAdminTab("departments")}
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
              onClick={() => setActiveAdminTab("admissions")}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                activeAdminTab === "admissions"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Admit
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab("vocationals")}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${
                activeAdminTab === "vocationals"
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
                    View all messages from {activeMessagePreview.full_name.split(" ")[0]} →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input 
                  id="edit-name" 
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value: "Student" | "Faculty" | "Admin") => setSelectedUser({...selectedUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={selectedUser.status} 
                  onValueChange={(value: "active" | "pending" | "inactive") => setSelectedUser({...selectedUser, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Full-Featured Message Inbox Dialog */}
      <Dialog open={allMessagesOpen} onOpenChange={(open) => {
        setAllMessagesOpen(open);
        if (!open) setSelectedMessageThread(null);
      }}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
          {!selectedMessageThread ? (
            /* Message List View */
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Messages</DialogTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {sortedMessages.length} total · {unreadCount} unread
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={handleClearNotifications}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setAllMessagesOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Search and Filters */}
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-700">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search messages..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-sm"
                  />
                </div>
                <Select value={messageFilter} onValueChange={(v) => setMessageFilter(v as "all" | "unread" | "read")}>
                  <SelectTrigger className="h-9 w-[110px] text-xs">
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
              <div className="flex-1 overflow-y-auto">
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
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedMessages
                      .filter((msg) => {
                        const matchesSearch = 
                          msg.full_name.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                          msg.email.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                          msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase());
                        const matchesFilter = 
                          messageFilter === "all" || 
                          (messageFilter === "unread" && !msg.is_read) ||
                          (messageFilter === "read" && msg.is_read);
                        return matchesSearch && matchesFilter;
                      })
                      .map((msg) => (
                        <button
                          key={msg.id}
                          type="button"
                          onClick={() => setSelectedMessageThread(msg)}
                          className={`group flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                            !msg.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            !msg.is_read 
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
                              : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {msg.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          
                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`truncate text-sm ${!msg.is_read ? "font-semibold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                                {msg.full_name}
                              </p>
                              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                                {formatRelativeTime(msg.created_at)}
                              </span>
                            </div>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{msg.email}</p>
                            <p className={`mt-1 line-clamp-2 text-sm ${!msg.is_read ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>
                              {msg.message}
                            </p>
                          </div>
                          
                          {/* Unread indicator */}
                          {!msg.is_read && (
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Message Detail View */
            <>
              {/* Detail Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setSelectedMessageThread(null);
                    handleOpenMessage(selectedMessageThread.id);
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {selectedMessageThread.full_name}
                  </DialogTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedMessageThread.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setAllMessagesOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Sender Info Card */}
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-base font-semibold text-white">
                      {selectedMessageThread.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedMessageThread.full_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selectedMessageThread.email}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(selectedMessageThread.created_at).toLocaleString()}
                        </span>
                        {!selectedMessageThread.is_read && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Message Body */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedMessageThread.message}
                  </p>
                </div>
                
                {/* Thread History */}
                {activeSenderMessages.length > 1 && (
                  <div className="mt-6">
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <CornerUpLeft className="h-3.5 w-3.5" />
                      Conversation History ({activeSenderMessages.length} messages)
                    </h4>
                    <div className="space-y-3">
                      {activeSenderMessages
                        .filter((msg) => msg.id !== selectedMessageThread.id)
                        .map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            onClick={() => setSelectedMessageThread(msg)}
                            className={`w-full rounded-lg border p-3 text-left transition-colors ${
                              !msg.is_read 
                                ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20" 
                                : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatRelativeTime(msg.created_at)}
                              </span>
                              {!msg.is_read && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  Unread
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{msg.message}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setSelectedMessageThread(null);
                    handleOpenMessage(selectedMessageThread.id);
                  }}
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark as Read
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open(`mailto:${selectedMessageThread.email}?subject=Re: Your message to TClass&body=\n\n--- Original Message ---\nFrom: ${selectedMessageThread.full_name}\nDate: ${new Date(selectedMessageThread.created_at).toLocaleString()}\n\n${selectedMessageThread.message}`, "_blank")}
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                    onClick={() => {
                      setSelectedMessageThread(null);
                      toast.success("Message archived");
                    }}
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
              <p className="rounded-lg border border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
                Loading users...
              </p>
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

      <Dialog open={masterlistOpen} onOpenChange={setMasterlistOpen}>
        <DialogContent className="flex h-[80vh] w-[calc(100vw-2rem)] max-w-[min(92vw,1320px)] flex-col border border-slate-200 bg-neutral-50 dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              {masterlistType === "vocational" ? "Certificate" : "Diploma"} Masterlist
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              Students who submitted forms. Filter by course and update entrance exam result status.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Form Type</Label>
              <Select value={masterlistType} onValueChange={(v) => setMasterlistType(v as AdmissionType)}>
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
                  <TableHead>Exam Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMasterlistRows.map((item) => (
                  <TableRow key={`master-${item.id}`}>
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
                        value={item.exam_status ?? "not_attended"}
                        onValueChange={(value) => handleUpdateExamStatus(item.id, value as ExamStatus)}
                        disabled={updatingExamStatusId === item.id}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="not_attended">Not Attended</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMasterlistRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      No submitted forms found for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMasterlistOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scheduleModalOpen}
        onOpenChange={(open) => {
          setScheduleModalOpen(open);
          if (!open) setScheduleTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl border border-slate-200 bg-neutral-50 dark:border-slate-700 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Send Entrance Exam Schedule</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
              Compose and send an exam invitation email to {scheduleTarget?.full_name ?? "the applicant"} ({scheduleTarget?.email ?? "-"}).
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] space-y-4 overflow-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-subject">Email Subject</Label>
                <Input id="exam-subject" value={scheduleForm.subject} onChange={(e) => setScheduleForm((p) => ({ ...p, subject: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-intro">Intro Message</Label>
                <Textarea
                  id="exam-intro"
                  rows={3}
                  value={scheduleForm.intro_message}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, intro_message: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-date">Date</Label>
                <Input id="exam-date" type="date" value={scheduleForm.exam_date} onChange={(e) => setScheduleForm((p) => ({ ...p, exam_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-time">Time</Label>
                <Input id="exam-time" type="time" value={scheduleForm.exam_time} onChange={(e) => setScheduleForm((p) => ({ ...p, exam_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-day">Day</Label>
                <Input id="exam-day" placeholder="e.g. Monday" value={scheduleForm.exam_day} onChange={(e) => setScheduleForm((p) => ({ ...p, exam_day: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-location">Where</Label>
                <Input id="exam-location" value={scheduleForm.location} onChange={(e) => setScheduleForm((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-bring">Things to Bring</Label>
                <Textarea
                  id="exam-bring"
                  rows={4}
                  value={scheduleForm.things_to_bring}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, things_to_bring: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-attire">Note (Proper Attire)</Label>
                <Textarea
                  id="exam-attire"
                  rows={2}
                  value={scheduleForm.attire_note}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, attire_note: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-note">Additional Note (Optional)</Label>
                <Textarea
                  id="exam-note"
                  rows={2}
                  value={scheduleForm.additional_note}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, additional_note: e.target.value }))}
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
                "Send a Schedule"
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

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
