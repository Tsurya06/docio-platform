import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery.js';

/**
 * adminApi wraps the four `/admin/*` endpoints + the patient/my-profile endpoint
 * co-located here for bootstrapping convenience (a separate `patientApi` would just be
 * one endpoint). All admin endpoints are behind `requireRole('admin')` on the backend,
 * so unauthorized users see the standard 403 — no extra client guard needed beyond
 * route protection.
 */
export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['AdminDashboard', 'DoctorList', 'PatientList', 'AppointmentList'],
  endpoints: (build) => ({
    getDashboard: build.query({
      query: () => '/admin/dashboard',
      providesTags: ['AdminDashboard'],
    }),
    listDoctors: build.query({
      query: (params) => ({ url: '/admin/doctors', params }),
      providesTags: ['DoctorList'],
    }),
    manageDoctor: build.mutation({
      query: ({ id, body }) => ({ url: `/admin/doctors/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['DoctorList', 'AdminDashboard'],
    }),
    listPatients: build.query({
      query: (params) => ({ url: '/admin/patients', params }),
      providesTags: ['PatientList'],
    }),
    listAppointments: build.query({
      query: (params) => ({ url: '/admin/appointments', params }),
      providesTags: ['AppointmentList'],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useListDoctorsQuery,
  useManageDoctorMutation,
  useListPatientsQuery,
  useListAppointmentsQuery,
} = adminApi;
