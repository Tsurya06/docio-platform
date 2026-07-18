import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery.js';

/**
 * doctorApi covers the public-facing doctor surface (search/list + per-doctor profile +
 * availability) and the authenticated doctor self-service surface (my profile, my
 * availability, my appointments header used by dashboard widgets). Admin actions on
 * doctors live in `adminApi` to keep the role boundary obvious in the network panel.
 *
 * Tags: a doctor's profile/availability/public listing are all `Doctor {id}`; `list`
 * is keyed as `Doctor LIST` so a profile update can't accidentally invalidate the wrong
 * cache entry (we never want a single-item update to refetch the whole list under the
 * same tag).
 */
export const doctorApi = createApi({
  reducerPath: 'doctorApi',
  baseQuery,
  tagTypes: ['Doctor', 'DoctorList'],
  endpoints: (build) => ({
    searchDoctors: build.query({
      query: (params) => ({ url: '/doctors', params }),
      providesTags: (result) =>
        result
          ? [
              ...(result.data ?? []).map(({ _id }) => ({ type: 'Doctor', id: _id })),
              { type: 'DoctorList', id: 'LIST' },
            ]
          : [{ type: 'DoctorList', id: 'LIST' }],
    }),
    getPublicDoctor: build.query({
      query: (id) => `/doctors/${id}`,
      providesTags: (result, error, id) => [{ type: 'Doctor', id }],
    }),
    getDoctorAvailability: build.query({
      query: ({ id, date }) => ({ url: `/doctors/${id}/availability`, params: { date } }),
      providesTags: (result, error, { id }) => [{ type: 'Doctor', id, sub: 'availability' }],
    }),
    getMyDoctorProfile: build.query({
      query: () => '/doctors/me',
      providesTags: ['MyDoctorProfile'],
    }),
    updateMyDoctorProfile: build.mutation({
      query: (body) => ({ url: '/doctors/me', method: 'PATCH', body }),
      invalidatesTags: ['MyDoctorProfile'],
    }),
    updateMyAvailability: build.mutation({
      query: (body) => ({ url: '/doctors/me/availability', method: 'PUT', body }),
      invalidatesTags: ['MyDoctorProfile'],
    }),
  }),
});

export const {
  useSearchDoctorsQuery,
  useGetPublicDoctorQuery,
  useGetDoctorAvailabilityQuery,
  useGetMyDoctorProfileQuery,
  useUpdateMyDoctorProfileMutation,
  useUpdateMyAvailabilityMutation,
} = doctorApi;
