import React from "react";
import { FolderSearch, Plus } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/70 rounded-[24px] border border-dashed border-[#DDD7CD] my-4">
      <div className="w-14 h-14 rounded-2xl bg-[#F7F5EC] border border-[#E5E1D8] flex items-center justify-center text-[#77746F] mb-4 shadow-sm">
        {icon || <FolderSearch className="w-7 h-7 text-[#77746F]" />}
      </div>
      <h4 className="text-base font-bold text-[#171717]">{title}</h4>
      <p className="text-xs text-[#77746F] max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm" className="mt-5">
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
