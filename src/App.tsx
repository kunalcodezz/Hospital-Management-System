import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Public Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";

// Shared Layouts & Settings
import DashboardLayout from "./components/layout/DashboardLayout";
import Settings from "./pages/Settings";
import CommandPalette from "./components/ui/CommandPalette";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// Patient Module
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/Appointments";
import PatientRecords from "./pages/patient/MedicalRecords";
import PatientDoctors from "./pages/patient/FindDoctors";

// Doctor Module
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorSchedule from "./pages/doctor/Schedule";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorReviews from "./pages/doctor/Reviews";

// Admin Module
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDoctors from "./pages/admin/ManageDoctors";
import AdminPatients from "./pages/admin/ManagePatients";
import AdminLogs from "./pages/admin/SystemLogs";

const queryClient = new QueryClient();

// Route blocker enforcing strict auth parameters and role verification
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user && !allowedRoles.includes(user.role)) {
    // If authenticated but role mismatch, fallback to home directory
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Toaster position="top-center" />
            <CommandPalette />
            
            <Routes>
              {/* Public Views */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              {/* Shared Secure Portal Layout settings */}
              <Route path="/settings" element={
                <ProtectedRoute allowedRoles={["patient", "doctor", "admin", "superadmin"]}>
                  <DashboardLayout role="patient" /> {/* Settings matches any portal side nav layout */}
                </ProtectedRoute>
              }>
                <Route index element={<Settings />} />
              </Route>

              {/* Patient Secure Portal */}
              <Route path="/patient" element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <DashboardLayout role="patient" />
                </ProtectedRoute>
              }>
                <Route index element={<PatientDashboard />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="records" element={<PatientRecords />} />
                <Route path="doctors" element={<PatientDoctors />} />
              </Route>
              
              {/* Doctor Secure Portal */}
              <Route path="/doctor" element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <DashboardLayout role="doctor" />
                </ProtectedRoute>
              }>
                <Route index element={<DoctorDashboard />} />
                <Route path="schedule" element={<DoctorSchedule />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="reviews" element={<DoctorReviews />} />
              </Route>
              
              {/* Admin Secure Portal */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <DashboardLayout role="admin" />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="doctors" element={<AdminDoctors />} />
                <Route path="patients" element={<AdminPatients />} />
                <Route path="logs" element={<AdminLogs />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
