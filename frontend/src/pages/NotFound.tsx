import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Compass, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-accent-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      <Card className="max-w-md w-full text-center p-8 space-y-6 shadow-xl relative z-10">
        <div className="w-16 h-16 bg-blue-50 text-accent rounded-full flex items-center justify-center mx-auto dark:bg-blue-950/20">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-display text-foreground">404 - Page Not Found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The clinic page or reference folder you are trying to view does not exist or has been archived.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/">
            <Button className="w-full text-sm" icon={<Compass size={16} />}>
              Go to Homepage
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
