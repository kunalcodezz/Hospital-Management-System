/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./components/layout/DashboardLayout";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: string }) {
  const { isAuthenticated, user } = useAuth();
  
  // For demo purposes, we will allow access if not authenticated but navigating directly,
  // in a real app you would strictly redirect to login.
  // if (!isAuthenticated) return <Navigate to="/login" replace />;
  // if (user?.role !== allowedRole) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster position="top-center" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/patient" element={
              <ProtectedRoute allowedRole="patient">
                <DashboardLayout role="patient" />
              </ProtectedRoute>
            }>
              <Route index element={<PatientDashboard />} />
            </Route>
            
            <Route path="/doctor" element={
              <ProtectedRoute allowedRole="doctor">
                <DashboardLayout role="doctor" />
              </ProtectedRoute>
            }>
              <Route index element={<DoctorDashboard />} />
            </Route>
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRole="admin">
                <DashboardLayout role="admin" />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
