// ─── Static Data for Faculty Portal ──────────────────────────────────────────

export const facultyProfile = {
  name: "Prof. Maria Santos",
  email: "maria.santos@tclass.edu",
  facultyNumber: "FAC-2024-001",
  initials: "MS",
  employeeId: "19-00123",
  department: "College of Information Technology",
  position: "Instructor I",
  loadCount: "5 Classes",
};

// day: 2=Sun, 3=Mon, 4=Tue, 5=Wed, 6=Thu, 7=Fri, 8=Sat | hours in 24h
export const scheduleBlocks = [
  { day: 3, startHour: 7,  endHour: 10, subject: "NSTP 1", section: "BSIT-1A (EVE)", room: "L101",   time: "07:00AM - 10:00AM" },
  { day: 3, startHour: 10, endHour: 13, subject: "IT 201", section: "BSIT-2B",       room: "R205",   time: "10:00AM - 01:00PM" },
  { day: 3, startHour: 14, endHour: 17, subject: "CC 301", section: "BSCS-3A (EVE)", room: "L102",   time: "02:00PM - 05:00PM" },
  { day: 4, startHour: 7,  endHour: 10, subject: "NSTP 1", section: "BSIT-1B",       room: "AB 407", time: "07:00AM - 10:00AM" },
  { day: 4, startHour: 14, endHour: 17, subject: "IT 201", section: "BSIT-2A",       room: "R 124",  time: "02:00PM - 05:00PM" },
  { day: 6, startHour: 10, endHour: 13, subject: "NSTP 1", section: "BSIT-1B",       room: "AB 407", time: "10:00AM - 01:00PM" },
  { day: 6, startHour: 14, endHour: 17, subject: "IT 201", section: "BSIT-2A",       room: "R 124",  time: "02:00PM - 05:00PM" },
  { day: 8, startHour: 7,  endHour: 10, subject: "NSTP 1", section: "BSEE-1A",       room: "AH 202", time: "07:00AM - 10:00AM" },
  { day: 8, startHour: 10, endHour: 13, subject: "IT 201", section: "BSIT-1C",       room: "R122",   time: "10:00AM - 01:00PM" },
  { day: 8, startHour: 13, endHour: 16, subject: "CC 301", section: "BSCS-2A (EVE)", room: "R205",   time: "01:00PM - 04:00PM" },
];

export const TIME_SLOTS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const classLists = [
  { code: "NSTP 1", title: "National Service Training Program 1", section: "BSIT-1A (EVE)", schedule: "L101 M 07:00am - 10:00am" },
  { code: "NSTP 1", title: "National Service Training Program 1", section: "BSIT-1B",       schedule: "AB 407 T 07:00am - 10:00am" },
  { code: "IT 201", title: "Data Structures and Algorithms",      section: "BSIT-2B",       schedule: "R205 M 10:00am - 01:00pm" },
  { code: "IT 201", title: "Data Structures and Algorithms",      section: "BSIT-2A",       schedule: "R 124 T 02:00pm - 05:00pm" },
  { code: "CC 301", title: "Object-Oriented Programming",         section: "BSCS-3A (EVE)", schedule: "L102 M 02:00pm - 05:00pm" },
];

export const gradeSheets = [
  { code: "NSTP 1", title: "National Service Training Program 1", section: "BSIT-1A (EVE)", schedule: "L101 S 07:00am - 10:00am",   datePosted: "6/15/2024 10:07:05 PM" },
  { code: "NSTP 1", title: "National Service Training Program 1", section: "BSIT-1B",       schedule: "AB 407 T 07:00am - 10:00am", datePosted: "6/15/2024 10:07:05 PM" },
  { code: "IT 201", title: "Data Structures and Algorithms",      section: "BSIT-2B",       schedule: "R205 M 10:00am - 01:00pm",   datePosted: "6/12/2024 06:59:48 PM" },
  { code: "IT 201", title: "Data Structures and Algorithms",      section: "BSIT-2A",       schedule: "R 124 T 02:00pm - 05:00pm",  datePosted: "6/17/2024 05:19:19 PM" },
  { code: "CC 301", title: "Object-Oriented Programming",         section: "BSCS-3A (EVE)", schedule: "L102 M 02:00pm - 05:00pm",   datePosted: "6/12/2024 06:58:31 PM" },
];

export const gradeSheetStudents = [
  { studentNo: "2024100001", name: "Aguilar, Jose M",     midterm: "1.75", final: "1.75", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100002", name: "Bautista, Ana L",     midterm: "1.50", final: "1.50", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100003", name: "Cruz, Pedro R",       midterm: "1.75", final: "1.50", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100004", name: "Dela Cruz, Maria S",  midterm: "2.00", final: "1.75", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100005", name: "Espiritu, Juan C",    midterm: "1.50", final: "1.50", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100006", name: "Flores, Rosa T",      midterm: "1.75", final: "1.75", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100007", name: "Garcia, Miguel A",    midterm: "1.25", final: "1.25", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100008", name: "Hernandez, Luz B",    midterm: "1.50", final: "1.50", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100009", name: "Ignacio, Ramon D",    midterm: "1.75", final: "1.75", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100010", name: "Jimenez, Carla P",    midterm: "2.25", final: "2.00", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100011", name: "Lim, Kevin S",        midterm: "1.50", final: "1.50", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
  { studentNo: "2024100012", name: "Mendoza, Patricia O", midterm: "1.75", final: "1.50", reExam: "", datePosted: "6/15/2024 10:07:05 PM" },
];

export const gradingSystem = [
  { grade: "1.00", equiv: "98-100%", desc: "Excellent",            remarks: "Passed" },
  { grade: "1.25", equiv: "95-97%",  desc: "Excellent",            remarks: "Passed" },
  { grade: "1.50", equiv: "92-94%",  desc: "Very Good",            remarks: "Passed" },
  { grade: "1.75", equiv: "89-91%",  desc: "Very Good",            remarks: "Passed" },
  { grade: "2.00", equiv: "86-89%",  desc: "Good",                 remarks: "Passed" },
  { grade: "2.25", equiv: "83-85%",  desc: "Good",                 remarks: "Passed" },
  { grade: "2.50", equiv: "80-81%",  desc: "Good",                 remarks: "Passed" },
  { grade: "2.75", equiv: "78-79%",  desc: "Satisfactory",         remarks: "Passed" },
  { grade: "3.00", equiv: "75%",     desc: "Passing",              remarks: "Passed" },
  { grade: "3.50", equiv: "73-74%",  desc: "",                     remarks: "" },
  { grade: "4.00", equiv: "71-74%",  desc: "",                     remarks: "" },
  { grade: "5.00", equiv: "Failed",  desc: "",                     remarks: "" },
  { grade: "DRP",  equiv: "",        desc: "Dropped",              remarks: "" },
  { grade: "INC",  equiv: "",        desc: "Incomplete",           remarks: "" },
  { grade: "UD",   equiv: "",        desc: "Unofficially Dropped", remarks: "" },
];
