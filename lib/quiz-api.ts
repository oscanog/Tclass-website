import { apiFetch } from "@/lib/api-client";

export type RoleQuizScope = "admin" | "faculty";
export type QuizSetStatus = "draft" | "published";
export type QuizType = "regular" | "entrance";

export type QuizSet = {
  id: number;
  title: string;
  instructions: string;
  passRate: number;
  durationMinutes: number;
  status: QuizSetStatus;
  quizType: QuizType;
  createdByUserId: number | null;
  createdByName: string;
  offeringId: number | null;
  offeringLabel: string;
  courseProgramId: number | null;
  courseProgramLabel: string;
  shuffleItems: boolean;
  shuffleChoices: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  shareToken: string | null;
  linkUrl: string | null;
  invitedAdmissionIds: number[];
  invitedRecipientEmails: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuizListMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

export type QuizListResponse = {
  items: QuizSet[];
  meta: QuizListMeta;
};

export type QuizOffering = {
  id: number;
  label: string;
};

export type QuizUpsertPayload = {
  title: string;
  instructions: string;
  pass_rate: number;
  duration_minutes: number;
  status: QuizSetStatus;
  quiz_type: QuizType;
  offering_id: number | null;
  course_program_id: number | null;
  shuffle_items?: boolean;
  shuffle_choices?: boolean;
};

export type PublishQuizPayload = {
  send_email: boolean;
  admission_ids?: number[];
  recipient_emails?: string[];
};

export type QuizChoice = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: number;
  prompt: string;
  points: number;
  choices: QuizChoice[];
};

export type QuizPlayable = {
  id: number;
  title: string;
  instructions: string;
  durationMinutes: number;
  passRate: number;
  shuffleItems: boolean;
  shuffleChoices: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
};

export type QuizPreviewResponse = {
  quiz: QuizPlayable;
  questions: QuizQuestion[];
};

export type LinkValidationStatus = "active" | "expired" | "unavailable";

export type StudentLinkValidation = {
  status: LinkValidationStatus;
  code: string | null;
  message: string | null;
  quiz: QuizPlayable | null;
  questions: QuizQuestion[];
  attemptId: number | null;
  endsAt: string | null;
};

export type AttemptStartResponse = {
  attemptId: number;
  endsAt: string;
  questions?: QuizQuestion[];
};

export type AttemptSubmitResponse = {
  code: string | null;
  message: string | null;
  score: number | null;
  total: number | null;
  passed: boolean | null;
  correctCount?: number | null;
  wrongCount?: number | null;
};

export type QuizCreator = {
  id: number | null;
  name: string;
};

export type QuizItem = {
  id: number;
  quizId: number;
  prompt: string;
  choices: QuizChoice[];
  correctChoiceId: string;
  order: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuizItemUpsertPayload = {
  prompt: string;
  choices: QuizChoice[];
  correct_choice_id: string;
  order?: number;
};

export type QuizAttemptSummary = {
  attemptId: number;
  quizId: number;
  studentName: string;
  studentEmail: string | null;
  score: number;
  total: number;
  correctCount: number;
  wrongCount: number;
  passed: boolean;
  startedAt: string | null;
  submittedAt: string | null;
  autoSubmitted: boolean;
};

export type QuizAttemptItemResult = {
  itemId: number;
  prompt: string;
  selectedChoiceId: string | null;
  selectedChoiceText: string | null;
  correctChoiceId: string;
  correctChoiceText: string | null;
  isCorrect: boolean;
};

export type QuizAttemptDetail = {
  attempt: QuizAttemptSummary;
  items: QuizAttemptItemResult[];
};

export type QuizCatalogItem = {
  id: number;
  offeringId: number;
  label: string;
  courseCode: string;
  courseTitle: string;
  sectionCode: string;
  programId: number | null;
  programName: string;
  yearLevel: number | null;
  semester: number | null;
  periodId: number | null;
  periodName: string;
};

export type QuizCatalogResponse = {
  items: QuizCatalogItem[];
  meta: QuizListMeta;
};

export type QuizCatalogQuery = {
  q?: string;
  programId?: string;
  yearLevel?: string;
  semester?: string;
  periodId?: string;
  page?: number;
  perPage?: number;
};

export type EntranceCourse = {
  id: number;
  code: string;
  label: string;
};

export type EntranceApprovedApplicant = {
  id: number;
  fullName: string;
  email: string;
  primaryCourse: string;
  applicationType: "admission" | "vocational";
  approvedAt: string | null;
  examScheduleSentAt: string | null;
  hasStudentAccount: boolean;
  examSchedulePayload?: {
    exam_quiz_id?: number | string | null;
    exam_quiz_title?: string | null;
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
};

export type EntranceApprovedApplicantsQuery = {
  q?: string;
  course?: string;
  applicationType?: "admission" | "vocational" | "all";
  withStudentAccount?: boolean;
  page?: number;
  perPage?: number;
};

export type EntranceApprovedApplicantsResponse = {
  items: EntranceApprovedApplicant[];
  meta: QuizListMeta;
};

export type EntranceScheduledApplicantsQuery = {
  q?: string;
  course?: string;
  applicationType?: "admission" | "vocational" | "all";
  page?: number;
  perPage?: number;
};

export type EntranceScheduledApplicantsResponse = {
  items: EntranceApprovedApplicant[];
  meta: QuizListMeta;
};

export type SendEntranceQuizInvitesPayload = {
  admission_ids?: number[];
  recipient_emails?: string[];
  quiz_title: string;
  quiz_link: string;
  duration_minutes: number;
  expires_at?: string | null;
  subject?: string;
  intro_message?: string;
  application_type?: "admission" | "vocational" | "all";
};

export type SendEntranceQuizInvitesResponse = {
  message: string;
  sentCount: number;
  failedCount: number;
};

type PlainObject = Record<string, unknown>;

const LOCAL_QUIZ_STORE_KEY = "tclass:quizzes:local-store:v1";
const LOCAL_ATTEMPT_STORE_KEY = "tclass:quizzes:local-attempts:v1";
const LOCAL_QUIZ_ITEMS_KEY = "tclass:quizzes:local-items:v1";

type LocalQuizAttempt = {
  id: number;
  token: string;
  quizId: number;
  startedAt: string | null;
  endsAt: string;
  studentName: string;
  studentEmail: string | null;
  snapshot: QuizItem[];
  answers: Record<string, string>;
  score: number | null;
  total: number | null;
  passed: boolean | null;
  correctCount: number | null;
  wrongCount: number | null;
  autoSubmitted: boolean;
  submittedAt: string | null;
};

type LocalActor = {
  id: number | null;
  name: string;
  email: string | null;
  role: string | null;
};

function roleBase(role: RoleQuizScope) {
  return role === "admin" ? "/admin" : "/faculty";
}

function allowRoleQuizFallback(role: RoleQuizScope) {
  void role;
  return false;
}

function isQuizRouteUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (!message.includes("quiz")) return false;
  return message.includes("route") || message.includes("could not be found") || message.includes("not found") || message.includes("404");
}

function hasWindow() {
  return typeof window !== "undefined";
}

function createEmptyLocalStore(): Record<RoleQuizScope, QuizSet[]> {
  return {
    admin: [],
    faculty: [],
  };
}

function readLocalQuizStore(): Record<RoleQuizScope, QuizSet[]> {
  if (!hasWindow()) return createEmptyLocalStore();
  try {
    const raw = window.localStorage.getItem(LOCAL_QUIZ_STORE_KEY);
    if (!raw) return createEmptyLocalStore();
    const parsed = JSON.parse(raw) as Partial<Record<RoleQuizScope, QuizSet[]>>;
    return {
      admin: Array.isArray(parsed.admin) ? parsed.admin : [],
      faculty: Array.isArray(parsed.faculty) ? parsed.faculty : [],
    };
  } catch {
    return createEmptyLocalStore();
  }
}

function writeLocalQuizStore(store: Record<RoleQuizScope, QuizSet[]>) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(LOCAL_QUIZ_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore local storage write failures.
  }
}

function getRoleLocalQuizzes(role: RoleQuizScope): QuizSet[] {
  void role;
  const store = readLocalQuizStore();
  const merged = [...store.admin, ...store.faculty];
  const deduped = new Map<number, QuizSet>();
  for (const row of merged) {
    const normalized: QuizSet = {
      ...row,
      createdByUserId: row.createdByUserId ?? null,
      createdByName: row.createdByName || "Portal User",
      shuffleItems: typeof row.shuffleItems === "boolean" ? row.shuffleItems : true,
      shuffleChoices: typeof row.shuffleChoices === "boolean" ? row.shuffleChoices : true,
      invitedAdmissionIds: normalizeNumberArray(row.invitedAdmissionIds),
      invitedRecipientEmails: normalizeStringArray(row.invitedRecipientEmails),
    };
    if (!deduped.has(normalized.id)) {
      deduped.set(normalized.id, normalized);
    }
  }
  return Array.from(deduped.values());
}

function setRoleLocalQuizzes(role: RoleQuizScope, items: QuizSet[]) {
  const store = createEmptyLocalStore();
  store.admin = items;
  store.faculty = items;
  writeLocalQuizStore(store);
}

function readLocalAttempts(): LocalQuizAttempt[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ATTEMPT_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<LocalQuizAttempt>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        const id = Number(row.id ?? 0);
        const quizId = Number(row.quizId ?? 0);
        if (!id || !quizId) return null;
        const snapshot = Array.isArray(row.snapshot)
          ? (row.snapshot as QuizItem[])
          : getLocalQuizItemsForQuiz(quizId);
        return {
          id,
          token: String(row.token ?? ""),
          quizId,
          startedAt: typeof row.startedAt === "string" ? row.startedAt : null,
          endsAt: typeof row.endsAt === "string" ? row.endsAt : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          studentName: typeof row.studentName === "string" ? row.studentName : `Student ${id}`,
          studentEmail: typeof row.studentEmail === "string" ? row.studentEmail : null,
          snapshot,
          answers: row.answers && typeof row.answers === "object" ? (row.answers as Record<string, string>) : {},
          score: typeof row.score === "number" ? row.score : null,
          total: typeof row.total === "number" ? row.total : null,
          passed: typeof row.passed === "boolean" ? row.passed : null,
          correctCount: typeof row.correctCount === "number" ? row.correctCount : null,
          wrongCount: typeof row.wrongCount === "number" ? row.wrongCount : null,
          autoSubmitted: typeof row.autoSubmitted === "boolean" ? row.autoSubmitted : false,
          submittedAt: typeof row.submittedAt === "string" ? row.submittedAt : null,
        } satisfies LocalQuizAttempt;
      })
      .filter((row): row is LocalQuizAttempt => Boolean(row));
  } catch {
    return [];
  }
}

function writeLocalAttempts(attempts: LocalQuizAttempt[]) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(LOCAL_ATTEMPT_STORE_KEY, JSON.stringify(attempts));
  } catch {
    // Ignore local storage write failures.
  }
}

function readLocalQuizItems(): QuizItem[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_QUIZ_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuizItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalQuizItems(items: QuizItem[]) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(LOCAL_QUIZ_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // Ignore local storage write failures.
  }
}

function normalizeChoiceId(value: string) {
  return value.trim().toUpperCase();
}

function shuffleArray<T>(rows: T[]): T[] {
  const next = [...rows];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j] as T;
    next[j] = tmp as T;
  }
  return next;
}

function defaultQuizItems(quizId: number): QuizItem[] {
  const base: Array<{ prompt: string; choices: string[]; correct: string }> = [
    {
      prompt: "What is 2 + 2?",
      choices: ["4", "3", "5", "6"],
      correct: "A",
    },
    {
      prompt: "Which is a programming language?",
      choices: ["TypeScript", "Spreadsheet", "Keyboard", "Monitor"],
      correct: "A",
    },
    {
      prompt: "Which layer sends HTTP response headers?",
      choices: ["Server", "Mouse", "Printer", "Charger"],
      correct: "A",
    },
  ];
  return base.map((row, index) => ({
    id: quizId * 1000 + index + 1,
    quizId,
    prompt: row.prompt,
    choices: row.choices.map((text, choiceIndex) => ({
      id: String.fromCharCode(65 + choiceIndex),
      text,
    })),
    correctChoiceId: row.correct,
    order: index + 1,
    createdAt: null,
    updatedAt: null,
  }));
}

function getLocalQuizItemsForQuiz(quizId: number): QuizItem[] {
  const rows = readLocalQuizItems()
    .filter((item) => item.quizId === quizId)
    .sort((a, b) => a.order - b.order || a.id - b.id);
  if (rows.length > 0) return rows;
  return defaultQuizItems(quizId);
}

function composeQuizQuestions(quiz: QuizSet, baseItems: QuizItem[]): QuizQuestion[] {
  const byItemOrder = [...baseItems].sort((a, b) => a.order - b.order || a.id - b.id);
  const orderedItems = quiz.shuffleItems ? shuffleArray(byItemOrder) : byItemOrder;
  return orderedItems.map((item) => {
    const choices = item.choices.map((choice) => ({
      id: normalizeChoiceId(choice.id),
      text: choice.text,
    }));
    const choiceOrder = quiz.shuffleChoices ? shuffleArray(choices) : choices;
    return {
      id: item.id,
      prompt: item.prompt,
      points: 1,
      choices: choiceOrder,
    } satisfies QuizQuestion;
  });
}

function extractSessionActorFromResponse(payload: unknown): LocalActor {
  const user = (payload as { user?: { id?: number; name?: string; email?: string; role?: string } })?.user;
  const id = user?.id ? Number(user.id) : null;
  const name = user?.name?.trim() || user?.email?.trim() || "Portal User";
  const email = user?.email?.trim() || null;
  const role = user?.role?.trim()?.toLowerCase() || null;
  return { id: Number.isFinite(id ?? Number.NaN) ? id : null, name, email, role };
}

function validateQuizItemPayload(body: QuizItemUpsertPayload) {
  const prompt = body.prompt?.trim() ?? "";
  if (!prompt) {
    throw new Error("Question prompt is required.");
  }
  if (!Array.isArray(body.choices) || body.choices.length !== 4) {
    throw new Error("Each item must contain exactly 4 choices.");
  }
  const ids = body.choices.map((choice, index) => normalizeChoiceId(choice.id || String.fromCharCode(65 + index)));
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== 4) {
    throw new Error("Choice IDs must be unique.");
  }
  const correct = normalizeChoiceId(body.correct_choice_id || "");
  if (!correct || !uniqueIds.has(correct)) {
    throw new Error("Correct choice must match one of the 4 choices.");
  }
}

async function resolveLocalActor(): Promise<LocalActor> {
  try {
    const payload = await apiFetch("/auth/me");
    return extractSessionActorFromResponse(payload);
  } catch {
    return { id: null, name: "Portal User", email: null, role: null };
  }
}

function normalizeLower(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => (typeof row === "number" ? row : Number.parseInt(String(row), 10)))
    .filter((row) => Number.isFinite(row) && row > 0);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const deduped = new Set<string>();
  for (const row of value) {
    const normalized = normalizeLower(typeof row === "string" ? row : String(row ?? ""));
    if (!normalized) continue;
    deduped.add(normalized);
  }
  return Array.from(deduped.values());
}

function isEntranceInviteAuthorized(quiz: QuizSet, actor: LocalActor): boolean {
  if (quiz.quizType !== "entrance") return true;
  if (normalizeLower(actor.role) !== "student") return false;
  const email = normalizeLower(actor.email);
  if (!email) return false;
  if (!Array.isArray(quiz.invitedRecipientEmails) || quiz.invitedRecipientEmails.length === 0) return false;
  return quiz.invitedRecipientEmails.map((item) => normalizeLower(item)).includes(email);
}

function createShareToken() {
  return `qz_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-5)}`;
}

function buildShareLink(token: string): string {
  if (!hasWindow()) return `/student/quizzes/${token}`;
  return `${window.location.origin}/student/quizzes/${token}`;
}

function computeExpiry(publishedAt: string, durationMinutes: number): string {
  const publishedTime = new Date(publishedAt).getTime();
  return new Date(publishedTime + durationMinutes * 60 * 1000).toISOString();
}

function gradeLocalAnswers(
  questions: QuizQuestion[],
  answers: Record<string, string>,
  passRate: number,
  localItems?: QuizItem[]
) {
  const itemMap = new Map<number, QuizItem>((localItems ?? []).map((item) => [item.id, item]));
  let score = 0;
  const total = questions.length;
  for (const question of questions) {
    const answer = normalizeChoiceId(answers[String(question.id)] ?? "");
    const quizItem = itemMap.get(question.id);
    const correctChoice = quizItem ? normalizeChoiceId(quizItem.correctChoiceId) : "A";
    if (answer && answer === correctChoice) {
      score += 1;
    }
  }
  const correctCount = score;
  const wrongCount = Math.max(0, total - correctCount);
  const passed = total > 0 ? (correctCount / total) * 100 >= passRate : false;
  return { score, total, passed, correctCount, wrongCount };
}

function getLocalQuizByToken(token: string): QuizSet | null {
  const merged = getRoleLocalQuizzes("admin");
  return merged.find((quiz) => quiz.shareToken === token) ?? null;
}

function filterAndPaginateLocalQuizzes(
  rows: QuizSet[],
  options: {
    page?: number;
    perPage?: number;
    q?: string;
    status?: "all" | QuizSetStatus;
    offeringId?: string;
    quizType?: "all" | QuizType;
    createdBy?: string;
  }
): QuizListResponse {
  const q = options.q?.trim().toLowerCase() ?? "";
  const filtered = rows
    .filter((row) => {
      if (options.status && options.status !== "all" && row.status !== options.status) return false;
      if (options.quizType && options.quizType !== "all" && row.quizType !== options.quizType) return false;
      if (options.offeringId && options.offeringId !== "all" && String(row.offeringId ?? "") !== options.offeringId) return false;
      if (
        options.createdBy &&
        options.createdBy !== "all" &&
        !(
          (options.createdBy === "null" && row.createdByUserId == null) ||
          String(row.createdByUserId ?? "") === options.createdBy
        )
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = `${row.title} ${row.instructions} ${row.offeringLabel} ${row.courseProgramLabel} ${row.createdByName}`.toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });

  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.max(1, options.perPage ?? 10);
  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);

  return {
    items,
    meta: {
      currentPage: page,
      lastPage,
      perPage,
      total,
    },
  };
}

async function resolveLocalOfferingLabel(role: RoleQuizScope, offeringId: number | null): Promise<string> {
  if (!offeringId) return "Unassigned Offering";
  try {
    const catalog = await listRoleQuizOfferingsCatalog(role, {
      page: 1,
      perPage: 200,
      q: "",
    });
    const matched = catalog.items.find((item) => item.offeringId === offeringId);
    if (matched) return matched.label;
  } catch {
    // Keep fallback label.
  }
  return `Offering #${offeringId}`;
}

async function resolveLocalCourseProgramLabel(role: RoleQuizScope, courseProgramId: number | null): Promise<string> {
  if (!courseProgramId) return "Unassigned Program";
  try {
    const courses = await listRoleEntranceCourses(role);
    const matched = courses.find((course) => course.id === courseProgramId);
    if (matched) return matched.label;
  } catch {
    // Keep fallback label.
  }
  return `Program #${courseProgramId}`;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function clampPerPage(value: number | undefined, fallback: number): number {
  const parsed = Number(value);
  const resolved = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(100, Math.max(1, Math.trunc(resolved)));
}

function normalizeStatus(raw: unknown): QuizSetStatus {
  return String(raw).toLowerCase() === "published" ? "published" : "draft";
}

function normalizeQuizType(raw: unknown): QuizType {
  return String(raw).toLowerCase() === "entrance" ? "entrance" : "regular";
}

function defaultListMeta(overrides?: Partial<QuizListMeta>): QuizListMeta {
  return {
    currentPage: overrides?.currentPage ?? 1,
    lastPage: overrides?.lastPage ?? 1,
    perPage: overrides?.perPage ?? 10,
    total: overrides?.total ?? 0,
  };
}

function toMeta(rawMeta: PlainObject, fallbackPerPage: number, fallbackTotal: number): QuizListMeta {
  return {
    currentPage: asNumber(rawMeta.current_page ?? rawMeta.page, 1),
    lastPage: asNumber(rawMeta.last_page ?? rawMeta.total_pages, 1),
    perPage: asNumber(rawMeta.per_page, fallbackPerPage),
    total: asNumber(rawMeta.total, fallbackTotal),
  };
}

function normalizeQuizRow(raw: unknown): QuizSet {
  const row = (raw ?? {}) as PlainObject;
  const createdBy = row.created_by as PlainObject | undefined;
  const quizType = normalizeQuizType(row.quiz_type);
  const invitedAdmissionIds = normalizeNumberArray(
    row.invited_admission_ids ?? row.recipient_ids ?? row.invitedAdmissionIds
  );
  const invitedRecipientEmails = normalizeStringArray(
    row.invited_recipient_emails ?? row.recipient_emails ?? row.invitedRecipientEmails
  );
  const offeringLabel =
    asString(row.offering_label) ||
    asString(row.offering_name) ||
    [asString(row.course_code), asString(row.section_code)].filter(Boolean).join(" ").trim() ||
    "Unassigned Offering";
  const programLabel =
    asString(row.course_program_label) ||
    asString(row.program_name) ||
    asString(row.primary_course) ||
    "Unassigned Program";
  const createdByName =
    asString(row.created_by_name) ||
    asString(createdBy?.name) ||
    asString(row.author_name) ||
    "Portal User";

  return {
    id: asNumber(row.id ?? row.quiz_id, 0),
    title: asString(row.title, "Untitled Quiz"),
    instructions: asString(row.instructions ?? row.description),
    passRate: asNumber(row.pass_rate, 50),
    durationMinutes: asNumber(row.duration_minutes, 30),
    status: normalizeStatus(row.status),
    quizType,
    createdByUserId: row.created_by_user_id == null ? null : asNumber(row.created_by_user_id, 0),
    createdByName,
    offeringId: row.offering_id == null ? null : asNumber(row.offering_id, 0),
    offeringLabel,
    courseProgramId: row.course_program_id == null ? null : asNumber(row.course_program_id, 0),
    courseProgramLabel: programLabel,
    shuffleItems: typeof row.shuffle_items === "boolean" ? row.shuffle_items : true,
    shuffleChoices: typeof row.shuffle_choices === "boolean" ? row.shuffle_choices : true,
    publishedAt: asNullableString(row.published_at),
    expiresAt: asNullableString(row.expires_at),
    shareToken: asNullableString(row.share_token),
    linkUrl: asNullableString(row.link_url),
    invitedAdmissionIds,
    invitedRecipientEmails,
    createdAt: asNullableString(row.created_at),
    updatedAt: asNullableString(row.updated_at),
  };
}

function normalizeQuestion(raw: unknown): QuizQuestion {
  const row = (raw ?? {}) as PlainObject;
  const rawChoices = (Array.isArray(row.choices) ? row.choices : []) as PlainObject[];
  const choices: QuizChoice[] = rawChoices.map((choice, index) => ({
    id: asString(choice.id ?? choice.choice_id, String(index + 1)),
    text: asString(choice.text ?? choice.label, `Choice ${index + 1}`),
  }));

  return {
    id: asNumber(row.id ?? row.question_id, 0),
    prompt: asString(row.prompt ?? row.question ?? row.text, "Question"),
    points: asNumber(row.points, 1),
    choices,
  };
}

function normalizeQuizItemRow(raw: unknown): QuizItem | null {
  const row = (raw ?? {}) as PlainObject;
  const id = asNumber(row.id ?? row.item_id, 0);
  if (!id) return null;
  const quizId = asNumber(row.quiz_id ?? row.quizId, 0);
  const prompt = asString(row.prompt ?? row.question ?? row.text, "").trim();
  const rawChoices = (Array.isArray(row.choices) ? row.choices : []) as PlainObject[];
  const choices = rawChoices.map((choice, index) => ({
    id: normalizeChoiceId(asString(choice.id ?? choice.choice_id, String.fromCharCode(65 + index))),
    text: asString(choice.text ?? choice.label, `Choice ${index + 1}`),
  }));
  const correctChoiceId = normalizeChoiceId(asString(row.correct_choice_id ?? row.correct_choice ?? row.answer_key, "A"));
  return {
    id,
    quizId,
    prompt: prompt || "Untitled question",
    choices,
    correctChoiceId,
    order: asNumber(row.order ?? row.sequence, 1),
    createdAt: asNullableString(row.created_at),
    updatedAt: asNullableString(row.updated_at),
  };
}

function normalizeAttemptSummary(raw: unknown): QuizAttemptSummary | null {
  const row = (raw ?? {}) as PlainObject;
  const attemptId = asNumber(row.attempt_id ?? row.id, 0);
  if (!attemptId) return null;
  const score = asNumber(row.score, 0);
  const total = asNumber(row.total, 0);
  const correctCount = row.correct_count == null ? score : asNumber(row.correct_count, score);
  const wrongCount = row.wrong_count == null ? Math.max(0, total - correctCount) : asNumber(row.wrong_count, Math.max(0, total - correctCount));
  return {
    attemptId,
    quizId: asNumber(row.quiz_id ?? row.quizId, 0),
    studentName: asString(row.student_name ?? row.studentName, "Student"),
    studentEmail: asNullableString(row.student_email ?? row.studentEmail),
    score,
    total,
    correctCount,
    wrongCount,
    passed: typeof row.passed === "boolean" ? row.passed : total > 0 ? (score / total) * 100 >= 50 : false,
    startedAt: asNullableString(row.started_at ?? row.startedAt),
    submittedAt: asNullableString(row.submitted_at ?? row.submittedAt),
    autoSubmitted: typeof row.auto_submitted === "boolean" ? row.auto_submitted : false,
  };
}

function normalizePlayable(raw: unknown): QuizPlayable {
  const row = (raw ?? {}) as PlainObject;
  return {
    id: asNumber(row.id ?? row.quiz_id, 0),
    title: asString(row.title, "Quiz"),
    instructions: asString(row.instructions ?? row.description),
    durationMinutes: asNumber(row.duration_minutes, 30),
    passRate: asNumber(row.pass_rate, 50),
    shuffleItems: typeof row.shuffle_items === "boolean" ? row.shuffle_items : true,
    shuffleChoices: typeof row.shuffle_choices === "boolean" ? row.shuffle_choices : true,
    publishedAt: asNullableString(row.published_at),
    expiresAt: asNullableString(row.expires_at),
  };
}

function normalizeCatalogRow(raw: unknown): QuizCatalogItem | null {
  const row = (raw ?? {}) as PlainObject;
  const offeringId = asNumber(row.offering_id ?? row.id, 0);
  if (!offeringId) return null;

  const courseCode = asString(row.course_code, `SUBJ-${offeringId}`);
  const courseTitle = asString(row.course_title, "Subject");
  const sectionCode = asString(row.section_code);
  const label =
    asString(row.label) ||
    `${courseCode} - ${courseTitle}${sectionCode ? ` (${sectionCode})` : ""}`;

  return {
    id: offeringId,
    offeringId,
    label,
    courseCode,
    courseTitle,
    sectionCode,
    programId: row.program_id == null ? null : asNumber(row.program_id, 0),
    programName: asString(row.program_name, "Unassigned Program"),
    yearLevel: row.year_level == null ? null : asNumber(row.year_level, 0),
    semester: row.semester == null ? null : asNumber(row.semester, 0),
    periodId: row.period_id == null ? null : asNumber(row.period_id, 0),
    periodName: asString(row.period_name),
  };
}

function normalizeCatalogRows(rows: unknown[]): QuizCatalogItem[] {
  const deduped = new Map<number, QuizCatalogItem>();
  for (const row of rows) {
    const normalized = normalizeCatalogRow(row);
    if (!normalized) continue;
    if (!deduped.has(normalized.offeringId)) {
      deduped.set(normalized.offeringId, normalized);
    }
  }
  return Array.from(deduped.values());
}

function normalizeEntranceApprovedApplicantRow(raw: unknown): EntranceApprovedApplicant | null {
  const row = (raw ?? {}) as PlainObject;
  const id = asNumber(row.id, 0);
  const email = asString(row.email).trim();
  if (!id || !email) return null;
  const applicationType = asString(row.application_type, "admission").toLowerCase() === "vocational" ? "vocational" : "admission";
  return {
    id,
    fullName: asString(row.full_name, "Applicant"),
    email,
    primaryCourse: asString(row.primary_course, "Unassigned Program"),
    applicationType,
    approvedAt: asNullableString(row.approved_at),
    examScheduleSentAt: asNullableString(row.exam_schedule_sent_at),
    hasStudentAccount: typeof row.has_student_account === "boolean" ? row.has_student_account : asNumber(row.has_student_account, 0) === 1,
  };
}

function normalizeEntranceScheduledApplicantRow(raw: unknown): EntranceApprovedApplicant | null {
  const row = (raw ?? {}) as PlainObject;
  const id = asNumber(row.id, 0);
  const email = asString(row.email).trim();
  if (!id || !email) return null;

  const applicationType = asString(row.application_type, "admission").toLowerCase() === "vocational" ? "vocational" : "admission";
  const payload = row.exam_schedule_payload && typeof row.exam_schedule_payload === "object" ? (row.exam_schedule_payload as PlainObject) : null;
  const rawQuizId = payload?.exam_quiz_id;
  const normalizedQuizId =
    typeof rawQuizId === "number" || typeof rawQuizId === "string" ? rawQuizId : null;
  const payloadSentAt = payload ? asNullableString(payload.sent_at) : null;
  const examScheduleSentAt = asNullableString(row.exam_schedule_sent_at) ?? payloadSentAt;
  if (!examScheduleSentAt) return null;

  const fullName =
    asString(row.full_name).trim() ||
    `${asString(row.first_name).trim()} ${asString(row.last_name).trim()}`.trim() ||
    "Applicant";
  const primaryCourse = asString(row.primary_course).trim() || asString(row.course).trim() || "Unassigned Program";
  const hasStudentAccount =
    typeof row.has_student_account === "boolean"
      ? row.has_student_account
      : asNumber(row.has_student_account, 0) === 1 || asNumber(row.created_user_id, 0) > 0;

  return {
    id,
    fullName,
    email,
    primaryCourse,
    applicationType,
    approvedAt: asNullableString(row.approved_at),
    examScheduleSentAt,
    hasStudentAccount,
    examSchedulePayload: payload
      ? {
          exam_quiz_id: normalizedQuizId,
          exam_quiz_title: asNullableString(payload.exam_quiz_title),
          subject: asString(payload.subject),
          intro_message: asString(payload.intro_message),
          exam_date: asString(payload.exam_date),
          exam_time: asString(payload.exam_time),
          exam_day: asString(payload.exam_day),
          location: asString(payload.location),
          things_to_bring: asString(payload.things_to_bring),
          attire_note: asNullableString(payload.attire_note),
          additional_note: asNullableString(payload.additional_note),
          sent_by: asNumber(payload.sent_by, 0) || undefined,
          sent_at: asNullableString(payload.sent_at) || undefined,
        }
      : null,
  };
}

function buildCatalogQuery(query: QuizCatalogQuery) {
  const perPage = clampPerPage(query.perPage, 50);
  const urlQuery = new URLSearchParams();
  const q = query.q?.trim() ?? "";
  if (q) urlQuery.set("q", q);
  if (query.programId && query.programId !== "all") urlQuery.set("program_id", query.programId);
  if (query.yearLevel && query.yearLevel !== "all") urlQuery.set("year_level", query.yearLevel);
  if (query.semester && query.semester !== "all") urlQuery.set("semester", query.semester);
  if (query.periodId && query.periodId !== "all") urlQuery.set("period_id", query.periodId);
  urlQuery.set("page", String(query.page ?? 1));
  urlQuery.set("per_page", String(perPage));
  urlQuery.set("sort", "relevance,course_code");
  return urlQuery;
}


export async function listRoleQuizzes(
  role: RoleQuizScope,
  options: {
    page?: number;
    perPage?: number;
    q?: string;
    status?: "all" | QuizSetStatus;
    offeringId?: string;
    quizType?: "all" | QuizType;
    createdBy?: string;
  } = {}
): Promise<QuizListResponse> {
  const perPage = clampPerPage(options.perPage, 10);
  const query = new URLSearchParams();
  query.set("page", String(options.page ?? 1));
  query.set("per_page", String(perPage));
  if (options.q?.trim()) query.set("q", options.q.trim());
  if (options.status && options.status !== "all") query.set("status", options.status);
  if (options.offeringId && options.offeringId !== "all") query.set("offering_id", options.offeringId);
  if (options.quizType && options.quizType !== "all") query.set("quiz_type", options.quizType);
  if (options.createdBy && options.createdBy !== "all") query.set("created_by", options.createdBy);

  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes?${query.toString()}`)) as PlainObject;
    const rawItems =
      (Array.isArray(payload.items) ? payload.items : null) ??
      (Array.isArray(payload.quizzes) ? payload.quizzes : null) ??
      (Array.isArray(payload.data) ? payload.data : null) ??
      [];
    const meta = toMeta((payload.meta ?? payload.pagination ?? payload) as PlainObject, perPage, rawItems.length);

    return {
      items: rawItems.map((item) => normalizeQuizRow(item)),
      meta,
    };
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    return filterAndPaginateLocalQuizzes(getRoleLocalQuizzes(role), options);
  }
}

export async function listRoleQuizCreators(role: RoleQuizScope): Promise<QuizCreator[]> {
  const payload = (await apiFetch(`${roleBase(role)}/quizzes/creators`)) as PlainObject;
  const rows = (Array.isArray(payload.items) ? payload.items : null) ?? (Array.isArray(payload.creators) ? payload.creators : null) ?? [];
  const creators = rows
    .map((row) => {
      const value = row as PlainObject;
      const id = value.id == null ? null : asNumber(value.id, 0);
      const name = asString(value.name, "").trim();
      if (!name) return null;
      return { id, name } satisfies QuizCreator;
    })
    .filter((row): row is QuizCreator => Boolean(row));
  if (creators.length === 0) return [];
  return creators;
}

export async function getRoleQuizById(role: RoleQuizScope, quizId: number): Promise<QuizSet> {
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}`)) as PlainObject;
    return normalizeQuizRow(payload.quiz ?? payload.item ?? payload);
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const local = getRoleLocalQuizzes(role).find((row) => row.id === quizId);
    if (!local) throw new Error("Quiz not found.");
    return local;
  }
}

export async function listRoleQuizOfferingsCatalog(
  role: RoleQuizScope,
  query: QuizCatalogQuery = {}
): Promise<QuizCatalogResponse> {
  const built = buildCatalogQuery(query);
  const payload = (await apiFetch(`${roleBase(role)}/quizzes/offerings/catalog?${built.toString()}`)) as PlainObject;
  const rawItems =
    (Array.isArray(payload.items) ? payload.items : null) ??
    (Array.isArray(payload.offerings) ? payload.offerings : null) ??
    (Array.isArray(payload.data) ? payload.data : null) ??
    [];
  const items = normalizeCatalogRows(rawItems);
  const meta = toMeta((payload.meta ?? payload.pagination ?? payload) as PlainObject, query.perPage ?? 50, items.length);
  return { items, meta };
}

export async function listRoleQuizOfferings(role: RoleQuizScope): Promise<QuizOffering[]> {
  const catalog = await listRoleQuizOfferingsCatalog(role, { page: 1, perPage: 50 });
  return catalog.items.map((item) => ({ id: item.offeringId, label: item.label }));
}

export async function listRoleEntranceCourses(role: RoleQuizScope): Promise<EntranceCourse[]> {
  const payload = (await apiFetch(`${roleBase(role)}/quizzes/entrance/courses`)) as PlainObject;
  const rows =
    (Array.isArray(payload.items) ? payload.items : null) ??
    (Array.isArray(payload.courses) ? payload.courses : null) ??
    [];
  return rows
    .map((row) => {
      const value = row as PlainObject;
      const id = asNumber(value.id ?? value.course_program_id, 0);
      if (!id) return null;
      const code = asString(value.code ?? value.program_code, `COURSE-${id}`);
      const label = asString(value.label ?? value.program_name ?? value.name, code);
      return { id, code, label };
    })
    .filter((item): item is EntranceCourse => Boolean(item));
}

export async function listRoleEntranceApprovedApplicants(
  role: RoleQuizScope,
  query: EntranceApprovedApplicantsQuery = {}
): Promise<EntranceApprovedApplicantsResponse> {
  const perPage = clampPerPage(query.perPage, 50);
  const built = new URLSearchParams();
  if (query.q?.trim()) built.set("q", query.q.trim());
  if (query.course?.trim()) built.set("course", query.course.trim());
  if (query.applicationType && query.applicationType !== "all") built.set("application_type", query.applicationType);
  built.set("with_student_account", query.withStudentAccount === false ? "0" : "1");
  built.set("page", String(query.page ?? 1));
  built.set("per_page", String(perPage));

  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/entrance/approved-applicants?${built.toString()}`)) as PlainObject;
    const rows =
      (Array.isArray(payload.items) ? payload.items : null) ??
      (Array.isArray(payload.applicants) ? payload.applicants : null) ??
      (Array.isArray(payload.data) ? payload.data : null) ??
      [];
    const items = rows
      .map((row) => normalizeEntranceApprovedApplicantRow(row))
      .filter((row): row is EntranceApprovedApplicant => Boolean(row));
    const meta = toMeta((payload.meta ?? payload.pagination ?? payload) as PlainObject, perPage, items.length);
    return { items, meta };
  } catch (error) {
    if (!allowRoleQuizFallback(role)) throw error;
    return {
      items: [],
      meta: defaultListMeta({ perPage }),
    };
  }
}

export async function listRoleEntranceScheduledApplicants(
  role: RoleQuizScope,
  query: EntranceScheduledApplicantsQuery = {}
): Promise<EntranceScheduledApplicantsResponse> {
  const perPage = clampPerPage(query.perPage, 50);
  if (role !== "admin") {
    return listRoleEntranceApprovedApplicants(role, {
      q: query.q,
      course: query.course,
      applicationType: query.applicationType,
      withStudentAccount: false,
      page: query.page,
      perPage,
    });
  }

  try {
    const built = new URLSearchParams();
    if (query.q?.trim()) built.set("q", query.q.trim());
    if (query.course?.trim()) built.set("course", query.course.trim());
    if (query.applicationType && query.applicationType !== "all") built.set("application_type", query.applicationType);
    built.set("page", String(query.page ?? 1));
    built.set("per_page", String(perPage));
    const payload = (await apiFetch(`/admin/quizzes/entrance/scheduled-applicants?${built.toString()}`)) as PlainObject;
    const rows =
      (Array.isArray(payload.applications) ? payload.applications : null) ??
      (Array.isArray(payload.items) ? payload.items : null) ??
      (Array.isArray(payload.data) ? payload.data : null) ??
      [];

    const q = query.q?.trim().toLowerCase() ?? "";
    const course = query.course?.trim().toLowerCase() ?? "";
    const applicationType = query.applicationType ?? "all";
    const filtered = rows
      .map((row) => normalizeEntranceScheduledApplicantRow(row))
      .filter((row): row is EntranceApprovedApplicant => Boolean(row))
      .filter((row) => {
        if (applicationType !== "all" && row.applicationType !== applicationType) return false;
        if (course && row.primaryCourse.trim().toLowerCase() !== course) return false;
        if (!q) return true;
        const haystack = `${row.fullName} ${row.email} ${row.primaryCourse}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const aTime = new Date(a.examScheduleSentAt ?? 0).getTime();
        const bTime = new Date(b.examScheduleSentAt ?? 0).getTime();
        if (aTime !== bTime) return bTime - aTime;
        return a.fullName.localeCompare(b.fullName);
      });

    const page = Math.max(1, query.page ?? 1);
    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    return {
      items,
      meta: {
        currentPage: page,
        lastPage,
        perPage,
        total,
      },
    };
  } catch (error) {
    if (!allowRoleQuizFallback(role)) throw error;
    return {
      items: [],
      meta: defaultListMeta({ perPage }),
    };
  }
}

export async function sendRoleEntranceQuizInvites(
  role: RoleQuizScope,
  body: SendEntranceQuizInvitesPayload
): Promise<SendEntranceQuizInvitesResponse> {
  const payload = (await apiFetch(`${roleBase(role)}/quizzes/entrance/send-invites`, {
    method: "POST",
    body: JSON.stringify(body),
  })) as PlainObject;
  return {
    message: asString(payload.message, "Entrance quiz invites processed."),
    sentCount: asNumber(payload.sent_count, 0),
    failedCount: asNumber(payload.failed_count, 0),
  };
}

export async function listRoleQuizItems(role: RoleQuizScope, quizId: number): Promise<QuizItem[]> {
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}/items`)) as PlainObject;
    const rows = (Array.isArray(payload.items) ? payload.items : null) ?? (Array.isArray(payload.questions) ? payload.questions : null) ?? [];
    return rows
      .map((row) => normalizeQuizItemRow(row))
      .filter((row): row is QuizItem => Boolean(row))
      .sort((a, b) => a.order - b.order || a.id - b.id);
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    return getLocalQuizItemsForQuiz(quizId);
  }
}

export async function createRoleQuizItem(role: RoleQuizScope, quizId: number, body: QuizItemUpsertPayload): Promise<QuizItem> {
  validateQuizItemPayload(body);
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as PlainObject;
    const normalized = normalizeQuizItemRow(payload.item ?? payload.question ?? payload);
    if (!normalized) throw new Error("Unable to create quiz item.");
    return normalized;
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const now = new Date().toISOString();
    const existing = readLocalQuizItems();
    const nextId = (existing.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;
    const quizItems = getLocalQuizItemsForQuiz(quizId);
    const created: QuizItem = {
      id: nextId,
      quizId,
      prompt: body.prompt.trim(),
      choices: body.choices.map((choice, index) => ({
        id: normalizeChoiceId(choice.id || String.fromCharCode(65 + index)),
        text: choice.text,
      })),
      correctChoiceId: normalizeChoiceId(body.correct_choice_id || "A"),
      order: body.order ?? quizItems.length + 1,
      createdAt: now,
      updatedAt: now,
    };
    const filtered = existing.filter((item) => item.quizId !== quizId);
    writeLocalQuizItems([...filtered, ...quizItems, created]);
    return created;
  }
}

export async function updateRoleQuizItem(
  role: RoleQuizScope,
  quizId: number,
  itemId: number,
  body: QuizItemUpsertPayload
): Promise<QuizItem> {
  validateQuizItemPayload(body);
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })) as PlainObject;
    const normalized = normalizeQuizItemRow(payload.item ?? payload.question ?? payload);
    if (!normalized) throw new Error("Unable to update quiz item.");
    return normalized;
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const existing = readLocalQuizItems();
    const baseItems = getLocalQuizItemsForQuiz(quizId);
    const working = existing.some((item) => item.quizId === quizId)
      ? existing
      : [...existing.filter((item) => item.quizId !== quizId), ...baseItems];
    const index = working.findIndex((item) => item.id === itemId && item.quizId === quizId);
    if (index < 0) throw new Error("Quiz item not found.");
    const updated: QuizItem = {
      ...working[index],
      prompt: body.prompt.trim(),
      choices: body.choices.map((choice, choiceIndex) => ({
        id: normalizeChoiceId(choice.id || String.fromCharCode(65 + choiceIndex)),
        text: choice.text,
      })),
      correctChoiceId: normalizeChoiceId(body.correct_choice_id || "A"),
      order: body.order ?? working[index].order,
      updatedAt: new Date().toISOString(),
    };
    const next = [...working];
    next[index] = updated;
    writeLocalQuizItems(next);
    return updated;
  }
}

export async function deleteRoleQuizItem(role: RoleQuizScope, quizId: number, itemId: number) {
  try {
    return await apiFetch(`${roleBase(role)}/quizzes/${quizId}/items/${itemId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const existing = readLocalQuizItems();
    const baseItems = getLocalQuizItemsForQuiz(quizId);
    const working = existing.some((item) => item.quizId === quizId)
      ? existing
      : [...existing.filter((item) => item.quizId !== quizId), ...baseItems];
    writeLocalQuizItems(working.filter((item) => !(item.quizId === quizId && item.id === itemId)));
    return { message: "Quiz item deleted." };
  }
}

export async function listRoleQuizResults(
  role: RoleQuizScope,
  quizId: number,
  filters: { q?: string; status?: "all" | "passed" | "failed"; dateFrom?: string; dateTo?: string } = {}
): Promise<QuizAttemptSummary[]> {
  const query = new URLSearchParams();
  if (filters.q?.trim()) query.set("q", filters.q.trim());
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.dateFrom) query.set("date_from", filters.dateFrom);
  if (filters.dateTo) query.set("date_to", filters.dateTo);
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}/results?${query.toString()}`)) as PlainObject;
    const rows = (Array.isArray(payload.items) ? payload.items : null) ?? (Array.isArray(payload.results) ? payload.results : null) ?? [];
    return rows
      .map((row) => normalizeAttemptSummary(row))
      .filter((row): row is QuizAttemptSummary => Boolean(row));
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const q = filters.q?.trim().toLowerCase() ?? "";
    return readLocalAttempts()
      .filter((attempt) => attempt.quizId === quizId && attempt.submittedAt)
      .map((attempt) => ({
        attemptId: attempt.id,
        quizId: attempt.quizId,
        studentName: attempt.studentName,
        studentEmail: attempt.studentEmail,
        score: attempt.score ?? 0,
        total: attempt.total ?? attempt.snapshot.length,
        correctCount: attempt.correctCount ?? 0,
        wrongCount: attempt.wrongCount ?? 0,
        passed: Boolean(attempt.passed),
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        autoSubmitted: attempt.autoSubmitted,
      }))
      .filter((row) => {
        if (filters.status === "passed" && !row.passed) return false;
        if (filters.status === "failed" && row.passed) return false;
        if (filters.dateFrom && row.submittedAt && row.submittedAt.slice(0, 10) < filters.dateFrom) return false;
        if (filters.dateTo && row.submittedAt && row.submittedAt.slice(0, 10) > filters.dateTo) return false;
        if (!q) return true;
        return `${row.studentName} ${row.studentEmail ?? ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime());
  }
}

export async function getRoleQuizResultDetail(role: RoleQuizScope, quizId: number, attemptId: number): Promise<QuizAttemptDetail> {
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}/results/${attemptId}`)) as PlainObject;
    const attempt = normalizeAttemptSummary(payload.attempt ?? payload.result ?? payload);
    if (!attempt) throw new Error("Attempt detail unavailable.");
    const rows = (Array.isArray(payload.items) ? payload.items : null) ?? (Array.isArray(payload.questions) ? payload.questions : null) ?? [];
    const items: QuizAttemptItemResult[] = rows.map((row) => {
      const value = row as PlainObject;
      return {
        itemId: asNumber(value.item_id ?? value.question_id ?? value.id, 0),
        prompt: asString(value.prompt ?? value.question, "Question"),
        selectedChoiceId: asNullableString(value.selected_choice_id ?? value.selected_answer),
        selectedChoiceText: asNullableString(value.selected_choice_text ?? value.selected_answer_text),
        correctChoiceId: asString(value.correct_choice_id ?? value.correct_answer, "A"),
        correctChoiceText: asNullableString(value.correct_choice_text ?? value.correct_answer_text),
        isCorrect: Boolean(value.is_correct),
      };
    });
    return { attempt, items };
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const attempt = readLocalAttempts().find((row) => row.id === attemptId && row.quizId === quizId);
    if (!attempt) throw new Error("Attempt detail unavailable.");
    const items: QuizAttemptItemResult[] = attempt.snapshot.map((item) => {
      const selectedChoiceId = normalizeChoiceId(attempt.answers[String(item.id)] ?? "");
      const selectedChoice = item.choices.find((choice) => normalizeChoiceId(choice.id) === selectedChoiceId) ?? null;
      const correctChoice = item.choices.find((choice) => normalizeChoiceId(choice.id) === normalizeChoiceId(item.correctChoiceId)) ?? null;
      const isCorrect = Boolean(selectedChoiceId) && selectedChoiceId === normalizeChoiceId(item.correctChoiceId);
      return {
        itemId: item.id,
        prompt: item.prompt,
        selectedChoiceId: selectedChoiceId || null,
        selectedChoiceText: selectedChoice?.text ?? null,
        correctChoiceId: normalizeChoiceId(item.correctChoiceId),
        correctChoiceText: correctChoice?.text ?? null,
        isCorrect,
      };
    });
    return {
      attempt: {
        attemptId: attempt.id,
        quizId: attempt.quizId,
        studentName: attempt.studentName,
        studentEmail: attempt.studentEmail,
        score: attempt.score ?? 0,
        total: attempt.total ?? attempt.snapshot.length,
        correctCount: attempt.correctCount ?? 0,
        wrongCount: attempt.wrongCount ?? 0,
        passed: Boolean(attempt.passed),
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        autoSubmitted: attempt.autoSubmitted,
      },
      items,
    };
  }
}

export async function createRoleQuiz(role: RoleQuizScope, body: QuizUpsertPayload): Promise<QuizSet> {
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as PlainObject;
    return normalizeQuizRow(payload.quiz ?? payload.item ?? payload);
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;

    const existing = getRoleLocalQuizzes(role);
    const nextId = (existing.reduce((max, row) => Math.max(max, row.id), 0) || 0) + 1;
    const now = new Date().toISOString();
    const actor = await resolveLocalActor();
    const offeringLabel = await resolveLocalOfferingLabel(role, body.offering_id);
    const courseProgramLabel = await resolveLocalCourseProgramLabel(role, body.course_program_id);
    const isPublished = body.status === "published";
    const publishedAt = isPublished ? now : null;
    const expiresAt = isPublished ? computeExpiry(now, body.duration_minutes) : null;
    const shareToken = isPublished ? createShareToken() : null;

    const created: QuizSet = {
      id: nextId,
      title: body.title,
      instructions: body.instructions,
      passRate: body.pass_rate,
      durationMinutes: body.duration_minutes,
      status: body.status,
      quizType: body.quiz_type,
      createdByUserId: actor.id,
      createdByName: actor.name,
      offeringId: body.offering_id,
      offeringLabel,
      courseProgramId: body.course_program_id,
      courseProgramLabel,
      shuffleItems: body.shuffle_items ?? true,
      shuffleChoices: body.shuffle_choices ?? true,
      publishedAt,
      expiresAt,
      shareToken,
      linkUrl: shareToken ? buildShareLink(shareToken) : null,
      invitedAdmissionIds: [],
      invitedRecipientEmails: [],
      createdAt: now,
      updatedAt: now,
    };

    setRoleLocalQuizzes(role, [created, ...existing]);
    return created;
  }
}

export async function updateRoleQuiz(role: RoleQuizScope, quizId: number, body: QuizUpsertPayload): Promise<QuizSet> {
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })) as PlainObject;
    return normalizeQuizRow(payload.quiz ?? payload.item ?? payload);
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;

    const existing = getRoleLocalQuizzes(role);
    const index = existing.findIndex((row) => row.id === quizId);
    if (index < 0) {
      throw new Error("Quiz not found.");
    }

    const current = existing[index];
    const now = new Date().toISOString();
    const offeringLabel = await resolveLocalOfferingLabel(role, body.offering_id);
    const courseProgramLabel = await resolveLocalCourseProgramLabel(role, body.course_program_id);

    let publishedAt = current.publishedAt;
    let shareToken = current.shareToken;
    if (body.status === "published" && !publishedAt) {
      publishedAt = now;
    }
    if (body.status === "published" && !shareToken) {
      shareToken = createShareToken();
    }
    if (body.status === "draft") {
      publishedAt = null;
      shareToken = null;
    }

    const updated: QuizSet = {
      ...current,
      title: body.title,
      instructions: body.instructions,
      passRate: body.pass_rate,
      durationMinutes: body.duration_minutes,
      status: body.status,
      quizType: body.quiz_type,
      offeringId: body.offering_id,
      offeringLabel,
      courseProgramId: body.course_program_id,
      courseProgramLabel,
      shuffleItems: body.shuffle_items ?? current.shuffleItems ?? true,
      shuffleChoices: body.shuffle_choices ?? current.shuffleChoices ?? true,
      publishedAt,
      expiresAt: publishedAt ? computeExpiry(publishedAt, body.duration_minutes) : null,
      shareToken,
      linkUrl: shareToken ? buildShareLink(shareToken) : null,
      invitedAdmissionIds: current.invitedAdmissionIds ?? [],
      invitedRecipientEmails: current.invitedRecipientEmails ?? [],
      updatedAt: now,
    };

    const next = [...existing];
    next[index] = updated;
    setRoleLocalQuizzes(role, next);
    return updated;
  }
}

export async function deleteRoleQuiz(role: RoleQuizScope, quizId: number) {
  try {
    return await apiFetch(`${roleBase(role)}/quizzes/${quizId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const existing = getRoleLocalQuizzes(role);
    setRoleLocalQuizzes(
      role,
      existing.filter((row) => row.id !== quizId)
    );
    writeLocalQuizItems(readLocalQuizItems().filter((item) => item.quizId !== quizId));
    writeLocalAttempts(readLocalAttempts().filter((attempt) => attempt.quizId !== quizId));
    return { message: "Quiz deleted." };
  }
}

export async function publishRoleQuiz(
  role: RoleQuizScope,
  quizId: number,
  body: PublishQuizPayload,
  options: { allowLocalFallback?: boolean } = { allowLocalFallback: false }
) {
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}/publish`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as PlainObject;
    return {
      message: asString(payload.message, "Quiz published."),
      quiz: normalizeQuizRow(payload.quiz ?? payload.item ?? payload),
      linkUrl: asNullableString(payload.link_url),
      shareToken: asNullableString(payload.share_token),
      expiresAt: asNullableString(payload.expires_at),
    };
  } catch (error) {
    if (options.allowLocalFallback === false) throw error;
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;

    const existing = getRoleLocalQuizzes(role);
    const index = existing.findIndex((row) => row.id === quizId);
    if (index < 0) {
      throw new Error("Quiz not found.");
    }
    const now = new Date().toISOString();
    const current = existing[index];
    const shareToken = current.shareToken ?? createShareToken();
    const updated: QuizSet = {
      ...current,
      status: "published",
      publishedAt: now,
      expiresAt: computeExpiry(now, current.durationMinutes),
      shareToken,
      linkUrl: buildShareLink(shareToken),
      invitedAdmissionIds:
        current.quizType === "entrance"
          ? normalizeNumberArray(body.admission_ids ?? current.invitedAdmissionIds)
          : current.invitedAdmissionIds ?? [],
      invitedRecipientEmails:
        current.quizType === "entrance"
          ? normalizeStringArray(body.recipient_emails ?? current.invitedRecipientEmails)
          : current.invitedRecipientEmails ?? [],
      updatedAt: now,
    };
    const next = [...existing];
    next[index] = updated;
    setRoleLocalQuizzes(role, next);
    return {
      message: body.send_email ? "Quiz published locally." : "Quiz published locally.",
      quiz: updated,
      linkUrl: updated.linkUrl,
      shareToken: updated.shareToken,
      expiresAt: updated.expiresAt,
    };
  }
}

export async function getRoleQuizPreview(role: RoleQuizScope, quizId: number): Promise<QuizPreviewResponse> {
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}/preview`)) as PlainObject;
    const rawQuestions =
      (Array.isArray(payload.questions) ? payload.questions : null) ??
      (Array.isArray(payload.items) ? payload.items : null) ??
      [];
    return {
      quiz: normalizePlayable(payload.quiz ?? payload),
      questions: rawQuestions.map((question) => normalizeQuestion(question)),
    };
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const quiz = getRoleLocalQuizzes(role).find((row) => row.id === quizId);
    if (!quiz) throw new Error("Quiz preview is unavailable.");
    const questions = composeQuizQuestions(quiz, getLocalQuizItemsForQuiz(quiz.id));
    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        instructions: quiz.instructions,
        durationMinutes: quiz.durationMinutes,
        passRate: quiz.passRate,
        shuffleItems: quiz.shuffleItems,
        shuffleChoices: quiz.shuffleChoices,
        publishedAt: quiz.publishedAt,
        expiresAt: quiz.expiresAt,
      },
      questions,
    };
  }
}

export async function submitRoleQuizPreview(
  role: RoleQuizScope,
  quizId: number,
  body: { answers: Record<string, string>; auto_submitted?: boolean }
): Promise<AttemptSubmitResponse> {
  try {
    const payload = (await apiFetch(`${roleBase(role)}/quizzes/${quizId}/preview/submit`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as PlainObject;

    return {
      code: asNullableString(payload.code),
      message: asNullableString(payload.message),
      score: payload.score == null ? null : asNumber(payload.score, 0),
      total: payload.total == null ? null : asNumber(payload.total, 0),
      passed: typeof payload.passed === "boolean" ? payload.passed : null,
    };
  } catch (error) {
    if (!isQuizRouteUnavailable(error) || !allowRoleQuizFallback(role)) throw error;
    const quiz = getRoleLocalQuizzes(role).find((row) => row.id === quizId);
    if (!quiz) throw new Error("Quiz preview submission is unavailable.");
    const localItems = getLocalQuizItemsForQuiz(quiz.id);
    const questions = composeQuizQuestions(quiz, localItems);
    const graded = gradeLocalAnswers(questions, body.answers, quiz.passRate, localItems);
    return {
      code: body.auto_submitted ? "ATTEMPT_TIMEOUT" : null,
      message: body.auto_submitted ? "Preview auto-submitted (local fallback)." : "Preview submitted (local fallback).",
      score: graded.score,
      total: graded.total,
      passed: graded.passed,
      correctCount: graded.correctCount,
      wrongCount: graded.wrongCount,
    };
  }
}

export async function validateStudentQuizLink(token: string): Promise<StudentLinkValidation> {
  try {
    const payload = (await apiFetch(`/student/quizzes/link/${encodeURIComponent(token)}`)) as PlainObject;
    const rawQuestions =
      (Array.isArray(payload.questions) ? payload.questions : null) ??
      (Array.isArray(payload.items) ? payload.items : null) ??
      [];
    const rawAttempt = (payload.attempt ?? payload.active_attempt) as PlainObject | undefined;

    return {
      status: ((): LinkValidationStatus => {
        const value = asString(payload.status, "").toLowerCase();
        if (value === "expired") return "expired";
        if (value === "active") return "active";
        return "unavailable";
      })(),
      code: asNullableString(payload.code),
      message: asNullableString(payload.message),
      quiz: payload.quiz ? normalizePlayable(payload.quiz) : null,
      questions: rawQuestions.map((question) => normalizeQuestion(question)),
      attemptId: rawAttempt ? asNumber(rawAttempt.id ?? rawAttempt.attempt_id, 0) : null,
      endsAt: rawAttempt ? asNullableString(rawAttempt.ends_at) : null,
    };
  } catch (error) {
    if (!isQuizRouteUnavailable(error)) throw error;
    const quiz = getLocalQuizByToken(token);
    if (!quiz) {
      return {
        status: "unavailable",
        code: "QUIZ_UNAVAILABLE",
        message: "This quiz link is not available.",
        quiz: null,
        questions: [],
        attemptId: null,
        endsAt: null,
      };
    }
    if (quiz.status !== "published") {
      return {
        status: "unavailable",
        code: "QUIZ_NOT_PUBLISHED",
        message: "This quiz has not been published yet.",
        quiz: null,
        questions: [],
        attemptId: null,
        endsAt: null,
      };
    }
    const sessionActor = await resolveLocalActor();
    if (!isEntranceInviteAuthorized(quiz, sessionActor)) {
      return {
        status: "unavailable",
        code: "QUIZ_UNAVAILABLE",
        message: "This entrance quiz is restricted to invited incoming students using existing student credentials.",
        quiz: null,
        questions: [],
        attemptId: null,
        endsAt: null,
      };
    }
    const expiryMs = new Date(quiz.expiresAt ?? 0).getTime();
    if (!Number.isNaN(expiryMs) && Date.now() >= expiryMs) {
      return {
        status: "expired",
        code: "LINK_EXPIRED",
        message: "This quiz link has expired.",
        quiz: null,
        questions: [],
        attemptId: null,
        endsAt: null,
      };
    }

    const attempts = readLocalAttempts();
    const activeAttempt = attempts.find((attempt) => attempt.token === token && !attempt.submittedAt);
    const questions = activeAttempt
      ? activeAttempt.snapshot.map((item) => ({
          id: item.id,
          prompt: item.prompt,
          points: 1,
          choices: item.choices,
        }))
      : composeQuizQuestions(quiz, getLocalQuizItemsForQuiz(quiz.id));
    return {
      status: "active",
      code: null,
      message: "Quiz is available.",
      quiz: {
        id: quiz.id,
        title: quiz.title,
        instructions: quiz.instructions,
        durationMinutes: quiz.durationMinutes,
        passRate: quiz.passRate,
        shuffleItems: quiz.shuffleItems,
        shuffleChoices: quiz.shuffleChoices,
        publishedAt: quiz.publishedAt,
        expiresAt: quiz.expiresAt,
      },
      questions,
      attemptId: activeAttempt ? activeAttempt.id : null,
      endsAt: activeAttempt ? activeAttempt.endsAt : null,
    };
  }
}

export async function startStudentQuizAttempt(token: string): Promise<AttemptStartResponse> {
  try {
    const payload = (await apiFetch(`/student/quizzes/link/${encodeURIComponent(token)}/start`, {
      method: "POST",
    })) as PlainObject;
    const rawQuestions =
      (Array.isArray(payload.questions) ? payload.questions : null) ??
      (Array.isArray(payload.items) ? payload.items : null) ??
      [];
    return {
      attemptId: asNumber(payload.attempt_id ?? payload.id, 0),
      endsAt: asString(payload.ends_at),
      questions: rawQuestions.map((question) => normalizeQuestion(question)),
    };
  } catch (error) {
    if (!isQuizRouteUnavailable(error)) throw error;
    const quiz = getLocalQuizByToken(token);
    if (!quiz || quiz.status !== "published") {
      throw new Error("Quiz link is unavailable.");
    }
    if (!quiz.expiresAt || Date.now() >= new Date(quiz.expiresAt).getTime()) {
      throw new Error("LINK_EXPIRED");
    }
    const actor = await resolveLocalActor();
    if (!isEntranceInviteAuthorized(quiz, actor)) {
      throw new Error("This entrance quiz is restricted to invited incoming students using existing student credentials.");
    }

    const attempts = readLocalAttempts();
    const currentAttempt = attempts.find((attempt) => attempt.token === token && !attempt.submittedAt);
    if (currentAttempt) {
      const questions = currentAttempt.snapshot.map((item) => ({
        id: item.id,
        prompt: item.prompt,
        points: 1,
        choices: item.choices,
      }));
      return {
        attemptId: currentAttempt.id,
        endsAt: currentAttempt.endsAt,
        questions,
      };
    }

    const localItems = getLocalQuizItemsForQuiz(quiz.id);
    const snapshot = composeQuizQuestions(quiz, localItems).map((question, index) => ({
      id: question.id,
      quizId: quiz.id,
      prompt: question.prompt,
      choices: question.choices,
      correctChoiceId: localItems.find((item) => item.id === question.id)?.correctChoiceId ?? "A",
      order: index + 1,
      createdAt: null,
      updatedAt: null,
    }));

    const nextId = (attempts.reduce((max, attempt) => Math.max(max, attempt.id), 0) || 0) + 1;
    const created: LocalQuizAttempt = {
      id: nextId,
      token,
      quizId: quiz.id,
      startedAt: new Date().toISOString(),
      endsAt: quiz.expiresAt,
      studentName: actor.name || `Student ${nextId}`,
      studentEmail: actor.email,
      snapshot,
      answers: {},
      score: null,
      total: null,
      passed: null,
      correctCount: null,
      wrongCount: null,
      autoSubmitted: false,
      submittedAt: null,
    };
    writeLocalAttempts([created, ...attempts]);
    const questions = created.snapshot.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      points: 1,
      choices: item.choices,
    }));
    return {
      attemptId: created.id,
      endsAt: created.endsAt,
      questions,
    };
  }
}

export async function submitStudentQuizAttempt(
  attemptId: number,
  body: { answers: Record<string, string>; auto_submitted?: boolean }
): Promise<AttemptSubmitResponse> {
  try {
    const payload = (await apiFetch(`/student/quizzes/attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify(body),
    })) as PlainObject;

    return {
      code: asNullableString(payload.code),
      message: asNullableString(payload.message),
      score: payload.score == null ? null : asNumber(payload.score, 0),
      total: payload.total == null ? null : asNumber(payload.total, 0),
      passed: typeof payload.passed === "boolean" ? payload.passed : null,
    };
  } catch (error) {
    if (!isQuizRouteUnavailable(error)) throw error;
    const attempts = readLocalAttempts();
    const index = attempts.findIndex((attempt) => attempt.id === attemptId);
    if (index < 0) {
      throw new Error("Attempt not found.");
    }

    const attempt = attempts[index];
    if (attempt.submittedAt) {
      throw new Error("Attempt already submitted.");
    }
    const timeoutReached = Date.now() >= new Date(attempt.endsAt).getTime();
    if (timeoutReached && !body.auto_submitted) {
      return {
        code: "ATTEMPT_TIMEOUT",
        message: "Attempt timed out before submission.",
        score: null,
        total: null,
        passed: null,
      };
    }

    const quiz = getLocalQuizByToken(attempt.token);
    if (!quiz) {
      throw new Error("Quiz is unavailable.");
    }
    const snapshotQuestions: QuizQuestion[] = attempt.snapshot.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      points: 1,
      choices: item.choices,
    }));
    const graded = gradeLocalAnswers(snapshotQuestions, body.answers, quiz.passRate, attempt.snapshot);

    const updatedAttempt: LocalQuizAttempt = {
      ...attempt,
      answers: body.answers,
      score: graded.score,
      total: graded.total,
      passed: graded.passed,
      correctCount: graded.correctCount,
      wrongCount: graded.wrongCount,
      autoSubmitted: Boolean(timeoutReached || body.auto_submitted),
      submittedAt: new Date().toISOString(),
    };
    const next = [...attempts];
    next[index] = updatedAttempt;
    writeLocalAttempts(next);

    return {
      code: timeoutReached || body.auto_submitted ? "ATTEMPT_TIMEOUT" : null,
      message: timeoutReached || body.auto_submitted ? "Time is up. Attempt auto-submitted." : "Attempt submitted.",
      score: graded.score,
      total: graded.total,
      passed: graded.passed,
      correctCount: graded.correctCount,
      wrongCount: graded.wrongCount,
    };
  }
}
