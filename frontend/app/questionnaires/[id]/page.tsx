"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Play,
  Send,
  GitBranch,
  Settings,
  Languages,
  CheckCircle,
  Trash2,
  MoveUp,
  MoveDown,
  Upload,
  MapPin,
  Star,
  CheckSquare,
  HelpCircle,
  Eye,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";

const QUESTION_TYPES = [
  { value: "short_answer", label: "Short Answer", icon: "Aa" },
  { value: "long_answer", label: "Long Answer", icon: "¶" },
  { value: "single_choice", label: "Single Choice (Radio)", icon: "🔘" },
  { value: "multiple_choice", label: "Multiple Choice", icon: "☑️" },
  { value: "dropdown", label: "Dropdown Select", icon: "▾" },
  { value: "checkboxes", label: "Checkboxes", icon: "✓" },
  { value: "rating_scale", label: "Rating Scale (1-5)", icon: "★" },
  { value: "date_time", label: "Date & Time", icon: "📅" },
  { value: "image_upload", label: "Photo / Image Upload", icon: "📷" },
  { value: "gps_location", label: "GPS Coordinates", icon: "📍" },
];

export default function QuestionnaireBuilderPage() {
  const { id } = useParams();
  const router = useRouter();

  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"builder" | "branching" | "preview" | "settings">("builder");

  // Modals
  const [isAddQuestionModal, setIsAddQuestionModal] = useState(false);
  const [isAddRuleModal, setIsAddRuleModal] = useState(false);
  const [isPublishModal, setIsPublishModal] = useState(false);

  // Question Form State
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("single_choice");
  const [qHelp, setQHelp] = useState("");
  const [qRequired, setQRequired] = useState(true);
  const [qOptions, setQOptions] = useState<string[]>(["Option 1", "Option 2"]);
  const [qUrduText, setQUrduText] = useState("");
  const [qUrduHelp, setQUrduHelp] = useState("");
  const [qUrduOptions, setQUrduOptions] = useState<string[]>(["", ""]);

  // Branching Rule Form State
  const [ruleSource, setRuleSource] = useState("");
  const [ruleTarget, setRuleTarget] = useState("");
  const [ruleOperator, setRuleOperator] = useState("equals");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleAction, setRuleAction] = useState("show");

  // Preview Mode State
  const [previewLanguage, setPreviewLanguage] = useState<"en" | "ur">("en");
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [visibleQuestionIds, setVisibleQuestionIds] = useState<string[]>([]);
  const [publishChangelog, setPublishChangelog] = useState("Initial certified version published");

  useEffect(() => {
    loadQuestionnaire();
  }, [id]);

  const loadQuestionnaire = async () => {
    try {
      const data = await apiFetch<any>(`/questionnaires/${id}`);
      setQuestionnaire(data);
      if (data.questions && data.questions.length > 0) {
        setRuleSource(data.questions[0].id);
        if (data.questions.length > 1) {
          setRuleTarget(data.questions[1].id);
        }
      }
    } catch (err) {
      console.error("Failed to load questionnaire", err);
    } finally {
      setLoading(false);
    }
  };

  // Evaluate branching in real time during preview
  useEffect(() => {
    if (activeTab === "preview" && questionnaire) {
      evaluateBranching();
    }
  }, [previewAnswers, activeTab, questionnaire]);

  const evaluateBranching = async () => {
    try {
      const res = await apiFetch<any>(`/questionnaires/${id}/preview-evaluate`, {
        method: "POST",
        body: JSON.stringify({ answers: previewAnswers }),
      });
      setVisibleQuestionIds(res.visible_question_ids);
    } catch (err) {
      console.error("Preview evaluation failed", err);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const optionsPayload = ["single_choice", "multiple_choice", "dropdown", "checkboxes"].includes(qType)
        ? qOptions.map((opt, i) => ({
            label: opt,
            value: opt,
            order_index: i,
          }))
        : [];

      const translationsPayload = qUrduText
        ? [
            {
              language_code: "ur",
              translated_text: qUrduText,
              translated_help_text: qUrduHelp || null,
              translated_options: qUrduOptions.map((opt, i) => ({
                label: opt || qOptions[i] || "",
                value: qOptions[i] || "",
              })),
            },
          ]
        : [];

      await apiFetch(`/questionnaires/${id}/questions`, {
        method: "POST",
        body: JSON.stringify({
          question_text: qText,
          question_type: qType,
          help_text: qHelp || null,
          is_required: qRequired,
          order_index: questionnaire.questions?.length || 0,
          options: optionsPayload,
          translations: translationsPayload,
        }),
      });

      setIsAddQuestionModal(false);
      resetQuestionForm();
      loadQuestionnaire();
    } catch (err: any) {
      alert(err.message || "Failed to add question");
    }
  };

  const resetQuestionForm = () => {
    setQText("");
    setQType("single_choice");
    setQHelp("");
    setQRequired(true);
    setQOptions(["Option 1", "Option 2"]);
    setQUrduText("");
    setQUrduHelp("");
    setQUrduOptions(["", ""]);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Are you sure you want to remove this question?")) return;
    try {
      await apiFetch(`/questions/${qId}`, { method: "DELETE" });
      loadQuestionnaire();
    } catch (err: any) {
      alert(err.message || "Failed to delete question");
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/questionnaires/${id}/rules`, {
        method: "POST",
        body: JSON.stringify({
          source_question_id: ruleSource,
          target_question_id: ruleTarget,
          condition_operator: ruleOperator,
          condition_value: ruleValue,
          action: ruleAction,
        }),
      });
      setIsAddRuleModal(false);
      setRuleValue("");
      loadQuestionnaire();
    } catch (err: any) {
      alert(err.message || "Failed to create branching rule");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await apiFetch(`/rules/${ruleId}`, { method: "DELETE" });
      loadQuestionnaire();
    } catch (err: any) {
      alert(err.message || "Failed to delete rule");
    }
  };

  const handlePublish = async () => {
    try {
      await apiFetch(`/questionnaires/${id}/publish?changelog=${encodeURIComponent(publishChangelog)}`, {
        method: "POST",
      });
      setIsPublishModal(false);
      loadQuestionnaire();
      alert("Questionnaire published successfully! Version snapshot has been sealed.");
    } catch (err: any) {
      alert(err.message || "Failed to publish questionnaire");
    }
  };

  if (loading || !questionnaire) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-4 border-[#111111] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ECE8E0]">
        <div className="flex items-center gap-3">
          <Link
            href="/questionnaires"
            className="w-9 h-9 rounded-full bg-white hover:bg-[#EAE6DD] border border-[#E5E1D8] flex items-center justify-center text-[#77746F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#171717]">{questionnaire.title}</h2>
              <Badge variant="periwinkle">{questionnaire.category}</Badge>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#111111] text-white">
                v{questionnaire.current_version}.0
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  questionnaire.status === "Published"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {questionnaire.status}
              </span>
            </div>
            <p className="text-xs text-[#77746F] mt-0.5">
              {questionnaire.questions?.length || 0} Questions • {questionnaire.branching_rules?.length || 0} Dynamic Rules
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab(activeTab === "preview" ? "builder" : "preview")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "preview"
                ? "bg-[#D9F66A] text-[#171717] shadow-sm"
                : "bg-white text-[#171717] border border-[#E5E1D8] hover:bg-[#F2EFE8]"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{activeTab === "preview" ? "Exit Preview" : "Preview Survey"}</span>
          </button>

          <Button onClick={() => setIsPublishModal(true)} variant="primary" size="sm">
            <Send className="w-3.5 h-3.5" />
            <span>Publish Version</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === "builder"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
          }`}
        >
          Visual Builder
        </button>

        <button
          onClick={() => setActiveTab("branching")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === "branching"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
          }`}
        >
          Conditional Branching ({questionnaire.branching_rules?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === "preview"
              ? "bg-[#111111] text-white shadow-sm"
              : "bg-white text-[#77746F] hover:bg-[#F2EFE8] border border-[#E5E1D8]"
          }`}
        >
          Interactive Preview
        </button>
      </div>

      {/* TAB 1: Visual Builder */}
      {activeTab === "builder" && (
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#171717]">
              Question Design Flow ({questionnaire.questions?.length || 0})
            </h3>
            <Button onClick={() => setIsAddQuestionModal(true)} variant="accent" size="sm">
              <Plus className="w-3.5 h-3.5" />
              Add Question
            </Button>
          </div>

          {questionnaire.questions?.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-[24px] border border-dashed border-[#DDD7CD]">
              <p className="text-sm font-bold text-[#171717]">No questions added yet</p>
              <p className="text-xs text-[#77746F] mt-1">
                Add single-choice, multiple-choice, photo capture, or GPS questions to get started.
              </p>
              <Button
                onClick={() => setIsAddQuestionModal(true)}
                variant="primary"
                size="sm"
                className="mt-4"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {questionnaire.questions.map((q: any, idx: number) => (
                <Card key={q.id} className="p-5 border border-[#ECE8E0] relative group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {idx + 1}
                      </span>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F3] border border-[#E5E1D8] text-[#77746F]">
                            {q.question_type.replace("_", " ").toUpperCase()}
                          </span>
                          {q.is_required && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              Required
                            </span>
                          )}
                          {q.translations?.length > 0 && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              Urdu Available
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-[#171717]">{q.question_text}</h4>
                        {q.help_text && (
                          <p className="text-xs text-[#77746F] mt-0.5">{q.help_text}</p>
                        )}

                        {/* Display choices if present */}
                        {q.options && q.options.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {q.options.map((opt: any) => (
                              <span
                                key={opt.id}
                                className="px-2.5 py-1 rounded-lg bg-[#F7F5EC] border border-[#E5E1D8] text-xs text-[#171717]"
                              >
                                {opt.label}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Urdu preview snippet */}
                        {q.translations && q.translations.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-[#F5F2EB] urdu-text text-sm text-[#3E520A]">
                            {q.translations[0].translated_text}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-lg text-[#77746F] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Branching Rules */}
      {activeTab === "branching" && (
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#171717]">
                Deterministic Conditional Logic Engine
              </h3>
              <p className="text-xs text-[#77746F]">
                Trigger dynamic questions based on respondent answers (e.g. If billboard condition equals "Poor", show damage photo upload).
              </p>
            </div>
            <Button onClick={() => setIsAddRuleModal(true)} variant="accent" size="sm">
              <Plus className="w-3.5 h-3.5" />
              Add Branching Rule
            </Button>
          </div>

          {questionnaire.branching_rules?.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-[24px] border border-dashed border-[#DDD7CD]">
              <GitBranch className="w-8 h-8 text-[#77746F] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#171717]">No conditional rules defined</p>
              <p className="text-xs text-[#77746F] mt-1 max-w-md mx-auto">
                All questions will render sequentially unless a conditional branching rule is configured.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questionnaire.branching_rules.map((rule: any, i: number) => {
                const sourceQ = questionnaire.questions?.find((q: any) => q.id === rule.source_question_id);
                const targetQ = questionnaire.questions?.find((q: any) => q.id === rule.target_question_id);
                return (
                  <Card key={rule.id} className="p-4 border border-[#ECE8E0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                        R{i + 1}
                      </div>

                      <div className="text-xs">
                        <span className="font-bold text-[#171717]">IF</span>{" "}
                        <span className="font-semibold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded">
                          {sourceQ?.question_text || rule.source_question_id}
                        </span>{" "}
                        <span className="font-bold text-[#171717]">{rule.condition_operator.toUpperCase()}</span>{" "}
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          "{rule.condition_value}"
                        </span>{" "}
                        <span className="font-bold text-[#171717]">THEN {rule.action.toUpperCase()}</span>{" "}
                        <span className="font-semibold text-[#3B2A6B] bg-purple-50 px-2 py-0.5 rounded">
                          {targetQ?.question_text || rule.target_question_id}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-[#77746F] hover:text-red-600 hover:bg-red-50"
                      title="Remove Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Interactive Survey Preview (English LTR & Urdu RTL) */}
      {activeTab === "preview" && (
        <div className="flex-1 max-w-3xl mx-auto w-full pb-10">
          <div className="bg-white rounded-[28px] border border-[#ECE8E0] p-6 sm:p-8 shadow-sm">
            {/* Language Switcher Bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F5F2EB]">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#77746F]" />
                <span className="text-xs font-bold text-[#77746F] uppercase tracking-wider">
                  Survey Language Switcher:
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#F7F5EC] p-1 rounded-full border border-[#E5E1D8]">
                <button
                  onClick={() => setPreviewLanguage("en")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    previewLanguage === "en"
                      ? "bg-[#111111] text-white shadow-xs"
                      : "text-[#77746F] hover:text-[#171717]"
                  }`}
                >
                  English (LTR)
                </button>
                <button
                  onClick={() => setPreviewLanguage("ur")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    previewLanguage === "ur"
                      ? "bg-[#111111] text-white shadow-xs"
                      : "text-[#77746F] hover:text-[#171717]"
                  }`}
                >
                  اردو (Urdu RTL)
                </button>
              </div>
            </div>

            {/* Header info */}
            <div className={`mb-6 ${previewLanguage === "ur" ? "urdu-text" : ""}`}>
              <h3 className="text-xl font-black text-[#171717]">{questionnaire.title}</h3>
              <p className="text-xs text-[#77746F] mt-1">{questionnaire.description}</p>
            </div>

            {/* Questions Form Runner */}
            <div className="space-y-6">
              {questionnaire.questions?.map((q: any, idx: number) => {
                const isVisible = visibleQuestionIds.length === 0 || visibleQuestionIds.includes(q.id);
                if (!isVisible) return null;

                const translation = q.translations?.find((t: any) => t.language_code === previewLanguage);
                const displayPrompt = previewLanguage === "ur" && translation ? translation.translated_text : q.question_text;
                const displayHelp = previewLanguage === "ur" && translation ? translation.translated_help_text : q.help_text;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl bg-[#FAF8F3] border border-[#ECE8E0] transition-all animate-fadeIn ${
                      previewLanguage === "ur" ? "urdu-text" : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <label className="text-sm font-bold text-[#171717]">
                        {idx + 1}. {displayPrompt}{" "}
                        {q.is_required && <span className="text-red-500">*</span>}
                      </label>
                    </div>

                    {displayHelp && (
                      <p className="text-xs text-[#77746F] mb-3">{displayHelp}</p>
                    )}

                    {/* Single Choice / Radio */}
                    {["single_choice", "dropdown"].includes(q.question_type) && (
                      <div className="space-y-2 mt-2">
                        {q.options?.map((opt: any) => {
                          const optTr = translation?.translated_options?.find((o: any) => o.value === opt.value);
                          const optLabel = previewLanguage === "ur" && optTr ? optTr.label : opt.label;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                previewAnswers[q.id] === opt.value
                                  ? "bg-white border-[#111111] shadow-xs"
                                  : "bg-white/60 border-[#E5E1D8] hover:bg-white"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                checked={previewAnswers[q.id] === opt.value}
                                onChange={() =>
                                  setPreviewAnswers({ ...previewAnswers, [q.id]: opt.value })
                                }
                                className="accent-[#111111] w-4 h-4"
                              />
                              <span className="text-xs font-semibold text-[#171717]">
                                {optLabel}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer */}
                    {q.question_type === "short_answer" && (
                      <input
                        type="text"
                        placeholder="Type respondent answer here..."
                        value={previewAnswers[q.id] || ""}
                        onChange={(e) =>
                          setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })
                        }
                        className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
                      />
                    )}

                    {/* Long Answer */}
                    {q.question_type === "long_answer" && (
                      <textarea
                        rows={3}
                        placeholder="Type observation details..."
                        value={previewAnswers[q.id] || ""}
                        onChange={(e) =>
                          setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })
                        }
                        className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
                      />
                    )}

                    {/* Image Upload */}
                    {q.question_type === "image_upload" && (
                      <div className="p-6 rounded-xl border-2 border-dashed border-[#DDD7CD] bg-white flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#FDFBF7]">
                        <Camera className="w-8 h-8 text-[#77746F] mb-2" />
                        <span className="text-xs font-bold text-[#171717]">
                          Capture or Select High-Resolution Photo
                        </span>
                        <span className="text-[11px] text-[#9E9B95] mt-0.5">
                          JPEG / PNG up to 15MB
                        </span>
                      </div>
                    )}

                    {/* GPS Coordinates */}
                    {q.question_type === "gps_location" && (
                      <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#ECE8E0]">
                        <MapPin className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-xs font-bold text-[#171717]">GPS Coordinate Locked</p>
                          <p className="text-[11px] font-mono text-[#77746F]">
                            33.7118° N, 73.0566° E (±4m accuracy)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-4 flex justify-end">
                <Button variant="accent" size="md">
                  Submit Mock Response
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      <Modal
        isOpen={isAddQuestionModal}
        onClose={() => setIsAddQuestionModal(false)}
        title="Add Question to Survey Design"
        description="Select question type and configure prompt, options, and Urdu translations."
        maxWidth="xl"
      >
        <form onSubmit={handleAddQuestion} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Question Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1.5">
              Question Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setQType(t.value)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    qType === t.value
                      ? "bg-[#111111] text-white border-transparent"
                      : "bg-white text-[#171717] border-[#ECE8E0] hover:bg-[#F5F2EB]"
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              English Prompt
            </label>
            <input
              type="text"
              required
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="e.g. What is the physical condition of the billboard structure?"
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Help Text / Surveyor Instructions
            </label>
            <input
              type="text"
              value={qHelp}
              onChange={(e) => setQHelp(e.target.value)}
              placeholder="e.g. Inspect frame alignment and torn vinyl edges."
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0] focus:border-[#111111] focus:outline-none"
            />
          </div>

          {/* Options Editor for Choice Questions */}
          {["single_choice", "multiple_choice", "dropdown", "checkboxes"].includes(qType) && (
            <div className="p-4 bg-white rounded-xl border border-[#ECE8E0] space-y-2">
              <label className="block text-xs font-bold text-[#171717] uppercase">
                Options / Discrete Choices
              </label>
              {qOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...qOptions];
                      updated[i] = e.target.value;
                      setQOptions(updated);
                    }}
                    className="flex-1 bg-[#FAF8F3] text-sm px-3 py-1.5 rounded-lg border border-[#E5E1D8]"
                  />
                  {qOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setQOptions(qOptions.filter((_, idx) => idx !== i));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                onClick={() => setQOptions([...qOptions, `Option ${qOptions.length + 1}`])}
                variant="secondary"
                size="sm"
                className="mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Option
              </Button>
            </div>
          )}

          {/* Urdu Localization Fields */}
          <div className="p-4 bg-[#F2F7E6] rounded-xl border border-[#D5E8B0] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#3E520A]">
              <Languages className="w-4 h-4" />
              <span>Urdu Localization (Optional for Bilingual Delivery)</span>
            </div>

            <input
              type="text"
              dir="rtl"
              value={qUrduText}
              onChange={(e) => setQUrduText(e.target.value)}
              placeholder="اردو میں سوال لکھیں (مثلاً: بل بورڈ کی حالت کیسی ہے؟)"
              className="w-full bg-white text-sm px-4 py-2 rounded-lg border border-[#D5E8B0] focus:outline-none urdu-text"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reqCheck"
              checked={qRequired}
              onChange={(e) => setQRequired(e.target.checked)}
              className="accent-[#111111] w-4 h-4"
            />
            <label htmlFor="reqCheck" className="text-xs font-bold text-[#171717] cursor-pointer">
              Mark this question as mandatory for field staff
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ECE8E0]">
            <Button
              type="button"
              onClick={() => setIsAddQuestionModal(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Question
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Branching Rule Modal */}
      <Modal
        isOpen={isAddRuleModal}
        onClose={() => setIsAddRuleModal(false)}
        title="Configure Conditional Branching Rule"
        description="Creates an automated logic condition evaluated during survey execution."
      >
        <form onSubmit={handleAddRule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Source Trigger Question
            </label>
            <select
              value={ruleSource}
              onChange={(e) => setRuleSource(e.target.value)}
              className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
            >
              {questionnaire.questions?.map((q: any) => (
                <option key={q.id} value={q.id}>
                  {q.question_text}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Comparison Operator
              </label>
              <select
                value={ruleOperator}
                onChange={(e) => setRuleOperator(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
              >
                <option value="equals">EQUALS</option>
                <option value="not_equals">NOT EQUALS</option>
                <option value="contains">CONTAINS</option>
                <option value="greater_than">GREATER THAN</option>
                <option value="less_than">LESS THAN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Expected Trigger Value
              </label>
              <input
                type="text"
                required
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                placeholder="e.g. Poor"
                className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Target Action
              </label>
              <select
                value={ruleAction}
                onChange={(e) => setRuleAction(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
              >
                <option value="show">SHOW Question</option>
                <option value="hide">HIDE Question</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Target Affected Question
              </label>
              <select
                value={ruleTarget}
                onChange={(e) => setRuleTarget(e.target.value)}
                className="w-full bg-white text-sm px-3 py-2.5 rounded-xl border border-[#ECE8E0]"
              >
                {questionnaire.questions?.map((q: any) => (
                  <option key={q.id} value={q.id}>
                    {q.question_text}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ECE8E0]">
            <Button
              type="button"
              onClick={() => setIsAddRuleModal(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Publish Modal */}
      <Modal
        isOpen={isPublishModal}
        onClose={() => setIsPublishModal(false)}
        title="Publish & Seal Questionnaire Version"
        description="Creates an immutable snapshot of all questions, options, and rules."
      >
        <div className="space-y-4">
          <p className="text-xs text-[#77746F] leading-relaxed">
            Publishing marks version <strong className="text-[#171717]">v{questionnaire.current_version}.0</strong> as immutable. Any subsequent modifications will automatically branch into a new draft version to preserve historical response integrity.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Version Changelog Note
            </label>
            <textarea
              rows={2}
              value={publishChangelog}
              onChange={(e) => setPublishChangelog(e.target.value)}
              className="w-full bg-white text-sm px-4 py-2.5 rounded-xl border border-[#ECE8E0]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ECE8E0]">
            <Button onClick={() => setIsPublishModal(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button onClick={handlePublish} variant="primary" size="sm">
              Confirm Publication
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
