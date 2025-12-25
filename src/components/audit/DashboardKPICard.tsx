import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardKPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: number;
    percentage: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  iconColor?: string;
  className?: string;
}

export function DashboardKPICard({
  title,
  value,
  unit,
  trend,
  icon,
  iconColor = 'bg-blue-100 text-blue-700',
  className,
}: DashboardKPICardProps) {
  return (
    <Card className={cn('border', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </h3>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend.isPositive && trend.value !== 0 ? "text-emerald-600" : 
                !trend.isPositive && trend.value !== 0 ? "text-red-600" : 
                "text-muted-foreground"
              )}>
                {trend.value > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend.value < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                <span>
                  {trend.value > 0 ? '+' : ''}{trend.value} ({trend.percentage.toFixed(1)}%)
                </span>
                <span className="text-muted-foreground">vs yesterday</span>
              </div>
            )}
          </div>
          <div className={cn('p-2 rounded', iconColor)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KPIGridProps {
  kpis: {
    pebToday: { value: number; label: string; trend: any };
    pibPending: { value: number; label: string; trend: any };
    rejected: { value: number; label: string; trend: any };
    ceisaQueue: { value: number; label: string; successRate: number };
  };
}

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardKPICard
        title={kpis.pebToday.label}
        value={kpis.pebToday.value}
        trend={kpis.pebToday.trend}
        icon={<FileText className="h-5 w-5" />}
        iconColor="bg-blue-100 text-blue-700"
      />
      
      <DashboardKPICard
        title={kpis.pibPending.label}
        value={kpis.pibPending.value}
        trend={kpis.pibPending.trend}
        icon={<Clock className="h-5 w-5" />}
        iconColor="bg-amber-100 text-amber-700"
      />
      
      <DashboardKPICard
        title={kpis.rejected.label}
        value={kpis.rejected.value}
        trend={kpis.rejected.trend}
        icon={<XCircle className="h-5 w-5" />}
        iconColor="bg-red-100 text-red-700"
      />
      
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{kpis.ceisaQueue.label}</p>
              <h3 className="text-2xl font-bold">{kpis.ceisaQueue.value}</h3>
              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">
                  {kpis.ceisaQueue.successRate.toFixed(1)}% success rate
                </span>
              </div>
            </div>
            <div className="p-2 rounded bg-emerald-100 text-emerald-700">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
