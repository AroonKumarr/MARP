"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar } from "lucide-react";

interface DonutItem {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsDonutProps {
  title?: string;
  total: number;
  items: DonutItem[];
}

export function AnalyticsDonut({
  title = "Research Distribution",
  total,
  items,
}: AnalyticsDonutProps) {
  const chartData = items.length > 0 ? items : [{ name: "None", value: 1, color: "#2A2A2A" }];

  return (
    <div className="bg-[#111111] text-white rounded-[28px] p-6 shadow-xl flex flex-col justify-between h-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#222222] rounded-full text-xs text-[#9E9B95]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Month</span>
        </div>
      </div>

      {/* Donut Chart with Center Metric */}
      <div className="relative w-full h-[180px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-extrabold text-white leading-none">
            {total}
          </span>
          <span className="text-[11px] font-medium text-[#77746F] uppercase tracking-wider mt-1">
            Total
          </span>
        </div>
      </div>

      {/* Bottom Category Legend */}
      <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-[#222222]">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs text-[#9E9B95]">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-white/90">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
