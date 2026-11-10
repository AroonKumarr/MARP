"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Layers,
  Sparkles,
  Maximize2,
  FileText,
} from "lucide-react";

export default function StandaloneERDPage() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<"all" | "aroon" | "mudasir" | "abdullah">("all");
  const [format, setFormat] = useState<"svg" | "png">("svg");
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.4));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const imgSrc =
    format === "svg" && !imgError
      ? "/database/erd_students_annotated.svg"
      : "/database/erd_presentation_1920.png";

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans antialiased text-[#0F172A]">
      {/* Top Navigation & Action Toolbar */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#CBD5E1] flex items-center justify-center text-[#475569] transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                MARP • 3-Circle Student ERD
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F172A] text-white">
                v1.0 Final
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Master Relational Schema (28 Tables) • Aroon Kumar, Mudasir Ali, Abdullah Zafar Khan
            </p>
          </div>
        </div>

        {/* Center Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0]">
          <button
            onClick={() => setSelectedStudent("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedStudent === "all"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            All 3 Circles
          </button>
          <button
            onClick={() => setSelectedStudent("aroon")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedStudent === "aroon"
                ? "bg-[#4338CA] text-white shadow-xs"
                : "text-[#4338CA] hover:bg-indigo-50"
            }`}
          >
            Circle 1: Aroon
          </button>
          <button
            onClick={() => setSelectedStudent("mudasir")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedStudent === "mudasir"
                ? "bg-[#065F46] text-white shadow-xs"
                : "text-[#065F46] hover:bg-emerald-50"
            }`}
          >
            Circle 2: Mudasir
          </button>
          <button
            onClick={() => setSelectedStudent("abdullah")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selectedStudent === "abdullah"
                ? "bg-[#92400E] text-white shadow-xs"
                : "text-[#92400E] hover:bg-amber-50"
            }`}
          >
            Circle 3: Abdullah
          </button>
        </div>

        {/* Right Action Tools: Format Toggle, Zoom & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Format Toggle: SVG vs PNG */}
          <div className="flex items-center bg-[#F1F5F9] border border-[#CBD5E1] rounded-full p-0.5 text-xs font-bold">
            <button
              onClick={() => {
                setFormat("svg");
                setImgError(false);
              }}
              className={`px-2.5 py-1 rounded-full transition-all ${
                format === "svg" && !imgError
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Vector SVG
            </button>
            <button
              onClick={() => setFormat("png")}
              className={`px-2.5 py-1 rounded-full transition-all ${
                format === "png" || imgError
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              High-Res PNG
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-full p-1 gap-1">
            <button
              onClick={handleZoomOut}
              className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-[#475569]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-[#0F172A]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-[#475569]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-[#475569]"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#0F172A] flex items-center gap-1.5 transition-colors shadow-xs"
            title="Copy shareable link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          {/* Print / Save as PDF */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#0F172A] flex items-center gap-1.5 transition-colors shadow-xs"
            title="Print or Save to PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>

          {/* Open Raw in New Tab */}
          <a
            href={imgSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#0F172A] flex items-center gap-1.5 transition-colors shadow-xs"
            title="Open raw image in full new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#475569]" />
            <span>Full Image</span>
          </a>

          {/* Downloads */}
          <a
            href="/database/erd_students_annotated.svg"
            download="MARP_3_Circle_Student_ERD.svg"
            target="_blank"
            className="px-3.5 py-1.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </a>

          <a
            href="/database/erd_presentation_1920.png"
            download="MARP_3_Circle_ERD_1080p.png"
            target="_blank"
            className="px-3 py-1.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </a>

          <a
            href="/presentation/MARP_FYP_Defense_Presentation_Script.pdf"
            download="MARP_FYP_Defense_Presentation_Script.pdf"
            target="_blank"
            className="px-3 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            title="Download 10-Minute Presentation Script (PDF)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Script PDF</span>
          </a>
        </div>
      </header>

      {/* Student Scope Highlights Header Card */}
      <section className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-3 print:hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Aroon */}
          <div
            onClick={() => setSelectedStudent(selectedStudent === "aroon" ? "all" : "aroon")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedStudent === "aroon" || selectedStudent === "all"
                ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200"
                : "bg-[#F8FAFC] border-[#E2E8F0] opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="w-5 h-5 rounded-full bg-[#4338CA] text-white text-[10px] font-black flex items-center justify-center">
                1
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                10 Entities
              </span>
            </div>
            <p className="text-xs font-extrabold text-[#0F172A]">Aroon Kumar (Seat: 2312466)</p>
            <p className="text-[11px] font-bold text-indigo-700">Module 01: User &amp; Workspace Management</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Companies, Workspace Settings, Users, Roles, Permissions, Devices, Invites, Audit Trail.
            </p>
          </div>

          {/* Card 2: Mudasir */}
          <div
            onClick={() => setSelectedStudent(selectedStudent === "mudasir" ? "all" : "mudasir")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedStudent === "mudasir" || selectedStudent === "all"
                ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200"
                : "bg-[#F8FAFC] border-[#E2E8F0] opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="w-5 h-5 rounded-full bg-[#065F46] text-white text-[10px] font-black flex items-center justify-center">
                2
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                8 Entities
              </span>
            </div>
            <p className="text-xs font-extrabold text-[#0F172A]">Mudasir Ali (Seat: 2312465)</p>
            <p className="text-[11px] font-bold text-emerald-700">Module 02: Questionnaire Management &amp; Logic</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Questionnaires, Versions, Questions (10 types), Urdu RTL Translations, Branching Rules, OTP.
            </p>
          </div>

          {/* Card 3: Abdullah */}
          <div
            onClick={() => setSelectedStudent(selectedStudent === "abdullah" ? "all" : "abdullah")}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedStudent === "abdullah" || selectedStudent === "all"
                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-200"
                : "bg-[#F8FAFC] border-[#E2E8F0] opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="w-5 h-5 rounded-full bg-[#92400E] text-white text-[10px] font-black flex items-center justify-center">
                3
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                10 Entities
              </span>
            </div>
            <p className="text-xs font-extrabold text-[#0F172A]">Abdullah Zafar Khan (Seat: 2312467)</p>
            <p className="text-[11px] font-bold text-amber-700">Module 03: Campaigns &amp; Asset Registry</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Campaigns, 5-Tier Pakistan Location Hierarchy, Billboards, Competitors, Assignments, Evidence.
            </p>
          </div>
        </div>

        {/* Filter Details Banner when a student is selected */}
        {selectedStudent !== "all" && (
          <div className="max-w-7xl mx-auto mt-2.5 p-2.5 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#334155]">
              Viewing Focus:{" "}
              <strong className="text-[#0F172A]">
                {selectedStudent === "aroon" && "Circle 1: Aroon Kumar (Module 01 — 10 Entities)"}
                {selectedStudent === "mudasir" && "Circle 2: Mudasir Ali (Module 02 — 8 Entities)"}
                {selectedStudent === "abdullah" && "Circle 3: Abdullah Zafar Khan (Module 03 — 10 Entities)"}
              </strong>
            </span>
            <button
              onClick={() => setSelectedStudent("all")}
              className="text-[#4338CA] hover:underline font-bold text-[11px]"
            >
              Reset to All 3 Circles
            </button>
          </div>
        )}
      </section>

      {/* Main Interactive Diagram Canvas */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-[#F8FAFC]">
        <div
          className="transition-transform duration-200 origin-top flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg border border-[#CBD5E1] p-4 max-w-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imgSrc}
            alt="Final Year Project - Multi-Agent Market Research Platform 3-Circle Student ERD"
            className="w-full max-w-[2400px] h-auto object-contain block select-none"
            draggable={false}
            onError={() => {
              console.warn("SVG failed to render, falling back to PNG");
              setImgError(true);
            }}
          />
        </div>
      </main>
    </div>
  );
}
