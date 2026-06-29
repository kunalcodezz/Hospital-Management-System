# Hospital Management System

A full-stack Hospital Management System designed to streamline hospital operations by providing a centralized platform for managing patients, doctors, appointments, and administrative tasks. The application offers secure authentication, role-based access control, and an intuitive interface for efficient healthcare management.

---

## Overview

This project aims to digitize and simplify hospital workflows by enabling:

- Patient Registration and Authentication
- Doctor Management
- Appointment Scheduling
- Role-Based Access Control
- Secure Data Management
- Dashboard for Hospital Administration

---

## Features

### Authentication

- Secure Login and Registration
- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes
- Session Persistence

### Patient Module

- Register and Login
- Book Appointments
- View Appointment History
- Manage Profile

### Doctor Module

- Manage Availability
- View Appointment Schedule
- Access Patient Information
- Update Appointment Status

### Admin Module

- Manage Patients
- Manage Doctors
- Manage Appointments
- Monitor System Activities

### Additional Features

- Responsive User Interface
- Form Validation
- Secure API Endpoints
- Cloud Image Upload Support
- Firebase Integration
- MongoDB Database

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Context API
- CSS

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- MongoDB
- Mongoose

### Authentication

- JWT
- bcrypt

### Cloud Services

- Firebase
- Cloudinary

---

## Project Structure

```text
Hospital-Management-System/
│
├── assets/
├── dist/
├── node_modules/
├── scripts/
│
├── src/
│   ├── backend/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── validators/
│   │
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── pages/
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── tests/
├── uploads/
│
├── .env
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── server.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/kunalcodezz/Hospital-Management-System.git
```

Navigate to the project directory

```bash
cd Hospital-Management-System
```

Install dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root and configure the following variables:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

FIREBASE_PROJECT_ID=

FIREBASE_CLIENT_EMAIL=

FIREBASE_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

---

## Running the Application

Start the development server

```bash
npm run dev
```

Build the project

```bash
npm run build
```

Run lint checks

```bash
npm run lint
```

Run tests

```bash
npm test
```

---

## Security

- JWT Authentication
- Password Encryption with bcrypt
- Protected API Routes
- Role-Based Authorization
- Environment Variable Protection
- Request Validation

---

## Future Enhancements

- Online Payment Integration
- Email Notifications
- SMS Appointment Reminders
- Medical Records Management
- Prescription Management
- Laboratory Reports
- Real-Time Notifications
- AI-Based Appointment Recommendations
- Video Consultation
- Multi-Hospital Support

---

## Deployment

Frontend

- Vercel
- Netlify
- Firebase Hosting

Backend

- Render
- Railway
- AWS EC2
- DigitalOcean

Database

- MongoDB Atlas

---

## Author

**Kunal Maidkar**

GitHub: https://github.com/kunalcodezz

LinkedIn: Add your LinkedIn profile here

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Add feature"
```

4. Push to your branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---

## License

This project is licensed under the MIT License.
