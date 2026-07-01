import type {
  AddClassroomMemberRequest,
  AdminMaterial,
  AdminModule,
  AiChatMessage,
  AiCourseBrief,
  AiCourseChatResponse,
  AiMaterialChatResponse,
  GeneratedCourseSummary,
  AnnouncementStatus,
  AnnouncementType,
  ClassroomAnnouncement,
  ClassroomListItem,
  ClassroomModule,
  PageResponse,
  ClassroomStudentSummary,
  ClassroomSummary,
  CourseLanguage,
  CourseListItem,
  CourseSummary,
  CreateAnnouncementRequest,
  CreateClassroomRequest,
  ActivateProductRequest,
  InviteUserRequest,
  ProductResponse,
  UpdateAnnouncementRequest,
  UpdateClassroomRequest,
  MaterialBlock,
  MemberDetailResponse,
  MemberResponse,
  MemberRole,
  MembersFilter,
  MentorContact,
  MaterialDetail,
  MaterialKind,
  MaterialSubmissionConfig,
  MaterialSummary,
  MentorAvailableSlots,
  ApproveSubmissionRequest,
  MentorSubmissionsQueryArgs,
  RequestChangesSubmissionRequest,
  Submission,
  SubmissionFile,
  SubmitSubmissionRequest,
  MemberPermissionOverrideResponse,
  OrbiterUserResponse,
  OverrideType,
  PermissionCatalogResponse,
  PermissionRuleSummary,
  ProductCode,
  RulePermissionsResponse,
  StudentMaterialProgressResponse,
  UpdateMemberStatusRequest,
} from '#types';
import { api } from './api';
import { v } from './version';

export interface ListClassroomsArgs {
  /** Spring-style page index (0-based). Default 0. */
  page?: number;
  /** Page size. Default 20. */
  size?: number;
  /** Sort directives, e.g. `'createdAt,desc'`. */
  sort?: string[];
}

export interface ClassroomCoursesArgs {
  slug: string;
}

export interface CourseModulesArgs {
  classroomSlug: string;
  courseSlug: string;
}

export interface ModuleMaterialsArgs {
  classroomId: string;
  courseId: string;
  moduleId: string;
}

export interface MaterialDetailArgs {
  classroomId: string;
  courseId: string;
  moduleId: string;
  materialId: string;
}

export const schoolApi = api.injectEndpoints({
  endpoints: (build) => ({
    classrooms: build.query<
      PageResponse<ClassroomListItem>,
      ListClassroomsArgs
    >({
      query: ({ page = 0, size = 20, sort } = {}) => ({
        url: v('/school/classrooms'),
        params: { page, size, ...(sort && sort.length ? { sort } : {}) },
      }),
      providesTags: ['Org'],
    }),
    classroomBySlug: build.query<
      ClassroomListItem,
      { slug: string }
    >({
      query: ({ slug }) => ({
        url: v(`/school/classrooms/${encodeURIComponent(slug)}`),
      }),
      providesTags: ['Org'],
    }),
    createClassroom: build.mutation<ClassroomSummary, CreateClassroomRequest>({
      query: (body) => ({
        url: v('/school/classrooms'),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Org'],
    }),
    updateClassroom: build.mutation<
      void,
      { classroomId: string } & UpdateClassroomRequest
    >({
      query: ({ classroomId, ...body }) => ({
        url: v(`/school/classrooms/${encodeURIComponent(classroomId)}`),
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['Org'],
    }),
    deleteClassroom: build.mutation<void, { classroomId: string }>({
      query: ({ classroomId }) => ({
        url: v(`/school/classrooms/${encodeURIComponent(classroomId)}`),
        method: 'DELETE',
      }),
      invalidatesTags: ['Org'],
    }),
    classroomStudents: build.query<
      ClassroomStudentSummary[],
      { classroomId: string }
    >({
      query: ({ classroomId }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(classroomId)}/students`,
        ),
      }),
      providesTags: ['Org'],
    }),
    classroomMentors: build.query<
      MentorContact[],
      { classroomId: string }
    >({
      query: ({ classroomId }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(classroomId)}/mentors`,
        ),
      }),
      providesTags: ['Org'],
    }),
    attachCourse: build.mutation<
      void,
      { classroomId: string; courseId: string }
    >({
      query: ({ classroomId, courseId }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(classroomId)}/courses/${encodeURIComponent(courseId)}`,
        ),
        method: 'POST',
      }),
      invalidatesTags: ['Org'],
    }),
    detachCourse: build.mutation<
      void,
      { classroomId: string; courseId: string }
    >({
      query: ({ classroomId, courseId }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(classroomId)}/courses/${encodeURIComponent(courseId)}`,
        ),
        method: 'DELETE',
      }),
      invalidatesTags: ['Org'],
    }),
    members: build.query<MemberResponse[], MembersFilter>({
      query: ({ roles, excludeRoles, notInClassroom, notMentorInClassroom }) => ({
        url: v('/school/members'),
        params: {
          ...(roles?.length ? { roles: roles.join(',') } : {}),
          ...(excludeRoles?.length
            ? { excludeRoles: excludeRoles.join(',') }
            : {}),
          ...(notInClassroom ? { notInClassroom } : {}),
          ...(notMentorInClassroom ? { notMentorInClassroom } : {}),
        },
      }),
      providesTags: ['Org'],
    }),
    memberDetail: build.query<MemberDetailResponse, { memberId: string }>({
      query: ({ memberId }) => ({
        url: v(`/school/members/${encodeURIComponent(memberId)}`),
      }),
      providesTags: ['Org'],
    }),
    addMemberRole: build.mutation<
      void,
      { memberId: string; role: MemberRole }
    >({
      query: ({ memberId, role }) => ({
        url: v(
          `/school/members/${encodeURIComponent(memberId)}/roles/${encodeURIComponent(role)}`,
        ),
        method: 'POST',
        data: {},
      }),
      invalidatesTags: ['Org'],
    }),
    removeMemberRole: build.mutation<
      void,
      { memberId: string; role: MemberRole }
    >({
      query: ({ memberId, role }) => ({
        url: v(
          `/school/members/${encodeURIComponent(memberId)}/roles/${encodeURIComponent(role)}`,
        ),
        method: 'DELETE',
      }),
      invalidatesTags: ['Org'],
    }),
    updateMemberStatus: build.mutation<
      void,
      { memberId: string; body: UpdateMemberStatusRequest }
    >({
      query: ({ memberId, body }) => ({
        url: v(`/school/members/${encodeURIComponent(memberId)}/status`),
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['Org'],
    }),
    inviteUser: build.mutation<OrbiterUserResponse, InviteUserRequest>({
      query: (body) => ({
        url: v('/users/invite'),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Org'],
    }),
    // Activates a catalog product (e.g. SCHOOL) for an organization. Backend
    // gate: SUPER_ADMIN. Returns 409 if the product is already activated.
    activateProduct: build.mutation<ProductResponse, ActivateProductRequest>({
      query: (body) => ({
        url: v('/admin/products/organization/activations'),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Org'],
    }),
    addClassroomMember: build.mutation<
      void,
      { classroomId: string; body: AddClassroomMemberRequest }
    >({
      query: ({ classroomId, body }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(classroomId)}/members`,
        ),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Org'],
    }),
    removeClassroomMember: build.mutation<
      void,
      { classroomId: string; memberId: string }
    >({
      query: ({ classroomId, memberId }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(classroomId)}/members/${encodeURIComponent(memberId)}`,
        ),
        method: 'DELETE',
      }),
      async onQueryStarted(
        { classroomId, memberId },
        { dispatch, queryFulfilled },
      ) {
        const patches = [
          dispatch(
            schoolApi.util.updateQueryData(
              'classroomStudents',
              { classroomId },
              (draft) => {
                const idx = draft.findIndex((s) => s.memberId === memberId);
                if (idx !== -1) draft.splice(idx, 1);
              },
            ),
          ),
          dispatch(
            schoolApi.util.updateQueryData(
              'classroomMentors',
              { classroomId },
              (draft) => {
                const idx = draft.findIndex((m) => m.memberId === memberId);
                if (idx !== -1) draft.splice(idx, 1);
              },
            ),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: ['Org'],
    }),
    classroomCourses: build.query<CourseSummary[], ClassroomCoursesArgs>({
      query: ({ slug }) => ({
        url: v(`/school/students/me/classrooms/${encodeURIComponent(slug)}/courses`),
      }),
      providesTags: ['Org'],
    }),
    courseModules: build.query<ClassroomModule[], CourseModulesArgs>({
      query: ({ classroomSlug, courseSlug }) => ({
        url: v(
          `/school/students/me/classrooms/${encodeURIComponent(
            classroomSlug,
          )}/courses/${encodeURIComponent(courseSlug)}/modules`,
        ),
      }),
      providesTags: ['Org'],
    }),
    moduleMaterials: build.query<MaterialSummary[], ModuleMaterialsArgs>({
      query: ({ classroomId, courseId, moduleId }) => ({
        url: v(
          `/school/students/me/classrooms/${encodeURIComponent(
            classroomId,
          )}/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(
            moduleId,
          )}/materials`,
        ),
      }),
      providesTags: ['Org'],
    }),
    materialDetail: build.query<MaterialDetail, MaterialDetailArgs>({
      query: ({ classroomId, courseId, moduleId, materialId }) => ({
        url: v(
          `/school/students/me/classrooms/${encodeURIComponent(
            classroomId,
          )}/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(
            moduleId,
          )}/materials/${encodeURIComponent(materialId)}`,
        ),
      }),
      providesTags: ['Org'],
    }),
    availableMentorSlots: build.query<MentorAvailableSlots[], MaterialDetailArgs>({
      query: ({ classroomId, courseId, moduleId, materialId }) => ({
        url: v(
          `/school/students/me/classrooms/${encodeURIComponent(
            classroomId,
          )}/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(
            moduleId,
          )}/materials/${encodeURIComponent(materialId)}/available-slots`,
        ),
      }),
      providesTags: (_r, _e, { materialId }) => [
        { type: 'Booking', id: `MATERIAL_${materialId}` },
      ],
    }),
    openSubmissionDraft: build.mutation<Submission, MaterialDetailArgs>({
      query: ({ classroomId, courseId, moduleId, materialId }) => ({
        url: v(
          `/school/students/me/classrooms/${encodeURIComponent(
            classroomId,
          )}/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(
            moduleId,
          )}/materials/${encodeURIComponent(materialId)}/submission/draft`,
        ),
        method: 'POST',
      }),
      // Material detail now carries `latestSubmission` — invalidate so the
      // page flips from "Start submission" CTA to the DRAFT form on success.
      invalidatesTags: ['Org'],
    }),
    attachSubmissionFile: build.mutation<
      SubmissionFile,
      { submissionId: string; file: File }
    >({
      query: ({ submissionId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: v(
            `/school/students/me/submissions/${encodeURIComponent(
              submissionId,
            )}/files`,
          ),
          method: 'POST',
          data: formData,
        };
      },
    }),
    detachSubmissionFile: build.mutation<
      void,
      { submissionId: string; fileId: string }
    >({
      query: ({ submissionId, fileId }) => ({
        url: v(
          `/school/students/me/submissions/${encodeURIComponent(
            submissionId,
          )}/files/${encodeURIComponent(fileId)}`,
        ),
        method: 'DELETE',
      }),
    }),
    submitSubmission: build.mutation<
      Submission,
      { submissionId: string; body: SubmitSubmissionRequest }
    >({
      query: ({ submissionId, body }) => ({
        url: v(
          `/school/students/me/submissions/${encodeURIComponent(
            submissionId,
          )}/submit`,
        ),
        method: 'POST',
        data: body,
      }),
      // Material progress flips to SUBMITTED and `latestSubmission` is set —
      // refetch material detail (and surrounding lists) via the broad 'Org' tag.
      invalidatesTags: ['Org'],
    }),
    reopenSubmission: build.mutation<Submission, { submissionId: string }>({
      query: ({ submissionId }) => ({
        url: v(
          `/school/students/me/submissions/${encodeURIComponent(submissionId)}`,
        ),
        method: 'PATCH',
        data: { status: 'DRAFT' },
      }),
      invalidatesTags: ['Org'],
    }),

    // ---- Mentor review inbox ----
    mentorSubmissions: build.query<Submission[], MentorSubmissionsQueryArgs>({
      query: (args) => {
        const params: Record<string, string> = {};
        if (args.status && args.status.length > 0) {
          params['status'] = args.status.join(',');
        }
        if (args.classroomId) params['classroomId'] = args.classroomId;
        if (args.onlyMine) params['onlyMine'] = 'true';
        if (args.search && args.search.trim().length > 0) {
          params['search'] = args.search.trim();
        }
        return {
          url: v('/school/submissions'),
          method: 'GET',
          params,
        };
      },
      providesTags: ['MentorInbox'],
    }),
    claimSubmission: build.mutation<Submission, { submissionId: string }>({
      query: ({ submissionId }) => ({
        url: v(
          `/school/submissions/${encodeURIComponent(submissionId)}/claim`,
        ),
        method: 'POST',
      }),
      invalidatesTags: ['MentorInbox'],
    }),
    releaseSubmission: build.mutation<Submission, { submissionId: string }>({
      query: ({ submissionId }) => ({
        url: v(
          `/school/submissions/${encodeURIComponent(submissionId)}/release`,
        ),
        method: 'POST',
      }),
      invalidatesTags: ['MentorInbox'],
    }),
    approveSubmission: build.mutation<
      Submission,
      { submissionId: string; body?: ApproveSubmissionRequest }
    >({
      query: ({ submissionId, body }) => ({
        url: v(
          `/school/submissions/${encodeURIComponent(submissionId)}/approve`,
        ),
        method: 'POST',
        data: body ?? {},
      }),
      // Closing a review also flips the student's material progress.
      invalidatesTags: ['MentorInbox', 'Org'],
    }),
    requestSubmissionChanges: build.mutation<
      Submission,
      { submissionId: string; body: RequestChangesSubmissionRequest }
    >({
      query: ({ submissionId, body }) => ({
        url: v(
          `/school/submissions/${encodeURIComponent(submissionId)}/request-changes`,
        ),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['MentorInbox', 'Org'],
    }),
    startMaterial: build.mutation<
      StudentMaterialProgressResponse,
      MaterialDetailArgs
    >({
      query: ({ classroomId, courseId, moduleId, materialId }) => ({
        url: v(
          `/school/students/me/classrooms/${encodeURIComponent(
            classroomId,
          )}/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(
            moduleId,
          )}/materials/${encodeURIComponent(materialId)}/start`,
        ),
        method: 'POST',
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { classroomId, courseId, moduleId, materialId } = args;
        const patches = [
          dispatch(
            schoolApi.util.updateQueryData(
              'moduleMaterials',
              { classroomId, courseId, moduleId },
              (draft) => {
                const m = draft.find((x) => x.id === materialId);
                if (m && m.state === 'NOT_STARTED') {
                  m.state = 'ACTIVE';
                }
              },
            ),
          ),
          dispatch(
            schoolApi.util.updateQueryData(
              'materialDetail',
              { classroomId, courseId, moduleId, materialId },
              (draft) => {
                if (draft.state === 'NOT_STARTED') {
                  draft.state = 'ACTIVE';
                }
              },
            ),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: ['Org'],
    }),
    completeMaterial: build.mutation<
      StudentMaterialProgressResponse,
      MaterialDetailArgs
    >({
      query: ({ classroomId, courseId, moduleId, materialId }) => ({
        url: v(
          `/school/students/me/classrooms/${encodeURIComponent(
            classroomId,
          )}/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(
            moduleId,
          )}/materials/${encodeURIComponent(materialId)}/complete`,
        ),
        method: 'POST',
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { classroomId, courseId, moduleId, materialId } = args;
        const patches = [
          dispatch(
            schoolApi.util.updateQueryData(
              'moduleMaterials',
              { classroomId, courseId, moduleId },
              (draft) => {
                const sorted = [...draft].sort((a, b) => a.order - b.order);
                const idx = sorted.findIndex((x) => x.id === materialId);
                if (idx === -1) return;
                const target = draft.find((x) => x.id === sorted[idx].id);
                if (target) target.state = 'COMPLETED';
                const nextSummary = sorted[idx + 1];
                if (nextSummary) {
                  const next = draft.find((x) => x.id === nextSummary.id);
                  if (next && next.state === 'LOCKED') {
                    next.state = 'NOT_STARTED';
                  }
                }
              },
            ),
          ),
          dispatch(
            schoolApi.util.updateQueryData(
              'materialDetail',
              { classroomId, courseId, moduleId, materialId },
              (draft) => {
                draft.state = 'COMPLETED';
              },
            ),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: ['Org'],
    }),
    classroomAnnouncements: build.query<
      ClassroomAnnouncement[],
      {
        classroomId: string;
        status?: AnnouncementStatus[];
        type?: AnnouncementType[];
      }
    >({
      query: ({ classroomId, status, type }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(classroomId)}/announcements`,
        ),
        params: {
          ...(status?.length ? { status: status.join(',') } : {}),
          ...(type?.length ? { type: type.join(',') } : {}),
        },
      }),
      providesTags: ['Org'],
    }),
    classroomAnnouncement: build.query<
      ClassroomAnnouncement,
      { classroomId: string; announcementId: string }
    >({
      query: ({ classroomId, announcementId }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(
            classroomId,
          )}/announcements/${encodeURIComponent(announcementId)}`,
        ),
      }),
      providesTags: ['Org'],
    }),
    createAnnouncement: build.mutation<
      ClassroomAnnouncement,
      { classroomId: string; body: CreateAnnouncementRequest }
    >({
      query: ({ classroomId, body }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(classroomId)}/announcements`,
        ),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Org'],
    }),
    updateAnnouncement: build.mutation<
      ClassroomAnnouncement,
      {
        classroomId: string;
        announcementId: string;
        body: UpdateAnnouncementRequest;
      }
    >({
      query: ({ classroomId, announcementId, body }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(
            classroomId,
          )}/announcements/${encodeURIComponent(announcementId)}`,
        ),
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['Org'],
    }),
    deleteAnnouncement: build.mutation<
      void,
      { classroomId: string; announcementId: string }
    >({
      query: ({ classroomId, announcementId }) => ({
        url: v(
          `/school/classrooms/${encodeURIComponent(
            classroomId,
          )}/announcements/${encodeURIComponent(announcementId)}`,
        ),
        method: 'DELETE',
      }),
      async onQueryStarted(
        { classroomId, announcementId },
        { dispatch, queryFulfilled },
      ) {
        const patches = [
          dispatch(
            schoolApi.util.updateQueryData(
              'classroomAnnouncements',
              { classroomId },
              (draft) => {
                const idx = draft.findIndex((a) => a.id === announcementId);
                if (idx !== -1) draft.splice(idx, 1);
              },
            ),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: ['Org'],
    }),
    adminCourses: build.query<CourseListItem[], void>({
      query: () => ({ url: v('/school/courses') }),
      providesTags: ['Org'],
    }),
    createCourse: build.mutation<
      CourseListItem,
      {
        name: string;
        slug: string;
        description?: string;
        language: CourseLanguage;
        isPublic: boolean;
        discoverableInCatalog: boolean;
        allowDeadlineExtensions: boolean;
      }
    >({
      query: (body) => ({
        url: v('/school/courses'),
        method: 'POST',
        data: body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            schoolApi.util.updateQueryData('adminCourses', undefined, (draft) => {
              if (!draft.some((c) => c.id === created.id)) {
                draft.push({
                  ...created,
                  totalModules: created.totalModules ?? 0,
                  totalMaterials: created.totalMaterials ?? 0,
                  totalStudents: created.totalStudents ?? 0,
                });
              }
            }),
          );
        } catch {
          /* error toast handled in caller */
        }
      },
    }),
    // ─── AI course generation (Gemini) ───
    aiCourseChat: build.mutation<
      AiCourseChatResponse,
      { messages: AiChatMessage[]; language: string }
    >({
      query: (body) => ({
        url: v('/school/ai/courses/chat'),
        method: 'POST',
        data: body,
      }),
    }),
    generateAiCourse: build.mutation<
      GeneratedCourseSummary,
      { brief: AiCourseBrief; generateContent: boolean; language: string }
    >({
      query: (body) => ({
        url: v('/school/ai/courses/generate'),
        method: 'POST',
        data: body,
      }),
      // The summary lacks aggregate counts; invalidate so the list refetches with totals.
      invalidatesTags: ['Org'],
    }),
    aiMaterialChat: build.mutation<
      AiMaterialChatResponse,
      { materialId: string; messages: AiChatMessage[]; language: string }
    >({
      query: ({ materialId, ...body }) => ({
        url: v(`/school/ai/materials/${encodeURIComponent(materialId)}/chat`),
        method: 'POST',
        data: body,
      }),
    }),
    generateMaterialContent: build.mutation<
      { blocks: MaterialBlock[] },
      {
        materialId: string;
        instructions?: string;
        messages?: AiChatMessage[];
        language: string;
      }
    >({
      query: ({ materialId, ...body }) => ({
        url: v(`/school/ai/materials/${encodeURIComponent(materialId)}/content`),
        method: 'POST',
        data: body,
      }),
    }),
    deleteCourse: build.mutation<void, { courseId: string }>({
      query: ({ courseId }) => ({
        url: v(`/school/courses/${encodeURIComponent(courseId)}`),
        method: 'DELETE',
      }),
      async onQueryStarted({ courseId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          schoolApi.util.updateQueryData('adminCourses', undefined, (draft) => {
            const idx = draft.findIndex((c) => c.id === courseId);
            if (idx !== -1) draft.splice(idx, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    updateCourse: build.mutation<
      void,
      {
        courseId: string;
        name: string;
        slug: string;
        description?: string;
        language: CourseLanguage;
        isPublic: boolean;
        discoverableInCatalog: boolean;
        allowDeadlineExtensions: boolean;
      }
    >({
      query: ({ courseId, ...body }) => ({
        url: v(`/school/courses/${encodeURIComponent(courseId)}`),
        method: 'PATCH',
        data: body,
      }),
      async onQueryStarted(
        {
          courseId,
          name,
          slug,
          description,
          language,
          isPublic,
          discoverableInCatalog,
          allowDeadlineExtensions,
        },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          schoolApi.util.updateQueryData('adminCourses', undefined, (draft) => {
            const c = draft.find((x) => x.id === courseId);
            if (!c) return;
            c.name = name;
            c.slug = slug;
            c.description = description;
            c.language = language;
            c.isPublic = isPublic;
            c.discoverableInCatalog = discoverableInCatalog;
            c.allowDeadlineExtensions = allowDeadlineExtensions;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    adminCourseClassrooms: build.query<ClassroomSummary[], { courseId: string }>({
      query: ({ courseId }) => ({
        url: v(`/school/courses/${encodeURIComponent(courseId)}/classrooms`),
      }),
      providesTags: ['Org'],
    }),
    adminCourseModules: build.query<AdminModule[], { courseSlug: string }>({
      query: ({ courseSlug }) => ({
        url: v(`/school/courses/${encodeURIComponent(courseSlug)}/modules`),
      }),
      providesTags: ['Org'],
    }),
    createCourseModule: build.mutation<
      AdminModule,
      {
        courseSlug: string;
        title: string;
        slug: string;
        sortOrder: number;
        description?: string;
        isPublic: boolean;
      }
    >({
      query: ({ courseSlug, ...body }) => ({
        url: v(`/school/courses/${encodeURIComponent(courseSlug)}/modules`),
        method: 'POST',
        data: body,
      }),
      async onQueryStarted({ courseSlug }, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            schoolApi.util.updateQueryData(
              'adminCourseModules',
              { courseSlug },
              (draft) => {
                if (!draft.some((m) => m.id === created.id)) draft.push(created);
              },
            ),
          );
        } catch {
          /* error toast handled in caller */
        }
      },
    }),
    updateCourseModule: build.mutation<
      void,
      {
        courseSlug: string;
        moduleId: string;
        title: string;
        description?: string;
        hardLock: boolean;
        isPublic: boolean;
      }
    >({
      query: ({ courseSlug, moduleId, ...body }) => ({
        url: v(
          `/school/courses/${encodeURIComponent(courseSlug)}/modules/${encodeURIComponent(moduleId)}`,
        ),
        method: 'PATCH',
        data: body,
      }),
      async onQueryStarted(
        { courseSlug, moduleId, title, description, hardLock, isPublic },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          schoolApi.util.updateQueryData(
            'adminCourseModules',
            { courseSlug },
            (draft) => {
              const mod = draft.find((m) => m.id === moduleId);
              if (!mod) return;
              mod.title = title;
              mod.description = description;
              mod.hardLock = hardLock;
              mod.isPublic = isPublic;
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    deleteCourseModule: build.mutation<
      void,
      { courseSlug: string; moduleId: string }
    >({
      query: ({ courseSlug, moduleId }) => ({
        url: v(
          `/school/courses/${encodeURIComponent(courseSlug)}/modules/${encodeURIComponent(moduleId)}`,
        ),
        method: 'DELETE',
      }),
      async onQueryStarted(
        { courseSlug, moduleId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          schoolApi.util.updateQueryData(
            'adminCourseModules',
            { courseSlug },
            (draft) => {
              const idx = draft.findIndex((m) => m.id === moduleId);
              if (idx === -1) return;
              draft.splice(idx, 1);
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    swapCourseModulesOrder: build.mutation<
      void,
      { courseSlug: string; firstModuleId: string; secondModuleId: string }
    >({
      query: ({ courseSlug, firstModuleId, secondModuleId }) => ({
        url: v(
          `/school/courses/${encodeURIComponent(courseSlug)}/modules/order`,
        ),
        method: 'PATCH',
        data: { firstModuleId, secondModuleId },
      }),
      async onQueryStarted(
        { courseSlug, firstModuleId, secondModuleId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          schoolApi.util.updateQueryData(
            'adminCourseModules',
            { courseSlug },
            (draft) => {
              const a = draft.find((m) => m.id === firstModuleId);
              const b = draft.find((m) => m.id === secondModuleId);
              if (a && b) {
                const tmp = a.sortOrder;
                a.sortOrder = b.sortOrder;
                b.sortOrder = tmp;
              }
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    swapModuleMaterialsOrder: build.mutation<
      void,
      {
        courseSlug: string;
        moduleId: string;
        firstMaterialId: string;
        secondMaterialId: string;
      }
    >({
      query: ({ moduleId, firstMaterialId, secondMaterialId }) => ({
        url: v(`/school/modules/${encodeURIComponent(moduleId)}/materials/order`),
        method: 'PATCH',
        data: { firstMaterialId, secondMaterialId },
      }),
      async onQueryStarted(
        { courseSlug, moduleId, firstMaterialId, secondMaterialId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          schoolApi.util.updateQueryData(
            'adminCourseModules',
            { courseSlug },
            (draft) => {
              const mod = draft.find((m) => m.id === moduleId);
              if (!mod?.materials) return;
              const a = mod.materials.find((x) => x.id === firstMaterialId);
              const b = mod.materials.find((x) => x.id === secondMaterialId);
              if (a && b) {
                const tmp = a.sortOrder;
                a.sortOrder = b.sortOrder;
                b.sortOrder = tmp;
              }
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    syncMaterialBlocks: build.mutation<
      MaterialBlock[],
      {
        courseSlug: string;
        moduleId: string;
        materialId: string;
        // The backend now stores the array verbatim (PUT body `{ blocks }`),
        // replacing all blocks wholesale — no per-item `{ id, payload }` envelope,
        // no server-assigned ids or `type` casing. Send the editor's blocks as-is;
        // read shape == write shape (symmetric round-trip).
        blocks: MaterialBlock[];
      }
    >({
      query: ({ materialId, blocks }) => ({
        url: v(`/school/materials/${encodeURIComponent(materialId)}/blocks`),
        method: 'PUT',
        data: { blocks },
      }),
      async onQueryStarted(
        { courseSlug, moduleId, materialId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data: synced } = await queryFulfilled;
          dispatch(
            schoolApi.util.updateQueryData(
              'adminCourseModules',
              { courseSlug },
              (draft) => {
                const mod = draft.find((m) => m.id === moduleId);
                const mat = mod?.materials?.find((x) => x.id === materialId);
                if (!mat) return;
                mat.blocks = synced;
              },
            ),
          );
        } catch {
          /* error toast handled in caller */
        }
      },
    }),
    upsertMaterialSubmissionConfig: build.mutation<
      MaterialSubmissionConfig,
      {
        courseSlug: string;
        moduleId: string;
        materialId: string;
        config: MaterialSubmissionConfig;
      }
    >({
      query: ({ materialId, config }) => ({
        url: v(
          `/school/materials/${encodeURIComponent(materialId)}/submission-config`,
        ),
        method: 'PUT',
        data: config,
      }),
      async onQueryStarted(
        { courseSlug, moduleId, materialId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data: saved } = await queryFulfilled;
          dispatch(
            schoolApi.util.updateQueryData(
              'adminCourseModules',
              { courseSlug },
              (draft) => {
                const mod = draft.find((m) => m.id === moduleId);
                const mat = mod?.materials?.find((x) => x.id === materialId);
                if (!mat) return;
                mat.submissionConfig = saved;
              },
            ),
          );
        } catch {
          /* error toast handled in caller */
        }
      },
    }),
    clearMaterialSubmissionConfig: build.mutation<
      void,
      { courseSlug: string; moduleId: string; materialId: string }
    >({
      query: ({ materialId }) => ({
        url: v(
          `/school/materials/${encodeURIComponent(materialId)}/submission-config`,
        ),
        method: 'DELETE',
      }),
      async onQueryStarted(
        { courseSlug, moduleId, materialId },
        { dispatch, queryFulfilled },
      ) {
        try {
          await queryFulfilled;
          dispatch(
            schoolApi.util.updateQueryData(
              'adminCourseModules',
              { courseSlug },
              (draft) => {
                const mod = draft.find((m) => m.id === moduleId);
                const mat = mod?.materials?.find((x) => x.id === materialId);
                if (!mat) return;
                mat.submissionConfig = null;
              },
            ),
          );
        } catch {
          /* error toast handled in caller */
        }
      },
    }),
    createModuleMaterial: build.mutation<
      AdminMaterial,
      {
        courseSlug: string;
        moduleId: string;
        title: string;
        slug: string;
        sortOrder: number;
        isPublic: boolean;
        description?: string;
        estimatedMinutes?: number;
        type?: MaterialKind;
      }
    >({
      query: ({ moduleId, courseSlug: _courseSlug, ...body }) => ({
        url: v(`/school/modules/${encodeURIComponent(moduleId)}/materials`),
        method: 'POST',
        data: body,
      }),
      async onQueryStarted(
        { courseSlug, moduleId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            schoolApi.util.updateQueryData(
              'adminCourseModules',
              { courseSlug },
              (draft) => {
                const mod = draft.find((m) => m.id === moduleId);
                if (!mod) return;
                mod.materials = mod.materials ?? [];
                if (!mod.materials.some((x) => x.id === created.id)) {
                  mod.materials.push(created);
                }
                mod.durationMinutes = sumDurationMinutes(mod.materials);
              },
            ),
          );
        } catch {
          /* error toast handled in caller */
        }
      },
    }),
    updateMaterial: build.mutation<
      void,
      {
        courseSlug: string;
        moduleId: string;
        materialId: string;
        title: string;
        slug?: string;
        description?: string;
        type?: MaterialKind;
        estimatedMinutes?: number;
        isPublic: boolean;
      }
    >({
      query: ({ moduleId, materialId, title, slug, description, type, estimatedMinutes, isPublic }) => ({
        url: v(
          `/school/modules/${encodeURIComponent(moduleId)}/materials/${encodeURIComponent(materialId)}`,
        ),
        method: 'PATCH',
        data: { title, slug, description, type, estimatedMinutes, isPublic },
      }),
      async onQueryStarted(
        { courseSlug, moduleId, materialId, title, slug, description, type, estimatedMinutes, isPublic },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          schoolApi.util.updateQueryData(
            'adminCourseModules',
            { courseSlug },
            (draft) => {
              const mod = draft.find((m) => m.id === moduleId);
              const mat = mod?.materials?.find((x) => x.id === materialId);
              if (!mat || !mod) return;
              mat.title = title;
              if (slug) mat.slug = slug;
              mat.description = description;
              if (type) mat.type = type;
              mat.estimatedMinutes = estimatedMinutes;
              mat.isPublic = isPublic;
              mod.durationMinutes = sumDurationMinutes(mod.materials);
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    deleteMaterial: build.mutation<
      void,
      {
        courseSlug: string;
        moduleId: string;
        materialId: string;
      }
    >({
      query: ({ moduleId, materialId }) => ({
        url: v(
          `/school/modules/${encodeURIComponent(moduleId)}/materials/${encodeURIComponent(materialId)}`,
        ),
        method: 'DELETE',
      }),
      async onQueryStarted(
        { courseSlug, moduleId, materialId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          schoolApi.util.updateQueryData(
            'adminCourseModules',
            { courseSlug },
            (draft) => {
              const mod = draft.find((m) => m.id === moduleId);
              if (!mod?.materials) return;
              mod.materials = mod.materials.filter((x) => x.id !== materialId);
              mod.durationMinutes = sumDurationMinutes(mod.materials);
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    duplicateMaterial: build.mutation<
      AdminMaterial,
      {
        courseSlug: string;
        moduleId: string;
        materialId: string;
        title: string;
        slug: string;
      }
    >({
      query: ({ moduleId, materialId, title, slug }) => ({
        url: v(
          `/school/modules/${encodeURIComponent(moduleId)}/materials/${encodeURIComponent(materialId)}/duplicate`,
        ),
        method: 'POST',
        data: { title, slug },
      }),
      async onQueryStarted(
        { courseSlug, moduleId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            schoolApi.util.updateQueryData(
              'adminCourseModules',
              { courseSlug },
              (draft) => {
                const mod = draft.find((m) => m.id === moduleId);
                if (!mod) return;
                mod.materials = mod.materials ?? [];
                if (!mod.materials.some((x) => x.id === created.id)) {
                  mod.materials.push(created);
                }
                mod.durationMinutes = sumDurationMinutes(mod.materials);
              },
            ),
          );
        } catch {
          /* error toast handled in caller */
        }
      },
    }),

    // ---- Permissions management ----

    // `GET /v1/school/permissions/rules` requires a `product` query param
    // (the role rules are scoped per product); omitting it makes the backend
    // throw MissingServletRequestParameter → 500. The school permissions page
    // manages the SCHOOL roles (STUDENT/MENTOR/HR/ADMIN), so default to SCHOOL.
    permissionRules: build.query<PermissionRuleSummary[], { product?: ProductCode } | void>({
      query: (arg) => ({
        url: v('/school/permissions/rules'),
        params: { product: (arg && 'product' in arg && arg.product) || 'SCHOOL' },
      }),
      providesTags: ['Permission'],
    }),

    /**
     * Assignable permission keys grouped by product. The backend now returns
     * `PermissionCatalogResponse[]` (`{ product, permissions[] }`) for the
     * products active in the org — callers flatten `.permissions` when they
     * only need the flat key list.
     */
    permissionCatalog: build.query<PermissionCatalogResponse[], void>({
      query: () => ({ url: v('/school/permissions/catalog') }),
    }),

    grantPermission: build.mutation<
      RulePermissionsResponse,
      { ruleId: string; key: string }
    >({
      query: ({ ruleId, key }) => ({
        url: v(
          `/school/permissions/rules/${encodeURIComponent(ruleId)}`,
        ),
        method: 'POST',
        data: { key },
      }),
      invalidatesTags: ['Permission'],
    }),

    revokePermission: build.mutation<
      void,
      { ruleId: string; permissionKey: string }
    >({
      query: ({ ruleId, permissionKey }) => ({
        url: v(
          `/school/permissions/rules/${encodeURIComponent(ruleId)}/${encodeURIComponent(permissionKey)}`,
        ),
        method: 'DELETE',
      }),
      invalidatesTags: ['Permission'],
    }),

    // ---- Member-level permission overrides ----

    memberPermissionOverrides: build.query<
      MemberPermissionOverrideResponse,
      { memberId: string }
    >({
      query: ({ memberId }) => ({
        url: v(`/school/permissions/members/${encodeURIComponent(memberId)}`),
      }),
      providesTags: (_r, _e, { memberId }) => [
        { type: 'Permission', id: `member-${memberId}` },
      ],
    }),

    setMemberPermissionOverride: build.mutation<
      MemberPermissionOverrideResponse,
      { memberId: string; key: string; overrideType: OverrideType }
    >({
      query: ({ memberId, key, overrideType }) => ({
        url: v(`/school/permissions/members/${encodeURIComponent(memberId)}`),
        method: 'POST',
        data: { key, overrideType },
      }),
      invalidatesTags: (_r, _e, { memberId }) => [
        { type: 'Permission', id: `member-${memberId}` },
      ],
    }),

    removeMemberPermissionOverride: build.mutation<
      void,
      { memberId: string; permissionKey: string }
    >({
      query: ({ memberId, permissionKey }) => ({
        url: v(
          `/school/permissions/members/${encodeURIComponent(memberId)}/${encodeURIComponent(permissionKey)}`,
        ),
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { memberId }) => [
        { type: 'Permission', id: `member-${memberId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

function sumDurationMinutes(materials: AdminMaterial[] | undefined): number {
  if (!materials) return 0;
  return materials.reduce(
    (acc, m) => acc + (typeof m.estimatedMinutes === 'number' ? m.estimatedMinutes : 0),
    0,
  );
}

export const {
  useClassroomsQuery,
  useClassroomBySlugQuery,
  useCreateClassroomMutation,
  useUpdateClassroomMutation,
  useDeleteClassroomMutation,
  useClassroomStudentsQuery,
  useMembersQuery,
  useLazyMembersQuery,
  useClassroomMentorsQuery,
  useAttachCourseMutation,
  useDetachCourseMutation,
  useInviteUserMutation,
  useActivateProductMutation,
  useAddClassroomMemberMutation,
  useRemoveClassroomMemberMutation,
  useClassroomCoursesQuery,
  useCourseModulesQuery,
  useModuleMaterialsQuery,
  useMaterialDetailQuery,
  useAvailableMentorSlotsQuery,
  useOpenSubmissionDraftMutation,
  useAttachSubmissionFileMutation,
  useDetachSubmissionFileMutation,
  useSubmitSubmissionMutation,
  useReopenSubmissionMutation,
  useMentorSubmissionsQuery,
  useClaimSubmissionMutation,
  useReleaseSubmissionMutation,
  useApproveSubmissionMutation,
  useRequestSubmissionChangesMutation,
  useStartMaterialMutation,
  useCompleteMaterialMutation,
  useAdminCoursesQuery,
  useCreateCourseMutation,
  useAiCourseChatMutation,
  useGenerateAiCourseMutation,
  useAiMaterialChatMutation,
  useGenerateMaterialContentMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useAdminCourseClassroomsQuery,
  useAdminCourseModulesQuery,
  useCreateCourseModuleMutation,
  useUpdateCourseModuleMutation,
  useDeleteCourseModuleMutation,
  useSwapCourseModulesOrderMutation,
  useSwapModuleMaterialsOrderMutation,
  useCreateModuleMaterialMutation,
  useSyncMaterialBlocksMutation,
  useUpsertMaterialSubmissionConfigMutation,
  useClearMaterialSubmissionConfigMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useDuplicateMaterialMutation,
  useClassroomAnnouncementsQuery,
  useClassroomAnnouncementQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useAddMemberRoleMutation,
  useRemoveMemberRoleMutation,
  useUpdateMemberStatusMutation,
  useMemberDetailQuery,
  usePermissionRulesQuery,
  usePermissionCatalogQuery,
  useGrantPermissionMutation,
  useRevokePermissionMutation,
  useMemberPermissionOverridesQuery,
  useSetMemberPermissionOverrideMutation,
  useRemoveMemberPermissionOverrideMutation,
} = schoolApi;
