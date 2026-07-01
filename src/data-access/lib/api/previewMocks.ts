import type {
  AdminModule,
  ClassroomListItem,
  ClassroomModule,
  CourseListItem,
  CourseSummary,
  MaterialDetail,
  MaterialSummary,
  MentorSummary,
  PageResponse,
  Submission,
  SubmissionMember,
} from '#types';

const PREVIEW_ORG_ID = 'preview-organization';

const mentors: Record<string, MentorSummary> = {
  anna: { memberId: 'preview-mentor-anna', firstName: 'Anna', lastName: 'Petrova' },
  david: { memberId: 'preview-mentor-david', firstName: 'David', lastName: 'Kim' },
  marco: { memberId: 'preview-mentor-marco', firstName: 'Marco', lastName: 'Rossi' },
};

const courses: Record<string, CourseSummary> = {
  frontend: {
    id: 'preview-course-frontend',
    name: 'React с нуля',
    slug: 'react-with-zero',
    description:
      'React с нуля: JSX, состояние, хуки, контекст, роутинг и работа с API — от первого компонента до полноценного проекта.',
    language: 'RU',
  },
  backend: {
    id: 'preview-course-backend',
    name: 'Backend Engineering',
    slug: 'backend-engineering',
    description: 'APIs, databases and distributed systems with Java and Spring Boot.',
    language: 'EN',
  },
  design: {
    id: 'preview-course-design',
    name: 'Product Design',
    slug: 'product-design',
    description: 'Interface design, prototyping and usability research for product teams.',
    language: 'EN',
  },
};

const classrooms: ClassroomListItem[] = [
  {
    id: 'preview-classroom-frontend-spring',
    organizationId: PREVIEW_ORG_ID,
    name: 'Frontend Cohort — Spring 2026',
    slug: 'frontend-spring-2026',
    startDate: '2026-03-02',
    endDate: '2026-08-28',
    status: 'ACTIVE',
    capacity: 30,
    enrolledStudents: 24,
    courses: [courses.frontend],
    mentors: [mentors.anna, mentors.david],
  },
  {
    id: 'preview-classroom-backend-spring',
    organizationId: PREVIEW_ORG_ID,
    name: 'Backend Cohort — Spring 2026',
    slug: 'backend-spring-2026',
    startDate: '2026-03-16',
    endDate: '2026-09-11',
    status: 'ACTIVE',
    capacity: 25,
    enrolledStudents: 19,
    courses: [courses.backend],
    mentors: [mentors.marco],
  },
  {
    id: 'preview-classroom-design-intensive',
    organizationId: PREVIEW_ORG_ID,
    name: 'Product Design Intensive',
    slug: 'product-design-intensive',
    startDate: '2026-06-15',
    status: 'PLANNED',
    capacity: 20,
    enrolledStudents: 8,
    courses: [courses.design],
    mentors: [mentors.anna],
  },
  {
    id: 'preview-classroom-fullstack-winter',
    organizationId: PREVIEW_ORG_ID,
    name: 'Fullstack Bootcamp — Winter 2025',
    slug: 'fullstack-winter-2025',
    startDate: '2025-11-03',
    endDate: '2026-02-27',
    status: 'COMPLETED',
    capacity: 28,
    enrolledStudents: 27,
    courses: [courses.frontend, courses.backend],
    mentors: [mentors.david, mentors.marco],
  },
];

const modules: ClassroomModule[] = [
  {
    id: 'preview-module-1',
    title: 'Introduction & Setup',
    order: 1,
    type: 'STANDARD',
    progress: 'PASSED',
    durationMinutes: 90,
    totalMaterials: 5,
  },
  {
    id: 'preview-module-2',
    title: 'Components & State',
    order: 2,
    type: 'STANDARD',
    progress: 'CURRENT',
    durationMinutes: 180,
    totalMaterials: 8,
  },
  {
    id: 'preview-module-3',
    title: 'Data & APIs',
    order: 3,
    type: 'STANDARD',
    progress: 'IN_PROGRESS',
    deadline: '2026-06-12',
    durationMinutes: 150,
    totalMaterials: 7,
  },
  {
    id: 'preview-module-4',
    title: 'Final Project',
    order: 4,
    type: 'PRACTICE',
    progress: 'LOCKED',
    durationMinutes: 240,
    totalMaterials: 3,
  },
  {
    id: 'preview-module-5',
    title: 'Testing & CI',
    order: 5,
    type: 'STANDARD',
    progress: 'IN_PROGRESS',
    deadline: '2026-05-20',
    durationMinutes: 120,
    totalMaterials: 6,
  },
];

// ── Mentor review inbox ─────────────────────────────────────────────────────
// A MUTABLE board so the public marketing demo can mount the REAL
// `MentorReviewInboxView` and actually claim / approve / return cards and watch
// them move between columns. Only ever read/written while `preview.active` is
// true (gated in baseQuery), so it never touches the live app.

/** The "logged-in mentor" identity for the demo. Re-used to seed the demo store
 *  (`setUser`) so claimed cards read as "in my review". */
export const PREVIEW_MENTOR = {
  id: 'preview-user-mentor',
  memberId: 'preview-member-mentor',
  firstName: 'Elena',
  lastName: 'Sokolova',
  email: 'elena.sokolova@orbiter.am',
} as const;

const MENTOR_MEMBER: SubmissionMember = {
  id: PREVIEW_MENTOR.memberId,
  user: {
    id: PREVIEW_MENTOR.id,
    firstName: PREVIEW_MENTOR.firstName,
    lastName: PREVIEW_MENTOR.lastName,
    email: PREVIEW_MENTOR.email,
  },
};

const OTHER_MENTOR_MEMBER: SubmissionMember = {
  id: 'preview-member-david',
  user: {
    id: 'preview-user-david',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@orbiter.am',
  },
};

const REVIEW_TS = '2026-05-28T16:00:00Z';

const FE_COURSE = { id: 'preview-course-frontend', name: 'React с нуля' };

function seedBoard(): Submission[] {
  return [
    {
      id: 'preview-submission-1',
      material: {
        id: 'preview-material-1',
        title: 'Build a Todo App',
        module: { id: 'preview-module-2', title: 'Components & State' },
        course: FE_COURSE,
      },
      member: {
        id: 'preview-student-maria',
        user: { id: 'preview-user-maria', firstName: 'Maria', lastName: 'Ivanova', email: 'maria@example.com' },
      },
      status: 'SUBMITTED',
      note: 'Please review my state-management approach — I used a reducer for the list.',
      files: [
        { id: 'preview-file-todo', originalFilename: 'todo-app.png', sizeBytes: 248_000, uploadedAt: '2026-05-27T10:14:00Z' },
      ],
      submittedAt: '2026-05-27T10:15:00Z',
    },
    {
      id: 'preview-submission-2',
      material: {
        id: 'preview-material-2',
        title: 'REST API client',
        module: { id: 'preview-module-3', title: 'Data & APIs' },
        course: FE_COURSE,
      },
      member: {
        id: 'preview-student-ivan',
        user: { id: 'preview-user-ivan', firstName: 'Ivan', lastName: 'Petrov', email: 'ivan@example.com' },
      },
      status: 'SUBMITTED',
      note: 'Booked a live walkthrough — see you then!',
      booking: {
        id: 'preview-booking-1',
        slot: {
          id: 'preview-slot-1',
          startAt: '2026-05-30T13:00:00Z',
          endAt: '2026-05-30T13:30:00Z',
          title: 'Live review — REST API client',
          location: 'https://meet.orbiter.am/elena-ivan',
        },
        mentor: { userId: PREVIEW_MENTOR.id, firstName: PREVIEW_MENTOR.firstName, lastName: PREVIEW_MENTOR.lastName },
      },
      files: [],
      submittedAt: '2026-05-28T09:05:00Z',
    },
    {
      id: 'preview-submission-3',
      material: {
        id: 'preview-material-3',
        title: 'Auth flow with tokens',
        module: { id: 'preview-module-3', title: 'Data & APIs' },
        course: FE_COURSE,
      },
      member: {
        id: 'preview-student-sophie',
        user: { id: 'preview-user-sophie', firstName: 'Sophie', lastName: 'Lambert', email: 'sophie@example.com' },
      },
      status: 'IN_REVIEW',
      note: 'Refresh-token rotation is in api/auth.ts.',
      assignee: MENTOR_MEMBER,
      files: [
        { id: 'preview-file-auth', originalFilename: 'auth-notes.pdf', sizeBytes: 132_000, uploadedAt: '2026-05-28T08:00:00Z' },
      ],
      submittedAt: '2026-05-28T07:45:00Z',
    },
    {
      id: 'preview-submission-4',
      material: {
        id: 'preview-material-4',
        title: 'Component composition',
        module: { id: 'preview-module-2', title: 'Components & State' },
        course: FE_COURSE,
      },
      member: {
        id: 'preview-student-diego',
        user: { id: 'preview-user-diego', firstName: 'Diego', lastName: 'García', email: 'diego@example.com' },
      },
      status: 'IN_REVIEW',
      assignee: OTHER_MENTOR_MEMBER,
      files: [],
      submittedAt: '2026-05-28T11:20:00Z',
    },
    {
      id: 'preview-submission-5',
      material: {
        id: 'preview-material-5',
        title: 'State management quiz',
        module: { id: 'preview-module-2', title: 'Components & State' },
        course: FE_COURSE,
      },
      member: {
        id: 'preview-student-noah',
        user: { id: 'preview-user-noah', firstName: 'Noah', lastName: 'Becker', email: 'noah@example.com' },
      },
      status: 'CHANGES_REQUESTED',
      reviewer: MENTOR_MEMBER,
      reviewedAt: '2026-05-27T15:00:00Z',
      mentorFeedback: 'Good start — please add error handling and resubmit.',
      changesRequestedCount: 1,
      files: [],
      submittedAt: '2026-05-27T12:00:00Z',
    },
    {
      id: 'preview-submission-6',
      material: {
        id: 'preview-material-6',
        title: 'Your first component',
        module: { id: 'preview-module-1', title: 'Introduction & Setup' },
        course: FE_COURSE,
      },
      member: {
        id: 'preview-student-yuki',
        user: { id: 'preview-user-yuki', firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki@example.com' },
      },
      status: 'APPROVED',
      reviewer: MENTOR_MEMBER,
      reviewedAt: '2026-05-26T18:30:00Z',
      mentorFeedback: 'Clean and well structured — nicely done!',
      files: [],
      submittedAt: '2026-05-26T16:00:00Z',
    },
  ];
}

let board: Submission[] = seedBoard();

/** Re-seed the inbox board — called when a demo surface (re)mounts so repeat
 *  visits start from a clean four-column state. */
export function resetPreviewBoard(): void {
  board = seedBoard();
}

function parseSubmissionId(url: string): string | null {
  const m = /\/submissions\/([^/]+)\//.exec(url);
  return m ? decodeURIComponent(m[1]) : null;
}

function feedbackOf(ctx: MockCtx): string | undefined {
  const body = ctx.data as { feedback?: string | null } | undefined;
  return body?.feedback ?? undefined;
}

/** Find the submission addressed by the request url, replace it immutably with
 *  the patched copy (fresh reference → the refetch re-renders), and return it. */
function mutateBoard(
  ctx: MockCtx,
  patch: (s: Submission) => Partial<Submission>,
): Submission | undefined {
  const id = parseSubmissionId(ctx.url ?? '');
  if (!id) return undefined;
  const idx = board.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  const updated: Submission = { ...board[idx], ...patch(board[idx]) };
  board[idx] = updated;
  return updated;
}

/** Honour the inbox query params so "My queue", search and status filters feel
 *  real in the demo. Returns a fresh array reference each call. */
function filterBoard(params: unknown): Submission[] {
  const p = (params ?? {}) as {
    status?: string;
    onlyMine?: string;
    search?: string;
  };
  let rows = [...board];
  if (p.status) {
    const set = new Set(p.status.split(','));
    rows = rows.filter((s) => set.has(s.status));
  }
  if (p.onlyMine === 'true') {
    rows = rows.filter(
      (s) =>
        s.assignee?.user.id === PREVIEW_MENTOR.id ||
        s.reviewer?.user.id === PREVIEW_MENTOR.id,
    );
  }
  if (p.search && p.search.trim()) {
    const q = p.search.trim().toLowerCase();
    rows = rows.filter((s) => {
      const u = s.member.user;
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      return (
        name.includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        s.material.title.toLowerCase().includes(q) ||
        s.material.course.name.toLowerCase().includes(q)
      );
    });
  }
  return rows;
}

const materials: MaterialSummary[] = [
  {
    id: 'preview-material-1',
    title: 'Installation & registration',
    order: 1,
    estimatedMinutes: 20,
    type: 'READING',
    state: 'COMPLETED',
  },
  {
    id: 'preview-material-2',
    title: 'Your first component',
    order: 2,
    estimatedMinutes: 35,
    type: 'PRACTICE',
    state: 'SUBMITTED',
  },
  {
    id: 'preview-material-3',
    title: 'State & props quiz',
    order: 3,
    estimatedMinutes: 15,
    type: 'QUIZ',
    state: 'NOT_STARTED',
  },
  {
    id: 'preview-material-4',
    title: 'Mentor review task',
    order: 4,
    estimatedMinutes: 45,
    type: 'REVIEW',
    state: 'LOCKED',
  },
];

const materialDetail: MaterialDetail = {
  id: 'preview-material-2',
  moduleId: 'preview-module-3',
  title: 'Your first component',
  order: 2,
  description: 'Build and render your first component, then submit it for review.',
  estimatedMinutes: 35,
  type: 'PRACTICE',
  state: 'SUBMITTED',
  blocks: [
    {
      type: 'MD',
      markdown:
        '## Set up the project\n\nCreate a new project in your IDE and install the dependencies before you start.',
    },
    { type: 'BUTTON_ROW', items: [{ label: 'Open the docs', variant: 'OUTLINE', url: '#' }] },
    {
      type: 'CALLOUT',
      calloutType: 'warning',
      text: 'Use the exact versions shown in the lesson.',
    },
    {
      type: 'CALLOUT',
      calloutType: 'info',
      text: 'After setup, open settings and double-check everything is correct.',
    },
    {
      type: 'MD',
      markdown:
        '### Your task\n\nBuild a small component, then attach a screenshot and submit it for review.',
    },
  ],
  submissionConfig: {
    reviewMode: 'ASYNC',
    allowsFiles: true,
    requiresTextNote: false,
    hint: 'Attach a screenshot of your running component.',
  },
  latestSubmission: {
    id: 'preview-submission-self',
    material: {
      id: 'preview-material-2',
      title: 'Your first component',
      module: { id: 'preview-module-3', title: 'Data & APIs' },
      course: { id: 'preview-course-frontend', name: 'Frontend Engineering' },
    },
    member: {
      id: 'preview-student-self',
      user: {
        id: 'preview-user-self',
        firstName: 'You',
        lastName: '',
        email: 'you@example.com',
      },
    },
    status: 'SUBMITTED',
    note: 'Attached my component screenshot and notes.',
    files: [
      {
        id: 'preview-file-1',
        originalFilename: 'component.png',
        sizeBytes: 245000,
        uploadedAt: '2026-05-28T09:00:00Z',
      },
      {
        id: 'preview-file-2',
        originalFilename: 'notes.pdf',
        sizeBytes: 132000,
        uploadedAt: '2026-05-28T09:01:00Z',
      },
    ],
    submittedAt: '2026-05-28T09:02:00Z',
  },
};

const adminCourses: CourseListItem[] = [
  {
    id: 'preview-course-frontend',
    name: 'Frontend Engineering',
    slug: 'frontend-engineering',
    description: 'React, TypeScript and modern UI engineering.',
    language: 'EN',
    isPublic: true,
    discoverableInCatalog: true,
    allowDeadlineExtensions: true,
    totalModules: 5,
    totalMaterials: 28,
    totalStudents: 42,
  },
  {
    id: 'preview-course-backend',
    name: 'Backend Engineering',
    slug: 'backend-engineering',
    description: 'APIs, databases and distributed systems.',
    language: 'EN',
    isPublic: true,
    discoverableInCatalog: false,
    allowDeadlineExtensions: false,
    totalModules: 6,
    totalMaterials: 31,
    totalStudents: 35,
  },
  {
    id: 'preview-course-design',
    name: 'Product Design',
    slug: 'product-design',
    description: 'Interface design, prototyping and research.',
    language: 'EN',
    isPublic: false,
    discoverableInCatalog: false,
    allowDeadlineExtensions: true,
    totalModules: 4,
    totalMaterials: 19,
    totalStudents: 18,
  },
];

const adminCourseModules: AdminModule[] = [
  {
    id: 'preview-amodule-1',
    courseId: 'preview-course-frontend',
    title: 'Introduction & Setup',
    slug: 'introduction-setup',
    sortOrder: 1,
    type: 'STANDARD',
    description: 'Tooling, environment and first steps.',
    durationMinutes: 90,
    requiresMentorApproval: false,
    hardLock: false,
    isPublic: true,
    materials: [
      {
        id: 'preview-amaterial-1',
        moduleId: 'preview-amodule-1',
        title: 'Installation & registration',
        slug: 'installation-registration',
        sortOrder: 1,
        type: 'READING',
        isPublic: true,
      },
    ],
  },
  {
    id: 'preview-amodule-2',
    courseId: 'preview-course-frontend',
    title: 'Components & State',
    slug: 'components-state',
    sortOrder: 2,
    type: 'STANDARD',
    description: 'Build components and manage state.',
    durationMinutes: 180,
    requiresMentorApproval: true,
    hardLock: false,
    isPublic: true,
    materials: [
      {
        id: 'preview-amaterial-2',
        moduleId: 'preview-amodule-2',
        title: 'Your first component',
        slug: 'your-first-component',
        sortOrder: 1,
        type: 'PRACTICE',
        isPublic: true,
      },
    ],
  },
];

/** Request context handed to a mock factory — lets the inbox mutations read the
 *  target id (from the url) and feedback (from the body). Query mocks ignore it. */
export interface MockCtx {
  url?: string;
  data?: unknown;
  params?: unknown;
}

const PREVIEW_MOCKS: Record<string, (ctx: MockCtx) => unknown> = {
  classrooms: (): PageResponse<ClassroomListItem> => ({
    items: classrooms,
    total: classrooms.length,
    page: 0,
    size: 20,
    totalPages: 1,
  }),
  classroomBySlug: (): ClassroomListItem => classrooms[0],
  classroomCourses: (): CourseSummary[] => [courses.frontend, courses.backend],
  courseModules: (): ClassroomModule[] => modules,
  moduleMaterials: (): MaterialSummary[] => materials,
  materialDetail: (): MaterialDetail => materialDetail,
  // "Start material" in the student demo: the consumer ignores the body (an
  // optimistic cache patch flips the state), so an empty object is enough to
  // keep `.unwrap()` happy without firing a real request.
  startMaterial: () => ({}),
  // Read honours the filter params (My queue / search / status) and returns a
  // fresh array reference so each refetch re-renders the board.
  mentorSubmissions: (ctx): Submission[] => filterBoard(ctx.params),
  // Claiming/releasing re-opens a review: also clear the closed-review fields
  // so a card dragged back from revision/approved isn't left with a stale
  // `reviewer` (the drawer gates all actions on `reviewer`, so a leftover one
  // would render the re-opened card actionless).
  claimSubmission: (ctx) =>
    mutateBoard(ctx, () => ({
      status: 'IN_REVIEW',
      assignee: MENTOR_MEMBER,
      reviewer: null,
      reviewedAt: null,
    })),
  releaseSubmission: (ctx) =>
    mutateBoard(ctx, () => ({
      status: 'SUBMITTED',
      assignee: null,
      reviewer: null,
      reviewedAt: null,
    })),
  approveSubmission: (ctx) =>
    mutateBoard(ctx, (s) => ({
      status: 'APPROVED',
      reviewer: MENTOR_MEMBER,
      reviewedAt: REVIEW_TS,
      mentorFeedback: feedbackOf(ctx) ?? s.mentorFeedback ?? null,
    })),
  requestSubmissionChanges: (ctx) =>
    mutateBoard(ctx, (s) => ({
      status: 'CHANGES_REQUESTED',
      reviewer: MENTOR_MEMBER,
      reviewedAt: REVIEW_TS,
      mentorFeedback: feedbackOf(ctx) ?? '',
      changesRequestedCount: (s.changesRequestedCount ?? 0) + 1,
    })),
  adminCourses: (): CourseListItem[] => adminCourses,
  adminCourseModules: (): AdminModule[] => adminCourseModules,
};

export function getPreviewMock(endpoint: string, ctx: MockCtx = {}): unknown | undefined {
  const factory = PREVIEW_MOCKS[endpoint];
  return factory ? factory(ctx) : undefined;
}

export function isPreviewMocked(endpoint: string): boolean {
  return endpoint in PREVIEW_MOCKS;
}
