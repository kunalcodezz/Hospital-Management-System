import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  pulsing?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, children, pulsing = false, variant = "primary", ...props }, ref) => {
    const variants = {
      primary: "border-accent/30 bg-accent/5 text-accent",
      secondary: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
      ghost: "border-slate-500/20 bg-slate-500/5 text-slate-500",
      outline: "border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300",
    };

    const dotColors = {
      primary: "bg-accent",
      secondary: "bg-emerald-500",
      ghost: "bg-slate-500",
      outline: "bg-slate-400",
    };

    const selectedVariant = variants[variant] || variants.primary;
    const selectedDot = dotColors[variant] || dotColors.primary;

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-3 rounded-full border px-5 py-2",
          selectedVariant,
          className
        )}
        {...props}
      >
        <span className="relative flex h-2 w-2">
          {pulsing && (
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", selectedDot)}></span>
          )}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", selectedDot)}></span>
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.15em]">
          {children}
        </span>
      </div>
    );
  }
);
Badge.displayName = "Badge";
