import type {
  CalendarSummary,
  GoogleCalendarSummary,
  GoogleConnectUrlRequest,
  GoogleConnectUrlResponse,
  GoogleIntegrationStatus,
  ImportEventsArgs,
  ImportEventsResponse,
  ImportGoogleCalendarRequest,
} from '#types';
import { api } from './api';
import { v } from './version';

export const integrationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    googleIntegrationStatus: build.query<GoogleIntegrationStatus, void>({
      query: () => ({ url: v('/integrations/google/status') }),
      providesTags: [{ type: 'Auth', id: 'GOOGLE_INTEGRATION' }],
    }),
    googleIntegrationConnectUrl: build.mutation<
      GoogleConnectUrlResponse,
      GoogleConnectUrlRequest
    >({
      query: (body) => ({
        url: v('/integrations/google/connect-url'),
        method: 'POST',
        data: body,
      }),
    }),
    googleIntegrationDisconnect: build.mutation<void, void>({
      query: () => ({
        url: v('/integrations/google'),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Auth', id: 'GOOGLE_INTEGRATION' }],
    }),
    googleCalendars: build.query<GoogleCalendarSummary[], void>({
      query: () => ({ url: v('/integrations/google/calendars') }),
      // Refetched on demand (when the import dialog opens) — keep cached
      // briefly to avoid a flash if the user re-opens within the same session.
      providesTags: [{ type: 'Calendar', id: 'GOOGLE_LIST' }],
    }),
    importGoogleCalendar: build.mutation<
      CalendarSummary,
      { googleCalendarId: string; body?: ImportGoogleCalendarRequest }
    >({
      query: ({ googleCalendarId, body }) => ({
        url: v(
          `/integrations/google/calendars/${encodeURIComponent(googleCalendarId)}/import`,
        ),
        method: 'POST',
        data: body ?? {},
      }),
      invalidatesTags: [
        { type: 'Calendar', id: 'LIST' },
        { type: 'Calendar', id: 'GOOGLE_LIST' },
      ],
    }),
    importGoogleEvents: build.mutation<ImportEventsResponse, ImportEventsArgs>({
      query: ({ calendarId, from, to }) => ({
        url: v(
          `/integrations/google/calendars/local/${encodeURIComponent(calendarId)}/import-events`,
        ),
        method: 'POST',
        params: from && to ? { from, to } : undefined,
      }),
      invalidatesTags: (_r, _e, { calendarId }) => [
        { type: 'Calendar', id: `SLOTS_${calendarId}` },
        { type: 'Auth', id: 'GOOGLE_INTEGRATION' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGoogleIntegrationStatusQuery,
  useGoogleIntegrationConnectUrlMutation,
  useGoogleIntegrationDisconnectMutation,
  useGoogleCalendarsQuery,
  useLazyGoogleCalendarsQuery,
  useImportGoogleCalendarMutation,
  useImportGoogleEventsMutation,
} = integrationsApi;
