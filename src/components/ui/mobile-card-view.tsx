import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MobileCardItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusType?: 'success' | 'warning' | 'error' | 'info' | 'default';
  details: { label: string; value: string | number | ReactNode }[];
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface MobileCardViewProps {
  items: MobileCardItem[];
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  loading?: boolean;
}

export function MobileCardView({ items, emptyMessage, emptyIcon, loading }: MobileCardViewProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyIcon}
        <p className="text-sm mt-2">{emptyMessage || 'Tidak ada data'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.status && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0.5",
                      item.statusType === 'success' && "bg-green-50 text-green-700 border-green-200",
                      item.statusType === 'warning' && "bg-amber-50 text-amber-700 border-amber-200",
                      item.statusType === 'error' && "bg-red-50 text-red-700 border-red-200",
                      item.statusType === 'info' && "bg-blue-50 text-blue-700 border-blue-200",
                      item.statusType === 'default' && "bg-slate-50 text-slate-700 border-slate-200"
                    )}
                  >
                    {item.status}
                  </Badge>
                )}
                {(item.onView || item.onEdit || item.onDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.onView && (
                        <DropdownMenuItem onClick={item.onView}>
                          <Eye size={14} className="mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                      )}
                      {item.onEdit && (
                        <DropdownMenuItem onClick={item.onEdit}>
                          <Pencil size={14} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {item.onDelete && (
                        <DropdownMenuItem onClick={item.onDelete} className="text-red-600">
                          <Trash2 size={14} className="mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {item.details.map((detail, idx) => (
                <div key={idx} className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{detail.label}</p>
                  <p className="text-xs font-medium truncate">
                    {typeof detail.value === 'string' || typeof detail.value === 'number' 
                      ? detail.value || '-' 
                      : detail.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helper component for responsive table/card switching
interface ResponsiveDataViewProps {
  tableView: ReactNode;
  mobileCards: MobileCardItem[];
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  loading?: boolean;
}

export function ResponsiveDataView({ 
  tableView, 
  mobileCards, 
  emptyMessage, 
  emptyIcon, 
  loading 
}: ResponsiveDataViewProps) {
  return (
    <>
      {/* Mobile Card View */}
      <div className="block sm:hidden">
        <MobileCardView 
          items={mobileCards} 
          emptyMessage={emptyMessage} 
          emptyIcon={emptyIcon}
          loading={loading}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        {tableView}
      </div>
    </>
  );
}
