import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge, DocumentStatus } from "@/components/ui/status-badge";
import { User, Clock, FileText, CheckCircle, XCircle, Edit, Send, Eye } from "lucide-react";

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  status?: DocumentStatus;
  description?: string;
}

interface AuditTimelineProps {
  entries: AuditEntry[];
  className?: string;
  compact?: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <FileText className="h-3 w-3" />,
  submitted: <Send className="h-3 w-3" />,
  approved: <CheckCircle className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
  edited: <Edit className="h-3 w-3" />,
  viewed: <Eye className="h-3 w-3" />,
  default: <Clock className="h-3 w-3" />,
};

const actionColors: Record<string, string> = {
  created: "bg-slate-100 text-slate-600 border-slate-300",
  submitted: "bg-blue-100 text-blue-600 border-blue-300",
  approved: "bg-emerald-100 text-emerald-600 border-emerald-300",
  rejected: "bg-red-100 text-red-600 border-red-300",
  edited: "bg-amber-100 text-amber-600 border-amber-300",
  viewed: "bg-slate-100 text-slate-500 border-slate-300",
  default: "bg-slate-100 text-slate-600 border-slate-300",
};

export function AuditTimeline({ entries, className, compact = false }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No audit history available
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-3">
        {entries.map((entry, index) => {
          const actionKey = entry.action.toLowerCase();
          const icon = actionIcons[actionKey] || actionIcons.default;
          const colorClass = actionColors[actionKey] || actionColors.default;

          return (
            <div key={entry.id} className="relative pl-8">
              <div
                className={cn(
                  "absolute left-0 w-6 h-6 rounded-full border flex items-center justify-center",
                  colorClass
                )}
              >
                {icon}
              </div>
              <div className={cn("bg-muted/30 rounded border p-2", compact ? "p-1.5" : "p-2")}>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("font-medium capitalize", compact ? "text-xs" : "text-sm")}>
                    {entry.action}
                  </span>
                  {entry.status && <StatusBadge status={entry.status} />}
                </div>
                <div className={cn("flex items-center gap-3 text-muted-foreground mt-1", compact ? "text-[10px]" : "text-xs")}>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {entry.user}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {entry.timestamp}
                  </span>
                </div>
                {entry.description && (
                  <p className={cn("text-muted-foreground mt-1", compact ? "text-[10px]" : "text-xs")}>
                    {entry.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DocumentMetaProps {
  createdBy: string;
  createdAt: string;
  lastAction?: string;
  lastActionBy?: string;
  lastActionAt?: string;
  className?: string;
}

export function DocumentMeta({
  createdBy,
  createdAt,
  lastAction,
  lastActionBy,
  lastActionAt,
  className,
}: DocumentMetaProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 text-xs", className)}>
      <div className="space-y-0.5">
        <span className="text-muted-foreground">Created by</span>
        <div className="flex items-center gap-1 font-medium">
          <User className="h-3 w-3 text-muted-foreground" />
          {createdBy}
        </div>
      </div>
      <div className="space-y-0.5">
        <span className="text-muted-foreground">Created at</span>
        <div className="flex items-center gap-1 font-medium font-mono">
          <Clock className="h-3 w-3 text-muted-foreground" />
          {createdAt}
        </div>
      </div>
      {lastAction && (
        <>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Last action</span>
            <div className="font-medium capitalize">{lastAction}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">By / At</span>
            <div className="font-medium">
              {lastActionBy} · <span className="font-mono">{lastActionAt}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
