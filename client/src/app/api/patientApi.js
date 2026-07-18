import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery.js';

/**
 * patientApi covers the patient's own profile read/update. Doctor-side profile lives in
 * `doctorApi` (different shape: working hours, specialty). Admin listing lives in
 * `adminApi`. Both patients and admins ultimately read the same `/patients/me` shape;
 * admin-patient-detail reads not yet added — out of scope for Step 12 scaffolding.
 */
export const patientApi = createApi({
  reducerPath: 'patientApi',
  baseQuery,
  tagTypes: ['MyPatientProfile'],
  endpoints: (build) => ({
    getMyPatientProfile: build.query({
      query: () => '/patients/me',
      providesTags: ['MyPatientProfile'],
    }),
    updateMyPatientProfile: build.mutation({
      query: (body) => ({ url: '/patients/me', method: 'PATCH', body }),
      invalidatesTags: ['MyPatientProfile'],
    }),
  }),
});

export const {
  useGetMyPatientProfileQuery,
  useUpdateMyPatientProfileMutation,
} = patientApi;
