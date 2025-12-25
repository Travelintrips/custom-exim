import { useState } from 'react';
import { AppLayout } from '../layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  Send,
  Download,
  Archive,
  Activity,
  Play,
  CloudDownload,
  Bug,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { useEDI, useEDIConnectionStatus } from '@/hooks/useEDI';
import { EDIQueuePanel } from '@/components/edi/EDIQueuePanel';
import { EDIArchiveList } from '@/components/edi/EDIArchiveList';
import { EDIResponseViewer } from '@/components/edi/EDIResponseViewer';
import { EDIConnectionStatusCard } from '@/components/edi/EDIConnectionStatus';
import { toast } from 'sonner';
import { IncomingMessage } from '@/lib/edi/types';
import { 
  syncFromCEISA, 
  CEISASyncResult, 
  CEISADebugInfo,
  getDebugInfo, 
  mapCEISAError 
} from '@/lib/edi/ceisa-sync';
import { PEBFetchParams, PEBFetchResult } from '@/lib/edi/peb-fetch';
import { PIBFetchParams, PIBFetchResult } from '@/lib/edi/pib-fetch';

export default function CEISAPage() {
  const { permissions, role } = useRole();
  const { isConnected, lastCheck } = useEDIConnectionStatus();
  const {
    isLoading,
    queueItems,
    incomingMessages,
    archiveEntries,
    stats,
    processQueue,
    simulateResponse,
    refreshStats,
  } = useEDI();
  
  const [selectedResponse, setSelectedResponse] = useState<IncomingMessage | null>(null);
  
  // Sync CEISA state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncResultDialogOpen, setSyncResultDialogOpen] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<CEISASyncResult | null>(null);
  
  // Debug mode - only for super_admin
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<CEISADebugInfo | null>(null);
  const [debugExpanded, setDebugExpanded] = useState({ peb: false, pib: false, logs: false });
  
  // Sync parameters
  const [syncPebParams, setSyncPebParams] = useState<PEBFetchParams>({});
  const [syncPibParams, setSyncPibParams] = useState<PIBFetchParams>({
    nomorAju: '',
    npwpImportir: '',
    kodeKantor: '',
  });
  const [skipPeb, setSkipPeb] = useState(false);
  const [skipPib, setSkipPib] = useState(false);
  
  const canAccessDebugMode = permissions.canAccessDebugMode || role === 'super_admin';

  const handleProcessQueue = async () => {
    try {
      const results = await processQueue();
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      if (successCount > 0) {
        toast.success(`Processed ${successCount} item(s) successfully`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} item(s) failed to process`);
      }
    } catch (error) {
      toast.error('Failed to process queue');
    }
  };
  
  const handleSimulateResponse = async (type: 'PEB' | 'PIB', success: boolean) => {
    try {
      const message = await simulateResponse(
        type,
        `doc-${Date.now()}`,
        `${type}-2024-${String(Date.now()).slice(-6)}`,
        success,
        success ? 'GREEN' : undefined
      );
      setSelectedResponse(message);
      toast.success(`Simulated ${success ? 'success' : 'failure'} response for ${type}`);
    } catch (error) {
      toast.error('Failed to simulate response');
    }
  };
  
  // Handle manual CEISA sync
  const handleSyncCEISA = async () => {
    if (!isConnected) {
      toast.error('CEISA tidak terhubung. Periksa koneksi terlebih dahulu.');
      return;
    }
    
    setIsSyncing(true);
    setSyncDialogOpen(false);
    
    try {
      const result = await syncFromCEISA({
        pebParams: skipPeb ? undefined : syncPebParams,
        pibParams: skipPib ? undefined : syncPibParams,
        skipPEB: skipPeb,
        skipPIB: skipPib,
      });
      
      setLastSyncResult(result);
      
      // Generate debug info for super_admin
      if (canAccessDebugMode && debugMode) {
        const debug = getDebugInfo(
          result.peb.result || null,
          result.pib.result || null,
          skipPeb ? null : syncPebParams,
          skipPib ? null : syncPibParams
        );
        setDebugInfo(debug);
      }
      
      if (result.success) {
        toast.success(
          `Sync berhasil! ${result.summary}`,
          { duration: 5000 }
        );
      } else {
        // Check for specific errors
        const pebError = result.peb.result?.error;
        const pibError = result.pib.result?.error;
        
        if (pebError || pibError) {
          const errorMapping = mapCEISAError(
            result.peb.result?.httpStatus || result.pib.result?.httpStatus || null,
            pebError || pibError
          );
          
          toast.error(
            `${errorMapping.message}. ${errorMapping.action}`,
            { duration: 8000 }
          );
        } else {
          toast.error('Sync selesai dengan beberapa error. Periksa detail hasil sync.');
        }
      }
      
      setSyncResultDialogOpen(true);
      refreshStats();
      
    } catch (error) {
      toast.error('Gagal melakukan sync CEISA');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const copyDebugInfo = () => {
    if (debugInfo) {
      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      toast.success('Debug info disalin ke clipboard');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">EDI / CEISA Integration</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {permissions.canSyncCEISA ? 'Manage EDI connections and transmissions to CEISA system' : 'View CEISA transmission status (Read-Only)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Debug Mode Toggle - Super Admin Only */}
            {canAccessDebugMode && (
              <Button 
                variant={debugMode ? "default" : "outline"} 
                size="sm" 
                className="gap-1.5"
                onClick={() => setDebugMode(!debugMode)}
              >
                <Bug size={14} />
                Debug
              </Button>
            )}
            
            <Button variant="outline" size="sm" className="gap-1.5" onClick={refreshStats}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            
            {/* SYNC CEISA Button - Main Feature */}
            {permissions.canSyncCEISA && (
              <Button 
                size="sm" 
                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                onClick={() => setSyncDialogOpen(true)} 
                disabled={isSyncing || !isConnected}
              >
                <CloudDownload size={14} className={isSyncing ? 'animate-bounce' : ''} />
                Sync CEISA
              </Button>
            )}
            
            {permissions.canSyncCEISA && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleProcessQueue} disabled={isLoading}>
                <Play size={14} />
                Process Queue
              </Button>
            )}
          </div>
        </div>

        {/* Connection Status Card */}
        <EDIConnectionStatusCard />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Queue Items</p>
                  <p className="text-2xl font-bold mt-1">{stats?.queue.total || 0}</p>
                </div>
                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                  <Send className="h-4 w-4 text-blue-700" />
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <Badge variant="outline" className="bg-slate-50">{stats?.queue.pending || 0} pending</Badge>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">{stats?.queue.accepted || 0} accepted</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Incoming Responses</p>
                  <p className="text-2xl font-bold mt-1">{stats?.incoming.total || 0}</p>
                </div>
                <div className="p-2 rounded bg-purple-50 border border-purple-200">
                  <Download className="h-4 w-4 text-purple-700" />
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <Badge variant="outline" className="bg-amber-50 text-amber-700">{stats?.incoming.unprocessed || 0} new</Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">{stats?.incoming.withErrors || 0} with errors</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Archived Messages</p>
                  <p className="text-2xl font-bold mt-1">{stats?.archive.total || 0}</p>
                </div>
                <div className="p-2 rounded bg-slate-100 border border-slate-200">
                  <Archive className="h-4 w-4 text-slate-700" />
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <Badge variant="outline">{stats?.archive.peb || 0} PEB</Badge>
                <Badge variant="outline">{stats?.archive.pib || 0} PIB</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats?.incoming.total 
                      ? Math.round((stats.incoming.accepted / stats.incoming.total) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                  <Activity className="h-4 w-4 text-emerald-700" />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {stats?.incoming.accepted || 0} accepted / {stats?.incoming.total || 0} total
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue" className="text-xs gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Outgoing Queue
            </TabsTrigger>
            <TabsTrigger value="incoming" className="text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Incoming Responses
            </TabsTrigger>
            <TabsTrigger value="archive" className="text-xs gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              Archive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <EDIQueuePanel onProcessQueue={handleProcessQueue} />
          </TabsContent>

          <TabsContent value="incoming">
            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  CEISA Responses
                </CardTitle>
                {permissions.canSyncCEISA && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleSimulateResponse('PEB', true)}
                    >
                      Simulate PEB Success
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleSimulateResponse('PIB', false)}
                    >
                      Simulate PIB Error
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {incomingMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No incoming responses</p>
                    <p className="text-xs mt-1">Responses from CEISA will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incomingMessages.map((message) => (
                      <div 
                        key={message.id}
                        className="border rounded-lg p-3 hover:bg-muted/20 cursor-pointer"
                        onClick={() => setSelectedResponse(message)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {message.documentType}
                            </Badge>
                            <span className="font-mono text-sm">{message.documentNumber}</span>
                          </div>
                          <Badge className={cn(
                            'text-xs',
                            message.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                            message.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          )}>
                            {message.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Received: {new Date(message.receivedAt).toLocaleString()}</span>
                          {message.response.errors.length > 0 && (
                            <span className="text-red-600">{message.response.errors.length} error(s)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive">
            <EDIArchiveList entries={archiveEntries} />
          </TabsContent>
        </Tabs>
        
        {/* Debug Panel - Super Admin Only */}
        {canAccessDebugMode && debugMode && debugInfo && (
          <Card className="border-2 border-amber-300 bg-amber-50/50">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                  <Bug className="h-4 w-4" />
                  Debug Mode (Super Admin Only)
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={copyDebugInfo}>
                  <Copy className="h-3 w-3" />
                  Copy All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* PEB Debug */}
              {debugInfo.peb && (
                <Collapsible open={debugExpanded.peb} onOpenChange={(open) => setDebugExpanded(prev => ({ ...prev, peb: open }))}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-white rounded border hover:bg-slate-50">
                    <span className="text-xs font-medium">PEB Request/Response</span>
                    {debugExpanded.peb ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="space-y-2 text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded">
                      <div><span className="text-blue-400">Endpoint:</span> {debugInfo.peb.endpoint}</div>
                      <div><span className="text-blue-400">HTTP Status:</span> {debugInfo.peb.httpStatus || 'N/A'}</div>
                      <div><span className="text-blue-400">Response Time:</span> {debugInfo.peb.responseTime}ms</div>
                      <Separator className="bg-slate-700" />
                      <div><span className="text-green-400">Request Params:</span></div>
                      <pre className="text-[10px] overflow-auto max-h-32 bg-slate-800 p-2 rounded">
                        {JSON.stringify(debugInfo.peb.params, null, 2)}
                      </pre>
                      <div><span className="text-yellow-400">Raw Response:</span></div>
                      <ScrollArea className="h-40">
                        <pre className="text-[10px] overflow-auto bg-slate-800 p-2 rounded">
                          {JSON.stringify(debugInfo.peb.rawResponse, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              
              {/* PIB Debug */}
              {debugInfo.pib && (
                <Collapsible open={debugExpanded.pib} onOpenChange={(open) => setDebugExpanded(prev => ({ ...prev, pib: open }))}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-white rounded border hover:bg-slate-50">
                    <span className="text-xs font-medium">PIB Request/Response</span>
                    {debugExpanded.pib ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="space-y-2 text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded">
                      <div><span className="text-blue-400">Endpoint:</span> {debugInfo.pib.endpoint}</div>
                      <div><span className="text-blue-400">HTTP Status:</span> {debugInfo.pib.httpStatus || 'N/A'}</div>
                      <div><span className="text-blue-400">Response Time:</span> {debugInfo.pib.responseTime}ms</div>
                      <Separator className="bg-slate-700" />
                      <div><span className="text-green-400">Request Params:</span></div>
                      <pre className="text-[10px] overflow-auto max-h-32 bg-slate-800 p-2 rounded">
                        {JSON.stringify(debugInfo.pib.params, null, 2)}
                      </pre>
                      <div><span className="text-yellow-400">Raw Response:</span></div>
                      <ScrollArea className="h-40">
                        <pre className="text-[10px] overflow-auto bg-slate-800 p-2 rounded">
                          {JSON.stringify(debugInfo.pib.rawResponse, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              
              {/* Logs */}
              <Collapsible open={debugExpanded.logs} onOpenChange={(open) => setDebugExpanded(prev => ({ ...prev, logs: open }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-white rounded border hover:bg-slate-50">
                  <span className="text-xs font-medium">Operation Logs ({debugInfo.logs.length})</span>
                  {debugExpanded.logs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <ScrollArea className="h-60">
                    <pre className="text-[10px] font-mono bg-slate-900 text-slate-100 p-3 rounded overflow-auto">
                      {JSON.stringify(debugInfo.logs, null, 2)}
                    </pre>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Sync CEISA Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CloudDownload className="h-5 w-5" />
              Sync Data dari CEISA
            </DialogTitle>
            <DialogDescription>
              Tarik data PEB dan PIB dari server CEISA. Proses ini membutuhkan koneksi aktif ke CEISA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* PEB Parameters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Data PEB (Ekspor)</Label>
                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    checked={skipPeb} 
                    onChange={(e) => setSkipPeb(e.target.checked)}
                    className="rounded"
                  />
                  Lewati
                </label>
              </div>
              {!skipPeb && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nomor Aju</Label>
                    <Input 
                      placeholder="Optional"
                      value={syncPebParams.nomorAju || ''}
                      onChange={(e) => setSyncPebParams(prev => ({ ...prev, nomorAju: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">NPWP Eksportir</Label>
                    <Input 
                      placeholder="Optional"
                      value={syncPebParams.npwpEksportir || ''}
                      onChange={(e) => setSyncPebParams(prev => ({ ...prev, npwpEksportir: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Kode Kantor</Label>
                    <Input 
                      placeholder="Optional"
                      value={syncPebParams.kodeKantor || ''}
                      onChange={(e) => setSyncPebParams(prev => ({ ...prev, kodeKantor: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date From</Label>
                    <Input 
                      type="date"
                      value={syncPebParams.dateFrom || ''}
                      onChange={(e) => setSyncPebParams(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* PIB Parameters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Data PIB (Impor BC 2.0)</Label>
                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    checked={skipPib} 
                    onChange={(e) => setSkipPib(e.target.checked)}
                    className="rounded"
                  />
                  Lewati
                </label>
              </div>
              {!skipPib && (
                <div className="space-y-2">
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Parameter berikut WAJIB diisi untuk PIB</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nomor Aju *</Label>
                      <Input 
                        placeholder="Wajib"
                        value={syncPibParams.nomorAju}
                        onChange={(e) => setSyncPibParams(prev => ({ ...prev, nomorAju: e.target.value }))}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">NPWP Importir *</Label>
                      <Input 
                        placeholder="Wajib"
                        value={syncPibParams.npwpImportir}
                        onChange={(e) => setSyncPibParams(prev => ({ ...prev, npwpImportir: e.target.value }))}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Kode Kantor *</Label>
                      <Input 
                        placeholder="Wajib"
                        value={syncPibParams.kodeKantor}
                        onChange={(e) => setSyncPibParams(prev => ({ ...prev, kodeKantor: e.target.value }))}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Jenis Dokumen</Label>
                      <Input 
                        value="BC20"
                        disabled
                        className="h-8 text-xs bg-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Warning about manual sync */}
            <div className="text-xs text-muted-foreground bg-slate-50 p-2 rounded">
              <strong>Catatan:</strong> Sync hanya dilakukan saat tombol ditekan. Tidak ada auto-sync.
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSyncCEISA} 
              disabled={isSyncing || (!skipPib && (!syncPibParams.nomorAju || !syncPibParams.npwpImportir || !syncPibParams.kodeKantor))}
              className="gap-1.5"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <CloudDownload className="h-4 w-4" />
                  Mulai Sync
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Sync Result Dialog */}
      <Dialog open={syncResultDialogOpen} onOpenChange={setSyncResultDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {lastSyncResult?.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Hasil Sync CEISA
            </DialogTitle>
          </DialogHeader>
          
          {lastSyncResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={cn(
                "p-3 rounded-lg",
                lastSyncResult.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              )}>
                <div className="font-medium">{lastSyncResult.summary || 'Sync selesai'}</div>
                <div className="text-xs mt-1">
                  Total waktu: {lastSyncResult.totalTime}ms | {new Date(lastSyncResult.timestamp).toLocaleString()}
                </div>
              </div>
              
              {/* PEB Result */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PEB (Ekspor)
                  </span>
                  <Badge variant={lastSyncResult.peb.errors.length === 0 ? "outline" : "destructive"}>
                    {lastSyncResult.peb.fetched} fetched, {lastSyncResult.peb.saved} saved
                  </Badge>
                </div>
                {lastSyncResult.peb.errors.length > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                    {lastSyncResult.peb.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
                {lastSyncResult.peb.result?.emptyMessage && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                    {lastSyncResult.peb.result.emptyMessage}
                  </div>
                )}
              </div>
              
              {/* PIB Result */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PIB (Impor)
                  </span>
                  <Badge variant={lastSyncResult.pib.errors.length === 0 ? "outline" : "destructive"}>
                    {lastSyncResult.pib.fetched} fetched, {lastSyncResult.pib.saved} saved
                  </Badge>
                </div>
                {lastSyncResult.pib.errors.length > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                    {lastSyncResult.pib.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
                {lastSyncResult.pib.result?.emptyMessage && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2 flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{lastSyncResult.pib.result.emptyMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setSyncResultDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
