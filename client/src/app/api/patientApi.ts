import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery.js';
import type { PatientProfile } from '../../types/index.js';

interface PatientProfileResponse {
  data: { profile: PatientProfile };
}

/**
 * patientApi covers the patient's own profile read/update.
 */
export const patientApi = createApi({
  reducerPath: 'patientApi',
  baseQuery,
  tagTypes: ['MyPatientProfile'],
  endpoints: (build) => ({
    getMyPatientProfile: build.query<PatientProfileResponse, void>({
      query: () => '/patients/me',
      providesTags: ['MyPatientProfile'],
    }),
    updateMyPatientProfile: build.mutation<PatientProfileResponse, Partial<PatientProfile>>({
      query: (body) => ({ url: '/patients/me', method: 'PATCH', body }),
      invalidatesTags: ['MyPatientProfile'],
    }),
  }),
});

export const {
  useGetMyPatientProfileQuery,
  useUpdateMyPatientProfileMutation,
} = patientApi;
