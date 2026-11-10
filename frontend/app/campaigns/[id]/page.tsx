"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Tv,
  MapPin,
  Calendar,
  Users,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [fieldStaff, setFieldStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"ads" | "assignments" | "evidence">("ads");

  // Modals
  const [isAddAdModal, setIsAddAdModal] = useState(false);
  const [isAddAssignmentModal, setIsAddAssignmentModal] = useState(false);

  // Advertisement Form State
  const [adName, setAdName] = useState("");
  const [adType, setAdType] = useState("Static Billboard");
  const [adBrand, setAdBrand] = useState("Jazz");
  const [adDimensions, setAdDimensions] = useState("60x20");
  const [adIllumination, setAdIllumination] = useState("Frontlit");
  const [adOrientation, setAdOrientation] = useState("North-Facing");
  const [adLocationId, setAdLocationId] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");

  // Assignment Form State
  const [asgnUserId, setAsgnUserId] = useState("");
  const [asgnLocationId, setAsgnLocationId] = useState("");
  const [asgnQuestionnaireId, setAsgnQuestionnaireId] = useState("");
  const [asgnScheduledDate, setAsgnScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [asgnDueDate, setAsgnDueDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]);
  const [asgnPriority, setAsgnPriority] = useState("Medium");
  const [asgnNotes, setAsgnNotes] = useState("");

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const [campData, locsData, qData, usersData] = await Promise.all([
        apiFetch<any>(`/campaigns/${id}`),
        apiFetch<any[]>("/locations"),
        apiFetch<any>("/questionnaires?page_size=50"),
        apiFetch<any>("/users?page_size=50&role_name=Field Staff"),
      ]);
      setCampaign(campData);
      setLocations(locsData || []);
      setQuestionnaires(qData.items || []);
      setFieldStaff(usersData.items || []);

      if (locsData && locsData.length > 0) {
        setAdLocationId(locsData[0].id);
        setAsgnLocationId(locsData[0].id);
      }
      if (qData.items && qData.items.length > 0) {
        setAsgnQuestionnaireId(qData.items[0].id);
      }
      if (usersData.items && usersData.items.length > 0) {
        setAsgnUserId(usersData.items[0].id);
      }
    } catch (err) {
      console.error("Failed to load campaign details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/advertisements", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: id,
          location_id: adLocationId,
          name: adName,
          ad_type: adType,
          brand: adBrand,
          dimensions: adDimensions,
          orientation: adOrientation,
          illumination_type: adIllumination,
          image_url: adImageUrl || null,
          status: "Active",
        }),
      });
      setIsAddAdModal(false);
      setAdName("");
      loadCampaign();
    } catch (err: any) {
      alert(err.message || "Failed to register advertisement");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/assignments", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: id,
          user_id: asgnUserId,
          location_id: asgnLocationId,
          questionnaire_id: asgnQuestionnaireId,
          scheduled_date: asgnScheduledDate,
          due_date: asgnDueDate,
          priority: asgnPriority,
          notes: asgnNotes,
        }),
      });
      setIsAddAssignmentModal(false);
      setAsgnNotes("");
      loadCampaign();
    } catch (err: any) {
      alert(err.message || "Failed to assign field staff");
    }
  };

  const handleVerifyEvidence = async (evidenceId: string, status: "Verified" | "Rejected") => {
    try {
      await apiFetch(`/campaign-evidence/${evidenceId}/review`, {
        method: "PUT",
        body: JSON.stringify({
          verification_status: status,
          notes: `Verified by reviewer on ${new Date().toLocaleDateString()}`,
        }),
      });
      loadCampaign();
    } catch (err: any) {
      alert(err.message || "Failed to review evidence");
    }
  };

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-4 border-[#111111] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Breadcrumb & Campaign Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ECE8E0]">
        <div className="flex items-center gap-3">
          <Link
            href="/campaigns"
            className="w-9 h-9 rounded-full bg-white hover:bg-[#EAE6DD] border border-[#E5E1D8] flex items-center justify-center text-[#77746F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {campaign.code}
              </span>
              <h2 className="text-xl font-black text-[#171717]">{campaign.title}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D9F66A] text-[#171717]">
                {campaign.status}
              </span>
            </div>

            <p className="text-xs text-[#77746F] mt-0.5">
              Category: {campaign.research_category} • Manager: {campaign.manager_name || "Assigned"} • Dates: {formatDate(campaign.start_date)} to {formatDate(campaign.end_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={() => setIsAddAdModal(true)} variant="secondary" size="sm">
            <Tv className="w-3.5 h-3.5" />
            <span>Register Billboard</span>
          </Button>

          <Button onClick={() => setIsAddAssignmentModal(true)} variant="primary" size="sm">
            <Users className="w-3.5 h-3.5" />
            <span>Schedule Field Staff</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab("ads")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === "ads"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Billboards ({campaign.advertisements?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === "assignments"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Field Staff Assignments ({campaign.assignments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("evidence")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === "evidence"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Field Evidence ({campaign.evidence?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: Registered Billboards in Campaign */}
      {activeTab === "ads" && (
        <div className="flex-1">
          {campaign.advertisements?.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-[24px] border border-dashed border-[#DDD7CD]">
              <p className="text-sm font-bold text-[#171717]">No billboards linked yet</p>
              <p className="text-xs text-[#77746F] mt-1">
                Register static unipoles, digital LEDs, or gantries under this campaign.
              </p>
              <Button onClick={() => setIsAddAdModal(true)} variant="primary" size="sm" className="mt-4">
                <Plus className="w-3.5 h-3.5" />
                Register First Billboard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaign.advertisements.map((ad: any) => (
                <Card key={ad.id} className="p-5 border border-[#ECE8E0] flex flex-col justify-between">
                  <div>
                    {ad.image_url && (
                      <img
                        src={ad.image_url}
                        alt=""
                        className="w-full h-36 rounded-xl object-cover mb-3 border border-[#E5E1D8]"
                      />
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#171717]">{ad.brand}</span>
                      <span className="font-mono text-xs font-black text-[#171717] bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E5E1D8]">
                        {ad.dimensions} ft
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#171717] mb-1">{ad.name}</h4>
                    <p className="text-xs text-[#77746F]">
                      📍 {ad.location_name || "Assigned location"} • {ad.illumination_type}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#F5F2EB] flex items-center justify-between">
                    <Badge variant="periwinkle">{ad.ad_type}</Badge>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {ad.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Field Staff Assignments */}
      {activeTab === "assignments" && (
        <div className="flex-1 bg-white rounded-[24px] border border-[#ECE8E0] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F5F2EB] bg-[#FAF8F3] text-[#77746F] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Field Staff Member</th>
                <th className="py-3.5 px-4">Audit Location</th>
                <th className="py-3.5 px-4">Assigned Questionnaire</th>
                <th className="py-3.5 px-4">Schedule Window</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EB]">
              {campaign.assignments?.map((asgn: any) => (
                <tr key={asgn.id} className="hover:bg-[#FCFBF8] transition-colors">
                  <td className="py-3 px-5 font-bold text-[#171717]">
                    {asgn.user_name || "Field Surveyor"}
                  </td>

                  <td className="py-3 px-4 text-[#77746F]">
                    {asgn.location_name}
                  </td>

                  <td className="py-3 px-4 font-medium text-[#171717]">
                    {asgn.questionnaire_title}
                  </td>

                  <td className="py-3 px-4 text-[#77746F]">
                    {formatDate(asgn.scheduled_date)} — {formatDate(asgn.due_date)}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        asgn.priority === "High"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {asgn.priority}
                    </span>
                  </td>

                  <td className="py-3 px-5 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        asgn.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : asgn.status === "In Progress"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {asgn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Field Evidence Verification */}
      {activeTab === "evidence" && (
        <div className="flex-1 space-y-4">
          {campaign.evidence?.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-[24px] border border-dashed border-[#DDD7CD]">
              <ImageIcon className="w-8 h-8 text-[#77746F] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#171717]">No field evidence submitted yet</p>
              <p className="text-xs text-[#77746F] mt-1">
                Evidence photographs and GPS observations captured by surveyors will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaign.evidence.map((ev: any) => (
                <Card key={ev.id} className="p-4 border border-[#ECE8E0] space-y-3">
                  <img
                    src={ev.file_url}
                    alt=""
                    className="w-full h-44 rounded-xl object-cover border border-[#E5E1D8]"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171717]">{ev.evidence_type}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.verification_status === "Verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : ev.verification_status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ev.verification_status}
                    </span>
                  </div>

                  <p className="text-xs text-[#77746F]">📍 {ev.location_name}</p>

                  <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between">
                    <span className="text-[11px] text-[#9E9B95]">{formatDate(ev.recorded_at)}</span>

                    {ev.verification_status === "Pending" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleVerifyEvidence(ev.id, "Verified")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Verify
                        </button>

                        <button
                          onClick={() => handleVerifyEvidence(ev.id, "Rejected")}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Billboard Modal */}
      <Modal
        isOpen={isAddAdModal}
        onClose={() => setIsAddAdModal(false)}
        title="Register Billboard Media Asset"
        description="Links physical advertisement dimensions and illumination specs to this campaign."
      >
        <form onSubmit={handleCreateAd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Advertisement Name
            </label>
            <input
              type="text"
              required
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
              placeholder="e.g. Jazz 5G Speed Unipole - Beverly"
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Ad Type
              </label>
              <select
                value={adType}
                onChange={(e) => setAdType(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
              >
                <option value="Static Billboard">Static Billboard</option>
                <option value="Digital LED">Digital LED Screen</option>
                <option value="Unipole">Unipole</option>
                <option value="Gantry">Gantry</option>
                <option value="Transit Shelter">Transit Shelter</option>
                <option value="Wall Branding">Wall Branding</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Client Brand
              </label>
              <input
                type="text"
                required
                value={adBrand}
                onChange={(e) => setAdBrand(e.target.value)}
                className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Dimensions (Width × Height ft)
              </label>
              <input
                type="text"
                required
                value={adDimensions}
                onChange={(e) => setAdDimensions(e.target.value)}
                placeholder="60x20"
                className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Illumination Type
              </label>
              <select
                value={adIllumination}
                onChange={(e) => setAdIllumination(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
              >
                <option value="Frontlit">Frontlit (Halogen / LED)</option>
                <option value="Backlit">Backlit</option>
                <option value="Digital/LED">Digital / LED</option>
                <option value="Unlit">Unlit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Geographic Audit Site Link
            </label>
            <select
              value={adLocationId}
              onChange={(e) => setAdLocationId(e.target.value)}
              className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.level.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Reference Artwork URL
            </label>
            <input
              type="url"
              value={adImageUrl}
              onChange={(e) => setAdImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ECE8E0]">
            <Button type="button" onClick={() => setIsAddAdModal(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Register Media Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Field Assignment Modal */}
      <Modal
        isOpen={isAddAssignmentModal}
        onClose={() => setIsAddAssignmentModal(false)}
        title="Schedule & Dispatch Field Staff"
        description="Assign authorized surveyor to campaign location and questionnaire."
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Field Staff Member (Authorized Only)
            </label>
            <select
              value={asgnUserId}
              onChange={(e) => setAsgnUserId(e.target.value)}
              className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
            >
              {fieldStaff.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Target Audit Site
            </label>
            <select
              value={asgnLocationId}
              onChange={(e) => setAsgnLocationId(e.target.value)}
              className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Assigned Questionnaire Form
            </label>
            <select
              value={asgnQuestionnaireId}
              onChange={(e) => setAsgnQuestionnaireId(e.target.value)}
              className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
            >
              {questionnaires.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} (v{q.current_version}.0)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                required
                value={asgnScheduledDate}
                onChange={(e) => setAsgnScheduledDate(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2 rounded-xl border border-[#ECE8E0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={asgnDueDate}
                onChange={(e) => setAsgnDueDate(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2 rounded-xl border border-[#ECE8E0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Priority
              </label>
              <select
                value={asgnPriority}
                onChange={(e) => setAsgnPriority(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2 rounded-xl border border-[#ECE8E0]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Surveyor Instructions
            </label>
            <textarea
              rows={2}
              value={asgnNotes}
              onChange={(e) => setAsgnNotes(e.target.value)}
              placeholder="e.g. Capture structural junction photos and record nighttime illumination."
              className="w-full bg-white text-sm px-4 py-2 rounded-xl border border-[#ECE8E0]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ECE8E0]">
            <Button type="button" onClick={() => setIsAddAssignmentModal(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Dispatch Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
