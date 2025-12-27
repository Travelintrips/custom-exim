import { useState, useEffect } from 'react';
import { AppLayout } from '../layout/AppLayout';
import { KPICard } from '../dashboard/KPICard';
import { RecentActivityTable } from '../dashboard/RecentActivityTable';
import { 
  FileOutput, 
  FileInput, 
  XCircle, 
  Activity, 
  Plus, 
  RefreshCw, 
  DollarSign, 
  Wifi, 
  WifiOff, 
  Loader2,
  Database,
  CloudOff,
  HelpCircle,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';
import { useEDIConnectionStatus } from '@/hooks/useEDI';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';
import { fetchDashboardKPIData, DashboardKPIData, StatusCounts } from '@/lib/notifications/notification-service';
import { callCeisaProxy } from '@/services/ceisa';

// Types for sync status tracking
interface SyncStatus {
  lastSyncTime: string | null;
  pebCount: number;
  pibCount: number;
  hasData: boolean;
  isEmpty: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { permissions } = useRole();
  const { 
    isConnected, 
    lastCheck, 
    httpStatus, 
    responseTime, 
    error, 
    isChecking, 
    checkConnection 
  } = useEDIConnectionStatus(30000); // Check every 30 seconds
  
  // Sync status - tracks if data has been synced
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    pebCount: 0,
    pibCount: 0,
    hasData: false,
    isEmpty: false,
  });
  const [isLoadingSyncStatus, setIsLoadingSyncStatus] = useState(true);
  
  // Dashboard KPI Data from ceisa_monitoring
  const [kpiData, setKpiData] = useState<DashboardKPIData | null>(null);
  const [isLoadingKpi, setIsLoadingKpi] = useState(true);
  
  // Fetch sync status from database
  // Note: RLS policies require authenticated user - skip queries if not logged in
  useEffect(() => {
    const fetchSyncStatus = async () => {
      setIsLoadingSyncStatus(true);
      
      // Check if user is authenticated first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not authenticated - show empty state
        setSyncStatus({
          lastSyncTime: null,
          pebCount: 0,
          pibCount: 0,
          hasData: false,
          isEmpty: true,
        });
        setIsLoadingSyncStatus(false);
        return;
      }
      
      let pebCount = 0;
      let pibCount = 0;
      
      try {
        // Get PEB count - use simple count without filter due to RLS
        const pebResult = await supabase
          .from('peb_documents')
          .select('id', { count: 'exact', head: true });
        
        if (!pebResult.error) {
          pebCount = pebResult.count || 0;
        } else {
          console.warn('PEB query skipped:', pebResult.error);
        }
      } catch (error) {
        console.warn('PEB query skipped:', error);
      }
      
      try {
        // Get PIB count - use simple count without filter due to RLS
        const pibResult = await supabase
          .from('pib_documents')
          .select('id', { count: 'exact', head: true });
        
        if (!pibResult.error) {
          pibCount = pibResult.count || 0;
        } else {
          console.warn('PIB query skipped:', pibResult.error);
        }
      } catch (error) {
        console.warn('PIB query skipped:', error);
      }
      
      const totalCount = pebCount + pibCount;
      
      setSyncStatus({
        lastSyncTime: null, // Skip audit log query
        pebCount,
        pibCount,
        hasData: totalCount > 0,
        isEmpty: totalCount === 0,
      });
      
      setIsLoadingSyncStatus(false);
    };
    
    fetchSyncStatus();
  }, []);

  // Fetch real KPI data from ceisa_monitoring
  useEffect(() => {
    const loadKpiData = async () => {
      setIsLoadingKpi(true);
      try {
        const data = await fetchDashboardKPIData();
        setKpiData(data);
      } catch (error) {
        console.error('Error loading KPI data:', error);
      } finally {
        setIsLoadingKpi(false);
      }
    };

    loadKpiData();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadKpiData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Test CEISA Proxy function
  const testCeisa = async () => {
    try {
      const res = await callCeisaProxy({
        action: "health_check"
      });
      console.log("CEISA RESPONSE:", res);
    } catch (error) {
      console.error("CEISA Test Error:", error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time overview of customs operations
            </p>
          </div>
          <div className="flex gap-2">
            {permissions.canCreatePEB && (
              <Button onClick={() => navigate('/peb')} size="sm" className="gap-1.5">
                <Plus size={14} />
                New PEB
              </Button>
            )}
            {permissions.canCreatePIB && (
              <Button onClick={() => navigate('/pib')} size="sm" className="gap-1.5">
                <Plus size={14} />
                New PIB
              </Button>
            )}
            {permissions.canSyncCEISA && (
              <Button onClick={() => navigate('/ceisa')} variant="outline" size="sm" className="gap-1.5">
                <RefreshCw size={14} />
                Sync CEISA
              </Button>
            )}
            <Button onClick={testCeisa} variant="secondary" size="sm" className="gap-1.5">
              <Activity size={14} />
              Test CEISA
            </Button>
          </div>
        </div>

        {/* CEISA Status Panel - Separated into 3 distinct indicators */}
        {permissions.canAccessCEISA && (
          <TooltipProvider>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                  
                  {/* 1. CEISA Connected - API Accessibility */}
                  <div className={cn(
                    'p-4 relative',
                    isChecking ? 'bg-slate-50' : isConnected ? 'bg-emerald-50/50' : 'bg-red-50/50'
                  )}>
                    <div className={cn(
                      'absolute left-0 top-0 bottom-0 w-1',
                      isChecking ? 'bg-slate-400' : isConnected ? 'bg-emerald-500' : 'bg-red-500'
                    )} />
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-full flex-shrink-0',
                        isChecking ? 'bg-slate-100' : isConnected ? 'bg-emerald-100' : 'bg-red-100'
                      )}>
                        {isChecking ? (
                          <Loader2 className="h-4 w-4 text-slate-600 animate-spin" />
                        ) : isConnected ? (
                          <Wifi className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">CEISA Connected</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Apa itu "Connected"?</p>
                                <p>Status ini menunjukkan apakah API CEISA dapat diakses. Ini TIDAK berarti data tersedia atau sudah di-sync.</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-[10px] px-1.5 py-0 mt-1',
                            isChecking
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : isConnected 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                          )}
                        >
                          {isChecking ? 'Memeriksa...' : isConnected ? 'API Terhubung' : 'Terputus'}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1.5 truncate">
                          {isChecking 
                            ? 'Sedang validasi...' 
                            : isConnected 
                              ? `HTTP ${httpStatus || '-'} • ${responseTime || '-'}ms`
                              : error || 'Koneksi gagal'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Check: {lastCheck ? new Date(lastCheck).toLocaleTimeString() : '-'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 flex-shrink-0" 
                        onClick={checkConnection}
                        disabled={isChecking}
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isChecking && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 2. Data Synced - Whether data has been pulled from CEISA */}
                  <div className={cn(
                    'p-4 relative',
                    isLoadingSyncStatus ? 'bg-slate-50' : syncStatus.hasData ? 'bg-blue-50/50' : 'bg-amber-50/50'
                  )}>
                    <div className={cn(
                      'absolute left-0 top-0 bottom-0 w-1 md:w-0 md:h-1 md:left-0 md:right-0 md:top-0 md:bottom-auto',
                      isLoadingSyncStatus ? 'bg-slate-400' : syncStatus.hasData ? 'bg-blue-500' : 'bg-amber-500'
                    )} />
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-full flex-shrink-0',
                        isLoadingSyncStatus ? 'bg-slate-100' : syncStatus.hasData ? 'bg-blue-100' : 'bg-amber-100'
                      )}>
                        {isLoadingSyncStatus ? (
                          <Loader2 className="h-4 w-4 text-slate-600 animate-spin" />
                        ) : syncStatus.hasData ? (
                          <Database className="h-4 w-4 text-blue-600" />
                        ) : (
                          <CloudOff className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">Data Synced</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Apa itu "Data Synced"?</p>
                                <p>Status ini menunjukkan apakah data PEB/PIB sudah berhasil ditarik dari CEISA dan disimpan ke database lokal.</p>
                                <p className="text-muted-foreground">Gunakan tombol "Sync CEISA" untuk menarik data.</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-[10px] px-1.5 py-0 mt-1',
                            isLoadingSyncStatus
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : syncStatus.hasData 
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-amber-100 text-amber-700 border-amber-300'
                          )}
                        >
                          {isLoadingSyncStatus 
                            ? 'Memuat...' 
                            : syncStatus.hasData 
                              ? 'Data Tersedia' 
                              : 'Belum Sync'}
                        </Badge>
                        {!isLoadingSyncStatus && syncStatus.hasData && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            PEB: {syncStatus.pebCount} • PIB: {syncStatus.pibCount}
                          </p>
                        )}
                        {!isLoadingSyncStatus && !syncStatus.hasData && (
                          <p className="text-[10px] text-amber-600 mt-1.5">
                            Belum ada data hasil sinkronisasi CEISA
                          </p>
                        )}
                        {syncStatus.lastSyncTime && (
                          <p className="text-[10px] text-muted-foreground">
                            Sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 3. No Data Returned - Explanation for empty data */}
                  <div className={cn(
                    'p-4 relative bg-slate-50/50'
                  )}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 md:w-0 md:h-1 md:left-0 md:right-0 md:top-0 md:bottom-auto bg-slate-300" />
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full flex-shrink-0 bg-slate-100">
                        <Info className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">Status Penjelasan</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Tentang Status</p>
                                <p>Perbedaan status:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                                  <li><strong>Connected:</strong> API CEISA dapat diakses</li>
                                  <li><strong>Data Synced:</strong> Data berhasil ditarik</li>
                                  <li><strong>No Data:</strong> API aktif tapi data kosong (bukan error)</li>
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        {/* Dynamic status explanation */}
                        <div className="mt-2 space-y-1.5">
                          {/* Connection status */}
                          <div className="flex items-center gap-2 text-[10px]">
                            {isConnected ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                            )}
                            <span className={isConnected ? 'text-emerald-700' : 'text-red-700'}>
                              {isConnected ? 'API CEISA aktif' : 'API CEISA tidak dapat diakses'}
                            </span>
                          </div>
                          
                          {/* Sync status */}
                          <div className="flex items-center gap-2 text-[10px]">
                            {syncStatus.hasData ? (
                              <CheckCircle2 className="h-3 w-3 text-blue-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-amber-600 flex-shrink-0" />
                            )}
                            <span className={syncStatus.hasData ? 'text-blue-700' : 'text-amber-700'}>
                              {syncStatus.hasData 
                                ? `${syncStatus.pebCount + syncStatus.pibCount} dokumen tersimpan` 
                                : 'Belum ada data sync'}
                            </span>
                          </div>
                          
                          {/* Empty data note - only show if connected but no data */}
                          {isConnected && !syncStatus.hasData && (
                            <div className="flex items-start gap-2 text-[10px] mt-1 p-1.5 bg-amber-50 rounded border border-amber-200">
                              <Info className="h-3 w-3 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span className="text-amber-700">
                                Data kosong bukan berarti error. Sync untuk menarik data dari CEISA.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          </TooltipProvider>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {permissions.canAccessPEB && (
            <KPICard
              title="PEB Submitted Today"
              value={isLoadingKpi ? '...' : kpiData?.pebToday || 0}
              icon={FileOutput}
              trend={kpiData?.pebToday ? { value: kpiData.pebToday, isPositive: true } : undefined}
              status="info"
            />
          )}
          {permissions.canAccessPIB && (
            <KPICard
              title="PIB Pending Review"
              value={isLoadingKpi ? '...' : kpiData?.pibPending || 0}
              icon={FileInput}
              subtitle={kpiData?.pibPending ? "Requires attention" : undefined}
              status="warning"
            />
          )}
          <KPICard
            title="Rejected Documents"
            value={isLoadingKpi ? '...' : kpiData?.rejected || 0}
            icon={XCircle}
            status="error"
            subtitle={kpiData?.rejected ? "from ceisa_monitoring" : undefined}
          />
          {permissions.canViewTax && (
            <KPICard
              title="CEISA Queue Pending"
              value={isLoadingKpi ? '...' : kpiData?.ceisaQueueStatus?.pending || 0}
              icon={Clock}
              subtitle="Waiting for response"
              status="info"
            />
          )}
        </div>

        {/* Status Counts from ceisa_monitoring */}
        {kpiData?.statusCounts && (
          <Card className="border-[#E2E8F0]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#1E3A5F]">CEISA Monitoring Status</h3>
                <Badge variant="outline" className="text-xs">
                  Total: {kpiData.statusCounts.total}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{kpiData.statusCounts.submitted}</div>
                  <div className="text-xs text-blue-600">Submitted</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-2xl font-bold text-amber-700">{kpiData.statusCounts.pending}</div>
                  <div className="text-xs text-amber-600">Pending</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-700">{kpiData.statusCounts.approved}</div>
                  <div className="text-xs text-emerald-600">Approved</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-700">{kpiData.statusCounts.rejected}</div>
                  <div className="text-xs text-red-600">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <RecentActivityTable />
      </div>
    </AppLayout>
  );
};

export default Dashboard;

