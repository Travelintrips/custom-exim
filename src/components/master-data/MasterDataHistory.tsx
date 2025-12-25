import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MasterDataHistory } from '@/types/master-data';
import { Clock, User, FileText, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MasterDataHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemCode: string;
  itemName: string;
  history: MasterDataHistory[];
}

const actionConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  CREATE: {
    label: 'Created',
    icon: <FileText className="h-3 w-3" />,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  },
  UPDATE: {
    label: 'Updated',
    icon: <Edit className="h-3 w-3" />,
    className: 'bg-blue-50 text-blue-700 border-blue-300',
  },
  DELETE: {
    label: 'Deleted',
    icon: <Trash2 className="h-3 w-3" />,
    className: 'bg-red-50 text-red-700 border-red-300',
  },
};

export function MasterDataHistoryDialog({
  isOpen,
  onClose,
  itemCode,
  itemName,
  history,
}: MasterDataHistoryDialogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">
            Version History: {itemCode} - {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No history available
            </div>
          ) : (
            history.map((entry) => {
              const config = actionConfig[entry.action];
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/30"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium',
                          config.className
                        )}
                      >
                        {config.icon}
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.changed_by_email || 'System'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      {new Date(entry.changed_at).toLocaleString()}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t p-3 bg-muted/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">Before</span>
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-40 font-mono">
                            {entry.before_data
                              ? JSON.stringify(entry.before_data, null, 2)
                              : '(No previous data)'}
                          </pre>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">After</span>
                          <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-40 font-mono">
                            {entry.after_data
                              ? JSON.stringify(entry.after_data, null, 2)
                              : '(No data)'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
