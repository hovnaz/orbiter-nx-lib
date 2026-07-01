/**
 * Projects API — Jira-like task tracker.
 *
 * Now backed by the real backend (see `docs/jira-backend-prompt.md` for the
 * contract). Tenant scoping is handled by the existing axios interceptor,
 * which attaches `X-Organization-Id` from the current org in Redux.
 *
 * The in-memory + localStorage stub previously here was removed once the
 * backend went live. `clearProjectsStub` is kept for one release as a
 * migration safety net: it just wipes the legacy storage key so users
 * upgrading from the stub build do not see stale data flash on first load.
 *
 * Permission gating (frontend hint, real enforcement is server-side):
 *   PROJECT:VIEW           — all GET endpoints
 *   PROJECT:CREATE         — POST /v1/projects
 *   PROJECT:UPDATE         — PATCH /v1/projects/{id}
 *   PROJECT:DELETE         — DELETE /v1/projects/{id}
 *   PROJECT:TASK.CREATE    — POST tasks + labels
 *   PROJECT:TASK.UPDATE    — PATCH /v1/tasks/{id}, /move
 *   PROJECT:TASK.DELETE    — DELETE /v1/tasks/{id}
 */

import type {
  CreateProjectRequest,
  CreateTaskRequest,
  MoveTaskRequest,
  ProjectBoardResponse,
  ProjectLabel,
  ProjectSummary,
  ProjectStatus,
  ProjectTask,
  TaskLabelColor,
  UpdateProjectRequest,
  UpdateTaskRequest,
} from '#types';
import { api } from './api';
import { v } from './version';

/**
 * Legacy localStorage key used by the in-memory stub. Wiped on logout via
 * `clearProjectsStub()` so old data doesn't leak between users on shared
 * machines. Safe to call at any time; no-op if the key is absent.
 */
const LEGACY_STORAGE_KEY = 'orbiter:projects:v1';

export function clearProjectsStub(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export interface ListProjectsArgs {
  status?: ProjectStatus;
}

export interface ListTasksArgs {
  projectId: string;
}

export interface UpdateProjectArgs {
  id: string;
  patch: UpdateProjectRequest;
}

export interface CreateTaskArgs extends CreateTaskRequest {
  projectId: string;
}

export interface UpdateTaskArgs {
  taskId: string;
  patch: UpdateTaskRequest;
}

export interface MoveTaskArgs {
  taskId: string;
  move: MoveTaskRequest;
}

export interface CreateLabelArgs {
  projectId: string;
  name: string;
  color: TaskLabelColor;
}

export const projectsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listProjects: build.query<ProjectSummary[], ListProjectsArgs | void>({
      query: (arg) => ({
        url: v('/projects'),
        params: arg && 'status' in arg && arg.status ? { status: arg.status } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Project' as const, id: 'LIST' },
              ...result.map((p) => ({ type: 'Project' as const, id: p.id })),
            ]
          : [{ type: 'Project' as const, id: 'LIST' }],
    }),

    getProject: build.query<ProjectSummary, { id: string }>({
      query: ({ id }) => ({ url: v(`/projects/${encodeURIComponent(id)}`) }),
      providesTags: (_r, _e, { id }) => [{ type: 'Project', id }],
    }),

    createProject: build.mutation<ProjectSummary, CreateProjectRequest>({
      query: (body) => ({
        url: v('/projects'),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    updateProject: build.mutation<ProjectSummary, UpdateProjectArgs>({
      query: ({ id, patch }) => ({
        url: v(`/projects/${encodeURIComponent(id)}`),
        method: 'PATCH',
        data: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Project', id },
        { type: 'Project', id: 'LIST' },
      ],
    }),

    deleteProject: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: v(`/projects/${encodeURIComponent(id)}`),
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Project', id },
        { type: 'Project', id: 'LIST' },
        { type: 'ProjectTask', id: `LIST_${id}` },
        { type: 'ProjectLabel', id: `LIST_${id}` },
      ],
    }),

    getProjectBoard: build.query<ProjectBoardResponse, { projectId: string }>({
      query: ({ projectId }) => ({
        url: v(`/projects/${encodeURIComponent(projectId)}/board`),
      }),
      providesTags: (_r, _e, { projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'ProjectTask', id: `LIST_${projectId}` },
        { type: 'ProjectLabel', id: `LIST_${projectId}` },
      ],
    }),

    listLabels: build.query<ProjectLabel[], { projectId: string }>({
      query: ({ projectId }) => ({
        url: v(`/projects/${encodeURIComponent(projectId)}/labels`),
      }),
      providesTags: (_r, _e, { projectId }) => [
        { type: 'ProjectLabel', id: `LIST_${projectId}` },
      ],
    }),

    createLabel: build.mutation<ProjectLabel, CreateLabelArgs>({
      query: ({ projectId, name, color }) => ({
        url: v(`/projects/${encodeURIComponent(projectId)}/labels`),
        method: 'POST',
        data: { name, color },
      }),
      invalidatesTags: (_r, _e, { projectId }) => [
        { type: 'ProjectLabel', id: `LIST_${projectId}` },
      ],
    }),

    createTask: build.mutation<ProjectTask, CreateTaskArgs>({
      query: ({ projectId, ...body }) => ({
        url: v(`/projects/${encodeURIComponent(projectId)}/tasks`),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_r, _e, { projectId }) => [
        { type: 'ProjectTask', id: `LIST_${projectId}` },
        { type: 'Project', id: projectId },
        { type: 'Project', id: 'LIST' },
      ],
    }),

    updateTask: build.mutation<ProjectTask, UpdateTaskArgs>({
      query: ({ taskId, patch }) => ({
        url: v(`/tasks/${encodeURIComponent(taskId)}`),
        method: 'PATCH',
        data: patch,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'ProjectTask', id: result.id },
              { type: 'ProjectTask', id: `LIST_${result.projectId}` },
            ]
          : [],
      // Optimistic update: patch any open board cache that contains this task
      // so the drawer + card reflect the edit before the server responds.
      async onQueryStarted({ taskId, patch }, { dispatch, queryFulfilled, getState }) {
        const patches: Array<{ undo: () => void }> = [];
        const apiState = (
          getState() as {
            api: {
              queries: Record<string, { endpointName: string; originalArgs: unknown }>;
            };
          }
        ).api;
        for (const entry of Object.values(apiState.queries)) {
          if (entry.endpointName !== 'getProjectBoard') continue;
          const args = entry.originalArgs as { projectId: string };
          const undo = dispatch(
            projectsApi.util.updateQueryData(
              'getProjectBoard',
              { projectId: args.projectId },
              (draft) => {
                const t = draft.tasks.find((x) => x.id === taskId);
                if (t) Object.assign(t, patch);
              },
            ),
          );
          patches.push(undo);
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    deleteTask: build.mutation<void, { id: string; projectId: string }>({
      query: ({ id }) => ({
        url: v(`/tasks/${encodeURIComponent(id)}`),
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { projectId }) => [
        { type: 'ProjectTask', id: `LIST_${projectId}` },
        { type: 'Project', id: projectId },
        { type: 'Project', id: 'LIST' },
      ],
    }),

    moveTask: build.mutation<ProjectTask, MoveTaskArgs>({
      query: ({ taskId, move }) => ({
        url: v(`/tasks/${encodeURIComponent(taskId)}/move`),
        method: 'POST',
        data: move,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Project', id: result.projectId },
              { type: 'Project', id: 'LIST' },
            ]
          : [],
      // Optimistic update for drag-and-drop. On failure we roll back so the
      // card snaps back to the original column.
      async onQueryStarted({ taskId, move }, { dispatch, queryFulfilled, getState }) {
        const patches: Array<{ undo: () => void }> = [];
        const apiState = (
          getState() as {
            api: {
              queries: Record<string, { endpointName: string; originalArgs: unknown }>;
            };
          }
        ).api;
        for (const entry of Object.values(apiState.queries)) {
          if (entry.endpointName !== 'getProjectBoard') continue;
          const args = entry.originalArgs as { projectId: string };
          const undo = dispatch(
            projectsApi.util.updateQueryData(
              'getProjectBoard',
              { projectId: args.projectId },
              (draft) => {
                const t = draft.tasks.find((x) => x.id === taskId);
                if (t) {
                  t.status = move.status;
                  t.orderInColumn = move.orderInColumn;
                }
              },
            ),
          );
          patches.push(undo);
        }
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),
  }),
});

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectBoardQuery,
  useListLabelsQuery,
  useCreateLabelMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
} = projectsApi;
