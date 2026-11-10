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
  FileQuestion,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
} from "lucide-react";

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Billboard");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestionnaires();
  }, [categoryFilter, statusFilter]);

  const loadQuestionnaires = async () => {
    setLoading(true);
    try {
      let query = "/questionnaires?page_size=50";
      if (categoryFilter !== "All") query += `&category=${categoryFilter}`;
      if (statusFilter !== "All") query += `&status=${statusFilter}`;
      const data = await apiFetch<any>(query);
      setQuestionnaires(data.items || []);
    } catch (err) {
      console.error("Failed to load questionnaires", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiFetch<any>("/questionnaires", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
        }),
      });
      setIsCreateModalOpen(false);
      setTitle("");
      setDescription("");
      window.location.href = `/questionnaires/${created.id}`;
    } catch (err: any) {
      alert(err.message || "Failed to create questionnaire");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/questionnaires/${id}/duplicate`, { method: "POST" });
      loadQuestionnaires();
    } catch (err: any) {
      alert(err.message || "Failed to duplicate questionnaire");
    }
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete '${title}'?`)) return;
    try {
      await apiFetch(`/questionnaires/${id}`, { method: "DELETE" });
      loadQuestionnaires();
    } catch (err: any) {
      alert(err.message || "Failed to delete questionnaire");
    }
  };

  const filtered = questionnaires.filter((q) =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <Header
        onSearch={(term) => setSearchTerm(term)}
        actionLabel="Create Questionnaire"
        onAction={() => setIsCreateModalOpen(true)}
      />

      {/* Categories Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-[#ECE8E0]">
        {/* Research Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {["All", "Billboard", "Retail", "Competitor", "Field"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                categoryFilter === cat
                  ? "bg-[#111111] text-white shadow-sm"
                  : "bg-white text-[#77746F] border border-[#E5E1D8] hover:bg-[#F2EFE8]"
              }`}
            >
              {cat === "All" ? "All Categories" : `${cat} Surveys`}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {["All", "Draft", "Published"].map((st) => (
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
      </div>

      {/* Grid of Questionnaires */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No questionnaires found"
          description="Design surveys with branching logic, image capture, and Urdu translation for on-ground field data collection."
          actionLabel="Create First Questionnaire"
          onAction={() => setIsCreateModalOpen(true)}
          icon={<FileQuestion className="w-8 h-8 text-[#77746F]" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((q) => (
            <Card
              key={q.id}
              className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-all group"
            >
              <div>
                {/* Header Tag & Version */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge
                    variant={
                      q.category === "Retail"
                        ? "lime"
                        : q.category === "Billboard"
                        ? "periwinkle"
                        : q.category === "Competitor"
                        ? "lavender"
                        : "mint"
                    }
                  >
                    {q.category}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F3] border border-[#E5E1D8] text-[#77746F]">
                      v{q.current_version}.0
                    </span>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === "Published"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-[#171717] line-clamp-1 group-hover:text-[#3B2A6B] transition-colors mb-1.5">
                  {q.title}
                </h3>
                <p className="text-xs text-[#77746F] line-clamp-2 leading-relaxed mb-4">
                  {q.description || "Structured market survey template for on-ground audit."}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#F5F2EB] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#77746F] font-medium">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{q.question_count} Questions</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDuplicate(q.id, e)}
                    className="p-1.5 rounded-lg text-[#77746F] hover:text-[#171717] hover:bg-[#F2EFE8]"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(q.id, q.title, e)}
                    className="p-1.5 rounded-lg text-[#77746F] hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <Link href={`/questionnaires/${q.id}`}>
                    <Button variant="secondary" size="sm" className="px-3 py-1">
                      <span>Builder</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Market Research Questionnaire"
        description="Select the survey domain and establish core research objectives."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Survey Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FMCG Retail Presence & Visibility Audit"
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Research Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            >
              <option value="Billboard">Billboard (OOH Media & Visibility)</option>
              <option value="Retail">Retail (Shelf Share, Planogram Compliance)</option>
              <option value="Competitor">Competitor (Comparative Share of Voice)</option>
              <option value="Field">Field Research (Consumer Intercepts & GPS)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide instructions for field staff regarding survey objectives and photo guidelines..."
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
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
              {submitting ? "Creating..." : "Launch Visual Builder"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
