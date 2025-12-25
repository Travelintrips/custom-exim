import * as React from "react";
import { cn } from "@/lib/utils";
import { Lock, AlertTriangle } from "lucide-react";

interface LockedBannerProps {
  className?: string;
  message?: string;
}

export function LockedBanner({
  className,
  message = "This document has been approved and cannot be edited.",
}: LockedBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800",
        className
      )}
    >
      <Lock className="h-4 w-4 shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function ReadOnlyField({ label, value, className }: ReadOnlyFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Lock className="h-3 w-3" />
        {label}
      </label>
      <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {value || "-"}
      </div>
    </div>
  );
}
