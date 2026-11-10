"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  Megaphone,
  Settings,
  LogOut,
  X,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Operational Workflow Board",
  },
  {
    name: "Users & Access",
    href: "/users",
    icon: Users,
    description: "Personnel, Devices & Audit",
  },
  {
    name: "Questionnaires",
    href: "/questionnaires",
    icon: FileQuestion,
    description: "Surveys, Logic & Versions",
  },
  {
    name: "Campaigns & Assets",
    href: "/campaigns",
    icon: Megaphone,
    description: "Billboards, Locations & Competitors",
  },
  {
    name: "Settings & ERD",
    href: "/settings",
    icon: Settings,
    description: "Workspace & System Schema",
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const userRole = user?.roles?.[0]?.name || "Field Staff";

  return (
    <>
      {/* ============================================================== */}
      {/* 1. DESKTOP / TABLET SIDEBAR (Expands w-20 -> w-64 in flex flow) */}
      {/* Main screen resizes responsively alongside this sidebar       */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col justify-between bg-[#111111] rounded-[28px] py-6 px-3 shadow-2xl transition-[width] duration-300 ease-in-out z-20 flex-shrink-0 overflow-hidden w-20 hover:w-64 group/sidebar">
        {/* Top Logo / Brand Mark */}
        <div className="flex flex-col gap-7">
          <Link
            href="/"
            className="flex items-center gap-3.5 px-2 hover:opacity-90 transition-opacity"
            title="MARP Platform"
          >
            {/* Crescent Brand Icon */}
            <div className="w-10 h-10 rounded-2xl bg-[#222222] flex items-center justify-center flex-shrink-0 shadow-inner border border-white/10">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                <div className="w-3.5 h-3.5 rounded-full bg-[#111111] translate-x-1.5 -translate-y-1"></div>
              </div>
            </div>

            {/* Title revealed on hover */}
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap overflow-hidden">
              <span className="font-black text-white text-base tracking-tight block">
                MARP
              </span>
              <span className="text-[10px] font-semibold text-[#A19D94] uppercase tracking-wider block">
                Market Research
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "h-12 rounded-2xl flex items-center transition-all duration-200 px-3 gap-3.5 w-full relative",
                    active
                      ? "bg-white text-[#111111] shadow-lg shadow-black/20 font-semibold"
                      : "text-[#88847E] hover:text-white hover:bg-[#222222]"
                  )}
                  title={item.name}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover/sidebar:scale-105" />

                  {/* Expanded Label on Sidebar Hover */}
                  <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
                    {item.name}
                  </span>

                  {/* Active Accent Dot in compact state */}
                  {active && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#111111] group-hover/sidebar:hidden" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile, Role Pill & Sign Out Section */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
          {user ? (
            <Link
              href="/settings"
              className="flex items-center gap-3 px-2 py-1.5 rounded-2xl hover:bg-[#222222] transition-colors"
              title={`${user.full_name} (${userRole})`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-all flex-shrink-0 shadow-md">
                <img
                  src={
                    user.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`
                  }
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap overflow-hidden">
                <p className="text-xs font-bold text-white truncate max-w-[140px]">
                  {user.full_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                      isAdmin()
                        ? "bg-[#D9F66A] text-[#111111]"
                        : "bg-[#222222] text-[#91ACF8] border border-blue-500/30"
                    )}
                  >
                    {isAdmin() ? "👑 Admin" : `👷 ${userRole}`}
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#222222] animate-pulse mx-auto" />
          )}

          <button
            onClick={logout}
            className="h-10 rounded-2xl flex items-center gap-3 px-3 text-[#88847E] hover:text-white hover:bg-[#222222] transition-colors w-full"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE DRAWER (For touch viewports < 768px)                  */}
      {/* ============================================================== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onMobileClose}
          />

          {/* Drawer Body */}
          <aside className="relative w-72 max-w-[80vw] bg-[#111111] text-white h-full p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex flex-col gap-6">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center relative overflow-hidden">
                    <div className="w-5 h-5 rounded-full bg-[#111111] translate-x-2 -translate-y-1"></div>
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-white">MARP</h3>
                    <p className="text-[10px] text-[#A19D94] uppercase tracking-wider font-semibold">
                      Mobile Navigation
                    </p>
                  </div>
                </div>

                <button
                  onClick={onMobileClose}
                  className="w-8 h-8 rounded-full bg-[#222222] text-[#88847E] hover:text-white flex items-center justify-center"
                  aria-label="Close Navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "h-12 rounded-2xl flex items-center px-4 gap-3.5 transition-all",
                        active
                          ? "bg-white text-[#111111] font-bold shadow-md"
                          : "text-[#A19D94] hover:text-white hover:bg-[#222222]"
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{item.name}</span>
                        <span
                          className={cn(
                            "text-[10px]",
                            active ? "text-[#55524E]" : "text-[#77746F]"
                          )}
                        >
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom User Section */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              {user && (
                <div className="flex items-center gap-3 px-2">
                  <img
                    src={
                      user.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`
                    }
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full border border-white/20 object-cover"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5",
                        isAdmin()
                          ? "bg-[#D9F66A] text-[#111111]"
                          : "bg-[#222222] text-[#91ACF8]"
                      )}
                    >
                      {isAdmin() ? "👑 Admin" : `👷 ${userRole}`}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (onMobileClose) onMobileClose();
                  logout();
                }}
                className="h-10 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
