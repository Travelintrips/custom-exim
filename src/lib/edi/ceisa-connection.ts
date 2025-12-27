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
 * Check CEISA connection via Edge Function proxy (avoids CORS)
 */
export async function checkCEISAConnectionViaProxy(): Promise<CEISAConnectionStatus> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        connected: false,
        httpStatus: null,
        timestamp,
        error: 'Supabase not configured',
      };
    }

    // Get auth token using singleton supabase client
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${supabaseUrl}/functions/v1/supabase-functions-ceisa-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || supabaseKey}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ action: 'health_check' }),
    });

    const responseTime = Math.round(performance.now() - startTime);
    
    if (response.ok) {
      const data = await response.json();
      return {
        connected: data.success === true,
        httpStatus: response.status,
        timestamp,
        responseTime,
        error: data.success ? undefined : data.error,
      };
    }
    
    return {
      connected: false,
      httpStatus: response.status,
      timestamp,
      responseTime,
      error: `Proxy error: ${response.status}`,
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    return {
      connected: false,
      httpStatus: null,
      timestamp,
      responseTime,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Smart connection checker that uses Edge Function proxy for real API
 * or mock for development/testing
 */
export async function checkCEISAConnectionSmart(
  config?: CEISAConnectionConfig
): Promise<CEISAConnectionStatus> {
  const hasMockFlag = import.meta.env.VITE_CEISA_USE_MOCK === 'true';
  
  // Use mock if flag is set
  if (hasMockFlag) {
    return checkCEISAConnectionMock();
  }
  
  // Use Edge Function proxy to avoid CORS
  return checkCEISAConnectionViaProxy();
}
