/**
 * KPI Calculator
 * Calculate dashboard KPIs and metrics
 */

import { KPISnapshot } from '@/types/audit';

// Mock data for demo
const mockKPIData: KPISnapshot = {
  id: 'kpi-today',
  snapshot_date: new Date().toISOString().substring(0, 10),
  total_peb: 245,
  total_pib: 189,
  peb_submitted_today: 12,
  pib_submitted_today: 8,
  pending_approvals: 15,
  rejected_documents: 3,
  total_fob_value: 5420000,
  total_cif_value: 3890000,
  total_tax_collected: 428000000,
  ceisa_success_rate: 94.5,
  ceisa_queue_size: 7,
  green_lane_count: 142,
  yellow_lane_count: 38,
  red_lane_count: 9,
  avg_processing_time_hours: 4.2,
  metrics: null,
  created_at: new Date().toISOString(),
};

/**
 * Get today's KPI snapshot
 */
export function getTodayKPIs(): KPISnapshot {
  return mockKPIData;
}

/**
 * Calculate KPI trend
 */
export function calculateKPITrend(current: number, previous: number): {
  value: number;
  percentage: number;
  isPositive: boolean;
} {
  const diff = current - previous;
  const percentage = previous > 0 ? (diff / previous) * 100 : 0;
  
  return {
    value: diff,
    percentage: Math.abs(percentage),
    isPositive: diff >= 0,
  };
}

/**
 * Get KPI history (last 30 days)
 */
export function getKPIHistory(days: number = 30): KPISnapshot[] {
  const history: KPISnapshot[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate mock data with some variation
    const baseValue = 200 + Math.floor(Math.random() * 50);
    
    history.push({
      id: `kpi-${date.toISOString().substring(0, 10)}`,
      snapshot_date: date.toISOString().substring(0, 10),
      total_peb: baseValue,
      total_pib: baseValue - 50,
      peb_submitted_today: 10 + Math.floor(Math.random() * 10),
      pib_submitted_today: 5 + Math.floor(Math.random() * 10),
      pending_approvals: Math.floor(Math.random() * 20),
      rejected_documents: Math.floor(Math.random() * 5),
      total_fob_value: 5000000 + Math.random() * 1000000,
      total_cif_value: 3500000 + Math.random() * 1000000,
      total_tax_collected: 400000000 + Math.random() * 100000000,
      ceisa_success_rate: 90 + Math.random() * 10,
      ceisa_queue_size: Math.floor(Math.random() * 15),
      green_lane_count: 120 + Math.floor(Math.random() * 40),
      yellow_lane_count: 30 + Math.floor(Math.random() * 20),
      red_lane_count: Math.floor(Math.random() * 15),
      avg_processing_time_hours: 3 + Math.random() * 3,
      metrics: null,
      created_at: date.toISOString(),
    });
  }
  
  return history;
}

/**
 * Get dashboard KPI cards data
 */
export function getDashboardKPIs() {
  const today = getTodayKPIs();
  
  return {
    pebToday: {
      value: today.peb_submitted_today,
      label: 'PEB Submitted Today',
      trend: calculateKPITrend(today.peb_submitted_today, 10),
    },
    pibPending: {
      value: today.pending_approvals,
      label: 'PIB Pending Review',
      trend: calculateKPITrend(today.pending_approvals, 18),
    },
    rejected: {
      value: today.rejected_documents,
      label: 'Rejected Documents',
      trend: calculateKPITrend(today.rejected_documents, 5),
    },
    ceisaQueue: {
      value: today.ceisa_queue_size,
      label: 'CEISA Queue',
      successRate: today.ceisa_success_rate,
    },
  };
}

/**
 * Get lane distribution data
 */
export function getLaneDistribution() {
  const today = getTodayKPIs();
  const total = today.green_lane_count + today.yellow_lane_count + today.red_lane_count;
  
  return {
    green: {
      count: today.green_lane_count,
      percentage: total > 0 ? (today.green_lane_count / total) * 100 : 0,
    },
    yellow: {
      count: today.yellow_lane_count,
      percentage: total > 0 ? (today.yellow_lane_count / total) * 100 : 0,
    },
    red: {
      count: today.red_lane_count,
      percentage: total > 0 ? (today.red_lane_count / total) * 100 : 0,
    },
  };
}

/**
 * Get tax collection summary
 */
export function getTaxCollectionSummary() {
  const history = getKPIHistory(7);
  
  const totalThisWeek = history.reduce((sum, kpi) => sum + kpi.total_tax_collected, 0);
  const avgPerDay = totalThisWeek / 7;
  
  return {
    totalThisWeek,
    avgPerDay,
    todayCollection: history[0].total_tax_collected,
  };
}
