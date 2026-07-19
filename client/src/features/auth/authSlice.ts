import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthStatus } from '../../types/index.js';

/**
 * authSlice holds the *client* view of the current session: the user object returned by
 * `/auth/me` (or `null` when logged out) plus a `status` flag used by the router to gate
 * protected routes. The access token is *not* stored here — it lives in module memory
 * inside `baseQuery.ts`.
 */
export interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'unknown',
  error: null,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User | null }>) {
      state.user = action.payload.user ?? null;
      state.status = state.user ? 'authenticated' : 'anonymous';
      state.error = null;
    },
    clearCredentials(state) {
      state.user = null;
      state.status = 'anonymous';
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setAuthError } = slice.actions;

// Selectors — typed via RootState imported lazily to avoid circular imports
export const selectAuth = (state: { auth: AuthState }): AuthState => state.auth;
export const selectCurrentUser = (state: { auth: AuthState }): User | null => state.auth.user;
export const selectAuthStatus = (state: { auth: AuthState }): AuthStatus => state.auth.status;
export const selectCurrentRole = (state: { auth: AuthState }): string | null =>
  state.auth.user?.role ?? null;

export default slice.reducer;
