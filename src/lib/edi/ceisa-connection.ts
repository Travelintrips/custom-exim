/**
 * CEISA Connection Validation Service
 * Validates connectivity to CEISA Export-Import API
 */

export interface CEISAConnectionStatus {
  connected: boolean;
  httpStatus: number | null;
  timestamp: string;
  error?: string;
  responseTime?: number;
}

export interface CEISAConnectionConfig {
  baseUrl?: string;
  timeout?: number;
}

// Default configuration
const DEFAULT_CONFIG: CEISAConnectionConfig = {
  baseUrl: import.meta.env.VITE_CEISA_API_URL || 'https://api-ceisa.beacukai.go.id',
  timeout: 10000,
};

/**
 * Check CEISA Export-Import API connection
 * Uses X-API-KEY header for authentication
 * Returns connection status - connected: true only means API is accessible,
 * NOT that data is available
 */
export async function checkCEISAConnection(
  config: CEISAConnectionConfig = {}
): Promise<CEISAConnectionStatus> {
  const { baseUrl, timeout } = { ...DEFAULT_CONFIG, ...config };
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  
  // Get API key from environment
  const apiKey = import.meta.env.VITE_CEISA_API_KEY;
  
  if (!apiKey) {
    return {
      connected: false,
      httpStatus: null,
      timestamp,
      error: 'CEISA API Key not configured',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Call CEISA validation endpoint
    const response = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Math.round(performance.now() - startTime);

    // Connected status only means API is accessible (2xx or 4xx response)
    // Server errors (5xx) indicate API is down
    const connected = response.status < 500;

    return {
      connected,
      httpStatus: response.status,
      timestamp,
      responseTime,
      error: connected ? undefined : `Server error: ${response.status}`,
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          connected: false,
          httpStatus: null,
          timestamp,
          responseTime,
          error: 'Connection timeout',
        };
      }
      
      return {
        connected: false,
        httpStatus: null,
        timestamp,
        responseTime,
        error: error.message,
      };
    }
    
    return {
      connected: false,
      httpStatus: null,
      timestamp,
      error: 'Unknown connection error',
    };
  }
}

/**
 * Mock CEISA connection check for development/testing
 * Simulates realistic connection behavior
 */
export async function checkCEISAConnectionMock(): Promise<CEISAConnectionStatus> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  
  // Simulate network latency (50-200ms)
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
  
  const responseTime = Math.round(performance.now() - startTime);
  
  // 95% uptime simulation
  const isUp = Math.random() > 0.05;
  
  if (isUp) {
    return {
      connected: true,
      httpStatus: 200,
      timestamp,
      responseTime,
    };
  } else {
    // Simulate different error scenarios
    const errorScenarios = [
      { httpStatus: 503, error: 'Service temporarily unavailable' },
      { httpStatus: 502, error: 'Bad gateway' },
      { httpStatus: null, error: 'Connection timeout' },
      { httpStatus: null, error: 'Network error' },
    ];
    const scenario = errorScenarios[Math.floor(Math.random() * errorScenarios.length)];
    
    return {
      connected: false,
      httpStatus: scenario.httpStatus,
      timestamp,
      responseTime,
      error: scenario.error,
    };
  }
}

/**
 * Smart connection checker that uses mock in development
 * and real API in production
 * 
 * NOTE: Due to CORS restrictions, direct browser-to-CEISA API calls are blocked.
 * In production, this should go through a backend proxy (Edge Function).
 * For now, we use mock in development/browser environment.
 */
export async function checkCEISAConnectionSmart(
  config?: CEISAConnectionConfig
): Promise<CEISAConnectionStatus> {
  const isDev = import.meta.env.DEV;
  const hasMockFlag = import.meta.env.VITE_CEISA_USE_MOCK === 'true';
  const hasApiKey = !!import.meta.env.VITE_CEISA_API_KEY;
  
  // Always use mock in browser due to CORS restrictions
  // Real API calls should go through Edge Function proxy
  const isBrowser = typeof window !== 'undefined';
  
  // Use mock if:
  // - Running in browser (CORS issues with direct API calls)
  // - In dev mode without API key
  // - Mock flag is set
  if (isBrowser || (isDev && !hasApiKey) || hasMockFlag) {
    return checkCEISAConnectionMock();
  }
  
  return checkCEISAConnection(config);
}
