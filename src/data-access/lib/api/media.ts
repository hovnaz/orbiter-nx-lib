import type {
  MediaResponse,
  PageResponse,
  Pageable,
} from '#types';
import { api } from './api';
import { v } from './version';

export const mediaApi = api.injectEndpoints({
  endpoints: (build) => ({
    media: build.query<PageResponse<MediaResponse>, Pageable>({
      query: ({ page, size, sort }) => ({
        url: v('/school/media'),
        params: { page, size, ...(sort?.length ? { sort } : {}) },
      }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Media' as const, id: 'LIST' },
              ...result.items.map((m) => ({
                type: 'Media' as const,
                id: m.id,
              })),
            ]
          : [{ type: 'Media' as const, id: 'LIST' }],
    }),
    mediaItem: build.query<MediaResponse, { id: string }>({
      query: ({ id }) => ({
        url: v(`/school/media/${encodeURIComponent(id)}`),
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'Media', id }],
    }),
    uploadMedia: build.mutation<MediaResponse, { file: File }>({
      query: ({ file }) => {
        const form = new FormData();
        form.append('file', file, file.name);
        return {
          url: v('/school/media'),
          method: 'POST',
          data: form,
          // Don't set Content-Type manually — axios derives it (with the
          // multipart boundary) from FormData on its own.
        };
      },
      invalidatesTags: [{ type: 'Media', id: 'LIST' }],
    }),
    deleteMedia: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: v(`/school/media/${encodeURIComponent(id)}`),
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Media', id },
        { type: 'Media', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useMediaQuery,
  useMediaItemQuery,
  useUploadMediaMutation,
  useDeleteMediaMutation,
} = mediaApi;
