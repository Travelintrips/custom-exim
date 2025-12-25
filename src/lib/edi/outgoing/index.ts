/**
 * EDI Outgoing Module
 * Handles preparation and transmission of documents to CEISA
 */

import { PEBDocument } from '@/types/peb';
import { PIBDocument } from '@/types/pib';
import { 
  EDIMessage, 
  EDIDocumentType, 
  EDIStatus, 
  EDITransmissionResult,
  EDIFieldError 
} from '../types';
import { generateSignedPEBXML, generateSignedPIBXML } from '../xml-mapper';
import { generateMessageId, generateTimestamp } from '../xml-hash';
import { parseCEISAResponse, determineStatusFromResponse, createMockCEISAResponse } from '../response-handler';

export interface OutgoingQueueItem {
  id: string;
  documentType: EDIDocumentType;
  documentId: string;
  documentNumber: string;
  xmlContent: string;
  xmlHash: string;
  status: EDIStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  errors: EDIFieldError[];
}

// In-memory queue for demo (would be database in production)
const outgoingQueue: OutgoingQueueItem[] = [];

/**
 * Prepare PEB document for CEISA transmission
 */
export async function preparePEBForTransmission(peb: PEBDocument): Promise<OutgoingQueueItem> {
  const { xml, hash } = await generateSignedPEBXML(peb);
  
  const queueItem: OutgoingQueueItem = {
    id: generateMessageId(),
    documentType: 'PEB',
    documentId: peb.id,
    documentNumber: peb.document_number || `PEB-DRAFT-${Date.now()}`,
    xmlContent: xml,
    xmlHash: hash,
    status: 'PENDING',
    retryCount: 0,
    maxRetries: 3,
    createdAt: generateTimestamp(),
    lastAttemptAt: null,
    nextRetryAt: null,
    errors: [],
  };
  
  outgoingQueue.push(queueItem);
  return queueItem;
}

/**
 * Prepare PIB document for CEISA transmission
 */
export async function preparePIBForTransmission(pib: PIBDocument): Promise<OutgoingQueueItem> {
  const { xml, hash } = await generateSignedPIBXML(pib);
  
  const queueItem: OutgoingQueueItem = {
    id: generateMessageId(),
    documentType: 'PIB',
    documentId: pib.id,
    documentNumber: pib.document_number || `PIB-DRAFT-${Date.now()}`,
    xmlContent: xml,
    xmlHash: hash,
    status: 'PENDING',
    retryCount: 0,
    maxRetries: 3,
    createdAt: generateTimestamp(),
    lastAttemptAt: null,
    nextRetryAt: null,
    errors: [],
  };
  
  outgoingQueue.push(queueItem);
  return queueItem;
}

/**
 * Send document to CEISA (simulated)
 */
export async function sendToCEISA(queueItem: OutgoingQueueItem): Promise<EDITransmissionResult> {
  queueItem.lastAttemptAt = generateTimestamp();
  queueItem.retryCount++;
  
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;
    
    // Create mock response
    const mockResponse = createMockCEISAResponse(
      queueItem.documentType,
      isSuccess,
      isSuccess ? { lane: 'GREEN' } : {
        errors: [{
          code: 'E003',
          field: 'hs_code',
          message: 'HS Code validation failed',
        }]
      }
    );
    
    const parsedResponse = parseCEISAResponse(mockResponse);
    queueItem.status = determineStatusFromResponse(parsedResponse);
    queueItem.errors = parsedResponse.errors;
    
    return {
      success: parsedResponse.success,
      message_id: queueItem.id,
      ceisa_reference: parsedResponse.reference_number,
      status: queueItem.status,
      errors: parsedResponse.errors,
      timestamp: generateTimestamp(),
    };
    
  } catch (error) {
    queueItem.status = 'ERROR';
    queueItem.errors = [{
      code: 'NETWORK_ERROR',
      field: 'connection',
      message: error instanceof Error ? error.message : 'Connection failed',
    }];
    
    // Schedule retry if not exceeded
    if (queueItem.retryCount < queueItem.maxRetries) {
      const retryDelay = Math.pow(2, queueItem.retryCount) * 60000; // Exponential backoff
      queueItem.nextRetryAt = new Date(Date.now() + retryDelay).toISOString();
    }
    
    return {
      success: false,
      message_id: queueItem.id,
      ceisa_reference: null,
      status: 'ERROR',
      errors: queueItem.errors,
      timestamp: generateTimestamp(),
    };
  }
}

/**
 * Get pending items from outgoing queue
 */
export function getPendingItems(): OutgoingQueueItem[] {
  return outgoingQueue.filter(item => item.status === 'PENDING');
}

/**
 * Get items ready for retry
 */
export function getRetryItems(): OutgoingQueueItem[] {
  const now = Date.now();
  return outgoingQueue.filter(item => 
    item.status === 'ERROR' && 
    item.retryCount < item.maxRetries &&
    item.nextRetryAt &&
    new Date(item.nextRetryAt).getTime() <= now
  );
}

/**
 * Get all items from queue
 */
export function getAllQueueItems(): OutgoingQueueItem[] {
  return [...outgoingQueue];
}

/**
 * Get queue item by ID
 */
export function getQueueItemById(id: string): OutgoingQueueItem | undefined {
  return outgoingQueue.find(item => item.id === id);
}

/**
 * Get queue items by document ID
 */
export function getQueueItemsByDocumentId(documentId: string): OutgoingQueueItem[] {
  return outgoingQueue.filter(item => item.documentId === documentId);
}

/**
 * Remove item from queue
 */
export function removeFromQueue(id: string): boolean {
  const index = outgoingQueue.findIndex(item => item.id === id);
  if (index !== -1) {
    outgoingQueue.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Clear completed items from queue
 */
export function clearCompletedItems(): number {
  const completedStatuses: EDIStatus[] = ['ACCEPTED', 'REJECTED'];
  const initialLength = outgoingQueue.length;
  
  for (let i = outgoingQueue.length - 1; i >= 0; i--) {
    if (completedStatuses.includes(outgoingQueue[i].status)) {
      outgoingQueue.splice(i, 1);
    }
  }
  
  return initialLength - outgoingQueue.length;
}

/**
 * Process all pending items in queue
 */
export async function processQueue(): Promise<EDITransmissionResult[]> {
  const results: EDITransmissionResult[] = [];
  const pendingItems = getPendingItems();
  
  for (const item of pendingItems) {
    const result = await sendToCEISA(item);
    results.push(result);
  }
  
  return results;
}

/**
 * Get queue statistics
 */
export function getQueueStats(): {
  total: number;
  pending: number;
  sent: number;
  accepted: number;
  rejected: number;
  error: number;
} {
  return {
    total: outgoingQueue.length,
    pending: outgoingQueue.filter(i => i.status === 'PENDING').length,
    sent: outgoingQueue.filter(i => i.status === 'SENT').length,
    accepted: outgoingQueue.filter(i => i.status === 'ACCEPTED').length,
    rejected: outgoingQueue.filter(i => i.status === 'REJECTED').length,
    error: outgoingQueue.filter(i => i.status === 'ERROR').length,
  };
}
