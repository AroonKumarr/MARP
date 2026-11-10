import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: "bg-[#111111] hover:bg-[#262626] text-white rounded-full shadow-sm active:scale-98",
      secondary: "bg-white hover:bg-[#F2EFE8] text-[#171717] border border-[#E5E1D8] rounded-full active:scale-98",
      accent: "bg-[#D9F66A] hover:bg-[#CCEE5A] text-[#171717] font-semibold rounded-full shadow-sm active:scale-98",
      danger: "bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-full active:scale-98",
      ghost: "hover:bg-[#EAE6DD] text-[#171717] rounded-full active:scale-98",
    };

    const sizeStyles = {
      sm: "px-3.5 py-1.5 text-xs gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2.5",
      icon: "p-2.5 rounded-full aspect-square",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
