import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, setAccessToken, clearAccessToken } from './baseQuery.js';
import { setCredentials, clearCredentials } from '../../features/auth/authSlice.js';

/**
 * authApi wraps the six `/auth/*` endpoints and takes care of the hand-off between the
 * response shape and our local token store:
 *
 * - On `register`/`login`/`refresh` success the backend ships `{ user, accessToken }`
 *   in `data` and a new refresh cookie via `Set-Cookie`. We stash the access token in
 *   module scope (`setAccessToken`) and the user in Redux (`setCredentials`). The cookie
 *   is httpOnly so JS can't read it — that's the whole point.
 * - On `logout` we drop the access token and flip the auth status to `anonymous`. The
 *   backend clears the refresh cookie.
 *
 * `getMe` is called once on boot to rehydrate the session from the httpOnly cookie.
 * `invalidatesTags: ['Session']` lets `logout`/`changePassword` trigger a `getMe` refetch
 * if any consumer is using that endpoint's cache.
 */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['Session'],
  endpoints: (build) => ({
    register: build.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        setAccessToken(data?.data?.accessToken ?? null);
        dispatch(setCredentials({ user: data?.data?.user ?? null }));
      },
    }),
    login: build.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setAccessToken(data?.data?.accessToken ?? null);
          dispatch(setCredentials({ user: data?.data?.user ?? null }));
        } catch (err) {
          // Don't clear existing creds on a failed login — let the form show the 401.
        }
      },
    }),
    refresh: build.mutation({
      query: () => ({ url: '/auth/refresh-token', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        setAccessToken(data?.data?.accessToken ?? null);
        dispatch(setCredentials({ user: data?.data?.user ?? null }));
      },
    }),
    logout: build.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          clearAccessToken();
          dispatch(clearCredentials());
        }
      },
    }),
    getMe: build.query({
      query: () => '/auth/me',
      providesTags: ['Session'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // Note: /auth/me returns only { user }, not an accessToken — the access token
        // (if needed) was already obtained by the refresh-on-401 path in baseQuery
        // before this request retried. Don't touch setAccessToken here.
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data?.data?.user ?? null }));
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
    forgotPassword: build.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: build.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
