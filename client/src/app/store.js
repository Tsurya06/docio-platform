import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer.js';
import { authApi } from '../app/api/authApi.js';
import { patientApi } from '../app/api/patientApi.js';
import { doctorApi } from '../app/api/doctorApi.js';
import { appointmentApi } from '../app/api/appointmentApi.js';
import { adminApi } from '../app/api/adminApi.js';

/**
 * Central Redux store. RTK Query middleware must be appended to the default middleware
 * (the order matters: `getDefault` includes the redux-thunk middleware that lets APIs
 * fire `onQueryStarted` callbacks; appending after means the cache can dispatch its own
 * invalidate/refetch actions). The serializable check is kept (default RTK behavior) but
 * with `warnAfter` raised slightly so legitimate non-serializable values (e.g., AntD
 * `dayjs` instances in form payloads) do not log-thrash during normal usage.
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({ serializableCheck: { warnAfter: 64 } })
      .concat(
        authApi.middleware,
        patientApi.middleware,
        doctorApi.middleware,
        appointmentApi.middleware,
        adminApi.middleware,
      ),
});
