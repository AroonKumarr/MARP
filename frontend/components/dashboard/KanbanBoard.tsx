"use client";

import React from "react";
import { Calendar, Paperclip, MessageSquare } from "lucide-react";
import { CounterBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface BoardItem {
  id: string;
  title: string;
  description: string;
  category: string;
  badge_color: string;
  due_date_formatted: string;
  assignees: { name: string; avatar: string }[];
  attachment_count: number;
  comment_count: number;
  status: string;
}

interface KanbanBoardProps {
  todo: BoardItem[];
  inProgress: BoardItem[];
  review: BoardItem[];
  onCardClick?: (item: BoardItem) => void;
}

export function KanbanBoard({
  todo,
  inProgress,
  review,
  onCardClick,
}: KanbanBoardProps) {
  const getBadgeStyle = (badgeColor: string) => {
    switch (badgeColor) {
      case "lime":
        return "bg-[#D9F66A]/90 text-[#3E520A]";
      case "periwinkle":
        return "bg-[#91ACF8]/40 text-[#1E3A8A]";
      case "lavender":
        return "bg-[#B6A0F3]/40 text-[#3B2A6B]";
      case "mint":
        return "bg-[#9DD9C7]/50 text-[#164E43]";
      case "orange":
      default:
        return "bg-[#F2B77C]/40 text-[#7C2D12]";
    }
  };

  const renderColumn = (title: string, items: BoardItem[]) => (
    <div className="flex-1 min-w-0 w-full flex flex-col gap-3 sm:gap-3.5">
      {/* Column Header */}
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-base font-bold text-[#171717]">{title}</h3>
        <CounterBadge count={items.length} />
      </div>

      {/* Cards Stack */}
      <div className="flex flex-col gap-3.5">
        {items.length === 0 ? (
          <div className="bg-white/40 border border-dashed border-[#DDD7CD] rounded-2xl p-6 text-center text-xs text-[#77746F]">
            No tasks in this stage
          </div>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              onClick={() => onCardClick && onCardClick(item)}
              className="p-4 sm:p-5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all border border-[#ECE8E0]"
            >
              {/* Card Header: Tag Pill & Calendar Date */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide",
                    getBadgeStyle(item.badge_color)
                  )}
                >
                  {item.category}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-[#77746F] font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.due_date_formatted}</span>
                </div>
              </div>

              {/* Title & Description */}
              <h4 className="text-[14px] font-bold text-[#171717] line-clamp-1 mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-[#77746F] line-clamp-2 leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Card Footer: Assignee Stack & Metrics */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F5F2EB]">
                {/* Avatar Stack */}
                <div className="flex items-center -space-x-2">
                  {item.assignees.length > 0 ? (
                    item.assignees.map((a, idx) => (
                      <img
                        key={idx}
                        src={a.avatar}
                        alt={a.name}
                        title={a.name}
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    ))
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#EAE6DD] border-2 border-white flex items-center justify-center text-[10px] text-[#77746F]">
                      -
                    </div>
                  )}
                </div>

                {/* Attachment & Comment Counters */}
                <div className="flex items-center gap-3 text-xs text-[#77746F]">
                  <div className="flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-[#9E9B95]" />
                    <span>{item.attachment_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#9E9B95]" />
                    <span>{item.comment_count}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
      {renderColumn("To do", todo)}
      {renderColumn("In progress", inProgress)}
      {renderColumn("Review", review)}
    </div>
  );
}
