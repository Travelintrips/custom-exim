/**
 * CEISA Connection Validation Service
 * ----------------------------------
 * CEISA 4.0 Architecture Compliant
 * 
 * IMPORTANT:
 * - CEISA 4.0 DOES NOT have a /health endpoint
 * - Connection test is based on auth (__test__) via Edge Function
 * - Connected = Auth CEISA berhasil
 * - Disconnected = Auth gagal / Edge Function error
 * - Status DOES NOT depend on data availability
 * 
 * All CEISA communication MUST go through testCeisaConnection() 
 * from ceisa-sync-service.ts
 */

import { testCeisaConnection } from "@/lib/edi/ceisa-sync-service";

/* =======================
 * TYPES
 * ======================= */

export interface CEISAConnectionStatus {
  connected: boolean;
  timestamp: string;
  httpStatus: number | null;
  responseTime?: number;
  error?: string;
}

/* =======================
 * REAL CEISA CHECK (via Edge Function __test__)
 * ======================= */

/**
 * Check CEISA connection via Edge Function
 * Uses testCeisaConnection() from ceisa-sync-service.ts
 * 
 * Connected = Auth CEISA successful via __test__ endpoint
 * Disconnected = Auth failed OR Edge Function error
 */
export async function checkCEISAConnection(): Promise<CEISAConnectionStatus> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();

  try {
    const result = await testCeisaConnection();
    const responseTime = Math.round(performance.now() - startTime);

    if (result.success) {
      return {
        connected: true,
        timestamp,
        httpStatus: 200,
        responseTime,
      };
    }

    // Auth failed - CEISA returned error but Edge Function is working
    return {
      connected: false,
      timestamp,
      httpStatus: 503, // Service Unavailable - auth failed
      responseTime,
      error: result.message || "CEISA auth gagal",
    };
  } catch (err: any) {
    const responseTime = Math.round(performance.now() - startTime);
    
    // Extract user-friendly error message
    // Don't show raw "Edge Function returned a non-2xx status code" message
    let errorMessage = "Gagal terhubung ke CEISA";
    
    if (err?.message) {
      // Filter out technical error messages
      if (err.message.includes("non-2xx status code")) {
        errorMessage = "CEISA tidak dapat dijangkau";
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "Koneksi jaringan terputus";
      } else if (err.message.includes("timeout")) {
        errorMessage = "Koneksi timeout";
      } else {
        errorMessage = err.message;
      }
    }

    return {
      connected: false,
      timestamp,
      httpStatus: 500, // Internal error / exception
      responseTime,
      error: errorMessage,
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
      httpStatus: 200,
      responseTime,
    };
  }

  return {
    connected: false,
    timestamp,
    httpStatus: 503,
    responseTime,
    error: "Simulated CEISA downtime",
  };
}

/* =======================
 * SMART CHECKER
 * ======================= */

/**
 * Smart connection checker
 * Uses mock in development if VITE_CEISA_USE_MOCK=true
 * Otherwise uses real CEISA auth test via Edge Function
 */
export async function checkCEISAConnectionSmart(): Promise<CEISAConnectionStatus> {
  const useMock = import.meta.env.VITE_CEISA_USE_MOCK === "true";

  if (useMock) {
    console.log("[CEISA Connection] Using mock data (VITE_CEISA_USE_MOCK=true)");
    return checkCEISAConnectionMock();
  }

  console.log("[CEISA Connection] Testing real connection via Edge Function");
  return checkCEISAConnection();
}
