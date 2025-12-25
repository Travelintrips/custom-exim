/**
 * Report Generator
 * Generate compliance reports and audit packs
 */

import { AuditLog, ComplianceReport, AuditEntityType } from '@/types/audit';
import { getAuditLogs } from './audit-logger';
import { PEBDocument } from '@/types/peb';
import { PIBDocument } from '@/types/pib';

export type ReportType = 
  | 'AUDIT_TRAIL'
  | 'PEB_SUMMARY'
  | 'PIB_SUMMARY'
  | 'TAX_COLLECTION'
  | 'CEISA_TRANSMISSION'
  | 'USER_ACTIVITY'
  | 'COMPLIANCE_PACK';

export interface ReportParams {
  type: ReportType;
  startDate: Date;
  endDate: Date;
  entity_type?: AuditEntityType;
  entity_id?: string;
  actor_id?: string;
}

export interface AuditPackContent {
  document: PEBDocument | PIBDocument;
  auditLogs: AuditLog[];
  metadata: {
    generatedAt: string;
    generatedBy: string;
    documentHash: string;
    totalChanges: number;
  };
}

/**
 * Generate compliance report
 */
export async function generateReport(params: ReportParams): Promise<ComplianceReport> {
  const logs = getAuditLogs({
    entity_type: params.entity_type,
    actor_id: params.actor_id,
    start_date: params.startDate,
    end_date: params.endDate,
  });
  
  const summary = generateReportSummary(params.type, logs);
  const reportData = generateReportData(params.type, logs);
  
  const report: ComplianceReport = {
    id: `report-${Date.now()}`,
    report_type: params.type,
    report_period_start: params.startDate.toISOString().substring(0, 10),
    report_period_end: params.endDate.toISOString().substring(0, 10),
    generated_by: params.actor_id || null,
    generated_by_email: null,
    total_records: logs.length,
    summary,
    report_data: reportData,
    file_path: null,
    file_size: null,
    created_at: new Date().toISOString(),
  };
  
  return report;
}

/**
 * Generate report summary
 */
function generateReportSummary(
  type: ReportType,
  logs: AuditLog[]
): Record<string, unknown> {
  const byAction: Record<string, number> = {};
  const byActor: Record<string, number> = {};
  const byEntityType: Record<string, number> = {};
  
  for (const log of logs) {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    if (log.actor_email) {
      byActor[log.actor_email] = (byActor[log.actor_email] || 0) + 1;
    }
    byEntityType[log.entity_type] = (byEntityType[log.entity_type] || 0) + 1;
  }
  
  return {
    totalLogs: logs.length,
    byAction,
    byActor,
    byEntityType,
    dateRange: {
      start: logs[logs.length - 1]?.created_at || null,
      end: logs[0]?.created_at || null,
    },
  };
}

/**
 * Generate report data
 */
function generateReportData(
  type: ReportType,
  logs: AuditLog[]
): Record<string, unknown> {
  switch (type) {
    case 'AUDIT_TRAIL':
      return { logs: logs.map(formatLogForReport) };
    
    case 'USER_ACTIVITY':
      return generateUserActivityReport(logs);
    
    case 'CEISA_TRANSMISSION':
      return generateCEISAReport(logs);
    
    default:
      return { logs };
  }
}

/**
 * Format log for report
 */
function formatLogForReport(log: AuditLog) {
  return {
    timestamp: log.created_at,
    entity: `${log.entity_type} ${log.entity_number || log.entity_id || ''}`,
    action: log.action,
    actor: log.actor_email || 'System',
    changes: log.changes ? Object.keys(log.changes).length : 0,
    notes: log.notes,
  };
}

/**
 * Generate user activity report
 */
function generateUserActivityReport(logs: AuditLog[]) {
  const userActivity: Record<string, {
    totalActions: number;
    actions: Record<string, number>;
    lastActivity: string;
  }> = {};
  
  for (const log of logs) {
    const email = log.actor_email || 'Unknown';
    if (!userActivity[email]) {
      userActivity[email] = {
        totalActions: 0,
        actions: {},
        lastActivity: log.created_at,
      };
    }
    
    userActivity[email].totalActions++;
    userActivity[email].actions[log.action] = (userActivity[email].actions[log.action] || 0) + 1;
    
    if (new Date(log.created_at) > new Date(userActivity[email].lastActivity)) {
      userActivity[email].lastActivity = log.created_at;
    }
  }
  
  return { userActivity };
}

/**
 * Generate CEISA transmission report
 */
function generateCEISAReport(logs: AuditLog[]) {
  const ceisaLogs = logs.filter(log => 
    log.action === 'SEND_CEISA' || log.action === 'RECEIVE_RESPONSE'
  );
  
  const transmissions = ceisaLogs.filter(log => log.action === 'SEND_CEISA');
  const responses = ceisaLogs.filter(log => log.action === 'RECEIVE_RESPONSE');
  
  return {
    totalTransmissions: transmissions.length,
    totalResponses: responses.length,
    transmissionsByType: {
      PEB: transmissions.filter(log => log.entity_type === 'PEB').length,
      PIB: transmissions.filter(log => log.entity_type === 'PIB').length,
    },
  };
}

/**
 * Generate audit pack for document
 */
export async function generateAuditPack(
  entity_type: AuditEntityType,
  entity_id: string,
  document: PEBDocument | PIBDocument
): Promise<AuditPackContent> {
  const logs = getAuditLogsForEntity(entity_type, entity_id);
  
  const dataString = JSON.stringify(document);
  const documentHash = await import('../edi/xml-hash').then(m => m.generateXMLHash(dataString));
  
  return {
    document,
    auditLogs: logs,
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'System',
      documentHash,
      totalChanges: logs.filter(l => l.changes).length,
    },
  };
}

/**
 * Export audit pack as JSON
 */
export function exportAuditPackJSON(pack: AuditPackContent): string {
  return JSON.stringify(pack, null, 2);
}

/**
 * Create ZIP file content for audit pack
 */
export interface AuditPackFile {
  filename: string;
  content: string;
  mimeType: string;
}

export async function createAuditPackFiles(
  entity_type: AuditEntityType,
  entity_id: string,
  document: PEBDocument | PIBDocument
): Promise<AuditPackFile[]> {
  const pack = await generateAuditPack(entity_type, entity_id, document);
  
  const files: AuditPackFile[] = [];
  
  // Main document JSON
  files.push({
    filename: `${entity_type}_${document.document_number || 'draft'}.json`,
    content: JSON.stringify(document, null, 2),
    mimeType: 'application/json',
  });
  
  // Audit logs JSON
  files.push({
    filename: `audit_logs.json`,
    content: JSON.stringify(pack.auditLogs, null, 2),
    mimeType: 'application/json',
  });
  
  // Metadata
  files.push({
    filename: `metadata.json`,
    content: JSON.stringify(pack.metadata, null, 2),
    mimeType: 'application/json',
  });
  
  // README
  files.push({
    filename: `README.txt`,
    content: generateReadme(entity_type, document, pack),
    mimeType: 'text/plain',
  });
  
  return files;
}

/**
 * Generate README for audit pack
 */
function generateReadme(
  entity_type: AuditEntityType,
  document: PEBDocument | PIBDocument,
  pack: AuditPackContent
): string {
  return `AUDIT PACK - ${entity_type}
Document Number: ${document.document_number || 'DRAFT'}
Generated: ${pack.metadata.generatedAt}
Generated By: ${pack.metadata.generatedBy}

DOCUMENT HASH: ${pack.metadata.documentHash}

This audit pack contains:
1. ${entity_type}_${document.document_number || 'draft'}.json - Complete document data
2. audit_logs.json - Immutable audit trail (${pack.auditLogs.length} entries)
3. metadata.json - Generation metadata and verification data
4. README.txt - This file

VERIFICATION:
To verify document integrity, compute SHA-256 hash of the document JSON
and compare with the hash in metadata.json.

Total Changes Recorded: ${pack.metadata.totalChanges}
`;
}
