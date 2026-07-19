import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer.js';
import { authApi } from '../app/api/authApi.js';
import { patientApi } from '../app/api/patientApi.js';
import { doctorApi } from '../app/api/doctorApi.js';
import { appointmentApi } from '../app/api/appointmentApi.js';
import { adminApi } from '../app/api/adminApi.js';

/**
 * Central Redux store with RTK Query middleware appended.
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({ serializableCheck: { warnAfter: 64 } }).concat(
      authApi.middleware,
      patientApi.middleware,
      doctorApi.middleware,
      appointmentApi.middleware,
      adminApi.middleware,
    ),
});

export type AppDispatch = typeof store.dispatch;
