import type {
  BookableCalendar,
  CalendarColor,
  CalendarSlotSummary,
  CalendarSummary,
  CreateBookableCalendarRequest,
  CreateCalendarRequest,
  CreateSlotBookingRequest,
  CreateSlotRequest,
  LockSlotMaterialRequest,
  SlotBooking,
  SlotsRangeArgs,
  UpdateBookableCalendarRequest,
  UpdateCalendarRequest,
  UpdateSlotRequest,
} from '#types';
import { api } from './api';
import { v } from './version';

export interface MergedSlotsArgs {
  calendarIds: string[];
  from: string;
  to: string;
}

export const calendarApi = api.injectEndpoints({
  endpoints: (build) => ({
    calendarColors: build.query<CalendarColor[], void>({
      query: () => ({ url: v('/calendar-colors') }),
      providesTags: [{ type: 'Calendar', id: 'COLORS' }],
    }),
    calendars: build.query<CalendarSummary[], void>({
      query: () => ({ url: v('/calendars') }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Calendar', id: 'LIST' },
              ...result.map((c) => ({
                type: 'Calendar' as const,
                id: c.id,
              })),
            ]
          : [{ type: 'Calendar', id: 'LIST' }],
    }),
    calendar: build.query<CalendarSummary, string>({
      query: (id) => ({ url: v(`/calendars/${encodeURIComponent(id)}`) }),
      providesTags: (_r, _e, id) => [{ type: 'Calendar', id }],
    }),
    createCalendar: build.mutation<CalendarSummary, CreateCalendarRequest>({
      query: (body) => ({
        url: v('/calendars'),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'Calendar', id: 'LIST' }],
    }),
    updateCalendar: build.mutation<
      CalendarSummary,
      { id: string; patch: UpdateCalendarRequest }
    >({
      query: ({ id, patch }) => ({
        url: v(`/calendars/${encodeURIComponent(id)}`),
        method: 'PATCH',
        data: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Calendar', id: 'LIST' },
        { type: 'Calendar', id },
      ],
    }),
    deleteCalendar: build.mutation<void, string>({
      query: (id) => ({
        url: v(`/calendars/${encodeURIComponent(id)}`),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Calendar', id: 'LIST' }],
    }),
    calendarSlots: build.query<CalendarSlotSummary[], SlotsRangeArgs>({
      query: ({ calendarId, from, to }) => ({
        url: v(`/calendars/${encodeURIComponent(calendarId)}/slots`),
        params: { from, to },
      }),
      providesTags: (_r, _e, { calendarId }) => [
        { type: 'Calendar', id: `SLOTS_${calendarId}` },
      ],
    }),
    /**
     * Bulk endpoint — slots from many calendars in a single HTTP request.
     * Backend joins them by `calendarIds` query param.
     */
    mergedSlots: build.query<CalendarSlotSummary[], MergedSlotsArgs>({
      query: ({ calendarIds, from, to }) => ({
        url: v('/calendars/slots'),
        params: {
          calendarIds: calendarIds.join(','),
          from,
          to,
        },
      }),
      providesTags: (_r, _e, { calendarIds }) =>
        calendarIds.map((id) => ({
          type: 'Calendar' as const,
          id: `SLOTS_${id}`,
        })),
    }),
    createSlot: build.mutation<
      CalendarSlotSummary,
      { calendarId: string; body: CreateSlotRequest }
    >({
      query: ({ calendarId, body }) => ({
        url: v('/calendars/slots'),
        method: 'POST',
        data: { calendarId, ...body },
      }),
      invalidatesTags: (_r, _e, { calendarId }) => [
        { type: 'Calendar', id: `SLOTS_${calendarId}` },
      ],
    }),
    updateSlot: build.mutation<
      CalendarSlotSummary,
      { calendarId: string; slotId: string; patch: UpdateSlotRequest }
    >({
      query: ({ slotId, patch }) => ({
        url: v(`/calendars/slots/${encodeURIComponent(slotId)}`),
        method: 'PATCH',
        data: patch,
      }),
      // Optimistic update — patch every cached `mergedSlots` entry that
      // currently contains this slot so the UI reflects the change before the
      // server responds. On failure all patches are rolled back.
      async onQueryStarted(
        { slotId, patch },
        { dispatch, queryFulfilled, getState },
      ) {
        const state = getState() as {
          api: { queries: Record<string, { endpointName?: string; originalArgs?: unknown }> };
        };
        const patches: { undo: () => void }[] = [];
        for (const entry of Object.values(state.api.queries)) {
          if (entry?.endpointName !== 'mergedSlots') continue;
          const args = entry.originalArgs;
          if (!args) continue;
          const undo = dispatch(
            calendarApi.util.updateQueryData(
              'mergedSlots',
              args as MergedSlotsArgs,
              (draft) => {
                const target = draft.find((s) => s.id === slotId);
                if (!target) return;
                if (patch.title !== undefined) target.title = patch.title;
                if (patch.description !== undefined)
                  target.description = patch.description ?? null;
                if (patch.location !== undefined)
                  target.location = patch.location ?? null;
                if (patch.startAt !== undefined) target.startAt = patch.startAt;
                if (patch.endAt !== undefined) target.endAt = patch.endAt;
                if (patch.isAllDay !== undefined)
                  target.isAllDay = patch.isAllDay;
              },
            ),
          );
          patches.push(undo);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const p of patches) p.undo();
        }
      },
      invalidatesTags: (_r, _e, { calendarId }) => [
        { type: 'Calendar', id: `SLOTS_${calendarId}` },
      ],
    }),
    deleteSlot: build.mutation<
      void,
      { calendarId: string; slotId: string }
    >({
      query: ({ slotId }) => ({
        url: v(`/calendars/slots/${encodeURIComponent(slotId)}`),
        method: 'DELETE',
      }),
      // Optimistic removal — drop the slot from every cached `mergedSlots`
      // entry so the UI reflects the deletion immediately. Roll back on error.
      async onQueryStarted(
        { slotId },
        { dispatch, queryFulfilled, getState },
      ) {
        const state = getState() as {
          api: { queries: Record<string, { endpointName?: string; originalArgs?: unknown }> };
        };
        const patches: { undo: () => void }[] = [];
        for (const entry of Object.values(state.api.queries)) {
          if (entry?.endpointName !== 'mergedSlots') continue;
          const args = entry.originalArgs;
          if (!args) continue;
          const undo = dispatch(
            calendarApi.util.updateQueryData(
              'mergedSlots',
              args as MergedSlotsArgs,
              (draft) => {
                const idx = draft.findIndex((s) => s.id === slotId);
                if (idx >= 0) draft.splice(idx, 1);
              },
            ),
          );
          patches.push(undo);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const p of patches) p.undo();
        }
      },
      invalidatesTags: (_r, _e, { calendarId }) => [
        { type: 'Calendar', id: `SLOTS_${calendarId}` },
      ],
    }),

    // ---- Bookable (mentor) calendars ----
    bookableCalendars: build.query<BookableCalendar[], void>({
      query: () => ({ url: v('/calendars/bookable') }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Bookable', id: 'LIST' },
              ...result.map((c) => ({ type: 'Bookable' as const, id: c.id })),
            ]
          : [{ type: 'Bookable', id: 'LIST' }],
    }),
    createBookableCalendar: build.mutation<
      BookableCalendar,
      CreateBookableCalendarRequest
    >({
      query: (body) => ({
        url: v('/calendars/bookable'),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'Bookable', id: 'LIST' }],
    }),
    updateBookableCalendar: build.mutation<
      BookableCalendar,
      { id: string; patch: UpdateBookableCalendarRequest }
    >({
      query: ({ id, patch }) => ({
        url: v(`/calendars/bookable/${encodeURIComponent(id)}`),
        method: 'PATCH',
        data: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Bookable', id: 'LIST' },
        { type: 'Bookable', id },
      ],
    }),
    deleteBookableCalendar: build.mutation<void, string>({
      query: (id) => ({
        url: v(`/calendars/bookable/${encodeURIComponent(id)}`),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Bookable', id: 'LIST' }],
    }),

    // ---- Slot bookings ----
    slotBookings: build.query<SlotBooking[], string>({
      query: (slotId) => ({
        url: v(`/calendars/slots/${encodeURIComponent(slotId)}/bookings`),
      }),
      providesTags: (_r, _e, slotId) => [{ type: 'Booking', id: slotId }],
    }),
    bookSlot: build.mutation<
      SlotBooking,
      { slotId: string; body: CreateSlotBookingRequest }
    >({
      query: ({ slotId, body }) => ({
        url: v(`/calendars/slots/${encodeURIComponent(slotId)}/bookings`),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_r, _e, { slotId, body }) => [
        { type: 'Booking', id: slotId },
        { type: 'Booking', id: `MATERIAL_${body.materialId}` },
      ],
    }),
    cancelBooking: build.mutation<void, { bookingId: string; slotId: string }>({
      query: ({ bookingId }) => ({
        url: v(`/calendars/bookings/${encodeURIComponent(bookingId)}`),
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { slotId }) => [
        { type: 'Booking', id: slotId },
      ],
    }),
    lockSlotMaterial: build.mutation<
      void,
      { slotId: string; calendarId: string; body: LockSlotMaterialRequest }
    >({
      query: ({ slotId, body }) => ({
        url: v(`/calendars/slots/${encodeURIComponent(slotId)}/lock-material`),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_r, _e, { slotId, calendarId }) => [
        { type: 'Booking', id: slotId },
        { type: 'Calendar', id: `SLOTS_${calendarId}` },
      ],
    }),
    unlockSlotMaterial: build.mutation<
      void,
      { slotId: string; calendarId: string }
    >({
      query: ({ slotId }) => ({
        url: v(`/calendars/slots/${encodeURIComponent(slotId)}/lock-material`),
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { slotId, calendarId }) => [
        { type: 'Booking', id: slotId },
        { type: 'Calendar', id: `SLOTS_${calendarId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCalendarColorsQuery,
  useCalendarsQuery,
  useCalendarQuery,
  useCreateCalendarMutation,
  useUpdateCalendarMutation,
  useDeleteCalendarMutation,
  useCalendarSlotsQuery,
  useMergedSlotsQuery,
  useCreateSlotMutation,
  useUpdateSlotMutation,
  useDeleteSlotMutation,
  useBookableCalendarsQuery,
  useCreateBookableCalendarMutation,
  useUpdateBookableCalendarMutation,
  useDeleteBookableCalendarMutation,
  useSlotBookingsQuery,
  useBookSlotMutation,
  useCancelBookingMutation,
  useLockSlotMaterialMutation,
  useUnlockSlotMaterialMutation,
} = calendarApi;
