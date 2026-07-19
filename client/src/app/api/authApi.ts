import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, setAccessToken, clearAccessToken } from './baseQuery.js';
import { setCredentials, clearCredentials } from '../../features/auth/authSlice.js';
import type { User } from '../../types/index.js';

interface AuthTokenResponse {
  data: {
    user: User;
    accessToken: string;
  };
}

interface RefreshMeResponse {
  data: {
    user: User;
  };
}

/**
 * authApi wraps the six `/auth/*` endpoints and takes care of the hand-off between the
 * response shape and our local token store.
 */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['Session'],
  endpoints: (build) => ({
    register: build.mutation<AuthTokenResponse, Record<string, unknown>>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        setAccessToken(data?.data?.accessToken ?? null);
        dispatch(setCredentials({ user: data?.data?.user ?? null }));
      },
    }),
    login: build.mutation<AuthTokenResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setAccessToken(data?.data?.accessToken ?? null);
          dispatch(setCredentials({ user: data?.data?.user ?? null }));
        } catch {
          // Don't clear existing creds on a failed login — let the form show the 401.
        }
      },
    }),
    refresh: build.mutation<AuthTokenResponse, void>({
      query: () => ({ url: '/auth/refresh-token', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        setAccessToken(data?.data?.accessToken ?? null);
        dispatch(setCredentials({ user: data?.data?.user ?? null }));
      },
    }),
    logout: build.mutation<void, void>({
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
    getMe: build.query<RefreshMeResponse, void>({
      query: () => '/auth/me',
      providesTags: ['Session'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data?.data?.user ?? null }));
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
    forgotPassword: build.mutation<void, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: build.mutation<void, { token: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    changePassword: build.mutation<void, { currentPassword: string; newPassword: string }>({
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
