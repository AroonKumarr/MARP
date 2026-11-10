"use client";

import React from "react";
import { Calendar } from "lucide-react";

interface WeeklyDay {
  day: string;
  count: number;
  date_str: string;
  is_active: boolean;
}

interface WeeklyBarChartProps {
  headline?: string;
  subtext?: string;
  days: WeeklyDay[];
}

export function WeeklyBarChart({
  headline = "Active Tasks",
  subtext = "Submissions this week",
  days,
}: WeeklyBarChartProps) {
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[28px] p-6 border border-[#ECE8E0] shadow-sm flex flex-col justify-between h-[320px]">
      {/* Header Metric & Date Range */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-black text-[#171717] tracking-tight">
            {headline}
          </h3>
          <p className="text-xs text-[#77746F] font-medium mt-0.5">{subtext}</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E5E1D8] rounded-full text-xs text-[#77746F]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Week</span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="flex items-end justify-between gap-2.5 h-[160px] pt-8 px-2">
        {days.map((day, idx) => {
          // Height percentage, min 15% so empty days still show a small rounded base
          const heightPercent = Math.max(Math.round((day.count / maxCount) * 100), 12);
          const isHighlighted = day.is_active || (day.count === maxCount && day.count > 0);

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              {/* Tooltip Pill shown for active/highlighted or on hover */}
              {isHighlighted && (
                <div className="absolute -top-7 mb-1 bg-[#111111] text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-md whitespace-nowrap z-10 flex flex-col items-center">
                  <span className="text-[10px] text-[#9E9B95] font-normal leading-none">{day.date_str}</span>
                  <span className="leading-tight">{day.count}</span>
                  {/* Arrow */}
                  <div className="w-2 h-2 bg-[#111111] rotate-45 -mb-1 mt-0.5" />
                </div>
              )}

              {/* Bar */}
              <div
                className={`w-full rounded-2xl transition-all duration-300 ${
                  isHighlighted
                    ? "bg-[#648BF7] shadow-md shadow-[#91ACF8]/30"
                    : "bg-[#91ACF8]/60 hover:bg-[#91ACF8]/80"
                }`}
                style={{ height: `${heightPercent}%` }}
              />

              {/* Day Label */}
              <span className="text-[11px] font-semibold text-[#77746F] mt-2">
                {day.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
