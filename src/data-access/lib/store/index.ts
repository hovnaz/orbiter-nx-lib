import { configureStore } from '@reduxjs/toolkit';
import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import { api } from '../api/api';
import { configureApiClient } from '../api/instance';
import {
  authSlice,
  logout,
  selectAccessToken,
  selectCurrentOrg,
  selectRefreshToken,
  selectUserEmail,
  setTokens,
} from './slices/authSlice';
import { previewSlice } from './slices/previewSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    preview: previewSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

configureApiClient({
  getToken: () => selectAccessToken(store.getState()),
  getRefreshToken: () => selectRefreshToken(store.getState()),
  getEmail: () => selectUserEmail(store.getState()),
  getOrgId: () => selectCurrentOrg(store.getState())?.id ?? null,
  onRefreshSuccess: (data) =>
    store.dispatch(
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }),
    ),
  onUnauthorized: () => store.dispatch(logout()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
