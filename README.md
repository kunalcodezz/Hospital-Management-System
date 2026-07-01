# Hospital Management System

A production-ready full-stack Hospital Management System (HMS) designed to streamline clinical workflows, patient registrations, doctor availabilities, and medical reports.

The repository is organized into a decoupled full-stack architecture, enabling standalone deployments of the client side (e.g. on Vercel) and the API server side (e.g. on Render).

---

## Project Structure

```text
Hospital-Management-System/
│
├── frontend/                     # React + Vite Client (Vercel)
│   ├── src/                      # UI Components, Context, Pages, CSS, Assets
│   ├── public/                   # Static assets
│   ├── package.json              # Client dependencies and scripts
│   ├── vite.config.ts            # Vite config (resolved aliases to src/)
│   └── .env                      # VITE_API_URL binding
│
├── backend/                      # Express + Node + TypeScript Server (Render)
│   ├── src/                      # Controllers, Models, Routes, Middlewares, Config
│   ├── uploads/                  # Local uploads storage
│   ├── tests/                    # Validator unit tests
│   ├── package.json              # Backend dependencies and scripts
│   ├── tsconfig.json             # TypeScript server build options
│   └── .env                      # Database cluster & API secrets
│
├── README.md                     # General workspace documentation
└── .gitignore                    # Shared VCS ignore configurations
```

---

## Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/kunalcodezz/Hospital-Management-System.git
cd Hospital-Management-System
```

### 2. Frontend Configuration
```bash
cd frontend
npm install
```
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```
Run development server:
```bash
npm run dev
```

### 3. Backend Configuration
```bash
cd ../backend
npm install
```
Create `backend/.env` with your databases and API credentials:
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FIREBASE_SERVICE_ACCOUNT_JSON=your_firebase_credentials_json_string
```
Run development server:
```bash
npm run dev
```

---

## Development Scripts

### Frontend (`frontend/`)
- `npm run dev`: Launch dev server at `http://localhost:5173`.
- `npm run build`: Compile and minify production bundles into `dist/`.
- `npm run preview`: Preview the compiled build.

### Backend (`backend/`)
- `npm run dev`: Watch and run typescript server on `http://localhost:3000` via `tsx`.
- `npm run build`: Bundle TS files into a compiled CJS server file inside `dist/`.
- `npm run start`: Start the compiled production server.
- `npm run seed`: Populate collections with starting records.
- `npm run test`: Execute the Zod validation test suite.
