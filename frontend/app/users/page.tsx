"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  Users as UsersIcon,
  Smartphone,
  Shield,
  Activity,
  UserPlus,
  Mail,
  CheckCircle,
  XCircle,
  MoreVertical,
  KeyRound,
  Trash2,
} from "lucide-react";

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth(true);
  const [activeTab, setActiveTab] = useState<"users" | "devices" | "audit">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("Password123!");
  const [formRole, setFormRole] = useState("Field Staff");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Field Staff");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const [usersRes, rolesRes] = await Promise.all([
          apiFetch<any>("/users?page_size=50"),
          apiFetch<any>("/roles"),
        ]);
        setUsers(usersRes.items || []);
        setRoles(rolesRes || []);
      } else if (activeTab === "devices") {
        const devs = await apiFetch<any[]>("/devices");
        setDevices(devs || []);
      } else if (activeTab === "audit") {
        const logsRes = await apiFetch<any>("/audit-logs?page_size=50");
        setAuditLogs(logsRes.items || []);
      }
    } catch (err) {
      console.error("Failed to load users data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          full_name: formName,
          email: formEmail,
          phone: formPhone || undefined,
          password: formPassword,
          role_names: [formRole],
        }),
      });
      setIsAddModalOpen(false);
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/users/invite", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          role_name: inviteRole,
        }),
      });
      setIsInviteModalOpen(false);
      setInviteEmail("");
      alert(`Invitation sent to ${inviteEmail}`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to invite user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    try {
      const endpoint = user.is_active
        ? `/users/${user.id}/deactivate`
        : `/users/${user.id}/reactivate`;
      await apiFetch(endpoint, { method: "POST" });
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to change user status");
    }
  };

  const handleApproveDevice = async (deviceId: string) => {
    try {
      await apiFetch(`/devices/${deviceId}/approve`, { method: "PUT" });
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to approve device");
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      await apiFetch(`/devices/${deviceId}/revoke`, { method: "PUT" });
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke device");
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "All" || u.roles.some((r: any) => r.name === roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Role Permission Notice for Non-Administrators */}
      {!isAdmin() && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Role Scope:</strong> Logged in as <strong>{currentUser?.roles?.[0]?.name || "Field Staff"}</strong>. Administrative operations (Add/Deactivate Users, Manage Roles, Approve Hardware) require <strong>Company Administrator</strong> rights.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-200 text-blue-800 flex-shrink-0">
            Read-Only Directory
          </span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onSearch={(term) => setSearchTerm(term)}
        actionLabel={isAdmin() ? "Add User" : undefined}
        onAction={isAdmin() ? () => setIsAddModalOpen(true) : undefined}
      />

      {/* Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-[#ECE8E0]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "users"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
            }`}
          >
            <UsersIcon className="w-3.5 h-3.5" />
            <span>Workspace Personnel ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("devices")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "devices"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Registered Devices ({devices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "audit"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {activeTab === "users" && isAdmin() && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              variant="secondary"
              size="sm"
            >
              <Mail className="w-3.5 h-3.5" />
              Invite Via Token
            </Button>
          </div>
        )}
      </div>

      {/* Tab 1: Users Table */}
      {activeTab === "users" && (
        <div className="flex-1">
          {/* Role Filter Pills */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {["All", "Company Administrator", "Research Manager", "Analyst", "Field Staff", "Evidence Reviewer"].map(
              (r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    roleFilter === r
                      ? "bg-[#111111] text-white shadow-xs"
                      : "bg-white text-[#77746F] border border-[#ECE8E0] hover:bg-[#F5F2EB]"
                  }`}
                >
                  {r}
                </button>
              )
            )}
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState
              title="No users match your filter"
              description="Create a new user or invite team members to join this company workspace."
              actionLabel="Add Personnel"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="bg-white rounded-[24px] border border-[#ECE8E0] overflow-hidden shadow-xs">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F5F2EB] bg-[#FAF8F3] text-[#77746F] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Roles</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Joined</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2EB]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FCFBF8] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`
                            }
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-[#E5E1D8]"
                          />
                          <div>
                            <p className="font-bold text-[#171717] text-[13px]">
                              {u.full_name}
                            </p>
                            <p className="text-[11px] text-[#77746F]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#77746F]">
                        {u.phone || "No phone recorded"}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r: any) => (
                            <Badge
                              key={r.id}
                              variant={
                                r.name === "Company Administrator"
                                  ? "dark"
                                  : r.name === "Research Manager"
                                  ? "lavender"
                                  : r.name === "Field Staff"
                                  ? "lime"
                                  : "periwinkle"
                              }
                            >
                              {r.name}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {u.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#77746F]">
                        {formatDate(u.created_at)}
                      </td>

                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin() ? (
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                u.is_active
                                  ? "bg-white text-red-600 border-red-200 hover:bg-red-50"
                                  : "bg-emerald-600 text-white border-transparent hover:bg-emerald-700"
                              }`}
                            >
                              {u.is_active ? "Deactivate" : "Activate"}
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-[#9E9B95] italic">
                              View Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Registered Devices */}
      {activeTab === "devices" && (
        <div className="flex-1">
          {devices.length === 0 ? (
            <EmptyState
              title="No devices registered yet"
              description="Field surveyors register their Android devices during first login from the mobile application."
            />
          ) : (
            <div className="bg-white rounded-[24px] border border-[#ECE8E0] overflow-hidden shadow-xs">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F5F2EB] bg-[#FAF8F3] text-[#77746F] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Device</th>
                    <th className="py-3.5 px-4">Hardware Identifier (IMEI)</th>
                    <th className="py-3.5 px-4">Assigned Surveyor</th>
                    <th className="py-3.5 px-4">OS & App Version</th>
                    <th className="py-3.5 px-4">Authorization</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2EB]">
                  {devices.map((d) => (
                    <tr key={d.id} className="hover:bg-[#FCFBF8] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#F7F5EC] border border-[#E5E1D8] flex items-center justify-center text-[#171717]">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[#171717]">{d.device_name}</p>
                            <p className="text-[11px] text-[#77746F]">{d.model}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#171717]">
                        {d.device_identifier}
                      </td>

                      <td className="py-3 px-4 font-medium text-[#171717]">
                        {d.user_name || "Unassigned"}
                      </td>

                      <td className="py-3 px-4 text-[#77746F]">
                        {d.os_version} • {d.app_version}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            d.status === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : d.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin() ? (
                            <>
                              {d.status !== "Approved" && (
                                <button
                                  onClick={() => handleApproveDevice(d.id)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold"
                                >
                                  Approve
                                </button>
                              )}
                              {d.status !== "Revoked" && (
                                <button
                                  onClick={() => handleRevokeDevice(d.id)}
                                  className="px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-semibold"
                                >
                                  Revoke
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] font-medium text-[#9E9B95] italic">
                              Admin Required
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Audit Activity Trail */}
      {activeTab === "audit" && (
        <div className="flex-1">
          <div className="bg-white rounded-[24px] border border-[#ECE8E0] p-6 shadow-xs">
            <h4 className="text-sm font-bold text-[#171717] mb-4">
              System Audit Transactions
            </h4>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#EAE6DD] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                      {log.actor_name ? log.actor_name[0] : "S"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#171717]">
                        <span className="font-extrabold">{log.actor_name || "System"}</span>{" "}
                        executed action{" "}
                        <span className="text-[#3E520A] bg-[#D9F66A] px-2 py-0.5 rounded-full font-mono text-[10px]">
                          {log.action}
                        </span>{" "}
                        on {log.resource_type}
                      </p>
                      <p className="text-[11px] text-[#77746F] mt-0.5">
                        Target ID: {log.resource_id}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#9E9B95]">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Workspace Personnel"
        description="Creates an active account with assigned role and access permissions."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Mudasir Ali"
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="mudasir@company.com"
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+92-300-1234567"
                className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Role Assignment
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
              >
                <option value="Field Staff">Field Staff (Surveyor)</option>
                <option value="Research Manager">Research Manager</option>
                <option value="Analyst">Research Analyst</option>
                <option value="Evidence Reviewer">Evidence Reviewer</option>
                <option value="Company Administrator">Company Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Initial Password
            </label>
            <input
              type="password"
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ECE8E0]">
            <Button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} variant="primary" size="sm">
              {submitting ? "Creating..." : "Save Personnel Record"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite User Via Cryptographic Token"
        description="Generates an invitation link and token valid for 7 days."
      >
        <form onSubmit={handleInviteUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborator@partner.com"
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Designated Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            >
              <option value="Field Staff">Field Staff</option>
              <option value="Research Manager">Research Manager</option>
              <option value="Analyst">Analyst</option>
              <option value="Evidence Reviewer">Evidence Reviewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ECE8E0]">
            <Button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} variant="primary" size="sm">
              {submitting ? "Issuing..." : "Generate Invitation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
