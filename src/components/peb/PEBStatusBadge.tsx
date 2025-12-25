import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PEBStatus, PEB_STATUS_CONFIG } from '@/types/peb';
import { Lock } from 'lucide-react';

interface PEBStatusBadgeProps {
  status: PEBStatus;
  showIcon?: boolean;
  className?: string;
}

export function PEBStatusBadge({ status, showIcon = false, className }: PEBStatusBadgeProps) {
  const config = PEB_STATUS_CONFIG[status];
  
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
