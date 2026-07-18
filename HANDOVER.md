# Docio — Doctor Appointment Platform · Handover

Production-quality MERN platform with role-based auth (Patient / Doctor / Admin), JWT access +
hashed-DB refresh tokens, RTK Query + AntD + Zod frontend. This doc is everything the client
needs to run, verify, and hand off the project.

## 1. How to run

**Prerequisites:** Node 20+, MongoDB 7+ running on `localhost:27017`.

```bash
# 1. Backend
cd server
cp .env.example .env
#   set at least: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (≥32 chars each)
#   openssl rand -base64 32   ← generate each
npm install
npm run dev                    # http://localhost:5050  (nodemon auto-reload)

# 2. Frontend (separate shell)
cd client
npm install
npm run dev                    # http://localhost:5173  (proxies /api → 5050)
```

> The backend runs on port **5050** (not 5000) to avoid macOS AirPlay receiver conflicts.

**Seed accounts** (already in the DB from testing):
| Role    | Email             | Password       |
|---------|-------------------|----------------|
| Admin   | admin@docio.test  | Passw0rd123!   |
| Doctor  | doctor@docio.test | Passw0rd123!   |
| Patient | patient@docio.test| Passw0rd123!   |

## 2. Endpoint surface

All APIs under `/api/v1`. Auth: `Bearer <accessToken>` header. Pages below are the browser routes.

| Area      | Method | Path                                | Auth            |
|-----------|--------|-------------------------------------|-----------------|
| Health    | GET    | /health                             | –               |
| Auth      | POST   | /auth/register                      | –               |
|           | POST   | /auth/login                         | –               |
|           | POST   | /auth/refresh-token                 | refresh cookie  |
|           | POST   | /auth/logout                        | cookie/bearer   |
|           | POST   | /auth/forgot-password               | –               |
|           | POST   | /auth/reset-password                | –               |
|           | POST   | /auth/change-password               | bearer          |
|           | GET    | /auth/me                            | bearer          |
| Patient   | GET/PATCH | /patients/me                     | patient         |
| Doctor    | GET/PATCH | /doctors/me                      | doctor          |
|           | PUT    | /doctors/me/availability            | doctor          |
|           | GET    | /doctors/me/appointments            | doctor          |
|           | PATCH  | /doctors/me/appointments/:id        | doctor          |
| Public    | GET    | /doctors                            | –               |
|           | GET    | /doctors/:id                        | –               |
|           | GET    | /doctors/:id/availability           | –               |
| Appt      | POST   | /appointments                       | patient         |
|           | GET    | /appointments/mine                  | patient         |
|           | GET    | /appointments/:id                   | any (ownership) |
|           | PATCH  | /appointments/:id/cancel            | any (ownership) |
|           | PATCH  | /appointments/:id/manage            | doctor          |
| Admin     | GET    | /admin/dashboard                    | admin           |
|           | GET    | /admin/doctors                      | admin           |
|           | PATCH  | /admin/doctors/:id                  | admin           |
|           | GET    | /admin/patients                     | admin           |
|           | GET    | /admin/appointments                 | admin           |

## 3. Verification

A 131-assertion end-to-end harness lives at `/tmp/docio_tests.sh` (run it while the backend
is up). It exercises every flow plus the security edge cases in §4. Last run:

```
Total: 131  |  PASS: 131  |  FAIL: 0
```

Quick spot check by hand:
```bash
curl http://localhost:5050/api/v1/health | jq .          # → status: ok
curl http://localhost:5050/api/v1/doctors | jq .          # → public search
```

Frontend production build is clean:
```bash
cd client && npx vite build   # → 3061 modules transformed, ✓ built
```

## 4. Security verified

- **Auth:** duplicate email → 409; bad password / unknown email → identical `INVALID_CREDENTIALS`
  (no account enumeration); inactive user → 401 `ACCOUNT_INACTIVE`.
- **Refresh tokens:** opaque 48-byte random, stored **SHA-256 + pepper hashed** in DB (DB leak
  can't forge tokens), 7-day httpOnly cookie. Rotation on every refresh; reuse of a rotated token
  is detected → the entire token family is burned and 401'd.
- **Access tokens:** 15-min JWT, in-memory only. Tampered signature → 401; expired → 401.
- **Forgot/reset password:** forgot always returns 200 regardless of email existence
  (no enumeration); reset consumes token + revokes ALL sessions on success (OWASP).
- **RBAC:** every role-gated route returns 403 `ROLE_FORBIDDEN` for the wrong role; admin is
  blocked from patient/doctor-only actions, and vice-versa. No-token → 401.
- **Ownership:** appointments enforce patient/doctor ownership (`APPOINTMENT_NOT_OWNED` 403);
  a doctor's manage endpoint is scoped by `doctorId` (other doctors get 404, not the data).
- **Admin bypass:** admin role skips ownership checks via the same appointment code path.
- **No existence leak:** public doctor profile of an unapproved doctor → 404 (filtered by
  `isApproved + isActive`); no `userId` exposed in any public response.
- **Input validation:** Zod at the route boundary on every mutation; NoSQL-injection-style
  params (`$ne`) coerce harmlessly through Zod string parsing.

## 5. Frontend ↔ backend contracts (the recurring bug class)

The bugs found during this audit were almost all **contract drift** between the frontend and the
backend response envelope. The canonical shapes (now consistent everywhere):

- **Single resource:** `ApiResponse.ok({ doctor })` / `({ profile })` / `({ availability })` /
  `({ appointment })` → `{ success, data: { <key>: {...} } }`.
- **Paginated list:** `ApiResponse.paginated(...)` → `{ success, data: [ ... ], meta: { page, limit, total, totalPages } }`.
- **Admin doctor/patient rows:** `userId` field is **stripped** and replaced by a populated
  `user` object (`{ _id, email, firstName, lastName, isActive, createdAt, lastLoginAt }`).
- **Appointment detail (all views):** populated as `patient: { _id, name }` and
  `doctor: { _id, specialization, name }` — *not* `patientId`/`doctorId`. Frontend pages read `a.patient?.name`.

If a future change adds a list endpoint, follow those shapes and the frontend pages will work
without edits.

## 6. Bugs fixed in this final audit

| # | Bug | Root cause | Fix |
|---|-----|-----------|-----|
| 1 | `doc.toProfile is not a function` on admin PATCH /doctors/:id | `doctorService.setApproved`/`setActive` returned `.toProfile()` output (a plain object), then `adminController.toAdminDoctorView` called `.toProfile()` again | Service returns raw Mongoose docs; controller shapes once |
| 2 | `a.toDetail is not a function` on admin GET /appointments | Same double-shape: `appointmentService.listForAdmin` pre-mapped `.toDetail()`, controller called it again | Service returns raw docs; controller shapes |
| 3 | Admin doctor/patient tables showed `—` for name & email | Backend returns `user` object; frontend read `dataIndex: 'userId'` | `AdminDoctorsPage`/`AdminPatientsPage` read `'user'` |
| 4 | Admin appointments table showed `—` for patient & doctor | `toDetail()` returns `patient`/`doctor` objects; frontend read `patientId`/`doctorId` | `AdminAppointmentsPage` reads `a.patient?.name` / `a.doctor` |
| 5 | manage-doctor response had `user: null` | `setApproved`/`setActive` didn't populate `userId` | repository populates `userId` on both |
| 6 | Deactivated doctor could never be reactivated (enum missing `activate`) | `manageDoctorSchema` allowed only `approve|reject|deactivate` | Added `activate` action (schema + service + Activate button in UI) |
| 7 | Patient "Date of birth" field showed **Invalid input** for every picked date | `zodValidator(profileUpdateSchema)` validated the DatePicker's **dayjs** value against the `dateOfBirth` sub-schema which expects a **string** → both `.or()` branches fail → `invalid_union` message "Invalid input" | Replaced with a dayjs-aware validator (+ `disabledDate` for future dates); dropped the dead `profileUpdateSchema`/`zodValidator` imports |
| 8 | Saving a patient profile with a cleared/never-set DOB or gender → **400** (a DOB-less patient could not save the form at all) | Client always sends `dateOfBirth: ''` / `gender: ''` for empty fields; backend `z.string().date()` rejects `''`, `z.enum()` rejects `''` | Backend `patchProfileSchema` now `preprocess`-strips empty strings + nulls to "absent" (PATCH leave-unchanged semantic), applied recursively to nested address/emergencyContact |

## 7. Known follow-ups / polish (none block handover)

- **Access token has no `iat`/`jti` claim** (`server/src/utils/token.js`). Two tokens issued in the
  same second are byte-identical. Not a security hole — entropy + revocation live in the refresh
  token — but if anyone ever logs tokens for correlation/provenance, add a `jwtid` to `signAccessToken`.
- **antd chunk is ~1 MB** in the production build. AntD is heavy by nature; manualChunks already
  splits react-core/redux/antd. If first-paint matters, consider `babel-plugin-import` or dynamic
  imports for the heavier AntD components. Pure size, no correctness impact.
- **Email is dev-only:** `MAIL_*`/`SMTP_*` unset → the mailer logs the reset URL to Pino instead of
  sending mail. Set SMTP vars in `.env` for real password-reset emails.
- **No automated test suite checked into the repo.** The `/tmp/docio_tests.sh` harness verifies the
  running system; consider porting its assertions into `vitest`/`supertest` for CI.

## 8. Architecture pointers for the client team

- Feature-sliced: `server/src/features/<feature>/` each with `routes → controller → service → repository → model → schema`.
- `feature` services never import auth (one-way layering): users enter only via the auth register
  flow, which provisions the Patient/Doctor shell record.
- Validation is a single `validate(schema)` middleware (route boundary); errors funnel through
  `error.middleware.js` (ZodError → 400, ApiError → its status, else 500).
- The appointment ownership check normalizes populated-vs-bare ObjectIds (`idOf()` in
  `appointment.service.js`) — essential because `findByIdPopulated` and the admin `runQuery` path
  populate differently. Touch this and re-read that helper.
