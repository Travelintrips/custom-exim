/**
 * Audit & Compliance Types
 */

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'SEND_CEISA'
  | 'RECEIVE_RESPONSE'
  | 'LOCK'
  | 'UNLOCK'
  | 'EXPORT'
  | 'PRINT'
  | 'LOGIN'
  | 'LOGOUT';

export type AuditEntityType = 'PEB' | 'PIB' | 'USER' | 'COMPANY' | 'SYSTEM' | 'SETTINGS';

export interface AuditLog {
  id: string;
  entity_type: AuditEntityType;
  entity_id: string | null;
  entity_number: string | null;
  action: AuditAction;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  
  document_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  
  notes: string | null;
  metadata: Record<string, unknown> | null;
  
  created_at: string;
}

export interface ComplianceReport {
  id: string;
  report_type: string;
  report_period_start: string | null;
  report_period_end: string | null;
  generated_by: string | null;
  generated_by_email: string | null;
  
  total_records: number;
  summary: Record<string, unknown> | null;
  report_data: Record<string, unknown> | null;
  file_path: string | null;
  file_size: number | null;
  
  created_at: string;
}

export interface KPISnapshot {
  id: string;
  snapshot_date: string;
  
  total_peb: number;
  total_pib: number;
  peb_submitted_today: number;
  pib_submitted_today: number;
  pending_approvals: number;
  rejected_documents: number;
  
  total_fob_value: number;
  total_cif_value: number;
  total_tax_collected: number;
  
  ceisa_success_rate: number;
  ceisa_queue_size: number;
  
  green_lane_count: number;
  yellow_lane_count: number;
  red_lane_count: number;
  
  avg_processing_time_hours: number;
  
  metrics: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogFilter {
  entity_type?: AuditEntityType;
  entity_id?: string;
  entity_number?: string;
  action?: AuditAction;
  actor_id?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditTrailEntry {
  timestamp: string;
  action: AuditAction;
  actor: string;
  changes: string[];
  notes: string | null;
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  SUBMIT: 'Submitted',
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  SEND_CEISA: 'Sent to CEISA',
  RECEIVE_RESPONSE: 'Response Received',
  LOCK: 'Locked',
  UNLOCK: 'Unlocked',
  EXPORT: 'Exported',
  PRINT: 'Printed',
  LOGIN: 'Logged In',
  LOGOUT: 'Logged Out',
};

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  SUBMIT: 'bg-purple-100 text-purple-700',
  APPROVE: 'bg-emerald-100 text-emerald-700',
  REJECT: 'bg-red-100 text-red-700',
  SEND_CEISA: 'bg-blue-100 text-blue-700',
  RECEIVE_RESPONSE: 'bg-purple-100 text-purple-700',
  LOCK: 'bg-orange-100 text-orange-700',
  UNLOCK: 'bg-green-100 text-green-700',
  EXPORT: 'bg-teal-100 text-teal-700',
  PRINT: 'bg-slate-100 text-slate-700',
  LOGIN: 'bg-green-100 text-green-700',
  LOGOUT: 'bg-slate-100 text-slate-700',
};
