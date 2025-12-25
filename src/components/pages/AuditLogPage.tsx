import { AppLayout } from '../layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileDown, Search, X, Eye, FileText, CheckCircle, XCircle, Edit, Send, Shield, Clock, User, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AuditLog as AuditLogType, AuditAction, AuditEntityType, AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS } from '@/types/audit';
import { getAuditLogs, getAuditStats, exportAuditLogs } from '@/lib/audit/audit-logger';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLog {
  id: string;
  documentType: 'PEB' | 'PIB';
  documentNumber: string;
  action: string;
  userEmail: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
}

// Format datetime for display
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-CA', { 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(',', '');
  } catch {
    return '-';
  }
}

// Map action to display format
function formatAction(action: string | null): string {
  if (!action) return 'Unknown';
  const actionMap: Record<string, string> = {
    'CREATE': 'Created',
    'UPDATE': 'Edited',
    'SUBMIT': 'Submitted',
    'APPROVE': 'Approved',
    'REJECT': 'Rejected',
    'DELETE': 'Deleted',
    'LOCK': 'Locked',
    'UNLOCK': 'Unlocked',
    'CEISA_SYNC': 'CEISA Synced',
    'GENERATE_XML': 'XML Generated',
  };
  return actionMap[action.toUpperCase()] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

const actionIcons: Record<string, React.ReactNode> = {
  Created: <FileText className="h-3 w-3" />,
  Submitted: <Send className="h-3 w-3" />,
  Approved: <CheckCircle className="h-3 w-3" />,
  Rejected: <XCircle className="h-3 w-3" />,
  Edited: <Edit className="h-3 w-3" />,
};

const actionColors: Record<string, string> = {
  Created: 'bg-slate-100 text-slate-700 border-slate-300',
  Submitted: 'bg-blue-100 text-blue-700 border-blue-300',
  Approved: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  Rejected: 'bg-red-100 text-red-700 border-red-300',
  Edited: 'bg-amber-100 text-amber-700 border-amber-300',
};

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | 'all'>('all');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(getAuditStats());
  const [totalCount, setTotalCount] = useState(0);

  // Fetch audit logs from Supabase
  const fetchAuditLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAuditLogs([]);
        setTotalCount(0);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let query = supabase
        .from('audit_logs')
        .select('id, created_at, ref_type, ref_id, action, user_id, metadata, notes, ip_address', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (entityTypeFilter !== 'all') {
        query = query.eq('ref_type', entityTypeFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        setAuditLogs([]);
        setTotalCount(0);
      } else {
        const transformedLogs: AuditLog[] = (data || []).map((log) => ({
          id: log.id,
          documentType: (log.ref_type as 'PEB' | 'PIB') || 'PEB',
          documentNumber: log.metadata?.document_number || log.metadata?.entity_number || log.ref_id?.slice(0, 12) || 'N/A',
          action: formatAction(log.action),
          userEmail: log.user_id || 'system',
          beforeData: log.metadata?.before_data || null,
          afterData: log.metadata?.after_data || null,
          ipAddress: log.ip_address || '-',
          createdAt: formatDateTime(log.created_at),
        }));
        setAuditLogs(transformedLogs);
        setTotalCount(count || transformedLogs.length);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setAuditLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [entityTypeFilter, actionFilter]);

  // Initial fetch
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Also get local logs from audit-logger
  const refreshLogs = () => {
    const filters: any = {};
    if (entityTypeFilter !== 'all') filters.entity_type = entityTypeFilter;
    if (actionFilter !== 'all') filters.action = actionFilter;
    
    setLogs(getAuditLogs(filters));
    setStats(getAuditStats());
  };
  
  useEffect(() => {
    refreshLogs();
  }, [entityTypeFilter, actionFilter]);

  // Filter Supabase audit logs based on search
  const filteredLogs = auditLogs.filter((log) =>
    searchTerm === '' ||
    log.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearFilters = () => {
    setSearchTerm('');
    setEntityTypeFilter('all');
    setActionFilter('all');
  };

  const hasActiveFilters = searchTerm || entityTypeFilter !== 'all' || actionFilter !== 'all';
  
  const handleExportCSV = () => {
    const csv = exportAuditLogs({ limit: 1000 });
    const blob = new Blob([csv], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Audit logs exported');
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Audit Log</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Loading audit logs...</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Audit Log</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track all document changes and user actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5" 
              onClick={() => fetchAuditLogs(true)}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
              <FileDown size={14} />
              Export JSON
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by document number or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Select value={entityTypeFilter} onValueChange={(v) => setEntityTypeFilter(v as AuditEntityType | 'all')}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="Doc Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PEB">PEB</SelectItem>
                  <SelectItem value="PIB">PIB</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as AuditAction | 'all')}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Edited">Edited</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 text-xs">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b">
                    <tr className="text-left">
                      <th className="p-2 px-3 font-medium text-muted-foreground text-xs">Timestamp</th>
                      <th className="p-2 font-medium text-muted-foreground text-xs">Document</th>
                      <th className="p-2 font-medium text-muted-foreground text-xs">Action</th>
                      <th className="p-2 font-medium text-muted-foreground text-xs">User</th>
                      <th className="p-2 font-medium text-muted-foreground text-xs">IP Address</th>
                      <th className="p-2 px-3 font-medium text-muted-foreground text-xs text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log, index) => (
                        <tr
                          key={log.id}
                          className={index !== filteredLogs.length - 1 ? 'border-b' : ''}
                        >
                          <td className="p-2 px-3 font-mono text-xs text-muted-foreground">
                            {log.createdAt}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
                                {log.documentType}
                              </Badge>
                              <span className="font-mono text-xs">{log.documentNumber}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium',
                                actionColors[log.action] || actionColors.Edited
                              )}
                            >
                              {actionIcons[log.action]}
                              {log.action}
                            </span>
                          </td>
                          <td className="p-2 text-xs">{log.userEmail}</td>
                          <td className="p-2 font-mono text-xs text-muted-foreground">{log.ipAddress}</td>
                          <td className="p-2 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination info */}
            <div className="mt-3 text-xs text-muted-foreground">
              Showing {filteredLogs.length} of {totalCount} entries
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base">Audit Log Details</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Document</span>
                    <div className="font-mono mt-0.5">
                      {selectedLog.documentType}-{selectedLog.documentNumber}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Action</span>
                    <div className="mt-0.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium',
                          actionColors[selectedLog.action]
                        )}
                      >
                        {actionIcons[selectedLog.action]}
                        {selectedLog.action}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">User</span>
                    <div className="mt-0.5">{selectedLog.userEmail}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Timestamp</span>
                    <div className="font-mono mt-0.5">{selectedLog.createdAt}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">IP Address</span>
                    <div className="font-mono mt-0.5">{selectedLog.ipAddress}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-xs">Before</span>
                    <pre className="mt-1 p-2 bg-muted/50 rounded border text-xs overflow-auto max-h-48 font-mono">
                      {selectedLog.beforeData
                        ? JSON.stringify(selectedLog.beforeData, null, 2)
                        : '(No previous data)'}
                    </pre>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">After</span>
                    <pre className="mt-1 p-2 bg-muted/50 rounded border text-xs overflow-auto max-h-48 font-mono">
                      {selectedLog.afterData
                        ? JSON.stringify(selectedLog.afterData, null, 2)
                        : '(No data)'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
