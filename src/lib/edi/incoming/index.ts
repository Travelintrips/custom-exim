/**
 * EDI Incoming Module
 * Handles receiving and processing responses from CEISA
 */

import { 
  CEISAResponse, 
  EDIDocumentType, 
  EDIStatus, 
  EDIFieldError 
} from '../types';
import { 
  parseCEISAResponse, 
  determineStatusFromResponse,
  extractLaneReason,
  verifyResponseIntegrity 
} from '../response-handler';
import { parseAndGroupErrors, ParsedError, ErrorGroup } from '../error-parser';
import { generateTimestamp, generateMessageId } from '../xml-hash';

export interface IncomingMessage {
  id: string;
  documentType: EDIDocumentType;
  documentId: string;
  documentNumber: string;
  ceisaReference: string | null;
  responseXML: string;
  response: CEISAResponse;
  status: EDIStatus;
  errorGroups: ErrorGroup[];
  integrityVerified: boolean;
  receivedAt: string;
  processedAt: string | null;
}

// In-memory store for demo (would be database in production)
const incomingMessages: IncomingMessage[] = [];

/**
 * Process incoming CEISA response
 */
export async function processIncomingResponse(
  documentType: EDIDocumentType,
  documentId: string,
  documentNumber: string,
  responseXML: string
): Promise<IncomingMessage> {
  // Verify response integrity
  const integrityVerified = await verifyResponseIntegrity(responseXML);
  
  // Parse the response
  const response = parseCEISAResponse(responseXML);
  
  // Determine status
  const status = determineStatusFromResponse(response);
  
  // Parse and group errors
  const errorGroups = parseAndGroupErrors(response.errors);
  
  const incomingMessage: IncomingMessage = {
    id: generateMessageId(),
    documentType,
    documentId,
    documentNumber,
    ceisaReference: response.reference_number,
    responseXML,
    response,
    status,
    errorGroups,
    integrityVerified,
    receivedAt: generateTimestamp(),
    processedAt: null,
  };
  
  incomingMessages.push(incomingMessage);
  
  return incomingMessage;
}

/**
 * Mark message as processed
 */
export function markAsProcessed(messageId: string): boolean {
  const message = incomingMessages.find(m => m.id === messageId);
  if (message) {
    message.processedAt = generateTimestamp();
    return true;
  }
  return false;
}

/**
 * Get unprocessed incoming messages
 */
export function getUnprocessedMessages(): IncomingMessage[] {
  return incomingMessages.filter(m => !m.processedAt);
}

/**
 * Get all incoming messages
 */
export function getAllIncomingMessages(): IncomingMessage[] {
  return [...incomingMessages];
}

/**
 * Get incoming message by ID
 */
export function getIncomingMessageById(id: string): IncomingMessage | undefined {
  return incomingMessages.find(m => m.id === id);
}

/**
 * Get incoming messages by document ID
 */
export function getMessagesByDocumentId(documentId: string): IncomingMessage[] {
  return incomingMessages.filter(m => m.documentId === documentId);
}

/**
 * Get latest message for document
 */
export function getLatestMessageForDocument(documentId: string): IncomingMessage | undefined {
  const messages = getMessagesByDocumentId(documentId);
  if (messages.length === 0) return undefined;
  return messages.sort((a, b) => 
    new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  )[0];
}

/**
 * Extract registration data from successful response
 */
export function extractRegistrationData(message: IncomingMessage): {
  registrationNumber: string | null;
  registrationDate: string | null;
  npeNumber?: string | null;
  npeDate?: string | null;
  sppbNumber?: string | null;
  sppbDate?: string | null;
  lane?: 'GREEN' | 'YELLOW' | 'RED';
  laneReason?: string | null;
} {
  const { response, responseXML } = message;
  
  return {
    registrationNumber: response.registration_number,
    registrationDate: response.registration_date,
    npeNumber: response.npe_number,
    npeDate: response.npe_date,
    sppbNumber: response.sppb_number,
    sppbDate: response.sppb_date,
    lane: response.lane,
    laneReason: extractLaneReason(responseXML),
  };
}

/**
 * Check if response has critical errors
 */
export function hasCriticalErrors(message: IncomingMessage): boolean {
  return message.errorGroups.some(group => 
    group.errors.some(error => error.severity === 'error')
  );
}

/**
 * Get error count by severity
 */
export function getErrorCounts(message: IncomingMessage): {
  error: number;
  warning: number;
  info: number;
} {
  const counts = { error: 0, warning: 0, info: 0 };
  
  for (const group of message.errorGroups) {
    for (const error of group.errors) {
      counts[error.severity]++;
    }
  }
  
  return counts;
}

/**
 * Get all errors flat list
 */
export function getAllErrors(message: IncomingMessage): ParsedError[] {
  return message.errorGroups.flatMap(group => group.errors);
}

/**
 * Filter messages by status
 */
export function getMessagesByStatus(status: EDIStatus): IncomingMessage[] {
  return incomingMessages.filter(m => m.status === status);
}

/**
 * Filter messages by date range
 */
export function getMessagesByDateRange(startDate: Date, endDate: Date): IncomingMessage[] {
  return incomingMessages.filter(m => {
    const receivedDate = new Date(m.receivedAt);
    return receivedDate >= startDate && receivedDate <= endDate;
  });
}

/**
 * Get incoming message statistics
 */
export function getIncomingStats(): {
  total: number;
  unprocessed: number;
  accepted: number;
  rejected: number;
  pending: number;
  withErrors: number;
} {
  return {
    total: incomingMessages.length,
    unprocessed: incomingMessages.filter(m => !m.processedAt).length,
    accepted: incomingMessages.filter(m => m.status === 'ACCEPTED').length,
    rejected: incomingMessages.filter(m => m.status === 'REJECTED').length,
    pending: incomingMessages.filter(m => m.status === 'PENDING').length,
    withErrors: incomingMessages.filter(m => m.response.errors.length > 0).length,
  };
}

/**
 * Clear old processed messages
 */
export function clearOldMessages(olderThanDays: number): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const cutoffTime = cutoffDate.getTime();
  
  const initialLength = incomingMessages.length;
  
  for (let i = incomingMessages.length - 1; i >= 0; i--) {
    const message = incomingMessages[i];
    if (
      message.processedAt &&
      new Date(message.receivedAt).getTime() < cutoffTime
    ) {
      incomingMessages.splice(i, 1);
    }
  }
  
  return initialLength - incomingMessages.length;
}

/**
 * Simulate receiving a CEISA response (for demo/testing)
 */
export async function simulateIncomingResponse(
  documentType: EDIDocumentType,
  documentId: string,
  documentNumber: string,
  success: boolean,
  options?: {
    lane?: 'GREEN' | 'YELLOW' | 'RED';
    errors?: EDIFieldError[];
  }
): Promise<IncomingMessage> {
  // Import mock response generator
  const { createMockCEISAResponse } = await import('../response-handler');
  
  const mockResponseXML = createMockCEISAResponse(documentType, success, options);
  
  return processIncomingResponse(documentType, documentId, documentNumber, mockResponseXML);
}
