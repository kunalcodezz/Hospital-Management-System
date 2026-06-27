import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Must contain at least 1 lowercase letter")
    .regex(/[0-9]/, "Must contain at least 1 number")
    .regex(/[^a-zA-Z0-9]/, "Must contain at least 1 special character"),
  role: z.enum(["patient", "doctor"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "patient" },
  });

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await axios.post("/api/auth/register", data);
      
      const { accessToken, refreshToken, user } = response.data;
      login(accessToken, refreshToken, user);
      
      toast.success("Account registered! Please check email to verify.");
      
      if (user.role === "patient") {
        navigate("/patient");
      } else {
        navigate("/doctor");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-accent-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-display text-xl tracking-tight text-foreground">MediCare+</span>
          </Link>
          <h1 className="text-3xl font-display tracking-tight text-foreground">Create an account</h1>
          <p className="text-muted-foreground mt-2">Join us to manage your healthcare journey</p>
        </div>

        <Card className="p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Account Type</label>
              <select 
                {...register("role")}
                className="w-full h-12 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input
                {...register("name")}
                type="text"
                placeholder="John Doe"
                className="w-full h-12 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="name@example.com"
                className="w-full h-12 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                onChange={(e) => {
                  register("password").onChange(e);
                  setPasswordValue(e.target.value);
                }}
                className="w-full h-12 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}

              {/* Password Strength Indicator */}
              {passwordValue && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground">Password Strength</span>
                    <span className="font-mono text-accent">
                      {strengthScore <= 2 ? "Weak" : strengthScore <= 4 ? "Good" : "Excellent"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full rounded-full transition-all ${strengthScore > 0 ? "bg-red-500" : "bg-transparent"}`} style={{ width: "20%" }} />
                    <div className={`h-full rounded-full transition-all ${strengthScore > 2 ? "bg-amber-500" : "bg-transparent"}`} style={{ width: "20%" }} />
                    <div className={`h-full rounded-full transition-all ${strengthScore > 3 ? "bg-blue-500" : "bg-transparent"}`} style={{ width: "20%" }} />
                    <div className={`h-full rounded-full transition-all ${strengthScore > 4 ? "bg-emerald-500" : "bg-transparent"}`} style={{ width: "40%" }} />
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
