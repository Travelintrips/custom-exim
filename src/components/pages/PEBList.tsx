import { AppLayout } from '../layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus, FileDown, Send, Eye, Pencil, Trash2, History, User, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge, DocumentStatus, isLockedStatus } from '@/components/ui/status-badge';
import { useRole } from '@/hooks/useRole';
import { AuditTimeline, DocumentMeta, AuditEntry } from '@/components/ui/audit-timeline';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PEBDocument {
  id: string;
  documentNumber: string;
  date: string;
  exporterName: string;
  totalValue: number;
  status: DocumentStatus;
  createdBy: string;
  createdAt: string;
  lastAction: string;
  lastActionBy: string;
  lastActionAt: string;
}

// Map database status to UI status
function mapPEBStatus(dbStatus: string | null): DocumentStatus {
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

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-CA'); // YYYY-MM-DD format
  } catch {
    return '-';
  }
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
    }).replace(',', '');
  } catch {
    return '-';
  }
}

const statusFilterOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'review', label: 'Under Review' },
];

export default function PEBList() {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PEBDocument | null>(null);
  const [pebDocuments, setPebDocuments] = useState<PEBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<Record<string, AuditEntry[]>>({});
  const { permissions } = useRole();

  // Fetch PEB documents from Supabase
  const fetchPEBDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('peb_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching PEB documents:', fetchError);
        setError(`Failed to load PEB documents: ${fetchError.message}`);
        setPebDocuments([]);
        return;
      }

      // Map CEISA columns to UI format
      // Database → Frontend mapping:
      // jenis_dokumen → Kode Dokumen
      // nomor_aju → Nomor Pengajuan (Document Number)
      // tanggal_aju → Tanggal (Date)
      // status → Status
      // respon_ceisa → Nama Respon
      // created_at → Waktu
      const transformedData: PEBDocument[] = (data || []).map((doc) => {
        const status = mapPEBStatus(doc.status);
        let lastAction = 'Created';
        let lastActionBy = doc.created_by || 'system';
        let lastActionAt = doc.created_at || '';

        // Determine last action based on status
        if (doc.submitted_at) {
          lastAction = status === 'approved' ? 'Approved' : 
                       status === 'rejected' ? 'Rejected' : 
                       status === 'review' ? 'Under Review' : 'Submitted';
          lastActionBy = doc.submitted_by || doc.updated_by || lastActionBy;
          lastActionAt = doc.updated_at || doc.submitted_at || lastActionAt;
        } else if (doc.updated_at && doc.updated_at !== doc.created_at) {
          lastAction = 'Edited';
          lastActionBy = doc.updated_by || lastActionBy;
          lastActionAt = doc.updated_at;
        }

        return {
          id: doc.id,
          documentNumber: doc.nomor_aju || doc.document_number || `PEB-${doc.id.slice(0, 8).toUpperCase()}`,
          date: formatDate(doc.tanggal_aju || doc.registration_date || doc.created_at),
          exporterName: doc.nama_eksportir || doc.exporter_name || doc.npwp || 'Unknown Exporter',
          totalValue: doc.nilai_fob || doc.total_fob_value || 0,
          status,
          createdBy: doc.created_by || 'system',
          createdAt: formatDateTime(doc.created_at),
          lastAction,
          lastActionBy,
          lastActionAt: formatDateTime(lastActionAt),
        };
      });

      setPebDocuments(transformedData);
    } catch (err) {
      console.error('Error fetching PEB documents:', err);
      setError('An unexpected error occurred while loading PEB documents');
      setPebDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch audit history for a specific document
  const fetchAuditHistory = useCallback(async (docId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select('id, action, user_id, created_at, notes, metadata')
        .eq('ref_id', docId)
        .eq('ref_type', 'PEB')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching audit history:', fetchError);
        return;
      }

      const entries: AuditEntry[] = (data || []).map((log) => ({
        id: log.id,
        action: log.action || 'Action',
        user: log.user_id || 'system',
        timestamp: formatDateTime(log.created_at),
        status: mapPEBStatus(log.metadata?.status || null),
        description: log.notes || undefined,
      }));

      setAuditHistory((prev) => ({ ...prev, [docId]: entries }));
    } catch (err) {
      console.error('Error fetching audit history:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPEBDocuments();
  }, [fetchPEBDocuments]);

  // Fetch audit history when document is selected
  useEffect(() => {
    if (selectedDoc && !auditHistory[selectedDoc.id]) {
      fetchAuditHistory(selectedDoc.id);
    }
  }, [selectedDoc, auditHistory, fetchAuditHistory]);

  const columns: Column<PEBDocument>[] = [
    {
      id: 'documentNumber',
      header: 'Document Number',
      accessor: 'documentNumber',
      className: 'font-mono text-xs',
    },
    {
      id: 'date',
      header: 'Date',
      accessor: 'date',
    },
    {
      id: 'exporterName',
      header: 'Exporter Name',
      accessor: 'exporterName',
    },
    {
      id: 'totalValue',
      header: 'Total Value (USD)',
      accessor: (row) => row.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      className: 'text-right font-mono',
    },
    {
      id: 'createdBy',
      header: 'Created By',
      accessor: (row) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs">
                <User className="h-3 w-3 text-muted-foreground" />
                {row.createdBy}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">{row.createdAt}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      id: 'lastAction',
      header: 'Last Action',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-medium">{row.lastAction}</div>
          <div className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {row.lastActionAt}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} showIcon={isLockedStatus(row.status)} />,
      filterable: true,
      filterOptions: statusFilterOptions,
    },
  ];

  const renderActions = (row: PEBDocument) => {
    const locked = isLockedStatus(row.status) || permissions.isReadOnly;
    return (
      <>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/peb/${row.id}`)}>
          <Eye size={14} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDoc(row)}>
          <History size={14} />
        </Button>
        {permissions.canEditPEB && (
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={locked} onClick={() => navigate(`/peb/${row.id}/edit`)}>
            <Pencil size={14} />
          </Button>
        )}
        {permissions.canDeletePEB && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled={locked}>
            <Trash2 size={14} />
          </Button>
        )}
      </>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Export - PEB</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Loading documents...</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
            <h1 className="text-xl font-semibold">Export - PEB</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {permissions.isReadOnly ? 'View export declarations (Read-Only)' : 'Manage export declarations (Pemberitahuan Ekspor Barang)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchPEBDocuments}>
              <RefreshCw size={14} />
              Refresh
            </Button>
            {permissions.canCreatePEB && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate('/peb/new')}>
                <Plus size={16} />
                New PEB
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedRows.length > 0 && !permissions.isReadOnly && (
          <div className="flex items-center gap-3 p-2 bg-muted/50 rounded border text-sm">
            <span className="font-medium">{selectedRows.length} selected</span>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <FileDown size={14} />
              Export Excel
            </Button>
            {permissions.canSyncCEISA && (
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <Send size={14} />
                Send to CEISA
              </Button>
            )}
          </div>
        )}

        <Card>
          <CardContent className="p-4">
            <DataTable
              data={pebDocuments}
              columns={columns}
              keyField="id"
              selectable={!permissions.isReadOnly}
              selectedRows={selectedRows}
              onSelectRows={setSelectedRows}
              renderActions={renderActions}
              pageSize={10}
              emptyMessage="No PEB documents found. Documents synced from CEISA will appear here."
            />
          </CardContent>
        </Card>

        {/* Audit Timeline Dialog */}
        <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-mono">
                {selectedDoc?.documentNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4">
                <DocumentMeta
                  createdBy={selectedDoc.createdBy}
                  createdAt={selectedDoc.createdAt}
                  lastAction={selectedDoc.lastAction}
                  lastActionBy={selectedDoc.lastActionBy}
                  lastActionAt={selectedDoc.lastActionAt}
                />
                <div className="border-t pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">Status Timeline</h4>
                  <AuditTimeline 
                    entries={auditHistory[selectedDoc.id] || []} 
                    compact
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
