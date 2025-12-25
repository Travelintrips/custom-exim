import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Trash2,
  FileText,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEDIQueue } from '@/hooks/useEDI';
import { OutgoingQueueItem, EDIStatus } from '@/lib/edi/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<EDIStatus, { 
  label: string; 
  color: string; 
  icon: React.ReactNode 
}> = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-slate-100 text-slate-700', 
    icon: <Clock className="h-3 w-3" /> 
  },
  SENT: { 
    label: 'Sent', 
    color: 'bg-blue-100 text-blue-700', 
    icon: <Send className="h-3 w-3" /> 
  },
  RECEIVED: { 
    label: 'Received', 
    color: 'bg-purple-100 text-purple-700', 
    icon: <CheckCircle className="h-3 w-3" /> 
  },
  ACCEPTED: { 
    label: 'Accepted', 
    color: 'bg-emerald-100 text-emerald-700', 
    icon: <CheckCircle className="h-3 w-3" /> 
  },
  REJECTED: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-700', 
    icon: <XCircle className="h-3 w-3" /> 
  },
  ERROR: { 
    label: 'Error', 
    color: 'bg-amber-100 text-amber-700', 
    icon: <AlertCircle className="h-3 w-3" /> 
  },
};

interface EDIQueuePanelProps {
  onProcessQueue?: () => Promise<void>;
  onViewXML?: (item: OutgoingQueueItem) => void;
}

export function EDIQueuePanel({ onProcessQueue, onViewXML }: EDIQueuePanelProps) {
  const { queueItems, stats } = useEDIQueue();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OutgoingQueueItem | null>(null);
  
  const handleProcessQueue = async () => {
    if (!onProcessQueue) return;
    setIsProcessing(true);
    try {
      await onProcessQueue();
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Send className="h-4 w-4" />
            CEISA Queue
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 h-7 text-xs"
              onClick={handleProcessQueue}
              disabled={isProcessing || stats.pending === 0}
            >
              {isProcessing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Process ({stats.pending})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {/* Stats Summary */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 bg-slate-100 rounded">
              <div className="text-lg font-bold text-slate-700">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{stats.sent}</div>
              <div className="text-xs text-muted-foreground">Sent</div>
            </div>
            <div className="text-center p-2 bg-emerald-50 rounded">
              <div className="text-lg font-bold text-emerald-700">{stats.accepted}</div>
              <div className="text-xs text-muted-foreground">Accepted</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-700">{stats.rejected + stats.error}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
          
          {/* Queue List */}
          {queueItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items in queue</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {queueItems.map((item) => {
                const statusInfo = statusConfig[item.status];
                return (
                  <div 
                    key={item.id}
                    className="border rounded-lg p-3 hover:bg-muted/20 cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.documentType}
                        </Badge>
                        <span className="font-mono text-sm">{item.documentNumber}</span>
                      </div>
                      <Badge className={cn('text-xs gap-1', statusInfo.color)}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
                      {item.retryCount > 0 && (
                        <span>Retries: {item.retryCount}/{item.maxRetries}</span>
                      )}
                    </div>
                    {item.errors.length > 0 && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        {item.errors.length} error(s): {item.errors[0].message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Queue Item Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Message ID</span>
                  <p className="font-mono">{selectedItem.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Document Number</span>
                  <p className="font-mono">{selectedItem.documentNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Document Type</span>
                  <p>{selectedItem.documentType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <Badge className={cn('text-xs gap-1', statusConfig[selectedItem.status].color)}>
                    {statusConfig[selectedItem.status].label}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Created</span>
                  <p>{new Date(selectedItem.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Last Attempt</span>
                  <p>{selectedItem.lastAttemptAt ? new Date(selectedItem.lastAttemptAt).toLocaleString() : '-'}</p>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground text-xs">XML Hash</span>
                <p className="font-mono text-xs break-all bg-muted/30 p-2 rounded">{selectedItem.xmlHash}</p>
              </div>
              
              {selectedItem.errors.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-xs">Errors</span>
                  <div className="space-y-2 mt-1">
                    {selectedItem.errors.map((error, i) => (
                      <div key={i} className="bg-red-50 border border-red-200 p-2 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{error.code}</Badge>
                          <span className="text-red-700">{error.field}</span>
                        </div>
                        <p className="text-red-600 mt-1">{error.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewXML?.(selectedItem)}
                  className="gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View XML
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
