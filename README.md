# Docio - Doctor Appointment Booking Platform

A production-quality MERN stack platform for doctor appointment booking with role-based authentication (Patient/Doctor/Admin), secure JWT access tokens, hashed refresh tokens, and comprehensive email notification system.

## 🏥 Overview

Docio is a full-stack doctor appointment booking platform built with MongoDB, Express, React, and Node.js (MERN). It implements role-based access control for three user types:

- **Patients**: Book appointments, manage profiles, view appointment history
- **Doctors**: Manage availability, view/appointments, update profiles  
- **Admins**: Manage doctors/patients, oversee appointments, platform analytics

## 🔑 Key Features

### Authentication & Security
- **Dual-token JWT system**: Short-lived access tokens (15 min) + refresh tokens (7 days)
- **Hashed refresh tokens**: Stored as SHA-256 + pepper in DB (prevents token forgery even if DB leaked)
- **Token rotation**: Refresh tokens rotated on every use; reuse detected → entire token family burned
- **Secure password handling**: Bcrypt hashing with cost factor 12
- **Account enumeration prevention**: Identical error messages for invalid credentials
- **RBAC enforcement**: Role-based access control on all endpoints
- **Ownership validation**: Appointments enforce patient/doctor ownership checks

### Email Notification System
- **Password reset functionality**: Secure password reset with time-limited tokens
- **MailerSend integration**: Uses MailerSend HTTP API for reliable email delivery
- **Fallback mechanisms**: Graceful degradation to dev logger if email service unavailable
- **Security-conscious**: No sensitive data in emails; tokens are single-use and expired on success

### Core Modules
- **Patient Management**: Profile CRUD, medical history, allergies, emergency contacts
- **Doctor Management**: Specialization, availability scheduling, appointment management
- **Appointment Booking**: Slot-based booking, cancellation, rescheduling, management
- **Admin Dashboard**: Overview statistics, user management, appointment oversight
- **Public Doctor Search**: Browse doctors by specialization, name, availability

### Technical Excellence
- **Input validation**: Zod schemas at route boundaries with automatic coercion
- **Error handling**: Centralized error middleware with consistent API responses
- **Performance**: Response compression, efficient database queries with indexing
- **Security headers**: Helmet.js, CORS policies, secure cookie settings
- **Logging**: Structured logging with Pino for production observability

## 📧 Email System Solution

### The Challenge
Initial SMTP configuration with MailerSend encountered persistent SSL/TLS handshake failures:
```
SSL routines:tls_validate_record_header:wrong version number
```

These errors occurred despite correct configuration and were related to:
- Network interference with STARTTLS negotiation
- TLS version compatibility issues between Node.js/nodemailer and MailerSend
- Fireware/proxy restrictions on certain ports

### The Solution
Switched from SMTP to **MailerSend HTTP API** for email delivery:

1. **Removed SMTP dependencies**: Eliminated nodemailer SMTP transport complexity
2. **Implemented direct API integration**: Uses MailerSend's REST API endpoint
3. **Maintained security**: API token stored in environment variables, requests over HTTPS
4. **Added resilience**: Proper error handling, logging, and fallback to dev logger
5. **Preserved functionality**: Identical email content and user experience

### Implementation Details
```javascript
// src/features/auth/mail.service.js
export const mailService = {
  async sendPasswordResetEmail(email, rawToken) {
    const resetUrl = `${env.PUBLIC_APP_URL}/reset-password?token=${rawToken}`;
    const minutes = env.PASSWORD_RESET_EXPIRES_IN_MIN;

    if (!API_TOKEN) {
      // Falls back to dev logger (prints reset URL to console)
      logger.info({ email, resetUrl }, `Password reset email (dev mode)...`);
      return;
    }

    // Direct HTTP API call to MailerSend
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: env.MAIL_FROM },
        to: [{ email: email }],
        subject: 'Reset your Docio password',
        html: `<p>Reset your password (valid for ${minutes} minutes).</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        text: `Reset your password (link valid for ${minutes} minutes):\n${resetUrl}`,
      })
    });

    // Handle API responses appropriately
    // ...
  }
};
```

### Benefits of HTTP API Approach
- **No SSL/TLS negotiation issues**: Bypasses STARTTLS/TLS handshake problems
- **Better reliability**: HTTP API is more consistent than SMTP for transactional emails
- **Enhanced debugging**: Clear API responses and error codes from MailerSend
- **Scalability**: HTTP API handles rate limiting and retries more predictably
- **Simplicity**: Fewer moving parts compared to SMTP connection pooling

## ⚙️ Technology Stack

### Frontend (React/Vite)
- **React 18.3** with Hooks
- **Vite 5.2** for fast development builds
- **Ant Design 5.18** for UI components
- **Redux Toolkit 2.2.5** for state management
- **React Router 6.23.1** for client-side routing
- **Zod 3.23.8** for form validation
- **Dayjs 1.11.11** for date manipulation
- **Ant Design Icons 5.3.7** for consistent iconography

### Backend (Node.js/Express)
- **Node.js >=20.12** (LTS)
- **Express 5.0.0** for REST API
- **MongoDB 7+** with Mongoose 8.5.0 ODM
- **JSONWebToken 9.0.3** for authentication
- **Bcrypt 6.0.0** for password hashing
- **Zod 3.23.8** for request validation
- **Pino 9.3.2** for structured logging
- **Helmet 7.1.0** for security headers
- **Cors 2.8.5** for cross-origin requests
- **Cookie-parser 1.4.7** for cookie handling
- **Compression 1.7.4** for response gzip
- **Nodemailer 9.0.3** (fallback) / MailerSend API (primary)

### Development & DevOps
- **ESLint 9.7.0** with Prettier for code quality
- **Nodemon 3.1.4** for development auto-reload
- **dotenv 17.4.2** for environment management
- **Git** 

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- MongoDB 7+ running locally or accessible via URI
- MailerSend account (for production email delivery)

### Environment Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd docio-platform
   ```

2. Install dependencies for both client and server:
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. Configure environment variables:
   ```bash
   # In server/.env
   NODE_ENV=development
   PORT=5050
   MONGODB_URI=mongodb://localhost:27017/docio
   
   # JWT Secrets (generate with: openssl rand -base64 32)
   JWT_ACCESS_SECRET=your_32_char_min_secret_here
   JWT_REFRESH_SECRET=your_32_char_min_secret_here
   
   # MailerSend Configuration
   MAILERSEND_API_TOKEN=your_mailersend_api_token_here
   MAIL_FROM=no-reply@your-verified-domain.com
   
   # Other settings (defaults usually work)
   PUBLIC_APP_URL=http://localhost:5173
   PASSWORD_RESET_EXPIRES_IN_MIN=15
   ```

4. Start the development servers:
   ```bash
   # Start backend (in server directory)
   npm run dev
   
   # Start frontend (in client directory, in another terminal)
   npm run dev
   
   # Backend will be available at http://localhost:5050
   # Frontend will be available at http://localhost:5173
   ```

### Production Deployment
1. Set `NODE_ENV=production` in `.env`
2. Ensure JWT secrets are strong and securely stored
3. Configure proper `MAIL_FROM` domain with MailerSend
4. Set `PUBLIC_APP_URL` to your production frontend URL
5. Use a process manager like PM2 for Node.js process management
6. Consider using a reverse proxy (NGINX) for SSL termination

## 🔐 Security Considerations

### Authentication Flow
1. User registers/login via `/api/v1/auth/register` or `/login`
2. Server validates credentials, creates user if registering
3. Server issues:
   - Access token (JWT, 15 min expiry) → sent in response body
   - Refresh token (random string) → stored as httpOnly cookie + hashed in DB
4. Client stores access token in memory/localStorage, sends as `Authorization: Bearer <token>` header
5. On access token expiry, client uses refresh token cookie to get new access token via `/auth/refresh-token`
6. Refresh token rotation prevents replay attacks

### Password Reset Security
1. User requests reset via `/api/v1/auth/forgot-password` with email
2. If user exists: generates cryptographically secure random token, stores hashed version in DB
3. Email sent with reset link containing raw token (valid for 15 min)
4. User submits new password + token to `/api/v1/auth/reset-password`
5. Server validates token, hashes new password, marks token used, invalidates ALL user sessions
6. Tokens are single-use and expired immediately after successful reset

### Data Protection
- Passwords: Bcrypt hashed with cost 12
- Refresh tokens: SHA-256 hashed + pepper in DB
- Reset tokens: SHA-256 hashed in DB
- PII: Stored encrypted at rest if required by compliance needs
- Backups: Should be encrypted and access-controlled

## 📁 Project Structure

```
server/
├── src/
│   ├── config/           # Environment configuration
│   ├── features/         # Feature-based modules (auth, patient, doctor, etc.)
│   │   ├── auth/         # Authentication logic
│   │   │   ├── auth.controller.js    # HTTP handlers
│   │   │   ├── auth.service.js       # Business logic
│   │   │   ├── auth.repository.js    # Data access layer
│   │   │   ├── auth.schema.js        # Zod validation schemas
│   │   │   └── mail.service.js       # Email service (MailerSend API)
│   │   ├── patient/      # Patient-specific features
│   │   ├── doctor/       # Doctor-specific features
│   │   ├── appointment/  # Appointment management
│   │   ├── admin/        # Administrative functions
│   │   └── user/         # Shared user model
│   ├── middleware/       # Custom Express middleware (auth, validation, error handling)
│   ├── utils/            # Utility functions (token handling, regex helpers, etc.)
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
client/
├── src/
│   ├── app/              # Redux store, API slices
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-specific pages and components
│   │   ├── auth/         # Login, register, forgot password pages
│   │   ├── patient/      # Patient dashboard and profile pages
│   │   ├── doctor/       # Doctor dashboard and pages
│   │   └── admin/        # Admin dashboard and management pages
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions (currency formatting, etc.)
│   ├── routes/           # React Router configuration
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
```

## 🧪 Testing

### Manual Testing
1. **Health check**: `GET http://localhost:5050/api/v1/health`
2. **User registration**: `POST /api/v1/auth/register`
3. **Login**: `POST /api/v1/auth/login`
4. **Password reset**:
   - Request reset: `POST /api/v1/auth/forgot-password`
   - Check email for reset link
   - Reset password: `POST /api/v1/auth/reset-password`
5. **Protected routes**: Test access with/without valid tokens

### Automated Testing Considerations
While this repository doesn't include automated tests, consider adding:
- **Unit tests**: For utility functions and services
- **Integration tests**: For API endpoints using supertest
- **E2E tests**: For critical user flows using Cypress or Playwright
- **Security tests**: For authentication flows and input validation

### Email Testing
- **Development mode**: Without `MAILERSEND_API_TOKEN`, emails are logged to console
- **Production mode**: With valid API token, emails sent via MailerSend
- **Verify delivery**: Check MailerSend dashboard → Email Activity
- **Test various scenarios**: Valid/invalid emails, expired tokens, etc.

## 📚 API Documentation

### Authentication Endpoints
All endpoints under `/api/v1/auth` unless specified.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/register` | Register new user (patient/doctor) | No |
| `POST` | `/login` | Login user | No |
| `POST` | `/refresh-token` | Get new access token using refresh cookie | No (cookie) |
| `POST` | `/logout` | Logout user (clears refresh cookie) | No (cookie) |
| `POST` | `/forgot-password` | Request password reset email | No |
| `POST` | `/reset-password` | Reset password with token | No |
| `POST` | `/change-password` | Change password (requires current password) | Yes (Bearer) |
| `GET` | `/me` | Get current user profile | Yes (Bearer) |

### Patient Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/patients/me` | Get current patient profile | Yes (patient) |
| `PATCH` | `/patients/me` | Update patient profile | Yes (patient) |

### Doctor Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/doctors/me` | Get current doctor profile | Yes (doctor) |
| `PATCH` | `/doctors/me` | Update doctor profile | Yes (doctor) |
| `PUT` | `/doctors/me/availability` | Set doctor availability | Yes (doctor) |
| `GET` | `/doctors/me/appointments` | Get doctor's appointments | Yes (doctor) |
| `PATCH` | `/doctors/me/appointments/:id` | Manage appointment (accept/decline) | Yes (doctor) |

### Public Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/doctors` | Search/browse doctors (with filters) | No |
| `GET` | `/doctors/:id` | Get specific doctor's public profile | No |
| `GET` | `/doctors/:id/availability` | Get doctor's available slots | No |

### Admin Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/admin/dashboard` | Get platform statistics | Yes (admin) |
| `GET` | `/admin/doctors` | List all doctors | Yes (admin) |
| `PATCH` | `/admin/doctors/:id` | Update doctor status (approve/reject/deactivate/activate) | Yes (admin) |
| `GET` | `/admin/patients` | List all patients | Yes (admin) |
| `GET` | `/admin/appointments` | List all appointments | Yes (admin) |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add: amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with learning from various full-stack MERN tutorials
- Inspired by modern authentication best practices (OWASP, RFC standards)
- MailerSend for reliable email delivery API
- Ant Design team for beautiful UI components
- The open-source community for countless helpful packages

## 📞 Support

For issues, questions, or contributions, please open an issue in the GitHub repository.

---

*Last updated: July 2026*
*Built with ❤️ for better healthcare access*