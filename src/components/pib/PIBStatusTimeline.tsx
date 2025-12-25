import { PIBStatusHistory, PIB_STATUS_CONFIG, PIBStatus, PIB_LANE_CONFIG, PIBLane } from '@/types/pib';
import { User, Clock, FileText, Send, CheckCircle, XCircle, ArrowRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PIBLaneBadge } from './PIBStatusBadge';

interface PIBStatusTimelineProps {
  history: PIBStatusHistory[];
  className?: string;
}

const statusIcons: Record<PIBStatus, React.ReactNode> = {
  DRAFT: <FileText className="h-3.5 w-3.5" />,
  SUBMITTED: <Send className="h-3.5 w-3.5" />,
  SENT_TO_PPJK: <ArrowRight className="h-3.5 w-3.5" />,
  CEISA_ACCEPTED: <CheckCircle className="h-3.5 w-3.5" />,
  CEISA_REJECTED: <XCircle className="h-3.5 w-3.5" />,
  SPPB_ISSUED: <Package className="h-3.5 w-3.5" />,
  COMPLETED: <CheckCircle className="h-3.5 w-3.5" />,
};

export function PIBStatusTimeline({ history, className }: PIBStatusTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No status history available
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4">
        {history.map((entry, index) => {
          const config = PIB_STATUS_CONFIG[entry.to_status];
          const icon = statusIcons[entry.to_status];

          return (
            <div key={entry.id} className="relative pl-10">
              <div
                className={cn(
                  "absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-background",
                  config.color.replace('bg-', 'border-').replace(' text-', ' bg-').split(' ')[0],
                  config.color.split(' ')[1]
                )}
              >
                {icon}
              </div>
              <div className="bg-muted/30 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{config.label}</span>
                    {entry.from_status && (
                      <span className="text-xs text-muted-foreground">
                        from {PIB_STATUS_CONFIG[entry.from_status].label}
                      </span>
                    )}
                    {entry.lane && <PIBLaneBadge lane={entry.lane} />}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {entry.changed_by_email || 'System'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                    {entry.notes}
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
