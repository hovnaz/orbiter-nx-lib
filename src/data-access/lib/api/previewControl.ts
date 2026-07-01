import type { AppDispatch, RootState } from '../store';
import { api } from './api';
import { isPreviewMocked } from './previewMocks';

interface RefetchableEndpoint {
  initiate: (
    arg: unknown,
    options: { subscribe: boolean; forceRefetch: boolean },
  ) => Parameters<AppDispatch>[0];
}

export const refetchPreviewMockedEndpoints =
  () => (dispatch: AppDispatch, getState: () => RootState) => {
    const queries = getState().api.queries;
    for (const entry of Object.values(queries)) {
      if (!entry) continue;
      const name = entry.endpointName;
      if (!name || !isPreviewMocked(name)) continue;
      const endpoint = (
        api.endpoints as unknown as Record<string, RefetchableEndpoint>
      )[name];
      void dispatch(
        endpoint.initiate(entry.originalArgs, {
          subscribe: false,
          forceRefetch: true,
        }),
      );
    }
  };
