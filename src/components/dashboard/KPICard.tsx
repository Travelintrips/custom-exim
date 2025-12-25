import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

export function KPICard({ title, value, icon: Icon, trend, status = 'info', subtitle }: KPICardProps) {
  const statusColors = {
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    error: 'text-red-700',
    info: 'text-blue-700',
  };

  const statusBgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <h3 className="text-2xl font-semibold tabular-nums">{value}</h3>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'}{Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn('p-2 rounded border shrink-0', statusBgColors[status])}>
            <Icon className={statusColors[status]} size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
