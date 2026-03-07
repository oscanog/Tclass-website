"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  GraduationCap, 
  Bell, 
  Search, 
  Menu, 
  X, 
  ArrowLeft,
  Mail,
  Clock,
  CheckCircle,
  ExternalLink,
  File,
  Download,
  PlayCircle,
  MessageSquare,
  Truck,
  Home,
  Heart,
  Laptop,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Course {
  id: number;
  name: string;
  code: string;
  instructor: string;
  email: string;
  schedule: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  nextClass: string;
  description: string;
  materials: { id: number; name: string; type: string; size: string }[];
  category: "heavy-equipment" | "services" | "ict";
  duration: string;
  scholarship?: string;
  slots?: number;
  certification: string;
}

export default function CoursesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(3);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const [courses] = useState<Course[]>([
    // Heavy Equipment Operations
    { 
      id: 1, 
      name: "Rigid Highway Dump Truck NCII", 
      code: "HEO-DT-NCII",
      instructor: "Engr. Dela Cruz", 
      email: "delacruz@tclass.edu",
      schedule: "Mon/Wed/Fri 8:00 AM - 12:00 PM", 
      progress: 75,
      totalModules: 10,
      completedModules: 8,
      nextClass: "Tomorrow, 8:00 AM",
      description: "Comprehensive training on operating rigid highway dump trucks for construction and mining applications. Covers pre-operation inspection, safe driving techniques, load management, and routine maintenance. Includes hands-on practice with actual equipment.",
      materials: [
        { id: 1, name: "Course Syllabus - Dump Truck NCII", type: "PDF", size: "345 KB" },
        { id: 2, name: "Pre-Operation Inspection Checklist", type: "PDF", size: "890 KB" },
        { id: 3, name: "Safety Operation Manual", type: "PDF", size: "2.1 MB" },
        { id: 4, name: "Demo Video: Dump Truck Operations", type: "MP4", size: "125 MB" },
      ],
      category: "heavy-equipment",
      duration: "3 months",
      scholarship: "TCLASS Scholarship",
      certification: "TESDA NCII Certificate"
    },
    { 
      id: 2, 
      name: "Transit Mixer NCII", 
      code: "HEO-TM-NCII",
      instructor: "Engr. Santos", 
      email: "santos@tclass.edu",
      schedule: "Mon/Wed/Fri 1:00 PM - 5:00 PM", 
      progress: 60,
      totalModules: 10,
      completedModules: 6,
      nextClass: "Monday, 1:00 PM",
      description: "Specialized training for operating transit mixers (concrete mixer trucks) in construction sites. Learn concrete handling, drum rotation techniques, delivery procedures, and equipment maintenance. TESDA-accredited competency certification.",
      materials: [
        { id: 1, name: "Transit Mixer Operations Guide", type: "PDF", size: "1.8 MB" },
        { id: 2, name: "Concrete Handling Procedures", type: "PDF", size: "1.2 MB" },
        { id: 3, name: "Maintenance Checklist", type: "PDF", size: "567 KB" },
        { id: 4, name: "Training Videos", type: "MP4", size: "89 MB" },
      ],
      category: "heavy-equipment",
      duration: "3 months",
      scholarship: "TCLASS Scholarship",
      certification: "TESDA NCII Certificate"
    },
    { 
      id: 3, 
      name: "Forklift NCII", 
      code: "HEO-FL-NCII",
      instructor: "Sir. Reyes", 
      email: "reyes@tclass.edu",
      schedule: "Tue/Thu 8:00 AM - 4:00 PM", 
      progress: 85,
      totalModules: 8,
      completedModules: 7,
      nextClass: "Thursday, 8:00 AM",
      description: "Industrial forklift operations training covering counterbalance and reach trucks. Includes load capacity calculation, stacking techniques, warehouse navigation, and workplace safety protocols. Highly in-demand skill for logistics and manufacturing industries.",
      materials: [
        { id: 1, name: "Forklift Safety Manual", type: "PDF", size: "2.3 MB" },
        { id: 2, name: "Load Calculation Guide", type: "PDF", size: "890 KB" },
        { id: 3, name: "Warehouse Navigation Tips", type: "PDF", size: "456 KB" },
        { id: 4, name: "Practical Assessment Forms", type: "PDF", size: "234 KB" },
      ],
      category: "heavy-equipment",
      duration: "1 month",
      scholarship: "maYAP Scholarship",
      certification: "TESDA NCII Certificate"
    },
    // Services
    { 
      id: 4, 
      name: "Housekeeping NCII", 
      code: "SV-HK-NCII",
      instructor: "Ms. Garcia", 
      email: "garcia@tclass.edu",
      schedule: "Tue/Thu 1:00 PM - 5:00 PM", 
      progress: 70,
      totalModules: 8,
      completedModules: 6,
      nextClass: "Thursday, 1:00 PM",
      description: "Professional housekeeping training for hotels, resorts, hospitals, and commercial establishments. Covers room cleaning, linen management, sanitation protocols, customer service, and workplace safety. Prepares graduates for local and overseas employment.",
      materials: [
        { id: 1, name: "Housekeeping Procedures Manual", type: "PDF", size: "1.5 MB" },
        { id: 2, name: "Linen & Laundry Management", type: "PDF", size: "890 KB" },
        { id: 3, name: "Customer Service Guidelines", type: "PDF", size: "678 KB" },
        { id: 4, name: "Demo: Room Cleaning Techniques", type: "MP4", size: "45 MB" },
      ],
      category: "services",
      duration: "2 months",
      scholarship: "maYAP Scholarship",
      certification: "TESDA NCII Certificate"
    },
    { 
      id: 5, 
      name: "Health Care Services NCII", 
      code: "SV-HCS-NCII",
      instructor: "Ms. Mendoza, RN", 
      email: "mendoza@tclass.edu",
      schedule: "Mon-Fri 8:00 AM - 5:00 PM", 
      progress: 45,
      totalModules: 12,
      completedModules: 5,
      nextClass: "Tomorrow, 8:00 AM",
      description: "Entry-level healthcare training covering basic nursing assistant skills, patient care, vital signs monitoring, hygiene assistance, and emergency response. Ideal for those seeking employment in hospitals, clinics, nursing homes, and home care settings.",
      materials: [
        { id: 1, name: "Patient Care Fundamentals", type: "PDF", size: "3.2 MB" },
        { id: 2, name: "Vital Signs Monitoring Guide", type: "PDF", size: "1.1 MB" },
        { id: 3, name: "First Aid & Emergency Response", type: "PDF", size: "2.8 MB" },
        { id: 4, name: "Clinical Training Videos", type: "MP4", size: "156 MB" },
      ],
      category: "services",
      duration: "6 months",
      certification: "TESDA NCII Certificate"
    },
    // ICT
    { 
      id: 6, 
      name: "3-Year Diploma in ICT", 
      code: "ICT-DIP-3YR",
      instructor: "Engr. Tan", 
      email: "tan@tclass.edu",
      schedule: "Mon-Fri 8:00 AM - 4:00 PM", 
      progress: 30,
      totalModules: 36,
      completedModules: 11,
      nextClass: "Tomorrow, 8:00 AM",
      description: "Comprehensive 3-year diploma program in Information and Communications Technology. Covers programming, database management, networking, web development, and IT support. Graduates receive industry-recognized credentials and job placement assistance.",
      materials: [
        { id: 1, name: "ICT Diploma Curriculum", type: "PDF", size: "2.4 MB" },
        { id: 2, name: "Programming Fundamentals", type: "PDF", size: "4.5 MB" },
        { id: 3, name: "Network Configuration Guide", type: "PDF", size: "3.1 MB" },
        { id: 4, name: "Web Development Tutorials", type: "ZIP", size: "89 MB" },
      ],
      category: "ict",
      duration: "3 years",
      slots: 5,
      certification: "Diploma in ICT + TESDA Certificates"
    },
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const results = courses.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor.toLowerCase().includes(searchQuery.toLowerCase())
      );
      toast.success(`Found ${results.length} courses`);
    } else {
      toast.error("Please enter a search term");
    }
  };

  const handleNotificationClick = () => {
    toast.success("All notifications marked as read");
  };

  const openDetailsDialog = (course: Course) => {
    setSelectedCourse(course);
    setDetailsDialogOpen(true);
  };

  const openMaterialsDialog = (course: Course) => {
    setSelectedCourse(course);
    setMaterialsDialogOpen(true);
  };

  const openContactDialog = (course: Course) => {
    setSelectedCourse(course);
    setContactDialogOpen(true);
    setMessageSubject("");
    setMessageBody("");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success(`Message sent to ${selectedCourse?.instructor}!`);
    setContactDialogOpen(false);
    setMessageSubject("");
    setMessageBody("");
  };

  const handleDownloadMaterial = (material: { name: string; type: string }) => {
    toast.success(`Downloading ${material.name}...`);
  };

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <File className="h-5 w-5 text-red-500" />;
      case 'mp4': return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case 'docx': return <FileText className="h-5 w-5 text-blue-700" />;
      case 'zip': return <File className="h-5 w-5 text-yellow-500" />;
      default: return <File className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">TClass</span>
              </Link>
              <Badge variant="secondary" className="hidden sm:inline-flex">Student Portal</Badge>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/student" className="text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
              <Link href="/student/courses" className="text-sm font-medium text-blue-600">Courses</Link>
              <Link href="/student/assignments" className="text-sm font-medium text-slate-600 hover:text-slate-900">Assignments</Link>
              <Link href="/student/grades" className="text-sm font-medium text-slate-600 hover:text-slate-900">Grades</Link>
              <Link href="/student/calendar" className="text-sm font-medium text-slate-600 hover:text-slate-900">Calendar</Link>
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationClick}>
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              <Avatar className="hidden sm:flex">
                <AvatarFallback className="bg-blue-100 text-blue-700">JD</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              <Link href="/student" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50">Dashboard</Link>
              <Link href="/student/courses" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 bg-blue-50">Courses</Link>
              <Link href="/student/assignments" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50">Assignments</Link>
              <Link href="/student/grades" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50">Grades</Link>
              <Link href="/student/calendar" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50">Calendar</Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link href="/student" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
              <p className="text-slate-600 mt-1">Manage your enrolled courses and materials</p>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search courses..." 
                className="pl-9 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Card key={`course-loading-${index}`} className="border-slate-200/80 bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex flex-col items-end gap-1">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-5 w-28 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="mt-3 h-6 w-4/5" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-5 w-28 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-10" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-9 flex-1 rounded-md" />
                        <Skeleton className="h-9 flex-1 rounded-md" />
                        <Skeleton className="h-9 flex-1 rounded-md" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : filteredCourses.map((course) => {
            const getCategoryIcon = (category: string) => {
              switch (category) {
                case "heavy-equipment":
                  return <Truck className="h-6 w-6 text-amber-600" />;
                case "services":
                  return course.name.includes("Health") 
                    ? <Heart className="h-6 w-6 text-rose-600" />
                    : <Home className="h-6 w-6 text-emerald-600" />;
                case "ict":
                  return <Laptop className="h-6 w-6 text-blue-600" />;
                default:
                  return <BookOpen className="h-6 w-6 text-blue-600" />;
              }
            };

            const getCategoryBg = (category: string) => {
              switch (category) {
                case "heavy-equipment":
                  return "bg-amber-100";
                case "services":
                  return course.name.includes("Health") ? "bg-rose-100" : "bg-emerald-100";
                case "ict":
                  return "bg-blue-100";
                default:
                  return "bg-blue-100";
              }
            };

            const getCategoryBadge = (category: string) => {
              switch (category) {
                case "heavy-equipment":
                  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Heavy Equipment</Badge>;
                case "services":
                  return course.name.includes("Health") 
                    ? <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Healthcare</Badge>
                    : <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Services</Badge>;
                case "ict":
                  return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">ICT</Badge>;
                default:
                  return null;
              }
            };

            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 ${getCategoryBg(course.category)} rounded-lg`}>
                      {getCategoryIcon(course.category)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={course.progress >= 80 ? "default" : course.progress >= 50 ? "secondary" : "outline"}>
                        {course.code}
                      </Badge>
                      {getCategoryBadge(course.category)}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3">{course.name}</CardTitle>
                  <CardDescription>{course.instructor}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Duration & Scholarship */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {course.duration}
                      </Badge>
                      {course.scholarship && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          {course.scholarship}
                        </Badge>
                      )}
                      {course.slots !== undefined && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          {course.slots} slots left
                        </Badge>
                      )}
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Progress</span>
                        <span className="text-sm font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <p className="text-xs text-slate-500 mt-1">
                        {course.completedModules} of {course.totalModules} modules completed
                      </p>
                    </div>

                    {/* Schedule Info */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>{course.schedule}</span>
                    </div>

                    {/* Certification */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs">{course.certification}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openDetailsDialog(course)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openMaterialsDialog(course)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Materials
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openContactDialog(course)}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No courses found</h3>
            <p className="text-slate-600">Try adjusting your search terms</p>
          </div>
        )}

        {/* Course Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedCourse?.category === "heavy-equipment" && <Truck className="h-5 w-5 text-amber-600" />}
                {selectedCourse?.category === "services" && (selectedCourse.name.includes("Health") ? <Heart className="h-5 w-5 text-rose-600" /> : <Home className="h-5 w-5 text-emerald-600" />)}
                {selectedCourse?.category === "ict" && <Laptop className="h-5 w-5 text-blue-600" />}
                {selectedCourse?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedCourse?.category === "heavy-equipment" && "Heavy Equipment Operations"}
                {selectedCourse?.category === "services" && (selectedCourse.name.includes("Health") ? "Healthcare Services" : "Services")}
                {selectedCourse?.category === "ict" && "Information & Communications Technology"}
              </DialogDescription>
            </DialogHeader>
            {selectedCourse && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Course Code</p>
                    <p className="font-medium">{selectedCourse.code}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Duration</p>
                    <p className="font-medium">{selectedCourse.duration}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Instructor</p>
                    <p className="font-medium">{selectedCourse.instructor}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Certification</p>
                    <p className="font-medium text-green-600">{selectedCourse.certification}</p>
                  </div>
                </div>
                {selectedCourse.scholarship && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-slate-500">Scholarship</p>
                    <p className="font-medium text-yellow-700">{selectedCourse.scholarship}</p>
                  </div>
                )}
                {selectedCourse.slots !== undefined && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-slate-500">Available Slots</p>
                    <p className="font-medium text-red-600">{selectedCourse.slots} slots remaining</p>
                  </div>
                )}
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Schedule</p>
                  <p className="font-medium">{selectedCourse.schedule}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-2">Course Description</p>
                  <p className="text-sm">{selectedCourse.description}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Course Progress</span>
                    <span className="text-sm font-medium">{selectedCourse.progress}%</span>
                  </div>
                  <Progress value={selectedCourse.progress} className="h-2" />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{selectedCourse.completedModules} of {selectedCourse.totalModules} modules completed</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              <Button onClick={() => { setDetailsDialogOpen(false); openMaterialsDialog(selectedCourse!); }}>
                View Materials
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Materials Dialog */}
        <Dialog open={materialsDialogOpen} onOpenChange={setMaterialsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Course Materials
              </DialogTitle>
              <DialogDescription>{selectedCourse?.name} - {selectedCourse?.materials.length} files available</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedCourse?.materials.map((material) => (
                  <div 
                    key={material.id} 
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(material.type)}
                      <div>
                        <p className="font-medium text-slate-900">{material.name}</p>
                        <p className="text-xs text-slate-500">{material.type} • {material.size}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadMaterial(material)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMaterialsDialogOpen(false)}>Close</Button>
              <Button onClick={() => toast.success("Downloading all materials...")}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Instructor Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Contact Instructor
              </DialogTitle>
              <DialogDescription>Send a message to {selectedCourse?.instructor}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendMessage}>
              <div className="grid gap-4 py-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">To</p>
                  <p className="font-medium">{selectedCourse?.instructor} ({selectedCourse?.email})</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="Enter message subject"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Type your message here..."
                    rows={5}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Send Message</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
