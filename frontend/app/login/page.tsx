"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@marp.io");
  const [password, setPassword] = useState("Admin12345!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("marp_token", data.access_token);
      localStorage.setItem("marp_company_id", data.company_id);
      localStorage.setItem("marp_user", JSON.stringify(data));

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E6E2D8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#F7F5EC] border border-[#DDD7CD] rounded-[32px] p-8 sm:p-10 shadow-2xl">
        {/* Brand Mark */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#111111] flex items-center justify-center shadow-md mb-4 relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#111111] translate-x-1.5 -translate-y-1" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">
            MARP Platform
          </h1>
          <p className="text-xs text-[#77746F] mt-1 font-medium">
            Multi-Agent Market Research Platform • University FYP
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#77746F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-white text-sm text-[#171717] pl-10 pr-4 py-3 rounded-full border border-[#ECE8E0] focus:border-[#111111] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#77746F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white text-sm text-[#171717] pl-10 pr-4 py-3 rounded-full border border-[#ECE8E0] focus:border-[#111111] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full mt-4 font-bold tracking-wide"
          >
            {loading ? "Authenticating..." : "Sign In to Platform"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Quick Fill Credentials Pills */}
        <div className="mt-6 pt-5 border-t border-[#EAE6DD]">
          <p className="text-[10px] font-bold text-[#77746F] uppercase tracking-wider text-center mb-2.5">
            Quick Sign-In As Demo Role:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@marp.io");
                setPassword("Admin12345!");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F2EFE8] border border-[#E5E1D8] text-[11px] font-semibold text-[#171717] text-left transition-colors flex flex-col"
            >
              <span className="font-bold text-[#111111]">👑 Admin</span>
              <span className="text-[10px] text-[#77746F] truncate">admin@marp.io</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("aroon.surveyor@marp.io");
                setPassword("Staff12345!");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F2EFE8] border border-[#E5E1D8] text-[11px] font-semibold text-[#171717] text-left transition-colors flex flex-col"
            >
              <span className="font-bold text-[#4338CA]">👷 Aroon (Surveyor)</span>
              <span className="text-[10px] text-[#77746F] truncate">aroon.surveyor@marp.io</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("mudasir.field@marp.io");
                setPassword("Staff12345!");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F2EFE8] border border-[#E5E1D8] text-[11px] font-semibold text-[#171717] text-left transition-colors flex flex-col"
            >
              <span className="font-bold text-[#065F46]">📋 Mudasir (Inspector)</span>
              <span className="text-[10px] text-[#77746F] truncate">mudasir.field@marp.io</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("abdullah.audit@marp.io");
                setPassword("Staff12345!");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F2EFE8] border border-[#E5E1D8] text-[11px] font-semibold text-[#171717] text-left transition-colors flex flex-col"
            >
              <span className="font-bold text-[#92400E]">🔍 Abdullah (Auditor)</span>
              <span className="text-[10px] text-[#77746F] truncate">abdullah.audit@marp.io</span>
            </button>
          </div>
        </div>

        {/* First-Run Administrator Bootstrap Tip */}
        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs text-[#77746F] border border-[#E5E1D8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Secure Enterprise Workspace Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
