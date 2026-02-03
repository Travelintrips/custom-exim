import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PIBStatus, PIB_STATUS_CONFIG, PIBLane, PIB_LANE_CONFIG } from '@/types/pib';
import { Lock, HelpCircle } from 'lucide-react';

// Fallback config for unknown statuses
const FALLBACK_STATUS_CONFIG = {
  label: "UNKNOWN",
  color: "bg-gray-100 text-gray-700 border-gray-300",
  description: "Unknown status",
  isLocked: false,
};

interface PIBStatusBadgeProps {
  status: PIBStatus | string;
  showIcon?: boolean;
  className?: string;
}

export function PIBStatusBadge({ status, showIcon = false, className }: PIBStatusBadgeProps) {
  // Normalize status to uppercase for consistent lookup
  const normalizedStatus = (status?.toString().toUpperCase() || 'DRAFT') as PIBStatus;
  
  // Get config with fallback for unknown statuses
  const config = PIB_STATUS_CONFIG[normalizedStatus] || FALLBACK_STATUS_CONFIG;
  const isUnknown = !PIB_STATUS_CONFIG[normalizedStatus];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs px-1.5 py-0 font-medium border',
        config.color,
        className
      )}
    >
      {isUnknown && <HelpCircle className="h-2.5 w-2.5 mr-1" />}
      {showIcon && config.isLocked && <Lock className="h-2.5 w-2.5 mr-1" />}
      {isUnknown ? normalizedStatus || "UNKNOWN" : config.label}
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
