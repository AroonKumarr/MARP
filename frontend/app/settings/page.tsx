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
  User as UserIcon,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth(true);
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
    <div className="flex flex-col h-full max-w-4xl mx-auto pb-10">
      <div className="mb-6 pb-4 border-b border-[#ECE8E0]">
        <h2 className="text-xl font-black text-[#171717]">Company Workspace Settings</h2>
        <p className="text-xs text-[#77746F] mt-0.5">
          Tenant isolation, organization identity, and device governance policies.
        </p>
      </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Administrative Email
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
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Headquarters Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
            />
          </div>
        </Card>

        {/* Security & Device Policies */}
        <Card className="p-6 border border-[#ECE8E0] space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#171717]">
            <Shield className="w-4 h-4" />
            <span>Security & Device Governance</span>
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
                  Automatic Field Device Authorization
                </span>
                <p className="text-[11px] text-[#77746F]">
                  When enabled, Android mobile clients are approved immediately upon first surveyor sign-in.
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
            <span>Workspace Theme Token & Accent</span>
          </div>

          <div className="flex items-center gap-4">
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

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} variant="primary" size="md">
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Workspace Settings"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
