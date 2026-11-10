import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  dark?: boolean;
}

export function Card({ children, className, dark = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] transition-all duration-200",
        dark
          ? "bg-[#111111] text-white shadow-xl"
          : "bg-white text-[#171717] border border-[#ECE8E0] shadow-[0_4px_20px_-2px_rgba(23,23,23,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(23,23,23,0.06)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
