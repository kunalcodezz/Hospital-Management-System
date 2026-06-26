import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  pulsing?: boolean;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, children, pulsing = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-3 rounded-full border border-accent/30 bg-[var(--color-accent)]/5 px-5 py-2",
          className
        )}
        {...props}
      >
        <span className="relative flex h-2 w-2">
          {pulsing && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75"></span>
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-accent)]">
          {children}
        </span>
      </div>
    );
  }
);
Badge.displayName = "Badge";
