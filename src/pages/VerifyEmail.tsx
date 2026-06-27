import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("We are verifying your credentials...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the page URL parameters.");
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(`/api/auth/verify-email?token=${token}`);
        setStatus("success");
        setMessage(res.data.message || "Your email was verified successfully!");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed. The token might have expired.");
      }
    };

    verify();
  }, [token]);

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
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-display text-xl tracking-tight text-foreground">MediCare<span className="gradient-text">+</span></span>
          </div>
          <h1 className="text-3xl font-display tracking-tight text-foreground">Account Verification</h1>
        </div>

        <Card className="p-8 shadow-xl text-center space-y-6">
          {status === "loading" && (
            <div className="space-y-4 py-8">
              <Loader2 className="animate-spin text-accent w-12 h-12 mx-auto" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Email Verified!</h3>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="pt-4">
                <Link to="/login">
                  <Button className="w-full">Proceed to Sign In</Button>
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle size={32} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Verification Failed</h3>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="pt-4 flex flex-col gap-2">
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
