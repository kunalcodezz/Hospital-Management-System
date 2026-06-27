# MediCare+ Enterprise SaaS Hospital Management System

An enterprise-grade, OWASP-compliant, production-hardened Hospital Management SaaS platform built with React, TypeScript, Tailwind CSS, Express, and MongoDB.

---

## 📂 Folder Structure

```
├── tests/                  # Integration and API test suite
├── src/
│   ├── backend/
│   │   ├── config/         # Database, Cloudinary, NodeMailer, and Env configuration
│   │   ├── controllers/    # Business logic layer (Auth, Doctor, Appt, Payments, Stats, Reports)
│   │   ├── middleware/     # Security headers, rate limiting, and uploads middlewares
│   │   ├── models/         # Mongoose validation models (User, Patient, Doctor, Appointment, Payment)
│   │   ├── routes/         # Express Router routing mappings
│   │   └── validators/     # Zod schema inputs validation rules
│   ├── components/
│   │   ├── layout/         # Navigation portal layouts
│   │   └── ui/             # Reusable design components (Button, Card, Badge)
│   ├── context/            # AuthContext.tsx handling JWT & Refresh token interceptors
│   ├── pages/              # Portal page layouts and sub-views
│   │   ├── LandingPage.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── patient/        # Patient Dashboard & Medical Portal
│   │   ├── doctor/         # Doctor Consultations & Schedule Portal
│   │   └── admin/          # Admin Analytics, Audit trail, and User Management
```

---

## 🛡️ Enterprise Security Implementations (OWASP Top 10)

1. **SQL/NoSQL Injection**: Built-in sanitizing recursive middleware `noSqlSanitizer` blocks queries using operators starting with `$` or containing `.`.
2. **Broken Access Control & IDOR**: Role-based access control (Patient, Doctor, Admin, SuperAdmin) verified on all backend endpoints; checking resource ownership constraints.
3. **Helmet Header Protection**: Configured Helmet with Content Security Policy (CSP), Strict-Transport-Security (HSTS), and hides express headers.
4. **Anti-Brute Force Lockouts**: Express rate limiter limits requests from single IPs; failed login tracking locks accounts temporarily after 5 attempts.
5. **Secure File Uploads**: Multer limits upload file types to `.pdf`, `.png`, `.jpg`, `.jpeg`, checking MIME types and enforcing a 5MB limit.

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/medicare
JWT_SECRET=your_jwt_access_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_minimum_32_characters
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM=MediCare+ Operations <noreply@medicare.com>
NODE_ENV=production
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server (includes hot-reloading for backend and Vite server):
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run production server:
   ```bash
   npm run start
   ```

---

## 🧪 Testing Guide

Run the automated integration test suite:
```bash
npm run test
```

The test runner:
- Validates password strength policy filters.
- Verifies NoSQL parameter stripping.
- Runs JWT registration, login, and silent refresh flows.
- Tests IDOR route restriction bounds.
