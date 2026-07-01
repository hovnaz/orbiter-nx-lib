import type {
  AuthorizationUrlResponse,
  ChangePasswordRequest,
  ConfirmRegistrationRequest,
  ConfirmResetRequest,
  ForgotPasswordRequest,
  LanguagePreference,
  LoginRequest,
  LoginResponse,
  NewPasswordRequest,
  OAuthTokenRequest,
  OrganizationsResponse,
  RegisterOrganizationRequest,
  RegisterRequest,
  ThemePreference,
  User,
} from '#types';
import { api } from './api';
import { v } from './version';
import { patchUser, selectUser } from '../store/slices/authSlice';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: v('/auth/login'), method: 'POST', data: body }),
      invalidatesTags: ['Auth', 'Org'],
    }),
    newPassword: build.mutation<LoginResponse, NewPasswordRequest>({
      query: (body) => ({ url: v('/auth/new-password'), method: 'POST', data: body }),
      invalidatesTags: ['Auth', 'Org'],
    }),
    // Federated (Google) sign-in. Each call mints a fresh CSRF state + HttpOnly
    // cookie, so this is a mutation (not a cached query). Both calls must send
    // credentials so the state cookie round-trips.
    googleAuthUrl: build.mutation<AuthorizationUrlResponse, { redirectUri: string }>({
      query: ({ redirectUri }) => ({
        url: v('/auth/oauth/google'),
        method: 'GET',
        params: { redirectUri },
        withCredentials: true,
      }),
    }),
    oauthToken: build.mutation<LoginResponse, OAuthTokenRequest>({
      query: (body) => ({
        url: v('/auth/oauth/token'),
        method: 'POST',
        data: body,
        withCredentials: true,
      }),
      invalidatesTags: ['Auth', 'Org'],
    }),
    register: build.mutation<void, RegisterRequest>({
      query: (body) => ({ url: v('/auth/register'), method: 'POST', data: body }),
    }),
    // Public self-serve onboarding: create a NEW org (owned by the registrant) +
    // activate SCHOOL, server-side. See `RegisterOrganizationRequest`.
    // ⚠️ BACKEND PENDING — confirm the final path; this endpoint does not exist
    // yet, so submitting will error until the backend adds it.
    registerOrganization: build.mutation<void, RegisterOrganizationRequest>({
      query: (body) => ({
        url: v('/auth/register-organization'),
        method: 'POST',
        data: body,
      }),
    }),
    confirmRegistration: build.mutation<void, ConfirmRegistrationRequest>({
      query: (body) => ({
        url: v('/auth/confirm-registration'),
        method: 'POST',
        data: body,
      }),
    }),
    forgotPassword: build.mutation<void, ForgotPasswordRequest>({
      query: (body) => ({
        url: v('/auth/forgot-password'),
        method: 'POST',
        data: body,
      }),
    }),
    confirmReset: build.mutation<void, ConfirmResetRequest>({
      query: (body) => ({
        url: v('/auth/confirm-reset'),
        method: 'POST',
        data: body,
      }),
    }),
    changePassword: build.mutation<void, ChangePasswordRequest>({
      query: (body) => ({
        url: v('/auth/change-password'),
        method: 'POST',
        data: body,
      }),
    }),
    me: build.query<User, { orgId?: string } | void>({
      query: (arg) => {
        const orgId = arg && 'orgId' in arg ? arg.orgId : undefined;
        return {
          url: v('/auth/me'),
          headers: orgId ? { 'X-Organization-Id': orgId } : undefined,
        };
      },
      providesTags: ['Auth'],
    }),
    organizations: build.query<OrganizationsResponse, void>({
      query: () => ({ url: v('/organizations') }),
      providesTags: ['Org'],
    }),
    updateTheme: build.mutation<
      void,
      { userId: string; theme: ThemePreference }
    >({
      query: ({ userId, theme }) => ({
        url: v(`/users/${encodeURIComponent(userId)}/theme`),
        method: 'PUT',
        data: { theme },
      }),
      async onQueryStarted({ theme }, { dispatch, queryFulfilled, getState }) {
        const prev = selectUser(
          getState() as unknown as Parameters<typeof selectUser>[0],
        )?.theme;
        // Patch the store (school reads `selectUser`) AND the `me` cache
        // (carizma reads `useMeQuery`) so both apps reflect the change
        // optimistically. updateQueryData is a no-op where no `me` cache exists.
        dispatch(patchUser({ theme }));
        const cachePatch = dispatch(
          authApi.util.updateQueryData('me', undefined, (draft) => {
            draft.theme = theme;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          if (prev) dispatch(patchUser({ theme: prev }));
          cachePatch.undo();
        }
      },
    }),
    updateLanguage: build.mutation<
      void,
      { userId: string; language: LanguagePreference }
    >({
      query: ({ userId, language }) => ({
        url: v(`/users/${encodeURIComponent(userId)}/language`),
        method: 'PUT',
        data: { language },
      }),
      async onQueryStarted({ language }, { dispatch, queryFulfilled, getState }) {
        const prev = selectUser(
          getState() as unknown as Parameters<typeof selectUser>[0],
        )?.language;
        dispatch(patchUser({ language }));
        const cachePatch = dispatch(
          authApi.util.updateQueryData('me', undefined, (draft) => {
            draft.language = language;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          if (prev) dispatch(patchUser({ language: prev }));
          cachePatch.undo();
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useNewPasswordMutation,
  useGoogleAuthUrlMutation,
  useOauthTokenMutation,
  useRegisterMutation,
  useRegisterOrganizationMutation,
  useConfirmRegistrationMutation,
  useForgotPasswordMutation,
  useConfirmResetMutation,
  useChangePasswordMutation,
  useMeQuery,
  useLazyMeQuery,
  useOrganizationsQuery,
  useUpdateThemeMutation,
  useUpdateLanguageMutation,
} = authApi;
