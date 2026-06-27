import React from "react";
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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
      login(accessToken, refreshToken, user);
      
      toast.success("Welcome to MediCare+!");

      // Route mapping
      if (user.role === "patient") {
        navigate("/patient");
      } else if (user.role === "doctor") {
        navigate("/doctor");
      } else if (user.role === "admin" || user.role === "superadmin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Gradients */}
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
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-display text-xl tracking-tight text-foreground">MediCare+</span>
          </Link>
          <h1 className="text-3xl font-display tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
        </div>

        <Card className="p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" style={{ display: "none" }} className="text-sm text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                {...register("rememberMe")}
                className="w-4 h-4 accent-accent"
              />
              <label htmlFor="rememberMe" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                Remember my session
              </label>
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
