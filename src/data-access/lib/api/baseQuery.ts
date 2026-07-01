import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { getPreviewMock } from './previewMocks';

export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
  /**
   * Send cookies with the request (cross-origin too). Off by default so the
   * regular API never leaks cookies; opted into per-endpoint by the federated
   * sign-in calls, which rely on the backend's HttpOnly OAuth state cookie.
   */
  withCredentials?: boolean;
}

export interface AxiosQueryError {
  status?: number;
  data: unknown;
  message: string;
}

export function axiosBaseQuery(
  client: AxiosInstance,
): BaseQueryFn<AxiosBaseQueryArgs, unknown, AxiosQueryError> {
  return async (
    { url, method = 'GET', data, params, headers, withCredentials },
    apiCtx,
  ) => {
    const state = apiCtx.getState() as { preview?: { active?: boolean } };
    if (state.preview?.active) {
      // Pass the request context so inbox mutations can resolve their target
      // (id from the url, feedback from the body) and mutate the demo board.
      const mock = getPreviewMock(apiCtx.endpoint, { url, data, params });
      if (mock !== undefined) {
        return { data: mock };
      }
    }
    try {
      const result = await client.request({
        url,
        method,
        data,
        params,
        headers,
        withCredentials,
      });
      return { data: result.data };
    } catch (e) {
      const err = e as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data ?? null,
          message: err.message,
        },
      };
    }
  };
}
