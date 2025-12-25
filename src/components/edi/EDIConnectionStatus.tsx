import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Clock,
  Activity,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useEDIConnectionStatus } from '@/hooks/useEDI';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EDIConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function EDIConnectionStatus({ className, showDetails = false }: EDIConnectionStatusProps) {
  const { isConnected, lastCheck, httpStatus, responseTime, error, isChecking, checkConnection } = useEDIConnectionStatus();
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-default',
              isChecking 
                ? 'bg-slate-100 text-slate-600'
                : isConnected 
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
            )}>
              {isChecking ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking...
                </>
              ) : isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Wifi className="h-3 w-3" />
                  CEISA Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Disconnected
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="space-y-1">
              <div className="font-medium">CEISA API Status</div>
              {httpStatus && <div>HTTP Status: {httpStatus}</div>}
              {responseTime && <div>Response Time: {responseTime}ms</div>}
              {error && <div className="text-red-500">{error}</div>}
              <div className="text-muted-foreground pt-1 border-t mt-1">
                Note: Connected status indicates API accessibility only, not data availability
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {showDetails && (
        <>
          {httpStatus && (
            <Badge variant="outline" className="text-xs">
              HTTP {httpStatus}
            </Badge>
          )}
          {responseTime && (
            <Badge variant="outline" className="text-xs">
              {responseTime}ms
            </Badge>
          )}
        </>
      )}
      
      {lastCheck && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(lastCheck).toLocaleTimeString()}
        </span>
      )}
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6" 
        onClick={checkConnection}
        disabled={isChecking}
      >
        <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
      </Button>
    </div>
  );
}

interface EDIConnectionStatusCardProps {
  className?: string;
}

export function EDIConnectionStatusCard({ className }: EDIConnectionStatusCardProps) {
  const { 
    isConnected, 
    lastCheck, 
    httpStatus, 
    responseTime, 
    error, 
    isChecking, 
    checkConnection 
  } = useEDIConnectionStatus(5000);
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className={cn(
        'h-1',
        isChecking ? 'bg-slate-400' : isConnected ? 'bg-emerald-500' : 'bg-red-500'
      )} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              isChecking ? 'bg-slate-100' : isConnected ? 'bg-emerald-100' : 'bg-red-100'
            )}>
              {isChecking ? (
                <Loader2 className="h-5 w-5 text-slate-600 animate-spin" />
              ) : isConnected ? (
                <Activity className="h-5 w-5 text-emerald-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm">
                CEISA API Connection
              </h3>
              <p className="text-xs text-muted-foreground">
                {isChecking 
                  ? 'Validating connection...' 
                  : isConnected 
                    ? 'API is accessible' 
                    : 'Connection failed - retrying...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                isChecking
                  ? 'bg-slate-50 text-slate-600 border-slate-200'
                  : isConnected 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
              )}
            >
              {isChecking ? 'Checking' : isConnected ? 'Online' : 'Offline'}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={checkConnection}
              disabled={isChecking}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isChecking && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        {/* Connection Details */}
        {(httpStatus || responseTime) && (
          <div className="mt-3 flex items-center gap-2">
            {httpStatus && (
              <Badge variant="secondary" className="text-xs">
                HTTP {httpStatus}
              </Badge>
            )}
            {responseTime && (
              <Badge variant="secondary" className="text-xs">
                {responseTime}ms
              </Badge>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last: {lastCheck ? new Date(lastCheck).toLocaleTimeString() : 'Never'}
          </span>
          <span className="text-[10px] italic">
            Note: Connected = API accessible, not data available
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
