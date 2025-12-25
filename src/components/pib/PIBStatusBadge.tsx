import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PIBStatus, PIB_STATUS_CONFIG, PIBLane, PIB_LANE_CONFIG } from '@/types/pib';
import { Lock } from 'lucide-react';

interface PIBStatusBadgeProps {
  status: PIBStatus;
  showIcon?: boolean;
  className?: string;
}

export function PIBStatusBadge({ status, showIcon = false, className }: PIBStatusBadgeProps) {
  const config = PIB_STATUS_CONFIG[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs px-1.5 py-0 font-medium border',
        config.color,
        className
      )}
    >
      {showIcon && config.isLocked && <Lock className="h-2.5 w-2.5 mr-1" />}
      {config.label}
    </Badge>
  );
}

interface PIBLaneBadgeProps {
  lane: PIBLane | null;
  className?: string;
}

export function PIBLaneBadge({ lane, className }: PIBLaneBadgeProps) {
  if (!lane) return null;
  
  const config = PIB_LANE_CONFIG[lane];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs px-1.5 py-0 font-medium border',
        config.color,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
