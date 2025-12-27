import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { checkCEISAConnection } from '@/lib/edi/ceisa-connection';

export function CEISAConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const status = await checkCEISAConnection();
      setResult(status);
    } catch (error: any) {
      setResult({
        connected: false,
        httpStatus: null,
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>CEISA Connection Test</CardTitle>
          <CardDescription>
            Test koneksi ke CEISA API menggunakan environment variables yang sudah dikonfigurasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                {result.connected ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-700">Disconnected</span>
                  </>
                )}
                {result.httpStatus && (
                  <Badge variant={result.httpStatus < 400 ? "default" : "destructive"}>
                    HTTP {result.httpStatus}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Timestamp</div>
                  <div className="font-mono">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
                {result.responseTime && (
                  <div>
                    <div className="text-muted-foreground">Response Time</div>
                    <div className="font-mono">{result.responseTime}ms</div>
                  </div>
                )}
              </div>

              {result.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-slate-50 p-4 rounded-md">
                <div className="text-xs font-semibold text-slate-600 mb-2">Environment Configuration</div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600">VITE_CEISA_API_URL:</span>
                    <span className="text-slate-900">
                      {import.meta.env.VITE_CEISA_API_URL || '(not set)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">VITE_CEISA_API_KEY:</span>
                    <span className="text-slate-900">
                      {import.meta.env.VITE_CEISA_API_KEY ? '••••••••' : '(not set)'}
                    </span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Note:</strong> Connected status hanya berarti API dapat diakses, 
                  bukan bahwa data tersedia. Sistem akan otomatis menggunakan mock data 
                  jika CEISA API tidak merespons dengan data yang valid.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
