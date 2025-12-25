import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Clock, 
  FileText, 
  Edit, 
  Send, 
  CheckCircle, 
  XCircle, 
  Lock,
  Unlock,
  Download,
  Printer,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { AuditLog, AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS, AuditAction } from '@/types/audit';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AuditLogViewerProps {
  logs: AuditLog[];
  className?: string;
  showEntityInfo?: boolean;
}

const actionIcons: Record<AuditAction, React.ReactNode> = {
  CREATE: <FileText className="h-3.5 w-3.5" />,
  UPDATE: <Edit className="h-3.5 w-3.5" />,
  DELETE: <XCircle className="h-3.5 w-3.5" />,
  SUBMIT: <Send className="h-3.5 w-3.5" />,
  APPROVE: <CheckCircle className="h-3.5 w-3.5" />,
  REJECT: <XCircle className="h-3.5 w-3.5" />,
  SEND_CEISA: <Send className="h-3.5 w-3.5" />,
  RECEIVE_RESPONSE: <Download className="h-3.5 w-3.5" />,
  LOCK: <Lock className="h-3.5 w-3.5" />,
  UNLOCK: <Unlock className="h-3.5 w-3.5" />,
  EXPORT: <Download className="h-3.5 w-3.5" />,
  PRINT: <Printer className="h-3.5 w-3.5" />,
  LOGIN: <User className="h-3.5 w-3.5" />,
  LOGOUT: <User className="h-3.5 w-3.5" />,
};

export function AuditLogViewer({ logs, className, showEntityInfo = false }: AuditLogViewerProps) {
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  
  const toggleLog = (id: string) => {
    setExpandedLogs(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  if (logs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No audit logs available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4">
        {logs.map((log) => {
          const isExpanded = expandedLogs.includes(log.id);
          const hasChanges = log.changes && Object.keys(log.changes).length > 0;
          const icon = actionIcons[log.action];
          
          return (
            <div key={log.id} className="relative pl-10">
              <div
                className={cn(
                  "absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-background",
                  AUDIT_ACTION_COLORS[log.action]
                )}
              >
                {icon}
              </div>
              <div className="bg-muted/30 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', AUDIT_ACTION_COLORS[log.action])}
                    >
                      {AUDIT_ACTION_LABELS[log.action]}
                    </Badge>
                    {showEntityInfo && log.entity_number && (
                      <span className="font-mono text-xs">{log.entity_number}</span>
                    )}
                  </div>
                  {log.document_hash && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Shield className="h-3 w-3" />
                      Hashed
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.actor_email || 'System'}
                    {log.actor_role && (
                      <Badge variant="outline" className="text-xs ml-1">{log.actor_role}</Badge>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                
                {log.notes && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                    {log.notes}
                  </p>
                )}
                
                {hasChanges && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 -ml-2"
                      onClick={() => toggleLog(log.id)}
                    >
                      <ArrowRight className={cn(
                        "h-3 w-3 transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                      {Object.keys(log.changes!).length} field(s) changed
                    </Button>
                    
                    {isExpanded && (
                      <div className="mt-2 space-y-1 bg-background border rounded p-2">
                        {Object.entries(log.changes!).map(([field, change]) => (
                          <div key={field} className="text-xs">
                            <span className="font-medium text-muted-foreground">
                              {field.replace(/_/g, ' ')}:
                            </span>
                            <div className="flex items-center gap-2 mt-1 pl-2">
                              <span className="text-red-600 line-through">
                                {formatValue(change.old)}
                              </span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-emerald-600 font-medium">
                                {formatValue(change.new)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {log.document_hash && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Document Hash (SHA-256)
                    </summary>
                    <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded mt-1">
                      {log.document_hash}
                    </p>
                  </details>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
