/**
 * CEISA Connection Validation Service
 * ----------------------------------
 * Frontend NEVER talks directly to CEISA.
 * Connection status is determined by Edge Function H2H login success.
 */

import { supabase } from "@/lib/supabase";

/* =======================
 * TYPES
 * ======================= */

export interface CEISAConnectionStatus {
  connected: boolean;
  timestamp: string;
  responseTime?: number;
  error?: string;
}

/* =======================
 * REAL CEISA CHECK (H2H)
 * ======================= */

export async function checkCEISAConnection(): Promise<CEISAConnectionStatus> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();

  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-ceisa-proxy",
      {
        body: { endpoint: "/health" },
      },
    );

    const responseTime = Math.round(performance.now() - startTime);

    if (error || !data?.success) {
      return {
        connected: false,
        timestamp,
        responseTime,
        error: data?.error || error?.message || "CEISA H2H login failed",
      };
    }

    return {
      connected: true,
      timestamp,
      responseTime,
    };
  } catch (err: any) {
    return {
      connected: false,
      timestamp,
      error: err?.message || "Unknown CEISA connection error",
    };
  }
}

/* =======================
 * MOCK (DEV / TEST ONLY)
 * ======================= */

export async function checkCEISAConnectionMock(): Promise<CEISAConnectionStatus> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();

  // Simulated latency
  await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));

  const responseTime = Math.round(performance.now() - startTime);
  const isUp = Math.random() > 0.05; // 95% uptime

  if (isUp) {
    return {
      connected: true,
      timestamp,
      responseTime,
    };
  }

  return {
    connected: false,
    timestamp,
    responseTime,
    error: "Simulated CEISA downtime",
  };
}

/* =======================
 * SMART CHECKER
 * ======================= */

export async function checkCEISAConnectionSmart(): Promise<CEISAConnectionStatus> {
  const useMock = import.meta.env.VITE_CEISA_USE_MOCK === "true";

  if (useMock) {
    return checkCEISAConnectionMock();
  }

  return checkCEISAConnection();
}
