import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery.js';

/**
 * appointmentApi covers the patient + doctor appointment surface (create, list mine,
 * read one, cancel; doctor-side manage via `manageAppointment`). Tagging is intentionally
 * coarse — appointment reads need to be invalidated together, e.g. after a create or
 * cancel, so we use a single `Appointment` tag for the per-user listing and a `Mine`
 * sub-tag for "the current user's list".
 *
 * Alternative: per-appointment tags like `Appointment {id}`. Rejected — listings would
 * still need their own invalidation on create (no item id to issue during optimistic
 * flow), and we never edit a single appointment in isolation without also wanting its
 * list invalidated.
 */
export const appointmentApi = createApi({
  reducerPath: 'appointmentApi',
  baseQuery,
  tagTypes: ['Appointment'],
  endpoints: (build) => ({
    createAppointment: build.mutation({
      query: (body) => ({ url: '/appointments', method: 'POST', body }),
      invalidatesTags: ['Appointment'],
    }),
    listMyAppointments: build.query({
      query: (params) => ({ url: '/appointments/mine', params }),
      providesTags: ['Appointment'],
    }),
    getAppointment: build.query({
      query: (id) => `/appointments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Appointment', id }],
    }),
    cancelAppointment: build.mutation({
      query: ({ id, body }) => ({ url: `/appointments/${id}/cancel`, method: 'PATCH', body }),
      invalidatesTags: ['Appointment'],
    }),
    listDoctorAppointments: build.query({
      query: (params) => ({ url: '/doctors/me/appointments', params }),
      providesTags: ['Appointment'],
    }),
    manageAppointment: build.mutation({
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
