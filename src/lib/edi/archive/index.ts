/**
 * EDI Archive Module
 * Handles archiving of transmitted and received EDI messages
 */

import { 
  EDIArchiveEntry, 
  EDIDocumentType, 
  EDIDirection 
} from '../types';
import { generateXMLHash, generateTimestamp, generateMessageId } from '../xml-hash';

// In-memory archive for demo (would be file system/database in production)
const archive: EDIArchiveEntry[] = [];

/**
 * Archive a message
 */
export async function archiveMessage(
  messageId: string,
  documentType: EDIDocumentType,
  documentNumber: string,
  direction: EDIDirection,
  xmlContent: string
): Promise<EDIArchiveEntry> {
  const hash = await generateXMLHash(xmlContent);
  const timestamp = generateTimestamp();
  const archivePath = generateArchivePath(documentType, direction, documentNumber, timestamp);
  
  const entry: EDIArchiveEntry = {
    id: generateMessageId(),
    message_id: messageId,
    document_type: documentType,
    document_number: documentNumber,
    direction,
    xml_content: xmlContent,
    xml_hash: hash,
    archived_at: timestamp,
    archive_path: archivePath,
  };
  
  archive.push(entry);
  
  return entry;
}

/**
 * Generate archive path based on document type and date
 */
function generateArchivePath(
  documentType: EDIDocumentType,
  direction: EDIDirection,
  documentNumber: string,
  timestamp: string
): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const cleanDocNumber = documentNumber.replace(/[^a-zA-Z0-9-]/g, '_');
  
  return `/edi/archive/${direction.toLowerCase()}/${documentType.toLowerCase()}/${year}/${month}/${day}/${cleanDocNumber}.xml`;
}

/**
 * Get archive entry by ID
 */
export function getArchiveEntryById(id: string): EDIArchiveEntry | undefined {
  return archive.find(entry => entry.id === id);
}

/**
 * Get archive entries by message ID
 */
export function getArchiveByMessageId(messageId: string): EDIArchiveEntry[] {
  return archive.filter(entry => entry.message_id === messageId);
}

/**
 * Get archive entries by document number
 */
export function getArchiveByDocumentNumber(documentNumber: string): EDIArchiveEntry[] {
  return archive.filter(entry => entry.document_number === documentNumber);
}

/**
 * Get archive entries by document type
 */
export function getArchiveByDocumentType(documentType: EDIDocumentType): EDIArchiveEntry[] {
  return archive.filter(entry => entry.document_type === documentType);
}

/**
 * Get archive entries by direction
 */
export function getArchiveByDirection(direction: EDIDirection): EDIArchiveEntry[] {
  return archive.filter(entry => entry.direction === direction);
}

/**
 * Get archive entries by date range
 */
export function getArchiveByDateRange(startDate: Date, endDate: Date): EDIArchiveEntry[] {
  return archive.filter(entry => {
    const archivedDate = new Date(entry.archived_at);
    return archivedDate >= startDate && archivedDate <= endDate;
  });
}

/**
 * Search archive by various criteria
 */
export function searchArchive(criteria: {
  documentType?: EDIDocumentType;
  direction?: EDIDirection;
  documentNumber?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): EDIArchiveEntry[] {
  let results = [...archive];
  
  if (criteria.documentType) {
    results = results.filter(e => e.document_type === criteria.documentType);
  }
  
  if (criteria.direction) {
    results = results.filter(e => e.direction === criteria.direction);
  }
  
  if (criteria.documentNumber) {
    results = results.filter(e => 
      e.document_number.toLowerCase().includes(criteria.documentNumber!.toLowerCase())
    );
  }
  
  if (criteria.startDate) {
    results = results.filter(e => new Date(e.archived_at) >= criteria.startDate!);
  }
  
  if (criteria.endDate) {
    results = results.filter(e => new Date(e.archived_at) <= criteria.endDate!);
  }
  
  // Sort by archived date descending
  results.sort((a, b) => 
    new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime()
  );
  
  if (criteria.limit) {
    results = results.slice(0, criteria.limit);
  }
  
  return results;
}

/**
 * Verify archive entry integrity
 */
export async function verifyArchiveIntegrity(entryId: string): Promise<{
  isValid: boolean;
  originalHash: string;
  computedHash: string;
}> {
  const entry = getArchiveEntryById(entryId);
  if (!entry) {
    throw new Error(`Archive entry not found: ${entryId}`);
  }
  
  const computedHash = await generateXMLHash(entry.xml_content);
  
  return {
    isValid: computedHash === entry.xml_hash,
    originalHash: entry.xml_hash,
    computedHash,
  };
}

/**
 * Get archive statistics
 */
export function getArchiveStats(): {
  total: number;
  outgoing: number;
  incoming: number;
  peb: number;
  pib: number;
  byMonth: Record<string, number>;
} {
  const stats = {
    total: archive.length,
    outgoing: 0,
    incoming: 0,
    peb: 0,
    pib: 0,
    byMonth: {} as Record<string, number>,
  };
  
  for (const entry of archive) {
    if (entry.direction === 'OUTGOING') stats.outgoing++;
    else stats.incoming++;
    
    if (entry.document_type === 'PEB') stats.peb++;
    else stats.pib++;
    
    const monthKey = entry.archived_at.substring(0, 7); // YYYY-MM
    stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
  }
  
  return stats;
}

/**
 * Export archive entry to string (for download)
 */
export function exportArchiveEntry(entryId: string): {
  filename: string;
  content: string;
  mimeType: string;
} | null {
  const entry = getArchiveEntryById(entryId);
  if (!entry) return null;
  
  const filename = `${entry.document_type}_${entry.document_number}_${entry.direction}.xml`;
  
  return {
    filename,
    content: entry.xml_content,
    mimeType: 'application/xml',
  };
}

/**
 * Bulk archive multiple messages
 */
export async function bulkArchive(
  messages: Array<{
    messageId: string;
    documentType: EDIDocumentType;
    documentNumber: string;
    direction: EDIDirection;
    xmlContent: string;
  }>
): Promise<EDIArchiveEntry[]> {
  const entries: EDIArchiveEntry[] = [];
  
  for (const msg of messages) {
    const entry = await archiveMessage(
      msg.messageId,
      msg.documentType,
      msg.documentNumber,
      msg.direction,
      msg.xmlContent
    );
    entries.push(entry);
  }
  
  return entries;
}

/**
 * Get all archive entries
 */
export function getAllArchiveEntries(): EDIArchiveEntry[] {
  return [...archive];
}

/**
 * Get recent archive entries
 */
export function getRecentArchiveEntries(limit: number = 50): EDIArchiveEntry[] {
  return [...archive]
    .sort((a, b) => new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime())
    .slice(0, limit);
}

/**
 * Delete old archive entries (for maintenance)
 */
export function deleteOldArchiveEntries(olderThanDays: number): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const cutoffTime = cutoffDate.getTime();
  
  const initialLength = archive.length;
  
  for (let i = archive.length - 1; i >= 0; i--) {
    if (new Date(archive[i].archived_at).getTime() < cutoffTime) {
      archive.splice(i, 1);
    }
  }
  
  return initialLength - archive.length;
}
