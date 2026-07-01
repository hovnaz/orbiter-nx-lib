import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';
import { apiClient } from './instance';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(apiClient),
  tagTypes: [
    'Auth',
    'Org',
    'Calendar',
    'Bookable',
    'Booking',
    'MentorInbox',
    'Crm',
    'Media',
    'Permission',
    'Project',
    'ProjectTask',
    'ProjectLabel',
    'CarListing',
    'CarizmaSaved',
    'CarizmaRecent',
    'CarizmaMyCar',
    'CarizmaThread',
    'CarizmaSearch',
    'CarizmaDraft',
    'CarizmaPhoto',
    'CarizmaAnalysis',
    'CarizmaMine',
    'CarizmaAdmin',
  ],
  endpoints: () => ({}),
});
