import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, RefreshCw, Loader2 } from 'lucide-react';
import { StatusBadge, DocumentStatus } from '@/components/ui/status-badge';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  timestamp: string;
  documentType: string;
  documentNumber: string;
  action: string;
  user: string;
  status: DocumentStatus;
}

// Map database status to UI status
function mapStatus(dbStatus: string | null): DocumentStatus {
  if (!dbStatus) return 'draft';
  const statusMap: Record<string, DocumentStatus> = {
    'DRAFT': 'draft',
    'SUBMITTED': 'submitted',
    'APPROVED': 'approved',
    'REJECTED': 'rejected',
    'UNDER_REVIEW': 'review',
    'REVIEW': 'review',
    'LOCKED': 'approved',
    'SENT_TO_CEISA': 'submitted',
    'CEISA_ACCEPTED': 'approved',
    'CEISA_REJECTED': 'rejected',
  };
  return statusMap[dbStatus.toUpperCase()] || 'draft';
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

export function RecentActivityTable() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setActivities([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch recent audit logs - using actual table columns
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('id, created_at, document_type, document_number, action, user_id, user_email, after_data')
        .in('document_type', ['PEB', 'PIB'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (auditError) {
        console.warn('Could not fetch audit logs:', auditError);
        // Fallback: fetch recent documents directly
        await fetchFromDocuments();
        return;
      }

      if (auditLogs && auditLogs.length > 0) {
        const transformedActivities: Activity[] = auditLogs.map((log) => ({
          id: log.id,
          timestamp: formatDateTime(log.created_at),
          documentType: log.document_type || 'Unknown',
          documentNumber: log.document_number || 'N/A',
          action: formatAction(log.action),
          user: log.user_email || log.user_id || 'system',
          status: mapStatus((log.after_data as any)?.status || log.action),
        }));
        setActivities(transformedActivities);
      } else {
        // No audit logs, try fetching from documents
        await fetchFromDocuments();
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fallback: fetch recent activity from PEB/PIB documents directly
  const fetchFromDocuments = async () => {
    try {
      const [pebResult, pibResult] = await Promise.all([
        supabase
          .from('peb_documents')
          .select('id, document_number, status, created_at, created_by, updated_at')
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('pib_documents')
          .select('id, document_number, status, created_at, created_by, updated_at')
          .order('updated_at', { ascending: false })
          .limit(5),
      ]);

      const combinedDocs: Activity[] = [];

      if (pebResult.data) {
        pebResult.data.forEach((doc) => {
          combinedDocs.push({
            id: `peb-${doc.id}`,
            timestamp: formatDateTime(doc.updated_at || doc.created_at),
            documentType: 'PEB',
            documentNumber: doc.document_number || `PEB-${doc.id.slice(0, 8)}`,
            action: determineAction(doc.status),
            user: doc.created_by || 'system',
            status: mapStatus(doc.status),
          });
        });
      }

      if (pibResult.data) {
        pibResult.data.forEach((doc) => {
          combinedDocs.push({
            id: `pib-${doc.id}`,
            timestamp: formatDateTime(doc.updated_at || doc.created_at),
            documentType: 'PIB',
            documentNumber: doc.document_number || `PIB-${doc.id.slice(0, 8)}`,
            action: determineAction(doc.status),
            user: doc.created_by || 'system',
            status: mapStatus(doc.status),
          });
        });
      }

      // Sort by timestamp descending and take top 10
      combinedDocs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setActivities(combinedDocs.slice(0, 10));
    } catch (err) {
      console.error('Error fetching documents:', err);
      setActivities([]);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={() => fetchActivities(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
          </Button>
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 text-xs"
            onClick={() => navigate('/audit-log')}
          >
            View All
            <ArrowUpRight size={12} className="ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No recent activity. Documents synced from CEISA will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left">
                  <th className="p-2 px-4 font-medium text-muted-foreground text-xs">Timestamp</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs">Type</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs">Document Number</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs">Action</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs">User</th>
                  <th className="p-2 px-4 font-medium text-muted-foreground text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr
                    key={activity.id}
                    className={index !== activities.length - 1 ? 'border-b border-border' : ''}
                  >
                    <td className="p-2 px-4 text-muted-foreground font-mono text-xs">{activity.timestamp}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
                        {activity.documentType}
                      </Badge>
                    </td>
                    <td className="p-2 font-mono text-xs">{activity.documentNumber}</td>
                    <td className="p-2 text-xs">{activity.action}</td>
                    <td className="p-2 text-muted-foreground text-xs">{activity.user}</td>
                    <td className="p-2 px-4">
                      <StatusBadge status={activity.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to format action string
function formatAction(action: string | null): string {
  if (!action) return 'Unknown';
  const actionMap: Record<string, string> = {
    'CREATE_PEB_DRAFT': 'Draft Created',
    'CREATE_PIB_DRAFT': 'Draft Created',
    'UPDATE_PEB': 'Updated',
    'UPDATE_PIB': 'Updated',
    'SUBMIT_PEB': 'Submitted',
    'SUBMIT_PIB': 'Submitted',
    'APPROVE_PEB': 'Approved',
    'APPROVE_PIB': 'Approved',
    'REJECT_PEB': 'Rejected',
    'REJECT_PIB': 'Rejected',
    'GENERATE_PEB_XML': 'XML Generated',
    'GENERATE_PIB_XML': 'XML Generated',
    'CEISA_SYNC': 'CEISA Synced',
    'LOCK_DOCUMENT': 'Locked',
    'UNLOCK_DOCUMENT': 'Unlocked',
  };
  return actionMap[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

// Helper to determine action from status
function determineAction(status: string | null): string {
  if (!status) return 'Created';
  const statusActionMap: Record<string, string> = {
    'DRAFT': 'Draft Saved',
    'SUBMITTED': 'Submitted',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'UNDER_REVIEW': 'Under Review',
    'REVIEW': 'Under Review',
    'LOCKED': 'Locked',
    'SENT_TO_CEISA': 'Sent to CEISA',
    'CEISA_ACCEPTED': 'CEISA Accepted',
    'CEISA_REJECTED': 'CEISA Rejected',
  };
  return statusActionMap[status.toUpperCase()] || 'Updated';
}
