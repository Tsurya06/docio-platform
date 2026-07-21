import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery.js';
import type { DoctorProfile, PublicDoctorProfile, DoctorAvailability } from '../../types/index.js';

interface DoctorListResponse {
  data: PublicDoctorProfile[];
  total?: number;
}

interface RawPaginatedResponse<T> {
  data: T[];
  meta?: { total?: number };
}

interface DoctorResponse {
  data: {
    doctor: DoctorProfile;
  };
}

interface AvailabilityResponse {
  data: {
    availability: DoctorAvailability;
  };
}

/**
 * doctorApi covers the public-facing doctor surface and the authenticated doctor
 * self-service surface.
 */
export const doctorApi = createApi({
  reducerPath: 'doctorApi',
  baseQuery,
  tagTypes: ['Doctor', 'DoctorList', 'MyDoctorProfile'],
  endpoints: (build) => ({
    searchDoctors: build.query<DoctorListResponse, Record<string, unknown> | void>({
      query: (params) => ({ url: '/doctors', params: params ?? undefined }),
      transformResponse: (response: RawPaginatedResponse<PublicDoctorProfile>): DoctorListResponse => ({
        data: response.data,
        total: response.meta?.total ?? response.data?.length ?? 0,
      }),
      providesTags: (result) =>
        result
          ? [
              ...(result.data ?? []).map(({ _id }) => ({ type: 'Doctor' as const, id: _id })),
              { type: 'DoctorList' as const, id: 'LIST' },
            ]
          : [{ type: 'DoctorList' as const, id: 'LIST' }],
    }),
    getPublicDoctor: build.query<DoctorResponse, string>({
      query: (id) => `/doctors/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Doctor', id }],
    }),
    getDoctorAvailability: build.query<AvailabilityResponse, { id: string; date: string }>({
      query: ({ id, date }) => ({ url: `/doctors/${id}/availability`, params: { date } }),
      providesTags: (_result, _error, { id }) => [{ type: 'Doctor', id }],
    }),
    getMyDoctorProfile: build.query<DoctorResponse, void>({
      query: () => '/doctors/me',
      providesTags: ['MyDoctorProfile'],
    }),
    updateMyDoctorProfile: build.mutation<DoctorResponse, Partial<DoctorProfile>>({
      query: (body) => ({ url: '/doctors/me', method: 'PATCH', body }),
      invalidatesTags: ['MyDoctorProfile'],
    }),
    updateMyAvailability: build.mutation<DoctorResponse, Partial<DoctorProfile>>({
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
