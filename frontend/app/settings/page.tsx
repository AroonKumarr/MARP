"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Building2,
  Shield,
  Palette,
  Smartphone,
  Save,
  CheckCircle,
  Database,
  Download,
  ExternalLink,
  Layers,
  ZoomIn,
  Users,
  FileQuestion,
  Megaphone,
} from "lucide-react";

export default function SettingsPage() {
  const { user, isAdmin } = useAuth(true);
  const [activeTab, setActiveTab] = useState<"settings" | "erd">("settings");
  const [selectedStudent, setSelectedStudent] = useState<"all" | "aroon" | "mudasir" | "abdullah">("all");

  const [company, setCompany] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("Asia/Karachi");

  const [autoApproveDevices, setAutoApproveDevices] = useState(false);
  const [requireMfa, setRequireMfa] = useState(false);
  const [brandingAccent, setBrandingAccent] = useState("#D9F66A");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      const [compData, setData] = await Promise.all([
        apiFetch<any>("/workspaces/current"),
        apiFetch<any>("/workspaces/settings"),
      ]);
      setCompany(compData);
      setSettings(setData);

      setCompanyName(compData.name);
      setIndustry(compData.industry || "");
      setContactEmail(compData.contact_email);
      setPhone(compData.phone || "");
      setAddress(compData.address || "");
      setTimezone(compData.timezone || "Asia/Karachi");

      setAutoApproveDevices(setData.allow_device_auto_approval);
      setRequireMfa(setData.require_mfa_for_admins);
      setBrandingAccent(setData.branding_accent || "#D9F66A");
    } catch (err) {
      console.error("Failed to load workspace settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      await Promise.all([
        apiFetch("/workspaces/current", {
          method: "PUT",
          body: JSON.stringify({
            name: companyName,
            industry,
            contact_email: contactEmail,
            phone,
            address,
            timezone,
          }),
        }),
        apiFetch("/workspaces/settings", {
          method: "PUT",
          body: JSON.stringify({
            allow_device_auto_approval: autoApproveDevices,
            require_mfa_for_admins: requireMfa,
            branding_accent: brandingAccent,
          }),
        }),
      ]);
      setSuccessMsg("Workspace settings updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !company) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-4 border-[#111111] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pb-10">
      {/* Top Breadcrumb & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ECE8E0]">
        <div>
          <h2 className="text-xl font-black text-[#171717]">Settings &amp; Architecture</h2>
          <p className="text-xs text-[#77746F] mt-0.5">
            Workspace configuration, security rules, and FYP student responsibility ERD.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "settings"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Workspace Policy</span>
          </button>

          <button
            onClick={() => setActiveTab("erd")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "erd"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>3-Circle Student ERD</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: WORKSPACE POLICY & SECURITY SETTINGS                     */}
      {/* ============================================================== */}
      {activeTab === "settings" && (
        <>
          {!isAdmin() && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Access Policy:</strong> You are signed in as <strong>{user?.roles?.[0]?.name || "Field Staff"}</strong>. Company workspace governance and security rules can only be edited by <strong>Company Administrators</strong>.
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-200 text-amber-800 flex-shrink-0">
                Read-Only View
              </span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Workspace Profile Card */}
            <Card className="p-6 border border-[#ECE8E0] space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#171717]">
                <Building2 className="w-4 h-4" />
                <span>Enterprise Organization Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                    Industry Vertical
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Market Research & Media Analytics"
                    className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                    Headquarters Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
                  />
                </div>
              </div>
            </Card>

            {/* Device & Security Governance Card */}
            <Card className="p-6 border border-[#ECE8E0] space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#171717]">
                <Shield className="w-4 h-4" />
                <span>Field Security &amp; Device Policies</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F3] border border-[#ECE8E0] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApproveDevices}
                    onChange={(e) => setAutoApproveDevices(e.target.checked)}
                    className="accent-[#111111] w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#171717]">
                      Auto-Approve Registered Mobile Field Devices
                    </span>
                    <p className="text-[11px] text-[#77746F]">
                      Allows surveyors to begin data collection immediately upon device pairing without manual review.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F3] border border-[#ECE8E0] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireMfa}
                    onChange={(e) => setRequireMfa(e.target.checked)}
                    className="accent-[#111111] w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#171717]">
                      Enforce Two-Factor Authentication for Workspace Administrators
                    </span>
                    <p className="text-[11px] text-[#77746F]">
                      Demands OTP code verification on every privileged session.
                    </p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Branding & Design Token Accent */}
            <Card className="p-6 border border-[#ECE8E0] space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#171717]">
                <Palette className="w-4 h-4" />
                <span>Workspace Theme Token &amp; Accent</span>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {["#D9F66A", "#91ACF8", "#B6A0F3", "#9DD9C7", "#F2B77C"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandingAccent(c)}
                    className={`w-9 h-9 rounded-full transition-transform flex items-center justify-center border-2 ${
                      brandingAccent === c ? "border-[#111111] scale-110 shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {brandingAccent === c && <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />}
                  </button>
                ))}
                <span className="text-xs text-[#77746F]">Active Accent Token: {brandingAccent}</span>
              </div>
            </Card>

            <div className="flex justify-end items-center gap-3">
              {isAdmin() ? (
                <Button type="submit" disabled={saving} variant="primary" size="md">
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Changes..." : "Save Workspace Settings"}</span>
                </Button>
              ) : (
                <span className="text-xs text-[#77746F] font-semibold italic bg-[#FAF8F3] px-4 py-2 rounded-xl border border-[#ECE8E0]">
                  🔒 Administrator rights required to modify workspace settings
                </span>
              )}
            </div>
          </form>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FYP ARCHITECTURAL ERD (3 MARKED STUDENT CIRCLES)         */}
      {/* ============================================================== */}
      {activeTab === "erd" && (
        <div className="space-y-6">
          {/* Header Summary & Student Selector */}
          <div className="bg-white rounded-[24px] border border-[#ECE8E0] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#171717]">
                  Final Year Project (FYP) — Database Architecture
                </h3>
                <p className="text-xs text-[#77746F] mt-0.5">
                  1 Master Schema partitioned into 3 distinct Marked Circles corresponding to each student contributor.
                </p>
              </div>

              {/* Action Buttons to download SVG and PNG */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="/database/erd_students_annotated.svg"
                  download="MARP_FYP_3_Circle_ERD.svg"
                  target="_blank"
                  className="px-3 py-1.5 rounded-full bg-[#111111] text-white hover:bg-[#333333] transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </a>

                <a
                  href="/database/erd_students_annotated.png"
                  download="MARP_FYP_3_Circle_ERD.png"
                  target="_blank"
                  className="px-3 py-1.5 rounded-full bg-white text-[#171717] hover:bg-[#F2EFE8] border border-[#E5E1D8] transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG (Hi-Res)</span>
                </a>
              </div>
            </div>

            {/* 3 Student Responsibility Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#F5F2EB]">
              {/* Circle 1: Aroon Kumar */}
              <div
                onClick={() => setSelectedStudent(selectedStudent === "aroon" ? "all" : "aroon")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedStudent === "aroon"
                    ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-300"
                    : "bg-[#FAF8F3] border-[#EAE6DD] hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#4F46E5] text-white font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    10 Entities
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-[#171717]">Aroon Kumar (2312466)</h4>
                <p className="text-[11px] font-bold text-indigo-600 mt-0.5">Module 01: User &amp; Workspace</p>
                <p className="text-[10px] text-[#77746F] mt-1 leading-snug">
                  Companies, Users, Roles, Permissions, UserRoles, RolePermissions, Devices, Invites, AuditLogs, Settings.
                </p>
              </div>

              {/* Circle 2: Mudasir Ali */}
              <div
                onClick={() => setSelectedStudent(selectedStudent === "mudasir" ? "all" : "mudasir")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedStudent === "mudasir"
                    ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300"
                    : "bg-[#FAF8F3] border-[#EAE6DD] hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#10B981] text-white font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    8 Entities
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-[#171717]">Mudasir Ali (2312465)</h4>
                <p className="text-[11px] font-bold text-emerald-600 mt-0.5">Module 02: Questionnaire Logic</p>
                <p className="text-[10px] text-[#77746F] mt-1 leading-snug">
                  Questionnaires, Versions, Questions, Options, Urdu Translations, Branching Rules, Eligibilities, OTP.
                </p>
              </div>

              {/* Circle 3: Abdullah Zafar Khan */}
              <div
                onClick={() => setSelectedStudent(selectedStudent === "abdullah" ? "all" : "abdullah")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedStudent === "abdullah"
                    ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-300"
                    : "bg-[#FAF8F3] border-[#EAE6DD] hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#F59E0B] text-white font-black text-xs flex items-center justify-center">
                    3
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    10 Entities
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-[#171717]">Abdullah Zafar (2312467)</h4>
                <p className="text-[11px] font-bold text-amber-600 mt-0.5">Module 03: Campaigns &amp; Assets</p>
                <p className="text-[10px] text-[#77746F] mt-1 leading-snug">
                  Campaigns, Locations (5-tier), Billboards, Competitors, CompetitorAds, Assignments, Evidence.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive ERD Diagram Canvas */}
          <div className="bg-[#0B0F17] rounded-[24px] p-4 border border-[#1E293B] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between text-xs text-[#94A3B8] pb-3 px-2 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#D9F66A]" />
                <span className="font-bold text-white">Full Relational Schema (28 Entities Across 3 Circles)</span>
              </div>
              <span className="text-[11px]">Click image or links to open high-res full size</span>
            </div>

            <div className="overflow-auto max-h-[720px] rounded-xl mt-3 bg-[#0B0F17] border border-[#1E293B] p-2 flex items-center justify-center">
              <a
                href="/database/erd_students_annotated.svg"
                target="_blank"
                rel="noreferrer"
                title="Click to view full-resolution SVG in new tab"
                className="cursor-zoom-in block"
              >
                <img
                  src="/database/erd_students_annotated.svg"
                  alt="FYP Multi-Agent Market Research Platform 3-Circle Student ERD"
                  className="w-full h-auto min-w-[900px] object-contain transition-transform hover:scale-[1.01]"
                />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
