import * as React from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export type DocumentStatus = "draft" | "submitted" | "approved" | "rejected" | "review" | "locked";

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-300",
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-700 border-blue-300",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-300",
  },
  review: {
    label: "Under Review",
    className: "bg-amber-50 text-amber-700 border-amber-300",
  },
  locked: {
    label: "Locked",
    className: "bg-slate-200 text-slate-800 border-slate-400",
  },
};

export function StatusBadge({ status, className, showIcon = false }: StatusBadgeProps) {
  const config = statusConfig[status];

  // Handle undefined status gracefully
  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium",
          "bg-slate-50 text-slate-600 border-slate-300",
          className
        )}
      >
        {status || 'Unknown'}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {(status === "locked" || (status === "approved" && showIcon)) && (
        <Lock className="h-3 w-3" />
      )}
      {config.label}
    </span>
  );
}

export function isLockedStatus(status: DocumentStatus): boolean {
  return status === "approved" || status === "locked";
}
