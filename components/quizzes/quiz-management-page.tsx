"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Loader2,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";

import {
  createRoleQuiz,
  deleteRoleQuiz,
  listRoleEntranceApprovedApplicants,
  listRoleEntranceScheduledApplicants,
  listRoleEntranceCourses,
  listRoleQuizCreators,
  listRoleQuizOfferingsCatalog,
  listRoleQuizzes,
  publishRoleQuiz,
  sendRoleEntranceQuizInvites,
  updateRoleQuiz,
  type EntranceApprovedApplicant,
  type QuizCreator,
  type EntranceCourse,
  type QuizCatalogItem,
  type QuizSet,
  type QuizSetStatus,
  type QuizType,
  type RoleQuizScope,
} from "@/lib/quiz-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type QuizFormState = {
  title: string;
  instructions: string;
  passRate: string;
  durationMinutes: string;
  status: QuizSetStatus;
  quizType: QuizType;
  offeringId: number | null;
  courseProgramId: number | null;
  shuffleItems: boolean;
  shuffleChoices: boolean;
};

type QuizTypeFilter = "all" | QuizType;

type PickerFilterState = {
  programId: string;
  yearLevel: string;
  semester: string;
  periodId: string;
};

type RecentPick = Pick<
  QuizCatalogItem,
  "id" | "offeringId" | "label" | "courseCode" | "courseTitle" | "sectionCode" | "programId" | "programName" | "yearLevel" | "semester" | "periodId" | "periodName"
>;

const LIST_PAGE_SIZE = 10;
const CATALOG_PAGE_SIZE = 50;
const PUBLISH_RECIPIENTS_PAGE_SIZE = 100;

const defaultForm: QuizFormState = {
  title: "",
  instructions: "",
  passRate: "50",
  durationMinutes: "30",
  status: "draft",
  quizType: "regular",
  offeringId: null,
  courseProgramId: null,
  shuffleItems: true,
  shuffleChoices: true,
};

const defaultPickerFilters: PickerFilterState = {
  programId: "all",
  yearLevel: "all",
  semester: "all",
  periodId: "all",
};

function toInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function sortByLabel<T extends { label: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.label.localeCompare(b.label));
}

function fallbackOffering(offeringId: number, label: string): QuizCatalogItem {
  return {
    id: offeringId,
    offeringId,
    label,
    courseCode: "",
    courseTitle: "",
    sectionCode: "",
    programId: null,
    programName: "Unknown Program",
    yearLevel: null,
    semester: null,
    periodId: null,
    periodName: "",
  };
}

function compareRelevance(query: string, row: QuizCatalogItem): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const haystack = `${row.courseCode} ${row.courseTitle} ${row.sectionCode} ${row.programName}`.toLowerCase();
  if (haystack.startsWith(q)) return 0;
  if (haystack.includes(q)) return 1;
  return 2;
}

function dedupeCatalog(rows: QuizCatalogItem[]) {
  const map = new Map<number, QuizCatalogItem>();
  for (const row of rows) {
    if (!map.has(row.offeringId)) {
      map.set(row.offeringId, row);
    }
  }
  return Array.from(map.values());
}

export function QuizManagementPage({ role }: { role: RoleQuizScope }) {
  const basePath = role === "admin" ? "/admin" : "/faculty";
  const roleLabel = role === "admin" ? "Admin" : "Instructor";
  const recentStorageKey = `tclass:quiz-picker-recent:${role}`;

  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuizSetStatus>("all");
  const [quizTypeFilter, setQuizTypeFilter] = useState<QuizTypeFilter>("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [listPage, setListPage] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizSet[]>([]);
  const [creators, setCreators] = useState<QuizCreator[]>([]);
  const [listMeta, setListMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: LIST_PAGE_SIZE,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizSet | null>(null);
  const [formState, setFormState] = useState<QuizFormState>(defaultForm);
  const [selectedOffering, setSelectedOffering] = useState<QuizCatalogItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [publishTarget, setPublishTarget] = useState<QuizSet | null>(null);
  const [publishSendEmail, setPublishSendEmail] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishApplicantSearch, setPublishApplicantSearch] = useState("");
  const [publishApplicantSearchDebounced, setPublishApplicantSearchDebounced] = useState("");
  const [publishApplicantCourse, setPublishApplicantCourse] = useState("all");
  const [publishApplicants, setPublishApplicants] = useState<EntranceApprovedApplicant[]>([]);
  const [publishApplicantsLoading, setPublishApplicantsLoading] = useState(false);
  const [publishApplicantsMeta, setPublishApplicantsMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 50,
  });
  const [publishSelectedRecipients, setPublishSelectedRecipients] = useState<Record<number, EntranceApprovedApplicant>>({});

  const [entranceCourses, setEntranceCourses] = useState<EntranceCourse[]>([]);
  const [entranceCoursesLoading, setEntranceCoursesLoading] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearchInput, setPickerSearchInput] = useState("");
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerFilters, setPickerFilters] = useState<PickerFilterState>(defaultPickerFilters);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerLoadingMore, setPickerLoadingMore] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pickerItems, setPickerItems] = useState<QuizCatalogItem[]>([]);
  const [pickerMeta, setPickerMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: CATALOG_PAGE_SIZE,
  });
  const [pickerHighlightIndex, setPickerHighlightIndex] = useState(0);
  const [recentPicks, setRecentPicks] = useState<RecentPick[]>([]);

  const pickerLoadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchDebounced(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPickerQuery(pickerSearchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pickerSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPublishApplicantSearchDebounced(publishApplicantSearch.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [publishApplicantSearch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(recentStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentPick[];
      if (!Array.isArray(parsed)) return;
      const rows = parsed.filter((item) => item && typeof item.offeringId === "number").slice(0, 5);
      setRecentPicks(rows);
    } catch {
      setRecentPicks([]);
    }
  }, [recentStorageKey]);

  const loadQuizzes = useCallback(async () => {
    setListLoading(true);
    try {
      const payload = await listRoleQuizzes(role, {
        page: listPage,
        perPage: LIST_PAGE_SIZE,
        q: searchDebounced || undefined,
        status: statusFilter,
        quizType: quizTypeFilter,
        createdBy: creatorFilter,
      });
      setQuizzes(payload.items);
      setListMeta(payload.meta);
    } catch (error) {
      setQuizzes([]);
      setListMeta({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: LIST_PAGE_SIZE,
      });
      toast.error(error instanceof Error ? error.message : "Unable to load quizzes.");
    } finally {
      setListLoading(false);
    }
  }, [creatorFilter, listPage, quizTypeFilter, role, searchDebounced, statusFilter]);

  const loadCreators = useCallback(async () => {
    try {
      const rows = await listRoleQuizCreators(role);
      setCreators(rows);
    } catch {
      setCreators([]);
    }
  }, [role]);

  const loadEntranceCourses = useCallback(async () => {
    if (entranceCoursesLoading) return;
    setEntranceCoursesLoading(true);
    try {
      const rows = await listRoleEntranceCourses(role);
      setEntranceCourses(sortByLabel(rows));
    } catch (error) {
      setEntranceCourses([]);
      toast.error(error instanceof Error ? error.message : "Unable to load entrance courses.");
    } finally {
      setEntranceCoursesLoading(false);
    }
  }, [entranceCoursesLoading, role]);

  const loadEntrancePublishApplicants = useCallback(async () => {
    if (!publishTarget || publishTarget.quizType !== "entrance") return;
    setPublishApplicantsLoading(true);
    try {
      const payload =
        role === "admin"
          ? await listRoleEntranceScheduledApplicants(role, {
              q: publishApplicantSearchDebounced || undefined,
              course: publishApplicantCourse === "all" ? undefined : publishApplicantCourse,
              applicationType: "all",
              page: 1,
              perPage: PUBLISH_RECIPIENTS_PAGE_SIZE,
            })
          : await listRoleEntranceApprovedApplicants(role, {
              q: publishApplicantSearchDebounced || undefined,
              course: publishApplicantCourse === "all" ? undefined : publishApplicantCourse,
              applicationType: "admission",
              withStudentAccount: true,
              page: 1,
              perPage: PUBLISH_RECIPIENTS_PAGE_SIZE,
            });
      setPublishApplicants(payload.items);
      setPublishApplicantsMeta(payload.meta);
    } catch (error) {
      setPublishApplicants([]);
      setPublishApplicantsMeta({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: PUBLISH_RECIPIENTS_PAGE_SIZE,
      });
      toast.error(error instanceof Error ? error.message : "Unable to load publish recipients.");
    } finally {
      setPublishApplicantsLoading(false);
    }
  }, [publishApplicantCourse, publishApplicantSearchDebounced, publishTarget, role]);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  useEffect(() => {
    void loadCreators();
  }, [loadCreators]);

  useEffect(() => {
    if (!publishTarget || publishTarget.quizType !== "entrance") return;
    void loadEntrancePublishApplicants();
  }, [loadEntrancePublishApplicants, publishTarget]);

  const pickerCanRemoteQuery = pickerQuery.length === 0 || pickerQuery.length >= 2;

  const loadPickerPage = useCallback(
    async (page: number, append: boolean) => {
      if (!pickerCanRemoteQuery) {
        setPickerItems([]);
        setPickerMeta({
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: CATALOG_PAGE_SIZE,
        });
        setPickerError(null);
        return;
      }

      if (append) {
        setPickerLoadingMore(true);
      } else {
        setPickerLoading(true);
      }
      setPickerError(null);

      try {
        const payload = await listRoleQuizOfferingsCatalog(role, {
          q: pickerQuery || undefined,
          page,
          perPage: CATALOG_PAGE_SIZE,
          programId: pickerFilters.programId,
          yearLevel: pickerFilters.yearLevel,
          semester: pickerFilters.semester,
          periodId: pickerFilters.periodId,
        });

        setPickerItems((prev) => {
          const merged = append ? dedupeCatalog([...prev, ...payload.items]) : payload.items;
          if (pickerQuery.trim().length > 0) {
            return [...merged].sort((a, b) => {
              const cmp = compareRelevance(pickerQuery, a) - compareRelevance(pickerQuery, b);
              if (cmp !== 0) return cmp;
              return a.courseCode.localeCompare(b.courseCode);
            });
          }
          return merged;
        });

        setPickerMeta(payload.meta);
        if (!append) {
          setPickerHighlightIndex(0);
        }
      } catch (error) {
        if (!append) {
          setPickerItems([]);
          setPickerMeta({
            currentPage: 1,
            lastPage: 1,
            total: 0,
            perPage: CATALOG_PAGE_SIZE,
          });
        }
        setPickerError(error instanceof Error ? error.message : "Unable to load offerings.");
      } finally {
        setPickerLoading(false);
        setPickerLoadingMore(false);
      }
    },
    [pickerCanRemoteQuery, pickerFilters.periodId, pickerFilters.programId, pickerFilters.semester, pickerFilters.yearLevel, pickerQuery, role]
  );

  useEffect(() => {
    if (!pickerOpen) return;
    void loadPickerPage(1, false);
  }, [loadPickerPage, pickerOpen]);

  const pickerHasNextPage = pickerMeta.currentPage < pickerMeta.lastPage;

  useEffect(() => {
    if (!pickerOpen || !pickerHasNextPage || pickerLoading || pickerLoadingMore) return;
    const node = pickerLoadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        void loadPickerPage(pickerMeta.currentPage + 1, true);
      },
      { root: null, rootMargin: "220px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadPickerPage, pickerHasNextPage, pickerLoading, pickerLoadingMore, pickerMeta.currentPage, pickerOpen]);

  useEffect(() => {
    setPickerHighlightIndex((current) => {
      if (pickerItems.length === 0) return 0;
      return Math.min(Math.max(current, 0), pickerItems.length - 1);
    });
  }, [pickerItems]);

  const programFilterOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    for (const item of pickerItems) {
      if (!item.programId) continue;
      map.set(String(item.programId), { value: String(item.programId), label: item.programName });
    }
    for (const course of entranceCourses) {
      map.set(String(course.id), { value: String(course.id), label: course.label });
    }
    return sortByLabel(Array.from(map.values()));
  }, [entranceCourses, pickerItems]);

  const periodFilterOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    for (const item of pickerItems) {
      if (!item.periodId) continue;
      map.set(String(item.periodId), { value: String(item.periodId), label: item.periodName || `Period ${item.periodId}` });
    }
    return sortByLabel(Array.from(map.values()));
  }, [pickerItems]);

  const openCreateDialog = useCallback(() => {
    setEditingQuiz(null);
    setFormState(defaultForm);
    setSelectedOffering(null);
    setPickerSearchInput("");
    setPickerQuery("");
    setPickerFilters(defaultPickerFilters);
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback(
    (quiz: QuizSet) => {
      setEditingQuiz(quiz);
      setFormState({
        title: quiz.title,
        instructions: quiz.instructions,
        passRate: String(quiz.passRate || 50),
        durationMinutes: String(quiz.durationMinutes || 30),
        status: quiz.status,
        quizType: quiz.quizType,
        offeringId: quiz.quizType === "regular" ? quiz.offeringId : null,
        courseProgramId: quiz.quizType === "entrance" ? quiz.courseProgramId : null,
        shuffleItems: quiz.shuffleItems,
        shuffleChoices: quiz.shuffleChoices,
      });
      setSelectedOffering(
        quiz.quizType === "regular" && quiz.offeringId ? fallbackOffering(quiz.offeringId, quiz.offeringLabel || "Selected offering") : null
      );
      setPickerSearchInput("");
      setPickerQuery("");
      setPickerFilters(defaultPickerFilters);
      if (quiz.quizType === "entrance") {
        void loadEntranceCourses();
      }
      setFormOpen(true);
    },
    [loadEntranceCourses]
  );

  const closeFormDialog = useCallback(() => {
    setFormOpen(false);
    setEditingQuiz(null);
    setFormState(defaultForm);
    setSelectedOffering(null);
  }, []);

  const upsertRecentPick = useCallback(
    (item: QuizCatalogItem) => {
      const entry: RecentPick = {
        id: item.id,
        offeringId: item.offeringId,
        label: item.label,
        courseCode: item.courseCode,
        courseTitle: item.courseTitle,
        sectionCode: item.sectionCode,
        programId: item.programId,
        programName: item.programName,
        yearLevel: item.yearLevel,
        semester: item.semester,
        periodId: item.periodId,
        periodName: item.periodName,
      };
      setRecentPicks((previous) => {
        const next = [entry, ...previous.filter((row) => row.offeringId !== entry.offeringId)].slice(0, 5);
        try {
          window.localStorage.setItem(recentStorageKey, JSON.stringify(next));
        } catch {
          // Ignore local storage errors.
        }
        return next;
      });
    },
    [recentStorageKey]
  );

  const applyOfferingSelection = useCallback(
    (item: QuizCatalogItem) => {
      setSelectedOffering(item);
      setFormState((previous) => ({
        ...previous,
        quizType: "regular",
        offeringId: item.offeringId,
        courseProgramId: null,
      }));
      upsertRecentPick(item);
      setPickerOpen(false);
    },
    [upsertRecentPick]
  );

  const handlePickerKeyboard = useCallback(
    (event: React.KeyboardEvent) => {
      if (pickerItems.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setPickerHighlightIndex((current) => Math.min(current + 1, pickerItems.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setPickerHighlightIndex((current) => Math.max(current - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const selected = pickerItems[pickerHighlightIndex];
        if (selected) {
          applyOfferingSelection(selected);
        }
      }
    },
    [applyOfferingSelection, pickerHighlightIndex, pickerItems]
  );

  const handleFormSubmit = useCallback(async () => {
    const title = formState.title.trim();
    const instructions = formState.instructions.trim();
    const passRate = toInteger(formState.passRate);
    const durationMinutes = toInteger(formState.durationMinutes);

    if (!title) {
      toast.error("Please provide a quiz title.");
      return;
    }
    if (!instructions) {
      toast.error("Please provide quiz instructions.");
      return;
    }
    if (passRate < 1 || passRate > 100) {
      toast.error("Pass rate must be between 1 and 100.");
      return;
    }
    if (durationMinutes < 1 || durationMinutes > 600) {
      toast.error("Duration must be between 1 and 600 minutes.");
      return;
    }
    if (formState.quizType === "regular" && !formState.offeringId) {
      toast.error("Please select a linked class/offering.");
      return;
    }
    if (formState.quizType === "entrance" && !formState.courseProgramId) {
      toast.error("Please select a course/program for entrance exam.");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title,
        instructions,
        pass_rate: passRate,
        duration_minutes: durationMinutes,
        status: formState.status,
        quiz_type: formState.quizType,
        offering_id: formState.quizType === "regular" ? formState.offeringId : null,
        course_program_id: formState.quizType === "entrance" ? formState.courseProgramId : null,
        shuffle_items: formState.shuffleItems,
        shuffle_choices: formState.shuffleChoices,
      } as const;

      if (editingQuiz) {
        await updateRoleQuiz(role, editingQuiz.id, payload);
        toast.success("Quiz updated.");
      } else {
        await createRoleQuiz(role, payload);
        toast.success("Quiz created.");
      }

      closeFormDialog();
      setListPage(1);
      await loadQuizzes();
      await loadCreators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save quiz.");
    } finally {
      setFormSubmitting(false);
    }
  }, [closeFormDialog, editingQuiz, formState, loadCreators, loadQuizzes, role]);

  const handleDeleteQuiz = useCallback(
    async (quiz: QuizSet) => {
      const confirmed = window.confirm(`Delete "${quiz.title}"? This cannot be undone.`);
      if (!confirmed) return;
      try {
        await deleteRoleQuiz(role, quiz.id);
        toast.success("Quiz deleted.");
        await loadQuizzes();
        await loadCreators();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete quiz.");
      }
    },
    [loadCreators, loadQuizzes, role]
  );

  const resolveShareLink = useCallback((quiz: QuizSet): string | null => {
    if (quiz.linkUrl && quiz.linkUrl.trim().length > 0) return quiz.linkUrl;
    if (!quiz.shareToken) return null;
    if (typeof window === "undefined") return `/student/quizzes/${quiz.shareToken}`;
    return `${window.location.origin}/student/quizzes/${quiz.shareToken}`;
  }, []);

  const handleCopyLink = useCallback(
    async (quiz: QuizSet) => {
      const link = resolveShareLink(quiz);
      if (!link) {
        toast.error("No share link available yet. Publish the quiz first.");
        return;
      }
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Quiz link copied.");
      } catch {
        toast.error("Unable to copy link.");
      }
    },
    [resolveShareLink]
  );

  const togglePublishRecipient = useCallback((applicant: EntranceApprovedApplicant, checked: boolean) => {
    setPublishSelectedRecipients((prev) => {
      const next = { ...prev };
      if (checked) {
        next[applicant.id] = applicant;
      } else {
        delete next[applicant.id];
      }
      return next;
    });
  }, []);

  const toggleAllVisiblePublishRecipients = useCallback(
    (checked: boolean) => {
      setPublishSelectedRecipients((prev) => {
        if (!checked) {
          const next = { ...prev };
          for (const applicant of publishApplicants) {
            delete next[applicant.id];
          }
          return next;
        }
        const next = { ...prev };
        for (const applicant of publishApplicants) {
          next[applicant.id] = applicant;
        }
        return next;
      });
    },
    [publishApplicants]
  );

  const clearPublishDialogState = useCallback(() => {
    setPublishTarget(null);
    setPublishSendEmail(true);
    setPublishApplicantSearch("");
    setPublishApplicantSearchDebounced("");
    setPublishApplicantCourse("all");
    setPublishApplicants([]);
    setPublishSelectedRecipients({});
  }, []);

  const handlePublishQuiz = useCallback(async () => {
    if (!publishTarget) return;
    const selectedRecipients = Object.values(publishSelectedRecipients);
    if (publishTarget.quizType === "entrance" && selectedRecipients.length === 0) {
      toast.error(
        role === "admin"
          ? "Select at least one scheduled applicant for entrance exam invite."
          : "Select at least one approved incoming student for entrance exam invite."
      );
      return;
    }
    setPublishLoading(true);
    let publishCompleted = false;
    let publishedLink: string | null = null;
    try {
      const published = await publishRoleQuiz(role, publishTarget.id, {
        send_email: publishSendEmail,
        admission_ids: publishTarget.quizType === "entrance" ? selectedRecipients.map((item) => item.id) : undefined,
        recipient_emails: publishTarget.quizType === "entrance" ? selectedRecipients.map((item) => item.email) : undefined,
      });
      publishCompleted = true;
      publishedLink = published.linkUrl || resolveShareLink(published.quiz) || resolveShareLink(publishTarget);
      if (publishTarget.quizType === "entrance" && publishSendEmail && selectedRecipients.length > 0) {
        const resolvedLink = publishedLink;
        if (!resolvedLink) {
          throw new Error("Quiz published but no invite link could be resolved.");
        } else {
          try {
            const invitePayload = await sendRoleEntranceQuizInvites(role, {
              quiz_title: publishTarget.title,
              quiz_link: resolvedLink,
              duration_minutes: publishTarget.durationMinutes,
              expires_at: published.expiresAt || published.quiz.expiresAt || null,
              application_type: role === "admin" ? ("all" as const) : ("admission" as const),
              admission_ids: selectedRecipients.map((item) => item.id),
              recipient_emails: selectedRecipients.map((item) => item.email),
            });
            if (invitePayload.failedCount > 0) {
              throw new Error(invitePayload.message || "Quiz published but invite emails failed.");
            } else {
              toast.success(invitePayload.message);
            }
          } catch (inviteError) {
            throw inviteError;
          }
        }
      } else {
        toast.success(published.message || "Quiz published.");
      }
      clearPublishDialogState();
      await loadQuizzes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to publish quiz.";
      if (publishCompleted && publishedLink && role === "admin" && publishTarget.quizType === "entrance" && publishSendEmail) {
        try {
          await navigator.clipboard.writeText(publishedLink);
          toast.error(`${message} Link copied for manual sharing.`);
        } catch {
          toast.error(message);
        }
      } else {
        toast.error(message);
      }
      if (publishCompleted) {
        await loadQuizzes();
      }
    } finally {
      setPublishLoading(false);
    }
  }, [clearPublishDialogState, loadQuizzes, publishSendEmail, publishSelectedRecipients, publishTarget, resolveShareLink, role]);

  const publishSelectedRecipientCount = useMemo(
    () => Object.keys(publishSelectedRecipients).length,
    [publishSelectedRecipients]
  );
  const allVisibleRecipientsSelected = useMemo(() => {
    if (publishApplicants.length === 0) return false;
    return publishApplicants.every((applicant) => Boolean(publishSelectedRecipients[applicant.id]));
  }, [publishApplicants, publishSelectedRecipients]);
  const publishCourseOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const row of publishApplicants) {
      if (row.primaryCourse.trim()) unique.add(row.primaryCourse.trim());
    }
    return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
  }, [publishApplicants]);

  const regularCount = useMemo(() => quizzes.filter((quiz) => quiz.quizType === "regular").length, [quizzes]);
  const entranceCount = useMemo(() => quizzes.filter((quiz) => quiz.quizType === "entrance").length, [quizzes]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_40%),linear-gradient(180deg,#f8fafc,#eef2ff_40%,#f8fafc)] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.24),transparent_44%),linear-gradient(180deg,#020617,#020b16_50%,#020617)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-2xl border border-slate-200/90 bg-white/92 p-5 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/70 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">{roleLabel} Portal</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Online Quiz Management</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Manage regular quizzes by offering and entrance exams by program with timed expiring links.
              </p>
            </div>
            <Button type="button" onClick={openCreateDialog} className="sm:self-center">
              <Plus className="h-4 w-4" />
              Create Quiz
            </Button>
          </div>
        </section>

        <Card className="border-slate-200/80 bg-white/92 shadow-xl dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-slate-900 dark:text-slate-100">Quiz Sets</CardTitle>
                <CardDescription>{listMeta.total} total quizzes in this scope.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={quizTypeFilter === "all" ? "default" : "outline"}
                  onClick={() => {
                    setQuizTypeFilter("all");
                    setListPage(1);
                  }}
                >
                  All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={quizTypeFilter === "regular" ? "default" : "outline"}
                  onClick={() => {
                    setQuizTypeFilter("regular");
                    setListPage(1);
                  }}
                >
                  Regular ({regularCount})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={quizTypeFilter === "entrance" ? "default" : "outline"}
                  onClick={() => {
                    setQuizTypeFilter("entrance");
                    setListPage(1);
                  }}
                >
                  Entrance ({entranceCount})
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr),180px,220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setListPage(1);
                  }}
                  placeholder="Search title, offering, program..."
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as "all" | QuizSetStatus);
                  setListPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={creatorFilter}
                onValueChange={(value) => {
                  setCreatorFilter(value);
                  setListPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Created by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All creators</SelectItem>
                  {creators.map((creator) => (
                    <SelectItem key={`${creator.id ?? "null"}-${creator.name}`} value={creator.id == null ? "null" : String(creator.id)}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {listLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`quiz-skeleton-${index}`} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="mt-3 h-3 w-2/3" />
                    <Skeleton className="mt-4 h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15">
                <BookOpenText className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">No quizzes found</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Create a new quiz or adjust search and filters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <article
                    key={quiz.id}
                    className="rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/35"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</h3>
                          <Badge variant="outline">{quiz.quizType === "regular" ? "Regular" : "Entrance"}</Badge>
                          <Badge
                            variant="outline"
                            className={
                              quiz.status === "published"
                                ? "border-emerald-300 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300"
                                : "border-amber-300 text-amber-700 dark:border-amber-900/60 dark:text-amber-300"
                            }
                          >
                            {quiz.status === "published" ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{quiz.instructions || "No instructions provided."}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Badge variant="outline">{quiz.passRate}% passing</Badge>
                          <Badge variant="outline">{quiz.durationMinutes} mins</Badge>
                          <Badge variant="outline">By: {quiz.createdByName}</Badge>
                          <Badge variant="outline">{quiz.shuffleItems ? "Q shuffle on" : "Q shuffle off"}</Badge>
                          <Badge variant="outline">{quiz.shuffleChoices ? "Choice shuffle on" : "Choice shuffle off"}</Badge>
                          <Badge variant="outline">
                            {quiz.quizType === "regular"
                              ? `Offering: ${quiz.offeringLabel || "Unassigned"}`
                              : `Program: ${quiz.courseProgramLabel || "Unassigned"}`}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>Published: {formatDate(quiz.publishedAt)}</span>
                          <span>Expires: {formatDate(quiz.expiresAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEditDialog(quiz)}>
                          Edit
                        </Button>
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link href={`${basePath}/quizzes/${quiz.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            Details
                          </Link>
                        </Button>
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link href={`${basePath}/quizzes/preview/${quiz.id}`}>
                            <Eye className="h-4 w-4" />
                            Preview
                          </Link>
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => void handleCopyLink(quiz)}>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setPublishTarget(quiz);
                            setPublishSendEmail(true);
                            setPublishApplicantSearch("");
                            setPublishApplicantSearchDebounced("");
                            setPublishApplicantCourse("all");
                            setPublishApplicants([]);
                            setPublishSelectedRecipients({});
                          }}
                        >
                          <Send className="h-4 w-4" />
                          Publish
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => void handleDeleteQuiz(quiz)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm dark:border-white/10">
              <p className="text-slate-600 dark:text-slate-300">
                Page {listMeta.currentPage} of {Math.max(listMeta.lastPage, 1)}
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={listPage <= 1 || listLoading} onClick={() => setListPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={listPage >= listMeta.lastPage || listLoading}
                  onClick={() => setListPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeFormDialog())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Update Quiz" : "Create Quiz"}</DialogTitle>
            <DialogDescription>
              Configure pass rate, duration, and scope mapping. Entrance exams are course-level, regular quizzes are offering-level.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
                <Input
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Quiz title"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Instructions</label>
                <Textarea
                  value={formState.instructions}
                  onChange={(event) => setFormState((prev) => ({ ...prev, instructions: event.target.value }))}
                  placeholder="Quiz instructions"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Quiz Type</label>
                <Select
                  value={formState.quizType}
                  onValueChange={(value) => {
                    const quizType = value as QuizType;
                    setFormState((prev) => ({
                      ...prev,
                      quizType,
                      offeringId: quizType === "regular" ? prev.offeringId : null,
                      courseProgramId: quizType === "entrance" ? prev.courseProgramId : null,
                    }));
                    if (quizType === "entrance") {
                      setSelectedOffering(null);
                      void loadEntranceCourses();
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Quiz</SelectItem>
                    <SelectItem value="entrance">Entrance Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
                <Select
                  value={formState.status}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value as QuizSetStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Pass Rate (%)</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formState.passRate}
                  onChange={(event) => setFormState((prev) => ({ ...prev, passRate: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Duration (minutes)</label>
                <Input
                  type="number"
                  min={1}
                  max={600}
                  value={formState.durationMinutes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Randomization</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-white/10">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={formState.shuffleItems}
                      onChange={(event) => setFormState((prev) => ({ ...prev, shuffleItems: event.target.checked }))}
                    />
                    <span>
                      Randomize question order
                      <span className="block text-xs text-slate-500 dark:text-slate-400">Students get different item ordering.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-white/10">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={formState.shuffleChoices}
                      onChange={(event) => setFormState((prev) => ({ ...prev, shuffleChoices: event.target.checked }))}
                    />
                    <span>
                      Randomize choices
                      <span className="block text-xs text-slate-500 dark:text-slate-400">Choice A-D order changes per attempt.</span>
                    </span>
                  </label>
                </div>
              </div>

              {formState.quizType === "regular" ? (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject / Offering</label>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-white/15 dark:bg-slate-950/35 dark:text-slate-100 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/10"
                  >
                    <span className="line-clamp-1">
                      {selectedOffering?.label || (formState.offeringId ? "Selected offering" : "Select offering")}
                    </span>
                    <Filter className="h-4 w-4 text-slate-400" />
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Scale-ready picker supports 1,000 subjects with search, filters, and pagination.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Course / Program</label>
                  <Select
                    value={formState.courseProgramId ? String(formState.courseProgramId) : undefined}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        courseProgramId: value ? Number(value) : null,
                        offeringId: null,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={entranceCoursesLoading ? "Loading courses..." : "Select course/program"} />
                    </SelectTrigger>
                    <SelectContent>
                      {entranceCourses.length === 0 ? (
                        <SelectItem value="__no_courses__" disabled>
                          {entranceCoursesLoading ? "Loading..." : "No courses available"}
                        </SelectItem>
                      ) : (
                        entranceCourses.map((course) => (
                          <SelectItem key={course.id} value={String(course.id)}>
                            {course.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={closeFormDialog} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleFormSubmit()} disabled={formSubmitting}>
              {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingQuiz ? "Update Quiz" : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="!left-auto !right-0 !top-0 !h-dvh !w-full !max-w-2xl !translate-x-0 !translate-y-0 !rounded-none overflow-hidden border-l border-slate-200/80 p-0 dark:border-white/10">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b border-slate-200 px-4 py-4 dark:border-white/10">
              <DialogTitle>Select Subject / Offering</DialogTitle>
              <DialogDescription>
                Search at scale with server pagination. Type at least 2 characters to query.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={pickerSearchInput}
                  onChange={(event) => setPickerSearchInput(event.target.value)}
                  onKeyDown={handlePickerKeyboard}
                  placeholder="Search subject, code, section, program..."
                  className="pl-9"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Select
                  value={pickerFilters.programId}
                  onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, programId: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Program</SelectItem>
                    {programFilterOptions.map((program) => (
                      <SelectItem key={program.value} value={program.value}>
                        {program.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={pickerFilters.yearLevel} onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, yearLevel: value }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Year</SelectItem>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pickerFilters.semester} onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, semester: value }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semester</SelectItem>
                    <SelectItem value="1">1st</SelectItem>
                    <SelectItem value="2">2nd</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pickerFilters.periodId} onValueChange={(value) => setPickerFilters((prev) => ({ ...prev, periodId: value }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Period</SelectItem>
                    {periodFilterOptions.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3" onKeyDown={handlePickerKeyboard}>
              {selectedOffering ? (
                <div className="sticky top-0 z-10 mb-3 rounded-xl border border-blue-200 bg-blue-50/95 p-3 backdrop-blur dark:border-blue-900/60 dark:bg-blue-900/25">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-300">Selected</p>
                  <p className="mt-1 text-sm font-medium text-blue-800 dark:text-blue-100">{selectedOffering.label}</p>
                </div>
              ) : null}

              {recentPicks.length > 0 ? (
                <div className="mb-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Recent Picks</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recentPicks.map((item) => (
                      <Button
                        key={`recent-${item.offeringId}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="max-w-full justify-start"
                        onClick={() => applyOfferingSelection(item)}
                      >
                        <span className="line-clamp-1 text-left">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {!pickerCanRemoteQuery ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/25 dark:text-amber-200">
                  Type at least 2 characters to search. Clear search to browse default page.
                </div>
              ) : null}

              {pickerLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={`picker-skeleton-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="mt-2 h-3 w-2/4" />
                    </div>
                  ))}
                </div>
              ) : null}

              {!pickerLoading && pickerError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/25 dark:text-rose-300">
                  {pickerError}
                </div>
              ) : null}

              {!pickerLoading && !pickerError && pickerCanRemoteQuery && pickerItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                  No offerings matched your search/filter.
                </div>
              ) : null}

              {!pickerLoading && !pickerError && pickerItems.length > 0 ? (
                <div className="space-y-2">
                  {pickerItems.map((item, index) => {
                    const highlighted = pickerHighlightIndex === index;
                    const isChosen = formState.offeringId === item.offeringId;
                    return (
                      <button
                        key={item.offeringId}
                        type="button"
                        onClick={() => applyOfferingSelection(item)}
                        onMouseEnter={() => setPickerHighlightIndex(index)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          highlighted
                            ? "border-blue-400 bg-blue-50 dark:border-blue-500/70 dark:bg-blue-500/15"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/10"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
                          {isChosen ? (
                            <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Selected
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.programName} | Year {item.yearLevel ?? "-"} | Sem {item.semester ?? "-"} | {item.periodName || "No active period"}
                        </p>
                      </button>
                    );
                  })}

                  <div ref={pickerLoadMoreRef} />
                  {pickerLoadingMore ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading more...
                    </div>
                  ) : null}
                  {pickerHasNextPage && !pickerLoadingMore ? (
                    <div className="flex justify-center py-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => void loadPickerPage(pickerMeta.currentPage + 1, true)}>
                        Load more
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(publishTarget)} onOpenChange={(open) => (open ? undefined : clearPublishDialogState())}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publish Quiz</DialogTitle>
            <DialogDescription>
              Publishing starts the link expiry timer immediately. Students opening after expiry will see &quot;Link Expired&quot;.
            </DialogDescription>
          </DialogHeader>

          {publishTarget ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-950/35">
                <p className="font-medium text-slate-900 dark:text-slate-100">{publishTarget.title}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                  {publishTarget.durationMinutes} minute timer
                </p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  {publishTarget.quizType === "regular"
                    ? `Offering: ${publishTarget.offeringLabel}`
                    : `Program: ${publishTarget.courseProgramLabel}`}
                </p>
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-white/10">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={publishSendEmail}
                  onChange={(event) => setPublishSendEmail(event.target.checked)}
                />
                <span>
                  Send notification email on publish.
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Email is triggered only during publish.</span>
                </span>
              </label>

              {publishTarget.quizType === "entrance" ? (
                <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {role === "admin" ? "Scheduled Exam Recipients" : "Approved Incoming Students"}
                    </p>
                    <Badge variant="outline">{publishSelectedRecipientCount} selected</Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr),220px]">
                    <Input
                      value={publishApplicantSearch}
                      onChange={(event) => setPublishApplicantSearch(event.target.value)}
                      placeholder="Search applicant name, email, course..."
                    />
                    <Select value={publishApplicantCourse} onValueChange={setPublishApplicantCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All courses</SelectItem>
                        {publishCourseOptions.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {role === "admin"
                        ? `Showing ${publishApplicants.length} of ${publishApplicantsMeta.total} scheduled applicants with sent exam schedules.`
                        : `Showing ${publishApplicants.length} of ${publishApplicantsMeta.total} approved applicants with active student credentials.`}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAllVisiblePublishRecipients(!allVisibleRecipientsSelected)}
                        disabled={publishApplicants.length === 0}
                      >
                        {allVisibleRecipientsSelected ? "Unselect visible" : "Select visible"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPublishSelectedRecipients({})}
                        disabled={publishSelectedRecipientCount === 0}
                      >
                        Clear all
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
                    {publishApplicantsLoading ? (
                      <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {role === "admin" ? "Loading scheduled applicants..." : "Loading approved applicants..."}
                      </div>
                    ) : publishApplicants.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        {role === "admin"
                          ? "No scheduled applicants matched your search/filter."
                          : "No approved incoming students matched your search/filter."}
                      </div>
                    ) : (
                      publishApplicants.map((applicant) => (
                        <label
                          key={`publish-applicant-${applicant.id}`}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/40"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={Boolean(publishSelectedRecipients[applicant.id])}
                            onChange={(event) => togglePublishRecipient(applicant, event.target.checked)}
                          />
                          <span className="flex-1">
                            <span className="block font-medium text-slate-900 dark:text-slate-100">{applicant.fullName}</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">
                              {applicant.email} | {applicant.primaryCourse}
                            </span>
                          </span>
                          {applicant.examScheduleSentAt ? (
                            <Badge variant="outline">Invite Sent</Badge>
                          ) : null}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-900/25 dark:text-blue-200">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                Preview mode remains available for admin/instructor and does not create student attempts.
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={clearPublishDialogState} disabled={publishLoading}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handlePublishQuiz()} disabled={!publishTarget || publishLoading}>
              {publishLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
