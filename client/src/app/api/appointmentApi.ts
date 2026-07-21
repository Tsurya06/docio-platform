import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery.js';
import type { Appointment } from '../../types/index.js';

interface RawPaginatedResponse<T> {
  data: T[];
  meta?: { total?: number };
}

interface AppointmentResponse {
  data: Appointment;
}

interface AppointmentListResponse {
  data: Appointment[];
  total?: number;
}

/**
 * appointmentApi covers the patient + doctor appointment surface.
 */
export const appointmentApi = createApi({
  reducerPath: 'appointmentApi',
  baseQuery,
  tagTypes: ['Appointment'],
  endpoints: (build) => ({
    createAppointment: build.mutation<AppointmentResponse, Record<string, unknown>>({
      query: (body) => ({ url: '/appointments', method: 'POST', body }),
      invalidatesTags: ['Appointment'],
    }),
    listMyAppointments: build.query<AppointmentListResponse, Record<string, unknown> | void>({
      query: (params) => {
        if (!params) return { url: '/appointments/mine' };
        const { status, ...rest } = params;
        const queryParams: Record<string, unknown> = { ...rest };
        if (Array.isArray(status) && status.length) {
          queryParams.status = status.join(',');
        } else if (status) {
          queryParams.status = status;
        }
        return { url: '/appointments/mine', params: queryParams };
      },
      transformResponse: (response: RawPaginatedResponse<Appointment>): AppointmentListResponse => ({
        data: response.data,
        total: response.meta?.total ?? response.data?.length ?? 0,
      }),
      providesTags: ['Appointment'],
    }),
    getAppointment: build.query<AppointmentResponse, string>({
      query: (id) => `/appointments/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Appointment', id }],
    }),
    cancelAppointment: build.mutation<AppointmentResponse, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/appointments/${id}/cancel`, method: 'PATCH', body }),
      invalidatesTags: ['Appointment'],
    }),
    listDoctorAppointments: build.query<AppointmentListResponse, Record<string, unknown> | void>({
      query: (params) => {
        if (!params) return { url: '/doctors/me/appointments' };
        const { status, ...rest } = params;
        const queryParams: Record<string, unknown> = { ...rest };
        if (Array.isArray(status) && status.length) {
          queryParams.status = status.join(',');
        } else if (status) {
          queryParams.status = status;
        }
        return { url: '/doctors/me/appointments', params: queryParams };
      },
      transformResponse: (response: RawPaginatedResponse<Appointment>): AppointmentListResponse => ({
        data: response.data,
        total: response.meta?.total ?? response.data?.length ?? 0,
      }),
      providesTags: ['Appointment'],
    }),
    manageAppointment: build.mutation<AppointmentResponse, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/appointments/${id}/manage`, method: 'PATCH', body }),
      invalidatesTags: ['Appointment'],
    }),
  }),
});

export const {
  useCreateAppointmentMutation,
  useListMyAppointmentsQuery,
  useGetAppointmentQuery,
  useCancelAppointmentMutation,
  useListDoctorAppointmentsQuery,
  useManageAppointmentMutation,
} = appointmentApi;
