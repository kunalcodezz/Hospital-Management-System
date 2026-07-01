import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  featured?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated = false, featured = false, children, ...props }, ref) => {
    
    if (featured) {
      return (
        <div className="rounded-xl bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-secondary)] to-[var(--color-accent)] p-[2px] shadow-accent-lg transition-transform duration-300 hover:-translate-y-1">
          <div
            ref={ref}
            className={cn(
              "h-full w-full rounded-[calc(0.75rem-2px)] bg-card p-6 relative overflow-hidden group",
              className
            )}
            {...props}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            {children}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl bg-card border border-border p-6 transition-all duration-300 relative overflow-hidden group card-hover",
          elevated ? "shadow-lg hover:shadow-xl" : "shadow-sm",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/3 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
