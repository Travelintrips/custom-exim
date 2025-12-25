/**
 * Audit Logger
 * Immutable audit logging with document hashing
 */

import { AuditAction, AuditEntityType, AuditLog } from '@/types/audit';
import { generateXMLHash } from '../edi/xml-hash';

export interface CreateAuditLogParams {
  entity_type: AuditEntityType;
  entity_id?: string;
  entity_number?: string;
  action: AuditAction;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// In-memory audit logs for demo (would be database in production)
const auditLogs: AuditLog[] = [];

/**
 * Create immutable audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<AuditLog> {
  const changes = computeChanges(params.before_data, params.after_data);
  
  // Generate document hash if after_data exists
  let documentHash: string | null = null;
  if (params.after_data) {
    const dataString = JSON.stringify(params.after_data);
    documentHash = await generateXMLHash(dataString);
  }
  
  const log: AuditLog = {
    id: generateId(),
    entity_type: params.entity_type,
    entity_id: params.entity_id || null,
    entity_number: params.entity_number || null,
    action: params.action,
    actor_id: params.actor_id || null,
    actor_email: params.actor_email || null,
    actor_role: params.actor_role || null,
    before_data: params.before_data || null,
    after_data: params.after_data || null,
    changes,
    document_hash: documentHash,
    ip_address: getBrowserIP(),
    user_agent: getUserAgent(),
    session_id: getSessionId(),
    notes: params.notes || null,
    metadata: params.metadata || null,
    created_at: new Date().toISOString(),
  };
  
  auditLogs.push(log);
  return log;
}

/**
 * Get audit logs for an entity
 */
export function getAuditLogsForEntity(
  entity_type: AuditEntityType,
  entity_id: string
): AuditLog[] {
  return auditLogs
    .filter(log => log.entity_type === entity_type && log.entity_id === entity_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get audit logs for entity by number
 */
export function getAuditLogsByEntityNumber(
  entity_type: AuditEntityType,
  entity_number: string
): AuditLog[] {
  return auditLogs
    .filter(log => log.entity_type === entity_type && log.entity_number === entity_number)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get all audit logs with filters
 */
export function getAuditLogs(filters?: {
  entity_type?: AuditEntityType;
  action?: AuditAction;
  actor_id?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}): AuditLog[] {
  let filtered = [...auditLogs];
  
  if (filters?.entity_type) {
    filtered = filtered.filter(log => log.entity_type === filters.entity_type);
  }
  
  if (filters?.action) {
    filtered = filtered.filter(log => log.action === filters.action);
  }
  
  if (filters?.actor_id) {
    filtered = filtered.filter(log => log.actor_id === filters.actor_id);
  }
  
  if (filters?.start_date) {
    filtered = filtered.filter(log => 
      new Date(log.created_at) >= filters.start_date!
    );
  }
  
  if (filters?.end_date) {
    filtered = filtered.filter(log => 
      new Date(log.created_at) <= filters.end_date!
    );
  }
  
  // Sort by date descending
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  // Apply pagination
  if (filters?.offset !== undefined && filters?.limit !== undefined) {
    filtered = filtered.slice(filters.offset, filters.offset + filters.limit);
  } else if (filters?.limit !== undefined) {
    filtered = filtered.slice(0, filters.limit);
  }
  
  return filtered;
}

/**
 * Verify document hash
 */
export async function verifyDocumentHash(
  entity_type: AuditEntityType,
  entity_id: string,
  currentData: Record<string, unknown>
): Promise<{ isValid: boolean; latestHash: string | null; computedHash: string }> {
  const logs = getAuditLogsForEntity(entity_type, entity_id);
  const latestLog = logs[0];
  
  const dataString = JSON.stringify(currentData);
  const computedHash = await generateXMLHash(dataString);
  
  return {
    isValid: latestLog?.document_hash === computedHash,
    latestHash: latestLog?.document_hash || null,
    computedHash,
  };
}

/**
 * Get audit trail for document (simplified format)
 */
export function getAuditTrail(
  entity_type: AuditEntityType,
  entity_id: string
): Array<{
  timestamp: string;
  action: AuditAction;
  actor: string;
  changes: string[];
  notes: string | null;
}> {
  const logs = getAuditLogsForEntity(entity_type, entity_id);
  
  return logs.map(log => ({
    timestamp: log.created_at,
    action: log.action,
    actor: log.actor_email || log.actor_id || 'System',
    changes: formatChanges(log.changes),
    notes: log.notes,
  }));
}

/**
 * Compute changes between before and after data
 */
function computeChanges(
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> | null {
  if (!before || !after) return null;
  
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  
  // Check all keys in after
  for (const key in after) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = {
        old: before[key],
        new: after[key],
      };
    }
  }
  
  // Check for removed keys
  for (const key in before) {
    if (!(key in after)) {
      changes[key] = {
        old: before[key],
        new: undefined,
      };
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Format changes for display
 */
function formatChanges(changes: Record<string, { old: unknown; new: unknown }> | null): string[] {
  if (!changes) return [];
  
  return Object.entries(changes).map(([key, value]) => {
    const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${fieldName}: ${formatValue(value.old)} → ${formatValue(value.new)}`;
  });
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Get browser IP (client-side limitation)
 */
function getBrowserIP(): string | null {
  // In production, this would be set by backend
  return null;
}

/**
 * Get user agent
 */
function getUserAgent(): string | null {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return null;
}

/**
 * Get or create session ID
 */
function getSessionId(): string | null {
  if (typeof sessionStorage !== 'undefined') {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }
  return null;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

/**
 * Get audit statistics
 */
export function getAuditStats(): {
  total: number;
  byEntityType: Record<AuditEntityType, number>;
  byAction: Record<AuditAction, number>;
  todayCount: number;
  weekCount: number;
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const byEntityType: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  let todayCount = 0;
  let weekCount = 0;
  
  for (const log of auditLogs) {
    byEntityType[log.entity_type] = (byEntityType[log.entity_type] || 0) + 1;
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    
    const logDate = new Date(log.created_at);
    if (logDate >= todayStart) todayCount++;
    if (logDate >= weekStart) weekCount++;
  }
  
  return {
    total: auditLogs.length,
    byEntityType: byEntityType as Record<AuditEntityType, number>,
    byAction: byAction as Record<AuditAction, number>,
    todayCount,
    weekCount,
  };
}

/**
 * Export audit logs to JSON
 */
export function exportAuditLogs(filters?: Parameters<typeof getAuditLogs>[0]): string {
  const logs = getAuditLogs(filters);
  return JSON.stringify(logs, null, 2);
}
