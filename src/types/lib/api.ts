export type RoleKey = 'STUDENT' | 'MENTOR' | 'HR' | 'ADMIN';

/**
 * Backend product codes. The Orbiter backend enum is `SCHOOL | CRM | JIRA |
 * ORBITER` (the platform-level `ORBITER` product replaced the old `CARIZMA`
 * entry after Carizma was split into its own standalone microservice).
 * `CARIZMA` is kept here only for the standalone `apps/carizma` shell, which
 * gates access via the JWT `cognito:groups` claim, not via Orbiter products.
 */
export type ProductCode = 'SCHOOL' | 'CRM' | 'JIRA' | 'ORBITER' | 'CARIZMA';

export type AccessLevel = 'ADMIN' | 'USER';

export interface Product {
  id: string;
  code: ProductCode;
  name: string;
  description?: string;
  baseUrl?: string;
  accessLevel?: AccessLevel;
  ruleKeys: RoleKey[];
}

export type ThemePreference = 'SYSTEM' | 'LIGHT' | 'DARK' | 'DARK_BLUE';

export type LanguagePreference = 'EN' | 'RU' | 'HY';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  theme: ThemePreference;
  language: LanguagePreference;
  /** Effective permission keys for the selected organization. Empty when no org selected. */
  permissions?: string[];
  /**
   * School system roles the user holds in the selected organization
   * (resolved server-side via X-Organization-Id). Drives role-gated features
   * the backend authorizes by role rather than permission key — the mentor
   * review inbox, student submissions, announcements, and the
   * student-vs-management dashboard split. Empty/absent when no org selected
   * or the user has no school roles there.
   */
  roles?: RoleKey[];
}

/** Summary of an organization role with its granted permissions. */
export interface PermissionRuleSummary {
  ruleId: string;
  ruleKey: RoleKey;
  name: string;
  permissions: string[];
}

export type OverrideType = 'GRANT' | 'REVOKE';

export interface OverrideEntry {
  permissionKey: string;
  overrideType: OverrideType;
}

export interface MemberPermissionOverrideResponse {
  memberId: string;
  overrides: OverrideEntry[];
}

/**
 * One entry of `GET /v1/school/permissions/catalog` — all assignable
 * permission keys grouped by the product they belong to (only products
 * currently active in the org are returned).
 */
export interface PermissionCatalogResponse {
  product: string;
  permissions: string[];
}

/**
 * Returned by `GET /v1/school/permissions/rules/{ruleId}` and the grant
 * endpoint `POST /v1/school/permissions/rules/{ruleId}` — the rule's full
 * permission key set after the change.
 */
export interface RulePermissionsResponse {
  ruleId: string;
  permissions: string[];
}

/** Body of `POST /v1/school/permissions/members/{memberId}`. */
export interface MemberPermissionOverrideRequest {
  /** Permission key to override (backend field name is `key`). */
  key: string;
  overrideType: OverrideType;
}

/** Body of `POST /v1/school/permissions/rules/{ruleId}`. */
export interface GrantPermissionRequest {
  key: string;
}

/**
 * Organization the current user belongs to. Matches the backend
 * `MyOrganizationResponse` from `GET /v1/organizations` — a slim membership
 * row. The per-org product list and role keys are no longer carried here:
 * product access and the user's roles/permissions for the *selected* org now
 * come from `GET /v1/auth/me` (sent with `X-Organization-Id`).
 */
export interface Organization {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn?: number;
  challengeName?: string;
  session?: string;
}

export interface NewPasswordRequest {
  session: string;
  email: string;
  newPassword: string;
}

/** Body of `POST /v1/auth/forgot-password`. Always responds 204. */
export interface ForgotPasswordRequest {
  email: string;
}

/** Body of `POST /v1/auth/confirm-reset`. */
export interface ConfirmResetRequest {
  email: string;
  /** One-time code Cognito emailed to the user. */
  code: string;
  /** ≥ 8 chars. */
  newPassword: string;
}

/** Body of `POST /v1/auth/change-password`. Responds 204. */
export interface ChangePasswordRequest {
  currentPassword: string;
  /** ≥ 8 chars; must satisfy Cognito policy. */
  newPassword: string;
}

export interface RefreshRequest {
  email: string;
  refreshToken: string;
}

export type RefreshResponse = LoginResponse;

/**
 * Response of `POST /v1/auth/access/carizma` — instant self-service product
 * access. `granted` is true when the CARIZMA Cognito group is on the account
 * after the call; `alreadyMember` when the caller's token already carried it.
 * The frontend must call `POST /v1/auth/refresh` afterwards so the new access
 * token actually includes the group.
 */
export interface ProductAccessResponse {
  granted: boolean;
  alreadyMember: boolean;
}

/** Response of `GET /v1/auth/oauth/google` — Hosted UI authorize URL to redirect to. */
export interface AuthorizationUrlResponse {
  url: string;
}

/**
 * Body of `POST /v1/auth/oauth/token`. `state` is the value echoed back in the
 * Cognito callback; it is verified against the HttpOnly state cookie (login-CSRF
 * defense), so the request MUST be sent with credentials. `redirectUri` is the
 * product's own callback (allowlisted server-side) — the same one passed to
 * `GET /v1/auth/oauth/google`.
 */
export interface OAuthTokenRequest {
  code: string;
  state: string;
  redirectUri: string;
}

/** Body of `POST /v1/auth/register` (self-service sign-up). */
export interface RegisterRequest {
  email: string;
  /** ≥ 8 chars; must satisfy Cognito policy. */
  password: string;
  firstName: string;
  lastName: string;
  /** Optional, E.164 (e.g. +37491234567). */
  phoneNumber?: string;
}

/** Body of `POST /v1/auth/confirm-registration`. Responds 204. */
export interface ConfirmRegistrationRequest {
  email: string;
  /** One-time code Cognito emailed to the user. */
  code: string;
}

/**
 * Body of the PUBLIC self-serve onboarding endpoint that creates a NEW
 * organization owned by the registrant and activates the SCHOOL product for it.
 *
 * ⚠️ BACKEND PENDING: there is no public endpoint for this yet. Org creation
 * (`POST /v1/admin/organizations`) and product activation
 * (`POST /v1/admin/products/organization/activations`) are SUPER_ADMIN-only and
 * MUST NOT be called from an anonymous page. The backend needs a public,
 * rate-limited/CAPTCHA-gated endpoint (assumed `POST /v1/auth/register-organization`)
 * that server-side creates the org from name+slug+timezone, makes the registrant
 * its owner (invite/email flow) and activates SCHOOL for THAT org — never an org
 * id supplied by the caller. Confirm the final path/shape with the backend.
 */
export interface RegisterOrganizationRequest {
  firstName: string;
  lastName: string;
  email: string;
  /** E.164, e.g. +37491234567. */
  phoneNumber?: string;
  /** Display name of the organization/school to create. */
  organizationName: string;
  /** URL slug (lowercase a–z, 0–9, hyphens) → school.orbiter.am/o/{slug}. */
  organizationSlug: string;
  /** IANA timezone (auto-detected client-side), e.g. "Asia/Yerevan". */
  timezone: string;
}

export type OrganizationsResponse = Organization[];

export type CourseLanguage = 'EN' | 'RU';

export interface CourseSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  language: CourseLanguage;
}

export interface CourseListItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  language: CourseLanguage;
  isPublic: boolean;
  discoverableInCatalog: boolean;
  allowDeadlineExtensions: boolean;
  totalModules: number;
  totalMaterials: number;
  totalStudents: number;
}

// ─── AI course generation (Gemini) ───────────────────────────────────────────
// See docs/school-ai-course-generation.md. Every AI call returns a fixed object
// schema; human text rides in `reply`, structured data in `brief`/`blocks`.

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiMaterialBrief {
  title: string;
  type: MaterialKind;
  estimatedMinutes?: number;
  description?: string;
}

export interface AiModuleBrief {
  title: string;
  description?: string;
  materials: AiMaterialBrief[];
}

export interface AiCourseBrief {
  name: string;
  /** Advisory; the backend re-derives a unique slug. */
  slug?: string;
  description?: string;
  language: CourseLanguage;
  modules: AiModuleBrief[];
}

export interface AiCourseChatResponse {
  reply: string;
  ready: boolean;
  /** Populated only when ready=true. */
  brief?: AiCourseBrief | null;
}

export interface AiMaterialChatResponse {
  reply: string;
  ready: boolean;
}

/** Shape of the created course returned by the AI generate endpoint (CourseSummaryResponse). */
export interface GeneratedCourseSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  language: CourseLanguage;
  isPublic: boolean;
  discoverableInCatalog: boolean;
  allowDeadlineExtensions: boolean;
}

export type MaterialKind =
  | 'READING'
  | 'LECTURE'
  | 'PRACTICE'
  | 'QUIZ'
  | 'REVIEW'
  | 'OPTIONAL';

export type MaterialReviewMode = 'NONE' | 'ASYNC' | 'LIVE';

export interface MaterialSubmissionConfig {
  allowsFiles?: boolean;
  requiresTextNote?: boolean;
  hint?: string;
  reviewMode: MaterialReviewMode;
  liveSlotDurationMinutes?: number;
  liveBookingWindowDays?: number;
}

export interface AvailableSlot {
  slotId: string;
  startAt: string;
  endAt: string;
  capacity: number;
  activeBookings: number;
  remainingSeats: number;
  /** Material the slot is locked to. `null`/absent = open-topic. When set, equals the requested materialId. */
  lockedMaterialId?: string | null;
}

export interface MentorAvailableSlots {
  mentorUserId: string;
  firstName: string;
  lastName: string;
  calendarId: string;
  slots: AvailableSlot[];
}

export type SubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export interface SubmissionFile {
  id: string;
  originalFilename: string;
  contentType?: string | null;
  sizeBytes: number;
  uploadedAt: string;
  /** Presigned URL for inline rendering (img/video). Short-lived — refetch the parent submission when stale. */
  previewUrl?: string;
  /** Presigned URL that forces download with the original filename. Short-lived. */
  downloadUrl?: string;
}

/** Calendar slot snapshot at the time of the call. */
export interface SubmissionBookingSlot {
  id: string;
  /** ISO-8601 UTC */
  startAt: string;
  /** ISO-8601 UTC */
  endAt: string;
  title?: string | null;
  description?: string | null;
  /** Free-form location string or meet link set by the mentor. */
  location?: string | null;
}

/** Mentor short profile embedded in booking. */
export interface SubmissionBookingMentor {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

/**
 * Mentor slot booking attached to a LIVE submission. Embedded in
 * `Submission` so the frontend can render meeting details without
 * an extra calendar API call.
 */
export interface SubmissionBooking {
  id: string;
  slot: SubmissionBookingSlot;
  mentor: SubmissionBookingMentor;
  /** Whether the student may still cancel this booking (inside the lead window). */
  canCancel?: boolean;
  /** Minimum hours before the slot start that cancellation is allowed. */
  cancellationLeadHours?: number;
}

/** Minimal user profile. */
export interface SubmissionUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

/** Classroom member (student or mentor) embedded in a submission. */
export interface SubmissionMember {
  id: string;
  user: SubmissionUser;
}

/** Material context bundled into the submission DTO (mentor inbox needs it). */
export interface SubmissionMaterialContext {
  id: string;
  title: string;
  module: { id: string; title: string };
  course: { id: string; name: string };
}

export interface Submission {
  id: string;
  /** Material being submitted, with module/course context. */
  material: SubmissionMaterialContext;
  /** Student who authored the submission. */
  member: SubmissionMember;
  status: SubmissionStatus;
  note?: string | null;
  /**
   * Mentor slot booking details for LIVE submissions. `null` for ASYNC
   * submissions or when the booking has been cancelled.
   */
  booking?: SubmissionBooking | null;
  /** ISO timestamp when the student finalised the submission. `null` while DRAFT. */
  submittedAt?: string | null;
  /** Mentor who has claimed this submission for review. `null` while no one picked it up. */
  assignee?: SubmissionMember | null;
  /** Mentor who closed the review (approve/request-changes). `null` while pending. */
  reviewer?: SubmissionMember | null;
  reviewedAt?: string | null;
  mentorFeedback?: string | null;
  files: SubmissionFile[];
  /**
   * How many times the mentor has returned this submission for changes.
   * Zero on a first-time submission. Counts the current row if it's
   * CHANGES_REQUESTED.
   */
  changesRequestedCount?: number;
}

/** Filter params for `GET /v1/school/submissions` (mentor review inbox). */
export interface MentorSubmissionsQueryArgs {
  /** Status filter. Default on the server: SUBMITTED,IN_REVIEW. */
  status?: SubmissionStatus[];
  /** UUID of a single classroom; `null`/omitted = all mentor's classrooms. */
  classroomId?: string;
  /** true = only submissions claimed by the caller (My queue). */
  onlyMine?: boolean;
  /** Free-text search across student name/email, material/course title. */
  search?: string;
}

/** Body for POST /submissions/{id}/approve — feedback optional. */
export interface ApproveSubmissionRequest {
  feedback?: string | null;
}

/** Body for POST /submissions/{id}/request-changes — feedback required. */
export interface RequestChangesSubmissionRequest {
  feedback: string;
}

export interface SubmitSubmissionRequest {
  note?: string | null;
  /** Required for LIVE materials — books the slot atomically with submit. */
  slotId?: string;
}

export interface AdminMaterial {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  sortOrder: number;
  description?: string;
  estimatedMinutes?: number;
  type: MaterialKind;
  isPublic: boolean;
  blocks?: MaterialBlock[];
  submissionConfig?: MaterialSubmissionConfig | null;
}

export interface AdminModule {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  sortOrder: number;
  /** @deprecated Backend `ModuleResponse` no longer returns module `type`; kept optional for mocks/back-compat. */
  type?: ModuleType;
  description?: string;
  durationMinutes?: number;
  /** @deprecated Dropped from backend `ModuleResponse`; not sent anymore. */
  requiresMentorApproval?: boolean;
  hardLock: boolean;
  isPublic: boolean;
  materials: AdminMaterial[];
}

export interface MentorSummary {
  memberId: string;
  firstName: string;
  lastName: string;
}

export type StudentLifecycle =
  | 'INVITED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'DROPPED'
  | 'GRADUATED';

export interface ClassroomStudentSummary {
  userId: string;
  memberId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  /** Set when the response is scoped to a classroom; null on invite endpoint. */
  lifecycle?: StudentLifecycle;
}

export type ClassroomStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type MemberRole = 'STUDENT' | 'MENTOR' | 'HR' | 'ADMIN';
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'DEACTIVATED';

export interface UpdateMemberStatusRequest {
  status: MemberStatus;
}

export interface MentorClassroomBrief {
  id: string;
  name: string;
  slug: string;
  status?: ClassroomStatus;
  startDate?: string;
  activeStudentsCount?: number;
}

export interface StudentClassroomEnrollment {
  id: string;
  name: string;
  slug: string;
  status?: ClassroomStatus;
  startDate?: string;
  lifecycle?: StudentLifecycle;
}

export interface MemberMentorBlock {
  since?: string;
  activeClassrooms?: MentorClassroomBrief[];
  activeStudentsCount?: number;
}

export interface MemberStudentBlock {
  since?: string;
  classrooms?: StudentClassroomEnrollment[];
}

export interface MemberInvitedBy {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface MemberDetailResponse {
  userId: string;
  memberId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  /** Org-membership status (per-organization). */
  memberStatus: MemberStatus;
  /** Global OrbiterUser status (auth-level). */
  userStatus: UserStatus;
  roles: MemberRole[];
  invitedAt?: string;
  invitedBy?: MemberInvitedBy;
  joinedAt?: string;
  mentor?: MemberMentorBlock | null;
  student?: MemberStudentBlock | null;
}

export type AssignRoleRequest = Record<string, never>;

export interface MemberResponse {
  userId: string;
  memberId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: MemberStatus;
  roles: MemberRole[];
}

export interface MembersFilter {
  roles?: MemberRole[];
  excludeRoles?: MemberRole[];
  /** Drop members who are ACTIVE STUDENTS of this classroom. */
  notInClassroom?: string;
  /** Drop members who are ACTIVE MENTORS of this classroom. */
  notMentorInClassroom?: string;
}

export interface MentorContact {
  userId: string;
  memberId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface InviteUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  product: ProductCode;
}

export interface OrbiterUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  theme: ThemePreference;
  language: LanguagePreference;
  /** Effective permission keys for the selected organization (X-Organization-Id). */
  permissions?: string[];
  /** School roles the user holds in the selected organization. See {@link User.roles}. */
  roles?: RoleKey[];
}

/** Activates an existing catalog product for a target organization. */
export interface ActivateProductRequest {
  organizationId: string;
  productCode: ProductCode;
}

/** Catalog product as returned by the products endpoints. */
export interface ProductResponse {
  id: string;
  code: ProductCode;
  name: string;
  description?: string;
  baseUrl?: string;
}

export interface AddClassroomMemberRequest {
  memberId: string;
  role: 'STUDENT' | 'MENTOR';
}

export type ModuleType = 'STANDARD' | 'PRACTICE' | 'OPTIONAL';
export type ModuleProgress = 'PASSED' | 'IN_PROGRESS' | 'CURRENT' | 'LOCKED';

export interface ModuleSessionStats {
  sessionCount: number;
  timeSpentMinutes: number;
  lastSessionAt?: string;
}

export type MaterialState =
  | 'LOCKED'
  | 'NOT_STARTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export type StudentMaterialProgressStatus = MaterialState;

export interface StudentMaterialProgressResponse {
  materialId: string;
  status: StudentMaterialProgressStatus;
  updatedAt: string;
}

export interface MaterialSummary {
  id: string;
  title: string;
  order: number;
  estimatedMinutes?: number;
  type: MaterialKind;
  state: MaterialState;
}

export type CalloutType =
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'tip'
  | 'note'
  | 'important'
  | 'question'
  | 'quote'
  | 'example'
  | 'neutral'
  | 'accent'
  | 'highlight';

export interface BaseBlock {
  id?: string;
  order?: number;
  type: string;
}

/**
 * Generic markdown block — covers paragraphs, headings (H1-H6), lists
 * (bullet/numbered/task), code blocks, tables, dividers, blockquotes, and
 * all inline formatting (bold/italic/strike/code/links). Replaces the old
 * `TEXT`, `LIST`, `CODE`, `DIVIDER`, `TABLE` block types after the backend
 * MD consolidation migration.
 *
 * `DrawerBlock` matches `type` case-insensitively on read, so either `'md'` or
 * `'MD'` renders (the old backend read-lowercase / write-uppercase split is gone
 * now that the backend stores blocks verbatim).
 */
export interface MdBlock extends BaseBlock {
  type: 'MD';
  markdown: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'IMAGE';
  url: string;
  caption?: string;
}

export interface CalloutBlock extends BaseBlock {
  type: 'CALLOUT';
  text: string;
  calloutType?: CalloutType;
  title?: string;
}

export interface QuizBlock extends BaseBlock {
  type: 'QUIZ';
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface MentorQuestionItem {
  topic: string;
  question: string;
  answer: string;
}

export interface MentorQuestionsBlock extends BaseBlock {
  type: 'MENTOR_QUESTIONS';
  items: MentorQuestionItem[];
}

export type ChecklistMarker = 'CHECK' | 'CROSS' | 'DASH';

export interface ChecklistItem {
  marker: ChecklistMarker;
  text: string;
}

export interface ChecklistBlock extends BaseBlock {
  type: 'CHECKLIST';
  title?: string;
  items: ChecklistItem[];
}

export type IconGridTone =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'DANGER'
  | 'BRAND'
  | 'NEUTRAL';

export interface IconGridItem {
  icon: string;
  label: string;
  sub?: string;
  tone: IconGridTone;
}

export interface IconGridBlock extends BaseBlock {
  type: 'ICON_GRID';
  title?: string;
  columns?: 2 | 3 | 4;
  items: IconGridItem[];
}

export type LinkCardKind = 'DOCS' | 'PAPER' | 'ARTICLE' | 'VIDEO' | 'BOOK';

export interface LinkCardItem {
  title: string;
  url: string;
  source?: string;
  kind: LinkCardKind;
}

export interface LinkCardsBlock extends BaseBlock {
  type: 'LINK_CARDS';
  title?: string;
  items: LinkCardItem[];
}

export type ButtonVariant = 'PRIMARY' | 'OUTLINE' | 'GHOST';

export interface ButtonRowItem {
  label: string;
  icon?: string;
  variant: ButtonVariant;
  url: string;
}

export interface ButtonRowBlock extends BaseBlock {
  type: 'BUTTON_ROW';
  items: ButtonRowItem[];
}

export type VideoProvider = 'YOUTUBE' | 'VIMEO' | 'FILE';

export interface VideoBlock extends BaseBlock {
  type: 'VIDEO';
  url: string;
  provider: VideoProvider;
  caption?: string;
  posterUrl?: string;
  durationSeconds?: number;
}

// ─── Diagram block ────────────────────────────────────────────────────────
//
// Custom Miro-lite block: user picks one of N templates (mapping /
// flowchart / pipeline / etc.), fills in node text + colors. Frontend
// renders SVG. Backend just stores the JSON payload — no per-template
// validation needed server-side (frontend keeps the shape sane).

/**
 * Diagram layout hints — applied once to position nodes; afterwards the
 * diagram is a free-form canvas where the user can drag anywhere.
 */
export type DiagramLayout =
  | 'custom'
  | 'tree'
  | 'forest'
  | 'grid'
  | 'circle'
  | 'pipeline';

export type DiagramShape =
  | 'box'
  | 'circle'
  | 'diamond'
  | 'chevron'
  | 'pill'
  | 'trapezoid'
  | 'hexagon'
  | 'heptagon'
  | 'parallelogram'
  | 'note'
  | 'cloud';

export type DiagramNodeSize = 'sm' | 'md' | 'lg';

export type DiagramEdgeStyle = 'solid' | 'dashed' | 'dotted';

export type DiagramEdgeArrow = 'end' | 'start' | 'both' | 'none';

export type DiagramColorKey =
  | 'blue'
  | 'teal'
  | 'green'
  | 'amber'
  | 'coral'
  | 'pink'
  | 'purple'
  | 'indigo'
  | 'slate'
  | 'red';

export interface DiagramNode {
  id: string;
  text: string;
  sub?: string;
  color: DiagramColorKey;
  shape?: DiagramShape;
  size?: DiagramNodeSize;
  /** Top-left position on the canvas, in pixels. */
  x: number;
  y: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  style?: DiagramEdgeStyle;
  arrow?: DiagramEdgeArrow;
}

/**
 * Group (area) — labelled rounded rectangle that wraps a set of nodes.
 * Bounds are auto-computed from the contained nodes' positions. `stacked`
 * renders shadow copies behind to indicate multiple instances of the
 * group (typical K8s "Node" replica pattern).
 */
export interface DiagramGroup {
  id: string;
  label: string;
  nodeIds: string[];
  color: DiagramColorKey;
  stacked?: boolean;
}

export interface DiagramBlock extends BaseBlock {
  type: 'DIAGRAM';
  /** Last applied auto-layout; informational. Render is always free-form. */
  layout?: DiagramLayout;
  title?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups?: DiagramGroup[];
}

/**
 * Material content blocks. The backend NO LONGER defines, validates, or
 * constrains block shape — `blocks` is now a generic JSON array stored verbatim
 * and the frontend fully owns it (read shape == write shape; symmetric
 * round-trip via `syncMaterialBlocks`). The structured members below are the
 * frontend's own documented kinds (rendered by `DrawerBlock`, which normalises
 * `type` case on read). The trailing `BaseBlock & Record<string, unknown>`
 * catch-all accepts ANY other block the editor authors — e.g. BlockNote-authored
 * blocks (paragraph, heading, codeBlock, callout, tabs, accordion, steps,
 * ribbon, openApi, imageGallery, iconGrid, buttonRow, …) — so new editor block
 * kinds need no change here. Pick ONE consistent `type` casing per block kind
 * and use it on both read and write.
 */
export type MaterialBlock =
  | MdBlock
  | ImageBlock
  | CalloutBlock
  | QuizBlock
  | MentorQuestionsBlock
  | ChecklistBlock
  | IconGridBlock
  | LinkCardsBlock
  | ButtonRowBlock
  | VideoBlock
  | DiagramBlock
  | (BaseBlock & Record<string, unknown>);

export interface MaterialDetail {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  description?: string;
  estimatedMinutes?: number;
  type: MaterialKind;
  state: MaterialState;
  blocks: MaterialBlock[];
  submissionConfig?: MaterialSubmissionConfig | null;
  /** Caller's latest committed submission for this material. Null when the student hasn't submitted yet. */
  latestSubmission?: Submission | null;
}

export interface ClassroomModule {
  id: string;
  title: string;
  order: number;
  /** @deprecated Backend `ClassroomModuleResponse` no longer returns module `type`; kept optional for mocks/back-compat. */
  type?: ModuleType;
  progress: ModuleProgress;
  deadline?: string;
  description?: string;
  durationMinutes?: number;
  /** @deprecated Dropped from backend `ClassroomModuleResponse`; not sent anymore. */
  requiresMentorApproval?: boolean;
  totalMaterials?: number;
  /** Frontend-only enrichment — not present in `ClassroomModuleResponse`. */
  sessionStats?: ModuleSessionStats;
}

/**
 * Spring-style pageable arg. Sort uses `field,direction` strings
 * (e.g. `'createdAt,desc'`); pass `[]` or omit to keep the server default.
 */
export interface Pageable {
  page: number;
  size: number;
  sort?: string[];
}

/** Paged response — `items` + classic page metadata. */
export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ClassroomListItem {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  startDate: string;
  endDate?: string;
  status: ClassroomStatus;
  capacity: number;
  enrolledStudents: number;
  courses: CourseSummary[];
  mentors: MentorSummary[];
}

export interface ClassroomSummary {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  startDate: string;
  endDate?: string;
  status: ClassroomStatus;
  capacity: number;
}

export interface CreateClassroomRequest {
  name: string;
  slug: string;
  startDate: string;
  endDate?: string;
  capacity?: number;
  status?: ClassroomStatus;
  courseIds?: string[];
  mentorMemberIds?: string[];
}

export interface UpdateClassroomRequest {
  name?: string;
  slug?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  status?: ClassroomStatus;
}

export type AnnouncementType =
  | 'INFO'
  | 'WARNING'
  | 'SUCCESS'
  | 'EVENT'
  | 'REMINDER';

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ClassroomAnnouncement {
  id: string;
  classroomId: string;
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  pinned: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type?: AnnouncementType;
  status?: AnnouncementStatus;
  pinned?: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  status?: AnnouncementStatus;
  pinned?: boolean;
  scheduledStart?: string;
  scheduledEnd?: string;
}

// ---- Integrations (Google Calendar) ----

export interface GoogleIntegrationStatus {
  connected: boolean;
  googleEmail: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
}

export interface GoogleConnectUrlRequest {
  returnTo: string;
}

export interface GoogleConnectUrlResponse {
  authorizationUrl: string;
}

// ---- Calendar module ----

export type CalendarVisibility = 'PRIVATE' | 'ORGANIZATION';
export type CalendarSlotStatus = 'ACTIVE' | 'CANCELLED';

export interface CalendarColor {
  id: string;
  code: string;
  name: string;
  hex: string;
  sortOrder: number;
}

export interface CalendarSummary {
  id: string;
  ownerId: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  visibility: CalendarVisibility;
  isDefault: boolean;
  color: CalendarColor;
  googleCalendarId: string | null;
  /**
   * Frontend-only marker. Set when this `CalendarSummary` was synthesized
   * from a `BookableCalendar` (mentor slots calendar). Drives different
   * editor modal + slot rendering rules.
   */
  bookable?: BookableCalendarMeta;
}

export interface BookableCalendarMeta {
  defaultCapacity: number;
  cancellationLeadHours: number;
}

export interface CreateCalendarRequest {
  name: string;
  description?: string;
  colorId: string;
  visibility: CalendarVisibility;
  organizationId?: string;
  isDefault?: boolean;
}

export type UpdateCalendarRequest = Partial<CreateCalendarRequest>;

export type GoogleSlotSyncStatus = 'SYNCED' | 'OUT_OF_SYNC' | 'LOCAL_ONLY';

export interface CalendarSlotSummary {
  id: string;
  calendarId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  status: CalendarSlotStatus;
  submissionId: string | null;
  googleEventId: string | null;
  googleSyncStatus?: GoogleSlotSyncStatus;
  googleSyncError?: string | null;
  /** Bookable slots only — max number of students that can book it. */
  capacity?: number;
  /** Bookable slots only — slot pinned to a single material. */
  lockedMaterialId?: string | null;
}

export interface SlotsRangeArgs {
  calendarId: string;
  from: string;
  to: string;
}

export interface CreateSlotRequest {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  isAllDay?: boolean;
  submissionId?: string;
  /** Bookable slots only. Defaults to the calendar's defaultCapacity. */
  capacity?: number;
}

export type UpdateSlotRequest = Partial<CreateSlotRequest>;

// ---- Bookable (mentor) calendars ----

export interface BookableCalendar {
  id: string;
  ownerId: string;
  color: CalendarColor;
  defaultCapacity: number;
  cancellationLeadHours: number;
}

/**
 * Discriminator for bookable calendar variants. The backend only supports
 * MENTOR_SLOTS today; future variants will share the endpoint via this field.
 */
export type BookableCalendarType = 'MENTOR_SLOTS';

export interface CreateBookableCalendarRequest {
  type: BookableCalendarType;
  colorId: string;
  defaultCapacity: number;
  cancellationLeadHours: number;
}

export interface UpdateBookableCalendarRequest {
  colorId?: string;
  defaultCapacity?: number;
  cancellationLeadHours?: number;
}

export type SlotBookingStatus = 'ACTIVE' | 'CANCELLED';

/** Minimal user profile (for roster display). */
export interface SlotBookingUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

/** Classroom shortcut (display only). */
export interface SlotBookingClassroom {
  id: string;
  name?: string | null;
  slug?: string | null;
}

/** Student profile for the roster view. */
export interface SlotBookingMember {
  id: string;
  user: SlotBookingUser;
  /** Shared classroom between the student and the slot owner. Null on legacy data. */
  classroom?: SlotBookingClassroom | null;
}

export interface SlotBookingModule {
  id: string;
  title?: string | null;
}

export interface SlotBookingCourse {
  id: string;
  name?: string | null;
}

/** Material context: which course/module/material is being reviewed. */
export interface SlotBookingMaterial {
  id: string;
  title?: string | null;
  module: SlotBookingModule;
  course: SlotBookingCourse;
}

export interface SlotBooking {
  id: string;
  slotId: string;
  status: SlotBookingStatus;
  createdAt: string;
  /** Student who booked the slot. */
  member: SlotBookingMember;
  /** Material the student wants reviewed. */
  material: SlotBookingMaterial;
}

export interface CreateSlotBookingRequest {
  materialId: string;
}

export interface LockSlotMaterialRequest {
  materialId: string;
}

// ---- Google Calendar import ----

export type GoogleCalendarAccessRole =
  | 'owner'
  | 'writer'
  | 'reader'
  | 'freeBusyReader';

export interface GoogleCalendarSummary {
  googleCalendarId: string;
  summary: string;
  description: string | null;
  backgroundColor: string | null;
  timeZone: string | null;
  primary: boolean;
  accessRole: GoogleCalendarAccessRole;
  alreadyImported: boolean;
}

export interface ImportGoogleCalendarRequest {
  /** Optional — backend picks the closest palette color when omitted. */
  colorId?: string;
}

export interface ImportEventsArgs {
  /** Local Orbiter calendar UUID (must have googleCalendarId set). */
  calendarId: string;
  from?: string;
  to?: string;
}

export interface ImportEventsResponse {
  imported: number;
  updated: number;
  cancelled: number;
  from: string;
  to: string;
  syncedAt: string;
}

// CRM entity/record types moved to @orbiter/crm-types (standalone CRM app/libs).

// ──────────────────────────────────────────────────────────────────────────
// Media (organization-scoped uploads)
// ──────────────────────────────────────────────────────────────────────────

/** Stored media file with a short-lived presigned download URL. */
export interface MediaResponse {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
  /** Presigned GET URL, short-lived — re-fetched on each list. */
  downloadUrl: string;
}

// Uploads go through `POST /v1/school/media` as multipart/form-data with a
// single `file` field. There is no client-side request body shape to model —
// the FormData is constructed at the call site.

// =====================================================================
// PROJECTS (Jira-like task tracker)
// =====================================================================

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';
export type ProjectPrivacy = 'ORG' | 'INVITE_ONLY';

export type ProjectGlyph =
  | 'square'
  | 'circle'
  | 'triangle'
  | 'hex'
  | 'diamond'
  | 'star';

export interface ProjectSummary {
  id: string;
  /** Short uppercase code, e.g. "LTC". Used in task ids and sidebar. */
  key: string;
  name: string;
  description?: string;
  glyph: ProjectGlyph;
  /** Hex color string, e.g. "#3BBCA7". */
  glyphColor: string;
  status: ProjectStatus;
  privacy: ProjectPrivacy;
  /** Member user ids — order = order to render in avatar stack. */
  memberIds: string[];
  /** Counters precomputed by backend (or stub) for the index card. */
  activeTaskCount: number;
  doneTaskCount: number;
  totalTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  key: string;
  name: string;
  description?: string;
  glyph: ProjectGlyph;
  glyphColor: string;
  privacy: ProjectPrivacy;
  /** Required when privacy === 'INVITE_ONLY'; ignored otherwise. */
  memberIds?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  glyph?: ProjectGlyph;
  glyphColor?: string;
  privacy?: ProjectPrivacy;
  status?: ProjectStatus;
  /** When present, replaces the whole member list. Effective only for INVITE_ONLY projects. */
  memberIds?: string[];
}

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskLabelColor =
  | 'teal'
  | 'blue'
  | 'violet'
  | 'pink'
  | 'amber'
  | 'red'
  | 'green'
  | 'slate';

export interface ProjectLabel {
  id: string;
  projectId: string;
  name: string;
  color: TaskLabelColor;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  /** Display key, e.g. "LTC-42". */
  key: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  reporterId: string | null;
  /** ISO date (YYYY-MM-DD) or null. */
  dueDate: string | null;
  /** Label ids referencing ProjectLabel. */
  labelIds: string[];
  /** Used to sort tasks inside a column (fractional indexing-friendly). */
  orderInColumn: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  labelIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  labelIds?: string[];
}

export interface MoveTaskRequest {
  status: TaskStatus;
  /** Target order inside the destination column. */
  orderInColumn: number;
}

export interface ProjectBoardResponse {
  project: ProjectSummary;
  tasks: ProjectTask[];
  labels: ProjectLabel[];
}

// =====================================================================
// CARIZMA (car marketplace)
// =====================================================================

export type DealRating = 'great' | 'good' | 'fair' | 'overpriced';
export type CarBody =
  | 'sedan'
  | 'suv'
  | 'electric'
  | 'sport'
  | 'luxury'
  | 'offroad'
  | 'vintage'
  | 'hatch'
  | 'coupe'
  | 'wagon'
  | 'pickup';
export type CarFuel = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type CarTransmission = 'Automatic' | 'Manual';
export type CarDrive = 'FWD' | 'RWD' | 'AWD';
export type CarCurrency = 'USD' | 'AMD' | 'RUB';
export type ListingStatus =
  | 'active'
  | 'pending'
  | 'needs_changes'
  | 'sold'
  | 'draft'
  | 'rejected';
export type ListingSort =
  | 'best_deals'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'nearest';
export type ListingView = 'grid' | 'list';

/**
 * Card-level view model used by Home/Browse/Details "similar" lists. Built
 * from the backend search summary (see `toCarListing` in shared-data-access).
 * Spec fields are plain strings (English ref labels / codes) because the
 * dictionary values now come from the backend ref_* tables, not TS unions;
 * fields the backend does not track yet (deal, power, engine) are optional.
 */
export interface CarListing {
  id: string;
  brand: string;
  model: string;
  trim?: string;
  year: number;
  title: string;
  /** Major units for display (the backend stores minor units). */
  price: number;
  currency: CarCurrency;
  oldPrice?: number;
  mileage: number;
  fuel: string;
  transmission: string;
  power?: number;
  engine?: string;
  drive: string;
  color?: string;
  interior?: string;
  /** ref_body_type code (e.g. "sedan", "crossover"). */
  body: string;
  city: string;
  distance?: number;
  deal?: DealRating;
  featured: boolean;
  reduced: boolean;
  isNew: boolean;
  verified: boolean;
  has360: boolean;
  /** Real photo URL — when present, rendered on top of the gradient backdrop. */
  image?: string;
  /** Decorative placeholder background tone — used as fallback when image is absent or loading. */
  placeholderTone?: string;
  /** Decorative placeholder caption — mock only, hidden once real image arrives. */
  placeholderHint?: string;
}

export interface OwnershipPeriod {
  period: string;
  owner: string;
  km: number;
  events: string[];
}

export interface ServiceRecord {
  date: string;
  km: number;
  what: string;
  shop: string;
}

export interface CarSeller {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  joinedYear: number;
  responseTimeHrs: number;
  city: string;
  initials: string;
}

export interface CarListingDetail extends CarListing {
  description: string[];
  /** Gallery photos — first entry mirrors `image`. */
  images?: string[];
  vin: string;
  curbWeightKg?: number;
  history: OwnershipPeriod[];
  service: ServiceRecord[];
  seller: CarSeller;
  /** Seller's contact number (E.164) — the listing's chosen phone, falling back to the account phone; null hides the call action. */
  contactPhone?: string | null;
  /** Id of the chosen contact phone (one of GET /me/phones); carried through edit/resubmit so it isn't reset. */
  contactPhoneId?: string | null;
  views: number;
  daysListed: number;
}

export interface MyCarSummary {
  id: string;
  title: string;
  year: number;
  price: number;
  currency: CarCurrency;
  status: ListingStatus;
  views: number;
  saves: number;
  image?: string;
  placeholderTone?: string;
  placeholderHint?: string;
  /** ISO timestamp — used as the "listed" date when present. */
  updatedAt?: string;
  /** Moderator note for `rejected` / `needs_changes` listings; otherwise undefined. */
  rejectionReason?: string | null;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: string;
  newCount: number;
  total: number;
}

// ─── Carizma backend (standalone microservice) ──────────────────────────────
//
// Real backend shapes. The vehicle catalog is normalized (make → model →
// generation → configuration → modification → complectation) and dictionary
// values (colors, body/fuel/transmission/drive types, interior materials)
// live in ref_* tables — requests send the ref `code`, responses carry the
// full reference item. NOTE: the backend serializes with non_null inclusion,
// so any nullable field may be absent from the JSON entirely.

/** Listing lifecycle on the server. No `READY_FOR_REVIEW`. */
export type CarizmaListingStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'NEEDS_CHANGES'
  | 'PUBLISHED'
  | 'REJECTED';

/** Per-photo AI analysis state. */
export type CarizmaPhotoAiStatus = 'PENDING' | 'OK' | 'FLAGGED' | 'FAILED';

/**
 * One entry of a ref_* dictionary (GET /v1/carizma/catalog/references).
 * `code` is the stable identifier sent back in submit/search requests;
 * `hex` is set for colors only.
 */
export interface CarizmaReferenceItem {
  id: string;
  code: string;
  nameEn: string;
  nameRu?: string | null;
  nameHy?: string | null;
  hex?: string | null;
  sortOrder?: number | null;
  /** For equipment options only: SAFETY / COMFORT / MULTIMEDIA / EXTERIOR / INTERIOR / OTHER. */
  category?: string | null;
}

/** A ref_city option (GET /v1/carizma/catalog/references → cities). */
export interface CarizmaCityResponse {
  id: string;
  code: string;
  nameEn: string;
  nameRu?: string | null;
  nameHy?: string | null;
  regionCode?: string | null;
  sortOrder?: number | null;
}

/** All dictionaries in one payload — fetched once to fill filter/form selects. */
export interface CarizmaReferencesResponse {
  vehicleTypes: CarizmaReferenceItem[];
  bodyTypes: CarizmaReferenceItem[];
  colors: CarizmaReferenceItem[];
  fuelTypes: CarizmaReferenceItem[];
  transmissionTypes: CarizmaReferenceItem[];
  driveTypes: CarizmaReferenceItem[];
  interiorMaterials: CarizmaReferenceItem[];
  regions?: CarizmaReferenceItem[];
  cities?: CarizmaCityResponse[];
  /** Equipment options dictionary (vehicle_option), as standard reference items (carry `category`). */
  options?: CarizmaReferenceItem[];
  /** Overall vehicle condition dictionary (codes map to CarizmaVehicleCondition). */
  conditions?: CarizmaReferenceItem[];
  /** Steering wheel side dictionary (codes: LEFT / RIGHT → CarizmaWheelSide). */
  wheelSides?: CarizmaReferenceItem[];
  /** Supported currencies dictionary (codes map to CarCurrency). */
  currencies?: CarizmaReferenceItem[];
}

/** Catalog make/brand (GET /v1/carizma/catalog/makes). */
export interface CarizmaMakeResponse {
  id: string;
  name: string;
  slug: string;
  nameCyrillic?: string | null;
  country?: string | null;
  logoUrl?: string | null;
  popular: boolean;
}

/**
 * Catalog model under a make (GET /v1/carizma/catalog/models?makeId=&year=).
 * Optional `year` narrows to models whose production range contains it
 * (a NULL bound on the server = open range).
 */
export interface CarizmaModelResponse {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  nameCyrillic?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
}

/**
 * Catalog generation under a model
 * (GET /v1/carizma/catalog/generations?modelId=&year=).
 */
export interface CarizmaGenerationResponse {
  id: string;
  modelId: string;
  name: string;
  slug: string;
  yearStart?: number | null;
  /** null = still produced (open range). */
  yearStop?: number | null;
  restyle: boolean;
}

/**
 * Payload of GET /v1/carizma/catalog/years?makeId=&modelId= — production
 * years, descending. With `modelId`: union of its generations' ranges
 * (fallback to the model's yearFrom..yearTo); make-only: min..max over its
 * models (open upper bound = current year).
 */
export interface CarizmaYearsResponse {
  years: number[];
}

/**
 * Catalog body configuration under a generation
 * (GET /v1/carizma/catalog/configurations?generationId=).
 */
export interface CarizmaConfigurationResponse {
  id: string;
  generationId: string;
  bodyType?: CarizmaReferenceItem | null;
  doorsCount?: number | null;
}

/**
 * Catalog modification (engine/drivetrain variant) under a configuration
 * (GET /v1/carizma/catalog/modifications?configurationId=). Selecting one
 * pins engine/power/fuel/transmission/drive on the listing, so the sell-form
 * "Modification / engine" select builds its label from these fields.
 */
export interface CarizmaModificationResponse {
  id: string;
  configurationId: string;
  name: string;
  slug: string;
  engineDisplacementCc?: number | null;
  powerHp?: number | null;
  powerKw?: number | null;
  torqueNm?: number | null;
  fuelType?: CarizmaReferenceItem | null;
  transmissionType?: CarizmaReferenceItem | null;
  gearsCount?: number | null;
  driveType?: CarizmaReferenceItem | null;
  cylinders?: number | null;
  acceleration0100?: number | null;
  topSpeedKmh?: number | null;
  fuelConsumptionMixed?: number | null;
  emissionClass?: string | null;
  wheelSide?: CarizmaWheelSide | null;
}

/**
 * Catalog complectation (trim/equipment package) under a modification
 * (GET /v1/carizma/catalog/complectations?modificationId=).
 */
export interface CarizmaComplectationResponse {
  id: string;
  modificationId: string;
  name: string;
  slug: string;
  priceFrom?: number | null;
  priceTo?: number | null;
  currency?: CarCurrency | null;
}

// ── Backend-driven filter schema (GET /v1/carizma/catalog/filter-schema) ─────
// The browse/search sidebar is rendered from this schema, so the set of filters,
// their labels (localised via the Accept-Language header) and their options can
// change without a frontend release. See `getFilterSchema` in shared-data-access.

/** The control kind the renderer draws for a filter. */
export type FilterType = 'select' | 'multiselect' | 'range' | 'search' | 'toggle';

/** One selectable option of a select/multiselect/toggle filter. */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * One filter in the schema. Which fields are populated depends on `type`:
 * select/multiselect/toggle carry `options`; range carries `min`/`max`/`step`
 * (+ optional `unit`, and `singleBound` when only one edge is adjustable).
 * `dependsOn` + `optionsLink` describe a dependent lookup (e.g. model←make).
 */
export interface FilterDef {
  key: string;
  type: FilterType;
  label: string;
  options?: FilterOption[];
  /** Range bounds (type === 'range'). */
  min?: number;
  max?: number;
  step?: number;
  /** Display unit for a range (e.g. "USD", "km"). */
  unit?: string;
  /** When set, the range exposes only this edge (the other stays at the bound). */
  singleBound?: 'min' | 'max';
  /** Keys of filters whose options depend on this one (e.g. make → ["model"]). */
  dependents?: string[];
  /** The filter key this one's options depend on (e.g. model dependsOn "make"). */
  dependsOn?: string;
  /** Name of the `links` entry used to fetch this filter's options. */
  optionsLink?: string;
}

/** One parameter of a dependent-options link. */
export interface LinkParam {
  name: string;
  /** Where the param goes (`query` today; `path` reserved). */
  in: 'query' | 'path';
  /** The filter key whose current value fills this param. */
  fromFilter: string;
  required?: boolean;
}

/**
 * A named dependent-options endpoint referenced by `FilterDef.optionsLink`.
 * `urlTemplate` uses `{paramName}` placeholders filled from the parent filters.
 */
export interface LinkDef {
  method: 'GET';
  urlTemplate: string;
  params?: LinkParam[];
  example?: { request: string };
}

/** Payload of GET /v1/carizma/catalog/filter-schema (localised by Accept-Language). */
export interface FilterSchema {
  /** Changes whenever the filter set changes — a cache-busting key. */
  version: string;
  /** The language the labels were rendered in (`hy` | `ru` | `en`). */
  lang: string;
  filters: FilterDef[];
  /** Dependent-options endpoints, keyed by the name used in `optionsLink`. */
  links?: Record<string, LinkDef>;
}

/** Supported UI/API language codes for the filter schema. */
export type CarizmaLang = 'hy' | 'ru' | 'en';

/** Arg of `getFilterSchema` — the active UI language. */
export type GetFilterSchemaArg = CarizmaLang;

/**
 * Minimal shape returned by a dependent-options endpoint (e.g. the resolved
 * `modelsByMake` link). Both catalog makes and models satisfy it, so the
 * renderer maps `id`→`value` and the localised name→`label` generically.
 */
export interface CarizmaCatalogOption {
  id: string;
  name: string;
  nameCyrillic?: string | null;
}

/** Arg of `getCatalogByUrl` — a pre-resolved relative catalog URL. */
export type GetCatalogByUrlArg = string;

/**
 * The catalog vehicle a listing is linked to. Lower levels may be null in
 * summaries; null entirely for PENDING_CATALOG listings (use fallbackMake/
 * fallbackModel on the listing instead).
 */
export interface CarizmaVehicleRef {
  makeId: string;
  make: string;
  modelId?: string | null;
  model?: string | null;
  generationId?: string | null;
  generation?: string | null;
  modificationId?: string | null;
  modification?: string | null;
  complectationId?: string | null;
  complectation?: string | null;
}

/** Returned by `POST /v1/carizma/listings`, `POST .../submit` and inside the public detail. */
export interface CarizmaListingResponse {
  id: string;
  status: CarizmaListingStatus;
  catalogStatus: 'LINKED' | 'PENDING_CATALOG';
  vehicle?: CarizmaVehicleRef | null;
  fallbackMake?: string | null;
  fallbackModel?: string | null;
  vin?: string | null;
  chassisNumber?: string | null;
  vinValidationStatus: 'UNVALIDATED' | 'VALID' | 'MISMATCH' | 'INVALID_FORMAT' | 'NO_VIN';
  year?: number | null;
  mileageKm?: number | null;
  vehicleType?: CarizmaReferenceItem | null;
  bodyType?: CarizmaReferenceItem | null;
  fuelType?: CarizmaReferenceItem | null;
  transmissionType?: CarizmaReferenceItem | null;
  driveType?: CarizmaReferenceItem | null;
  exteriorColor?: CarizmaReferenceItem | null;
  interiorColor?: CarizmaReferenceItem | null;
  interiorMaterial?: CarizmaReferenceItem | null;
  doorsCount?: number | null;
  seatsCount?: number | null;
  engineDisplacementCc?: number | null;
  powerHp?: number | null;
  batteryCapacityKwh?: number | null;
  condition?: CarizmaVehicleCondition | null;
  ownerCount?: number | null;
  accidentFree?: boolean | null;
  customsCleared?: boolean | null;
  wheelSide?: CarizmaWheelSide | null;
  /** Location city as a ref item (carries the ref_city `code`). */
  city?: CarizmaReferenceItem | null;
  locationCity?: string | null;
  description?: string | null;
  /** Minor units per ISO 4217 — USD/RUB cents, AMD whole драмы. */
  price?: number | null;
  currency?: CarCurrency | null;
  exchangePossible?: boolean | null;
  priceNegotiable?: boolean | null;
  /** Chosen contact phone id (one of GET /v1/carizma/me/phones); null → account number. */
  contactPhoneId?: string | null;
  /** Display phone: the chosen number, falling back to the owner's account phone. */
  contactPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  publishedAt?: string | null;
}

/** Compact row used by `GET /v1/carizma/listings/mine` and `GET /v1/carizma/listings/search`. */
export interface CarizmaListingSummaryResponse {
  id: string;
  status: CarizmaListingStatus;
  vehicle?: CarizmaVehicleRef | null;
  fallbackMake?: string | null;
  fallbackModel?: string | null;
  year?: number | null;
  mileageKm?: number | null;
  bodyType?: CarizmaReferenceItem | null;
  fuelType?: CarizmaReferenceItem | null;
  transmissionType?: CarizmaReferenceItem | null;
  driveType?: CarizmaReferenceItem | null;
  exteriorColor?: CarizmaReferenceItem | null;
  powerHp?: number | null;
  engineDisplacementCc?: number | null;
  locationCity?: string | null;
  primaryPhotoUrl?: string | null;
  price?: number | null;
  currency?: CarCurrency | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  /**
   * Latest moderation feedback: the reject reason for REJECTED listings, or
   * the requested-changes comment for NEEDS_CHANGES ones. (Historic JSON name.)
   */
  rejectionReason?: string | null;
}

export interface CarizmaListingsPageResponse {
  items: CarizmaListingSummaryResponse[];
  total: number;
}

/** Result of `POST /v1/carizma/listings/{id}/favorite` — the new saved state. */
export interface CarizmaFavoriteToggleResponse {
  saved: boolean;
}

/** PageResponse envelope of the public search endpoint. */
export interface CarizmaSearchPageResponse {
  items: CarizmaListingSummaryResponse[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** Server-side sort keys of GET /v1/carizma/listings/search. */
export type CarizmaServerSort =
  | 'NEWEST'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'MILEAGE_ASC'
  | 'YEAR_DESC';

/**
 * Query params of GET /v1/carizma/listings/search. Dictionary facets take
 * ref_* codes; `makeIds` are catalog make UUIDs; prices are minor units.
 */
export interface CarizmaListingSearchArgs {
  query?: string;
  /** Condition tab: 'new' (0 km) or 'used' (has mileage). Omit for any. */
  condition?: 'new' | 'used';
  makeIds?: string[];
  modelIds?: string[];
  bodyTypes?: string[];
  fuelTypes?: string[];
  transmission?: string;
  colors?: string[];
  priceFrom?: number;
  priceTo?: number;
  yearFrom?: number;
  yearTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  locationCity?: string;
  sort?: CarizmaServerSort;
  limit?: number;
  offset?: number;
}

/** One equipment option on a listing (GET .../listings/{id} → options). */
export interface CarizmaListingOptionResponse {
  code: string;
  name: string;
  nameRu?: string | null;
  nameHy?: string | null;
  /** SAFETY / COMFORT / MULTIMEDIA / EXTERIOR / INTERIOR / OTHER. */
  category?: string | null;
}

/**
 * Listing page payload (GET /v1/carizma/listings/{id} — PUBLISHED only — and the
 * SuperAdmin GET /v1/carizma/admin/listings/{id} — any status). `options` and
 * `priceHistory` are present on the wire; the public buyer view ignores them,
 * the admin moderation drawer renders them.
 */
export interface CarizmaListingDetailResponse {
  listing: CarizmaListingResponse;
  photos: CarizmaPhotoResponse[];
  options?: CarizmaListingOptionResponse[];
  priceHistory?: unknown[];
}

/** Single uploaded photo — returned by `POST .../photos`. */
export interface CarizmaPhotoResponse {
  id: string;
  cdnUrl: string;
  orderIndex: number;
  primary: boolean;
  uploadedAt: string;
}

/** Per-photo AI flag bundle. Any `true` blocks submission. */
export interface CarizmaPhotoFlags {
  adultContent: boolean;
  violence: boolean;
  lowQuality: boolean;
  notACar: boolean;
  collage: boolean;
  watermark: boolean;
  /** Photo id of the original near-duplicate, if any. */
  duplicateOf?: string | null;
}

export interface CarizmaPrivacyBlurApplied {
  plates?: boolean;
  faces?: boolean;
}

export interface CarizmaPhotoAnalysisResponse {
  id: string;
  cdnUrl: string;
  orderIndex: number;
  primary: boolean;
  aiStatus: CarizmaPhotoAiStatus;
  flags: CarizmaPhotoFlags;
  privacyBlurApplied?: CarizmaPrivacyBlurApplied | null;
  issues: string[];
}

export interface CarizmaVehicleEngine {
  displacement: string;
  cylinders: number;
  fuel: string;
  /** AI-estimated power in horsepower; null when undeterminable. */
  powerHp?: number | null;
}

/**
 * One candidate from the AI's flat ranked candidate list. `body`,
 * `engine.fuel`, `transmission`, `color` and `interiorColor` carry ref_*
 * codes (e.g. "sedan", "gasoline", "automatic", "black"). The catalog ids are
 * resolved server-side (exact/fuzzy match into the vehicle catalog) and are
 * null when no confident match exists; older cached analyses may omit them.
 */
export interface CarizmaVehicleCandidate {
  confidence: number;
  make: string;
  model: string;
  /** First production year of the recognised generation; null when undeterminable. */
  yearFrom?: number | null;
  /** Last production year of the recognised generation; null when still produced/undeterminable. */
  yearTo?: number | null;
  body: string;
  engine: CarizmaVehicleEngine;
  transmission: string;
  trim?: string | null;
  color: string;
  interiorColor?: string | null;
  /** ref_drive_type code (e.g. "fwd", "awd"); null when undeterminable. */
  driveType?: string | null;
  /** ref_vehicle_type code (e.g. "car", "suv"); null when undeterminable. */
  vehicleType?: string | null;
  /** ref_interior_material code (e.g. "leather", "fabric"); null when undeterminable. */
  interiorMaterial?: string | null;
  doorsCount?: number | null;
  seatsCount?: number | null;
  wheelSide?: CarizmaWheelSide | null;
  makeId?: string | null;
  modelId?: string | null;
  generationId?: string | null;
  modificationId?: string | null;
  /** Display name of the resolved generation (e.g. "IV (XV70)"). */
  generationName?: string | null;
}

export interface CarizmaAnalysisColor {
  primary: string;
  alternatives: string[];
}

export interface CarizmaAnalysisResponse {
  photos: CarizmaPhotoAnalysisResponse[];
  /** The single best AI-recognised vehicle, or null when nothing was matched. */
  vehicle: CarizmaVehicleCandidate | null;
  color: CarizmaAnalysisColor | null;
  estimatedMileageKm: number | null;
  damageDetected: boolean;
  /** AI-estimated overall condition; null when undeterminable (older caches omit it). */
  condition?: CarizmaVehicleCondition | null;
  /** Free-text damaged areas (e.g. "front bumper"); empty when no damage seen. */
  damagedAreas?: string[];
  readyForSubmission: boolean;
}

export type CarizmaVehicleCondition =
  | 'NEW'
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'NEEDS_REPAIR'
  | 'FOR_PARTS';

/** Steering wheel side: LEFT (LHD) or RIGHT (RHD — common for JDM imports). */
export type CarizmaWheelSide = 'LEFT' | 'RIGHT';

/**
 * Submits a draft for moderation. Vehicle identity, in priority order:
 *  1. `modificationId` (optionally `complectationId`) — full catalog link;
 *  2. `makeId`+`modelId` (+ optional `generationId`) — partial catalog link
 *     (LINKED; fallback fields cleared; generation auto-resolved from `year`
 *     when omitted). `makeId` without `modelId` → 422;
 *  3. free-text fallback (`fallbackMake`+`fallbackModel`) — moves the listing
 *     to PENDING_CATALOG for admin curation.
 * Dictionary fields take ref_* codes from GET /v1/carizma/catalog/references
 * (e.g. exteriorColor: "black").
 */
export interface CarizmaSubmitListingRequest {
  modificationId?: string | null;
  complectationId?: string | null;
  makeId?: string | null;
  modelId?: string | null;
  generationId?: string | null;
  fallbackMake?: string | null;
  fallbackModel?: string | null;
  /** 17-character VIN; omit unless complete. */
  vin?: string | null;
  chassisNumber?: string | null;
  year?: number | null;
  mileageKm?: number | null;
  vehicleType?: string | null;
  bodyType?: string | null;
  fuelType?: string | null;
  transmissionType?: string | null;
  driveType?: string | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  interiorMaterial?: string | null;
  doorsCount?: number | null;
  seatsCount?: number | null;
  engineDisplacementCc?: number | null;
  powerHp?: number | null;
  batteryCapacityKwh?: number | null;
  condition?: CarizmaVehicleCondition | null;
  ownerCount?: number | null;
  accidentFree?: boolean | null;
  customsCleared?: boolean | null;
  wheelSide?: CarizmaWheelSide | null;
  /** Equipment option codes (from GET references → options). */
  optionCodes?: string[] | null;
  /** ref_city code the backend binds (the real field name). */
  cityCode?: string | null;
  locationCity?: string | null;
  description?: string | null;
  /** Minor units — see `CarizmaListingResponse.price`. */
  price: number;
  currency: CarCurrency;
  exchangePossible?: boolean | null;
  priceNegotiable?: boolean | null;
  /** One of the caller's saved phones (GET /v1/carizma/me/phones); must be owned by the caller. */
  contactPhoneId?: string | null;
}

/** One saved contact phone (GET /v1/carizma/me/phones). */
export interface CarizmaUserPhoneResponse {
  id: string;
  /** E.164, e.g. +37491234567. */
  phoneNumber: string;
  primary: boolean;
  createdAt: string;
}

/** Body of POST /v1/carizma/me/phones. Duplicate number for the user → 409. */
export interface CarizmaAddPhoneRequest {
  /** E.164 (`+` followed by 6–15 digits). */
  phoneNumber: string;
  primary?: boolean;
}

export interface ListMyListingsArgs {
  status?: CarizmaListingStatus;
  limit?: number;
  offset?: number;
}
