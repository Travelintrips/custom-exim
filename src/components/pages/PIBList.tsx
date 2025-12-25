import { AppLayout } from '../layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus, FileDown, Send, Eye, Pencil, Trash2, History, User, Clock, RefreshCw, AlertCircle, Download } from 'lucide-react';
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
import { fetchPIBFromCEISASmart, PIBFetchParams } from '@/lib/edi/pib-fetch';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PIBDocument {
  id: string;
  documentNumber: string;
  date: string;
  importerName: string;
  totalValue: number;
  status: DocumentStatus;
  createdBy: string;
  createdAt: string;
  lastAction: string;
  lastActionBy: string;
  lastActionAt: string;
}

// Map database status to UI status
function mapPIBStatus(dbStatus: string | null): DocumentStatus {
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

export default function PIBList() {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PIBDocument | null>(null);
  const [pibDocuments, setPibDocuments] = useState<PIBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<Record<string, AuditEntry[]>>({});
  const [syncing, setSyncing] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncParams, setSyncParams] = useState({
    nomorAju: '',
    npwpImportir: '',
    kodeKantor: '',
  });
  const { permissions } = useRole();

  // Quick Sync from CEISA
  const handleQuickSync = async () => {
    if (!permissions.canSyncCEISA) {
      toast.error('You do not have permission to sync with CEISA');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const params: PIBFetchParams = {
        nomorAju: syncParams.nomorAju,
        npwpImportir: syncParams.npwpImportir,
        kodeKantor: syncParams.kodeKantor,
        jenisDokumen: 'BC20',
      };

      toast.info('Syncing PIB data from CEISA...');

      const result = await fetchPIBFromCEISASmart(params);

      if (result.success && result.data) {
        // Insert fetched data into Supabase
        const documents = result.data.map((item: any) => ({
          nomor_aju: item.nomorAju || item.documentNumber,
          tanggal_aju: item.tanggalAju || item.date,
          nama_importir: item.namaImportir || item.importerName,
          nilai_cif: item.nilaiCIF || item.totalValue || 0,
          status: 'SUBMITTED',
          xml_content: item.xmlContent || null,
          xml_hash: null,
          metadata: item,
        }));

        const { data: insertData, error: insertError } = await supabase
          .from('pib_documents')
          .upsert(documents, { onConflict: 'nomor_aju' })
          .select();

        if (insertError) throw insertError;

        toast.success(`Synced ${insertData?.length || 0} PIB documents from CEISA`);
        
        // Refresh list
        await fetchPIBDocuments();
        
        // Close dialog and reset form
        setShowSyncDialog(false);
        setSyncParams({ nomorAju: '', npwpImportir: '', kodeKantor: '' });
      } else {
        toast.warning(result.error || 'No PIB documents found in CEISA');
      }
    } catch (err: any) {
      console.error('Quick Sync Error:', err);
      const errorMsg = err.message || 'Failed to sync with CEISA';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSyncing(false);
    }
  };

  // Fetch PIB documents from Supabase
  const fetchPIBDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('pib_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching PIB documents:', fetchError);
        setError(`Failed to load PIB documents: ${fetchError.message}`);
        setPibDocuments([]);
        return;
      }

      // Map CEISA columns to UI format
      const transformedData: PIBDocument[] = (data || []).map((doc) => {
        const status = mapPIBStatus(doc.status);
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
          documentNumber: doc.nomor_aju || doc.document_number || `PIB-${doc.id.slice(0, 8).toUpperCase()}`,
          date: formatDate(doc.tanggal_aju || doc.registration_date || doc.created_at),
          importerName: doc.nama_importir || doc.importer_name || doc.npwp || 'Unknown Importer',
          totalValue: doc.nilai_cif || doc.total_cif_value || 0,
          status,
          createdBy: doc.created_by || 'system',
          createdAt: formatDateTime(doc.created_at),
          lastAction,
          lastActionBy,
          lastActionAt: formatDateTime(lastActionAt),
        };
      });

      setPibDocuments(transformedData);
    } catch (err) {
      console.error('Error fetching PIB documents:', err);
      setError('An unexpected error occurred while loading PIB documents');
      setPibDocuments([]);
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
        .eq('ref_type', 'PIB')
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
        status: mapPIBStatus(log.metadata?.status || null),
        description: log.notes || undefined,
      }));

      setAuditHistory((prev) => ({ ...prev, [docId]: entries }));
    } catch (err) {
      console.error('Error fetching audit history:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPIBDocuments();
  }, [fetchPIBDocuments]);

  // Fetch audit history when document is selected
  useEffect(() => {
    if (selectedDoc && !auditHistory[selectedDoc.id]) {
      fetchAuditHistory(selectedDoc.id);
    }
  }, [selectedDoc, auditHistory, fetchAuditHistory]);

  const columns: Column<PIBDocument>[] = [
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
      id: 'importerName',
      header: 'Importer Name',
      accessor: 'importerName',
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

  const renderActions = (row: PIBDocument) => {
    const locked = isLockedStatus(row.status) || permissions.isReadOnly;
    return (
      <>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/pib/${row.id}`)}>
          <Eye size={14} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDoc(row)}>
          <History size={14} />
        </Button>
        {permissions.canEditPIB && (
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={locked} onClick={() => navigate(`/pib/${row.id}/edit`)}>
            <Pencil size={14} />
          </Button>
        )}
        {permissions.canDeletePIB && (
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
              <h1 className="text-xl font-semibold">Import - PIB</h1>
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
            <h1 className="text-xl font-semibold">Import - PIB</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {permissions.isReadOnly ? 'View import declarations (Read-Only)' : 'Manage import declarations (Pemberitahuan Impor Barang)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5" 
              onClick={() => setShowSyncDialog(true)}
              disabled={syncing || !permissions.canSyncCEISA}
            >
              <Download size={14} />
              Sync CEISA
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchPIBDocuments}>
              <RefreshCw size={14} />
              Refresh
            </Button>
            {permissions.canCreatePIB && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate('/pib/new')}>
                <Plus size={16} />
                New PIB
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
              data={pibDocuments}
              columns={columns}
              keyField="id"
              selectable={!permissions.isReadOnly}
              selectedRows={selectedRows}
              onSelectRows={setSelectedRows}
              renderActions={renderActions}
              pageSize={10}
              emptyMessage="No PIB documents found. Documents synced from CEISA will appear here."
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

        {/* Sync CEISA Dialog */}
        <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sync PIB from CEISA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomorAju">Nomor Pengajuan (Nomor Aju) *</Label>
                <Input
                  id="nomorAju"
                  placeholder="e.g., 000000-00000000-00000000"
                  value={syncParams.nomorAju}
                  onChange={(e) => setSyncParams({ ...syncParams, nomorAju: e.target.value })}
                  disabled={syncing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="npwpImportir">NPWP Importir *</Label>
                <Input
                  id="npwpImportir"
                  placeholder="e.g., 00.000.000.0-000.000"
                  value={syncParams.npwpImportir}
                  onChange={(e) => setSyncParams({ ...syncParams, npwpImportir: e.target.value })}
                  disabled={syncing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kodeKantor">Kode Kantor Bea Cukai *</Label>
                <Input
                  id="kodeKantor"
                  placeholder="e.g., 040100"
                  value={syncParams.kodeKantor}
                  onChange={(e) => setSyncParams({ ...syncParams, kodeKantor: e.target.value })}
                  disabled={syncing}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSyncDialog(false)}
                  disabled={syncing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickSync}
                  disabled={syncing || !syncParams.nomorAju || !syncParams.npwpImportir || !syncParams.kodeKantor}
                >
                  {syncing ? (
                    <>
                      <RefreshCw size={14} className="mr-1.5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Download size={14} className="mr-1.5" />
                      Sync
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
