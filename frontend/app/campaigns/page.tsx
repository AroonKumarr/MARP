"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Megaphone,
  MapPin,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  Plus,
  ExternalLink,
  ChevronRight,
  Shield,
  Eye,
  Building2,
  Tv,
} from "lucide-react";

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "advertisements" | "locations" | "competitors">("campaigns");

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [advertisements, setAdvertisements] = useState<any[]>([]);
  const [locationTree, setLocationTree] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Create Campaign Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("Billboard");
  const [budget, setBudget] = useState("2500000");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTabData();
  }, [activeTab, statusFilter]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === "campaigns") {
        let query = "/campaigns?page_size=50";
        if (statusFilter !== "All") query += `&status=${statusFilter}`;
        const data = await apiFetch<any>(query);
        setCampaigns(data.items || []);
      } else if (activeTab === "advertisements") {
        const ads = await apiFetch<any[]>("/advertisements");
        setAdvertisements(ads || []);
      } else if (activeTab === "locations") {
        const tree = await apiFetch<any[]>("/locations/tree");
        setLocationTree(tree || []);
      } else if (activeTab === "competitors") {
        const [comps, compRes] = await Promise.all([
          apiFetch<any[]>("/competitors"),
          apiFetch<any>("/competitors/compare?client_brand=Jazz"),
        ]);
        setCompetitors(comps || []);
        setComparison(compRes || null);
      }
    } catch (err) {
      console.error("Failed to load campaigns domain data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiFetch<any>("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title,
          code: code || `CMP-${Date.now().toString().slice(-4)}`,
          research_category: category,
          budget: parseFloat(budget) || 0,
          start_date: startDate,
          end_date: endDate,
          description,
        }),
      });
      setIsCreateModalOpen(false);
      window.location.href = `/campaigns/${created.id}`;
    } catch (err: any) {
      alert(err.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      await apiFetch(`/campaigns/${campaignId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      loadTabData();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <Header
        onSearch={(term) => setSearchTerm(term)}
        actionLabel="Create Campaign"
        onAction={() => setIsCreateModalOpen(true)}
      />

      {/* Domain Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-[#ECE8E0]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "campaigns"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] border border-[#E5E1D8] hover:bg-[#F2EFE8]"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Campaigns ({campaigns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("advertisements")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "advertisements"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] border border-[#E5E1D8] hover:bg-[#F2EFE8]"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Billboard Registry ({advertisements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("locations")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "locations"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] border border-[#E5E1D8] hover:bg-[#F2EFE8]"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Location Hierarchy (Pakistan)</span>
          </button>

          <button
            onClick={() => setActiveTab("competitors")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "competitors"
                ? "bg-[#111111] text-white shadow-sm"
                : "bg-white text-[#77746F] border border-[#E5E1D8] hover:bg-[#F2EFE8]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Competitor Intelligence</span>
          </button>
        </div>

        {activeTab === "campaigns" && (
          <div className="flex items-center gap-2">
            {["All", "Planning", "Active", "In Progress", "Completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusFilter === st
                    ? "bg-[#D9F66A] text-[#171717]"
                    : "text-[#77746F] hover:text-[#171717]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: Campaigns Grid */}
      {activeTab === "campaigns" && (
        <div className="flex-1">
          {filteredCampaigns.length === 0 ? (
            <EmptyState
              title="No campaigns found"
              description="Coordinate multi-market out-of-home campaigns, link questionnaires, and assign field staff."
              actionLabel="Launch New Campaign"
              onAction={() => setIsCreateModalOpen(true)}
              icon={<Megaphone className="w-8 h-8 text-[#77746F]" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCampaigns.map((c) => (
                <Card
                  key={c.id}
                  className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all group"
                >
                  <div>
                    {/* Header: Category & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[11px] font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.code}
                      </span>

                      {/* Status Dropdown */}
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${
                          c.status === "Active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : c.status === "In Progress"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : c.status === "Planning"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }`}
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>

                    <h3 className="text-base font-bold text-[#171717] line-clamp-1 mb-1 group-hover:text-[#3B2A6B] transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-[#77746F] line-clamp-2 leading-relaxed mb-4">
                      {c.description || "Multi-location research and advertising audit."}
                    </p>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-[#FAF8F3] rounded-xl border border-[#ECE8E0] mb-4 text-center">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#9E9B95]">
                          Sites
                        </span>
                        <span className="text-xs font-bold text-[#171717]">
                          {c.location_count}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#9E9B95]">
                          Billboards
                        </span>
                        <span className="text-xs font-bold text-[#171717]">
                          {c.advertisement_count}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-[#9E9B95]">
                          Staff
                        </span>
                        <span className="text-xs font-bold text-[#171717]">
                          {c.assignment_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-[#F5F2EB] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#77746F]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(c.start_date)}</span>
                    </div>

                    <Link href={`/campaigns/${c.id}`}>
                      <Button variant="secondary" size="sm" className="px-3 py-1">
                        <span>Workspace</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Billboard & Advertisement Registry */}
      {activeTab === "advertisements" && (
        <div className="flex-1">
          {advertisements.length === 0 ? (
            <EmptyState
              title="No billboard assets registered"
              description="Register out-of-home advertising media with exact dimensions, illumination type, and location links."
            />
          ) : (
            <div className="bg-white rounded-[24px] border border-[#ECE8E0] overflow-hidden shadow-xs">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[750px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F5F2EB] bg-[#FAF8F3] text-[#77746F] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Media Asset</th>
                    <th className="py-3.5 px-4">Brand</th>
                    <th className="py-3.5 px-4">Type & Illumination</th>
                    <th className="py-3.5 px-4">Dimensions (ft)</th>
                    <th className="py-3.5 px-4">Location Association</th>
                    <th className="py-3.5 px-4">Campaign</th>
                    <th className="py-3.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2EB]">
                  {advertisements.map((ad) => (
                    <tr key={ad.id} className="hover:bg-[#FCFBF8] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          {ad.image_url ? (
                            <img
                              src={ad.image_url}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover border border-[#E5E1D8]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#F7F5EC] border border-[#E5E1D8] flex items-center justify-center text-xs font-bold">
                              OOH
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[#171717]">{ad.name}</p>
                            <p className="text-[11px] text-[#77746F]">{ad.orientation || "Standard"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-[#171717]">{ad.brand}</td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#171717]">{ad.ad_type}</span>
                          <span className="text-[10px] text-[#77746F]">{ad.illumination_type}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#171717]">
                        {ad.dimensions}
                      </td>

                      <td className="py-3 px-4 text-[#77746F]">
                        {ad.location_name || "Unlinked site"}
                      </td>

                      <td className="py-3 px-4 text-[#77746F] font-medium">
                        {ad.campaign_title || "-"}
                      </td>

                      <td className="py-3 px-5 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ad.status}
                        </span>
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

      {/* TAB 3: 5-Tier Location Hierarchy Tree */}
      {activeTab === "locations" && (
        <div className="flex-1 bg-white rounded-[24px] border border-[#ECE8E0] p-6 shadow-xs">
          <div className="mb-4">
            <h4 className="text-base font-bold text-[#171717]">
              Hierarchical Location Explorer
            </h4>
            <p className="text-xs text-[#77746F] mt-0.5">
              5-Tier administrative nesting: Country → Province → City → Area → Site
            </p>
          </div>

          <div className="space-y-3">
            {locationTree.map((countryNode) => (
              <div key={countryNode.id} className="border border-[#E5E1D8] rounded-2xl p-4 bg-[#FAF8F3]">
                {/* Country Level */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#111111] text-white">
                    {countryNode.code}
                  </span>
                  <span className="text-sm font-bold text-[#171717]">{countryNode.name}</span>
                </div>

                {/* Provinces Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-[#DDD7CD]">
                  {countryNode.children?.map((prov: any) => (
                    <div key={prov.id} className="bg-white rounded-xl p-3 border border-[#ECE8E0]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          {prov.level.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-[#171717]">{prov.name}</span>
                      </div>

                      {/* Cities & Areas */}
                      <div className="space-y-1.5 pl-3 border-l border-[#ECE8E0]">
                        {prov.children?.map((city: any) => (
                          <div key={city.id} className="text-xs">
                            <span className="font-semibold text-[#171717]">📍 {city.name}</span>
                            <div className="pl-4 flex flex-wrap gap-1 mt-1">
                              {city.children?.map((area: any) => (
                                <span
                                  key={area.id}
                                  className="px-2 py-0.5 rounded-full bg-[#F7F5EC] border border-[#E5E1D8] text-[10px] text-[#77746F]"
                                >
                                  {area.name} ({area.children?.length || 0} sites)
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Competitor Intelligence & Comparison */}
      {activeTab === "competitors" && (
        <div className="flex-1 space-y-6">
          {comparison && (
            <div className="bg-white rounded-[24px] border border-[#ECE8E0] p-6 shadow-xs">
              <h4 className="text-base font-bold text-[#171717] mb-1">
                Comparative Share of Voice — {comparison.client_brand} vs Competitors
              </h4>
              <p className="text-xs text-[#77746F] mb-6">
                Real-time outdoor advertising footprint across monitored sites.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparison.comparison?.map((item: any) => (
                  <Card
                    key={item.brand}
                    className={`p-5 border ${
                      item.is_client
                        ? "bg-[#F7F5EC] border-[#111111] shadow-md"
                        : "bg-white border-[#ECE8E0]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-extrabold text-[#171717]">{item.brand}</span>
                      {item.is_client && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9F66A] text-[#171717]">
                          Your Brand
                        </span>
                      )}
                    </div>

                    <div className="my-4">
                      <span className="text-3xl font-black text-[#171717]">
                        {item.total_billboards}
                      </span>
                      <span className="text-xs text-[#77746F] ml-2">Total Billboards Monitored</span>
                    </div>

                    <div className="pt-3 border-t border-[#EAE6DD] text-xs space-y-1">
                      <p className="font-semibold text-[#171717]">Covered Locations:</p>
                      <p className="text-[#77746F] text-[11px]">
                        {item.locations_covered?.join(", ") || "No sites linked"}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Launch New Market Research Campaign"
        description="Establish operational scope, budget, dates, and campaign category."
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Campaign Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nationwide OOH Billboard Audit 2026"
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Campaign Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CMP-2026-ISB-01"
                className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Research Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
              >
                <option value="Billboard">Billboard</option>
                <option value="Retail">Retail</option>
                <option value="Competitor">Competitor</option>
                <option value="Field">Field Research</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Budget (PKR)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2 rounded-xl border border-[#ECE8E0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2 rounded-xl border border-[#ECE8E0]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2 rounded-xl border border-[#ECE8E0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Objectives & Strategy
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline research scope, target geographic zones, and audit deliverables..."
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ECE8E0]">
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} variant="primary" size="sm">
              {submitting ? "Launching..." : "Launch Campaign Workspace"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
