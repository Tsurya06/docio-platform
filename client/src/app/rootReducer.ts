import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import { authApi } from '../app/api/authApi.js';
import { patientApi } from '../app/api/patientApi.js';
import { doctorApi } from '../app/api/doctorApi.js';
import { appointmentApi } from '../app/api/appointmentApi.js';
import { adminApi } from '../app/api/adminApi.js';

/**
 * Single source of truth for the Redux root reducer.
 */
export const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [patientApi.reducerPath]: patientApi.reducer,
  [doctorApi.reducerPath]: doctorApi.reducer,
  [appointmentApi.reducerPath]: appointmentApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
