import { type ApiClientHandlers, createApiClient } from './client';

const noopString = (): string | null => null;
const noop = () => undefined;

let current: ApiClientHandlers = {
  getToken: noopString,
  getRefreshToken: noopString,
  getEmail: noopString,
  getOrgId: noopString,
  onRefreshSuccess: noop,
  onUnauthorized: noop,
};

export function configureApiClient(handlers: ApiClientHandlers): void {
  current = handlers;
}

export const apiClient = createApiClient({
  getToken: () => current.getToken(),
  getRefreshToken: () => current.getRefreshToken(),
  getEmail: () => current.getEmail(),
  getOrgId: () => current.getOrgId(),
  onRefreshSuccess: (data) => current.onRefreshSuccess(data),
  onUnauthorized: () => current.onUnauthorized(),
});
