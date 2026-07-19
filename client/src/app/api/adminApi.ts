import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery.js';
import type { DoctorProfile, PatientProfile, Appointment, AdminDashboardStats } from '../../types/index.js';

interface DashboardResponse {
  data: {
    dashboard: AdminDashboardStats;
  };
}

interface DoctorListResponse {
  data: DoctorProfile[];
  total?: number;
}

interface PatientListResponse {
  data: PatientProfile[];
  total?: number;
}

interface AppointmentListResponse {
  data: Appointment[];
  total?: number;
}

/**
 * adminApi wraps the admin-only endpoints.
 */
export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['AdminDashboard', 'DoctorList', 'PatientList', 'AppointmentList'],
  endpoints: (build) => ({
    getDashboard: build.query<DashboardResponse, void>({
      query: () => '/admin/dashboard',
      providesTags: ['AdminDashboard'],
    }),
    listDoctors: build.query<DoctorListResponse, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/doctors', params: params ?? undefined }),
      providesTags: ['DoctorList'],
    }),
    manageDoctor: build.mutation<DoctorProfile, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/doctors/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['DoctorList', 'AdminDashboard'],
    }),
    listPatients: build.query<PatientListResponse, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/patients', params: params ?? undefined }),
      providesTags: ['PatientList'],
    }),
    listAppointments: build.query<AppointmentListResponse, Record<string, unknown> | void>({
      query: (params) => ({ url: '/admin/appointments', params: params ?? undefined }),
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
