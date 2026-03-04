import type { ElementType } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  Globe,
  HeartPulse,
  History,
  Home,
  Library,
  ListChecks,
  Search,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";

export type Section =
  | "home"
  | "enrolled-subjects"
  | "class-schedule"
  | "enrollment-history"
  | "report-of-grades"
  | "academic-evaluation"
  | "student-enrollment"
  | "student-ledger"
  | "online-services"
  | "community"
  | "asce-library"
  | "healthcare-services";

export type NavItem = {
  label: string;
  icon: ElementType;
  section?: Section;
  children?: { label: string; icon: ElementType; section: Section }[];
};

export const studentProfile = {
  initials: "JM",
  name: "Joseph Menor Mangubat",
  email: "joseph.mangubat@tclass.edu",
  number: "2023203531",
  program: "",
  year: "",
  section: "",
};

export const sectionTitle: Record<Section, string> = {
  home: "Student Dashboard",
  "enrolled-subjects": "Enrolled Subjects",
  "class-schedule": "Class Schedule",
  "enrollment-history": "Enrollment History",
  "report-of-grades": "Report of Grades",
  "academic-evaluation": "Academic Evaluation",
  "student-enrollment": "Enrollment",
  "student-ledger": "Student Ledger",
  "online-services": "Online Services",
  community: "Community",
  "asce-library": "ASCE Library",
  "healthcare-services": "Healthcare Services",
};

export const navItems: NavItem[] = [
  { label: "Home", icon: Home, section: "home" },
  {
    label: "Class Records",
    icon: BookOpen,
    children: [
      { label: "Enrolled Subjects", icon: ClipboardList, section: "enrolled-subjects" },
      { label: "Class Schedule", icon: Calendar, section: "class-schedule" },
      { label: "Enrollment History", icon: History, section: "enrollment-history" },
    ],
  },
  {
    label: "Academic Records",
    icon: ListChecks,
    children: [
      { label: "Report of Grades", icon: ClipboardList, section: "report-of-grades" },
      { label: "Academic Evaluation", icon: ShieldCheck, section: "academic-evaluation" },
    ],
  },
  {
    label: "Online Services",
    icon: Globe,
    children: [
      { label: "Enrollment", icon: ClipboardList, section: "student-enrollment" },
      { label: "Student Ledger", icon: Wallet, section: "student-ledger" },
    ],
  },
];

export const mobileTabs: { label: string; icon: ElementType; section: Section }[] = [
  { label: "Home", icon: Home, section: "home" },
  { label: "Subjects", icon: ClipboardList, section: "enrolled-subjects" },
  { label: "Schedule", icon: Calendar, section: "class-schedule" },
  { label: "Grades", icon: ListChecks, section: "report-of-grades" },
];

export const mobileMoreSections: Section[] = [
  "enrollment-history",
  "academic-evaluation",
  "student-enrollment",
  "student-ledger",
  "online-services",
];

export const dashboardStats = [
  { label: "Student Number", value: studentProfile.number, sub: undefined, icon: User },
  { label: "Program", value: studentProfile.program, sub: "Bachelor of Science in Information Technology", icon: BookOpen },
  { label: "Year Level", value: studentProfile.year, sub: undefined, icon: ListChecks },
  { label: "Outstanding Balance", value: "PHP 0.00", sub: undefined, icon: Wallet },
  { label: "Pending Online Payment", value: "PHP 0.00", sub: undefined, icon: Wallet },
  { label: "Cumulative GWA", value: "1.8468", sub: "Static", icon: ShieldCheck },
];

export const todaySchedule = [
  { time: "11:00 AM", code: "TEC 302", room: "L306A" },
  { time: "03:00 PM", code: "TEC 264", room: "L206" },
];

export const enrolledSubjectRows = [
  ["FSM 314", "Product Design, Packaging and Labelling", "3.00", "BSIT-3A", "L209 T 07:00 AM - 10:00 AM"],
  ["TEC 302", "Research 2 - Undergraduate Thesis", "3.00", "BSIT-3A", "L306A F 11:00 AM - 02:00 PM"],
  ["TEC 264", "Teaching Common Competencies in Industrial Arts", "3.00", "BSIT-3A", "L206 F 03:00 PM - 06:00 PM"],
  ["TEC 262", "Teaching Competencies in Home Economics", "3.00", "BSIT-3A", "L306A T 03:00 PM - 06:00 PM"],
  ["TEC 266", "Teaching Competencies in Agri-Fishery Arts", "3.00", "BSIT-3A", "L206 T 03:00 PM - 06:00 PM"],
  ["TEC 265", "Teaching Competencies in ICT", "3.00", "BSIT-3A", "L306A W 11:00 AM - 02:00 PM"],
];

export const classScheduleCards = [
  ["Tuesday", "FSM 314", "7:00 AM - 10:00 AM", "L209", "border-blue-300 bg-blue-50/70 dark:border-blue-400/30 dark:bg-blue-500/10"],
  ["Wednesday", "TEC 265", "11:00 AM - 2:00 PM", "L306A", "border-blue-300 bg-blue-50/70 dark:border-blue-400/30 dark:bg-blue-500/10"],
  ["Friday", "TEC 302", "11:00 AM - 2:00 PM", "L306A", "border-blue-300 bg-blue-50/70 dark:border-blue-400/30 dark:bg-blue-500/10"],
  ["Tuesday", "TEC 262", "3:00 PM - 6:00 PM", "L306A", "border-blue-300 bg-blue-50/70 dark:border-blue-400/30 dark:bg-blue-500/10"],
  ["Wednesday", "TEC 266", "3:00 PM - 6:00 PM", "L206", "border-blue-300 bg-blue-50/70 dark:border-blue-400/30 dark:bg-blue-500/10"],
  ["Friday", "TEC 264", "3:00 PM - 6:00 PM", "L206", "border-blue-300 bg-blue-50/70 dark:border-blue-400/30 dark:bg-blue-500/10"],
] as const;

export const enrollmentHistoryItems = [
  ["2025-2026 2nd Semester", "267409999", "Jan 14 2026 11:51 AM", "0.0000", "bg-emerald-500"],
  ["2025-2026 1st Semester", "26719715", "Aug 14 2025 01:00 PM", "1.8587", "bg-pink-500"],
  ["2025 Summer", "26689818", "Jun 11 2025 09:54 AM", "1.8750", "bg-rose-500"],
] as const;

export const gradeRows = [
  ["FSM 212", "Advanced Baking", "3.00", "2.00", "1.75", "Passed", "1/6/2026 3:28 PM"],
  ["PED-TVE 212", "Curriculum Development and Evaluation II", "3.00", "2.25", "2.25", "Passed", "1/7/2026 10:38 AM"],
  ["FSM 221", "International Cuisine", "3.00", "1.50", "1.50", "Passed", "1/7/2026 1:21 PM"],
  ["FSM 222", "Quantity Cookery", "3.00", "1.75", "1.50", "Passed", "1/7/2026 2:08 PM"],
  ["FSM 311", "Cafeteria and Catering Management", "3.00", "1.75", "1.75", "Passed", "1/8/2026 8:47 AM"],
  ["TEC 301", "Research I - Methods of Research", "3.00", "2.00", "2.00", "Passed", "1/8/2026 1:15 PM"],
  ["PATHFit 3", "Physical Activities Toward Health and Fitness 3", "2.00", "1.50", "1.50", "Passed", "1/9/2026 11:22 AM"],
  ["FSM 313", "Sensory Evaluation", "3.00", "2.50", "2.50", "Passed", "1/9/2026 3:04 PM"],
];

export const evaluationRows = [
  ["1st Year - Summer", "NSTP 2", "ROTC/CWTS/LTS 2", "-", "Credited"],
  ["1st Year - Summer", "FSM 111", "Occupational Health and Safety", "-", "Passed"],
  ["1st Year - Summer", "FSM 112", "Food Selection, Preparation", "-", "Passed"],
  ["2nd Year - 1st Sem", "EDUC 251", "Facilitating Learner-Centered Teaching", "EDUC 101", "Passed"],
  ["2nd Year - 1st Sem", "EDUC 256", "Building and Enhancing Literacy Across Curriculum", "-", "Passed"],
  ["2nd Year - 2nd Sem", "EDUC 255", "Curriculum Development and Evaluation II", "EDUC 251", "Passed"],
  ["2nd Year - 2nd Sem", "EDUC 104", "Foundations of Special and Inclusive Education", "EDUC 101", "Credited"],
];

export const ledgerRows = [
  ["2023-2024 1st Semester", "8/11/2023", "REG", "26599737", "0.00", "0.00", "0.00", "Enrollment", "8/11/2023"],
  ["", "8/11/2023", "REG", "26599737", "0.00", "6,135.00", "0.00", "Scho.Provider: FREE TUITION", "8/11/2023"],
  ["*** Ending Balance for 2023-2024 1st Semester ***", "", "", "", "", "", "0.00", "Term Balance: 0.00", "9/13/2023"],
  ["2023-2024 1st Trimester", "8/23/2023", "OTHR", "566799", "970.00", "0.00", "0.00", "Other Assmt", "8/23/2023"],
  ["", "8/23/2023", "OR", "00336833", "0.00", "970.00", "0.00", "Payment OTHR:566799", "8/23/2023"],
  ["*** Ending Balance for 2023-2024 1st Trimester ***", "", "", "", "", "", "0.00", "Term Balance: 0.00", "8/23/2023"],
  ["2023-2024 2nd Semester", "1/11/2024", "REG", "26615738", "0.00", "6,845.00", "0.00", "Scho.Provider: FREE TUITION", "1/11/2024"],
  ["*** Ending Balance for 2023-2024 2nd Semester ***", "", "", "", "", "", "0.00", "Term Balance: 0.00", "3/6/2024"],
];

export const placeholderCards = {
  "online-services": [
    { title: "Online PDS", desc: "Update and review your personal data sheet.", icon: User },
    { title: "Payment Gateway", desc: "Track online payment transactions.", icon: Wallet },
    { title: "Certificate Requests", desc: "Request and download student documents.", icon: ClipboardList },
  ],
  community: [
    { title: "Announcements", desc: "University and department notices.", icon: Bell },
    { title: "Organizations", desc: "Student groups and community activity.", icon: User },
    { title: "Events", desc: "Upcoming campus events and activities.", icon: Calendar },
  ],
  "asce-library": [
    { title: "Digital Catalog", desc: "Search books and references.", icon: Search },
    { title: "Borrowing Requests", desc: "Submit and track borrowing requests.", icon: BookOpen },
    { title: "Research Support", desc: "Reference and citation support.", icon: Library },
  ],
  "healthcare-services": [
    { title: "Clinic Appointments", desc: "Book clinic appointments.", icon: HeartPulse },
    { title: "Medical Clearance", desc: "Track requirements and submissions.", icon: ShieldCheck },
    { title: "Health Advisories", desc: "View campus health notices.", icon: Bell },
  ],
} as const;
