/**
 * EDI Engine - Main Export Module
 * CEISA Connector for PEB and PIB Document Exchange
 */

// Types
export * from './types';

// CEISA Connection
export * from './ceisa-connection';

// CEISA Data Fetch
export * from './peb-fetch';
export * from './pib-fetch';

// CEISA Sync
export * from './ceisa-sync';

// XML Utilities
export * from './xml-hash';
export * from './xml-mapper';

// Response Handling
export * from './response-handler';

// Error Parsing
export * from './error-parser';

// Queue Management
export * from './outgoing';
export * from './incoming';
export * from './archive';

// Re-export main functions for convenience
import { PEBDocument } from '@/types/peb';
import { PIBDocument } from '@/types/pib';
import { 
  preparePEBForTransmission, 
  preparePIBForTransmission, 
  sendToCEISA, 
  processQueue,
  getQueueStats,
  OutgoingQueueItem
} from './outgoing';
import { 
  processIncomingResponse, 
  simulateIncomingResponse,
  getIncomingStats,
  IncomingMessage 
} from './incoming';
import { 
  archiveMessage, 
  getArchiveStats,
  EDIArchiveEntry 
} from './archive';
import { EDIDocumentType, EDITransmissionResult, CEISAResponse } from './types';

/**
 * EDI Connector - Main interface for CEISA communication
 */
export class EDIConnector {
  private static instance: EDIConnector;
  
  private constructor() {}
  
  public static getInstance(): EDIConnector {
    if (!EDIConnector.instance) {
      EDIConnector.instance = new EDIConnector();
    }
    return EDIConnector.instance;
  }
  
  /**
   * Submit PEB document to CEISA
   */
  async submitPEB(peb: PEBDocument): Promise<EDITransmissionResult> {
    // Prepare for transmission
    const queueItem = await preparePEBForTransmission(peb);
    
    // Archive outgoing message
    await archiveMessage(
      queueItem.id,
      'PEB',
      queueItem.documentNumber,
      'OUTGOING',
      queueItem.xmlContent
    );
    
    // Send to CEISA
    return await sendToCEISA(queueItem);
  }
  
  /**
   * Submit PIB document to CEISA
   */
  async submitPIB(pib: PIBDocument): Promise<EDITransmissionResult> {
    // Prepare for transmission
    const queueItem = await preparePIBForTransmission(pib);
    
    // Archive outgoing message
    await archiveMessage(
      queueItem.id,
      'PIB',
      queueItem.documentNumber,
      'OUTGOING',
      queueItem.xmlContent
    );
    
    // Send to CEISA
    return await sendToCEISA(queueItem);
  }
  
  /**
   * Process incoming CEISA response
   */
  async handleResponse(
    documentType: EDIDocumentType,
    documentId: string,
    documentNumber: string,
    responseXML: string
  ): Promise<IncomingMessage> {
    // Process the response
    const message = await processIncomingResponse(
      documentType,
      documentId,
      documentNumber,
      responseXML
    );
    
    // Archive incoming message
    await archiveMessage(
      message.id,
      documentType,
      documentNumber,
      'INCOMING',
      responseXML
    );
    
    return message;
  }
  
  /**
   * Process all pending items in queue
   */
  async processQueue(): Promise<EDITransmissionResult[]> {
    return await processQueue();
  }
  
  /**
   * Get overall EDI statistics
   */
  getStatistics(): {
    queue: ReturnType<typeof getQueueStats>;
    incoming: ReturnType<typeof getIncomingStats>;
    archive: ReturnType<typeof getArchiveStats>;
  } {
    return {
      queue: getQueueStats(),
      incoming: getIncomingStats(),
      archive: getArchiveStats(),
    };
  }
  
  /**
   * Simulate CEISA response (for testing)
   */
  async simulateResponse(
    documentType: EDIDocumentType,
    documentId: string,
    documentNumber: string,
    success: boolean,
    options?: {
      lane?: 'GREEN' | 'YELLOW' | 'RED';
    }
  ): Promise<IncomingMessage> {
    return await simulateIncomingResponse(
      documentType,
      documentId,
      documentNumber,
      success,
      options
    );
  }
}

// Export singleton instance
export const ediConnector = EDIConnector.getInstance();
