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
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    tooltip: "Operational Dashboard",
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    tooltip: "Users & Device Access",
  },
  {
    name: "Questionnaires",
    href: "/questionnaires",
    icon: FileQuestion,
    tooltip: "Questionnaire Management",
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
    tooltip: "Campaign & Asset Registry",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    tooltip: "Workspace Settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-20 bg-[#111111] rounded-[28px] py-6 px-3 flex flex-col items-center justify-between shadow-2xl flex-shrink-0 z-20">
      {/* Top Logo / Brand Mark */}
      <div className="flex flex-col items-center gap-8">
        <Link
          href="/"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white hover:scale-105 transition-transform"
          title="MARP Platform"
        >
          {/* Exact Brand Mark: Crescent / Circle Logo */}
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center relative overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-[#111111] translate-x-2 -translate-y-1"></div>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative",
                  active
                    ? "bg-white text-[#111111] shadow-lg shadow-black/20 font-semibold"
                    : "text-[#77746F] hover:text-white hover:bg-[#222222]"
                )}
                title={item.name}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                {/* Floating Tooltip Label */}
                <span className="absolute left-16 px-2.5 py-1 bg-[#222222] text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Avatar & Logout */}
      <div className="flex flex-col items-center gap-4">
        {user ? (
          <Link
            href="/settings"
            className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-all shadow-md"
            title={`${user.full_name} (${user.email})`}
          >
            <img
              src={
                user.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`
              }
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          </Link>
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#222222] animate-pulse" />
        )}

        <button
          onClick={logout}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#77746F] hover:text-white hover:bg-[#222222] transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
