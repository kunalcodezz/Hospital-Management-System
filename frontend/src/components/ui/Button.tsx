import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-gradient-to-r from-accent to-accent-secondary text-accent-foreground shadow-sm hover:shadow-accent hover:-translate-y-0.5 active:scale-[0.98] brightness-100 hover:brightness-110",
      secondary:
        "bg-muted text-foreground hover:bg-muted/80 shadow-sm active:scale-[0.98]",
      ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-[0.98]",
      outline:
        "bg-transparent border border-border text-foreground hover:border-accent/30 hover:shadow-sm active:scale-[0.98]",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm rounded-lg",
      md: "h-12 px-6 text-base rounded-xl",
      lg: "h-14 px-8 text-lg rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none group",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {!isLoading && icon && iconPosition === "left" && (
          <span className="mr-2 group-hover:-translate-x-0.5 transition-transform">
            {icon}
          </span>
        )}
        
        {children}
        
        {!isLoading && icon && iconPosition === "right" && (
          <span className="ml-2 group-hover:translate-x-1 transition-transform">
            {icon}
          </span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
