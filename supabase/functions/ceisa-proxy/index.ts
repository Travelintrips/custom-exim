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
    const { action, endpoint, params } = body;
    
    // Health check endpoint
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

    const queryParams = new URLSearchParams(params || {});
    const url = `${CEISA_API_URL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': CEISA_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `CEISA API error: ${response.status} ${response.statusText}`,
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, data: data.data || data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
