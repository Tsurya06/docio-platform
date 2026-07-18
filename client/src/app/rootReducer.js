import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import { authApi } from '../app/api/authApi.js';
import { patientApi } from '../app/api/patientApi.js';
import { doctorApi } from '../app/api/doctorApi.js';
import { appointmentApi } from '../app/api/appointmentApi.js';
import { adminApi } from '../app/api/adminApi.js';

/**
 * Single source of truth for the Redux root reducer. Feature reducers go here directly;
 * RTK Query endpoints live under their own `reducerPath` keys (`xxxApi`) which must be
 * listed below so their caches attach to the same store as the auth slice. Middleware
 * wiring lives in `store.js` — reducers and middleware are the two halves of an RTK
 * Query setup, but they live in separate files because middleware composition needs the
 * function form while reducers are static.
 */
export const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [patientApi.reducerPath]: patientApi.reducer,
  [doctorApi.reducerPath]: doctorApi.reducer,
  [appointmentApi.reducerPath]: appointmentApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
});
