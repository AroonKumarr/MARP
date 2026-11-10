"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const { user, loading } = useAuth(!isLoginPage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E6E2D8] flex items-center justify-center p-4">
        <div className="bg-[#F7F5EC] rounded-[32px] p-8 sm:p-10 flex flex-col items-center gap-4 shadow-sm border border-[#DDD7CD]">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-[#111111] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold tracking-wider text-[#77746F] uppercase">
            Loading MARP Platform...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E6E2D8] p-2 sm:p-4 md:p-5 lg:p-7 flex items-center justify-center font-sans antialiased selection:bg-[#D9F66A] selection:text-[#171717]">
      {/* Large Rounded Ivory Workspace */}
      <div className="w-full max-w-[1720px] h-[calc(100dvh-1rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-2.5rem)] bg-[#F7F5EC] rounded-[24px] sm:rounded-[32px] p-3 sm:p-5 lg:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-3 sm:gap-5 lg:gap-6 overflow-hidden relative">
        {/* Mobile Header Bar (Visible only on viewports < 768px) */}
        <div className="md:hidden flex items-center justify-between pb-2 border-b border-[#ECE8E0] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#111111] flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                <div className="w-3 h-3 rounded-full bg-[#111111] translate-x-1 -translate-y-0.5"></div>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-[#171717] text-sm tracking-tight block">
                MARP Platform
              </span>
              <span className="text-[10px] text-[#77746F] block font-medium">
                Multi-Agent Market Research
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 rounded-xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#171717] hover:bg-[#F2EFE8] transition-colors shadow-xs"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Component (Includes Hover Desktop Dock & Mobile Slide Drawer) */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 pr-0.5 sm:pr-1">
          {children}
        </main>
      </div>
    </div>
  );
}
