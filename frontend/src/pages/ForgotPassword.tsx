import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import axios from "axios";
import toast from "react-hot-toast";
import { CheckCircle, Loader2, ArrowLeft, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSent, setIsSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    try {
      await axios.post("/api/auth/forgot-password", data);
      setIsSent(true);
      toast.success("Reset link issued if account exists.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to trigger recovery. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-accent-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logo} alt="MediCare+" className="h-10 w-auto object-contain" />
          </Link>
          <h1 className="text-3xl font-display tracking-tight text-foreground">Reset Password</h1>
          <p className="text-muted-foreground mt-2">Recover your hospital dashboard access link</p>
        </div>

        <Card className="p-8 shadow-xl">
          {isSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Verification Sent</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If the email address exists in our database, we have sent a secure password reset link to it. Please check your inbox.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="name@example.com"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-foreground"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting} icon={<Mail size={18} />}>
                Send Reset Link
              </Button>

              <div className="text-center text-sm">
                <Link to="/login" className="text-accent hover:underline font-medium">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
