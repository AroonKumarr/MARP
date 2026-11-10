"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const { user, loading } = useAuth(!isLoginPage);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E6E2D8] flex items-center justify-center p-6">
        <div className="bg-[#F7F5EC] rounded-[32px] p-10 flex flex-col items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full border-4 border-[#111111] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold tracking-wider text-[#77746F] uppercase">
            Loading MARP Platform...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E6E2D8] p-3 sm:p-5 lg:p-7 flex items-center justify-center font-sans antialiased selection:bg-[#D9F66A] selection:text-[#171717]">
      {/* Large Rounded Ivory Workspace */}
      <div className="w-full max-w-[1720px] h-[calc(100vh-2rem)] sm:h-[calc(100vh-2.5rem)] bg-[#F7F5EC] rounded-[32px] p-3 sm:p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex gap-4 sm:gap-6 overflow-hidden">
        {/* Black Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto pr-1">
          {children}
        </main>
      </div>
    </div>
  );
}
