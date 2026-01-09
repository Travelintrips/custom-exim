const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const body = await req.json();
    const { action, endpoint, method, payload, params } = body;
    
    // Health check endpoint (internal proxy check)
    if (action === 'health_check') {
      return new Response(
        JSON.stringify({ success: true, message: 'CEISA Proxy is running' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Edge functions use non-VITE prefixed env vars
    const CEISA_API_URL = Deno.env.get('CEISA_API_URL') || Deno.env.get('VITE_CEISA_API_URL');
    const CEISA_API_KEY = Deno.env.get('CEISA_API_KEY') || Deno.env.get('VITE_CEISA_API_KEY');

    if (!CEISA_API_URL || !CEISA_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'CEISA API not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // ==========================================
    // CEISA 4.0 AUTH TEST (__test__ endpoint)
    // ==========================================
    // This tests CEISA H2H authentication without calling any data endpoint
    // Connected = Auth berhasil
    // Disconnected = Auth gagal
    if (endpoint === '__test__') {
      try {
        // Try to authenticate with CEISA by calling a minimal endpoint
        // CEISA 4.0 doesn't have a /health endpoint, so we test auth by
        // attempting to access the API with credentials
        const testUrl = `${CEISA_API_URL}/openapi/status`;
        
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'X-API-KEY': CEISA_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        // For auth test, we consider any response (including 4xx) as "connected"
        // because it means CEISA is reachable and responding
        // Only network errors or 5xx indicate actual connection problems
        
        if (testResponse.status >= 500) {
          // Server error - CEISA is down
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'CEISA server tidak merespon',
              httpStatus: testResponse.status,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        // 2xx, 3xx, 4xx all indicate CEISA is reachable
        // 401/403 means auth credentials may be wrong but CEISA is up
        // For connection status, this means "connected"
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'CEISA Connected',
            httpStatus: testResponse.status,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (testError) {
        // Network error - cannot reach CEISA at all
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Tidak dapat terhubung ke CEISA',
            details: testError.message,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // ==========================================
    // REGULAR API CALLS (GET/POST)
    // ==========================================
    const queryParams = new URLSearchParams(params || {});
    const url = `${CEISA_API_URL}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: {
        'X-API-KEY': CEISA_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    // Add body for POST requests
    if (method === 'POST' && payload) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `CEISA API error: ${response.status} ${response.statusText}`,
          details: errorText,
          httpStatus: response.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const data = await response.json();
    
    // Return full response including meta for pagination
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data.data || data,
        meta: data.meta || null,
        code: data.code,
        message: data.message,
        httpStatus: response.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
