import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import medicalTeamImg from "@/assets/medical-team.png";
import "./AuthPage.css";

// ─── Validation Schemas ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Must contain at least 1 number")
      .regex(/[^a-zA-Z0-9]/, "Must contain at least 1 special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeTerms: z.literal(true, {
      message: "You must agree to the terms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Hospital Logo ──────────────────────────────────────────────────────────────

function HospitalLogo() {
  return (
    <div className="hospital-logo">
      <svg className="hospital-logo-icon" viewBox="0 0 32 32" fill="none">
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="8"
          fill="#e0f2f1"
          stroke="#009688"
          strokeWidth="2"
        />
        <path
          d="M16 9v14M9 16h14"
          stroke="#009688"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="25" cy="7" r="2.5" fill="#4db6ac" />
        <circle cx="27" cy="5" r="1.2" fill="#80cbc4" />
      </svg>
      <span className="hospital-logo-text">Hospital Logo</span>
    </div>
  );
}

// ─── Floating Medical Icons ─────────────────────────────────────────────────────

function MedicalIcons() {
  return (
    <>
      {/* Heart with pulse line */}
      <div className="medical-icon medical-icon--heart">
        <div className="icon-circle icon-circle--red">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 24C13.5 24 7 19 4.5 14.5C2.5 11 3 7 6.5 5.5C9 4.5 12 5.5 14 8C16 5.5 19 4.5 21.5 5.5C25 7 25.5 11 23.5 14.5C21 19 14.5 24 14 24Z"
              fill="#ef5350"
            />
            <polyline
              points="5,15 9,15 11.5,10 14,19 16.5,12 19,15 23,15"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Pill capsule */}
      <div className="medical-icon medical-icon--pill">
        <div className="icon-circle icon-circle--teal">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect
              x="8"
              y="4"
              width="12"
              height="20"
              rx="6"
              fill="#4db6ac"
            />
            <rect x="8" y="14" width="12" height="10" rx="6" fill="#f4a261" />
            <line
              x1="8"
              y1="14"
              x2="20"
              y2="14"
              stroke="white"
              strokeWidth="1.4"
            />
          </svg>
        </div>
      </div>

      {/* Medical cross in orange circle */}
      <div className="medical-icon medical-icon--cross">
        <div className="icon-circle icon-circle--orange">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Small teal cross with sparkle */}
      <div className="medical-icon medical-icon--small-cross">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 7v14M7 14h14"
            stroke="#009688"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="22" cy="6" r="2.5" fill="#4db6ac" opacity="0.7" />
          <circle cx="24.5" cy="4" r="1.2" fill="#80cbc4" opacity="0.5" />
        </svg>
      </div>
    </>
  );
}

// ─── Decorative Wave SVG ────────────────────────────────────────────────────────

function WaveSVG() {
  return (
    <svg
      className="bg-shape bg-shape--wave-svg"
      width="280"
      height="420"
      viewBox="0 0 280 420"
      fill="none"
    >
      <path
        d="M230 10C230 10 80 90 130 210C180 330 40 410 40 410"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="38"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M185 10C185 10 35 90 85 210C135 330 -5 410 -5 410"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="32"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M270 10C270 10 120 90 170 210C220 330 80 410 80 410"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="28"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Login Form ─────────────────────────────────────────────────────────────────

function LoginForm({
  onSwitch,
  authLogin,
  navigateTo,
}: {
  onSwitch: () => void;
  authLogin: (
    accessToken: string,
    refreshToken: string,
    user: any
  ) => void;
  navigateTo: (path: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await axios.post("/api/auth/login", data);
      const { accessToken, refreshToken, user } = response.data;
      authLogin(accessToken, refreshToken, user);
      toast.success("Welcome to MediCare+!");

      if (user.role === "patient") navigateTo("/patient");
      else if (user.role === "doctor") navigateTo("/doctor");
      else if (user.role === "admin" || user.role === "superadmin")
        navigateTo("/admin");
      else navigateTo("/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="auth-form-content">
      <HospitalLogo />
      <h1 className="auth-heading">Log In</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-input-group">
          <input
            {...register("email")}
            type="email"
            placeholder="Username"
            className={`auth-input ${errors.email ? "auth-input-error" : ""}`}
            autoComplete="email"
          />
          {errors.email && (
            <p className="auth-error-text">{errors.email.message}</p>
          )}
        </div>

        <div className="auth-input-group">
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            className={`auth-input ${
              errors.password ? "auth-input-error" : ""
            }`}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="auth-error-text">{errors.password.message}</p>
          )}
        </div>

        <div className="auth-buttons-row">
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="auth-spinner" /> : "LOGIN"}
          </button>
          <button
            type="button"
            className="auth-btn-cancel"
            onClick={() => navigateTo("/")}
          >
            CANCEL
          </button>
        </div>
      </form>

      <div className="auth-switch">
        Don&apos;t have an account?{" "}
        <button type="button" className="auth-switch-link" onClick={onSwitch}>
          Create an Account
        </button>
      </div>
    </div>
  );
}

// ─── Signup Form ────────────────────────────────────────────────────────────────

function SignupForm({
  onSwitch,
  authLogin,
  navigateTo,
}: {
  onSwitch: () => void;
  authLogin: (
    accessToken: string,
    refreshToken: string,
    user: any
  ) => void;
  navigateTo: (path: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await axios.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "patient",
      });
      const { accessToken, refreshToken, user } = response.data;
      authLogin(accessToken, refreshToken, user);
      toast.success("Account created! Please check email to verify.");
      navigateTo("/patient");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-form-content">
      <HospitalLogo />
      <h1 className="auth-heading">Create Account</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-input-group">
          <input
            {...register("name")}
            type="text"
            placeholder="Full Name"
            className={`auth-input ${errors.name ? "auth-input-error" : ""}`}
            autoComplete="name"
          />
          {errors.name && (
            <p className="auth-error-text">{errors.name.message}</p>
          )}
        </div>

        <div className="auth-input-group">
          <input
            {...register("email")}
            type="email"
            placeholder="Email Address"
            className={`auth-input ${errors.email ? "auth-input-error" : ""}`}
            autoComplete="email"
          />
          {errors.email && (
            <p className="auth-error-text">{errors.email.message}</p>
          )}
        </div>

        <div className="auth-input-group">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={`auth-input ${
              errors.password ? "auth-input-error" : ""
            }`}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {errors.password && (
            <p className="auth-error-text">{errors.password.message}</p>
          )}
        </div>

        <div className="auth-input-group">
          <input
            {...register("confirmPassword")}
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            className={`auth-input ${
              errors.confirmPassword ? "auth-input-error" : ""
            }`}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirm(!showConfirm)}
            tabIndex={-1}
            aria-label="Toggle confirm password visibility"
          >
            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {errors.confirmPassword && (
            <p className="auth-error-text">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="terms-checkbox-group">
          <input
            type="checkbox"
            id="agreeTerms"
            {...register("agreeTerms")}
            className="terms-checkbox"
          />
          <label htmlFor="agreeTerms" className="terms-label">
            I agree to{" "}
            <a
              href="#"
              className="terms-link"
              onClick={(e) => e.preventDefault()}
            >
              Terms &amp; Conditions
            </a>
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="auth-error-text" style={{ marginTop: -4 }}>
            {errors.agreeTerms.message}
          </p>
        )}

        <button
          type="submit"
          className="auth-btn-primary"
          disabled={isSubmitting}
          style={{ marginTop: "0.75rem" }}
        >
          {isSubmitting ? <span className="auth-spinner" /> : "CREATE ACCOUNT"}
        </button>
      </form>

      <div className="auth-switch">
        Already have an account?{" "}
        <button type="button" className="auth-switch-link" onClick={onSwitch}>
          Login
        </button>
      </div>
    </div>
  );
}

// ─── Main Auth Page ─────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [searchParams] = useSearchParams();
  const { login: authLogin, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  // Determine initial mode from URL query parameter
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setIsLogin(false);
  }, [searchParams]);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "patient") navigate("/patient");
      else if (user.role === "doctor") navigate("/doctor");
      else if (user.role === "admin" || user.role === "superadmin")
        navigate("/admin");
    }
  }, [isAuthenticated, user, loading, navigate]);

  if (loading) {
    return (
      <div className="auth-page">
        <span className="auth-spinner auth-spinner--large" />
      </div>
    );
  }

  const togglePanel = () => setIsLogin((prev) => !prev);
  const navigateTo = (path: string) => navigate(path);

  return (
    <div className="auth-page">
      {/* ── Background Decorative Shapes (parallax on transition) ── */}
      <div
        className={`auth-bg-shapes ${isLogin ? "login-mode" : "signup-mode"}`}
      >
        <div className="bg-shape bg-shape--teal-1" />
        <div className="bg-shape bg-shape--teal-2" />
        <div className="bg-shape bg-shape--orange-1" />
        <div className="bg-shape bg-shape--orange-2" />
        <div className="bg-shape bg-shape--orange-3" />
        <WaveSVG />
        <div className="bg-shape bg-shape--diamond" />
      </div>

      {/* ── Main Auth Card ── */}
      <div className={`auth-card ${isLogin ? "login-mode" : "signup-mode"}`}>
        {/* Signup Form — always occupies left half */}
        <div className="auth-form-half signup-half">
          <SignupForm
            onSwitch={togglePanel}
            authLogin={authLogin}
            navigateTo={navigateTo}
          />
        </div>

        {/* Login Form — always occupies right half */}
        <div className="auth-form-half login-half">
          <LoginForm
            onSwitch={togglePanel}
            authLogin={authLogin}
            navigateTo={navigateTo}
          />
        </div>

        {/* ── Sliding Illustration Panel ── */}
        <div className="auth-illustration-panel">
          <div className="illustration-inner">
            <div className="illustration-backdrop" />
            <MedicalIcons />
            <img
              src={medicalTeamImg}
              alt="Medical team — doctor, patient, and nurse"
              className="medical-illustration-img"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
