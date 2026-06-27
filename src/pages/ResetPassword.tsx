import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import axios from "axios";
import toast from "react-hot-toast";
import { ShieldCheck, ShieldAlert } from "lucide-react";

// Matches Zod strong password schema
const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

const resetPasswordSchema = z
  .object({
    password: passwordPolicy,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: "", color: "bg-border" };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  switch (score) {
    case 1:
      return { score, label: "Weak", color: "bg-red-500 w-1/4" };
    case 2:
      return { score, label: "Fair", color: "bg-orange-500 w-2/4" };
    case 3:
      return { score, label: "Good", color: "bg-yellow-500 w-3/4" };
    case 4:
      return { score, label: "Strong", color: "bg-emerald-500 w-full" };
    default:
      return { score: 0, label: "Too Short", color: "bg-red-600 w-1/12" };
  }
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      toast.error("Missing password reset token in the URL. Please request a new link.");
      return;
    }

    try {
      await axios.post("/api/auth/reset-password", {
        token,
        newPassword: data.password,
      });

      toast.success("Password updated successfully! Please login with your new credentials.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Reset request failed. Reset token might have expired.");
    }
  };

  const strength = calculatePasswordStrength(passwordValue);

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
            <span className="font-display text-xl tracking-tight text-foreground">MediCare<span className="gradient-text">+</span></span>
          </Link>
          <h1 className="text-3xl font-display tracking-tight text-foreground">Define New Password</h1>
          <p className="text-muted-foreground mt-2">Update your login details securely</p>
        </div>

        <Card className="p-8 shadow-xl">
          {!token && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3 text-amber-600 dark:text-amber-400 text-sm">
              <ShieldAlert className="shrink-0 mt-0.5" size={18} />
              <p>Warning: Reset token is missing from the page URL parameters. Form submission will fail.</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                onChange={(e) => {
                  setPasswordValue(e.target.value);
                  register("password").onChange(e);
                }}
                className="w-full h-12 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-foreground"
              />
              
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color}`} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Password strength: <span className="font-semibold text-foreground">{strength.label}</span>
                  </p>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <input
                {...register("confirmPassword")}
                type="password"
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-foreground"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting} icon={<ShieldCheck size={18} />}>
              Save Password
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
