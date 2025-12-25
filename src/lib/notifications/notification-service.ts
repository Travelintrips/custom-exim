/**
 * Notification Service
 * Handle notifications from ceisa_monitoring status changes
 */

import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
  nomor_aju?: string;
  old_status?: string;
  new_status?: string;
  is_read: boolean;
  read_at?: string;
  metadata?: any;
  created_at: string;
}

export interface StatusCounts {
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  total: number;
}

// ========== FETCH NOTIFICATIONS ==========

export async function fetchNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<Notification[]> {
  const { limit = 50, unreadOnly = false } = options || {};

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function fetchUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

// ========== MARK AS READ ==========

export async function markAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

export async function markAllAsRead(): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

// ========== CREATE NOTIFICATION ==========

export async function createNotification(notification: {
  type: string;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
  nomor_aju?: string;
  old_status?: string;
  new_status?: string;
  metadata?: any;
}): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data;
}

// ========== STATUS COUNTS FROM ceisa_monitoring ==========

export async function fetchStatusCounts(): Promise<StatusCounts> {
  const counts: StatusCounts = {
    submitted: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    total: 0,
  };

  try {
    // Fetch counts for each status from ceisa_monitoring
    const { data: submittedData } = await supabase
      .from('ceisa_monitoring')
      .select('*', { count: 'exact', head: true })
      .eq('status_terakhir', 'SUBMITTED');

    const { data: approvedData, count: approvedCount } = await supabase
      .from('ceisa_monitoring')
      .select('*', { count: 'exact', head: true })
      .eq('status_terakhir', 'APPROVED');

    const { data: rejectedData, count: rejectedCount } = await supabase
      .from('ceisa_monitoring')
      .select('*', { count: 'exact', head: true })
      .eq('status_terakhir', 'REJECTED');

    const { data: pendingData, count: pendingCount } = await supabase
      .from('ceisa_monitoring')
      .select('*', { count: 'exact', head: true })
      .eq('status_terakhir', 'PENDING');

    const { count: totalCount } = await supabase
      .from('ceisa_monitoring')
      .select('*', { count: 'exact', head: true });

    counts.submitted = (submittedData as any)?.count || 0;
    counts.approved = approvedCount || 0;
    counts.rejected = rejectedCount || 0;
    counts.pending = pendingCount || 0;
    counts.total = totalCount || 0;
  } catch (error) {
    console.error('Error fetching status counts:', error);
  }

  return counts;
}

// ========== DASHBOARD KPI DATA ==========

export interface DashboardKPIData {
  pebToday: number;
  pibPending: number;
  rejected: number;
  ceisaQueueStatus: {
    connected: boolean;
    pending: number;
    lastSync?: string;
  };
  statusCounts: StatusCounts;
}

export async function fetchDashboardKPIData(): Promise<DashboardKPIData> {
  const today = new Date().toISOString().split('T')[0];
  
  // PEB submitted today
  const { count: pebToday } = await supabase
    .from('peb_documents')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today);

  // PIB pending review
  const { count: pibPending } = await supabase
    .from('pib_documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'SUBMITTED');

  // Rejected from ceisa_monitoring
  const { count: rejected } = await supabase
    .from('ceisa_monitoring')
    .select('*', { count: 'exact', head: true })
    .eq('status_terakhir', 'REJECTED');

  // CEISA queue pending
  const { count: ceisaPending } = await supabase
    .from('ceisa_monitoring')
    .select('*', { count: 'exact', head: true })
    .eq('status_terakhir', 'PENDING');

  // Get status counts
  const statusCounts = await fetchStatusCounts();

  return {
    pebToday: pebToday || 0,
    pibPending: pibPending || 0,
    rejected: rejected || 0,
    ceisaQueueStatus: {
      connected: true, // Assume connected if we can query
      pending: ceisaPending || 0,
      lastSync: new Date().toISOString(),
    },
    statusCounts,
  };
}

// ========== SUBSCRIBE TO REALTIME ==========

export function subscribeToNotifications(
  callback: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
