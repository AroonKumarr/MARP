import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "lime" | "periwinkle" | "lavender" | "mint" | "orange" | "dark" | "outline";
  className?: string;
}

export function Badge({ children, variant = "lime", className }: BadgeProps) {
  const variantStyles = {
    lime: "bg-[#D9F66A]/90 text-[#3E520A]",
    periwinkle: "bg-[#91ACF8]/30 text-[#1E3A8A]",
    lavender: "bg-[#B6A0F3]/30 text-[#3B2A6B]",
    mint: "bg-[#9DD9C7]/40 text-[#164E43]",
    orange: "bg-[#F2B77C]/30 text-[#7C2D12]",
    dark: "bg-[#111111] text-white",
    outline: "border border-[#E5E1D8] text-[#77746F] bg-white/70",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function CounterBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-[#111111] text-white rounded-full text-[11px] font-bold",
        className
      )}
    >
      {count}
    </span>
  );
}
