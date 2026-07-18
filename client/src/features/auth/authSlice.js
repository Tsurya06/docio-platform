import { createSlice } from '@reduxjs/toolkit';

/**
 * authSlice holds the *client* view of the current session: the user object returned by
 * `/auth/me` (or `null` when logged out) plus a `status` flag used by the router to gate
 * protected routes. The access token is *not* stored here — it lives in module memory
 * inside `baseQuery.js` (see rationale there). On reload the slice boots as `unknown`,
 * the `App` component calls `getMe`, and the resulting user (or 401) flips `status` to
 * `authenticated` or `anonymous`.
 */
const initialState = {
  user: null,
  status: 'unknown', // 'unknown' | 'authenticated' | 'anonymous'
  error: null,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user ?? null;
      state.status = state.user ? 'authenticated' : 'anonymous';
      state.error = null;
    },
    clearCredentials(state) {
      state.user = null;
      state.status = 'anonymous';
      state.error = null;
    },
    setAuthError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setAuthError } = slice.actions;
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectCurrentRole = (state) => state.auth.user?.role ?? null;

export default slice.reducer;
