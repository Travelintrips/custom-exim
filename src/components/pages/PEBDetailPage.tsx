import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Pencil,
  Send,
  CheckCircle,
  XCircle,
  Code,
  FileText,
  Clock,
  Lock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { PEBStatusBadge } from '@/components/peb/PEBStatusBadge';
import { PEBStatusTimeline } from '@/components/peb/PEBStatusTimeline';
import { PEBXMLPreview } from '@/components/peb/PEBXMLPreview';
import { PEBDocument, PEBItem, PEBStatusHistory, PEB_STATUS_CONFIG, PEBStatus } from '@/types/peb';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

export default function PEBDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions, role } = useRole();
  const [xmlPreviewOpen, setXmlPreviewOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'send_ppjk'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [peb, setPeb] = useState<PEBDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch PEB document from Supabase
  const fetchPEB = useCallback(async () => {
    if (!id) {
      setError('No document ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('peb_documents')
        .select(`
          *,
          peb_items (*),
          peb_status_history (*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching PEB:', fetchError);
        setError(`Failed to load document: ${fetchError.message}`);
        setPeb(null);
        return;
      }

      if (data) {
        // Transform the data to match PEBDocument structure
        const pebDoc: PEBDocument = {
          ...data,
          items: data.peb_items || [],
          status_history: data.peb_status_history || [],
        };
        setPeb(pebDoc);
      } else {
        setError('Document not found');
        setPeb(null);
      }
    } catch (err) {
      console.error('Error fetching PEB:', err);
      setError('An unexpected error occurred');
      setPeb(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPEB();
  }, [fetchPEB]);

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/peb')}>
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error || !peb) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/peb')}>
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Document Not Found</h2>
              <p className="text-muted-foreground mb-4">{error || 'The requested document could not be found.'}</p>
              <Button onClick={() => navigate('/peb')}>Return to PEB List</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  const isLocked = PEB_STATUS_CONFIG[peb.status].isLocked;
  const canEdit = !isLocked && (permissions.canEditPEB || role === 'super_admin');
  const canApprove = permissions.canApproveDocs || role === 'super_admin';

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const messages: Record<string, string> = {
        approve: 'Document approved and sent to CEISA',
        reject: 'Document rejected',
        send_ppjk: 'Document sent to PPJK',
      };
      
      toast.success(messages[actionType]);
      setActionDialogOpen(false);
      setActionNotes('');
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (type: 'approve' | 'reject' | 'send_ppjk') => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/peb')}>
              <ArrowLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold font-mono">{peb.document_number}</h1>
                <PEBStatusBadge status={peb.status} showIcon />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {peb.registration_number ? `Reg: ${peb.registration_number}` : 'Not registered'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/peb/${id}/edit`)} className="gap-1.5">
                <Pencil size={14} />
                Edit
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setXmlPreviewOpen(true)} className="gap-1.5">
              <Code size={14} />
              View XML
            </Button>
            {canApprove && peb.status === 'SUBMITTED' && (
              <>
                <Button variant="outline" size="sm" onClick={() => openActionDialog('send_ppjk')} className="gap-1.5">
                  <Send size={14} />
                  Send to PPJK
                </Button>
                <Button variant="outline" size="sm" onClick={() => openActionDialog('reject')} className="gap-1.5 text-destructive">
                  <XCircle size={14} />
                  Reject
                </Button>
                <Button size="sm" onClick={() => openActionDialog('approve')} className="gap-1.5">
                  <CheckCircle size={14} />
                  Approve & Send
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Lock Banner */}
        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              This document is locked and cannot be edited. Status: {PEB_STATUS_CONFIG[peb.status].description}
            </span>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="items" className="text-xs">Items ({peb.items?.length || 0})</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Exporter */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Exporter</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
                  <div>
                    <span className="text-muted-foreground text-xs">Name</span>
                    <p className="font-medium">{peb.exporter_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">NPWP</span>
                    <p className="font-mono">{peb.exporter_npwp}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Address</span>
                    <p>{peb.exporter_address}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Buyer */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Buyer</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
                  <div>
                    <span className="text-muted-foreground text-xs">Name</span>
                    <p className="font-medium">{peb.buyer_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Country</span>
                    <p>{peb.buyer_country}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Address</span>
                    <p>{peb.buyer_address}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transport */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Transport & Destination</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Customs Office</span>
                    <p className="font-medium">{peb.customs_office_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{peb.customs_office_code}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Loading Port</span>
                    <p className="font-medium">{peb.loading_port_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{peb.loading_port_code}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Destination</span>
                    <p className="font-medium">{peb.destination_port_name}</p>
                    <p className="text-xs text-muted-foreground">{peb.destination_country}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Vessel</span>
                    <p className="font-medium">{peb.vessel_name}</p>
                    <p className="text-xs text-muted-foreground">Voyage: {peb.voyage_number}</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Incoterm</span>
                    <p className="font-medium">{peb.incoterm_code}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Currency</span>
                    <p className="font-medium">{peb.currency_code}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Exchange Rate</span>
                    <p className="font-mono">IDR {peb.exchange_rate?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">PPJK</span>
                    <p className="font-medium">{peb.ppjk_name || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Packages</span>
                    <p className="font-mono font-medium">{peb.total_packages} {peb.package_unit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Gross Weight</span>
                    <p className="font-mono font-medium">{peb.gross_weight?.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Net Weight</span>
                    <p className="font-mono font-medium">{peb.net_weight?.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">FOB Value</span>
                    <p className="font-mono font-bold text-primary">
                      {peb.currency_code} {peb.total_fob_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">FOB (IDR)</span>
                    <p className="font-mono text-muted-foreground">
                      IDR {peb.total_fob_idr?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b">
                      <tr className="text-left">
                        <th className="p-2 px-3 font-medium text-muted-foreground text-xs">#</th>
                        <th className="p-2 font-medium text-muted-foreground text-xs">HS Code</th>
                        <th className="p-2 font-medium text-muted-foreground text-xs">Description</th>
                        <th className="p-2 font-medium text-muted-foreground text-xs text-right">Qty</th>
                        <th className="p-2 font-medium text-muted-foreground text-xs text-right">Unit Price</th>
                        <th className="p-2 font-medium text-muted-foreground text-xs text-right">FOB Value</th>
                        <th className="p-2 font-medium text-muted-foreground text-xs text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peb.items?.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="p-2 px-3">{item.item_number}</td>
                          <td className="p-2 font-mono text-xs">{item.hs_code}</td>
                          <td className="p-2 max-w-[250px]">{item.product_description}</td>
                          <td className="p-2 text-right font-mono">{item.quantity} {item.quantity_unit}</td>
                          <td className="p-2 text-right font-mono">{item.unit_price?.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-medium">{item.fob_value?.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                            {item.net_weight?.toLocaleString()} / {item.gross_weight?.toLocaleString()} kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents attached</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <PEBStatusTimeline history={peb.status_history || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Created/Updated Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Created: {new Date(peb.created_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated: {new Date(peb.updated_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* XML Preview */}
      <PEBXMLPreview
        peb={peb}
        isOpen={xmlPreviewOpen}
        onClose={() => setXmlPreviewOpen(false)}
      />

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              {actionType === 'approve' && <CheckCircle className="h-4 w-4 text-emerald-600" />}
              {actionType === 'reject' && <XCircle className="h-4 w-4 text-red-600" />}
              {actionType === 'send_ppjk' && <Send className="h-4 w-4 text-blue-600" />}
              {actionType === 'approve' && 'Approve & Send to CEISA'}
              {actionType === 'reject' && 'Reject Document'}
              {actionType === 'send_ppjk' && 'Send to PPJK'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'reject' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Rejecting will allow the operator to make corrections and resubmit.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Notes</label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={actionType === 'reject' ? 'Please provide reason for rejection...' : 'Add notes (optional)...'}
                className="text-sm min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAction}
              disabled={isProcessing || (actionType === 'reject' && !actionNotes)}
              className={cn(
                actionType === 'reject' && 'bg-destructive hover:bg-destructive/90'
              )}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
