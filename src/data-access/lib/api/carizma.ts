/**
 * Carizma API — backed by the standalone carizma-backend microservice.
 *
 * Listings (search, public detail, draft flow), favorites and recently-viewed
 * history, plus the vehicle catalog (makes, reference dictionaries) all hit real
 * endpoints. Still mock until the backend grows the features: my-cars engagement
 * counters, saved searches and message threads.
 */

import type {
  AdminListListingsArgs,
  CarizmaAnalysisResponse,
  CarizmaFavoriteToggleResponse,
  CarizmaListingDetailResponse,
  CarizmaListingResponse,
  CarizmaListingSearchArgs,
  CarizmaListingsPageResponse,
  CarizmaListingSummaryResponse,
  CarizmaMakeResponse,
  CarizmaModelResponse,
  CarizmaPhotoResponse,
  CarizmaRejectListingRequest,
  CarizmaReferenceItem,
  CarizmaReferencesResponse,
  CarizmaSearchPageResponse,
  CarizmaSubmitListingRequest,
  CarListing,
  CarListingDetail,
  CarCurrency,
  ListMyListingsArgs,
  MessageThread,
  MyCarSummary,
  SavedSearch,
} from '#types';
import { api } from './api';
import type { AxiosQueryError } from './baseQuery';
import { v } from './version';

type QueryReturn<T> =
  | { data: T; error?: never }
  | { data?: never; error: AxiosQueryError };

const ok = <T,>(data: T): QueryReturn<T> => ({ data });

// ── Static decorative assets (login hero etc. — not car data) ──────────────

export const CARIZMA_PHOTOS = {
  hero_m4: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=2000&q=80&auto=format&fit=crop',
  hero_porsche: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2000&q=80&auto=format&fit=crop',
  hero_night: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=2000&q=80&auto=format&fit=crop',
  hero_showroom: 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=2000&q=80&auto=format&fit=crop',
} as const;

// ── Backend summary → card view-model mapping ──────────────────────────────

/** Major-units price for display. Backend stores cents/копейки for USD/RUB; AMD is whole драмы. */
function toMajorUnits(price: number | null | undefined, currency: CarCurrency | null | undefined): number {
  if (price == null) return 0;
  if (currency === 'AMD') return price;
  return Math.round(price / 100);
}

/** Card labels stay English for now; full ref-based localisation is a follow-up. */
function refLabel(item: CarizmaReferenceItem | null | undefined): string {
  return item?.nameEn ?? '';
}

function engineLabel(displacementCc: number | null | undefined): string | undefined {
  if (displacementCc == null) return undefined;
  return `${(displacementCc / 1000).toFixed(1)}L`;
}

export function toCarListing(s: CarizmaListingSummaryResponse): CarListing {
  const brand = s.vehicle?.make ?? s.fallbackMake ?? '—';
  const model = s.vehicle?.model ?? s.fallbackModel ?? '';
  return {
    id: s.id,
    brand,
    model,
    trim: s.vehicle?.complectation ?? undefined,
    year: s.year ?? 0,
    title: [brand, model].filter(Boolean).join(' '),
    price: toMajorUnits(s.price, s.currency),
    currency: s.currency ?? 'USD',
    mileage: s.mileageKm ?? 0,
    fuel: refLabel(s.fuelType),
    transmission: refLabel(s.transmissionType),
    power: s.powerHp ?? undefined,
    engine: engineLabel(s.engineDisplacementCc),
    drive: s.driveType?.code?.toUpperCase() ?? '',
    color: s.exteriorColor?.nameEn ?? undefined,
    body: s.bodyType?.code ?? '',
    city: s.locationCity ?? '',
    // Deal rating / engagement flags are not computed server-side yet.
    deal: undefined,
    featured: false,
    reduced: false,
    isNew: false,
    verified: false,
    has360: false,
    image: s.primaryPhotoUrl ?? undefined,
  };
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * Public detail → the rich CarListingDetail the details view renders.
 * History / service records / seller profiles / view counters do not exist
 * on the backend yet, so they degrade to empty lists and a neutral seller stub.
 */
function toCarListingDetail(res: CarizmaListingDetailResponse): CarListingDetail {
  const l = res.listing;
  const summaryLike: CarizmaListingSummaryResponse = {
    ...l,
    primaryPhotoUrl: res.photos.find((p) => p.primary)?.cdnUrl ?? res.photos[0]?.cdnUrl ?? null,
  };
  const card = toCarListing(summaryLike);
  const images = res.photos.map((p) => p.cdnUrl);
  return {
    ...card,
    power: l.powerHp ?? 0,
    engine: engineLabel(l.engineDisplacementCc) ?? '—',
    interior: l.interiorMaterial?.nameEn ?? undefined,
    description: l.description ? l.description.split(/\n{2,}/) : [],
    images: images.length ? images : undefined,
    vin: l.vin ?? '—',
    history: [],
    service: [],
    seller: {
      id: 'seller',
      name: 'Carizma seller',
      type: 'Private seller',
      verified: false,
      rating: 0,
      reviewCount: 0,
      joinedYear: new Date(l.createdAt).getFullYear(),
      responseTimeHrs: 0,
      city: l.locationCity ?? '',
      initials: 'CS',
    },
    views: 0,
    daysListed: daysSince(l.publishedAt ?? l.createdAt),
  };
}

/**
 * Spring binds `?makeIds=a,b` to List params; axios would serialize arrays as
 * `makeIds[]=a&makeIds[]=b`, which Spring does not bind — so join them here.
 */
function toSearchParams(args: CarizmaListingSearchArgs | undefined): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (!args) return params;
  const set = (key: string, value: string | number | undefined | null) => {
    if (value !== undefined && value !== null && value !== '') params[key] = value;
  };
  set('query', args.query);
  set('condition', args.condition);
  set('makeIds', args.makeIds?.join(','));
  set('modelIds', args.modelIds?.join(','));
  set('bodyTypes', args.bodyTypes?.join(','));
  set('fuelTypes', args.fuelTypes?.join(','));
  set('transmission', args.transmission);
  set('colors', args.colors?.join(','));
  set('priceFrom', args.priceFrom);
  set('priceTo', args.priceTo);
  set('yearFrom', args.yearFrom);
  set('yearTo', args.yearTo);
  set('mileageFrom', args.mileageFrom);
  set('mileageTo', args.mileageTo);
  set('locationCity', args.locationCity);
  set('sort', args.sort);
  set('limit', args.limit);
  set('offset', args.offset);
  return params;
}

export interface CarizmaSearchResult {
  items: CarListing[];
  total: number;
}

// ── Cabinet mocks (no backend yet: favorites, threads, saved searches) ─────

const seedMyCars: MyCarSummary[] = [];

const seedSavedSearches: SavedSearch[] = [
  { id: 's1', name: 'BMW M3 / M4 under $80k', filters: 'BMW · M3, M4 · under $80,000 · 2018+', newCount: 24, total: 86 },
  { id: 's2', name: 'Electric, Yerevan, AWD', filters: 'Electric · AWD · within 50km of Yerevan', newCount: 6, total: 31 },
  { id: 's3', name: 'Diesel wagons, low km', filters: 'Wagon · Diesel · under 80,000 km', newCount: 0, total: 12 },
];

const seedThreads: MessageThread[] = [
  { id: 't1', name: 'Davit Sargsyan', car: 'BMW M4 Competition', preview: "Hi — is the M Driver's package documentation included?", time: '12:48', unread: 2, online: true, initials: 'DS' },
  { id: 't2', name: 'Lilit Manukyan', car: 'Porsche Taycan 4S', preview: 'Yes, available this Saturday after 14:00 in Yerevan.', time: '11:02', unread: 0, online: false, initials: 'LM' },
  { id: 't3', name: 'Tigran Petrosyan', car: 'Land Cruiser 300', preview: 'Sent the bank pre-approval to your inbox.', time: 'Yest.', unread: 0, online: false, initials: 'TP' },
];

// ── RTK Query endpoints ─────────────────────────────────────────────────────

export const carizmaApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Server-side filtered + paged search over PUBLISHED listings. */
    searchListings: build.query<CarizmaSearchResult, CarizmaListingSearchArgs | void>({
      query: (args) => ({
        url: v('/carizma/listings/search'),
        params: toSearchParams(args ?? undefined),
      }),
      transformResponse: (res: CarizmaSearchPageResponse): CarizmaSearchResult => ({
        items: res.items.map(toCarListing),
        total: res.total,
      }),
      providesTags: [{ type: 'CarListing' as const, id: 'SEARCH' }],
    }),

    /** Latest published listings — Home "featured" rail and similar-cars fallbacks. */
    listListings: build.query<CarListing[], void>({
      query: () => ({
        url: v('/carizma/listings/search'),
        params: { limit: 24, sort: 'NEWEST' },
      }),
      transformResponse: (res: CarizmaSearchPageResponse): CarListing[] =>
        res.items.map(toCarListing),
      providesTags: [{ type: 'CarListing' as const, id: 'LIST' }],
    }),

    /** Public listing detail (PUBLISHED only). */
    getListing: build.query<CarListingDetail, { id: string }>({
      query: ({ id }) => ({
        url: v(`/carizma/listings/${encodeURIComponent(id)}`),
      }),
      transformResponse: (res: CarizmaListingDetailResponse) => toCarListingDetail(res),
      providesTags: (_res, _err, arg) => [{ type: 'CarListing' as const, id: arg.id }],
    }),

    /**
     * Raw listing payload (ref codes intact, untransformed) for the owner edit
     * form — the display query above maps dictionary fields to labels, which the
     * form can't submit back. Shares the CarListing cache tag so an edit refetches.
     */
    getListingEdit: build.query<CarizmaListingResponse, { id: string }>({
      query: ({ id }) => ({
        url: v(`/carizma/listings/${encodeURIComponent(id)}`),
      }),
      transformResponse: (res: CarizmaListingDetailResponse) => res.listing,
      providesTags: (_res, _err, arg) => [{ type: 'CarListing' as const, id: arg.id }],
    }),

    /** Catalog makes — the brand filter on /browse and the Home hero search. */
    listMakes: build.query<CarizmaMakeResponse[], void>({
      query: () => ({ url: v('/carizma/catalog/makes') }),
    }),

    /** Catalog models under a make — the model filter (depends on the chosen make). */
    listModels: build.query<CarizmaModelResponse[], { makeId: string }>({
      query: ({ makeId }) => ({
        url: v('/carizma/catalog/models'),
        params: { makeId },
      }),
    }),

    /** ref_* dictionaries — body/fuel/transmission/drive/color filter options. */
    listReferences: build.query<CarizmaReferencesResponse, void>({
      query: () => ({ url: v('/carizma/catalog/references') }),
    }),

    /** The caller's favorited listings, newest first. */
    listSavedListings: build.query<CarListing[], void>({
      query: () => ({ url: v('/carizma/listings/favorites') }),
      transformResponse: (res: CarizmaListingSummaryResponse[]) => res.map(toCarListing),
      providesTags: [{ type: 'CarizmaSaved', id: 'LIST' }],
    }),

    /** Add/remove a listing from the caller's favorites; returns the new state. */
    toggleSaved: build.mutation<CarizmaFavoriteToggleResponse, { id: string }>({
      query: ({ id }) => ({
        url: v(`/carizma/listings/${encodeURIComponent(id)}/favorite`),
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'CarizmaSaved', id: 'LIST' }],
    }),

    listMyCars: build.query<MyCarSummary[], void>({
      queryFn: () => ok(seedMyCars),
      providesTags: [{ type: 'CarizmaMyCar', id: 'LIST' }],
    }),

    listSavedSearches: build.query<SavedSearch[], void>({
      queryFn: () => ok(seedSavedSearches),
      providesTags: [{ type: 'CarizmaSearch', id: 'LIST' }],
    }),

    listMessageThreads: build.query<MessageThread[], void>({
      queryFn: () => ok(seedThreads),
      providesTags: [{ type: 'CarizmaThread', id: 'LIST' }],
    }),

    /** The caller's recently-viewed listings, most recent first (server-tracked). */
    listRecentlyViewed: build.query<CarListing[], void>({
      query: () => ({ url: v('/carizma/listings/recently-viewed') }),
      transformResponse: (res: CarizmaListingSummaryResponse[]) => res.map(toCarListing),
      providesTags: [{ type: 'CarizmaRecent', id: 'LIST' }],
    }),

    /** Records that the caller opened a listing; refreshes the recently-viewed list. */
    recordRecentlyViewed: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: v(`/carizma/listings/${encodeURIComponent(id)}/view`),
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'CarizmaRecent', id: 'LIST' }],
    }),

    // ── Backend-backed listing draft flow ────────────────────────────────
    // The wizard at libs/carizma/feature/.../CarizmaSellForm.tsx walks the
    // user through: createDraft → uploadPhoto (per file) → getAnalysis →
    // submitListing. listMyListings powers the "My listings" view. All five
    // hit the real `/v1/carizma/listings/...` endpoints.

    createDraft: build.mutation<CarizmaListingResponse, void>({
      query: () => ({
        url: v('/carizma/listings'),
        method: 'POST',
        data: {},
      }),
      invalidatesTags: [{ type: 'CarizmaMine', id: 'LIST' }],
    }),

    uploadListingPhoto: build.mutation<
      CarizmaPhotoResponse,
      { listingId: string; file: File }
    >({
      query: ({ listingId, file }) => {
        const form = new FormData();
        form.append('file', file, file.name);
        return {
          url: v(`/carizma/listings/${encodeURIComponent(listingId)}/photos`),
          method: 'POST',
          data: form,
          // axios derives Content-Type with the multipart boundary on its own
        };
      },
      invalidatesTags: (_r, _e, { listingId }) => [
        { type: 'CarizmaAnalysis', id: listingId },
        { type: 'CarizmaPhoto', id: `LIST:${listingId}` },
      ],
    }),

    deleteListingPhoto: build.mutation<
      void,
      { listingId: string; photoId: string }
    >({
      query: ({ listingId, photoId }) => ({
        url: v(
          `/carizma/listings/${encodeURIComponent(listingId)}/photos/${encodeURIComponent(photoId)}`,
        ),
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { listingId }) => [
        { type: 'CarizmaAnalysis', id: listingId },
        { type: 'CarizmaPhoto', id: `LIST:${listingId}` },
      ],
    }),

    getListingAnalysis: build.query<
      CarizmaAnalysisResponse,
      { listingId: string }
    >({
      query: ({ listingId }) => ({
        url: v(
          `/carizma/listings/${encodeURIComponent(listingId)}/analysis`,
        ),
      }),
      providesTags: (_r, _e, { listingId }) => [
        { type: 'CarizmaAnalysis', id: listingId },
      ],
    }),

    submitListing: build.mutation<
      CarizmaListingResponse,
      { listingId: string; body: CarizmaSubmitListingRequest }
    >({
      query: ({ listingId, body }) => ({
        url: v(`/carizma/listings/${encodeURIComponent(listingId)}/submit`),
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_r, _e, { listingId }) => [
        { type: 'CarizmaMine', id: 'LIST' },
        { type: 'CarizmaDraft', id: listingId },
      ],
    }),

    /**
     * Owner edit of an existing listing (PUT /carizma/listings/{id}). Re-applies
     * all fields, keeps the status. Invalidates the detail + the home/browse/mine
     * lists so the corrected data shows everywhere.
     */
    updateListing: build.mutation<
      CarizmaListingResponse,
      { listingId: string; body: CarizmaSubmitListingRequest }
    >({
      query: ({ listingId, body }) => ({
        url: v(`/carizma/listings/${encodeURIComponent(listingId)}`),
        method: 'PUT',
        data: body,
      }),
      invalidatesTags: (_r, _e, { listingId }) => [
        { type: 'CarListing', id: listingId },
        { type: 'CarListing', id: 'LIST' },
        { type: 'CarListing', id: 'SEARCH' },
        { type: 'CarizmaMine', id: 'LIST' },
      ],
    }),

    listMyListings: build.query<
      CarizmaListingsPageResponse,
      ListMyListingsArgs | void
    >({
      query: (arg) => ({
        url: v('/carizma/listings/mine'),
        params: {
          ...(arg?.status ? { status: arg.status } : {}),
          ...(arg?.limit != null ? { limit: arg.limit } : {}),
          ...(arg?.offset != null ? { offset: arg.offset } : {}),
        },
      }),
      providesTags: (res) =>
        res
          ? [
              { type: 'CarizmaMine' as const, id: 'LIST' },
              ...res.items.map((l) => ({ type: 'CarizmaMine' as const, id: l.id })),
            ]
          : [{ type: 'CarizmaMine' as const, id: 'LIST' }],
    }),

    // ── SuperAdmin moderation (review queue) ──────────────────────────────
    // All five hit /v1/carizma/admin/listings/** behind @RequireSuperAdminRole
    // (Cognito group SUPER_ADMIN). The review tab lists EVERY listing, opens
    // full detail in a side panel, and approves/rejects.

    /** Every listing in the system, optionally filtered by status. Kept raw so the
     *  review cards can show the server status + rejection reason. */
    listAdminListings: build.query<
      CarizmaListingsPageResponse,
      AdminListListingsArgs | void
    >({
      query: (arg) => ({
        url: v('/carizma/admin/listings'),
        params: {
          ...(arg?.status ? { status: arg.status } : {}),
          ...(arg?.limit != null ? { limit: arg.limit } : {}),
          ...(arg?.offset != null ? { offset: arg.offset } : {}),
        },
      }),
      providesTags: (res) =>
        res
          ? [
              { type: 'CarizmaAdmin' as const, id: 'LIST' },
              ...res.items.map((l) => ({ type: 'CarizmaAdmin' as const, id: l.id })),
            ]
          : [{ type: 'CarizmaAdmin' as const, id: 'LIST' }],
    }),

    /**
     * Full detail of a listing in ANY status — drives the review side panel.
     * Returned RAW (untransformed) so the moderation drawer can show every field
     * (ref dictionaries, flags, counts, VIN, equipment) — the lossy buyer-facing
     * `toCarListingDetail` mapping drops most of them.
     */
    getAdminListing: build.query<CarizmaListingDetailResponse, { id: string }>({
      query: ({ id }) => ({
        url: v(`/carizma/admin/listings/${encodeURIComponent(id)}`),
      }),
      providesTags: (_res, _err, arg) => [{ type: 'CarizmaAdmin' as const, id: arg.id }],
    }),

    /** Approve → PUBLISHED. Refreshes the review queue + public listing caches. */
    approveListing: build.mutation<CarizmaListingResponse, { id: string }>({
      query: ({ id }) => ({
        url: v(`/carizma/admin/listings/${encodeURIComponent(id)}/approve`),
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'CarizmaAdmin' as const, id: 'LIST' },
        { type: 'CarizmaAdmin' as const, id },
        { type: 'CarListing' as const, id: 'LIST' },
        { type: 'CarListing' as const, id: 'SEARCH' },
        { type: 'CarListing' as const, id },
      ],
    }),

    /** Reject → REJECTED, with an optional reason shown to the seller. */
    rejectListing: build.mutation<
      CarizmaListingResponse,
      { id: string; body?: CarizmaRejectListingRequest }
    >({
      query: ({ id, body }) => ({
        url: v(`/carizma/admin/listings/${encodeURIComponent(id)}/reject`),
        method: 'POST',
        data: body ?? {},
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'CarizmaAdmin' as const, id: 'LIST' },
        { type: 'CarizmaAdmin' as const, id },
        { type: 'CarListing' as const, id: 'LIST' },
        { type: 'CarListing' as const, id: 'SEARCH' },
        { type: 'CarListing' as const, id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSearchListingsQuery,
  useListListingsQuery,
  useGetListingQuery,
  useGetListingEditQuery,
  useUpdateListingMutation,
  useListMakesQuery,
  useListModelsQuery,
  useListReferencesQuery,
  useListSavedListingsQuery,
  useToggleSavedMutation,
  useListMyCarsQuery,
  useListSavedSearchesQuery,
  useListMessageThreadsQuery,
  useListRecentlyViewedQuery,
  useRecordRecentlyViewedMutation,
  // Real backend hooks (listing draft flow)
  useCreateDraftMutation,
  useUploadListingPhotoMutation,
  useDeleteListingPhotoMutation,
  useGetListingAnalysisQuery,
  useLazyGetListingAnalysisQuery,
  useSubmitListingMutation,
  useListMyListingsQuery,
  // SuperAdmin moderation
  useListAdminListingsQuery,
  useGetAdminListingQuery,
  useApproveListingMutation,
  useRejectListingMutation,
} = carizmaApi;
