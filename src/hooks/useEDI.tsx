/**
 * React Hook for EDI Operations
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  ediConnector, 
  EDIDocumentType, 
  EDITransmissionResult,
  EDIStatus,
  OutgoingQueueItem,
  IncomingMessage,
  EDIArchiveEntry,
  getQueueStats,
  getIncomingStats,
  getArchiveStats,
  getAllQueueItems,
  getAllIncomingMessages,
  getRecentArchiveEntries,
} from '@/lib/edi';
import { PEBDocument } from '@/types/peb';
import { PIBDocument } from '@/types/pib';

export interface EDIState {
  isLoading: boolean;
  error: string | null;
  lastResult: EDITransmissionResult | null;
  queueItems: OutgoingQueueItem[];
  incomingMessages: IncomingMessage[];
  archiveEntries: EDIArchiveEntry[];
  stats: {
    queue: ReturnType<typeof getQueueStats>;
    incoming: ReturnType<typeof getIncomingStats>;
    archive: ReturnType<typeof getArchiveStats>;
  } | null;
}

export interface UseEDIReturn extends EDIState {
  submitPEB: (peb: PEBDocument) => Promise<EDITransmissionResult>;
  submitPIB: (pib: PIBDocument) => Promise<EDITransmissionResult>;
  processQueue: () => Promise<EDITransmissionResult[]>;
  simulateResponse: (
    documentType: EDIDocumentType,
    documentId: string,
    documentNumber: string,
    success: boolean,
    lane?: 'GREEN' | 'YELLOW' | 'RED'
  ) => Promise<IncomingMessage>;
  refreshStats: () => void;
  refreshQueue: () => void;
  refreshIncoming: () => void;
  refreshArchive: () => void;
  clearError: () => void;
}

export function useEDI(): UseEDIReturn {
  const [state, setState] = useState<EDIState>({
    isLoading: false,
    error: null,
    lastResult: null,
    queueItems: [],
    incomingMessages: [],
    archiveEntries: [],
    stats: null,
  });
  
  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };
  
  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  };
  
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  const refreshStats = useCallback(() => {
    const stats = ediConnector.getStatistics();
    setState(prev => ({ ...prev, stats }));
  }, []);
  
  const refreshQueue = useCallback(() => {
    const queueItems = getAllQueueItems();
    setState(prev => ({ ...prev, queueItems }));
    refreshStats();
  }, [refreshStats]);
  
  const refreshIncoming = useCallback(() => {
    const incomingMessages = getAllIncomingMessages();
    setState(prev => ({ ...prev, incomingMessages }));
    refreshStats();
  }, [refreshStats]);
  
  const refreshArchive = useCallback(() => {
    const archiveEntries = getRecentArchiveEntries(100);
    setState(prev => ({ ...prev, archiveEntries }));
    refreshStats();
  }, [refreshStats]);
  
  const submitPEB = useCallback(async (peb: PEBDocument): Promise<EDITransmissionResult> => {
    setLoading(true);
    try {
      const result = await ediConnector.submitPEB(peb);
      setState(prev => ({ 
        ...prev, 
        lastResult: result, 
        isLoading: false,
        error: result.success ? null : 'Submission failed',
      }));
      refreshQueue();
      refreshArchive();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setError(error);
      throw err;
    }
  }, [refreshQueue, refreshArchive]);
  
  const submitPIB = useCallback(async (pib: PIBDocument): Promise<EDITransmissionResult> => {
    setLoading(true);
    try {
      const result = await ediConnector.submitPIB(pib);
      setState(prev => ({ 
        ...prev, 
        lastResult: result, 
        isLoading: false,
        error: result.success ? null : 'Submission failed',
      }));
      refreshQueue();
      refreshArchive();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setError(error);
      throw err;
    }
  }, [refreshQueue, refreshArchive]);
  
  const processQueue = useCallback(async (): Promise<EDITransmissionResult[]> => {
    setLoading(true);
    try {
      const results = await ediConnector.processQueue();
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
      }));
      refreshQueue();
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setError(error);
      throw err;
    }
  }, [refreshQueue]);
  
  const simulateResponse = useCallback(async (
    documentType: EDIDocumentType,
    documentId: string,
    documentNumber: string,
    success: boolean,
    lane?: 'GREEN' | 'YELLOW' | 'RED'
  ): Promise<IncomingMessage> => {
    setLoading(true);
    try {
      const message = await ediConnector.simulateResponse(
        documentType,
        documentId,
        documentNumber,
        success,
        lane ? { lane } : undefined
      );
      setState(prev => ({ ...prev, isLoading: false }));
      refreshIncoming();
      refreshArchive();
      return message;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setError(error);
      throw err;
    }
  }, [refreshIncoming, refreshArchive]);
  
  // Initial load
  useEffect(() => {
    refreshStats();
    refreshQueue();
    refreshIncoming();
    refreshArchive();
  }, [refreshStats, refreshQueue, refreshIncoming, refreshArchive]);
  
  return {
    ...state,
    submitPEB,
    submitPIB,
    processQueue,
    simulateResponse,
    refreshStats,
    refreshQueue,
    refreshIncoming,
    refreshArchive,
    clearError,
  };
}

/**
 * Hook for monitoring EDI queue status
 */
export function useEDIQueue(pollInterval: number = 5000) {
  const [queueItems, setQueueItems] = useState<OutgoingQueueItem[]>([]);
  const [stats, setStats] = useState(getQueueStats());
  
  useEffect(() => {
    const refresh = () => {
      setQueueItems(getAllQueueItems());
      setStats(getQueueStats());
    };
    
    refresh();
    const interval = setInterval(refresh, pollInterval);
    
    return () => clearInterval(interval);
  }, [pollInterval]);
  
  return { queueItems, stats };
}

/**
 * Hook for monitoring EDI/CEISA connection status
 * 
 * CEISA 4.0 Architecture Compliant:
 * - Uses testCeisaConnection() from ceisa-sync-service.ts via ceisa-connection.ts
 * - Connected = Auth CEISA berhasil via __test__ endpoint
 * - Disconnected = Auth gagal / Edge Function error
 * - Status DOES NOT depend on data availability
 * 
 * DILARANG:
 * - Memanggil supabase.functions.invoke langsung
 * - Memanggil endpoint /openapi/status atau /health langsung
 * - Menganggap non-2xx response sebagai CEISA down
 */
export interface CEISAConnectionState {
  isConnected: boolean;
  lastCheck: string | null;
  httpStatus: number | null;
  responseTime: number | null;
  error: string | null;
  isChecking: boolean;
}

export function useEDIConnectionStatus(pollInterval: number = 10000) {
  const [state, setState] = useState<CEISAConnectionState>({
    isConnected: false,
    lastCheck: null,
    httpStatus: null,
    responseTime: null,
    error: null,
    isChecking: true,
  });
  
  const checkConnection = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      // Import dynamically to avoid circular dependencies
      // Uses checkCEISAConnectionSmart which calls testCeisaConnection() internally
      const { checkCEISAConnectionSmart } = await import('@/lib/edi/ceisa-connection');
      const result = await checkCEISAConnectionSmart();
      
      setState({
        isConnected: result.connected,
        lastCheck: result.timestamp,
        httpStatus: result.httpStatus ?? null,
        responseTime: result.responseTime ?? null,
        // Only show error if not connected
        error: result.connected ? null : (result.error ?? null),
        isChecking: false,
      });
    } catch (err) {
      // Transform error to user-friendly message
      // Don't show raw "Edge Function returned a non-2xx status code" message
      let errorMessage = "Gagal memeriksa koneksi CEISA";
      
      if (err instanceof Error) {
        if (err.message.includes("non-2xx status code")) {
          errorMessage = "CEISA tidak dapat dijangkau";
        } else if (err.message.includes("Failed to fetch")) {
          errorMessage = "Koneksi jaringan terputus";
        } else if (err.message.includes("timeout")) {
          errorMessage = "Koneksi timeout";
        } else {
          errorMessage = err.message;
        }
      }

      setState(prev => ({
        ...prev,
        isConnected: false,
        lastCheck: new Date().toISOString(),
        httpStatus: 500, // Exception = internal error
        responseTime: null,
        error: errorMessage,
        isChecking: false,
      }));
    }
  }, []);
  
  const manualCheck = useCallback(() => {
    checkConnection();
  }, [checkConnection]);
  
  // Initial load
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Optional polling interval
  useEffect(() => {
    if (pollInterval > 0) {
      const interval = setInterval(checkConnection, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval, checkConnection]);
  
  return { 
    isConnected: state.isConnected, 
    lastCheck: state.lastCheck, 
    httpStatus: state.httpStatus,
    responseTime: state.responseTime,
    error: state.error,
    isChecking: state.isChecking,
    checkConnection: manualCheck,
  };
}
