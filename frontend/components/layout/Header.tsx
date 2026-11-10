"use client";

import React, { useState } from "react";
import { Search, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  title?: string;
  onSearch?: (term: string) => void;
  actionLabel?: string;
  onAction?: () => void;
  isMeFiltered?: boolean;
  onToggleMe?: () => void;
}

export function Header({
  title,
  onSearch,
  actionLabel = "+ Add tasks",
  onAction,
  isMeFiltered = false,
  onToggleMe,
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Search Pill */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#77746F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search"
            className="w-full bg-white text-sm text-[#171717] pl-10 pr-4 py-2.5 rounded-full border border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.03)] focus:border-[#DDD7CD] focus:outline-none transition-all placeholder:text-[#9E9B95]"
          />
        </div>

        {/* 'Me' Filter Pill */}
        {onToggleMe && (
          <button
            onClick={onToggleMe}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
              isMeFiltered
                ? "bg-[#111111] text-white border-transparent"
                : "bg-white text-[#171717] border-transparent hover:bg-[#F2EFE8]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Me</span>
          </button>
        )}
      </div>

      {/* Primary Action Button */}
      {onAction && (
        <div className="flex items-center gap-3">
          <Button onClick={onAction} variant="primary" size="md" className="font-semibold px-5">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        </div>
      )}
    </header>
  );
}
